/**
 * Chemises d'affaire de l'écran Nouvelle partie (E04, AFFAIRE-2 §2.1) : état affiché sur chaque
 * chemise et affaire choisie par défaut. Pur (aucun état, aucun DOM).
 */
import type { CompiledCase, Profile, SaveSlotSummary } from '@arbre/contract';
import { messages } from '../../messages.fr';
import type { CaseEntry } from './cases';

/**
 * Parties d'une affaire. Les résumés d'emplacement ne portent que le titre de l'affaire : on
 * les rapproche par titre (deux affaires n'ont jamais le même titre).
 */
export function savesOf(c: CompiledCase, saves: readonly SaveSlotSummary[]): SaveSlotSummary[] {
  return saves.filter((s) => s.caseTitle === c.meta.title);
}

/** « Non ouvert » · « En cours, 42 % » · « Rapport remis · fins vues 2 / 4 ». */
export function caseStatus(
  c: CompiledCase,
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
  const played = last ? cases.find((c) => c.content.meta.title === last.caseTitle) : undefined;
  return (played ?? cases[0])?.content.id ?? '';
}
