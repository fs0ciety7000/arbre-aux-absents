/**
 * Transitions d'écran du jeu (DESIGN §7.3, §8.7) : l'écran entrant monte dans la lumière
 * (`screenIn`), le sortant s'escamote (`screenOut`). Pendant sa sortie, l'écran sortant n'est
 * plus qu'une image : inerte, caché aux technologies d'assistance, sans identifiants (un seul
 * `#contenu`), posé sous l'écran entrant — rien ne bloque l'écran qui arrive. Ces marques ne sont
 * jamais retirées : une scène sortante n'est jamais reprise (App.svelte, `scenePass`).
 */
import { screenOut } from '@arbre/ui/motion';
import type { TransitionConfig } from 'svelte/transition';

export function screenLeave(node: Element): TransitionConfig {
  const el = node as HTMLElement;
  el.inert = true;
  el.setAttribute('aria-hidden', 'true');
  for (const withId of el.querySelectorAll('[id]')) withId.removeAttribute('id');
  el.classList.add('screen-leaving');
  return screenOut(node);
}
