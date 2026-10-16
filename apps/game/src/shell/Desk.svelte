<script lang="ts">
  import {
    Button,
    Dialog,
    Folder,
    IconButton,
    LampLight,
    Tabs,
    sheetPull,
    type TabItem,
  } from '@arbre/ui';
  import { unreadDocuments } from '@arbre/engine';
  import { SIDE_WIDTH } from '@arbre/contract';
  import { getApp, setGame } from '../lib/game/context';
  import { toggleSideWidth } from '../lib/game/reading';
  import { MAIN_PANELS, PHONE_TABS, type GameStoreImpl } from '../lib/game/store.svelte';
  import type { PanelId } from '../lib/game/types';
  import { viewport } from '../lib/game/viewport.svelte';
  import { panelLabel } from '../lib/game/panel-label';
  import { messages } from '../messages.fr';
  import DeskHeader from './DeskHeader.svelte';
  import MiniReader from './MiniReader.svelte';
  import DeskModals from './modals/DeskModals.svelte';
  import { PANEL_ICONS } from './panel-icons';
  import { CandidatePicker, PANELS } from './panels';
  import FloatingCard from './FloatingCard.svelte';
  import ReaderAway from './ReaderAway.svelte';
  import SideTabs from './SideTabs.svelte';
  import TreeAway from './TreeAway.svelte';
  import type { Component } from 'svelte';
  import { tick } from 'svelte';
  import { announcer } from '../lib/game/announcer.svelte';
  import TutorialLayer from '../tutorial/TutorialLayer.svelte';

  /** Le Bureau (ECRANS §1.2, §3 ; DESIGN §5.3) : en-tête, zones et panneaux par format. */
  interface Props {
    game: GameStoreImpl;
  }
  let { game }: Props = $props();
  // svelte-ignore state_referenced_locally
  setGame(game);
  const app = getApp();
  const m = messages.desk;

  const SIDE_MIN = SIDE_WIDTH.min;
  const SIDE_MAX = SIDE_WIDTH.max;
  const MORE: PanelId[] = ['pinboard', 'journal', 'faces', 'help'];

  let menuOpen = $state(false);

  const single = $derived(viewport.single);
  /** Disposition (Enquête / Lecture / Arbre) ; toujours Enquête en une seule zone. */
  const layout = $derived(game.layout);

  /** Un seul Lecteur (un seul arbre) monté : en plein écran, sa place sur le Bureau est tenue
   par un renvoi. */
  function panelOf(id: PanelId): Component {
    if (id === 'reader' && game.readerFull) return ReaderAway;
    if (id === 'tree' && game.treeFull) return TreeAway;
    return PANELS[id];
  }
  // Un seul #contenu (lien d'évitement) : l'écran ouvert par-dessus le Bureau le porte alors.
  const contentId = $derived(app.overlay === null ? 'contenu' : undefined);
  const unread = $derived(
    game.settings.hints.unreadBadges ? unreadDocuments(game.state, game.content).length : 0,
  );

  function item(id: PanelId): TabItem {
    const badge = id === 'archives' && unread > 0 ? unread : undefined;
    return {
      id,
      label: panelLabel(id, game.content),
      icon: PANEL_ICONS[id],
      ...(badge ? { badge, badgeLabel: messages.desk.unread(badge) } : {}),
    };
  }

  const railItems = $derived(MAIN_PANELS.map(item));
  const barItems = $derived(PHONE_TABS.map(item));
  /** Onglet affiché comme sélectionné dans la barre (le panneau actif peut être hors barre). */
  const barValue = $derived(PHONE_TABS.includes(game.ui.main) ? game.ui.main : '');

  // ── Tiroir (tablette portrait, ECRANS §3.2, DESIGN §5.3) ──
  // La tablette en portrait reste « un panneau à la fois » pour la navigation, mais un panneau
  // secondaire (Lecteur, Archives, Catalogue, Carnet…) s'ouvre dans un tiroir bas posé sur la
  // dernière chemise (Arbre, Carte…), qui reste visible au-dessus.
  const drawerMode = $derived(single && viewport.kind === 'tablet' && viewport.portrait);
  let lastMain = $state<PanelId>('tree');
  $effect(() => {
    if (MAIN_PANELS.includes(game.ui.main)) lastMain = game.ui.main;
  });
  const drawerOpen = $derived(drawerMode && !MAIN_PANELS.includes(game.ui.main));
  /** Panneau de la chemise : en mode tiroir, la dernière chemise reste sous le tiroir. */
  const MainPanel = $derived(panelOf(drawerOpen ? lastMain : game.ui.main));
  const DrawerPanel = $derived(panelOf(game.ui.main));
  const showMini = $derived(
    single &&
      !drawerOpen &&
      game.ui.openDocument !== null &&
      game.ui.main !== 'reader' &&
      !game.readerFull &&
      !game.miniReaderHidden,
  );

  /** Deux crans (40 % / 90 % de la zone) ; on glisse la poignée entre les deux. */
  const DRAWER_SNAPS = { half: 0.4, full: 0.9 } as const;
  const DRAWER_MIN = 0.25;
  const DRAWER_MAX = 0.95;
  const TAP_SLOP = 6;
  let drawerSnap = $state<keyof typeof DRAWER_SNAPS>('half');
  /** Fraction pendant le glissement (null hors glissement). */
  let drawerDrag = $state<number | null>(null);
  let drawerZone: HTMLElement | undefined = $state();
  const drawerFraction = $derived(drawerDrag ?? DRAWER_SNAPS[drawerSnap]);
  let drawerStartY = 0;
  let drawerStartF = 0;
  let drawerMoved = false;

  function toggleDrawer() {
    drawerSnap = drawerSnap === 'half' ? 'full' : 'half';
  }
  function closeDrawer() {
    game.showPanel(lastMain);
  }
  function onDrawerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    drawerStartY = e.clientY;
    drawerStartF = DRAWER_SNAPS[drawerSnap];
    drawerMoved = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drawerDrag = drawerStartF;
  }
  function onDrawerMove(e: PointerEvent) {
    if (drawerDrag === null || !drawerZone) return;
    const dy = e.clientY - drawerStartY;
    if (Math.abs(dy) > TAP_SLOP) drawerMoved = true;
    const h = drawerZone.clientHeight || 1;
    drawerDrag = Math.min(DRAWER_MAX, Math.max(DRAWER_MIN, drawerStartF - dy / h));
  }
  function onDrawerUp() {
    if (drawerDrag === null) return;
    if (drawerMoved) {
      const mid = (DRAWER_SNAPS.half + DRAWER_SNAPS.full) / 2;
      drawerSnap = drawerDrag >= mid ? 'full' : 'half';
    }
    drawerDrag = null;
  }
  function onDrawerCancel() {
    drawerDrag = null;
  }
  function onDrawerClick(e: MouseEvent) {
    // Un glissement n'est pas un toucher ; toucher (ou Entrée/Espace) = cran suivant.
    if (drawerMoved) {
      drawerMoved = false;
      e.preventDefault();
      return;
    }
    toggleDrawer();
  }
  function onDrawerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') drawerSnap = 'full';
    else if (e.key === 'ArrowDown') drawerSnap = 'half';
    else return;
    e.preventDefault();
  }
  function onDrawerEscape(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    closeDrawer();
  }
  // Chaque ouverture du tiroir repart du premier cran.
  $effect(() => {
    if (!drawerOpen) drawerSnap = 'half';
  });

  // Réaligne l'état d'interface quand la disposition change.
  $effect(() => {
    void viewport.single;
    game.normalizeLayout();
  });

  // ── Poignée du volet latéral (largeur mémorisée dans les réglages) ──
  let dragging = $state(false);
  let startX = 0;
  let startW = 0;
  let zonesEl: HTMLElement | undefined = $state();
  let room: number = SIDE_MAX;
  /** Largeur affichée du volet (la mémorisée peut dépasser la place, l'arbre garde --tree-min). */
  function shownSide(): number {
    return zonesEl?.querySelector<HTMLElement>('aside.side')?.offsetWidth || game.sideWidth;
  }
  /** Largeur au plus du volet ici : ce qui laisse `--tree-min` à l'arbre. */
  function sideRoom(): number {
    const folder = zonesEl?.querySelector<HTMLElement>('.main-folder');
    if (!zonesEl || !folder) return SIDE_MAX;
    const raw = getComputedStyle(zonesEl).getPropertyValue('--tree-min').trim();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const treeMin = raw.endsWith('rem') ? parseFloat(raw) * rem : parseFloat(raw) || 0;
    return Math.max(SIDE_MIN, Math.min(SIDE_MAX, shownSide() + folder.offsetWidth - treeMin));
  }
  function onHandleDown(e: PointerEvent) {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startW = shownSide();
    room = sideRoom();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onHandleMove(e: PointerEvent) {
    if (!dragging) return;
    game.previewSideWidth(Math.min(room, startW - (e.clientX - startX)));
  }
  function onHandleUp() {
    if (!dragging) return;
    dragging = false;
    game.commitSideWidth();
  }
  /** Double-clic, Entrée / Espace ou bouton A de la manette : standard ↔ large. */
  function toggleSide() {
    game.sideWidth = toggleSideWidth(game.sideWidth);
  }
  function onHandleClick(e: MouseEvent) {
    // `detail` 0 : activation sans pointeur (manette, `click()`) ; la souris passe par dblclick.
    if (e.detail === 0) toggleSide();
  }
  function onHandleKey(e: KeyboardEvent) {
    const step = 40;
    const w = shownSide();
    if (e.key === 'ArrowLeft') game.sideWidth = Math.min(sideRoom(), w + step);
    else if (e.key === 'ArrowRight') game.sideWidth = Math.max(SIDE_MIN, w - step);
    else if (e.key === 'Home') game.sideWidth = sideRoom();
    else if (e.key === 'End') game.sideWidth = SIDE_MIN;
    else if (e.key === 'Enter' || e.key === ' ') toggleSide();
    else return;
    e.preventDefault();
  }

  // ── Plein écran du document : focus posé dans la couche, rendu au bouton à la sortie ──
  let fullLayer: HTMLElement | undefined = $state();
  let wasFull = false;
  $effect(() => {
    const full = game.readerFull;
    if (full === wasFull) return;
    wasFull = full;
    void tick().then(() => {
      if (full) {
        fullLayer?.focus();
        announcer.say(m.fullscreenOn);
      } else {
        document
          .querySelector<HTMLElement>('[data-reader-full]:not(:disabled), [data-card-full]')
          ?.focus();
      }
    });
  });
  const ReaderFull = PANELS.reader;

  // ── Plein écran de l'arbre : couche du Bureau, plus le plein écran natif s'il existe ──
  // (navigateur : la fenêtre entière ; refusé ou absent : la couche seule suffit). Échap quitte
  // le plein écran natif avant d'arriver à la page : `fullscreenchange` ferme alors la couche.
  const TreeFull = PANELS.tree;
  let treeLayer: HTMLElement | undefined = $state();
  let wasTreeFull = false;
  let nativeTree = false;
  $effect(() => {
    const full = game.treeFull;
    if (full === wasTreeFull) return;
    wasTreeFull = full;
    if (full) {
      const root = document.documentElement;
      if (document.fullscreenEnabled && !document.fullscreenElement && root.requestFullscreen) {
        root.requestFullscreen().then(
          () => (nativeTree = true),
          () => (nativeTree = false),
        );
      }
    } else if (nativeTree) {
      nativeTree = false;
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    }
    void tick().then(() => {
      if (full) {
        treeLayer?.focus();
        announcer.say(m.treeFullOn);
      } else {
        document.querySelector<HTMLElement>('[data-tree-full]')?.focus();
      }
    });
  });
  $effect(() => {
    const onChange = () => {
      if (document.fullscreenElement || !nativeTree) return;
      nativeTree = false;
      if (game.treeFull) game.setTreeFull(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (nativeTree && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  });
  const fullBack = $derived(layout === 'tree' ? m.fullscreenToCard : m.fullscreenExit);

  /**
   * Cote du dossier à l'étiqueteuse : celle de l'affaire (`meta.cote`), sinon un décor stable tiré
   * de l'empreinte du contenu (fixtures, affaires sans cote).
   */
  const cote = $derived(
    m.cote(
      game.content.meta.cote ??
        `74-${(parseInt(game.content.contentHash.slice(0, 4), 16) % 900) + 100}`,
    ),
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
  class:layout-read={!single && layout === 'read'}
  class:layout-tree={!single && layout === 'tree'}
  style:--side-w="{game.sideWidth}px"
  inert={app.overlay !== null || game.readerFull || game.treeFull}
  aria-hidden={game.readerFull || game.treeFull ? 'true' : undefined}
>
  <LampLight x={64} y={-6} dust={12} />
  <DeskHeader {game} onmenu={() => (menuOpen = true)} sideToggle={!single} />

  {#if single}
    <main
      id={contentId}
      class="single-main"
      class:with-drawer={drawerOpen}
      tabindex="-1"
      aria-label={m.region}
      bind:this={drawerZone}
    >
      {#if drawerOpen}
        <span class="cote single-cote mat-label red" aria-hidden="true">{cote}</span>
        <Folder title={folderTitle} class="main-folder">
          <div class="panel-host" aria-label={panelLabel(lastMain, game.content)} role="region">
            {#key lastMain}
              <div class="panel-in"><MainPanel /></div>
            {/key}
          </div>
        </Folder>
        <!-- Échap remonte des contrôles du tiroir : la section ne fait qu'écouter. -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <section
          class="drawer"
          class:dragging={drawerDrag !== null}
          class:full={drawerSnap === 'full'}
          style:--drawer-size="{(drawerFraction * 100).toFixed(2)}%"
          aria-label={m.drawerTitle}
          data-snap={drawerSnap}
          in:sheetPull
          onkeydown={onDrawerEscape}
        >
          <div class="drawer-head">
            <button
              type="button"
              class="drawer-grip"
              aria-label={m.drawerHandle}
              aria-expanded={drawerSnap === 'full'}
              aria-controls="desk-bar-panel"
              onpointerdown={onDrawerDown}
              onpointermove={onDrawerMove}
              onpointerup={onDrawerUp}
              onpointercancel={onDrawerCancel}
              onclick={onDrawerClick}
              onkeydown={onDrawerKey}
            >
              <span class="grip-bar" aria-hidden="true"></span>
            </button>
            <IconButton icon="close" label={m.drawerClose} onclick={closeDrawer} />
          </div>
          <div
            class="panel-host drawer-host"
            role="tabpanel"
            id="desk-bar-panel"
            aria-label={panelLabel(game.ui.main, game.content)}
          >
            {#key game.ui.main}
              <div class="panel-in"><DrawerPanel /></div>
            {/key}
          </div>
        </section>
      {:else if inFolder}
        <!-- Cote posée à côté de l'onglet de la chemise (comme au desktop) : une seule rangée
             au-dessus du carton au lieu d'une ligne de plus dans la chemise. -->
        <span class="cote single-cote mat-label red" aria-hidden="true">{cote}</span>
        <Folder title={folderTitle} class="main-folder">
          <div
            class="panel-host"
            role="tabpanel"
            id="desk-bar-panel"
            aria-label={panelLabel(game.ui.main, game.content)}
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
          aria-label={panelLabel(game.ui.main, game.content)}
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
    <nav class="bar" aria-label={m.tabsLabel} data-tour="tabbar">
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
    <main id={contentId} class="zones" tabindex="-1" aria-label={m.region} bind:this={zonesEl}>
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
      {#if layout === 'tree'}
        <FloatingCard {game} title={panelLabel(game.ui.side ?? 'reader', game.content)}>
          <SideTabs {game} />
        </FloatingCard>
      {:else if !game.sideCollapsed}
        <!-- Séparateur focalisable (motif ARIA « window splitter ») : interactif par conception. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        {#if layout === 'read'}
          <!-- Lecture : la disposition fixe la largeur ; la colonne de la poignée reste vide. -->
          <div class="handle-gap" aria-hidden="true"></div>
        {:else}
          <div
            class="handle"
            class:dragging
            role="separator"
            aria-orientation="vertical"
            aria-label={m.sideResize}
            aria-describedby="side-handle-hint"
            aria-valuemin={SIDE_MIN}
            aria-valuemax={SIDE_MAX}
            aria-valuenow={game.sideWidth}
            title={m.sideResizeHint}
            tabindex="0"
            data-testid="side-handle"
            onpointerdown={onHandleDown}
            onpointermove={onHandleMove}
            onpointerup={onHandleUp}
            onpointercancel={onHandleUp}
            ondblclick={toggleSide}
            onclick={onHandleClick}
            onkeydown={onHandleKey}
          >
            <span class="grip" aria-hidden="true"><span></span><span></span><span></span></span>
          </div>
          <span id="side-handle-hint" class="visually-hidden">{m.sideResizeHint}</span>
        {/if}
        <aside class="side" aria-label={m.sideLabel} in:sheetPull|global={{ delay: 120 }}>
          <SideTabs {game} />
        </aside>
      {/if}
    </main>
  {/if}
</div>

{#if game.readerFull}
  <!-- Plein écran du document (fiche, Lecteur ou téléphone) : Échap / B ou le bouton reviennent. -->
  <section
    class="reader-full desk-surface"
    aria-label={m.fullscreenLabel}
    tabindex="-1"
    bind:this={fullLayer}
    data-testid="reader-full"
  >
    <div class="full-bar">
      <Button iconName="back" onclick={() => game.setReaderFull(false)}>{fullBack}</Button>
    </div>
    <div class="full-sheet panel-host">
      <ReaderFull />
    </div>
  </section>
{/if}

{#if game.treeFull}
  <!-- Plein écran de l'arbre : Échap / B ou le bouton reviennent au Bureau. -->
  <section
    class="tree-full desk-surface"
    aria-label={m.treeFullLabel}
    tabindex="-1"
    bind:this={treeLayer}
    data-testid="tree-full"
  >
    <div class="full-bar tree-bar">
      <Button iconName="back" onclick={() => game.setTreeFull(false)}>{m.fullscreenExit}</Button>
    </div>
    <div class="tree-full-sheet panel-host" data-surface="kraft">
      <TreeFull />
    </div>
  </section>
{/if}

{#if game.ui.picking}
  <CandidatePicker />
{/if}

<DeskModals {game} />

{#if app.overlay === null}
  <TutorialLayer {app} {game} />
{/if}

<Dialog bind:open={menuOpen} title={m.moreTitle} size="s">
  <div class="more">
    {#each MORE as id (id)}
      <Button block iconName={PANEL_ICONS[id]} onclick={() => openMore(id)}
        >{panelLabel(id, game.content)}</Button
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
  /* Le volet va jusqu'à --side-max, mais l'arbre garde toujours --tree-min (moins les deux
     gouttières et la colonne de la poignée). */
  .zones {
    position: relative;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) var(--space-3)
      min(
        clamp(var(--side-min), var(--side-w), var(--side-max)),
        calc(100% - var(--tree-min) - var(--space-3) - 2 * var(--space-2))
      );
    gap: var(--space-2);
    min-height: 0;
    padding: var(--space-2) var(--space-5) var(--space-5);
    padding-inline-start: max(var(--space-5), env(safe-area-inset-left));
    padding-inline-end: max(var(--space-5), env(safe-area-inset-right));
    padding-block-end: max(var(--space-5), env(safe-area-inset-bottom));
    outline: none;
  }
  /* Tablette paysage : la poignée règle aussi le volet (elle était affichée, focalisable et
     annoncée, mais la grille 55/45 l'ignorait) ; l'arbre garde --tree-min. */
  .tablet .zones {
    grid-template-columns:
      minmax(0, 1fr) var(--space-2)
      min(
        clamp(var(--side-min), var(--side-w), var(--side-max)),
        calc(100% - var(--tree-min) - var(--space-2) - 2 * var(--space-1))
      );
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3) var(--space-3);
  }
  /* Disposition Lecture : le volet (Lecteur) prend ~70 % ; la poignée ne règle plus rien.
     L'arbre garde de quoi déposer une pièce (--tree-min, ou 35 % sur un écran étroit). */
  .layout-read .zones {
    grid-template-columns: minmax(min(var(--tree-min), 35%), 3fr) var(--space-3) minmax(0, 7fr);
  }
  .tablet.layout-read .zones {
    grid-template-columns: minmax(min(var(--tree-min), 35%), 3fr) var(--space-2) minmax(0, 7fr);
  }
  .layout-read {
    --measure-sheet: var(--measure-sheet-wide);
  }
  /* La feuille centrée, colonne de lecture (~70 caractères), texte un cran plus grand. */
  .layout-read {
    --read-layout: var(--read-layout-boost);
  }
  .layout-read .side :global(.sheet-wrap) {
    margin-inline: auto;
  }
  /* Disposition Arbre : l'arbre occupe tout le Bureau, le volet devient la fiche flottante. */
  .layout-tree .zones {
    grid-template-columns: minmax(0, 1fr);
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
  /* Les onglets de chemise descendent de 6 px (raccord au carton) : la rangée, qui défile à
     l'horizontale, ne doit pas pouvoir défiler à la verticale pour autant. */
  .folder-tabs :global(.tabs:not(.icon-only) > [role='tablist']) {
    overflow-y: hidden;
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
  /* Poignée du volet (DESIGN §5.3) : un trait sur toute la hauteur et une encoche à trois
     points au milieu, visibles au repos ; la cible de saisie déborde à --hit de large. */
  .handle {
    align-self: stretch;
    display: grid;
    place-items: center;
    border-radius: var(--radius-pill);
    cursor: col-resize;
    touch-action: none;
    position: relative;
    margin-block-start: var(--space-8);
  }
  .handle::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline: calc((100% - var(--hit)) / 2);
  }
  .handle::after {
    content: '';
    position: absolute;
    inset-block: var(--space-4);
    inset-inline: calc(50% - var(--space-px));
    background: var(--line);
    border-radius: var(--radius-pill);
  }
  .grip {
    position: relative;
    z-index: 1;
    display: grid;
    gap: var(--space-1);
    justify-items: center;
    padding: var(--space-2) var(--space-0-5);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-pill);
    background: var(--surface-1);
    box-shadow: var(--shadow-1);
    transition:
      transform var(--dur-base) var(--ease-snap),
      border-color var(--dur-fast) var(--ease-out);
  }
  .grip > span {
    inline-size: var(--space-1);
    block-size: var(--space-1);
    border-radius: var(--radius-pill);
    background: var(--text-muted);
  }
  .handle:hover .grip,
  .handle:focus-visible .grip,
  .handle.dragging .grip {
    border-color: var(--accent);
    transform: scaleY(1.15);
  }
  .handle:hover .grip > span,
  .handle:focus-visible .grip > span,
  .handle.dragging .grip > span {
    background: var(--accent);
  }
  .handle:hover::after,
  .handle.dragging::after {
    background: var(--accent);
  }
  .handle:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  /* ── Plein écran du document ── */
  .reader-full {
    position: fixed;
    inset: 0;
    z-index: var(--z-drawer);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: max(var(--space-2), env(safe-area-inset-top))
      max(var(--space-3), env(safe-area-inset-right))
      max(var(--space-3), env(safe-area-inset-bottom))
      max(var(--space-3), env(safe-area-inset-left));
    outline: none;
  }
  .full-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    inline-size: min(100%, var(--full-sheet-w));
    margin-inline: auto;
  }
  .full-sheet {
    inline-size: min(100%, var(--full-sheet-w));
    margin-inline: auto;
    background: var(--surface-1);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-2);
  }
  .full-sheet > :global(*) {
    flex: 1;
    min-height: 0;
  }
  /* Plein écran de l'arbre : la chemise kraft occupe tout l'écran (pas de largeur de lecture). */
  .tree-full {
    position: fixed;
    inset: 0;
    z-index: var(--z-drawer);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: max(var(--space-2), env(safe-area-inset-top))
      max(var(--space-3), env(safe-area-inset-right))
      max(var(--space-3), env(safe-area-inset-bottom))
      max(var(--space-3), env(safe-area-inset-left));
    outline: none;
  }
  .tree-bar {
    inline-size: 100%;
  }
  .tree-full-sheet {
    padding: var(--space-3) var(--space-3) var(--space-4);
    background: var(--kraft);
    color: var(--text);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-paper);
  }
  .tree-full-sheet > :global(*) {
    flex: 1;
    min-height: 0;
  }
  .tree-full-sheet :global(.panel.desk) {
    background: transparent;
    border: 0;
    box-shadow: none;
  }
  .tree-full-sheet :global(.panel.desk::after) {
    display: none;
  }
  @media (forced-colors: active) {
    .tree-full-sheet {
      border: var(--border) solid CanvasText;
    }
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
  /* ── Tiroir bas (tablette portrait) : une feuille à deux crans posée sur la chemise ── */
  .drawer {
    position: absolute;
    z-index: var(--z-drawer);
    inset-inline: max(var(--space-2), env(safe-area-inset-left))
      max(var(--space-2), env(safe-area-inset-right));
    inset-block-end: 0;
    display: flex;
    flex-direction: column;
    block-size: var(--drawer-size, 40%);
    min-block-size: 0;
    background: var(--surface-1);
    border-start-start-radius: var(--radius-l);
    border-start-end-radius: var(--radius-l);
    box-shadow: var(--shadow-3);
    overflow: hidden;
    transition: block-size var(--dur-base) var(--ease-paper);
  }
  .drawer.dragging {
    transition: none;
  }
  .drawer-head {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-block-size: var(--hit);
    padding-inline: var(--space-2);
  }
  /* La poignée : toute la largeur de la tête (cible ≥ 44 px), la barre visible fait 24 px. */
  .drawer-grip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: ns-resize;
    touch-action: none;
  }
  .drawer-head > :global(:not(.drawer-grip)) {
    position: relative;
  }
  .grip-bar {
    inline-size: calc(var(--drawer-handle) * 2);
    block-size: calc(var(--drawer-handle) / 4);
    border-radius: var(--radius-pill);
    background: var(--line-strong);
    transition:
      background-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .drawer-grip:hover .grip-bar,
  .drawer.dragging .grip-bar {
    background: var(--accent);
    transform: scaleX(1.15);
  }
  .drawer-grip:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
    border-radius: var(--radius-l);
  }
  .drawer-host {
    border-block-start: var(--border) solid var(--line);
  }
  .drawer :global(.panel.desk) {
    background: transparent;
    box-shadow: none;
    border: 0;
  }
  .drawer :global(.panel.desk::after) {
    display: none;
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
    .grip {
      border-color: CanvasText;
    }
    .grip > span,
    .handle::after {
      background: CanvasText;
    }
    .side::after {
      border-color: CanvasText;
    }
    .drawer {
      border: var(--border) solid CanvasText;
    }
    .grip-bar {
      background: CanvasText;
    }
  }
</style>
