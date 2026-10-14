/**
 * Instruments synthétisés (docs/game/AUDIO.md §5). Peu de voix, aucun échantillon, aucune
 * convolution : oscillateurs, filtres biquad et une réverbération à lignes à retard.
 * Fonctionne sur tout `BaseAudioContext` (temps réel ou hors ligne).
 */
import { midiToHz } from './theory';

/** Démarre une enveloppe à 0 et monte en `attack` s (rampe linéaire). */
function rise(param: AudioParam, at: number, peak: number, attack: number): void {
  param.setValueAtTime(0, at);
  param.linearRampToValueAtTime(peak, at + attack);
}

// ── Bruits ───────────────────────────────────────────────────────────

const noiseCache = new WeakMap<BaseAudioContext, { white?: AudioBuffer; pink?: AudioBuffer }>();

/**
 * Bruit **bouclable sans couture** : les `fade` dernières secondes sont fondues dans le début,
 * si bien que la dernière valeur précède naturellement la première (aucun clic de boucle).
 */
function loopable(ctx: BaseAudioContext, seconds: number, gen: () => number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const fade = Math.floor(rate * 0.25);
  const raw = new Float32Array(len + fade);
  for (let i = 0; i < raw.length; i++) raw[i] = gen();
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    if (i < fade) {
      const k = i / fade;
      data[i] = (raw[i] ?? 0) * Math.sqrt(k) + (raw[len + i] ?? 0) * Math.sqrt(1 - k);
    } else data[i] = raw[i] ?? 0;
  }
  return buf;
}

export function whiteNoise(ctx: BaseAudioContext): AudioBuffer {
  const c = noiseCache.get(ctx) ?? {};
  c.white ??= loopable(ctx, 1, () => Math.random() * 2 - 1);
  noiseCache.set(ctx, c);
  return c.white;
}

/** Bruit rose (méthode économique de P. Kellet), 4 s bouclables. */
export function pinkNoise(ctx: BaseAudioContext): AudioBuffer {
  const c = noiseCache.get(ctx) ?? {};
  if (!c.pink) {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    c.pink = loopable(ctx, 4, () => {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      return (b0 + b1 + b2 + w * 0.1848) * 0.18;
    });
  }
  noiseCache.set(ctx, c);
  return c.pink;
}

/** Souffle filtré passe-bande, enveloppe percussive (gouttes, tic-tac, papier). */
export function noiseHit(
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  opts: { dur: number; freq: number; q: number; level: number; attack?: number; sweepTo?: number },
): void {
  const src = ctx.createBufferSource();
  src.buffer = whiteNoise(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(opts.freq, at);
  if (opts.sweepTo) filter.frequency.exponentialRampToValueAtTime(opts.sweepTo, at + opts.dur);
  filter.Q.value = opts.q;
  const env = ctx.createGain();
  rise(env.gain, at, opts.level, opts.attack ?? 0.002);
  env.gain.setTargetAtTime(0, at + (opts.attack ?? 0.002), opts.dur / 4);
  src.connect(filter).connect(env).connect(out);
  // Départ aléatoire dans la seconde de bruit : deux coups ne sont jamais identiques.
  src.start(at, Math.random() * 0.7);
  src.stop(at + opts.dur + 0.05);
}

// ── Instruments de musique ───────────────────────────────────────────

/** Nappe chaude : deux oscillateurs désaccordés par note, un filtre passe-bas qui s'ouvre. */
export function pad(
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  midis: number[],
  dur: number,
  level: number,
  cutoff: number,
): void {
  const attack = Math.min(2.5, dur * 0.35);
  const release = 3;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(cutoff * 0.6, at);
  filter.frequency.linearRampToValueAtTime(cutoff, at + attack);
  filter.frequency.setTargetAtTime(cutoff * 0.75, at + dur, release / 3);
  const env = ctx.createGain();
  rise(env.gain, at, level / Math.max(1, midis.length), attack);
  env.gain.setTargetAtTime(0, at + dur, release / 4);
  filter.connect(env).connect(out);
  // Une dent de scie par note ; la fondamentale reçoit un triangle désaccordé (chorus) : la
  // chaleur d'une nappe à deux oscillateurs pour presque le coût d'un seul.
  midis.forEach((m, i) => {
    const hz = midiToHz(m);
    const voices: Array<[OscillatorType, number]> =
      i === 0
        ? [
            ['sawtooth', -7],
            ['triangle', 6],
          ]
        : [['sawtooth', i % 2 === 0 ? -5 : 5]];
    for (const [type, detune] of voices) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = hz;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + dur + release);
    }
  });
}

/**
 * Voix mélodique en synthèse FM à deux opérateurs : `piano` (rapport 1, brillance qui
 * s'éteint vite) ou `celesta` (rapport 4, attaque de cloche plus claire).
 */
export function fmNote(
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  midi: number,
  dur: number,
  level: number,
  pan: number,
  timbre: 'piano' | 'celesta' | 'bell',
): void {
  const hz = midiToHz(midi);
  const ratio = timbre === 'piano' ? 1 : timbre === 'celesta' ? 4 : 3.5;
  const index = timbre === 'piano' ? 1.4 : timbre === 'celesta' ? 1.1 : 1.6;
  const modDecay = timbre === 'piano' ? 0.25 : 0.08;
  const carrier = ctx.createOscillator();
  carrier.frequency.value = hz;
  const mod = ctx.createOscillator();
  mod.frequency.value = hz * ratio;
  const modGain = ctx.createGain();
  modGain.gain.setValueAtTime(hz * index, at);
  modGain.gain.setTargetAtTime(hz * index * 0.15, at, modDecay);
  mod.connect(modGain).connect(carrier.frequency);
  const env = ctx.createGain();
  rise(env.gain, at, level, timbre === 'piano' ? 0.006 : 0.003);
  env.gain.setTargetAtTime(0, at + 0.01, dur / 4);
  let tail: AudioNode = env;
  if (pan !== 0 && 'createStereoPanner' in ctx) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    env.connect(p);
    tail = p;
  }
  carrier.connect(env);
  tail.connect(out);
  const end = at + dur + 0.2;
  carrier.start(at);
  mod.start(at);
  carrier.stop(end);
  mod.stop(end);
}

/** Basse ronde : sinus et triangle à l'octave (audible sur les petits haut-parleurs). */
export function bassNote(
  ctx: BaseAudioContext,
  out: AudioNode,
  at: number,
  midi: number,
  dur: number,
  level: number,
): void {
  const hz = midiToHz(midi);
  const env = ctx.createGain();
  rise(env.gain, at, level, 0.025);
  env.gain.setTargetAtTime(0, at + 0.03, dur / 3);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  filter.connect(env).connect(out);
  const sine = ctx.createOscillator();
  sine.frequency.value = hz;
  const tri = ctx.createOscillator();
  tri.type = 'triangle';
  tri.frequency.value = hz * 2;
  const triGain = ctx.createGain();
  triGain.gain.value = 0.35;
  sine.connect(filter);
  tri.connect(triGain).connect(filter);
  const end = at + dur + 0.5;
  for (const o of [sine, tri]) {
    o.start(at);
    o.stop(end);
  }
}

/**
 * Réverbération économique : quatre filtres en peigne (retard + rétroaction filtrée) répartis
 * à gauche et à droite. Quelques nœuds fixes, aucun calcul de convolution.
 */
export function createReverb(ctx: BaseAudioContext): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  output.gain.value = 0.3;
  const pre = ctx.createBiquadFilter();
  pre.type = 'highpass';
  pre.frequency.value = 180;
  input.connect(pre);
  const times = [0.1031, 0.1373, 0.1693, 0.2111];
  // Peignes pairs à gauche, impairs à droite (fusion de canaux, moins cher qu'un panoramique).
  const merger = ctx.createChannelMerger(2);
  merger.connect(output);
  times.forEach((time, i) => {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = time;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 2600;
    const fb = ctx.createGain();
    fb.gain.value = 0.62;
    pre.connect(delay);
    delay.connect(damp).connect(fb).connect(delay);
    damp.connect(merger, 0, i % 2);
  });
  return { input, output };
}
