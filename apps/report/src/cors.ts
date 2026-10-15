import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * CORS par liste blanche exacte (`ALLOWED_ORIGINS`). Une requête sans `Origin` (curl, webhook)
 * passe ; une origine hors liste est refusée (403) avant tout traitement.
 */

export const CORS_METHODS = 'GET, POST, DELETE, OPTIONS';
export const CORS_HEADERS = 'Authorization, Content-Type';

export type CorsVerdict = 'none' | 'allowed' | 'denied';

export function corsVerdict(origin: string | undefined, allowed: readonly string[]): CorsVerdict {
  if (origin === undefined) return 'none';
  return allowed.includes(origin) ? 'allowed' : 'denied';
}

/** Pose les en-têtes CORS d'une origine autorisée. */
export function applyCors(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: readonly string[],
): CorsVerdict {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  const verdict = corsVerdict(origin, allowed);
  if (verdict === 'allowed' && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  }
  return verdict;
}

/** Réponse à une requête préalable (`OPTIONS`) autorisée. */
export function preflight(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Methods', CORS_METHODS);
  res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS);
  res.setHeader('Access-Control-Max-Age', '600');
  res.writeHead(204).end();
}
