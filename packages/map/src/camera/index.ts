/** Caméra pure de la carte (port carte-mons, voir `packages/map/SOURCE.md`). Aucun DOM. */
export type {
  Camera,
  CameraBounds,
  CameraOps,
  NormPoint,
  Renderer,
  ScreenPoint,
  Viewport,
} from './types';
export {
  baseScale,
  cameraOps,
  clamp,
  fitTo,
  mapSizePx,
  panBy,
  safeBounds,
  sameCamera,
  toMap,
  toScreen,
  visibleRect,
  zoomAt,
} from './camera';
export { boundsFromWorldMap, overview, type WorldMapBounds } from './bounds';
export {
  INERTIA_MAX_SPEED,
  INERTIA_MIN_SPEED,
  INERTIA_TAU_MS,
  INERTIA_WINDOW_MS,
  cameraAt,
  coastStep,
  easeCamera,
  easeInOutCubic,
  releaseVelocity,
  shouldCoast,
  startTransition,
  transitionDuration,
  type CameraTransition,
  type MotionPrefs,
  type PanSample,
  type Velocity,
} from './motion';
export {
  KEY_PAN_STEP,
  KEY_PAN_STEP_FAR,
  KEY_ZOOM_STEP,
  applyKeyAction,
  keyAction,
  keyPanStep,
  type KeyAction,
  type KeyInput,
} from './keyboard';
export {
  FIRST_VIEW_COVER_RATIO,
  FIRST_VIEW_MAX_ZOOM,
  comfortMargin,
  defaultFocusZoom,
  firstView,
  focusOn,
  needsReveal,
  reveal,
} from './views';
