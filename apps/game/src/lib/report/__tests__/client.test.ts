import { describe, expect, it, vi } from 'vitest';
import type { ReportSubmission, TicketView } from '@arbre/contract';
import {
  DEFAULT_REPORT_API,
  deleteTicket,
  followUrlFor,
  getTicket,
  parseRetryAfter,
  reportApiBase,
  submitReport,
  type ClientOptions,
} from '../client';

const BASE = 'https://api.test';
const TOKEN = 'abcdefghijklmnopqrstuv';
const RECEIPT = {
  ticket: 'AA-0042',
  token: TOKEN,
  followUrl: `https://arbre.cardormedia.com/suivi/#${TOKEN}`,
};
const VIEW: TicketView = {
  ticket: 'AA-0042',
  status: 'fixed',
  fixedIn: 'v1.2.0',
  category: 'bug',
  createdAt: 1000,
  updatedAt: 2000,
  replies: [{ at: 1500, text: 'Merci, corrigé.' }],
};

const SUBMISSION: ReportSubmission = {
  source: 'game',
  category: 'bug',
  description: 'Le bouton ne répond plus après une sauvegarde.',
  locale: 'fr',
  diagnostics: {
    appVersion: '1.1.0',
    edition: 'full',
    platform: 'web',
    locale: 'fr',
    viewport: { w: 1440, h: 900, dpr: 1 },
  },
  website: '',
  elapsedMs: 5000,
};

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

function client(response: Response | (() => Promise<Response>)) {
  const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    typeof response === 'function' ? response() : response,
  );
  const opts: ClientOptions = {
    base: BASE,
    fetch: fetch as typeof globalThis.fetch,
    online: () => true,
  };
  return { fetch, opts };
}

describe('client du service de signalement', () => {
  it('envoie le signalement (201) et rend le reçu', async () => {
    const { fetch, opts } = client(json(201, RECEIPT));
    const res = await submitReport(SUBMISSION, opts);
    expect(res).toEqual({ ok: true, value: RECEIPT });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/v1/reports`);
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('omit');
    expect(init?.referrerPolicy).toBe('no-referrer');
    expect(JSON.parse(String(init?.body))).toEqual(SUBMISSION);
  });

  it('429 : délai lu dans Retry-After', async () => {
    const { opts } = client(json(429, { error: 'rateLimited' }, { 'Retry-After': '120' }));
    expect(await submitReport(SUBMISSION, opts)).toEqual({
      ok: false,
      failure: { kind: 'rateLimited', retryAfterSec: 120 },
    });
  });

  it('429 sans Retry-After : délai inconnu', async () => {
    const { opts } = client(json(429, { error: 'rateLimited' }));
    expect(await submitReport(SUBMISSION, opts)).toEqual({
      ok: false,
      failure: { kind: 'rateLimited', retryAfterSec: null },
    });
  });

  it('503 : service suspendu (disabled) ou indisponible', async () => {
    expect(await submitReport(SUBMISSION, client(json(503, { error: 'disabled' })).opts)).toEqual({
      ok: false,
      failure: { kind: 'disabled' },
    });
    expect(
      await submitReport(SUBMISSION, client(json(503, { error: 'unavailable' })).opts),
    ).toEqual({ ok: false, failure: { kind: 'unavailable' } });
    expect(
      await submitReport(SUBMISSION, client(new Response('oops', { status: 502 })).opts),
    ).toEqual({ ok: false, failure: { kind: 'unavailable' } });
  });

  it('400 et 413 : refus', async () => {
    expect(await submitReport(SUBMISSION, client(json(400, { error: 'invalid' })).opts)).toEqual({
      ok: false,
      failure: { kind: 'invalid' },
    });
    expect(await submitReport(SUBMISSION, client(json(413, { error: 'tooLarge' })).opts)).toEqual({
      ok: false,
      failure: { kind: 'tooLarge' },
    });
  });

  it('reçu illisible : indisponible', async () => {
    const { opts } = client(json(201, { ticket: 'nope' }));
    expect(await submitReport(SUBMISSION, opts)).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
  });

  it('hors ligne : réseau injoignable ou navigateur hors ligne (aucune requête)', async () => {
    const { opts } = client(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await submitReport(SUBMISSION, opts)).toEqual({
      ok: false,
      failure: { kind: 'offline' },
    });
    const off = client(json(201, RECEIPT));
    const res = await submitReport(SUBMISSION, { ...off.opts, online: () => false });
    expect(res).toEqual({ ok: false, failure: { kind: 'offline' } });
    expect(off.fetch).not.toHaveBeenCalled();
  });

  it('délai d’attente dépassé : la requête est abandonnée', async () => {
    let signal: AbortSignal | undefined;
    const fetch = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          signal = init?.signal ?? undefined;
          signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const res = await submitReport(SUBMISSION, {
      base: BASE,
      fetch: fetch as typeof globalThis.fetch,
      online: () => true,
      timeoutMs: 20,
    });
    expect(res).toEqual({ ok: false, failure: { kind: 'timeout' } });
    expect(signal?.aborted).toBe(true);
  });

  it('délai par défaut : 10 secondes', async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn(
        (_url: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('abort')));
          }),
      );
      const pending = submitReport(SUBMISSION, {
        base: BASE,
        fetch: fetch as typeof globalThis.fetch,
        online: () => true,
      });
      await vi.advanceTimersByTimeAsync(9_999);
      let settled = false;
      void pending.then(() => (settled = true));
      await Promise.resolve();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toEqual({ ok: false, failure: { kind: 'timeout' } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('lit un ticket avec le jeton en Bearer, jamais dans l’URL', async () => {
    const { fetch, opts } = client(json(200, VIEW));
    expect(await getTicket(TOKEN, opts)).toEqual({ ok: true, value: VIEW });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`${BASE}/v1/tickets/current`);
    expect(String(url)).not.toContain(TOKEN);
    expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('ticket inconnu (404) ; jeton mal formé : aucune requête', async () => {
    expect(await getTicket(TOKEN, client(json(404, { error: 'invalid' })).opts)).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    const bad = client(json(200, VIEW));
    expect(await getTicket('court', bad.opts)).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    expect(bad.fetch).not.toHaveBeenCalled();
  });

  it('suppression : 204, ou 404 si déjà supprimé', async () => {
    const { fetch, opts } = client(new Response(null, { status: 204 }));
    expect(await deleteTicket(TOKEN, opts)).toEqual({ ok: true, value: true });
    expect(fetch.mock.calls[0]![1]?.method).toBe('DELETE');
    expect(await deleteTicket(TOKEN, client(json(404, { error: 'invalid' })).opts)).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    expect(
      await deleteTicket(TOKEN, client(() => Promise.reject(new TypeError('offline'))).opts),
    ).toEqual({ ok: false, failure: { kind: 'offline' } });
  });

  it('adresses : base de l’API, lien de suivi dans la langue du joueur', () => {
    expect(reportApiBase('')).toBe(DEFAULT_REPORT_API);
    expect(reportApiBase(undefined)).toBe(DEFAULT_REPORT_API);
    expect(reportApiBase(' http://localhost:8090/ ')).toBe('http://localhost:8090');
    expect(followUrlFor(TOKEN, 'fr')).toBe(`https://arbre.cardormedia.com/suivi/#${TOKEN}`);
    expect(followUrlFor(TOKEN, 'en')).toBe(`https://arbre.cardormedia.com/en/suivi/#${TOKEN}`);
  });

  it('Retry-After : secondes ou date HTTP', () => {
    expect(parseRetryAfter('30')).toBe(30);
    expect(parseRetryAfter(new Date(61_000).toUTCString(), 1_000)).toBe(60);
    expect(parseRetryAfter('bientôt')).toBeNull();
    expect(parseRetryAfter(null)).toBeNull();
  });
});
