<!--
  La carte du monde, statique (prérendue, sans JS) : les couches du cartographe dans un seul SVG.
  `viewBox` recadre ; sans art (cartographe pas encore livré), un cadre papier avec le titre.
-->
<script lang="ts">
  import type { SvgNode } from '#lib/svg/parse';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';

  interface Props {
    map: SvgNode | null;
    label: string;
    viewBox?: string;
    class?: string;
  }
  let { map, label, viewBox, class: className = '' }: Props = $props();
</script>

{#if map}
  <ArtSvg node={map} {label} {viewBox} class="map-art {className}" />
{:else}
  <div class="map-missing {className}" role="img" aria-label={label}>
    <span aria-hidden="true">La Velmarche</span>
  </div>
{/if}

<style>
  :global(.map-art) {
    display: block;
    inline-size: 100%;
    block-size: auto;
    background: var(--art-paper);
  }
  .map-missing {
    display: grid;
    place-items: center;
    aspect-ratio: 1.35;
    background: var(--art-paper);
    color: var(--art-ink);
    font-family: var(--font-display);
    font-size: var(--step-3);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
</style>
