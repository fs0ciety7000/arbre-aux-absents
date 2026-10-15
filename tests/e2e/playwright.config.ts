/**
 * Tests e2e (hors `npm run check`) : `npm run test:e2e`.
 * - `game` : le jeu construit contre la fixture `mini` (servers/game.mjs, port 4319) ;
 * - `game-cases` : le jeu avec deux affaires, `mini` et `claim` (case revendiquée), port 4321 :
 *   choix d'affaire (E04), succès et crédits par affaire, case revendiquée (`game/cases/`) ;
 * - `site` : le site prérendu (servers/static.mjs, port 4320), axe compris ;
 * - `en-GB` : navigateur en anglais britannique (`en/`) : détection et bascule de langue, jeu et
 *   signalement en anglais, pages `/en/` du site, canaris de la démo anglaise réelle (édition
 *   démo du contenu du dépôt, servers/game.mjs, port 4322).
 * Chromium seulement en local (navigateurs dans PLAYWRIGHT_BROWSERS_PATH, jamais installés ici).
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const here = fileURLToPath(new URL('.', import.meta.url));
const cache = resolve(here, '../../node_modules/.cache/arbre-e2e');
const GAME = `http://localhost:${process.env.E2E_GAME_PORT ?? 4319}`;
const SITE = `http://localhost:${process.env.E2E_SITE_PORT ?? 4320}`;
const CASES_PORT = process.env.E2E_CASES_PORT ?? '4321';
const CASES = `http://localhost:${CASES_PORT}`;
const DEMO_PORT = process.env.E2E_DEMO_PORT ?? '4322';
const DEMO = `http://localhost:${DEMO_PORT}`;

export default defineConfig({
  testDir: here,
  outputDir: resolve(cache, 'results'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: { trace: 'retain-on-failure', locale: 'fr-FR' },
  projects: [
    {
      name: 'game',
      testDir: resolve(here, 'game'),
      testIgnore: '**/cases/**',
      use: { ...devices['Desktop Chrome'], baseURL: GAME, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'game-cases',
      testDir: resolve(here, 'game/cases'),
      use: { ...devices['Desktop Chrome'], baseURL: CASES, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'site',
      testDir: resolve(here, 'site'),
      use: { ...devices['Desktop Chrome'], baseURL: SITE },
    },
    {
      name: 'en-GB',
      testDir: resolve(here, 'en'),
      use: {
        ...devices['Desktop Chrome'],
        baseURL: GAME,
        locale: 'en-GB',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: 'node tests/e2e/servers/game.mjs',
      cwd: resolve(here, '../..'),
      url: GAME,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node tests/e2e/servers/game.mjs',
      cwd: resolve(here, '../..'),
      url: CASES,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: { E2E_FIXTURES: 'mini,claim', E2E_BUILD: 'cases', E2E_GAME_PORT: CASES_PORT },
    },
    {
      // Démo réelle (contenu du dépôt, édition démo) : canaris de la démo anglaise (en/demo.spec.ts).
      command: 'node tests/e2e/servers/game.mjs',
      cwd: resolve(here, '../..'),
      url: DEMO,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      env: { E2E_REAL_CONTENT: 'demo', E2E_BUILD: 'real-demo', E2E_GAME_PORT: DEMO_PORT },
    },
    {
      command: 'node tests/e2e/servers/static.mjs',
      cwd: resolve(here, '../..'),
      url: SITE,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
