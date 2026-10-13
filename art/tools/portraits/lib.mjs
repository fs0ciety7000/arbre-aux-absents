/**
 * Outils géométriques des portraits (sans dépendance, déterministes).
 * Chemins lissés (Catmull-Rom → Bézier), hachures, PRNG à graine fixe.
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
const pt = (p) => `${f(p[0])} ${f(p[1])}`;

/**
 * Courbe lissée passant par les points. Un point `[x, y, 1]` est un angle vif.
 * `k` règle la tension (1 = Catmull-Rom classique).
 */
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

/** Cercle en chemin (pour fusionner plusieurs pastilles dans un seul <path>). */
export function circ(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

/** Ellipse en chemin. */
export function ell(cx, cy, rx, ry) {
  return `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpPt = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Boîte englobante de points. */
export function bbox(pts) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Point dans un polygone (approximation des régions lissées par leurs sommets). */
export function inside(p, polygon) {
  let c = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/**
 * Hachures parallèles couvrant une boîte (à rogner par un clipPath).
 * `angle` en degrés, `sp` pas, `bend` cambrure (lignes courbes, effet de taille-douce),
 * `jit` irrégularité de la main du graveur.
 */
export function hatch(box, angle, sp, r, { bend = 0, jit = 0.25, gap = 0 } = {}) {
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const half = Math.hypot(box.x1 - box.x0, box.y1 - box.y0) / 2 + 1;
  let d = '';
  for (let s = -half; s <= half; s += sp) {
    const o = s + (r ? r.jit(jit) : 0);
    const mx = cx + nx * o;
    const my = cy + ny * o;
    const l0 = half - (gap && r ? r() * gap : 0);
    const l1 = half - (gap && r ? r() * gap : 0);
    const p0 = [mx - dx * l0, my - dy * l0];
    const p1 = [mx + dx * l1, my + dy * l1];
    if (bend) {
      const c = [mx + nx * bend, my + ny * bend];
      d += `M${pt(p0)}Q${pt(c)} ${pt(p1)}`;
    } else d += `M${pt(p0)}L${pt(p1)}`;
  }
  return d;
}

/**
 * Faisceau de traits interpolés entre des courbes guides (mêmes nombres de points) :
 * mèches de cheveux, plis, filets de barbe.
 */
export function strands(guides, n, r, { jit = 0.4, from = 0, to = 1, k = 1 } = {}) {
  let d = '';
  const segs = guides.length - 1;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : from + ((to - from) * i) / (n - 1);
    const g = Math.min(segs - 1, Math.floor(t * segs));
    const lt = t * segs - g;
    const A = guides[g];
    const B = guides[g + 1];
    const pts = A.map((p, j) => {
      const q = lerpPt(p, B[j], lt);
      return [q[0] + (r ? r.jit(jit) : 0), q[1] + (r ? r.jit(jit) : 0)];
    });
    d += smooth(pts, false, k);
  }
  return d;
}

/** Points échantillonnés sur une polyligne (abscisse curviligne régulière). */
export function sample(pts, n) {
  const L = [0];
  for (let i = 1; i < pts.length; i++)
    L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1];
  const out = [];
  for (let k = 0; k < n; k++) {
    const s = (total * k) / Math.max(1, n - 1);
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    const p = lerpPt(pts[i - 1], pts[i], t);
    const ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    out.push([p[0], p[1], ang]);
  }
  return out;
}
