<!--
  Fiche flottante (disposition Arbre, DESIGN §5.3) : le volet latéral posé sur l'arbre, déplaçable
  à la souris, au doigt (poignée) et au clavier (flèches sur la poignée), repliable en onglet.
  Position mémorisée en fractions de la place libre (`Settings.cardPosition`) : toujours à l'écran.
  Une `region` dans l'ordre de tabulation, pas une modale.
-->
<script lang="ts">
  import { Button, IconButton, Icon, pushToast, sheetPull } from '@arbre/ui';
  import { getAllContexts, mount, tick, unmount, type Snippet } from 'svelte';
  import { announcer } from '../lib/game/announcer.svelte';
  import { getApp } from '../lib/game/context';
  import { moveCard } from '../lib/game/reading';
  import PopoutDocs from './PopoutDocs.svelte';
  import { canPopOut, mirrorPage, openPopOut } from './popout';
  import type { GameStoreImpl } from '../lib/game/store.svelte';
  import { messages } from '../messages.fr';

  interface Props {
    game: GameStoreImpl;
    /** Panneau affiché (titre de l'onglet replié). */
    title: string;
    children: Snippet;
  }
  let { game, title, children }: Props = $props();
  const m = messages.desk;

  /** Pas du clavier (px), et avec Maj. */
  const STEP = 24;
  const STEP_FAR = 96;
  const TAP_SLOP = 4;

  let track: HTMLDivElement | undefined = $state();
  let card: HTMLElement | undefined = $state();
  let dragging = $state(false);
  let start = { x: 0, y: 0, from: { x: 1, y: 0 }, free: { w: 0, h: 0 } };

  const pos = $derived(game.cardPosition);
  const collapsed = $derived(game.sideCollapsed);
  const canFull = $derived(game.ui.openDocument !== null && !game.docsPopped);

  // ── Fenêtre détachée (second écran, navigateur) : mêmes panneaux, même partie ──
  const app = getApp();
  const contexts = getAllContexts();
  const canPop = $derived(canPopOut(app.platform?.kind));
  let popWin: Window | null = null;
  let popApp: Record<string, unknown> | null = null;
  let stopMirror: (() => void) | null = null;
  let opening = false;

  async function popOut() {
    if (opening || game.docsPopped) return;
    opening = true;
    const win = await openPopOut({
      width: card?.offsetWidth || 500,
      height: Math.max(card?.offsetHeight || 0, 560),
      title: m.popoutTitle(game.content.meta.title),
      platformKind: app.platform?.kind,
    });
    opening = false;
    if (!win) {
      pushToast({ tone: 'warning', title: m.popoutBlocked });
      return;
    }
    popWin = win;
    stopMirror = mirrorPage(win);
    popApp = mount(PopoutDocs, {
      target: win.document.body,
      props: { game, onback: () => win.close() },
      context: contexts,
    });
    game.docsPopped = true;
    win.addEventListener('pagehide', () => bringBack(false), { once: true });
    announcer.say(m.popoutOn);
  }

  /** Ramène la fiche (bouton, fermeture de la fenêtre, fin de la disposition Arbre). */
  function bringBack(close = true, focus = true) {
    const win = popWin;
    if (!win) return;
    popWin = null;
    stopMirror?.();
    stopMirror = null;
    if (popApp) void unmount(popApp);
    popApp = null;
    if (close && !win.closed) win.close();
    game.docsPopped = false;
    if (!focus) return;
    announcer.say(m.popoutOff);
    void tick().then(() => card?.querySelector<HTMLElement>('[data-card-popout]')?.focus());
  }

  // La page quittée (ou la fiche démontée) referme la fenêtre détachée.
  $effect(() => {
    const leave = () => bringBack(true, false);
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      leave();
    };
  });

  function freeSpace(): { w: number; h: number } {
    if (!track || !card) return { w: 0, h: 0 };
    return {
      w: Math.max(0, track.clientWidth - card.offsetWidth),
      h: Math.max(0, track.clientHeight - card.offsetHeight),
    };
  }

  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY, from: game.cardPosition, free: freeSpace() };
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) < TAP_SLOP) return;
    game.previewCardPosition(moveCard(start.from, dx, dy, start.free));
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    game.commitCardPosition();
  }
  function onKey(e: KeyboardEvent) {
    const d = e.shiftKey ? STEP_FAR : STEP;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-d, 0],
      ArrowRight: [d, 0],
      ArrowUp: [0, -d],
      ArrowDown: [0, d],
    };
    const v = delta[e.key];
    if (!v) return;
    e.preventDefault();
    game.cardPosition = moveCard(game.cardPosition, v[0], v[1], freeSpace());
  }
</script>

<div class="track" bind:this={track}>
  <aside
    class="card"
    class:collapsed
    class:popped={game.docsPopped}
    class:dragging
    aria-label={m.cardLabel}
    bind:this={card}
    style:--x={pos.x}
    style:--y={pos.y}
    data-testid="floating-card"
    in:sheetPull
  >
    <div class="head">
      <button
        type="button"
        class="grip"
        aria-label={m.cardMove}
        aria-describedby="card-move-hint"
        title={m.cardMoveHint}
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onkeydown={onKey}
      >
        <Icon name="grip" size="1.25rem" />
        <span class="title">{collapsed ? title : m.cardLabel}</span>
      </button>
      <span id="card-move-hint" class="visually-hidden">{m.cardMoveHint}</span>
      {#if canPop}
        <IconButton
          icon="external"
          label={game.docsPopped ? m.popoutBack : m.popout}
          pressed={game.docsPopped}
          tooltipPlacement="start"
          data-card-popout
          onclick={() => (game.docsPopped ? bringBack() : popOut())}
        />
      {/if}
      <IconButton
        icon="expand"
        label={m.fullscreen}
        disabled={!canFull}
        tooltipPlacement="start"
        data-card-full
        onclick={() => {
          game.showPanel('reader');
          game.setReaderFull(true);
        }}
      />
      <IconButton
        icon={collapsed ? 'chevron-down' : 'chevron-up'}
        label={collapsed ? m.cardExpand(title) : m.cardCollapse}
        pressed={!collapsed}
        tooltipPlacement="start"
        onclick={() => (game.sideCollapsed = !collapsed)}
      />
    </div>
    {#if !collapsed}
      {#if game.docsPopped}
        <!-- Un seul jeu de panneaux monté : la fenêtre détachée les porte. -->
        <div class="body away">
          <p>{m.popoutAway}</p>
          <Button iconName="back" onclick={() => bringBack()}>{m.popoutBack}</Button>
        </div>
      {:else}
        <div class="body">{@render children()}</div>
      {/if}
    {/if}
  </aside>
</div>

<style>
  /* La piste : la place où la fiche peut aller, sous les onglets de la chemise (marges du Bureau
     comprises) ; en haut à droite par défaut, la fiche laisse les onglets visibles. */
  .track {
    position: absolute;
    z-index: var(--z-raised);
    inset: calc(var(--tab-h) + var(--space-4)) var(--space-5) var(--space-5);
    pointer-events: none;
  }
  .card {
    --cw: min(var(--float-card-w), 100%);
    --ch: min(var(--float-card-h), 100%);
    position: absolute;
    inset-inline-start: calc((100% - var(--cw)) * var(--x));
    inset-block-start: calc((100% - var(--ch)) * var(--y));
    display: flex;
    flex-direction: column;
    inline-size: var(--cw);
    block-size: var(--ch);
    min-block-size: 0;
    background: var(--surface-1);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-3);
    overflow: hidden;
    pointer-events: auto;
  }
  .card::after {
    content: '';
    position: absolute;
    inset: 5px;
    z-index: 2;
    pointer-events: none;
    border: 1.5px dashed var(--stitch);
    border-radius: calc(var(--radius-l) - 4px);
  }
  /* Repliée : l'onglet seul, posé au même endroit (la hauteur est celle de la tête). */
  .card.collapsed {
    --ch: var(--hit-row);
    block-size: auto;
  }
  /* Détachée : la fiche se réduit au renvoi (tête + message). */
  .card.popped {
    --ch: min(12rem, 100%);
    block-size: auto;
  }
  .head {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-block-size: var(--hit-row);
    padding: var(--space-1) var(--space-2);
    border-block-end: 1.5px dashed var(--stitch);
  }
  .collapsed .head {
    border-block-end: 0;
  }
  .grip {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-inline-size: 0;
    min-block-size: var(--hit);
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--radius-m);
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-label);
    font-size: var(--step--1);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    cursor: grab;
    touch-action: none;
  }
  .dragging .grip {
    cursor: grabbing;
  }
  .grip:hover,
  .dragging .grip {
    color: var(--accent);
  }
  .grip:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .body {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-block-size: 0;
  }
  .away {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    justify-items: start;
    padding: var(--space-5);
    color: var(--text-muted);
  }
  .away p {
    margin: 0;
  }
  @media (forced-colors: active) {
    .card {
      border: var(--border) solid CanvasText;
    }
    .card::after {
      border-color: CanvasText;
    }
  }
</style>
