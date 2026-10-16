/**
 * Rejouabilité (docs/game/GAME_DESIGN.md §13.2, §13.4 ; AFFAIRE-2 §3.3) : rapports remis
 * successifs, temps officiel et fractionnés du mode chronométré, contestations des cases
 * revendiquées, fiche de fin d'affaire du profil. Fonctions pures, aucune mutation.
 */
import type {
  CaseCompletion,
  CompiledCase,
  EndingId,
  GroupId,
  SaveState,
  SlotGuess,
  SlotId,
  SubmittedReport,
  TimedSplit,
} from '@arbre/contract';
import { SAVE_LIMITS } from '@arbre/contract';
import { isGroupLocked, own } from './conditions';
import { claimedFields } from './selectors';

const GUESS_FIELDS = ['given', 'family', 'portrait', 'occupation'] as const;

/**
 * Temps officiel d'une partie chronométrée : temps de jeu au premier dénouement (`endedMs`),
 * `null` hors mode chronométré ou avant le dénouement.
 */
export function officialTime(s: SaveState): number | null {
  if (s.mode !== 'timed') return null;
  if (s.endedMs !== undefined) return s.endedMs;
  return s.ending !== null ? s.elapsedMs : null;
}

/** Chrono figé : mode chronométré après le premier dénouement (même rapport rouvert). */
export function clockFrozen(s: SaveState): boolean {
  return s.mode === 'timed' && (s.ending !== null || s.endedMs !== undefined);
}

/** Groupes établis (toutes leurs cases verrouillées), dans l'ordre du contenu. */
function lockedGroups(s: SaveState, c: CompiledCase): GroupId[] {
  return c.groups.filter((g) => isGroupLocked(g.id, s, c)).map((g) => g.id);
}

/**
 * Mode chronométré : ajoute un fractionné pour chaque groupe établi entre `before` et `after`
 * (temps de jeu de `after`). Hors mode chronométré, ou sans nouveau groupe : `after` inchangé.
 */
export function recordSplits(before: SaveState, after: SaveState, c: CompiledCase): SaveState {
  if (after.mode !== 'timed' || after === before) return after;
  const had = new Set(lockedGroups(before, c));
  const known = new Set((after.splits ?? []).map((x) => x.group));
  const fresh = lockedGroups(after, c).filter((g) => !had.has(g) && !known.has(g));
  if (fresh.length === 0) return after;
  const add: TimedSplit[] = fresh.map((group) => ({ group, elapsedMs: after.elapsedMs }));
  return { ...after, splits: [...(after.splits ?? []), ...add].slice(0, 200) };
}

/** Champs d'une déclaration (case revendiquée) : ceux que `claimedGuess` renseigne. */
export function claimTotal(slot: SlotId, c: CompiledCase): (keyof SlotGuess)[] {
  const claim = own(c.slots, slot)?.claimedGuess;
  if (!claim) return [];
  return GUESS_FIELDS.filter((f) => claim[f] !== null && claim[f] !== '');
}

/**
 * Case revendiquée : première contestation d'une déclaration intacte (AFFAIRE-2 §1.7), notée
 * dans `contested` avec les champs retirés ou remplacés. Rien si la case avait déjà été contestée.
 */
export function recordContest(
  slot: SlotId,
  before: SaveState,
  after: SaveState,
  c: CompiledCase,
  at: number,
): SaveState {
  const total = claimTotal(slot, c);
  if (total.length === 0 || own(after.contested ?? {}, slot) !== undefined) return after;
  const was = claimedFields(slot, before, c);
  if (was.length !== total.length) return after;
  const now = claimedFields(slot, after, c);
  const fields = was.filter((f) => !now.includes(f));
  if (fields.length === 0) return after;
  return { ...after, contested: { ...(after.contested ?? {}), [slot]: { at, fields } } };
}

/** Rapport remis : fin, réponses, instant et temps de jeu ; historique borné (les plus récents). */
export function recordReport(s: SaveState, ending: EndingId, at: number): SaveState {
  const entry: SubmittedReport = {
    ending,
    answers: { ...s.report },
    at,
    elapsedMs: s.elapsedMs,
  };
  const reports = [...(s.reports ?? []), entry].slice(-SAVE_LIMITS.reports);
  return { ...s, ending, endedMs: s.endedMs ?? s.elapsedMs, reports };
}

/**
 * Sauvegarde antérieure (1.5.0) déjà dénouée : `endedMs` (le chrono y était figé) et le rapport
 * remis sont déduits, sans rien perdre. Une partie sans dénouement ou déjà à jour est rendue telle
 * quelle (même objet).
 */
export function upgradeSave(s: SaveState): SaveState {
  if (s.ending === null) return s;
  let out = s;
  if (out.endedMs === undefined) out = { ...out, endedMs: out.elapsedMs };
  if (out.reports === undefined || out.reports.length === 0) {
    out = {
      ...out,
      reports: [
        { ending: s.ending, answers: { ...s.report }, at: s.updatedAt, elapsedMs: out.endedMs! },
      ],
    };
  }
  return out;
}

/** Écart d'un fractionné au fractionné de même rang du meilleur temps (ms, négatif = en avance). */
export interface SplitDelta {
  split: TimedSplit;
  /** Rang (1 = premier groupe établi). */
  rank: number;
  /** `null` : pas de fractionné de ce rang dans le meilleur temps. */
  deltaMs: number | null;
}

/**
 * Compare les fractionnés à ceux du meilleur temps **par rang** (n-ième groupe établi), comme un
 * chronométrage de course : l'ordre des groupes varie d'une partie à l'autre, l'allure se compare.
 */
export function splitDeltas(
  splits: readonly TimedSplit[],
  best: readonly TimedSplit[] | undefined,
): SplitDelta[] {
  return splits.map((split, i) => {
    const ref = best?.[i];
    return { split, rank: i + 1, deltaMs: ref ? split.elapsedMs - ref.elapsedMs : null };
  });
}

/**
 * Fiche de l'affaire dans le profil après un dénouement : fin ajoutée aux fins vues, dernière fin,
 * meilleur temps et ses fractionnés si le temps officiel de cette partie le bat.
 */
export function completeCase(
  prev: CaseCompletion | undefined,
  s: SaveState,
  ending: EndingId,
): CaseCompletion {
  const endings = prev?.endings ?? [];
  const next: CaseCompletion = {
    ...prev,
    endings: endings.includes(ending) ? [...endings] : [...endings, ending],
    lastEnding: ending,
  };
  const time = officialTime(s);
  if (time !== null && time > 0 && (prev?.bestTimedMs === undefined || time < prev.bestTimedMs)) {
    next.bestTimedMs = time;
    next.bestSplits = [...(s.splits ?? [])];
  }
  return next;
}
