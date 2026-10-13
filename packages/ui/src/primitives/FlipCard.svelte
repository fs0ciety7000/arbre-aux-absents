<!--
	Recto / verso (DESIGN.md §8, « page flip ») : la feuille se retourne en 3D autour de son
	axe vertical (rotateY, perspective), avec un léger soulèvement à mi-course. Les deux faces
	restent dans le DOM ; la face cachée est `inert` (ni focus ni lecture). Le bouton qui
	retourne est fourni par l'appelant (`Button iconName="flip"`), `flipped` est liable.
	Mouvement réduit : bascule instantanée + fondu de 150 ms.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    flipped?: boolean;
    front?: Snippet;
    back?: Snippet;
    class?: string;
  }
  let { flipped = $bindable(false), front, back, class: className = '' }: Props = $props();
</script>

<div class="flip {className}" class:flipped>
  <div class="card3d">
    <div class="face front" inert={flipped} aria-hidden={flipped}>{@render front?.()}</div>
    <div class="face back" inert={!flipped} aria-hidden={!flipped}>{@render back?.()}</div>
  </div>
</div>

<style>
  .flip {
    perspective: 1600px;
    display: grid;
  }
  .card3d {
    display: grid;
    transform-style: preserve-3d;
    transition: transform var(--dur-flip) var(--ease-in-out);
  }
  .flipped .card3d {
    transform: rotateY(180deg);
  }
  .face {
    grid-area: 1 / 1;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    min-width: 0;
  }
  .back {
    transform: rotateY(180deg);
  }
  /* Mouvement réduit : pas de 3D, la face visible apparaît en fondu */
  @media (prefers-reduced-motion: reduce) {
    :global(:root:not([data-motion='full'])) .card3d {
      transform: none;
      transition: none;
    }
    :global(:root:not([data-motion='full'])) .back {
      transform: none;
    }
    :global(:root:not([data-motion='full'])) .face {
      transition: opacity var(--dur-fade) var(--ease-out);
    }
    :global(:root:not([data-motion='full'])) .face[aria-hidden='true'] {
      opacity: 0;
      visibility: hidden;
    }
  }
  :global(:root[data-motion='reduced']) .card3d {
    transform: none;
    transition: none;
  }
  :global(:root[data-motion='reduced']) .back {
    transform: none;
  }
  :global(:root[data-motion='reduced']) .face[aria-hidden='true'] {
    opacity: 0;
    visibility: hidden;
  }
</style>
