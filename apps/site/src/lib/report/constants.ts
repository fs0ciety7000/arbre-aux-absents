/**
 * Constantes du signalement utilisées par le code client du site (ARCHITECTURE §8).
 *
 * Recopiées de `@arbre/contract` (`report.ts`, `report-ref.ts`) plutôt qu'importées : le paquet
 * du contrat n'est pas marqué sans effet de bord et chaque import d'exécution entraînerait zod et
 * ses schémas dans le JS des pages hydratées. Les types restent ceux du contrat (`satisfies`) et
 * `report.test.ts` vérifie que les valeurs sont identiques.
 */
import type {
  ReportCategory,
  ReportErrorCode,
  TicketClosedReason,
  TicketStatus,
} from '@arbre/contract';

export const CATEGORIES = [
  'bug',
  'blocked',
  'text',
  'display',
  'audio',
  'controls',
  'performance',
  'other',
] as const satisfies readonly ReportCategory[];

export const STATUSES = [
  'received',
  'confirmed',
  'in-progress',
  'fixed',
  'closed',
] as const satisfies readonly TicketStatus[];

export const CLOSED_REASONS = [
  'resolved',
  'duplicate',
  'not-planned',
] as const satisfies readonly TicketClosedReason[];

export const ERROR_CODES = [
  'invalid',
  'tooLarge',
  'rateLimited',
  'disabled',
  'unavailable',
] as const satisfies readonly ReportErrorCode[];

/** Sous-ensemble de `REPORT_LIMITS` utile au site. */
export const LIMITS = {
  descriptionMin: 20,
  descriptionMax: 4000,
  contact: 200,
  body: 64 * 1024,
  minElapsedMs: 3000,
  reply: 2000,
} as const;

/** `TICKET_NUMBER` et `REPORT_TOKEN` du contrat. */
export const TICKET_NUMBER = /^[A-Z]{1,8}-\d{4,}$/;
export const REPORT_TOKEN = /^[A-Za-z0-9_-]{22}$/;
