/**
 * Client du service de signalement (ARCHITECTURE §8) pour le jeu. Chargé avec l'écran de
 * signalement (chunk à part, jamais au premier affichage). `fetch` injectable (tests), délai
 * d'attente de 10 s, réponses vérifiées par les schémas du contrat. Ne lève jamais : chaque appel
 * rend un `ApiResult`.
 *
 * Le jeton de suivi ne voyage que dans l'en-tête `Authorization: Bearer` (jamais dans l'URL de
 * l'API) ; aucun cookie (`credentials: 'omit'`), aucun Referer (`referrerPolicy: 'no-referrer'`).
 */
import {
  ATTACHMENT_ID,
  AttachmentReceiptSchema,
  REPORT_TOKEN,
  ReportErrorBodySchema,
  ReportReceiptSchema,
  TicketViewSchema,
  type AttachmentReceipt,
  type Locale,
  type ReportReceipt,
  type ReportSubmission,
  type TicketView,
} from '@arbre/contract';

/** Production ; `VITE_REPORT_API` la remplace au build (`.env.example`). */
export const DEFAULT_REPORT_API = 'https://arbre-api.cardormedia.com';
/** Site public : pages de suivi (`/suivi/`, `/en/suivi/`). Liste blanche de `openExternal`. */
export const SITE_URL = 'https://arbre.cardormedia.com';
/** Forum de la page itch.io du jeu : repli quand le service ne répond pas. */
export const FORUM_URL = 'https://cardorinteractive.itch.io/arbre-aux-absents/community';
/** Délai d'attente de chaque appel (DESIGN §13.8 : 10 s au plus). */
export const REPORT_TIMEOUT_MS = 10_000;
/** Envoi d'une capture (2 Mio au plus, réseau mobile lent) : le service attend 60 s. */
export const ATTACHMENT_TIMEOUT_MS = 60_000;

/** Base du service, sans barre finale. */
export function reportApiBase(value: string | undefined = import.meta.env.VITE_REPORT_API): string {
  const v = (value ?? '').trim();
  return (v || DEFAULT_REPORT_API).replace(/\/+$/, '');
}

/**
 * Lien de suivi sur le site, dans la langue du joueur : `…/suivi/#<jeton>` ou `…/en/suivi/#<jeton>`.
 * Le jeton est dans le fragment : ni journaux ni Referer (D10). Même forme que le `followUrl` du
 * service (langue du signalement), mais reconstruit ici : « Mes signalements » ne garde que le
 * jeton (`ReportRef`), et l'ouverture externe est limitée à `SITE_URL` quel que soit le
 * `PUBLIC_SITE_URL` du service (préproduction).
 */
export function followUrlFor(token: string, lang: Locale): string {
  return `${SITE_URL}${lang === 'en' ? '/en' : ''}/suivi/#${token}`;
}

export type ApiFailure =
  /** 429 : `retryAfterSec` lu dans `Retry-After` (exposé par le CORS du service), sinon `null`. */
  | { kind: 'rateLimited'; retryAfterSec: number | null }
  /** 503 `disabled` : `REPORTS_ENABLED=false`. */
  | { kind: 'disabled' }
  /** 503, autre 5xx ou réponse illisible. */
  | { kind: 'unavailable' }
  /** 400 et autres refus. */
  | { kind: 'invalid' }
  | { kind: 'tooLarge' }
  /** 415 : type d'image refusé (captures : PNG, JPEG ou WebP seulement). */
  | { kind: 'unsupported' }
  /** 404 : jeton inconnu, supprimé ou expiré. */
  | { kind: 'notFound' }
  /** Réseau injoignable (hors ligne, DNS, CORS refusé, CSP). */
  | { kind: 'offline' }
  | { kind: 'timeout' };

export type ApiResult<T> = { ok: true; value: T } | { ok: false; failure: ApiFailure };

export interface ClientOptions {
  /** Base du service (déf. `VITE_REPORT_API`, sinon la production). */
  base?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** État du réseau (déf. `navigator.onLine`) : hors ligne, échec immédiat sans requête. */
  online?: () => boolean;
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

async function errorCode(res: Response): Promise<string | null> {
  try {
    const parsed = ReportErrorBodySchema.safeParse(await res.json());
    return parsed.success ? parsed.data.error : null;
  } catch {
    return null;
  }
}

/** Échec d'une réponse HTTP qui n'est pas le succès attendu. */
async function failureOf(res: Response): Promise<ApiFailure> {
  switch (res.status) {
    case 404:
      return { kind: 'notFound' };
    case 413:
      return { kind: 'tooLarge' };
    case 415:
      return { kind: 'unsupported' };
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

function defaultOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
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
  if (!(opts.online ?? defaultOnline)()) return fail({ kind: 'offline' });
  const doFetch = opts.fetch ?? globalThis.fetch;
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, opts.timeoutMs ?? REPORT_TIMEOUT_MS);
  try {
    const res = await doFetch(`${opts.base ?? reportApiBase()}${path}`, {
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
      const parsed = ReportReceiptSchema.safeParse(await json(res));
      return parsed.success ? parsed.data : null;
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
      const parsed = TicketViewSchema.safeParse(await json(res));
      return parsed.success ? (parsed.data as TicketView) : null;
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

/**
 * POST /v1/attachments → 201 `AttachmentReceipt` : une capture, corps binaire brut, envoyée avant
 * le signalement. `website` : valeur du pot de miel (vide pour un humain).
 */
export function uploadAttachment(
  image: Blob,
  website: string,
  opts: ClientOptions = {},
): Promise<ApiResult<AttachmentReceipt>> {
  return call(
    `/v1/attachments?website=${encodeURIComponent(website)}`,
    { method: 'POST', headers: { 'Content-Type': image.type }, body: image },
    201,
    async (res) => {
      const parsed = AttachmentReceiptSchema.safeParse(await json(res));
      return parsed.success ? parsed.data : null;
    },
    { timeoutMs: ATTACHMENT_TIMEOUT_MS, ...opts },
  );
}

/** DELETE /v1/attachments/<id> → 204 : capture retirée du formulaire (encore libre). */
export function deleteAttachment(id: string, opts: ClientOptions = {}): Promise<ApiResult<true>> {
  if (!ATTACHMENT_ID.test(id)) return Promise.resolve(fail({ kind: 'notFound' }));
  return call(`/v1/attachments/${id}`, { method: 'DELETE' }, 204, async () => true as const, opts);
}
