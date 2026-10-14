/**
 * Petits sons « cuits » une fois pour toutes (docs/game/AUDIO.md §6) : bruit blanc filtré
 * passe-bande (biquad RBJ calculé en JS) sous une enveloppe percussive. Jouer un tel tampon ne
 * coûte qu'une source et un gain, au lieu d'une chaîne source + filtre + gain par goutte.
 * Module **pur** (testé par Vitest).
 */
import type { Rng } from './theory';

export interface HitShape {
  /** Durée (s). */
  dur: number;
  /** Fréquence centrale (Hz). */
  freq: number;
  q: number;
  /** Montée (s). */
  attack: number;
}

/** Échantillons normalisés (crête 1) d'un coup bref. */
export function bakeHit(sampleRate: number, shape: HitShape, rng: Rng): Float32Array {
  const n = Math.max(1, Math.round(sampleRate * shape.dur));
  const out = new Float32Array(n);
  const w0 = (2 * Math.PI * Math.min(shape.freq, sampleRate * 0.45)) / sampleRate;
  const alpha = Math.sin(w0) / (2 * shape.q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w0)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const attack = Math.max(1, Math.round(sampleRate * shape.attack));
  const tau = n / 5;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const x = rng() * 2 - 1;
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    const env = i < attack ? i / attack : Math.exp(-(i - attack) / tau);
    // Fin forcée à zéro sur les 2 dernières ms : aucun clic.
    const tail = Math.min(1, (n - i) / (sampleRate * 0.002));
    const v = y * env * tail;
    out[i] = v;
    peak = Math.max(peak, Math.abs(v));
  }
  if (peak > 0) for (let i = 0; i < n; i++) out[i] = (out[i] ?? 0) / peak;
  return out;
}
