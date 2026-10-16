/**
 * Membres de la famille dans les illustrations : réutilise le générateur des portraits de case
 * (art/tools/portraits : renderFigure, atAge, PEOPLE) pour que les visages, coiffures et traits
 * héréditaires restent identiques à ceux de l'arbre. Le buste (repère 160 × 200, regard de
 * trois-quarts) est posé dans la scène par translate/scale ; un bas de corps simple le prolonge
 * pour les photos en pied ou assises.
 *
 * Allègement (budget ≤ 60 Ko gzip) : coordonnées arrondies et hachures fines supprimées quand
 * le buste est réduit (elles tomberaient sous 0,2 px).
 */
import { atAge, renderFigure } from '../portraits/figure.mjs';
import { PEOPLE } from '../portraits/people.mjs';
import { PEOPLE as PEOPLE_HC } from '../portraits/people-hautcorvin.mjs';
import { PEOPLE as PEOPLE_LG } from '../portraits/people-longuegreve.mjs';
import { ell, f, lerp, smooth, tube } from './lib.mjs';
import { hand } from './people.mjs';

/** Visages de toutes les affaires (ids de travail distincts : `hc-…` affaire 2, `lg-…` affaire 3). */
export const BY_ID = Object.fromEntries([...PEOPLE, ...PEOPLE_HC, ...PEOPLE_LG].map((p) => [p.id, p]));

function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) out[k] = deepMerge(a[k], v);
    else out[k] = v;
  }
  return out;
}

/** Gravure au trait : lavis et carnations remplacés par papier et tailles (#art-hatch…). */
export function toEngraving(body) {
  return body.replace(/class="([^"]+)"/g, (m, c) => {
    let k = c;
    if (/^(skin-\d|blush|rehaut|paper-shade)$/.test(c)) k = 'paper';
    else if (/^hair-(noir|brun)$/.test(c)) k = 'hatch-dense';
    else if (/^hair-(chatain|roux)$/.test(c)) k = 'hatch';
    else if (/^hair-(blond|gris)$/.test(c)) k = 'paper';
    else if (/^wash-/.test(c) || c === 'ombre') k = 'hatch';
    return `class="${k}"`;
  });
}

function compact(str, dec) {
  return str.replace(/ d="([^"]*)"/g, (m, d) => ` d="${d.replace(/-?\d*\.\d+/g, (n) => String(+(+n).toFixed(dec)))}"`);
}

/** Centre approximatif du visage dans le repère du buste (pour placer les têtes). */
export const FACE = { x: 68, y: 88 };

/** Silhouette tête + épaules arrondies : rogne le buste pour qu'il se raccorde à un corps. */
export const SIL = 'M0 0H160V140H0ZM3 204C4 170 18 144 42 132H108C132 142 148 168 151 204Z';

/**
 * Pose un membre de la famille. (x, y) = coin haut-gauche du repère 160×200, `s` = échelle.
 * o.patch : retouches de spec (vêtement, chapeau, mains…) ; o.mode : 'photo' | 'color' ;
 * o.clip : `d` de rognage dans le repère du buste (ex. ne garder que tête et épaules).
 */
/** Spec effective d'un buste (âge + retouches de scène), telle que `fam` la dessine. */
export function resolveSpec(id, age, o = {}) {
  const base = o.spec ?? BY_ID[id];
  if (!base) throw new Error(`personne inconnue : ${id}`);
  let spec = age === base.age ? { ...base } : atAge(base, age);
  spec = deepMerge(spec, { background: false, ...(o.patch ?? {}) });
  if (o.patch?.hands) spec.hands = o.patch.hands;
  if (o.patch?.clothes) spec.clothes = o.patch.clothes;
  if (o.patch && 'arms' in o.patch) spec.arms = o.patch.arms;
  if (o.patch && 'hat' in o.patch) spec.hat = o.patch.hat;
  if (o.patch && 'glasses' in o.patch) spec.glasses = o.patch.glasses;
  if (o.patch && 'extras' in o.patch) spec.extras = o.patch.extras;
  return spec;
}

/**
 * Valeur du vêtement du buste (classe du torse et tailles, cf. figure.mjs › CLOTHES/torso), en
 * options de `lower()` : le corps prolonge le même vêtement (raccord `seam`).
 */
export function garmentTone(spec) {
  const c = spec.clothes ?? { type: 'coat' };
  const t = c.type ?? 'coat';
  const DEF_WASH = { uniform: 'wash-indigo', leather: 'wash-sienne', leatherApron: 'paper-shade', raincoat: 'wash-safran' };
  const wash = t === 'shawl' ? (c.dress ?? 'wash-ardoise') : (c.wash ?? DEF_WASH[t] ?? spec.wash ?? 'wash-ardoise');
  const DARK = { coat: c.dark ?? true, uniform: true, suit: true, highCollar: c.dark ?? 'hatch', turtle: c.dark ?? 'hatch', raincoat: c.dark ?? 'hatch', shawl: 'hatch', sweater: 'hatch', leather: 'hatch', smock: c.dark ?? false, dress: c.dark ?? false, leatherApron: c.dark ?? false, apron: false };
  const dark = t in DARK ? DARK[t] : (c.dark ?? true);
  // valeur photo de la classe (figure.mjs › photoClass) : brun/noir → sombre, gris/carnation → clair
  const p = wash === 'paper' ? 'paper' : /^(paper-shade|hair-gris|skin-)/.test(wash) ? 'light' : /^hair-(noir|brun|chatain)$/.test(wash) ? 'dark' : 'mid';
  const out = { torsoTone: { p, c: wash }, torsoHatch: dark === 'hatch', torsoDense: dark === true || dark === 'hatch-dense' };
  // bavette de tablier (figure.mjs : centrée sur cm, milieu de poitrine) : prolongée en tablier
  const BIB = {
    apron: [-22, 24, { p: 'light', c: 'paper-shade' }, false],
    checkApron: [-26, 28, { p: 'paper', c: 'paper' }, false],
    leatherApron: [-24, 27, { p: 'mid', c: c.apron ?? 'wash-sienne' }, true],
  };
  if (BIB[t]) {
    const cm0 = 70 + (spec.dx ?? 0) + 0.37 * (spec.W ?? 24) * 1.2 - 4;
    const cm = spec.flip ? 160 - cm0 : cm0;
    const [a, b, tone, hatch] = BIB[t];
    out.torsoBib = spec.flip ? { x0: cm - b, x1: cm - a, tone, hatch } : { x0: cm + a, x1: cm + b, tone, hatch };
  }
  return out;
}

export function fam(S, id, age, x, y, s, o = {}) {
  const spec = resolveSpec(id, age, o);
  const want = o.mode ?? (S.mode === 'color' ? 'color' : S.mode === 'engr' ? 'engr' : 'photo');
  const mode = want === 'engr' ? 'color' : want;
  let { defs, body } = renderFigure(spec, { prefix: S.uid('f'), mode });
  if (want === 'engr') body = toEngraving(body);
  const dec = s < 0.75 ? 0 : 1;
  let b = body;
  if (s < 0.5 || o.light) b = b.replace(/<path class="ink-faint" d="([^"]{400,})"[^>]*\/>/g, '');
  S.defs.push(compact(defs, dec));
  let inner = compact(b, dec);
  if (o.clip === true) o = { ...o, clip: SIL };
  if (o.clip) {
    const cid = S.uid('c');
    S.defs.push(`<clipPath id="${cid}"><path d="${o.clip}"/></clipPath>`);
    inner = `<g clip-path="url(#${cid})">${inner}</g>`;
  }
  const op = o.opacity ? ` opacity="${o.opacity}"` : '';
  const rot = o.rot ? ` rotate(${o.rot} 72 120)` : '';
  S.push(`<g transform="translate(${f(x)} ${f(y)}) scale(${+s.toFixed(4)})${rot}"${op}>${inner}</g>`);
  return { fx: x + FACE.x * s, fy: y + FACE.y * s };
}

/**
 * Bas du corps sous un buste (repère du buste). kind : 'stand' | 'skirt' | 'sit' | 'sitSkirt' |
 * 'floor' (en tailleur) ; tone : valeur photo ; child : proportions d'enfant.
 * Dessiné AVANT le buste pour que celui-ci recouvre la jonction.
 */
export function lower(S, x, y, s, o = {}) {
  const kind = o.kind ?? 'stand';
  const tone = o.tone ?? 'mid';
  const ch = o.child ?? 0; // 0 adulte → 1 petit enfant
  const cx = o.cx ?? 77;
  const top = 192;
  const sh = (o.w ?? 1) * 72; // demi-largeur au haut (= silhouette SIL à y 200)
  const waistY = lerp(290, 260, ch);
  const hipY = lerp(370, 310, ch);
  const kneeY = lerp(480, 380, ch);
  const footY = o.foot ?? lerp(600, 450, ch);
  const wW = sh * (o.waist ?? 0.84);
  const hW = sh * (o.hip ?? 0.9);
  const P = (px, py) => [x + px * s, y + py * s];
  const pts = (arr) => arr.map(([a, b2, c]) => (c ? [...P(a, b2), 1] : P(a, b2)));
  const line = (d, w = 1) => S.ln(d, w * Math.max(0.6, s), S.mode === 'photo' ? 'ink-soft' : 'ink');
  const torso = smooth(pts([[cx - sh, top], [cx - wW, waistY], [cx - hW, hipY], [cx + hW, hipY], [cx + wW, waistY], [cx + sh, top]]), true, 0.8);
  if (kind === 'stand' || kind === 'skirt' || kind === 'shortSkirt') {
    if (kind === 'skirt' || kind === 'shortSkirt') {
      const hem = kind === 'skirt' ? footY - 4 : lerp(kneeY, footY, 0.35);
      if (kind === 'shortSkirt') legsPair(S, P, cx, hW * 0.45, hipY, kneeY, footY, s, o.legTone ?? 'light', o, true);
      const fl = hW * (o.flare ?? 1.3);
      const sk = smooth(pts([[cx - wW, waistY], [cx - hW, hipY], [cx - fl, hem, 1], [cx + fl * (o.train ? 1.8 : 1), hem, 1], [cx + hW, hipY], [cx + wW, waistY]]), true, 0.7);
      S.fill(sk, o.skirtTone ?? tone);
      if (o.dense) S.hatd(sk);
      if (o.hatch) S.hat(sk);
      line(sk);
      let folds = '';
      for (let i = -2; i <= 2; i++) folds += `M${f(P(cx + i * hW * 0.3, hipY)[0])} ${f(P(0, hipY)[1])}L${f(P(cx + i * fl * 0.42, hem - 4)[0])} ${f(P(0, hem - 4)[1])}`;
      S.ln(folds, 0.5, 'ink-faint');
      if (o.apron) {
        const ap = smooth(pts([[cx - hW * 0.75, waistY], [cx - hW * 0.95, hem - 30, 1], [cx + hW * 0.95, hem - 30, 1], [cx + hW * 0.75, waistY]]), true, 0.6);
        S.fill(ap, o.apronTone ?? 'light');
        S.ln(ap, 0.6, 'ink-soft');
      }
      if (kind === 'skirt') S.black(ell(...P(cx - hW * 0.4, hem + 2), 14 * s, 6 * s) + ell(...P(cx + hW * 0.4, hem + 2), 14 * s, 6 * s));
    } else legsPair(S, P, cx, hW * 0.5, hipY, kneeY, footY, s, o.legTone ?? tone, o, false);
  } else if (kind === 'sit' || kind === 'sitSkirt') {
    const seatY = hipY - 10;
    const kneeF = seatY + 40;
    const foot = o.foot ?? seatY + 160;
    if (kind === 'sitSkirt') {
      const fl = hW * 1.45;
      const sk = smooth(pts([[cx - wW, waistY], [cx - hW * 1.25, seatY + 10], [cx - fl, foot - 6, 1], [cx + fl, foot - 6, 1], [cx + hW * 1.25, seatY + 10], [cx + wW, waistY]]), true, 0.7);
      S.fill(sk, o.skirtTone ?? tone);
      if (o.dense) S.hatd(sk);
      if (o.hatch) S.hat(sk);
      line(sk);
      S.ln(smooth(pts([[cx - hW * 1.3, kneeF], [cx, kneeF + 14], [cx + hW * 1.3, kneeF]])), 0.6, 'ink-faint');
      S.black(ell(...P(cx - hW * 0.45, foot - 2), 15 * s, 6 * s) + ell(...P(cx + hW * 0.45, foot - 2), 15 * s, 6 * s));
    } else {
      for (const side of [-1, 1]) {
        const lg = tube([P(cx + side * hW * 0.55, kneeF - 6), P(cx + side * hW * 0.62, foot - 6)], 46 * s, 36 * s);
        S.fill(lg, o.legTone ?? tone);
        if (o.dense) S.hatd(lg);
        line(lg, 0.8);
        S.black(ell(...P(cx + side * hW * 0.62 + side * 6, foot - 3), 22 * s, 8 * s));
      }
      const lap = smooth(pts([[cx - hW * 1.1, seatY - 20], [cx - hW * 1.2, kneeF + 4], [cx + hW * 1.2, kneeF + 4], [cx + hW * 1.1, seatY - 20]]), true);
      S.fill(lap, o.legTone ?? tone);
      if (o.dense) S.hatd(lap);
      line(lap, 0.8);
    }
  } else if (kind === 'floor') {
    const lap = smooth(pts([[cx - hW * 1.9, hipY + 30], [cx - hW * 1.2, hipY - 20], [cx + hW * 1.2, hipY - 20], [cx + hW * 1.9, hipY + 30], [cx, hipY + 52]]), true);
    S.fill(lap, o.skirtTone ?? tone);
    line(lap, 0.8);
    S.ln(smooth(pts([[cx - hW * 1.5, hipY + 18], [cx, hipY + 6], [cx + hW * 1.5, hipY + 24]])), 0.5, 'ink-faint');
  }
  // vêtement du haut : par défaut la valeur du bas ; `torso*` (raccord seam) suit le buste
  const tTone = o.torsoTone ?? tone;
  const tHatch = o.torsoHatch ?? o.hatch;
  const tDense = o.torsoDense ?? o.dense;
  S.fill(torso, tTone);
  if (tDense) S.hatd(torso);
  if (tHatch) S.hat(torso);
  let bibD = null;
  if (o.torsoBib) {
    const { x0, x1 } = o.torsoBib;
    const yB = kind === 'stand' ? hipY + 70 : waistY + 10;
    bibD = smooth(pts([[x0, SEAM_TOP, 1], [x1, SEAM_TOP, 1], [x1 + 4, waistY], [x1 + 10, yB, 1], [x0 - 10, yB, 1], [x0 - 4, waistY]]), true, 0.5);
    S.fill(bibD, o.torsoBib.tone);
    if (o.torsoBib.hatch) S.hat(bibD);
    S.ln(bibD, 0.6, S.mode === 'photo' ? 'ink-soft' : 'ink');
  }
  if (o.zigzag) {
    let z = '';
    for (const yy of [top + 22, top + 34]) {
      z += `M${f(P(cx - sh, yy)[0])} ${f(P(0, yy)[1])}`;
      for (let i = 1; i <= 14; i++) z += `L${f(P(cx - sh + (2 * sh * i) / 14, 0)[0])} ${f(P(0, yy + (i % 2 ? -6 : 0))[1])}`;
    }
    S.ln(z, 0.9 * Math.max(0.7, s), 'ink');
  }
  if (o.buttons) {
    let b = '';
    for (let i = 0; i < 4; i++) b += ell(...P(cx + 2, top + 20 + i * 22), 2.4 * s, 2.4 * s);
    S.fill(b, 'light');
  }
  if (o.belt) S.fill(smooth(pts([[cx - wW, waistY - 6], [cx + wW, waistY - 6], [cx + wW, waistY + 4], [cx - wW, waistY + 4]]), true), 'black', { opacity: 0.6 });
  line(torso, 0.9);
  // bras le long du corps (image gauche = -1, droite = +1)
  const armsOn = o.arms ?? 'both';
  if (armsOn !== 'none' && kind !== 'floor') {
    for (const side of [-1, 1]) {
      if (armsOn === 'left' && side > 0) continue;
      if (armsOn === 'right' && side < 0) continue;
      const sit = kind === 'sit' || kind === 'sitSkirt';
      const sx = cx + side * (sh - 13);
      const ex = cx + side * (sh - 2);
      const wx = sit ? cx + side * (sh - 34) : cx + side * (sh - 8);
      const wy = sit ? hipY + 4 : hipY - 16;
      const a = tube([P(sx, top + 2), P(ex, waistY - 10), P(wx, wy)], 34 * s, 26 * s);
      S.fill(a, o.sleeveTone ?? tTone);
      if (tHatch) S.hat(a);
      if (tDense) S.hatd(a);
      line(a, 0.7);
      const ho = o.hands?.[side] ?? {};
      if (ho !== false) {
        const [hx, hy] = P(wx, wy - 2);
        hand(S, hx, hy, ho.ang ?? (sit ? -side * 60 : side * 8), ho.size ?? 4 * s, { skin: o.skin ?? 2, fist: !sit, ...ho }, (v) => v);
      }
    }
  }
  // raccord buste/corps (voir seamPass) : aplats du torse et des manches, prolongés sous l'épaule
  const [l0, t0] = P(cx - sh, SEAM_TOP);
  const [r0, b0] = P(cx + sh, top + 10);
  const shoulder = `M${f(l0)} ${f(t0)}H${f(r0)}V${f(b0)}H${f(l0)}Z`;
  const parts = [shoulder, torso].map((d) => ({ d, tone: tTone, hatch: tHatch, dense: tDense }));
  if (bibD) parts.push({ d: bibD, tone: o.torsoBib.tone, hatch: o.torsoBib.hatch });
  return { P, hipY, footY, waistY, seam: { x, y, s, parts } };
}

/** Haut de la bande de fondu entre le buste (rogné à y 204) et le corps (repère du buste). */
const SEAM_TOP = 176;
const SEAM_BOT = 206;
const SEAM_STEPS = 7;

/** Point de la courbe de Bézier cubique (a, b, c, d) au paramètre t. */
function bez(a, b, c, d, t) {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]);
}

/**
 * Raccord sans couture d'un buste de portrait sur un corps en pied (option `seam`) : le buste
 * s'arrête net à y 204 avec ses propres ombres ; on recouvre la bande [SEAM_TOP, SEAM_BOT] par les
 * aplats du corps en opacité croissante (fondu en paliers, sans dégradé ni couleur en dur), puis
 * on trace le contour des épaules, que le rognage SIL laisse sans trait. Un seul vêtement.
 */
export function seamPass(S, info) {
  if (!info) return;
  const { x, y, s, parts } = info;
  const keep = S.out;
  S.out = [];
  for (const pt of parts) {
    S.fill(pt.d, pt.tone);
    if (pt.dense) S.hatd(pt.d);
    if (pt.hatch) S.hat(pt.d);
  }
  const body = S.out.join('');
  S.out = keep;
  const gid = S.uid('sm');
  S.defs.push(`<g id="${gid}">${body}</g>`);
  const step = (SEAM_BOT - SEAM_TOP) / SEAM_STEPS;
  for (let i = 0; i < SEAM_STEPS; i++) {
    const y0 = y + (SEAM_TOP + i * step) * s;
    const h = (i === SEAM_STEPS - 1 ? step + 2 : step) * s;
    const id = S.clip(`M${f(x - 20 * s)} ${f(y0)}h${f(200 * s)}v${f(h + 0.3)}h${f(-200 * s)}Z`);
    S.push(`<g clip-path="url(#${id})" opacity="${((i + 1) / SEAM_STEPS).toFixed(2)}"><use href="#${gid}"/></g>`);
  }
  // contour des épaules (portion basse des courbes de SIL)
  const P = ([a, b]) => `${f(x + a * s)} ${f(y + b * s)}`;
  let d = '';
  for (const [a, b, c, e] of [
    [[42, 132], [18, 144], [4, 170], [3, 204]],
    [[108, 132], [132, 142], [148, 168], [151, 204]],
  ]) {
    for (let k = 0; k <= 8; k++) d += `${k ? 'L' : 'M'}${P(bez(a, b, c, e, 0.42 + (0.58 * k) / 8))}`;
  }
  S.ln(d, 0.9 * Math.max(0.6, s), S.mode === 'photo' ? 'ink-soft' : 'ink');
}

function legsPair(S, P, cx, hw, hipY, kneeY, footY, s, tone, o, bare) {
  for (const side of [-1, 1]) {
    const x0 = cx + side * hw;
    const lg = tube([P(x0, hipY - 10), P(x0 + side * 2, kneeY), P(x0 + side * 4, footY - 8)], (bare ? 26 : 50) * s, (bare ? 18 : 38) * s);
    S.fill(lg, tone);
    if (o.dense && !bare) S.hatd(lg);
    if (o.hatch && !bare) S.hat(lg);
    S.ln(lg, 0.7 * Math.max(0.7, s), S.mode === 'photo' ? 'ink-soft' : 'ink');
    if (o.barefoot) {
      S.fill(ell(...P(x0 + side * 8, footY - 3), 16 * s, 6 * s), 'light');
      S.ln(ell(...P(x0 + side * 8, footY - 3), 16 * s, 6 * s), 0.5, 'ink-soft');
    } else S.black(ell(...P(x0 + side * 8, footY - 4), 22 * s, 8 * s));
  }
}

/** Point du repère d'une main de portrait (h = {x, y, rot, scale}) → scène. */
export function handPt(x, y, s, h, lx, ly) {
  const a = ((h.rot ?? 0) * Math.PI) / 180;
  const k = 1.45 * (h.scale ?? 1);
  const px = h.x + k * (lx * Math.cos(a) - ly * Math.sin(a));
  const py = h.y + k * (lx * Math.sin(a) + ly * Math.cos(a));
  return [x + px * s, y + py * s];
}

/** Options du bas du corps ; avec `seam: true`, le haut du corps reprend le vêtement du buste. */
function seamLower(id, age, o) {
  if (o.seam !== true) return o.lower ?? {};
  return { ...garmentTone(resolveSpec(id, age, o)), ...(o.lower ?? {}) };
}

/** Figurant (hors arbre) dessiné par le même générateur : spec libre, sans trait de famille. */
export function extra(S, spec, x, y, s, o = {}) {
  const sp = { id: `x${Math.round(x)}-${Math.round(y)}`, marks: {}, ...spec };
  const lo = o.lower !== false ? lower(S, x, y, s, seamLower(null, sp.age ?? 40, { ...o, spec: sp })) : null;
  const r = fam(S, null, sp.age ?? 40, x, y, s, { clip: true, ...o, spec: sp });
  if (o.seam) seamPass(S, typeof o.seam === 'object' ? o.seam : lo?.seam);
  return r;
}

/**
 * Personnage complet : bas du corps + buste rogné (silhouette). `o.seam` : raccord sans couture
 * (true, ou le `seam` rendu par un `lower()` dessiné à part) ; absent, rendu historique.
 */
export function person(S, id, age, x, y, s, o = {}) {
  const lo = o.lower !== false ? lower(S, x, y, s, seamLower(id, age, o)) : null;
  const r = fam(S, id, age, x, y, s, { clip: true, ...o });
  if (o.seam) seamPass(S, typeof o.seam === 'object' ? o.seam : lo?.seam);
  return r;
}

/** Surimpression photo de la brûlure (la classe `blush` disparaît en mode photo). */
export function burnMark(S, x, y, s) {
  S.p('photo-paper', ell(x, y, 3.2 * s, 2.4 * s), { opacity: 0.95 });
  S.p('rehaut', ell(x - 0.6 * s, y - 0.5 * s, 1.4 * s, 0.9 * s));
  S.ln(ell(x, y, 3.2 * s, 2.4 * s), 0.5, 'ink-soft');
}
