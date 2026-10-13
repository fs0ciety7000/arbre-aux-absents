<!--
	Icône du jeu (DESIGN.md §9), encrée à la main : tracé principal irrégulier + second
	passage d'encre fin et translucide (ICON_RETRACE). Toujours aria-hidden : le nom
	accessible est porté par le contrôle qui la contient.
	`wash` : tache d'aquarelle derrière le trait (pigment = couleur CSS, ex. var(--fern)).
	`clean` : géométrie nette, sans ondulation (très petites tailles, ≤ 14 px).
-->
<script lang="ts">
  import { ICONS, ICON_GEOMETRY, ICON_RETRACE, type IconName } from './icons';

  interface Props {
    name: IconName;
    /** Taille CSS (défaut 1.25em : suit le texte). */
    size?: string;
    /** Épaisseur du trait en unités de la grille 24. */
    weight?: number;
    /** Lavis derrière l'icône : `true` (couleur du texte, 16 %) ou une couleur CSS. */
    wash?: boolean | string;
    /** Géométrie nette, sans encrage (petites tailles). */
    clean?: boolean;
    class?: string;
  }

  let {
    name,
    size = '1.25em',
    weight = 1.75,
    wash = false,
    clean = false,
    class: className = '',
  }: Props = $props();
  const paths = $derived((clean ? ICON_GEOMETRY[name] : ICONS[name]) ?? []);
  const retrace = $derived(clean ? undefined : ICON_RETRACE[name]);
  const washColor = $derived(typeof wash === 'string' ? wash : 'currentColor');
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
  {#if wash}
    <!-- tache de lavis : contour irrégulier, bord plus foncé (l'eau qui sèche) -->
    <path
      class="wash"
      d="M5.2 8.1c1.4-3.6 6-5.1 9.8-4.2 3.9.9 6.4 4.4 5.6 8.3-.7 3.6-2.6 6.9-6.6 7.7-4.3.9-9-1.2-9.9-5.1-.4-2 .3-4.6 1.1-6.7z"
      fill={washColor}
      stroke={washColor}
      stroke-width="0.6"
    />
  {/if}
  {#each paths as d, i (i)}
    <path {d} />
  {/each}
  {#if retrace}
    <path class="retrace" d={retrace} stroke-width={weight * 0.4} />
  {/if}
</svg>

<style>
  .icon {
    flex: none;
    display: inline-block;
    vertical-align: -0.2em;
    overflow: visible;
  }
  .retrace {
    opacity: 0.5;
  }
  .wash {
    fill-opacity: 0.2;
    stroke-opacity: 0.32;
  }
  @media (forced-colors: active) {
    .wash {
      display: none;
    }
  }
</style>
