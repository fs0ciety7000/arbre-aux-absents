/**
 * Démarrage de l'app (chargé par `main.ts`) : styles du design system, montage, puis retrait
 * de l'écran d'attente HTML (même composition que l'écran de lancement, sans saut visible).
 */
import { mount } from 'svelte';
import '@arbre/ui/styles/index.css';
import App from './App.svelte';

export function start(): ReturnType<typeof mount> {
  const target = document.getElementById('app');
  if (!target) throw new Error('#app introuvable');
  const app = mount(App, { target });
  document.getElementById('splash')?.remove();
  document.getElementById('splash-css')?.remove();
  return app;
}
