import { DatabaseSync } from 'node:sqlite';
import type { ReportSubmission } from '@arbre/contract';
import type { Config } from '../src/config';
import { initDatabase } from '../src/db';
import type { FetchLike } from '../src/github';
import type { ReportServer } from '../src/server';
import { createReportServer } from '../src/server';

export const T0 = Date.UTC(2026, 9, 15, 12, 0, 0);
export const REPO = 'fs0ciety7000/arbre-aux-absents-signalements';
export const WEBHOOK_SECRET = 'test-webhook-secret-0123456789';
export const ORIGIN = 'https://arbre.cardormedia.com';
export const API = 'https://arbre-api.cardormedia.com';

export class Clock {
  constructor(public t = T0) {}
  now = (): number => this.t;
  advance(ms: number): void {
    this.t += ms;
  }
}

export interface FakeIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  state_reason: string | null;
  labels: { name: string }[];
  assignees: object[];
  milestone: { title: string } | null;
  closed_at: string | null;
  updated_at: string;
}

export interface FakeComment {
  id: number;
  body: string;
  author_association: string;
  created_at: string;
}

export interface Call {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

/** Faux GitHub en mémoire : issues, commentaires, ETag, panne simulée. */
export class FakeGitHub {
  issues = new Map<number, FakeIssue>();
  comments = new Map<number, FakeComment[]>();
  calls: Call[] = [];
  /** `down` : erreur réseau ; nombre : statut HTTP renvoyé à chaque appel. */
  failure: 'down' | number | null = null;
  private nextNumber = 100;
  private version = new Map<number, number>();

  bump(n: number): void {
    this.version.set(n, (this.version.get(n) ?? 0) + 1);
  }

  etag(n: number): string {
    return `"v${n}-${this.version.get(n) ?? 0}"`;
  }

  update(n: number, patch: Partial<FakeIssue>): FakeIssue {
    const issue = { ...this.issues.get(n)!, ...patch };
    this.issues.set(n, issue);
    this.bump(n);
    return issue;
  }

  addComment(n: number, c: Omit<FakeComment, 'created_at'> & { created_at?: string }): FakeComment {
    const full = { created_at: new Date(T0).toISOString(), ...c };
    this.comments.set(n, [...(this.comments.get(n) ?? []), full]);
    this.bump(n);
    return full;
  }

  fetch: FetchLike = async (input, init) => {
    const url = new URL(input);
    const method = init?.method ?? 'GET';
    const headers = Object.fromEntries(new Headers(init?.headers).entries());
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
    const prefix = `/repos/${REPO}`;
    const path = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : url.pathname;
    this.calls.push({ method, path: path + url.search, headers, body });
    if (this.failure === 'down') throw new TypeError('fetch failed');
    if (typeof this.failure === 'number') {
      return Response.json({ message: 'nope' }, { status: this.failure });
    }
    if (url.origin !== 'https://api.github.com' || !url.pathname.startsWith(prefix)) {
      return Response.json({ message: 'Not Found' }, { status: 404 });
    }
    if (method === 'POST' && path === '/issues') {
      const b = body as { title: string; body: string; labels: string[] };
      const number = this.nextNumber++;
      this.issues.set(number, {
        number,
        title: b.title,
        body: b.body,
        state: 'open',
        state_reason: null,
        labels: b.labels.map((name) => ({ name })),
        assignees: [],
        milestone: null,
        closed_at: null,
        updated_at: new Date(T0).toISOString(),
      });
      return Response.json({ number }, { status: 201 });
    }
    const m = /^\/issues\/(\d+)(\/comments)?$/.exec(path);
    if (m) {
      const n = Number(m[1]);
      const issue = this.issues.get(n);
      if (!issue) return Response.json({ message: 'Not Found' }, { status: 404 });
      if (m[2]) return Response.json(this.comments.get(n) ?? []);
      if (method === 'PATCH') {
        this.update(n, body as Partial<FakeIssue>);
        return Response.json(this.issues.get(n));
      }
      if (headers['if-none-match'] === this.etag(n)) return new Response(null, { status: 304 });
      return Response.json(issue, { headers: { ETag: this.etag(n) } });
    }
    return Response.json({ message: 'Not Found' }, { status: 404 });
  };
}

export function testConfig(over: Partial<Config> = {}): Config {
  return {
    host: '127.0.0.1',
    port: 0,
    githubToken: 'ghp_testtokentesttokentesttoken',
    githubRepo: REPO,
    webhookSecret: WEBHOOK_SECRET,
    allowedOrigins: [
      ORIGIN,
      'tauri://localhost',
      'http://tauri.localhost',
      'https://html-classic.itch.zone',
    ],
    publicSiteUrl: 'https://arbre.cardormedia.com',
    dataDir: ':memory:',
    reportsEnabled: true,
    ticketPrefix: 'AA',
    publicApiUrl: API,
    attachmentsMaxBytes: 64 * 1024 * 1024,
    ...over,
  };
}

export interface TestApp {
  app: ReportServer;
  base: string;
  gh: FakeGitHub;
  clock: Clock;
  db: DatabaseSync;
  close(): Promise<void>;
}

export async function startApp(over: Partial<Config> = {}): Promise<TestApp> {
  const gh = new FakeGitHub();
  const clock = new Clock();
  const db = initDatabase(new DatabaseSync(':memory:'));
  const app = createReportServer({ config: testConfig(over), db, fetch: gh.fetch, now: clock.now });
  const port = await app.listen(0, '127.0.0.1');
  return {
    app,
    base: `http://127.0.0.1:${port}`,
    gh,
    clock,
    db,
    async close() {
      await app.close();
      db.close();
    },
  };
}

export function submission(over: Partial<ReportSubmission> = {}): ReportSubmission {
  return {
    source: 'game',
    category: 'bug',
    description: 'Le dossier ne s’ouvre plus après la troisième audition, rien ne se passe.',
    contact: 'joueuse@example.org',
    locale: 'fr',
    diagnostics: {
      appVersion: '1.2.0',
      edition: 'full',
      platform: 'web',
      os: 'Linux',
      locale: 'fr',
      viewport: { w: 1280, h: 800, dpr: 1 },
    },
    website: '',
    elapsedMs: 12_000,
    ...over,
  };
}

export function post(
  base: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetch(`${base}/v1/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
