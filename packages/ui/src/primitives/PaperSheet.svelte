<!--
	Feuille de papier posée sur le bureau (DESIGN.md §6.1) : grain, ombre chaude, inclinaison,
	bord déchiré ou perforé, attaches (ruban aux coins, trombone, punaise), balancement
	d'ambiance si épinglée. Contexte papier pour le contenu.
	`enter` : `settle` (se pose), `sheet` (tirée d'une chemise), `deal` (distribuée).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Ornament from './Ornament.svelte';
  import Tape from './Tape.svelte';

  interface Props {
    tone?: 'new' | 'paper' | 'aged';
    /** Inclinaison en degrés (bornée à ±3). */
    tilt?: number;
    edge?: 'straight' | 'torn' | 'perforated';
    fastener?: 'none' | 'tape' | 'clip' | 'pin';
    /** Balancement d'ambiance (feuille épinglée) — coupé en mouvement réduit. */
    sway?: boolean;
    enter?: 'settle' | 'sheet' | 'deal' | false;
    /** Rang dans une cascade d'entrées. */
    index?: number;
    as?: 'div' | 'article' | 'section' | 'figure';
    padded?: boolean;
    children?: Snippet;
    class?: string;
  }
  let {
    tone = 'paper',
    tilt = 0,
    edge = 'straight',
    fastener = 'none',
    sway = false,
    enter = false,
    index = 0,
    as = 'div',
    padded = true,
    children,
    class: className = '',
  }: Props = $props();
  const angle = $derived(Math.max(-3, Math.min(3, tilt)));
</script>

<svelte:element
  this={as}
  class="sheet-wrap {className}"
  class:mv-settle={enter === 'settle'}
  class:mv-sheet={enter === 'sheet'}
  class:mv-deal={enter === 'deal'}
  style:--tilt="{angle}deg"
  style:--i={index}
>
  <div class="sway-layer" class:mv-sway={sway}>
    <div
      class="mat-paper sheet {tone}"
      class:edge-torn={edge === 'torn'}
      class:edge-perforated={edge === 'perforated'}
      class:padded
      data-surface="paper"
    >
      {@render children?.()}
    </div>
    {#if fastener === 'tape'}
      <Tape class="tape tl" rotate={-38} length="76px" />
      <Tape class="tape tr" rotate={38} length="76px" />
    {:else if fastener === 'clip'}
      <span class="clip"><Ornament name="clip" size="22px" weight={1.6} /></span>
    {:else if fastener === 'pin'}
      <span class="pin"><Ornament name="pin" size="30px" weight={1.2} /></span>
    {/if}
  </div>
</svelte:element>

<style>
  .sheet-wrap {
    position: relative;
    display: block;
    transform: rotate(var(--tilt));
    min-width: 0;
  }
  .sway-layer {
    --tilt: 0deg;
    position: relative;
    height: 100%;
  }
  .sheet {
    height: 100%;
  }
  .new {
    background: var(--paper-new);
  }
  .aged {
    background: var(--paper-aged);
  }
  .padded {
    padding: var(--space-6) var(--space-5);
  }
  .edge-torn.padded {
    padding-block-end: calc(var(--space-6) + 10px);
  }
  .edge-perforated.padded {
    padding-block-start: calc(var(--space-6) + 8px);
  }
  /* Les masques de bord suppriment l'ombre portée : on la remet sur l'enveloppe */
  .sheet-wrap:has(.edge-torn, .edge-perforated) {
    filter: drop-shadow(0 6px 8px var(--vignette));
  }
  .sheet-wrap :global(.tape) {
    position: absolute;
    z-index: 1;
  }
  .sheet-wrap :global(.tape.tl) {
    inset-block-start: -6px;
    inset-inline-start: -22px;
  }
  .sheet-wrap :global(.tape.tr) {
    inset-block-start: -6px;
    inset-inline-end: -22px;
  }
  .clip {
    position: absolute;
    z-index: 1;
    inset-block-start: -18px;
    inset-inline-end: 28px;
    color: var(--metal);
    filter: drop-shadow(1px 2px 1px var(--vignette));
  }
  .pin {
    position: absolute;
    z-index: 1;
    inset-block-start: -10px;
    inset-inline-start: 50%;
    translate: -50% 0;
    color: var(--metal-shade);
    filter: drop-shadow(2px 4px 2px var(--vignette));
  }
</style>
