/**
 * Chemises d'affaire de l'écran Nouvelle partie (E04, AFFAIRE-2 §2.1) : état affiché sur chaque
 * chemise et affaire choisie par défaut. Pur (aucun état, aucun DOM).
 */
import type { CaseCatalogEntry, Profile, SaveSlotSummary } from '@arbre/contract';
import { messages } from '../../i18n/index.svelte';
import type { CaseEntry } from './cases';
import { formatClock } from './format';

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

/**
 * « Non ouvert » · « En cours, 42 % » · « Rapport remis · fins découvertes 2 / 4 » (+ « · meilleur
 * temps 1:02:03 » après une partie chronométrée).
 */
export function caseStatus(
  c: Pick<CaseInfo, 'id' | 'endings'>,
  saves: readonly SaveSlotSummary[],
  profile: Profile,
): string {
  const m = messages.newGame;
  const done = profile.completed[c.id];
  if (done && done.endings.length > 0) {
    const ids = Object.keys(c.endings);
    const seen = done.endings.filter((e) => ids.includes(e)).length;
    const status = m.statusDone(seen, ids.length);
    return done.bestTimedMs !== undefined
      ? m.statusBest(status, formatClock(done.bestTimedMs))
      : status;
  }
  const mine = savesOf(c, saves);
  if (mine.length === 0) return m.statusNew;
  const best = Math.max(...mine.map((s) => s.progress));
  return m.statusOngoing(Math.round(best * 100));
}

/** Durée indicative d'une première partie (« 4 h 15 – 6 h 40 »), si le contenu la donne. */
export function caseDuration(c: Pick<CaseInfo, 'meta'>): string | undefined {
  const d = c.meta.durationMinutes;
  if (!d) return undefined;
  const fmt = (min: number) => messages.format.hoursShort(Math.floor(min / 60), min % 60);
  return messages.newGame.duration(fmt(d[0]), fmt(d[1]));
}

/** Tampon de la chemise : titre de la dernière fin atteinte (déjà vue : rien n'est divulgué). */
export function lastEndingTitle(
  c: Pick<CaseInfo, 'id' | 'endings'>,
  profile: Profile,
): string | undefined {
  const id = profile.completed[c.id]?.lastEnding;
  return id ? c.endings[id]?.title : undefined;
}

/**
 * Affaire choisie d'office (AFFAIRE-2 §2.1) : l'affaire jamais commencée la plus ancienne (ni
 * partie ni dénouement ; affaires déjà triées par `order`), sinon la dernière jouée, sinon la
 * première.
 */
export function defaultCaseId(
  cases: readonly CaseEntry[],
  saves: readonly SaveSlotSummary[],
  profile?: Profile,
): string {
  if (profile) {
    const fresh = cases.find(
      (c) =>
        !c.fixture &&
        savesOf(c.content, saves).length === 0 &&
        (profile.completed[c.content.id]?.endings.length ?? 0) === 0,
    );
    if (fresh) return fresh.content.id;
  }
  let last: SaveSlotSummary | null = null;
  for (const s of saves) if (!last || s.updatedAt > last.updatedAt) last = s;
  const played = last?.caseId ? cases.find((c) => c.content.id === last.caseId) : undefined;
  return (played ?? cases[0])?.content.id ?? '';
}
