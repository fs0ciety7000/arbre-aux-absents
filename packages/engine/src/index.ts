/**
 * Moteur pur de L'Arbre aux absents (ARCHITECTURE §3.5) : déterministe, le temps arrive
 * par `at`, aucune exception sur une action, aucune mutation. Le moteur ne connaît aucun
 * id d'affaire : tout vient du `CompiledCase`.
 */
import type { EngineApi } from '@arbre/contract';
import { applyAction, newGame } from './actions';
import { evaluateAchievements } from './achievements';
import { evaluate } from './conditions';
import { normalize } from './normalize';
import { parseSave, summarize } from './save';
import { search } from './search';
import { settle } from './settle';
import { validate } from './validation';

export type { EngineApi } from '@arbre/contract';

export { ANSWER_FIELDS, cyrb53, hashAnswer, normalize, type AnswerField } from './normalize';
export { evaluate, evaluateAchievementCondition } from './conditions';
export { evaluateAchievements } from './achievements';
export {
  applyAction,
  ENGINE_LIMITS,
  newGame,
  toMs,
  type ApplyOptions,
  type EngineTransition,
} from './actions';
export { MIN_QUERY_LENGTH, search } from './search';
export { settle } from './settle';
export {
  emptyGuard,
  groupCorrectCount,
  groupOf,
  groupThreshold,
  inPlaySlots,
  isComplete,
  isSlotCorrect,
  isSlotVisible,
  isSuspended,
  recordChanges,
  SWEEP_MAX_CHANGES,
  SWEEP_SUSPEND_MS,
  SWEEP_WINDOW_MS,
  validate,
  type CompleteGuess,
  type SweepGuard,
  type ValidateOptions,
} from './validation';
export {
  availableNames,
  availableOccupations,
  availablePortraits,
  endingFor,
  endingSections,
  exhaustedKeywords,
  hintsFor,
  isOptionAvailable,
  isPlaceVisible,
  isQuestionAsked,
  keywordDocuments,
  keywordMentions,
  knownKeywords,
  matchName,
  placeCounters,
  placeDocuments,
  progress,
  pruneReport,
  readDocuments,
  reportQuestions,
  unreadDocuments,
  visiblePlaces,
  visibleSlots,
  whereToLook,
  type AvailableNames,
  type EndingSection,
  type HintStatus,
  type HintTarget,
  type NameCandidate,
  type PlaceCounter,
  type PlaceState,
  type Progress,
  type ReportQuestionView,
  type VisiblePlace,
  type WhereToLook,
} from './selectors';
export {
  CURRENT_SAVE_VERSION,
  MAX_SAVE_CHARS,
  migrateSave,
  parseSave,
  SAVE_MIGRATIONS,
  summarize,
  type Migration,
} from './save';
export { documentText } from './text';

/** Implémentation de l'interface du contrat (vérifiée par le compilateur). */
export const engine: EngineApi = {
  normalize,
  newGame,
  applyAction,
  search,
  validate,
  settle,
  evaluate,
  evaluateAchievements,
  parseSave,
  summarize,
};
