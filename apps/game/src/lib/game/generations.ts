/**
 * Numéro affiché d'une génération (« Génération 1 », cote « I »), commun à l'arbre et aux cartes
 * de révélation. Le contenu numérote ses générations librement (0, 1, 2… ou 1, 2, 3…) : le
 * numéro affiché est le **rang** de la génération parmi toutes celles de l'affaire (cases
 * cachées comprises), à partir de 1. Il ne dépend donc ni de la base choisie par le contenu,
 * ni des cases encore cachées.
 */
import type { CompiledCase } from '@arbre/contract';

const cache = new WeakMap<CompiledCase, ReadonlyMap<number, number>>();

/** Génération du contenu → numéro affiché (1, 2, 3…). */
export function generationNumbers(c: CompiledCase): ReadonlyMap<number, number> {
  const hit = cache.get(c);
  if (hit) return hit;
  const gens = [...new Set(Object.values(c.slots).map((s) => s.generation))].sort((a, b) => a - b);
  const map = new Map(gens.map((g, i) => [g, i + 1]));
  cache.set(c, map);
  return map;
}

/** Numéro affiché (à partir de 1) d'une génération du contenu. */
export function generationNumber(c: CompiledCase, generation: number): number {
  return generationNumbers(c).get(generation) ?? generation + 1;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Cote de la fiche : numéro affiché en chiffres romains. */
export function generationCote(c: CompiledCase, generation: number): string {
  const n = generationNumber(c, generation);
  return ROMAN[n - 1] ?? String(n);
}
