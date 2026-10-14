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

/** Encombrement d'un groupe de contrôles posé dans le coin bas droit du viewport (px CSS). */
export interface CornerReserve {
  /** Largeur à laisser libre à droite (contrôles + leur marge, et autant de dégagement). */
  width: number;
  /** Hauteur à laisser libre en bas. */
  height: number;
}

/**
 * Viewport de la caméra quand des contrôles occupent le coin bas droit : la vue d'ensemble ne
 * doit poser aucun lieu dessous. Le viewport reste entier si la carte « contain » centrée évite
 * déjà le coin, ou si la première vue part plus près (`firstView`, écran très allongé : la carte
 * couvre tout et se parcourt au doigt) ; sinon on lui retire une colonne à droite ou une bande en
 * bas, celle qui réduit le moins la carte. L'origine reste le coin haut gauche (les gestes n'ont
 * aucun décalage).
 */
export function reserveCorner(v: Viewport, r: CornerReserve, b: CameraBounds): Viewport {
  const w = Math.max(0, finite(v.width, 0));
  const h = Math.max(0, finite(v.height, 0));
  const rw = Math.max(0, finite(r.width, 0));
  const rh = Math.max(0, finite(r.height, 0));
  const full = { width: w, height: h };
  if (!(w > 0) || !(h > 0) || (!(rw > 0) && !(rh > 0))) return full;
  const { aspect } = safeBounds(b);
  const s = Math.min(w / aspect, h);
  // Carte centrée : ses bords droit et bas.
  const right = (w + s * aspect) / 2;
  const bottom = (h + s) / 2;
  if (right <= w - rw || bottom <= h - rh) return full;
  if (firstView(full, b).zoom > overview(b).zoom) return full;
  const lane = { width: w - rw, height: h };
  const band = { width: w, height: h - rh };
  const scale = (x: Viewport) =>
    x.width > 0 && x.height > 0 ? Math.min(x.width / aspect, x.height) : -1;
  const best = scale(lane) >= scale(band) ? lane : band;
  return scale(best) > 0 ? best : full;
}
