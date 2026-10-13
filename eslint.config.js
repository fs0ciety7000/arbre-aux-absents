import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/dist-demo/',
      '**/build/',
      '**/.svelte-kit/',
      '**/coverage/',
      'apps/game/src/generated/',
      'apps/site/src/generated/',
      'apps/game/src-tauri/',
      'packages/contract/schema/',
    ],
  },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'svelte/no-at-html-tags': 'error',
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    // Hors SvelteKit (jeu SPA, paquets partagés) : pas de `resolve()` de $app/paths.
    files: ['apps/game/**', 'packages/**'],
    rules: { 'svelte/no-navigation-without-resolve': 'off' },
  },
);
