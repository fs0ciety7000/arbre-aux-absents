/**
 * Théorie et humeurs de la musique générative (docs/game/AUDIO.md). Module **pur** : aucune
 * dépendance à Web Audio, testé par Vitest.
 */

/** Générateur pseudo-aléatoire déterministe (mulberry32) : `() => [0, 1)`. */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick: liste vide');
  return item;
}

export function between(rng: Rng, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

// ── Modes ────────────────────────────────────────────────────────────

export type ModeName = 'ionian' | 'dorian' | 'aeolian' | 'lydian';

export const MODES: Record<ModeName, readonly number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

/** Demi-tons du tonique vers la tonique de la gamme majeure relative. */
const MAJOR_OFFSET: Record<ModeName, number> = { ionian: 0, dorian: -2, aeolian: 3, lydian: -5 };

export interface Key {
  /** Tonique (MIDI, octave grave : la basse joue ici). */
  tonic: number;
  mode: ModeName;
}

/** Hauteur MIDI du degré `index` (entier quelconque, octaves comprises) de la tonalité. */
export function degreeToMidi(key: Key, index: number): number {
  const scale = MODES[key.mode];
  const octave = Math.floor(index / 7);
  const step = ((index % 7) + 7) % 7;
  return key.tonic + 12 * octave + (scale[step] ?? 0);
}

/** Classes de hauteur (0–11) de la tonalité. */
export function pitchClasses(key: Key): Set<number> {
  return new Set(MODES[key.mode].map((s) => (((key.tonic + s) % 12) + 12) % 12));
}

/** Classe de hauteur de la majeure relative (sert à accorder les effets « accord »). */
export function relativeMajorPc(key: Key): number {
  return (((key.tonic + MAJOR_OFFSET[key.mode]) % 12) + 12) % 12;
}

/** Accord de trois sons (indices de degrés) bâti par tierces sur `degree`. */
export function triad(degree: number, seventh = false): number[] {
  return seventh ? [degree, degree + 2, degree + 4, degree + 6] : [degree, degree + 2, degree + 4];
}

/** Vrai si la triade sur ce degré est diminuée (quinte de 6 demi-tons) : on l'évite. */
export function isDiminished(mode: ModeName, degree: number): boolean {
  const k: Key = { tonic: 0, mode };
  return degreeToMidi(k, degree + 4) - degreeToMidi(k, degree) === 6;
}

/** Enchaînements diatoniques permis (chaîne de Markov sur les degrés, 0 = tonique). */
const NEXT_DEGREES: Record<number, readonly number[]> = {
  0: [5, 3, 2, 6, 4, 3],
  1: [4, 3, 0],
  2: [5, 3, 0],
  3: [0, 4, 6, 5, 1],
  4: [0, 5, 3],
  5: [3, 1, 6, 2, 0],
  6: [0, 2, 5],
};

export function nextDegree(rng: Rng, mode: ModeName, current: number): number {
  const candidates = (NEXT_DEGREES[current] ?? [0]).filter(
    (d) => d !== current && !isDiminished(mode, d),
  );
  return candidates.length > 0 ? pick(rng, candidates) : 0;
}

// ── Humeurs ──────────────────────────────────────────────────────────

/** Les trois humeurs musicales (docs/game/AUDIO.md §2). */
export type Mood = 'title' | 'desk' | 'reveal';

export type LeadTimbre = 'celesta' | 'piano';

export interface MoodSpec {
  bpm: number;
  beatsPerBar: number;
  /** Subdivisions par temps pour la voix mélodique (1 = noires, 2 = croches). */
  subdivision: number;
  /** Mesures par accord. */
  chordBars: number;
  /** Mesures par phrase. */
  phraseBars: number;
  /** Tonalités possibles (on change de tonalité après une respiration). */
  keys: readonly Key[];
  /** Note la plus grave de la mélodie, en degrés au-dessus de la tonique. */
  leadOctave: number;
  /** Ambitus de la mélodie (degrés au-dessus de `leadOctave`). */
  leadRange: number;
  leadTimbre: LeadTimbre;
  /** Probabilité d'une note par case de la grille, à 0 couche puis par couche ajoutée. */
  leadDensity: number;
  leadDensityPerLayer: number;
  /** La mélodie arpège l'accord (vers le haut) plutôt que de marcher. */
  arpeggio: boolean;
  /** Probabilité d'une phrase « respiration » (nappe seule). */
  breathChance: number;
  /** Probabilité d'une phrase de silence complet (ambiances seules). */
  silenceChance: number;
  /** Pouls de basse : temps joués, probabilité des temps facultatifs. */
  bassBeats: readonly number[];
  bassOptional: readonly number[];
  bassOptionalChance: number;
  /** Fréquence de coupure de la nappe (Hz) à 0 couche, gain par couche. */
  padCutoff: number;
  padCutoffPerLayer: number;
  /** Niveaux relatifs des voix (0–1). */
  padLevel: number;
  leadLevel: number;
  bassLevel: number;
  bellLevel: number;
  /** Couche à partir de laquelle la cloche (celesta aiguë) peut sonner. */
  bellFromLayer: number;
  /** Part de réverbération (0–1). */
  wet: number;
  /** Niveau des ambiances sous cette humeur (0–1). */
  ambience: number;
}

export const MOODS: Record<Mood, MoodSpec> = {
  // Titre : celesta lente et chaude sur une nappe, en ré dorien / la éolien / fa majeur.
  title: {
    bpm: 54,
    beatsPerBar: 4,
    subdivision: 2,
    chordBars: 2,
    phraseBars: 4,
    keys: [
      { tonic: 50, mode: 'dorian' },
      { tonic: 45, mode: 'aeolian' },
      { tonic: 41, mode: 'ionian' },
    ],
    leadOctave: 11,
    leadRange: 9,
    leadTimbre: 'celesta',
    leadDensity: 0.2,
    leadDensityPerLayer: 0,
    arpeggio: false,
    breathChance: 0.2,
    silenceChance: 0,
    bassBeats: [0],
    bassOptional: [],
    bassOptionalChance: 0,
    padCutoff: 1100,
    padCutoffPerLayer: 0,
    padLevel: 1,
    leadLevel: 0.9,
    bassLevel: 0.5,
    bellLevel: 0,
    bellFromLayer: 0,
    wet: 0.45,
    ambience: 0.55,
  },
  // Bureau : pouls grave et calme, piano feutré rare ; couche adaptative par génération.
  desk: {
    bpm: 66,
    beatsPerBar: 4,
    subdivision: 1,
    chordBars: 2,
    phraseBars: 4,
    keys: [
      { tonic: 45, mode: 'aeolian' },
      { tonic: 50, mode: 'aeolian' },
      { tonic: 40, mode: 'aeolian' },
      { tonic: 50, mode: 'dorian' },
    ],
    leadOctave: 7,
    leadRange: 8,
    leadTimbre: 'piano',
    leadDensity: 0.12,
    leadDensityPerLayer: 0.035,
    arpeggio: false,
    breathChance: 0.22,
    silenceChance: 0.08,
    bassBeats: [0],
    bassOptional: [2],
    bassOptionalChance: 0.3,
    padCutoff: 650,
    padCutoffPerLayer: 120,
    padLevel: 0.8,
    leadLevel: 0.75,
    bassLevel: 0.8,
    bellLevel: 0.5,
    bellFromLayer: 2,
    wet: 0.35,
    ambience: 1,
  },
  // Révélation / dénouement : majeur lumineux, arpèges montants, nappe ouverte.
  reveal: {
    bpm: 60,
    beatsPerBar: 4,
    subdivision: 2,
    chordBars: 1,
    phraseBars: 4,
    keys: [
      { tonic: 41, mode: 'ionian' },
      { tonic: 48, mode: 'ionian' },
      { tonic: 46, mode: 'lydian' },
    ],
    leadOctave: 14,
    leadRange: 10,
    leadTimbre: 'celesta',
    leadDensity: 0.4,
    leadDensityPerLayer: 0,
    arpeggio: true,
    breathChance: 0.1,
    silenceChance: 0,
    bassBeats: [0],
    bassOptional: [2],
    bassOptionalChance: 0.5,
    padCutoff: 1700,
    padCutoffPerLayer: 0,
    padLevel: 0.9,
    leadLevel: 0.8,
    bassLevel: 0.6,
    bellLevel: 0.6,
    bellFromLayer: 0,
    wet: 0.5,
    ambience: 0.35,
  },
};

/** Couches adaptatives (GAME_DESIGN §16 : un instrument de plus par génération établie). */
export const MAX_LAYERS = 4;

/** Couches selon la part de l'arbre établie ([0, 1]) : 0 à 4. */
export function layersFor(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return Math.min(MAX_LAYERS, Math.floor(ratio * MAX_LAYERS + 1e-9));
}

export interface SceneInput {
  screen: string;
  fatal: boolean;
  /** Fin choisie (écran `ending`) ; `null` pendant le rapport final. */
  ending: string | null;
}

/**
 * Humeur de la scène affichée. `null` : silence musical (lancement, erreur fatale).
 * Les écrans par-dessus le Bureau (pause, options) gardent l'humeur du Bureau.
 */
export function moodFor(scene: SceneInput): Mood | null {
  if (scene.fatal) return null;
  switch (scene.screen) {
    case 'launch':
      return null;
    case 'desk':
      return 'desk';
    case 'ending':
      return scene.ending === null ? 'desk' : 'reveal';
    default:
      return 'title';
  }
}
