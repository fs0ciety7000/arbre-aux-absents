/**
 * Géométrie source des ornements (DESIGN.md §10) : coins, fougère, filets, sceau,
 * trombone, punaise. Encrés par `scripts/ink-icons.mjs` → `ornaments.ts` (généré).
 * `w`/`h` : boîte de dessin ; `paths` : traits (currentColor) ; `fills` : aplats
 * (currentColor, encre pleine) ; `tone` : tracés rendus avec la couleur secondaire
 * (--ornament-tone, ex. le vermillon d'une tête de punaise).
 */

/** Feuille de fougère : une paire de folioles de part et d'autre d'un point de la tige. */
function leaflets(x: number, y: number, angle: number, size: number): string[] {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a),
    uy = Math.sin(a);
  const nx = -uy,
    ny = ux;
  const r = (v: number) => Math.round(v * 10) / 10;
  const leaf = (side: number) => {
    const tx = x + (ux * 0.55 + nx * side) * size;
    const ty = y + (uy * 0.55 + ny * side) * size;
    const cx = x + (ux * 0.05 + nx * side * 0.75) * size;
    const cy = y + (uy * 0.05 + ny * side * 0.75) * size;
    return `M${r(x)} ${r(y)}Q${r(cx)} ${r(cy)} ${r(tx)} ${r(ty)}`;
  };
  return [leaf(1), leaf(-1)];
}

/** Fronde de fougère le long d'une tige droite (de x0,y0 à x1,y1), folioles décroissantes. */
function frond(x0: number, y0: number, x1: number, y1: number, n: number, size: number) {
  const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  const out = [`M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 - 2} ${x1} ${y1}`];
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1);
    out.push(...leaflets(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, angle, size * (1 - t * 0.6)));
  }
  return out;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

function ticks(cx: number, cy: number, r1: number, r2: number, n: number) {
  const out: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const p = (r: number) =>
      `${Math.round((cx + Math.cos(a) * r) * 10) / 10} ${Math.round((cy + Math.sin(a) * r) * 10) / 10}`;
    out.push(`M${p(r1)}L${p(r2)}`);
  }
  return out;
}

export interface OrnamentGeometry {
  w: number;
  h: number;
  paths: readonly string[];
  fills?: readonly string[];
  tone?: readonly string[];
}

export const ORNAMENT_GEOMETRY = {
  /** Coin de cadre (haut-gauche ; tourner pour les autres) : double filet, volute, fougère. */
  corner: {
    w: 64,
    h: 64,
    paths: [
      'M6 62V20C6 12 12 6 20 6h42',
      'M12 62V23c0-6 5-11 11-11h39',
      'M20 20c5 0 8 3 8 7s-3 6-6 6-4.5-2-4.5-4.5 1.6-3.5 3.5-3.5',
      ...leaflets(30, 12, 0, 7),
      ...leaflets(40, 12, 0, 5.5),
      ...leaflets(12, 32, 90, 7),
      ...leaflets(12, 42, 90, 5.5),
    ],
  },
  /** Fronde de fougère (le réseau « Fougère », le filigrane des Papeteries Varenque). */
  fern: {
    w: 160,
    h: 48,
    paths: frond(6, 40, 154, 10, 9, 15),
  },
  /** Filet de séparation : deux traits, losange et points. */
  divider: {
    w: 240,
    h: 20,
    paths: ['M6 10h92', 'M142 10h92', 'M120 3l7 7-7 7-7-7z', 'M106 10h.01', 'M134 10h.01'],
    fills: [],
  },
  /** Sceau administratif (cachet rond) : couronne dentelée, double cercle, étoile. */
  seal: {
    w: 72,
    h: 72,
    paths: [
      circle(36, 36, 30),
      circle(36, 36, 23),
      ...ticks(36, 36, 31.5, 34.5, 36),
      'M36 25l3.2 6.8 7.4.9-5.4 5.1 1.4 7.3-6.6-3.6-6.6 3.6 1.4-7.3-5.4-5.1 7.4-.9z',
    ],
  },
  /** Trombone en acier (posé verticalement sur un bord de feuille). */
  clip: {
    w: 24,
    h: 64,
    paths: ['M7 18v30a5 5 0 0 0 10 0V10a7 7 0 0 0-14 0v38a9 9 0 0 0 18 0V22'],
  },
  /** Punaise : tête ronde (couleur --ornament-tone), reflet, pointe. */
  pin: {
    w: 32,
    h: 32,
    paths: [circle(16, 13, 8), 'M16 21v8'],
    tone: [circle(16, 13, 8)],
    fills: ['M12.5 10.5a3 2 -30 1 0 3-2.4'],
  },
  /** Volute de titre (sous le nom du jeu) : boucle, fougère, boucle. */
  flourish: {
    w: 240,
    h: 36,
    paths: [
      'M10 22c20-10 40 6 60 0s28-12 42-4',
      'M230 22c-20-10-40 6-60 0s-28-12-42-4',
      'M112 18c3-6 13-6 16 0',
      ...leaflets(120, 14, -90, 8),
      'M8 22c-3 0-4-2-3-4s4-2 5 0',
      'M232 22c3 0 4-2 3-4s-4-2-5 0',
    ],
  },
} as const satisfies Record<string, OrnamentGeometry>;

export type OrnamentName = keyof typeof ORNAMENT_GEOMETRY;
