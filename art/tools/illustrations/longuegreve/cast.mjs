/**
 * Distribution et objets marqués de l'affaire 3 (`marques-de-longuegreve`).
 *
 * Visages : chaque personne des photographies est tirée du générateur des portraits
 * (art/tools/portraits/people-longuegreve.mjs) ; pour un âge donné, on part du dessin de la galerie
 * le plus proche (portrait de case, autre âge ou visage hors case), puis `atAge` et les retouches
 * ci-dessous. Traits héréditaires (04-personnages.md) : jamais retirés par une retouche.
 *
 * Marques : `carve()` pose une marque sur son support avec le dessin de art/tools/marques/marks.mjs
 * (rendus `taillee` pour le bois et la pierre, `gravure` pour le bronze et l'imprimé, `releve` pour le
 * carnet). Le code n'est **jamais** écrit à côté (09-marques §2) : seules les planches CN-01 et CN-02
 * portent des cotes LX au crayon, posées par papers.mjs.
 */
import { extra as famExtra, fam, garmentTone, lower, person, resolveSpec, BY_ID } from '../fam.mjs';
import { hand } from '../people.mjs';
import { ell, f, poly, rect, smooth, tube } from '../lib.mjs';
import { renderMarkBody } from '../../marques/marks.mjs';

/** Personnes hors galerie (leurres) : nom court → nom de travail. */
const FIXED = {
  leandre9: 'lg-leurre-leandre-9',
  fontanet: 'lg-leurre-fontanet',
  berthe: 'lg-leurre-berthe-marie',
  tenier: 'lg-leurre-tenier',
};

/** Dessin de départ : le plus proche en âge parmi les dessins `lg-<nom>-<âge>` de la galerie. */
export function baseId(key, age) {
  if (FIXED[key]) return FIXED[key];
  const re = new RegExp(`^lg-${key}-\\d+$`);
  const all = Object.keys(BY_ID).filter((id) => re.test(id));
  if (!all.length) throw new Error(`personne inconnue : ${key}`);
  return all.sort((a, b) => Math.abs(BY_ID[a].age - age) - Math.abs(BY_ID[b].age - age) || BY_ID[a].age - BY_ID[b].age)[0];
}

/** Retouches par âge : [âge maximal, patch], la première qui couvre l'âge s'applique. */
const AGES = {
  victoire: [[8, { hairStyle: 'bob', hairOpt: { len: 0.5 }, clothes: { type: 'dress', wash: 'paper', neck: 'round' } }]],
  lazare: [[14, { hands: [], clothes: { type: 'smock', wash: 'wash-ardoise' } }]],
  clement: [[16, { hands: [], extras: [], clothes: { type: 'smock', wash: 'wash-indigo', dark: 'hatch' } }], [99, { hands: [] }]],
  gatien: [[18, { moustache: null, clothes: { type: 'smock', wash: 'wash-sienne', dark: 'hatch' } }]],
  leontine: [[99, { hands: [] }]],
  noel: [[48, { moustache: { style: 'short', cls: 'hair-gris' } }]],
  sidonie: [[99, { extras: [] }]],
};

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) out[k] = merge(a[k], v);
    else out[k] = v;
  }
  return out;
}

export function agePatch(key, age, patch = {}) {
  const hit = (AGES[key] ?? []).find(([max]) => age <= max);
  return merge(hit ? hit[1] : {}, patch);
}

/** Personnage en pied (bas du corps + buste raccordé). `o.patch` s'ajoute aux retouches d'âge. */
export function lg(S, key, age, x, y, s, o = {}) {
  return person(S, baseId(key, age), age, x, y, s, { seam: true, ...o, patch: agePatch(key, age, o.patch) });
}

/** Buste seul. */
export function lgBust(S, key, age, x, y, s, o = {}) {
  return fam(S, baseId(key, age), age, x, y, s, { ...o, patch: agePatch(key, age, o.patch) });
}

/** Valeur du vêtement porté (pour un corps dessiné à part, raccordé par `lower: false, seam`). */
export function garment(key, age, patch) {
  return garmentTone(resolveSpec(baseId(key, age), age, { patch: agePatch(key, age, patch) }));
}

/** Figurant en pied, sans trait de famille (raccord sans couture). */
export function extra(S, spec, x, y, s, o = {}) {
  return famExtra(S, spec, x, y, s, { seam: true, ...o });
}

/** Ramasseur, marin ou ouvrier figurant (aucun trait de famille), varié par `k`. */
export function islander(k, o = {}) {
  const hair = ['brun', 'chatain', 'noir', 'gris', 'brun', 'chatain'][k % 6];
  return {
    sex: 'm',
    age: o.age ?? 22 + ((k * 7) % 34),
    skin: 2 + (k % 2),
    hair,
    W: 23.5 + (k % 3),
    H: 36 + (k % 2),
    jaw: 0.5 + (k % 4) * 0.1,
    cheek: 0.3 + (k % 3) * 0.15,
    brows: { thick: 0.9 + (k % 3) * 0.2, arch: 0.4 },
    eyes: { gaze: ((k % 5) - 2) * 0.05 },
    nose: { proj: 1 + (k % 3) * 0.08, width: 1 + (k % 2) * 0.12 },
    mouth: { full: 0.4, smile: (k % 4) * 0.12 },
    marks: { noLipColor: true },
    hairStyle: ['short', 'cropped', 'sidePart'][k % 3],
    moustache: k % 3 === 1 ? { style: k % 2 ? 'full' : 'short' } : null,
    beard: k % 5 === 3 ? { style: 'short' } : null,
    hat: o.hat === false ? null : k % 3 === 0 ? { type: 'flatcap', cls: 'paper-shade' } : null,
    clothes: o.clothes ?? (k % 2 ? { type: 'smock', wash: 'wash-ardoise' } : { type: 'sweater', wash: 'wash-indigo', band: 'wash-ardoise' }),
  };
}

/** Femme figurante. */
export function islandWoman(k, o = {}) {
  return {
    sex: 'f',
    age: o.age ?? 26 + ((k * 9) % 34),
    skin: 1 + (k % 2),
    hair: ['brun', 'chatain', 'gris', 'noir'][k % 4],
    W: 22 + (k % 3),
    H: 35,
    brows: { thick: 0.8, arch: 0.6 },
    eyes: { gaze: ((k % 5) - 2) * 0.05 },
    mouth: { full: 0.5, smile: 0.2 + (k % 3) * 0.15 },
    hairStyle: ['lowBun', 'topBun', 'bandeaux'][k % 3],
    hat: o.hat ?? (k % 2 ? { type: 'fichu', cls: 'paper-shade' } : null),
    clothes: o.clothes ?? { type: 'dress', wash: 'wash-ardoise' },
  };
}

/** Enfant figurant. */
export function child(k, age, o = {}) {
  const girl = k % 2 === 0;
  return {
    sex: girl ? 'f' : 'm',
    age,
    skin: 1 + (k % 3),
    hair: ['brun', 'chatain', 'blond', 'noir', 'chatain'][k % 5],
    W: 22.5 + (k % 3) * 0.6,
    H: 35,
    brows: { thick: 0.8, arch: 0.5 },
    eyes: { gaze: ((k % 5) - 2) * 0.06 },
    mouth: { full: 0.5, smile: (k % 4) * 0.2 },
    hairStyle: girl ? ['bob', 'bandeaux', 'lowBun'][k % 3] : ['short', 'cropped'][k % 2],
    clothes: o.clothes ?? (girl ? { type: 'dress', wash: 'paper', neck: 'round' } : { type: 'smock', wash: 'wash-ardoise' }),
  };
}

/** Bras de scène terminé par une main. */
export function limb(S, pts, w, tone, h = {}) {
  const d = tube(pts, w, w * 0.78);
  S.fill(d, tone);
  if (h.dense) S.hatd(d);
  if (h.hatch) S.hat(d);
  S.ln(d, 0.7, S.mode === 'photo' ? 'ink-soft' : 'ink');
  if (h.none) return d;
  const a = pts[pts.length - 1];
  const b = pts[pts.length - 2];
  const ang = (Math.atan2(a[1] - b[1], a[0] - b[0]) * 180) / Math.PI - 90;
  hand(S, a[0], a[1], h.ang ?? ang, h.size ?? w / 4.6, h, (v) => v);
  return d;
}

/* ───────────────────────── Marques sur leur support ───────────────────────── */

/**
 * Marque posée sur un support. (x, y) = sommet du pied ; s = échelle (pied de 100 unités) ;
 * style : 'taillee' (bois, pierre), 'gravure' (bronze, imprimé), 'releve' (carnet), 'tracee'.
 * `rot` : rotation en degrés autour du sommet du pied.
 */
export function carve(S, code, x, y, s, style = 'taillee', { rot = 0, opacity } = {}) {
  const body = renderMarkBody(code, { style, x, y, s, seed: S.id });
  const at = [rot ? `transform="rotate(${f(rot)} ${f(x)} ${f(y)})"` : '', opacity ? `opacity="${opacity}"` : ''].filter(Boolean).join(' ');
  S.push(at ? `<g ${at}>${body}</g>` : body);
}

/** Méplat clair (bois raboté, pierre dressée) sous une marque, pour qu'elle se lise au tirage. */
export function flat(S, x, y, w, h, tone = 'photo-paper', op = 0.7) {
  S.p(tone, smooth([[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map((p, i) => [p[0] + (i % 2 ? 1 : -1) * 0.6, p[1]]), true, 0.4), { opacity: op });
}

/**
 * Aviron debout, pale en haut (repos contre un mur, ou tenu) : de `top` (bout de la pale) à `bot`
 * (poignée). `code` : marque taillée sur le manche, tête vers la pale, à `at` (0 = pale, 1 = poignée).
 * Rend { mid: point de la marque }.
 */
export function oar(S, top, bot, { w = 14, blade = 0.3, code, at = 0.56, ms = 0.36, worn = false } = {}) {
  const [x0, y0] = top;
  const [x1, y1] = bot;
  const L = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / L;
  const uy = (y1 - y0) / L;
  const nx = -uy;
  const ny = ux;
  const P = (t, v) => [x0 + ux * L * t + nx * v, y0 + uy * L * t + ny * v];
  // pale : longue, plate, arrondie au bout
  const bw = w * 1.9;
  const bladeD = smooth([P(0, -bw * 0.35), P(0.01, -bw / 2), P(blade * 0.9, -bw / 2), P(blade, -w * 0.45, 1), P(blade, w * 0.45, 1), P(blade * 0.9, bw / 2), P(0.01, bw / 2), P(0, bw * 0.35)], true, 0.8);
  const loom = poly([P(blade, -w * 0.45), P(0.88, -w * 0.5), P(0.88, w * 0.5), P(blade, w * 0.45)], true);
  const grip = tube([P(0.88, 0), P(1, 0)], w * 0.8, w * 0.75);
  S.fill(bladeD, 'light');
  S.ln(`M${P(0.02, 0).map(f).join(' ')}L${P(blade, 0).map(f).join(' ')}`, 0.5, 'ink-faint');
  S.ln(bladeD, 0.8, 'ink-soft');
  S.fill(loom, 'light');
  S.p('photo-mid', poly([P(blade, w * 0.15), P(0.88, w * 0.18), P(0.88, w * 0.5), P(blade, w * 0.45)], true), { opacity: 0.5 });
  S.ln(loom, 0.8, 'ink-soft');
  S.fill(grip, worn ? 'dark' : 'mid');
  S.ln(grip, 0.7, 'ink-soft');
  if (worn) S.p('rehaut', tube([P(0.9, -w * 0.15), P(0.99, -w * 0.15)], w * 0.2, w * 0.2), { opacity: 0.7 });
  // fil du bois
  let grain = '';
  for (const v of [-0.25, 0.05, 0.3]) grain += `M${P(blade + 0.02, v * w).map(f).join(' ')}L${P(0.86, v * w * 1.05).map(f).join(' ')}`;
  S.ln(grain, 0.4, 'ink-faint');
  const mid = P(at, 0);
  if (code) {
    // méplat et marque dans le repère du manche (pied le long du manche, tête vers la pale)
    const ang = (Math.atan2(uy, ux) * 180) / Math.PI - 90;
    S.open(ang ? { transform: `rotate(${f(ang)} ${f(mid[0])} ${f(mid[1])})` } : {});
    flat(S, mid[0] - w * 0.55, mid[1] - 4, w * 1.1, 100 * ms * 1.3 + 8, 'photo-paper', 0.55);
    carve(S, code, mid[0], mid[1], ms, 'taillee');
    S.close();
  }
  return { mid, P };
}

/** Croix de bois de l'île (montant, traverse), tassée par le vent ; marque taillée sous la traverse. */
export function islandCross(S, x, base, h, { w = 12, code, ms = 0.3, tilt = 0, tone = 'light', legible = true, empty = false } = {}) {
  const top = base - h;
  const r = S.r;
  S.open({ transform: `rotate(${f(tilt)} ${f(x)} ${f(base)})` });
  const up = poly([[x - w / 2, base], [x - w / 2 + r.jit(0.6), top + 2], [x - w / 2 + 1, top], [x + w / 2 - 1, top], [x + w / 2 + r.jit(0.6), top + 2], [x + w / 2, base]], true);
  const barY = top + h * 0.2;
  const bw = h * 0.36;
  const bar = rect(x - bw, barY, bw * 2, w * 0.9);
  S.fill(up + bar, tone);
  S.p('photo-mid', rect(x + w * 0.15, top, w * 0.35, h) + rect(x - bw, barY + w * 0.55, bw * 2, w * 0.35), { opacity: 0.45 });
  S.ln(up + bar, 0.8, 'ink-soft');
  // lichen, gerçures
  let cr = '';
  for (let i = 0; i < 4; i++) cr += `M${f(x - w * 0.3 + r() * w * 0.6)} ${f(top + h * (0.4 + r() * 0.5))}v${f(r.range(4, 10))}`;
  S.ln(cr, 0.4, 'ink-faint');
  if (code && !empty) {
    const my = barY + w * 0.9 + 4;
    if (legible) {
      flat(S, x - w * 0.45, my - 3, w * 0.9, 100 * ms + 18, 'photo-paper', 0.5);
      carve(S, code, x, my, ms, 'taillee');
    } else {
      // marque usée, illisible au tirage : quelques entailles sans forme sûre
      let sc = '';
      for (let i = 0; i < 4; i++) sc += `M${f(x + r.jit(w * 0.3))} ${f(my + r.range(0, 100 * ms))}l${f(r.jit(3))} ${f(r.range(2, 6))}`;
      S.ln(`M${f(x)} ${f(my)}v${f(100 * ms * 0.9)}` + sc, Math.max(0.6, ms * 3), 'ink-soft', { opacity: 0.55 });
    }
  }
  S.close();
  return { barY, top };
}

/** Pièces d'ambre (cailloux translucides) éparses. */
export function amber(S, x0, y0, x1, y1, n, size = 4, tone = 'light') {
  let d = '';
  let hl = '';
  for (let i = 0; i < n; i++) {
    const cx = x0 + S.r() * (x1 - x0);
    const cy = y0 + S.r() * (y1 - y0);
    const rx = size * (0.6 + S.r() * 0.8);
    const ry = rx * (0.6 + S.r() * 0.4);
    d += smooth([[cx - rx, cy], [cx - rx * 0.3, cy - ry], [cx + rx * 0.8, cy - ry * 0.6], [cx + rx, cy + ry * 0.3], [cx, cy + ry]], true);
    hl += ell(cx - rx * 0.3, cy - ry * 0.3, rx * 0.25, ry * 0.2);
  }
  S.fill(d, tone);
  S.ln(d, 0.5, 'ink-soft');
  S.p('rehaut', hl);
}

/** Texte lisible (classes de libellé du design system). */
export function label(S, x, y, t, { size = 12, cls = 'label-note', anchor = 'middle', italic = null, rot = 0, spacing } = {}) {
  const esc = String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const at = [
    `class="${cls}"`,
    `x="${f(x)}"`,
    `y="${f(y)}"`,
    anchor !== 'start' ? `text-anchor="${anchor}"` : '',
    `font-size="${size}"`,
    italic === false ? 'font-style="normal"' : '',
    spacing ? `letter-spacing="${spacing}"` : '',
    rot ? `transform="rotate(${f(rot)} ${f(x)} ${f(y)})"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  S.push(`<text ${at}>${esc}</text>`);
}

/** Texte gravé dans la pierre : creux sombre, un peu passé. */
export function engraved(S, x, y, t, o = {}) {
  S.open({ opacity: 0.82 });
  label(S, x, y, t, { italic: false, ...o, cls: o.cls ?? 'label' });
  S.close();
}

export { f, ell, rect, poly, smooth, lower };
