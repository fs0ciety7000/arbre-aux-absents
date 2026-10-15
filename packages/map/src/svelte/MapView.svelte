<!--
  MapView : la carte du monde (port de `Viewport.svelte` + `CarteMons.svelte`, carte-mons).
  Scène d'art (SvgRenderer), caméra pure (`../camera`), gestes, clavier, lieux interactifs en
  surimpression HTML (boutons ≥ 44 px, pastilles, anneau de focus natif).

  Clavier (la région est focalisable) : flèches = se déplacer (Maj : plus loin), + / − = zoom,
  0 = vue d'ensemble, Tab = lieux (ordre ouest → est, nord → sud) ; sur un lieu, les flèches
  vont au lieu voisin dans cette direction, Entrée ouvre le lieu.

  Sans couches d'art (cartographe pas encore livré), un rendu de secours dessine les lieux
  en points sur papier gravé, avec les mêmes classes d'art et les mêmes états.

  Boutons de zoom (coin bas droit) : si la vue d’ensemble poserait des lieux dessous, la caméra
  travaille dans le viewport moins leur colonne ou leur bande (`reserveCorner`).
-->
<script lang="ts" module>
  import type { MapLayer, NormPoint } from '@arbre/contract';
  import type { PlaceArtState } from './SvgRenderer';

  export interface MapPlaceView {
    id: string;
    name: string;
    position: NormPoint;
    state: PlaceArtState;
    /** Zoom de focus (`Place.focusZoom`). */
    focusZoom?: number;
    /** Rayon de la zone sensible en unités de viewBox (`Place.hitRadius`, déf. 24). */
    hitRadius?: number;
    /** Pastille en surimpression (« ? », nombre de non lus, « + » nouvelles pièces, coche). */
    badge?: {
      text: string;
      label: string;
      tone?: 'neutral' | 'info' | 'accent' | 'success';
      icon?: 'check';
    };
    /** Description courte, annoncée avec le nom. */
    summary?: string;
  }

  export interface MapStrings {
    instructions: string;
    hint: string;
    zoomIn: string;
    zoomOut: string;
    overview: string;
    controls: string;
    states: Record<PlaceArtState, string>;
  }

  export const DEFAULT_MAP_STRINGS: MapStrings = {
    instructions:
      'Flèches pour vous déplacer, plus et moins pour zoomer, zéro pour revoir toute la carte, Tab pour parcourir les lieux et Entrée pour ouvrir un lieu.',
    hint: 'Flèches : se déplacer · + / − : zoomer · 0 : vue d’ensemble · Tab : lieux',
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    overview: 'Vue d’ensemble',
    controls: 'Zoom de la carte',
    states: { mentioned: 'mentionné', open: 'ouvert', exhausted: 'tout consulté' },
  };

  /** Rayon de zone sensible par défaut (unités de viewBox, `Place.hitRadius`). */
  export const DEFAULT_HIT_RADIUS = 24;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { ArtDefs, Badge, IconButton } from '@arbre/ui';
  import {
    boundsFromWorldMap,
    clamp,
    coastStep,
    defaultFocusZoom,
    easeCamera,
    firstView,
    focusOn,
    keyAction,
    applyKeyAction,
    mapSizePx,
    overview,
    panBy,
    releaseVelocity,
    reserveCorner,
    reveal,
    shouldCoast,
    transitionDuration,
    zoomAt,
    type Camera,
    type CameraBounds,
    type Velocity,
    type Viewport,
    type WorldMapBounds,
  } from '../camera';
  import { attachGestures } from './gestures';
  import { LAYER_ORDER, SvgRenderer } from './SvgRenderer';

  interface Props {
    /** Bornes de la carte (`WorldMap`) ; `null` : bornes de secours. */
    map: WorldMapBounds | null;
    /** Couches SVG compilées (`world.layers`). */
    layers?: Partial<Record<MapLayer, string>>;
    /** Couches déclarées (`WorldMap.layers`). */
    enabledLayers?: readonly MapLayer[];
    places: MapPlaceView[];
    /** Lieu ouvert (marqué `aria-current`). */
    selectedId?: string | null;
    onselect: (id: string) => void;
    /** Nom accessible de la région. */
    label: string;
    strings?: MapStrings;
    /** Rendu de secours : titre gravé dans le cartouche. */
    title?: string;
    class?: string;
  }

  let {
    map,
    layers = {},
    enabledLayers,
    places,
    selectedId = null,
    onselect,
    label,
    strings = DEFAULT_MAP_STRINGS,
    title = '',
    class: className = '',
  }: Props = $props();

  const FALLBACK: WorldMapBounds = { aspect: 1.5, minZoom: 1, maxZoom: 4 };
  const uid = $props.id();
  const instrId = `map-instr-${uid}`;

  const bounds: CameraBounds = $derived(boundsFromWorldMap(map ?? FALLBACK));
  const aspect = $derived(bounds.aspect);
  const hasArt = $derived(
    LAYER_ORDER.some((l) => (enabledLayers ?? LAYER_ORDER).includes(l) && Boolean(layers[l])),
  );

  let el: HTMLDivElement | undefined = $state();
  let scene: HTMLDivElement | undefined = $state();
  let zoomEl: HTMLDivElement | undefined = $state();
  let camera: Camera = $state({ center: { x: 0.5, y: 0.5 }, zoom: 1 });
  let vp: Viewport = $state({ width: 0, height: 0 });
  let dragging = $state(false);
  let measured = $state(false);
  let renderer: SvgRenderer | null = $state(null);
  let placed = false;

  /** Lieu sous le pointeur ou le focus clavier (le dernier gagne) : son lavis « prend ». */
  let shownId: string | null = $state(null);
  let hoverId: string | null = null;
  let focusId: string | null = null;

  // ---------- Mouvement ----------
  let raf = 0;
  let target: Camera | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  function reducedMotion(): boolean {
    const forced = document.documentElement.dataset.motion;
    if (forced === 'reduced') return true;
    if (forced === 'full') return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Durée d'un token (`--dur-*`) en ms ; 0 en mouvement réduit. */
  function duration(token: 'fast' | 'base' | 'camera'): number {
    if (!el) return 0;
    const raw = getComputedStyle(el).getPropertyValue(`--dur-${token}`).trim();
    const n = parseFloat(raw) || 0;
    const ms = raw.endsWith('ms') ? n : n * 1000;
    return transitionDuration(ms, { reducedMotion: reducedMotion() });
  }

  function moving() {
    clearTimeout(settleTimer);
    renderer?.setMoving(true);
  }
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => renderer?.setMoving(false), 140);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    target = null;
  }

  /** Vol de caméra (instantané en mouvement réduit), interrompu par tout geste. */
  function flyTo(to: Camera, speed: 'fast' | 'base' | 'camera' = 'camera') {
    const goal = clamp(to, vp, bounds);
    const ms = duration(speed);
    const from = camera;
    const t0 = performance.now();
    stop();
    moving();
    if (ms <= 0) {
      camera = goal;
      settle();
      return;
    }
    target = goal;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      camera = easeCamera(from, goal, t);
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        stop();
        settle();
      }
    };
    raf = requestAnimationFrame(step);
  }

  /** Inertie après un glisser (jamais en mouvement réduit). */
  function coast(v0: Velocity) {
    stop();
    let vel = v0;
    let last = performance.now();
    moving();
    const step = (now: number) => {
      const r = coastStep(camera, vel, now - last, vp, bounds);
      last = now;
      camera = r.camera;
      vel = r.velocity;
      if (r.done) {
        raf = 0;
        settle();
      } else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const centre = () => ({ x: vp.width / 2, y: vp.height / 2 });
  const basis = (): Camera => target ?? camera;

  export function zoomBy(factor: number) {
    flyTo(zoomAt(basis(), factor, centre(), vp, bounds), 'base');
  }
  export function reset() {
    flyTo(clamp(overview(bounds), vp, bounds));
  }
  /** Centre un lieu à son zoom de focus (`instant` pour une ouverture initiale). */
  export function focusPlace(id: string, instant = false) {
    const place = places.find((p) => p.id === id);
    if (!place) return;
    const goal = focusOn(
      camera,
      place.position,
      vp,
      bounds,
      place.focusZoom ?? defaultFocusZoom(bounds),
    );
    placed = true;
    if (instant || !vp.width) camera = goal;
    else flyTo(goal);
  }
  /** Bouton d'un lieu (pour rendre le focus après fermeture d'un panneau). */
  export function hotspot(id: string): HTMLElement | null {
    return el?.querySelector<HTMLElement>(`[data-place="${CSS.escape(id)}"]`) ?? null;
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    const action = keyAction(e);
    if (!action) return;
    e.preventDefault();
    const speed = action.kind === 'pan' ? 'fast' : action.kind === 'zoom' ? 'base' : 'camera';
    flyTo(applyKeyAction(basis(), action, vp, bounds), speed);
  }

  // ---------- Ordre et voisinage des lieux ----------
  /** Ordre de tabulation : ouest → est, puis nord → sud (GAME_DESIGN §9). */
  const ordered = $derived(
    [...places].sort(
      (a, b) =>
        a.position.x - b.position.x || a.position.y - b.position.y || (a.id < b.id ? -1 : 1),
    ),
  );

  const DIRS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };

  /** Lieu voisin dans une direction (cône de 60° de part et d'autre), le plus proche. */
  function neighbour(from: MapPlaceView, dir: [number, number]): MapPlaceView | null {
    let best: MapPlaceView | null = null;
    let bestScore = Infinity;
    for (const p of places) {
      if (p.id === from.id) continue;
      const dx = (p.position.x - from.position.x) * aspect;
      const dy = p.position.y - from.position.y;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 0) continue;
      const across = Math.abs(dx * dir[1] - dy * dir[0]);
      if (across > along * 1.8) continue;
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return best;
  }

  function onSpotKeydown(e: KeyboardEvent, place: MapPlaceView) {
    const dir = DIRS[e.key];
    if (!dir || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const next = neighbour(place, dir);
    e.preventDefault();
    e.stopPropagation();
    if (next) hotspot(next.id)?.focus();
  }

  // ---------- Géométrie écran ----------
  const unit = $derived(mapSizePx({ center: camera.center, zoom: 1 }, vp, bounds));

  function offset(p: NormPoint) {
    const z = camera.zoom;
    return {
      x: unit.width * (z * (p.x - camera.center.x) - (p.x - 0.5)),
      y: unit.height * (z * (p.y - camera.center.y) - (p.y - 0.5)),
    };
  }

  /**
   * Rayon de la zone sensible (en hauteurs de carte), plafonné à la moitié de la distance au
   * plus proche voisin : deux zones ne se chevauchent jamais au-dessus du plancher de 44 px.
   */
  const radius = $derived.by(() => {
    const out: Record<string, number> = {};
    for (const p of places) {
      let nearest = Infinity;
      for (const q of places) {
        if (q === p) continue;
        nearest = Math.min(
          nearest,
          Math.hypot((p.position.x - q.position.x) * aspect, p.position.y - q.position.y),
        );
      }
      out[p.id] = Math.min((p.hitRadius ?? DEFAULT_HIT_RADIUS) / 1000, nearest / 2);
    }
    return out;
  });

  function placeStyle(p: MapPlaceView) {
    const o = offset(p.position);
    return `left:${p.position.x * 100}%;top:${p.position.y * 100}%;transform:translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px)`;
  }

  // ---------- États sur la couche d'art ----------
  const states = $derived(Object.fromEntries(places.map((p) => [p.id, p.state])));
  $effect(() => {
    renderer?.setPlaceStates(states, shownId, selectedId);
  });

  $effect(() => {
    const c = camera;
    const v = vp;
    if (v.width) renderer?.render(c, v);
  });

  // Rendu de secours : la scène est aussi transformée par la caméra.
  const fallbackTransform = $derived.by(() => {
    if (hasArt || !vp.width) return undefined;
    const { width, height } = unit;
    const dx = camera.zoom * width * (0.5 - camera.center.x);
    const dy = camera.zoom * height * (0.5 - camera.center.y);
    return `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${camera.zoom.toFixed(4)})`;
  });

  /**
   * Viewport de la caméra : la boîte de la carte moins, si la vue d'ensemble y poserait des lieux,
   * la colonne (ou la bande) des boutons de zoom (`reserveCorner`). Mesures en offsets : insensibles
   * aux transformations des panneaux qui s'animent.
   */
  function measure(host: HTMLElement): Viewport {
    const w = host.clientWidth;
    const h = host.clientHeight;
    const z = zoomEl;
    const reserve = z
      ? {
          width: 2 * (w - z.offsetLeft) - z.offsetWidth,
          height: 2 * (h - z.offsetTop) - z.offsetHeight,
        }
      : { width: 0, height: 0 };
    return reserveCorner({ width: w, height: h }, reserve, bounds);
  }

  onMount(() => {
    const host = el!;
    const update = () => {
      vp = measure(host);
      if (!placed) camera = firstView(vp, bounds);
      camera = clamp(camera, vp, bounds);
    };
    update();
    measured = true;
    const ro = new ResizeObserver(update);
    ro.observe(host);
    if (zoomEl) ro.observe(zoomEl);
    const r = new SvgRenderer({ layers, enabled: enabledLayers, aspect });
    if (hasArt) {
      r.mount(scene!);
      renderer = r;
    }
    const detach = attachGestures(host, {
      onstart() {
        stop();
        moving();
        dragging = true;
        placed = true;
      },
      onpan(dx, dy) {
        camera = panBy(camera, dx, dy, vp, bounds);
      },
      onzoom(factor, at) {
        camera = zoomAt(camera, factor, at, vp, bounds);
      },
      onend(samples, at) {
        dragging = false;
        const v = releaseVelocity(samples, at);
        if (shouldCoast(v, { reducedMotion: reducedMotion() })) coast(v);
        else settle();
      },
      ondouble(at, out) {
        flyTo(zoomAt(basis(), out ? 0.5 : 2, at, vp, bounds), 'base');
      },
    });
    return () => {
      ro.disconnect();
      detach();
      stop();
      clearTimeout(settleTimer);
      r.destroy();
      renderer = null;
    };
  });

  const fallbackW = $derived(1000 * aspect);
</script>

{#snippet spot(place: MapPlaceView)}
  <button
    type="button"
    class="spot"
    data-place={place.id}
    data-state={place.state}
    data-verb="look"
    data-active={place.id === shownId || undefined}
    aria-label="{place.name}, {strings.states[place.state]}{place.badge
      ? `, ${place.badge.label}`
      : ''}"
    aria-describedby={place.summary ? `${instrId}-${place.id}` : undefined}
    aria-current={place.id === selectedId ? 'true' : undefined}
    style="--r:{(radius[place.id] ?? 0.024).toFixed(4)};{placeStyle(place)}"
    onclick={() => onselect(place.id)}
    onkeydown={(e) => onSpotKeydown(e, place)}
    onfocus={() => {
      shownId = focusId = place.id;
      const goal = reveal(place.position, camera, vp, bounds);
      if (goal) flyTo(goal);
    }}
    onblur={() => {
      focusId = null;
      shownId = hoverId;
    }}
    onpointerenter={(e) => {
      if (e.pointerType !== 'mouse') return;
      shownId = hoverId = place.id;
    }}
    onpointerleave={() => {
      hoverId = null;
      shownId = focusId;
    }}
  >
    <span class="dot" aria-hidden="true"></span>
    {#if place.badge}
      <span class="badge" aria-hidden="true">
        <Badge
          tone={place.badge.tone ?? 'neutral'}
          variant="solid"
          iconName={place.badge.icon === 'check' ? 'check' : undefined}>{place.badge.text}</Badge
        >
      </span>
    {/if}
    <span class="tip" aria-hidden="true">{place.name}</span>
    {#if place.summary}
      <span class="visually-hidden" id="{instrId}-{place.id}">{place.summary}</span>
    {/if}
  </button>
{/snippet}

<div class="map {className}">
  <ArtDefs />
  <!-- Région focalisable (pas role="application") : les lecteurs d'écran gardent leurs touches. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={el}
    class="vp"
    class:measured
    class:dragging
    style:--vp-aspect={aspect}
    style:--cam-w={measured ? `${vp.width}px` : undefined}
    style:--cam-h={measured ? `${vp.height}px` : undefined}
    role="region"
    aria-roledescription="carte"
    aria-label={label}
    aria-describedby={instrId}
    tabindex="0"
    {onkeydown}
  >
    <div bind:this={scene} class="scene">
      {#if !hasArt}
        <svg
          class="art fallback"
          viewBox="0 0 {fallbackW} 1000"
          aria-hidden="true"
          focusable="false"
          style:transform={fallbackTransform}
        >
          <rect class="paper" x="0" y="0" width={fallbackW} height="1000" />
          <rect class="hatch" x="0" y="0" width={fallbackW} height="1000" opacity="0.35" />
          <rect class="paper" x="40" y="40" width={fallbackW - 80} height="920" />
          <rect class="ink" x="24" y="24" width={fallbackW - 48} height="952" stroke-width="3" />
          <rect class="ink-soft" x="34" y="34" width={fallbackW - 68} height="932" />
          <g class="compass" transform="translate({fallbackW - 120} 120)">
            <circle class="ink-soft" r="48" />
            <circle class="ink-faint" r="36" />
            <path class="ink" d="M0 -60 L10 0 L0 60 L-10 0 Z" />
            <path class="ink" d="M0 -60 L10 0 L-10 0 Z" fill="currentColor" />
            <text class="label-note" x="0" y="-70" text-anchor="middle">N</text>
          </g>
          {#if title}
            <g transform="translate(70 900)">
              <rect class="paper" x="0" y="-60" width="360" height="80" />
              <rect class="ink" x="0" y="-60" width="360" height="80" stroke-width="2" />
              <text class="label-major" x="20" y="-10">{title}</text>
            </g>
          {/if}
          {#each places as p (p.id)}
            <g
              id="place-{p.id}"
              data-state={p.state}
              data-active={p.id === shownId || undefined}
              aria-current={p.id === selectedId ? 'true' : undefined}
            >
              <circle
                class="wash-safran"
                cx={p.position.x * fallbackW}
                cy={p.position.y * 1000}
                r="22"
              />
              <circle
                class="ink"
                cx={p.position.x * fallbackW}
                cy={p.position.y * 1000}
                r="9"
                stroke-width="2.5"
              />
              <text
                class="label"
                x={p.position.x * fallbackW}
                y={p.position.y * 1000 + 46}
                text-anchor="middle">{p.name}</text
              >
            </g>
          {/each}
        </svg>
      {/if}
    </div>

    <div class="overlay" style:--z={measured ? camera.zoom.toFixed(4) : undefined}>
      {#each ordered as place (place.id)}
        {@render spot(place)}
      {/each}
    </div>

    <p class="hint" aria-hidden="true">{strings.hint}</p>
  </div>
  <p class="visually-hidden" id={instrId}>{strings.instructions}</p>

  <div bind:this={zoomEl} class="zoom" role="group" aria-label={strings.controls}>
    <IconButton
      label={strings.zoomIn}
      icon="plus"
      variant="secondary"
      tooltipPlacement="start"
      onclick={() => zoomBy(1.5)}
    />
    <IconButton
      label={strings.zoomOut}
      icon="minus"
      variant="secondary"
      tooltipPlacement="start"
      onclick={() => zoomBy(1 / 1.5)}
    />
    <IconButton
      label={strings.overview}
      icon="fit"
      variant="secondary"
      tooltipPlacement="start"
      onclick={reset}
    />
  </div>
</div>

<style>
  .map {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 0;
  }
  .vp {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    background: var(--art-paper);
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    border-radius: inherit;
  }
  .vp.dragging {
    cursor: grabbing;
  }
  .vp:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
  }

  /* Scène et surimpression partagent la boîte du zoom 1 : la carte entière, centrée dans le
     viewport de la caméra (`--cam-w` × `--cam-h`, ancré en haut à gauche : la vue entière, moins
     la colonne ou la bande réservée aux boutons de zoom, voir `reserveCorner`). */
  .scene,
  .overlay {
    --cw: var(--cam-w, 100cqw);
    --ch: var(--cam-h, 100cqh);
    --uh: min(var(--ch), var(--cw) / var(--vp-aspect));
    position: absolute;
    left: calc(var(--cw) / 2);
    top: calc(var(--ch) / 2);
    block-size: var(--uh);
    aspect-ratio: var(--vp-aspect);
    translate: -50% -50%;
    pointer-events: none;
  }
  .scene {
    transform-origin: 50% 50%;
  }
  .scene > :global(svg) {
    position: absolute;
    inset: 0;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    max-inline-size: none;
    overflow: visible;
  }
  .fallback {
    transform-origin: 50% 50%;
  }
  .compass text {
    font-size: 22px;
  }

  /* ── Lieux ─────────────────────────────────────────────────────── */
  .spot {
    position: absolute;
    display: grid;
    place-items: center;
    --spot: clamp(var(--hit), 2 * var(--r) * var(--uh) * var(--z, 1), 160px);
    inline-size: var(--spot);
    block-size: var(--spot);
    margin: calc(var(--spot) / -2) 0 0 calc(var(--spot) / -2);
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text);
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }
  .dot {
    inline-size: var(--space-3);
    block-size: var(--space-3);
    border: var(--border-strong) solid var(--art-ink);
    border-radius: var(--radius-pill);
    background: var(--art-paper);
    box-shadow: 0 0 0 2px var(--art-paper);
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .spot[data-state='mentioned'] .dot {
    border-style: dashed;
    border-color: var(--art-ink-faint);
  }
  .spot[data-active] .dot,
  .spot[aria-current='true'] .dot {
    border-color: var(--art-ink);
    background: var(--art-ink);
    transform: scale(1.35);
  }
  .spot:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 0;
    box-shadow: 0 0 0 5px var(--focus-halo);
  }
  .badge {
    position: absolute;
    inset-block-start: calc(50% - var(--space-8));
    inset-inline-start: calc(50% + var(--space-2));
    pointer-events: none;
  }
  .tip {
    position: absolute;
    inset-block-end: calc(100% + var(--space-1));
    left: 50%;
    display: none;
    inline-size: max-content;
    max-inline-size: min(18rem, 70cqw);
    padding: var(--space-1) var(--space-3);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    color: var(--text);
    box-shadow: var(--shadow-2);
    font-family: var(--font-ui);
    font-size: var(--step-0);
    translate: -50% 0;
    pointer-events: none;
  }
  .spot:hover,
  .spot:focus-visible {
    z-index: var(--z-raised);
  }
  .spot:hover .tip,
  .spot:focus-visible .tip {
    display: block;
  }
  .overlay:has(.spot:focus-visible) .spot:not(:focus-visible) .tip {
    display: none;
  }

  .hint {
    position: absolute;
    inset-inline: 0;
    inset-block-start: var(--space-3);
    inline-size: max-content;
    max-inline-size: calc(100% - 2 * var(--space-4));
    margin: 0 auto;
    padding: var(--space-1) var(--space-3);
    border: var(--border) solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--surface-1);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: var(--step--1);
    text-align: center;
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease-out);
    pointer-events: none;
  }
  .vp:focus-visible > .hint {
    opacity: 1;
  }

  .zoom {
    position: absolute;
    inset-inline-end: var(--space-3);
    inset-block-end: var(--space-3);
    display: grid;
    gap: var(--space-2);
    z-index: var(--z-raised);
  }

  @media (forced-colors: active) {
    .dot {
      border-color: CanvasText;
      background: Canvas;
    }
    .spot[data-active] .dot {
      background: Highlight;
    }
  }
</style>
