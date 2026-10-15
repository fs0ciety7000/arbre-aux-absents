import { z } from 'zod';

/**
 * Client GitHub minimal (REST, un seul dépôt fixé par la configuration : aucune URL arbitraire).
 * `fetch` injectable (faux GitHub en test). Chaque appel a un délai d'attente ; chaque réponse
 * est validée par zod avant usage.
 */

export const GITHUB_API = 'https://api.github.com';
export const GITHUB_TIMEOUT_MS = 10_000;
/** Pages de commentaires lues au plus (100 par page). */
const MAX_COMMENT_PAGES = 5;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const LabelSchema = z.union([z.string(), z.object({ name: z.string() })]);

export const IssueSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  state: z.enum(['open', 'closed']),
  state_reason: z.string().nullish(),
  labels: z.array(LabelSchema).default([]),
  assignee: z.object({}).nullish(),
  assignees: z.array(z.object({})).nullish(),
  milestone: z.object({ title: z.string() }).nullish(),
  closed_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});
export type GitHubIssue = z.infer<typeof IssueSchema>;

export const CommentSchema = z.object({
  id: z.number().int().positive(),
  body: z.string().nullish(),
  author_association: z.string().default('NONE'),
  created_at: z.string(),
});
export type GitHubComment = z.infer<typeof CommentSchema>;

const CreatedSchema = z.object({ number: z.number().int().positive() });

export const labelNames = (issue: GitHubIssue): string[] =>
  issue.labels.map((l) => (typeof l === 'string' ? l : l.name));

export const isAssigned = (issue: GitHubIssue): boolean =>
  (issue.assignees?.length ?? 0) > 0 || Boolean(issue.assignee);

export const parseTime = (s: string | null | undefined, fallback: number): number => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : fallback;
};

export type Health = 'ok' | 'degraded';

export interface GitHubOptions {
  token?: string;
  repo: string;
  fetch?: FetchLike;
  timeoutMs?: number;
}

export class GitHubClient {
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  /** `degraded` après un échec (401 : jeton expiré), `ok` après un succès. */
  health: Health;

  constructor(private readonly opts: GitHubOptions) {
    this.fetchImpl = opts.fetch ?? ((input, init) => fetch(input, init));
    this.timeoutMs = opts.timeoutMs ?? GITHUB_TIMEOUT_MS;
    this.health = opts.token ? 'ok' : 'degraded';
  }

  get enabled(): boolean {
    return Boolean(this.opts.token);
  }

  private async request(
    method: string,
    path: string,
    init: { body?: unknown; etag?: string | null; signal?: AbortSignal } = {},
  ): Promise<Response> {
    if (!this.opts.token) throw new GitHubError(0, 'GitHub non configuré');
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.opts.token}`,
      'User-Agent': 'arbre-report',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    if (init.etag) headers['If-None-Match'] = init.etag;
    const timeout = AbortSignal.timeout(this.timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    let res: Response;
    try {
      res = await this.fetchImpl(`${GITHUB_API}/repos/${this.opts.repo}${path}`, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal,
        redirect: 'error',
      });
    } catch (e) {
      this.health = 'degraded';
      throw new GitHubError(0, `GitHub injoignable (${(e as Error).name})`);
    }
    if (res.status === 304) {
      this.health = 'ok';
      return res;
    }
    if (!res.ok) {
      // 401 (jeton expiré), 403/429 (quota), 5xx : santé dégradée. 404/410 : ticket disparu.
      if (res.status !== 404 && res.status !== 410) this.health = 'degraded';
      await res.body?.cancel().catch(() => undefined);
      throw new GitHubError(res.status, `GitHub ${method} ${path.split('?')[0]} → ${res.status}`);
    }
    this.health = 'ok';
    return res;
  }

  private async json<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new GitHubError(502, 'Réponse GitHub illisible');
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new GitHubError(502, 'Réponse GitHub inattendue');
    return parsed.data;
  }

  async createIssue(
    draft: { title: string; body: string; labels: string[] },
    signal?: AbortSignal,
  ): Promise<number> {
    const res = await this.request('POST', '/issues', { body: draft, signal });
    return (await this.json(res, CreatedSchema)).number;
  }

  async updateIssueBody(issue: number, body: string, signal?: AbortSignal): Promise<void> {
    const res = await this.request('PATCH', `/issues/${issue}`, { body: { body }, signal });
    await res.body?.cancel().catch(() => undefined);
  }

  /** Requête conditionnelle : un 304 ne consomme pas de quota. */
  async getIssue(
    issue: number,
    etag: string | null,
    signal?: AbortSignal,
  ): Promise<
    { notModified: true } | { notModified: false; issue: GitHubIssue; etag: string | null }
  > {
    const res = await this.request('GET', `/issues/${issue}`, { etag, signal });
    if (res.status === 304) return { notModified: true };
    const data = await this.json(res, IssueSchema);
    return { notModified: false, issue: data, etag: res.headers.get('etag') };
  }

  async listComments(issue: number, signal?: AbortSignal): Promise<GitHubComment[]> {
    const out: GitHubComment[] = [];
    for (let page = 1; page <= MAX_COMMENT_PAGES; page++) {
      const res = await this.request('GET', `/issues/${issue}/comments?per_page=100&page=${page}`, {
        signal,
      });
      const batch = await this.json(res, z.array(CommentSchema).max(100));
      out.push(...batch);
      if (batch.length < 100) break;
    }
    return out;
  }
}
