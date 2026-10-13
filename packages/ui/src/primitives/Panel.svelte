<!--
	Panneau du Bureau (DESIGN.md §9.4) : Arbre, Archives, Lecteur, Carnet…
	Un en-tête (titre réel hN, surtitre, actions, fermer) et un corps défilant.
	`surface="paper"` bascule tout le contenu dans le contexte papier.
	`surface="kraft"` (v2) : chemise cartonnée (contexte kraft).
	v2 : le bureau est un sous-main surpiqué ; `enter` joue l'entrée au montage
	(`sheet` : feuille tirée d'une chemise ; `settle` : se pose). Clé côté appelant pour rejouer.
	Téléphone (< 600 px) : rayon 0, bord à bord.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';

  interface Props {
    title: string;
    headingLevel?: 1 | 2 | 3;
    kicker?: string;
    surface?: 'desk' | 'paper' | 'kraft';
    /** Entrée animée au montage (v2). */
    enter?: 'sheet' | 'settle' | false;
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
    enter = false,
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
  class:mv-sheet={enter === 'sheet'}
  class:mv-settle={enter === 'settle'}
  data-surface={surface === 'desk' ? undefined : surface}
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
    position: relative;
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
  /* Sous-main : surpiqûre en pointillés à 5 px du bord */
  .desk::after {
    content: '';
    position: absolute;
    inset: 5px;
    pointer-events: none;
    border: 1.5px dashed var(--stitch);
    border-radius: calc(var(--radius-l) - 4px);
  }
  .paper {
    background: var(--canvas);
    border: 0;
    border-radius: var(--radius-paper);
    box-shadow: var(--shadow-paper);
  }
  .kraft {
    background: var(--canvas);
    border: 0;
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-paper);
  }
  .kraft::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background-image: var(--kraft-fiber-image);
    mix-blend-mode: multiply;
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
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .kicker::before {
    content: '';
    width: 1em;
    height: 2px;
    border-radius: 2px;
    background: var(--brand);
  }
  .title {
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-size: var(--step-2);
    font-weight: var(--weight-display);
    letter-spacing: var(--tracking-tight);
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
    .paper,
    .kraft {
      border-radius: 0;
    }
    .desk::after {
      border-radius: 0;
    }
  }
  @media (forced-colors: active) {
    .desk::after {
      border-color: CanvasText;
    }
    .kraft::before {
      display: none;
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
