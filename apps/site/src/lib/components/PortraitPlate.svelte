<!--
  Planche de portrait v2 : une fiche bristol (IndexCard) qui porte le tirage, cote « Pl. I » en
  haut à droite, légende tapée sur la réglure. Jamais de nom (pas de spoiler).
-->
<script lang="ts">
  import { IndexCard } from '@arbre/ui';
  import type { PortraitPlate } from '#lib/content/portraits';
  import type { ArtImage } from '#lib/prerender/art';

  interface Props {
    /** `image` : SVG autonome externe (couleurs des tokens embarquées), chargé en différé. */
    plate: Omit<PortraitPlate, 'person'> & { image: ArtImage | null };
    /** Inclinaison décorative (±2°). */
    tilt?: number;
    caption?: boolean;
    /** Cote de la planche (déf. « Pl. I ») et texte du repli sans dessin, dans la langue de la page. */
    cote?: string;
    missing?: string;
  }
  let {
    plate,
    tilt = 0,
    caption = true,
    cote = `Pl. ${plate.plate}`,
    missing = 'Portrait à venir',
  }: Props = $props();
</script>

<IndexCard {cote} {tilt} class="plate">
  <figure>
    {#if plate.image}
      <img
        class="portrait"
        src={plate.image.src}
        width={plate.image.width}
        height={plate.image.height}
        alt={plate.alt}
        loading="lazy"
        decoding="async"
      />
    {:else}
      <div class="missing" role="img" aria-label={missing}>
        <span aria-hidden="true">{missing}</span>
      </div>
    {/if}
    {#if caption}
      <figcaption>{plate.caption}</figcaption>
    {/if}
  </figure>
</IndexCard>

<style>
  figure {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding-block-start: var(--space-3);
  }
  .portrait,
  .missing {
    display: block;
    inline-size: 100%;
    aspect-ratio: 160 / 200;
    block-size: auto;
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-1);
  }
  .missing {
    display: grid;
    place-items: center;
    border: var(--border) dashed var(--line-strong);
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  figcaption {
    font-size: var(--step--1);
    color: var(--ink-type);
  }
</style>
