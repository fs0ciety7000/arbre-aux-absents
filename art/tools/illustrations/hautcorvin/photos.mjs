/**
 * Affaire 2 (`revenant-hautcorvin`) : photographies, cartes-photos et fiches (OF-02, OF-05, PH-01 à
 * PH-18, CP-01, CP-02). Briefs : docs/scenario/hautcorvin/09-illustrations.md §5 ; âges :
 * 07-coherence.md §4 ; visages : cast.mjs (générateur des portraits de case).
 *
 * Côtés (DESIGN §10.7) : gauche du sujet = droite de l'image (fossette, profil droit, mains).
 */
import { Scene, mount, wear, foliage, crowd, printBlock, headline, lighthouse, waterLines, reefs } from '../kit.mjs';
import { hand } from '../people.mjs';
import { rect, ell, circ, smooth, poly, tube, f, handLines } from '../lib.mjs';
import { extra, garment, hc, hcBust, limb, shinyBurn, snowfall, lower } from './cast.mjs';
import { signature } from './papers.mjs';

/* ───────────────────────── Décors ───────────────────────── */

/** Mur de briques de la halle et gueule voûtée d'un four (lueur claire). */
export function furnace(S, x0, y0, x1, y1, mx, my, mw, mh, { glow = true } = {}) {
  S.fill(rect(x0, y0, x1 - x0, y1 - y0), 'mid');
  let br = '';
  for (let y = y0 + 9, k = 0; y < y1; y += 9, k++) {
    br += `M${f(x0)} ${f(y)}H${f(x1)}`;
    for (let x = x0 + (k % 2 ? 9 : 0); x < x1; x += 18) br += `M${f(x)} ${f(y - 9)}v9`;
  }
  S.ln(br, 0.5, 'ink-faint');
  const arch = (r) => `M${f(mx - mw / 2 - r)} ${f(my + mh)}V${f(my + mw / 2)}A${f(mw / 2 + r)} ${f(mw / 2 + r)} 0 0 1 ${f(mx + mw / 2 + r)} ${f(my + mw / 2)}V${f(my + mh)}Z`;
  S.fill(arch(16), 'dark');
  let vous = '';
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (Math.PI * i) / 14;
    vous += `M${f(mx + Math.cos(a) * (mw / 2))} ${f(my + mw / 2 + Math.sin(a) * (mw / 2))}l${f(Math.cos(a) * 16)} ${f(Math.sin(a) * 16)}`;
  }
  S.ln(vous, 0.6, 'ink-faint');
  const mouth = arch(0);
  if (glow) {
    S.p('photo-paper', mouth);
    S.p('rehaut', ell(mx, my + mh * 0.65, mw * 0.4, mh * 0.3), { opacity: 0.8 });
    S.p('photo-light', ell(mx, my + mh * 0.55, mw * 0.9, mh * 0.75), { opacity: 0.35 });
  } else S.black(mouth);
  S.ln(mouth, 0.8, 'ink-soft');
  return mouth;
}

/** Pochette de négatif en papier cristal : date lisible, légende manuscrite. */
export function sleeve(S, x, y, w, h, { rot = 0, date, lines = 4 } = {}) {
  S.open({ transform: `rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})` });
  const d = rect(x, y, w, h);
  S.p('paper', d);
  S.p('paper-shade', d, { opacity: 0.6 });
  S.ln(d, 0.7, 'ink-soft');
  S.ln(`M${f(x)} ${f(y + 14)}Q${f(x + w / 2)} ${f(y + 26)} ${f(x + w)} ${f(y + 14)}`, 0.5, 'ink-faint');
  if (date) S.push(`<text class="label-note" x="${f(x + 12)}" y="${f(y + 46)}" font-size="13">${date}</text>`);
  S.ln(handLines(S.r, x + 12, y + (date ? 66 : 44), w - 24, lines, 16, { slant: 0.5, h: 3, step: 3.6 }), 0.8, 'ink');
  S.close();
}

/** Canne de souffleur (tube de fer) de a à b. */
export function blowpipe(S, a, b, w = 4.2) {
  const d = tube([a, b], w, w * 0.85);
  S.fill(d, 'dark');
  S.ln(d, 0.6, 'ink-soft');
}

/** Coupe de cristal à pied, couronne de laurier gravée ; (x, y) = bord du calice. */
export function goblet(S, x, y, w, h, { laurel = true, tone = 'photo-light' } = {}) {
  const cup = smooth([[x - w / 2, y, 1], [x - w * 0.46, y + h * 0.35], [x - w * 0.2, y + h * 0.58], [x, y + h * 0.6], [x + w * 0.2, y + h * 0.58], [x + w * 0.46, y + h * 0.35], [x + w / 2, y, 1]], true);
  const stem = poly([[x - w * 0.05, y + h * 0.6], [x + w * 0.05, y + h * 0.6], [x + w * 0.07, y + h * 0.92], [x - w * 0.07, y + h * 0.92]], true);
  const foot = ell(x, y + h * 0.95, w * 0.34, h * 0.05);
  S.p(tone, cup, { opacity: 0.85 });
  S.p('rehaut', smooth([[x - w * 0.38, y + h * 0.06], [x - w * 0.3, y + h * 0.4], [x - w * 0.22, y + h * 0.42], [x - w * 0.3, y + h * 0.06]], true));
  S.p(tone, stem + foot);
  S.ln(cup + stem + foot + ell(x, y, w / 2, h * 0.05), 0.6, 'ink-soft');
  if (laurel) {
    let lv = '';
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      lv += ell(x - w * 0.42 + t * w * 0.84, y + h * (0.2 + 0.14 * Math.sin(t * Math.PI)), w * 0.035, h * 0.022);
    }
    S.ln(lv + `M${f(x - w * 0.42)} ${f(y + h * 0.2)}Q${f(x)} ${f(y + h * 0.44)} ${f(x + w * 0.42)} ${f(y + h * 0.2)}`, 0.5, 'ink-faint');
  }
}

/**
 * Inverse les valeurs des éléments émis depuis `from` (négatif photographique) : papier ↔ foncé,
 * clair ↔ moyen ; les rehauts deviennent sombres.
 */
function invert(S, from) {
  const M = { 'photo-paper': 'photo-dark', 'photo-light': 'photo-mid', 'photo-mid': 'photo-light', 'photo-dark': 'photo-paper', rehaut: 'photo-dark' };
  for (let i = from; i < S.out.length; i++) S.out[i] = S.out[i].replace(/class="([^"]+)"/g, (m, c) => `class="${M[c] ?? c}"`);
}

/** Tablier de cuir de graveur sous un buste (repère du buste : x, y, s), du plastron aux genoux. */
function leatherApron(S, x, y, s, bottom = 500) {
  const A = (u, v) => [x + u * s, y + v * s];
  const d = smooth([A(52, 176, 1), A(104, 176, 1), A(108, 230), A(128, 300), A(140, bottom, 1), A(14, bottom, 1), A(26, 300), A(48, 230)], true);
  S.fill(d, 'mid');
  S.hat(d);
  S.ln(d, 0.8, 'ink-soft');
  return d;
}

/** Canne de souffleur : tube de fer, manchon de bois à la prise, embouchure évasée, nez de fer en bas. */
function glassCane(S, a, b, w = 5) {
  const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const d = tube([a, b], w, w * 0.9);
  S.fill(d, 'dark');
  S.ln(d, 0.7, 'ink-soft');
  S.ln(`M${f(a[0] + w * 0.2)} ${f(a[1] + 6)}L${f(b[0] + w * 0.2)} ${f(b[1] - 10)}`, 0.5, 'ink-faint');
  // manchon de bois sous la main, embouchure évasée en haut
  const sl = tube([at(0.3), at(0.55)], w * 1.8, w * 1.8);
  S.fill(sl, 'light');
  S.ln(sl, 0.6, 'ink-soft');
  S.ln(`M${f(at(0.33)[0])} ${f(at(0.33)[1])}L${f(at(0.52)[0])} ${f(at(0.52)[1])}`, 0.4, 'ink-faint');
  const mp = tube([at(0), at(0.03)], w * 1.7, w * 1.1);
  S.fill(mp, 'dark');
  S.ln(mp, 0.5, 'ink-soft');
  const nose = tube([at(0.94), b], w * 1.3, w * 0.8);
  S.fill(nose, 'dark');
  S.ln(nose, 0.6, 'ink-soft');
}

/** Casquette de toile tenue par la visière, la calotte pendante : (x, y) = milieu de la visière. */
function heldCap(S, x, y, k = 1) {
  const P = (u, v) => [x + u * k, y + v * k];
  const crown = smooth([P(-30, 4), P(30, 2), P(38, 26), P(22, 50), P(-20, 52), P(-36, 30)], true);
  S.fill(crown, 'mid');
  S.hat(crown);
  S.ln(crown, 0.8, 'ink-soft');
  const [bx, by] = P(0, 46);
  let seams = '';
  for (const u of [-28, -12, 12, 30]) seams += `M${f(P(u, 6)[0])} ${f(P(u, 6)[1])}Q${f(P(u * 0.6, 30)[0])} ${f(P(u * 0.6, 30)[1])} ${f(bx)} ${f(by)}`;
  S.ln(seams, 0.5, 'ink-faint');
  S.fill(ell(bx, by, 2.6 * k, 2 * k), 'dark');
  const visor = smooth([P(-32, 2), P(0, -8), P(32, 0), P(28, 8), P(0, 2), P(-28, 9)], true);
  S.fill(visor, 'dark');
  S.ln(visor, 0.7, 'ink-soft');
}

/**
 * Oreille droite nette sur un profil droit (buste retourné `flip`, repère du buste x, y, s) : le
 * générateur de portraits la cache sous les cheveux ; les fiches et le négatif doivent la montrer.
 * Caractères d'EX-03 : `free` (lobe détaché, I) ou adhérent ; `yAnth` (anthélix en Y, II et III) ;
 * `notch` (encoche de l'hélix au tiers supérieur, II et III) ; tragus pointu (I) ou bas et arrondi.
 */
function profileEar(S, x, y, s, { free = false, yAnth = false, notch = false, k = 1, at = [52, 88] } = {}) {
  const h = 30 * k * s;
  const [cx, cy] = [x + at[0] * s, y + at[1] * s];
  const E = (u, v, c) => (c ? [cx + u * h, cy + v * h, 1] : [cx + u * h, cy + v * h]);
  const rim = [E(0.14, -0.4), E(-0.04, -0.52), E(-0.26, -0.44)];
  if (notch) rim.push(E(-0.34, -0.31), E(-0.2, -0.22, 1), E(-0.36, -0.12));
  else rim.push(E(-0.35, -0.24));
  rim.push(E(-0.37, 0.02), E(-0.3, 0.24));
  if (free) rim.push(E(-0.22, 0.42), E(-0.1, 0.54), E(0.04, 0.5), E(0.08, 0.38, 1), E(0.16, 0.12));
  else rim.push(E(-0.16, 0.4), E(0.14, 0.36, 1), E(0.16, 0.12));
  const d = smooth(rim, true);
  S.p('photo-light', d);
  S.ln(d, 0.8, 'ink-soft');
  // ourlet de l'hélix (interrompu à l'encoche)
  const hel = notch ? smooth([E(0.08, -0.38), E(-0.06, -0.44), E(-0.22, -0.36)]) + smooth([E(-0.27, -0.1), E(-0.28, 0.08), E(-0.22, 0.24)]) : smooth([E(0.08, -0.38), E(-0.06, -0.44), E(-0.24, -0.34), E(-0.29, -0.06), E(-0.22, 0.24)]);
  S.ln(hel, 0.6, 'ink-soft');
  // anthélix : arc simple ou en Y à branche supérieure épaisse
  S.ln(smooth([E(-0.14, 0.22), E(-0.16, 0.0), E(-0.1, -0.22)]), 0.6, 'ink-soft');
  if (yAnth) S.ln(smooth([E(-0.15, -0.02), E(-0.2, -0.18), E(-0.2, -0.32)]), 1.3, 'ink-soft');
  const conch = ell(cx + 0.0 * h, cy + 0.08 * h, 0.09 * h, 0.15 * h);
  S.p('photo-mid', conch);
  // tragus
  const tr = free ? smooth([E(0.12, -0.04), E(0.21, 0.07, 1), E(0.12, 0.16)]) : smooth([E(0.12, 0.06), E(0.19, 0.14), E(0.12, 0.24)]);
  S.ln(tr, 0.7, 'ink-soft');
  if (!free) S.ln(smooth([E(0.14, 0.36), E(0.24, 0.4)]), 0.5, 'ink-faint');
}

/** Tirage monté sur carton (fenêtre `win`) avec timbre sec du studio en bas à droite. */
function card(S, { m = 22, mb = 26, stamp = true, tone = 'paper-shade' } = {}) {
  const win = mount(S, { m, mb, cardTone: tone });
  if (stamp) S.ln(ell(S.w - m - 44, S.h - mb / 2 - 4, 36, 7) + ell(S.w - m - 44, S.h - mb / 2 - 4, 30, 4.5), 0.5, 'ink-faint');
  return win;
}

/** Ouvrier ou figurant masculin (sans trait de famille), varié par l'indice `k`. */
function worker(k, o = {}) {
  const hair = ['brun', 'chatain', 'noir', 'gris', 'brun', 'chatain'][k % 6];
  return {
    sex: 'm',
    age: o.age ?? 24 + ((k * 7) % 30),
    skin: 1 + (k % 3),
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
    hat: o.hat === false ? null : k % 4 === 0 ? { type: 'flatcap', cls: 'paper-shade' } : null,
    // blouse : `collar` y est une classe de couleur ; veste : col ouvert (aucune forme de COLLARS)
    clothes: o.clothes ?? (k % 2 ? { type: 'smock', wash: 'wash-ardoise' } : { type: 'coat', wash: 'wash-ardoise', collar: 'open', lapels: false }),
  };
}

/** Femme figurante. */
function woman(k, o = {}) {
  return {
    sex: 'f',
    age: o.age ?? 28 + ((k * 9) % 30),
    skin: 1 + (k % 2),
    hair: ['brun', 'chatain', 'gris', 'noir'][k % 4],
    W: 22 + (k % 3),
    H: 35,
    brows: { thick: 0.8, arch: 0.6 },
    eyes: { gaze: ((k % 5) - 2) * 0.05 },
    mouth: { full: 0.5, smile: 0.2 + (k % 3) * 0.15 },
    hairStyle: ['lowBun', 'topBun', 'bandeaux'][k % 3],
    hat: o.hat ?? null,
    clothes: o.clothes ?? { type: 'dress', wash: 'wash-ardoise' },
  };
}

/** Enfant figurant (fille ou garçon). */
function kid(k, age, o = {}) {
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

/** Neige au sol : plaque claire à contour mou. */
function snowPatch(S, pts) {
  const d = smooth(pts, true, 0.9);
  S.p('photo-paper', d);
  S.ln(d, 0.5, 'ink-faint');
  return d;
}

/** Crête de montagne remplie d'une valeur, névés clairs sous les sommets. */
function ridge(S, pts, y1, tone, snow = true) {
  const d = poly([...pts, [pts[pts.length - 1][0], y1], [pts[0][0], y1]], true);
  S.fill(d, tone);
  if (snow) {
    let sn = '';
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      if (p[1] > pts[i - 1][1] || p[1] > pts[i + 1][1]) continue;
      sn += poly([[p[0], p[1]], [p[0] - 18, p[1] + 22], [p[0] - 6, p[1] + 16], [p[0] + 2, p[1] + 26], [p[0] + 10, p[1] + 14], [p[0] + 20, p[1] + 20]], true);
    }
    S.p('photo-paper', sn, { opacity: 0.9 });
  }
  S.ln(smooth(pts), 0.6, 'ink-soft');
  return d;
}

/** Fiche cartonnée d'identification du BRR (format de l'affaire 1, PH-16/17). */
function fiche(id, draw) {
  const S = new Scene(id, 520, 380, 'photo');
  S.p('paper', rect(0, 0, 520, 380));
  S.ln(rect(6, 6, 508, 368), 0.8, 'ink-soft');
  const slots = [rect(20, 20, 230, 250), rect(270, 20, 230, 250)];
  const slot = (i, fn) => {
    const d = slots[i];
    S.within(d, () => {
      S.p('photo-light', d);
      const x0 = i ? 270 : 20;
      let t = '';
      for (let y = 30; y < 270; y += 8) t += `M${x0} ${y}h${(y / 8) % 5 === 0 ? 14 : 7}`;
      S.ln(t, 0.8, 'ink-soft');
      fn();
      S.stip(d, { opacity: 0.25 });
    });
    S.ln(d, 0.8, 'ink');
  };
  draw(S, slot);
  let c = '';
  for (let i = 0; i < 5; i++) c += rect(20 + i * 97, 290, 90, 52);
  S.ln(c, 0.8, 'ink-soft');
  S.ln('M20 360H500', 0.5, 'ink-faint');
  return S;
}

/** Ardoise d'identification (numéro à la craie, lisible). */
function slate(S, x, y, w, h, label) {
  const d = rect(x, y, w, h);
  S.fill(d, 'dark');
  S.ln(d, 1, 'ink-soft');
  S.ln(rect(x + 3, y + 3, w - 6, h - 6), 0.5, 'ink-faint');
  if (label) S.push(`<text class="label-note" x="${f(x + w / 2)}" y="${f(y + h / 2 + 4)}" text-anchor="middle" font-size="12" font-style="normal">${label}</text>`);
}

/** Lentille de phare à échelons (vue de face) : anneaux concentriques, cage de verre. */
function lens(S, cx, cy, r, { cage = true } = {}) {
  const body = smooth([[cx - r * 0.7, cy - r * 1.1], [cx + r * 0.7, cy - r * 1.1], [cx + r, cy - r * 0.5], [cx + r, cy + r * 0.5], [cx + r * 0.7, cy + r * 1.1], [cx - r * 0.7, cy + r * 1.1], [cx - r, cy + r * 0.5], [cx - r, cy - r * 0.5]], true);
  S.p('photo-light', body);
  let rings = '';
  for (let k = 1; k <= 7; k++) rings += ell(cx, cy, (r * k) / 7.5, (r * k) / 7.5);
  for (let k = 0; k < 6; k++) {
    const yy = cy - r * 1.05 + k * 9;
    rings += `M${f(cx - r * 0.66 + k * 2)} ${f(yy)}H${f(cx + r * 0.66 - k * 2)}`;
    rings += `M${f(cx - r * 0.66 + k * 2)} ${f(cy + r * 1.05 - k * 9)}H${f(cx + r * 0.66 - k * 2)}`;
  }
  S.ln(rings, 0.6, 'ink-soft');
  S.p('rehaut', ell(cx - r * 0.25, cy - r * 0.3, r * 0.22, r * 0.5));
  S.p('photo-paper', ell(cx, cy, r * 0.12, r * 0.12));
  S.ln(body, 1, 'ink-soft');
  if (cage) {
    const c = rect(cx - r * 1.35, cy - r * 1.5, r * 2.7, r * 3.0);
    S.ln(c + `M${f(cx - r * 0.45)} ${f(cy - r * 1.5)}v${f(r * 3)}M${f(cx + r * 0.45)} ${f(cy - r * 1.5)}v${f(r * 3)}M${f(cx - r * 1.35)} ${f(cy)}h${f(r * 2.7)}`, 1.2, 'ink-soft');
    S.p('rehaut', poly([[cx + r * 0.6, cy - r * 1.5], [cx + r * 0.9, cy - r * 1.5], [cx + r * 0.2, cy + r * 1.5], [cx - r * 0.1, cy + r * 1.5]], true), { opacity: 0.5 });
  }
}

/** Draperie à plis verticaux (rideau d'exposition, toile de studio). */
function drape(S, x, y, w, h, tone = 'mid', swag = true) {
  const n = Math.max(3, Math.round(w / 14));
  let d = `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}`;
  for (let i = n; i >= 1; i--) d += `Q${f(x + ((i - 0.5) * w) / n)} ${f(y + h + 6)} ${f(x + ((i - 1) * w) / n)} ${f(y + h)}`;
  d += 'Z';
  S.fill(d, tone);
  let folds = '';
  for (let i = 1; i < n; i++) folds += `M${f(x + (i * w) / n)} ${f(y)}Q${f(x + (i * w) / n + 4)} ${f(y + h / 2)} ${f(x + (i * w) / n)} ${f(y + h)}`;
  S.ln(folds, 0.7, 'ink-faint');
  S.ln(d, 0.6, 'ink-soft');
  if (swag) S.ln(`M${f(x)} ${f(y + 6)}Q${f(x + w / 2)} ${f(y + 40)} ${f(x + w)} ${f(y + 6)}`, 1.2, 'ink-soft');
}

/** Mule de bât, de profil vers la droite ; (x, y) = garrot. */
function mule(S, x, y, s) {
  const P = (u, v) => [x + u * s, y + v * s];
  const body = smooth([P(-60, 0), P(-20, -6), P(20, -4), P(34, 6), P(30, 40), P(-56, 42), P(-70, 22)], true);
  const neck = smooth([P(20, 0), P(44, -38), P(58, -46), P(70, -30), P(48, -10), P(34, 14)], true);
  const head = smooth([P(52, -50), P(66, -60, 1), P(92, -28), P(86, -20), P(70, -26), P(56, -36)], true);
  const ears = `M${f(P(58, -52)[0])} ${f(P(58, -52)[1])}l${f(-4 * s)} ${f(-22 * s)}l${f(8 * s)} ${f(18 * s)}M${f(P(64, -56)[0])} ${f(P(64, -56)[1])}l${f(2 * s)} ${f(-22 * s)}l${f(4 * s)} ${f(20 * s)}`;
  let legs = '';
  for (const u of [-54, -40, 18, 30]) legs += tube([P(u, 36), P(u + 2, 70), P(u + 1, 96)], 9 * s, 6 * s);
  S.fill(legs, 'dark');
  S.fill(body + neck, 'dark');
  S.fill(head, 'mid');
  S.ln(body + neck + head + ears, 0.7, 'ink-soft');
  S.ln(`M${f(P(-70, 18)[0])} ${f(P(-70, 18)[1])}q${f(-12 * s)} ${f(20 * s)} ${f(-8 * s)} ${f(44 * s)}`, 1.4, 'ink-soft');
  const pack = rect(P(-44, -16)[0], P(-44, -16)[1], 56 * s, 30 * s);
  S.fill(pack, 'mid');
  S.hat(pack);
  S.ln(pack, 0.6, 'ink-soft');
}

/* ───────────────────────── Scènes ───────────────────────── */

export const SCENES = {
  /* ── OF-02 : photo d'identité agrafée au formulaire R-4 (Andrin, 63 ans) ── */
  'of-02'(id) {
    const S = new Scene(id, 420, 500, 'photo');
    S.p('paper', rect(0, 0, 420, 500));
    S.ln(rect(10, 10, 400, 480), 0.6, 'ink-faint');
    headline(S, 30, 30, 200, 9, { words: 3, cls: 'ink-soft' });
    printBlock(S, 30, 64, 90, 12, 18, { align: 'left' });
    printBlock(S, 30, 380, 340, 4, 18, { align: 'left' });
    S.ln('M30 470H390', 0.5, 'ink-faint');
    // tirage 4 × 5 agrafé, légèrement de biais
    S.open({ transform: 'rotate(-2.5 260 200)' });
    const ph = rect(150, 60, 220, 276);
    S.p('photo-paper', rect(144, 54, 232, 288));
    S.ln(rect(144, 54, 232, 288), 0.5, 'ink-faint');
    S.within(ph, () => {
      S.p('photo-mid', ph);
      S.p('photo-light', ell(270, 160, 120, 150), { opacity: 0.5 });
      hcBust(S, 'andrin63', 63, 160, 66, 1.4, { clip: false });
      S.stip(ph, { opacity: 0.15 });
    });
    S.ln(ph, 0.6, 'ink-soft');
    // cachet sec « Studio Orlhac » en relief sur le coin inférieur droit
    S.p('rehaut', circ(338, 304, 24), { opacity: 0.55 });
    S.ln(circ(338, 304, 24) + circ(338, 304, 17), 0.5, 'ink-faint');
    S.ln(circ(339, 305, 24), 0.5, 'ink-faint', { opacity: 0.6 });
    S.close();
    // trombone rouillé à cheval sur le bord haut
    S.ln('M226 30V86a8 8 0 0 0 16 0V38a5 5 0 0 0 -10 0V80', 2.2, 'ink-soft');
    S.stip(rect(222, 40, 24, 12), { opacity: 0.8 });
    S.p('photo-mid', ell(234, 70, 3, 5), { opacity: 0.6 });
    return S;
  },

  /* ── OF-05 : portrait d'Honoré à 85 ans, découpé dans La Sentinelle ── */
  'of-05'(id) {
    const S = new Scene(id, 360, 470, 'photo');
    const cut = poly([[14, 18], [120, 12], [250, 16], [344, 10], [350, 140], [344, 300], [348, 456], [200, 462], [80, 458], [10, 460], [16, 300], [8, 150]], true);
    S.p('paper', cut);
    S.p('paper-shade', cut, { opacity: 0.4 });
    S.ln(cut, 0.6, 'ink-faint');
    printBlock(S, 26, 30, 306, 2, 9, { align: 'just' });
    const ph = rect(30, 56, 300, 340);
    S.within(ph, () => {
      S.p('photo-light', ph);
      S.p('photo-mid', ph, { opacity: 0.4 });
      hcBust(S, 'honore', 85, 36, 44, 1.76, { clip: false });
    });
    S.stip(ph, { opacity: 0.55 });
    S.ln(ph, 0.6, 'ink-soft');
    printBlock(S, 40, 414, 280, 2, 11, { align: 'center' });
    return S;
  },

  /* ── PH-01 : le stand des Verreries à la Grande Exposition, été 1889 ── */
  'ph-01'(id) {
    const S = new Scene(id, 600, 470, 'photo');
    const win = card(S, { m: 22, mb: 34 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // fond du stand : bandeau à l'enseigne, draperies
      S.fill(rect(22, 22, 556, 46), 'mid');
      headline(S, 170, 36, 260, 14, { words: 3, cls: 'ink-soft' });
      drape(S, 22, 22, 96, 380, 'mid');
      drape(S, 482, 22, 96, 380, 'mid');
      // estrade
      S.fill(rect(22, 360, 556, 54), 'mid', { opacity: 0.7 });
      S.ln('M22 360H578', 0.8, 'ink-soft');
      // socle et lentille à échelons dans sa cage de verre
      const plinth = rect(222, 300, 156, 66);
      S.fill(plinth, 'dark');
      S.ln(plinth + 'M222 312H378', 0.7, 'ink-soft');
      lens(S, 300, 196, 66);
      // coffret doré posé au pied du socle : filets d'or
      const box = rect(252, 330, 96, 30);
      S.fill(box, 'light');
      S.ln(box + rect(256, 334, 88, 22) + 'M300 334v22', 0.6, 'ink-soft');
      S.p('rehaut', rect(258, 336, 40, 3));
      // Évariste à gauche, Clotilde à droite, le petit Honoré devant son père
      hc(S, 'evariste', 41, 70, 96, 0.47, { lower: { kind: 'stand', hatch: true, foot: 640 } });
      hc(S, 'clotilde', 33, 404, 104, 0.46, { lower: { kind: 'skirt', hatch: true, foot: 620 } });
      hc(S, 'honore', 8, 150, 236, 0.3, { lower: { kind: 'stand', tone: 'mid', child: 0.7 } });
      wear(S, win, { edge: 16, spots: 8, corners: [[0, 1, 50]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-02 : inauguration du refuge de l'Ourse, juillet 1911 ── */
  'ph-02'(id) {
    const S = new Scene(id, 660, 470, 'photo');
    const win = card(S, { m: 22, mb: 34 });
    S.within(win.d, () => {
      S.p('photo-paper', win.d);
      ridge(S, [[22, 150], [90, 96], [150, 120], [230, 60], [300, 110], [380, 80], [470, 128], [560, 70], [640, 112]], 300, 'light');
      S.fill(rect(22, 250, 616, 170), 'mid', { opacity: 0.75 });
      S.stip(rect(22, 250, 616, 170), { opacity: 0.5 });
      // névés résiduels au premier plan
      snowPatch(S, [[22, 380], [120, 360], [210, 376], [180, 412], [22, 412]]);
      snowPatch(S, [[470, 372], [560, 356], [638, 366], [638, 412], [520, 412]]);
      // le refuge neuf : moellons, toit de lauzes, porte
      const wall = rect(420, 150, 200, 132);
      S.fill(wall, 'light');
      let st = '';
      for (let y = 160, k = 0; y < 282; y += 14, k++) for (let x = 420 + (k % 2) * 12; x < 620; x += 26) st += rect(x + 1, y - 9, 22 + (x % 3), 11);
      S.ln(st, 0.5, 'ink-faint');
      const roof = poly([[408, 154], [520, 96], [632, 154]], true);
      S.fill(roof, 'dark');
      S.hatd(roof, { opacity: 0.5 });
      S.ln(roof + wall, 0.8, 'ink-soft');
      S.fill(rect(500, 200, 40, 82), 'dark');
      // piolets plantés dans le névé
      let ax = '';
      for (const x of [560, 584, 606]) ax += `M${x} 366l4 -58M${x - 6} 310q10 -6 20 4`;
      S.ln(ax, 2, 'ink');
      // l'abbé bénit (bras levé), les Neviot, le petit Rémi
      hc(S, 'pradeil', 50, 26, 124, 0.42, { lower: { kind: 'skirt', tone: 'dark', dense: true, arms: 'left', foot: 600 } });
      limb(S, [[96, 210], [118, 176], [120, 146]], 13, 'dark', { skin: 1, size: 2.6, ang: 180 });
      hc(S, 'barthelemy', 64, 128, 118, 0.43, { lower: { kind: 'stand', hatch: true } });
      hc(S, 'annette', 60, 214, 128, 0.41, { lower: { kind: 'skirt', hatch: true } });
      hc(S, 'jules', 34, 300, 116, 0.43, { lower: { kind: 'stand', hatch: true, legTone: 'dark' } });
      hc(S, 'philomene', 31, 384, 126, 0.41, { lower: { kind: 'skirt', tone: 'mid', apron: true, apronTone: 'light' } });
      hc(S, 'remi', 3, 352, 270, 0.22, { lower: { kind: 'stand', tone: 'light', child: 1 } });
      // insigne n° 7 du guide, lisible au tirage
      S.fill(circ(344, 206, 7), 'light');
      S.ln(circ(344, 206, 7), 0.8, 'ink-soft');
      S.push('<text class="label-note" x="344" y="210" text-anchor="middle" font-size="10" font-style="normal">7</text>');
      wear(S, win, { edge: 14, spots: 9, corners: [[1, 0, 44]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-03 : l'atelier de gravure, juin 1912 ── */
  'ph-03'(id) {
    const S = new Scene(id, 620, 440, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // grande verrière à gauche, étagères de verres au fond
      const glass = rect(40, 30, 150, 190);
      S.p('photo-paper', glass);
      S.ln(glass + 'M90 30v190M140 30v190M40 93h150M40 156h150', 2, 'ink-soft');
      let shelf = '';
      for (const y of [80, 130]) shelf += `M230 ${y}H580`;
      S.ln(shelf, 2.4, 'ink-soft');
      let cups = '';
      for (let i = 0; i < 14; i++) cups += smooth([[240 + i * 24, 78, 1], [244 + i * 24, 60], [252 + i * 24, 58], [256 + i * 24, 78, 1]], true);
      for (let i = 0; i < 12; i++) cups += smooth([[244 + i * 28, 128, 1], [246 + i * 28, 104], [258 + i * 28, 104], [260 + i * 28, 128, 1]], true);
      S.p('photo-paper', cups, { opacity: 0.8 });
      S.ln(cups, 0.5, 'ink-faint');
      // lampes à pétrole suspendues
      for (const x of [150, 330]) {
        S.ln(`M${x} 22V168`, 0.8, 'ink-soft');
        const sh = poly([[x - 18, 186], [x - 6, 168], [x + 6, 168], [x + 18, 186]], true);
        S.fill(sh, 'dark');
        S.p('rehaut', ell(x, 190, 8, 4));
      }
      // établi des graveurs : deux graveurs penchés sur leur roue
      for (const [i, x] of [[0, 34], [1, 176]]) {
        extra(S, worker(i + 3, { hat: false, clothes: { type: 'smock', wash: 'paper' } }), x, 150, 0.4, { patch: { tilt: 8, eyes: { gaze: 0.3 } }, lower: { kind: 'sit', tone: 'light' } });
      }
      const bench = rect(22, 270, 330, 30);
      S.fill(bench, 'dark');
      S.ln(bench, 0.8, 'ink-soft');
      for (const x of [110, 250]) {
        S.fill(circ(x, 258, 13), 'mid');
        S.ln(circ(x, 258, 13) + circ(x, 258, 3) + `M${x - 40} 258H${x + 40}`, 1, 'ink-soft');
      }
      S.fill(rect(22, 300, 330, 120), 'mid', { opacity: 0.6 });
      // Danela, de trois quarts, à sa roue : le ventre rond sous le tablier de cuir
      const D = (u, v) => [400 + u * 0.56, 64 + v * 0.56];
      const gD = garment('danela', 24);
      const loD = lower(S, 400, 64, 0.56, { kind: 'skirt', tone: 'mid', hatch: true, arms: 'none', ...gD });
      const belly = smooth([D(32, 250), D(122, 250), D(136, 330), D(126, 400), D(28, 400), D(22, 320)], true);
      S.fill(belly, 'mid');
      S.hat(belly);
      S.ln(belly, 0.8, 'ink-soft');
      S.ln(`M${f(D(130, 290)[0])} ${f(D(130, 290)[1])}Q${f(D(150, 340)[0])} ${f(D(150, 340)[1])} ${f(D(126, 392)[0])} ${f(D(126, 392)[1])}`, 0.6, 'ink-faint');
      const wheel = D(-18, 300);
      S.fill(rect(wheel[0] - 60, wheel[1] + 12, 90, 18), 'dark');
      S.fill(circ(...wheel, 12), 'mid');
      S.ln(circ(...wheel, 12) + circ(...wheel, 3), 1, 'ink-soft');
      limb(S, [D(14, 204), D(-4, 270), D(-14, 290)], 16, gD.torsoTone, { skin: 3, size: 2.4, hatch: gD.torsoHatch, dense: gD.torsoDense });
      goblet(S, wheel[0] + 2, wheel[1] - 30, 22, 30, { laurel: false });
      hc(S, 'danela', 24, 400, 64, 0.56, { lower: false, seam: loD.seam });
      wear(S, win, { edge: 14, spots: 7, corners: [[0, 0, 36], [1, 1, 50]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-04 : la famille au jardin, septembre 1915 ── */
  'ph-04'(id) {
    const S = new Scene(id, 680, 480, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // treille : croisillons et feuillage de vigne
      let lat = '';
      for (let x = 10; x < 680; x += 30) lat += `M${x} 22L${x + 120} 230M${x + 120} 22L${x} 230`;
      S.ln(lat, 1.2, 'ink-soft');
      for (let i = 0; i < 9; i++) foliage(S, 50 + i * 72, 40 + (i % 2) * 22, 50, 26, { tone: 'mid', lumps: 10, shade: false });
      S.fill(rect(22, 300, 636, 128), 'mid', { opacity: 0.6 });
      S.stip(rect(22, 300, 636, 128), { opacity: 0.4 });
      // rang debout
      hc(S, 'leonce', 30, 36, 72, 0.42, { lower: { kind: 'stand', hatch: true } });
      hc(S, 'honore', 35, 124, 70, 0.43, { patch: { hat: null }, lower: { kind: 'stand', tone: 'light', arms: 'left' } });
      hc(S, 'eugenie', 31, 430, 66, 0.41, { lower: { kind: 'skirt', tone: 'light' } });
      hc(S, 'marguerite', 32, 528, 74, 0.41, { lower: { kind: 'skirt', tone: 'dark', dense: true } });
      // banc de jardin et parents assis
      const bench = rect(200, 250, 250, 26);
      S.fill(bench, 'dark');
      S.ln(bench + 'M210 276v60M440 276v60', 1.2, 'ink-soft');
      hc(S, 'evariste', 67, 206, 116, 0.42, { lower: { kind: 'sit', hatch: true } });
      hc(S, 'clotilde', 59, 318, 120, 0.41, { lower: { kind: 'sitSkirt', hatch: true } });
      // les enfants devant
      hc(S, 'colombe', 9, 120, 250, 0.3, { lower: { kind: 'shortSkirt', tone: 'light', child: 0.6 } });
      hc(S, 'bastien', 5, 470, 280, 0.25, { lower: { kind: 'stand', tone: 'mid', child: 1 } });
      wear(S, win, { edge: 14, spots: 10 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-05 : Dalvica, la charbonnière, septembre 1916 ── */
  'ph-05'(id) {
    const S = new Scene(id, 600, 470, 'photo');
    const win = mount(S, { m: 20, mb: 50, cardTone: 'paper-shade' });
    S.within(win.d, () => {
      S.p('photo-paper', win.d);
      foliage(S, 120, 60, 200, 70, { tone: 'dark', lumps: 20 });
      foliage(S, 470, 50, 200, 80, { tone: 'dark', lumps: 20 });
      // cabane de planches à gauche
      const hut = poly([[20, 300], [20, 140], [80, 110], [170, 140], [170, 300]], true);
      S.fill(hut, 'mid');
      let pl = '';
      for (let x = 30; x < 170; x += 12) pl += `M${x} ${x < 80 ? 140 - (x - 20) * 0.5 : 110 + (x - 80) * 0.33}V300`;
      S.ln(pl, 0.6, 'ink-faint');
      S.fill(poly([[10, 146], [80, 104], [180, 146], [170, 152], [80, 116], [20, 152]], true), 'dark');
      S.fill(rect(70, 200, 34, 100), 'dark');
      // meule fumante à droite
      const meule = smooth([[360, 330, 1], [384, 250], [450, 214], [520, 230], [568, 290], [580, 330, 1]], true);
      S.fill(meule, 'dark');
      S.stip(meule);
      S.ln(meule, 0.8, 'ink-soft');
      for (let i = 0; i < 6; i++) S.p('photo-light', ell(440 + i * 14 + S.r.jit(8), 200 - i * 30, 22 + i * 6, 14 + i * 3), { opacity: 0.55 - i * 0.06 });
      S.fill(rect(20, 300, 560, 120), 'mid', { opacity: 0.7 });
      S.stip(rect(20, 300, 560, 120), { opacity: 0.6 });
      // Dranko, l'enfant, Danela
      hc(S, 'dranko', 60, 150, 104, 0.47, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      hc(S, 'danela', 28, 296, 110, 0.45, { lower: { kind: 'skirt', tone: 'mid', apron: true, apronTone: 'dark' } });
      hc(S, 'andrin', 4, 238, 250, 0.24, { lower: { kind: 'stand', tone: 'light', child: 1 } });
      wear(S, win, { edge: 16, spots: 8, corners: [[1, 1, 40]] });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    // légende thalbère à l'encre, au bas du tirage
    S.ln(handLines(S.r, 60, 446, 320, 1, 10, { slant: 0.4, h: 4, step: 4.6 }), 1, 'ink');
    return S;
  },

  /* ── PH-06 : mariage de Colombe et d'Aimé, 6 octobre 1928 ── */
  'ph-06'(id) {
    const S = new Scene(id, 720, 480, 'photo');
    const win = card(S, { m: 24, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // perron de la maison Tessonnal
      const fac = rect(24, 24, 672, 250);
      S.fill(fac, 'light');
      let st = '';
      for (let y = 40; y < 274; y += 16) st += `M24 ${y}H696`;
      S.ln(st, 0.5, 'ink-faint');
      for (const x of [70, 560]) {
        S.fill(rect(x, 40, 70, 120), 'dark', { opacity: 0.8 });
        S.ln(rect(x, 40, 70, 120) + `M${x + 35} 40v120M${x} 100h70`, 0.6, 'ink-soft');
      }
      S.fill(rect(322, 30, 76, 160), 'dark');
      for (let i = 0; i < 4; i++) {
        const sd = rect(240 - i * 20, 240 + i * 10, 240 + i * 40, 10);
        S.fill(sd, 'light');
        S.ln(sd, 0.5, 'ink-soft');
      }
      S.fill(rect(24, 290, 672, 140), 'mid', { opacity: 0.6 });
      // rang du fond, debout
      const s = 0.38;
      extra(S, worker(2, { age: 52, hat: false, clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'wing', tie: 'tie' } }), 30, 74, s, { lower: { kind: 'stand', hatch: true } });
      hc(S, 'honore', 48, 100, 70, s * 1.04, { lower: { kind: 'stand', hatch: true } });
      hc(S, 'eugenie', 44, 168, 78, s, { lower: { kind: 'skirt', tone: 'mid' } });
      hc(S, 'marguerite', 45, 450, 80, s, { lower: { kind: 'skirt', tone: 'dark', dense: true } });
      extra(S, woman(1, { age: 40, clothes: { type: 'dress', wash: 'wash-lilas' } }), 520, 80, s, { lower: { kind: 'skirt', tone: 'mid' } });
      hc(S, 'bastien', 18, 592, 74, s, { patch: { clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'turn', tie: 'tie' } }, lower: { kind: 'stand', hatch: true } });
      // rang de devant : Clotilde assise, les mariés, un témoin
      hc(S, 'clotilde', 72, 150, 152, s, { lower: { kind: 'sitSkirt', hatch: true } });
      S.fill(smooth([[268, 150], [304, 144], [322, 190], [330, 280], [262, 286], [256, 200]], true), 'paper', { opacity: 0.85 });
      hc(S, 'colombe', 22, 258, 142, s, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'v' } }, lower: { kind: 'shortSkirt', tone: 'paper', legTone: 'light' } });
      hc(S, 'aime', 29, 334, 132, s * 1.02, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      extra(S, worker(5, { age: 30, hat: false, clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'wing', tie: 'bow' } }), 420, 140, s, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      wear(S, win, { edge: 12, spots: 6 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-07 : le personnel de la halle devant le four n° 2, juillet 1937 ── */
  'ph-07'(id) {
    const S = new Scene(id, 1000, 700, 'photo');
    S.p('paper-shade', rect(0, 0, 1000, 700));
    const win = { x: 24, y: 22, w: 952, h: 560, d: rect(24, 22, 952, 560) };
    S.p('photo-paper', rect(16, 14, 968, 576));
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      furnace(S, 24, 22, 976, 400, 500, 40, 220, 360);
      S.fill(rect(24, 400, 952, 182), 'mid');
      S.stip(rect(24, 400, 952, 182), { opacity: 0.4 });
      // gradin de bois du second rang
      const step = rect(24, 380, 952, 26);
      S.fill(step, 'dark');
      S.ln(step, 0.8, 'ink-soft');
      // second rang (debout sur le gradin) : cinq ouvriers, Mallet, Bastien, Andrin
      const sb = 0.6;
      const back = (i) => 58 + i * 112;
      for (let i = 0; i < 5; i++) extra(S, worker(i * 2 + 1, { hat: i === 2 ? undefined : false }), back(i), 50, sb, { light: true, lower: { kind: 'stand', tone: 'mid', hatch: true, foot: 560 } });
      hc(S, 'mallet', 60, back(5), 52, sb, { lower: { kind: 'stand', tone: 'mid', hatch: true, foot: 560 } });
      hc(S, 'bastien', 27, back(6), 46, sb, { lower: { kind: 'stand', tone: 'mid', hatch: true, foot: 560 } });
      const loA = lower(S, back(7), 50, sb, { kind: 'stand', tone: 'light', foot: 560, ...garment('andrin', 24) });
      loA.seam.parts.push({ d: leatherApron(S, back(7), 50, sb, 470), tone: 'mid', hatch: true });
      hc(S, 'andrin', 24, back(7), 50, sb, { lower: false, seam: loA.seam });
      // premier rang, assis sur un banc : Honoré, Colombe, Aimé, Danela, Lavergne, trois ouvriers
      const sf = 0.64;
      const front = (i) => 4 + i * 112;
      const fy = 236; // pieds des assis vers y 568
      const bench = rect(24, fy + 352 * sf, 952, 16);
      S.fill(bench, 'dark');
      S.ln(bench, 0.8, 'ink-soft');
      hc(S, 'honore', 56, front(0), fy - 4, sf, { lower: { kind: 'sit', tone: 'mid', hatch: true } });
      hc(S, 'colombe', 30, front(1), fy + 4, sf * 0.97, { lower: { kind: 'sitSkirt', tone: 'dark' } });
      hc(S, 'aime', 38, front(2), fy - 8, sf, { lower: { kind: 'sit', tone: 'dark', dense: true } });
      hc(S, 'danela', 49, front(3), fy + 2, sf * 0.97, { lower: { kind: 'sitSkirt', tone: 'mid' } });
      hc(S, 'lavergne', 50, front(4), fy - 6, sf, { lower: { kind: 'sit', tone: 'dark', hatch: true } });
      for (let i = 0; i < 3; i++) extra(S, worker(i * 3 + 2, { hat: false }), front(5 + i), fy - 2, sf, { light: true, lower: { kind: 'sit', tone: 'mid', hatch: true } });
      wear(S, win, { edge: 16, spots: 12, corners: [[1, 0, 50]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    // légende dactylographiée collée sous le tirage, coin droit arraché
    const lab = poly([[60, 604], [850, 604], [872, 622], [858, 640], [880, 668], [60, 668]], true);
    S.p('paper', lab);
    S.ln(lab, 0.6, 'ink-faint');
    printBlock(S, 76, 624, 780, 2, 18, { align: 'left', last: 0.98, word: [4, 14] });
    return S;
  },

  /* ── PH-08 : Lucie devant le refuge, août 1937 ── */
  'ph-08'(id) {
    const S = new Scene(id, 600, 470, 'photo');
    S.p('paper-shade', rect(0, 0, 600, 470));
    const ph = rect(20, 20, 380, 420);
    S.p('photo-paper', rect(12, 12, 396, 436));
    S.within(ph, () => {
      S.p('photo-light', ph);
      // mur de moellons et porte de planches du refuge
      const wall = rect(150, 20, 250, 420);
      S.fill(wall, 'light');
      let st = '';
      for (let y = 30, k = 0; y < 440; y += 16, k++) for (let x = 150 + (k % 2) * 14; x < 400; x += 30) st += rect(x + 1, y - 11, 26, 13);
      S.ln(st, 0.5, 'ink-faint');
      const door = rect(250, 120, 110, 300);
      S.fill(door, 'dark');
      let pl = '';
      for (let x = 268; x < 360; x += 18) pl += `M${x} 120V420`;
      S.ln(pl + door + 'M250 180H360M250 360H360', 0.8, 'ink-soft');
      // pente et ciel à gauche
      ridge(S, [[20, 120], [60, 80], [110, 104], [150, 70]], 260, 'mid');
      S.fill(rect(20, 380, 380, 60), 'mid', { opacity: 0.6 });
      hc(S, 'lucie', 23, 96, 66, 0.64, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      wear(S, { x: 20, y: 20, w: 380, h: 420 }, { edge: 12, spots: 6 });
    });
    S.ln(ph, 0.6, 'ink-faint');
    // dos du tirage en vignette : la dédicace au crayon
    S.open({ transform: 'rotate(6 500 380)' });
    const back = rect(420, 330, 160, 96);
    S.p('photo-paper', back);
    S.ln(back, 0.6, 'ink-soft');
    S.push('<text class="label-note" x="432" y="384" font-size="12">Pour B. — L. — août 37</text>');
    S.close();
    return S;
  },

  /* ── PH-09 (R) : fiche 38-0377, TESSONNAL Bastien, 24 mai 1938 ── */
  'ph-09'(id) {
    const shaved = { hat: null, hairStyle: 'none', hairOpt: { cowlick: false } };
    return fiche(id, (S, slot) => {
      slot(0, () => {
        hcBust(S, 'bastien', 28, 22, 12, 0.98, { clip: true, patch: shaved });
        S.stip(ell(90, 44, 44, 22), { opacity: 0.5 });
      });
      // profil droit : l'oreille droite, au lobe détaché, bien nette ; la main droite brûlée tient l'ardoise
      slot(1, () => {
        hcBust(S, 'bastien', 28, 290, 12, 0.98, { clip: true, patch: { ...shaved, flip: true } });
        profileEar(S, 290, 12, 0.98, { free: true, k: 1.25 });
        S.stip(ell(366, 44, 44, 22), { opacity: 0.5 });
        slate(S, 300, 210, 100, 36, '38-0377');
        hand(S, 412, 262, 160, 3.6, { skin: 2, burn: true });
      });
      // signature du détenu, au crayon pressé (T barré droit, détaché) ; celle de l'agent n° 64, à l'encre
      signature(S, 30, 328, 168, { t: false, h: 20, cls: 'ink-soft', sw: 1 });
      signature(S, 320, 330, 150, { h: 12, cls: 'ink' });
    });
  },

  /* ── PH-10 (R) : fiche 41-1987, DALVARIN Andrin, 25 septembre 1941 ── */
  'ph-10'(id) {
    return fiche(id, (S, slot) => {
      // de face, les deux mains posées sur l'ardoise : intactes
      slot(0, () => {
        hcBust(S, 'andrin', 29, 22, 6, 0.96, { clip: true, patch: { extras: [] } });
        slate(S, 40, 206, 176, 40, '41-1987 — 25.9.41');
        hand(S, 44, 246, -160, 3.2, { skin: 2 });
        hand(S, 212, 246, 160, 3.2, { skin: 2, mirror: true });
      });
      slot(1, () => {
        // profil droit : lobe adhérent, encoche de l'hélix au tiers supérieur (EX-03, oreille II)
        hcBust(S, 'andrin', 29, 290, 6, 0.96, { clip: true, patch: { extras: [], flip: true, marks: { helixNotch: true } } });
        profileEar(S, 290, 6, 0.96, { yAnth: true, notch: true, k: 1.25 });
      });
    });
  },

  /* ── PH-11 : mariage de Lucie et de Victorin, Vernezac, 12 avril 1947 ── */
  'ph-11'(id) {
    const S = new Scene(id, 740, 500, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // façade de l'église : portail en plein cintre, marches
      const fac = rect(22, 22, 696, 300);
      S.fill(fac, 'light');
      let st = '';
      for (let y = 40, k = 0; y < 322; y += 18, k++) for (let x = 22 + (k % 2) * 20; x < 718; x += 40) st += rect(x + 1, y - 16, 38, 16);
      S.ln(st, 0.5, 'ink-faint');
      const portal = 'M300 300V140A70 70 0 0 1 440 140V300Z';
      S.fill(portal, 'dark');
      S.ln(portal + 'M286 300V136A84 84 0 0 1 454 136V300', 1, 'ink-soft');
      for (let i = 0; i < 3; i++) {
        const sd = rect(150 - i * 30, 300 + i * 12, 440 + i * 60, 12);
        S.fill(sd, 'light');
        S.ln(sd, 0.5, 'ink-soft');
      }
      S.fill(rect(22, 336, 696, 112), 'mid', { opacity: 0.5 });
      // neige de printemps : plaques sur le parvis, flocons
      snowPatch(S, [[22, 380], [110, 366], [180, 384], [140, 448], [22, 448]]);
      snowPatch(S, [[600, 372], [680, 360], [718, 368], [718, 448], [640, 448]]);
      // rang du fond, sur les marches
      const s = 0.36;
      hc(S, 'philomene', 67, 36, 96, s, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      hc(S, 'remi', 39, 104, 88, s, { lower: { kind: 'stand', hatch: true } });
      hc(S, 'odette', 34, 172, 94, s, { patch: { clothes: { type: 'dress', wash: 'wash-lilas', neck: 'v' } }, lower: { kind: 'skirt', tone: 'mid' } });
      extra(S, woman(3, { age: 50, clothes: { type: 'dress', wash: 'wash-ardoise' } }), 470, 96, s, { light: true, lower: { kind: 'skirt', tone: 'mid' } });
      hc(S, 'fauvel', 45, 540, 84, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      extra(S, worker(7, { age: 44, hat: false, clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'turn', tie: 'tie' } }), 608, 90, s, { light: true, lower: { kind: 'stand', hatch: true } });
      // les mariés au centre
      S.fill(smooth([[292, 132], [330, 126], [350, 170], [356, 300], [284, 306], [276, 200]], true), 'paper', { opacity: 0.85 });
      hc(S, 'lucie', 33, 266, 124, s * 1.04, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'v' } }, lower: { kind: 'skirt', tone: 'paper' } });
      hc(S, 'victorin', 32, 352, 104, s * 1.12, { lower: { kind: 'stand', tone: 'dark', dense: true, buttons: true } });
      // les enfants devant : Gilles, Agnès (demoiselle d'honneur, épi), Brigitte
      hc(S, 'gilles', 10, 196, 252, 0.24, { lower: { kind: 'stand', tone: 'mid', child: 0.7 } });
      hc(S, 'agnes', 8, 262, 262, 0.23, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'claudine' } }, lower: { kind: 'shortSkirt', tone: 'paper', child: 0.8 } });
      hc(S, 'brigitte', 5, 450, 290, 0.2, { lower: { kind: 'shortSkirt', tone: 'light', child: 1 } });
      extra(S, worker(4, { age: 36, hat: false, clothes: { type: 'coat', wash: 'wash-ardoise', collar: 'turn', tie: 'tie' } }), 676, 92, s, { light: true, lower: { kind: 'stand', hatch: true } });
      snowfall(S, 22, 22, 718, 448, 90, 1.3);
      wear(S, win, { edge: 12, spots: 6 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-12 : la classe de Mme Neviot, école de Vernezac, juin 1947 ── */
  'ph-12'(id) {
    const S = new Scene(id, 720, 500, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // tableau noir, carte murale, poêle et son tuyau
      S.fill(rect(250, 34, 220, 80), 'dark');
      S.ln(handLines(S.r, 270, 70, 160, 2, 18, { h: 5, step: 5 }), 1.2, 'ink-faint');
      const map = rect(500, 34, 150, 110);
      S.fill(map, 'paper');
      S.ln(map + smooth([[520, 60], [560, 50], [600, 70], [630, 64], [620, 110], [580, 130], [530, 120], [516, 90]], true) + 'M560 50Q580 90 600 130', 0.8, 'ink-soft');
      const stove = smooth([[52, 300, 1], [50, 210], [62, 190], [104, 190], [116, 210], [114, 300, 1]], true);
      S.fill(stove, 'dark');
      S.ln(stove + 'M70 190V60H160V22', 6, 'ink-soft');
      S.fill(rect(22, 330, 676, 118), 'mid', { opacity: 0.6 });
      // trois rangs de sept élèves : deux rangs debout (bustes), le premier assis sur le banc
      const rows = [
        { y: 96, s: 0.29, x0: 150 },
        { y: 150, s: 0.3, x0: 140 },
        { y: 206, s: 0.31, x0: 130 },
      ];
      let k = 0;
      rows.forEach((row, ri) => {
        if (ri === 2) {
          const bench = rect(110, 330, 470, 16);
          S.fill(bench, 'dark');
          S.ln(bench, 0.8, 'ink-soft');
        }
        for (let i = 0; i < 7; i++) {
          const x = row.x0 + i * 60 + (ri % 2) * 10;
          const lw = ri === 2 ? { kind: k % 2 ? 'sit' : 'sitSkirt', tone: 'light', child: 0.7, arms: 'none', foot: 470 } : false;
          if (ri === 0 && i === 4) hc(S, 'gilles', 11, x, row.y, row.s, { lower: lw });
          else if (ri === 2 && i === 2) hc(S, 'agnes', 8, x, row.y, row.s, { lower: { ...lw, kind: 'sitSkirt' } });
          else if (ri === 2 && i === 5) hc(S, 'brigitte', 5, x + 4, row.y + 12, row.s * 0.92, { lower: { ...lw, kind: 'sitSkirt', foot: 440 } });
          else extra(S, kid(k, 7 + (k % 5)), x, row.y, row.s, { light: true, lower: lw ? { ...lw } : false });
          k++;
        }
      });
      // ardoises posées sur les genoux du premier rang
      let sl = '';
      for (let i = 0; i < 7; i++) sl += rect(130 + i * 60 + 10, 324, 30, 20);
      S.fill(sl, 'dark');
      S.ln(sl, 0.6, 'ink-soft');
      // l'institutrice, craie à la main
      hc(S, 'odette', 34, 588, 92, 0.38, { lower: { kind: 'skirt', tone: 'mid', hatch: true } });
      wear(S, win, { edge: 12, spots: 6 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-13 : « Dalvica, 1955 — D. et A. » ── */
  'ph-13'(id) {
    const S = new Scene(id, 600, 470, 'photo');
    const win = mount(S, { m: 20, mb: 50, cardTone: 'photo-paper', gilt: false });
    S.within(win.d, () => {
      S.p('photo-paper', win.d);
      ridge(S, [[20, 120], [120, 70], [210, 100], [330, 50], [450, 96], [580, 64]], 220, 'light');
      // maison de bois : planches, fenêtre, auvent
      const house = poly([[30, 330], [30, 150], [150, 96], [300, 150], [300, 330]], true);
      S.fill(house, 'mid');
      let pl = '';
      for (let y = 160; y < 330; y += 10) pl += `M30 ${y}H300`;
      S.ln(pl, 0.5, 'ink-faint');
      S.fill(poly([[16, 156], [150, 88], [314, 156], [300, 164], [150, 102], [30, 164]], true), 'dark');
      S.fill(rect(70, 190, 50, 56), 'dark');
      S.ln(rect(70, 190, 50, 56) + 'M95 190v56M70 218h50', 0.8, 'ink-soft');
      S.fill(rect(20, 330, 560, 100), 'mid', { opacity: 0.55 });
      // clôture à droite, la voisine derrière
      hcBust(S, 'rovin', 40, 440, 126, 0.42, { clip: true });
      let fence = '';
      for (let x = 380; x < 580; x += 16) fence += poly([[x, 330], [x, 214], [x + 5, 206], [x + 10, 214], [x + 10, 330]], true);
      S.fill(fence, 'light');
      S.ln(fence + 'M374 240H580M374 300H580', 0.8, 'ink-soft');
      // Danela, 67 ans, et Andrin, 42 ans, loupe au cordon
      hc(S, 'danela', 67, 150, 112, 0.44, { patch: { clothes: { type: 'shawl', wash: 'wash-sienne', dress: 'wash-ardoise' } }, lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      hc(S, 'andrin41', 42, 240, 100, 0.46, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      wear(S, win, { edge: 14, spots: 7, corners: [[0, 1, 40]] });
    });
    S.ln(win.d, 0.6, 'ink-faint');
    // écriture de Danela au bas du tirage
    S.ln(handLines(S.r, 40, 446, 200, 1, 10, { slant: 0.3, h: 4.4, step: 5 }), 1, 'ink');
    return S;
  },

  /* ── PH-14 : mariage d'Isaure et de Julien, Studio Orlhac, 21 juin 1958 ── */
  'ph-14'(id) {
    const S = new Scene(id, 740, 500, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // toile peinte : parc, colonnade, ciel nuageux
      S.fill(rect(22, 22, 696, 330), 'light');
      foliage(S, 120, 120, 120, 90, { tone: 'mid', lumps: 16 });
      foliage(S, 620, 110, 110, 90, { tone: 'mid', lumps: 16 });
      for (const x of [260, 330, 400, 470]) {
        S.fill(rect(x, 80, 22, 220), 'paper', { opacity: 0.8 });
        S.ln(rect(x, 80, 22, 220), 0.6, 'ink-faint');
      }
      S.fill(rect(240, 70, 270, 12), 'paper', { opacity: 0.8 });
      S.fill(rect(22, 352, 696, 96), 'mid', { opacity: 0.7 });
      const s = 0.37;
      extra(S, woman(5, { age: 56, clothes: { type: 'dress', wash: 'wash-ardoise' } }), 30, 92, s, { light: true, lower: { kind: 'skirt', tone: 'mid' } });
      hc(S, 'leon', 62, 98, 86, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      hc(S, 'julien', 30, 168, 84, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      S.fill(smooth([[268, 120], [306, 114], [330, 170], [340, 330], [262, 336], [252, 200]], true), 'paper', { opacity: 0.85 });
      hc(S, 'isaure', 24, 244, 104, s, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'v' } }, lower: { kind: 'skirt', tone: 'paper' } });
      hc(S, 'aime', 59, 330, 86, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      hc(S, 'colombe', 51, 400, 96, s, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      hc(S, 'hugues', 27, 470, 88, s, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      extra(S, worker(9, { age: 34, hat: false, clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'turn', tie: 'tie' } }), 540, 88, s, { light: true, lower: { kind: 'stand', tone: 'dark', hatch: true } });
      // Honoré, 77 ans, assis devant, la canne entre les genoux
      const chair = smooth([[612, 300], [616, 220], [660, 210], [704, 220], [706, 300]], true);
      S.fill(chair, 'dark');
      S.ln(chair + 'M616 330V420M704 330V420', 1.2, 'ink-soft');
      hc(S, 'honore', 77, 600, 170, s, { lower: { kind: 'sit', hatch: true } });
      S.ln('M640 300L652 420', 2.4, 'ink');
      wear(S, win, { edge: 10, spots: 5 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-15 : mariage d'Hugues et de Sabine, mairie de Hautcorvin, 4 juin 1960 ── */
  'ph-15'(id) {
    const S = new Scene(id, 680, 500, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // façade et escalier de la mairie
      S.fill(rect(22, 22, 636, 220), 'light');
      for (const x of [80, 280, 480]) {
        S.fill(rect(x, 40, 120, 170), 'dark', { opacity: 0.85 });
        S.ln(rect(x, 40, 120, 170) + `M${x + 60} 40v170`, 0.8, 'ink-soft');
      }
      for (let i = 0; i < 9; i++) {
        const sd = rect(22, 200 + i * 26, 636, 26);
        S.fill(sd, i % 2 ? 'light' : 'paper');
        S.ln(`M22 ${200 + i * 26}H658`, 0.6, 'ink-soft');
      }
      // en haut des marches
      const s = 0.36;
      hc(S, 'honore', 79, 120, 60, s, { lower: { kind: 'stand', hatch: true } });
      S.ln('M190 210L196 280', 2.4, 'ink');
      hc(S, 'colombe', 53, 200, 66, s, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      hc(S, 'isaure', 26, 390, 70, s, { lower: { kind: 'skirt', tone: 'mid' } });
      hc(S, 'julien', 32, 460, 60, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      // les mariés, deux marches plus bas
      S.fill(smooth([[328, 186], [372, 180], [390, 230], [394, 330], [316, 336], [308, 260]], true), 'paper', { opacity: 0.85 });
      hc(S, 'sabine', 24, 300, 172, 0.4, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'v' } }, lower: { kind: 'skirt', tone: 'paper' } });
      hc(S, 'hugues', 29, 230, 160, 0.42, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      wear(S, win, { edge: 10, spots: 5 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-16 : fête de la neige à Vernezac, 17 février 1974 (couleurs passées) ── */
  'ph-16'(id) {
    const S = new Scene(id, 760, 520, 'color');
    S.p('paper', rect(0, 0, 760, 520));
    const pd = rect(16, 16, 728, 488);
    S.within(pd, () => {
      // ciel, montagne, chalets
      S.fill(rect(16, 16, 728, 160), { c: 'wash-indigo' }, { opacity: 0.5 });
      ridge(S, [[16, 110], [140, 50], [260, 96], [400, 40], [560, 92], [744, 60]], 200, { p: 'light', c: 'wash-ardoise' });
      const chalet = (x, w, cls) => {
        const d = poly([[x, 330], [x, 190], [x + w / 2, 150], [x + w, 190], [x + w, 330]], true);
        S.fill(d, { c: cls });
        S.ln(d, 0.8, 'ink-soft');
        S.p('paper', poly([[x - 10, 194], [x + w / 2, 146], [x + w + 10, 194], [x + w + 4, 200], [x + w / 2, 158], [x - 4, 200]], true));
        S.ln(poly([[x - 10, 194], [x + w / 2, 146], [x + w + 10, 194]]), 0.8, 'ink-soft');
      };
      chalet(30, 180, 'wash-sienne');
      chalet(520, 210, 'wash-carmin');
      // vitrine à droite : le reflet de Sabine qui photographie
      const vit = rect(540, 220, 170, 110);
      S.fill(vit, { c: 'wash-celadon' }, { opacity: 0.8 });
      S.within(vit, () => {
        hcBust(S, 'sabine', 38, 566, 214, 0.62, { clip: true, opacity: 0.7, mode: 'color' });
        const cam = rect(592, 268, 36, 20);
        S.black(cam, { opacity: 0.5 });
        S.p('rehaut', poly([[540, 220], [580, 220], [660, 330], [620, 330]], true), { opacity: 0.6 });
      });
      S.ln(vit + 'M625 220v110', 1, 'ink');
      // banderole de l'école de ski
      const ban = 'M190 120Q380 140 540 118L540 150Q380 172 190 152Z';
      S.fill(ban, { c: 'wash-carmin' });
      S.ln(ban + 'M190 120V330M540 118V330', 1, 'ink-soft');
      S.push('<text class="label" x="365" y="148" text-anchor="middle" font-size="16">École de ski</text>');
      // rue enneigée
      S.p('paper', rect(16, 330, 728, 174));
      S.ln('M16 360Q380 340 744 370M16 420Q380 400 744 430', 0.5, 'ink-faint');
      crowd(S, 200, 520, 300, 12, 14, { tone: 'mid', hats: 0.8 });
      // stand des Postes : table, panneau, Brigitte
      const tbl = rect(36, 360, 150, 50);
      hc(S, 'brigitte', 32, 64, 214, 0.42, { mode: 'color', lower: false, patch: { hands: [] } });
      S.fill(tbl, { c: 'wash-safran' });
      S.ln(tbl, 0.8, 'ink');
      S.push('<text class="label-note" x="111" y="390" text-anchor="middle" font-size="12" font-style="normal">POSTES</text>');
      // Victorin (canne), Agnès, Gilles (piolet, n° 31), Pierre (moniteur)
      hc(S, 'victorin', 59, 200, 200, 0.45, { mode: 'color', lower: { kind: 'stand', tone: { p: 'mid', c: 'wash-sienne' } } });
      S.ln('M282 400L290 476', 2.4, 'ink');
      hc(S, 'agnes', 35, 286, 222, 0.42, { mode: 'color', patch: { clothes: { type: 'coat', wash: 'wash-indigo', collar: 'turn', tie: 'none' } }, lower: { kind: 'skirt', tone: { p: 'mid', c: 'wash-indigo' } } });
      hc(S, 'gilles', 37, 370, 208, 0.44, { mode: 'color', lower: { kind: 'stand', tone: { p: 'mid', c: 'wash-sienne' } } });
      hc(S, 'pierre', 25, 452, 210, 0.44, { mode: 'color', lower: { kind: 'stand', tone: { p: 'mid', c: 'wash-carmin' } } });
      snowfall(S, 16, 16, 744, 504, 80, 1.4);
      // couleurs passées : voile clair et jaunissement
      S.p('paper', pd, { opacity: 0.18 });
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

  /* ── PH-17 : négatifs du Studio Orlhac, 9 janvier 1976 (face et profil droit) ── */
  'ph-17'(id) {
    const S = new Scene(id, 660, 440, 'photo');
    S.p('paper-shade', rect(0, 0, 660, 440));
    // bande de deux négatifs : support clair, image inversée
    S.open({ transform: 'rotate(-3 300 160)' });
    const strip = rect(20, 40, 500, 240);
    S.p('photo-light', strip);
    let perf = '';
    for (let x = 30; x < 520; x += 20) perf += rect(x, 48, 10, 12) + rect(x, 260, 10, 12);
    S.p('photo-paper', perf);
    S.ln(perf, 0.5, 'ink-faint');
    for (const [i, x] of [[0, 34], [1, 278]]) {
      const fr = rect(x, 72, 228, 176);
      S.within(fr, () => {
        S.p('photo-dark', fr);
        const n0 = S.out.length;
        hcBust(S, 'andrin63', 63, x + 30, 60, 1.0, { clip: true, patch: i ? { flip: true, marks: { helixNotch: true } } : {} });
        if (i) profileEar(S, x + 30, 60, 1.0, { yAnth: true, notch: true, k: 1.3 });
        invert(S, n0);
      });
      S.ln(fr, 0.6, 'ink-faint');
    }
    S.close();
    // pochette annotée
    sleeve(S, 440, 230, 200, 190, { rot: 5, date: '9.1.76', lines: 4 });
    return S;
  },

  /* ── EP-02 : « Tous les vivants », devant le refuge de l'Ourse, 10 juillet 1976 (tirage 13 × 18, bords blancs) ── */
  'ep-02'(id) {
    const S = new Scene(id, 720, 520, 'photo');
    const win = mount(S, { m: 24, cardTone: 'photo-paper', gilt: false });
    S.within(win.d, () => {
      S.p('photo-paper', win.d);
      // plein soleil : crêtes, éboulis et plaques de neige d'été
      ridge(S, [[24, 150], [110, 92], [190, 122], [260, 70], [330, 104], [420, 66], [520, 116], [610, 80], [696, 120]], 300, 'light');
      S.fill(rect(24, 300, 672, 196), 'mid', { opacity: 0.55 });
      S.stip(rect(24, 300, 672, 196), { opacity: 0.45 });
      let sc = '';
      for (let k = 0; k < 70; k++) sc += ell(30 + S.r() * 660, 304 + S.r() * 60, 3 + S.r() * 5, 1.6 + S.r() * 2);
      S.fill(sc, 'light');
      S.ln(sc, 0.4, 'ink-faint');
      snowPatch(S, [[40, 316], [120, 306], [170, 320], [130, 334], [40, 330]]);
      snowPatch(S, [[600, 300], [670, 296], [694, 312], [640, 322]]);
      // le refuge : moellons, toit de lauzes, porte ouverte au soleil
      const wall = rect(250, 168, 230, 150);
      S.fill(wall, 'light');
      let st = '';
      for (let y = 178, k = 0; y < 318; y += 14, k++) for (let x = 250 + (k % 2) * 12; x < 480; x += 26) st += rect(x + 1, y - 9, 22 + (x % 3), 11);
      S.ln(st, 0.5, 'ink-faint');
      const roof = poly([[236, 172], [365, 110], [494, 172]], true);
      S.fill(roof, 'dark');
      S.ln(roof + wall, 0.8, 'ink-soft');
      S.fill(rect(340, 222, 52, 96), 'dark');
      // le sentier qui descend vers la droite, en lacets
      S.ln('M480 330Q560 340 600 372T690 420', 6, 'ink-faint', { opacity: 0.5 });
      // ombres portées (soleil haut)
      const shadow = (x, w) => S.p('ombre', ell(x, 478, w, 6));
      // second plan : le jeune homme aux oreilles décollées, lunettes de glacier relevées
      hc(S, 'pierre', 27, 262, 190, 0.43, { patch: { hat: null, marks: { bigEars: true }, clothes: { type: 'coat', wash: 'paper', dark: false, collar: 'open', lapels: false } }, lower: { kind: 'stand', tone: 'mid', hatch: true } });
      // à gauche : le guide barbu, n° 31, piolet sous le bras ; la dame aux lunettes papillon à son bras
      shadow(96, 34);
      hc(S, 'gilles', 39, 52, 216, 0.42, { patch: { hat: null, extras: [{ type: 'badge', n: 31, x: 44, y: 172 }] }, lower: { kind: 'stand', hatch: true } });
      // piolet sous le bras, à la façon d'un parapluie : tête en arrière, pointe vers le sol devant lui
      S.ln('M146 290L70 344', 3.2, 'ink');
      S.fill(smooth([[132, 284], [150, 274], [160, 282], [150, 290]], true), 'dark');
      S.ln('M136 272Q150 280 166 296', 2.6, 'ink');
      shadow(160, 30);
      hc(S, 'brigitte', 34, 118, 222, 0.41, { lower: { kind: 'skirt', tone: 'mid', arms: 'right' } });
      // son bras passé sous celui du guide
      limb(S, [[128, 302], [126, 334], [116, 356]], 12, 'mid', { hatch: true, skin: 2, size: 2.4, ang: 150 });
      // au centre : l'homme maigre en costume de toile, loupe au cordon ; la femme qui rit, sifflet au cou
      shadow(268, 30);
      hc(S, 'andrin63', 63, 226, 214, 0.42, { patch: { clothes: { type: 'coat', wash: 'paper-shade', dark: false, collar: 'open', tie: 'none', lapelW: 1.3 } }, lower: { kind: 'stand', tone: 'light', w: 1.06 } });
      shadow(336, 30);
      hc(S, 'agnes', 37, 296, 218, 0.41, { patch: { mouth: { smile: 1, teeth: true }, eyes: { gaze: 0.6 } }, lower: { kind: 'stand', tone: 'mid', hatch: true } });
      // le très grand vieillard aux oreilles décollées, appuyé sur une canne
      shadow(408, 32);
      hc(S, 'remi', 67, 362, 186, 0.47, { patch: { hat: null, hair: 'gris', brows: { color: 'gris' }, marks: { bigEars: true }, extras: [] }, lower: { kind: 'stand', tone: 'mid', hatch: true, foot: 608, arms: 'left' } });
      limb(S, [[434, 280], [444, 330], [440, 372]], 13, 'mid', { hatch: true, none: true });
      S.ln('M441 370L450 476', 3, 'ink');
      S.ln('M441 370q-6 -8 -14 -2', 3, 'ink');
      hand(S, 441, 372, 0, 2.6, { skin: 2, fist: true });
      // un peu à part : l'homme chauve en nœud papillon, qui a gardé sa veste
      shadow(530, 30);
      hc(S, 'hugues', 45, 488, 214, 0.42, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      // au bord droit, en contrebas : la vieille dame en manteau noir, assise sur une pierre, la canne en travers des genoux
      const stone = smooth([[596, 448], [624, 436], [668, 440], [684, 470], [600, 474]], true);
      S.fill(stone, 'light');
      S.ln(stone, 0.7, 'ink-soft');
      hc(S, 'colombe', 70, 584, 300, 0.33, { patch: { hands: [] }, lower: { kind: 'sitSkirt', tone: 'dark' } });
      S.ln('M590 432L676 424', 2.6, 'ink');
      wear(S, win, { edge: 10, spots: 6 });
    });
    S.ln(win.d, 0.6, 'ink-soft');
    return S;
  },

  /* ── CP-01 : « Cap de Tennok — le phare », carte-photo, décembre 1911 ── */
  'cp-01'(id) {
    const S = new Scene(id, 720, 440, 'photo');
    S.p('paper-shade', rect(0, 0, 720, 440));
    const pc = rect(12, 12, 560, 380);
    S.p('photo-paper', pc);
    const pd = rect(22, 22, 540, 330);
    S.within(pd, () => {
      S.p('photo-light', pd);
      S.fill(rect(22, 200, 540, 152), 'mid', { opacity: 0.7 });
      waterLines(S, 22, 206, 562, 352, { sp: 5 });
      reefs(S, 30, 260, 250, 16, 7);
      const cape = smooth([[260, 352], [300, 240], [380, 220], [470, 226], [562, 236], [562, 352]], true);
      S.fill(cape, 'mid');
      S.hat(cape);
      S.ln(cape, 0.8, 'ink-soft');
      const lh = lighthouse(S, 420, 230, 190, { band: 'red', wBase: 0.18, wTop: 0.13 });
      // silhouette d'un homme à lunettes dans la lanterne
      const lx = 420;
      const ly = lh.lampY;
      S.black(ell(lx - 4, ly - 3, 4, 5) + rect(lx - 9, ly + 1, 10, 9));
      S.p('photo-paper', circ(lx - 2.4, ly - 3.4, 1.1) + circ(lx + 0.6, ly - 3.4, 1.1));
    });
    S.ln(pd, 0.6, 'ink-faint');
    S.push('<text class="label-note" x="34" y="378" font-size="13">Cap de Tennok — le phare</text>');
    // verso en vignette : correspondance, timbre, cachet
    S.open({ transform: 'rotate(5 610 330)' });
    const vs = rect(500, 220, 210, 150);
    S.p('paper', vs);
    S.ln(vs + 'M605 236V356', 0.6, 'ink-soft');
    S.ln(handLines(S.r, 510, 250, 88, 6, 16, { slant: 0.6, h: 2.6, step: 3.2 }), 0.7, 'ink');
    S.ln(rect(670, 230, 30, 36), 0.8, 'ink-soft');
    S.ln(circ(668, 262, 14), 0.6, 'ink-faint');
    S.ln('M614 300h86M614 318h86M614 336h70', 0.5, 'ink-faint');
    S.close();
    return S;
  },

  /* ── CP-02 : « Vernezac — la Combe-aux-Sables, les carriers », vers 1905 ── */
  'cp-02'(id) {
    const S = new Scene(id, 640, 440, 'photo');
    S.p('paper-shade', rect(0, 0, 640, 440));
    const pd = rect(16, 16, 608, 370);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // pente boisée et grande entaille blanche du sable
      const hill = poly([[16, 60], [200, 30], [420, 50], [624, 24], [624, 386], [16, 386]], true);
      S.fill(hill, 'mid');
      S.stip(hill, { opacity: 0.5 });
      const cutD = smooth([[180, 52], [300, 60], [420, 120], [470, 250, 1], [140, 250, 1], [160, 120]], true);
      S.p('photo-paper', cutD);
      S.ln(cutD + 'M200 110Q300 130 420 150M170 180Q300 196 450 206', 0.6, 'ink-faint');
      S.fill(rect(16, 250, 608, 136), 'light');
      S.stip(rect(16, 250, 608, 136), { opacity: 0.3 });
      // tombereau à deux grandes roues, brouettes (aucun rail)
      const cart = poly([[440, 250], [560, 250], [552, 292], [448, 292]], true);
      S.fill(cart, 'dark');
      S.ln(cart + circ(500, 304, 24) + 'M500 280v48M476 304h48M560 270L610 262', 1, 'ink-soft');
      for (const [x, y] of [[90, 330], [190, 342]]) {
        const b = poly([[x, y], [x + 46, y], [x + 40, y + 16], [x + 6, y + 16]], true);
        S.fill(b, 'mid');
        S.ln(b + circ(x + 50, y + 18, 6) + `M${x} ${y + 4}l-26 10`, 0.8, 'ink-soft');
      }
      // les carriers : Barthélemy à la pelle, Jules jeune guide ; Annette sur sa mule
      hc(S, 'barthelemy', 58, 220, 150, 0.32, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      hc(S, 'jules', 28, 300, 152, 0.31, { lower: { kind: 'stand', hatch: true } });
      mule(S, 120, 238, 0.85);
      hc(S, 'annette', 54, 80, 124, 0.3, { lower: { kind: 'sitSkirt', tone: 'dark', hatch: true, foot: 470 } });
    });
    S.ln(pd, 0.6, 'ink-faint');
    S.push('<text class="label-note" x="26" y="410" font-size="13">Vernezac — la Combe-aux-Sables, les carriers</text>');
    return S;
  },

  /* ── PH-18 : Les lauréats de la Saint-Éloi, 1er décembre 1935 ── */
  'ph-18'(id) {
    const S = new Scene(id, 760, 660, 'photo');
    S.p('paper-shade', rect(0, 0, 760, 660));
    // tirage sur carton du studio
    const card = rect(16, 14, 540, 632);
    S.p('photo-light', card);
    S.ln(card, 0.6, 'ink-faint');
    const win = { x: 34, y: 32, w: 504, h: 576, d: rect(34, 32, 504, 576) };
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      furnace(S, 34, 32, 538, 470, 280, 120, 160, 300);
      // sol de la halle, dalles
      S.fill(rect(34, 470, 504, 140), 'mid');
      S.ln('M34 500H538M34 550H538M150 470L120 610M286 470V610M420 470L450 610', 0.5, 'ink-faint');
      const s = 0.95;
      // ── Bastien, à gauche : nu-tête (épi), canne de souffleur dans la main droite, casquette dans la gauche
      const bx = 36;
      const by = 40;
      const B = (u, v) => [bx + u * s, by + v * s];
      const gB = garment('bastien', 25, { hat: null });
      const loB = lower(S, bx, by, s, { kind: 'stand', tone: 'mid', hatch: true, arms: 'none', w: 0.98, legTone: 'dark', ...gB });
      const sleeveB = { hatch: gB.torsoHatch, dense: gB.torsoDense, none: true };
      limb(S, [B(16, 200), B(6, 290), B(26, 350)], 30, gB.torsoTone, sleeveB);
      limb(S, [B(140, 200), B(154, 290), B(136, 338)], 30, gB.torsoTone, sleeveB);
      glassCane(S, B(14, 180), B(38, 600));
      hand(S, ...B(28, 346), -14, 4.8, { skin: 2, fist: true });
      shinyBurn(S, ...B(28, 362), 6.5);
      heldCap(S, ...B(132, 352), 0.95);
      hand(S, ...B(134, 340), 18, 4.4, { skin: 2, fist: true });
      hc(S, 'bastien', 25, bx, by, s, { lower: false, seam: loB.seam, patch: { hat: null } });
      // ── Andrin, à droite : tablier de cuir, coupe gravée dans les deux mains, loupe au cordon
      const ax = 318;
      const ay = 46;
      const A = (u, v) => [ax + u * s, ay + v * s];
      const gA = garment('andrin', 23);
      const loA = lower(S, ax, ay, s, { kind: 'stand', tone: 'light', arms: 'none', w: 0.98, legTone: 'dark', ...gA });
      loA.seam.parts.push({ d: leatherApron(S, ax, ay, s, 510), tone: 'mid', hatch: true });
      const sleeveA = { hatch: gA.torsoHatch, dense: gA.torsoDense, none: true };
      limb(S, [A(16, 200), A(4, 280), A(56, 326)], 30, gA.torsoTone, sleeveA);
      limb(S, [A(140, 200), A(152, 280), A(98, 326)], 30, gA.torsoTone, sleeveA);
      goblet(S, ...A(77, 236), 66, 96);
      hand(S, ...A(54, 334), -62, 4.6, { skin: 2 });
      hand(S, ...A(100, 334), 62, 4.6, { skin: 2, mirror: true });
      hc(S, 'andrin', 23, ax, ay, s, { lower: false, seam: loA.seam });
      wear(S, win, { edge: 14, spots: 7, corners: [[1, 0, 40]] });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    // timbre sec du studio, coin inférieur droit du carton
    S.ln(ell(486, 628, 40, 9) + ell(486, 628, 34, 6), 0.5, 'ink-faint');
    // pochette manuscrite à côté
    sleeve(S, 568, 210, 176, 250, { rot: 4, date: '1.12.35', lines: 6 });
    return S;
  },

};
