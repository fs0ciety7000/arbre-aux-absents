import { z } from 'zod';
import type { CaseId } from './ids';
import { IdSchema, MsSchema } from './ids';
import type { Locale } from './i18n';
import { LocaleSchema } from './i18n';
import { ReportTokenSchema, TicketNumberSchema } from './report-ref';
import type { Settings } from './settings';
import { SettingsSchema } from './settings';

/**
 * Signalement de problèmes avec suivi (ARCHITECTURE §8). Partagé par le jeu, le site et le
 * service `apps/report`. Aucune IP, aucun contact publié, jeton stocké haché côté service.
 */
export const REPORT_CATEGORIES = [
  'bug',
  'blocked',
  'text',
  'display',
  'audio',
  'controls',
  'performance',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const TICKET_STATUSES = ['received', 'confirmed', 'in-progress', 'fixed', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CLOSED_REASONS = ['resolved', 'duplicate', 'not-planned'] as const;
export type TicketClosedReason = (typeof TICKET_CLOSED_REASONS)[number];

export const REPORT_SOURCES = ['game', 'site'] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

export const REPORT_PLATFORMS = ['web', 'desktop', 'android', 'site'] as const;
export type ReportPlatform = (typeof REPORT_PLATFORMS)[number];

export type ReportErrorCode = 'invalid' | 'tooLarge' | 'rateLimited' | 'disabled' | 'unavailable';
export const REPORT_ERROR_CODES = [
  'invalid',
  'tooLarge',
  'rateLimited',
  'disabled',
  'unavailable',
] as const satisfies readonly ReportErrorCode[];

/** Limites du signalement (validées par le client et par le service). */
export const REPORT_LIMITS = {
  descriptionMin: 20,
  descriptionMax: 4000,
  contact: 200,
  /** JSON de la sauvegarde anonymisée jointe, en caractères. */
  saveJson: 48 * 1024,
  /** Corps HTTP d'un POST /v1/reports, en octets. */
  body: 64 * 1024,
  /** Délai minimal entre l'ouverture du formulaire et l'envoi (anti-robot). */
  minElapsedMs: 3000,
  reply: 2000,
} as const;

export interface ReportDiagnostics {
  appVersion: string;
  edition: 'full' | 'demo';
  platform: ReportPlatform;
  /** Famille grossière (« Windows », « Android »…), jamais la chaîne User-Agent complète. */
  os?: string;
  locale: Locale;
  caseId?: CaseId;
  contentHash?: string;
  viewport: { w: number; h: number; dpr: number };
  settings?: Partial<Settings>;
  /** Sauvegarde anonymisée (sans `notes.text` ni `searchLog.query`), JSON ≤ 48 Ko. */
  save?: unknown;
}

export interface ReportSubmission {
  source: ReportSource;
  category: ReportCategory;
  /** 20 à 4000 caractères. */
  description: string;
  /** ≤ 200, jamais publié ni envoyé à GitHub. */
  contact?: string;
  locale: Locale;
  diagnostics: ReportDiagnostics;
  /** Pot de miel : doit être vide. */
  website: string;
  /** Temps passé sur le formulaire, ≥ 3000. */
  elapsedMs: number;
}

export interface ReportReceipt {
  /** `AA-0042` */
  ticket: string;
  /** 22 caractères base64url. */
  token: string;
  /**
   * Page de suivi dans la langue du signalement (`locale`) : `<site>/suivi/#<jeton>` en français,
   * `<site>/en/suivi/#<jeton>` en anglais. Jeton dans le fragment (ni journaux ni Referer).
   */
  followUrl: string;
}

export interface TicketReply {
  at: number;
  text: string;
}

export interface TicketView {
  ticket: string;
  status: TicketStatus;
  fixedIn?: string;
  closedReason?: TicketClosedReason;
  category: ReportCategory;
  createdAt: number;
  updatedAt: number;
  replies: TicketReply[];
}

export interface KnownIssue {
  ticket: string;
  title: string;
  status: TicketStatus;
  fixedIn?: string;
  updatedAt: number;
}

export interface ReportErrorBody {
  error: ReportErrorCode;
}

export const ReportCategorySchema = z.enum(REPORT_CATEGORIES);
export const TicketStatusSchema = z.enum(TICKET_STATUSES);
export const TicketClosedReasonSchema = z.enum(TICKET_CLOSED_REASONS);
export const ReportErrorCodeSchema = z.enum(REPORT_ERROR_CODES);

const ShortText = (max: number) => z.string().max(max);

export const ReportDiagnosticsSchema = z.strictObject({
  appVersion: ShortText(40),
  edition: z.enum(['full', 'demo']),
  platform: z.enum(REPORT_PLATFORMS),
  os: ShortText(40).optional(),
  locale: LocaleSchema,
  caseId: IdSchema.optional(),
  contentHash: z
    .string()
    .regex(/^[0-9a-f]{8}$/)
    .optional(),
  viewport: z.strictObject({
    w: z.number().int().nonnegative().max(100_000),
    h: z.number().int().nonnegative().max(100_000),
    dpr: z.number().positive().max(16),
  }),
  settings: SettingsSchema.partial().optional(),
  save: z
    .unknown()
    .refine(
      (v) => {
        if (v === undefined) return true;
        try {
          const json = JSON.stringify(v);
          return json !== undefined && json.length <= REPORT_LIMITS.saveJson;
        } catch {
          return false;
        }
      },
      { error: `Sauvegarde jointe trop volumineuse (≤ ${REPORT_LIMITS.saveJson} caractères)` },
    )
    .optional(),
});

export const ReportSubmissionSchema = z.strictObject({
  source: z.enum(REPORT_SOURCES),
  category: ReportCategorySchema,
  description: z
    .string()
    .trim()
    .min(REPORT_LIMITS.descriptionMin)
    .max(REPORT_LIMITS.descriptionMax),
  contact: z.string().trim().max(REPORT_LIMITS.contact).optional(),
  locale: LocaleSchema,
  diagnostics: ReportDiagnosticsSchema,
  website: z.string().max(200),
  elapsedMs: MsSchema,
});

export const ReportReceiptSchema = z.strictObject({
  ticket: TicketNumberSchema,
  token: ReportTokenSchema,
  followUrl: z.url({ protocol: /^https?$/ }),
});

export const TicketReplySchema = z.strictObject({
  at: MsSchema,
  text: z.string().max(REPORT_LIMITS.reply),
});

export const TicketViewSchema = z.strictObject({
  ticket: TicketNumberSchema,
  status: TicketStatusSchema,
  fixedIn: ShortText(40).optional(),
  closedReason: TicketClosedReasonSchema.optional(),
  category: ReportCategorySchema,
  createdAt: MsSchema,
  updatedAt: MsSchema,
  replies: z.array(TicketReplySchema),
});

export const KnownIssueSchema = z.strictObject({
  ticket: TicketNumberSchema,
  title: z.string().min(1).max(200),
  status: TicketStatusSchema,
  fixedIn: ShortText(40).optional(),
  updatedAt: MsSchema,
});

export const KnownIssuesSchema = z.array(KnownIssueSchema);

export const ReportErrorBodySchema = z.strictObject({ error: ReportErrorCodeSchema });
