/**
 * Vues remarquables, pures (port de `Viewport.svelte`, carte-mons) : première vue, focus sur un
 * lieu, maintien d'un lieu focalisé au clavier dans la zone confortable du viewport.
 */
import type { NormPoint } from '@arbre/contract';
import { overview } from './bounds';
import { clamp, clampNum, finite, fitTo, mapSizePx, safeBounds, toScreen } from './camera';
import type { Camera, CameraBounds, Viewport } from './types';

/** Zoom maximal de la première vue sur un écran très allongé. */
export const FIRST_VIEW_MAX_ZOOM = 2;
/** Rapport « cover » / « contain » au-delà duquel la première vue se rapproche. */
export const FIRST_VIEW_COVER_RATIO = 1.3;

/**
 * Première vue : sur un téléphone en portrait, la carte « contain » n'est qu'un bandeau ; on part
 * plus près (jusqu'à ×2 du zoom minimal) quand « cover » dépasse 1,3 × « contain ». La touche `0`
 * montre toujours la carte entière.
 */
export function firstView(v: Viewport, b: CameraBounds): Camera {
  const start = overview(b);
  const fit = mapSizePx({ center: start.center, zoom: 1 }, v, b);
  if (!(fit.width > 0) || !(fit.height > 0)) return clamp(start, v, b);
  const cover = Math.max(v.width / fit.width, v.height / fit.height);
  const boost = cover > FIRST_VIEW_COVER_RATIO ? Math.min(cover, FIRST_VIEW_MAX_ZOOM) : 1;
  return clamp({ center: start.center, zoom: start.zoom * boost }, v, b);
}

/**
 * Zoom de focus par défaut d'un lieu : moyenne géométrique des bornes (à mi-chemin perçu entre
 * la vue d'ensemble et le zoom maximal). `WorldMap` ne porte pas de zoom par lieu.
 */
export function defaultFocusZoom(b: CameraBounds): number {
  const sb = safeBounds(b);
  return Math.sqrt(sb.minZoom * sb.maxZoom);
}

/**
 * Caméra centrée sur le lieu `p` : on ne dézoome jamais pour focaliser (max du zoom courant et
 * du zoom demandé, `defaultFocusZoom` par défaut), puis bornage.
 */
export function focusOn(
  current: Camera,
  p: NormPoint,
  v: Viewport,
  b: CameraBounds,
  zoom: number = defaultFocusZoom(b),
): Camera {
  const z = Math.max(finite(current.zoom, 0), finite(zoom, defaultFocusZoom(b)));
  return fitTo(p, z, v, b);
}

/** Marge confortable (px CSS) : 15 % du côté, plafonnée à 160 px. */
export function comfortMargin(v: Viewport): { x: number; y: number } {
  return {
    x: Math.min(160, Math.max(0, v.width) * 0.15),
    y: Math.min(160, Math.max(0, v.height) * 0.15),
  };
}

/** Le point `p` est-il hors de la zone confortable du viewport ? */
export function needsReveal(p: NormPoint, c: Camera, v: Viewport, b: CameraBounds): boolean {
  if (!(v.width > 0) || !(v.height > 0)) return false;
  const s = toScreen(p, c, v, b);
  const m = comfortMargin(v);
  return s.x < m.x || s.x > v.width - m.x || s.y < m.y || s.y > v.height - m.y;
}

/**
 * Caméra qui ramène `p` dans la zone confortable (recentrage au même zoom), ou `null` si le
 * point y est déjà : le composant n'anime alors rien.
 */
export function reveal(p: NormPoint, c: Camera, v: Viewport, b: CameraBounds): Camera | null {
  if (!needsReveal(p, c, v, b)) return null;
  return fitTo({ x: clampNum(p.x, 0, 1), y: clampNum(p.y, 0, 1) }, c.zoom, v, b);
}
