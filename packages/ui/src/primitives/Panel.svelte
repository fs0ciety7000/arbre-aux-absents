<!--
	Panneau du Bureau (DESIGN.md §9.4) : Arbre, Archives, Lecteur, Carnet…
	Un en-tête (titre réel hN, surtitre, actions, fermer) et un corps défilant.
	`surface="paper"` bascule tout le contenu dans le contexte papier.
	Téléphone (< 600 px) : rayon 0, bord à bord.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';

  interface Props {
    title: string;
    headingLevel?: 1 | 2 | 3;
    kicker?: string;
    surface?: 'desk' | 'paper';
    as?: 'section' | 'aside' | 'div';
    /** Corps défilant (déf. true) ; sinon le contenu gère son propre défilement (carte, arbre). */
    scroll?: boolean;
    padded?: boolean;
    /** Masque visuellement l'en-tête (le titre reste pour les lecteurs d'écran). */
    hideHeader?: boolean;
    closeLabel?: string;
    onclose?: () => void;
    actions?: Snippet;
    footer?: Snippet;
    children?: Snippet;
    id?: string;
    class?: string;
  }

  let {
    title,
    headingLevel = 2,
    kicker,
    surface = 'desk',
    as = 'section',
    scroll = true,
    padded = true,
    hideHeader = false,
    closeLabel = 'Fermer le panneau',
    onclose,
    actions,
    footer,
    children,
    id = `panel-${Math.random().toString(36).slice(2, 8)}`,
    class: className = '',
  }: Props = $props();
</script>

<svelte:element
  this={as}
  {id}
  class="panel {surface} {className}"
  class:grain={surface === 'paper'}
  data-surface={surface === 'paper' ? 'paper' : undefined}
  aria-labelledby="{id}-title"
>
  <header class="head" class:visually-hidden={hideHeader}>
    <div class="titles">
      {#if kicker}<p class="kicker">{kicker}</p>{/if}
      <svelte:element this={`h${headingLevel}`} id="{id}-title" class="title"
        >{title}</svelte:element
      >
    </div>
    {#if actions || onclose}
      <div class="actions">
        {@render actions?.()}
        {#if onclose}
          <IconButton icon="close" label={closeLabel} onclick={onclose} />
        {/if}
      </div>
    {/if}
  </header>
  <div class="body" class:scroll class:padded>
    {@render children?.()}
  </div>
  {#if footer}
    <footer class="foot">{@render footer()}</footer>
  {/if}
</svelte:element>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    color: var(--text);
    background: var(--surface-1);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-2);
    overflow: hidden;
  }
  .paper {
    background: var(--canvas);
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-paper);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: var(--hit-row);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
    border-block-end: var(--border) solid var(--line);
  }
  .titles {
    min-width: 0;
  }
  .kicker {
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .title {
    font-family: var(--font-display);
    font-size: var(--step-1);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex: none;
  }
  .body {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  .scroll {
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }
  .padded {
    padding: var(--space-4);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-block-start: var(--border) solid var(--line);
    background: var(--surface-2);
  }
  /* Téléphone : panneau plein écran, bord à bord (DESIGN §5.3) */
  @media (max-width: 37.4375rem) {
    .panel,
    .paper {
      border-radius: 0;
    }
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
