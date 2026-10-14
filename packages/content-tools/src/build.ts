/**
 * Écriture des modules générés (`content:build`) pour le jeu et le site.
 *
 * Jeu (`apps/game/src/generated/`) : `cases.<édition>.json`, `assets.<édition>.json`
 * (illustrations), `world.json`, et `cases.ts` / `world.ts` qui n'importent QUE l'édition choisie
 * (le bundle démo ne contient donc pas l'édition complète).
 * Site (`apps/site/src/generated/`) : édition démo seulement (aucun spoiler sur le site).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompiledCase, Edition } from '@arbre/contract';
import type { CheckResult } from './check';

export interface BuildTargets {
  game?: string;
  site?: string;
}

export interface Bundle {
  cases: CompiledCase[];
  assets: Record<string, Record<string, string>>;
}

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

export function bundleFor(r: CheckResult, edition: Edition): Bundle {
  const cases: CompiledCase[] = [];
  const assets: Bundle['assets'] = {};
  for (const c of r.cases) {
    const out = edition === 'full' ? c.full : c.demo;
    if (!out) continue;
    cases.push(out.compiled);
    assets[out.compiled.id] = out.illustrations;
  }
  cases.sort(compareCases);
  return { cases, assets };
}

const HEADER = '// Généré par `npm run content:build`. Ne pas modifier.\n';

function casesModule(edition: Edition): string {
  return `${HEADER}import type { CompiledCase } from '@arbre/contract';
import data from './cases.${edition}.json';
import assets from './assets.${edition}.json';

export const edition = '${edition}' as const;
export const cases = data as unknown as CompiledCase[];
/** Illustrations optimisées : affaire → \`illustrations/<nom>.svg\` → SVG. */
export const illustrations = assets as unknown as Record<string, Record<string, string>>;
`;
}

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

/** Écrit les fichiers générés. Renvoie la liste des fichiers modifiés. */
export async function writeGenerated(
  r: CheckResult,
  targets: BuildTargets,
  gameEdition: Edition = 'full',
): Promise<string[]> {
  const changed: string[] = [];
  const write = async (dir: string, name: string, content: string) => {
    const path = join(dir, name);
    if (await writeIfChanged(path, content)) changed.push(path);
  };
  const world = JSON.stringify(r.world);
  const full = bundleFor(r, 'full');
  const demo = bundleFor(r, 'demo');
  if (targets.game) {
    await mkdir(targets.game, { recursive: true });
    await write(targets.game, 'cases.full.json', JSON.stringify(full.cases));
    await write(targets.game, 'assets.full.json', JSON.stringify(full.assets));
    await write(targets.game, 'cases.demo.json', JSON.stringify(demo.cases));
    await write(targets.game, 'assets.demo.json', JSON.stringify(demo.assets));
    await write(targets.game, 'cases.ts', casesModule(gameEdition));
    await write(targets.game, 'world.json', world);
    await write(targets.game, 'world.ts', WORLD_MODULE);
  }
  if (targets.site) {
    await mkdir(targets.site, { recursive: true });
    await write(targets.site, 'cases.demo.json', JSON.stringify(demo.cases));
    await write(targets.site, 'assets.demo.json', JSON.stringify(demo.assets));
    await write(targets.site, 'cases.ts', casesModule('demo'));
    await write(targets.site, 'world.json', world);
    await write(targets.site, 'world.ts', WORLD_MODULE);
  }
  return changed;
}
