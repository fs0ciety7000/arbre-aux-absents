/**
 * Ambiance du bureau d'archiviste (docs/game/AUDIO.md §4). Module **pur** : il planifie les
 * événements ponctuels qui vivent au-dessus du lit de pluie continu (joué par `ambience.ts`).
 *
 * - `rain` : nouvelle intensité cible de la pluie (marche aléatoire lente, toutes les 12–30 s) ;
 * - `drop` : goutte sur la vitre (processus de Poisson, cadence liée à l'intensité) ;
 * - `tick` / `tock` : pendule lointaine, une seconde sur deux, **par périodes** (30–90 s audibles,
 *   puis 40–120 s d'oubli) pour ne jamais devenir un métronome ;
 * - `rustle` : froissement de papier, toutes les 45 à 150 s.
 */
import { between, type Rng } from './theory';

export type AmbienceKind = 'rain' | 'drop' | 'tick' | 'tock' | 'rustle';

export interface AmbienceEvent {
  at: number;
  kind: AmbienceKind;
  /** Intensité (0–1) ; pour `rain`, niveau cible du lit de pluie. */
  vel: number;
  /** Paramètre de timbre : fréquence (Hz) d'une goutte, durée (s) d'un froissement. */
  param: number;
}

/** Bornes (exportées pour les tests). */
export const AMBIENCE = {
  rainEvery: [12, 30],
  rainLevel: [0.35, 1],
  dropsPerSecond: [0.4, 1.6],
  clockOn: [30, 90],
  clockOff: [40, 120],
  clockFade: 6,
  rustleEvery: [45, 150],
} as const;

function inRange(rng: Rng, range: readonly [number, number]): number {
  return between(rng, range[0], range[1]);
}

export class AmbiencePlan {
  #rng: Rng;
  #rain: number;
  #nextRain: number;
  #nextDrop: number;
  #clockOn: boolean;
  #clockSince: number;
  #clockUntil: number;
  #nextTick: number;
  #tickParity = 0;
  #nextRustle: number;

  constructor(rng: Rng, start: number) {
    this.#rng = rng;
    this.#rain = between(rng, 0.5, 0.8);
    this.#nextRain = start;
    this.#nextDrop = start + rng();
    // La pendule commence souvent audible, mais pas toujours.
    this.#clockOn = rng() < 0.6;
    this.#clockSince = start;
    this.#clockUntil = start + inRange(rng, this.#clockOn ? AMBIENCE.clockOn : AMBIENCE.clockOff);
    this.#nextTick = Math.ceil(start);
    this.#nextRustle = start + between(rng, 15, AMBIENCE.rustleEvery[1]);
  }

  get rain(): number {
    return this.#rain;
  }

  /** Après une suspension : rien ne s'accumule, on repart de `now`. */
  resync(now: number): void {
    if (this.#nextRain < now) this.#nextRain = now;
    if (this.#nextDrop < now) this.#nextDrop = now + this.#rng() * 0.5;
    if (this.#nextTick < now) this.#nextTick = Math.ceil(now);
    if (this.#clockUntil < now) {
      this.#clockSince = now;
      this.#clockUntil = now + inRange(this.#rng, AMBIENCE.clockOff);
      this.#clockOn = false;
    }
    if (this.#nextRustle < now) this.#nextRustle = now + inRange(this.#rng, AMBIENCE.rustleEvery);
  }

  /** Événements de `[…, until)` dans l'ordre chronologique. */
  until(until: number): AmbienceEvent[] {
    const rng = this.#rng;
    const out: AmbienceEvent[] = [];

    while (this.#nextRain < until) {
      // Marche aléatoire bornée : la pluie s'intensifie ou se calme doucement.
      const [lo, hi] = AMBIENCE.rainLevel;
      this.#rain = Math.max(lo, Math.min(hi, this.#rain + between(rng, -0.25, 0.25)));
      out.push({ at: this.#nextRain, kind: 'rain', vel: this.#rain, param: 0 });
      this.#nextRain += inRange(rng, AMBIENCE.rainEvery);
    }

    while (this.#nextDrop < until) {
      out.push({
        at: this.#nextDrop,
        kind: 'drop',
        vel: between(rng, 0.25, 1) * this.#rain,
        param: between(rng, 2200, 5200),
      });
      const [lo, hi] = AMBIENCE.dropsPerSecond;
      const rate = lo + (hi - lo) * this.#rain;
      this.#nextDrop += -Math.log(1 - rng() * 0.999) / rate;
    }

    while (this.#nextTick < until) {
      const t = this.#nextTick;
      while (t >= this.#clockUntil) {
        this.#clockSince = this.#clockUntil;
        this.#clockOn = !this.#clockOn;
        this.#clockUntil += inRange(rng, this.#clockOn ? AMBIENCE.clockOn : AMBIENCE.clockOff);
      }
      if (this.#clockOn) {
        // Fondu d'entrée et de sortie : la pendule se fait entendre puis s'oublie.
        const f = AMBIENCE.clockFade;
        const fade = Math.min(1, (t - this.#clockSince) / f, (this.#clockUntil - t) / f);
        out.push({
          at: t,
          kind: this.#tickParity === 0 ? 'tick' : 'tock',
          vel: Math.max(0, fade) * between(rng, 0.85, 1),
          param: 0,
        });
      }
      this.#tickParity ^= 1;
      this.#nextTick += 1;
    }

    while (this.#nextRustle < until) {
      out.push({
        at: this.#nextRustle,
        kind: 'rustle',
        vel: between(rng, 0.5, 1),
        param: between(rng, 0.5, 1.2),
      });
      this.#nextRustle += inRange(rng, AMBIENCE.rustleEvery);
    }

    return out.sort((a, b) => a.at - b.at);
  }
}
