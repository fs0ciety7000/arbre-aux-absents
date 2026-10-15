import { READ_SCALES, SIDE_WIDTH, type ReadScale } from '@arbre/contract';

/**
 * Confort de lecture (PROPOSITION-INTERFACE option 1) : crans de taille du texte du Lecteur
 * (A− / A+) et largeur du volet latéral (poignée, double-clic standard ↔ large).
 */

/** Cran voisin (`dir` = +1 : A+, −1 : A−) ; reste sur le cran extrême. */
export function stepReadScale(current: number, dir: 1 | -1): ReadScale {
  const i = READ_SCALES.indexOf(current as ReadScale);
  const from = i < 0 ? READ_SCALES.indexOf(1) : i;
  const next = Math.min(READ_SCALES.length - 1, Math.max(0, from + dir));
  return READ_SCALES[next]!;
}

export const READ_SCALE_MIN = READ_SCALES[0];
export const READ_SCALE_MAX = READ_SCALES[READ_SCALES.length - 1]!;

/** Pourcentage affiché d'un cran (« 115 % »). */
export function readScalePercent(scale: number): number {
  return Math.round(scale * 100);
}

/** Largeur du volet bornée et entière (px). */
export function clampSideWidth(w: number): number {
  if (!Number.isFinite(w)) return SIDE_WIDTH.standard;
  return Math.round(Math.min(SIDE_WIDTH.max, Math.max(SIDE_WIDTH.min, w)));
}

/** Double-clic sur la poignée : large si le volet est plus étroit que la moitié du chemin, sinon standard. */
export function toggleSideWidth(w: number): number {
  const mid = (SIDE_WIDTH.standard + SIDE_WIDTH.wide) / 2;
  return w < mid ? SIDE_WIDTH.wide : SIDE_WIDTH.standard;
}
