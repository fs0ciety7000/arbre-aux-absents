<!--
	Chemise cartonnée (DESIGN.md §6.2) : dossier kraft ou manille, onglet de tête avec son
	intitulé, cote collée à l'étiqueteuse, coin corné. Tout le contenu passe en contexte
	`kraft` (texte à l'encre, accent laiton bruni).
	Onglets multiples : passer `<Tabs variant="folder">` dans le snippet `tabs` (il remplace
	l'onglet unique) ; sans `tabs`, l'onglet porte `title` (vrai titre hN).
	`enter` : la chemise glisse sur le bureau à l'apparition (« deal »).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    headingLevel?: 2 | 3 | 4;
    /** Cote du dossier (étiqueteuse) : « ORC 74-118 ». */
    cote?: string;
    tone?: 'kraft' | 'manila';
    /** Position de l'onglet unique (déf. start). */
    tabAlign?: 'start' | 'center' | 'end';
    enter?: boolean;
    tabs?: Snippet;
    actions?: Snippet;
    children?: Snippet;
    class?: string;
    id?: string;
  }

  let {
    title,
    headingLevel = 2,
    cote,
    tone = 'kraft',
    tabAlign = 'start',
    enter = false,
    tabs,
    actions,
    children,
    class: className = '',
    id = `folder-${Math.random().toString(36).slice(2, 8)}`,
  }: Props = $props();
</script>

<section
  {id}
  class="folder {tone} align-{tabAlign} {className}"
  class:mv-deal={enter}
  class:with-tabs={Boolean(tabs)}
  data-surface="kraft"
  aria-labelledby="{id}-title"
>
  {#if tabs}
    <svelte:element this={`h${headingLevel}`} id="{id}-title" class="visually-hidden"
      >{title}</svelte:element
    >
    <div class="tabs">{@render tabs()}</div>
  {:else}
    <div class="tab">
      <svelte:element this={`h${headingLevel}`} id="{id}-title" class="tab-title"
        >{title}</svelte:element
      >
    </div>
  {/if}
  <div class="body">
    <span class="dog-ear" aria-hidden="true"></span>
    {#if cote || actions}
      <div class="head">
        {#if cote}<span class="mat-label red cote">{cote}</span>{/if}
        {#if actions}<div class="actions">{@render actions()}</div>{/if}
      </div>
    {/if}
    {@render children?.()}
  </div>
</section>

<style>
  .folder {
    --folder-bg: var(--kraft);
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--text);
    --tilt: 0deg;
  }
  .manila {
    --folder-bg: var(--manila);
  }
  .tab {
    position: relative;
    z-index: 1;
    display: flex;
    align-self: flex-start;
    max-width: 70%;
    margin-inline: var(--space-4);
    margin-block-end: -1px;
    padding: var(--space-2) var(--space-5) var(--space-1);
    background: var(--folder-bg);
    border-radius: var(--radius-tab) var(--radius-tab) 0 0;
    box-shadow: inset 0 1px 0 var(--edge-light);
  }
  .align-center .tab {
    align-self: center;
  }
  .align-end .tab {
    align-self: flex-end;
  }
  .tab-title {
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    position: relative;
    isolation: isolate;
    flex: 1;
    min-height: 0;
    padding: var(--space-5);
    background: var(--folder-bg);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-paper);
  }
  .tabs {
    position: relative;
    z-index: 1;
    margin-block-end: -1px;
    padding-inline: var(--space-3);
    min-width: 0;
  }
  .align-start .body,
  .with-tabs .body {
    border-start-start-radius: 0;
  }
  /* Fibres du carton (masque sombre, multiplié) */
  .body::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
    background-image: var(--kraft-fiber-image);
    mix-blend-mode: multiply;
  }
  /* Coin corné en bas à droite : un triangle plus clair, un pli */
  .dog-ear {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
    width: 22px;
    height: 22px;
    /* moitié haute : le revers du carton, plus clair ; moitié basse : le bureau dessous */
    background: linear-gradient(to bottom right, var(--manila) 50%, var(--desk) 50%);
    border-start-start-radius: 3px;
    pointer-events: none;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-block-end: var(--space-4);
  }
  .cote {
    transform: rotate(-1.2deg);
  }
  .actions {
    display: flex;
    gap: var(--space-1);
    margin-inline-start: auto;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (forced-colors: active) {
    .tab,
    .body {
      border: 1px solid CanvasText;
    }
    .body::before,
    .dog-ear {
      display: none;
    }
  }
</style>
