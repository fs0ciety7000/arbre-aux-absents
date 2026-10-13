import type { Volume } from '@arbre/contract';

/**
 * Audio du jeu (ARCHITECTURE §4, GAME_DESIGN §16) : Web Audio, bus master → musique,
 * ambiances, effets, interface. Aucun fichier son n'est encore fourni : les effets sont
 * **synthétisés**, courts et discrets ; la musique et les ambiances sont absentes proprement
 * (`playMusic` ne fait rien tant qu'aucune piste n'est déclarée). Aucun son ne porte une
 * information exclusive : chaque son double un retour visuel.
 *
 * Le contexte n'est créé qu'au premier geste du joueur (politique d'autolecture).
 */
export type Bus = 'music' | 'ambience' | 'sfx' | 'ui';
export type SoundName =
  | 'tap'
  | 'open'
  | 'close'
  | 'paper'
  | 'page'
  | 'type'
  | 'nothing'
  | 'pin'
  | 'stamp'
  | 'chord'
  | 'reveal';

const BUS_OF: Record<SoundName, Bus> = {
  tap: 'ui',
  open: 'ui',
  close: 'ui',
  paper: 'sfx',
  page: 'sfx',
  type: 'sfx',
  nothing: 'sfx',
  pin: 'sfx',
  stamp: 'sfx',
  chord: 'sfx',
  reveal: 'sfx',
};

/** Niveau de base des sons synthétisés (discrets). */
const BASE = 0.18;

class AudioEngine {
  #ctx: AudioContext | null = null;
  #master: GainNode | null = null;
  #buses: Partial<Record<Bus, GainNode>> = {};
  #volume: Volume = { master: 1, music: 0.8, ambience: 0.6, sfx: 0.8, ui: 0.6 };
  #mono = false;
  #muteInBackground = true;
  #hidden = false;
  #noise: AudioBuffer | null = null;
  #installed = false;

  /** Écoute le premier geste (création du contexte) et la mise en arrière-plan. */
  install(): void {
    if (this.#installed || typeof window === 'undefined') return;
    this.#installed = true;
    const unlock = () => {
      this.#ensure();
      void this.#ctx?.resume();
    };
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', () => {
      this.#hidden = document.hidden;
      this.#applySuspend();
    });
  }

  configure(volume: Volume, opts: { mono: boolean; muteInBackground: boolean }): void {
    this.#volume = { ...volume };
    this.#mono = opts.mono;
    this.#muteInBackground = opts.muteInBackground;
    this.#applyGains();
    this.#applyMono();
    this.#applySuspend();
  }

  play(name: SoundName): void {
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== 'running') return;
    const bus = this.#buses[BUS_OF[name]];
    if (!bus) return;
    const t = ctx.currentTime + 0.005;
    switch (name) {
      case 'tap':
        this.#tone(bus, t, 1400, 0.025, 0.35, 'sine');
        break;
      case 'open':
        this.#tone(bus, t, 660, 0.06, 0.4, 'sine', 880);
        break;
      case 'close':
        this.#tone(bus, t, 880, 0.06, 0.35, 'sine', 620);
        break;
      case 'paper':
        this.#noiseBurst(bus, t, 0.14, 2600, 0.5);
        break;
      case 'page':
        this.#noiseBurst(bus, t, 0.22, 1800, 0.45);
        break;
      case 'type':
        for (let i = 0; i < 3; i++) this.#noiseBurst(bus, t + i * 0.07, 0.025, 4200, 0.6);
        break;
      case 'nothing':
        this.#tone(bus, t, 330, 0.12, 0.35, 'triangle');
        this.#tone(bus, t + 0.12, 247, 0.18, 0.3, 'triangle');
        break;
      case 'pin':
        this.#tone(bus, t, 2200, 0.03, 0.4, 'square');
        break;
      case 'stamp':
        this.#tone(bus, t, 110, 0.16, 1, 'sine', 55);
        this.#noiseBurst(bus, t, 0.05, 900, 0.8);
        break;
      case 'chord':
        for (const f of [392, 494, 587]) this.#tone(bus, t + 0.05, f, 0.7, 0.25, 'sine');
        break;
      case 'reveal':
        [523, 659, 784].forEach((f, i) => this.#tone(bus, t + i * 0.09, f, 0.9, 0.22, 'sine'));
        break;
    }
  }

  /** Musique : aucune piste au MVP. Point d'extension pour `<audio>` Opus/AAC. */
  playMusic(_track: string | null): void {}

  #ensure(): void {
    if (this.#ctx || typeof AudioContext === 'undefined') return;
    try {
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      const master = ctx.createGain();
      master.connect(ctx.destination);
      for (const bus of ['music', 'ambience', 'sfx', 'ui'] as const) {
        const g = ctx.createGain();
        g.connect(master);
        this.#buses[bus] = g;
      }
      this.#ctx = ctx;
      this.#master = master;
      this.#applyGains();
      this.#applyMono();
      this.#applySuspend();
    } catch {
      this.#ctx = null;
    }
  }

  #applyGains(): void {
    if (!this.#ctx || !this.#master) return;
    const now = this.#ctx.currentTime;
    this.#master.gain.setTargetAtTime(this.#volume.master, now, 0.02);
    for (const bus of ['music', 'ambience', 'sfx', 'ui'] as const) {
      this.#buses[bus]?.gain.setTargetAtTime(this.#volume[bus], now, 0.02);
    }
  }

  #applyMono(): void {
    const dest = this.#ctx?.destination;
    if (!dest) return;
    try {
      dest.channelCount = this.#mono ? 1 : Math.min(2, dest.maxChannelCount);
      dest.channelCountMode = 'explicit';
      dest.channelInterpretation = 'speakers';
    } catch {
      /* certaines plateformes figent le nombre de canaux */
    }
  }

  #applySuspend(): void {
    const ctx = this.#ctx;
    if (!ctx) return;
    if (this.#hidden && this.#muteInBackground) void ctx.suspend();
    else if (ctx.state === 'suspended') void ctx.resume();
  }

  #tone(
    bus: GainNode,
    t: number,
    freq: number,
    dur: number,
    level: number,
    type: OscillatorType,
    endFreq?: number,
  ): void {
    const ctx = this.#ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(BASE * level, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  #noiseBurst(bus: GainNode, t: number, dur: number, cutoff: number, level: number): void {
    const ctx = this.#ctx!;
    if (!this.#noise) {
      const len = Math.floor(ctx.sampleRate * 0.5);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.#noise = buf;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.#noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.8;
    const env = ctx.createGain();
    env.gain.setValueAtTime(BASE * level, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(env).connect(bus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}

export const audio = new AudioEngine();
