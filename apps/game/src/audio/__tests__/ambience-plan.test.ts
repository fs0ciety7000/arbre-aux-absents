import { describe, expect, it } from 'vitest';
import { AMBIENCE, AmbiencePlan, type AmbienceEvent } from '../ambience-plan';
import { createRng } from '../theory';

/** Une heure d'ambiance, demandée par fenêtres de 0,8 s comme le moteur. */
function hour(seed: number): AmbienceEvent[] {
  const plan = new AmbiencePlan(createRng(seed), 0);
  const out: AmbienceEvent[] = [];
  for (let t = 0.8; t <= 3600; t += 0.8) out.push(...plan.until(t));
  return out;
}

describe('AmbiencePlan', () => {
  const events = hour(17);
  const of = (k: AmbienceEvent['kind'][]) => events.filter((e) => k.includes(e.kind));

  it('chronologique, sans doublon de fenêtre', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.at).toBeGreaterThanOrEqual(events[i - 1]!.at - 0.8);
    }
    for (const kind of ['tick', 'rustle', 'rain'] as const) {
      const times = of([kind]).map((e) => e.at);
      expect(new Set(times).size).toBe(times.length);
    }
  });

  it('pendule : une seconde d’écart, tic et tac alternés, par périodes', () => {
    const clock = of(['tick', 'tock']);
    for (let i = 1; i < clock.length; i++) {
      const gap = clock[i]!.at - clock[i - 1]!.at;
      expect(Number.isInteger(gap)).toBe(true);
      if (gap === 1) expect(clock[i]!.kind).not.toBe(clock[i - 1]!.kind);
    }
    // Audible une partie du temps seulement.
    const audible = clock.length / 3600;
    expect(audible).toBeGreaterThan(0.15);
    expect(audible).toBeLessThan(0.75);
    // Les silences de la pendule durent au moins la borne basse.
    const gaps = clock
      .slice(1)
      .map((e, i) => e.at - clock[i]!.at)
      .filter((g) => g > 1);
    expect(gaps.length).toBeGreaterThan(5);
    for (const g of gaps) expect(g).toBeGreaterThanOrEqual(AMBIENCE.clockOff[0]);
    for (const e of clock) {
      expect(e.vel).toBeGreaterThanOrEqual(0);
      expect(e.vel).toBeLessThanOrEqual(1);
    }
  });

  it('papier : rare, espacé selon les bornes', () => {
    const rustle = of(['rustle']).map((e) => e.at);
    expect(rustle.length).toBeGreaterThan(3600 / AMBIENCE.rustleEvery[1] - 2);
    expect(rustle.length).toBeLessThan(3600 / AMBIENCE.rustleEvery[0] + 2);
    for (let i = 1; i < rustle.length; i++) {
      expect(rustle[i]! - rustle[i - 1]!).toBeGreaterThanOrEqual(AMBIENCE.rustleEvery[0]);
    }
  });

  it('pluie : niveau borné, gouttes à cadence modérée', () => {
    for (const e of of(['rain'])) {
      expect(e.vel).toBeGreaterThanOrEqual(AMBIENCE.rainLevel[0]);
      expect(e.vel).toBeLessThanOrEqual(AMBIENCE.rainLevel[1]);
    }
    const drops = of(['drop']).length / 3600;
    expect(drops).toBeGreaterThan(AMBIENCE.dropsPerSecond[0] * 0.8);
    expect(drops).toBeLessThan(AMBIENCE.dropsPerSecond[1] * 1.1);
  });

  it('resync après suspension : aucun rattrapage', () => {
    const plan = new AmbiencePlan(createRng(3), 0);
    plan.until(10);
    plan.resync(1000);
    const burst = plan.until(1000.8);
    expect(burst.filter((e) => e.kind === 'drop').length).toBeLessThan(6);
    for (const e of burst) expect(e.at).toBeGreaterThanOrEqual(1000);
  });
});
