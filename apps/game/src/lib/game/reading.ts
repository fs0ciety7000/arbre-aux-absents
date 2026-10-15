import { READ_SCALES, SIDE_WIDTH, type CardPosition, type ReadScale } from '@arbre/contract';

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

const unit = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Position de la fiche flottante bornée à [0, 1] (arrondie au millième). */
export function clampCardPosition(p: CardPosition): CardPosition {
  return { x: Math.round(unit(p.x) * 1000) / 1000, y: Math.round(unit(p.y) * 1000) / 1000 };
}

/**
 * Déplacement de la fiche : `dx`/`dy` en px, `free` = place libre (px) en largeur et hauteur.
 * Sans place libre (fiche aussi grande que le Bureau), la position ne bouge pas sur cet axe.
 */
export function moveCard(
  from: CardPosition,
  dx: number,
  dy: number,
  free: { w: number; h: number },
): CardPosition {
  return clampCardPosition({
    x: free.w > 0 ? from.x + dx / free.w : from.x,
    y: free.h > 0 ? from.y + dy / free.h : from.y,
  });
}
