/**
 * Grammaire des marques de Longuegrève (docs/scenario/affaire-3/09-marques.md, R1–R8) et leur dessin.
 *
 * Une marque se lit de haut en bas : tête (maison) → barre (enfant de mer) → entailles (rang,
 * générations) → grains (fille) → talon (épouse). Le code suit la **cote LX** de la bible (09 §2) :
 *   `Y` Fourche (Goémard) · `O` Œil (Oyard) · `A` Flèche (Cormaud) · `P` Potence (Lestaud)
 *   `-b` barre · `-g` / `-d` entaille à gauche / à droite · `-pt` / `-pt-pt` grain(s) · `-tX` talon.
 * La main de Marest (`A/`, `Y··`, `Y-g+P`…) est acceptée en entrée et ramenée à la cote LX.
 * Codes spéciaux des leurres : `mer` (D3, marque de mer, sans tête ; Marest `/`), `X` (D9, croix du
 * commis), et les deux gravures sans code `fourche-couronnee` (D10) et `ile` (D11).
 *
 * Gabarit (09-marques §6), en unités de dessin : pied de 100 ; tête dans les 25 du haut ; entailles
 * de 12 à 40, 55, 70 du haut (sous la barre : 55, 70, 85) ; grains à droite de la tête ; talon =
 * tête réduite sous le pied ; barre oblique bas-gauche → haut-droite à 35 du haut. Aucune courbe.
 * Minima de lisibilité (docs/game/AFFAIRE-3.md §1.7) : trait ≥ 6 unités, grain de 8 de diamètre,
 * 6 d'écart entre deux grains, talon séparé du pied de 6 unités au moins.
 *
 * API :
 *   parseMark(code)                        → structure { head, barred, cuts, grains, heel } (ou spéciale)
 *   markStrokes(code)                      → { strokes: [[x, y]…][], dots: [x, y, r][] } (repère : sommet du pied en 0, 0)
 *   renderMarkBody(code, { style, x, y, s, seed }) → fragment SVG (classes d'art seulement)
 *   describe(code)                         → description verbale normalisée (09-marques §2)
 * `style` : 'releve' (carnet de Marest : trait net, évasé), 'taillee' (bois : creux, ombre, reflet),
 *           'tracee' (registre : plume tremblée), 'gravure' (trait fin, creux hachuré : D10, D11).
 */
import { f, poly, circ, rng, hash } from '../portraits/lib.mjs';

export const HEADS = { Y: 'Fourche', O: 'Œil', A: 'Flèche', P: 'Potence' };
const SMALL = { Y: 'petite Fourche', O: 'petit Œil', A: 'petite Flèche', P: 'petite Potence' };

/* ───────────────────────── Lecture du code ───────────────────────── */

/** Main de Marest → cote LX (`A/+P` → `A-b-tP`, `Y··` → `Y-pt-pt`, `/` → `mer`). */
export function toLx(code) {
  if (code === '/') return 'mer';
  const m = /^([YOAP])(\/)?((?:-[gd])*)(·{0,2})(?:\+([YOAP]))?$/.exec(code);
  if (!m) return code;
  return [m[1], m[2] ? 'b' : null, ...(m[3].match(/[gd]/g) ?? []), ...Array(m[4].length).fill('pt'), m[5] ? `t${m[5]}` : null]
    .filter(Boolean)
    .join('-');
}

export function parseMark(code) {
  code = toLx(code);
  if (code === 'mer' || code === 'X' || code === 'fourche-couronnee' || code === 'ile') return { special: code };
  const m = /^([YOAP])(-b)?((?:-[gd])*)((?:-pt){0,2})(?:-t([YOAP]))?$/.exec(code);
  if (!m) throw new Error(`code de marque illisible : « ${code} »`);
  return {
    head: m[1],
    barred: !!m[2],
    cuts: (m[3].match(/-[gd]/g) ?? []).map((c) => c[1]),
    grains: m[4].length / 3,
    heel: m[5] ?? null,
  };
}

/** Description verbale normalisée : « [Tête] ; pied : … ; [grains] ; talon : … ». */
export function describe(code) {
  const k = parseMark(code);
  if (k.special === 'mer') return 'Pied barré, sans tête (marque de mer)';
  if (k.special === 'X') return 'Croix de Saint-André (deux traits obliques), sans pied';
  if (k.special === 'fourche-couronnee') return "Fourche sur pied lisse, surmontée d'une couronne à trois pointes";
  if (k.special === 'ile') return 'Un seul pied portant les quatre têtes superposées (Fourche, Œil, Flèche, Potence)';
  const parts = [HEADS[k.head]];
  const cuts = k.cuts.map((c, i) => `${i ? 'puis ' : ''}entaille à ${c === 'g' ? 'gauche' : 'droite'}`);
  if (k.barred) parts.push(`pied barré${cuts.length ? `, puis ${cuts.join(', ')}` : ''}`);
  else parts.push(cuts.length ? `pied : ${cuts.join(', ')}` : 'pied lisse');
  if (k.grains) parts.push(k.grains === 1 ? 'un grain' : 'deux grains');
  if (k.heel) parts.push(`talon : ${SMALL[k.heel]}`);
  return parts.join(' ; ');
}

/* ───────────────────────── Géométrie ───────────────────────── */

const L = 100; // pied
const HEAD = 25;
const HALF = 15; // demi-envergure des têtes
const CUT = 12;
const CUTS_AT = [40, 55, 70];
const CUTS_BARRED = [55, 70, 85];
const BAR_AT = 35;
const GRAIN = 4; // rayon

/** Tête de maison : traits droits, sommet du pied en (x, y), échelle s. Renvoie [strokes, footTop]. */
function head(h, x, y, s = 1) {
  const W = HALF * s;
  const H = HEAD * s;
  switch (h) {
    case 'Y': // deux branches en V au sommet du pied
      return [[[[x - W, y], [x, y + H * 0.9]], [[x + W, y], [x, y + H * 0.9]]], y + H * 0.9];
    case 'O': // losange fermé posé sur le pied
      return [[[[x, y], [x + W * 0.8, y + H * 0.48], [x, y + H * 0.96], [x - W * 0.8, y + H * 0.48], [x, y]]], y + H * 0.96];
    case 'A': // chevron pointe en haut coiffant le pied
      return [[[[x - W, y + H * 0.92], [x, y], [x + W, y + H * 0.92]]], y];
    case 'P': // trait horizontal à droite du sommet du pied
      return [[[[x, y], [x + W * 1.25, y]]], y];
    default:
      throw new Error(h);
  }
}

/** Traits et grains d'une marque ; repère : sommet du pied en (0, 0), pied vers le bas (y > 0). */
export function markStrokes(code) {
  const k = parseMark(code);
  const strokes = [];
  const dots = [];
  const thin = []; // talon : traits plus fins (tête au tiers)
  const shapes = []; // gravures : formes fermées (couronne)
  if (k.special === 'X') {
    const r = 17;
    strokes.push([[-r, 30], [r, 30 + 2 * r]], [[r, 30], [-r, 30 + 2 * r]]);
    return { strokes, dots, thin, shapes };
  }
  if (k.special === 'mer') {
    strokes.push([[0, 0], [0, L]]);
    strokes.push(bar());
    return { strokes, dots, thin, shapes };
  }
  if (k.special === 'fourche-couronnee') {
    const [hs, top] = head('Y', 0, 0);
    strokes.push(...hs, [[0, top], [0, L]]);
    // couronne à trois pointes, posée au-dessus des branches (une forme pleine du graveur)
    shapes.push([[-15, -5], [15, -5], [15, -21], [8, -12], [0, -26], [-8, -12], [-15, -21]]);
    return { strokes, dots, thin, shapes };
  }
  if (k.special === 'ile') {
    // un seul pied ; de haut en bas : Fourche, Œil, Flèche, Potence (table des quatre têtes)
    const s = 0.72;
    let y = 0;
    for (const h of ['Y', 'O', 'A', 'P']) {
      const [hs] = head(h, 0, y, s);
      strokes.push(...hs);
      y += HEAD * s + 6;
    }
    strokes.push([[0, HEAD * s * 0.9], [0, L + 6]]);
    return { strokes, dots, thin, shapes };
  }
  const [hs, footTop] = head(k.head, 0, 0);
  strokes.push(...hs, [[0, footTop], [0, L]]);
  if (k.barred) strokes.push(bar());
  const at = k.barred ? CUTS_BARRED : CUTS_AT;
  k.cuts.forEach((c, i) => strokes.push(c === 'g' ? [[-CUT, at[i]], [0, at[i]]] : [[0, at[i]], [CUT, at[i]]]));
  // grains : à droite de la tête (au-delà de la Potence pour P)
  // (grain de 8 de diamètre, 6 d'écart, à 6 du bout du trait le plus proche)
  const gx = (k.head === 'P' ? HALF * 1.25 : HALF) + 3 + 6 + GRAIN;
  if (k.grains === 1) dots.push([gx, 12, GRAIN]);
  if (k.grains === 2) dots.push([gx, 12 - GRAIN - 3, GRAIN], [gx, 12 + GRAIN + 3, GRAIN]);
  if (k.heel) {
    // talon : tête de la maison natale au tiers, sous le pied, sur un court pied à elle
    const s = 0.4;
    const y0 = L + 13; // 6 unités de blanc au moins entre le bout du pied et le talon
    const [ts, tTop] = head(k.heel, 0, y0, s);
    thin.push(...ts, [[0, tTop], [0, y0 + HEAD * s + 5]]);
  }
  return { strokes, dots, thin, shapes };
}

function bar() {
  return [[-9, BAR_AT + 6], [9, BAR_AT - 6]];
}

/* ───────────────────────── Rendu ───────────────────────── */

const unit = (a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
};

/** Trait taillé : quadrilatère évasé aux deux bouts (le couteau mord plus fort en entrant et en sortant). */
function flared(a, b, w, ext = 0.35) {
  const [ux, uy] = unit(a, b);
  const [nx, ny] = [-uy, ux];
  const e = w * ext;
  const A = [a[0] - ux * e, a[1] - uy * e];
  const B = [b[0] + ux * e, b[1] + uy * e];
  const M = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const we = w * 0.66;
  const wm = w * 0.46;
  return poly(
    orient([
      [A[0] + nx * we, A[1] + ny * we],
      [M[0] + nx * wm, M[1] + ny * wm],
      [B[0] + nx * we, B[1] + ny * we],
      [B[0] - nx * we, B[1] - ny * we],
      [M[0] - nx * wm, M[1] - ny * wm],
      [A[0] - nx * we, A[1] - ny * we],
    ]),
    true,
  );
}

/** Tous les polygones dans le même sens : sous la règle `nonzero`, les recouvrements restent pleins. */
function orient(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a < 0 ? pts.slice().reverse() : pts;
}

const segs = (stroke) => stroke.slice(1).map((p, i) => [stroke[i], p]);

/**
 * Fragment SVG d'une marque. (x, y) : sommet du pied ; s : échelle (unités de dessin → repère).
 * Les traits sont des formes pleines (`fill="currentColor"`), seule couleur admise hors classes.
 */
export function renderMarkBody(code, { style = 'releve', x = 0, y = 0, s = 1, seed = 'm' } = {}) {
  const { strokes, dots, thin, shapes } = markStrokes(code);
  const T = ([px, py]) => [x + px * s, y + py * s];
  const r = rng(hash(`${seed}:${code}:${style}`));
  const out = [];
  const ink = (cls, d, extra = '') => out.push(`<path class="${cls}" d="${d}" fill="currentColor"${extra}/>`);
  if (style === 'releve' || style === 'taillee') {
    const w = 6.2 * s;
    let d = '';
    for (const st of strokes) for (const [a, b] of segs(st)) d += flared(T(a), T(b), w);
    for (const st of thin) for (const [a, b] of segs(st)) d += flared(T(a), T(b), w * 0.72);
    let g = '';
    for (const [dx, dy, rr] of dots) {
      const [cx, cy] = T([dx, dy]);
      g += circ(cx, cy, rr * s);
    }
    if (style === 'taillee') {
      // creux dans le bois : fond sombre, lèvre éclairée en bas à droite, ombre portée en haut à gauche
      const off = 0.9 * s;
      let lip = '';
      for (const st of strokes) for (const [a, b] of segs(st)) lip += flared(T([a[0] + off, a[1] + off]), T([b[0] + off, b[1] + off]), w);
      for (const st of thin) for (const [a, b] of segs(st)) lip += flared(T([a[0] + off, a[1] + off]), T([b[0] + off, b[1] + off]), w * 0.72);
      out.push(`<path class="rehaut" d="${lip}"/>`);
      ink('ink', d + g, ' stroke-width=".3"');
      out.push(`<path class="ombre" d="${d}"/>`);
    } else {
      ink('ink', d + g, ' stroke-width=".3"');
    }
    return out.join('');
  }
  if (style === 'tracee') {
    // plume de qui ne sait pas écrire : trait appuyé, tremblé, reprises
    let d = '';
    for (const st of [...strokes, ...thin]) {
      for (const [a, b] of segs(st)) {
        const n = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          pts.push([a[0] + (b[0] - a[0]) * t + r.jit(0.9), a[1] + (b[1] - a[1]) * t + r.jit(0.9)]);
        }
        d += poly(pts.map(T));
      }
    }
    out.push(`<path class="ink" d="${d}" stroke-width="${f(6 * s)}"/>`);
    let g = '';
    for (const [dx, dy, rr] of dots) {
      const [cx, cy] = T([dx + r.jit(0.6), dy + r.jit(0.6)]);
      g += circ(cx, cy, rr * s);
    }
    if (g) ink('ink', g, ' stroke-width=".3"');
    return out.join('');
  }
  if (style === 'gravure') {
    // trait fin et régulier du graveur : creux cerné, rempli de hachures
    const w = 6 * s;
    let d = '';
    for (const st of strokes) for (const [a, b] of segs(st)) d += rectSeg(T(a), T(b), w);
    for (const sh of shapes) d += poly(orient(sh.map(T)), true);
    out.push(`<path class="paper" d="${d}"/>`, `<path class="hatch-dense" d="${d}"/>`, `<path class="ink" d="${d}" stroke-width="${f(0.55 * Math.max(1, s))}"/>`);
    return out.join('');
  }
  throw new Error(`style inconnu : ${style}`);
}

/** Trait de graveur : rectangle régulier (bouts droits). */
function rectSeg(a, b, w) {
  const [ux, uy] = unit(a, b);
  const [nx, ny] = [-uy * w * 0.5, ux * w * 0.5];
  const e = w * 0.2;
  const A = [a[0] - ux * e, a[1] - uy * e];
  const B = [b[0] + ux * e, b[1] + uy * e];
  return poly(orient([[A[0] + nx, A[1] + ny], [B[0] + nx, B[1] + ny], [B[0] - nx, B[1] - ny], [A[0] - nx, A[1] - ny]]), true);
}
