import { describe, expect, it, vi } from 'vitest';
import { ATTACHMENT_LIMITS, ReportSubmissionSchema } from '@arbre/contract';
import type { AttachmentItem } from '@arbre/ui';
import { attachmentError, createAttachmentQueue, missingAttachments } from '../attachments';
import { deleteAttachment, uploadAttachment, type ClientOptions } from '../client';
import { buildSubmission } from '../diagnostics';

const BASE = 'https://api.test';
const ID = 'AbCdEfGhIjKlMnOpQrStUv';
const RECEIPT = {
  id: ID,
  type: 'image/png',
  width: 1280,
  height: 720,
  bytes: 4242,
  expiresAt: 4_000_000,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function client(respond: (url: string, init?: RequestInit) => Response) {
  const fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) =>
    respond(String(url), init),
  );
  const opts: ClientOptions = {
    base: BASE,
    fetch: fetch as typeof globalThis.fetch,
    online: () => true,
  };
  return { fetch, opts };
}

const image = () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });

describe('envoi des captures (POST/DELETE /v1/attachments)', () => {
  it('corps binaire brut, type de l’image, pot de miel en paramètre ; reçu vérifié', async () => {
    const { fetch, opts } = client(() => json(201, RECEIPT));
    const blob = image();
    const res = await uploadAttachment(blob, '', opts);
    expect(res).toEqual({ ok: true, value: RECEIPT });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/v1/attachments?website=`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(blob);
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('image/png');
    expect(init?.credentials).toBe('omit');
    // Pot de miel rempli : transmis tel quel (le service rend un faux reçu).
    await uploadAttachment(blob, 'http://spam', opts);
    expect(fetch.mock.calls[1]![0]).toBe(`${BASE}/v1/attachments?website=http%3A%2F%2Fspam`);
  });

  it('415, 413, 429, reçu illisible : raisons du plateau', async () => {
    for (const [status, error] of [
      [415, 'type'],
      [413, 'tooLarge'],
      [429, 'rateLimited'],
      [400, 'invalid'],
      [500, 'unavailable'],
    ] as const) {
      const { opts } = client(() => json(status, { error: 'invalid' }));
      const res = await uploadAttachment(image(), '', opts);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(attachmentError(res.failure), String(status)).toBe(error);
    }
    const { opts } = client(() => json(201, { ...RECEIPT, id: 'court' }));
    expect(await uploadAttachment(image(), '', opts)).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
  });

  it('DELETE d’une pièce libre ; identifiant mal formé : aucune requête', async () => {
    const { fetch, opts } = client(() => new Response(null, { status: 204 }));
    expect(await deleteAttachment(ID, opts)).toEqual({ ok: true, value: true });
    expect(fetch.mock.calls[0]![0]).toBe(`${BASE}/v1/attachments/${ID}`);
    expect(fetch.mock.calls[0]![1]?.method).toBe('DELETE');
    expect(await deleteAttachment('../tickets', opts)).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('file du formulaire : envoi, retrait (DELETE), identifiants dans le signalement', async () => {
    let n = 0;
    const { fetch, opts } = client((_url, init) => {
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      n++;
      return json(201, {
        ...RECEIPT,
        id: `${ID.slice(0, 21)}${n}`,
        expiresAt: Date.now() + 3_600_000,
      });
    });
    let items: AttachmentItem[] = [];
    const queue = createAttachmentQueue({
      website: () => '',
      onchange: (next) => (items = next),
      client: opts,
      prepare: async (file) => ({ ok: true, blob: file }),
      createUrl: () => 'blob:x',
      revokeUrl: () => undefined,
    });
    queue.add([image(), image()]);
    await vi.waitFor(() => expect(items.every((i) => i.status === 'ready')).toBe(true));
    queue.remove(items[0]!.key);
    await vi.waitFor(() =>
      expect(fetch.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true),
    );
    const ids = await queue.fresh();
    expect(ids).toEqual([`${ID.slice(0, 21)}2`]);

    const submission = buildSubmission({
      category: 'bug',
      description: 'La carte ne s’affiche plus après la pause.',
      contact: '',
      locale: 'fr',
      diagnostics: {
        appVersion: '1.3.1',
        edition: 'full',
        platform: 'web',
        locale: 'fr',
        viewport: { w: 1, h: 1, dpr: 1 },
      },
      website: '',
      elapsedMs: 5000,
      attachments: ids,
    });
    expect(submission.attachments).toEqual(ids);
    expect(ReportSubmissionSchema.safeParse(submission).success).toBe(true);
    // Aucune capture : le champ est omis (pas de « attachments » dans le reçu).
    expect('attachments' in buildSubmission({ ...submission, contact: '', attachments: [] })).toBe(
      false,
    );
  });

  it('reçu : captures manquantes comptées', () => {
    expect(missingAttachments(2, 1)).toBe(1);
    expect(missingAttachments(2, 2)).toBe(0);
    expect(missingAttachments(0, undefined)).toBe(0);
    expect(ATTACHMENT_LIMITS.perReport).toBe(3);
  });
});
