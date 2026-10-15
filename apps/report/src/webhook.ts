import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { CommentSchema, IssueSchema } from './github';
import type { ReportService } from './service';
import type { TicketStore } from './db';

/**
 * Webhook GitHub (`issues`, `issue_comment`, `milestone`). Signature `X-Hub-Signature-256`
 * vérifiée par HMAC SHA-256 en temps constant sur le corps brut, avant toute lecture du JSON.
 */

export function verifySignature(secret: string, body: Buffer, header: string | undefined): boolean {
  if (!header || !/^sha256=[0-9a-f]{64}$/i.test(header)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(header.slice('sha256='.length), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function sign(secret: string, body: string | Buffer): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

const RepoSchema = z.object({ full_name: z.string() });

const IssuesEvent = z.object({
  action: z.string(),
  issue: IssueSchema,
  repository: RepoSchema,
});

const CommentEvent = z.object({
  action: z.string(),
  issue: IssueSchema,
  comment: CommentSchema,
  repository: RepoSchema,
});

const MilestoneEvent = z.object({ action: z.string(), repository: RepoSchema });

export type WebhookOutcome = 'applied' | 'ignored' | 'invalid';

/** Applique un événement déjà authentifié. Les tickets inconnus du service sont ignorés. */
export function handleEvent(
  event: string,
  payload: unknown,
  deps: { service: ReportService; store: TicketStore; repo: string },
): WebhookOutcome {
  const sameRepo = (r: { full_name: string }) =>
    r.full_name.toLowerCase() === deps.repo.toLowerCase();
  switch (event) {
    case 'ping':
      return 'ignored';
    case 'issues': {
      const p = IssuesEvent.safeParse(payload);
      if (!p.success) return 'invalid';
      if (!sameRepo(p.data.repository)) return 'ignored';
      const row = deps.store.byIssue(p.data.issue.number);
      if (!row) return 'ignored';
      if (p.data.action === 'deleted' || p.data.action === 'transferred') {
        void deps.service.refresh(row).catch(() => undefined);
        return 'applied';
      }
      deps.service.applyIssue(row, p.data.issue);
      return 'applied';
    }
    case 'issue_comment': {
      const p = CommentEvent.safeParse(payload);
      if (!p.success) return 'invalid';
      if (!sameRepo(p.data.repository)) return 'ignored';
      const row = deps.store.byIssue(p.data.issue.number);
      if (!row) return 'ignored';
      deps.service.applyComment(row, p.data.comment, p.data.action === 'deleted');
      return 'applied';
    }
    case 'milestone': {
      const p = MilestoneEvent.safeParse(payload);
      if (!p.success) return 'invalid';
      if (!sameRepo(p.data.repository)) return 'ignored';
      // Titre de jalon modifié ou supprimé : les tickets corrigés seront relus à la prochaine lecture.
      deps.store.markStale('fixed');
      deps.service.invalidateKnown();
      return 'applied';
    }
    default:
      return 'ignored';
  }
}
