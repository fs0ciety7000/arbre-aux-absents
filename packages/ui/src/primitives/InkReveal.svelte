<!--
	Révélation à l'encre (DESIGN.md §8, « map ink-draw ») : le contenu apparaît par un
	balayage, comme une encre qui court sur le papier (option `blur` : l'encre sèche, flou →
	net). Transform seul (deux couches contraires). Chaque couche d'une carte peut
	avoir son rang (`index`) : fond, eaux, relief, lieux, noms. Mouvement réduit : fondu 150 ms.
	Rejoué au changement de `key`.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Sens du balayage. */
    from?: 'left' | 'right' | 'top' | 'bottom';
    /** Rang dans la séquence (retard = rang × 2 × --stagger). */
    index?: number;
    /** Flou d'encre qui sèche en plus du balayage. */
    blur?: boolean;
    key?: number | string;
    children?: Snippet;
    class?: string;
  }
  let {
    from = 'left',
    index = 0,
    blur = false,
    key = 0,
    children,
    class: className = '',
  }: Props = $props();
  const axis = $derived(from === 'top' || from === 'bottom' ? 'y' : 'x');
  const sign = $derived(from === 'left' || from === 'top' ? -1 : 1);
</script>

{#key key}
  <div
    class="mv-wipe ink-reveal {axis} {className}"
    style:--wipe-from="{sign * 101}%"
    style:--i={index}
  >
    <div class="mv-wipe-inner inner" class:mv-ink={blur} style:--i={index}>
      {@render children?.()}
    </div>
  </div>
{/key}

<style>
  .ink-reveal {
    position: relative;
  }
  .inner {
    height: 100%;
  }
  /* Axe vertical : mêmes images-clés, translation sur Y */
  .y,
  .y > .inner {
    animation-name: m-wipe-y-outer;
  }
  .y > .inner {
    animation-name: m-wipe-y-inner;
  }
  @keyframes m-wipe-y-outer {
    from {
      transform: translateY(var(--wipe-from, -101%));
    }
  }
  @keyframes m-wipe-y-inner {
    from {
      transform: translateY(calc(var(--wipe-from, -101%) * -1));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:root:not([data-motion='full'])) .ink-reveal,
    :global(:root:not([data-motion='full'])) .inner {
      animation: m-fade-in var(--dur-fade) var(--ease-out) backwards;
    }
  }
  :global(:root[data-motion='reduced']) .ink-reveal,
  :global(:root[data-motion='reduced']) .inner {
    animation: m-fade-in var(--dur-fade) var(--ease-out) backwards;
  }
</style>
