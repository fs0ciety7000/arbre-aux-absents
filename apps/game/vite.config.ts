import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { lazyContent } from './vite/lazy-content';
import { splash } from './vite/splash';

const splashCss = fileURLToPath(new URL('./src/shell/splash.css', import.meta.url));

// `base: './'` : chemins relatifs, valides dans l'iframe itch.io et en `tauri://`.
// Premier affichage : écran d'attente HTML/CSS (vite/splash.ts) ; affaire, illustrations et
// portraits chargés à la demande (vite/lazy-content.ts).
export default defineConfig({
  base: './',
  plugins: [svelte(), lazyContent(), splash({ splashCss })],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  // Le plus gros fichier est l'affaire compilée (texte, ~150 Ko gzip), chargée à la demande.
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 800 },
});
