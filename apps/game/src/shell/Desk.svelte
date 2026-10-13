<script lang="ts">
  import { Button, Dialog, Folder, LampLight, Tabs, sheetPull, type TabItem } from '@arbre/ui';
  import { unreadDocuments } from '@arbre/engine';
  import { getApp, setGame } from '../lib/game/context';
  import {
    MAIN_PANELS,
    PHONE_TABS,
    SIDE_PANELS,
    type GameStoreImpl,
  } from '../lib/game/store.svelte';
  import type { PanelId } from '../lib/game/types';
  import { viewport } from '../lib/game/viewport.svelte';
  import { messages } from '../messages.fr';
  import DeskHeader from './DeskHeader.svelte';
  import MiniReader from './MiniReader.svelte';
  import DeskModals from './modals/DeskModals.svelte';
  import { PANEL_ICONS } from './panel-icons';
  import { CandidatePicker, PANELS } from './panels';

  /** Le Bureau (ECRANS §1.2, §3 ; DESIGN §5.3) : en-tête, zones et panneaux par format. */
  interface Props {
    game: GameStoreImpl;
  }
  let { game }: Props = $props();
  // svelte-ignore state_referenced_locally
  setGame(game);
  const app = getApp();
  const m = messages.desk;

  const SIDE_MIN = 360;
  const SIDE_MAX = 640;
  const MORE: PanelId[] = ['pinboard', 'journal', 'faces', 'help'];

  let menuOpen = $state(false);

  const single = $derived(viewport.single);
  // Un seul #contenu (lien d'évitement) : l'écran ouvert par-dessus le Bureau le porte alors.
  const contentId = $derived(app.overlay === null ? 'contenu' : undefined);
  const unread = $derived(
    game.settings.hints.unreadBadges ? unreadDocuments(game.state, game.content).length : 0,
  );

  function item(id: PanelId): TabItem {
    const badge = id === 'archives' && unread > 0 ? unread : undefined;
    return {
      id,
      label: messages.panels[id],
      icon: PANEL_ICONS[id],
      ...(badge ? { badge, badgeLabel: `${badge} non ${badge > 1 ? 'lus' : 'lu'}` } : {}),
    };
  }

  const railItems = $derived(MAIN_PANELS.map(item));
  const sideItems = $derived(SIDE_PANELS.map(item));
  const barItems = $derived(PHONE_TABS.map(item));
  /** Onglet affiché comme sélectionné dans la barre (le panneau actif peut être hors barre). */
  const barValue = $derived(PHONE_TABS.includes(game.ui.main) ? game.ui.main : '');

  const MainPanel = $derived(PANELS[game.ui.main]);
  const showMini = $derived(
    single && game.ui.openDocument !== null && game.ui.main !== 'reader' && !game.miniReaderHidden,
  );

  // Réaligne l'état d'interface quand la disposition change.
  $effect(() => {
    void viewport.single;
    game.normalizeLayout();
  });

  // ── Poignée du volet latéral ──
  let dragging = false;
  let startX = 0;
  let startW = 0;
  function onHandleDown(e: PointerEvent) {
    dragging = true;
    startX = e.clientX;
    startW = game.sideWidth;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: PointerEvent) {
    if (!dragging) return;
    const w = startW - (e.clientX - startX);
    game.sideWidth = Math.round(Math.min(SIDE_MAX, Math.max(SIDE_MIN, w)));
  }
  function onHandleUp() {
    dragging = false;
  }
  function onHandleKey(e: KeyboardEvent) {
    const step = 40;
    if (e.key === 'ArrowLeft') game.sideWidth = Math.min(SIDE_MAX, game.sideWidth + step);
    else if (e.key === 'ArrowRight') game.sideWidth = Math.max(SIDE_MIN, game.sideWidth - step);
    else if (e.key === 'Home') game.sideWidth = SIDE_MAX;
    else if (e.key === 'End') game.sideWidth = SIDE_MIN;
    else return;
    e.preventDefault();
  }

  /** Cote du dossier à l'étiqueteuse (décor stable, tirée de l'empreinte de l'affaire). */
  const cote = $derived(
    `ORC 74-${(parseInt(game.content.contentHash.slice(0, 4), 16) % 900) + 100}`,
  );
  const folderTitle = $derived(m.folder(game.content.meta.title));
  /** Les panneaux principaux sont des chemises ; les autres, des feuilles sur le sous-main. */
  const inFolder = $derived(MAIN_PANELS.includes(game.ui.main));

  function openMore(id: PanelId) {
    menuOpen = false;
    game.showPanel(id);
  }
</script>

<div
  class="desk desk-surface"
  class:single
  class:tablet={viewport.kind === 'tablet' && !single}
  class:collapsed={game.sideCollapsed}
  style:--side-w="{game.sideWidth}px"
  inert={app.overlay !== null}
>
  <LampLight x={64} y={-6} dust={12} />
  <DeskHeader {game} onmenu={() => (menuOpen = true)} sideToggle={!single} />

  {#if single}
    <main id={contentId} class="single-main" tabindex="-1" aria-label={m.region}>
      {#if inFolder}
        <!-- Cote posée à côté de l'onglet de la chemise (comme au desktop) : une seule rangée
             au-dessus du carton au lieu d'une ligne de plus dans la chemise. -->
        <span class="cote single-cote mat-label red" aria-hidden="true">{cote}</span>
        <Folder title={folderTitle} class="main-folder">
          <div
            class="panel-host"
            role="tabpanel"
            id="desk-bar-panel"
            aria-label={messages.panels[game.ui.main]}
          >
            {#key game.ui.main}
              <div class="panel-in"><MainPanel /></div>
            {/key}
          </div>
        </Folder>
      {:else}
        <div
          class="panel-host sheet-host"
          role="tabpanel"
          id="desk-bar-panel"
          aria-label={messages.panels[game.ui.main]}
        >
          {#key game.ui.main}
            <div class="panel-in"><MainPanel /></div>
          {/key}
        </div>
      {/if}
      {#if showMini}
        <MiniReader {game} />
      {/if}
    </main>
    <nav class="bar" aria-label={m.tabsLabel}>
      <Tabs
        items={barItems}
        value={barValue}
        label={m.tabsLabel}
        variant="bar"
        idPrefix="desk-bar"
        onchange={(id) => game.showPanel(id as PanelId)}
      />
    </nav>
  {:else}
    <main id={contentId} class="zones" tabindex="-1" aria-label={m.region}>
      <Folder title={folderTitle} enter class="main-folder">
        {#snippet tabs()}
          <div class="folder-row">
            <nav class="folder-tabs" aria-label={m.railLabel}>
              <Tabs
                items={railItems}
                value={game.ui.main}
                label={m.railLabel}
                variant="folder"
                idPrefix="desk-rail"
                onchange={(id) => game.showPanel(id as PanelId)}
              />
            </nav>
            <span class="cote mat-label red" aria-hidden="true">{cote}</span>
          </div>
        {/snippet}
        <div
          class="main-zone panel-host"
          role="tabpanel"
          id="desk-rail-panel"
          aria-labelledby="desk-rail-tab-{game.ui.main}"
        >
          {#key game.ui.main}
            <div class="panel-in"><MainPanel /></div>
          {/key}
        </div>
      </Folder>
      {#if !game.sideCollapsed}
        <!-- Séparateur focalisable (motif ARIA « window splitter ») : interactif par conception. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <div
          class="handle"
          role="separator"
          aria-orientation="vertical"
          aria-label={m.sideResize}
          aria-valuemin={SIDE_MIN}
          aria-valuemax={SIDE_MAX}
          aria-valuenow={game.sideWidth}
          tabindex="0"
          onpointerdown={onHandleDown}
          onpointermove={onHandleMove}
          onpointerup={onHandleUp}
          onpointercancel={onHandleUp}
          onkeydown={onHandleKey}
        ></div>
        <aside class="side" aria-label={m.sideLabel} in:sheetPull|global={{ delay: 120 }}>
          <Tabs
            items={sideItems}
            value={game.ui.side ?? 'reader'}
            label={m.sideLabel}
            variant="line"
            idPrefix="desk-side"
            onchange={(id) => game.showPanel(id as PanelId)}
          >
            {#snippet children(id)}
              {@const SidePanel = PANELS[id as PanelId]}
              {#key id}
                <div class="panel-in"><SidePanel /></div>
              {/key}
            {/snippet}
          </Tabs>
        </aside>
      {/if}
    </main>
  {/if}
</div>

{#if game.ui.picking}
  <CandidatePicker />
{/if}

<DeskModals {game} />

<Dialog bind:open={menuOpen} title={m.moreTitle} size="s">
  <div class="more">
    {#each MORE as id (id)}
      <Button block iconName={PANEL_ICONS[id]} onclick={() => openMore(id)}
        >{messages.panels[id]}</Button
      >
    {/each}
    <Button
      block
      iconName="pause"
      onclick={() => {
        menuOpen = false;
        game.openPause();
      }}>{m.pause}</Button
    >
  </div>
</Dialog>

<style>
  /* Collé aux bords de la fenêtre (position fixe) plutôt qu'à 100dvh : certaines WebView
     Android ignorent dvh, et le menu du bas partait alors sous l'écran avec la page qui défile. */
  .desk {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  .desk.single {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .zones {
    position: relative;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) var(--space-3)
      clamp(var(--side-min), var(--side-w), var(--side-max));
    gap: var(--space-2);
    min-height: 0;
    padding: var(--space-2) var(--space-5) var(--space-5);
    padding-inline-start: max(var(--space-5), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-5), env(safe-area-inset-right));
    padding-block-end: max(var(--space-5), env(safe-area-inset-bottom));
    outline: none;
  }
  .tablet .zones {
    grid-template-columns: minmax(0, 55fr) var(--space-2) minmax(0, 45fr);
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3) var(--space-3);
  }
  .collapsed .zones,
  .tablet.collapsed .zones {
    grid-template-columns: minmax(0, 1fr);
  }

  /* ── La chemise des panneaux principaux (Folder + onglets de chemise) ── */
  .zones > :global(.main-folder),
  .single-main > :global(.main-folder) {
    min-height: 0;
    min-width: 0;
    /* La largeur vient de la zone, jamais du panneau (carte, toile de l'arbre). */
    contain: inline-size;
  }
  .zones > :global(.main-folder > .body),
  .single-main > :global(.main-folder > .body) {
    display: flex;
    flex-direction: column;
    padding: var(--space-3) var(--space-3) var(--space-4);
  }
  .folder-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
    min-width: 0;
  }
  .folder-tabs {
    flex: 1;
    min-width: 0;
  }
  .cote {
    align-self: center;
    flex: none;
    transform: rotate(-1.5deg);
  }

  /* Les onglets sortent de la chemise en cascade (mv-tab, §7.3). */
  .folder-tabs :global(.tab) {
    animation:
      m-fade-in var(--dur-fade-fast) var(--ease-out) backwards,
      m-tab var(--dur-base) var(--ease-snap) backwards;
    animation-delay: calc(var(--i, 0) * var(--stagger-deal) + var(--dur-deal) * 0.5);
  }
  /* Le panneau principal se pose à même le carton : pas de second fond ; son titre devient
     l'étiquette rouge collée sur le carton (le vrai titre hN reste). */
  .desk :global(.main-folder .panel.desk) {
    background: transparent;
    border: 0;
    box-shadow: none;
  }
  .desk :global(.main-folder .panel.desk::after) {
    display: none;
  }
  .desk :global(.main-folder .panel.desk > .head) {
    min-height: var(--hit);
    padding: 0 0 var(--space-2);
    border-block-end: 0;
  }
  .desk :global(.main-folder .panel.desk > .head .title) {
    display: inline-block;
    padding: 0.18em 0.7em 0.14em;
    background: var(--label-tape-red);
    color: var(--label-tape-text);
    font-family: var(--font-label);
    font-size: var(--step-0);
    font-weight: var(--weight-medium);
    letter-spacing: calc(0.12em + var(--tracking-extra));
    text-transform: uppercase;
    line-height: 1.2;
    border-radius: 2px;
    text-shadow:
      0 1px 0 var(--label-emboss),
      0 -1px 0 var(--label-sheen);
    box-shadow:
      inset 0 1px 0 var(--label-sheen),
      inset 0 -1px 0 var(--label-emboss),
      var(--shadow-1);
    transform: rotate(-1.2deg);
  }
  .panel-host {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .panel-in {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    animation:
      m-fade-in var(--dur-fade) var(--ease-out) backwards,
      m-deal var(--dur-deal) var(--ease-deal) backwards;
    --deal-x: 0px;
    --deal-distance: calc(var(--rise) * 2);
    --deal-rotate: 0.6deg;
  }
  .panel-in > :global(*) {
    flex: 1;
    min-height: 0;
  }
  .handle {
    align-self: stretch;
    border-radius: var(--radius-pill);
    cursor: col-resize;
    touch-action: none;
    position: relative;
  }
  .handle::after {
    content: '';
    position: absolute;
    inset-block: 40%;
    inset-inline: calc(50% - 1px);
    background: var(--line-strong);
    border-radius: var(--radius-pill);
    transition: transform var(--dur-base) var(--ease-snap);
  }
  .handle:hover::after,
  .handle:focus-visible::after {
    background: var(--accent);
    transform: scaleY(1.4);
  }
  .handle:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  /* ── Le volet : un sous-main surpiqué où l'on pose feuilles et fiches ── */
  .side {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    margin-block-start: var(--space-8);
    background: var(--surface-1);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-2);
    overflow: hidden;
  }
  .side::after {
    content: '';
    position: absolute;
    inset: 5px;
    z-index: 2;
    pointer-events: none;
    border: 1.5px dashed var(--stitch);
    border-radius: calc(var(--radius-l) - 4px);
  }
  .side > :global(.tabs) {
    flex: 1;
    min-height: 0;
  }
  .side :global([role='tablist']) {
    overflow-x: auto;
    scrollbar-width: thin;
    padding-inline: var(--space-2);
  }
  .side :global([role='tabpanel']) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .side :global([role='tabpanel'] > *) {
    flex: 1;
    min-height: 0;
  }
  .side :global(.panel.desk) {
    background: transparent;
    box-shadow: none;
  }
  .side :global(.panel.desk::after) {
    display: none;
  }
  .single-main {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-height: 0;
    min-width: 0;
    outline: none;
    padding: var(--space-1) max(var(--space-2), env(safe-area-inset-right)) var(--space-2)
      max(var(--space-2), env(safe-area-inset-left));
  }
  .single-main > :global(.main-folder) {
    flex: 1;
  }
  /* Onglet et cote se partagent la rangée de tête : l'intitulé du dossier s'abrège (ellipse,
     titre complet dans le vrai hN), la cote garde sa taille d'étiquette et s'abrège en dernier. */
  .single-main {
    position: relative;
  }
  .single-main > :global(.main-folder > .tab) {
    max-inline-size: 60%;
  }
  .single-cote {
    position: absolute;
    z-index: 2;
    inset-block-start: calc(var(--space-1) + var(--space-1));
    inset-inline-end: calc(max(var(--space-2), env(safe-area-inset-right)) + var(--space-3));
    display: block;
    max-inline-size: calc(40% - 2 * var(--space-4));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .single-main > :global(.main-folder > .body) {
    border-start-start-radius: var(--radius-m);
  }
  .sheet-host {
    background: var(--surface-1);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-2);
  }
  .bar {
    position: relative;
    z-index: var(--z-rail);
  }
  .more {
    display: grid;
    gap: var(--space-2);
  }
  @media (forced-colors: active) {
    .side::after {
      border-color: CanvasText;
    }
  }
</style>
