import type {
  AchievementCondition,
  CompiledCase,
  OutcomeCondition,
  Profile,
  SaveState,
} from '@arbre/contract';

const has = Object.prototype.hasOwnProperty;

export function own<T>(rec: Readonly<Record<string, T>>, key: string): T | undefined {
  return has.call(rec, key) ? rec[key] : undefined;
}

export function lockedCount(s: SaveState): number {
  return Object.keys(s.locked).length;
}

export function isGroupLocked(groupId: string, s: SaveState, c: CompiledCase): boolean {
  const g = c.groups.find((x) => x.id === groupId);
  return g !== undefined && g.slots.length > 0 && g.slots.every((id) => has.call(s.locked, id));
}

/**
 * Évalue une condition (monotone, ou avec `not` pour les fins et succès).
 * Une référence inconnue vaut faux ; une forme inconnue vaut faux (jamais d'exception).
 */
export function evaluate(cond: OutcomeCondition, s: SaveState, c: CompiledCase): boolean {
  if (cond === null || typeof cond !== 'object') return false;
  if ('read' in cond) return has.call(s.read, cond.read);
  if ('unlocked' in cond) return has.call(s.unlocked, cond.unlocked);
  if ('searched' in cond) return s.searched.includes(cond.searched);
  if ('visited' in cond) return s.visited.includes(cond.visited);
  if ('locked' in cond) return has.call(s.locked, cond.locked);
  if ('groupLocked' in cond) return isGroupLocked(cond.groupLocked, s, c);
  if ('secret' in cond) return has.call(s.secrets, cond.secret);
  if ('lockedCount' in cond) return lockedCount(s) >= cond.lockedCount.gte;
  if ('answered' in cond) {
    const { question, option } = cond.answered;
    return s.report !== undefined && own(s.report, question) === option;
  }
  if ('all' in cond) return cond.all.every((x) => evaluate(x, s, c));
  if ('any' in cond) return cond.any.some((x) => evaluate(x, s, c));
  if ('not' in cond) return !evaluate(cond.not, s, c);
  return false;
}

/** Condition optionnelle : absente = vraie. */
export function holds(cond: OutcomeCondition | undefined, s: SaveState, c: CompiledCase): boolean {
  return cond === undefined || evaluate(cond, s, c);
}

/** Condition de succès : conditions de fin + `endingReached`, `timedUnderMs`, `allSecrets`. */
export function evaluateAchievementCondition(
  cond: AchievementCondition,
  s: SaveState,
  profile: Profile,
  c: CompiledCase,
): boolean {
  if (cond === null || typeof cond !== 'object') return false;
  if ('endingReached' in cond) {
    const done = own(profile.completed, c.id);
    return s.ending === cond.endingReached || (done?.endings.includes(cond.endingReached) ?? false);
  }
  if ('timedUnderMs' in cond) {
    const current = s.mode === 'timed' && s.ending !== null && s.elapsedMs < cond.timedUnderMs;
    const best = own(profile.completed, c.id)?.bestTimedMs;
    return current || (best !== undefined && best < cond.timedUnderMs);
  }
  if ('allSecrets' in cond) {
    const ids = c.progression.secrets.map((x) => x.id);
    return ids.length > 0 && ids.every((id) => has.call(s.secrets, id));
  }
  if ('all' in cond) return cond.all.every((x) => evaluateAchievementCondition(x, s, profile, c));
  if ('any' in cond) return cond.any.some((x) => evaluateAchievementCondition(x, s, profile, c));
  if ('not' in cond) return !evaluateAchievementCondition(cond.not, s, profile, c);
  return evaluate(cond, s, c);
}
