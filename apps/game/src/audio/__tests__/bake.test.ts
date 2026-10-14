import { describe, expect, it } from 'vitest';
import { bakeHit } from '../bake';
import { createRng } from '../theory';

describe('bakeHit', () => {
  it('durée exacte, crête normalisée, début et fin silencieux', () => {
    const data = bakeHit(48000, { dur: 0.03, freq: 3600, q: 9, attack: 0.001 }, createRng(1));
    expect(data.length).toBe(1440);
    let peak = 0;
    for (const v of data) {
      expect(Number.isFinite(v)).toBe(true);
      peak = Math.max(peak, Math.abs(v));
    }
    expect(peak).toBeCloseTo(1);
    expect(Math.abs(data[0]!)).toBeLessThan(0.05);
    expect(Math.abs(data.at(-1)!)).toBeLessThan(0.05);
  });

  it('la fréquence est bornée sous Nyquist', () => {
    const data = bakeHit(8000, { dur: 0.01, freq: 20000, q: 2, attack: 0.001 }, createRng(2));
    for (const v of data) expect(Number.isFinite(v)).toBe(true);
  });
});
