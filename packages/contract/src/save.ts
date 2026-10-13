import { z } from 'zod';
import type {
  CaseId,
  DocumentId,
  EndingId,
  HintId,
  KeywordId,
  OccupationId,
  PlaceId,
  PortraitId,
  SecretId,
  SlotId,
} from './ids';
import { IdSchema, MsSchema } from './ids';

export const SAVE_SLOT_IDS = ['auto', 'slot-1', 'slot-2', 'slot-3'] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

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
}

export interface SaveSlotSummary {
  slot: SaveSlotId;
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
});
