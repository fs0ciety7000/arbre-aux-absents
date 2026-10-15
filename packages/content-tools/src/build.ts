/**
 * Écriture des modules générés (`content:build`) pour le jeu et le site (ARCHITECTURE §3.3).
 *
 * Nouvelle arborescence, par langue compilée (source et langues `ready`) :
 *   catalog.<éd>.<loc>.json          CaseCatalogEntry[] triés (order, id)
 *   case.<éd>.<loc>.<caseId>.json    CompiledCase
 *   assets.<éd>.json                 illustrations communes (affaire → clé → SVG), langue source
 *   assets.<éd>.<loc>.json           surcharges de la langue seulement ({} pour la source)
 *   world.json                       monde de la langue source (couches communes)
 *   world.<loc>.json                 texte du monde et couche `labels` de la langue ({} pour la source)
 *   world.ts                         `world` (monde de la langue source, typé)
 *   cases.ts                         loadCatalog(loc), loadCase(loc, id), assetLoader(loc, caseId, key),
 *                                    loadWorldText(loc), edition, locales
 *   changelog.json                   jeu seulement : notes de version de l'édition importée
 *                                    (`changelogForEdition`, ARCHITECTURE §3.8)
 *
 * L'ancien format FR (`cases.<éd>.json`, `cases.i18n.ts`) n'est plus écrit depuis la vague C1 ;
 * ses restes éventuels sont supprimés à la compilation suivante.
 *
 * Jeu (`apps/game/src/generated/`) : les deux éditions ; les modules n'importent QUE l'édition
 * choisie (le bundle démo ne contient donc pas l'édition complète).
 * Site (`apps/site/src/generated/`) : édition démo seulement (aucun spoiler sur le site).
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  changelogForEdition,
  type Changelog,
  type CompiledCase,
  type Edition,
  type Locale,
  type MapLayer,
  type Place,
  type WorldMap,
} from '@arbre/contract';
import { catalogFor, compareCases } from './catalog';
import type { CheckResult, CompiledWorld } from './check';

export { compareCases };

export interface BuildTargets {
  game?: string;
  site?: string;
}

export interface Bundle {
  cases: CompiledCase[];
  assets: Record<string, Record<string, string>>;
}

/** Affaires compilées d'une édition dans une langue (défaut : langue source). */
export function bundleFor(r: CheckResult, edition: Edition, locale?: Locale): Bundle {
  const loc = locale ?? r.locales.source;
  const cases: CompiledCase[] = [];
  const assets: Bundle['assets'] = {};
  for (const c of r.cases) {
    const out = c.locales[loc]?.[edition];
    if (!out) continue;
    cases.push(out.compiled);
    assets[out.compiled.id] = out.illustrations;
  }
  cases.sort(compareCases);
  return { cases, assets };
}

const HEADER = '// Généré par `npm run content:build`. Ne pas modifier.\n';

const WORLD_MODULE = `${HEADER}import type { MapLayer, Place, WorldMap } from '@arbre/contract';
import data from './world.json';

export interface CompiledWorld {
  map: WorldMap | null;
  places: Record<string, Place>;
  /** Couches de carte optimisées (SVG). */
  layers: Partial<Record<MapLayer, string>>;
}

export const world = data as unknown as CompiledWorld;
`;

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  try {
    if ((await readFile(path, 'utf8')) === content) return false;
  } catch {
    // absent
  }
  await writeFile(path, content, 'utf8');
  return true;
}

/** Texte du monde propre à une langue (`world.<loc>.json`) ; vide pour la source. */
export interface WorldLocaleOverride {
  map?: Pick<WorldMap, 'title' | 'attribution'>;
  places?: Record<string, Pick<Place, 'description'>>;
  layers?: Partial<Record<MapLayer, string>>;
}

export function worldOverride(source: CompiledWorld, w: CompiledWorld): WorldLocaleOverride {
  const out: WorldLocaleOverride = {};
  if (
    w.map &&
    source.map &&
    (w.map.title !== source.map.title || w.map.attribution !== source.map.attribution)
  ) {
    out.map = {
      title: w.map.title,
      ...(w.map.attribution !== undefined ? { attribution: w.map.attribution } : {}),
    };
  }
  const places: Record<string, Pick<Place, 'description'>> = {};
  for (const [id, p] of Object.entries(w.places)) {
    if (p.description !== undefined && p.description !== source.places[id]?.description)
      places[id] = { description: p.description };
  }
  if (Object.keys(places).length) out.places = places;
  const layers: Partial<Record<MapLayer, string>> = {};
  for (const [k, v] of Object.entries(w.layers) as [MapLayer, string][]) {
    if (v !== source.layers[k]) layers[k] = v;
  }
  if (Object.keys(layers).length) out.layers = layers;
  return out;
}

/** Surcharges d'illustrations d'une langue : ce qui diffère de la langue source. */
export function assetOverrides(
  source: Bundle['assets'],
  localized: Bundle['assets'],
): Bundle['assets'] {
  const out: Bundle['assets'] = {};
  for (const [caseId, files] of Object.entries(localized)) {
    for (const [key, svg] of Object.entries(files)) {
      if (source[caseId]?.[key] === svg) continue;
      (out[caseId] ??= {})[key] = svg;
    }
  }
  return out;
}

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Module de chargement par langue (nouvelle arborescence). */
export function loaderModule(
  edition: Edition,
  locales: readonly Locale[],
  caseIds: Partial<Record<Locale, string[]>>,
): string {
  const lines: string[] = [];
  const entries = (fn: (loc: Locale) => string) =>
    locales.map((loc) => `  ${loc}: ${fn(loc)},`).join('\n');
  lines.push(
    `${HEADER}import type { CaseCatalogEntry, CompiledCase, Locale, MapLayer, Place, WorldMap } from '@arbre/contract';`,
    '',
    'type Loader = () => Promise<{ default: unknown }>;',
    'type Assets = Record<string, Record<string, string>>;',
    '',
    '/** Texte du monde propre à une langue (vide pour la langue source). */',
    'export interface WorldLocaleOverride {',
    "  map?: Pick<WorldMap, 'title' | 'attribution'>;",
    "  places?: Record<string, Pick<Place, 'description'>>;",
    '  layers?: Partial<Record<MapLayer, string>>;',
    '}',
    '',
    `export const edition = ${q(edition)} as const;`,
    `/** Langues compilées (source puis langues \`ready\`). */`,
    `export const locales: readonly Locale[] = [${locales.map(q).join(', ')}];`,
    '',
    'const catalogs: Partial<Record<Locale, Loader>> = {',
    entries((loc) => `() => import('./catalog.${edition}.${loc}.json')`),
    '};',
    'const caseLoaders: Partial<Record<Locale, Record<string, Loader>>> = {',
    ...locales.map((loc) => {
      const ids = caseIds[loc] ?? [];
      return `  ${loc}: {\n${ids.map((id) => `    ${q(id)}: () => import('./case.${edition}.${loc}.${id}.json'),`).join('\n')}\n  },`;
    }),
    '};',
    'const overrides: Partial<Record<Locale, Loader>> = {',
    entries((loc) => `() => import('./assets.${edition}.${loc}.json')`),
    '};',
    'const worldTexts: Partial<Record<Locale, Loader>> = {',
    entries((loc) => `() => import('./world.${loc}.json')`),
    '};',
    '',
    'function need<T>(value: T | undefined, what: string): T {',
    '  if (value === undefined) throw new Error(`contenu non compilé : ${what}`);',
    '  return value;',
    '}',
    '',
    "/** Catalogue d'affaires de la langue (triées par ordre, puis id). */",
    'export async function loadCatalog(loc: Locale): Promise<CaseCatalogEntry[]> {',
    '  return (await need(catalogs[loc], loc)()).default as CaseCatalogEntry[];',
    '}',
    '',
    '/** Affaire compilée dans une langue (un chunk par langue et par affaire). */',
    'export async function loadCase(loc: Locale, id: string): Promise<CompiledCase> {',
    '  return (await need(caseLoaders[loc]?.[id], `${loc}/${id}`)()).default as CompiledCase;',
    '}',
    '',
    'let common: Promise<Assets> | null = null;',
    '',
    "/** Chargeur d'une illustration (`illustrations/<nom>.svg`) : surcharge de la langue, sinon commune. */",
    'export function assetLoader(loc: Locale, caseId: string, key: string): () => Promise<string | null> {',
    '  return async () => {',
    '    const own = overrides[loc];',
    '    if (own) {',
    '      const svg = ((await own()).default as Assets)[caseId]?.[key];',
    '      if (svg !== undefined) return svg;',
    '    }',
    `    common ??= import('./assets.${edition}.json').then((m) => m.default as unknown as Assets);`,
    '    return (await common)[caseId]?.[key] ?? null;',
    '  };',
    '}',
    '',
    '/** Texte du monde et couche `labels` propres à la langue (à appliquer sur `world.json`). */',
    'export async function loadWorldText(loc: Locale): Promise<WorldLocaleOverride> {',
    '  const load = worldTexts[loc];',
    '  return load ? ((await load()).default as WorldLocaleOverride) : {};',
    '}',
    '',
  );
  return lines.join('\n');
}

/**
 * Fichiers générés gérés par l'écrivain (nettoyage des restes), dont ceux de l'ancien format
 * (`cases.<éd>.json`, `cases.i18n.ts`) retiré à la vague C1.
 */
const MANAGED =
  /^(catalog\.[a-z]+\.[a-z]+\.json|case\.[a-z]+\.[a-z]+\.[a-z0-9-]+\.json|assets\.[a-z]+\.[a-z]+\.json|world\.[a-z]+\.json|changelog\.json|cases\.(full|demo)\.json|cases(\.i18n)?\.ts)$/;

/**
 * Écrit les fichiers générés. Renvoie la liste des fichiers modifiés. `changelog` (journal des
 * versions validé) : ses notes pour l'édition du jeu, dans `changelog.json` du jeu (la démo
 * n'embarque ainsi aucun texte de l'édition complète).
 */
export async function writeGenerated(
  r: CheckResult,
  targets: BuildTargets,
  gameEdition: Edition = 'full',
  changelog?: Changelog,
): Promise<string[]> {
  const changed: string[] = [];
  const src = r.locales.source;
  const locales = r.locales.compiled.filter(
    (loc) => loc === src || r.cases.every((c) => !c.locales[src]?.full || c.locales[loc]?.full),
  );
  const sourceWorld = r.worlds[src] ?? r.world;

  const writeDir = async (
    dir: string,
    editions: Edition[],
    moduleEdition: Edition,
    notes?: Changelog,
  ) => {
    await mkdir(dir, { recursive: true });
    const written = new Set<string>();
    const write = async (name: string, content: string) => {
      written.add(name);
      const path = join(dir, name);
      if (await writeIfChanged(path, content)) changed.push(path);
    };
    const caseIds: Partial<Record<Locale, string[]>> = {};
    for (const edition of editions) {
      const base = bundleFor(r, edition, src);
      await write(`assets.${edition}.json`, JSON.stringify(base.assets));
      for (const loc of locales) {
        const b = loc === src ? base : bundleFor(r, edition, loc);
        await write(`catalog.${edition}.${loc}.json`, JSON.stringify(catalogFor(b.cases)));
        for (const c of b.cases)
          await write(`case.${edition}.${loc}.${c.id}.json`, JSON.stringify(c));
        await write(
          `assets.${edition}.${loc}.json`,
          JSON.stringify(loc === src ? {} : assetOverrides(base.assets, b.assets)),
        );
        if (edition === moduleEdition) caseIds[loc] = b.cases.map((c) => c.id);
      }
    }
    await write('world.json', JSON.stringify(sourceWorld));
    for (const loc of locales) {
      const w = r.worlds[loc] ?? sourceWorld;
      await write(
        `world.${loc}.json`,
        JSON.stringify(loc === src ? {} : worldOverride(sourceWorld, w)),
      );
    }
    await write('world.ts', WORLD_MODULE);
    await write('cases.ts', loaderModule(moduleEdition, locales, caseIds));
    if (notes)
      await write('changelog.json', JSON.stringify(changelogForEdition(notes, moduleEdition)));
    // Restes d'une compilation précédente (affaire ou langue retirée).
    for (const name of await readdir(dir)) {
      if (MANAGED.test(name) && !written.has(name)) await rm(join(dir, name), { force: true });
    }
  };

  if (targets.game) await writeDir(targets.game, ['full', 'demo'], gameEdition, changelog);
  if (targets.site) await writeDir(targets.site, ['demo'], 'demo');
  return changed;
}
