<!--
  P01 — L'arbre : cases par génération et colonne, liens d'union et de filiation, zoom et
  déplacement, compteur. Trois vues : Arbre (graphe zoomable), Par génération (téléphone :
  balayage et indicateur 1·2·3·4) et Liste (liste hiérarchique pour lecteurs d'écran et clavier).
  Clavier : roving tabindex sur les cases (flèches = case voisine selon les liens), Entrée ouvre
  la fiche, + / − / 0 zooment. Dépôt « Prendre → Déposer » et glisser-déposer sur une case.
-->
<script lang="ts">
  import type { SlotGuess, SlotId } from '@arbre/contract';
  import { progress, visibleSlots } from '@arbre/engine';
  import { Badge, Button, Icon, IconButton, Panel, Stamp, Tabs } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { onMount, tick } from 'svelte';
  import { getGame } from '../lib/game/context';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { carry, decodeCarry, DRAG_MIME } from './lib/carry.svelte';
  import {
    layoutTree,
    neighbourSlot,
    type TreeDirection,
    type TreeNodeInput,
  } from './lib/tree-layout';
  import { fieldValueLabel, guessOf, slotName } from './lib/view';
  import { FIELD_LABELS, pm } from './messages';
  import SlotSheet from './tree/SlotSheet.svelte';

  const game = getGame();
  type View = 'graph' | 'generation' | 'list';

  const visible = $derived(visibleSlots(game.state, game.content));
  const nodes: TreeNodeInput[] = $derived(
    visible.map((id) => {
      const s = game.content.slots[id]!;
      const shown = (x: SlotId) => visible.includes(x);
      return {
        id,
        generation: s.generation,
        column: s.column,
        parents: s.parents.filter(shown),
        unions: s.unions.filter(shown),
      };
    }),
  );
  const layout = $derived(layoutTree(nodes));
  const prog = $derived(progress(game.state, game.content));

  let view = $state<View>('graph');
  let zoom = $state(1);
  let generation = $state(0);
  let sheetSlot = $state<SlotId | null>(null);
  let wrap: HTMLDivElement | undefined = $state();
  let focusId = $state<SlotId | null>(null);
  let justLocked = $state<Set<SlotId>>(new Set());

  const ZMIN = 0.5;
  const ZMAX = 2;
  const current = $derived(
    focusId && visible.includes(focusId)
      ? focusId
      : game.ui.selectedSlot && visible.includes(game.ui.selectedSlot)
        ? game.ui.selectedSlot
        : (visible[0] ?? null),
  );
  const isLocked = (id: SlotId) => game.state.locked[id] !== undefined;
  const empty = $derived(
    Object.keys(game.state.tree).length === 0 && !(game as { skipTutorial?: boolean }).skipTutorial,
  );
  const firstOpen = $derived(visible.find((id) => !isLocked(id)) ?? null);

  onMount(() => {
    if (matchMedia('(max-width: 37.4375rem)').matches) view = 'generation';
    const off = game.onEvents((events) => {
      for (const e of events) {
        if (e.type === 'slotsLocked') {
          justLocked = new Set(e.ids);
          setTimeout(() => (justLocked = new Set()), 1500);
        }
      }
    });
    return off;
  });

  // Navigation transverse vers une case : la montrer et la sélectionner.
  $effect(() => {
    const id = game.ui.selectedSlot;
    if (!id || !visible.includes(id)) return;
    focusId = id;
    const gen = game.content.slots[id]?.generation;
    if (gen !== undefined) generation = layout.generations.indexOf(gen);
    void tick().then(() => cardEl(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  });

  function cardEl(id: SlotId): HTMLElement | null {
    return (
      document.querySelector<HTMLElement>(
        `[data-tree-view="${view}"] [data-slot="${CSS.escape(id)}"]`,
      ) ?? null
    );
  }

  function select(id: SlotId) {
    focusId = id;
    game.ui.selectedSlot = id;
  }

  function activate(id: SlotId) {
    select(id);
    if (carry.item && !isLocked(id)) {
      drop(id, carry.item.patch);
      carry.drop();
      return;
    }
    sheetSlot = id;
  }

  function drop(id: SlotId, patch: Partial<SlotGuess>) {
    if (isLocked(id)) return;
    game.dispatch({ type: 'setSlot', slot: id, patch });
  }

  const DIRS: Record<string, TreeDirection> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
  };

  async function onCardKey(e: KeyboardEvent, id: SlotId) {
    const dir = DIRS[e.key];
    if (dir) {
      e.preventDefault();
      const next = neighbourSlot(nodes, id, dir);
      if (!next) return;
      select(next);
      const gen = game.content.slots[next]?.generation;
      if (view === 'generation' && gen !== undefined) generation = layout.generations.indexOf(gen);
      await tick();
      cardEl(next)?.focus();
      return;
    }
    if (e.key === 'Delete' && !isLocked(id) && game.state.tree[id]) {
      e.preventDefault();
      select(id);
      sheetSlot = id;
    }
  }

  // Commandes remappables (zoom, effacer) relayées par le shell.
  let root: HTMLDivElement | undefined = $state();
  $effect(() =>
    listenCommands((cmd) => {
      if (!ownsCommands(root, 'tree', game.ui.main)) return false;
      if (view === 'graph' && cmd === 'zoom.in') setZoom(zoom + 0.25);
      else if (view === 'graph' && cmd === 'zoom.out') setZoom(zoom - 0.25);
      else if (view === 'graph' && cmd === 'zoom.fit') fit();
      else if (cmd === 'clear') {
        const id = game.ui.selectedSlot;
        if (!id || isLocked(id) || !game.state.tree[id]) return false;
        sheetSlot = id;
      } else return false;
      return true;
    }),
  );

  function setZoom(z: number) {
    zoom = Math.round(Math.min(ZMAX, Math.max(ZMIN, z)) * 100) / 100;
  }
  function fit() {
    if (!wrap) return setZoom(1);
    const k = Math.min(wrap.clientWidth / layout.width, wrap.clientHeight / layout.height);
    setZoom(Math.min(1, k));
  }

  // Déplacement de la vue au glisser sur le fond (souris, doigt), molette + Ctrl = zoom.
  let panning: { x: number; y: number; id: number } | null = null;
  function onPointerDown(e: PointerEvent) {
    if (!wrap || (e.target as Element).closest('button, [data-slot]')) return;
    panning = { x: e.clientX, y: e.clientY, id: e.pointerId };
    wrap.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!panning || !wrap || e.pointerId !== panning.id) return;
    wrap.scrollBy(panning.x - e.clientX, panning.y - e.clientY);
    panning = { ...panning, x: e.clientX, y: e.clientY };
  }
  function onPointerUp() {
    panning = null;
  }
  function onWheel(e: WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(zoom * Math.exp(-e.deltaY * 0.004));
  }

  // Balayage horizontal entre générations (vue téléphone).
  let swipe: { x: number; y: number } | null = null;
  function onSwipeStart(e: PointerEvent) {
    swipe = { x: e.clientX, y: e.clientY };
  }
  function onSwipeEnd(e: PointerEvent) {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const n = layout.generations.length;
    generation = Math.min(n - 1, Math.max(0, generation + (dx < 0 ? 1 : -1)));
  }

  function onDragOver(e: DragEvent, id: SlotId) {
    if (isLocked(id) || !e.dataTransfer?.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  function onDrop(e: DragEvent, id: SlotId) {
    const raw = e.dataTransfer?.getData(DRAG_MIME);
    const item = raw ? decodeCarry(raw) : null;
    if (!item || isLocked(id)) return;
    e.preventDefault();
    select(id);
    drop(id, item.patch);
    carry.drop();
  }

  function summary(id: SlotId): string {
    const name = slotName(game.state, game.content, id) ?? pm.tree.unknownPerson;
    const g = guessOf(game.state, game.content, id);
    const occ = fieldValueLabel(game.content, 'occupation', g);
    const state = isLocked(id) ? pm.tree.lockedLabel : g ? pm.tree.open : pm.tree.empty;
    return pm.tree.slotLabel([name, occ].filter(Boolean).join(', '), state);
  }

  const genSlots = $derived(
    nodes
      .filter((n) => n.generation === layout.generations[generation])
      .sort((a, b) => a.column - b.column),
  );
  const genItems = $derived(
    layout.generations.map((g, i) => ({ id: String(i), label: pm.tree.generation(i + 1), g })),
  );
</script>

{#snippet card(id: SlotId)}
  {@const g = guessOf(game.state, game.content, id)}
  {@const locked = isLocked(id)}
  {@const portraitId = g?.portrait ?? null}
  {@const portrait = portraitId ? game.content.portraits[portraitId] : undefined}
  {@const occ = fieldValueLabel(game.content, 'occupation', g)}
  {@const droppable = carry.item !== null && !locked}
  <button
    type="button"
    class="slot"
    class:locked
    class:selected={game.ui.selectedSlot === id}
    class:droppable
    data-slot={id}
    data-verb={locked ? 'look' : droppable ? 'use' : 'write'}
    tabindex={id === current ? 0 : -1}
    aria-label={summary(id)}
    aria-haspopup="dialog"
    onclick={() => activate(id)}
    onfocus={() => (focusId = id)}
    onkeydown={(e) => onCardKey(e, id)}
    ondragover={(e) => onDragOver(e, id)}
    ondrop={(e) => onDrop(e, id)}
  >
    <span class="portrait" aria-hidden="true">
      {#if portrait}
        <span class="svg" use:svgContent={portraitId ? portraitSvg(game.content, portraitId) : null}
        ></span>
      {:else}
        <Icon name="unknown-person" size="2.5rem" />
      {/if}
    </span>
    <span class="name" aria-hidden="true">
      <span class:unknown={!g?.given}>{g?.given || pm.tree.unknown}</span>
      <span class:unknown={!g?.family}>{g?.family || pm.tree.unknown}</span>
    </span>
    <span class="occ" class:unknown={!occ} aria-hidden="true"
      >{occ ?? FIELD_LABELS.occupation + ' ?'}</span
    >
    {#if locked}
      <span class="lock" aria-hidden="true"><Icon name="lock" size="1rem" /></span>
      <span class="stamp" aria-hidden="true"
        ><Stamp size="s" animate={justLocked.has(id)} delay={[...justLocked].indexOf(id)} /></span
      >
    {:else if droppable}
      <span class="drop" aria-hidden="true"
        ><Icon name="use" size="1rem" /> {pm.tree.carryDrop}</span
      >
    {/if}
  </button>
{/snippet}

<Panel title={pm.tree.title} scroll={false} padded={false} class="tree-panel">
  {#snippet actions()}
    <Badge tone="established" iconName="lock"
      ><span class="num">{pm.tree.counter(prog.locked, prog.total)}</span></Badge
    >
  {/snippet}

  <div class="tree-root" bind:this={root}>
    <div class="toolbar">
      <Tabs
        label={pm.tree.views}
        variant="line"
        idPrefix="tree-view"
        bind:value={view}
        items={[
          { id: 'graph', label: pm.tree.viewGraph, icon: 'tree' },
          { id: 'generation', label: pm.tree.viewGeneration, icon: 'layers' },
          { id: 'list', label: pm.tree.viewList, icon: 'list' },
        ]}
      />
      {#if view === 'graph'}
        <div class="zoom" role="group" aria-label={pm.tree.zoom}>
          <IconButton icon="minus" label={pm.tree.zoomOut} onclick={() => setZoom(zoom - 0.25)} />
          <span class="num zoom-level" aria-live="polite"
            >{pm.tree.zoomLevel(Math.round(zoom * 100))}</span
          >
          <IconButton icon="plus" label={pm.tree.zoomIn} onclick={() => setZoom(zoom + 0.25)} />
          <IconButton icon="fit" label={pm.tree.fit} onclick={fit} />
        </div>
      {/if}
    </div>

    {#if carry.item}
      <div class="carry" role="status">
        <Icon name="use" />
        <span>{pm.tree.carry(carry.item.label)}</span>
        <Button variant="ghost" onclick={() => carry.drop()}>{pm.tree.carryCancel}</Button>
      </div>
    {:else if empty && firstOpen}
      <p class="bubble" role="note"><Icon name="info" /> {pm.tree.firstHint}</p>
    {/if}

    <!-- Panneau des onglets de vue (cible de leur `aria-controls`). -->
    <div
      class="view-panel"
      role="tabpanel"
      id="tree-view-panel"
      aria-labelledby="tree-view-tab-{view}"
    >
      {#if view === 'graph'}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="canvas-wrap"
          bind:this={wrap}
          data-tree-view="graph"
          onpointerdown={onPointerDown}
          onpointermove={onPointerMove}
          onpointerup={onPointerUp}
          onpointercancel={onPointerUp}
          onwheel={onWheel}
        >
          <div
            class="sizer"
            style:width="{layout.width * zoom}px"
            style:height="{layout.height * zoom}px"
          >
            <div
              class="canvas"
              role="group"
              aria-label={pm.tree.title}
              aria-describedby="tree-instructions"
              style:width="{layout.width}px"
              style:height="{layout.height}px"
              style:transform="scale({zoom})"
            >
              <svg class="links" width={layout.width} height={layout.height} aria-hidden="true">
                {#each layout.links as link, i (i)}
                  <path class="link {link.kind}" d={link.d} />
                {/each}
              </svg>
              {#each nodes as n (n.id)}
                {@const p = layout.slots[n.id]!}
                <div class="pos" style:left="{p.x}px" style:top="{p.y}px">
                  {@render card(n.id)}
                </div>
              {/each}
            </div>
          </div>
        </div>
        <p id="tree-instructions" class="visually-hidden">{pm.tree.instructions}</p>
      {:else if view === 'generation'}
        <div class="gen-view" data-tree-view="generation">
          <div class="gen-tabs" role="group" aria-label={pm.tree.generations}>
            {#each genItems as item, i (item.id)}
              <button
                type="button"
                class="gen-dot num"
                aria-pressed={generation === i}
                aria-label={item.label}
                onclick={() => (generation = i)}>{i + 1}</button
              >
            {/each}
          </div>
          <h3 class="gen-title">{pm.tree.generation(generation + 1)}</h3>
          <div
            class="gen-list"
            role="group"
            aria-label={pm.tree.generation(generation + 1)}
            onpointerdown={onSwipeStart}
            onpointerup={onSwipeEnd}
          >
            {#each genSlots as n (n.id)}
              {@render card(n.id)}
            {/each}
          </div>
          <p class="swipe-hint">{pm.tree.swipeHint}</p>
        </div>
      {:else}
        <div class="list-view" data-tree-view="list">
          <ol class="gens" aria-label={pm.tree.listCaption}>
            {#each layout.generations as gen, i (gen)}
              <li>
                <h3>{pm.tree.generation(i + 1)}</h3>
                <ol class="slots">
                  {#each nodes
                    .filter((n) => n.generation === gen)
                    .sort((a, b) => a.column - b.column) as n (n.id)}
                    {@const g = guessOf(game.state, game.content, n.id)}
                    {@const s = game.content.slots[n.id]!}
                    <li class="list-slot" class:locked={isLocked(n.id)}>
                      <button
                        type="button"
                        class="list-open"
                        data-slot={n.id}
                        data-verb="write"
                        tabindex={n.id === current ? 0 : -1}
                        onclick={() => activate(n.id)}
                        onfocus={() => (focusId = n.id)}
                        onkeydown={(e) => onCardKey(e, n.id)}
                      >
                        {#if isLocked(n.id)}<Icon name="lock" />{/if}
                        <span>{summary(n.id)}</span>
                      </button>
                      <dl>
                        {#each ['given', 'family', 'portrait', 'occupation'] as const as f (f)}
                          <div>
                            <dt>{FIELD_LABELS[f]}</dt>
                            <dd>{fieldValueLabel(game.content, f, g) ?? pm.tree.fieldEmpty}</dd>
                          </div>
                        {/each}
                        {#if s.parents.length > 0}
                          <div>
                            <dt>{pm.tree.relations.parents}</dt>
                            <dd>
                              {s.parents
                                .map(
                                  (p) =>
                                    slotName(game.state, game.content, p) ?? pm.tree.unknownPerson,
                                )
                                .join(', ')}
                            </dd>
                          </div>
                        {/if}
                        {#if s.unions.length > 0}
                          <div>
                            <dt>{pm.tree.relations.unions}</dt>
                            <dd>
                              {s.unions
                                .map(
                                  (p) =>
                                    slotName(game.state, game.content, p) ?? pm.tree.unknownPerson,
                                )
                                .join(', ')}
                            </dd>
                          </div>
                        {/if}
                      </dl>
                    </li>
                  {/each}
                </ol>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </div>
  </div>
</Panel>

<SlotSheet slot={sheetSlot} onclose={() => (sheetSlot = null)} />

<style>
  :global(.tree-panel) {
    block-size: 100%;
  }
  .tree-root {
    display: flex;
    min-inline-size: 0;
    /* La largeur vient du panneau, jamais du contenu (onglets, toile) : pas de débord à 360 px. */
    contain: inline-size;
    flex-direction: column;
    block-size: 100%;
    min-block-size: 0;
  }
  .view-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    min-inline-size: 0;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    min-inline-size: 0;
  }
  .toolbar > :global(.tabs) {
    min-inline-size: 0;
    max-inline-size: 100%;
    overflow-x: auto;
  }
  .zoom {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }
  .zoom-level {
    min-inline-size: 3.5rem;
    text-align: center;
    color: var(--text-muted);
  }
  .carry,
  .bubble {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    margin: 0 var(--space-3) var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: var(--border) solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--accent-tint);
  }
  .canvas-wrap {
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    cursor: grab;
    overscroll-behavior: contain;
  }
  .sizer {
    position: relative;
  }
  .canvas {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    transform-origin: 0 0;
  }
  .links {
    position: absolute;
    inset: 0;
    overflow: visible;
  }
  .link {
    fill: none;
    stroke: var(--line-strong);
    stroke-width: 2;
  }
  .link.union {
    stroke-dasharray: none;
    stroke-width: 3;
  }
  .pos {
    position: absolute;
  }

  .slot {
    position: relative;
    display: grid;
    grid-template-rows: auto auto 1fr;
    justify-items: center;
    gap: var(--space-1);
    inline-size: var(--slot-w);
    block-size: var(--slot-h);
    padding: var(--space-2);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: var(--shadow-1);
    font: inherit;
    text-align: center;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .slot:hover {
    transform: translateY(var(--lift));
  }
  .slot.selected {
    border-color: var(--accent);
    border-width: var(--border-strong);
  }
  .slot.locked {
    border-color: var(--established);
    border-width: var(--border-strong);
  }
  .slot.droppable {
    background: var(--accent-tint);
    border-style: dashed;
    border-color: var(--accent);
  }
  .portrait {
    display: grid;
    place-items: center;
    inline-size: 64px;
    block-size: 72px;
    border-radius: var(--radius-xs);
    background: var(--surface-2);
    color: var(--text-faint);
    overflow: hidden;
  }
  .portrait .svg {
    inline-size: 100%;
    block-size: 100%;
    background: var(--art-paper);
  }
  .portrait .svg :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .name {
    display: grid;
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    max-inline-size: 100%;
    overflow-wrap: anywhere;
  }
  .occ {
    color: var(--text-muted);
    line-height: var(--leading-snug);
  }
  .unknown {
    color: var(--text-faint);
  }
  .lock {
    position: absolute;
    inset-block-start: var(--space-1);
    inset-inline-end: var(--space-1);
    color: var(--established);
  }
  .stamp {
    position: absolute;
    inset-block-end: var(--space-1);
    inset-inline-end: calc(var(--space-2) * -1);
    pointer-events: none;
  }
  .drop {
    position: absolute;
    inset-block-end: var(--space-1);
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
    font-size: var(--step--1);
  }

  .gen-view {
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    padding: 0 var(--space-3) var(--space-4);
  }
  .gen-tabs {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
  }
  .gen-dot {
    min-inline-size: var(--hit);
    min-block-size: var(--hit);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    color: var(--text);
    font: inherit;
    font-weight: var(--weight-semibold);
  }
  .gen-dot[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--accent-contrast);
  }
  .gen-title {
    margin: var(--space-3) 0;
    text-align: center;
    font-size: var(--step-1);
  }
  .gen-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    justify-content: center;
    touch-action: pan-y;
  }
  .swipe-hint {
    text-align: center;
    color: var(--text-muted);
  }

  .list-view {
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    padding: 0 var(--space-4) var(--space-4);
  }
  .gens,
  .slots {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .gens > li + li {
    margin-block-start: var(--space-4);
  }
  .gens h3 {
    font-size: var(--step-1);
    margin: 0 0 var(--space-2);
  }
  .slots {
    display: grid;
    gap: var(--space-2);
  }
  .list-slot {
    padding: var(--space-2) var(--space-3);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-m);
    background: var(--surface-1);
  }
  .list-slot.locked {
    border-color: var(--established);
  }
  .list-open {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--hit);
    padding: 0;
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    font-weight: var(--weight-semibold);
    text-align: start;
  }
  dl {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--space-1) var(--space-4);
    margin: 0;
  }
  dl div {
    display: flex;
    gap: var(--space-2);
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
  }
</style>
