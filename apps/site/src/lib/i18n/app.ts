/**
 * Langue de la page courante et liens localisés (composants seulement : dépend de `$app`).
 * N'importe pas les catalogues : ce module va dans le JS des pages hydratées (« Le monde »).
 */
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { ResolvedPathname } from '$app/types';
import { pagePath, toLocale, type Locale, type SitePath } from './pages';

/** Langue de la page en cours (paramètre `[[lang=lang]]`, français sans préfixe). */
export function currentLang(): Locale {
  return toLocale(page.params.lang);
}

/**
 * Chemin d'une page du site dans une langue, avant `resolve()` (barre finale, `#ancre`
 * facultative). Dans un `<a href>` : `resolve(localPath(…))`, que la règle ESLint reconnaît.
 */
export function localPath(lang: Locale, path: SitePath, hash = ''): string {
  const target = pagePath(lang, path);
  return hash ? `${target}#${hash}` : target;
}

/** Lien résolu vers une page du site dans une langue (pour les primitives `href`). */
export function localHref(lang: Locale, path: SitePath, hash = ''): ResolvedPathname {
  return resolve(localPath(lang, path, hash));
}
