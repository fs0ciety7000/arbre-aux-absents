/**
 * Scène SVG d'illustration : accumulateur de chemins colorés par classes d'art uniquement
 * (DESIGN.md §10), ids préfixés par le nom du fichier (règle 8), et objets récurrents
 * (montage photo, texte illisible, fougère, phare, mer, arbres, foule).
 *
 * Trois rendus :
 *  - 'photo' : tirage argentique viré (photo-paper/-light/-mid/-dark), trame #art-stipple ;
 *  - 'engr'  : gravure au trait (paper, ink, #art-hatch / #art-hatch-dense), sans lavis ;
 *  - 'color' : taille-douce rehaussée de lavis (paper + wash-*, skin-*, hair-*).
 */
import { circ, clamp, ell, f, hash, hatchLines, lerp, poly, rect, rng, smooth, textLines } from './lib.mjs';

const PHOTO = { paper: 'photo-paper', light: 'photo-light', mid: 'photo-mid', dark: 'photo-dark' };

export class Scene {
  constructor(id, w, h, mode = 'photo') {
    this.id = id;
    this.w = w;
    this.h = h;
    this.mode = mode;
    this.defs = [];
    this.out = [];
    this.n = 0;
    this.r = rng(hash(id));
  }
  uid(tag = '') {
    return `${this.id}-${tag}${(this.n++).toString(36)}`;
  }
  push(...xs) {
    for (const x of xs) if (x) this.out.push(x);
    return this;
  }
  /** Chemin d'une classe d'art. */
  p(cls, d, a = {}) {
    if (!d) return this;
    const at = Object.entries(a)
      .filter(([, v]) => v !== undefined && v !== null && v !== false)
      .map(([k, v]) => ` ${k}="${typeof v === 'number' ? f(v) : v}"`)
      .join('');
    this.out.push(`<path class="${cls}" d="${d}"${at}/>`);
    return this;
  }
  /** Trait : `ink` (contour), `ink-soft` (détail), `ink-faint` (ombre). */
  ln(d, w, cls = 'ink-soft', a = {}) {
    return this.p(cls, d, { 'stroke-width': w === undefined ? undefined : Math.max(0.5, w), ...a });
  }
  /** Aplat noir d'encre. */
  black(d, a = {}) {
    return this.p('ink', d, { fill: 'currentColor', stroke: 'none', ...a });
  }
  /**
   * Aplat d'une valeur. `tone` : 'paper' | 'light' | 'mid' | 'dark' | 'black'
   * ou objet { p: valeur photo/gravure, c: classe couleur (wash-*, skin-*, hair-*, water…) }.
   */
  fill(d, tone, a = {}) {
    if (!d || !tone) return this;
    const t = typeof tone === 'string' ? { p: tone, c: tone } : tone;
    if (this.mode === 'photo') {
      const v = t.p ?? 'mid';
      if (v === 'black') return this.black(d, a);
      if (v === 'none') return this;
      return this.p(PHOTO[v] ?? v, d, a);
    }
    if (this.mode === 'color' && t.c && !(t.c in PHOTO) && t.c !== 'black') {
      if (/^(wash-|water)/.test(t.c) && !a.noPaper) this.p('paper', d, {});
      const { noPaper, ...rest } = a;
      void noPaper;
      return this.p(t.c, d, rest);
    }
    // gravure (et couleur sans pigment) : papier + hachures
    const v = t.p ?? t.c ?? 'mid';
    const { noPaper, ...rest } = a;
    void noPaper;
    if (v === 'black') return this.black(d, rest);
    if (v === 'none') return this;
    if (v === 'paper' || v === 'light') return this.p('paper', d, rest);
    if (v === 'mid') return this.p('paper', d, rest).p('hatch', d, rest);
    return this.p('paper', d, rest).p('hatch-dense', d, rest);
  }
  stip(d, a = {}) {
    return this.p('stipple', d, a);
  }
  hat(d, a = {}) {
    return this.p('hatch', d, a);
  }
  hatd(d, a = {}) {
    return this.p('hatch-dense', d, a);
  }
  clip(d) {
    const id = this.uid('c');
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return id;
  }
  open(a = {}) {
    const at = Object.entries(a)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    this.out.push(`<g${at}>`);
    return this;
  }
  close() {
    this.out.push('</g>');
    return this;
  }
  /** Dessine `fn` rogné par `d`. */
  within(d, fn) {
    const id = this.clip(d);
    this.open({ 'clip-path': `url(#${id})` });
    fn();
    return this.close();
  }
  /** Hachures dessinées à la main dans une région (angle en degrés). */
  hatchIn(d, box, angle, sp, w = 0.5, cls = 'ink-faint') {
    return this.within(d, () => this.ln(hatchLines(box, angle, sp, this.r), w, cls));
  }
  toString() {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="0 0 ${this.w} ${this.h}" role="img">${defs}${this.out.join('')}</svg>\n`;
  }
}

/* ───────────────────────── Supports ───────────────────────── */

/**
 * Tirage monté sur carton : carton (paper-shade ou photo-light), filet doré (double filet),
 * fenêtre de tirage. Rend la fenêtre (x, y, w, h) et son `d`.
 */
export function mount(S, { card = true, m = 22, mb = 0, cardTone = 'paper-shade', gilt = true, round = 0, inset } = {}) {
  const W = S.w;
  const H = S.h;
  if (card) {
    S.p(cardTone, rect(0, 0, W, H));
    S.ln(rect(3, 3, W - 6, H - 6), 0.6, 'ink-faint');
  }
  const x = inset?.x ?? m;
  const y = inset?.y ?? m;
  const w = inset?.w ?? W - 2 * m;
  const h = inset?.h ?? H - 2 * m - mb;
  const d = round
    ? `M${x + round} ${y}h${w - 2 * round}q${round} 0 ${round} ${round}v${h - 2 * round}q0 ${round} -${round} ${round}h-${w - 2 * round}q-${round} 0 -${round} -${round}v-${h - 2 * round}q0 -${round} ${round} -${round}Z`
    : rect(x, y, w, h);
  if (card && gilt) {
    S.ln(rect(x - 5, y - 5, w + 10, h + 10), 0.6, 'ink-soft');
    S.ln(rect(x - 3, y - 3, w + 6, h + 6), 0.5, 'ink-faint');
  }
  return { x, y, w, h, d };
}

/** Bords usés d'un tirage : voile sombre en couronne + taches (coins mangés). */
export function wear(S, win, { edge = 10, spots = 6, corners = [], tone = 'mid' } = {}) {
  const { x, y, w, h } = win;
  const r = S.r;
  if (edge > 0) {
    const ring = `${rect(x, y, w, h)}${rect(x + edge, y + edge, w - 2 * edge, h - 2 * edge)}`;
    S.p('stipple', ring, { 'fill-rule': 'evenodd', opacity: 0.8 });
  }
  for (let i = 0; i < spots; i++) {
    const sx = x + r() * w;
    const sy = y + r() * h;
    S.p('photo-light', ell(sx, sy, r.range(1.5, 4), r.range(1, 3)), { opacity: 0.7 });
  }
  for (const c of corners) {
    const cx = c[0] ? x + w : x;
    const cy = c[1] ? y + h : y;
    const sx = c[0] ? -1 : 1;
    const sy = c[1] ? -1 : 1;
    const R = c[2] ?? 30;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      const rr = R * (0.65 + 0.35 * r());
      pts.push([cx + sx * Math.cos(a) * rr, cy + sy * Math.sin(a) * rr]);
    }
    const d = poly([[cx, cy], ...pts], true);
    S.fill(d, tone, { opacity: 0.55 });
    S.stip(d);
  }
}

/** Bloc de texte imprimé illisible (gris typographique). */
export function printBlock(S, x, y, w, n, lh, o = {}) {
  const { cls = 'ink-faint', sw = Math.max(0.5, lh * 0.32), ...rest } = o;
  S.ln(textLines(S.r, x, y, w, n, lh, rest), sw, cls, { 'stroke-linecap': 'butt' });
}

/** Titre en capitales illisible : barres épaisses avec empattements. */
export function headline(S, x, y, w, h, { cls = 'ink', align = 'center', words = 3 } = {}) {
  const r = S.r;
  let d = '';
  const ww = [];
  for (let i = 0; i < words; i++) ww.push(r.range(0.6, 1.4));
  const tot = ww.reduce((a, b) => a + b, 0);
  const gap = h * 0.6;
  const scale = (w - gap * (words - 1)) / tot;
  let cx = align === 'center' ? x : x;
  for (const k of ww) {
    const len = k * scale;
    // lettres : petits blocs verticaux serrés
    const nL = Math.max(2, Math.round(len / (h * 0.62)));
    const lw = len / nL;
    for (let j = 0; j < nL; j++) {
      const lx = cx + j * lw;
      const shape = r.int(0, 3);
      if (shape === 0) d += `M${f(lx + lw * 0.15)} ${f(y + h)}v${f(-h)}h${f(lw * 0.55)}`;
      else if (shape === 1) d += `M${f(lx + lw * 0.15)} ${f(y)}v${f(h)}M${f(lx + lw * 0.7)} ${f(y)}v${f(h)}M${f(lx + lw * 0.15)} ${f(y + h / 2)}h${f(lw * 0.55)}`;
      else if (shape === 2) d += `M${f(lx + lw * 0.1)} ${f(y + h)}l${f(lw * 0.35)} ${f(-h)}l${f(lw * 0.35)} ${f(h)}`;
      else d += `M${f(lx + lw * 0.7)} ${f(y)}h${f(-lw * 0.55)}v${f(h)}h${f(lw * 0.55)}`;
    }
    cx += len + gap;
  }
  S.ln(d, Math.max(0.6, h * 0.16), cls, { 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' });
}

/* ───────────────────────── Fougère (filigrane, herbier, broche) ───────────────────────── */

/**
 * Fronde de fougère royale stylisée : tige depuis (x, y) vers le haut (angle en degrés,
 * 0 = vertical), `pairs` paires de pinnules. Rend { stem, pinnae: [d…], tipY }.
 */
export function fern(x, y, len, { angle = 0, pairs = 11, spread = 0.42, leaf = 0.5, curve = 0.06, alt = false } = {}) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const nx = -uy;
  const ny = ux;
  const at = (t) => {
    const bend = Math.sin(t * Math.PI) * curve * len;
    return [x + ux * len * t + nx * bend, y + uy * len * t + ny * bend];
  };
  const stemPts = [];
  for (let i = 0; i <= 10; i++) stemPts.push(at(i / 10));
  const pinnae = [];
  for (let i = 0; i < pairs; i++) {
    const t = 0.12 + (0.84 * i) / pairs;
    const L = len * spread * (1 - 0.72 * Math.pow(t, 1.3)) * (i === 0 ? 0.8 : 1);
    for (const side of [-1, 1]) {
      const tt = alt && side > 0 ? t + 0.5 / pairs : t;
      const [px, py] = at(tt);
      // pinnule : feuille allongée, inclinée vers la pointe
      const ang = a + side * 1.05;
      const dx = Math.sin(ang);
      const dy = -Math.cos(ang);
      const tip = [px + dx * L, py + dy * L];
      const wv = L * 0.16 * (leaf / 0.5);
      const m1 = [px + dx * L * 0.5 - dy * wv, py + dy * L * 0.5 + dx * wv];
      const m2 = [px + dx * L * 0.5 + dy * wv, py + dy * L * 0.5 - dx * wv];
      pinnae.push(smooth([[px, py, 1], m1, [tip[0], tip[1], 1], m2], true, 0.9));
    }
  }
  const tip = at(1);
  return { stem: smooth(stemPts), pinnae, tip, base: [x, y] };
}

/* ───────────────────────── Paysage et architecture ───────────────────────── */

/** Lignes d'eau horizontales (mer, lac). */
export function waterLines(S, x0, y0, x1, y1, { sp = 4, w = 0.5, cls = 'ink-faint', grow = 1.6, dash = true } = {}) {
  const r = S.r;
  let d = '';
  let y = y0;
  let k = 0;
  while (y < y1) {
    let x = x0 + r.range(-10, 0);
    while (x < x1) {
      const l = dash ? r.range(8, 30) * (0.6 + (k / 30) * grow) : x1 - x;
      d += `M${f(x)} ${f(y)}q${f(l / 2)} ${f(r.jit(0.8))} ${f(l)} 0`;
      x += l + r.range(3, 12);
    }
    y += sp * (1 + k * 0.04 * grow);
    k++;
  }
  S.ln(d, w, cls);
}

/** Phare : tour conique, bande, galerie, lanterne. Rend la géométrie utile. */
export function lighthouse(S, x, baseY, h, { band = 'dark', lit = false, beam = false, wTop = 0.11, wBase = 0.16, gallery = true, line = 1 } = {}) {
  const tw = h * wTop;
  const bw = h * wBase;
  const topY = baseY - h;
  const tower = poly([[x - bw / 2, baseY], [x - tw / 2, topY], [x + tw / 2, topY], [x + bw / 2, baseY]], true);
  S.fill(tower, { p: 'paper', c: 'paper' });
  // ombre côté droit
  const shade = poly([[x + bw * 0.12, baseY], [x + tw * 0.1, topY], [x + tw / 2, topY], [x + bw / 2, baseY]], true);
  S.hat(shade);
  // bande
  const b0 = topY + h * 0.38;
  const b1 = topY + h * 0.55;
  const wAt = (yy) => lerp(tw, bw, (yy - topY) / h) / 2;
  const bandD = poly([[x - wAt(b0), b0], [x + wAt(b0), b0], [x + wAt(b1), b1], [x - wAt(b1), b1]], true);
  if (band === 'red') S.fill(bandD, { p: 'dark', c: 'wash-carmin' });
  else if (band === 'hatch') S.p('paper', bandD).hatd(bandD);
  else S.fill(bandD, 'dark');
  S.ln(tower, 1.1 * line, 'ink');
  S.ln(`M${f(x - wAt(b0))} ${f(b0)}H${f(x + wAt(b0))}M${f(x - wAt(b1))} ${f(b1)}H${f(x + wAt(b1))}`, 0.7 * line, 'ink-soft');
  // fenêtres
  for (const t of [0.25, 0.68, 0.84]) {
    const yy = topY + h * t;
    S.fill(rect(x - h * 0.012, yy, h * 0.024, h * 0.05), 'dark');
  }
  // galerie + lanterne
  const gy = topY;
  const gw = tw * 1.5;
  const lw = tw * 0.72;
  const lh = h * 0.12;
  if (gallery) {
    S.fill(rect(x - gw / 2, gy - h * 0.018, gw, h * 0.022), 'dark');
    S.ln(`M${f(x - gw / 2)} ${f(gy - h * 0.06)}H${f(x + gw / 2)}` + Array.from({ length: 7 }, (_, i) => `M${f(x - gw / 2 + (gw * i) / 6)} ${f(gy - h * 0.06)}V${f(gy - h * 0.018)}`).join(''), 0.6 * line, 'ink-soft');
  }
  const lan = rect(x - lw / 2, gy - h * 0.018 - lh, lw, lh);
  S.fill(lan, lit ? { p: 'light', c: 'wash-safran' } : 'mid');
  S.ln(lan + `M${f(x)} ${f(gy - h * 0.018 - lh)}V${f(gy - h * 0.018)}`, 0.7 * line, 'ink-soft');
  const roof = poly([[x - lw * 0.62, gy - h * 0.018 - lh], [x, gy - h * 0.018 - lh - h * 0.06], [x + lw * 0.62, gy - h * 0.018 - lh]], true);
  S.fill(roof, 'dark');
  S.ln(roof, 0.8 * line, 'ink');
  const lampY = gy - h * 0.018 - lh / 2;
  if (beam) {
    const L = typeof beam === 'number' ? beam : h * 2.2;
    for (const side of beam === 'right' ? [1] : [-1, 1]) {
      const d = poly([[x, lampY - lh * 0.15], [x + side * L, lampY - L * 0.12], [x + side * L, lampY + L * 0.1], [x, lampY + lh * 0.15]], true);
      S.fill(d, { p: 'light', c: 'wash-safran' }, { opacity: 0.55, noPaper: true });
    }
  }
  return { topY, lampY, gallery: [x - gw / 2, x + gw / 2, gy], bw, tw };
}

/** Feuillage (tilleul, aulne, hêtre) : masses bosselées, ombre au pinceau et trame. */
export function foliage(S, cx, cy, rx, ry, { tone = 'mid', lumps = 14, shade = true, light = 'left', color = 'wash-sauge' } = {}) {
  const r = S.r;
  const pts = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const k = 0.82 + 0.25 * r();
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // contour festonné : arcs entre points
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i <= lumps; i++) {
    const p = pts[i % lumps];
    const rr = Math.max(rx, ry) / lumps * 2.2;
    d += `A${f(rr)} ${f(rr)} 0 0 1 ${f(p[0])} ${f(p[1])}`;
  }
  d += 'Z';
  S.fill(d, { p: tone, c: color });
  if (shade) {
    const sx = light === 'left' ? 1 : -1;
    const sh = ell(cx + sx * rx * 0.25, cy + ry * 0.2, rx * 0.8, ry * 0.75);
    S.within(d, () => {
      S.fill(sh, 'dark', { opacity: 0.45 });
      S.stip(sh);
    });
  }
  // touches de feuilles
  let leaves = '';
  for (let i = 0; i < lumps * 3; i++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.85;
    const lx = cx + Math.cos(a) * rx * rr;
    const ly = cy + Math.sin(a) * ry * rr;
    leaves += `M${f(lx)} ${f(ly)}q${f(rx * 0.05)} ${f(-ry * 0.06)} ${f(rx * 0.1)} 0`;
  }
  S.ln(leaves, 0.6, 'ink-faint');
  S.ln(d, 0.8, 'ink-soft');
  return d;
}

/** Foule floue : têtes et épaules sans traits (pour les arrière-plans). */
export function crowd(S, x0, x1, y, n, size, { tone = 'mid', hats = 0.5, rows = 1, blur = true } = {}) {
  const r = S.r;
  let body = '';
  let heads = '';
  let hatsD = '';
  for (let row = 0; row < rows; row++) {
    const yy = y + row * size * 0.9;
    const s = size * (1 + row * 0.15);
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + 0.5 + r.jit(0.3)) / n);
      const hy = yy + r.jit(s * 0.15);
      heads += ell(x, hy, s * 0.32, s * 0.4);
      body += `M${f(x - s * 0.8)} ${f(hy + s * 2)}Q${f(x - s * 0.75)} ${f(hy + s * 0.5)} ${f(x)} ${f(hy + s * 0.45)}Q${f(x + s * 0.75)} ${f(hy + s * 0.5)} ${f(x + s * 0.8)} ${f(hy + s * 2)}Z`;
      if (r() < hats) hatsD += ell(x, hy - s * 0.32, s * 0.5, s * 0.12) + ell(x, hy - s * 0.42, s * 0.3, s * 0.15);
    }
  }
  S.fill(body, tone === 'mid' ? 'dark' : tone, { opacity: blur ? 0.55 : 1 });
  S.fill(heads, 'mid', { opacity: blur ? 0.7 : 1 });
  if (hatsD) S.fill(hatsD, tone === 'light' ? 'paper' : 'light', { opacity: blur ? 0.75 : 1 });
  if (blur) S.stip(body);
}

/** Récifs pointus (les Dents de Tennok). */
export function reefs(S, x0, x1, y, h, n, { tone = 'dark', foam = true } = {}) {
  const r = S.r;
  let d = '';
  let foamD = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + r.range(0.2, 0.8)) / n);
    const w = ((x1 - x0) / n) * r.range(0.4, 0.8);
    const hh = h * r.range(0.5, 1.2);
    d += poly([[x - w / 2, y], [x - w * 0.15, y - hh * 0.8], [x + r.jit(w * 0.1), y - hh], [x + w * 0.2, y - hh * 0.6], [x + w / 2, y]], true);
    foamD += `M${f(x - w * 0.8)} ${f(y + r.jit(1))}q${f(w * 0.4)} ${f(-h * 0.25)} ${f(w * 0.8)} ${f(r.jit(1))}q${f(w * 0.4)} ${f(-h * 0.2)} ${f(w * 0.8)} 0`;
  }
  S.fill(d, tone);
  S.hatd(d, { opacity: 0.5 });
  S.ln(d, 0.8, 'ink');
  if (foam) S.ln(foamD, 0.8, 'ink-faint');
}

export { circ, clamp, ell, f, lerp, poly, rect, smooth };
