<!--
	Groupe des tampons de décision (DESIGN.md §6.11) : `<fieldset>` + `<legend>` autour des
	`DecisionCard` d'un même `name` (groupe radio natif : Tab entre en un seul arrêt, flèches
	changent la décision et sautent les fiches indisponibles). Empilées sous 600 px (37,5 rem),
	en ligne au-delà, colonnes égales. `legendHidden` : légende lue mais masquée.
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

<fieldset class="decisions {className}">
  <legend class={legendHidden ? 'visually-hidden' : 'kicker'}>{legend}</legend>
  <div class="row">{@render children()}</div>
</fieldset>

<style>
  .decisions {
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    padding: 0;
    margin-block-end: var(--space-3);
  }
  .row {
    display: grid;
    gap: var(--space-4);
    /* place pour le tampon et le soulèvement */
    padding-block: var(--space-2);
  }
  @media (min-width: 37.5rem) {
    .row {
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
