import type { Volume } from '@arbre/contract';
import { AmbiencePlayer } from './ambience';
import { MusicPlayer } from './music';
import { noiseHit } from './synth';
import { MOODS, relativeMajorPc, type Mood } from './theory';

/**
 * Audio du jeu (ARCHITECTURE §4, GAME_DESIGN §16, docs/game/AUDIO.md) : Web Audio, bus master →
 * musique, ambiances, effets, interface. **Tout est synthétisé à l'exécution** : aucun fichier
 * son, aucun réseau. Musique générative par humeur (`setMood`), ambiance du bureau sous la
 * musique, effets courts et discrets. Aucun son ne porte une information exclusive : chaque son
 * double un retour visuel.
 *
 * Le contexte n'est créé qu'au premier geste du joueur (politique d'autolecture) ; il est
 * suspendu quand la fenêtre est cachée (option) ou quand le volume général est nul.
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

/** Cadence de l'ordonnanceur (ms) et anticipation (s), plus longue fenêtre cachée. */
const TICK_MS = 200;
const LOOKAHEAD = 0.8;
const LOOKAHEAD_HIDDEN = 2.5;

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

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
  #music: MusicPlayer | null = null;
  #ambience: AmbiencePlayer | null = null;
  #mood: Mood | null = null;
  #layers = 0;
  #timer: ReturnType<typeof setInterval> | undefined;

  /** Écoute le premier geste (création du contexte) et la mise en arrière-plan. */
  install(): void {
    if (this.#installed || typeof window === 'undefined') return;
    this.#installed = true;
    const unlock = () => {
      this.#ensure();
      if (this.#ctx?.state !== 'running' && !this.#shouldSuspend()) void this.#ctx?.resume();
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
    this.#applyScene();
  }

  play(name: SoundName): void {
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== 'running') return;
    const bus = this.#buses[BUS_OF[name]];
    if (!bus) return;
    const t = ctx.currentTime + 0.005;
    const k = 2 ** (this.#harmony() / 12);
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
        // Feuille posée : frottement bref qui descend.
        noiseHit(ctx, bus, t, {
          dur: 0.16,
          freq: 3200,
          sweepTo: 1600,
          q: 0.9,
          level: BASE * 0.5,
          attack: 0.01,
        });
        break;
      case 'page':
        // Page tournée : souffle qui monte puis claque doucement.
        noiseHit(ctx, bus, t, {
          dur: 0.22,
          freq: 900,
          sweepTo: 3400,
          q: 1,
          level: BASE * 0.4,
          attack: 0.06,
        });
        noiseHit(ctx, bus, t + 0.2, { dur: 0.05, freq: 2400, q: 1.5, level: BASE * 0.35 });
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
        // Tampon : corps de bois grave, claque du caoutchouc sur le papier.
        this.#tone(bus, t, 150, 0.18, 1, 'sine', 60);
        this.#tone(bus, t, 420, 0.05, 0.3, 'triangle', 200);
        noiseHit(ctx, bus, t, { dur: 0.07, freq: 1100, q: 0.8, level: BASE * 0.8, attack: 0.001 });
        break;
      case 'chord':
        for (const f of [392, 494, 587]) this.#tone(bus, t + 0.05, f * k, 0.7, 0.25, 'sine');
        break;
      case 'reveal':
        [523, 659, 784].forEach((f, i) => this.#tone(bus, t + i * 0.09, f * k, 0.9, 0.22, 'sine'));
        break;
    }
  }

  /**
   * Humeur musicale de la scène (`moodFor`) ; `null` : silence. Fondu enchaîné de ~2 s.
   * Appelable avant le premier geste : l'humeur démarre au déverrouillage du contexte.
   */
  setMood(mood: Mood | null): void {
    this.#mood = mood;
    this.#applyScene();
  }

  /** Couches adaptatives (0–4, `layersFor`) : la musique s'étoffe avec l'arbre. */
  setLayers(n: number): void {
    this.#layers = n;
    this.#music?.setLayers(n);
  }

  #applyScene(): void {
    const ctx = this.#ctx;
    if (!ctx || !this.#music || !this.#ambience) return;
    const now = ctx.currentTime;
    this.#music.setMood(this.#mood, now);
    const ambience = this.#mood && this.#volume.ambience > 0 ? MOODS[this.#mood].ambience : 0;
    this.#ambience.setLevel(ambience, now);
    this.#syncTimer();
  }

  /** L'ordonnanceur ne tourne que s'il y a quelque chose à jouer et un contexte actif. */
  #syncTimer(): void {
    const ctx = this.#ctx;
    const needed = !!ctx && ctx.state === 'running' && this.#mood !== null;
    if (needed && this.#timer === undefined) {
      this.#timer = setInterval(() => this.#pump(), TICK_MS);
      this.#pump();
    } else if (!needed && this.#timer !== undefined) {
      clearInterval(this.#timer);
      this.#timer = undefined;
    }
  }

  #pump(): void {
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const horizon = now + (this.#hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD);
    this.#music?.pump(now, horizon, this.#volume.music <= 0);
    this.#ambience?.pump(now, horizon);
  }

  /** Décalage (demi-tons, −5 à +6) des accords d'effet vers la tonalité de la musique. */
  #harmony(): number {
    const key = this.#music?.key;
    if (!key) return 0;
    const pc = relativeMajorPc(key);
    return pc > 6 ? pc - 12 : pc;
  }

  #ensure(): void {
    const Ctor = audioContextCtor();
    if (this.#ctx || !Ctor) return;
    try {
      const ctx = new Ctor({ latencyHint: 'interactive' });
      const master = ctx.createGain();
      master.connect(ctx.destination);
      for (const bus of ['music', 'ambience', 'sfx', 'ui'] as const) {
        const g = ctx.createGain();
        g.connect(master);
        this.#buses[bus] = g;
      }
      this.#ctx = ctx;
      this.#master = master;
      this.#music = new MusicPlayer(ctx, this.#buses.music!);
      this.#music.setLayers(this.#layers);
      this.#ambience = new AmbiencePlayer(ctx, this.#buses.ambience!);
      ctx.addEventListener('statechange', () => this.#syncTimer());
      this.#applyGains();
      this.#applyMono();
      this.#applySuspend();
      this.#applyScene();
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

  /** Fenêtre cachée (option « couper en arrière-plan ») ou volume général nul : tout s'arrête. */
  #shouldSuspend(): boolean {
    return (this.#hidden && this.#muteInBackground) || this.#volume.master <= 0;
  }

  #applySuspend(): void {
    const ctx = this.#ctx;
    if (!ctx) return;
    if (this.#shouldSuspend()) {
      if (ctx.state === 'running') void ctx.suspend();
    } else if (ctx.state === 'suspended') void ctx.resume();
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
