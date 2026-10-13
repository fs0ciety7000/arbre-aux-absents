import type { AchievementId, CompiledCase, Profile, SaveState } from '@arbre/contract';
import { evaluateAchievementCondition, own } from './conditions';

/** Succès de l'affaire nouvellement remplis (absents de `profile.achievements`), ordre du contenu. */
export function evaluateAchievements(
  s: SaveState,
  profile: Profile,
  c: CompiledCase,
): AchievementId[] {
  return c.achievements
    .filter((a) => own(profile.achievements, a.id) === undefined)
    .filter((a) => evaluateAchievementCondition(a.when, s, profile, c))
    .map((a) => a.id);
}
