/**
 * Textes du site par langue (catalogues TypeScript typés, aucune bibliothèque : ARCHITECTURE §2).
 * Module pur, sans `$app` : les composants passent par `./app` (langue de la page, liens).
 */
import type { Locale } from '@arbre/contract';
import { en } from './en';
import { fr, type SiteStrings } from './fr';

export type { SiteStrings };
export * from './pages';
export type { Rich, Segment } from './rich';
export { plain } from './rich';

export const STRINGS: Record<Locale, SiteStrings> = { fr, en };

/**
 * Textes de l'habillage (en-tête, pied de page, page d'erreur) : données sérialisables, passées par
 * la `load` du layout. Les pages hydratées n'embarquent ainsi qu'une langue, jamais les catalogues.
 */
export function chromeStrings(lang: Locale) {
  const t = STRINGS[lang];
  return {
    lang,
    header: t.header,
    footer: t.footer,
    brand: t.brand,
    error: t.error,
    backHome: t.common.backHome,
    ogImageAlt: t.meta.ogImageAlt,
  };
}
export type ChromeStrings = ReturnType<typeof chromeStrings>;
