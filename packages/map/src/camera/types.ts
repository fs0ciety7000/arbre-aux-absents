/**
 * Types de la caméra (port de `src/lib/contract/camera.ts`, carte-mons). La caméra vit dans le
 * repère normalisé de la carte (fractions [0,1], origine en haut à gauche), indépendant du
 * renderer. Aucun type DOM : le renderer reçoit une cible opaque.
 */
import type { NormPoint } from '@arbre/contract';

export type { NormPoint };

/** Point écran en px CSS, relatif au coin haut gauche du viewport. */
export interface ScreenPoint {
  x: number;
  y: number;
}

export interface Camera {
  /** Point de la carte affiché au centre du viewport (repère normalisé). */
  center: NormPoint;
  /** 1 = carte entière dans le viewport (« contain ») ; plus grand = plus près. */
  zoom: number;
}

export interface Viewport {
  /** Taille du viewport en px CSS. */
  width: number;
  height: number;
}

export interface CameraBounds {
  minZoom: number;
  maxZoom: number;
  /** Largeur / hauteur de la carte (`WorldMap.aspect`). */
  aspect: number;
}

/** Opérations implémentées par `camera.ts`. */
export interface CameraOps {
  /** Zoom dans les bornes, carte jamais sortie du viewport. */
  clamp(c: Camera, v: Viewport, b: CameraBounds): Camera;
  /** Zoom d'un facteur `factor` en gardant fixe le point écran `at`. */
  zoomAt(c: Camera, factor: number, at: ScreenPoint, v: Viewport, b: CameraBounds): Camera;
  /** Déplacement d'un delta écran en px CSS. */
  panBy(c: Camera, dx: number, dy: number, v: Viewport, b: CameraBounds): Camera;
  /** Caméra centrée sur `p` au zoom `zoom` (bornée). */
  fitTo(p: NormPoint, zoom: number, v: Viewport, b: CameraBounds): Camera;
  /** Repère normalisé → px CSS écran, et retour. */
  toScreen(p: NormPoint, c: Camera, v: Viewport, b: CameraBounds): ScreenPoint;
  toMap(s: ScreenPoint, c: Camera, v: Viewport, b: CameraBounds): NormPoint;
}

/**
 * Un renderer dessine la carte pour une caméra. MVP : `SvgRenderer` (packages/map/src/svelte,
 * frontend) ; `Target` y vaut `HTMLElement`. Plus tard : un renderer tuilé.
 */
export interface Renderer<Target = unknown> {
  mount(target: Target): void | Promise<void>;
  render(c: Camera, v: Viewport): void;
  destroy(): void;
}
