import type { CaseCatalogEntry, CompiledCase, Locale } from '@arbre/contract';
import { DEFAULT_LOCALE } from '@arbre/contract';
import type * as GeneratedModule from '../../generated/cases';

/**
 * Contenu compilé par `npm run content:build`, chargé en morceaux (ARCHITECTURE §3.3) :
 * - le **catalogue** d'une langue (chemises E04, Succès, Bonus, Crédits, titres des parties) :
 *   petit, chargé à l'ouverture de ces écrans ;
 * - une **affaire** dans une langue (`case.<éd>.<loc>.<id>`) : chargée en commençant ou en
 *   reprenant une partie, ou en changeant de langue pendant la partie ;
 * - illustrations et portraits : un module par SVG (plugin `vite/lazy-content.ts`).
 * Une langue pas encore compilée (`draft`) retombe sur la langue source : l'interface peut être
 * en anglais et les pièces en français, jusqu'à ce que `content:build` écrive l'anglais.
 */

export interface CaseEntry {
  /** Entrée du catalogue (titre, succès, fins) dans la langue du contenu. */
  content: CaseCatalogEntry;
  /** Affaire de test du moteur, proposée seulement en développement. */
  fixture: boolean;
}

export interface LoadedCatalog {
  /** Langue réellement servie (la source si la langue demandée n'est pas compilée). */
  locale: Locale;
  cases: CaseEntry[];
}

/** Préfixe des clés de portraits dans l'index des assets (voir vite/lazy-content.ts). */
export const PORTRAIT_KEY = 'portrait:';

type Generated = typeof GeneratedModule;

let generatedLoad: Promise<Generated> | null = null;

/** Module de chargement généré (petit, à part : le premier affichage ne l'attend pas). */
function generated(): Promise<Generated> {
  generatedLoad ??= import('../../generated/cases').catch((err: unknown) => {
    generatedLoad = null;
    throw err;
  });
  return generatedLoad;
}

/** Langue du contenu servie pour une langue d'interface : elle-même si compilée, sinon la source. */
export async function contentLocaleFor(lang: Locale): Promise<Locale> {
  const g = await generated();
  return g.locales.includes(lang) ? lang : (g.locales[0] ?? DEFAULT_LOCALE);
}

/** Entrée de catalogue tirée d'une affaire compilée (fixture du moteur). */
export function catalogEntryOf(c: CompiledCase): CaseCatalogEntry {
  return {
    id: c.id,
    edition: c.edition,
    locale: c.locale ?? DEFAULT_LOCALE,
    contentHash: c.contentHash,
    meta: c.meta,
    achievements: c.achievements,
    endings: Object.fromEntries(
      Object.entries(c.endings).map(([id, e]) => [id, { title: e.title }]),
    ),
  };
}

let fixtureLoad: Promise<CompiledCase | null> | null = null;
/** Fixture proposée par le catalogue (aucune affaire compilée, développement). */
let fixtureInUse: CompiledCase | null = null;

/**
 * Si aucune affaire n'est compilée et en développement, la fixture du moteur est proposée pour
 * jouer (retirée du build de prod : `import.meta.env.DEV` vaut `false`, branche éliminée).
 */
function devFixture(): Promise<CompiledCase | null> {
  if (!import.meta.env.DEV) return Promise.resolve(null);
  fixtureLoad ??= import('../../../../../packages/engine/test/fixtures/case').then(
    (fx) => fx.fixtureCase,
  );
  return fixtureLoad;
}

/** Réessaie au prochain appel si la promesse échoue (réseau). */
function memo<T>(cache: Map<string, Promise<T>>, key: string, run: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = run();
  cache.set(key, p);
  p.catch(() => {
    if (cache.get(key) === p) cache.delete(key);
  });
  return p;
}

const catalogs = new Map<string, Promise<LoadedCatalog>>();
const cases = new Map<string, Promise<CompiledCase>>();
/** Dernière affaire chargée par id (toutes langues) : résumés de sauvegarde sans attendre. */
const lastLoaded = new Map<string, CompiledCase>();

/** Catalogue d'affaires (triées par `order`, puis id) dans la langue demandée ou la source. */
export function loadCatalog(lang: Locale): Promise<LoadedCatalog> {
  return memo(catalogs, lang, async () => {
    const g = await generated();
    const locale = await contentLocaleFor(lang);
    const list = g.locales.length > 0 ? await g.loadCatalog(locale) : [];
    if (list.length === 0) {
      const fx = await devFixture();
      if (fx) {
        fixtureInUse = fx;
        return { locale, cases: [{ content: catalogEntryOf(fx), fixture: true }] };
      }
    }
    return { locale, cases: list.map((content) => ({ content, fixture: false })) };
  });
}

/** Affaire compilée dans la langue demandée (ou la source si elle n'est pas compilée). */
export function loadCase(lang: Locale, id: string): Promise<CompiledCase> {
  return memo(cases, `${lang}/${id}`, async () => {
    const fx = fixtureInUse;
    if (fx && fx.id === id) {
      lastLoaded.set(id, fx);
      return fx;
    }
    const g = await generated();
    const c = await g.loadCase(await contentLocaleFor(lang), id);
    lastLoaded.set(id, c);
    return c;
  });
}

/** Affaire déjà chargée (n'importe quelle langue), sans attendre. */
export function loadedCase(id: string): CompiledCase | undefined {
  return lastLoaded.get(id);
}

/**
 * SVG d'une illustration (`illustrations/<nom>.svg`) ou d'un portrait (`portrait:<id>`) :
 * surcharge de la langue du contenu, sinon commun ; `null` si introuvable.
 */
export async function loadAsset(
  locale: Locale,
  caseId: string,
  key: string,
): Promise<string | null> {
  const g = await generated();
  const svg: unknown = await g.assetLoader(locale, caseId, key)();
  return typeof svg === 'string' ? svg : null;
}

/** Tests : oublie les chargements. */
export function resetContentForTests(): void {
  generatedLoad = null;
  fixtureLoad = null;
  fixtureInUse = null;
  catalogs.clear();
  cases.clear();
  lastLoaded.clear();
}
