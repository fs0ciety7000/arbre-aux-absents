import { createServer } from 'node:http';
import { join } from 'node:path';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import {
  ATTACHMENT_ID,
  ATTACHMENT_LIMITS,
  LocaleSchema,
  REPORT_LIMITS,
  REPORT_TOKEN,
  ReportSubmissionSchema,
} from '@arbre/contract';
import type { Locale } from '@arbre/contract';
import type { BlobStore, SecretSource } from './attachments';
import { FsBlobStore, MemoryBlobStore, UrlSigner, signingKey } from './attachments';
import type { Config } from './config';
import { applyCors, preflight } from './cors';
import { TicketStore } from './db';
import type { FetchLike } from './github';
import { GitHubClient } from './github';
import {
  BodyError,
  SECURITY_HEADERS,
  bearer,
  isJson,
  readBody,
  sendEmpty,
  sendError,
  sendJson,
} from './http';
import { EXTENSIONS, ImageError, cleanImage, declaredType, sniff } from './image';
import {
  RateLimiter,
  attachmentReadRules,
  attachmentRules,
  readRules,
  reportRules,
} from './ratelimit';
import { RETENTION, runRetention } from './retention';
import type { Logger } from './service';
import { ReportService, StorageFullError, TIMINGS, silentLogger } from './service';
import { handleEvent, verifySignature } from './webhook';

/**
 * Serveur HTTP du service de signalement (ARCHITECTURE §8). `createReportServer` assemble les
 * dépendances (horloge, `fetch`, base) pour que les tests tournent sur un port éphémère avec
 * SQLite `:memory:` et un faux GitHub.
 */

/** Corps maximal d'un webhook GitHub accepté (nos tickets restent bien en deçà). */
const WEBHOOK_MAX_BODY = 1024 * 1024;
const PENDING_EVERY_MS = 30_000;
/** Purge des pièces jointes libres expirées et des fichiers orphelins. */
const PURGE_EVERY_MS = 10 * 60_000;
/** Envois de pièces traités en même temps (mémoire bornée : 2 Mio chacun). */
const MAX_CONCURRENT_UPLOADS = 8;
/**
 * Délai de réception d'une requête entière : 60 s pour qu'une capture de 2 Mio passe sur une
 * connexion mobile lente (les routes JSON ont des corps de 64 Ko au plus).
 */
const REQUEST_TIMEOUT_MS = 60_000;

export interface ServerDeps {
  config: Config;
  db: DatabaseSync;
  fetch?: FetchLike;
  now?: () => number;
  logger?: Logger;
  /** Lance la file, le rapprochement et la conservation périodiques (désactivé en test). */
  timers?: boolean;
  /** Fichiers des pièces jointes ; défaut : `<DATA_DIR>/attachments`, mémoire si `:memory:`. */
  blobs?: BlobStore;
}

export interface ReportServer {
  server: Server;
  service: ReportService;
  store: TicketStore;
  limiter: RateLimiter;
  github: GitHubClient;
  blobs: BlobStore;
  signer: UrlSigner;
  /** Origine de la clé des URL signées (journalisée au démarrage, jamais la valeur). */
  attachmentSecretSource: SecretSource;
  listen(port?: number, host?: string): Promise<number>;
  close(): Promise<void>;
}

type Route =
  'healthz' | 'reports' | 'ticket' | 'known' | 'open' | 'webhook' | 'attachments' | 'attachment';

const ROUTES: Record<string, { route: Route; methods: readonly string[] }> = {
  '/healthz': { route: 'healthz', methods: ['GET', 'HEAD'] },
  '/v1/reports': { route: 'reports', methods: ['POST'] },
  '/v1/tickets/current': { route: 'ticket', methods: ['GET', 'DELETE'] },
  '/v1/known-issues': { route: 'known', methods: ['GET'] },
  '/v1/tickets': { route: 'open', methods: ['GET'] },
  '/v1/github/webhook': { route: 'webhook', methods: ['POST'] },
  '/v1/attachments': { route: 'attachments', methods: ['POST'] },
};

/** `/v1/attachments/<id>` : lecture par URL signée, suppression d'une pièce encore libre. */
const ATTACHMENT_ROUTE = { route: 'attachment' as const, methods: ['GET', 'HEAD', 'DELETE'] };
const ATTACHMENT_PATH = /^\/v1\/attachments\/([^/]{1,64})$/;

function resolveRoute(
  pathname: string,
): { route: Route; methods: readonly string[]; param?: string } | undefined {
  const exact = ROUTES[pathname];
  if (exact) return exact;
  const m = ATTACHMENT_PATH.exec(pathname);
  return m ? { ...ATTACHMENT_ROUTE, param: m[1] } : undefined;
}

/** IP du client : utilisée seulement pour dériver une clé HMAC en mémoire, jamais conservée. */
function clientIp(req: IncomingMessage): string {
  const cf = req.headers['cf-connecting-ip'];
  const v = Array.isArray(cf) ? cf[0] : cf;
  if (v && v.length <= 64) return v.trim();
  return req.socket.remoteAddress ?? 'unknown';
}

export function createReportServer(deps: ServerDeps): ReportServer {
  const { config } = deps;
  const now = deps.now ?? Date.now;
  const log = deps.logger ?? silentLogger;
  const store = new TicketStore(deps.db, config.ticketPrefix);
  const github = new GitHubClient({
    token: config.githubToken,
    repo: config.githubRepo,
    fetch: deps.fetch,
  });
  const blobs =
    deps.blobs ??
    (config.dataDir === ':memory:'
      ? new MemoryBlobStore(now)
      : new FsBlobStore(join(config.dataDir, 'attachments')));
  const { key, source: attachmentSecretSource } = signingKey(
    config.attachmentSecret,
    config.webhookSecret,
  );
  const signer = new UrlSigner(key, config.publicApiUrl);
  const service = new ReportService({
    store,
    github,
    now,
    publicSiteUrl: config.publicSiteUrl,
    logger: log,
    blobs,
    signer,
    attachmentsMaxBytes: config.attachmentsMaxBytes,
  });
  const limiter = new RateLimiter(now);
  let uploading = 0;

  function tooMany(res: ServerResponse, retryAfterSec: number) {
    sendError(res, 429, 'rateLimited', { 'Retry-After': String(retryAfterSec) });
  }

  async function postReport(req: IncomingMessage, res: ServerResponse) {
    if (!config.reportsEnabled) return sendError(res, 503, 'disabled');
    const key = limiter.clientKey(clientIp(req));
    const rules = reportRules(key);
    const pre = limiter.hit(rules, false);
    if (!pre.ok) return tooMany(res, pre.retryAfterSec);
    if (!isJson(req)) return sendError(res, 400, 'invalid');
    const raw = await readBody(req, REPORT_LIMITS.body);
    let data: unknown;
    try {
      data = JSON.parse(raw.toString('utf8'));
    } catch {
      return sendError(res, 400, 'invalid');
    }
    const parsed = ReportSubmissionSchema.safeParse(data);
    if (!parsed.success) return sendError(res, 400, 'invalid');
    const s = parsed.data;
    if (s.website !== '' || s.elapsedMs < REPORT_LIMITS.minElapsedMs) {
      // Pot de miel : réponse neutre, rien n'est créé ; seul le plafond du client est consommé.
      limiter.hit(rules.filter((r) => r.key !== '*'));
      return sendJson(res, 201, service.decoyReceipt(s.locale));
    }
    const hit = limiter.hit(rules);
    if (!hit.ok) return tooMany(res, hit.retryAfterSec);
    let receipt;
    try {
      receipt = service.submit(s);
    } catch (e) {
      log.warn('report.store', { error: (e as Error).name });
      return sendError(res, 503, 'unavailable');
    }
    sendJson(res, 201, receipt);
  }

  /**
   * `POST /v1/attachments` : corps binaire (2 Mio au plus), `Content-Type` image/png|jpeg|webp
   * conforme aux octets magiques. Pot de miel : `?website=` non vide → faux reçu, rien de stocké.
   */
  async function postAttachment(req: IncomingMessage, res: ServerResponse, url: URL) {
    if (!config.reportsEnabled) return sendError(res, 503, 'disabled');
    const rules = attachmentRules(limiter.clientKey(clientIp(req)));
    const pre = limiter.hit(rules, false);
    if (!pre.ok) return tooMany(res, pre.retryAfterSec);
    const declared = declaredType(req.headers['content-type']);
    if (!declared) return sendError(res, 415, 'invalid');
    const website = url.searchParams.get('website') ?? '';
    if (website.length > 200) return sendError(res, 400, 'invalid');
    if (uploading >= MAX_CONCURRENT_UPLOADS) {
      return sendError(res, 503, 'unavailable', { 'Retry-After': '5' });
    }
    uploading++;
    try {
      const raw = await readBody(req, ATTACHMENT_LIMITS.bytes);
      if (raw.length === 0) return sendError(res, 400, 'invalid');
      // Octets magiques d'un autre type que celui annoncé (ou d'aucun type accepté) : 415.
      if (sniff(raw) !== declared) return sendError(res, 415, 'invalid');
      let img;
      try {
        img = cleanImage(raw, declared);
      } catch (e) {
        if (e instanceof ImageError && e.kind === 'tooLarge') {
          return sendError(res, 413, 'tooLarge');
        }
        return sendError(res, 400, 'invalid');
      }
      if (website !== '') {
        limiter.hit(rules.filter((r) => r.key !== '*'));
        return sendJson(
          res,
          201,
          service.decoyAttachment(img.type, img.width, img.height, img.data.length),
        );
      }
      const hit = limiter.hit(rules);
      if (!hit.ok) return tooMany(res, hit.retryAfterSec);
      try {
        sendJson(res, 201, service.storeAttachment(img));
      } catch (e) {
        if (!(e instanceof StorageFullError))
          log.warn('attachment.store', { error: (e as Error).name });
        sendError(res, 503, 'unavailable');
      }
    } finally {
      uploading--;
    }
  }

  /**
   * `GET|HEAD /v1/attachments/<id>?sig=` : signature invalide → 403, pièce inconnue, supprimée
   * ou libre expirée → 404. `DELETE` (sans signature) : pièce encore libre seulement → 204, sinon 404.
   */
  function attachment(
    req: IncomingMessage,
    res: ServerResponse,
    method: string,
    id: string,
    url: URL,
  ) {
    const clientKey = limiter.clientKey(clientIp(req));
    const hit = limiter.hit(
      method === 'DELETE' ? readRules(clientKey) : attachmentReadRules(clientKey),
    );
    if (!hit.ok) return tooMany(res, hit.retryAfterSec);
    if (!ATTACHMENT_ID.test(id)) return sendError(res, 404, 'invalid');
    if (method === 'DELETE') {
      if (!service.deleteUnattached(id)) return sendError(res, 404, 'invalid');
      return sendEmpty(res, 204);
    }
    if (!signer.verify(id, url.searchParams.get('sig'))) return sendError(res, 403, 'invalid');
    const found = service.readAttachment(id);
    if (!found) return sendError(res, 404, 'invalid');
    const { row, data } = found;
    res.writeHead(200, {
      'Content-Type': row.type,
      'Content-Length': data.length,
      'Cache-Control': 'private, max-age=300',
      'Content-Disposition': `inline; filename="capture-${id}.${EXTENSIONS[row.type]}"`,
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(method === 'HEAD' ? undefined : data);
  }

  async function ticket(req: IncomingMessage, res: ServerResponse, method: string) {
    const hit = limiter.hit(readRules(limiter.clientKey(clientIp(req))));
    if (!hit.ok) return tooMany(res, hit.retryAfterSec);
    const token = bearer(req);
    if (!token || !REPORT_TOKEN.test(token)) return sendError(res, 400, 'invalid');
    const row = service.findByToken(token);
    if (!row) return sendError(res, 404, 'invalid');
    if (method === 'DELETE') {
      service.forget(row);
      return sendEmpty(res, 204);
    }
    const view = await service.view(token);
    if (!view) return sendError(res, 404, 'invalid');
    sendJson(res, 200, view);
  }

  /** Listes publiques (problèmes connus, tickets ouverts) : plafond de lectures, `?locale=`. */
  function publicList(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
    list: (locale: Locale) => unknown,
    maxAgeSec: number,
  ) {
    const hit = limiter.hit(readRules(limiter.clientKey(clientIp(req))));
    if (!hit.ok) return tooMany(res, hit.retryAfterSec);
    const locale = LocaleSchema.safeParse(url.searchParams.get('locale') ?? 'fr');
    if (!locale.success) return sendError(res, 400, 'invalid');
    sendJson(res, 200, list(locale.data), {
      'Cache-Control': `public, max-age=${maxAgeSec}`,
    });
  }

  async function webhook(req: IncomingMessage, res: ServerResponse) {
    if (!config.webhookSecret) return sendError(res, 503, 'unavailable');
    const raw = await readBody(req, WEBHOOK_MAX_BODY);
    const sig = req.headers['x-hub-signature-256'];
    if (!verifySignature(config.webhookSecret, raw, Array.isArray(sig) ? sig[0] : sig)) {
      return sendError(res, 401, 'invalid');
    }
    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      return sendError(res, 400, 'invalid');
    }
    const event = String(req.headers['x-github-event'] ?? '');
    const outcome = handleEvent(event, payload, { service, store, repo: config.githubRepo });
    if (outcome === 'invalid') return sendError(res, 400, 'invalid');
    sendEmpty(res, 204);
  }

  function healthz(res: ServerResponse) {
    sendJson(res, 200, {
      ok: true,
      github: github.enabled ? service.health : 'degraded',
      pending: service.pendingCount(),
      failed: service.failedCount(),
    });
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<string> {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = req.method ?? 'GET';
    const entry = resolveRoute(url.pathname);
    if (!entry) {
      sendError(res, 404, 'invalid');
      return 'unknown';
    }
    const { route } = entry;
    if (route !== 'webhook' && route !== 'healthz') {
      const verdict = applyCors(req, res, config.allowedOrigins);
      if (verdict === 'denied') {
        sendError(res, 403, 'invalid');
        return route;
      }
      if (method === 'OPTIONS') {
        preflight(res);
        return route;
      }
    }
    if (!entry.methods.includes(method)) {
      sendError(res, 405, 'invalid', { Allow: entry.methods.join(', ') });
      return route;
    }
    switch (route) {
      case 'healthz':
        healthz(res);
        break;
      case 'reports':
        await postReport(req, res);
        break;
      case 'ticket':
        await ticket(req, res, method);
        break;
      case 'known':
        publicList(req, res, url, (l) => service.knownIssues(l), 300);
        break;
      case 'open':
        publicList(req, res, url, (l) => service.openTickets(l), 60);
        break;
      case 'webhook':
        await webhook(req, res);
        break;
      case 'attachments':
        await postAttachment(req, res, url);
        break;
      case 'attachment':
        attachment(req, res, method, entry.param ?? '', url);
        break;
    }
    return route;
  }

  const server = createServer(
    { requestTimeout: REQUEST_TIMEOUT_MS, headersTimeout: 10_000 },
    (req, res) => {
      const started = performance.now();
      handle(req, res)
        .then((route) => {
          if (route !== 'healthz') {
            // Journal minimal : ni IP, ni jeton, ni en-têtes, ni corps.
            log.info('http', {
              method: req.method,
              route,
              status: res.statusCode,
              ms: Math.round(performance.now() - started),
            });
          }
        })
        .catch((e: unknown) => {
          if (e instanceof BodyError) {
            if (e.kind === 'tooLarge') {
              res.setHeader('Connection', 'close');
              sendError(res, 413, 'tooLarge');
            } else res.destroy();
            return;
          }
          log.warn('http.error', { error: (e as Error).name });
          sendError(res, 500, 'unavailable');
        });
    },
  );
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 64;

  const intervals: NodeJS.Timeout[] = [];
  function startTimers() {
    const every = (ms: number, fn: () => unknown) => {
      const t = setInterval(() => {
        try {
          const r = fn();
          if (r instanceof Promise) r.catch(() => undefined);
        } catch (e) {
          log.warn('timer', { error: (e as Error).name });
        }
      }, ms);
      t.unref();
      intervals.push(t);
    };
    const purge = () => {
      const p = service.purgeAttachments();
      if (p.rows || p.files) log.info('attachments.purged', { ...p });
    };
    const retention = () => {
      const r = runRetention(store, now());
      if (r.contactsErased || r.ticketsDeleted) log.info('retention', { ...r });
      // Pièces des tickets supprimés (cascade) : fichiers retirés aussitôt.
      purge();
    };
    retention();
    service.kick();
    every(PURGE_EVERY_MS, purge);
    every(PENDING_EVERY_MS, () => service.drain());
    every(TIMINGS.reconcileEveryMs, () => service.reconcile());
    every(RETENTION.everyMs, retention);
  }

  return {
    server,
    service,
    store,
    limiter,
    github,
    blobs,
    signer,
    attachmentSecretSource,
    listen(port = config.port, host = config.host) {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          if (deps.timers) startTimers();
          resolve((server.address() as AddressInfo).port);
        });
      });
    },
    async close() {
      for (const t of intervals) clearInterval(t);
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeIdleConnections();
      });
      await service.close();
    },
  };
}
