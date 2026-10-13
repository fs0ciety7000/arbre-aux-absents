<!--
	Bouton icône (DESIGN.md §9.2) : rail du Bureau, en-tête, outils du Lecteur.
	`label` est obligatoire (nom accessible) ; il s'affiche aussi en info-bulle au survol
	et au focus clavier, sans jamais porter seul une information.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from './Icon.svelte';
  import type { IconName } from './icons';

  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    label: string;
    icon?: IconName;
    variant?: 'secondary' | 'ghost' | 'primary';
    size?: 'm' | 'l';
    /** Bascule : rend aria-pressed. */
    pressed?: boolean;
    /** Pastille (non lus…) ; `badgeLabel` complète le nom accessible. */
    badge?: number | string;
    badgeLabel?: string;
    /** Info-bulle visuelle (déf. true). */
    tooltip?: boolean;
    tooltipPlacement?: 'top' | 'bottom' | 'start' | 'end';
    children?: Snippet;
  }

  let {
    label,
    icon,
    variant = 'ghost',
    size = 'm',
    pressed,
    badge,
    badgeLabel,
    tooltip = true,
    tooltipPlacement = 'bottom',
    type = 'button',
    children,
    class: className = '',
    ...rest
  }: Props = $props();

  const name = $derived(badgeLabel ? `${label}, ${badgeLabel}` : label);
</script>

<button
  {...rest}
  {type}
  class="ibtn {variant} {size} {className}"
  aria-label={name}
  aria-pressed={pressed === undefined ? undefined : pressed}
>
  {#if children}{@render children()}{:else if icon}<Icon name={icon} size="1.5rem" />{/if}
  {#if badge !== undefined && badge !== 0}
    <span class="badge num" aria-hidden="true">{badge}</span>
  {/if}
  {#if tooltip}
    <span class="tip {tooltipPlacement}" aria-hidden="true">{label}</span>
  {/if}
</button>

<style>
  .ibtn {
    position: relative;
    isolation: isolate;
    display: inline-grid;
    place-items: center;
    width: var(--hit);
    height: var(--hit);
    padding: 0;
    border: var(--border) solid transparent;
    border-radius: var(--radius-m);
    color: var(--text-muted);
    background: transparent;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-snap);
  }
  .l {
    width: var(--hit-l);
    height: var(--hit-l);
  }
  .ibtn::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: var(--accent-tint);
    opacity: 0;
    transition: opacity var(--dur-fade-fast) var(--ease-out);
  }
  .ibtn:hover {
    color: var(--text);
  }
  .ibtn:hover::before {
    opacity: 1;
  }
  .ibtn:active:not(:disabled) {
    transform: scale(0.92);
  }
  /* v2 : l'icône pivote d'un rien au survol (outil qu'on prend en main) */
  .ibtn :global(.icon) {
    transition: transform var(--dur-base) var(--ease-snap);
  }
  @media (hover: hover) {
    .ibtn:hover:not(:disabled) :global(.icon) {
      transform: rotate(-10deg) scale(1.08);
    }
  }
  .secondary {
    background: var(--surface-2);
    border-color: var(--line-strong);
    color: var(--text);
    box-shadow: var(--shadow-1);
  }
  .primary {
    background: var(--accent);
    color: var(--accent-contrast);
  }
  .primary::before {
    background: var(--accent-strong);
  }
  /* Bascule active : fond lampe + barre (forme, pas seulement couleur) */
  .ibtn[aria-pressed='true'] {
    color: var(--accent);
    background: var(--accent-tint);
    border-color: var(--accent);
  }
  .ibtn:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .ibtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .badge {
    position: absolute;
    inset-block-start: 2px;
    inset-inline-end: 2px;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 var(--space-1);
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: var(--accent-contrast);
    font-size: 0.75rem;
    font-weight: var(--weight-bold);
    line-height: 1;
    box-shadow: 0 0 0 2px var(--canvas);
    animation: m-pop var(--dur-base) var(--ease-snap);
  }

  /* Info-bulle v2 : bande d'étiqueteuse (lettres en relief), qui se colle d'un coup sec */
  .tip {
    position: absolute;
    z-index: var(--z-tooltip);
    padding: var(--space-1) var(--space-2);
    border-radius: 2px;
    background: var(--label-tape);
    color: var(--label-tape-text);
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    white-space: nowrap;
    pointer-events: none;
    box-shadow:
      inset 0 1px 0 var(--label-sheen),
      0 0 0 1px var(--focus-halo),
      var(--shadow-2);
    opacity: 0;
    transform: translate(var(--tx, -50%), var(--ty, 0)) scale(0.9);
    transition:
      opacity var(--dur-fade-fast) var(--ease-out),
      transform var(--dur-base) var(--ease-snap);
  }
  .tip.bottom {
    inset-block-start: calc(100% + var(--space-2));
    inset-inline-start: 50%;
  }
  .tip.top {
    inset-block-end: calc(100% + var(--space-2));
    inset-inline-start: 50%;
  }
  .tip.end {
    inset-inline-start: calc(100% + var(--space-2));
    inset-block-start: 50%;
    --tx: 0;
    --ty: -50%;
  }
  .tip.start {
    inset-inline-end: calc(100% + var(--space-2));
    inset-block-start: 50%;
    --tx: 0;
    --ty: -50%;
  }
  .ibtn:hover .tip,
  .ibtn:focus-visible .tip {
    opacity: 1;
    transform: translate(var(--tx, -50%), var(--ty, 0));
    transition-delay: var(--tooltip-delay);
  }
  .ibtn:focus-visible .tip {
    transition-delay: 0ms;
  }
  @media (hover: none) {
    .tip {
      display: none;
    }
  }
  @media (forced-colors: active) {
    .ibtn[aria-pressed='true'] {
      border-color: Highlight;
    }
    .tip {
      border: 1px solid CanvasText;
    }
  }
</style>
