<!--
  Carte interactive de la Velmarche (seule partie hydratée du site) : MapView de @arbre/map,
  couches chargées après l'hydratation, fiche du lieu choisi annoncée poliment.
  États : chargement (Loader), erreur (message + nouvel essai), sans JS (<noscript> : la liste
  des lieux de la page la remplace).
-->
<script lang="ts">
  import type { MapLayer } from '@arbre/contract';
  import { MapView, type MapPlaceView, type MapStrings } from '@arbre/map/svelte';
  import { Button, Loader } from '@arbre/ui';
  import { onMount } from 'svelte';
  import { loadMapLayers } from '#lib/art/map-layers';
  import { currentLang } from '#lib/i18n/app';
  import { MAP_LAYERS, WORLD_MAP, type SitePlace } from '#lib/content/world';

  interface Props {
    /** Lieux décrits dans la langue de la page (prérendu, `places.ts`). */
    places: SitePlace[];
    /** Titre de la carte dans la langue de la page. */
    title: string;
    /** Textes de la carte (`STRINGS[lang].map`), passés en données : page hydratée. */
    t: {
      label: string;
      failed: string;
      retry: string;
      loading: string;
      noscript: string;
      selected: string;
      hint: string;
      view: MapStrings;
    };
  }
  let { places: sitePlaces, title, t }: Props = $props();

  let layers: Partial<Record<MapLayer, string>> | null = $state(null);
  let failed = $state(false);
  let selectedId: string | null = $state(null);

  const places: MapPlaceView[] = $derived(
    sitePlaces.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      state: 'open',
      focusZoom: p.focusZoom,
      hitRadius: p.hitRadius,
      summary: p.kindLabel,
    })),
  );
  const selected = $derived(sitePlaces.find((p) => p.id === selectedId) ?? null);

  async function load() {
    failed = false;
    try {
      layers = await loadMapLayers(currentLang());
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
        label={t.label}
        strings={t.view}
        {title}
      />
    {:else if failed}
      <div class="state" role="alert">
        <p>{t.failed}</p>
        <Button variant="secondary" iconName="map" onclick={load}>{t.retry}</Button>
      </div>
    {:else}
      <div class="state">
        <Loader label={t.loading} showLabel delay={0} />
        <noscript>
          <p>{t.noscript}</p>
        </noscript>
      </div>
    {/if}
  </div>

  <section class="detail" aria-labelledby="place-detail-title">
    <h2 id="place-detail-title" class="kicker">{t.selected}</h2>
    <div aria-live="polite">
      {#if selected}
        <p class="name">{selected.name}</p>
        <p class="kind">{selected.kindLabel}</p>
        <p class="desc">{selected.description}</p>
      {:else}
        <p class="empty">{t.hint}</p>
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
