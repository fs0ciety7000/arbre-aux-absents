import type { CompiledCase } from '@arbre/contract';

export interface CaseEntry {
  content: CompiledCase;
  /** Affaire de test du moteur, proposée seulement en développement. */
  fixture: boolean;
}

/**
 * SVG d'une illustration ou d'un portrait : chargeur à la demande (build, plugin
 * `vite/lazy-content.ts`) ou chaîne en ligne (sans le plugin).
 */
export type AssetSource = string | (() => Promise<string>);
/** Affaire → clé (`illustrations/<nom>.svg` ou `portrait:<id>`) → SVG. */
export type AssetIndex = Record<string, Record<string, AssetSource>>;

export interface LoadedContent {
  cases: CaseEntry[];
  assets: AssetIndex;
}

/** Préfixe des clés de portraits dans l'index des assets (voir vite/lazy-content.ts). */
export const PORTRAIT_KEY = 'portrait:';

let pending: Promise<LoadedContent> | null = null;

/**
 * Affaires compilées par `npm run content:build`, chargées à la demande (module à part : le
 * premier affichage ne les attend pas). Un seul chargement ; un échec permet de réessayer.
 * Si aucune affaire et en développement, la fixture du moteur est proposée pour jouer
 * (retirée du build de prod : `import.meta.env.DEV` vaut `false`, branche éliminée).
 */
export function loadContent(): Promise<LoadedContent> {
  if (pending) return pending;
  const p = (async (): Promise<LoadedContent> => {
    const mod = await import('../../generated/cases');
    const cases: CaseEntry[] = mod.cases.map((content) => ({ content, fixture: false }));
    if (cases.length === 0 && import.meta.env.DEV) {
      const fx = await import('../../../../../packages/engine/test/fixtures/case');
      cases.push({ content: fx.fixtureCase, fixture: true });
    }
    return { cases, assets: mod.illustrations as unknown as AssetIndex };
  })();
  pending = p;
  p.catch(() => {
    if (pending === p) pending = null;
  });
  return p;
}

/** Tests : oublie le chargement. */
export function resetContentForTests(): void {
  pending = null;
}
