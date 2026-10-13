import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// SvelteKit 3 : la configuration passe par le plugin (plus de svelte.config.js).
export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: { runes: true },
      // Chemins absolus : la page 404 est servie à n'importe quelle profondeur d'URL.
      paths: { relative: false },
      // CSS en ligne dans chaque page (aucune feuille bloquante : LCP mobile). Toutes les feuilles
      // du site passent sous ce seuil (design system v2 : ~68 Ko pour la feuille commune) ; les
      // <style> sont autorisés par empreinte dans la CSP (scripts/csp-hashes.sh).
      inlineStyleThreshold: 128 * 1024,
      adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
      prerender: {
        // /jouer/ : version web du jeu, copiée à côté du site au build Docker (hors SvelteKit).
        handleHttpError: ({ path, message }) => {
          if (path === '/jouer/' || path.startsWith('/jouer/')) return;
          throw new Error(message);
        },
        handleMissingId: 'fail',
      },
    }),
  ],
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
