<!--
  Carte interactive de la Velmarche (seule partie hydratée du site) : MapView de @arbre/map,
  couches chargées après l'hydratation, fiche du lieu choisi annoncée poliment.
  États : chargement (Loader), erreur (message + nouvel essai), sans JS (<noscript> : la liste
  des lieux de la page la remplace).
-->
<script lang="ts">
  import type { MapLayer } from '@arbre/contract';
  import { MapView, type MapPlaceView } from '@arbre/map/svelte';
  import { Button, Loader } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { loadMapLayers } from '#lib/art/map-layers';
  import { MAP_LAYERS, PLACES, WORLD_MAP } from '#lib/content/world';

  let layers: Partial<Record<MapLayer, string>> | null = $state(null);
  let failed = $state(false);
  let selectedId: string | null = $state(null);

  const places: MapPlaceView[] = PLACES.map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    state: 'open',
    focusZoom: p.focusZoom,
    hitRadius: p.hitRadius,
    summary: p.kindLabel,
  }));
  const selected = $derived(PLACES.find((p) => p.id === selectedId) ?? null);

  async function load() {
    failed = false;
    try {
      layers = await loadMapLayers();
    } catch {
      failed = true;
    }
  }

  onMount(() => {
    void load();
  });
</script>

<div class="explorer">
  <div class="frame" data-surface="paper">
    {#if layers}
      <MapView
        map={WORLD_MAP}
        {layers}
        enabledLayers={MAP_LAYERS}
        {places}
        {selectedId}
        onselect={(id) => (selectedId = id)}
        label="Carte interactive de la Velmarche"
        title={WORLD_MAP.title}
      />
    {:else if failed}
      <div class="state" role="alert">
        <p>La carte n’a pas pu se charger. La liste des lieux, plus bas, reste disponible.</p>
        <Button variant="secondary" iconName="map" onclick={load}>Réessayer</Button>
      </div>
    {:else}
      <div class="state">
        <Loader label="Chargement de la carte" showLabel delay={0} />
        <noscript>
          <p>La carte interactive demande JavaScript. La liste des lieux, plus bas, la remplace.</p>
        </noscript>
      </div>
    {/if}
  </div>

  <section class="detail" aria-labelledby="place-detail-title">
    <h2 id="place-detail-title" class="kicker">Lieu choisi</h2>
    <div aria-live="polite">
      {#if selected}
        <p class="name">{selected.name}</p>
        <p class="kind">{selected.kindLabel}</p>
        <p class="desc">{selected.description}</p>
      {:else}
        <p class="empty">
          Choisissez un lieu sur la carte, à la souris, au doigt ou au clavier (Tab, puis les
          flèches pour passer d’un lieu à son voisin).
        </p>
      {/if}
    </div>
  </section>
</div>

<style>
  .explorer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: var(--space-6);
    align-items: start;
  }
  .frame {
    position: relative;
    aspect-ratio: 1.35;
    overflow: hidden;
    border-radius: var(--radius-paper);
    background: var(--art-paper);
    box-shadow: var(--shadow-paper);
  }
  .state {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: var(--space-4);
    padding: var(--space-6);
    text-align: center;
  }
  .detail {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-6);
    border-radius: var(--radius-l);
    background: var(--surface-1);
    box-shadow: var(--shadow-2);
  }
  .detail h2 {
    font-size: var(--step--1);
  }
  .name {
    font-family: var(--font-display);
    font-size: var(--step-2);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
  }
  .kind {
    margin-block-start: var(--space-1);
    color: var(--accent);
    font-size: var(--step--1);
    font-weight: var(--weight-semibold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }
  .desc {
    margin-block-start: var(--space-3);
    font-family: var(--font-read);
    line-height: var(--leading-read);
  }
  .empty {
    color: var(--text-muted);
  }
  @media (max-width: 79.9375rem) {
    .explorer {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 37.4375rem) {
    .frame {
      aspect-ratio: 4 / 5;
    }
  }
</style>
