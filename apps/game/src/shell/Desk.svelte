<script lang="ts">
  import { Button, Dialog, IconButton, Tabs, type TabItem } from '@arbre/ui';
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

  function openMore(id: PanelId) {
    menuOpen = false;
    game.showPanel(id);
  }
</script>

<div
  class="desk"
  class:single
  class:tablet={viewport.kind === 'tablet' && !single}
  class:collapsed={game.sideCollapsed}
  style:--side-w="{game.sideWidth}px"
  inert={app.overlay !== null}
>
  <DeskHeader {game} onmenu={() => (menuOpen = true)} />

  {#if single}
    <main id="contenu" class="single-main" tabindex="-1" aria-label={m.region}>
      <div
        class="panel-host"
        role="tabpanel"
        id="desk-bar-panel"
        aria-label={messages.panels[game.ui.main]}
      >
        {#key game.ui.main}
          <MainPanel />
        {/key}
      </div>
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
    <main id="contenu" class="zones" tabindex="-1" aria-label={m.region}>
      <nav class="rail" aria-label={m.railLabel}>
        <Tabs
          items={railItems}
          value={game.ui.main}
          label={m.railLabel}
          variant="rail"
          idPrefix="desk-rail"
          onchange={(id) => game.showPanel(id as PanelId)}
        />
        <div class="rail-foot">
          <IconButton
            icon="reader"
            label={game.sideCollapsed ? m.sideExpand : m.sideCollapse}
            pressed={!game.sideCollapsed}
            tooltipPlacement="end"
            onclick={() => (game.sideCollapsed = !game.sideCollapsed)}
          />
        </div>
      </nav>
      <div
        class="main-zone panel-host"
        role="tabpanel"
        id="desk-rail-panel"
        aria-labelledby="desk-rail-tab-{game.ui.main}"
      >
        {#key game.ui.main}
          <MainPanel />
        {/key}
      </div>
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
        <aside class="side" aria-label={m.sideLabel}>
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
                <SidePanel />
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
  .desk {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    overflow: hidden;
  }
  .desk.single {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .zones {
    display: grid;
    grid-template-columns:
      var(--rail-w) minmax(0, 1fr) var(--space-2)
      clamp(var(--side-min), var(--side-w), var(--side-max));
    gap: var(--space-3);
    min-height: 0;
    padding: var(--space-3);
    padding-inline-start: max(var(--space-3), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-3), env(safe-area-inset-right));
    padding-block-end: max(var(--space-3), env(safe-area-inset-bottom));
    outline: none;
  }
  .tablet .zones {
    grid-template-columns: var(--rail-w-tablet) minmax(0, 55fr) var(--space-2) minmax(0, 45fr);
    gap: var(--space-2);
    padding: var(--space-2);
  }
  .collapsed .zones {
    grid-template-columns: var(--rail-w) minmax(0, 1fr);
  }
  .tablet.collapsed .zones {
    grid-template-columns: var(--rail-w-tablet) minmax(0, 1fr);
  }
  .rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-height: 0;
  }
  .panel-host {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .panel-host > :global(*) {
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
  }
  .handle:hover::after,
  .handle:focus-visible::after {
    background: var(--accent);
  }
  .handle:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }
  .side {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--surface-1);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-2);
    overflow: hidden;
  }
  .side > :global(.tabs) {
    flex: 1;
    min-height: 0;
  }
  .side :global([role='tablist']) {
    overflow-x: auto;
    scrollbar-width: thin;
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
  .single-main {
    display: flex;
    flex-direction: column;
    min-height: 0;
    outline: none;
    padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);
  }
  .single-main .panel-host {
    flex: 1;
  }
  .bar {
    position: relative;
    z-index: var(--z-rail);
  }
  .more {
    display: grid;
    gap: var(--space-2);
  }
</style>
