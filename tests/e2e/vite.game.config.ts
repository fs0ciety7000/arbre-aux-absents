/**
 * Build du jeu pour les tests e2e : même configuration que `apps/game/vite.config.ts`, mais le
 * contenu compilé (`src/generated/*`) est remplacé par celui de la fixture `mini` du
 * content-tools, compilé dans `node_modules/.cache/arbre-e2e/` (voir `servers/game.mjs`).
 * Le dépôt n'est jamais modifié : `apps/game/src/generated/` reste celui de l'affaire réelle.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = resolve(here, '../..');
export const E2E_CACHE = resolve(repo, 'node_modules/.cache/arbre-e2e');
const generated = process.env.E2E_GENERATED ?? resolve(E2E_CACHE, 'mini/game');

export default defineConfig({
  root: resolve(repo, 'apps/game'),
  base: './',
  plugins: [svelte()],
  resolve: {
    alias: [{ find: /^(?:\.\.\/)+generated\/(.*)$/, replacement: `${generated}/$1` }],
  },
  preview: { port: Number(process.env.E2E_GAME_PORT ?? 4319), strictPort: true },
  build: {
    outDir: resolve(E2E_CACHE, 'game-dist'),
    emptyOutDir: true,
    target: 'es2022',
    chunkSizeWarningLimit: 10_000,
  },
  logLevel: 'warn',
});
