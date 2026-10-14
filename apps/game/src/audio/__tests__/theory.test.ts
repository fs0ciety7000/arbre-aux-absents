import { describe, expect, it } from 'vitest';
import {
  MODES,
  MOODS,
  createRng,
  degreeToMidi,
  isDiminished,
  layersFor,
  moodFor,
  nextDegree,
  pitchClasses,
  relativeMajorPc,
  type ModeName,
} from '../theory';

describe('moodFor', () => {
  const scene = (screen: string, extra: Partial<{ fatal: boolean; ending: string | null }> = {}) =>
    moodFor({ screen, fatal: false, ending: null, ...extra });

  it('silence au lancement et sur erreur fatale', () => {
    expect(scene('launch')).toBeNull();
    expect(scene('desk', { fatal: true })).toBeNull();
  });

  it('menus et écrans hors partie : humeur titre', () => {
    for (const s of [
      'title',
      'slots',
      'new-game',
      'options',
      'achievements',
      'stats',
      'bonus',
      'credits',
    ]) {
      expect(scene(s)).toBe('title');
    }
  });

  it('bureau : enquête ; dénouement : révélation ; rapport final : reste au bureau', () => {
    expect(scene('desk')).toBe('desk');
    expect(scene('ending', { ending: 'e-true' })).toBe('reveal');
    expect(scene('ending')).toBe('desk');
  });
});

describe('layersFor', () => {
  it('0 à 4 couches, monotone', () => {
    expect(layersFor(0)).toBe(0);
    expect(layersFor(0.24)).toBe(0);
    expect(layersFor(0.25)).toBe(1);
    expect(layersFor(0.5)).toBe(2);
    expect(layersFor(0.99)).toBe(3);
    expect(layersFor(1)).toBe(4);
    expect(layersFor(Number.NaN)).toBe(0);
    let prev = 0;
    for (let r = 0; r <= 1; r += 0.01) {
      const l = layersFor(r);
      expect(l).toBeGreaterThanOrEqual(prev);
      prev = l;
    }
  });
});

describe('théorie', () => {
  it('rng déterministe dans [0, 1)', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('degrés, octaves et degrés négatifs', () => {
    const key = { tonic: 57, mode: 'aeolian' as const };
    expect(degreeToMidi(key, 0)).toBe(57);
    expect(degreeToMidi(key, 2)).toBe(60);
    expect(degreeToMidi(key, 7)).toBe(69);
    expect(degreeToMidi(key, -1)).toBe(55);
  });

  it('majeure relative : la éolien et ré dorien → do ; fa lydien → do ; mi éolien → sol', () => {
    expect(relativeMajorPc({ tonic: 45, mode: 'aeolian' })).toBe(0);
    expect(relativeMajorPc({ tonic: 50, mode: 'dorian' })).toBe(0);
    expect(relativeMajorPc({ tonic: 41, mode: 'lydian' })).toBe(0);
    expect(relativeMajorPc({ tonic: 40, mode: 'aeolian' })).toBe(7);
    // Les classes de hauteur de la tonalité égalent celles de sa majeure relative.
    const k = { tonic: 50, mode: 'dorian' as const };
    expect(pitchClasses(k)).toEqual(pitchClasses({ tonic: relativeMajorPc(k), mode: 'ionian' }));
  });

  it('jamais d’accord diminué dans les enchaînements', () => {
    const rng = createRng(7);
    for (const mode of Object.keys(MODES) as ModeName[]) {
      let d = 0;
      for (let i = 0; i < 500; i++) {
        const next = nextDegree(rng, mode, d);
        expect(next).not.toBe(d);
        expect(isDiminished(mode, next)).toBe(false);
        d = next;
      }
    }
  });

  it('les humeurs restent sobres (tempo lent, mélodie clairsemée)', () => {
    for (const spec of Object.values(MOODS)) {
      expect(spec.bpm).toBeLessThanOrEqual(72);
      expect(spec.leadDensity + 4 * spec.leadDensityPerLayer).toBeLessThanOrEqual(0.45);
      expect(spec.keys.length).toBeGreaterThan(1);
    }
  });
});
