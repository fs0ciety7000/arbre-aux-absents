/**
 * Textes d'interface du jeu, par langue (ARCHITECTURE §2, docs/i18n/PLAN.md lot B1).
 *
 * - `fr.ts` est la source (`type Messages = typeof fr`), toujours dans le module de démarrage ;
 *   `en.ts` (`satisfies Messages`) est un chunk à part, chargé **seulement** si la langue
 *   devient l'anglais (`setMessagesLocale`).
 * - `messages`, `pm`, `KIND_LABELS`… sont des **Proxy** qui relisent le catalogue courant à
 *   chaque accès : la langue est un `$state.raw`, donc tout gabarit ou `$derived` qui lit un
 *   texte suit le changement de langue sans être réécrit. Un objet intermédiaire
 *   (`const m = messages.menu`) reste un Proxy : seule une **feuille** (chaîne, tableau,
 *   fonction) est la valeur de la langue du moment.
 * - Règle (testée, `__tests__/no-capture.test.ts`) : aucune capture de `messages.*` au niveau
 *   d'un module ; une constante de module qui contient un texte devient une fonction ou un
 *   accesseur.
 */
import type { Locale } from '@arbre/contract';
import { fr, type Messages } from './fr';

export type { Messages } from './fr';
export { withoutFinalPeriod } from './fr';

interface Current {
  lang: Locale;
  catalog: Messages;
}

let current = $state.raw<Current>({ lang: 'fr', catalog: fr });

/** Langue de l'interface (réactive). */
export function uiLang(): Locale {
  return current.lang;
}

/** Étiquette BCP 47 pour `Intl` et `localeCompare` (réactive). */
export function intlLocale(): string {
  return current.catalog.intl;
}

const loaded: Partial<Record<Locale, Messages>> = { fr };
let english: Promise<Messages> | null = null;

/** Catalogue d'une langue ; l'anglais est importé à la demande (un seul chargement réussi). */
export function loadMessages(lang: Locale): Promise<Messages> {
  const hit = loaded[lang];
  if (hit) return Promise.resolve(hit);
  const load =
    english ??
    import('./en').then(
      (m) => (loaded.en = m.en),
      (err: unknown) => {
        english = null;
        throw err;
      },
    );
  english = load;
  return load;
}

/** Catalogue déjà chargé (sans attendre), ou `undefined`. */
export function loadedMessages(lang: Locale): Messages | undefined {
  return loaded[lang];
}

/**
 * Change la langue de l'interface (après chargement de son catalogue) et met `<html lang>` à
 * jour (coupure des mots, guillemets `.claim-value`, lecteurs d'écran).
 */
export async function setMessagesLocale(lang: Locale): Promise<void> {
  const catalog = await loadMessages(lang);
  applyMessages(lang, catalog);
}

/** Variante synchrone : le catalogue est déjà chargé (`loadMessages`). */
export function applyMessages(lang: Locale, catalog: Messages): void {
  if (current.lang !== lang || current.catalog !== catalog) current = { lang, catalog };
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

// ── Proxy réactif ────────────────────────────────────────────────────

type Obj = Record<PropertyKey, unknown>;

const isBranch = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Vue d'un sous-objet du catalogue courant : chaque accès relit `current` (réactif). Les
 * sous-objets rendent eux-mêmes une vue (mise en cache par clé) ; les feuilles sont rendues
 * telles quelles.
 */
function view<T extends object>(read: () => unknown): T {
  // Cache de vues (non réactif : les vues relisent elles-mêmes la langue courante).
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const children = new Map<PropertyKey, unknown>();
  const target = (): Obj => {
    const v = read();
    return isBranch(v) ? v : {};
  };
  return new Proxy({} as T, {
    get(_, key) {
      const v = Reflect.get(target(), key);
      if (!isBranch(v)) return v;
      let child = children.get(key);
      if (!child) {
        child = view(() => Reflect.get(target(), key));
        children.set(key, child);
      }
      return child;
    },
    has: (_, key) => Reflect.has(target(), key),
    ownKeys: () => Reflect.ownKeys(target()),
    getOwnPropertyDescriptor(_, key) {
      const d = Reflect.getOwnPropertyDescriptor(target(), key);
      return d ? { ...d, configurable: true } : undefined;
    },
    set: () => false,
    deleteProperty: () => false,
    defineProperty: () => false,
  });
}

/** Vue réactive d'une partie du catalogue (`scoped((c) => c.pm)`). */
export function scoped<T extends object>(pick: (c: Messages) => T): T {
  return view<T>(() => pick(current.catalog));
}

/** Tous les textes de l'interface, dans la langue courante. */
export const messages: Messages = scoped((c) => c);
/** Textes des panneaux du Bureau. */
export const pm: Messages['pm'] = scoped((c) => c.pm);
export const KIND_LABELS: Messages['kindLabels'] = scoped((c) => c.kindLabels);
export const FIELD_LABELS: Messages['fieldLabels'] = scoped((c) => c.fieldLabels);
export const FIELD_ARTICLES: Messages['fieldArticles'] = scoped((c) => c.fieldArticles);
export const KEYWORD_RUBRICS: Messages['keywordRubrics'] = scoped((c) => c.keywordRubrics);
export const RUBRIC_EMPTY: Messages['rubricEmpty'] = scoped((c) => c.rubricEmpty);

/** Libellés des couleurs de surlignage (1 à 5) : tableau qui relit la langue courante. */
export const HL_LABELS: readonly string[] = new Proxy([] as string[], {
  get: (_, key) => Reflect.get(current.catalog.hlLabels, key),
  has: (_, key) => Reflect.has(current.catalog.hlLabels, key),
  ownKeys: () => Reflect.ownKeys(current.catalog.hlLabels),
  getOwnPropertyDescriptor: (_, key) =>
    Reflect.getOwnPropertyDescriptor(current.catalog.hlLabels, key),
});
