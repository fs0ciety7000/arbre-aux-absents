/**
 * Catalogue d'affaires par langue et par édition (ARCHITECTURE §3.3) : l'index léger que l'écran
 * titre, E04, les Bonus, les Crédits et les Emplacements lisent avant de charger une affaire. Les
 * succès n'y sont pas (un fichier par affaire, lu par l'écran Succès).
 */
import type { CaseCatalogEntry, CompiledCase } from '@arbre/contract';

/** Ordre des affaires (menu, succès) : `(meta.order ?? ∞, id)`. */
export function compareCases(
  a: { id: string; meta?: { order?: number } },
  b: { id: string; meta?: { order?: number } },
): number {
  const oa = a.meta?.order ?? Number.POSITIVE_INFINITY;
  const ob = b.meta?.order ?? Number.POSITIVE_INFINITY;
  if (oa !== ob) return oa < ob ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function catalogEntry(c: CompiledCase): CaseCatalogEntry {
  return {
    id: c.id,
    edition: c.edition,
    locale: c.locale ?? 'fr',
    contentHash: c.contentHash,
    meta: c.meta,
    endings: Object.fromEntries(
      Object.entries(c.endings).map(([id, e]) => [id, { title: e.title }]),
    ),
  };
}

/** Catalogue trié `(order, id)`. */
export function catalogFor(cases: readonly CompiledCase[]): CaseCatalogEntry[] {
  return [...cases].sort(compareCases).map(catalogEntry);
}
