/**
 * Bornes de la caméra depuis `WorldMap` (`content/world/map.json`, validé par
 * `WorldMapSchema` au `content:check`). La caméra reste totale : des bornes aberrantes sont
 * assainies par `safeBounds`.
 */
import type { WorldMap } from '@arbre/contract';
import { safeBounds } from './camera';
import type { Camera, CameraBounds } from './types';

export type WorldMapBounds = Pick<WorldMap, 'aspect' | 'minZoom' | 'maxZoom'>;

export function boundsFromWorldMap(map: WorldMapBounds): CameraBounds {
  return safeBounds({ aspect: map.aspect, minZoom: map.minZoom, maxZoom: map.maxZoom });
}

/** Vue d'ensemble : carte centrée au zoom minimal (touche `0`). */
export function overview(b: CameraBounds): Camera {
  return { center: { x: 0.5, y: 0.5 }, zoom: safeBounds(b).minZoom };
}
