import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: [
            'packages/*/src/**/*.test.ts',
            'packages/*/test/**/*.test.ts',
            'scripts/**/*.test.ts',
            'apps/site/src/**/*.test.ts',
            'apps/report/test/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
      // Le jeu a besoin du plugin Svelte (composants, runes) : configuration propre.
      'apps/game/vitest.config.ts',
    ],
  },
});
