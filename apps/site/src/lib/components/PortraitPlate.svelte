<!-- Planche de portrait : tirage sur papier, légende graphique (jamais de nom : pas de spoiler). -->
<script lang="ts">
  import type { PortraitPlate } from '#lib/content/portraits';
  import type { SvgNode } from '#lib/svg/parse';
  import ArtSvg from '#lib/svg/ArtSvg.svelte';

  interface Props {
    plate: Omit<PortraitPlate, 'person'> & { node: SvgNode | null };
    /** Inclinaison décorative (bornée à ±1,5°, DESIGN §7). */
    tilt?: number;
    caption?: boolean;
  }
  let { plate, tilt = 0, caption = true }: Props = $props();
  const angle = $derived(Math.max(-1.5, Math.min(1.5, tilt)));
</script>

<figure class="plate grain" data-surface="paper" style:--plate-tilt="{angle}deg">
  {#if plate.node}
    <ArtSvg node={plate.node} label={plate.alt} class="portrait" />
  {:else}
    <div class="missing" role="img" aria-label="Portrait à venir">
      <span aria-hidden="true">Portrait à venir</span>
    </div>
  {/if}
  {#if caption}
    <figcaption>
      <span class="num">Planche {plate.plate}</span>
      {plate.caption}
    </figcaption>
  {/if}
</figure>

<style>
  .plate {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: var(--space-3) var(--space-3) var(--space-4);
    border-radius: var(--radius-paper);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
    rotate: var(--plate-tilt);
    break-inside: avoid;
  }
  .plate :global(.portrait),
  .missing {
    inline-size: 100%;
    aspect-ratio: 160 / 200;
    block-size: auto;
  }
  .missing {
    display: grid;
    place-items: center;
    border: var(--border) dashed var(--line-strong);
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  figcaption {
    display: grid;
    gap: var(--space-1);
    font-family: var(--font-read);
    font-size: var(--step--1);
    line-height: var(--leading-snug);
    color: var(--text-muted);
  }
  .num {
    font-family: var(--font-ui);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--text);
  }
</style>
