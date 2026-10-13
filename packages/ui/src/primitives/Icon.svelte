<!--
	Icône décorative du jeu (DESIGN.md §8). Toujours aria-hidden : le nom accessible
	est porté par le contrôle qui la contient.
-->
<script lang="ts">
  import { ICONS, type IconName } from './icons';

  interface Props {
    name: IconName;
    /** Taille CSS (défaut 1.25em : suit le texte). */
    size?: string;
    /** Épaisseur du trait en unités de la grille 24. */
    weight?: number;
    class?: string;
  }

  let { name, size = '1.25em', weight = 1.75, class: className = '' }: Props = $props();
  const paths = $derived(ICONS[name] ?? []);
</script>

<svg
  class="icon {className}"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={weight}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#each paths as d, i (i)}
    <path {d} />
  {/each}
</svg>

<style>
  .icon {
    flex: none;
    display: inline-block;
    vertical-align: -0.2em;
  }
</style>
