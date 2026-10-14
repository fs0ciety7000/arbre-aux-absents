/**
 * Compositeur génératif (docs/game/AUDIO.md §3). Module **pur** : il écrit la musique mesure par
 * mesure sous forme d'événements datés (temps du contexte audio, en secondes), que le lecteur
 * (`music.ts`) transforme en nœuds Web Audio. Déterministe pour une graine donnée (tests).
 *
 * Structure : phrases de 4 mesures ; accords enchaînés par une chaîne de Markov diatonique ;
 * mélodie en marche aléatoire attirée par les notes de l'accord, avec reprise variée d'un motif ;
 * phrases de **respiration** (nappe seule) et de **silence** pour ne jamais lasser ; changement
 * de tonalité toutes les 6 à 10 phrases, toujours amorti par une respiration.
 */
import {
  MAX_LAYERS,
  between,
  degreeToMidi,
  nextDegree,
  pick,
  triad,
  type Key,
  type MoodSpec,
  type Rng,
} from './theory';

export type Voice = 'pad' | 'lead' | 'bell' | 'bass';
export type PhraseKind = 'full' | 'breath' | 'silence';

export interface MusicEvent {
  /** Début (s, horloge du contexte audio). */
  at: number;
  voice: Voice;
  /** Hauteurs MIDI (plusieurs pour la nappe). */
  midi: number[];
  /** Durée tenue (s) ; la résonance s'ajoute à la synthèse. */
  dur: number;
  /** Intensité (0–1). */
  vel: number;
  /** Panoramique (−1 à 1). */
  pan: number;
  /** Coupure du filtre de la nappe (Hz), pour `pad`. */
  cutoff?: number;
}

const STEPS = [-2, -1, -1, -1, 0, 1, 1, 1, 2, -3, 3] as const;

export class Composer {
  readonly spec: MoodSpec;
  #rng: Rng;
  #layers = 0;
  /** Début de la prochaine mesure à écrire. */
  cursor: number;
  key: Key;
  #barInPhrase = 0;
  #phrase: PhraseKind = 'full';
  #phraseCount = 0;
  #phrasesInKey = 0;
  #sectionLength: number;
  #degree = 0;
  #melody: number;
  #arp = 0;
  /** Premier motif d'une phrase pleine (case, écart au degré de l'accord) : repris varié. */
  #motif: Array<[number, number]> = [];
  #recording: Array<[number, number]> | null = null;

  constructor(spec: MoodSpec, rng: Rng, start: number, layers = 0) {
    this.spec = spec;
    this.#rng = rng;
    this.cursor = start;
    this.key = pick(rng, spec.keys);
    this.#sectionLength = 6 + Math.floor(rng() * 5);
    this.#melody = spec.leadOctave + Math.floor(spec.leadRange / 2);
    this.setLayers(layers);
  }

  get layers(): number {
    return this.#layers;
  }

  get phrase(): PhraseKind {
    return this.#phrase;
  }

  get barDuration(): number {
    return (60 / this.spec.bpm) * this.spec.beatsPerBar;
  }

  setLayers(n: number): void {
    this.#layers = Math.max(0, Math.min(MAX_LAYERS, Math.round(n)));
  }

  /** Après une suspension (onglet caché, contexte gelé) : on reprend « maintenant ». */
  resync(now: number): void {
    if (this.cursor < now) this.cursor = now;
  }

  /** Écrit la mesure suivante et avance le curseur. */
  bar(): MusicEvent[] {
    const spec = this.spec;
    const rng = this.#rng;
    const t0 = this.cursor;
    const beat = 60 / spec.bpm;
    const events: MusicEvent[] = [];

    if (this.#barInPhrase === 0) this.#startPhrase();
    const lastBar = this.#barInPhrase === spec.phraseBars - 1;
    const chordChange = this.#barInPhrase % spec.chordBars === 0;
    if (chordChange && !(this.#barInPhrase === 0 && this.#phrasesInKey === 0)) {
      this.#degree = nextDegree(rng, this.key.mode, this.#degree);
      this.#arp = 0;
    }

    if (this.#phrase !== 'silence') {
      if (chordChange) {
        const seventh = this.#layers >= 3;
        events.push({
          at: t0,
          voice: 'pad',
          midi: triad(this.#degree, seventh).map((d) => degreeToMidi(this.key, d + 7)),
          dur: spec.chordBars * this.barDuration,
          vel: spec.padLevel * (this.#phrase === 'breath' ? 0.7 : 1),
          pan: 0,
          cutoff: spec.padCutoff + this.#layers * spec.padCutoffPerLayer,
        });
      }
      if (this.#phrase === 'full') {
        this.#bass(events, t0, beat);
        this.#lead(events, t0, beat, lastBar);
        this.#bell(events, t0, beat);
      }
    }

    this.#barInPhrase = (this.#barInPhrase + 1) % spec.phraseBars;
    this.cursor = t0 + this.barDuration;
    events.sort((a, b) => a.at - b.at);
    return events;
  }

  #startPhrase(): void {
    const spec = this.spec;
    const rng = this.#rng;
    const prev = this.#phrase;
    this.#phraseCount++;
    this.#phrasesInKey++;
    if (this.#phraseCount === 1) {
      this.#phrase = 'full';
      this.#phrasesInKey = 0;
      return;
    }
    if (this.#phrasesInKey > this.#sectionLength && spec.keys.length > 1) {
      // Changement de tonalité amorti par une respiration sur la nouvelle tonique.
      const others = spec.keys.filter((k) => k !== this.key);
      this.key = pick(rng, others);
      this.#degree = 0;
      this.#phrasesInKey = 0;
      this.#sectionLength = 6 + Math.floor(rng() * 5);
      this.#phrase = 'breath';
      this.#motif = [];
      return;
    }
    if (prev !== 'full') {
      this.#phrase = 'full';
    } else {
      const r = rng();
      this.#phrase =
        r < spec.silenceChance
          ? 'silence'
          : r < spec.silenceChance + spec.breathChance
            ? 'breath'
            : 'full';
    }
    // Tête de phrase : retour fréquent à la tonique, pour l'assise.
    if (this.#phrase === 'full' && rng() < 0.4) this.#degree = 0;
  }

  #bass(events: MusicEvent[], t0: number, beat: number): void {
    const spec = this.spec;
    const rng = this.#rng;
    const root = this.#bassNote(this.#degree);
    for (const b of spec.bassBeats) {
      events.push({
        at: t0 + b * beat,
        voice: 'bass',
        midi: [root],
        dur: beat * (b === 0 ? 2 : 1.4),
        vel: spec.bassLevel * (b === 0 ? 1 : 0.7),
        pan: 0,
      });
    }
    for (const b of spec.bassOptional) {
      if (rng() >= spec.bassOptionalChance) continue;
      const fifth = this.#layers >= 3 && rng() < 0.5;
      events.push({
        at: t0 + b * beat,
        voice: 'bass',
        midi: [fifth ? this.#bassNote(this.#degree + 4) : root],
        dur: beat * 1.4,
        vel: spec.bassLevel * 0.6,
        pan: 0,
      });
    }
  }

  /** Basse dans l'octave de la tonique (jamais plus d'une quinte au-dessus). */
  #bassNote(degree: number): number {
    const m = degreeToMidi(this.key, degree % 7);
    return m - this.key.tonic > 7 ? m - 12 : m;
  }

  #lead(events: MusicEvent[], t0: number, beat: number, lastBar: boolean): void {
    const spec = this.spec;
    const rng = this.#rng;
    const slots = spec.beatsPerBar * spec.subdivision;
    const slotDur = beat / spec.subdivision;
    const density =
      (spec.leadDensity + this.#layers * spec.leadDensityPerLayer) * (lastBar ? 0.5 : 1);
    const lo = spec.leadOctave;
    const hi = spec.leadOctave + spec.leadRange;
    const chordSteps = new Set(triad(this.#degree).map((d) => d % 7));

    // Reprise variée du motif de la phrase précédente (première mesure seulement).
    const replay =
      this.#barInPhrase === 0 && this.#motif.length > 0 && !spec.arpeggio && rng() < 0.35;
    if (this.#barInPhrase === 0) this.#recording = replay ? null : [];

    if (replay) {
      for (const [slot, offset] of this.#motif) {
        if (rng() < 0.2) continue; // une note tombe : la reprise n'est jamais identique
        const idx = clamp(lo + this.#degree + offset + (rng() < 0.15 ? 1 : 0), lo, hi);
        this.#melody = idx;
        events.push(this.#leadEvent(t0 + slot * slotDur, idx, beat, slot % spec.subdivision === 0));
      }
      return;
    }

    for (let slot = 0; slot < slots; slot++) {
      const onBeat = slot % spec.subdivision === 0;
      const strong = onBeat && (slot / spec.subdivision) % 2 === 0;
      // Cadence : la dernière mesure s'ouvre sur une note de l'accord, longue.
      const cadence = lastBar && slot === 0 && rng() < 0.7;
      const p = cadence ? 1 : density * (strong ? 1.3 : onBeat ? 1 : 0.6);
      if (rng() >= p) continue;
      let idx: number;
      if (spec.arpeggio) {
        // Arpège montant sur l'accord, à partir de l'octave de la tonique la plus proche.
        const base = Math.ceil(lo / 7) * 7 + this.#degree;
        const shape = [0, 2, 4, 7, 9, 11];
        idx = base + (shape[this.#arp % shape.length] ?? 0);
        this.#arp++;
        if (idx > hi) {
          this.#arp = 1;
          idx = base;
        }
      } else {
        idx = this.#melody + pick(rng, STEPS);
        if (idx < lo) idx = lo + (lo - idx);
        if (idx > hi) idx = hi - (idx - hi);
        if (strong || cadence) idx = nearestChordTone(idx, chordSteps, lo, hi);
      }
      idx = clamp(idx, lo, hi + 2);
      this.#melody = idx;
      const ev = this.#leadEvent(t0 + slot * slotDur, idx, beat, strong);
      if (cadence) ev.dur *= 1.6;
      events.push(ev);
      this.#recording?.push([slot, idx - lo - this.#degree]);
    }
    if (this.#barInPhrase === 0 && this.#recording && this.#recording.length >= 2) {
      this.#motif = this.#recording;
    }
  }

  #leadEvent(at: number, idx: number, beat: number, strong: boolean): MusicEvent {
    const spec = this.spec;
    const rng = this.#rng;
    const ring = spec.leadTimbre === 'celesta' ? between(rng, 2, 4) : between(rng, 1.5, 3);
    return {
      at: at + rng() * 0.025,
      voice: 'lead',
      midi: [degreeToMidi(this.key, idx)],
      dur: beat * ring,
      vel: spec.leadLevel * between(rng, 0.55, 0.9) * (strong ? 1 : 0.8),
      pan: between(rng, -0.35, 0.35),
    };
  }

  #bell(events: MusicEvent[], t0: number, beat: number): void {
    const spec = this.spec;
    const rng = this.#rng;
    if (spec.bellLevel <= 0 || this.#layers < spec.bellFromLayer) return;
    const chance = 0.2 + 0.1 * (this.#layers - spec.bellFromLayer);
    if (rng() >= chance) return;
    const slot = 1 + Math.floor(rng() * (spec.beatsPerBar * 2 - 1));
    const degree = this.#degree + pick(rng, [0, 2, 4]);
    events.push({
      at: t0 + (slot * beat) / 2 + rng() * 0.02,
      voice: 'bell',
      midi: [bellRegister(degreeToMidi(this.key, spec.leadOctave + 7 + degree))],
      dur: beat * 3,
      vel: spec.bellLevel * between(rng, 0.4, 0.7),
      pan: between(rng, -0.6, 0.6),
    });
  }
}

/** La cloche reste sous le fa♯ 6 : au-delà, le timbre devient strident sur téléphone. */
function bellRegister(midi: number): number {
  let m = midi;
  while (m > 90) m -= 12;
  return m;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Degré le plus proche (dans l'ambitus) qui appartient à l'accord. */
function nearestChordTone(idx: number, steps: Set<number>, lo: number, hi: number): number {
  for (let d = 0; d <= 3; d++) {
    for (const cand of [idx - d, idx + d]) {
      if (cand >= lo && cand <= hi && steps.has(((cand % 7) + 7) % 7)) return cand;
    }
  }
  return idx;
}
