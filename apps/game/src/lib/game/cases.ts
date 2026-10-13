import type { CompiledCase } from '@arbre/contract';
import { cases as generated, edition } from '../../generated/cases';

export interface CaseEntry {
  content: CompiledCase;
  /** Affaire de test du moteur, proposée seulement en développement. */
  fixture: boolean;
}

export const buildEdition = edition;

/**
 * Affaires disponibles : celles compilées par `npm run content:build`. Si aucune et en
 * développement, la fixture du moteur est proposée pour jouer (retirée du build de prod :
 * `import.meta.env.DEV` est remplacé par `false` et la branche éliminée).
 */
export async function loadCases(): Promise<CaseEntry[]> {
  const list: CaseEntry[] = generated.map((content) => ({ content, fixture: false }));
  if (list.length === 0 && import.meta.env.DEV) {
    const mod = await import('../../../../../packages/engine/test/fixtures/case');
    list.push({ content: mod.fixtureCase, fixture: true });
  }
  return list;
}
