/**
 * La carte vue par le site : bornes et couches, lues directement dans `content/world/map.json`
 * (cartographe) au build. Module léger, chargé aussi par la page hydratée « Le monde » ; les lieux
 * et leurs textes sont préparés au prérendu (`places.ts`) et passés en données.
 */
import type { MapLayer, PlaceKind, WorldMap } from '@arbre/contract';
import mapJson from '../../../../../content/world/map.json';

export const WORLD_MAP = mapJson as WorldMap;
export const MAP_LAYERS: readonly MapLayer[] = WORLD_MAP.layers;

/** Un lieu tel que le site le montre (texte dans la langue de la page). */
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
