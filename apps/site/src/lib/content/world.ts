/**
 * Le monde vu par le site : bornes de la carte et lieux, lus directement dans `content/world/`
 * (cartographe) au build. Les descriptions sont celles du contenu, sauf quand le site a besoin
 * d'un texte plus court ou sans indice sur l'affaire (`SITE_NOTES`).
 */
import type { MapLayer, Place, PlaceKind, WorldMap } from '@arbre/contract';
import mapJson from '../../../../../content/world/map.json';

const placeFiles = import.meta.glob('../../../../../content/world/places/*.json', {
  import: 'default',
  eager: true,
}) as Record<string, Place>;

export const WORLD_MAP = mapJson as WorldMap;
export const MAP_LAYERS: readonly MapLayer[] = WORLD_MAP.layers;

/** Textes du site qui remplacent la description du contenu (aucun indice sur l'affaire). */
const SITE_NOTES: Partial<Record<string, string>> = {
  vellaak:
    "Village de pêcheurs au fond d'un fjord ostrien : port, séchoirs à poisson, et la rédaction du journal bilingue Vel Taalik.",
  grisenoue: "Bourg des marais, au nord d'Aubrelieu : roselières, brumes et ruines calcinées.",
};

export const KIND_LABELS: Record<PlaceKind, string> = {
  region: 'Région',
  city: 'Ville',
  village: 'Village',
  building: 'Édifice',
  landmark: 'Lieu-dit',
  sea: 'Mer',
  mountain: 'Montagnes',
  river: "Cours d'eau",
};

export interface SitePlace {
  id: string;
  name: string;
  kind: PlaceKind;
  kindLabel: string;
  position: { x: number; y: number };
  description: string;
  focusZoom?: number;
  hitRadius?: number;
}

/** Lieux, de l'ouest à l'est puis du nord au sud (même ordre que le clavier de la carte). */
export const PLACES: SitePlace[] = Object.values(placeFiles)
  .map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    kindLabel: KIND_LABELS[p.kind],
    position: p.position,
    description: SITE_NOTES[p.id] ?? p.description ?? '',
    focusZoom: p.focusZoom,
    hitRadius: p.hitRadius,
  }))
  .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
