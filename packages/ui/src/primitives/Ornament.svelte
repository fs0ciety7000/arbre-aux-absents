<!--
	Ornement encré (DESIGN.md §10) : coin de cadre, fougère, filet, sceau, trombone, punaise,
	volute. Décoratif : aria-hidden. Couleur = currentColor (ex. color: var(--brand)) ;
	`--ornament-tone` colore les parties secondaires (tête de punaise : vermillon par défaut).
	`flip` : miroir (coins des autres angles) ; `rotate` en degrés.
-->
<script lang="ts">
  import { ORNAMENTS, type OrnamentName } from './ornaments';

  interface Props {
    name: OrnamentName;
    /** Largeur CSS (la hauteur suit le ratio). Déf. : largeur native en px. */
    size?: string;
    weight?: number;
    flip?: 'x' | 'y' | 'xy';
    rotate?: number;
    class?: string;
  }

  let { name, size, weight = 1.4, flip, rotate = 0, class: className = '' }: Props = $props();
  const o = $derived(ORNAMENTS[name]);
  const sx = $derived(flip === 'x' || flip === 'xy' ? -1 : 1);
  const sy = $derived(flip === 'y' || flip === 'xy' ? -1 : 1);
</script>

<svg
  class="ornament {name} {className}"
  viewBox="0 0 {o.w} {o.h}"
  width={size ?? `${o.w}px`}
  fill="none"
  stroke="currentColor"
  stroke-width={weight}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  style:transform={sx !== 1 || sy !== 1 || rotate
    ? `scale(${sx}, ${sy}) rotate(${rotate}deg)`
    : undefined}
>
  {#each o.tone as d, i (i)}
    <path {d} class="tone" />
  {/each}
  {#each o.paths as d, i (i)}
    <path {d} />
  {/each}
  {#each o.fills as d, i (i)}
    <path {d} class="fill" />
  {/each}
</svg>

<style>
  .ornament {
    display: block;
    height: auto;
    overflow: visible;
  }
  .tone {
    fill: var(--ornament-tone, var(--pin-head));
    stroke: none;
  }
  .fill {
    fill: var(--ornament-fill, var(--paper-new));
    stroke: none;
    opacity: 0.7;
  }
  @media (forced-colors: active) {
    .tone {
      fill: CanvasText;
    }
  }
</style>
