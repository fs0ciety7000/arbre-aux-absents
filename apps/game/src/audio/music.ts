/**
 * Lecteur de musique générative (docs/game/AUDIO.md §3) : une piste par humeur, fondu enchaîné
 * au changement d'écran, réverbération partagée. Les événements du compositeur sont écrits
 * juste à temps (fenêtre d'anticipation tenue par le moteur).
 */
import { Composer, type MusicEvent } from './composer';
import { bassNote, createReverb, fmNote, pad } from './synth';
import { MOODS, createRng, type Key, type Mood, type Rng } from './theory';

/** Constante de temps des fondus (s) : ~2,5 s pour s'éteindre (GAME_DESIGN §16 : 2 s). */
export const CROSSFADE = 0.8;

/** Niveaux de crête des voix : la musique reste un fond. */
const TRIM = { pad: 0.13, lead: 0.13, bell: 0.055, bass: 0.16 } as const;

interface Track {
  mood: Mood;
  composer: Composer;
  gain: GainNode;
  send: GainNode;
}

export class MusicPlayer {
  #ctx: BaseAudioContext;
  #out: AudioNode;
  #reverb: { input: GainNode; output: GainNode };
  #rng: Rng;
  #track: Track | null = null;
  #layers = 0;

  constructor(ctx: BaseAudioContext, out: AudioNode, seed = Date.now()) {
    this.#ctx = ctx;
    this.#out = out;
    this.#rng = createRng(seed);
    this.#reverb = createReverb(ctx);
    this.#reverb.output.connect(out);
  }

  get mood(): Mood | null {
    return this.#track?.mood ?? null;
  }

  /** Tonalité en cours (pour accorder les effets « accord » et « révélation »). */
  get key(): Key | null {
    return this.#track?.composer.key ?? null;
  }

  setMood(mood: Mood | null, now: number): void {
    if (mood === this.mood) return;
    const old = this.#track;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setTargetAtTime(0, now, CROSSFADE);
      setTimeout(() => {
        old.gain.disconnect();
        old.send.disconnect();
      }, CROSSFADE * 8000);
    }
    this.#track = null;
    if (!mood) return;
    const spec = MOODS[mood];
    const gain = this.#ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.setTargetAtTime(1, now, CROSSFADE);
    const send = this.#ctx.createGain();
    send.gain.value = spec.wet;
    gain.connect(this.#out);
    gain.connect(send).connect(this.#reverb.input);
    // L'humeur entrante attend que la sortante ait commencé à s'effacer.
    const start = now + (old ? 0.6 : 0.15);
    const composer = new Composer(spec, this.#rng, start, this.#layers);
    this.#track = { mood, composer, gain, send };
  }

  setLayers(n: number): void {
    this.#layers = n;
    this.#track?.composer.setLayers(n);
  }

  /**
   * Écrit la musique jusqu'à `horizon`. `silent` : le volume de la musique est nul, on avance
   * la partition sans créer de nœuds (aucun coût).
   */
  pump(now: number, horizon: number, silent: boolean): void {
    const track = this.#track;
    if (!track) return;
    track.composer.resync(now + 0.05);
    while (track.composer.cursor < horizon) {
      const events = track.composer.bar();
      if (silent) continue;
      for (const ev of events) if (ev.at >= now) this.#render(track, ev);
    }
  }

  #render(track: Track, ev: MusicEvent): void {
    const ctx = this.#ctx;
    const out = track.gain;
    switch (ev.voice) {
      case 'pad':
        pad(ctx, out, ev.at, ev.midi, ev.dur, ev.vel * TRIM.pad, ev.cutoff ?? 900);
        break;
      case 'lead':
        for (const m of ev.midi) {
          fmNote(
            ctx,
            out,
            ev.at,
            m,
            ev.dur,
            ev.vel * TRIM.lead,
            ev.pan,
            track.composer.spec.leadTimbre,
          );
        }
        break;
      case 'bell':
        for (const m of ev.midi)
          fmNote(ctx, out, ev.at, m, ev.dur, ev.vel * TRIM.bell, ev.pan, 'bell');
        break;
      case 'bass':
        for (const m of ev.midi) bassNote(ctx, out, ev.at, m, ev.dur, ev.vel * TRIM.bass);
        break;
    }
  }

  dispose(): void {
    this.#track?.gain.disconnect();
    this.#track?.send.disconnect();
    this.#track = null;
    this.#reverb.output.disconnect();
  }
}
