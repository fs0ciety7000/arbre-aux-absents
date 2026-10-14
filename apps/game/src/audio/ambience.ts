/**
 * Lecteur d'ambiance du bureau (docs/game/AUDIO.md §4) : lit de pluie continu (deux sources de
 * bruit rose bouclé) et événements planifiés par `AmbiencePlan` (gouttes, pendule, papier).
 * Le lit est arrêté quand l'ambiance est muette, pour ne rien coûter.
 */
import { AmbiencePlan, type AmbienceEvent } from './ambience-plan';
import { bakeHit, type HitShape } from './bake';
import { noiseHit, pinkNoise } from './synth';
import { createRng, type Rng } from './theory';

const FADE = 1.2;
const TRIM = { rain: 0.18, drop: 0.03, clock: 0.035, rustle: 0.035 } as const;

interface Bed {
  sources: AudioBufferSourceNode[];
  rain: GainNode;
}

export class AmbiencePlayer {
  #ctx: BaseAudioContext;
  #scene: GainNode;
  #rng: Rng;
  #plan: AmbiencePlan | null = null;
  #bed: Bed | null = null;
  #level = 0;
  #stopTimer: ReturnType<typeof setTimeout> | undefined;
  /** Gouttes (4 variantes) et tic, tac : cuits au premier besoin. */
  #hits: { drops: AudioBuffer[]; tick: AudioBuffer; tock: AudioBuffer } | null = null;

  constructor(ctx: BaseAudioContext, out: AudioNode, seed = Date.now() ^ 0x5bd1e995) {
    this.#ctx = ctx;
    this.#rng = createRng(seed);
    this.#scene = ctx.createGain();
    this.#scene.gain.value = 0;
    this.#scene.connect(out);
  }

  get level(): number {
    return this.#level;
  }

  /** Niveau de la scène (0 : coupé, le lit s'arrête après le fondu). */
  setLevel(level: number, now: number): void {
    if (level === this.#level) return;
    this.#level = level;
    clearTimeout(this.#stopTimer);
    this.#scene.gain.cancelScheduledValues(now);
    this.#scene.gain.setTargetAtTime(level, now, FADE);
    if (level > 0) {
      this.#plan ??= new AmbiencePlan(this.#rng, now);
      if (!this.#bed) this.#bed = this.#startBed(now);
    } else {
      this.#stopTimer = setTimeout(() => this.#stopBed(), FADE * 6000);
    }
  }

  pump(now: number, horizon: number): void {
    const plan = this.#plan;
    if (!plan || this.#level === 0) return;
    plan.resync(now);
    for (const ev of plan.until(horizon)) this.#render(ev);
  }

  #startBed(now: number): Bed {
    const ctx = this.#ctx;
    const buffer = pinkNoise(ctx);
    const rain = ctx.createGain();
    rain.gain.setValueAtTime(0, now);
    rain.gain.setTargetAtTime(TRIM.rain * (this.#plan?.rain ?? 0.6), now, 2);
    rain.connect(this.#scene);

    // Pluie fine sur la vitre : bande médium.
    const hiss = ctx.createBufferSource();
    hiss.buffer = buffer;
    hiss.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 500;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    hiss.connect(hp).connect(lp).connect(rain);

    // Ruissellement lointain : le même bruit ralenti (boucle de 8 s), très grave.
    const rumble = ctx.createBufferSource();
    rumble.buffer = buffer;
    rumble.loop = true;
    rumble.playbackRate.value = 0.5;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 320;
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.7;
    rumble.connect(low).connect(lowGain).connect(rain);

    hiss.start(now, 0);
    rumble.start(now, 2);
    return { sources: [hiss, rumble], rain };
  }

  #stopBed(): void {
    const bed = this.#bed;
    if (!bed || this.#level > 0) return;
    for (const s of bed.sources) {
      try {
        s.stop();
      } catch {
        /* déjà arrêtée */
      }
    }
    bed.rain.disconnect();
    this.#bed = null;
  }

  #render(ev: AmbienceEvent): void {
    const ctx = this.#ctx;
    const out = this.#scene;
    switch (ev.kind) {
      case 'rain':
        this.#bed?.rain.gain.setTargetAtTime(TRIM.rain * ev.vel, ev.at, 4);
        break;
      case 'drop': {
        // Variante au hasard, hauteur variée par la vitesse de lecture.
        const hits = this.#bakeHits();
        const buf = hits.drops[Math.floor(this.#rng() * hits.drops.length)] ?? hits.tick;
        this.#playHit(buf, ev.at, TRIM.drop * ev.vel, ev.param / 3600);
        break;
      }
      case 'tick':
      case 'tock':
        if (ev.vel <= 0) break;
        this.#playHit(this.#bakeHits()[ev.kind], ev.at, TRIM.clock * ev.vel, 1);
        break;
      case 'rustle': {
        const rng = this.#rng;
        const n = 4 + Math.floor(rng() * 4);
        for (let i = 0; i < n; i++) {
          const at = ev.at + (i / n) * ev.param + rng() * 0.05;
          const freq = 1400 + rng() * 3200;
          noiseHit(ctx, out, at, {
            dur: 0.08 + rng() * 0.16,
            freq,
            sweepTo: freq * (0.6 + rng() * 0.8),
            q: 1.1,
            level: TRIM.rustle * ev.vel * (0.5 + rng() * 0.5),
            attack: 0.01,
          });
        }
        break;
      }
    }
  }

  #bakeHits(): { drops: AudioBuffer[]; tick: AudioBuffer; tock: AudioBuffer } {
    if (this.#hits) return this.#hits;
    const ctx = this.#ctx;
    const make = (shape: HitShape) => {
      const data = bakeHit(ctx.sampleRate, shape, this.#rng);
      const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.getChannelData(0).set(data);
      return buf;
    };
    this.#hits = {
      drops: [3000, 3600, 4200, 4800].map((freq) => make({ dur: 0.03, freq, q: 9, attack: 0.001 })),
      tick: make({ dur: 0.05, freq: 2300, q: 7, attack: 0.0005 }),
      tock: make({ dur: 0.05, freq: 1850, q: 7, attack: 0.0005 }),
    };
    return this.#hits;
  }

  /** Une source et un gain : le moins cher possible. */
  #playHit(buffer: AudioBuffer, at: number, level: number, rate: number): void {
    const ctx = this.#ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(g).connect(this.#scene);
    src.start(at);
  }

  dispose(): void {
    this.#level = 0;
    clearTimeout(this.#stopTimer);
    this.#stopBed();
    this.#scene.disconnect();
  }
}
