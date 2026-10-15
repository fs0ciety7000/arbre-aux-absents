/**
 * Résolution de la langue de l'interface (ARCHITECTURE §2, D6) : réglage du profil, puis indice
 * `?lang=fr|en` de l'URL (liens du site vers `/jouer/?lang=en`), puis langues du système
 * (`fr-*` → français, toute autre langue → anglais). Sans dépendance lourde : utilisé avant le
 * montage de l'app (`boot.ts`).
 */
import { localeFromTags, type LanguageSetting, type Locale } from '@arbre/contract';

/** Indice de langue de l'URL (`?lang=en`), ou `null`. */
export function urlLanguageHint(search?: string): Locale | null {
  let query = search;
  if (query === undefined) {
    if (typeof location === 'undefined') return null;
    query = location.search;
  }
  const v = new URLSearchParams(query).get('lang')?.trim().toLowerCase();
  return v === 'fr' || v === 'en' ? v : null;
}

/** Langues du navigateur (même source que `Platform.systemLocales()`), avant la plateforme. */
export function navigatorLocales(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  const list = navigator.languages;
  if (Array.isArray(list) && list.length > 0) return list;
  return navigator.language ? [navigator.language] : [];
}

/** Langue à afficher pour un réglage. */
export function resolveUiLanguage(
  setting: LanguageSetting | undefined,
  systemLocales: readonly string[],
  hint: Locale | null = urlLanguageHint(),
): Locale {
  if (setting && setting !== 'system') return setting;
  return hint ?? localeFromTags(systemLocales);
}
