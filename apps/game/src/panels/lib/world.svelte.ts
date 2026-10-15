/**
 * Carte du monde compilée (`src/generated/world.ts`, écrit par `content:build`). Importée
 * seulement par le panneau Carte, chargé à la demande : la carte est un fichier JS à part.
 * Le texte du monde (titre du cartouche, descriptions des lieux) et la couche `labels` peuvent
 * être surchargés par langue (`world.<loc>.json`, chargé à la demande) : `localizedWorld(loc)`
 * rend la carte commune tant que la surcharge n'est pas là, puis la carte de la langue
 * (réactif).
 */
import type { Locale, MapLayer, Place, WorldMap } from '@arbre/contract';
import { SvelteMap } from 'svelte/reactivity';
import { loadWorldText, type WorldLocaleOverride } from '../../generated/cases';
import { world } from '../../generated/world';

export interface LocalizedWorld {
  map: WorldMap | null;
  layers: Partial<Record<MapLayer, string>>;
  places: Record<string, Place>;
}

const base: LocalizedWorld = { map: world.map, layers: world.layers, places: world.places };

const merged = new SvelteMap<Locale, LocalizedWorld>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
const started = new Set<Locale>();

/** Applique la surcharge d'une langue à la carte commune. */
export function applyWorldText(w: LocalizedWorld, o: WorldLocaleOverride): LocalizedWorld {
  const places: Record<string, Place> = { ...w.places };
  for (const [id, p] of Object.entries(o.places ?? {})) {
    const own = Object.hasOwn(places, id) ? places[id] : undefined;
    if (own && p.description !== undefined) places[id] = { ...own, description: p.description };
  }
  return {
    map: w.map && o.map ? { ...w.map, ...o.map } : w.map,
    layers: { ...w.layers, ...o.layers },
    places,
  };
}

function load(locale: Locale): void {
  if (started.has(locale)) return;
  started.add(locale);
  loadWorldText(locale).then(
    (o) => merged.set(locale, applyWorldText(base, o)),
    (err: unknown) => {
      console.warn('[monde]', locale, err);
      merged.set(locale, base);
    },
  );
}

/** Carte du monde dans une langue (commune en attendant sa surcharge). */
export function localizedWorld(locale: Locale): LocalizedWorld {
  const hit = merged.get(locale);
  if (hit) return hit;
  if (typeof window !== 'undefined') queueMicrotask(() => load(locale));
  return base;
}
