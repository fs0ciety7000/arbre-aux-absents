/**
 * Outils géométriques des illustrations (sans dépendance, déterministes).
 * Copie autonome et réduite de art/tools/portraits/lib.mjs (même PRNG, même lissage),
 * pour que les illustrations ne dépendent pas d'un fichier en cours d'évolution.
 */

/** PRNG mulberry32 : même graine, mêmes traits. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.jit = (amp) => (next() * 2 - 1) * amp;
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  return next;
}

/** Graine stable tirée d'une chaîne (FNV-1a). */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Nombre compact à une décimale. */
export function f(x) {
  const v = Math.round(x * 10) / 10;
  if (Object.is(v, -0) || v === 0) return '0';
  return String(v);
}
export const pt = (p) => `${f(p[0])} ${f(p[1])}`;

/** Courbe lissée (Catmull-Rom → Bézier). Un point `[x, y, 1]` est un angle vif. */
export function smooth(pts, closed = false, k = 1) {
  const n = pts.length;
  if (n < 2) return '';
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1 = p1[2] ? p1 : [p1[0] + ((p2[0] - p0[0]) * k) / 6, p1[1] + ((p2[1] - p0[1]) * k) / 6];
    const c2 = p2[2] ? p2 : [p2[0] - ((p3[0] - p1[0]) * k) / 6, p2[1] - ((p3[1] - p1[1]) * k) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? `${d}Z` : d;
}

/** Ligne brisée. */
export function poly(pts, closed = false) {
  return `M${pts.map(pt).join('L')}${closed ? 'Z' : ''}`;
}

export function rect(x, y, w, h) {
  return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
}

export function circ(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

export function ell(cx, cy, rx, ry) {
  return `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Points d'une ellipse (pour composer des contours). */
export function ellPts(cx, cy, rx, ry, n = 16, a0 = 0, a1 = Math.PI * 2) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / (a1 - a0 >= Math.PI * 2 - 1e-6 ? n : n - 1);
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** Tube (bras, jambe, tige) autour d'une polyligne, largeur variable w0 → w1. */
export function tube(pts, w0, w1 = w0) {
  const n = pts.length;
  const L = [];
  const R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = lerp(w0, w1, n === 1 ? 0 : i / (n - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return smooth([...L, ...R.reverse()], true, 0.7);
}

/** Hachures parallèles couvrant une boîte (à rogner par un clipPath). */
export function hatchLines([x0, y0, x1, y1], angle, sp, r, { jit = 0.2 } = {}) {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = '';
  for (let s = -R; s <= R; s += sp) {
    const ox = cx - dy * s + (r ? r.jit(jit) : 0);
    const oy = cy + dx * s;
    d += `M${f(ox - dx * R)} ${f(oy - dy * R)}L${f(ox + dx * R)} ${f(oy + dy * R)}`;
  }
  return d;
}

/** Points intermédiaires d'un segment, légèrement tremblés (main du graveur). */
export function wobble(a, b, r, amp = 0.4, n = 4) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = i === 0 || i === n ? 0 : 1;
    pts.push([lerp(a[0], b[0], t) + e * r.jit(amp), lerp(a[1], b[1], t) + e * r.jit(amp)]);
  }
  return pts;
}

/**
 * Lignes de « texte » illisibles : mots en tirets (imprimé) ou boucles (manuscrit).
 * Rend un seul `d`. `align` : 'just' | 'center' | 'left'.
 */
export function textLines(r, x, y, w, n, lh, { align = 'just', word = [3, 9], gap = 1.6, last = 0.6, para = 0, indent = 0 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const isLast = (para && (i + 1) % para === 0) || i === n - 1;
    let lw = w;
    if (align === 'center') lw = w * r.range(0.45, 0.95);
    else if (isLast) lw = w * r.range(last * 0.6, last);
    else if (align === 'left') lw = w * r.range(0.7, 1);
    let lx = align === 'center' ? x + (w - lw) / 2 : x;
    const startIndent = para && i % para === 0 ? indent : 0;
    lx += startIndent;
    lw -= startIndent;
    const yy = y + i * lh;
    let cx = lx;
    while (cx < lx + lw - word[0]) {
      const ww = Math.min(r.range(word[0], word[1]), lx + lw - cx);
      d += `M${f(cx)} ${f(yy)}h${f(ww)}`;
      cx += ww + gap;
    }
  }
  return d;
}

/** Écriture manuscrite illisible : guirlandes de boucles régulières. */
export function handLines(r, x, y, w, n, lh, { slant = 0.25, h = 2.2, step = 2.4, last = 0.55 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * last : w * r.range(0.86, 1);
    const yy = y + i * lh;
    let cx = x;
    d += `M${f(cx)} ${f(yy)}`;
    while (cx < x + lw) {
      // un « mot » : 3 à 7 boucles
      const k = r.int(2, 6);
      for (let j = 0; j < k && cx < x + lw; j++) {
        const hh = h * (r() < 0.18 ? 1.9 : r.range(0.7, 1.1));
        const up = r() < 0.12 ? -1 : 1;
        d += `q${f(step * 0.2 + slant * hh)} ${f(-hh * up)} ${f(step * 0.5)} ${f(-hh * 0.2 * up)}q${f(-slant * 0.3)} ${f(hh * 0.4)} ${f(step * 0.5)} ${f(hh * 0.2 * up)}`;
        cx += step;
      }
      cx += step * r.range(0.8, 1.6);
      d += `M${f(cx)} ${f(yy + r.jit(0.3))}`;
    }
  }
  return d;
}
