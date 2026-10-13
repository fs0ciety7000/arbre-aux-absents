<!--
	Anneau de focus composite (DESIGN.md §9.17).
	- Mode enveloppe (défaut) : dessine l'anneau autour du bloc quand un descendant a le
	  focus clavier (case de l'arbre avec plusieurs champs, épingle du tableau).
	- Mode rectangle (`rect`) : anneau absolu projeté par-dessus un SVG ou un canevas
	  (lieu de la carte, zone de visage) ; le parent doit être positionné.
	Même apparence que le focus natif : 3 px --focus + halo --focus-halo de 2 px.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  interface Props {
    /** Mode rectangle : position en px dans le parent positionné. */
    rect?: Rect | null;
    /** Force l'affichage (ex. focus logique géré par la navigation spatiale). */
    visible?: boolean;
    radius?: 'xs' | 's' | 'm' | 'l' | 'pill' | 'paper';
    /** Écart entre le contenu et l'anneau, en px. */
    offset?: number;
    as?: 'div' | 'span' | 'li';
    children?: Snippet;
    class?: string;
  }

  let {
    rect = null,
    visible = false,
    radius = 'm',
    offset = 3,
    as = 'div',
    children,
    class: className = '',
  }: Props = $props();
</script>

{#if rect}
  <span
    class="ring abs r-{radius} {className}"
    class:visible
    aria-hidden="true"
    style:--x="{rect.x - offset}px"
    style:--y="{rect.y - offset}px"
    style:--w="{rect.width + offset * 2}px"
    style:--h="{rect.height + offset * 2}px"
  ></span>
{:else}
  <svelte:element
    this={as}
    class="host r-{radius} {className}"
    class:visible
    style:--off="{offset}px"
  >
    {@render children?.()}
  </svelte:element>
{/if}

<style>
  .host {
    position: relative;
  }
  .host::after,
  .ring {
    pointer-events: none;
    border-radius: var(--r);
    box-shadow:
      0 0 0 3px var(--focus),
      0 0 0 5px var(--focus-halo);
    opacity: 0;
    transition: opacity var(--dur-fade-fast) var(--ease-out);
  }
  .host::after {
    content: '';
    position: absolute;
    inset: calc(var(--off) * -1);
    z-index: var(--z-raised);
  }
  .host:has(:global(:focus-visible))::after,
  .host.visible::after,
  .ring.visible {
    opacity: 1;
  }
  .host :global(:focus-visible) {
    outline: none;
  }
  .abs {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--w);
    height: var(--h);
    transform: translate(var(--x), var(--y));
    z-index: var(--z-raised);
  }
  .r-xs {
    --r: var(--radius-xs);
  }
  .r-s {
    --r: var(--radius-s);
  }
  .r-m {
    --r: var(--radius-m);
  }
  .r-l {
    --r: var(--radius-l);
  }
  .r-pill {
    --r: var(--radius-pill);
  }
  .r-paper {
    --r: var(--radius-paper);
  }
  @media (forced-colors: active) {
    .host::after,
    .ring {
      box-shadow: none;
      outline: 3px solid Highlight;
    }
  }
</style>
