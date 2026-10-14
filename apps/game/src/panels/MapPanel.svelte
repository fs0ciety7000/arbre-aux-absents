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
  import { Badge, Button, Card, IconButton, Panel } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import Spot from '../shell/Spot.svelte';
  import { listenCommands, ownsCommands } from './lib/commands';
  import { worldLayers, worldMap, worldPlaces } from './lib/world';
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
          <Spot name="map-pin" size="9rem" />
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
          {#each listed as p, i (p.id)}
            {@const c = counters.get(p.id)}
            <li class="mv-deal" style:--i={Math.min(i, 12)}>
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
        <section class="place mv-sheet" aria-labelledby="map-place-title" data-surface="paper">
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
              {#each selected.docs as id, i (id)}
                {@const d = game.content.documents[id]!}
                <li>
                  <Card
                    variant="index"
                    deal={Math.min(i, 8)}
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
  /* Conteneur en taille (largeur ET hauteur) : la disposition carte + fiche du lieu dépend de
     la place réelle du panneau (téléphone portrait, téléphone couché, tablette, desktop). La
     hauteur vient du panneau, jamais du contenu. */
  .frame {
    container-type: size;
    block-size: 100%;
    min-block-size: 0;
  }
  .layout {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    gap: var(--space-3);
    block-size: 100%;
    padding: 0 var(--space-3) var(--space-3);
  }
  .layout.has-place {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
  }
  /* La carte est une feuille posée dans la chemise (§13.6) ; elle s'encre couche par couche. */
  .stage {
    position: relative;
    min-block-size: 0;
    block-size: 100%;
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-paper);
    overflow: hidden;
  }
  .stage :global([data-map-layer]) {
    animation:
      m-fade-in var(--dur-draw) var(--ease-out) backwards,
      m-ink var(--dur-draw) var(--ease-out) backwards;
    animation-delay: calc(var(--layer-i, 0) * 2 * var(--stagger));
  }
  .stage :global([data-map-layer='relief']) {
    --layer-i: 1;
  }
  .stage :global([data-map-layer='water']) {
    --layer-i: 2;
  }
  .stage :global([data-map-layer='places']) {
    --layer-i: 3;
  }
  .stage :global([data-map-layer='labels']) {
    --layer-i: 4;
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
  .list li {
    display: block;
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
    transition:
      background-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .row:hover {
    background: var(--surface-2);
    transform: translateX(var(--space-1));
  }
  .row:active {
    transform: translateX(var(--space-1)) scale(0.99);
  }
  .row[aria-current='true'] {
    border-color: var(--accent);
    box-shadow: inset var(--border-strong) 0 0 var(--accent);
  }
  .name {
    font-weight: var(--weight-semibold);
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
    border-radius: var(--radius-xs);
    background: var(--surface-1);
    box-shadow: var(--shadow-paper);
    color: var(--text);
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
    font-family: var(--font-display);
    font-variation-settings: var(--display-settings);
    font-weight: var(--weight-display-black);
    font-size: var(--step-2);
    line-height: var(--leading-display);
  }
  .place h4 {
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .place h4 {
    margin: var(--space-2) 0 0;
    font-size: var(--step-0);
  }
  .kicker {
    margin: 0;
    font-family: var(--font-label);
    font-weight: var(--weight-medium);
    letter-spacing: var(--tracking-stamp);
    color: var(--accent-strong);
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
  /* Panneau étroit (téléphone, volet de tablette) : la carte en haut, la fiche du lieu dessous,
     chacune dans sa rangée. La carte garde au moins 40 % de la hauteur (et la place de ses
     boutons de zoom) ; la fiche prend le reste au plus et défile dans sa rangée, jamais
     par-dessus la carte. */
  @container (max-width: 47.9375rem) {
    .layout.has-place {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(max(10rem, 40cqb), 1fr) minmax(0, auto);
    }
    .place {
      max-block-size: 22rem;
      border-radius: var(--radius-xs);
      box-shadow: var(--shadow-2);
    }
  }
  /* Panneau étroit et bas (téléphone couché) : carte et fiche côte à côte. */
  @container (max-width: 47.9375rem) and (max-height: 26rem) {
    .layout.has-place {
      grid-template-columns: minmax(0, 1fr) minmax(0, min(20rem, 48cqi));
      grid-template-rows: minmax(0, 1fr);
    }
    .place {
      max-block-size: none;
    }
  }
</style>
