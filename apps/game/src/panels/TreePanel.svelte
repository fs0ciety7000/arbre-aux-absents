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
  import { Badge, Button, Celebrate, Icon, IconButton, Panel, Stamp, Tabs } from '@arbre/ui';
  import { svgContent } from '@arbre/map/svelte';
  import { portraitSvg } from './lib/assets.svelte';
  import { onMount, tick } from 'svelte';
  import { getGame } from '../lib/game/context';
  import { generationCote, generationNumber } from '../lib/game/generations';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { carry, decodeCarry, DRAG_MIME } from './lib/carry.svelte';
  import {
    DEFAULT_DIMS,
    layoutTree,
    longestUnbreakable,
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
  /** Génération montrée (vue par génération), par sa valeur dans le contenu : une génération
   révélée plus tard ne décale pas la vue (l'indice de rangée, lui, change). */
  let shownGen = $state<number | null>(null);
  const generation = $derived(
    shownGen !== null && layout.generations.includes(shownGen)
      ? layout.generations.indexOf(shownGen)
      : 0,
  );
  let sheetSlot = $state<SlotId | null>(null);
  let wrap: HTMLDivElement | undefined = $state();
  let focusId = $state<SlotId | null>(null);
  let justLocked = $state<Set<SlotId>>(new Set());
  /** Gerbe de confettis sur la branche qui vient d'être établie (§13.3). */
  let burst = $state<{ key: number; x: number; y: number } | null>(null);

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

  onMount(() => {
    if (matchMedia('(max-width: 37.4375rem)').matches) view = 'generation';
    const off = game.onEvents((events) => {
      for (const e of events) {
        if (e.type === 'slotsLocked') {
          justLocked = new Set(e.ids);
          celebrate(e.ids);
          setTimeout(() => (justLocked = new Set()), 1500);
        }
      }
    });
    return off;
  });

  /** Centre de la branche établie, en % de la toile : origine des confettis. */
  function celebrate(ids: readonly SlotId[]) {
    const pts = ids.map((id) => layout.slots[id]).filter((p) => p !== undefined);
    if (pts.length === 0 || layout.width === 0 || layout.height === 0) return;
    const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length + DEFAULT_DIMS.slotW / 2;
    const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length + DEFAULT_DIMS.slotH / 2;
    burst = {
      key: (burst?.key ?? 0) + 1,
      x: (cx / layout.width) * 100,
      y: (cy / layout.height) * 100,
    };
  }

  /** Génération en chiffres romains (cote de la fiche), numérotée comme dans tout le jeu. */
  function genCote(id: SlotId): string {
    return generationCote(game.content, game.content.slots[id]?.generation ?? 0);
  }
  /** Libellé « Génération n » d'une génération du contenu (jamais l'indice de rangée visible). */
  const genLabel = (gen: number) => pm.tree.generation(generationNumber(game.content, gen));
  /** Rang de distribution (≤ 12 animées) et inclinaison de repos, stables par case. */
  function dealRank(id: SlotId): number | undefined {
    const i = nodes.findIndex((n) => n.id === id);
    return i >= 0 && i < 12 ? i : undefined;
  }
  function restTilt(id: SlotId): number {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
    return ((Math.abs(h) % 5) - 2) * 0.35;
  }

  // Navigation transverse vers une case : la montrer et la sélectionner.
  $effect(() => {
    const id = game.ui.selectedSlot;
    if (!id || !visible.includes(id)) return;
    focusId = id;
    const gen = game.content.slots[id]?.generation;
    if (gen !== undefined) shownGen = gen;
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
      if (view === 'generation' && gen !== undefined) shownGen = gen;
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
    shownGen =
      layout.generations[Math.min(n - 1, Math.max(0, generation + (dx < 0 ? 1 : -1)))] ?? null;
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
    layout.generations.map((g, i) => ({
      id: String(i),
      n: generationNumber(game.content, g),
      label: genLabel(g),
      g,
    })),
  );
</script>

{#snippet card(id: SlotId)}
  {@const g = guessOf(game.state, game.content, id)}
  {@const locked = isLocked(id)}
  {@const portraitId = g?.portrait ?? null}
  {@const portrait = portraitId ? game.content.portraits[portraitId] : undefined}
  {@const occ = fieldValueLabel(game.content, 'occupation', g)}
  {@const droppable = carry.item !== null && !locked}
  {@const fresh = justLocked.has(id)}
  {@const rank = [...justLocked].indexOf(id)}
  <!-- Fiche bristol (IndexCard, §13.3) : le bouton est la fiche (un hN n'irait pas dans un bouton). -->
  <button
    type="button"
    class="slot mat-card mv-liftable"
    class:locked
    class:empty={!g}
    class:selected={game.ui.selectedSlot === id}
    class:droppable
    class:mv-thud={fresh}
    data-surface="paper"
    data-slot={id}
    data-verb={locked ? 'look' : droppable ? 'use' : 'write'}
    style:--tilt="{restTilt(id)}deg"
    style:--i={Math.max(0, rank)}
    tabindex={id === current ? 0 : -1}
    aria-label={summary(id)}
    aria-haspopup="dialog"
    onclick={() => activate(id)}
    onfocus={() => (focusId = id)}
    onkeydown={(e) => onCardKey(e, id)}
    ondragover={(e) => onDragOver(e, id)}
    ondrop={(e) => onDrop(e, id)}
  >
    <span class="head" aria-hidden="true">
      <span class="name">
        <span class:unknown={!g?.given}>{g?.given || pm.tree.unknown}</span>
        <span class:unknown={!g?.family}>{g?.family || (g?.given ? pm.tree.unknown : '')}</span>
      </span>
      <span class="gen num">{genCote(id)}</span>
    </span>
    <span class="body" class:blank={!g && !droppable} aria-hidden="true">
      {#if droppable}
        <span class="drop"><Icon name="use" size="1.25rem" /> {pm.tree.carryDrop}</span>
      {:else if !g}
        <span class="occ hint"
          ><Icon name="unknown-person" size="1.25rem" /> {pm.tree.dropHint}</span
        >
      {:else}
        <span class="portrait">
          {#if portrait}
            <span
              class="svg"
              use:svgContent={portraitId ? portraitSvg(game.content, portraitId) : null}
            ></span>
          {:else}
            <Icon name="unknown-person" size="1.75rem" />
          {/if}
        </span>
        {@const occText = occ ?? FIELD_LABELS.occupation + ' ?'}
        <span
          class="occ"
          class:unknown={!occ}
          lang="fr"
          style:--occ-chars={longestUnbreakable(occText)}>{occText}</span
        >
      {/if}
    </span>
    {#if locked}
      <span class="lock" class:mv-lock={fresh} style:--i={Math.max(0, rank)} aria-hidden="true"
        ><Icon name="lock" size="1rem" /></span
      >
      <span class="stamp" aria-hidden="true"
        ><Stamp size="s" rotate={-8} animate={fresh} delay={Math.max(0, rank)} /></span
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
      <div class="carry mv-rise" role="status" data-surface="paper">
        <Icon name="use" />
        <span>{pm.tree.carry(carry.item.label)}</span>
        <Button variant="ghost" onclick={() => carry.drop()}>{pm.tree.carryCancel}</Button>
      </div>
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
              <!-- Fil rouge tendu entre les fiches (§6.4), punaisé aux nœuds. -->
              <svg class="links" width={layout.width} height={layout.height} aria-hidden="true">
                {#each layout.links as link, i (i)}
                  <path class="link {link.kind}" d={link.d} />
                {/each}
              </svg>
              {#each nodes as n (n.id)}
                {@const p = layout.slots[n.id]!}
                {@const r = dealRank(n.id)}
                <div
                  class="pos"
                  class:mv-deal={r !== undefined}
                  style:--i={r}
                  style:left="{p.x}px"
                  style:top="{p.y}px"
                >
                  {@render card(n.id)}
                </div>
              {/each}
              {#if burst}
                <Celebrate key={burst.key} x={burst.x} y={burst.y} count={30} />
              {/if}
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
                onclick={() => (shownGen = item.g)}>{item.n}</button
              >
            {/each}
          </div>
          <h3 class="gen-title">{genItems[generation]?.label ?? ''}</h3>
          <div
            class="gen-list"
            role="group"
            aria-label={genItems[generation]?.label ?? pm.tree.generations}
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
            {#each layout.generations as gen (gen)}
              <li>
                <h3>{genLabel(gen)}</h3>
                <ol class="slots">
                  {#each nodes
                    .filter((n) => n.generation === gen)
                    .sort((a, b) => a.column - b.column) as n (n.id)}
                    {@const g = guessOf(game.state, game.content, n.id)}
                    {@const s = game.content.slots[n.id]!}
                    <li class="list-slot" class:locked={isLocked(n.id)} data-surface="paper">
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
  .carry :global(.icon) {
    color: var(--accent);
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
    stroke: var(--string);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .link.union {
    stroke-width: 2.5;
  }
  .links {
    filter: drop-shadow(0 1px 0 var(--kraft-edge));
  }
  .pos {
    position: absolute;
    --tilt: 0deg;
  }

  /* ── La case : une fiche bristol (§6.3, §13.3) ── */
  .slot {
    --head-h: 3.2em;
    --rule-gap: 1.55em;
    position: relative;
    display: grid;
    grid-template-rows: var(--head-h) 1fr;
    inline-size: var(--slot-w);
    block-size: var(--slot-h);
    padding: 0;
    border: 0;
    font: inherit;
    font-size: var(--step--1);
    text-align: start;
    transform: rotate(var(--tilt, 0deg));
  }
  .slot.empty {
    opacity: 0.9;
  }
  .slot .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-2) 0 var(--space-3);
    min-width: 0;
  }
  .slot .name {
    display: grid;
    min-width: 0;
    font-family: var(--font-type);
    font-weight: var(--weight-bold);
    line-height: 1.25;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--ink);
  }
  .slot .name > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .slot .gen {
    flex: none;
    font-family: var(--font-type);
    color: var(--ink-muted);
  }
  .slot .body.blank {
    grid-template-columns: 1fr;
  }
  /* Portrait en haut, métier dessous sur toute la largeur de la fiche : à côté du portrait, il
     ne restait que ~7 caractères et les métiers se coupaient au milieu d'un mot. */
  .slot .body {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    align-items: start;
    gap: var(--space-1) var(--space-2);
    padding: 0 var(--space-2) var(--space-1) var(--space-3);
    min-height: 0;
    min-width: 0;
    line-height: var(--rule-gap);
    container-type: inline-size;
  }
  .portrait {
    display: grid;
    place-items: center;
    inline-size: 52px;
    block-size: 64px;
    border-radius: var(--radius-xs);
    background: var(--surface-2);
    color: var(--ink-muted);
    box-shadow: var(--shadow-1);
    overflow: hidden;
    rotate: -2deg;
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
  /* Métier : retour à la ligne entre les mots seulement (césure française si le moteur la
     propose), jamais au milieu d'un mot. Si le plus long mot (--occ-chars, posé par la fiche)
     dépasse la largeur, le corps se réduit pour qu'il tienne (police à chasse fixe : 0,6 em par
     caractère, marge comprise) ; au-delà de deux lignes, points de suspension. */
  .occ {
    grid-column: 1 / -1;
    min-inline-size: 0;
    font-family: var(--font-type);
    font-size: min(1em, 100cqi / (var(--occ-chars, 1) * 0.62));
    line-height: var(--rule-gap);
    color: var(--ink);
    overflow-wrap: normal;
    word-break: normal;
    hyphens: auto;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .occ.hint {
    display: block;
    font-size: inherit;
    hyphens: manual;
  }
  .occ.hint {
    color: var(--ink-muted);
  }
  .unknown {
    color: var(--ink-faint);
  }
  .slot.selected {
    box-shadow:
      0 0 0 var(--border-strong) var(--accent),
      var(--shadow-lifted);
  }
  .slot.locked {
    box-shadow:
      0 0 0 var(--border-strong) var(--established),
      var(--shadow-paper);
  }
  .slot.droppable {
    background-color: var(--surface-2);
    box-shadow:
      0 0 0 var(--border-strong) var(--accent),
      var(--shadow-lifted);
  }
  .slot.droppable::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--accent-tint);
    pointer-events: none;
  }
  /* Cadenas à droite du portrait (le métier occupe le bas de la fiche). */
  .lock {
    position: absolute;
    inset-block-start: calc(var(--head-h) + var(--space-1));
    inset-inline-end: var(--space-3);
    color: var(--established);
  }
  .stamp {
    position: absolute;
    inset-block-end: calc(var(--space-2) * -1);
    inset-inline-end: calc(var(--space-2) * -1);
    pointer-events: none;
  }
  .occ.hint :global(.icon) {
    vertical-align: -0.3em;
  }
  .drop {
    grid-column: 1 / -1;
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    color: var(--accent);
    font-weight: var(--weight-semibold);
  }

  @media (forced-colors: active) {
    .slot,
    .list-slot {
      border: 1px solid CanvasText;
    }
    .slot.selected,
    .slot.droppable {
      outline: 3px solid Highlight;
    }
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
    border: 0;
    border-block-start: 2px solid var(--card-margin);
    border-radius: var(--radius-xs);
    background: var(--card);
    box-shadow: var(--shadow-paper);
    color: var(--text);
    transition:
      transform var(--dur-base) var(--ease-paper),
      box-shadow var(--dur-base) var(--ease-out);
  }
  .list-slot:focus-within {
    box-shadow: var(--shadow-lifted);
  }
  @media (hover: hover) {
    .list-slot:hover {
      transform: translateY(var(--lift));
    }
  }
  .list-slot.locked {
    box-shadow:
      inset var(--border-strong) 0 0 var(--established),
      var(--shadow-paper);
  }
  .list-open {
    font-family: var(--font-type);
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
  }
  .gens h3 {
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
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
