/**
 * Texte enrichi des catalogues du site : une suite de segments, rendue par `Rich.svelte` sans
 * `{@html}`. Couvre ce dont la copie a besoin : italique, gras, passage en français dans une
 * page anglaise (`lang="fr"`, titre du jeu) et lien interne vers une page du site.
 */
import type { SitePath } from './pages';

export type Segment =
  | string
  | { em: string; lang?: 'fr' }
  | { strong: string }
  /** Passage dans une autre langue que la page (titre du jeu, mot velmarchois). */
  | { fr: string }
  /** Lien interne, résolu dans la langue de la page. */
  | { link: SitePath; text: string; hash?: string };

export type Rich = readonly Segment[];

/** Texte brut d'un texte enrichi (attributs, titres de page, tests). */
export function plain(rich: Rich): string {
  return rich
    .map((s) =>
      typeof s === 'string'
        ? s
        : 'em' in s
          ? s.em
          : 'strong' in s
            ? s.strong
            : 'fr' in s
              ? s.fr
              : s.text,
    )
    .join('');
}
