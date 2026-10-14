<!--
	Fiche bristol (DESIGN.md §6.3) : réglure bleue, ligne de tête vermillon, intitulé tapé
	à la machine, cote à droite. Conteneur de contenu (non interactif) ; pour une fiche
	cliquable, utiliser `Card variant="index"`. Contexte papier pour tout le contenu.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import ClaimTag from './ClaimTag.svelte';

  interface Props {
    title?: string;
    headingLevel?: 2 | 3 | 4;
    /** Référence en haut à droite (« RG-09 », « 1924 »). */
    cote?: string;
    /** Inclinaison décorative (±2°). */
    tilt?: number;
    /** Rang de distribution : la fiche arrive en cascade à l'apparition. */
    deal?: number;
    /**
     * Case revendiquée (§6.9) : bord en tirets et cartouche « Déclaré » agrafé en tête.
     * Les valeurs déclarées du contenu portent la classe `.claim-value`.
     */
    claimed?: boolean;
    /** Texte du cartouche (déf. « Déclaré »). */
    claimLabel?: string;
    children?: Snippet;
    class?: string;
  }
  let {
    title,
    headingLevel = 3,
    cote,
    tilt = 0,
    deal,
    claimed = false,
    claimLabel,
    children,
    class: className = '',
  }: Props = $props();
  const angle = $derived(Math.max(-2, Math.min(2, tilt)));
</script>

<div
  class="mat-card index-card {className}"
  class:mv-deal={deal !== undefined}
  class:claim-frame={claimed}
  data-surface="paper"
  style:--tilt="{angle}deg"
  style:--i={deal}
  style:transform="rotate({angle}deg)"
>
  <ClaimTag shown={claimed} straddle label={claimLabel} />
  {#if title || cote}
    <div class="head">
      {#if title}<svelte:element this={`h${headingLevel}`} class="title">{title}</svelte:element
        >{/if}
      {#if cote}<span class="cote num">{cote}</span>{/if}
    </div>
  {/if}
  <div class="body">{@render children?.()}</div>
</div>

<style>
  .index-card {
    /* le pas de la réglure suit la taille du texte et l'interlignage du joueur */
    --rule-gap: calc(var(--step-0) * max(1.7, var(--leading-read)));
    --head-h: calc(var(--rule-gap) * 1.5);
    padding: 0 var(--space-4) var(--space-3);
    min-width: 0;
    /* la réglure suit la tête, quelle que soit sa hauteur (titre sur deux lignes) */
    background-image: none;
  }
  .head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: var(--head-h);
    padding-block-end: calc(var(--rule-gap) * 0.18);
    margin-inline: calc(var(--space-4) * -1);
    padding-inline: var(--space-4);
    border-block-end: 2px solid var(--card-margin);
    padding-block-start: var(--space-3);
  }
  .title {
    font-family: var(--font-type);
    font-size: var(--step-0);
    font-weight: var(--weight-bold);
    font-variation-settings: normal;
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--ink-type);
    overflow-wrap: anywhere;
    line-height: 1.15;
  }
  .cote {
    font-family: var(--font-type);
    font-size: var(--step--1);
    color: var(--text-muted);
    flex: none;
  }
  /* Le texte se pose sur la réglure : interligne = pas de la réglure */
  .body {
    font-family: var(--font-type);
    font-size: var(--step-0);
    line-height: var(--rule-gap);
    color: var(--ink-type);
    padding-block-start: calc(var(--rule-gap) * 0.12);
    min-height: calc(var(--rule-gap) * 2);
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--rule-gap) - 1px),
      var(--card-rule) calc(var(--rule-gap) - 1px) var(--rule-gap)
    );
  }
</style>
