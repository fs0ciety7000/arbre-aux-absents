/**
 * Découpage de la bande-annonce (plans, points d'entrée/sortie, cadrages, repères sonores).
 * Source unique pour le montage (`assemble.ts`) et la musique (`audio.ts`).
 *
 * Les plans de jeu « hi » (2880 × 1620) peuvent être recadrés : `crop` = fenêtre de fin
 * (x, y, largeur ; hauteur au 16:9), atteinte en douceur depuis le plein cadre (`push`) ou
 * tenue fixe (`hold`).
 */

export interface Crop {
  x: number;
  y: number;
  w: number;
  mode: 'push' | 'hold';
}

export interface Shot {
  clip: string;
  from: number;
  to: number;
  crop?: Crop;
  /** Description (README, planche). */
  label: string;
}

export interface Cut {
  name: string;
  width: number;
  height: number;
  /** Durée des fondus enchaînés (s). */
  xfade: number;
  shots: Shot[];
  /** Humeurs musicales du jeu : à partir du plan n° `shot`. */
  moods: { shot: number; mood: 'title' | 'desk' | 'reveal'; layers: number }[];
  /** Effets du jeu : `shot`, temps dans le plan (source), nom. */
  sfx: { shot: number; at: number; name: 'stamp' | 'chord' | 'page' | 'paper' | 'type' }[];
}

export const LANDSCAPE_CUT: Cut = {
  name: 'trailer-1080p',
  width: 1920,
  height: 1080,
  xfade: 0.6,
  shots: [
    {
      clip: 'intro',
      from: 0,
      to: 7.4,
      label: 'Art clé « Le bureau sous la lampe », lente approche, le titre s’encre',
    },
    { clip: 'c1', from: 0, to: 3.6, label: 'Carton : « Velmarche, automne 1974. »' },
    {
      clip: 'lettre',
      from: 1.8,
      to: 10.6,
      crop: { x: 780, y: 250, w: 2100, mode: 'push' },
      label: 'Catalogue → Lecteur : la lettre de Maaren (manuscrite, mots-clés soulignés)',
    },
    {
      clip: 'c2',
      from: 0,
      to: 3.6,
      label: 'Carton : « Une famille entière effacée des registres. »',
    },
    {
      clip: 'tenna',
      from: 1.2,
      to: 8.9,
      crop: { x: 560, y: 160, w: 2320, mode: 'push' },
      label: 'Catalogue : « Tenna Orrvik » tapé, une fiche trouvée, la photographie ouverte',
    },
    {
      clip: 'c3',
      from: 0,
      to: 3.6,
      label: 'Carton : « Rendez-leur un nom, un visage, un métier. »',
    },
    {
      clip: 'tenna',
      from: 13.3,
      to: 18.4,
      crop: { x: 690, y: 300, w: 2190, mode: 'hold' },
      label: 'Le visage pris dans la photographie, posé sur la case de Tenna',
    },
    {
      clip: 'tenna',
      from: 26.0,
      to: 31.9,
      label: 'Carte de révélation, puis les tampons « Établi » sur les gens du Cap',
    },
    { clip: 'c4', from: 0, to: 3.3, label: 'Carton : « On ne devine pas. On déduit. »' },
    {
      clip: 'carte',
      from: 2.4,
      to: 9.6,
      crop: { x: 40, y: 120, w: 2240, mode: 'push' },
      label: 'La carte gravée de la Velmarche, survol du cap de Tennok',
    },
    {
      clip: 'fin',
      from: 0,
      to: 10,
      label: 'Carton de fin : titre, Gratuit sur itch.io, plateformes, site, logos',
    },
  ],
  moods: [
    { shot: 0, mood: 'title', layers: 0 },
    { shot: 2, mood: 'desk', layers: 2 },
    { shot: 10, mood: 'title', layers: 0 },
  ],
  sfx: [
    { shot: 7, at: 28.95, name: 'stamp' },
    { shot: 7, at: 29.25, name: 'chord' },
  ],
};

export const VERTICAL_CUT: Cut = {
  name: 'trailer-vertical-1080x1920',
  width: 1080,
  height: 1920,
  xfade: 0.5,
  shots: [
    { clip: 'v-intro', from: 0, to: 4.6, label: 'Art clé vertical, le titre s’encre' },
    {
      clip: 'v-c2',
      from: 0,
      to: 3.0,
      label: 'Carton : « Une famille entière effacée des registres. »',
    },
    {
      clip: 'mobile',
      from: 3.4,
      to: 6.9,
      label: 'Téléphone : le métier de Tenna choisi dans la liste',
    },
    {
      clip: 'mobile',
      from: 10.4,
      to: 14.0,
      label: 'Téléphone : « Continuer », les tampons « Établi »',
    },
    { clip: 'v-fin', from: 0, to: 5.5, label: 'Carton de fin vertical' },
  ],
  moods: [{ shot: 0, mood: 'title', layers: 0 }],
  sfx: [
    { shot: 3, at: 11.5, name: 'stamp' },
    { shot: 3, at: 11.8, name: 'chord' },
  ],
};

/** Début de chaque plan dans le montage (s). */
export function starts(cut: Cut): number[] {
  const out: number[] = [];
  let t = 0;
  for (const s of cut.shots) {
    out.push(t);
    t += s.to - s.from - cut.xfade;
  }
  return out;
}

export function totalDuration(cut: Cut): number {
  return cut.shots.reduce((a, s) => a + (s.to - s.from), 0) - cut.xfade * (cut.shots.length - 1);
}
