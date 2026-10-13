/**
 * SvgRenderer : dessine la carte en couches SVG inline déplacées par une seule transformation
 * CSS. Implémente `Renderer<HTMLElement>` (port de `src/lib/carte/SvgRenderer.ts`, carte-mons).
 *
 * - La scène est mise en page par CSS à la taille « contain » (zoom 1, centrée) ; la caméra est
 *   une transformation posée par-dessus (origine : centre de la scène).
 * - Différence avec la source : les couches arrivent déjà en chaînes (compilées par
 *   `content:build` dans `apps/game/src/generated/world.json`, jeu hors ligne) ; pas de
 *   chargement réseau. Elles sont analysées en XML (`parseSvg`), jamais injectées en HTML.
 * - `will-change: transform` seulement pendant un geste ou un vol : la couche reste composée
 *   (fluide), puis est rastérisée à nouveau, nette, une fois retirée.
 * - La couche `places` porte un `<g id="place-<id>">` par lieu : le renderer y pose
 *   `data-state` (mentioned|open|exhausted), `data-active` et `aria-current` (DESIGN §10.6).
 */
import type { MapLayer } from '@arbre/contract';
import { mapSizePx } from '../camera';
import type { Camera, Renderer, Viewport } from '../camera';
import { parseSvg } from './svg';

/** Ordre de dessin (= `MAP_LAYERS` du contrat, sans importer zod côté client). */
export const LAYER_ORDER: readonly MapLayer[] = ['base', 'relief', 'water', 'places', 'labels'];

export type PlaceArtState = 'mentioned' | 'open' | 'exhausted';

export interface SvgRendererOptions {
  /** SVG de chaque couche (absente = non dessinée). */
  layers: Partial<Record<MapLayer, string>>;
  /** Couches déclarées par `WorldMap.layers` (ordre de dessin conservé). */
  enabled?: readonly MapLayer[];
  aspect: number;
}

const LAYER_ATTR = 'data-map-layer';

export class SvgRenderer implements Renderer<HTMLElement> {
  #opts: SvgRendererOptions;
  #scene: HTMLElement | null = null;
  #places: SVGSVGElement | null = null;
  #count = 0;

  constructor(opts: SvgRendererOptions) {
    this.#opts = opts;
  }

  /** Nombre de couches effectivement montées (0 : le composant dessine son rendu de secours). */
  get layerCount(): number {
    return this.#count;
  }

  mount(target: HTMLElement): void {
    this.#scene = target;
    const enabled = new Set(this.#opts.enabled ?? LAYER_ORDER);
    this.#count = 0;
    for (const layer of LAYER_ORDER) {
      if (!enabled.has(layer)) continue;
      const markup = this.#opts.layers[layer];
      if (!markup) continue;
      const svg = parseSvg(markup, target.ownerDocument);
      if (!svg) continue;
      svg.setAttribute(LAYER_ATTR, layer);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.classList.add('art');
      target.append(svg);
      this.#count += 1;
      if (layer === 'places') this.#places = svg;
    }
  }

  render(c: Camera, v: Viewport): void {
    const scene = this.#scene;
    if (!scene) return;
    // Taille de la scène au zoom 1 (sa mise en page CSS), en px CSS.
    const { width, height } = mapSizePx({ center: c.center, zoom: 1 }, v, {
      aspect: this.#opts.aspect,
      minZoom: 1,
      maxZoom: 1,
    });
    const dx = c.zoom * width * (0.5 - c.center.x);
    const dy = c.zoom * height * (0.5 - c.center.y);
    scene.style.transform = `translate3d(${round(dx)}px, ${round(dy)}px, 0) scale(${c.zoom.toFixed(4)})`;
  }

  /** États des lieux sur la couche `places` (lieux absents de `states` : masqués). */
  setPlaceStates(
    states: Readonly<Record<string, PlaceArtState>>,
    activeId: string | null,
    currentId: string | null,
  ): void {
    const root = this.#places;
    if (!root) return;
    for (const g of root.querySelectorAll('g[id^="place-"]')) {
      const id = g.id.slice(6);
      const state = Object.hasOwn(states, id) ? states[id] : undefined;
      if (state) {
        g.setAttribute('data-state', state);
        g.removeAttribute('display');
      } else {
        g.removeAttribute('data-state');
        g.setAttribute('display', 'none');
      }
      g.toggleAttribute('data-active', id === activeId);
      if (id === currentId) g.setAttribute('aria-current', 'true');
      else g.removeAttribute('aria-current');
    }
  }

  /** Garde la scène composée pendant qu'elle bouge ; la retirer rastérise des vecteurs nets. */
  setMoving(moving: boolean): void {
    if (this.#scene) this.#scene.style.willChange = moving ? 'transform' : '';
  }

  destroy(): void {
    for (const el of this.#scene?.querySelectorAll(`:scope > [${LAYER_ATTR}]`) ?? []) el.remove();
    this.#scene = null;
    this.#places = null;
    this.#count = 0;
  }
}

const round = (n: number) => Math.round(n * 100) / 100;
