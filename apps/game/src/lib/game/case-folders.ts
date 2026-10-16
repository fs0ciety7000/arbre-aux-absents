/**
 * Chemises d'affaire de l'écran Nouvelle partie (E04, AFFAIRE-2 §2.1) : état affiché sur chaque
 * chemise et affaire choisie par défaut. Pur (aucun état, aucun DOM).
 */
import type { CaseCatalogEntry, Profile, SaveSlotSummary } from '@arbre/contract';
import { messages } from '../../i18n/index.svelte';
import type { CaseEntry } from './cases';

/** Ce qu'une chemise lit de l'affaire (entrée du catalogue ou affaire compilée). */
export type CaseInfo = Pick<CaseCatalogEntry, 'id' | 'meta' | 'endings'>;

/**
 * Parties d'une affaire, associées par `caseId` (le titre change avec la langue). Un résumé
 * écrit avant l'i18n, sans `caseId`, n'est rattaché à aucune affaire.
 */
export function savesOf(
  c: Pick<CaseInfo, 'id'>,
  saves: readonly SaveSlotSummary[],
): SaveSlotSummary[] {
  return saves.filter((s) => s.caseId === c.id);
}

/** « Non ouvert » · « En cours, 42 % » · « Rapport remis · fins vues 2 / 4 ». */
export function caseStatus(
  c: Pick<CaseInfo, 'id' | 'endings'>,
  saves: readonly SaveSlotSummary[],
  profile: Profile,
): string {
  const m = messages.newGame;
  const done = profile.completed[c.id];
  if (done && done.endings.length > 0) {
    const total = Object.keys(c.endings).length;
    return m.statusDone(done.endings.length, total);
  }
  const mine = savesOf(c, saves);
  if (mine.length === 0) return m.statusNew;
  const best = Math.max(...mine.map((s) => s.progress));
  return m.statusOngoing(Math.round(best * 100));
}

/** Affaire choisie d'office : la dernière jouée, sinon la première (déjà triées par `order`). */
export function defaultCaseId(
  cases: readonly CaseEntry[],
  saves: readonly SaveSlotSummary[],
): string {
  let last: SaveSlotSummary | null = null;
  for (const s of saves) if (!last || s.updatedAt > last.updatedAt) last = s;
  const played = last?.caseId ? cases.find((c) => c.content.id === last.caseId) : undefined;
  return (played ?? cases[0])?.content.id ?? '';
}
