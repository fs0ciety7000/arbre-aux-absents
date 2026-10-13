#!/usr/bin/env node
// Encre les icônes à la main (docs/DESIGN.md §9) : lit la géométrie propre
// (src/primitives/icon-geometry.ts), écrit src/primitives/icons.ts (généré, à ne pas éditer).
// Usage : node packages/ui/scripts/ink-icons.mjs   (Node ≥ 22.18 : types TS effacés à l'import)
//
// Pour chaque tracé : aplati en polyligne, rééchantillonné entre les angles vifs, puis
//  - ondulation basse fréquence perpendiculaire au trait (± 0,2 u : la main qui tremble),
//  - léger déplacement des angles (± 0,12 u),
//  - dépassement de plume aux extrémités (0,25 u au départ, 0,35 u à l'arrivée),
//  - formes fermées : le trait repasse 0,6 u au-delà de son départ (fermeture à la main),
// et réémis en courbes (Catmull-Rom → Bézier cubiques), au dixième d'unité.
// Second passage d'encre (ICON_RETRACE) : sur les traits longs (> 7 u), une reprise décalée
// de 0,35 u couvrant 10–70 % du trait, rendue fine et translucide par <Icon>.
// Déterministe : le bruit est semé par le nom de l'icône et le rang du tracé.
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src/primitives/icon-geometry.ts');
const out = resolve(here, '../src/primitives/icons.ts');
const { ICON_GEOMETRY } = await import(pathToFileURL(src).href);

// ── Analyse et aplatissement d'un attribut d ───────────────────────────
function tokenize(d) {
  return d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)(?:e-?\d+)?/g) ?? [];
}
function flatten(d) {
  const t = tokenize(d);
  const subpaths = [];
  let cur = null;
  let x = 0,
    y = 0,
    sx = 0,
    sy = 0,
    cmd = '',
    lastCtrl = null,
    i = 0;
  const num = () => Number(t[i++]);
  const push = (px, py) => cur.pts.push([px, py]);
  const start = (px, py) => {
    cur = { pts: [[px, py]], closed: false };
    subpaths.push(cur);
  };
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const n = 16;
    for (let k = 1; k <= n; k++) {
      const s = k / n,
        u = 1 - s;
      push(
        u * u * u * x + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3,
        u * u * u * y + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3,
      );
    }
  };
  const arc = (rx, ry, phi, large, sweep, x2, y2) => {
    // Conversion extrémités → centre (SVG 1.1, annexe F.6)
    const rad = (phi * Math.PI) / 180;
    const cos = Math.cos(rad),
      sin = Math.sin(rad);
    const dx = (x - x2) / 2,
      dy = (y - y2) / 2;
    const x1p = cos * dx + sin * dy,
      y1p = -sin * dx + cos * dy;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) {
      rx *= Math.sqrt(lam);
      ry *= Math.sqrt(lam);
    }
    const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num2 / den));
    if (large === sweep) co = -co;
    const cxp = (co * rx * y1p) / ry,
      cyp = (-co * ry * x1p) / rx;
    const cx = cos * cxp - sin * cyp + (x + x2) / 2;
    const cy = sin * cxp + cos * cyp + (y + y2) / 2;
    const ang = (ux, uy, vx, vy) => {
      const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
      return a;
    };
    const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dth > 0) dth -= 2 * Math.PI;
    if (sweep && dth < 0) dth += 2 * Math.PI;
    const n = Math.max(8, Math.ceil(Math.abs(dth) / (Math.PI / 18)));
    for (let k = 1; k <= n; k++) {
      const th = th1 + (dth * k) / n;
      push(
        cos * rx * Math.cos(th) - sin * ry * Math.sin(th) + cx,
        sin * rx * Math.cos(th) + cos * ry * Math.sin(th) + cy,
      );
    }
  };
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0,
      oy = rel ? y : 0;
    if (C === 'M') {
      x = ox + num();
      y = oy + num();
      start(x, y);
      sx = x;
      sy = y;
      cmd = rel ? 'l' : 'L';
      lastCtrl = null;
    } else if (C === 'L') {
      x = ox + num();
      y = oy + num();
      push(x, y);
      lastCtrl = null;
    } else if (C === 'H') {
      x = ox + num();
      push(x, y);
      lastCtrl = null;
    } else if (C === 'V') {
      y = oy + num();
      push(x, y);
      lastCtrl = null;
    } else if (C === 'C') {
      const x1 = ox + num(),
        y1 = oy + num(),
        x2 = ox + num(),
        y2 = oy + num(),
        x3 = ox + num(),
        y3 = oy + num();
      cubic(x1, y1, x2, y2, x3, y3);
      x = x3;
      y = y3;
      lastCtrl = [x2, y2];
    } else if (C === 'S') {
      const x1 = lastCtrl ? 2 * x - lastCtrl[0] : x,
        y1 = lastCtrl ? 2 * y - lastCtrl[1] : y;
      const x2 = ox + num(),
        y2 = oy + num(),
        x3 = ox + num(),
        y3 = oy + num();
      cubic(x1, y1, x2, y2, x3, y3);
      x = x3;
      y = y3;
      lastCtrl = [x2, y2];
    } else if (C === 'Q') {
      const qx = ox + num(),
        qy = oy + num(),
        x3 = ox + num(),
        y3 = oy + num();
      cubic(
        x + (2 / 3) * (qx - x),
        y + (2 / 3) * (qy - y),
        x3 + (2 / 3) * (qx - x3),
        y3 + (2 / 3) * (qy - y3),
        x3,
        y3,
      );
      x = x3;
      y = y3;
      lastCtrl = null;
    } else if (C === 'A') {
      const rx = num(),
        ry = num(),
        phi = num(),
        large = num(),
        sweep = num();
      const x2 = ox + num(),
        y2 = oy + num();
      arc(rx, ry, phi, large, sweep, x2, y2);
      x = x2;
      y = y2;
      lastCtrl = null;
    } else if (C === 'Z') {
      cur.closed = true;
      push(sx, sy);
      x = sx;
      y = sy;
      lastCtrl = null;
    } else {
      throw new Error(`Commande non prise en charge : ${cmd} dans ${d}`);
    }
  }
  return subpaths;
}

// ── Bruit déterministe ─────────────────────────────────────────────────
function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
function cleanup(pts) {
  const r = [pts[0]];
  for (const p of pts.slice(1)) if (len(r.at(-1), p) > 0.01) r.push(p);
  return r;
}
/** Angles vifs (> 32°) : conservés tels quels, les tronçons entre eux sont lissés. */
function corners(pts) {
  const idx = [0];
  for (let k = 1; k < pts.length - 1; k++) {
    const a = Math.atan2(pts[k][1] - pts[k - 1][1], pts[k][0] - pts[k - 1][0]);
    const b = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]);
    let d = Math.abs(b - a);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > (32 * Math.PI) / 180) idx.push(k);
  }
  idx.push(pts.length - 1);
  return idx;
}
function resample(run, step) {
  const L = run.slice(1).reduce((s, p, k) => s + len(run[k], p), 0);
  const n = Math.max(1, Math.round(L / step));
  const outPts = [run[0]];
  let seg = 0,
    acc = 0;
  for (let k = 1; k < n; k++) {
    const target = (L * k) / n;
    while (seg < run.length - 2 && acc + len(run[seg], run[seg + 1]) < target) {
      acc += len(run[seg], run[seg + 1]);
      seg++;
    }
    const sl = len(run[seg], run[seg + 1]) || 1;
    const f = (target - acc) / sl;
    outPts.push([
      run[seg][0] + (run[seg + 1][0] - run[seg][0]) * f,
      run[seg][1] + (run[seg + 1][1] - run[seg][1]) * f,
    ]);
  }
  outPts.push(run.at(-1));
  return { pts: outPts, L };
}

/** Une polyligne encrée : liste de tronçons lisses séparés par des angles. */
function inkSubpath(sp, rand, amp, step = 2.8) {
  let pts = cleanup(sp.pts);
  if (pts.length < 2) return null;
  // Fermeture à la main : on repasse au-delà du départ
  if (sp.closed) {
    const over = [];
    let acc = 0;
    for (let k = 1; k < pts.length && acc < 0.6; k++) {
      const l = len(pts[k - 1], pts[k]);
      const f = Math.min(1, (0.6 - acc) / l);
      over.push([
        pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f,
        pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f,
      ]);
      acc += l * f;
    }
    pts = pts.concat(over);
  }
  // Dépassements de plume (traits ouverts)
  if (!sp.closed) {
    const [a, b] = [pts[0], pts[1]];
    const la = len(a, b);
    pts[0] = [a[0] - ((b[0] - a[0]) / la) * 0.25, a[1] - ((b[1] - a[1]) / la) * 0.25];
    const [y, z] = [pts.at(-2), pts.at(-1)];
    const lz = len(y, z);
    pts[pts.length - 1] = [z[0] + ((z[0] - y[0]) / lz) * 0.35, z[1] + ((z[1] - y[1]) / lz) * 0.35];
  }
  const ci = corners(pts);
  const ph1 = rand() * 6.28,
    ph2 = rand() * 6.28;
  const jitter = (p) => [p[0] + (rand() - 0.5) * 0.24, p[1] + (rand() - 0.5) * 0.24];
  const runs = [];
  let s0 = 0;
  for (let r = 0; r < ci.length - 1; r++) {
    const run = pts.slice(ci[r], ci[r + 1] + 1);
    const { pts: rs, L } = resample(run, step);
    const disp = rs.map((p, k) => {
      if (k === 0 || k === rs.length - 1) return p;
      const prev = rs[k - 1],
        next = rs[k + 1];
      const tl = len(prev, next) || 1;
      const nx = -(next[1] - prev[1]) / tl,
        ny = (next[0] - prev[0]) / tl;
      const s = s0 + (L * k) / (rs.length - 1);
      // taper : ondulation nulle aux extrémités du tronçon
      const w = Math.sin((Math.PI * k) / (rs.length - 1));
      const n = amp * w * (0.65 * Math.sin(s / 1.05 + ph1) + 0.35 * Math.sin(s / 0.43 + ph2));
      return [p[0] + nx * n, p[1] + ny * n];
    });
    s0 += L;
    runs.push(disp);
  }
  // Angles légèrement déplacés (cohérents entre tronçons voisins)
  for (let r = 0; r < runs.length; r++) {
    const j = jitter(runs[r][0]);
    runs[r][0] = j;
    if (r > 0) runs[r - 1][runs[r - 1].length - 1] = j;
  }
  return runs;
}

const f1 = (v) => {
  const s = (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  return s === '-0' ? '0' : s;
};
/** Nombres compacts : « 1.5-2 » plutôt que « 1.5 -2 ». */
function join(nums) {
  let o = '';
  for (const v of nums) {
    const t = f1(v);
    o += o === '' || t.startsWith('-') ? t : ` ${t}`;
  }
  return o.replace(/(^|[ -])0\./g, '$1.');
}
/** Émission relative et compacte (c, l) : la taille du fichier généré compte. */
function emit(runs) {
  let [x, y] = runs[0][0];
  x = Math.round(x * 10) / 10;
  y = Math.round(y * 10) / 10;
  let d = `M${join([x, y])}`;
  const rel = (px, py) => [px - x, py - y];
  for (const run of runs) {
    if (run.length === 2) {
      const [ax, ay] = [Math.round(run[1][0] * 10) / 10, Math.round(run[1][1] * 10) / 10];
      d += `l${join(rel(ax, ay))}`;
      x = ax;
      y = ay;
      continue;
    }
    for (let k = 0; k < run.length - 1; k++) {
      const p0 = run[Math.max(0, k - 1)],
        p1 = run[k],
        p2 = run[k + 1],
        p3 = run[Math.min(run.length - 1, k + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      const end = [Math.round(p2[0] * 10) / 10, Math.round(p2[1] * 10) / 10];
      d += `c${join([...rel(...c1), ...rel(...c2), ...rel(...end)])}`;
      x = end[0];
      y = end[1];
    }
  }
  return d;
}
const isDot = (d) => /h\.01$/.test(d);

function inkPath(d, seed, scale = 1) {
  if (isDot(d)) return d; // point d'encre : rendu rond par stroke-linecap
  const rand = rng(seed);
  return flatten(d)
    .map((sp) => inkSubpath(sp, rand, 0.2 * Math.min(2, scale), 2.8 * scale))
    .filter(Boolean)
    .map(emit)
    .join('');
}
/** Reprise d'encre : portion 10–70 % du plus long sous-tracé, décalée de 0,35 u. */
function retrace(d, seed) {
  if (isDot(d)) return null;
  const rand = rng(seed ^ 0x9e3779b9);
  const sps = flatten(d).map((sp) => ({ ...sp, pts: cleanup(sp.pts) }));
  let best = null,
    bestL = 0;
  for (const sp of sps) {
    const L = sp.pts.slice(1).reduce((s, p, k) => s + len(sp.pts[k], p), 0);
    if (L > bestL) {
      bestL = L;
      best = sp;
    }
  }
  if (!best || bestL < 7) return null;
  const { pts } = resample(best.pts, 0.25);
  const a = Math.floor(pts.length * (0.1 + rand() * 0.08));
  const b = Math.floor(pts.length * (0.62 + rand() * 0.1));
  const part = pts.slice(a, b);
  const shifted = part.map((p, k) => {
    const prev = part[Math.max(0, k - 1)],
      next = part[Math.min(part.length - 1, k + 1)];
    const tl = len(prev, next) || 1;
    const off = 0.35 * Math.sin((Math.PI * k) / (part.length - 1));
    return [p[0] - ((next[1] - prev[1]) / tl) * off, p[1] + ((next[0] - prev[0]) / tl) * off];
  });
  const runs = inkSubpath({ pts: shifted, closed: false }, rand, 0.15);
  return runs ? emit(runs) : null;
}

const inked = {};
const retraces = {};
for (const [name, paths] of Object.entries(ICON_GEOMETRY)) {
  inked[name] = paths.map((d, k) => inkPath(d, hash(`${name}#${k}`)));
  // une seule reprise par icône : sur son tracé le plus long
  const rt = paths
    .map((d, k) => retrace(d, hash(`${name}#${k}`)))
    .filter(Boolean)
    .sort((x, y) => y.length - x.length)[0];
  if (rt) retraces[name] = rt;
}

const lines = [
  '// Fichier GÉNÉRÉ par packages/ui/scripts/ink-icons.mjs — ne pas éditer.',
  '// Source : icon-geometry.ts. Doc : docs/DESIGN.md §9 (icônes encrées à la main).',
  "import { ICON_GEOMETRY, type IconName } from './icon-geometry';",
  '',
  'export { ICON_GEOMETRY };',
  'export type { IconName };',
  '',
  '/** Tracés encrés (même ordre que ICON_GEOMETRY) : ceux que rend <Icon>. */',
  'export const ICONS: { readonly [K in IconName]: readonly string[] } = {',
  ...Object.entries(inked).map(
    ([n, ps]) =>
      `  ${JSON.stringify(n)}: [\n${ps.map((p) => `    ${JSON.stringify(p)},`).join('\n')}\n  ],`,
  ),
  '};',
  '',
  "/** Second passage d'encre (fin, translucide), absent des icônes trop courtes. */",
  'export const ICON_RETRACE: Partial<Record<IconName, string>> = {',
  ...Object.entries(retraces).map(([n, p]) => `  ${JSON.stringify(n)}: ${JSON.stringify(p)},`),
  '};',
  '',
  'export const ICON_NAMES = Object.keys(ICON_GEOMETRY) as IconName[];',
  '',
];
writeFileSync(out, lines.join('\n'));
const bytes = lines.join('\n').length;

// ── Ornements ─────────────────────────────────────────────────────────
const osrc = resolve(here, '../src/primitives/ornament-geometry.ts');
const oout = resolve(here, '../src/primitives/ornaments.ts');
const { ORNAMENT_GEOMETRY } = await import(pathToFileURL(osrc).href);
const orn = {};
for (const [name, g] of Object.entries(ORNAMENT_GEOMETRY)) {
  const scale = Math.max(1, Math.min(g.w, g.h) / 24);
  orn[name] = {
    w: g.w,
    h: g.h,
    paths: g.paths.map((d, k) => inkPath(d, hash(`orn:${name}#${k}`), scale)),
    fills: g.fills ?? [],
    tone: (g.tone ?? []).map((d, k) => inkPath(d, hash(`orn:${name}#${k}`), scale)),
  };
}
const olines = [
  '// Fichier GÉNÉRÉ par packages/ui/scripts/ink-icons.mjs — ne pas éditer.',
  '// Source : ornament-geometry.ts. Doc : docs/DESIGN.md §10 (ornements).',
  "import { ORNAMENT_GEOMETRY, type OrnamentName } from './ornament-geometry';",
  '',
  'export { ORNAMENT_GEOMETRY };',
  'export type { OrnamentName };',
  '',
  'export interface Ornament {',
  '  readonly w: number;',
  '  readonly h: number;',
  '  readonly paths: readonly string[];',
  '  readonly fills: readonly string[];',
  '  readonly tone: readonly string[];',
  '}',
  '',
  '/** Ornements encrés : ceux que rend <Ornament>. */',
  `export const ORNAMENTS: { readonly [K in OrnamentName]: Ornament } = ${JSON.stringify(orn, null, 2)};`,
  '',
  'export const ORNAMENT_NAMES = Object.keys(ORNAMENT_GEOMETRY) as OrnamentName[];',
  '',
];
writeFileSync(oout, olines.join('\n'));
console.log(`${Object.keys(orn).length} ornements encrés → ${oout}`);
console.log(
  `${Object.keys(inked).length} icônes encrées → ${out} (${(bytes / 1024).toFixed(1)} Ko)`,
);
