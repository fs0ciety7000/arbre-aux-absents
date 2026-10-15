/**
 * Textes d'interface du jeu, par langue (ARCHITECTURE §2, docs/i18n/PLAN.md lot B1).
 *
 * - `fr.ts` est la source (`CoreMessages = typeof fr`), toujours dans le module de démarrage ;
 *   `en.ts` (`satisfies CoreMessages`) est un chunk à part, chargé **seulement** si la langue
 *   devient l'anglais (`setMessagesLocale`).
 * - Sections différées (`MessagesSection`) : `fr-desk.ts` / `en-desk.ts` (`pm`), hors du
 *   premier affichage, chargées par `ensureMessages('desk')` avec le Bureau. `Messages` est le
 *   catalogue complet ; une section non chargée n'est pas encore dans le catalogue courant.
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
import { fr, type CoreMessages, type Messages } from './fr';
import type { DeskMessages } from './fr-desk';

export type { Messages } from './fr';
export { withoutFinalPeriod } from './fr';

interface Current {
  lang: Locale;
  catalog: Messages;
}

// Le catalogue courant peut ne pas encore contenir les sections différées (`ensureMessages`) :
// elles sont chargées avant l'affichage des écrans qui les lisent.
let current = $state.raw<Current>({ lang: 'fr', catalog: fr as Messages });

/** Langue de l'interface (réactive). */
export function uiLang(): Locale {
  return current.lang;
}

/** Étiquette BCP 47 pour `Intl` et `localeCompare` (réactive). */
export function intlLocale(): string {
  return current.catalog.intl;
}

// ── Chargement : catalogue de base par langue, sections différées ────

/**
 * Sections différées : hors du premier affichage (docs/i18n/PLAN.md §2.4), chargées à la
 * demande pour chaque langue. `desk` : panneaux du Bureau (`pm`), avec le Bureau.
 */
export type MessagesSection = 'desk';

type Part = Partial<Messages>;

const CORE: Record<Locale, () => Promise<CoreMessages>> = {
  fr: () => Promise.resolve(fr),
  en: () => import('./en').then((m) => m.en),
};

const SECTIONS: Record<MessagesSection, Record<Locale, () => Promise<Part>>> = {
  desk: {
    fr: () => import('./fr-desk').then((m) => m.frDesk),
    en: () => import('./en-desk').then((m) => m.enDesk),
  },
};

/** Sections demandées : toute langue chargée ensuite les charge aussi (non réactif). */
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const wanted = new Set<MessagesSection>();

/** Un seul chargement réussi par clé (`fr`, `en`, `desk.en`…) ; un échec se retente. */
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const pending = new Map<string, Promise<unknown>>();
function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = pending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load().catch((err: unknown) => {
      pending.delete(key);
      throw err;
    });
    pending.set(key, p);
  }
  return p;
}

const cores: Partial<Record<Locale, CoreMessages>> = { fr };
const parts: Partial<Record<Locale, Partial<Record<MessagesSection, Part>>>> = {};
/** Catalogue assemblé par langue (même objet tant qu'aucune section ne s'ajoute). */
const merged: Partial<Record<Locale, { catalog: Messages; key: string }>> = {};

function assemble(lang: Locale): Messages | undefined {
  const core = cores[lang];
  if (!core) return undefined;
  const have = parts[lang] ?? {};
  const names = (Object.keys(have) as MessagesSection[]).sort();
  const key = names.join(',');
  const hit = merged[lang];
  if (hit?.key === key) return hit.catalog;
  const catalog = Object.assign({}, core, ...names.map((n) => have[n])) as Messages;
  merged[lang] = { catalog, key };
  return catalog;
}

async function loadSection(name: MessagesSection, lang: Locale): Promise<void> {
  if (parts[lang]?.[name]) return;
  const part = await once(`${name}.${lang}`, SECTIONS[name][lang]);
  (parts[lang] ??= {})[name] = part;
}

/**
 * Catalogue d'une langue avec les sections déjà demandées ; l'anglais et les sections sont
 * importés à la demande (un seul chargement réussi).
 */
export async function loadMessages(lang: Locale): Promise<Messages> {
  if (!cores[lang]) cores[lang] = await once(lang, CORE[lang]);
  await Promise.all([...wanted].map((name) => loadSection(name, lang)));
  return assemble(lang)!;
}

/** Catalogue déjà chargé (sans attendre), ou `undefined`. */
export function loadedMessages(lang: Locale): Messages | undefined {
  return assemble(lang);
}

/**
 * Charge une section différée dans la langue courante (et dans toute langue chargée ensuite),
 * puis l'ajoute au catalogue affiché. À attendre avant d'afficher un écran qui la lit.
 */
export async function ensureMessages(name: MessagesSection): Promise<void> {
  wanted.add(name);
  const lang = current.lang;
  await loadSection(name, lang);
  const catalog = assemble(lang);
  if (catalog && current.lang === lang && current.catalog !== catalog) {
    current = { lang, catalog };
  }
}

/**
 * Change la langue de l'interface (après chargement de son catalogue) et met `<html lang>` à
 * jour (coupure des mots, guillemets `.claim-value`, lecteurs d'écran).
 */
export async function setMessagesLocale(lang: Locale): Promise<void> {
  const catalog = await loadMessages(lang);
  applyMessages(lang, catalog);
}

let applySeq = 0;

/**
 * Variante synchrone : le catalogue est déjà chargé (`loadMessages`). Si une section a été
 * demandée entre-temps (Bureau ouvert pendant le changement de langue), elle est chargée
 * d'abord : le catalogue affiché contient toujours les sections demandées.
 */
export function applyMessages(lang: Locale, catalog: Messages): void {
  const seq = ++applySeq;
  if ([...wanted].some((name) => !parts[lang]?.[name])) {
    loadMessages(lang).then(
      (full) => {
        if (seq === applySeq) show(lang, full);
      },
      (err: unknown) => console.warn('[langue]', lang, err),
    );
    return;
  }
  show(lang, assemble(lang) ?? catalog);
}

function show(lang: Locale, catalog: Messages): void {
  if (current.lang !== lang || current.catalog !== catalog) current = { lang, catalog };
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

// ── Proxy réactif ────────────────────────────────────────────────────

type Obj = Record<PropertyKey, unknown>;

const isBranch = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Clés de premier niveau des sections différées : avant leur chargement, une vue (Proxy) en
 * est rendue quand même, pour qu'un alias de module (`const BODY_LABELS = pm.reader`) suive la
 * section une fois chargée au lieu de figer `undefined`.
 */
const DEFERRED_KEYS: ReadonlySet<PropertyKey> = new Set<keyof DeskMessages>(['pm']);

/**
 * Vue d'un sous-objet du catalogue courant : chaque accès relit `current` (réactif). Les
 * sous-objets rendent eux-mêmes une vue (mise en cache par clé) ; les feuilles sont rendues
 * telles quelles. `scope` : `root` (catalogue entier : ses `DEFERRED_KEYS` absentes rendent une
 * vue), `deferred` (dans une section différée : toute clé absente rend une vue), `plain`.
 */
type Scope = 'root' | 'deferred' | 'plain';

function view<T extends object>(read: () => unknown, scope: Scope = 'plain'): T {
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
      const inDeferred = scope === 'deferred' || (scope === 'root' && DEFERRED_KEYS.has(key));
      if (!isBranch(v) && !(v === undefined && inDeferred)) return v;
      let child = children.get(key);
      if (!child) {
        child = view(() => Reflect.get(target(), key), inDeferred ? 'deferred' : 'plain');
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
export function scoped<T extends object>(pick: (c: Messages) => T, scope?: Scope): T {
  return view<T>(() => pick(current.catalog), scope);
}

/** Tous les textes de l'interface, dans la langue courante. */
export const messages: Messages = scoped((c) => c, 'root');
/** Textes des panneaux du Bureau. */
export const pm: Messages['pm'] = scoped((c) => c.pm, 'deferred');
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
