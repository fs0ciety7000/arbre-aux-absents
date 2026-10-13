<!--
  P06 — Carte : le monde imaginaire (MapView, `@arbre/map/svelte`), lieux visibles avec leur
  état (mentionné / ouvert / tout consulté) doublé d'une pastille, panneau de lieu (fonds,
  « Fiches à trouver », termes associés) et vue Liste accessible, équivalente à la carte.
-->
<script lang="ts">
  import type { PlaceId } from '@arbre/contract';
  import {
    keywordDocuments,
    knownKeywords,
    placeCounters,
    placeDocuments,
    visiblePlaces,
  } from '@arbre/engine';
  import { MapView, type MapPlaceView } from '@arbre/map/svelte';
  import { Badge, Button, Card, Icon, IconButton, Panel } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { worldLayers, worldMap, worldPlaces } from './lib/assets';
  import { formatPartialDate } from './lib/view';
  import { KIND_LABELS, pm } from './messages';

  const game = getGame();

  let view = $state<'map' | 'list'>('map');
  let mapView: ReturnType<typeof MapView> | undefined = $state();

  const visible = $derived(visiblePlaces(game.state, game.content));
  const counters = $derived(new Map(placeCounters(game.state, game.content).map((p) => [p.id, p])));
  const showCounters = $derived(game.settings.hints.placeCounters);

  function placeOf(id: PlaceId) {
    return (
      game.content.places[id] ?? (Object.hasOwn(worldPlaces, id) ? worldPlaces[id] : undefined)
    );
  }

  function unreadAt(id: PlaceId): number {
    return placeDocuments(id, game.state, game.content).filter(
      (d) => game.state.unlocked[d] !== undefined && game.state.read[d] === undefined,
    ).length;
  }

  const places = $derived.by((): MapPlaceView[] =>
    visible.flatMap(({ id, state }) => {
      const p = placeOf(id);
      if (!p) return [];
      const view: MapPlaceView = {
        id,
        name: p.name,
        position: p.position,
        state,
        ...(p.focusZoom !== undefined ? { focusZoom: p.focusZoom } : {}),
        ...(p.hitRadius !== undefined ? { hitRadius: p.hitRadius } : {}),
        summary: pm.map.kinds[p.kind],
      };
      if (state === 'mentioned') {
        view.badge = { text: pm.map.mentionedBadge, label: pm.map.mentionedLabel, tone: 'info' };
      } else if (state === 'exhausted') {
        view.badge = { text: '', label: pm.map.exhaustedLabel, tone: 'success', icon: 'check' };
      } else if (game.settings.hints.unreadBadges) {
        const n = unreadAt(id);
        if (n > 0) view.badge = { text: String(n), label: pm.map.unreadLabel(n), tone: 'accent' };
      }
      return [view];
    }),
  );

  const listed = $derived([...places].sort((a, b) => a.name.localeCompare(b.name, 'fr')));

  const selected = $derived.by(() => {
    const id = game.ui.selectedPlace;
    if (!id || !visible.some((v) => v.id === id)) return null;
    const p = placeOf(id);
    if (!p) return null;
    const state = visible.find((v) => v.id === id)!.state;
    const docs = placeDocuments(id, game.state, game.content).filter(
      (d) => game.state.unlocked[d] !== undefined,
    );
    const known = knownKeywords(game.state, game.content).filter((k) =>
      keywordDocuments(k, game.state, game.content).some(
        (d) => game.content.documents[d]?.place === id,
      ),
    );
    return { id, place: p, state, docs, keywords: known.slice(0, 8), counter: counters.get(id) };
  });

  function select(id: string) {
    game.navigate({ kind: 'place', id });
  }

  function close() {
    const id = game.ui.selectedPlace;
    game.ui.selectedPlace = null;
    if (id && view === 'map') queueMicrotask(() => mapView?.hotspot(id)?.focus());
  }

  function visit(id: PlaceId) {
    game.dispatch({ type: 'visitPlace', id });
  }

  // Navigation externe vers un lieu (« Où chercher ? », lien d'un document) : centrer la caméra.
  $effect(() => {
    const id = game.ui.selectedPlace;
    const map = mapView;
    if (!id || view !== 'map' || !map) return;
    // Après la mise en page (le panneau du lieu réduit la carte) : une image plus tard.
    const raf = requestAnimationFrame(() => map.focusPlace(id));
    return () => cancelAnimationFrame(raf);
  });

  let frame: HTMLDivElement | undefined = $state();
  $effect(() =>
    listenCommands((cmd) => {
      if (view !== 'map' || !mapView || !ownsCommands(frame, 'map', game.ui.main)) return false;
      if (cmd === 'zoom.in') mapView.zoomBy(1.5);
      else if (cmd === 'zoom.out') mapView.zoomBy(1 / 1.5);
      else if (cmd === 'zoom.fit') mapView.reset();
      else return false;
      return true;
    }),
  );

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && game.ui.selectedPlace) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }
</script>

<Panel title={pm.map.title} class="map-panel" scroll={false} padded={false}>
  {#snippet actions()}
    <IconButton
      icon={view === 'map' ? 'list' : 'map'}
      label={view === 'map' ? pm.map.viewList : pm.map.viewMap}
      onclick={() => (view = view === 'map' ? 'list' : 'map')}
    />
  {/snippet}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="frame" bind:this={frame} {onkeydown}>
    <div class="layout" class:has-place={!!selected}>
      {#if places.length === 0}
        <div class="empty">
          <Icon name="map" size="2rem" />
          <p>{pm.map.noPlace}</p>
        </div>
      {:else if view === 'map'}
        <div class="stage">
          <MapView
            bind:this={mapView}
            map={worldMap}
            layers={worldLayers}
            enabledLayers={worldMap?.layers}
            {places}
            selectedId={game.ui.selectedPlace}
            onselect={select}
            label={pm.map.regionLabel}
            title={worldMap?.title ?? game.content.meta.title}
          />
        </div>
      {:else}
        <ul class="list">
          {#each listed as p (p.id)}
            {@const c = counters.get(p.id)}
            <li>
              <button
                type="button"
                class="row"
                aria-current={game.ui.selectedPlace === p.id ? 'true' : undefined}
                onclick={() => select(p.id)}
              >
                <span class="name">{p.name}</span>
                <span class="kind">{p.summary}</span>
                {#if p.badge}
                  <Badge tone={p.badge.tone ?? 'neutral'} iconName={p.badge.icon}>
                    {p.badge.text}
                    <span class="visually-hidden">{p.badge.label}</span>
                  </Badge>
                {/if}
                {#if showCounters && c && p.state !== 'mentioned'}
                  <span class="num remaining">{pm.map.remaining(c.remaining)}</span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if selected}
        <section class="place" aria-labelledby="map-place-title">
          <header>
            <div>
              <p class="kicker caps">{pm.map.placeKicker} · {pm.map.kinds[selected.place.kind]}</p>
              <h3 id="map-place-title">{selected.place.name}</h3>
            </div>
            <IconButton icon="close" label={pm.map.close} onclick={close} />
          </header>
          {#if selected.place.description}
            <p class="reading desc">{selected.place.description}</p>
          {/if}
          {#if showCounters && selected.counter && selected.state !== 'mentioned'}
            <p class="num remaining">{pm.map.remaining(selected.counter.remaining)}</p>
          {/if}
          {#if selected.state === 'mentioned' || (selected.counter && selected.counter.remaining > 0)}
            <Button
              variant="primary"
              iconName="archives"
              verb="take"
              onclick={() => visit(selected.id)}
            >
              {pm.map.visit}
            </Button>
          {/if}

          <h4>{pm.map.documents}</h4>
          {#if selected.docs.length === 0}
            <p class="muted">{pm.map.noDocuments}</p>
          {:else}
            <ul class="docs">
              {#each selected.docs as id (id)}
                {@const d = game.content.documents[id]!}
                <li>
                  <Card
                    variant="fiche"
                    title={d.title}
                    kicker={KIND_LABELS[d.kind]}
                    meta={formatPartialDate(d.date) || undefined}
                    unread={game.settings.hints.unreadBadges && game.state.read[id] === undefined}
                    verb="take"
                    onactivate={() => game.navigate({ kind: 'document', id })}
                  />
                </li>
              {/each}
            </ul>
          {/if}

          {#if selected.keywords.length > 0}
            <h4>{pm.map.keywords}</h4>
            <ul class="chips">
              {#each selected.keywords as k (k)}
                <li>
                  <Button
                    variant="ghost"
                    iconName="notebook"
                    onclick={() => game.navigate({ kind: 'keyword', id: k })}
                  >
                    {game.content.keywords[k]?.label ?? k}
                  </Button>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}
    </div>
  </div>
</Panel>

<style>
  :global(.map-panel) {
    block-size: 100%;
  }
  .frame {
    container-type: inline-size;
    block-size: 100%;
  }
  .layout {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    block-size: 100%;
    min-block-size: 20rem;
  }
  .layout.has-place {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
  }
  .stage {
    position: relative;
    min-block-size: 20rem;
    block-size: 100%;
  }
  .empty {
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--space-3);
    padding: var(--space-6);
    color: var(--text-muted);
    text-align: center;
  }
  .empty p {
    margin: 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: var(--space-3);
    display: grid;
    gap: var(--space-1);
    align-content: start;
    overflow: auto;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--hit-row);
    padding: var(--space-2) var(--space-3);
    border: var(--border) solid var(--line);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    color: var(--text);
    font: inherit;
    text-align: start;
  }
  .row:hover {
    background: var(--surface-2);
  }
  .row[aria-current='true'] {
    border-color: var(--accent);
  }
  .name {
    font-weight: 600;
  }
  .kind,
  .muted {
    color: var(--text-muted);
  }
  .remaining {
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .place {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    padding: var(--space-4);
    border-inline-start: var(--border) solid var(--line-strong);
    background: var(--surface-1);
    overflow: auto;
  }
  .place header {
    display: flex;
    gap: var(--space-2);
    justify-content: space-between;
    align-items: start;
  }
  .place h3 {
    margin: 0;
    font-size: var(--step-2);
  }
  .place h4 {
    margin: var(--space-2) 0 0;
    font-size: var(--step-0);
  }
  .kicker {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--step--1);
  }
  .desc {
    margin: 0;
  }
  .docs,
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
  }
  @container (max-width: 47.9375rem) {
    .layout.has-place {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) auto;
    }
    .layout.has-place .stage {
      min-block-size: 10rem;
    }
    .place {
      max-block-size: min(22rem, 45dvh);
      border-inline-start: 0;
      border-block-start: var(--border) solid var(--line-strong);
      border-radius: var(--radius-l) var(--radius-l) 0 0;
      box-shadow: var(--shadow-2);
    }
  }
</style>
