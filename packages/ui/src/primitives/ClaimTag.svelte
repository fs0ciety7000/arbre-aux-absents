<!--
	Cartouche « Déclaré » de la case revendiquée (DESIGN.md §6.9, AFFAIRE-2 §1.3) : un
	bout de formulaire agrafé en tête de fiche. Papier `--claim-paper`, encre `--claim-ink`,
	agrafe 16 px, Oswald capitales, 20 px de haut (grandit avec le texte du joueur).
	`straddle` : à cheval sur le bord haut de la fiche (l'hôte est positionné).
	`shown` : pose ou dégrafe le cartouche (transition `unclaim`, 0 ms en mouvement réduit).
	`decorative` : `aria-hidden` quand l'hôte porte déjà « case revendiquée » dans son nom
	accessible (case de l'arbre : le bouton a un `aria-label`).
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  import Icon from './Icon.svelte';
  import { unclaim } from '../motion';

  interface Props {
    /** Texte du cartouche (déf. « Déclaré »). */
    label?: string;
    /** À cheval sur le bord haut de la fiche (position absolue). */
    straddle?: boolean;
    /** Présent (true) ou dégrafé (false), avec transition. */
    shown?: boolean;
    /** Décor seulement (le nom accessible de l'hôte le dit déjà). */
    decorative?: boolean;
    class?: string;
  }

  let {
    label: labelProp,
    straddle = false,
    shown = true,
    decorative = false,
    class: className = '',
  }: Props = $props();
  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.claimTag.label);
</script>

{#if shown}
  <span
    class="claim-tag {className}"
    class:straddle
    aria-hidden={decorative ? 'true' : undefined}
    transition:unclaim
  >
    <span class="staple"><Icon name="staple" size="16px" clean weight={2} /></span>
    <span class="text">{label}</span>
  </span>
{/if}

<style>
  .claim-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-block-size: var(--claim-tag-h);
    padding: 0 var(--space-2) 0 var(--space-1);
    background: var(--claim-paper);
    color: var(--claim-ink);
    border: 1px solid var(--claim-edge);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-1);
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    line-height: 1;
    white-space: nowrap;
    rotate: -1.5deg; /* propriété propre : la transition `unclaim` anime `transform` */
    user-select: none;
  }
  .straddle {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(var(--claim-tag-h) * -0.5);
    inset-inline-start: var(--space-3);
    pointer-events: none;
  }
  .staple {
    display: inline-flex;
    flex: none;
  }
  .text {
    padding-block: 2px 1px;
  }
  @media (forced-colors: active) {
    .claim-tag {
      background: Canvas;
      color: CanvasText;
      border-color: CanvasText;
      box-shadow: none;
    }
  }
</style>
