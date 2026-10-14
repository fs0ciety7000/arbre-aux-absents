/**
 * Motion du design system v2 (DESIGN.md §8) : transitions Svelte et actions, sans dépendance.
 * Tout lit les tokens CSS (--dur-*, --deal-*) au moment de jouer : les réglages joueur
 * (data-motion) et prefers-reduced-motion s'appliquent sans code de plus. En mouvement
 * réduit, chaque transition devient un fondu court (--dur-fade), jamais rien de bloquant.
 * N'anime que transform et opacity (et filter pour l'encre).
 */
import type { TransitionConfig } from 'svelte/transition';

/* ── Lecture des tokens ─────────────────────────────────────────────── */

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/** Valeur d'un token de durée en ms (« 480ms », « .48s ») ; `fallback` hors navigateur. */
export function tokenMs(name: string, fallback = 0): number {
  if (!isBrowser) return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

/** Mouvement réduit effectif : réglage du jeu (data-motion) d'abord, sinon le système. */
export function prefersReducedMotion(): boolean {
  if (!isBrowser) return true;
  const setting = document.documentElement.dataset.motion;
  if (setting === 'reduced') return true;
  if (setting === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Courbes (équivalents JS des --ease-*) ──────────────────────────── */

function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1,
    bx = 3 * (x2 - x1) - cx,
    ax = 1 - cx - bx;
  const cy = 3 * y1,
    by = 3 * (y2 - y1) - cy,
    ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

/** Mêmes courbes que tokens.css (§8.2). */
export const EASE = {
  out: bezier(0.16, 1, 0.3, 1),
  paper: bezier(0.22, 1.2, 0.36, 1),
  deal: bezier(0.18, 0.89, 0.32, 1.12),
  snap: bezier(0.3, 1.5, 0.5, 1),
  flick: bezier(0.6, 0, 0.9, 0.4),
  ink: bezier(0.7, 0, 0.2, 1),
} as const;

/* ── Transitions Svelte ─────────────────────────────────────────────── */

interface MotionParams {
  /** Rang dans une cascade : retard = index × --stagger-deal. */
  index?: number;
  delay?: number;
}

/** Fondu court de repli (mouvement réduit). */
function reducedFade(delay = 0): TransitionConfig {
  return {
    delay,
    duration: tokenMs('--dur-fade', 120),
    css: (t) => `opacity: ${t}`,
  };
}

function stagger(p: MotionParams): number {
  return (p.delay ?? 0) + (p.index ?? 0) * tokenMs('--stagger-deal', 55);
}

/** Une fiche distribuée sur le bureau : arrive de biais et se cale (« deal »). */
export function deal(_node: Element, p: MotionParams & { dir?: 1 | -1 } = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade();
  const dist = 56;
  const rot = 7 * (p.dir ?? -1);
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-deal', 480),
    easing: EASE.deal,
    css: (t, u) =>
      `opacity: ${Math.min(1, t * 2.5)}; transform: translate(${-u * dist * 0.6}px, ${u * dist}px) rotate(${u * rot}deg)`,
  };
}

/** Une feuille posée sur la pile (léger rebond). Entrée par défaut des documents. */
export function paperIn(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade();
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-slow', 420),
    easing: EASE.paper,
    css: (t, u) =>
      `opacity: ${t}; transform: translateY(${u * 12}px) rotate(${-u}deg) scale(${1 - u * 0.015})`,
  };
}

/**
 * La feuille tirée de sa chemise (ouverture d'un document) : glisse vers le haut depuis
 * le bord, se redresse. En sortie (`out:`), elle rentre dans la chemise.
 */
export function sheetPull(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade();
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-sheet', 520),
    easing: EASE.paper,
    css: (t, u) =>
      `opacity: ${Math.min(1, t * 3)}; transform: translateY(${u * 70}%) rotate(${u * 2.5}deg)`,
  };
}

/** Changement d'écran (titre → bureau) : la lumière baisse et remonte sur la nouvelle scène. */
export function screenIn(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade(p.delay);
  return {
    delay: p.delay ?? 0,
    duration: tokenMs('--dur-screen', 720),
    easing: EASE.out,
    css: (t, u) =>
      `opacity: ${t}; transform: scale(${1 + u * 0.04}); filter: blur(${u * 6}px) brightness(${0.6 + t * 0.4})`,
  };
}

export function screenOut(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade(p.delay);
  return {
    delay: p.delay ?? 0,
    duration: tokenMs('--dur-screen', 720) * 0.6,
    easing: EASE.flick,
    css: (t, u) => `opacity: ${t}; transform: scale(${1 - u * 0.03}); filter: brightness(${t})`,
  };
}

/** Coup de tampon : tombe de haut (scale), s'écrase, l'encre se fixe. */
export function stampIn(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade();
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-stamp', 320),
    easing: EASE.snap,
    css: (t, u) =>
      `opacity: ${Math.min(1, t * 2)}; transform: scale(${1 + u * 0.6}) rotate(${-u * 6}deg)`,
  };
}

/**
 * Case revendiquée (DESIGN §6.9) : une valeur déclarée glisse hors de la fiche quand on la
 * retire (`out:`), le cartouche « Déclaré » se dégrafe ; en entrée (`in:`, « Rétablir la
 * déclaration »), le même geste à l'envers. 200 ms (`--dur-unclaim`), glissement
 * `--unclaim-shift` vers la marge et léger pivot. Mouvement réduit : **0 ms** (ni glissé ni
 * fondu : la valeur disparaît, AFFAIRE-2 §1.7). Poser l'élément dans un `.claim-stack` pour que
 * la valeur sortante et l'entrante se superposent.
 */
export function unclaim(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return { delay: 0, duration: 0 };
  const shift = tokenMs('--unclaim-shift', 14);
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-unclaim', 200),
    easing: EASE.out,
    css: (t, u) =>
      `opacity: ${t}; transform: translate(${u * shift}px, ${-u * shift * 0.35}px) rotate(${u * 4}deg)`,
  };
}

/** Encre qui apparaît : flou qui sèche et léger glissé. */
export function inkIn(_node: Element, p: MotionParams = {}): TransitionConfig {
  if (prefersReducedMotion()) return reducedFade();
  return {
    delay: stagger(p),
    duration: tokenMs('--dur-spread', 900) * 0.6,
    easing: EASE.ink,
    css: (t, u) => `opacity: ${t}; filter: blur(${u * 3}px); transform: translateY(${u * 4}px)`,
  };
}

/* ── Actions ────────────────────────────────────────────────────────── */

interface ActionReturn<P = void> {
  update?: (p: P) => void;
  destroy?: () => void;
}

/**
 * Révélation au défilement (site) : pose data-reveal="pending" puis "in" à l'entrée dans la
 * vue (motion.css anime). Sans IntersectionObserver ou en mouvement réduit : "in" direct.
 * Le contenu n'est jamais caché sans JS (l'attribut n'est posé que par l'action).
 */
export function reveal(
  node: HTMLElement,
  opts: { threshold?: number; once?: boolean } = {},
): ActionReturn {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    node.dataset.reveal = 'in';
    return {};
  }
  node.dataset.reveal = 'pending';
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          node.dataset.reveal = 'in';
          if (opts.once !== false) io.disconnect();
        } else if (opts.once === false) {
          node.dataset.reveal = 'pending';
        }
      }
    },
    { threshold: opts.threshold ?? 0.15, rootMargin: '0px 0px -8% 0px' },
  );
  io.observe(node);
  return { destroy: () => io.disconnect() };
}

/**
 * Inclinaison au pointeur (cartes du site, fiches survolées) : écrit --tilt-x/--tilt-y en
 * degrés, que le CSS du composant lit dans son transform. Souris seulement (pas au toucher),
 * coupé en mouvement réduit.
 */
export function tilt(node: HTMLElement, max = 4): ActionReturn<number> {
  let m = max;
  let frame = 0;
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = node.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      node.style.setProperty('--tilt-x', `${(-y * m).toFixed(2)}deg`);
      node.style.setProperty('--tilt-y', `${(x * m).toFixed(2)}deg`);
    });
  };
  const leave = () => {
    cancelAnimationFrame(frame);
    node.style.removeProperty('--tilt-x');
    node.style.removeProperty('--tilt-y');
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  return {
    update: (v) => (m = v),
    destroy: () => {
      cancelAnimationFrame(frame);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    },
  };
}

/**
 * Bruissement de papier : rejoue .mv-rustle sur le nœud quand `key` change (nouvel indice,
 * page tournée). Sans effet en mouvement réduit (la classe y est neutralisée par les tokens).
 */
export function rustle(node: HTMLElement, key: unknown): ActionReturn<unknown> {
  let last = key;
  const play = () => {
    node.classList.remove('mv-rustle');
    void node.offsetWidth; // relance l'animation CSS
    node.classList.add('mv-rustle');
  };
  const end = () => node.classList.remove('mv-rustle');
  node.addEventListener('animationend', end);
  return {
    update: (k) => {
      if (k !== last) {
        last = k;
        play();
      }
    },
    destroy: () => node.removeEventListener('animationend', end),
  };
}
