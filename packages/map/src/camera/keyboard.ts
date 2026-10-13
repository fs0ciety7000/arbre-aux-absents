/**
 * Clavier de la carte, pur (port de `Viewport.svelte`, carte-mons) : flèches = déplacement
 * (Maj : plus loin), + / − = zoom au centre, 0 = vue d'ensemble. Ctrl, Cmd et Alt laissent la
 * touche au navigateur. Le composant appelle `keyAction`, puis `applyKeyAction` sur la caméra de
 * base (le but du vol en cours, pour que la répétition de touche s'accumule) et anime le résultat.
 */
import { overview } from './bounds';
import { clamp, panBy, zoomAt } from './camera';
import type { Camera, CameraBounds, Viewport } from './types';

export type KeyAction =
  | { kind: 'pan'; dx: -1 | 0 | 1; dy: -1 | 0 | 1; far: boolean }
  | { kind: 'zoom'; factor: number }
  | { kind: 'reset' };

/** Sous-ensemble de `KeyboardEvent` lu ici (aucun type DOM). */
export interface KeyInput {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Facteur d'un pas de zoom clavier (et des boutons + / −). */
export const KEY_ZOOM_STEP = 1.5;
/** Pas de déplacement, en fraction du petit côté du viewport. */
export const KEY_PAN_STEP = 0.12;
export const KEY_PAN_STEP_FAR = 0.35;

// Le sens est celui du contenu : flèche gauche = regarder à gauche = la carte glisse à droite.
const PAN: Record<string, [-1 | 0 | 1, -1 | 0 | 1]> = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};
const ZOOM: Record<string, number> = {
  '+': KEY_ZOOM_STEP,
  '=': KEY_ZOOM_STEP,
  Add: KEY_ZOOM_STEP,
  '-': 1 / KEY_ZOOM_STEP,
  _: 1 / KEY_ZOOM_STEP,
  Subtract: 1 / KEY_ZOOM_STEP,
};

/** Action de caméra d'une touche, ou `null` (touche laissée à la page). */
export function keyAction(e: KeyInput): KeyAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const pan = Object.hasOwn(PAN, e.key) ? PAN[e.key] : undefined;
  if (pan) return { kind: 'pan', dx: pan[0], dy: pan[1], far: e.shiftKey === true };
  const factor = Object.hasOwn(ZOOM, e.key) ? ZOOM[e.key] : undefined;
  if (factor !== undefined) return { kind: 'zoom', factor };
  if (e.key === '0') return { kind: 'reset' };
  return null;
}

/** Pas de déplacement clavier en px CSS pour ce viewport. */
export function keyPanStep(v: Viewport, far: boolean): number {
  const side = Math.min(v.width, v.height);
  return (far ? KEY_PAN_STEP_FAR : KEY_PAN_STEP) * (side > 0 && Number.isFinite(side) ? side : 0);
}

/** Caméra cible d'une action clavier depuis `base` (bornée). */
export function applyKeyAction(
  base: Camera,
  action: KeyAction,
  v: Viewport,
  b: CameraBounds,
): Camera {
  switch (action.kind) {
    case 'reset':
      return clamp(overview(b), v, b);
    case 'zoom':
      return zoomAt(base, action.factor, { x: v.width / 2, y: v.height / 2 }, v, b);
    case 'pan': {
      const step = keyPanStep(v, action.far);
      return panBy(base, action.dx * step, action.dy * step, v, b);
    }
  }
}
