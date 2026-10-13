import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// `base: './'` : chemins relatifs, valides dans l'iframe itch.io et en `tauri://`.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022' },
});
