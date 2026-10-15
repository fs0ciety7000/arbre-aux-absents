<!--
  La carte de la Velmarche posée comme une feuille, qui s'encre couche par couche à l'entrée dans
  la vue (DESIGN §13.6) : fond, puis détail (relief, eaux, vignettes), puis toponymes, chacun dans
  un InkReveal de rang croissant, retenus par data-play jusqu'à l'entrée dans la vue.
  Sans JS ou en mouvement réduit : la carte est là, entière.
-->
<script lang="ts">
  import { InkReveal, PaperSheet } from '@arbre/ui';
  import type { ArtImage } from '#lib/prerender/art';
  import type { SvgNode } from '#lib/svg/parse';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';

  interface Props {
    map: { viewBox: string; images: ArtImage[]; text: SvgNode } | null;
    label: string;
    tilt?: number;
    /** Titre affiché tant que la carte manque (cartographe pas encore livré). */
    fallback?: string;
  }
  let { map, label, tilt = -0.6, fallback = 'La Velmarche' }: Props = $props();
</script>

<div data-play>
  <PaperSheet tone="paper" {tilt} fastener="pin" padded={false} as="figure" class="map-sheet">
    {#if map}
      <div class="layers" role="img" aria-label={label}>
        {#each map.images as img, i (img.src)}
          <InkReveal from={i === 0 ? 'left' : 'top'} index={i * 2} class="layer">
            <img
              class="art-img"
              src={img.src}
              width={img.width}
              height={img.height}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </InkReveal>
        {/each}
        <InkReveal from="left" index={map.images.length * 2} blur class="layer">
          <ArtSvg node={map.text} />
        </InkReveal>
      </div>
    {:else}
      <div class="missing" role="img" aria-label={label}>
        <span aria-hidden="true">{fallback}</span>
      </div>
    {/if}
  </PaperSheet>
</div>

<style>
  .layers {
    position: relative;
    aspect-ratio: 1350 / 1000;
    margin: var(--space-2);
    background: var(--art-paper);
    overflow: hidden;
  }
  .layers :global(.layer) {
    position: absolute;
    inset: 0;
  }
  .layers :global(.layer svg) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  .missing {
    display: grid;
    place-items: center;
    aspect-ratio: 1350 / 1000;
    font-family: var(--font-display);
    font-size: var(--step-3);
    color: var(--ink);
  }
</style>
