/**
 * Mathématiques pures de la caméra (implémente `CameraOps`). Port de
 * `src/lib/camera/camera.ts` (carte-mons), voir `packages/map/SOURCE.md`.
 *
 * Repère : la carte couvre [0,1] × [0,1] (normalisé), soit `aspect` × 1 « unités carte ».
 * Au zoom 1 la carte entière tient dans le viewport (« contain ») : une unité carte (la hauteur
 * de la carte) mesure `baseScale` px CSS ; au zoom z, `baseScale · z`.
 * Toutes les fonctions sont totales : une entrée dégénérée (viewport vide, NaN) donne une
 * caméra saine.
 */
import type { NormPoint } from '@arbre/contract';
import type { Camera, CameraBounds, CameraOps, ScreenPoint, Viewport } from './types';

export const finite = (n: number, fallback: number): number => (Number.isFinite(n) ? n : fallback);
export const clampNum = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

/** Bornes assainies : aspect > 0, 0 < minZoom ≤ maxZoom. */
export function safeBounds(b: CameraBounds): CameraBounds {
  const aspect = b.aspect > 0 && Number.isFinite(b.aspect) ? b.aspect : 1;
  const minZoom = b.minZoom > 0 && Number.isFinite(b.minZoom) ? b.minZoom : 1;
  const maxZoom = Number.isFinite(b.maxZoom) ? Math.max(minZoom, b.maxZoom) : minZoom;
  return { aspect, minZoom, maxZoom };
}

export const hasArea = (v: Viewport): boolean =>
  v.width > 0 && v.height > 0 && Number.isFinite(v.width + v.height);

/** Px CSS par unité carte (hauteur de la carte) au zoom 1. 0 pour un viewport vide. */
export function baseScale(v: Viewport, b: CameraBounds): number {
  if (!hasArea(v)) return 0;
  return Math.min(v.width / safeBounds(b).aspect, v.height);
}

/** Taille rendue de la carte en px CSS pour la caméra `c`. */
export function mapSizePx(
  c: Camera,
  v: Viewport,
  b: CameraBounds,
): { width: number; height: number } {
  const s = baseScale(v, b) * c.zoom;
  return { width: s * safeBounds(b).aspect, height: s };
}

export function clamp(c: Camera, v: Viewport, b: CameraBounds): Camera {
  const sb = safeBounds(b);
  const zoom = clampNum(finite(c.zoom, sb.minZoom), sb.minZoom, sb.maxZoom);
  const cx = finite(c.center.x, 0.5);
  const cy = finite(c.center.y, 0.5);
  if (!hasArea(v)) {
    return { zoom, center: { x: clampNum(cx, 0, 1), y: clampNum(cy, 0, 1) } };
  }
  const s = baseScale(v, sb) * zoom;
  const axis = (center: number, mapPx: number, viewPx: number) => {
    if (mapPx <= viewPx) return 0.5; // plus petite que le viewport : centrée
    const half = viewPx / (2 * mapPx); // demi-étendue visible, en unités normalisées
    return clampNum(center, half, 1 - half);
  };
  return { zoom, center: { x: axis(cx, s * sb.aspect, v.width), y: axis(cy, s, v.height) } };
}

export function toScreen(p: NormPoint, c: Camera, v: Viewport, b: CameraBounds): ScreenPoint {
  const { width, height } = mapSizePx(c, v, b);
  return {
    x: v.width / 2 + (p.x - c.center.x) * width,
    y: v.height / 2 + (p.y - c.center.y) * height,
  };
}

export function toMap(s: ScreenPoint, c: Camera, v: Viewport, b: CameraBounds): NormPoint {
  const { width, height } = mapSizePx(c, v, b);
  if (!(width > 0) || !(height > 0)) return { ...c.center };
  return {
    x: c.center.x + (s.x - v.width / 2) / width,
    y: c.center.y + (s.y - v.height / 2) / height,
  };
}

export function zoomAt(
  c: Camera,
  factor: number,
  at: ScreenPoint,
  v: Viewport,
  b: CameraBounds,
): Camera {
  const current = clamp(c, v, b);
  if (!(factor > 0) || !Number.isFinite(factor) || !hasArea(v)) return current;
  const sb = safeBounds(b);
  const anchor = toMap(at, current, v, sb);
  const zoom = clampNum(current.zoom * factor, sb.minZoom, sb.maxZoom);
  const s = baseScale(v, sb) * zoom;
  const center = {
    x: anchor.x - (at.x - v.width / 2) / (s * sb.aspect),
    y: anchor.y - (at.y - v.height / 2) / s,
  };
  return clamp({ center, zoom }, v, sb);
}

export function panBy(c: Camera, dx: number, dy: number, v: Viewport, b: CameraBounds): Camera {
  const current = clamp(c, v, b);
  const { width, height } = mapSizePx(current, v, b);
  if (!(width > 0) || !(height > 0)) return current;
  return clamp(
    {
      zoom: current.zoom,
      center: {
        x: current.center.x - finite(dx, 0) / width,
        y: current.center.y - finite(dy, 0) / height,
      },
    },
    v,
    b,
  );
}

export function fitTo(p: NormPoint, zoom: number, v: Viewport, b: CameraBounds): Camera {
  return clamp({ center: { x: p.x, y: p.y }, zoom }, v, b);
}

/** Partie visible de la carte, en coordonnées normalisées (peut déborder de [0,1]). */
export function visibleRect(
  c: Camera,
  v: Viewport,
  b: CameraBounds,
): { x0: number; y0: number; x1: number; y1: number } {
  const a = toMap({ x: 0, y: 0 }, c, v, b);
  const z = toMap({ x: v.width, y: v.height }, c, v, b);
  return { x0: a.x, y0: a.y, x1: z.x, y1: z.y };
}

/** Deux caméras égales à `eps` près (zoom relatif, centre absolu). */
export function sameCamera(a: Camera, b: Camera, eps = 1e-9): boolean {
  return (
    Math.abs(a.zoom - b.zoom) <= eps * Math.max(1, Math.abs(a.zoom)) &&
    Math.abs(a.center.x - b.center.x) <= eps &&
    Math.abs(a.center.y - b.center.y) <= eps
  );
}

/** Les opérations de la caméra en un objet, typé contre `CameraOps`. */
export const cameraOps: CameraOps = { clamp, zoomAt, panBy, fitTo, toScreen, toMap };
