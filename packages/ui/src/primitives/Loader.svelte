<!--
	Indicateur de chargement (DESIGN.md §9.19) : une plume qui écrit. Affiché seulement
	au-delà de 300 ms (`delay`). Statique en mouvement réduit (le texte reste).
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  interface Props {
    label?: string;
    /** Montre aussi le libellé à l'écran. */
    showLabel?: boolean;
    /** Délai d'apparition en ms (déf. 300). */
    delay?: number;
  }
  let { label: labelProp, showLabel = false, delay = 300 }: Props = $props();
  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.loader.label);
</script>

<span class="loader" role="status" style:--delay="{delay}ms">
  <svg viewBox="0 0 24 24" width="1.5em" height="1.5em" aria-hidden="true">
    <path class="line" d="M3 20.5h9" />
    <g class="quill">
      <path d="M20 3C11 4 7 10 6 18" />
      <path d="M6 18l-2 3" />
      <path d="M8 13c3 0 6-2 8-6" />
    </g>
  </svg>
  <span class:visually-hidden={!showLabel}>{label}</span>
</span>

<style>
  .loader {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted);
    animation: appear var(--dur-fade) var(--ease-out) var(--delay) both;
  }
  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .quill {
    transform-origin: 4px 21px;
    animation: write var(--dur-loop) var(--ease-in-out) var(--delay) infinite alternate;
  }
  .line {
    transform-origin: 3px 20.5px;
    animation: line var(--dur-loop) var(--ease-in-out) var(--delay) infinite alternate;
  }
  @keyframes appear {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes write {
    from {
      transform: rotate(-6deg) translateX(-1px);
    }
    to {
      transform: rotate(4deg) translateX(5px);
    }
  }
  @keyframes line {
    from {
      transform: scaleX(0.2);
    }
    to {
      transform: scaleX(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:root:not([data-motion='full'])) .quill,
    :global(:root:not([data-motion='full'])) .line {
      animation: none;
    }
  }
  :global(:root[data-motion='reduced']) .quill,
  :global(:root[data-motion='reduced']) .line {
    animation: none;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
