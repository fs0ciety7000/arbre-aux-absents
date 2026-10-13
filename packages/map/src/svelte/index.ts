/** Carte du monde en Svelte (port carte-mons, voir `packages/map/SOURCE.md` §2). */
export { default as MapView } from './MapView.svelte';
export { DEFAULT_HIT_RADIUS, DEFAULT_MAP_STRINGS } from './MapView.svelte';
export type { MapPlaceView, MapStrings } from './MapView.svelte';
export { LAYER_ORDER, SvgRenderer } from './SvgRenderer';
export type { PlaceArtState, SvgRendererOptions } from './SvgRenderer';
export { attachGestures, NO_GESTURE_ATTR, wheelFactor } from './gestures';
export type { GestureHandlers, Point } from './gestures';
export { parseSvg, svgContent } from './svg';
