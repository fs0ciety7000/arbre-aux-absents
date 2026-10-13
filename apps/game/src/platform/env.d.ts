/** Variable de build lue par `index.ts` (définie dans `apps/game/.env.tauri`). */
interface ImportMetaEnv {
  readonly VITE_TARGET?: 'tauri' | 'web';
}
