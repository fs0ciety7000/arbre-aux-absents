/**
 * Rejouabilité côté jeu (GAME_DESIGN §13.2, §13.4 ; AFFAIRE-2 §3.3) : fractionnés lisibles,
 * fins découvertes, jalons du Journal déduits de la partie. Pur (aucun état, aucun DOM).
 */
import type {
  CaseCompletion,
  CompiledCase,
  EndingId,
  GroupId,
  Profile,
  SaveState,
  SlotId,
  TimedSplit,
} from '@arbre/contract';
import { splitDeltas } from '@arbre/engine';
import { generationNumber } from './generations';

/** Ligne du tableau des fractionnés. */
export interface SplitRow {
  rank: number;
  group: GroupId;
  label: string;
  elapsedMs: number;
  /** Écart au fractionné de même rang du meilleur temps ; `null` : rien à comparer. */
  deltaMs: number | null;
}

export function splitRows(
  s: SaveState,
  c: CompiledCase,
  best: readonly TimedSplit[] | undefined,
): SplitRow[] {
  return splitDeltas(s.splits ?? [], best).map((d) => ({
    rank: d.rank,
    group: d.split.group,
    label: c.groups.find((g) => g.id === d.split.group)?.label ?? d.split.group,
    elapsedMs: d.split.elapsedMs,
    deltaMs: d.deltaMs,
  }));
}

/** Écart signé « +1:05 » / « −0:42 » (signe moins typographique), `±0:00` à égalité. */
export function formatDelta(ms: number, clock: (ms: number) => string): string {
  if (ms === 0) return `±${clock(0)}`;
  return `${ms > 0 ? '+' : '−'}${clock(Math.abs(ms))}`;
}

/** Fins découvertes d'une affaire (profil), sur le nombre de fins du contenu. */
export function endingsSeen(
  profile: Profile,
  c: { id: string; endings: Record<EndingId, unknown> },
): { seen: number; total: number } {
  const ids = Object.keys(c.endings);
  const seen = (profile.completed[c.id]?.endings ?? []).filter((e) => ids.includes(e)).length;
  return { seen, total: ids.length };
}

/** Fiche de l'affaire au profil (copie figée au début de la partie : base de comparaison). */
export function completionOf(profile: Profile, caseId: string): CaseCompletion | undefined {
  const done = profile.completed[caseId];
  // Les proxys Svelte ne sont pas clonables par `structuredClone` : données simples, copie JSON.
  return done ? (JSON.parse(JSON.stringify(done)) as CaseCompletion) : undefined;
}

/** Jalon du Journal déduit des verrous : branche établie ou génération complète. */
export interface Milestone {
  key: string;
  at: number;
  kind: 'group' | 'generation';
  label: string | number;
  slots: SlotId[];
}

/**
 * Jalons (cartes de révélation) retrouvés dans la partie : un groupe est établi à l'instant du
 * dernier verrou de ses cases, une génération de même. Rien n'est stocké : le Journal les retrouve
 * au rechargement.
 */
export function milestones(s: SaveState, c: CompiledCase): Milestone[] {
  const out: Milestone[] = [];
  const lockedAt = (ids: SlotId[]): number | null => {
    let max = -1;
    for (const id of ids) {
      const at = s.locked[id];
      if (at === undefined) return null;
      max = Math.max(max, at);
    }
    return ids.length > 0 ? max : null;
  };
  for (const g of c.groups) {
    const at = lockedAt(g.slots);
    // Groupe entièrement pré-rempli : établi d'office, pas un jalon.
    if (at === null || g.slots.every((id) => c.slots[id]?.prefilled)) continue;
    out.push({ key: `g-${g.id}`, at, kind: 'group', label: g.label, slots: [...g.slots] });
  }
  const gens = new Map<number, SlotId[]>();
  for (const [id, slot] of Object.entries(c.slots)) {
    gens.set(slot.generation, [...(gens.get(slot.generation) ?? []), id]);
  }
  for (const [gen, ids] of [...gens].sort((a, b) => a[0] - b[0])) {
    const at = lockedAt(ids);
    if (at === null || ids.every((id) => c.slots[id]?.prefilled)) continue;
    out.push({
      key: `n-${gen}`,
      at,
      kind: 'generation',
      label: generationNumber(c, gen),
      slots: ids,
    });
  }
  return out;
}
