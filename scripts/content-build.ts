/**
 * npm run content:build — PROVISOIRE (lot 0) : écrit des modules générés vides pour le jeu et
 * le site. La compilation réelle (ARCHITECTURE §3.3) arrive avec packages/content-tools.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repo = resolve(import.meta.dirname, '..');
const targets = ['apps/game/src/generated', 'apps/site/src/generated'];

const moduleSource = `// Généré par \`npm run content:build\`. Ne pas modifier.
import type { CompiledCase } from '@arbre/contract';

export const cases: CompiledCase[] = [];
`;

for (const target of targets) {
  const dir = resolve(repo, target);
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, 'cases.ts'), moduleSource, 'utf8');
  console.log(`content:build — ${target}/cases.ts (aucune affaire compilée, lot 0)`);
}
