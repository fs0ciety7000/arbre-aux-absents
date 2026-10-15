/**
 * Pages du site qui existent dans chaque langue (D8 : mêmes slugs sous `/en/`). Module pur (sans
 * `$app`) : lu par les hooks, le plan du site, `Seo` et les tests.
 */
import type { Locale } from '@arbre/contract';

export type { Locale };

/** Langues du site, la source d'abord (même ordre que `LOCALES` du contrat). */
export const SITE_LOCALES = ['fr', 'en'] as const satisfies readonly Locale[];
export const SOURCE_LOCALE = 'fr' satisfies Locale;

/** Slugs des pages localisées, relatifs à la racine de la langue (`''` = accueil). */
export const SITE_PAGES = [
  '',
  'le-monde/',
  'artbook/',
  'charte/',
  'presse/',
  'credits/',
  'nouveautes/',
  'signaler/',
  'suivi/',
  'problemes-connus/',
  'tickets/',
  'confidentialite/',
] as const;
export type SitePath = (typeof SITE_PAGES)[number];

/**
 * Pages hors du plan du site et non indexées : le suivi n'a de sens qu'avec un jeton (fragment
 * `#…`), sa page nue n'apprend rien aux moteurs.
 */
export const UNLISTED_PAGES = ['suivi/'] as const satisfies readonly SitePath[];

/** Langue d'un paramètre de route `[[lang=lang]]` (absent = français). */
export function toLocale(param: string | undefined | null): Locale {
  return param === 'en' ? 'en' : 'fr';
}

/** Préfixe d'URL de la langue (`''` pour la source, `en/` sinon). */
export function langPrefix(lang: Locale): string {
  return lang === SOURCE_LOCALE ? '' : `${lang}/`;
}

/** Chemin absolu d'une page dans une langue : `/le-monde/`, `/en/le-monde/`. */
export function pagePath(lang: Locale, path: SitePath): string {
  return `/${langPrefix(lang)}${path}`;
}

/**
 * Slug et langue d'un chemin publié (`/en/le-monde/` → `{ lang: 'en', path: 'le-monde/' }`).
 * `null` si le chemin n'est pas une page localisée (`/design/`, `/404.html`…).
 */
export function parsePagePath(pathname: string): { lang: Locale; path: SitePath } | null {
  const m = /^\/(?:(en)(?:\/|$))?(.*)$/.exec(pathname);
  if (!m) return null;
  const lang = toLocale(m[1]);
  const rest = m[2] ?? '';
  const path = (SITE_PAGES as readonly string[]).includes(rest) ? (rest as SitePath) : null;
  return path === null ? null : { lang, path };
}

/** Codes `og:locale` (anglais britannique, glossaire §1.1). */
export const OG_LOCALES: Record<Locale, string> = { fr: 'fr_FR', en: 'en_GB' };
