<!--
  Séparateur de section (DESIGN §8.5, §14.2) : la vigne de fougère (art/keyart/flourish-fern-vine,
  servie en SVG autonome) se dessine à l'encre de gauche à droite (InkReveal, balayage + encre qui
  sèche) quand elle entre dans la vue (data-play, lib/enhance/scroll-motion.js). Décor.
-->
<script lang="ts">
  import { InkReveal } from '@arbre/ui';
  import type { ArtImage } from '#lib/prerender/art';

  let { vine }: { vine: ArtImage } = $props();
</script>

<div class="vine" data-play aria-hidden="true">
  <InkReveal from="left" blur>
    <img
      class="art-img"
      src={vine.src}
      width={vine.width}
      height={vine.height}
      alt=""
      loading="lazy"
      decoding="async"
    />
  </InkReveal>
</div>

<style>
  .vine {
    inline-size: min(40rem, 86%);
    margin-inline: auto;
    padding-block: var(--space-6);
  }
</style>
