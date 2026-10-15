import type { CompiledCase } from './compiled';
import type { Condition } from './condition';
import type {
  AchievementId,
  DocumentId,
  EndingId,
  GroupId,
  HintId,
  KeywordId,
  PlaceId,
  SecretId,
  SlotId,
} from './ids';
import type {
  GameMode,
  Highlight,
  Pin,
  SaveSlotId,
  SaveSlotSummary,
  SaveState,
  SlotGuess,
} from './save';
import type { Profile } from './settings';

/** Borne de `tick.deltaMs` : [0, 5000]. */
export const MAX_TICK_MS = 5000;

export type Action =
  | { type: 'openDocument'; id: DocumentId; at: number }
  | { type: 'search'; query: string; at: number }
  | { type: 'visitPlace'; id: PlaceId; at: number }
  | { type: 'setSlot'; slot: SlotId; patch: Partial<SlotGuess>; at: number }
  | { type: 'clearSlot'; slot: SlotId; at: number }
  | { type: 'validate'; at: number }
  | { type: 'pin' | 'unpin'; target: Pin; at: number }
  | { type: 'highlight'; h: Highlight; at: number }
  | { type: 'removeHighlight'; index: number; at: number }
  | { type: 'note'; id?: string; target?: Pin; text: string; at: number }
  | { type: 'deleteNote'; id: string; at: number }
  | { type: 'useHint'; id: HintId; at: number }
  /** Borné à [0, 5000]. */
  | { type: 'tick'; deltaMs: number }
  | { type: 'answer'; question: string; option: string; at: number }
  | { type: 'finish'; at: number };

export type ActionType = Action['type'];

export interface SearchOutcome {
  query: string;
  normalized: string;
  keyword: KeywordId | null;
  documents: DocumentId[];
  newDocuments: DocumentId[];
}

export type RejectReason = 'unknownId' | 'slotLocked' | 'notAvailable' | 'tooLong' | 'limit';

export type GameEvent =
  | { type: 'documentsUnlocked'; ids: DocumentId[] }
  | { type: 'searchResult'; outcome: SearchOutcome }
  | { type: 'slotsRevealed'; ids: SlotId[] }
  | { type: 'slotsLocked'; ids: SlotId[]; groups: GroupId[] }
  /** Aucun détail par case. */
  | { type: 'validationFailed' }
  | { type: 'secretFound'; id: SecretId }
  | { type: 'endingReached'; id: EndingId }
  | { type: 'rejected'; reason: RejectReason };

export type GameEventType = GameEvent['type'];

export interface NewGameOptions {
  slot: SaveSlotId;
  mode: GameMode;
  at: number;
}

export interface Transition {
  state: SaveState;
  events: GameEvent[];
}

export interface ValidationResult {
  lock: SlotId[];
  groups: GroupId[];
}

export const PARSE_SAVE_ERROR_CODES = [
  'tooLarge',
  'invalidJson',
  'notObject',
  'noVersion',
  'newerVersion',
  'migrationFailed',
  'corrupt',
  'otherCase',
] as const;
/** Cause d'un échec de `parseSave`, pour un message localisé (l'UI ne lit jamais `error`). */
export type ParseSaveErrorCode = (typeof PARSE_SAVE_ERROR_CODES)[number];

export type ParseSaveResult =
  | { ok: true; state: SaveState; dropped: string[] }
  | {
      ok: false;
      /** Message technique (français), pour les journaux. */
      error: string;
      code: ParseSaveErrorCode;
    };

/**
 * Signatures du moteur pur (`packages/engine`) : déterministe, le temps arrive par `at`,
 * aucune exception sur une action valide, aucune mutation. Les sélecteurs
 * (knownKeywords, availablePortraits…) ne sont pas encore figés par §3.5.
 */
export interface EngineApi {
  /** NFD, sans diacritiques, minuscules, ponctuation → espace. */
  normalize(text: string): string;
  newGame(c: CompiledCase, options: NewGameOptions): SaveState;
  /** En validation auto, `setSlot` déclenche `validate`. */
  applyAction(s: SaveState, a: Action, c: CompiledCase): Transition;
  /** Correspondance exacte du terme normalisé, sans flou. */
  search(query: string, s: SaveState, c: CompiledCase): SearchOutcome;
  validate(s: SaveState, c: CompiledCase): ValidationResult;
  /** Point fixe des déblocages. */
  settle(s: SaveState, c: CompiledCase): Transition;
  evaluate(cond: Condition, s: SaveState, c: CompiledCase): boolean;
  evaluateAchievements(s: SaveState, profile: Profile, c: CompiledCase): AchievementId[];
  parseSave(raw: unknown, c: CompiledCase): ParseSaveResult;
  summarize(s: SaveState, c: CompiledCase): SaveSlotSummary;
}
