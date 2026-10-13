/** Outils sur les conditions (références, évaluation, simplification pour la démo). */
import type { AchievementCondition, Condition, OutcomeCondition } from '@arbre/contract';

export type AnyCondition = AchievementCondition;

export type AtomKind =
  | 'read'
  | 'unlocked'
  | 'searched'
  | 'visited'
  | 'locked'
  | 'groupLocked'
  | 'secret'
  | 'endingReached';

export interface AtomRef {
  kind: AtomKind;
  id: string;
}

const ID_ATOMS: readonly AtomKind[] = [
  'read',
  'unlocked',
  'searched',
  'visited',
  'locked',
  'groupLocked',
  'secret',
  'endingReached',
];

/** Toutes les références à des ids d'une condition. */
export function conditionRefs(c: AnyCondition): AtomRef[] {
  const out: AtomRef[] = [];
  const walk = (x: AnyCondition) => {
    const o = x as Record<string, unknown>;
    if ('all' in o) (o.all as AnyCondition[]).forEach(walk);
    else if ('any' in o) (o.any as AnyCondition[]).forEach(walk);
    else if ('not' in o) walk(o.not as AnyCondition);
    else {
      for (const k of ID_ATOMS) if (k in o) out.push({ kind: k, id: o[k] as string });
    }
  };
  walk(c);
  return out;
}

/** Vrai si une valeur JSON brute contient une clé `not` (règle 4, avant les schémas). */
export function rawContainsNot(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(rawContainsNot);
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'not' || rawContainsNot(v)) return true;
    }
  }
  return false;
}

export interface EvalState {
  read: ReadonlySet<string>;
  unlocked: ReadonlySet<string>;
  searched: ReadonlySet<string>;
  visited: ReadonlySet<string>;
  locked: ReadonlySet<string>;
  secrets: ReadonlySet<string>;
  groups: ReadonlyMap<string, readonly string[]>;
  endingsReached?: ReadonlySet<string>;
  allSecrets?: boolean;
}

/** Évalue une condition sur un état simplifié du solveur. */
export function evaluate(c: AnyCondition, s: EvalState): boolean {
  const o = c as Record<string, unknown>;
  if ('all' in o) return (o.all as AnyCondition[]).every((x) => evaluate(x, s));
  if ('any' in o) return (o.any as AnyCondition[]).some((x) => evaluate(x, s));
  if ('not' in o) return !evaluate(o.not as AnyCondition, s);
  if ('read' in o) return s.read.has(o.read as string);
  if ('unlocked' in o) return s.unlocked.has(o.unlocked as string);
  if ('searched' in o) return s.searched.has(o.searched as string);
  if ('visited' in o) return s.visited.has(o.visited as string);
  if ('locked' in o) return s.locked.has(o.locked as string);
  if ('secret' in o) return s.secrets.has(o.secret as string);
  if ('groupLocked' in o) {
    const slots = s.groups.get(o.groupLocked as string);
    return !!slots && slots.length > 0 && slots.every((id) => s.locked.has(id));
  }
  if ('lockedCount' in o) return s.locked.size >= (o.lockedCount as { gte: number }).gte;
  if ('endingReached' in o) return s.endingsReached?.has(o.endingReached as string) ?? false;
  if ('allSecrets' in o) return s.allSecrets ?? false;
  // timedUnderMs : non modélisé par le solveur (considéré atteignable).
  if ('timedUnderMs' in o) return true;
  return false;
}

/** Atomes apparaissant sous un nombre impair de `not` (à éviter pour rendre la condition vraie). */
export function negatedAtoms(c: AnyCondition): AtomRef[] {
  const out: AtomRef[] = [];
  const walk = (x: AnyCondition, neg: boolean) => {
    const o = x as Record<string, unknown>;
    if ('all' in o) (o.all as AnyCondition[]).forEach((y) => walk(y, neg));
    else if ('any' in o) (o.any as AnyCondition[]).forEach((y) => walk(y, neg));
    else if ('not' in o) walk(o.not as AnyCondition, !neg);
    else if (neg) for (const k of ID_ATOMS) if (k in o) out.push({ kind: k, id: o[k] as string });
  };
  walk(c, false);
  return out;
}

export type Simplified<T> = T | true | false;

/**
 * Simplifie une condition quand certains ids n'existent pas (édition démo) : un atome qui
 * référence un id absent est faux. Renvoie `false` si la condition ne peut plus être vraie,
 * `true` si elle l'est toujours (seulement possible avec `not`).
 */
export function simplify<T extends AnyCondition>(
  c: T,
  exists: (ref: AtomRef) => boolean,
): Simplified<T> {
  const o = c as Record<string, unknown>;
  if ('all' in o) {
    const parts: AnyCondition[] = [];
    for (const x of o.all as AnyCondition[]) {
      const r = simplify(x, exists);
      if (r === false) return false;
      if (r !== true) parts.push(r);
    }
    if (parts.length === 0) return true;
    return (parts.length === 1 ? parts[0] : { all: parts }) as T;
  }
  if ('any' in o) {
    const parts: AnyCondition[] = [];
    for (const x of o.any as AnyCondition[]) {
      const r = simplify(x, exists);
      if (r === true) return true;
      if (r !== false) parts.push(r);
    }
    if (parts.length === 0) return false;
    return (parts.length === 1 ? parts[0] : { any: parts }) as T;
  }
  if ('not' in o) {
    const r = simplify(o.not as AnyCondition, exists);
    if (r === true) return false;
    if (r === false) return true;
    return { not: r } as T;
  }
  for (const k of ID_ATOMS) {
    if (k in o && !exists({ kind: k, id: o[k] as string })) return false;
  }
  return c;
}

export type { Condition, OutcomeCondition };
