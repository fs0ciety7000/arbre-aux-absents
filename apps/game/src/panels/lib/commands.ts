/**
 * Commandes de panneau relayées par le shell (`arbre:command`, voir `src/input/commands.ts`) :
 * raccourcis remappables et manette. Un panneau qui traite une commande l'annule
 * (`preventDefault()`) pour que la touche soit consommée.
 */
import { COMMAND_EVENT, type CommandDetail } from '../../input/commands';
import type { PanelId } from '../../lib/game/types';

export type PanelCommand = CommandDetail['command'];

/** Écoute les commandes ; `handle` renvoie true s'il a traité la commande. Renvoie le nettoyage. */
export function listenCommands(handle: (command: PanelCommand) => boolean): () => void {
  const onCommand = (e: CustomEvent<CommandDetail>) => {
    if (!e.defaultPrevented && handle(e.detail.command)) e.preventDefault();
  };
  window.addEventListener(COMMAND_EVENT, onCommand);
  return () => window.removeEventListener(COMMAND_EVENT, onCommand);
}

/**
 * Le panneau est-il la cible des commandes partagées (zoom, épingler…) ? Celui qui contient le
 * focus, sinon le panneau principal.
 */
export function ownsCommands(
  root: HTMLElement | null | undefined,
  id: PanelId,
  main: PanelId,
): boolean {
  const active = typeof document === 'undefined' ? null : document.activeElement;
  if (root && active && active !== document.body) {
    if (root.contains(active)) return true;
    if (active.closest('section, aside')) return false;
  }
  return main === id;
}
