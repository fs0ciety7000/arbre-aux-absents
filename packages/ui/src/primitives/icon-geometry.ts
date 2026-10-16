/**
 * Géométrie source des icônes (grille 24) — DESIGN.md §9.
 * Tracés « propres » : `scripts/ink-icons.mjs` en tire la version encrée à la main
 * (`icons.ts`, généré : trait irrégulier, dépassements de plume, second passage d'encre).
 * Ne pas importer dans les apps : passer par `ICONS` / `ICON_GEOMETRY` (icons.ts).
 * Ordre des tracés significatif : le tracé n de ICONS est la version encrée du tracé n ici.
 */

/** Cercle en tracé SVG (deux arcs). */
const c = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const ICON_GEOMETRY = {
  // Panneaux du Bureau
  /** Arbre : trois têtes reliées (parent, deux enfants). */
  tree: [
    c(12, 5.5, 2.6),
    c(5.5, 18.5, 2.6),
    c(18.5, 18.5, 2.6),
    'M12 8.1v3.9',
    'M5.5 15.9v-2.4c0-1 .6-1.5 1.5-1.5h10c.9 0 1.5.5 1.5 1.5v2.4',
  ],
  /** Archives : boîte de carton à couvercle et porte-étiquette. */
  archives: ['M3 4.5h18v4.5H3z', 'M4.5 9v10.5h15V9', 'M9.5 12.5h5v2.6h-5z'],
  reader: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M9 11.5h7', 'M9 15h7', 'M9 18.5h4'],
  /** Catalogue : meuble à fiches, deux tiroirs et leurs porte-étiquettes. */
  catalog: [
    'M4 3.5h16v17H4z',
    'M4 12h16',
    'M10 6.5h4v2h-4z',
    'M10 15h4v2h-4z',
    'M7 20.5v1.5',
    'M17 20.5v1.5',
  ],
  /** Carnet à spirale. */
  notebook: [
    'M7 3h12v18H7z',
    'M4.5 6.5h4',
    'M4.5 10.5h4',
    'M4.5 14.5h4',
    'M4.5 18.5h4',
    'M11 8h5',
    'M11 12h5',
  ],
  map: ['M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', 'M9 4v14', 'M15 6v14'],
  pinboard: [
    'M3 4h18v13H3z',
    'M8 21l1-4',
    'M16 21l-1-4',
    c(8, 9, 1.5),
    c(15, 12, 1.5),
    'M9.3 9.8l4.4 1.4',
  ],
  journal: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11', 'M9 8h6'],
  faces: [
    c(9, 9, 3),
    'M3.5 19a5.5 5.5 0 0 1 11 0',
    c(17, 8, 2.3),
    'M15.5 13.6A4.5 4.5 0 0 1 21 18',
  ],
  help: [c(12, 12, 9), 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7', 'M12 17h.01'],
  // Navigation
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  pause: ['M9 5v14', 'M15 5v14'],
  back: ['M15 5l-7 7 7 7'],
  forward: ['M9 5l7 7-7 7'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-up': ['M6 15l6-6 6 6'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  grip: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  settings: ['M4 7h9', 'M19 7h1', 'M4 17h3', 'M11 17h9', c(16, 7, 2.5), c(9, 17, 2.5)],
  sound: ['M4 9h4l5-4v14l-5-4H4z', 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a7.5 7.5 0 0 1 0 11'],
  // Verbes (point & click)
  look: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z', c(12, 12, 2.8)],
  search: [c(10.5, 10.5, 6.5), 'M15.5 15.5L20 20'],
  take: [
    'M8 12V6a1.5 1.5 0 0 1 3 0v5',
    'M11 11V4.5a1.5 1.5 0 0 1 3 0V11',
    'M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L4 13.5a1.5 1.5 0 0 1 2.5-1.6L8 14',
  ],
  /** Écrire : porte-plume et sa plume taillée. */
  write: [
    'M19.5 3.5l1 1-10 10-2.5 1.5 1.5-2.5z',
    'M16.5 6.5l1 1',
    'M4 20.5c2-1 3-.5 4 0s2.5.8 4-.5',
  ],
  pin: ['M9 3h6', 'M10 3v6l-3 3h10l-3-3V3', 'M12 12v9'],
  use: ['M3 12h11', 'M10 8l4 4-4 4', 'M14 4h6v16h-6'],
  highlight: ['M15 3l6 6-9 9-5 1 1-5z', 'M3 21h9'],
  note: ['M5 4h14v11l-5 5H5z', 'M14 20v-5h5'],
  // Lecteur
  flip: ['M4 9h13l-3-3', 'M20 15H7l3 3'],
  transcript: ['M4 6h16', 'M4 10h16', 'M4 14h10', 'M4 18h7'],
  'zoom-in': [c(10.5, 10.5, 6.5), 'M15.5 15.5L20 20', 'M10.5 8v5', 'M8 10.5h5'],
  'zoom-out': [c(10.5, 10.5, 6.5), 'M15.5 15.5L20 20', 'M8 10.5h5'],
  fit: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5'],
  /** Plein écran : deux flèches qui écartent les coins (distinct de « Ajuster », coins seuls). */
  expand: ['M14 4h6v6', 'M20 4l-6 6', 'M10 20H4v-6', 'M4 20l6-6'],
  // États
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3', 'M12 14.5v2'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  stamp: ['M9 3h6v5l2 3H7l2-3z', 'M5 14h14v3H5z', 'M5 21h14'],
  face: [c(12, 12, 9), 'M9 10h.01', 'M15 10h.01', 'M8.5 15a5 5 0 0 0 7 0'],
  /** Personne inconnue : buste neutre, point d'interrogation à la place du visage. */
  'unknown-person': [
    c(12, 8, 5),
    'M10.5 6.9a1.6 1.6 0 1 1 2.3 1.45c-.5.25-.8.6-.8 1.15',
    'M12 11h.01',
    'M4.5 21.5a7.5 7.5 0 0 1 15 0',
  ],
  /**
   * Marque inconnue (v2.8, affaire 3) : le pied seul d'une marque, sans tête ; la crosse d'un
   * point d'interrogation tient lieu de tête, le pied lui sert de point. Case à marque vide.
   */
  'unknown-mark': ['M9.4 5.2a2.6 2.6 0 1 1 3.8 2.3c-.75.4-1.2.95-1.2 1.8', 'M12 11.6v9.9'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'],
  clock: [c(12, 13, 8), 'M12 9v4l2.5 2.5', 'M9 2h6'],
  info: [c(12, 12, 9), 'M12 11v6', 'M12 7.5h.01'],
  warning: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  danger: [c(12, 12, 9), 'M9 9l6 6', 'M15 9l-6 6'],
  trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  save: ['M5 4h11l3 3v13H5z', 'M8 4v5h7V4', 'M8 20v-6h8v6'],
  quill: ['M20 3C11 4 7 10 6 18', 'M6 18l-2 3', 'M8 13c3 0 6-2 8-6'],
  // v2 — objets du bureau et motifs du récit
  /** Lampe de bureau : la lumière, l'action principale. */
  lamp: [
    'M4 21h10',
    'M9 21l1.5-7.5',
    'M10.5 13.5L14.6 6.6',
    'M13.6 7.2l2.6-2.4 5.3 6.2-6.2 2.6z',
    'M19 15.4l1 1.6',
    'M16.4 16.2l-.2 1.9',
  ],
  /** Fougère (ilv) : « ce qui repousse après l'incendie ». */
  fern: [
    'M6 21C8 15 11 10 18 4',
    'M9.4 15.6c-2-.3-3.5-1.6-4-3.6',
    'M9.4 15.6c1.5 1.4 3.3 1.9 5 1.6',
    'M12 11.8c-1.8-.5-3-2-3.3-4',
    'M12 11.8c1.6 1.1 3.3 1.4 5 .9',
    'M14.9 8.3c-1.2-.7-2-1.9-2.2-3.4',
    'M14.9 8.3c1.3.7 2.7.9 4 .5',
  ],
  folder: [
    'M3 7c0-.8.7-1.5 1.5-1.5H9l2 2.5h8.5c.8 0 1.5.7 1.5 1.5V18c0 .8-.7 1.5-1.5 1.5h-15C3.7 19.5 3 18.8 3 18z',
    'M3 10.5h18',
  ],
  envelope: ['M3 6h18v12H3z', 'M3.5 6.5l8.5 6.5 8.5-6.5'],
  photo: ['M4 4h16v16H4z', 'M6.5 6.5h11v8.5h-11z', 'M6.5 12.5l3-2.5 3 2.5 2-1.5 3 2', 'M7 18h6'],
  compass: [c(12, 12, 9), 'M15.5 8.5l-2 5-5 2 2-5z', 'M12 3v1.5', 'M12 19.5V21'],
  typewriter: [
    'M4.5 10.5h15l1.5 9H3z',
    'M7 10.5V4h10v6.5',
    'M7 14h.01',
    'M10 14h.01',
    'M13 14h.01',
    'M16 14h.01',
    'M8 17h8',
  ],
  clip: ['M8 7.5V16a4 4 0 0 0 8 0V6a2.5 2.5 0 0 0-5 0v9.5a1 1 0 0 0 2 0V8'],
  /** Agrafe : couronne posée sur le bord d'une feuille, pattes qui la traversent (case revendiquée). */
  staple: ['M4.5 11.5V7.5h15v4', 'M2.5 14.5h19', 'M4.5 17v2', 'M19.5 17v2'],
  /** Étincelle : révélation, branche établie. */
  sparkle: [
    'M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7z',
    'M19 17v4',
    'M17 19h4',
  ],
  /**
   * Bobine (v2.8, affaire 3) : bande magnétique sur sa bobine, trois jours et le moyeu, la bande
   * qui file à droite. Pièce de type `recording` (« Enregistrement »).
   */
  reel: [
    c(10.5, 10.5, 8),
    c(10.5, 10.5, 1.5),
    c(10.5, 6.1, 1.7),
    c(14.3, 12.7, 1.7),
    c(6.7, 12.7, 1.7),
    'M10.5 18.5H21',
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICON_GEOMETRY;
