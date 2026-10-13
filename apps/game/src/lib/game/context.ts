import { getContext, setContext } from 'svelte';
import type { GameStore } from './types';
import type { AppController } from './app.svelte';

const GAME_KEY = Symbol('arbre.game');
const APP_KEY = Symbol('arbre.app');

/** Fournit le store de partie au Bureau (appelé par le shell). */
export function setGame(store: GameStore): void {
  setContext(GAME_KEY, store);
}

/** Store de partie, lu par les panneaux (`src/panels/**`). */
export function getGame(): GameStore {
  const store = getContext<GameStore | undefined>(GAME_KEY);
  if (!store) throw new Error('getGame() appelé hors du Bureau');
  return store;
}

export function setApp(app: AppController): void {
  setContext(APP_KEY, app);
}

export function getApp(): AppController {
  const app = getContext<AppController | undefined>(APP_KEY);
  if (!app) throw new Error('getApp() appelé hors de l’application');
  return app;
}
