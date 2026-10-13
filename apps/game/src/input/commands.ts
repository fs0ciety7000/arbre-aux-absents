import type { CommandId } from './keymap.svelte';

/**
 * Relais des commandes de panneau (T, R, P, H, N, U, zoom, pages, menu contextuel…) :
 * un `CustomEvent('arbre:command')` annulable sur `window`. Un panneau qui traite la
 * commande appelle `preventDefault()` ; la touche d'origine est alors consommée.
 *
 * ```ts
 * window.addEventListener('arbre:command', (e) => {
 *   if (e.detail.command === 'reader.flip') { flip(); e.preventDefault(); }
 * });
 * ```
 */
export const COMMAND_EVENT = 'arbre:command';

export interface CommandDetail {
  command: CommandId;
  source: 'keyboard' | 'gamepad';
}

declare global {
  interface WindowEventMap {
    'arbre:command': CustomEvent<CommandDetail>;
  }
}

/** Diffuse une commande ; renvoie true si un panneau l'a traitée. */
export function relayCommand(command: CommandId, source: CommandDetail['source']): boolean {
  const ev = new CustomEvent<CommandDetail>(COMMAND_EVENT, {
    detail: { command, source },
    cancelable: true,
  });
  return !window.dispatchEvent(ev);
}
