/**
 * Client du service de signalement (ARCHITECTURE §8) pour les pages du site. Aucune dépendance :
 * `fetch` injectable (tests), délai d'attente de 10 s, réponses vérifiées à la main (pas de zod
 * dans le JS client, voir `constants.ts`). Ne lève jamais : chaque appel rend un `ApiResult`.
 *
 * Le jeton de suivi ne voyage que dans l'en-tête `Authorization: Bearer` (jamais dans l'URL) ;
 * aucun cookie (`credentials: 'omit'`), aucun Referer (`referrerPolicy: 'no-referrer'`).
 */
import type {
  KnownIssue,
  Locale,
  ReportReceipt,
  ReportSubmission,
  TicketView,
} from '@arbre/contract';
import { REPORT_API, REQUEST_TIMEOUT_MS } from './config';
import {
  CATEGORIES,
  CLOSED_REASONS,
  ERROR_CODES,
  REPORT_TOKEN,
  STATUSES,
  TICKET_NUMBER,
} from './constants';

export type ApiFailure =
  /** 429 : `retryAfterSec` lu dans `Retry-After` (exposé par le CORS du service), sinon `null`. */
  | { kind: 'rateLimited'; retryAfterSec: number | null }
  /** 503 `disabled` : `REPORTS_ENABLED=false`. */
  | { kind: 'disabled' }
  /** 503, 5xx ou réponse illisible. */
  | { kind: 'unavailable' }
  /** 400 et autres refus. */
  | { kind: 'invalid' }
  | { kind: 'tooLarge' }
  /** 404 : jeton inconnu, supprimé ou expiré. */
  | { kind: 'notFound' }
  /** Réseau injoignable (hors ligne, DNS, CORS refusé, CSP). */
  | { kind: 'offline' }
  | { kind: 'timeout' };

export type ApiResult<T> = { ok: true; value: T } | { ok: false; failure: ApiFailure };

export interface ClientOptions {
  /** Base du service (déf. `VITE_REPORT_API`). */
  base?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const fail = <T>(failure: ApiFailure): ApiResult<T> => ({ ok: false, failure });

/** `Retry-After` en secondes (nombre entier ou date HTTP), `null` si absent ou illisible. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v);
  const at = Date.parse(v);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.ceil((at - now) / 1000));
}

async function errorCode(res: Response) {
  try {
    const body: unknown = await res.json();
    const code = (body as { error?: unknown } | null)?.error;
    return (ERROR_CODES as readonly unknown[]).includes(code) ? code : null;
  } catch {
    return null;
  }
}

/** Échec d'une réponse HTTP qui n'est pas un succès attendu. */
async function failureOf(res: Response): Promise<ApiFailure> {
  switch (res.status) {
    case 404:
      return { kind: 'notFound' };
    case 413:
      return { kind: 'tooLarge' };
    case 429:
      return {
        kind: 'rateLimited',
        retryAfterSec: parseRetryAfter(res.headers.get('Retry-After')),
      };
    case 503:
      return (await errorCode(res)) === 'disabled' ? { kind: 'disabled' } : { kind: 'unavailable' };
    default:
      return res.status >= 500 ? { kind: 'unavailable' } : { kind: 'invalid' };
  }
}

/**
 * Un appel au service : délai d'attente (abandon après `timeoutMs`), erreurs réseau traduites.
 * `read` lit le corps d'une réponse attendue ; `null` = réponse illisible (`unavailable`).
 */
async function call<T>(
  path: string,
  init: RequestInit,
  expected: number,
  read: (res: Response) => Promise<T | null>,
  opts: ClientOptions,
): Promise<ApiResult<T>> {
  const doFetch = opts.fetch ?? globalThis.fetch;
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const res = await doFetch(`${opts.base ?? REPORT_API}${path}`, {
      cache: 'no-store',
      ...init,
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctrl.signal,
    });
    if (res.status !== expected) return fail(await failureOf(res));
    const value = await read(res);
    return value === null ? fail({ kind: 'unavailable' }) : { ok: true, value };
  } catch {
    return fail({ kind: timedOut ? 'timeout' : 'offline' });
  } finally {
    clearTimeout(timer);
  }
}

async function json(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ── Vérification des réponses (formes du contrat) ─────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isShort = (v: unknown, max: number) => typeof v === 'string' && v.length <= max;
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  (list as readonly unknown[]).includes(v);

export function isReceipt(v: unknown): v is ReportReceipt {
  return (
    isObj(v) &&
    typeof v.ticket === 'string' &&
    TICKET_NUMBER.test(v.ticket) &&
    typeof v.token === 'string' &&
    REPORT_TOKEN.test(v.token) &&
    typeof v.followUrl === 'string' &&
    /^https?:\/\/[^\s]+$/.test(v.followUrl)
  );
}

export function isTicketView(v: unknown): v is TicketView {
  return (
    isObj(v) &&
    typeof v.ticket === 'string' &&
    TICKET_NUMBER.test(v.ticket) &&
    oneOf(STATUSES, v.status) &&
    (v.fixedIn === undefined || isShort(v.fixedIn, 40)) &&
    (v.closedReason === undefined || oneOf(CLOSED_REASONS, v.closedReason)) &&
    oneOf(CATEGORIES, v.category) &&
    isTime(v.createdAt) &&
    isTime(v.updatedAt) &&
    Array.isArray(v.replies) &&
    v.replies.every((r) => isObj(r) && isTime(r.at) && typeof r.text === 'string')
  );
}

export function isKnownIssue(v: unknown): v is KnownIssue {
  return (
    isObj(v) &&
    typeof v.ticket === 'string' &&
    TICKET_NUMBER.test(v.ticket) &&
    typeof v.title === 'string' &&
    v.title.length > 0 &&
    oneOf(STATUSES, v.status) &&
    (v.fixedIn === undefined || isShort(v.fixedIn, 40)) &&
    isTime(v.updatedAt)
  );
}

// ── Appels ─────────────────────────────────────────────────────────────

/** POST /v1/reports → 201 `ReportReceipt`. */
export function submitReport(
  submission: ReportSubmission,
  opts: ClientOptions = {},
): Promise<ApiResult<ReportReceipt>> {
  return call(
    '/v1/reports',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    },
    201,
    async (res) => {
      const body = await json(res);
      return isReceipt(body) ? body : null;
    },
    opts,
  );
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** GET /v1/tickets/current → 200 `TicketView` (404 : `notFound`). */
export function getTicket(token: string, opts: ClientOptions = {}): Promise<ApiResult<TicketView>> {
  if (!REPORT_TOKEN.test(token)) return Promise.resolve(fail({ kind: 'notFound' }));
  return call(
    '/v1/tickets/current',
    { method: 'GET', headers: bearer(token) },
    200,
    async (res) => {
      const body = await json(res);
      return isTicketView(body) ? body : null;
    },
    opts,
  );
}

/** DELETE /v1/tickets/current → 204 (contact effacé, jeton invalidé). */
export function deleteTicket(token: string, opts: ClientOptions = {}): Promise<ApiResult<true>> {
  if (!REPORT_TOKEN.test(token)) return Promise.resolve(fail({ kind: 'notFound' }));
  return call(
    '/v1/tickets/current',
    { method: 'DELETE', headers: bearer(token) },
    204,
    async () => true as const,
    opts,
  );
}

/** GET /v1/known-issues?locale= → `KnownIssue[]`, triés du plus récemment mis à jour au plus ancien. */
export function getKnownIssues(
  locale: Locale,
  opts: ClientOptions = {},
): Promise<ApiResult<KnownIssue[]>> {
  return call(
    `/v1/known-issues?locale=${locale}`,
    // Liste publique, mise en cache 5 min par le service (Cache-Control) : cache HTTP normal.
    { method: 'GET', cache: 'default' },
    200,
    async (res) => {
      const body = await json(res);
      if (!Array.isArray(body) || !body.every(isKnownIssue)) return null;
      return [...body].sort((a, b) => b.updatedAt - a.updatedAt);
    },
    opts,
  );
}

/** Jeton de suivi lu dans un fragment d'URL (`#<jeton>`), `null` s'il est absent ou mal formé. */
export function tokenFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '').trim();
  return REPORT_TOKEN.test(raw) ? raw : null;
}
