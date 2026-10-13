/**
 * Tests e2e (hors `npm run check`) : `npm run test:e2e`.
 * - `game` : le jeu construit contre la fixture `mini` (servers/game.mjs, port 4319) ;
 * - `site` : le site prérendu (servers/static.mjs, port 4320), axe compris.
 * Chromium seulement en local (navigateurs dans PLAYWRIGHT_BROWSERS_PATH, jamais installés ici).
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const here = fileURLToPath(new URL('.', import.meta.url));
const cache = resolve(here, '../../node_modules/.cache/arbre-e2e');
const GAME = `http://localhost:${process.env.E2E_GAME_PORT ?? 4319}`;
const SITE = `http://localhost:${process.env.E2E_SITE_PORT ?? 4320}`;

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
      use: { ...devices['Desktop Chrome'], baseURL: GAME, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'site',
      testDir: resolve(here, 'site'),
      use: { ...devices['Desktop Chrome'], baseURL: SITE },
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
      command: 'node tests/e2e/servers/static.mjs',
      cwd: resolve(here, '../..'),
      url: SITE,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
