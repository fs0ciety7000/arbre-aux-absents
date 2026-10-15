import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Tests du jeu (composants rendus côté serveur avec `svelte/server`, logique pure des panneaux).
export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
  test: {
    include: ['src/**/*.test.ts'],
    // Sections différées du catalogue (`pm`…) chargées comme une fois le Bureau ouvert.
    setupFiles: ['src/i18n/test-setup.ts'],
    environment: 'node',
  },
});
