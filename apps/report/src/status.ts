import type { TicketClosedReason, TicketStatus } from '@arbre/contract';
import { REPORT_LIMITS } from '@arbre/contract';

/**
 * Règles pures : statut affiché à partir d'un ticket GitHub (ARCHITECTURE §8, table des
 * statuts), réponses publiques et titre anglais des problèmes connus.
 */

export const STATUS_LABELS = {
  confirmed: 'statut:confirmé',
  inProgress: 'statut:en-cours',
  duplicate: 'doublon',
  public: 'public',
} as const;

/** Associations GitHub autorisées à publier une réponse ou un titre (mainteneurs). */
export const MAINTAINER_ASSOCIATIONS: ReadonlySet<string> = new Set([
  'OWNER',
  'MEMBER',
  'COLLABORATOR',
]);

/** Jalon de version : `v1.2.3` (suffixe toléré : `v1.2.3-beta`). */
const VERSION_MILESTONE = /^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export interface IssueFacts {
  state: 'open' | 'closed';
  stateReason?: string | null;
  labels: readonly string[];
  assigned: boolean;
  milestone?: string | null;
}

export interface DisplayedStatus {
  status: TicketStatus;
  fixedIn?: string;
  closedReason?: TicketClosedReason;
}

export const normalizeLabel = (l: string): string => l.normalize('NFC').trim().toLowerCase();

export function hasLabel(labels: readonly string[], label: string): boolean {
  const wanted = normalizeLabel(label);
  return labels.some((l) => normalizeLabel(l) === wanted);
}

export function mapStatus(issue: IssueFacts): DisplayedStatus {
  if (hasLabel(issue.labels, STATUS_LABELS.duplicate)) {
    return { status: 'closed', closedReason: 'duplicate' };
  }
  if (issue.state === 'closed') {
    if (issue.stateReason === 'not_planned')
      return { status: 'closed', closedReason: 'not-planned' };
    const milestone = issue.milestone?.trim();
    if (milestone && VERSION_MILESTONE.test(milestone)) {
      return { status: 'fixed', fixedIn: milestone.slice(0, 40) };
    }
    return { status: 'closed', closedReason: 'resolved' };
  }
  if (issue.assigned || hasLabel(issue.labels, STATUS_LABELS.inProgress)) {
    return { status: 'in-progress' };
  }
  if (hasLabel(issue.labels, STATUS_LABELS.confirmed)) return { status: 'confirmed' };
  return { status: 'received' };
}

export const isClosedStatus = (s: TicketStatus): boolean => s === 'fixed' || s === 'closed';

/** Marqueur d'un commentaire de mainteneur, gardé dans `replies_json`. */
export interface Marker {
  /** id du commentaire GitHub (mise à jour et suppression par webhook). */
  id: number;
  kind: 'reply' | 'title-en';
  at: number;
  text: string;
}

export interface CommentFacts {
  id: number;
  body: string | null | undefined;
  authorAssociation: string;
  createdAt: number;
}

// Caractères de contrôle (sauf \n et \t) et caractères bidirectionnels : retirés du texte public.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F‎‏‪-‮⁦-⁩]/g;

export function plainText(s: string, max: number): string {
  const clean = s.replace(/\r\n?/g, '\n').replace(CONTROL, '').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/**
 * Commentaire → marqueur public, ou `undefined`. Première ligne `/public` (réponse) ou
 * `/public-title-en <titre>` (titre anglais), **et** auteur mainteneur : sur un dépôt public,
 * n'importe qui pourrait écrire le marqueur.
 */
export function parseMarker(c: CommentFacts): Marker | undefined {
  if (!MAINTAINER_ASSOCIATIONS.has(c.authorAssociation)) return undefined;
  const body = (c.body ?? '').replace(/\r\n?/g, '\n');
  const nl = body.indexOf('\n');
  const first = (nl === -1 ? body : body.slice(0, nl)).trim();
  const rest = nl === -1 ? '' : body.slice(nl + 1);
  if (first === '/public') {
    const text = plainText(rest, REPORT_LIMITS.reply);
    return text ? { id: c.id, kind: 'reply', at: c.createdAt, text } : undefined;
  }
  const m = /^\/public-title-en(?:\s+(.*))?$/.exec(first);
  if (m) {
    const text = plainText((m[1] ?? rest.split('\n')[0] ?? '').replace(/\s+/g, ' '), 200);
    return text ? { id: c.id, kind: 'title-en', at: c.createdAt, text } : undefined;
  }
  return undefined;
}

/** Ajoute, remplace ou retire le marqueur d'un commentaire ; trié par date. */
export function upsertMarker(
  markers: readonly Marker[],
  commentId: number,
  marker: Marker | undefined,
): Marker[] {
  const next = markers.filter((m) => m.id !== commentId);
  if (marker) next.push(marker);
  return next.sort((a, b) => a.at - b.at || a.id - b.id);
}

export function publicReplies(markers: readonly Marker[]): { at: number; text: string }[] {
  return markers.filter((m) => m.kind === 'reply').map(({ at, text }) => ({ at, text }));
}

/** Dernier titre anglais publié par un mainteneur. */
export function titleEn(markers: readonly Marker[]): string | undefined {
  return markers.filter((m) => m.kind === 'title-en').at(-1)?.text;
}
