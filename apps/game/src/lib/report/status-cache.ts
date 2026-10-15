/**
 * Dernier statut connu de chaque signalement (DESIGN §13.9 : hors ligne, la frise garde le dernier
 * statut connu, « vu le 12 oct. »). Simple commodité de l'appareil : `localStorage`, jamais le
 * jeton, aucune donnée du joueur ; tout accès est protégé (stockage bloqué, iframe purgée) et le
 * jeu fonctionne sans.
 */
import {
  TICKET_CLOSED_REASONS,
  TICKET_NUMBER,
  TICKET_STATUSES,
  type TicketClosedReason,
  type TicketStatus,
  type TicketView,
} from '@arbre/contract';

export interface KnownStatus {
  status: TicketStatus;
  fixedIn?: string;
  closedReason?: TicketClosedReason;
  /** Date de la dernière lecture réussie. */
  seenAt: number;
}

const KEY = 'arbre-aux-absents:report-status';

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function storage(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isKnown(v: unknown): v is KnownStatus {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    (TICKET_STATUSES as readonly unknown[]).includes(o.status) &&
    typeof o.seenAt === 'number' &&
    (o.fixedIn === undefined || (typeof o.fixedIn === 'string' && o.fixedIn.length <= 40)) &&
    (o.closedReason === undefined ||
      (TICKET_CLOSED_REASONS as readonly unknown[]).includes(o.closedReason))
  );
}

/** Tous les statuts connus, par numéro de ticket. */
export function readStatuses(store: Store | null = storage()): Record<string, KnownStatus> {
  try {
    const raw: unknown = JSON.parse(store?.getItem(KEY) ?? '{}');
    if (!raw || typeof raw !== 'object') return {};
    const out: Record<string, KnownStatus> = {};
    for (const [ticket, v] of Object.entries(raw)) {
      if (TICKET_NUMBER.test(ticket) && isKnown(v)) out[ticket] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function write(map: Record<string, KnownStatus>, store: Store | null): void {
  try {
    store?.setItem(KEY, JSON.stringify(map));
  } catch {
    /* stockage plein ou bloqué : le statut sera relu en ligne */
  }
}

/** Mémorise le statut lu ; `keep` : tickets encore référencés (les autres sont oubliés). */
export function rememberStatus(
  view: TicketView,
  at: number,
  keep: readonly string[],
  store: Store | null = storage(),
): void {
  const map = readStatuses(store);
  const next: Record<string, KnownStatus> = {};
  for (const t of keep) if (map[t]) next[t] = map[t];
  next[view.ticket] = {
    status: view.status,
    ...(view.fixedIn ? { fixedIn: view.fixedIn } : {}),
    ...(view.closedReason ? { closedReason: view.closedReason } : {}),
    seenAt: at,
  };
  write(next, store);
}

/** Oublie le statut d'un ticket (supprimé). */
export function forgetStatus(ticket: string, store: Store | null = storage()): void {
  const map = readStatuses(store);
  if (!(ticket in map)) return;
  delete map[ticket];
  write(map, store);
}
