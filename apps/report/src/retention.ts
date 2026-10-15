import type { TicketStore } from './db';

/**
 * Conservation (D13) : contact effacé 30 jours après la clôture ; ticket (empreinte du jeton,
 * statut, réponses publiques) supprimé 12 mois après la clôture. Tâche quotidienne.
 */

const DAY = 24 * 3_600_000;
export const RETENTION = {
  contactAfterMs: 30 * DAY,
  ticketAfterMs: 365 * DAY,
  everyMs: DAY,
} as const;

export interface RetentionResult {
  contactsErased: number;
  ticketsDeleted: number;
}

export function runRetention(store: TicketStore, now: number): RetentionResult {
  return store.retention(now, RETENTION.contactAfterMs, RETENTION.ticketAfterMs);
}
