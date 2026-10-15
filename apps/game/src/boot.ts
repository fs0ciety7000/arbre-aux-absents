/**
 * Démarrage de l'app (chargé par `main.ts`) : styles du design system, langue, montage, puis
 * retrait de l'écran d'attente HTML (même composition que l'écran de lancement, sans saut
 * visible).
 * Langue : avant le profil, on résout `?lang=` puis les langues du système ; si c'est
 * l'anglais, son catalogue (chunk à part) est chargé avant le montage. Le profil peut ensuite
 * la changer (`AppController.init`), avant l'écran titre.
 */
import { mount } from 'svelte';
import '@arbre/ui/styles/index.css';
import App from './App.svelte';
import { setMessagesLocale } from './i18n/index.svelte';
import { navigatorLocales, resolveUiLanguage } from './i18n/resolve';

export async function start(): Promise<ReturnType<typeof mount>> {
  const target = document.getElementById('app');
  if (!target) throw new Error('#app introuvable');
  const lang = resolveUiLanguage(undefined, navigatorLocales());
  // Un catalogue anglais introuvable (réseau) n'empêche pas de jouer : français.
  await setMessagesLocale(lang).catch((err: unknown) => {
    console.warn('[langue]', err);
    return setMessagesLocale('fr');
  });
  const app = mount(App, { target });
  document.getElementById('splash')?.remove();
  document.getElementById('splash-css')?.remove();
  return app;
}
