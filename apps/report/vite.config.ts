import { defineConfig } from 'vite';

/**
 * Deux fichiers autonomes, sans `node_modules` au runtime (ARCHITECTURE §8, D9) :
 * `vite build` → `dist/server.js`, `vite build --mode admin` → `dist/admin.js`.
 * zod et `@arbre/contract` sont embarqués ; seuls les modules `node:*` restent externes.
 */
export default defineConfig(({ mode }) => {
  const admin = mode === 'admin';
  return {
    ssr: { noExternal: true, target: 'node' },
    build: {
      ssr: admin ? 'src/bin/admin.ts' : 'src/bin/server.ts',
      outDir: 'dist',
      emptyOutDir: !admin,
      target: 'node22',
      minify: false,
      sourcemap: false,
      copyPublicDir: false,
      rolldownOptions: {
        output: { format: 'es', entryFileNames: admin ? 'admin.js' : 'server.js' },
      },
    },
  };
});
