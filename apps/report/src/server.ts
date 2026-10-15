import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { LocaleSchema, REPORT_LIMITS, REPORT_TOKEN, ReportSubmissionSchema } from '@arbre/contract';
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
import { RateLimiter, readRules, reportRules } from './ratelimit';
import { RETENTION, runRetention } from './retention';
import type { Logger } from './service';
import { ReportService, TIMINGS, silentLogger } from './service';
import { handleEvent, verifySignature } from './webhook';

/**
 * Serveur HTTP du service de signalement (ARCHITECTURE §8). `createReportServer` assemble les
 * dépendances (horloge, `fetch`, base) pour que les tests tournent sur un port éphémère avec
 * SQLite `:memory:` et un faux GitHub.
 */

/** Corps maximal d'un webhook GitHub accepté (nos tickets restent bien en deçà). */
const WEBHOOK_MAX_BODY = 1024 * 1024;
const PENDING_EVERY_MS = 30_000;

export interface ServerDeps {
  config: Config;
  db: DatabaseSync;
  fetch?: FetchLike;
  now?: () => number;
  logger?: Logger;
  /** Lance la file, le rapprochement et la conservation périodiques (désactivé en test). */
  timers?: boolean;
}

export interface ReportServer {
  server: Server;
  service: ReportService;
  store: TicketStore;
  limiter: RateLimiter;
  github: GitHubClient;
  listen(port?: number, host?: string): Promise<number>;
  close(): Promise<void>;
}

type Route = 'healthz' | 'reports' | 'ticket' | 'known' | 'webhook';

const ROUTES: Record<string, { route: Route; methods: readonly string[] }> = {
  '/healthz': { route: 'healthz', methods: ['GET', 'HEAD'] },
  '/v1/reports': { route: 'reports', methods: ['POST'] },
  '/v1/tickets/current': { route: 'ticket', methods: ['GET', 'DELETE'] },
  '/v1/known-issues': { route: 'known', methods: ['GET'] },
  '/v1/github/webhook': { route: 'webhook', methods: ['POST'] },
};

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
  const service = new ReportService({
    store,
    github,
    now,
    publicSiteUrl: config.publicSiteUrl,
    logger: log,
  });
  const limiter = new RateLimiter(now);

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
      return sendJson(res, 201, service.decoyReceipt());
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

  function knownIssues(req: IncomingMessage, res: ServerResponse, url: URL) {
    const hit = limiter.hit(readRules(limiter.clientKey(clientIp(req))));
    if (!hit.ok) return tooMany(res, hit.retryAfterSec);
    const locale = LocaleSchema.safeParse(url.searchParams.get('locale') ?? 'fr');
    if (!locale.success) return sendError(res, 400, 'invalid');
    sendJson(res, 200, service.knownIssues(locale.data), {
      'Cache-Control': 'public, max-age=300',
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
    const entry = ROUTES[url.pathname];
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
        knownIssues(req, res, url);
        break;
      case 'webhook':
        await webhook(req, res);
        break;
    }
    return route;
  }

  const server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, (req, res) => {
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
  });
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
    const retention = () => {
      const r = runRetention(store, now());
      if (r.contactsErased || r.ticketsDeleted) log.info('retention', { ...r });
    };
    retention();
    service.kick();
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
