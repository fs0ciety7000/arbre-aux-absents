/**
 * Jeu d'icônes du Bureau (grille 24, trait 1,75, extrémités rondes : le trait de plume).
 * Chaque icône est une liste de tracés `d` (aucun HTML injecté). Doc : DESIGN.md §8.
 */

/** Cercle en tracé SVG (deux arcs). */
const c = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const ICONS = {
  // Panneaux du Bureau
  tree: ['M9 3h6v4H9z', 'M3 17h6v4H3z', 'M15 17h6v4h-6z', 'M12 7v5', 'M6 17v-3h12v3'],
  archives: ['M3 4h18v5H3z', 'M5 9v11h14V9', 'M10 13h4'],
  reader: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M9 12h7', 'M9 16h7'],
  catalog: ['M4 10h16v10H4z', 'M6 10V6h12v4', 'M8 6V3h8v3', 'M10 14h4'],
  notebook: ['M6 3h12v18H6z', 'M9 3v18', 'M12 8h4', 'M12 12h4'],
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
  write: ['M19 4c-6 0-11 5-12 13l-2 3', 'M7 17c3 0 6-1 8-4', 'M10 10h6'],
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
  // États
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
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
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'],
  clock: [c(12, 13, 8), 'M12 9v4l2.5 2.5', 'M9 2h6'],
  info: [c(12, 12, 9), 'M12 11v6', 'M12 7.5h.01'],
  warning: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  danger: [c(12, 12, 9), 'M9 9l6 6', 'M15 9l-6 6'],
  trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
  save: ['M5 4h11l3 3v13H5z', 'M8 4v5h7V4', 'M8 20v-6h8v6'],
  quill: ['M20 3C11 4 7 10 6 18', 'M6 18l-2 3', 'M8 13c3 0 6-2 8-6'],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
