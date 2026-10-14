/// <reference lib="dom" />
/**
 * Rendu hors ligne de la musique du jeu pour la bande-annonce (exécuté dans Chromium, empaqueté
 * par esbuild depuis `audio.ts`). Mêmes modules que le jeu (`apps/game/src/audio/`) : lecteur
 * de musique générative, ambiance du bureau ; effets « tampon » et « accord » reproduits à
 * l'identique de `engine.ts` (méthodes privées du moteur). Volumes par défaut du jeu.
 *
 * Sortie : 4 canaux = musique + ambiance (L, R), effets (L, R).
 */
import { AmbiencePlayer } from '../../apps/game/src/audio/ambience';
import { MusicPlayer } from '../../apps/game/src/audio/music';
import { noiseHit } from '../../apps/game/src/audio/synth';
import { MOODS, relativeMajorPc, type Mood } from '../../apps/game/src/audio/theory';

export interface RenderJob {
  duration: number;
  sampleRate: number;
  seed: number;
  moods: { at: number; mood: Mood; layers: number }[];
  sfx: { at: number; name: 'stamp' | 'chord' | 'page' | 'paper' | 'type' }[];
}

const BASE = 0.18;
const VOLUME = { music: 0.8, ambience: 0.6, sfx: 0.8 };
const STEP = 0.2;
const LOOKAHEAD = 0.8;

function tone(
  ctx: BaseAudioContext,
  bus: AudioNode,
  t: number,
  freq: number,
  dur: number,
  level: number,
  type: OscillatorType,
  endFreq?: number,
): void {
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

async function render(job: RenderJob): Promise<string[]> {
  const len = Math.ceil(job.duration * job.sampleRate);
  const ctx = new OfflineAudioContext({
    numberOfChannels: 4,
    length: len,
    sampleRate: job.sampleRate,
  });
  ctx.destination.channelCount = 4;
  ctx.destination.channelCountMode = 'explicit';
  ctx.destination.channelInterpretation = 'discrete';
  const merger = ctx.createChannelMerger(4);
  merger.connect(ctx.destination);
  const stereo = (first: number) => {
    const g = ctx.createGain();
    const split = ctx.createChannelSplitter(2);
    g.channelCount = 2;
    g.channelCountMode = 'explicit';
    g.connect(split);
    split.connect(merger, 0, first);
    split.connect(merger, 1, first + 1);
    return g;
  };
  const musicBus = stereo(0);
  const sfxBus = stereo(2);
  const music = ctx.createGain();
  music.gain.value = VOLUME.music;
  music.connect(musicBus);
  const amb = ctx.createGain();
  amb.gain.value = VOLUME.ambience;
  amb.connect(musicBus);
  const sfx = ctx.createGain();
  sfx.gain.value = VOLUME.sfx;
  sfx.connect(sfxBus);

  const player = new MusicPlayer(ctx, music, job.seed);
  const ambience = new AmbiencePlayer(ctx, amb, job.seed ^ 0x5bd1e995);
  const moods = [...job.moods].sort((a, b) => a.at - b.at);
  const effects = [...job.sfx].sort((a, b) => a.at - b.at);

  const play = (name: RenderJob['sfx'][number]['name'], t: number) => {
    const key = player.key;
    let shift = 0;
    if (key) {
      const pc = relativeMajorPc(key);
      shift = pc > 6 ? pc - 12 : pc;
    }
    const k = 2 ** (shift / 12);
    switch (name) {
      case 'stamp':
        tone(ctx, sfx, t, 150, 0.18, 1, 'sine', 60);
        tone(ctx, sfx, t, 420, 0.05, 0.3, 'triangle', 200);
        noiseHit(ctx, sfx, t, { dur: 0.07, freq: 1100, q: 0.8, level: BASE * 0.8, attack: 0.001 });
        break;
      case 'chord':
        for (const f of [392, 494, 587]) tone(ctx, sfx, t + 0.05, f * k, 0.7, 0.25, 'sine');
        break;
      case 'page':
        noiseHit(ctx, sfx, t, {
          dur: 0.22,
          freq: 900,
          sweepTo: 3400,
          q: 1,
          level: BASE * 0.4,
          attack: 0.06,
        });
        noiseHit(ctx, sfx, t + 0.2, { dur: 0.05, freq: 2400, q: 1.5, level: BASE * 0.35 });
        break;
      case 'paper':
        noiseHit(ctx, sfx, t, {
          dur: 0.16,
          freq: 3200,
          sweepTo: 1600,
          q: 0.9,
          level: BASE * 0.5,
          attack: 0.01,
        });
        break;
      case 'type':
        for (let i = 0; i < 3; i++)
          noiseHit(ctx, sfx, t + i * 0.07, { dur: 0.025, freq: 4200, q: 0.8, level: BASE * 0.6 });
        break;
    }
  };

  // Ordonnanceur du jeu, rejoué hors ligne : suspension toutes les 200 ms, fenêtre de 0,8 s.
  let mi = 0;
  let ei = 0;
  const tick = (now: number) => {
    while (mi < moods.length && moods[mi]!.at <= now + 1e-6) {
      const m = moods[mi++]!;
      player.setLayers(m.layers);
      player.setMood(m.mood, Math.max(now, m.at));
      ambience.setLevel(MOODS[m.mood].ambience, Math.max(now, m.at));
    }
    const horizon = now + LOOKAHEAD;
    player.pump(now, horizon, false);
    ambience.pump(now, horizon);
    while (ei < effects.length && effects[ei]!.at < now + STEP) {
      const e = effects[ei++]!;
      play(e.name, Math.max(now + 0.005, e.at));
    }
  };
  for (let t = STEP; t < job.duration - STEP; t += STEP) {
    const at = Math.round(t / STEP) * STEP;
    void ctx.suspend(at).then(() => {
      tick(at);
      void ctx.resume();
    });
  }
  tick(0);
  const buf = await ctx.startRendering();
  const out: string[] = [];
  for (let c = 0; c < 4; c++) {
    const data = buf.getChannelData(c);
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    out.push(btoa(bin));
  }
  return out;
}

(globalThis as unknown as { renderTrailerAudio: typeof render }).renderTrailerAudio = render;
