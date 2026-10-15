import { afterEach, describe, expect, it } from 'vitest';
import {
  KnownIssuesSchema,
  ReportErrorBodySchema,
  ReportReceiptSchema,
  TicketViewSchema,
} from '@arbre/contract';
import type { ReportReceipt } from '@arbre/contract';
import { hashToken } from '../src/service';
import { sign } from '../src/webhook';
import type { TestApp } from './helpers';
import { ORIGIN, REPO, WEBHOOK_SECRET, post, startApp, submission } from './helpers';

let t: TestApp | undefined;
afterEach(async () => {
  await t?.close();
  t = undefined;
});

const MIN = 60_000;

async function submit(app: TestApp, over = {}, headers: Record<string, string> = {}) {
  const res = await post(app.base, submission(over), headers);
  expect(res.status).toBe(201);
  return ReportReceiptSchema.parse(await res.json()) as ReportReceipt;
}

function getTicket(app: TestApp, token: string, method = 'GET') {
  return fetch(`${app.base}/v1/tickets/current`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
}

function hook(app: TestApp, event: string, payload: unknown, secret = WEBHOOK_SECRET) {
  const body = JSON.stringify(payload);
  return fetch(`${app.base}/v1/github/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': event,
      'X-Hub-Signature-256': sign(secret, body),
    },
    body,
  });
}

const repository = { full_name: REPO };

describe('POST /v1/reports : validation et limites', () => {
  it('201 : reçu conforme au contrat, ticket créé sur GitHub', async () => {
    t = await startApp();
    const r = await submit(t);
    expect(r.ticket).toBe('AA-0001');
    expect(r.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(r.followUrl).toBe(`https://arbre.cardormedia.com/suivi/#${r.token}`);
    await t.app.service.drain();
    const created = t.gh.calls.find((c) => c.method === 'POST');
    expect(created?.path).toBe('/issues');
    expect(created?.headers.authorization).toMatch(/^Bearer /);
    const sent = JSON.stringify(created?.body);
    expect(sent).not.toContain('joueuse@example.org');
    expect(sent).not.toContain(r.token);
    expect(t.app.store.byTicket('AA-0001')).toMatchObject({
      issueNumber: 100,
      pendingOp: null,
      pendingPayload: null,
    });
    expect((await submit(t)).ticket).toBe('AA-0002');
  });

  it.each([
    ['JSON illisible', '{nope'],
    ['champ inconnu', { ...submission(), extra: 1 }],
    ['description trop courte', submission({ description: 'court' })],
    ['description trop longue', submission({ description: 'x'.repeat(4001) })],
    ['catégorie inconnue', { ...submission(), category: 'spam' }],
    ['contact trop long', submission({ contact: 'x'.repeat(201) })],
    ['locale inconnue', { ...submission(), locale: 'de' }],
  ])('400 : %s', async (_n, body) => {
    t ??= await startApp();
    const res = await post(t.base, body);
    expect(res.status).toBe(400);
    expect(ReportErrorBodySchema.parse(await res.json())).toEqual({ error: 'invalid' });
  });

  it('400 : Content-Type autre que JSON', async () => {
    t = await startApp();
    const res = await post(t.base, JSON.stringify(submission()), { 'Content-Type': 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('413 : corps de plus de 64 Ko (annoncé ou en flux)', async () => {
    t = await startApp();
    const big = JSON.stringify({ ...submission(), pad: 'x'.repeat(70_000) });
    const res = await post(t.base, big);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'tooLarge' });
    // Corps en flux sans Content-Length.
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(big));
        c.close();
      },
    });
    const res2 = await fetch(`${t.base}/v1/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(res2.status).toBe(413);
  });

  it('pot de miel et envoi trop rapide : réponse neutre, rien n’est créé', async () => {
    t = await startApp();
    for (const over of [{ website: 'http://spam.example' }, { elapsedMs: 800 }]) {
      const res = await post(t.base, submission(over));
      expect(res.status).toBe(201);
      const r = ReportReceiptSchema.parse(await res.json());
      expect(r.ticket).toBe('AA-0000');
      expect((await getTicket(t, r.token)).status).toBe(404);
    }
    await t.app.service.drain();
    expect(t.gh.calls).toHaveLength(0);
    expect(t.db.prepare('SELECT COUNT(*) AS n FROM tickets').get()).toEqual({ n: 0 });
  });

  it('REPORTS_ENABLED=false : 503 disabled', async () => {
    t = await startApp({ reportsEnabled: false });
    const res = await post(t.base, submission());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'disabled' });
  });

  it('429 avec Retry-After après 5 signalements par heure (clé = HMAC de CF-Connecting-IP)', async () => {
    t = await startApp();
    const ip = { 'CF-Connecting-IP': '203.0.113.9' };
    for (let i = 0; i < 5; i++) await submit(t, {}, ip);
    const res = await post(t.base, submission(), ip);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('3600');
    expect(res.headers.get('access-control-expose-headers')).toContain('Retry-After');
    expect(await res.json()).toEqual({ error: 'rateLimited' });
    // Un autre client passe.
    await submit(t, {}, { 'CF-Connecting-IP': '203.0.113.10' });
    // Ni la mémoire du limiteur ni la base ne contiennent l'IP.
    expect(t.app.limiter.keys().join()).not.toContain('203.0.113');
    const dump = JSON.stringify(t.db.prepare('SELECT * FROM tickets').all());
    expect(dump).not.toContain('203.0.113');
    expect(dump).not.toContain('127.0.0.1');
  });
});

describe('CORS', () => {
  it('origine autorisée : en-tête renvoyé', async () => {
    t = await startApp();
    const res = await post(t.base, submission(), { Origin: 'tauri://localhost' });
    expect(res.status).toBe(201);
    expect(res.headers.get('access-control-allow-origin')).toBe('tauri://localhost');
    expect(res.headers.get('vary')).toContain('Origin');
  });

  it('origine refusée : 403 sans traitement', async () => {
    t = await startApp();
    const res = await post(t.base, submission(), { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
    expect(t.db.prepare('SELECT COUNT(*) AS n FROM tickets').get()).toEqual({ n: 0 });
  });

  it('requête préalable autorisée et refusée', async () => {
    t = await startApp();
    const ok = await fetch(`${t.base}/v1/tickets/current`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://html-classic.itch.zone',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'authorization',
      },
    });
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://html-classic.itch.zone');
    expect(ok.headers.get('access-control-allow-methods')).toContain('DELETE');
    expect(ok.headers.get('access-control-allow-headers')).toContain('Authorization');
    const ko = await fetch(`${t.base}/v1/reports`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://arbre.cardormedia.com.evil.example' },
    });
    expect(ko.status).toBe(403);
    expect(ko.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('suivi du ticket', () => {
  it('jeton jamais stocké en clair ; GET avec Bearer ; 404 inconnu ; 400 malformé', async () => {
    t = await startApp();
    const r = await submit(t);
    const dump = JSON.stringify(t.db.prepare('SELECT * FROM tickets').all());
    expect(dump).not.toContain(r.token);
    expect(dump).toContain(hashToken(r.token));
    const res = await getTicket(t, r.token);
    expect(res.status).toBe(200);
    expect(TicketViewSchema.parse(await res.json())).toMatchObject({
      ticket: 'AA-0001',
      status: 'received',
      category: 'bug',
      replies: [],
    });
    expect((await getTicket(t, 'A'.repeat(22))).status).toBe(404);
    expect((await getTicket(t, 'pas-un-jeton')).status).toBe(400);
    const noAuth = await fetch(`${t.base}/v1/tickets/current`);
    expect(noAuth.status).toBe(400);
  });

  it('GitHub en panne : soumission acceptée, file pending, réessai avec attente croissante', async () => {
    t = await startApp();
    t.gh.failure = 503;
    const r = await submit(t);
    await t.app.service.drain();
    let health = await (await fetch(`${t.base}/healthz`)).json();
    expect(health).toEqual({ ok: true, github: 'degraded', pending: 1 });
    const row = t.app.store.byTicket(r.ticket)!;
    expect(row).toMatchObject({
      attempts: 1,
      issueNumber: null,
      nextAttemptAt: t.clock.t + 30_000,
    });
    expect(row.pendingPayload).toContain('### Description');
    // Pas encore échu : aucun appel.
    const before = t.gh.calls.length;
    await t.app.service.drain();
    expect(t.gh.calls.length).toBe(before);
    // Deuxième échec (réseau) : attente doublée.
    t.gh.failure = 'down';
    t.clock.advance(30_000);
    await t.app.service.drain();
    expect(t.app.store.byTicket(r.ticket)).toMatchObject({
      attempts: 2,
      nextAttemptAt: t.clock.t + 60_000,
    });
    // GitHub revient.
    t.gh.failure = null;
    t.clock.advance(60_000);
    await t.app.service.drain();
    expect(t.app.store.byTicket(r.ticket)).toMatchObject({
      issueNumber: 100,
      pendingOp: null,
      pendingPayload: null,
      attempts: 0,
    });
    health = await (await fetch(`${t.base}/healthz`)).json();
    expect(health).toEqual({ ok: true, github: 'ok', pending: 0 });
  });

  it('401 GitHub : /healthz degraded', async () => {
    t = await startApp();
    t.gh.failure = 401;
    await submit(t);
    await t.app.service.drain();
    expect(await (await fetch(`${t.base}/healthz`)).json()).toMatchObject({ github: 'degraded' });
  });

  it('sans GITHUB_TOKEN : tout reste en file, healthz degraded', async () => {
    t = await startApp({ githubToken: undefined });
    await submit(t);
    await t.app.service.drain();
    expect(t.gh.calls).toHaveLength(0);
    expect(await (await fetch(`${t.base}/healthz`)).json()).toEqual({
      ok: true,
      github: 'degraded',
      pending: 1,
    });
  });

  it('rafraîchissement paresseux après 10 min, requête conditionnelle (304)', async () => {
    t = await startApp();
    const r = await submit(t);
    await t.app.service.drain();
    // Donnée fraîche : aucun appel.
    await getTicket(t, r.token);
    expect(t.gh.calls.filter((c) => c.method === 'GET')).toHaveLength(0);
    // Le ticket change côté GitHub.
    t.gh.update(100, { labels: [{ name: 'statut:confirmé' }] });
    t.gh.addComment(100, {
      id: 7,
      body: '/public\nMerci, reproduit.',
      author_association: 'OWNER',
    });
    t.gh.addComment(100, { id: 8, body: '/public\nFaux', author_association: 'NONE' });
    t.clock.advance(11 * MIN);
    let view = TicketViewSchema.parse(await (await getTicket(t, r.token)).json());
    expect(view.status).toBe('confirmed');
    expect(view.replies).toEqual([
      { at: Date.parse(new Date(t.clock.t - 11 * MIN).toISOString()), text: 'Merci, reproduit.' },
    ]);
    expect(view.updatedAt).toBe(t.clock.t);
    // Lecture suivante après 10 min : If-None-Match, 304, rien ne change.
    t.clock.advance(11 * MIN);
    const n = t.gh.calls.length;
    view = TicketViewSchema.parse(await (await getTicket(t, r.token)).json());
    const conditional = t.gh.calls.slice(n);
    expect(conditional).toHaveLength(1);
    expect(conditional[0]?.headers['if-none-match']).toBe(t.gh.etag(100));
    expect(view.status).toBe('confirmed');
    expect(view.replies).toHaveLength(1);
  });

  it('DELETE : 204, contact effacé, jeton invalidé, corps GitHub remplacé', async () => {
    t = await startApp();
    const r = await submit(t);
    await t.app.service.drain();
    const res = await getTicket(t, r.token, 'DELETE');
    expect(res.status).toBe(204);
    await t.app.service.drain();
    expect((await getTicket(t, r.token)).status).toBe(404);
    const row = t.app.store.byTicket(r.ticket)!;
    expect(row).toMatchObject({ contact: null, tokenHash: null, pendingOp: null });
    const patch = t.gh.calls.find((c) => c.method === 'PATCH');
    expect(patch?.path).toBe('/issues/100');
    expect(t.gh.issues.get(100)?.body).toContain('supprimé');
    expect(t.gh.issues.get(100)?.body).not.toContain('troisième audition');
  });

  it('DELETE avant la création GitHub : la ligne disparaît, rien n’est envoyé', async () => {
    t = await startApp();
    t.gh.failure = 503;
    const r = await submit(t);
    await t.app.service.drain();
    expect((await getTicket(t, r.token, 'DELETE')).status).toBe(204);
    t.gh.failure = null;
    t.clock.advance(MIN);
    const n = t.gh.calls.length;
    await t.app.service.drain();
    expect(t.gh.calls.length).toBe(n);
    expect(t.app.store.byTicket(r.ticket)).toBeUndefined();
  });

  it('60 lectures par minute puis 429', async () => {
    t = await startApp();
    const r = await submit(t);
    for (let i = 0; i < 60; i++) expect((await getTicket(t, r.token)).status).toBe(200);
    const res = await getTicket(t, r.token);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
  });
});

describe('webhook GitHub', () => {
  async function withIssue() {
    const app = await startApp();
    const r = await submit(app);
    await app.app.service.drain();
    return { app, r, issue: app.gh.issues.get(100)! };
  }

  it('signature valide : statut et réponses mis à jour', async () => {
    const { app, r, issue } = await withIssue();
    t = app;
    let res = await hook(t, 'issues', {
      action: 'closed',
      issue: {
        ...issue,
        state: 'closed',
        state_reason: 'completed',
        milestone: { title: 'v1.3.0' },
        closed_at: new Date(t.clock.t).toISOString(),
      },
      repository,
    });
    expect(res.status).toBe(204);
    res = await hook(t, 'issue_comment', {
      action: 'created',
      issue,
      comment: {
        id: 11,
        body: '/public\nCorrigé en 1.3.0.',
        author_association: 'MEMBER',
        created_at: new Date(t.clock.t).toISOString(),
      },
      repository,
    });
    expect(res.status).toBe(204);
    // Commentaire d'un inconnu avec le marqueur : ignoré.
    await hook(t, 'issue_comment', {
      action: 'created',
      issue,
      comment: {
        id: 12,
        body: '/public\nhttps://phishing.example',
        author_association: 'NONE',
        created_at: new Date(t.clock.t).toISOString(),
      },
      repository,
    });
    const view = TicketViewSchema.parse(await (await getTicket(t, r.token)).json());
    expect(view).toMatchObject({ status: 'fixed', fixedIn: 'v1.3.0' });
    expect(view.replies.map((x) => x.text)).toEqual(['Corrigé en 1.3.0.']);
    expect(t.app.store.byTicket(r.ticket)?.closedAt).toBe(t.clock.t);
    // Suppression du commentaire public.
    await hook(t, 'issue_comment', {
      action: 'deleted',
      issue,
      comment: {
        id: 11,
        body: '/public\nCorrigé en 1.3.0.',
        author_association: 'MEMBER',
        created_at: new Date(t.clock.t).toISOString(),
      },
      repository,
    });
    expect(TicketViewSchema.parse(await (await getTicket(t, r.token)).json()).replies).toEqual([]);
  });

  it('signature invalide, absente ou d’un autre secret : 401, rien n’est appliqué', async () => {
    const { app, r, issue } = await withIssue();
    t = app;
    const payload = {
      action: 'closed',
      issue: { ...issue, state: 'closed', state_reason: 'not_planned' },
      repository,
    };
    expect((await hook(t, 'issues', payload, 'un-autre-secret-0123456789')).status).toBe(401);
    const body = JSON.stringify(payload);
    const noSig = await fetch(`${t.base}/v1/github/webhook`, {
      method: 'POST',
      headers: { 'X-GitHub-Event': 'issues' },
      body,
    });
    expect(noSig.status).toBe(401);
    // Corps modifié après signature.
    const tampered = await fetch(`${t.base}/v1/github/webhook`, {
      method: 'POST',
      headers: { 'X-GitHub-Event': 'issues', 'X-Hub-Signature-256': sign(WEBHOOK_SECRET, body) },
      body: body.replace('not_planned', 'completed'),
    });
    expect(tampered.status).toBe(401);
    expect(TicketViewSchema.parse(await (await getTicket(t, r.token)).json()).status).toBe(
      'received',
    );
  });

  it('autre dépôt, ticket inconnu, ping : ignorés (204)', async () => {
    const { app, r, issue } = await withIssue();
    t = app;
    const closed = { ...issue, state: 'closed', state_reason: 'not_planned' };
    expect((await hook(t, 'ping', { zen: 'hi' })).status).toBe(204);
    expect(
      (
        await hook(t, 'issues', {
          action: 'closed',
          issue: closed,
          repository: { full_name: 'x/y' },
        })
      ).status,
    ).toBe(204);
    expect(
      (await hook(t, 'issues', { action: 'closed', issue: { ...closed, number: 999 }, repository }))
        .status,
    ).toBe(204);
    expect(
      (await hook(t, 'issues', { action: 'closed', issue: { nope: 1 }, repository })).status,
    ).toBe(400);
    expect(TicketViewSchema.parse(await (await getTicket(t, r.token)).json()).status).toBe(
      'received',
    );
  });

  it('sans secret configuré : 503', async () => {
    t = await startApp({ webhookSecret: undefined });
    expect((await hook(t, 'ping', {})).status).toBe(503);
  });

  it('milestone : les tickets corrigés seront relus', async () => {
    const { app, r, issue } = await withIssue();
    t = app;
    await hook(t, 'issues', {
      action: 'closed',
      issue: {
        ...issue,
        state: 'closed',
        state_reason: 'completed',
        milestone: { title: 'v1.3.0' },
      },
      repository,
    });
    t.gh.update(100, {
      state: 'closed',
      state_reason: 'completed',
      milestone: { title: 'v1.3.1' },
    });
    expect(
      (await hook(t, 'milestone', { action: 'edited', milestone: { title: 'v1.3.1' }, repository }))
        .status,
    ).toBe(204);
    const view = TicketViewSchema.parse(await (await getTicket(t, r.token)).json());
    expect(view.fixedIn).toBe('v1.3.1');
  });
});

describe('problèmes connus', () => {
  it('tickets étiquetés public, titre anglais d’un mainteneur, cache invalidé par le webhook', async () => {
    t = await startApp();
    await submit(t);
    await submit(t);
    await t.app.service.drain();
    const issue = t.gh.issues.get(100)!;
    const get = (locale?: string) =>
      fetch(`${t!.base}/v1/known-issues${locale ? `?locale=${locale}` : ''}`, {
        headers: { Origin: ORIGIN },
      });
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(KnownIssuesSchema.parse(await res.json())).toEqual([]);
    await hook(t, 'issues', {
      action: 'labeled',
      issue: {
        ...issue,
        title: 'La carte ne zoome pas sur Android',
        labels: [{ name: 'public' }, { name: 'statut:en-cours' }],
      },
      repository,
    });
    expect(KnownIssuesSchema.parse(await (await get('fr')).json())).toEqual([
      {
        ticket: 'AA-0001',
        title: 'La carte ne zoome pas sur Android',
        status: 'in-progress',
        updatedAt: t.clock.t,
      },
    ]);
    // Sans titre anglais : repli sur le titre FR.
    expect(KnownIssuesSchema.parse(await (await get('en')).json())[0]?.title).toBe(
      'La carte ne zoome pas sur Android',
    );
    await hook(t, 'issue_comment', {
      action: 'created',
      issue,
      comment: {
        id: 21,
        body: '/public-title-en Map does not zoom on Android',
        author_association: 'OWNER',
        created_at: new Date(t.clock.t).toISOString(),
      },
      repository,
    });
    expect(KnownIssuesSchema.parse(await (await get('en')).json())[0]?.title).toBe(
      'Map does not zoom on Android',
    );
    expect((await get('de')).status).toBe(400);
  });

  it('cache en mémoire : pas de relecture de la base dans la minute', async () => {
    t = await startApp();
    const store = t.app.store;
    let reads = 0;
    const orig = store.publicTickets.bind(store);
    store.publicTickets = (n: number) => {
      reads++;
      return orig(n);
    };
    t.app.service.knownIssues('fr');
    t.app.service.knownIssues('fr');
    expect(reads).toBe(1);
    t.clock.advance(MIN);
    t.app.service.knownIssues('fr');
    expect(reads).toBe(2);
  });
});

describe('routes et erreurs', () => {
  it('404 et 405 en JSON, en-têtes de sécurité', async () => {
    t = await startApp();
    const nf = await fetch(`${t.base}/admin`);
    expect(nf.status).toBe(404);
    expect(await nf.json()).toEqual({ error: 'invalid' });
    expect(nf.headers.get('x-content-type-options')).toBe('nosniff');
    const na = await fetch(`${t.base}/v1/reports`, { headers: { Origin: ORIGIN } });
    expect(na.status).toBe(405);
    expect(na.headers.get('allow')).toBe('POST');
  });

  it('/healthz', async () => {
    t = await startApp();
    const res = await fetch(`${t.base}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, github: 'ok', pending: 0 });
  });

  it('rapprochement : tickets non fermés relus par requête conditionnelle', async () => {
    t = await startApp();
    await submit(t);
    await t.app.service.drain();
    t.gh.update(100, { assignees: [{}] });
    await t.app.service.reconcile();
    expect(t.app.store.byTicket('AA-0001')?.status).toBe('in-progress');
    const n = t.gh.calls.length;
    await t.app.service.reconcile();
    expect(t.gh.calls.slice(n).map((c) => c.headers['if-none-match'])).toEqual([t.gh.etag(100)]);
  });
});
