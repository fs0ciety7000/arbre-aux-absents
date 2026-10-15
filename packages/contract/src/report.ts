import { z } from 'zod';
import type { CaseId } from './ids';
import { IdSchema, MsSchema, SEMVER } from './ids';
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

/** Statuts d'un ticket ouvert (ni corrigé ni classé) : ceux de la liste publique. */
export const OPEN_TICKET_STATUSES = [
  'received',
  'confirmed',
  'in-progress',
] as const satisfies readonly TicketStatus[];
export type OpenTicketStatus = (typeof OPEN_TICKET_STATUSES)[number];

export const TICKET_CLOSED_REASONS = ['resolved', 'duplicate', 'not-planned'] as const;
export type TicketClosedReason = (typeof TICKET_CLOSED_REASONS)[number];

export const REPORT_SOURCES = ['game', 'site'] as const;
export type ReportSource = (typeof REPORT_SOURCES)[number];

export const REPORT_PLATFORMS = ['web', 'desktop', 'android', 'site'] as const;
export type ReportPlatform = (typeof REPORT_PLATFORMS)[number];

/** Plateformes du jeu, déclarées depuis le formulaire du site (`ReportDiagnostics.gamePlatform`). */
export const GAME_PLATFORMS = ['web', 'desktop', 'android'] as const;
export type GamePlatform = (typeof GAME_PLATFORMS)[number];

/** Version du jeu déclarée depuis le site (semver, ≤ 40) : `1.3.1`, `1.4.0-beta.2`. */
export const GAME_VERSION = SEMVER;

/**
 * Captures d'écran jointes à un signalement (`POST /v1/attachments`, ARCHITECTURE §8).
 * PNG, JPEG ou WebP vérifiés par octets magiques ; métadonnées (EXIF, XMP, textes) retirées.
 */
export const ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

/** Identifiant d'une pièce jointe : 128 bits en base64url (22 caractères), non devinable. */
export const ATTACHMENT_ID = /^[A-Za-z0-9_-]{22}$/;

export const ATTACHMENT_LIMITS = {
  /** Pièces par signalement. */
  perReport: 3,
  /** Corps d'un `POST /v1/attachments`, en octets (2 Mio). */
  bytes: 2 * 1024 * 1024,
  /** Côté maximal, en pixels (lu dans l'en-tête de l'image). */
  side: 8192,
  /** Surface maximale, en pixels (≈ 5K × 3K, au-delà : 413 `tooLarge`). */
  pixels: 40_000_000,
  /** Une pièce non rattachée à un signalement dans ce délai est supprimée (1 h). */
  unattachedTtlMs: 3_600_000,
} as const;

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
  /** Plafond de la liste publique des tickets ouverts (`GET /v1/tickets`), les plus récents. */
  openTickets: 200,
} as const;

export interface ReportDiagnostics {
  appVersion: string;
  edition: 'full' | 'demo';
  platform: ReportPlatform;
  /** Famille grossière (« Windows », « Android »…), jamais la chaîne User-Agent complète (`osFamily`). */
  os?: string;
  /**
   * Navigateur ou moteur intégré et version majeure (« Firefox 131 », « Safari 18 »,
   * « WebView Android 129 », « Tauri (WebKitGTK) »), jamais l'User-Agent complet (`browserFamily`).
   */
  browser?: string;
  /** Signalement depuis le site (`platform: 'site'`) seulement : version du jeu choisie par le joueur. */
  gameVersion?: string;
  /** Signalement depuis le site seulement : plateforme du jeu choisie par le joueur. */
  gamePlatform?: GamePlatform;
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
  /**
   * 20 à 4000 caractères de Markdown GitHub (gras, italique, listes, citations, code, liens),
   * rendu tel quel dans le ticket privé ; mentions `@`, références `#123`, images et HTML y sont
   * neutralisés. Jamais réaffiché au joueur ni publié.
   */
  description: string;
  /** ≤ 200, jamais publié ni envoyé à GitHub. */
  contact?: string;
  locale: Locale;
  diagnostics: ReportDiagnostics;
  /** Pot de miel : doit être vide. */
  website: string;
  /** Temps passé sur le formulaire, ≥ 3000. */
  elapsedMs: number;
  /**
   * Pièces jointes déjà envoyées (`POST /v1/attachments` → `id`), 3 au plus, sans doublon, dans
   * l'ordre d'affichage. Une pièce inconnue, expirée (> 1 h) ou déjà rattachée est ignorée sans
   * faire échouer le signalement (`ReportReceipt.attachments` dit combien ont été jointes).
   */
  attachments?: string[];
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
  /** Présent seulement si `ReportSubmission.attachments` était fourni : pièces effectivement jointes. */
  attachments?: number;
}

/** Réponse de `POST /v1/attachments` (201). */
export interface AttachmentReceipt {
  /** À reporter dans `ReportSubmission.attachments`. Sert aussi à `DELETE /v1/attachments/<id>`. */
  id: string;
  type: AttachmentType;
  width: number;
  height: number;
  /** Taille stockée, métadonnées retirées. */
  bytes: number;
  /** Au-delà (ms epoch), une pièce non rattachée est supprimée : la renvoyer avant le signalement. */
  expiresAt: number;
}

/** Pièce jointe vue par l'auteur du signalement (`TicketView.attachments`). */
export interface TicketAttachment {
  id: string;
  /** URL signée (`GET /v1/attachments/<id>?sig=…`), utilisable telle quelle dans `<img src>`. */
  url: string;
  type: AttachmentType;
  width: number;
  height: number;
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
  /**
   * Captures jointes, seulement pour l'auteur (jeton) et seulement s'il y en a : absent sinon
   * (les builds du jeu antérieurs à ce champ valident `TicketView` strictement). Jamais dans
   * `GET /v1/tickets` ni dans les problèmes connus.
   */
  attachments?: TicketAttachment[];
}

export interface KnownIssue {
  ticket: string;
  title: string;
  status: TicketStatus;
  fixedIn?: string;
  updatedAt: number;
}

/**
 * Ligne de la liste publique des tickets ouverts (`GET /v1/tickets`). Jamais le texte du joueur
 * (description, contact, diagnostics, sauvegarde), ni le titre GitHub brut, ni aucun jeton.
 */
export interface OpenTicket {
  ticket: string;
  category: ReportCategory;
  status: OpenTicketStatus;
  source: ReportSource;
  createdAt: number;
  updatedAt: number;
  /**
   * Titre relu par l'équipe, seulement si le ticket porte l'étiquette `public` (même titre que
   * les problèmes connus, `/public-title-en` en anglais) ; absent sinon.
   */
  title?: string;
}

export interface ReportErrorBody {
  error: ReportErrorCode;
}

export const ReportCategorySchema = z.enum(REPORT_CATEGORIES);
export const TicketStatusSchema = z.enum(TICKET_STATUSES);
export const TicketClosedReasonSchema = z.enum(TICKET_CLOSED_REASONS);
export const ReportErrorCodeSchema = z.enum(REPORT_ERROR_CODES);

const ShortText = (max: number) => z.string().max(max);

export const AttachmentTypeSchema = z.enum(ATTACHMENT_TYPES);
export const AttachmentIdSchema = z.string().regex(ATTACHMENT_ID);

export const ReportDiagnosticsSchema = z
  .strictObject({
    appVersion: ShortText(40),
    edition: z.enum(['full', 'demo']),
    platform: z.enum(REPORT_PLATFORMS),
    os: ShortText(40).optional(),
    browser: ShortText(40).optional(),
    gameVersion: z.string().max(40).regex(GAME_VERSION).optional(),
    gamePlatform: z.enum(GAME_PLATFORMS).optional(),
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
  })
  .refine(
    (d) => d.platform === 'site' || (d.gameVersion === undefined && d.gamePlatform === undefined),
    { error: 'gameVersion et gamePlatform : signalements depuis le site seulement' },
  );

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
  attachments: z
    .array(AttachmentIdSchema)
    .max(ATTACHMENT_LIMITS.perReport)
    .refine((ids) => new Set(ids).size === ids.length, { error: 'Pièces jointes en double' })
    .optional(),
});

export const ReportReceiptSchema = z.strictObject({
  ticket: TicketNumberSchema,
  token: ReportTokenSchema,
  followUrl: z.url({ protocol: /^https?$/ }),
  attachments: z.number().int().min(0).max(ATTACHMENT_LIMITS.perReport).optional(),
});

const Side = z.number().int().min(1).max(ATTACHMENT_LIMITS.side);

export const AttachmentReceiptSchema = z.strictObject({
  id: AttachmentIdSchema,
  type: AttachmentTypeSchema,
  width: Side,
  height: Side,
  bytes: z.number().int().min(1).max(ATTACHMENT_LIMITS.bytes),
  expiresAt: MsSchema,
});

export const TicketAttachmentSchema = z.strictObject({
  id: AttachmentIdSchema,
  url: z.url({ protocol: /^https?$/ }),
  type: AttachmentTypeSchema,
  width: Side,
  height: Side,
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
  attachments: z.array(TicketAttachmentSchema).max(ATTACHMENT_LIMITS.perReport).optional(),
});

export const KnownIssueSchema = z.strictObject({
  ticket: TicketNumberSchema,
  title: z.string().min(1).max(200),
  status: TicketStatusSchema,
  fixedIn: ShortText(40).optional(),
  updatedAt: MsSchema,
});

export const KnownIssuesSchema = z.array(KnownIssueSchema);

export const OpenTicketSchema = z.strictObject({
  ticket: TicketNumberSchema,
  category: ReportCategorySchema,
  status: z.enum(OPEN_TICKET_STATUSES),
  source: z.enum(REPORT_SOURCES),
  createdAt: MsSchema,
  updatedAt: MsSchema,
  title: z.string().min(1).max(200).optional(),
});

export const OpenTicketsSchema = z.array(OpenTicketSchema).max(REPORT_LIMITS.openTickets);

export const ReportErrorBodySchema = z.strictObject({ error: ReportErrorCodeSchema });
