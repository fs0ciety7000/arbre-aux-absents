import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ReportErrorCode } from '@arbre/contract';

/** Utilitaires HTTP : réponses JSON, lecture bornée du corps. */

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(json);
}

export function sendError(
  res: ServerResponse,
  status: number,
  error: ReportErrorCode,
  headers: Record<string, string> = {},
): void {
  sendJson(res, status, { error }, headers);
}

export function sendEmpty(res: ServerResponse, status = 204): void {
  res.writeHead(status, { 'Cache-Control': 'no-store' }).end();
}

export class BodyError extends Error {
  constructor(readonly kind: 'tooLarge' | 'aborted') {
    super(kind);
  }
}

/** Lit le corps sans dépasser `max` octets (413 annoncé ou constaté en cours de lecture). */
export async function readBody(req: IncomingMessage, max: number): Promise<Buffer> {
  const declared = req.headers['content-length'];
  if (declared !== undefined && Number(declared) > max) throw new BodyError('tooLarge');
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      const buf = chunk as Buffer;
      size += buf.length;
      if (size > max) throw new BodyError('tooLarge');
      chunks.push(buf);
    }
  } catch (e) {
    if (e instanceof BodyError) throw e;
    throw new BodyError('aborted');
  }
  return Buffer.concat(chunks, size);
}

export function isJson(req: IncomingMessage): boolean {
  const ct = req.headers['content-type'] ?? '';
  return /^application\/json\s*(;|$)/i.test(ct);
}

/** `Authorization: Bearer <jeton>` → jeton, ou `undefined`. */
export function bearer(req: IncomingMessage): string | undefined {
  const h = req.headers.authorization;
  if (!h) return undefined;
  const m = /^Bearer\s+(\S+)$/.exec(h.trim());
  return m?.[1];
}
