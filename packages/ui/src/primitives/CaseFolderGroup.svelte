<!--
	Rayonnage des chemises d'affaire (DESIGN.md §6.10, E04) : `<fieldset>` + `<legend>` autour
	des `CaseFolder` d'un même `name` (groupe radio natif : flèches, Tab entre en un seul
	arrêt). Empilées sous 600 px (37,5 rem), côte à côte au-delà, colonnes égales.
	`legendHidden` : légende lue mais masquée quand l'écran porte déjà un titre visible.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    legend: string;
    legendHidden?: boolean;
    children: Snippet;
    class?: string;
  }

  let { legend, legendHidden = false, children, class: className = '' }: Props = $props();
</script>

<fieldset class="case-folders {className}">
  <legend class={legendHidden ? 'visually-hidden' : 'kicker'}>{legend}</legend>
  <div class="shelf">{@render children()}</div>
</fieldset>

<style>
  .case-folders {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    margin-block-end: var(--space-3);
  }
  .shelf {
    display: grid;
    gap: var(--space-5) var(--space-4);
    /* place pour l'onglet et le tampon qui débordent en haut */
    padding-block-start: var(--space-2);
  }
  @media (min-width: 37.5rem) {
    .shelf {
      grid-auto-flow: column;
      grid-auto-columns: minmax(0, 1fr);
    }
  }
  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
