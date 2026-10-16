import { z } from 'zod';
import type {
  CaseId,
  DocumentId,
  EndingId,
  GroupId,
  HintId,
  KeywordId,
  OccupationId,
  PlaceId,
  PortraitId,
  SecretId,
  SlotId,
} from './ids';
import { IdSchema, MsSchema } from './ids';
import type { Locale } from './i18n';
import { LocaleSchema } from './i18n';

export const SAVE_SLOT_IDS = ['auto', 'slot-1', 'slot-2', 'slot-3', 'timed'] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];
/** Emplacements manuels (communs à toutes les affaires). */
export const MANUAL_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'] as const;
/**
 * Emplacements propres à chaque affaire (un exemplaire par affaire, rangé par la plateforme sous
 * `caseId`) : le secours automatique et la partie chronométrée (GAME_DESIGN §13.4).
 */
export const CASE_SLOT_IDS = ['auto', 'timed'] as const;
export type CaseSlotId = (typeof CASE_SLOT_IDS)[number];

/** Vrai pour un emplacement rangé par affaire (`auto`, `timed`). */
export function isCaseSlot(slot: SaveSlotId): slot is CaseSlotId {
  return (CASE_SLOT_IDS as readonly string[]).includes(slot);
}

export const GAME_MODES = ['standard', 'timed'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const EDITIONS = ['full', 'demo'] as const;
export type Edition = (typeof EDITIONS)[number];

/** Limites de la sauvegarde (§3.4). */
export const SAVE_LIMITS = {
  searchLog: 200,
  pins: 60,
  noteText: 2000,
  /** Longueur maximale d'une requête de recherche conservée. */
  query: 200,
  /** Rapports remis conservés (les plus récents). */
  reports: 20,
} as const;

export interface SlotGuess {
  given: string;
  family: string;
  portrait: PortraitId | null;
  occupation: OccupationId | null;
}

export interface Pin {
  kind: 'document' | 'keyword' | 'slot';
  id: string;
}

export type HighlightColor = 1 | 2 | 3 | 4 | 5;

export interface Highlight {
  doc: DocumentId;
  path: number[];
  start: number;
  end: number;
  color: HighlightColor;
  /**
   * Langue du texte surligné (les positions en dépendent). Absent = 'fr'. Un surlignage n'est
   * affiché que dans sa langue et conservé dans les autres, jamais retiré (D5).
   */
  lang?: Locale;
}

export interface Note {
  id: string;
  target?: Pin;
  /** ≤ 2000 */
  text: string;
  at: number;
}

export interface SearchLogEntry {
  query: string;
  keyword: KeywordId | null;
  at: number;
}

export interface Notebook {
  /** ≤ 60 */
  pins: Pin[];
  highlights: Highlight[];
  notes: Note[];
}

/** Fractionné du mode chronométré : temps de jeu à l'établissement complet d'un groupe. */
export interface TimedSplit {
  group: GroupId;
  elapsedMs: number;
}

/** Rapport final remis (une entrée par `finish`, dans l'ordre). */
export interface SubmittedReport {
  ending: EndingId;
  /** Réponses du rapport au moment de la remise : question → option. */
  answers: Record<string, string>;
  at: number;
  elapsedMs: number;
}

/** Première contestation d'une case revendiquée (AFFAIRE-2 §1.7), pour le Journal. */
export interface ContestedClaim {
  at: number;
  /** Champs retirés ou remplacés à ce moment. */
  fields: (keyof SlotGuess)[];
}

/**
 * Partie. Les champs facultatifs (`endedMs`, `reports`, `splits`, `contested`) sont venus après la
 * 1.5.0 : absents des sauvegardes antérieures et d'une partie neuve, ajoutés par le moteur au
 * besoin ; `parseSave` déduit `endedMs` et `reports` d'une sauvegarde 1.5.0 déjà dénouée.
 */
export interface SaveState {
  schemaVersion: 1;
  caseId: CaseId;
  contentHash: string;
  edition: Edition;
  slot: SaveSlotId;
  mode: GameMode;
  createdAt: number;
  updatedAt: number;
  elapsedMs: number;
  unlocked: Record<DocumentId, number>;
  read: Record<DocumentId, number>;
  searched: KeywordId[];
  /** ≤ 200 */
  searchLog: SearchLogEntry[];
  visited: PlaceId[];
  revealedSlots: SlotId[];
  tree: Record<SlotId, SlotGuess>;
  locked: Record<SlotId, number>;
  secrets: Record<SecretId, number>;
  hintsUsed: Record<HintId, number>;
  notebook: Notebook;
  /** Réponses au rapport final : question → option. */
  report: Record<string, string>;
  ending: EndingId | null;
  /**
   * Temps de jeu au **premier** dénouement : temps officiel du mode chronométré (le chrono s'y
   * fige, même si le joueur remet un autre rapport ensuite).
   */
  endedMs?: number;
  /** Rapports remis (≤ 20, les plus récents) : fins et décisions successives (Journal). */
  reports?: SubmittedReport[];
  /** Mode chronométré : fractionnés, un par groupe établi, dans l'ordre. */
  splits?: TimedSplit[];
  /** Cases revendiquées contestées (première contestation de la déclaration intacte). */
  contested?: Record<SlotId, ContestedClaim>;
}

export interface SaveSlotSummary {
  slot: SaveSlotId;
  /**
   * Affaire de la sauvegarde : l'UI associe les sauvegardes aux affaires par id, jamais par
   * `caseTitle` (qui dépend de la langue). Absent ou null : inconnu (résumé déjà écrit avant
   * l'i18n, ou emplacement manuel pas encore renseigné par la plateforme).
   */
  caseId?: CaseId | null;
  caseTitle: string;
  updatedAt: number;
  elapsedMs: number;
  mode: SaveState['mode'];
  /** [0, 1] */
  progress: number;
}

export const CONTENT_HASH = /^[0-9a-f]{8}$/;

export const SaveSlotIdSchema = z.enum(SAVE_SLOT_IDS);

export const SlotGuessSchema = z.strictObject({
  given: z.string().max(100),
  family: z.string().max(100),
  portrait: IdSchema.nullable(),
  occupation: IdSchema.nullable(),
});

export const PinSchema = z.strictObject({
  kind: z.enum(['document', 'keyword', 'slot']),
  id: IdSchema,
});

export const HighlightSchema = z
  .strictObject({
    doc: IdSchema,
    path: z.array(z.number().int().nonnegative()).min(1),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    color: z.literal([1, 2, 3, 4, 5]),
    lang: LocaleSchema.optional(),
  })
  .refine((h) => h.start < h.end, { error: 'start doit être < end', path: ['end'] });

export const NoteSchema = z.strictObject({
  id: z.string().min(1).max(64),
  target: PinSchema.optional(),
  text: z.string().max(SAVE_LIMITS.noteText),
  at: MsSchema,
});

export const SearchLogEntrySchema = z.strictObject({
  query: z.string().max(SAVE_LIMITS.query),
  keyword: IdSchema.nullable(),
  at: MsSchema,
});

export const NotebookSchema = z.strictObject({
  pins: z.array(PinSchema).max(SAVE_LIMITS.pins),
  highlights: z.array(HighlightSchema),
  notes: z.array(NoteSchema),
});

const GuessFieldSchema = z.enum(['given', 'family', 'portrait', 'occupation']);

export const TimedSplitSchema = z.strictObject({
  group: IdSchema,
  elapsedMs: MsSchema,
});

export const SubmittedReportSchema = z.strictObject({
  ending: IdSchema,
  answers: z.record(IdSchema, IdSchema),
  at: MsSchema,
  elapsedMs: MsSchema,
});

export const ContestedClaimSchema = z.strictObject({
  at: MsSchema,
  fields: z.array(GuessFieldSchema).max(4),
});

export const SaveStateSchema = z.strictObject({
  schemaVersion: z.literal(1),
  caseId: IdSchema,
  contentHash: z.string().regex(CONTENT_HASH),
  edition: z.enum(EDITIONS),
  slot: SaveSlotIdSchema,
  mode: z.enum(GAME_MODES),
  createdAt: MsSchema,
  updatedAt: MsSchema,
  elapsedMs: MsSchema,
  unlocked: z.record(IdSchema, MsSchema),
  read: z.record(IdSchema, MsSchema),
  searched: z.array(IdSchema),
  searchLog: z.array(SearchLogEntrySchema).max(SAVE_LIMITS.searchLog),
  visited: z.array(IdSchema),
  revealedSlots: z.array(IdSchema),
  tree: z.record(IdSchema, SlotGuessSchema),
  locked: z.record(IdSchema, MsSchema),
  secrets: z.record(IdSchema, MsSchema),
  hintsUsed: z.record(IdSchema, MsSchema),
  notebook: NotebookSchema,
  report: z.record(IdSchema, IdSchema),
  ending: IdSchema.nullable(),
  endedMs: MsSchema.optional(),
  reports: z.array(SubmittedReportSchema).max(SAVE_LIMITS.reports).optional(),
  splits: z.array(TimedSplitSchema).max(200).optional(),
  contested: z.record(IdSchema, ContestedClaimSchema).optional(),
});
