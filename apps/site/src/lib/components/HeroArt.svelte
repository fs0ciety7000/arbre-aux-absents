<!--
  Art clé du héros (DESIGN §8.5, §14.1) : « Le bureau sous la lampe », 16:9 au-dessus de 760 px,
  4:5 recomposé en dessous, choisi par <picture> (sans JS). Le fond est une image autonome mise en
  cache (LCP) ; par-dessus, la scène vivante (rideau, lampe, poussières, vapeur) est inline dans
  <KeyArt animate>, au même cadrage (prerender/keyart.ts). Bords fondus dans le bureau (« edges »
  en 16:9, « bottom » en 4:5). Mouvement réduit : KeyArt est figé, l'image reste complète.
-->
<script lang="ts">
  import { KeyArt } from '@arbre/ui';
  import type { ArtImage } from '#lib/prerender/art';

  interface Props {
    images: { wide: ArtImage; tall: ArtImage };
    live: { wide: string; tall: string };
    alt: string;
    /** Image prioritaire (héros de l'accueil) ou différée (page /design). */
    priority?: boolean;
    /** Un seul cadrage, quelle que soit la largeur (démo /design) ; déf. selon l'écran. */
    only?: 'wide' | 'tall';
    class?: string;
  }
  let { images, live, alt, priority = true, only, class: className = '' }: Props = $props();
  const pick = $derived(only ? images[only] : images.wide);
</script>

<div
  class="hero-art {className}"
  class:only-wide={only === 'wide'}
  class:only-tall={only === 'tall'}
>
  <picture>
    {#if !only}
      <source
        media="(max-width: 47.4375rem)"
        srcset={images.tall.src}
        width={images.tall.width}
        height={images.tall.height}
      />
    {/if}
    <img
      class="still"
      src={pick.src}
      width={pick.width}
      height={pick.height}
      {alt}
      decoding={priority ? 'sync' : 'async'}
      fetchpriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
    />
  </picture>
  {#if only !== 'tall'}<KeyArt svg={live.wide} anchor="start" fade="none" class="live wide" />{/if}
  {#if only !== 'wide'}<KeyArt svg={live.tall} anchor="start" fade="none" class="live tall" />{/if}
</div>

<style>
  .hero-art {
    position: relative;
    overflow: hidden;
    background: var(--desk);
    mask-image:
      linear-gradient(to right, transparent, #000 7%, #000 93%, transparent),
      linear-gradient(to bottom, #000 80%, transparent);
    mask-composite: intersect;
  }
  picture,
  .still {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
  }
  .still {
    object-fit: cover;
    object-position: left center;
  }
  /* La scène vivante se pose sur le fond : transparente, même boîte. */
  .hero-art :global(.live) {
    position: absolute;
    inset: 0;
    background: transparent;
  }
  .hero-art :global(.live.tall) {
    display: none;
  }
  .only-wide {
    aspect-ratio: 16 / 9;
  }
  .only-tall {
    aspect-ratio: 4 / 5;
    mask-image: linear-gradient(to bottom, #000 62%, transparent 99%);
  }
  .only-tall :global(.live.tall) {
    display: block;
  }
  @media (max-width: 47.4375rem) {
    .hero-art:not(.only-wide, .only-tall) {
      mask-image: linear-gradient(to bottom, #000 62%, transparent 99%);
    }
    .hero-art:not(.only-wide, .only-tall) :global(.live.wide) {
      display: none;
    }
    .hero-art:not(.only-wide, .only-tall) :global(.live.tall) {
      display: block;
    }
  }
  @media (forced-colors: active) {
    .hero-art {
      display: none;
    }
  }
</style>
