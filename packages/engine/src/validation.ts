import type {
  CompiledCase,
  GroupId,
  SaveState,
  SlotGuess,
  SlotId,
  ValidationGroup,
  ValidationResult,
} from '@arbre/contract';
import { evaluate, own } from './conditions';
import { hashAnswer } from './normalize';

/**
 * Garde-fou anti-balayage (GAME_DESIGN §7.6-7) : si un même champ d'une case change
 * plus de `SWEEP_MAX_CHANGES` fois en `SWEEP_WINDOW_MS`, l'évaluation de son groupe est
 * suspendue `SWEEP_SUSPEND_MS`, silencieusement (même retour qu'un échec).
 */
export const SWEEP_WINDOW_MS = 30_000;
export const SWEEP_MAX_CHANGES = 6;
export const SWEEP_SUSPEND_MS = 10_000;

/**
 * État d'exécution du garde-fou : **non sauvegardé** (absent de `SaveState`), transmis
 * à `applyAction` par les options et rendu dans la transition. Immuable.
 */
export interface SweepGuard {
  /** `slot|champ` → horodatages des changements dans la fenêtre. */
  readonly changes: Readonly<Record<string, readonly number[]>>;
  /** Groupe → fin de suspension (ms). */
  readonly suspendedUntil: Readonly<Record<GroupId, number>>;
}

export function emptyGuard(): SweepGuard {
  return { changes: {}, suspendedUntil: {} };
}

/** Enregistre des changements de champs ; renvoie un nouveau garde-fou. */
export function recordChanges(
  guard: SweepGuard,
  group: GroupId | null,
  slot: SlotId,
  fields: readonly string[],
  at: number,
): SweepGuard {
  if (fields.length === 0) return guard;
  const changes: Record<string, readonly number[]> = {};
  for (const [k, list] of Object.entries(guard.changes)) {
    const kept = list.filter((t) => t > at - SWEEP_WINDOW_MS && t <= at);
    if (kept.length > 0) changes[k] = kept;
  }
  let suspendedUntil = guard.suspendedUntil;
  for (const f of fields) {
    const key = `${slot}|${f}`;
    const list = [...(changes[key] ?? []), at];
    changes[key] = list;
    if (group !== null && list.length > SWEEP_MAX_CHANGES) {
      suspendedUntil = { ...suspendedUntil, [group]: at + SWEEP_SUSPEND_MS };
    }
  }
  return { changes, suspendedUntil };
}

export function isSuspended(guard: SweepGuard | undefined, group: GroupId, at: number): boolean {
  if (!guard) return false;
  const until = own(guard.suspendedUntil, group);
  return until !== undefined && at < until;
}

export function groupOf(slot: SlotId, c: CompiledCase): ValidationGroup | undefined {
  return c.groups.find((g) => g.slots.includes(slot));
}

export function isSlotVisible(slot: SlotId, s: SaveState, c: CompiledCase): boolean {
  const def = own(c.slots, slot);
  if (!def) return false;
  return (
    def.revealedBy === undefined || s.revealedSlots.includes(slot) || evaluate(def.revealedBy, s, c)
  );
}

export type CompleteGuess = SlotGuess & { portrait: string; occupation: string };

/** Case complète : prénom, nom, portrait et métier remplis. */
export function isComplete(g: SlotGuess | undefined): g is CompleteGuess {
  return (
    g !== undefined &&
    g.given.trim() !== '' &&
    g.family.trim() !== '' &&
    g.portrait !== null &&
    g.occupation !== null
  );
}

/** Case correcte : complète et chaque champ égal (par empreinte) à la solution. */
export function isSlotCorrect(slot: SlotId, s: SaveState, c: CompiledCase): boolean {
  const def = own(c.slots, slot);
  const g = own(s.tree, slot);
  if (!def || !isComplete(g)) return false;
  const a = def.answer;
  return (
    a.given.includes(hashAnswer(c.salt, slot, 'given', g.given)) &&
    a.family.includes(hashAnswer(c.salt, slot, 'family', g.family)) &&
    a.portrait === hashAnswer(c.salt, slot, 'portrait', g.portrait) &&
    a.occupation === hashAnswer(c.salt, slot, 'occupation', g.occupation)
  );
}

/** Cases en jeu d'un groupe : complètes, visibles, non verrouillées. */
export function inPlaySlots(group: ValidationGroup, s: SaveState, c: CompiledCase): SlotId[] {
  return group.slots.filter(
    (id) =>
      own(s.locked, id) === undefined && isComplete(own(s.tree, id)) && isSlotVisible(id, s, c),
  );
}

/** Aide niveau 2 : nombre de cases correctes en jeu dans le groupe (sans dire lesquelles). */
export function groupCorrectCount(group: GroupId, s: SaveState, c: CompiledCase): number {
  const g = c.groups.find((x) => x.id === group);
  if (!g) return 0;
  return inPlaySlots(g, s, c).filter((id) => isSlotCorrect(id, s, c)).length;
}

/** Seuil du groupe : `min(threshold, cases non verrouillées du groupe)` (cachées comprises). */
export function groupThreshold(group: ValidationGroup, s: SaveState): number {
  const remaining = group.slots.filter((id) => own(s.locked, id) === undefined).length;
  return Math.min(group.threshold, remaining);
}

export interface ValidateOptions {
  /** Limite l'évaluation à ces groupes (R7 : la validation auto n'en regarde qu'un). */
  groups?: readonly GroupId[];
  /** Garde-fou anti-balayage ; ignoré sans `at`. */
  guard?: SweepGuard;
  at?: number;
}

/**
 * Validation par groupes (GAME_DESIGN §7.4) : pour chaque groupe, si le nombre de cases
 * correctes en jeu atteint le seuil, elles se verrouillent toutes. Aucun détail sinon.
 */
export function validate(
  s: SaveState,
  c: CompiledCase,
  opts: ValidateOptions = {},
): ValidationResult {
  const lock: SlotId[] = [];
  const groups: GroupId[] = [];
  for (const g of c.groups) {
    if (opts.groups && !opts.groups.includes(g.id)) continue;
    if (opts.at !== undefined && isSuspended(opts.guard, g.id, opts.at)) continue;
    const threshold = groupThreshold(g, s);
    if (threshold <= 0) continue;
    const correct = inPlaySlots(g, s, c).filter((id) => isSlotCorrect(id, s, c));
    if (correct.length >= threshold) {
      lock.push(...correct);
      groups.push(g.id);
    }
  }
  return { lock, groups };
}
