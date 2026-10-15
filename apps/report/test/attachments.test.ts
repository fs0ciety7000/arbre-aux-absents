import { mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ATTACHMENT_LIMITS,
  AttachmentReceiptSchema,
  OpenTicketsSchema,
  ReportErrorBodySchema,
  ReportReceiptSchema,
  TicketViewSchema,
} from '@arbre/contract';
import type { AttachmentReceipt, ReportReceipt } from '@arbre/contract';
import { runAdmin } from '../src/admin';
import {
  FsBlobStore,
  MemoryBlobStore,
  UrlSigner,
  newAttachmentId,
  purgeAttachments,
  signingKey,
} from '../src/attachments';
import { TicketStore, initDatabase } from '../src/db';
import { runRetention } from '../src/retention';
import type { TestApp } from './helpers';
import { API, ORIGIN, post, startApp, submission } from './helpers';
import { SECRET_META, jpeg, png, webp } from './images';

let t: TestApp | undefined;
const dirs: string[] = [];
afterEach(async () => {
  await t?.close();
  t = undefined;
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), '.att-test-'));
  dirs.push(d);
  return d;
}

function upload(
  app: TestApp,
  body: Buffer | ReadableStream<Uint8Array>,
  type = 'image/png',
  headers: Record<string, string> = {},
  query = '',
): Promise<Response> {
  return fetch(`${app.base}/v1/attachments${query}`, {
    method: 'POST',
    headers: { 'Content-Type': type, Origin: ORIGIN, ...headers },
    body,
    ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
  } as RequestInit);
}

async function uploadOk(app: TestApp, body = png({ meta: true }), type = 'image/png') {
  const res = await upload(app, body, type);
  expect(res.status).toBe(201);
  return AttachmentReceiptSchema.parse(await res.json()) as AttachmentReceipt;
}

async function report(app: TestApp, attachments?: string[]) {
  const res = await post(app.base, submission(attachments ? { attachments } : {}));
  expect(res.status).toBe(201);
  return ReportReceiptSchema.parse(await res.json()) as ReportReceipt;
}

function view(app: TestApp, token: string) {
  return fetch(`${app.base}/v1/tickets/current`, {
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
}

/** URL signée relative au serveur de test (la base publique est celle de la production). */
const local = (app: TestApp, url: string) => url.replace(API, app.base);

async function errorOf(res: Response) {
  return ReportErrorBodySchema.parse(await res.json()).error;
}

describe('POST /v1/attachments', () => {
  it('201 : reçu conforme au contrat, métadonnées retirées du fichier stocké', async () => {
    t = await startApp();
    const r = await uploadOk(t);
    expect(r).toMatchObject({ type: 'image/png', width: 4, height: 3 });
    expect(r.expiresAt).toBe(t.clock.t + ATTACHMENT_LIMITS.unattachedTtlMs);
    const stored = t.app.blobs.get(r.id, 'image/png')!;
    expect(stored.length).toBe(r.bytes);
    expect(stored.includes(Buffer.from(SECRET_META))).toBe(false);
    for (const [body, type] of [
      [jpeg({ meta: true }), 'image/jpeg'],
      [webp({ meta: true }), 'image/webp'],
    ] as const) {
      const rr = await uploadOk(t, body, type);
      expect(t.app.blobs.get(rr.id, type)!.includes(Buffer.from(SECRET_META))).toBe(false);
    }
  });

  it.each([
    ['image/gif', Buffer.from('GIF89a\x01\x00\x01\x00')],
    ['image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ['text/html', Buffer.from('<script>alert(1)</script>')],
    ['application/octet-stream', png()],
  ])('415 : type %s refusé', async (type, body) => {
    t ??= await startApp();
    const res = await upload(t, body, type);
    expect(res.status).toBe(415);
    expect(await errorOf(res)).toBe('invalid');
  });

  it('415 : octets magiques différents du type annoncé ; 400 : vide ou corrompu', async () => {
    t = await startApp();
    expect((await upload(t, png(), 'image/jpeg')).status).toBe(415);
    expect((await upload(t, Buffer.from('<html>pas une image'), 'image/png')).status).toBe(415);
    expect((await upload(t, Buffer.alloc(0), 'image/png')).status).toBe(400);
    const cut = png().subarray(0, 40);
    const res = await upload(t, cut, 'image/png');
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe('invalid');
    expect(t.app.store.attachmentStats()).toEqual({ attached: 0, unattached: 0, bytes: 0 });
  });

  it('413 : corps de plus de 2 Mio (annoncé ou en flux) et dimensions excessives', async () => {
    t = await startApp();
    const big = Buffer.concat([png(), Buffer.alloc(ATTACHMENT_LIMITS.bytes)]);
    const res = await upload(t, big);
    expect(res.status).toBe(413);
    expect(await errorOf(res)).toBe('tooLarge');
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(big);
        c.close();
      },
    });
    const res2 = await upload(t, stream).catch(() => undefined);
    // Le serveur coupe la connexion après la réponse 413 : selon le moment, fetch voit la
    // réponse ou une erreur réseau ; dans les deux cas rien n'est stocké.
    if (res2) expect(res2.status).toBe(413);
    const huge = await upload(t, png({ width: 9000, height: 10 }));
    expect(huge.status).toBe(413);
    expect(await errorOf(huge)).toBe('tooLarge');
    expect(t.app.store.attachmentStats().unattached).toBe(0);
  });

  it('une image juste sous la limite passe (la limite des signalements reste 64 Ko)', async () => {
    t = await startApp();
    // Gros chunk inconnu (gardé) : le corps fait presque 2 Mio.
    const base = png();
    const filler = Buffer.alloc(ATTACHMENT_LIMITS.bytes - base.length - 12, 0x41);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(filler.length);
    const big = Buffer.concat([
      base.subarray(0, base.length - 12),
      len,
      Buffer.from('zzZz'),
      filler,
      Buffer.alloc(4),
      base.subarray(base.length - 12),
    ]);
    expect(big.length).toBe(ATTACHMENT_LIMITS.bytes);
    expect((await uploadOk(t, big)).bytes).toBe(big.length);
    const tooBigReport = await post(t.base, { ...submission(), pad: 'x'.repeat(70_000) });
    expect(tooBigReport.status).toBe(413);
  });

  it('CORS : origine hors liste 403 ; requête préalable autorisée', async () => {
    t = await startApp();
    const res = await upload(t, png(), 'image/png', { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    const pre = await fetch(`${t.base}/v1/attachments`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(pre.headers.get('access-control-allow-headers')).toContain('Content-Type');
  });

  it('pot de miel : faux reçu, rien de stocké', async () => {
    t = await startApp();
    const res = await upload(t, png(), 'image/png', {}, '?website=http%3A%2F%2Fspam.example');
    expect(res.status).toBe(201);
    const r = AttachmentReceiptSchema.parse(await res.json());
    expect(t.app.store.attachment(r.id)).toBeUndefined();
    expect(t.app.store.attachmentStats().unattached).toBe(0);
    const r2 = await upload(t, png(), 'image/png', {}, `?website=${'x'.repeat(201)}`);
    expect(r2.status).toBe(400);
  });

  it('429 : 15 pièces par heure et par client', async () => {
    t = await startApp();
    for (let i = 0; i < 15; i++) expect((await upload(t, png())).status).toBe(201);
    const res = await upload(t, png());
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    t.clock.advance(HOUR);
    expect((await upload(t, png())).status).toBe(201);
  });

  it('503 : service désactivé ou stockage plein', async () => {
    t = await startApp({ reportsEnabled: false });
    expect(await errorOf(await upload(t, png()))).toBe('disabled');
    await t.close();
    t = await startApp({ attachmentsMaxBytes: png().length + 10 });
    await uploadOk(t, png());
    const full = await upload(t, png());
    expect(full.status).toBe(503);
    expect(await errorOf(full)).toBe('unavailable');
  });
});

describe('signalement avec pièces jointes', () => {
  it('rattachées dans l’ordre, ticket GitHub avec images signées, suivi joueur avec URL', async () => {
    t = await startApp();
    const a = await uploadOk(t, png());
    const b = await uploadOk(t, jpeg(), 'image/jpeg');
    const unknown = newAttachmentId();
    const r = await report(t, [b.id, unknown, a.id]);
    expect(r.attachments).toBe(2);
    await t.app.service.drain();
    const created = t.gh.calls.find((c) => c.method === 'POST')!.body as { body: string };
    const urlB = t.app.signer.url(b.id);
    const urlA = t.app.signer.url(a.id);
    expect(urlA).toMatch(
      new RegExp(`^${API}/v1/attachments/${a.id}\\?sig=[A-Za-z0-9_-]{43}$`.replace(/\./g, '\\.')),
    );
    expect(created.body).toContain(`![Capture 1 · JPEG 640 × 480`);
    expect(created.body.indexOf(urlB)).toBeLessThan(created.body.indexOf(urlA));
    expect(created.body).not.toContain(unknown);

    const v = TicketViewSchema.parse(await (await view(t, r.token)).json());
    expect(v.attachments).toEqual([
      { id: b.id, url: urlB, type: 'image/jpeg', width: 640, height: 480 },
      { id: a.id, url: urlA, type: 'image/png', width: 4, height: 3 },
    ]);
    const img = await fetch(local(t, urlA));
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/png');
    expect(img.headers.get('cache-control')).toBe('private, max-age=300');
    expect(img.headers.get('content-disposition')).toBe(`inline; filename="capture-${a.id}.png"`);
    expect(img.headers.get('x-content-type-options')).toBe('nosniff');
    expect(img.headers.get('content-security-policy')).toMatch(/^default-src 'none'/);
    expect(Buffer.from(await img.arrayBuffer()).equals(t.app.blobs.get(a.id, 'image/png')!)).toBe(
      true,
    );
    const head = await fetch(local(t, urlA), { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(head.headers.get('content-length')).toBe(String(a.bytes));
  });

  it('sans pièces : pas de champ attachments dans le reçu ni dans la vue', async () => {
    t = await startApp();
    const r = await report(t);
    expect(r).not.toHaveProperty('attachments');
    const v = (await (await view(t, r.token)).json()) as object;
    expect(v).not.toHaveProperty('attachments');
    expect((await report(t, [])).attachments).toBe(0);
  });

  it('jamais dans la liste publique ni dans les problèmes connus', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    await report(t, [a.id]);
    for (const path of ['/v1/tickets', '/v1/known-issues']) {
      const res = await fetch(`${t.base}${path}?locale=fr`, { headers: { Origin: ORIGIN } });
      const text = await res.text();
      expect(text).not.toContain(a.id);
      expect(text).not.toContain('attachments');
      if (path === '/v1/tickets') expect(OpenTicketsSchema.parse(JSON.parse(text))).toHaveLength(1);
    }
  });

  it('une pièce ne se rattache qu’une fois ; expirée après 1 h : ignorée puis purgée', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    expect((await report(t, [a.id])).attachments).toBe(1);
    expect((await report(t, [a.id])).attachments).toBe(0);
    const late = await uploadOk(t);
    const url = local(t, t.app.signer.url(late.id));
    expect((await fetch(url)).status).toBe(200);
    t.clock.advance(HOUR);
    expect((await fetch(url)).status).toBe(404);
    expect((await report(t, [late.id])).attachments).toBe(0);
    expect(t.app.service.purgeAttachments()).toEqual({ rows: 1, files: 0 });
    expect(t.app.store.attachment(late.id)).toBeUndefined();
    expect(t.app.blobs.get(late.id, 'image/png')).toBeUndefined();
    // La pièce rattachée, elle, reste.
    expect(t.app.blobs.get(a.id, 'image/png')).toBeDefined();
  });
});

describe('GET et DELETE /v1/attachments/<id>', () => {
  it('signature invalide 403, inconnue ou mal formée 404', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    const good = new URL(local(t, t.app.signer.url(a.id)));
    const sig = good.searchParams.get('sig')!;
    const forged = `${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`;
    expect((await fetch(`${t.base}/v1/attachments/${a.id}?sig=${forged}`)).status).toBe(403);
    expect((await fetch(`${t.base}/v1/attachments/${a.id}`)).status).toBe(403);
    expect((await fetch(`${t.base}/v1/attachments/${a.id}?sig=court`)).status).toBe(403);
    // Signature d'une autre pièce.
    const other = newAttachmentId();
    expect(
      (await fetch(`${t.base}/v1/attachments/${a.id}?sig=${t.app.signer.sign(other)}`)).status,
    ).toBe(403);
    // Bonne signature, pièce inconnue.
    expect((await fetch(local(t, t.app.signer.url(other)))).status).toBe(404);
    expect((await fetch(`${t.base}/v1/attachments/..%2Fetc?sig=${sig}`)).status).toBe(404);
    expect((await fetch(`${t.base}/v1/attachments/a/b`)).status).toBe(404);
    // Une autre clé (autre secret) ne signe pas pour celle du service.
    const foreign = new UrlSigner(signingKey('x'.repeat(40), undefined).key, API);
    expect((await fetch(local(t, foreign.url(a.id)))).status).toBe(403);
    // Méthode non prévue.
    expect((await fetch(good, { method: 'POST' })).status).toBe(405);
  });

  it('DELETE : pièce libre supprimée (204 puis 404), pièce rattachée intouchable', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    const del = () =>
      fetch(`${t!.base}/v1/attachments/${a.id}`, { method: 'DELETE', headers: { Origin: ORIGIN } });
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);
    expect(t.app.blobs.get(a.id, 'image/png')).toBeUndefined();
    const b = await uploadOk(t);
    await report(t, [b.id]);
    const res = await fetch(`${t.base}/v1/attachments/${b.id}`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN },
    });
    expect(res.status).toBe(404);
    expect((await fetch(local(t, t.app.signer.url(b.id)))).status).toBe(200);
  });

  it('suppression du ticket par le joueur : pièces effacées, URL en 404', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    const r = await report(t, [a.id]);
    await t.app.service.drain();
    const url = local(t, t.app.signer.url(a.id));
    const del = await fetch(`${t.base}/v1/tickets/current`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${r.token}`, Origin: ORIGIN },
    });
    expect(del.status).toBe(204);
    expect((await fetch(url)).status).toBe(404);
    expect(t.app.store.attachment(a.id)).toBeUndefined();
    expect(t.app.blobs.get(a.id, 'image/png')).toBeUndefined();
    await t.app.service.drain();
    const patch = t.gh.calls.find((c) => c.method === 'PATCH')!.body as { body: string };
    expect(patch.body).not.toContain(a.id);
  });

  it('conservation : pièces supprimées avec le ticket, 12 mois après la clôture', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    const r = await report(t, [a.id]);
    await t.app.service.drain();
    const row = t.app.service.findByToken(r.token)!;
    t.app.store.applyIssue(row.id, {
      status: 'closed',
      fixedIn: null,
      closedReason: 'resolved',
      closedAt: t.clock.t,
      public: false,
      title: null,
      syncedAt: t.clock.t,
      updatedAt: t.clock.t,
    });
    t.clock.advance(364 * DAY);
    runRetention(t.app.store, t.clock.t);
    t.app.service.purgeAttachments();
    expect(t.app.blobs.get(a.id, 'image/png')).toBeDefined();
    t.clock.advance(DAY);
    expect(runRetention(t.app.store, t.clock.t).ticketsDeleted).toBe(1);
    // Cascade SQLite : la ligne disparaît avec le ticket ; le fichier, à la purge suivante.
    expect(t.app.store.attachment(a.id)).toBeUndefined();
    expect(t.app.service.purgeAttachments().files).toBe(1);
    expect(t.app.blobs.get(a.id, 'image/png')).toBeUndefined();
  });
});

describe('stockage et signature', () => {
  it('FsBlobStore : écriture atomique 0600, lecture, suppression, purge des orphelins anciens', () => {
    const dir = tempDir();
    const blobs = new FsBlobStore(join(dir, 'attachments'));
    const id = newAttachmentId();
    blobs.put(id, 'image/png', png());
    expect(blobs.get(id, 'image/png')!.equals(png())).toBe(true);
    expect(blobs.get(id, 'image/jpeg')).toBeUndefined();
    expect(() => blobs.put('../x', 'image/png', png())).toThrow();
    const orphan = newAttachmentId();
    blobs.put(orphan, 'image/webp', webp());
    writeFileSync(join(blobs.dir, `.tmp-${newAttachmentId()}`), 'x');
    writeFileSync(join(blobs.dir, 'README'), 'gardé');
    const known = (x: string) => x === id;
    // Trop récents : rien n'est supprimé (un envoi peut être en cours).
    expect(blobs.sweep(known, Date.now() - HOUR)).toBe(0);
    const old = new Date(Date.now() - 2 * HOUR);
    for (const name of readdirSync(blobs.dir)) utimesSync(join(blobs.dir, name), old, old);
    expect(blobs.sweep(known, Date.now() - HOUR)).toBe(2);
    expect(readdirSync(blobs.dir).sort()).toEqual([`${id}.png`, 'README'].sort());
    blobs.delete(id, 'image/png');
    blobs.delete(id, 'image/png');
    expect(blobs.get(id, 'image/png')).toBeUndefined();
  });

  it('purge hors serveur (admin, conservation) sur une base et un disque réels', () => {
    const db = initDatabase(new DatabaseSync(':memory:'));
    const dir = tempDir();
    const blobs = new FsBlobStore(dir);
    const store = new TicketStore(db, 'AA');
    const t0 = Date.now();
    const id = newAttachmentId();
    blobs.put(id, 'image/png', png());
    // Ligne absente : seul le fichier, ancien, est orphelin.
    utimesSync(join(dir, `${id}.png`), new Date(t0 - 2 * HOUR), new Date(t0 - 2 * HOUR));
    expect(purgeAttachments(store, blobs, t0)).toEqual({ rows: 0, files: 1 });
  });

  it('clé des URL : ATTACHMENT_SECRET, sinon dérivée du secret du webhook, sinon éphémère', () => {
    const own = signingKey('a'.repeat(40), 'w'.repeat(32));
    const derived = signingKey(undefined, 'w'.repeat(32));
    const eph = signingKey(undefined, undefined);
    expect(own.source).toBe('attachment-secret');
    expect(derived.source).toBe('derived-webhook');
    expect(eph.source).toBe('ephemeral');
    // Déterministe, distincte du secret du webhook lui-même et des autres sources.
    expect(signingKey(undefined, 'w'.repeat(32)).key.equals(derived.key)).toBe(true);
    expect(derived.key.equals(Buffer.from('w'.repeat(32)))).toBe(false);
    expect(own.key.equals(derived.key)).toBe(false);
    const s = new UrlSigner(derived.key, API);
    const id = newAttachmentId();
    expect(s.verify(id, s.sign(id))).toBe(true);
    expect(s.verify(id, null)).toBe(false);
    expect(s.verify(newAttachmentId(), s.sign(id))).toBe(false);
    expect(s.url(id)).toBe(`${API}/v1/attachments/${id}?sig=${s.sign(id)}`);
  });

  it('MemoryBlobStore : purge selon l’horloge', () => {
    let now = 1000;
    const m = new MemoryBlobStore(() => now);
    m.put('a'.repeat(22), 'image/png', png());
    now += 2 * HOUR;
    expect(m.sweep(() => false, now - HOUR)).toBe(1);
  });
});

describe('admin.js et pièces jointes', () => {
  it('attachments, attachments <TICKET>, attachment-delete, purge, status', async () => {
    t = await startApp();
    const a = await uploadOk(t);
    const r = await report(t, [a.id]);
    const free = await uploadOk(t, webp(), 'image/webp');
    const out: string[] = [];
    const err: string[] = [];
    const io = { out: (l: string) => out.push(l), err: (l: string) => err.push(l) };
    const deps = {
      db: t.db,
      prefix: 'AA',
      now: t.clock.now,
      blobs: t.app.blobs,
      signer: t.app.signer,
    };
    expect(runAdmin(['attachments'], deps, io)).toBe(0);
    expect(out.pop()).toMatch(/^Pièces rattachées : 1, libres : 1, volume : /);
    expect(runAdmin(['attachments', r.ticket], deps, io)).toBe(0);
    expect(out.pop()).toBe(`${a.id} image/png 4×3 ${a.bytes} o ${t.app.signer.url(a.id)}`);
    expect(runAdmin(['status', r.ticket], deps, io)).toBe(0);
    expect(JSON.parse(out.pop()!)).toMatchObject({ attachments: 1 });
    expect(runAdmin(['attachment-delete', 'nope'], deps, io)).toBe(1);
    expect(runAdmin(['attachment-delete', newAttachmentId()], deps, io)).toBe(1);
    expect(runAdmin(['attachment-delete', a.id], deps, io)).toBe(0);
    expect(t.app.blobs.get(a.id, 'image/png')).toBeUndefined();
    t.clock.advance(HOUR);
    expect(runAdmin(['purge'], deps, io)).toBe(0);
    expect(out.pop()).toBe('Pièces supprimées : 1, fichiers orphelins : 0');
    expect(t.app.store.attachment(free.id)).toBeUndefined();
    expect(runAdmin(['purge'], { db: t.db, prefix: 'AA' }, io)).toBe(1);
  });
});
