/**
 * Client du signalement du site (ARCHITECTURE §8) avec un `fetch` simulé : succès, 429 avec
 * Retry-After, 503, hors ligne, délai d'attente, suppression ; corps envoyé conforme au contrat ;
 * constantes recopiées identiques à celles du contrat.
 */
import {
  KnownIssuesSchema,
  OPEN_TICKET_STATUSES,
  OpenTicketSchema,
  OpenTicketsSchema,
  REPORT_SOURCES,
  REPORT_CATEGORIES,
  REPORT_ERROR_CODES,
  REPORT_LIMITS,
  REPORT_TOKEN as CONTRACT_TOKEN,
  ReportReceiptSchema,
  ReportSubmissionSchema,
  TICKET_CLOSED_REASONS,
  TICKET_NUMBER as CONTRACT_TICKET,
  TICKET_STATUSES,
  TicketViewSchema,
} from '@arbre/contract';
import { describe, expect, it, vi } from 'vitest';
import {
  deleteTicket,
  getKnownIssues,
  getOpenTickets,
  getTicket,
  isKnownIssue,
  isOpenTicket,
  isReceipt,
  isTicketView,
  parseRetryAfter,
  submitReport,
  tokenFromHash,
} from './client';
import { DEFAULT_REPORT_API, reportApiBase } from './config';
import {
  CATEGORIES,
  CLOSED_REASONS,
  ERROR_CODES,
  LIMITS,
  OPEN_STATUSES,
  REPORT_TOKEN,
  SOURCES,
  STATUSES,
  TICKET_NUMBER,
} from './constants';
import {
  buildSubmission,
  fill,
  formatDelay,
  missingChars,
  osFamily,
  reportText,
  siteDiagnostics,
} from './payload';

const BASE = 'https://api.test';
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** `fetch` simulé : rend `respond(url, init)` et garde les appels. */
function fakeFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return respond(url, init);
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const diagnostics = siteDiagnostics({
  appVersion: '1.1.0',
  locale: 'en',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36',
  width: 1440.4,
  height: 900,
  dpr: 2,
});

const submission = buildSubmission({
  category: 'blocked',
  description: '   I cannot open the parish register after the hearing.   ',
  contact: '  ',
  locale: 'en',
  diagnostics,
  website: '',
  elapsedMs: 12_345.6,
});

const receipt = {
  ticket: 'AA-0042',
  token: TOKEN,
  followUrl: `https://arbre.cardormedia.com/suivi/#${TOKEN}`,
};

const ticket = {
  ticket: 'AA-0042',
  status: 'fixed',
  fixedIn: 'v1.2.0',
  category: 'blocked',
  createdAt: 1_760_000_000_000,
  updatedAt: 1_760_100_000_000,
  replies: [{ at: 1_760_050_000_000, text: '<b>Merci</b> !\nCorrigé.' }],
};

describe('constantes recopiées du contrat', () => {
  it('identiques à @arbre/contract', () => {
    expect(CATEGORIES).toEqual(REPORT_CATEGORIES);
    expect(STATUSES).toEqual(TICKET_STATUSES);
    expect(OPEN_STATUSES).toEqual(OPEN_TICKET_STATUSES);
    expect(SOURCES).toEqual(REPORT_SOURCES);
    expect(CLOSED_REASONS).toEqual(TICKET_CLOSED_REASONS);
    expect(ERROR_CODES).toEqual(REPORT_ERROR_CODES);
    for (const [k, v] of Object.entries(LIMITS)) {
      expect(v, k).toBe(REPORT_LIMITS[k as keyof typeof REPORT_LIMITS]);
    }
    expect(REPORT_TOKEN.source).toBe(CONTRACT_TOKEN.source);
    expect(TICKET_NUMBER.source).toBe(CONTRACT_TICKET.source);
  });

  it('URL du service : variable publique, sinon la production, sans barre finale', () => {
    expect(reportApiBase(undefined)).toBe(DEFAULT_REPORT_API);
    expect(reportApiBase('  ')).toBe(DEFAULT_REPORT_API);
    expect(reportApiBase('http://localhost:8090/')).toBe('http://localhost:8090');
  });
});

describe('corps envoyé', () => {
  it('conforme au contrat, source site, sans contact vide', () => {
    expect(ReportSubmissionSchema.safeParse(submission).success).toBe(true);
    expect(submission).toMatchObject({
      source: 'site',
      description: 'I cannot open the parish register after the hearing.',
      elapsedMs: 12_346,
      website: '',
    });
    expect('contact' in submission).toBe(false);
    expect(submission.diagnostics).toEqual({
      appVersion: '1.1.0',
      edition: 'full',
      platform: 'site',
      os: 'Windows',
      locale: 'en',
      viewport: { w: 1440, h: 900, dpr: 2 },
    });
  });

  it('contact gardé (tronqué à 200), jamais de User-Agent complet', () => {
    const s = buildSubmission({
      category: 'bug',
      description: 'x'.repeat(30),
      contact: ` ${'a'.repeat(250)} `,
      locale: 'fr',
      diagnostics,
      website: '',
      elapsedMs: 4000,
    });
    expect(s.contact).toHaveLength(200);
    expect(JSON.stringify(s)).not.toMatch(/Mozilla|Chrome/);
  });

  it('famille du système', () => {
    expect(osFamily('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Android');
    expect(osFamily('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iOS');
    expect(osFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBe('macOS');
    expect(osFamily('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux');
    expect(osFamily('curl/8')).toBeUndefined();
  });

  it('description : caractères manquants avant l’envoi', () => {
    expect(missingChars('court')).toBe(15);
    expect(missingChars(`  ${'x'.repeat(19)}  `)).toBe(1);
    expect(missingChars('x'.repeat(20))).toBe(0);
  });

  it('rapport à copier : sans contact ni pot de miel', () => {
    const s = { ...submission, contact: 'moi@example.org', website: 'spam' };
    const text = reportText(
      s,
      {
        heading: 'Report',
        category: 'Category:',
        description: 'Description:',
        diagnostics: 'Diagnostics:',
      },
      'I’m stuck',
    );
    expect(text).toContain('I cannot open the parish register');
    expect(text).toContain('Category: I’m stuck (blocked)');
    expect(text).toContain('"platform": "site"');
    expect(text).not.toContain('moi@example.org');
    expect(text).not.toContain('spam');
  });

  it('gabarits et délais en clair', () => {
    expect(fill('Encore {n} caractères', { n: 3 })).toBe('Encore 3 caractères');
    expect(fill('{inconnu}', {})).toBe('{inconnu}');
    expect(formatDelay(45, 'fr')).toMatch(/45\s*secondes/);
    expect(formatDelay(61, 'en')).toBe('2 minutes');
    expect(formatDelay(3600, 'en')).toBe('1 hour');
  });
});

describe('POST /v1/reports', () => {
  it('succès : 201 et reçu vérifié', async () => {
    const { fetch, calls } = fakeFetch(() => json(201, receipt));
    const r = await submitReport(submission, { base: BASE, fetch });
    expect(r).toEqual({ ok: true, value: receipt });
    expect(ReportReceiptSchema.safeParse(receipt).success).toBe(true);
    const [call] = calls;
    expect(call!.url).toBe(`${BASE}/v1/reports`);
    expect(call!.init.method).toBe('POST');
    expect(call!.init.credentials).toBe('omit');
    expect(call!.init.referrerPolicy).toBe('no-referrer');
    expect(new Headers(call!.init.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(String(call!.init.body))).toEqual(submission);
  });

  it('429 avec Retry-After (secondes et date HTTP)', async () => {
    const { fetch } = fakeFetch(() =>
      json(429, { error: 'rateLimited' }, { 'Retry-After': '720' }),
    );
    expect(await submitReport(submission, { base: BASE, fetch })).toEqual({
      ok: false,
      failure: { kind: 'rateLimited', retryAfterSec: 720 },
    });
    const now = Date.parse('2026-10-15T12:00:00Z');
    expect(parseRetryAfter('Thu, 15 Oct 2026 12:02:00 GMT', now)).toBe(120);
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('bientôt')).toBeNull();
  });

  it('429 sans Retry-After lisible', async () => {
    const { fetch } = fakeFetch(() => json(429, { error: 'rateLimited' }));
    const r = await submitReport(submission, { base: BASE, fetch });
    expect(r).toEqual({ ok: false, failure: { kind: 'rateLimited', retryAfterSec: null } });
  });

  it('503 : disabled ou unavailable selon le corps', async () => {
    const off = fakeFetch(() => json(503, { error: 'disabled' }));
    expect(await submitReport(submission, { base: BASE, fetch: off.fetch })).toEqual({
      ok: false,
      failure: { kind: 'disabled' },
    });
    const down = fakeFetch(() => json(503, { error: 'unavailable' }));
    expect(await submitReport(submission, { base: BASE, fetch: down.fetch })).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
    const proxy = fakeFetch(() => new Response('<html>Bad gateway</html>', { status: 502 }));
    expect(await submitReport(submission, { base: BASE, fetch: proxy.fetch })).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
  });

  it('400 et 413', async () => {
    const bad = fakeFetch(() => json(400, { error: 'invalid' }));
    expect((await submitReport(submission, { base: BASE, fetch: bad.fetch })).ok).toBe(false);
    expect(await submitReport(submission, { base: BASE, fetch: bad.fetch })).toEqual({
      ok: false,
      failure: { kind: 'invalid' },
    });
    const big = fakeFetch(() => json(413, { error: 'tooLarge' }));
    expect(await submitReport(submission, { base: BASE, fetch: big.fetch })).toEqual({
      ok: false,
      failure: { kind: 'tooLarge' },
    });
  });

  it('hors ligne : erreur réseau', async () => {
    const { fetch } = fakeFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    expect(await submitReport(submission, { base: BASE, fetch })).toEqual({
      ok: false,
      failure: { kind: 'offline' },
    });
  });

  it('délai d’attente : abandon après timeoutMs', async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const { fetch } = fakeFetch(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            signal = init.signal ?? undefined;
            signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      );
      const pending = submitReport(submission, { base: BASE, fetch, timeoutMs: 10_000 });
      await vi.advanceTimersByTimeAsync(9_999);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toEqual({ ok: false, failure: { kind: 'timeout' } });
      expect(signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('réponse 201 illisible : unavailable', async () => {
    const { fetch } = fakeFetch(() => json(201, { ticket: 'AA-42', token: 'x' }));
    expect(await submitReport(submission, { base: BASE, fetch })).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
  });
});

describe('GET et DELETE /v1/tickets/current', () => {
  it('jeton dans Authorization: Bearer, jamais dans l’URL', async () => {
    const { fetch, calls } = fakeFetch(() => json(200, ticket));
    const r = await getTicket(TOKEN, { base: BASE, fetch });
    expect(r).toEqual({ ok: true, value: ticket });
    expect(TicketViewSchema.safeParse(ticket).success).toBe(true);
    expect(calls[0]!.url).toBe(`${BASE}/v1/tickets/current`);
    expect(calls[0]!.url).not.toContain(TOKEN);
    expect(new Headers(calls[0]!.init.headers).get('Authorization')).toBe(`Bearer ${TOKEN}`);
    expect(calls[0]!.init.cache).toBe('no-store');
  });

  it('404 : notFound ; jeton mal formé : aucun appel', async () => {
    const { fetch, calls } = fakeFetch(() => json(404, { error: 'invalid' }));
    expect(await getTicket(TOKEN, { base: BASE, fetch })).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    expect(await getTicket('trop-court', { base: BASE, fetch })).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    expect(calls).toHaveLength(1);
  });

  it('suppression : 204', async () => {
    const { fetch, calls } = fakeFetch(() => new Response(null, { status: 204 }));
    expect(await deleteTicket(TOKEN, { base: BASE, fetch })).toEqual({ ok: true, value: true });
    expect(calls[0]!.init.method).toBe('DELETE');
    expect(new Headers(calls[0]!.init.headers).get('Authorization')).toBe(`Bearer ${TOKEN}`);
  });

  it('suppression : 404, 429 et hors ligne', async () => {
    const gone = fakeFetch(() => json(404, { error: 'invalid' }));
    expect(await deleteTicket(TOKEN, { base: BASE, fetch: gone.fetch })).toEqual({
      ok: false,
      failure: { kind: 'notFound' },
    });
    const busy = fakeFetch(() => json(429, { error: 'rateLimited' }, { 'Retry-After': '30' }));
    expect(await deleteTicket(TOKEN, { base: BASE, fetch: busy.fetch })).toEqual({
      ok: false,
      failure: { kind: 'rateLimited', retryAfterSec: 30 },
    });
    const off = fakeFetch(() => Promise.reject(new TypeError('NetworkError')));
    expect(await deleteTicket(TOKEN, { base: BASE, fetch: off.fetch })).toEqual({
      ok: false,
      failure: { kind: 'offline' },
    });
  });

  it('jeton du fragment', () => {
    expect(tokenFromHash(`#${TOKEN}`)).toBe(TOKEN);
    expect(tokenFromHash(TOKEN)).toBe(TOKEN);
    expect(tokenFromHash('')).toBeNull();
    expect(tokenFromHash('#abc')).toBeNull();
    expect(tokenFromHash(`#${TOKEN}<script>`)).toBeNull();
  });
});

describe('GET /v1/known-issues', () => {
  const issues = [
    { ticket: 'AA-0001', title: 'Ancien', status: 'fixed', fixedIn: 'v1.1.0', updatedAt: 10 },
    { ticket: 'AA-0002', title: 'Récent', status: 'confirmed', updatedAt: 30 },
    { ticket: 'AA-0003', title: 'Milieu', status: 'in-progress', updatedAt: 20 },
  ];

  it('liste triée par mise à jour, locale dans la requête', async () => {
    const { fetch, calls } = fakeFetch(() => json(200, issues));
    const r = await getKnownIssues('en', { base: BASE, fetch });
    expect(KnownIssuesSchema.safeParse(issues).success).toBe(true);
    expect(r.ok && r.value.map((i) => i.ticket)).toEqual(['AA-0002', 'AA-0003', 'AA-0001']);
    expect(calls[0]!.url).toBe(`${BASE}/v1/known-issues?locale=en`);
    expect(calls[0]!.init.cache).toBe('default');
  });

  it('liste vide, entrée invalide, panne', async () => {
    const empty = fakeFetch(() => json(200, []));
    expect(await getKnownIssues('fr', { base: BASE, fetch: empty.fetch })).toEqual({
      ok: true,
      value: [],
    });
    const bad = fakeFetch(() => json(200, [{ ...issues[0], status: 'perdu' }]));
    expect(await getKnownIssues('fr', { base: BASE, fetch: bad.fetch })).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
    const down = fakeFetch(() => json(503, { error: 'unavailable' }));
    expect(await getKnownIssues('fr', { base: BASE, fetch: down.fetch })).toEqual({
      ok: false,
      failure: { kind: 'unavailable' },
    });
  });
});

describe('GET /v1/tickets', () => {
  const open = [
    {
      ticket: 'AA-0001',
      category: 'bug',
      status: 'confirmed',
      source: 'game',
      createdAt: 10,
      updatedAt: 40,
    },
    {
      ticket: 'AA-0003',
      category: 'audio',
      status: 'received',
      source: 'site',
      createdAt: 30,
      updatedAt: 30,
    },
    {
      ticket: 'AA-0002',
      category: 'text',
      status: 'in-progress',
      source: 'game',
      createdAt: 20,
      updatedAt: 50,
      title: 'Faute dans le registre',
    },
  ];

  it('liste triée par date d’envoi, locale dans la requête, cache HTTP normal', async () => {
    const { fetch, calls } = fakeFetch(() => json(200, open));
    const r = await getOpenTickets('en', { base: BASE, fetch });
    expect(OpenTicketsSchema.safeParse(open).success).toBe(true);
    expect(r.ok && r.value.map((i) => i.ticket)).toEqual(['AA-0003', 'AA-0002', 'AA-0001']);
    expect(calls[0]!.url).toBe(`${BASE}/v1/tickets?locale=en`);
    expect(calls[0]!.init.cache).toBe('default');
    expect(calls[0]!.init.credentials).toBe('omit');
  });

  it('vide, entrée invalide ou trop longue, panne, hors ligne', async () => {
    const empty = fakeFetch(() => json(200, []));
    expect(await getOpenTickets('fr', { base: BASE, fetch: empty.fetch })).toEqual({
      ok: true,
      value: [],
    });
    const unavailable = { ok: false, failure: { kind: 'unavailable' } };
    for (const body of [
      [{ ...open[0], status: 'fixed' }],
      [{ ...open[0], description: 'texte du joueur' }],
      Array.from({ length: LIMITS.openTickets + 1 }, () => open[0]),
      { items: open },
    ]) {
      const bad = fakeFetch(() => json(200, body));
      expect(await getOpenTickets('fr', { base: BASE, fetch: bad.fetch })).toEqual(unavailable);
    }
    const down = fakeFetch(() => json(503, { error: 'unavailable' }));
    expect(await getOpenTickets('fr', { base: BASE, fetch: down.fetch })).toEqual(unavailable);
    const limited = fakeFetch(() => json(429, { error: 'rateLimited' }, { 'Retry-After': '30' }));
    expect(await getOpenTickets('fr', { base: BASE, fetch: limited.fetch })).toEqual({
      ok: false,
      failure: { kind: 'rateLimited', retryAfterSec: 30 },
    });
    const offline = fakeFetch(() => {
      throw new TypeError('Failed to fetch');
    });
    expect(await getOpenTickets('fr', { base: BASE, fetch: offline.fetch })).toEqual({
      ok: false,
      failure: { kind: 'offline' },
    });
  });

  it('mêmes verdicts que le schéma du contrat', () => {
    const base = open[2]!;
    const cases: [unknown, boolean][] = [
      [base, true],
      [{ ...base, title: undefined }, true],
      [{ ...base, title: '' }, false],
      [{ ...base, title: 'x'.repeat(201) }, false],
      [{ ...base, status: 'closed' }, false],
      [{ ...base, source: 'forum' }, false],
      [{ ...base, category: 'autre' }, false],
      [{ ...base, contact: 'a@b.c' }, false],
      [{ ...base, ticket: 'aa-1' }, false],
    ];
    for (const [v, ok] of cases) {
      const clean = JSON.parse(JSON.stringify(v));
      expect(isOpenTicket(clean), JSON.stringify(v)).toBe(ok);
      expect(OpenTicketSchema.safeParse(clean).success).toBe(ok);
    }
  });
});

describe('vérification des réponses (mêmes verdicts que les schémas du contrat)', () => {
  it('reçu, fiche et problème connu', () => {
    const cases: [unknown, boolean][] = [
      [receipt, true],
      [{ ...receipt, ticket: 'aa-1' }, false],
      [{ ...receipt, token: 'court' }, false],
      [{ ...receipt, followUrl: 'javascript:alert(1)' }, false],
      [{ ...receipt, followUrl: `https://arbre.cardormedia.com/en/suivi/#${receipt.token}` }, true],
    ];
    for (const [v, ok] of cases) {
      expect(isReceipt(v)).toBe(ok);
      expect(ReportReceiptSchema.safeParse(v).success).toBe(ok);
    }
    const views: [unknown, boolean][] = [
      [ticket, true],
      [{ ...ticket, status: 'closed', closedReason: 'duplicate', fixedIn: undefined }, true],
      [{ ...ticket, status: 'perdu' }, false],
      [{ ...ticket, closedReason: 'oubli' }, false],
      [{ ...ticket, replies: [{ at: 'hier', text: 'x' }] }, false],
    ];
    for (const [v, ok] of views) {
      const clean = JSON.parse(JSON.stringify(v));
      expect(isTicketView(clean)).toBe(ok);
      expect(TicketViewSchema.safeParse(clean).success).toBe(ok);
    }
    expect(isKnownIssue({ ticket: 'AA-0001', title: '', status: 'fixed', updatedAt: 1 })).toBe(
      false,
    );
  });
});
