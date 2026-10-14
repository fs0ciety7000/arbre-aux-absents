/**
 * Boîte à outils de l'art clé (sans dépendance, déterministe).
 * Même PRNG (mulberry32) et même lissage (Catmull-Rom) que art/tools/illustrations/lib.mjs,
 * plus une petite algèbre affine pour calculer les origines de transformation des groupes animés.
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
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const TAU = Math.PI * 2;

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

/** Rectangle à coins arrondis. */
export function rrect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}v${f(h - 2 * r)}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(r)}h${f(-(w - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(-r)} ${f(-r)}v${f(-(h - 2 * r))}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}Z`;
}

export function circ(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

export function ell(cx, cy, rx, ry) {
  return `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
}

/** Arc d'ellipse ouvert (angles en radians, sens trigonométrique de l'écran). */
export function arc(cx, cy, rx, ry, a0, a1, n = 12) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return smooth(pts);
}

/** Points d'une ellipse. */
export function ellPts(cx, cy, rx, ry, n = 16, a0 = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (TAU * i) / n;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** Contour tremblé d'une ellipse (tache d'aquarelle, cachet de cire). */
export function blob(r, cx, cy, rx, ry, { n = 18, amp = 0.08 } = {}) {
  const pts = ellPts(cx, cy, rx, ry, n).map(([x, y]) => {
    const k = 1 + r.jit(amp);
    return [cx + (x - cx) * k, cy + (y - cy) * k];
  });
  return smooth(pts, true);
}

/** Tube (tige, ficelle, anse) autour d'une polyligne, largeur w0 → w1. */
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

/** Lignes de texte illisible (mots en tirets). */
export function textLines(r, x, y, w, n, lh, { word = [3, 9], gap = 1.6, last = 0.6 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * r.range(last * 0.6, last) : w * r.range(0.85, 1);
    const yy = y + i * lh;
    let cx = x;
    while (cx < x + lw - word[0]) {
      const ww = Math.min(r.range(word[0], word[1]), x + lw - cx);
      d += `M${f(cx)} ${f(yy)}h${f(ww)}`;
      cx += ww + gap;
    }
  }
  return d;
}

/** Écriture manuscrite illisible : guirlandes de boucles. */
export function handLines(
  r,
  x,
  y,
  w,
  n,
  lh,
  { h = 2.2, step = 2.4, last = 0.55, slant = 0.25 } = {},
) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * last : w * r.range(0.86, 1);
    const yy = y + i * lh;
    let cx = x;
    d += `M${f(cx)} ${f(yy)}`;
    while (cx < x + lw) {
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

/* ───────────── Algèbre affine (origines des groupes animés) ───────────── */

/** Matrice [a b c d e f] (comme SVG). */
export const I = [1, 0, 0, 1, 0, 0];
export function mul(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
export const T = (x, y) => [1, 0, 0, 1, x, y];
export const S = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];
export const R = (deg) => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
};
export function apply(m, [x, y]) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
export function matStr(m) {
  return `matrix(${m.map((v, i) => (i < 4 ? String(Math.round(v * 10000) / 10000) : f(v))).join(' ')})`;
}

/* ───────────── Constructeur de SVG (classes d'art seulement) ───────────── */

export class Svg {
  /**
   * @param {string} id préfixe des ids (= nom du fichier sans extension)
   * @param {number} w largeur de la viewBox
   * @param {number} h hauteur de la viewBox
   * @param {{ x?: number, y?: number, title?: string, desc?: string }} [o]
   */
  constructor(id, w, h, o = {}) {
    this.id = id;
    this.w = w;
    this.h = h;
    this.x = o.x ?? 0;
    this.y = o.y ?? 0;
    this.title = o.title ?? '';
    this.desc = o.desc ?? '';
    this.defs = [];
    this.out = [];
    this.n = 0;
    this.r = rng(hash(id));
    this.m = I; // matrice courante (suivie pour les origines)
    this.stack = [];
  }
  uid(tag = '') {
    return `${this.id}-${tag}${(this.n++).toString(36)}`;
  }
  raw(s) {
    this.out.push(s);
    return this;
  }
  comment(s) {
    this.out.push(`<!-- ${s.replace(/--/g, '—')} -->`);
    return this;
  }
  /** Chemin d'une classe d'art (ou sans classe si cls vide). */
  p(cls, d, a = {}) {
    if (!d) return this;
    // trait à tracer : un id propre l'empêche d'être fusionné par svgo (mergePaths)
    if (a.pathLength !== undefined && !a.id) a = { id: this.uid('draw-'), ...a };
    const at = attrs(a);
    this.out.push(`<path${cls ? ` class="${cls}"` : ''} d="${d}"${at}/>`);
    return this;
  }
  /** Trait : `ink` (contour), `ink-soft` (détail), `ink-faint` (ombre). */
  ln(d, w, cls = 'ink-soft', a = {}) {
    return this.p(cls, d, { 'stroke-width': w === undefined ? undefined : Math.max(0.5, w), ...a });
  }
  /** Aplat d'encre. */
  black(d, a = {}) {
    return this.p('ink', d, { fill: 'currentColor', 'stroke-width': 0.5, ...a });
  }
  /** Papier + lavis (+ second lavis optionnel). */
  wash(d, c1, c2, a = {}) {
    this.p('paper', d, a);
    if (c1) this.p(c1, d, a);
    if (c2) this.p(c2, d, a);
    return this;
  }
  hatchIn(d, box, angle, sp, w = 0.5, cls = 'ink-faint') {
    return this.within(d, () => this.ln(hatchLines(box, angle, sp, this.r), w, cls));
  }
  clip(d) {
    const id = this.uid('c');
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return id;
  }
  /** Dessine `fn` rogné par `d` (dans le repère courant). */
  within(d, fn) {
    const id = this.clip(d);
    this.open({ 'clip-path': `url(#${id})` });
    fn();
    return this.close();
  }
  /** Ouvre un groupe ; `m` = matrice locale (suivie). */
  open(a = {}, m) {
    const at = { ...a };
    if (m) at.transform = matStr(m);
    this.out.push(`<g${attrs(at)}>`);
    this.stack.push(this.m);
    if (m) this.m = mul(this.m, m);
    return this;
  }
  close() {
    this.out.push('</g>');
    this.m = this.stack.pop() ?? I;
    return this;
  }
  /** Groupe placé : translate(x y) rotate(a) scale(sx sy). */
  at(x, y, { rot = 0, s = 1, sy, flat = 0, id, cls } = {}, fn) {
    // flat : écrasement vertical (vue de trois quarts) appliqué après la rotation
    let m = mul(T(x, y), S(1, 1 - flat));
    m = mul(m, R(rot));
    m = mul(m, S(s, sy ?? s));
    this.open({ id, class: cls }, m);
    fn();
    return this.close();
  }
  /** Point local → repère de la viewBox. */
  world(p) {
    return apply(this.m, p);
  }
  toString() {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    const t = this.title ? `<title>${esc(this.title)}</title>` : '';
    const ds = this.desc ? `<desc>${esc(this.desc)}</desc>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${f(this.x)} ${f(this.y)} ${f(this.w)} ${f(this.h)}" role="img">${t}${ds}${defs}${this.out.join('')}</svg>\n`;
  }
}

function attrs(a) {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? f(v) : v}"`)
    .join('');
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
