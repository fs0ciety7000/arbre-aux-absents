import { describe, expect, it } from 'vitest';
import { Composer, type MusicEvent } from '../composer';
import { MOODS, createRng, pitchClasses, type Mood } from '../theory';

function run(mood: Mood, seed: number, bars: number, layers = 0) {
  const c = new Composer(MOODS[mood], createRng(seed), 10, layers);
  const out: Array<{
    bar: number;
    start: number;
    end: number;
    events: MusicEvent[];
    key: string;
    phrase: string;
  }> = [];
  for (let i = 0; i < bars; i++) {
    const start = c.cursor;
    const events = c.bar();
    out.push({
      bar: i,
      start,
      end: c.cursor,
      events,
      key: `${c.key.tonic}-${c.key.mode}`,
      phrase: c.phrase,
    });
  }
  return { c, out };
}

const MOODS_LIST: Mood[] = ['title', 'desk', 'reveal'];

describe('Composer', () => {
  it('déterministe pour une graine', () => {
    expect(run('desk', 3, 40).out).toEqual(run('desk', 3, 40).out);
    expect(run('desk', 3, 40).out).not.toEqual(run('desk', 4, 40).out);
  });

  it.each(MOODS_LIST)('%s : événements dans leur mesure, valides', (mood) => {
    const { out } = run(mood, 11, 200, 2);
    for (const bar of out) {
      expect(bar.end - bar.start).toBeCloseTo((60 / MOODS[mood].bpm) * MOODS[mood].beatsPerBar);
      for (const ev of bar.events) {
        expect(ev.at).toBeGreaterThanOrEqual(bar.start);
        expect(ev.at).toBeLessThan(bar.end);
        expect(ev.dur).toBeGreaterThan(0);
        expect(ev.vel).toBeGreaterThan(0);
        expect(ev.vel).toBeLessThanOrEqual(1);
        expect(Math.abs(ev.pan)).toBeLessThanOrEqual(1);
        for (const m of ev.midi) {
          expect(Number.isInteger(m)).toBe(true);
          expect(m).toBeGreaterThanOrEqual(24);
          expect(m).toBeLessThanOrEqual(96);
        }
      }
    }
  });

  it.each(MOODS_LIST)('%s : toutes les notes appartiennent à la tonalité en cours', (mood) => {
    const c = new Composer(MOODS[mood], createRng(5), 0, 4);
    for (let i = 0; i < 300; i++) {
      const pcs = (() => {
        const events = c.bar();
        return { events, pcs: pitchClasses(c.key) };
      })();
      for (const ev of pcs.events) for (const m of ev.midi) expect(pcs.pcs.has(m % 12)).toBe(true);
    }
  });

  it.each(MOODS_LIST)('%s : respire (phrases sans mélodie) et change de tonalité', (mood) => {
    const { out } = run(mood, 21, 400);
    const phrases = out.filter((b) => b.bar % MOODS[mood].phraseBars === 0).map((b) => b.phrase);
    expect(phrases.filter((p) => p !== 'full').length).toBeGreaterThan(3);
    expect(new Set(out.map((b) => b.key)).size).toBeGreaterThan(1);
    // Jamais deux phrases non pleines d'affilée hors changement de tonalité : la musique revient.
    expect(phrases.filter((p) => p === 'full').length).toBeGreaterThan(phrases.length / 2);
  });

  it('ne se répète pas : phrases mélodiques presque toutes différentes', () => {
    for (const mood of MOODS_LIST) {
      const { out } = run(mood, 99, 480, 2);
      const phraseBars = MOODS[mood].phraseBars;
      const prints: string[] = [];
      for (let i = 0; i + phraseBars <= out.length; i += phraseBars) {
        const notes = out
          .slice(i, i + phraseBars)
          .flatMap((b) =>
            b.events
              .filter((e) => e.voice === 'lead')
              .map((e) => `${Math.round((e.at - out[i]!.start) * 4)}:${e.midi[0]}`),
          );
        if (notes.length >= 3) prints.push(notes.join(','));
      }
      expect(prints.length).toBeGreaterThan(30);
      expect(new Set(prints).size / prints.length).toBeGreaterThan(0.95);
    }
  });

  it('sobre sur la durée : densité de notes mélodiques bornée', () => {
    for (const mood of MOODS_LIST) {
      const { out } = run(mood, 8, 300, 4);
      const minutes = (out.at(-1)!.end - out[0]!.start) / 60;
      const lead = out
        .flatMap((b) => b.events)
        .filter((e) => e.voice === 'lead' || e.voice === 'bell');
      expect(lead.length / minutes).toBeLessThan(mood === 'reveal' ? 80 : 45);
      expect(lead.length / minutes).toBeGreaterThan(5);
    }
  });

  it('les couches étoffent le bureau', () => {
    const count = (layers: number) =>
      run('desk', 13, 400, layers)
        .out.flatMap((b) => b.events)
        .filter((e) => e.voice === 'lead' || e.voice === 'bell').length;
    expect(count(4)).toBeGreaterThan(count(0) * 1.3);
    const bells0 = run('desk', 13, 200, 0)
      .out.flatMap((b) => b.events)
      .filter((e) => e.voice === 'bell');
    expect(bells0).toHaveLength(0);
    const pad4 = run('desk', 13, 8, 4)
      .out.flatMap((b) => b.events)
      .find((e) => e.voice === 'pad');
    expect(pad4?.midi).toHaveLength(4); // septième ajoutée
  });

  it('resync : reprend à « maintenant » sans rattraper le retard', () => {
    const c = new Composer(MOODS.desk, createRng(1), 0);
    c.bar();
    c.resync(500);
    expect(c.cursor).toBe(500);
    const events = c.bar();
    for (const e of events) expect(e.at).toBeGreaterThanOrEqual(500);
    c.resync(100); // jamais en arrière
    expect(c.cursor).toBeGreaterThan(500);
  });
});
