/**
 * Gestes de pointeur de la carte (port de `src/lib/carte/gestures.ts`, carte-mons) : glisser
 * (souris, stylet, un doigt), pincer (deux doigts), molette au curseur, double-clic / double
 * toucher. Aucune dépendance, aucun framework.
 *
 * Les clics restent natifs : un glisser ne prend la capture du pointeur qu'au-delà d'un petit
 * seuil, et le clic qui termine un glisser est avalé ; les lieux (boutons) de la carte restent
 * activables d'un toucher, et un glisser qui démarre sur eux déplace quand même la carte.
 *
 * Ajout : chaque déplacement est échantillonné (`PanSample`) pour l'inertie au lâcher
 * (`releaseVelocity`, `coastStep` de la caméra pure).
 */
import type { PanSample } from '../camera';

export interface Point {
  x: number;
  y: number;
}

export interface GestureHandlers {
  /** Un geste commence (interrompt les vols de caméra, active la composition). */
  onstart(): void;
  /** Déplacement d'un delta écran en px CSS. */
  onpan(dx: number, dy: number): void;
  /** Zoom d'un facteur `factor` autour de `at` (px CSS relatifs à l'élément). */
  onzoom(factor: number, at: Point): void;
  /**
   * Fin du geste. `samples` : derniers déplacements d'un glisser à un doigt (vide après un
   * pincement ou la molette), `at` : instant du lâcher (horloge de `performance.now()`).
   */
  onend(samples: readonly PanSample[], at: number): void;
  /** Double-clic ou double toucher en `at` ; `out` avec Maj. */
  ondouble(at: Point, out: boolean): void;
}

/** Les éléments portant cet attribut (et leurs descendants) ne démarrent jamais de geste. */
export const NO_GESTURE_ATTR = 'data-map-no-gesture';

/** Déplacement (px CSS) avant qu'un appui devienne un glisser : un doigt tremble plus. */
const dragThreshold = (pointerType: string) => (pointerType === 'touch' ? 8 : 4);
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 32;
const WHEEL_END_MS = 160;
/** Échantillons conservés pour l'inertie (largement plus que la fenêtre de 100 ms). */
const MAX_SAMPLES = 24;

/** Delta de molette → facteur de zoom (pixels ; le pincement du pavé arrive en ctrl + molette). */
export function wheelFactor(e: Pick<WheelEvent, 'deltaY' | 'deltaMode' | 'ctrlKey'>): number {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
  const dy = Math.max(-200, Math.min(200, e.deltaY * unit));
  return Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018));
}

export function attachGestures(el: HTMLElement, h: GestureHandlers): () => void {
  const pointers = new Map<number, Point>();
  let dragging = false;
  let pinched = false;
  let moved = 0;
  let swallowClick = false;
  let lastTap: { t: number; x: number; y: number } | null = null;
  let lastPointerType = 'mouse';
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  let wheeling = false;
  let samples: PanSample[] = [];

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const excluded = (t: EventTarget | null) =>
    t instanceof Element && t.closest(`[${NO_GESTURE_ATTR}]`) !== null;

  const pair = () => {
    const [a, b] = [...pointers.values()] as [Point, Point];
    return {
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      dist: Math.hypot(a.x - b.x, a.y - b.y),
    };
  };

  function endWheel() {
    if (!wheeling) return;
    wheeling = false;
    clearTimeout(wheelTimer);
    h.onend([], performance.now());
  }

  function capture(id: number) {
    try {
      if (!el.hasPointerCapture(id)) el.setPointerCapture(id);
    } catch {
      /* pointeur déjà parti */
    }
  }

  function onPointerDown(e: PointerEvent) {
    lastPointerType = e.pointerType;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    if (excluded(e.target)) return;
    endWheel();
    if (pointers.size === 0) {
      dragging = false;
      pinched = false;
      moved = 0;
      samples = [];
      h.onstart();
    }
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 2) {
      // Un pincement est toujours un geste : pas de clic à la fin, pas d'inertie.
      dragging = true;
      pinched = true;
      for (const id of pointers.keys()) capture(id);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    if (pointers.size >= 2) {
      const before = pair();
      pointers.set(e.pointerId, p);
      const after = pair();
      if (before.dist > 0 && after.dist > 0) h.onzoom(after.dist / before.dist, after.mid);
      h.onpan(after.mid.x - before.mid.x, after.mid.y - before.mid.y);
      return;
    }
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    pointers.set(e.pointerId, p);
    moved += Math.hypot(dx, dy);
    if (!dragging) {
      if (moved < dragThreshold(e.pointerType)) return;
      dragging = true;
      capture(e.pointerId);
    }
    samples.push({ t: e.timeStamp, dx, dy });
    if (samples.length > MAX_SAMPLES) samples.shift();
    h.onpan(dx, dy);
  }

  function onPointerUp(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    const p = local(e);
    pointers.delete(e.pointerId);
    // Pincement → il reste un doigt : il continue de déplacer.
    if (pointers.size > 0) {
      samples = [];
      return;
    }
    if (dragging) {
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 0);
    } else if (e.pointerType === 'touch' && e.type === 'pointerup') {
      const now = e.timeStamp;
      if (
        lastTap &&
        now - lastTap.t < DOUBLE_TAP_MS &&
        Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < DOUBLE_TAP_PX
      ) {
        lastTap = null;
        h.ondouble(p, false);
      } else {
        lastTap = { t: now, x: p.x, y: p.y };
      }
    }
    const out = dragging && !pinched && e.type === 'pointerup' ? samples : [];
    dragging = false;
    pinched = false;
    samples = [];
    h.onend(out, e.timeStamp);
  }

  function onClickCapture(e: MouseEvent) {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }

  function onWheel(e: WheelEvent) {
    if (excluded(e.target)) return;
    e.preventDefault();
    if (!wheeling) {
      wheeling = true;
      h.onstart();
    }
    h.onzoom(wheelFactor(e), local(e));
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(endWheel, WHEEL_END_MS);
  }

  function onDblClick(e: MouseEvent) {
    if (lastPointerType === 'touch' || excluded(e.target)) return;
    e.preventDefault();
    h.ondouble(local(e), e.shiftKey);
  }

  const opts = { passive: false } as const;
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
  el.addEventListener('click', onClickCapture, true);
  el.addEventListener('wheel', onWheel, opts);
  el.addEventListener('dblclick', onDblClick);

  return () => {
    clearTimeout(wheelTimer);
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerUp);
    el.removeEventListener('click', onClickCapture, true);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('dblclick', onDblClick);
  };
}
