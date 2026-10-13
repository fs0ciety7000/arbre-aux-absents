/**
 * Mouvement de la caméra, pur : transitions (vols) et inertie après un glisser.
 * Le composant pilote le temps (requestAnimationFrame) ; ici, seulement des fonctions du temps.
 *
 * Mouvement réduit (`prefers-reduced-motion`) : durée 0 = transition instantanée, et pas
 * d'inertie. C'est l'appelant qui lit la préférence et la passe en `reducedMotion`.
 */
import { clamp, clampNum, finite, panBy, sameCamera } from './camera';
import type { Camera, CameraBounds, Viewport } from './types';

/** Courbe ease-in-out cubique sur [0,1]. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Caméra à la progression `t` ∈ [0,1] d'une transition de `from` vers `to`. Le zoom est
 * interpolé géométriquement (vitesse perçue constante), le centre linéairement, tous deux sur la
 * progression adoucie. `t` est borné ; t = 0 donne `from`, t = 1 donne `to`.
 */
export function easeCamera(
  from: Camera,
  to: Camera,
  t: number,
  easing: (t: number) => number = easeInOutCubic,
): Camera {
  const k = clampNum(finite(t, 1), 0, 1);
  if (k === 0) return { center: { ...from.center }, zoom: from.zoom };
  if (k === 1) return { center: { ...to.center }, zoom: to.zoom };
  const e = easing(k);
  const zoom =
    from.zoom > 0 && to.zoom > 0
      ? from.zoom * (to.zoom / from.zoom) ** e
      : from.zoom + (to.zoom - from.zoom) * e;
  return {
    zoom,
    center: {
      x: from.center.x + (to.center.x - from.center.x) * e,
      y: from.center.y + (to.center.y - from.center.y) * e,
    },
  };
}

export interface MotionPrefs {
  /** `prefers-reduced-motion: reduce` : transitions instantanées, pas d'inertie. */
  reducedMotion: boolean;
}

/** Durée effective d'une transition en ms : 0 en mouvement réduit ou si négligeable (< 1 image). */
export function transitionDuration(ms: number, prefs: MotionPrefs): number {
  if (prefs.reducedMotion) return 0;
  const d = finite(ms, 0);
  return d < 16 ? 0 : d;
}

/** Une transition de caméra, décrite par ses extrémités et sa durée (données pures). */
export interface CameraTransition {
  from: Camera;
  to: Camera;
  /** Début, dans l'horloge de l'appelant (ms). */
  start: number;
  /** Durée en ms ; 0 = instantanée. */
  duration: number;
}

/**
 * Prépare une transition vers `to` (borné). En mouvement réduit, ou pour une durée nulle, la
 * transition est instantanée : `cameraAt` rend `to` dès `start`.
 */
export function startTransition(
  from: Camera,
  to: Camera,
  now: number,
  ms: number,
  v: Viewport,
  b: CameraBounds,
  prefs: MotionPrefs,
): CameraTransition {
  return {
    from: { center: { ...from.center }, zoom: from.zoom },
    to: clamp(to, v, b),
    start: finite(now, 0),
    duration: transitionDuration(ms, prefs),
  };
}

/** Caméra de la transition à l'instant `now`, et si elle est terminée. */
export function cameraAt(
  tr: CameraTransition,
  now: number,
  easing: (t: number) => number = easeInOutCubic,
): { camera: Camera; done: boolean } {
  if (!(tr.duration > 0)) return { camera: easeCamera(tr.from, tr.to, 1), done: true };
  const t = clampNum((finite(now, tr.start + tr.duration) - tr.start) / tr.duration, 0, 1);
  return { camera: easeCamera(tr.from, tr.to, t, easing), done: t >= 1 };
}

// ---------- Inertie ----------

/** Un déplacement de glisser (px CSS) à l'instant `t` (ms). */
export interface PanSample {
  t: number;
  dx: number;
  dy: number;
}

/** Vitesse en px CSS par ms. */
export interface Velocity {
  vx: number;
  vy: number;
}

/** Fenêtre d'échantillons prise en compte pour la vitesse de lâcher (ms). */
export const INERTIA_WINDOW_MS = 100;
/** Constante de temps de la décroissance exponentielle (ms). */
export const INERTIA_TAU_MS = 325;
/** Vitesse sous laquelle l'inertie s'arrête (px/ms). */
export const INERTIA_MIN_SPEED = 0.02;
/** Vitesse maximale au lâcher (px/ms), contre les à-coups de pointeur. */
export const INERTIA_MAX_SPEED = 4;

/**
 * Vitesse de lâcher depuis les derniers échantillons d'un glisser : somme des déplacements dans
 * la fenêtre finale divisée par sa durée. Nulle si le pointeur s'est arrêté avant de lâcher
 * (`releaseAt` au-delà de la fenêtre), si les données sont dégénérées ou trop courtes.
 */
export function releaseVelocity(
  samples: readonly PanSample[],
  releaseAt: number,
  windowMs = INERTIA_WINDOW_MS,
): Velocity {
  const zero = { vx: 0, vy: 0 };
  const end = finite(releaseAt, NaN);
  if (!Number.isFinite(end) || !(windowMs > 0)) return zero;
  const recent = samples.filter(
    (s) =>
      Number.isFinite(s.t) &&
      Number.isFinite(s.dx) &&
      Number.isFinite(s.dy) &&
      s.t <= end &&
      end - s.t <= windowMs,
  );
  if (recent.length < 2) return zero;
  let first = Infinity;
  let dx = 0;
  let dy = 0;
  for (const s of recent) {
    first = Math.min(first, s.t);
    dx += s.dx;
    dy += s.dy;
  }
  // Le premier échantillon marque le début de la fenêtre : son déplacement est antérieur.
  const head = recent.find((s) => s.t === first)!;
  dx -= head.dx;
  dy -= head.dy;
  const span = end - first;
  if (!(span > 0)) return zero;
  return capSpeed({ vx: dx / span, vy: dy / span });
}

function capSpeed(v: Velocity): Velocity {
  const speed = Math.hypot(v.vx, v.vy);
  if (speed <= INERTIA_MAX_SPEED) return v;
  const k = INERTIA_MAX_SPEED / speed;
  return { vx: v.vx * k, vy: v.vy * k };
}

/** L'inertie démarre-t-elle ? Jamais en mouvement réduit ni sous la vitesse minimale. */
export function shouldCoast(v: Velocity, prefs: MotionPrefs): boolean {
  return !prefs.reducedMotion && Math.hypot(v.vx, v.vy) >= INERTIA_MIN_SPEED;
}

/**
 * Un pas d'inertie de `dt` ms : déplacement intégré exactement sous une décroissance
 * exponentielle (indépendant de la cadence d'images), puis bornage. S'arrête (`done`) sous la
 * vitesse minimale ou contre un bord (la caméra ne bouge plus).
 */
export function coastStep(
  c: Camera,
  vel: Velocity,
  dt: number,
  v: Viewport,
  b: CameraBounds,
  tau = INERTIA_TAU_MS,
): { camera: Camera; velocity: Velocity; done: boolean } {
  const step = finite(dt, 0);
  if (!(step > 0) || !(tau > 0)) return { camera: clamp(c, v, b), velocity: vel, done: false };
  const decay = Math.exp(-step / tau);
  const dist = tau * (1 - decay);
  const camera = panBy(c, vel.vx * dist, vel.vy * dist, v, b);
  const velocity = { vx: vel.vx * decay, vy: vel.vy * decay };
  const stuck = sameCamera(camera, clamp(c, v, b), 1e-12);
  const slow = Math.hypot(velocity.vx, velocity.vy) < INERTIA_MIN_SPEED;
  return { camera, velocity, done: stuck || slow };
}
