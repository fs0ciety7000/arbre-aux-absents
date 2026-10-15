/**
 * Constantes du signalement utilisées par le code client du site (ARCHITECTURE §8).
 *
 * Recopiées de `@arbre/contract` (`report.ts`, `report-ref.ts`) plutôt qu'importées : le paquet
 * du contrat n'est pas marqué sans effet de bord et chaque import d'exécution entraînerait zod et
 * ses schémas dans le JS des pages hydratées. Les types restent ceux du contrat (`satisfies`) et
 * `report.test.ts` vérifie que les valeurs sont identiques.
 */
import type {
  AttachmentType,
  GamePlatform,
  OpenTicketStatus,
  ReportCategory,
  ReportSource,
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

export const OPEN_STATUSES = [
  'received',
  'confirmed',
  'in-progress',
] as const satisfies readonly OpenTicketStatus[];

export const SOURCES = ['game', 'site'] as const satisfies readonly ReportSource[];

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
  openTickets: 200,
} as const;

/** `TICKET_NUMBER` et `REPORT_TOKEN` du contrat. */
export const TICKET_NUMBER = /^[A-Z]{1,8}-\d{4,}$/;
export const REPORT_TOKEN = /^[A-Za-z0-9_-]{22}$/;

/** `ATTACHMENT_TYPES`, `ATTACHMENT_ID` et `ATTACHMENT_LIMITS` du contrat (captures d'écran). */
export const ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const satisfies readonly AttachmentType[];
export const ATTACHMENT_ID = /^[A-Za-z0-9_-]{22}$/;
export const ATTACHMENT_LIMITS = {
  perReport: 3,
  bytes: 2 * 1024 * 1024,
  side: 8192,
  pixels: 40_000_000,
  unattachedTtlMs: 3_600_000,
} as const;

/** `GAME_PLATFORMS` et `GAME_VERSION` (semver) du contrat : version et plateforme déclarées. */
export const GAME_PLATFORMS = [
  'web',
  'desktop',
  'android',
] as const satisfies readonly GamePlatform[];
export const GAME_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
