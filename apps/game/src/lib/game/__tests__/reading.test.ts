import { READ_SCALES, SIDE_WIDTH } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  READ_SCALE_MAX,
  READ_SCALE_MIN,
  clampSideWidth,
  readScalePercent,
  stepReadScale,
  toggleSideWidth,
} from '../reading';

describe('taille du texte du Lecteur (A− / A+)', () => {
  it('parcourt les crans dans l’ordre et s’arrête aux extrêmes', () => {
    let v: number = READ_SCALE_MIN;
    const seen = [v];
    for (let i = 0; i < READ_SCALES.length + 2; i++) {
      v = stepReadScale(v, 1);
      if (seen.at(-1) !== v) seen.push(v);
    }
    expect(seen).toEqual([...READ_SCALES]);
    expect(stepReadScale(READ_SCALE_MAX, 1)).toBe(READ_SCALE_MAX);
    expect(stepReadScale(READ_SCALE_MIN, -1)).toBe(READ_SCALE_MIN);
    expect(stepReadScale(1, -1)).toBe(READ_SCALE_MIN);
  });
  it('une valeur inconnue repart du cran 1', () => {
    expect(stepReadScale(1.07, 1)).toBe(READ_SCALES[READ_SCALES.indexOf(1) + 1]);
  });
  it('pourcentage affiché', () => {
    expect(readScalePercent(1.15)).toBe(115);
    expect(readScalePercent(0.9)).toBe(90);
  });
});

describe('largeur du volet', () => {
  it('borne et arrondit', () => {
    expect(clampSideWidth(100)).toBe(SIDE_WIDTH.min);
    expect(clampSideWidth(9999)).toBe(SIDE_WIDTH.max);
    expect(clampSideWidth(500.6)).toBe(501);
    expect(clampSideWidth(Number.NaN)).toBe(SIDE_WIDTH.standard);
  });
  it('double-clic : standard ↔ large', () => {
    expect(toggleSideWidth(SIDE_WIDTH.standard)).toBe(SIDE_WIDTH.wide);
    expect(toggleSideWidth(SIDE_WIDTH.wide)).toBe(SIDE_WIDTH.standard);
    expect(toggleSideWidth(SIDE_WIDTH.min)).toBe(SIDE_WIDTH.wide);
    expect(toggleSideWidth(600)).toBe(SIDE_WIDTH.standard);
  });
});
