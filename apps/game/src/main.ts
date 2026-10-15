/**
 * Point d'entrée minimal : l'écran d'attente (index.html) est déjà peint ; le module de
 * démarrage (app, styles) est chargé ensuite, préchargé en parallèle (vite/splash.ts).
 */
import { configureZod } from './zod-config';

configureZod();

void import('./boot')
  .then((m) => m.start())
  .catch((err: unknown) => {
    console.error('[démarrage]', err);
    document.querySelector<HTMLElement>('#splash .splash-error')?.removeAttribute('hidden');
  });
