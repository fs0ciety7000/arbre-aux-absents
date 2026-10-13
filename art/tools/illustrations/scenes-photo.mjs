/**
 * Photographies et tirages (séries OF, PH, EP) : docs/scenario/illustrations.md.
 */
import { Scene, mount, wear, foliage, crowd, lighthouse, reefs, waterLines, printBlock, headline, fern } from './kit.mjs';
import { fam, lower, person, extra } from './fam.mjs';
import { head, hand } from './people.mjs';
import { rect, ell, circ, smooth, poly, tube, f, handLines, textLines } from './lib.mjs';

/** Bras de scène (coordonnées de la scène) terminé par une main. */
export function arm(S, pts, w, tone, h = {}) {
  const d = tube(pts, w, w * 0.78);
  S.fill(d, tone);
  if (h.dense) S.hatd(d);
  S.ln(d, 0.7, S.mode === 'photo' ? 'ink-soft' : 'ink');
  if (h.none) return;
  const a = pts[pts.length - 1];
  const b = pts[pts.length - 2];
  const ang = (Math.atan2(a[1] - b[1], a[0] - b[0]) * 180) / Math.PI - 90;
  hand(S, a[0], a[1], h.ang ?? ang, h.size ?? w / 4.6, h, (x) => x);
}

/** Balustrade peinte de studio. */
function balustrade(S, x0, x1, y, h) {
  S.fill(rect(x0, y - 6, x1 - x0, 6), 'light');
  S.fill(rect(x0, y + h, x1 - x0, 7), 'light');
  let d = '';
  for (let x = x0 + 8; x < x1; x += 15) d += smooth([[x - 3, y], [x - 4.5, y + h * 0.25], [x - 2, y + h * 0.55], [x - 5, y + h * 0.8], [x - 3, y + h], [x + 3, y + h], [x + 5, y + h * 0.8], [x + 2, y + h * 0.55], [x + 4.5, y + h * 0.25], [x + 3, y]], true);
  S.fill(d, 'light');
  S.ln(d + rect(x0, y - 6, x1 - x0, 6) + rect(x0, y + h, x1 - x0, 7), 0.6, 'ink-faint');
}

/** Palmier en pot. */
function palm(S, x, y, s) {
  const pot = poly([[x - 14 * s, y], [x + 14 * s, y], [x + 10 * s, y + 26 * s], [x - 10 * s, y + 26 * s]], true);
  let leaves = '';
  let ribs = '';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.34;
    const L = (58 + (i % 3) * 14) * s;
    const ex = x + Math.cos(a) * L;
    const ey = y - 4 + Math.sin(a) * L * 0.8 + Math.abs(i - 4) * 10 * s;
    const mx = x + Math.cos(a) * L * 0.5;
    const my = y - 4 + Math.sin(a) * L * 0.8 - 12 * s;
    const nx = -Math.sin(a) * 9 * s;
    const ny = Math.cos(a) * 9 * s;
    leaves += smooth([[x, y - 2, 1], [mx + nx, my + ny], [ex, ey, 1], [mx - nx, my - ny]], true);
    ribs += `M${f(x)} ${f(y - 2)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`;
  }
  S.fill(leaves, 'mid', { opacity: 0.8 });
  S.ln(leaves, 0.5, 'ink-faint');
  S.ln(ribs, 0.6, 'ink-soft');
  S.fill(pot, 'mid');
  S.hat(pot);
  S.ln(pot, 0.7, 'ink-soft');
}

/** Fauteuil (dossier derrière le personnage assis ; à oreilles si `ears`). */
function armchair(S, x, y, w, h, tone = 'mid', ears = false) {
  const back = ears
    ? smooth([[x - w * 0.42, y + h * 0.75], [x - w * 0.46, y + h * 0.2], [x - w * 0.36, y + 2], [x, y - 8], [x + w * 0.36, y + 2], [x + w * 0.46, y + h * 0.2], [x + w * 0.42, y + h * 0.75]], true)
    : smooth([[x - w * 0.38, y + h * 0.75], [x - w * 0.4, y + 10], [x, y - 2], [x + w * 0.4, y + 10], [x + w * 0.38, y + h * 0.75]], true);
  S.fill(back, tone);
  S.hat(back);
  S.ln(back, 0.8, 'ink-soft');
  // capitons
  let b = '';
  for (let i = 0; i < 9; i++) b += circ(x - w * 0.25 + (i % 3) * w * 0.25, y + h * (0.12 + Math.floor(i / 3) * 0.14), 1.6);
  S.fill(b, 'dark');
  if (ears)
    for (const sd of [-1, 1]) {
      const wing = smooth([[x + sd * w * 0.46, y + h * 0.2], [x + sd * w * 0.56, y + h * 0.12], [x + sd * w * 0.58, y + h * 0.4], [x + sd * w * 0.5, y + h * 0.52], [x + sd * w * 0.44, y + h * 0.5]], true);
      S.fill(wing, tone);
      S.hatd(wing);
      S.ln(wing, 0.8, 'ink-soft');
    }
  for (const sd of [-1, 1]) {
    const am = smooth([[x + sd * w * 0.36, y + h * 0.55], [x + sd * w * 0.52, y + h * 0.54], [x + sd * w * 0.54, y + h * 0.62], [x + sd * w * 0.5, y + h], [x + sd * w * 0.36, y + h]], true);
    S.fill(am, tone);
    S.hatd(am);
    S.ln(am, 0.8, 'ink-soft');
  }
}

/** Tilleul : tronc et houppier. */
function tilleul(S, x, y, rx, ry, trunkH = 80) {
  const tr = poly([[x - 9, y + ry * 0.6 + trunkH], [x - 6, y + ry * 0.4], [x + 6, y + ry * 0.4], [x + 10, y + ry * 0.6 + trunkH]], true);
  S.fill(tr, 'dark');
  S.ln(tr, 0.7, 'ink-soft');
  foliage(S, x, y, rx, ry, { tone: 'mid', lumps: 18 });
}

/** Perron de maison de maître (façade, porte, marches). */
function perron(S, x0, x1, yTop, yGround, o = {}) {
  const fac = rect(x0, yTop, x1 - x0, yGround - yTop);
  S.fill(fac, 'light');
  let st = '';
  for (let yy = yTop + 14; yy < yGround; yy += 14) st += `M${x0} ${yy}H${x1}`;
  S.ln(st, 0.5, 'ink-faint');
  const cx = (x0 + x1) / 2;
  const door = rect(cx - 26, yGround - 120, 52, 92);
  S.fill(door, 'dark');
  S.ln(door + `M${cx} ${yGround - 120}v92`, 0.7, 'ink-soft');
  for (const wx of o.windows ?? [x0 + 40, x1 - 80]) {
    const w = rect(wx, yTop + 20, 40, 70);
    S.fill(w, 'dark', { opacity: 0.8 });
    S.ln(w + `M${wx + 20} ${yTop + 20}v70M${wx} ${yTop + 55}h40`, 0.6, 'ink-soft');
  }
  for (let i = 0; i < 4; i++) {
    const st2 = rect(cx - 70 - i * 14, yGround - 28 + i * 7, 140 + i * 28, 7);
    S.fill(st2, 'light');
    S.ln(st2, 0.6, 'ink-soft');
  }
}

/** Grain d'une photo de presse : trame légère sur toute l'image. */
function halftone(S, d, op = 0.35) {
  S.stip(d, { opacity: op });
}

/** Bonnet de laine posé sur une tête de buste (centre du visage fx, fy ; échelle s). */
function beanie(S, fx, fy, s) {
  const d = smooth([[fx - 34 * s, fy - 34 * s], [fx - 30 * s, fy - 62 * s], [fx, fy - 76 * s], [fx + 34 * s, fy - 62 * s], [fx + 40 * s, fy - 32 * s], [fx, fy - 40 * s]], true);
  S.fill(d, 'dark');
  S.ln(d, 0.6, 'ink-soft');
  S.ln(`M${f(fx - 34 * s)} ${f(fy - 42 * s)}Q${f(fx)} ${f(fy - 50 * s)} ${f(fx + 40 * s)} ${f(fy - 40 * s)}`, 0.8, 'ink-faint');
}

/** Gilet de liège lacé sur un buste (repère du buste x, y, s). */
function cork(S, x, y, s, open = false) {
  let b = '';
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4; i++) {
      if (open && (i === 1 || i === 2)) continue;
      b += rect(x + (22 + i * 30) * s, y + (150 + row * 40) * s, 27 * s, 36 * s);
    }
  S.fill(b, 'light');
  S.ln(b, 0.5, 'ink-soft');
  if (open) S.ln(`M${f(x + 54 * s)} ${f(y + 150 * s)}v${f(118 * s)}M${f(x + 108 * s)} ${f(y + 150 * s)}v${f(118 * s)}`, 0.8, 'ink');
}

/** Fiche cartonnée d'identification : deux photos collées, toise, cases d'empreintes. */
function fiche(id, draw) {
  const S = new Scene(id, 520, 380, 'photo');
  S.p('paper', rect(0, 0, 520, 380));
  S.ln(rect(6, 6, 508, 368), 0.8, 'ink-soft');
  const slots = [rect(20, 20, 230, 250), rect(270, 20, 230, 250)];
  const slot = (i, fn) => {
    const d = slots[i];
    S.within(d, () => {
      S.p('photo-light', d);
      // toise graduée
      const x0 = i ? 270 : 20;
      let t = '';
      for (let y = 30; y < 270; y += 8) t += `M${x0} ${y}h${(y / 8) % 5 === 0 ? 14 : 7}`;
      S.ln(t, 0.8, 'ink-soft');
      if (i === 0) S.translateSlot = 0;
      S.open(i ? {} : {});
      fn();
      S.close();
      S.stip(d, { opacity: 0.25 });
    });
    S.ln(d, 0.8, 'ink');
  };
  draw(S, slot);
  // cases d'empreintes vides
  let c = '';
  for (let i = 0; i < 5; i++) c += rect(20 + i * 97, 290, 90, 52);
  S.ln(c, 0.8, 'ink-soft');
  S.ln('M20 360H500', 0.5, 'ink-faint');
  return S;
}

export const SCENES = {
  /* ── OF-03 : « Adélaïde Varenque a 90 ans », 1969 ── */
  'of-03'(id) {
    const S = new Scene(id, 360, 470, 'photo');
    const win = mount(S, { card: false, inset: { x: 14, y: 14, w: 332, h: 442 } });
    S.p('photo-paper', rect(0, 0, 360, 470));
    S.within(win.d, () => {
      S.p('photo-mid', win.d);
      // fenêtre aux vitres embuées, à gauche
      const wd = rect(14, 40, 100, 230);
      S.fill(wd, 'light');
      S.p('photo-paper', rect(22, 48, 84, 214), { opacity: 0.8 });
      S.stip(rect(22, 48, 84, 214), { opacity: 0.5 });
      S.ln(`M64 48v214M22 120h84M22 192h84`, 2.4, 'ink-soft');
      // fauteuil à oreilles
      armchair(S, 205, 70, 230, 330, 'dark', true);
      S.fill(rect(14, 380, 332, 90), 'dark', { opacity: 0.6 });
      person(S, 'adelaide-varenque', 90, 110, 70, 1.25, { patch: { hands: [] }, lower: { kind: 'sitSkirt', hatch: true, foot: 560 } });
      // cahier d'écolier ouvert sur les genoux
      const nb = poly([[150, 418], [214, 410], [280, 420], [280, 452], [214, 444], [150, 452]], true);
      S.fill(nb, 'paper');
      S.ln(nb + 'M214 410V444', 0.8, 'ink-soft');
      S.ln('M158 424l50 -6M158 430l50 -6M158 436l50 -6M222 418l50 6M222 424l50 6M222 430l50 6', 0.5, 'ink-faint');
      hand(S, 170, 396, -20, 3.4, { skin: 1 });
      hand(S, 258, 394, 15, 3.4, { skin: 1 });
      halftone(S, win.d, 0.25);
    });
    S.ln(win.d, 0.8, 'ink-faint');
    return S;
  },

  /* ── PH-02 : Les Tilleuls, été 1885 ── */
  'ph-02'(id) {
    const S = new Scene(id, 520, 380, 'photo');
    const win = mount(S, { m: 22, mb: 22 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      perron(S, 250, 520, 60, 270, { windows: [300, 440] });
      // fenêtre ouverte, rideau flou
      S.fill(smooth([[300, 80], [340, 80], [334, 150], [306, 150]], true), 'paper', { opacity: 0.7 });
      tilleul(S, 140, 90, 150, 90, 120);
      S.fill(rect(0, 270, 520, 120), 'mid', { opacity: 0.6 });
      S.stip(rect(0, 270, 520, 120));
      // enfants debout derrière le banc
      person(S, 'augustin-varenque-1872', 13, 120, 120, 0.42, { patch: { clothes: { type: 'smock', wash: 'wash-indigo' } }, lower: { kind: 'stand', tone: 'light', child: 0.5 } });
      person(S, 'lucien-varenque', 9, 300, 140, 0.38, { lower: { kind: 'stand', tone: 'mid', child: 0.8 } });
      // banc
      const back = rect(60, 222, 380, 34);
      S.fill(back, 'dark');
      let sl = '';
      for (let x = 70; x < 440; x += 12) sl += `M${x} 222v34`;
      S.ln(sl, 1.2, 'ink-faint');
      S.ln(back, 0.8, 'ink-soft');
      // adultes assis
      person(S, 'anselme-varenque', 39, 70, 150, 0.42, { patch: { hands: [] }, lower: { kind: 'sit', tone: 'mid', hatch: true } });
      person(S, 'clemence-aubertot', 35, 245, 154, 0.42, { patch: { hands: [] }, lower: { kind: 'sitSkirt', tone: 'mid', hatch: true } });
      // journal plié
      const np = poly([[118, 280], [160, 270], [166, 290], [124, 300]], true);
      S.fill(np, 'paper');
      S.ln(np + 'M126 284l34 -8M128 290l34 -8', 0.5, 'ink-faint');
      // Adélaïde, 5 ans, sur les genoux de sa mère
      person(S, 'adelaide-varenque', 5, 268, 222, 0.3, { lower: { kind: 'floor', tone: 'light', child: 1 } });
      wear(S, win, { edge: 14, spots: 8 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-03 : Mariage au cap de Tennok, 1873 ── */
  'ph-03'(id) {
    const S = new Scene(id, 360, 470, 'photo');
    const win = mount(S, { m: 20, mb: 10, cardTone: 'paper-shade' });
    S.within(win.d, () => {
      S.p('photo-paper', win.d);
      // mur blanchi, base de tour ronde à droite
      S.fill(rect(0, 120, 360, 300), 'light');
      const tower = rect(250, 0, 120, 420);
      S.fill(tower, 'light');
      S.within(tower, () => S.fill(ell(360, 200, 60, 260), 'mid', { opacity: 0.5 }));
      S.ln('M250 0V420', 0.8, 'ink-soft');
      // galerie du phare coupée par le cadre, en haut à gauche
      S.fill(rect(0, 18, 120, 10), 'dark');
      let rail = 'M0 0H120';
      for (let x = 6; x < 120; x += 10) rail += `M${x} 0V18`;
      S.ln(rail, 1, 'ink-soft');
      S.ln('M0 120H250', 0.8, 'ink-faint');
      S.fill(rect(0, 400, 360, 70), 'mid', { opacity: 0.6 });
      person(S, 'firmin-varenque-1849', 23, 18, 70, 0.5, { patch: { hands: [] }, lower: { kind: 'stand', tone: 'mid', hatch: true, buttons: true } });
      person(S, 'maaren-tennok', 21, 170, 92, 0.47, { patch: { eyes: { gaze: -0.5 } }, lower: { kind: 'skirt', tone: 'mid', apron: true, apronTone: 'light' } });
      // coiffe à rubans au vent (sur le haut de la tête, rubans vers la droite)
      const cap = smooth([[194, 112], [206, 96], [226, 92], [242, 104], [240, 120], [226, 108], [206, 106]], true);
      S.fill(cap, 'paper');
      S.ln(cap + 'M204 104l4 -4l4 4l4 -4l4 4l4 -4l4 4', 0.6, 'ink-soft');
      const rib = smooth([[238, 116], [262, 106], [286, 118], [308, 108], [292, 126], [266, 118], [242, 126]], true);
      S.fill(rib, 'paper');
      S.ln(rib, 0.6, 'ink-soft');
      wear(S, win, { edge: 16, spots: 10, corners: [[0, 0, 60], [1, 1, 70], [1, 0, 40]] });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    return S;
  },

  /* ── PH-04 : Carte postale « Le phare et la famille du gardien », 1910 ── */
  'ph-04'(id) {
    const S = new Scene(id, 540, 360, 'photo');
    S.p('photo-paper', rect(0, 0, 540, 360));
    const win = { x: 12, y: 12, w: 516, h: 300, d: rect(12, 12, 516, 300) };
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // mer et récifs au fond
      S.fill(rect(12, 140, 516, 80), 'mid', { opacity: 0.6 });
      waterLines(S, 12, 146, 528, 210, { sp: 5 });
      reefs(S, 20, 300, 182, 14, 9, { tone: 'dark' });
      // phare à droite
      lighthouse(S, 440, 230, 210, { band: 'dark', wBase: 0.22, wTop: 0.15 });
      // maison du gardien, abri du canot
      const house = poly([[150, 230], [150, 150], [230, 112], [330, 150], [330, 230]], true);
      S.fill(house, 'light');
      S.fill(poly([[140, 152], [230, 106], [340, 152], [330, 158], [230, 116], [150, 158]], true), 'dark');
      S.ln(house, 0.8, 'ink-soft');
      const door = rect(222, 166, 34, 64);
      S.fill(door, 'dark');
      const shelter = poly([[340, 230], [340, 186], [372, 168], [400, 186], [400, 230]], true);
      S.fill(shelter, 'mid');
      S.ln(shelter, 0.7, 'ink-soft');
      S.fill(rect(12, 228, 516, 90), 'mid', { opacity: 0.5 });
      S.stip(rect(12, 228, 516, 90));
      // famille
      person(S, 'aldrik-varenque', 36, 120, 110, 0.4, { patch: { hands: [] }, lower: { kind: 'stand', tone: 'mid', zigzag: true } });
      person(S, 'tenna-orrvik', 32, 268, 114, 0.38, { patch: { hands: [] }, lower: { kind: 'skirt', tone: 'dark', apron: true } });
      person(S, 'maaren-tennok', 58, 186, 140, 0.4, { patch: { hands: [] }, lower: { kind: 'skirt', tone: 'dark' } });
      // trousseau de grosses clés
      hand(S, 228, 272, 0, 1.6, { skin: 1 });
      S.ln(circ(232, 286, 5) + 'M232 291l0 12m0 -4h4m-4 3h3M226 289l-6 11m3 -4h-4M238 289l5 11m-2 -4h4', 1.1, 'ink');
      // enfants devant
      person(S, 'firmin-varenque-1900', 10, 140, 196, 0.27, { patch: { hat: null, arms: [], clothes: { type: 'smock', wash: 'wash-ardoise' } }, lower: { kind: 'stand', tone: 'mid', child: 0.6, barefoot: true, legTone: 'light' } });
      S.fill(ell(140 + 68 * 0.27, 196 + 86 * 0.27, 13, 15), 'mid', { opacity: 0.45 });
      S.stip(ell(140 + 68 * 0.27, 196 + 86 * 0.27, 14, 16));
      person(S, 'selda-varenque', 7, 300, 206, 0.25, { patch: { glasses: null, hands: [], clothes: { type: 'dress', wash: 'wash-ardoise' } }, lower: { kind: 'shortSkirt', tone: 'light', child: 1 } });
      // poupée de chiffon
      S.fill(ell(318, 262, 6, 10) + circ(318, 248, 5), 'light');
      S.ln(ell(318, 262, 6, 10) + circ(318, 248, 5), 0.6, 'ink-soft');
      // main gauche d'Aldrik sur l'épaule du garçon : deux doigts manquent
      arm(S, [[160, 168], [168, 196], [166, 214]], 9, 'mid', { skin: 3, missing: [3, 4], size: 1.4, ang: 30 });
      halftone(S, win.d, 0.3);
    });
    S.ln(win.d, 0.8, 'ink-soft');
    return S;
  },

  /* ── Carte-album de mariage, Studio Lumen, 1870 ── */
  'ph-01'(id) {
    const S = new Scene(id, 320, 480, 'photo');
    const win = mount(S, { m: 26, mb: 26 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      S.fill(ell(160, 170, 150, 170), 'paper', { opacity: 0.6 });
      balustrade(S, win.x, win.x + win.w, 248, 58);
      palm(S, 262, 300, 1.1);
      // sol et tapis à franges
      S.fill(rect(win.x, 320, win.w, 140), 'mid', { opacity: 0.8 });
      const rug = poly([[40, 372], [290, 372], [300, 430], [30, 430]], true);
      S.fill(rug, 'mid');
      S.hatd(rug, { opacity: 0.5 });
      let fr = '';
      for (let x = 32; x < 300; x += 4) fr += `M${x} 430v6`;
      S.ln(fr, 0.6, 'ink-soft');
      // fauteuil de Clémence
      armchair(S, 196, 196, 112, 170, 'dark');
      // Anselme debout, main sur le dossier
      lower(S, 28, 62, 0.5, { kind: 'stand', tone: 'mid', hatch: true, foot: 700, w: 1.05 });
      fam(S, 'anselme-varenque', 24, 28, 62, 0.5, { clip: true, patch: { hands: [] } });
      arm(S, [[96, 142], [110, 172], [142, 206]], 11, 'mid', { hatch: true, skin: 2, ang: -40 });
      // Clémence assise : bouquet de fougères et de muguet
      lower(S, 152, 142, 0.5, { kind: 'sitSkirt', tone: 'mid', hatch: true });
      fam(S, 'clemence-aubertot', 19, 152, 142, 0.5, { clip: true, patch: { hands: [] } });
      const bq = [190, 268];
      let fronds = '';
      for (let i = 0; i < 7; i++) {
        const a = -2.4 + i * 0.32;
        fronds += `M${bq[0]} ${bq[1]}q${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 20)} ${f(Math.cos(a) * 26)} ${f(Math.sin(a) * 30)}`;
      }
      S.ln(fronds, 1.6, 'ink-soft');
      let bells = '';
      for (let i = 0; i < 9; i++) bells += circ(bq[0] - 12 + (i % 3) * 9 + (i > 5 ? 4 : 0), bq[1] - 18 - Math.floor(i / 3) * 7, 1.8);
      S.fill(bells, 'paper');
      S.ln(bells, 0.5, 'ink-soft');
      arm(S, [[170, 228], [178, 260], [188, 272]], 10, 'mid', { skin: 1, ang: -70 });
      arm(S, [[226, 228], [216, 258], [198, 272]], 10, 'mid', { skin: 1, ang: 60 });
      wear(S, win, { edge: 12, spots: 5 });
    });
    S.ln(win.d, 1, 'ink-soft');
    // coins dorés du carton
    for (const [cx, cy, sx, sy] of [[8, 8, 1, 1], [312, 8, -1, 1], [8, 472, 1, -1], [312, 472, -1, -1]]) S.ln(`M${cx} ${cy + sy * 16}V${cy}H${cx + sx * 16}M${cx + sx * 3} ${cy + sy * 10}V${cy + sy * 3}H${cx + sx * 10}`, 0.8, 'ink-soft');
    return S;
  },
  /* ── PH-05 : Mariage de Gaspard et d'Irène, 10 juin 1922 ── */
  'ph-05'(id) {
    const S = new Scene(id, 600, 440, 'photo');
    const win = mount(S, { inset: { x: 30, y: 26, w: 540, h: 360 } });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      perron(S, 150, 450, 26, 250, { windows: [175, 385] });
      tilleul(S, 70, 90, 90, 80, 120);
      tilleul(S, 530, 84, 90, 84, 120);
      balustrade(S, 30, 570, 196, 40);
      // glycine sur la balustrade
      let gl = '';
      for (let i = 0; i < 40; i++) gl += circ(40 + S.r() * 520, 188 + S.r() * 18, 2 + S.r() * 2.5);
      S.fill(gl, 'mid', { opacity: 0.7 });
      S.stip(gl);
      S.fill(rect(30, 250, 540, 140), 'mid', { opacity: 0.55 });
      S.stip(rect(30, 250, 540, 140), { opacity: 0.6 });
      const sc = 0.36;
      const at = (c) => c - 28;
      // rang du fond, debout
      person(S, 'marcel-daubry', 25, at(92), 62, sc, { lower: { kind: 'stand', hatch: true } });
      person(S, 'blanche-varenque', 21, at(156), 70, sc, { patch: { clothes: { type: 'dress', wash: 'wash-carmin', neck: 'v' } }, lower: { kind: 'shortSkirt', tone: 'light' } });
      person(S, 'augustin-varenque-1872', 50, at(232), 58, sc * 1.05, { lower: { kind: 'stand', w: 1.15, hatch: true } });
      person(S, 'gaspard-varenque', 23, at(312), 60, sc, { patch: { hands: [] }, lower: { kind: 'stand', hatch: true } });
      extra(S, { sex: 'm', age: 56, skin: 2, hair: 'gris', W: 25, H: 37, hairStyle: 'short', hairOpt: { receding: true }, beard: { style: 'chops' }, clothes: { type: 'coat', wash: 'wash-ardoise', vest: 'wash-ardoise', vestDark: true, chain: true, collar: 'wing', tie: 'cravat' } }, at(392), 60, sc, { lower: { kind: 'stand', hatch: true } });
      person(S, 'firmin-varenque-1900', 22, at(488), 66, sc, { lower: { kind: 'stand', hatch: true } });
      // casquette à la main
      S.fill(ell(474, 232, 12, 5), 'dark');
      S.ln(ell(474, 232, 12, 5), 0.6, 'ink-soft');
      // rang assis
      const sc2 = 0.37;
      person(S, 'adelaide-varenque', 42, 116 - 29, 146, sc2, { lower: { kind: 'sitSkirt', hatch: true } });
      person(S, 'henriette-sorbelle', 46, 196 - 33, 122, sc2 * 1.14, { patch: { hat: { type: 'plumes', cls: 'hair-noir' } }, lower: { kind: 'sitSkirt', hatch: true, foot: 520 } });
      // voile court d'Irène
      S.fill(smooth([[296, 150], [336, 146], [350, 200], [344, 226], [292, 228], [288, 196]], true), 'paper', { opacity: 0.85 });
      person(S, 'irene-castagne', 19, 318 - 29, 150, sc2, { patch: { hands: [], clothes: { type: 'dress', wash: 'paper', neck: 'v' } }, lower: { kind: 'sitSkirt', tone: 'light' } });
      // main du marié sur l'épaule de la mariée
      hand(S, 334, 204, -10, 1.6, { skin: 2 });
      person(S, 'clemence-aubertot', 72, 410 - 29, 150, sc2, { lower: { kind: 'sitSkirt', hatch: true } });
      // canne à pommeau
      S.ln('M440 252L448 342', 1.6, 'ink');
      S.fill(circ(440, 250, 3), 'light');
      // par terre : Odile, 13 ans, en tailleur
      const od = person(S, 'odile-varenque', 13, 238 - 24, 270, 0.31, { patch: { hands: [], clothes: { type: 'dress', wash: 'paper', neck: 'claudine' } }, lower: { kind: 'floor', tone: 'light', child: 0.4 } });
      // deux nattes
      for (const dx of [-11, 9]) {
        const b = tube([[od.fx + dx, od.fy + 4], [od.fx + dx * 1.15, od.fy + 18], [od.fx + dx * 1.1, od.fy + 32]], 4.4, 2.6);
        S.fill(b, 'dark');
        S.ln(b, 0.5, 'ink-soft');
      }
      hand(S, 228, 356, 10, 1.4, { skin: 2, ink: true });
      wear(S, win, { edge: 10, spots: 6 });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    // timbre sec du studio (relief sans texte lisible)
    S.ln(circ(530, 412, 15) + circ(530, 412, 11), 0.8, 'ink-faint');
    S.p('rehaut', `M516 408a15 15 0 0 1 22 -10`, {});
    S.ln('M521 412h18M523 416h14', 0.6, 'ink-faint');
    return S;
  },

  /* ── PH-05 verso : croquis numéroté au crayon ── */
  'ph-05-croquis'(id) {
    const S = new Scene(id, 600, 440, 'photo');
    const card = poly([[6, 6], [594, 6], [594, 330], [572, 352], [580, 372], [556, 384], [548, 410], [520, 418], [500, 434], [6, 434]], true);
    S.p('paper-shade', card);
    S.ln(card, 0.8, 'ink-faint');
    const ovals = [
      [92, 9], [156, 7], [232, 3], [312, 1], [392, 11], [488, 10],
    ];
    let d = '';
    const nums = [];
    for (const [x, n] of ovals) {
      d += ell(x, 90, 24, 30);
      nums.push([x, 98, n]);
    }
    for (const [x, n] of [[150, 6], [238, 4], [340, 2], [438, 5]]) {
      d += ell(x, 200, 26, 32);
      nums.push([x, 208, n]);
    }
    d += ell(106, 300, 22, 26);
    nums.push([106, 308, 8]);
    S.ln(d, 1, 'ink-soft', { 'stroke-dasharray': '7 1.2' });
    for (const [x, y, n] of nums) S.push(`<text class="label-note" x="${x}" y="${y}" text-anchor="middle" font-size="22">${n}</text>`);
    // la liste manuscrite, coupée par la déchirure (son texte est dans le document)
    S.ln(handLines(S.r, 200, 290, 330, 4, 22, { h: 4, step: 4.2 }), 0.9, 'ink-soft');
    return S;
  },

  /* ── PH-06 : « Les métiers du papier », L'Œil velmarchois, 1937 ── */
  'ph-06'(id) {
    const S = new Scene(id, 640, 420, 'photo');
    S.p('paper', rect(0, 0, 640, 420));
    S.ln('M320 0V420', 1, 'ink-faint');
    S.fill(rect(316, 0, 8, 420), 'light', { opacity: 0.6 });
    headline(S, 24, 22, 280, 26, { words: 3 });
    S.ln('M24 58H300M24 62H300', 0.6, 'ink-soft');
    const ph = { x: 24, y: 72, w: 280, h: 300 };
    const pd = rect(ph.x, ph.y, ph.w, ph.h);
    S.within(pd, () => {
      S.p('photo-dark', pd);
      // cône de lumière de la lampe
      S.fill(poly([[150, 96], [40, 372], [300, 372], [190, 96]], true), 'mid', { opacity: 0.7 });
      // établi
      S.fill(rect(24, 300, 280, 72), 'mid');
      S.hatd(rect(24, 300, 280, 72));
      S.ln('M24 300H304', 1, 'ink-soft');
      person(S, 'odile-varenque', 29, 80, 96, 1.0, { patch: { hands: [] }, rot: 12, lower: false });
      // forme de papetier (main gauche, image droite), fougère en fil de laiton
      const fx0 = 196;
      const fy0 = 250;
      const frame = poly([[fx0, fy0], [fx0 + 92, fy0 - 14], [fx0 + 104, fy0 + 52], [fx0 + 12, fy0 + 66]], true);
      S.fill(frame, 'light', { opacity: 0.9 });
      let wires = '';
      for (let i = 1; i < 14; i++) wires += `M${f(fx0 + i * 7.2)} ${f(fy0 - i * 1.1)}L${f(fx0 + 12 + i * 7.1)} ${f(fy0 + 66 - i * 1.1)}`;
      S.ln(wires, 0.5, 'ink-faint');
      const fr = fern(fx0 + 50, fy0 + 54, 50, { angle: 8, pairs: 9, spread: 0.5 });
      S.ln(fr.stem + fr.pinnae.join(''), 0.7, 'ink');
      S.ln(frame, 2.2, 'ink');
      arm(S, [[224, 200], [262, 236], [272, 262]], 18, 'mid', { skin: 2, size: 3, ang: 10 });
      // main droite (image gauche) : burin, brûlure d'acide au dos de la main
      arm(S, [[118, 206], [112, 252], [140, 282]], 18, 'mid', { skin: 2, size: 3.2, burn: true, ang: -80 });
      S.ln('M152 288L190 300', 2.4, 'ink');
      // lampe à abat-jour de métal
      const shade = poly([[146, 64], [194, 64], [214, 98], [126, 98]], true);
      S.fill(shade, 'dark');
      S.ln(shade + 'M170 64V20', 1, 'ink-soft');
      S.fill(ell(170, 98, 44, 4), 'paper');
      halftone(S, pd, 0.35);
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 24, 386, 280, 3, 9);
    // page de droite : deux vignettes et colonnes
    const v1 = rect(340, 24, 276, 150);
    S.within(v1, () => {
      S.p('photo-mid', v1);
      const vat = poly([[372, 120], [586, 120], [576, 174], [382, 174]], true);
      S.fill(vat, 'dark');
      S.ln(vat, 0.8, 'ink-soft');
      S.fill(ell(480, 120, 106, 8), 'light');
      extra(S, { sex: 'm', age: 45, skin: 3, hair: 'brun', hairStyle: 'short', hat: { type: 'flatcap', cls: 'wash-ardoise' }, clothes: { type: 'smock', wash: 'wash-ardoise' } }, 420, 30, 0.5, { lower: false });
      const mould = poly([[440, 116], [540, 112], [544, 126], [444, 130]], true);
      S.fill(mould, 'light');
      S.ln(mould, 1.2, 'ink');
      hand(S, 446, 128, 180, 1.6, { skin: 3 });
      hand(S, 536, 124, 180, 1.6, { skin: 3 });
      halftone(S, v1, 0.4);
    });
    S.ln(v1, 0.8, 'ink');
    const v2 = rect(340, 186, 130, 110);
    S.within(v2, () => {
      S.p('photo-light', v2);
      for (let i = 0; i < 9; i++) {
        const r0 = rect(356 + (i % 2) * 3, 280 - i * 10, 96, 9);
        S.fill(r0, i % 2 ? 'paper' : 'light');
        S.ln(r0, 0.5, 'ink-soft');
      }
      S.fill(rect(340, 280, 130, 16), 'dark');
      halftone(S, v2, 0.4);
    });
    S.ln(v2, 0.8, 'ink');
    printBlock(S, 484, 192, 132, 12, 9);
    printBlock(S, 340, 312, 128, 10, 9);
    printBlock(S, 484, 312, 132, 10, 9);
    return S;
  },

  /* ── PH-07 : Victor Sauge devant L'Hirondelle, 1931 ── */
  'ph-07'(id) {
    const S = new Scene(id, 480, 360, 'photo');
    const win = { x: 10, y: 10, w: 460, h: 340, d: rect(10, 10, 460, 340) };
    S.p('photo-paper', rect(0, 0, 480, 360));
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // retouche blanche dans le ciel
      S.fill(smooth([[200, 10], [470, 10], [470, 120], [380, 140], [300, 96], [220, 70]], true), 'paper', { opacity: 0.9 });
      // foule en canotiers derrière une barrière
      crowd(S, 230, 470, 150, 12, 16, { hats: 0.9, rows: 2 });
      S.ln('M220 196H470M220 210H470' + Array.from({ length: 12 }, (_, i) => `M${226 + i * 21} 190V230`).join(''), 1.2, 'ink-soft');
      S.fill(rect(10, 230, 460, 120), 'mid', { opacity: 0.5 });
      // nez du biplan : capot, aile, hélice
      const wing = poly([[10, 64], [250, 50], [254, 66], [10, 84]], true);
      S.fill(wing, 'light');
      S.ln(wing, 1, 'ink-soft');
      S.ln('M60 84L66 230M190 70L184 230', 2, 'ink-soft');
      const cowl = smooth([[10, 110], [110, 100], [176, 130], [184, 210], [120, 250], [10, 256]], true);
      S.fill(cowl, 'mid');
      S.hat(cowl);
      S.ln(cowl, 1.2, 'ink');
      // hirondelle peinte
      S.fill('M60 170q20 -22 44 -8q16 -12 30 -24q-6 18 -22 30q10 6 26 2q-18 14 -40 6q-20 12 -38 -6Z', 'paper');
      S.ln('M60 170q20 -22 44 -8q16 -12 30 -24q-6 18 -22 30q10 6 26 2q-18 14 -40 6q-20 12 -38 -6Z', 0.8, 'ink');
      // hélice verticale
      const prop = smooth([[178, 24], [192, 26], [196, 150], [190, 300], [176, 300], [172, 150]], true);
      S.fill(prop, 'dark');
      S.ln(prop, 1, 'ink');
      S.fill(ell(184, 160, 14, 14), 'mid');
      S.ln(ell(184, 160, 14, 14), 1, 'ink');
      // mécanicien à droite
      extra(S, { sex: 'm', age: 40, skin: 3, hair: 'brun', hairStyle: 'short', hat: { type: 'flatcap', cls: 'wash-ardoise' }, clothes: { type: 'smock', wash: 'wash-ardoise' } }, 380, 140, 0.4, { lower: { kind: 'stand' } });
      person(S, 'victor-sauge', 25, 196, 70, 0.95, { lower: { kind: 'stand', tone: 'mid' } });
      halftone(S, win.d, 0.2);
    });
    return S;
  },

  /* ── PH-08 : L'atelier de la rue des Tanneurs, 1905 ── */
  'ph-08'(id) {
    const S = new Scene(id, 440, 330, 'photo');
    const win = { x: 8, y: 8, w: 424, h: 314, d: rect(8, 8, 424, 314) };
    S.p('photo-paper', rect(0, 0, 440, 330));
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // verrière
      S.fill(poly([[8, 8], [432, 8], [432, 70], [8, 110]], true), 'paper');
      let g = '';
      for (let x = 30; x < 440; x += 36) g += `M${x} 8L${x - 6} ${110 - (x / 424) * 40}`;
      g += 'M8 50L432 30M8 110L432 70';
      S.ln(g, 1.6, 'ink-soft');
      S.fill(rect(8, 104, 424, 220), 'mid', { opacity: 0.55 });
      // cordes à linge
      S.ln('M8 120Q220 136 432 112', 0.6, 'ink-soft');
      for (const [x, w] of [[60, 30], [190, 24], [330, 36]]) {
        const c = poly([[x, 124 + x / 60], [x + w, 125 + x / 60], [x + w - 3, 160], [x + 4, 158]], true);
        S.fill(c, 'paper');
        S.ln(c, 0.5, 'ink-soft');
      }
      // toiles retournées
      for (const [x, y, w, h] of [[300, 196, 70, 100], [356, 210, 66, 92]]) {
        const c = rect(x, y, w, h);
        S.fill(c, 'light');
        S.ln(c + `M${x + 6} ${y + 6}h${w - 12}v${h - 12}h${-(w - 12)}ZM${x + 6} ${y + h / 2}h${w - 12}`, 0.8, 'ink-soft');
      }
      // poêle
      const st = smooth([[20, 300], [16, 240], [34, 214], [52, 240], [48, 300]], true);
      S.fill(st, 'dark');
      S.ln(st + 'M34 214V120', 1.6, 'ink-soft');
      // esquisse d'affiche punaisée : une lavandière au panier
      const sk = rect(232, 150, 52, 74);
      S.fill(sk, 'paper');
      S.ln(sk, 0.7, 'ink-soft');
      S.ln('M258 164a5 5 0 1 0 0.1 0M258 170v22l-8 22M258 192l8 22M258 176l12 6M258 176l-10 8M244 186a8 6 0 1 0 0.1 0', 0.7, 'ink-faint');
      // chevalet
      S.ln('M150 140L120 312M150 140L184 312M150 140V300', 2.2, 'ink-soft');
      const cv = poly([[112, 158], [196, 150], [200, 250], [114, 258]], true);
      S.fill(cv, 'light');
      S.ln(cv, 1, 'ink-soft');
      person(S, 'lucien-varenque', 29, 30, 108, 0.62, { lower: { kind: 'stand', hatch: true } });
      // estrade et modèle
      S.fill(rect(250, 286, 190, 40), 'dark');
      const pa = person(S, 'pauline-sauge', 21, 290, 104, 0.6, { patch: { hands: [] }, lower: { kind: 'skirt', apron: true, foot: 290 / 0.6 } });
      // panier de linge sur la hanche, bras nu
      const bk = ell(406, 250, 34, 20);
      S.fill(bk, 'light');
      S.hat(bk);
      S.ln(bk + 'M374 248q32 -24 64 0', 1, 'ink-soft');
      S.fill(smooth([[380, 236], [400, 222], [430, 230], [420, 244]], true), 'paper');
      arm(S, [[pa.fx + 34, pa.fy + 60], [pa.fx + 62, pa.fy + 112], [pa.fx + 66, pa.fy + 140]], 13, 'light', { skin: 2, size: 2.6 });
      wear(S, win, { edge: 24, spots: 8 });
    });
    return S;
  },

  /* ── PH-09 : Œuvre des Lavandières, rapport 1912 (hors-texte) ── */
  'ph-09'(id) {
    const S = new Scene(id, 400, 540, 'photo');
    S.p('paper', rect(0, 0, 400, 540));
    const pd = rect(24, 30, 352, 440);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // lavoir couvert : toit, poutres, bacs
      S.fill(poly([[24, 30], [376, 30], [376, 80], [24, 110]], true), 'dark');
      S.ln('M24 110L376 80M60 106V250M200 94V250M340 82V250', 3, 'ink-soft');
      S.fill(rect(24, 200, 352, 60), 'mid');
      S.fill(rect(24, 238, 352, 22), 'light');
      S.ln('M24 238H376M24 200H376', 1, 'ink-soft');
      S.fill(rect(24, 300, 352, 170), 'mid', { opacity: 0.6 });
      const W = [
        { age: 52, skin: 2, hair: 'gris', hairStyle: 'bandeaux', W: 25 },
        { age: 24, skin: 3, hair: 'brun', hairStyle: 'bandeaux', W: 23 },
        { age: 40, skin: 4, hair: 'noir', hairStyle: 'bandeaux', W: 26 },
        { age: 33, skin: 1, hair: 'blond', hairStyle: 'bob', hairOpt: { len: 0.4 }, W: 24 },
        { age: 60, skin: 2, hair: 'gris', hairStyle: 'bandeaux', W: 26 },
        { age: 19, skin: 2, hair: 'chatain', hairStyle: 'bandeaux', W: 22 },
      ];
      const xs = [40, 92, 252, 300, 330, 196];
      const ys = [150, 156, 152, 160, 152, 146];
      // rang du fond
      [5].forEach((i) => extra(S, { sex: 'f', H: 37, ...W[i], clothes: { type: 'apron', wash: 'wash-ardoise' } }, xs[i] + 40, ys[i] - 20, 0.34, { lower: { kind: 'skirt', apron: true } }));
      [0, 1, 2, 3, 4].forEach((i) => extra(S, { sex: 'f', H: 37, ...W[i], clothes: { type: 'apron', wash: 'wash-ardoise' } }, xs[i], ys[i], 0.36, { lower: { kind: 'skirt', apron: true } }));
      // Pauline (à droite de la dame, donc à gauche de l'image) et l'enfant
      person(S, 'pauline-sauge', 28, 120, 158, 0.38, { lower: { kind: 'skirt', apron: true } });
      extra(S, { sex: 'm', age: 6, skin: 2, hair: 'brun', hairStyle: 'short', eyes: { gaze: -0.6 }, clothes: { type: 'smock', wash: 'wash-ardoise' } }, 120, 300, 0.24, { lower: { kind: 'stand', child: 0.7 } });
      S.fill(ell(140, 323, 12, 14), 'mid', { opacity: 0.5 });
      S.stip(ell(140, 323, 13, 15));
      // la présidente, une tête de plus que toutes
      person(S, 'henriette-sorbelle', 36, 166, 92, 0.46, { lower: { kind: 'skirt', hatch: true, foot: 820 } });
      S.stip(pd, { opacity: 0.45 });
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 90, 496, 220, 1, 10, { align: 'center' });
    return S;
  },

  /* ── PH-10 : Le canot de sauvetage de Tennok, 1912 ── */
  'ph-10'(id) {
    const S = new Scene(id, 560, 360, 'photo');
    S.p('photo-paper', rect(0, 0, 560, 360));
    const pd = rect(12, 12, 536, 300);
    S.within(pd, () => {
      S.p('photo-light', pd);
      lighthouse(S, 500, 150, 130, { band: 'dark', wBase: 0.2, wTop: 0.14 });
      // abri de pierre
      const sh = poly([[12, 40], [150, 30], [300, 64], [300, 220], [12, 220]], true);
      S.fill(sh, 'mid');
      let st = '';
      for (let y = 60; y < 220; y += 16) st += `M12 ${y}H300`;
      for (let y = 52; y < 220; y += 16) for (let x = 20 + ((y / 16) % 2) * 20; x < 300; x += 40) st += `M${x} ${y}v16`;
      S.ln(st, 0.5, 'ink-faint');
      S.fill(rect(60, 90, 220, 130), 'dark');
      // canot blanc sur son chariot
      S.open({ transform: 'translate(0 -44)' });
      const hull = smooth([[80, 150], [380, 140], [440, 128, 1], [420, 170], [360, 194], [120, 196], [80, 180]], true);
      S.fill(hull, 'paper');
      S.ln(hull, 1.2, 'ink');
      S.ln('M90 168L420 152', 0.7, 'ink-soft');
      let oars = '';
      for (let i = 0; i < 10; i++) oars += `M${130 + i * 26} 142L${120 + i * 26} 116`;
      S.ln(oars, 1.6, 'ink-soft');
      S.push('<text class="label" x="368" y="164" font-size="12">TENNOK</text>');
      S.ln('M110 196L100 222M380 192L390 222M96 222H400', 2, 'ink');
      S.ln(circ(130, 226, 8) + circ(360, 226, 8), 1.4, 'ink');
      S.close();
      S.fill(rect(12, 230, 536, 90), 'mid', { opacity: 0.5 });
      // sept canotiers
      const xs = [20, 74, 128, 300, 354, 408, 462];
      xs.forEach((x, i) => {
        const p = extra(S, { sex: 'm', age: 25 + ((i * 7) % 30), skin: 2 + (i % 3), hair: ['brun', 'noir', 'chatain', 'brun', 'gris', 'brun', 'noir'][i], W: 24 + (i % 3), H: 36, hairStyle: 'short', beard: i === 4 ? { style: 'full' } : null, moustache: i % 3 === 1 ? { style: 'full' } : null, clothes: { type: 'sweater', wash: 'wash-ardoise', band: 'wash-ardoise' } }, x, 132, 0.34, { lower: { kind: 'stand' } });
        beanie(S, p.fx, p.fy, 0.34);
        cork(S, x, 132, 0.34);
      });
      // le patron, un pas en avant
      const al = person(S, 'aldrik-varenque', 38, 194, 126, 0.42, { patch: { hands: [] }, lower: { kind: 'stand', foot: 615, arms: 'none' } });
      cork(S, 196, 128, 0.4, true);
      // casquette dans la main droite (image gauche), main gauche pendante : deux doigts manquent
      arm(S, [[al.fx - 22, al.fy + 50], [al.fx - 30, al.fy + 84], [al.fx - 28, al.fy + 104]], 12, 'mid', { skin: 3, size: 1.9, fist: true });
      S.fill(ell(al.fx - 28, al.fy + 116, 11, 5), 'dark');
      arm(S, [[al.fx + 40, al.fy + 50], [al.fx + 46, al.fy + 86], [al.fx + 46, al.fy + 106]], 12, 'mid', { skin: 3, size: 2.2, missing: [3, 4], ang: 0 });
      S.stip(pd, { opacity: 0.3 });
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

  /* ── PH-11 : Programme du récital d'Irène Castagne, 1928 ── */
  'ph-11'(id) {
    const S = new Scene(id, 360, 500, 'photo');
    S.p('photo-dark', rect(0, 0, 360, 500));
    // cadre art déco : vagues stylisées
    let wv = '';
    for (let row = 0; row < 3; row++) {
      const y = 440 + row * 14;
      wv += `M10 ${y}`;
      for (let x = 10; x < 350; x += 28) wv += `q7 -10 14 0t14 0`;
    }
    S.ln(wv, 1.6, 'ink-faint');
    S.ln(rect(14, 14, 332, 472) + rect(22, 22, 316, 456), 1.2, 'ink-faint');
    for (const [x, y, sx, sy] of [[22, 22, 1, 1], [338, 22, -1, 1]]) {
      let fan = '';
      for (let i = 1; i <= 4; i++) fan += `M${x} ${y + sy * i * 12}A${i * 12} ${i * 12} 0 0 ${sx * sy > 0 ? 0 : 1} ${x + sx * i * 12} ${y}`;
      S.ln(fan, 1, 'ink-faint');
    }
    // bandeaux décoratifs (le texte est dans le document)
    S.fill(rect(60, 40, 240, 18) + rect(90, 66, 180, 8) + rect(80, 400, 200, 12), 'mid', { opacity: 0.7 });
    const med = ell(180, 228, 112, 150);
    S.fill(med, 'paper');
    S.within(med, () => {
      S.p('photo-light', med);
      S.fill(ell(140, 160, 120, 140), 'paper', { opacity: 0.7 });
      const ir = person(S, 'irene-castagne', 25, 90, 116, 1.15, { patch: { hands: [] }, lower: false });
      // mains fines croisées sous le menton
      hand(S, ir.fx - 6, ir.fy + 86, 160, 2.4, { skin: 2 });
      hand(S, ir.fx + 18, ir.fy + 88, 200, 2.4, { skin: 2 });
      S.stip(med, { opacity: 0.25 });
    });
    S.ln(med, 2.4, 'ink-faint');
    S.ln(ell(180, 228, 118, 156), 0.8, 'ink-faint');
    return S;
  },

  /* ── PH-12 : La receveuse des postes de Tennok, 1925 ── */
  'ph-12'(id) {
    const S = new Scene(id, 440, 340, 'photo');
    const pd = rect(10, 10, 420, 320);
    S.p('photo-paper', rect(0, 0, 440, 340));
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // casiers de tri
      let c = '';
      for (let y = 20; y < 180; y += 22) for (let x = 250; x < 430; x += 30) c += rect(x, y, 26, 18);
      S.fill(c, 'dark');
      S.ln(c, 0.5, 'ink-faint');
      // calendrier
      const cal = rect(30, 30, 50, 66);
      S.fill(cal, 'paper');
      S.ln(cal, 0.7, 'ink-soft');
      printBlock(S, 36, 50, 38, 5, 8, { word: [4, 6] });
      // télégraphe sous housse
      S.fill(smooth([[30, 200], [40, 160], [100, 154], [112, 200]], true), 'light');
      S.ln(smooth([[30, 200], [40, 160], [100, 154], [112, 200]], true), 0.7, 'ink-soft');
      const tn = person(S, 'tenna-orrvik', 47, 130, 40, 0.95, { patch: { hands: [] }, lower: false });
      // bras : manchettes de lustrine, tampon levé ; brassard de deuil au bras gauche
      arm(S, [[tn.fx - 60, tn.fy + 130], [tn.fx - 74, tn.fy + 100], [tn.fx - 66, tn.fy + 60]], 22, 'mid', { hatch: true, skin: 1, size: 4, ang: 180 });
      S.fill(rect(tn.fx - 82, tn.fy + 70, 26, 20), 'dark');
      S.ln('M' + (tn.fx - 80) + ' ' + (tn.fy + 54) + 'l20 -2', 1, 'ink');
      const stamp = rect(tn.fx - 78, tn.fy + 30, 20, 16);
      S.fill(stamp, 'dark');
      S.ln(stamp + `M${tn.fx - 68} ${tn.fy + 30}v-12`, 1.4, 'ink');
      S.fill(ell(tn.fx - 68, tn.fy + 16, 6, 4), 'light');
      // brassard noir (bras gauche, image droite)
      S.black(poly([[tn.fx + 70, tn.fy + 150], [tn.fx + 96, tn.fy + 146], [tn.fx + 100, tn.fy + 164], [tn.fx + 72, tn.fy + 168]], true));
      // balance à plateaux
      S.ln('M350 230v-40M320 190h60', 1.4, 'ink-soft');
      S.fill(ell(320, 200, 16, 4) + ell(380, 200, 16, 4), 'light');
      S.ln('M320 190l-12 10M320 190l12 10M380 190l-12 10M380 190l12 10', 0.6, 'ink-soft');
      // guichet à grille de laiton
      S.fill(rect(10, 230, 420, 100), 'dark');
      S.hat(rect(10, 230, 420, 100));
      let gr = 'M10 140H430';
      for (let x = 20; x < 430; x += 14) gr += `M${x} 140V230`;
      S.ln(gr, 1.6, 'ink-soft');
      S.ln('M10 230H430', 2, 'ink');
      S.stip(pd, { opacity: 0.25 });
    });
    return S;
  },

  /* ── PH-13 : La rédaction de Vel Taalik, 1936 (page de journal) ── */
  'ph-13'(id) {
    const S = new Scene(id, 440, 560, 'photo');
    S.p('paper', rect(0, 0, 440, 560));
    headline(S, 30, 18, 380, 24, { words: 2 });
    S.ln('M20 50H420M20 54H420', 0.7, 'ink-soft');
    const pd = rect(20, 64, 400, 270);
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // plafond bas, rames, presse à pédale au fond, casse
      S.fill(rect(20, 64, 400, 30), 'dark');
      const press = smooth([[190, 220], [196, 120], [250, 110], [262, 220]], true);
      S.fill(press, 'dark');
      S.ln(press + circ(230, 160, 26), 1.4, 'ink-soft');
      for (let i = 0; i < 6; i++) S.fill(rect(40, 240 - i * 10, 60, 9), i % 2 ? 'paper' : 'light');
      person(S, 'selda-varenque', 33, 40, 96, 0.55, { lower: { kind: 'stand', hatch: true } });
      // épreuve à la main
      const pr = poly([[150, 230], [190, 224], [196, 280], [154, 284]], true);
      S.fill(pr, 'paper');
      S.ln(pr, 0.7, 'ink-soft');
      printBlock(S, 156, 238, 34, 6, 7);
      // casse de caractères
      const cs = poly([[260, 260], [420, 240], [420, 334], [260, 334]], true);
      S.fill(cs, 'light');
      let cells = '';
      for (let i = 0; i < 8; i++) cells += `M${270 + i * 19} ${258 - i * 2.4}V334`;
      S.ln(cs + cells, 0.7, 'ink-soft');
      person(S, 'orrin-kessvel', 31, 270, 82, 0.6, { lower: { kind: 'stand', hatch: true } });
      S.stip(pd, { opacity: 0.4 });
    });
    S.ln(pd, 0.8, 'ink');
    // texte bilingue en deux colonnes
    printBlock(S, 20, 350, 190, 20, 9.5, { para: 7, indent: 8 });
    printBlock(S, 230, 350, 190, 20, 9.5, { para: 6, indent: 8 });
    S.ln('M220 346V540', 0.6, 'ink-faint');
    return S;
  },

  /* ── PH-14 : Mariage à Vellaak, 1930 ── */
  'ph-14'(id) {
    const S = new Scene(id, 420, 330, 'photo');
    const pd = rect(8, 8, 404, 314);
    S.p('photo-paper', rect(0, 0, 420, 330));
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // coque du bateau pavoisé, MAAR + fanion
      const hull = smooth([[180, 40], [412, 30], [412, 200], [200, 210], [170, 150]], true);
      S.fill(hull, 'dark');
      S.ln(hull + 'M176 120L412 112', 1, 'ink-soft');
      S.push('<text class="label" x="194" y="100" font-size="15">MAAR</text>');
      const pen = poly([[240, 74], [270, 84], [242, 104]], true);
      S.fill(pen, 'light');
      S.ln(pen + 'M240 20V110', 1, 'ink-soft');
      let flags = 'M180 22Q300 4 412 14';
      for (let i = 0; i < 8; i++) flags += `M${196 + i * 28} ${18 - i * 0.6}l6 14l6 -15`;
      S.ln(flags, 0.8, 'ink-soft');
      // filets qui sèchent
      let net = '';
      for (let i = 0; i < 12; i++) net += `M${10 + i * 12} 40L${20 + i * 12} 170M${10 + i * 12} 170L${30 + i * 12} 40`;
      S.ln(net, 0.5, 'ink-faint');
      // quai de bois
      S.fill(rect(8, 230, 404, 100), 'mid');
      let pl = '';
      for (let y = 236; y < 330; y += 12) pl += `M8 ${y}H412`;
      S.ln(pl, 0.6, 'ink-faint');
      const fi = person(S, 'firmin-varenque-1900', 30, 20, 50, 0.66, { patch: { mouth: { smile: 1, teeth: true } }, lower: { kind: 'stand' } });
      void fi;
      const he = person(S, 'hessa-draavik', 24, 196, 70, 0.6, { patch: { hands: [] }, lower: { kind: 'skirt', hatch: true } });
      // bouquet de bruyère et d'ajonc
      const bq = ell(he.fx - 10, he.fy + 128, 16, 12);
      S.fill(bq, 'light');
      S.stip(bq);
      S.ln(bq, 0.6, 'ink-soft');
      // sous-exposé
      S.fill(pd, 'dark', { opacity: 0.18 });
      wear(S, { x: 8, y: 8, w: 404, h: 314 }, { edge: 16, spots: 4, corners: [[1, 1, 50]] });
    });
    return S;
  },

  /* ── PH-15 : Les sages-femmes de la côte, 1936 ── */
  'ph-15'(id) {
    const S = new Scene(id, 380, 460, 'photo');
    const pd = rect(10, 10, 360, 440);
    S.p('photo-paper', rect(0, 0, 380, 460));
    S.within(pd, () => {
      S.p('photo-light', pd);
      // mer en contrebas, lande, herbe couchée par le vent
      S.fill(rect(10, 150, 360, 70), 'mid', { opacity: 0.7 });
      waterLines(S, 10, 154, 370, 216, { sp: 5 });
      const land = smooth([[10, 200], [120, 186], [260, 196], [370, 180], [370, 460], [10, 460]], true);
      S.fill(land, 'mid');
      let grass = '';
      for (let i = 0; i < 160; i++) {
        const x = 10 + S.r() * 360;
        const y = 200 + S.r() * 250;
        grass += `M${f(x)} ${f(y)}q6 -6 ${f(10 + S.r() * 6)} -6`;
      }
      S.ln(grass, 0.6, 'ink-faint');
      S.fill(poly([[150, 460], [176, 220], [196, 220], [260, 460]], true), 'light', { opacity: 0.7 });
      const he = person(S, 'hessa-draavik', 30, 104, 60, 0.6, { lower: { kind: 'skirt', hatch: true } });
      // lanterne éteinte à la main
      hand(S, he.fx + 70, he.fy + 168, 0, 2.2, { skin: 1 });
      const lt = rect(he.fx + 62, he.fy + 184, 18, 26);
      S.fill(lt, 'light');
      S.ln(lt + `M${he.fx + 64} ${he.fy + 184}q7 -10 14 0`, 1, 'ink');
      S.stip(pd, { opacity: 0.3 });
    });
    return S;
  },

  /* ── PH-16 : Fiche BRR « VARENQUE Odile », 1941 ── */
  'ph-16'(id) {
    return fiche(id, (S, slot) => {
      // de face
      slot(0, () => {
        person(S, 'odile-varenque', 33, 50, 40, 0.86, { patch: { hands: [], hairStyle: 'bandeaux' }, lower: false });
      });
      // de profil droit (visage tourné vers la droite de l'image) : le côté gauche, celui de la
      // mèche, est caché ; la main droite tient l'ardoise du numéro, brûlure au dos bien visible
      slot(1, () => {
        person(S, 'odile-varenque', 33, 300, 40, 0.86, { patch: { hands: [], hairStyle: 'bandeaux', flip: true, marks: { meche: false } }, lower: false });
        const sl = rect(300, 214, 90, 34);
        S.fill(sl, 'dark');
        S.ln(sl, 1, 'ink-soft');
        S.ln('M312 232h14m8 0h14m8 0h14', 2.4, 'ink-faint');
        hand(S, 404, 262, 160, 3.6, { skin: 2, burn: true });
      });
    });
  },

  /* ── PH-17 : Fiche BRR « KESSVEL Orrin », 1941 ── */
  'ph-17'(id) {
    return fiche(id, (S, slot) => {
      slot(0, () => {
        person(S, 'orrin-kessvel', 36, 22, 12, 0.98, { patch: { hands: [] }, lower: false });
        // arcade gauche un peu enflée (image droite)
        S.fill(ell(132, 92, 10, 6), 'mid', { opacity: 0.5 });
      });
      slot(1, () => {
        person(S, 'orrin-kessvel', 36, 290, 12, 0.98, { patch: { hands: [], flip: true }, lower: false });
        const sl = rect(300, 214, 90, 34);
        S.fill(sl, 'dark');
        S.ln(sl, 1, 'ink-soft');
        S.ln('M312 232h14m8 0h14m8 0h14', 2.4, 'ink-faint');
        hand(S, 404, 262, 160, 3.6, { skin: 2, ink: true });
      });
    });
  },

  /* ── PH-18 : Au lac d'Aulne, été 1941 ── */
  'ph-18'(id) {
    const S = new Scene(id, 440, 440, 'photo');
    // bords dentelés
    let edge = 'M10 10';
    for (let x = 10; x < 430; x += 8) edge += `L${x + 4} ${x % 16 ? 6 : 10}L${x + 8} 10`;
    for (let y = 10; y < 430; y += 8) edge += `L${y % 16 ? 434 : 430} ${y + 4}L430 ${y + 8}`;
    for (let x = 430; x > 10; x -= 8) edge += `L${x - 4} ${x % 16 ? 434 : 430}L${x - 8} 430`;
    for (let y = 430; y > 10; y -= 8) edge += `L${y % 16 ? 6 : 10} ${y - 4}L10 ${y - 8}`;
    edge += 'Z';
    S.p('photo-paper', edge);
    S.ln(edge, 0.5, 'ink-faint');
    const pd = rect(24, 24, 392, 392);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // aulnes et chalet au fond
      foliage(S, 70, 110, 90, 70, { tone: 'dark' });
      foliage(S, 380, 100, 90, 80, { tone: 'dark' });
      const ch = poly([[200, 170], [200, 120], [250, 90], [300, 120], [300, 170]], true);
      S.fill(ch, 'light');
      S.fill(poly([[190, 124], [250, 84], [310, 124], [300, 128], [250, 96], [200, 128]], true), 'dark');
      S.ln(ch + 'M204 140H296', 0.8, 'ink-soft');
      let bal = '';
      for (let x = 206; x < 296; x += 7) bal += `M${x} 140v12`;
      S.ln(bal, 1, 'ink-soft');
      // lac calme
      S.fill(rect(24, 170, 392, 250), 'mid', { opacity: 0.55 });
      waterLines(S, 24, 176, 416, 416, { sp: 6 });
      // ponton
      S.fill(poly([[24, 330], [140, 300], [150, 312], [24, 352]], true), 'dark');
      S.ln('M40 340v40M100 318v40', 3, 'ink-soft');
      // passagers (bustes), puis la barque par-dessus
      person(S, 'ninon-brial', 29, 70, 162, 0.62, { patch: { hands: [] }, lower: false });
      person(S, 'claude-sauge', 3, 170, 236, 0.4, { patch: { hands: [] }, lower: false });
      person(S, 'victor-sauge', 35, 250, 150, 0.64, { patch: { hat: null, hairStyle: 'short', hair: 'brun', hands: [], clothes: { type: 'smock', wash: 'paper' } }, lower: false });
      const boat = smooth([[50, 300], [400, 296], [380, 346], [300, 368], [120, 368], [60, 340]], true);
      S.fill(boat, 'dark');
      S.ln(boat + 'M56 312Q230 322 398 306', 1, 'ink-soft');
      // avirons croisés
      S.ln('M300 300L420 380M340 290L230 376', 3, 'ink');
      // la mère retient la fillette par la ceinture ; la petite tend la main vers l'eau
      hand(S, 190, 300, -40, 2.4, { skin: 2 });
      arm(S, [[214, 300], [236, 320], [244, 336]], 9, 'light', { skin: 2, size: 1.6 });
      S.stip(pd, { opacity: 0.2 });
    });
    return S;
  },

  /* ── PH-19 : « Notre Lise », juillet 1942 ── */
  'ph-19'(id) {
    const S = new Scene(id, 360, 470, 'photo');
    const win = mount(S, { m: 24, mb: 24 });
    S.within(win.d, () => {
      S.p('photo-mid', win.d);
      // fond peint de jardin flou
      foliage(S, 80, 120, 110, 90, { tone: 'light', shade: false });
      foliage(S, 290, 160, 100, 110, { tone: 'light', shade: false });
      S.fill(win.d, 'paper', { opacity: 0.35 });
      const mc = person(S, 'marcel-daubry', 45, 176, 40, 0.6, { patch: { hands: [] }, lower: { kind: 'stand', hatch: true, arms: 'left' } });
      // insigne rond à la boutonnière
      S.fill(circ(mc.fx - 12, mc.fy + 80, 3), 'light');
      S.ln(circ(mc.fx - 12, mc.fy + 80, 3), 0.6, 'ink');
      armchair(S, 150, 210, 220, 210, 'mid');
      // main droite sur le dossier, sans toucher Blanche : chevalière à l'auriculaire
      hand(S, 218, 214, 170, 2.6, { skin: 2, ring: true });
      person(S, 'blanche-varenque', 41, 50, 150, 0.6, { patch: { hands: [], clothes: { type: 'dress', wash: 'wash-lilas', neck: 'v' }, extras: [{ type: 'pearls', n: 17, dy: 2, sag: 9 }], eyes: { gaze: 0.4 } }, lower: { kind: 'sitSkirt', hatch: true, arms: 'none' } });
      // le nourrisson en robe longue, bonnet de dentelle serré (aucun cheveu visible)
      const robe = smooth([[104, 330], [150, 312], [200, 330], [214, 388], [150, 394], [110, 362]], true);
      S.fill(robe, 'paper');
      S.ln(robe + 'M140 340q10 20 4 50M170 336q8 24 10 56', 0.8, 'ink-soft');
      head(S, { sex: 'f', age: 0, child: true, skin: 1, style: 'bonnet', turn: -0.2, smile: 0.2, brows: 0.5 }, 112, 318, 19);
      arm(S, [[84, 272], [94, 330], [128, 352]], 15, 'mid', { skin: 2, size: 2.4 });
      arm(S, [[150, 270], [180, 316], [190, 340]], 15, 'mid', { skin: 2, size: 2.4 });
      wear(S, win, { edge: 12, spots: 4 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-20 : « Selda Varenque rentre d'exil », 1953 (une) ── */
  'ph-20'(id) {
    const S = new Scene(id, 460, 580, 'photo');
    S.p('paper', rect(0, 0, 460, 580));
    headline(S, 30, 16, 400, 30, { words: 2 });
    S.ln('M20 54H440M20 58H440', 0.8, 'ink-soft');
    headline(S, 60, 66, 340, 14, { words: 4, cls: 'ink-soft' });
    const pd = rect(20, 92, 420, 300);
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // coque noire, quai
      S.fill(smooth([[20, 120], [440, 110], [440, 250], [20, 262]], true), 'dark');
      S.ln('M20 150L440 140', 1, 'ink-soft');
      S.fill(rect(20, 300, 420, 100), 'light', { opacity: 0.6 });
      person(S, 'firmin-varenque-1900', 53, 20, 140, 0.62, { patch: { hat: null }, lower: { kind: 'stand', zigzag: true, arms: 'left' } });
      // valise
      const val = rect(40, 330, 70, 50);
      S.fill(val, 'dark');
      S.ln(val + 'M64 330q11 -10 22 0', 1.2, 'ink');
      const se = person(S, 'selda-varenque', 49, 148, 150, 0.6, { patch: { glasses: null }, lower: { kind: 'stand', hatch: true } });
      // cigarillo, lunettes à chaînette pendues sur le manteau
      S.fill(tube([[se.fx - 6, se.fy + 30], [se.fx - 24, se.fy + 36]], 3, 2.6), 'dark');
      S.ln(`M${se.fx - 26} ${se.fy + 50}q26 40 52 0`, 0.8, 'ink-soft', { 'stroke-dasharray': '1.5 1' });
      S.ln(ell(se.fx - 6, se.fy + 92, 7, 5) + ell(se.fx + 10, se.fy + 92, 7, 5), 1, 'ink');
      person(S, 'tavik-varenque', 20, 290, 112, 0.7, { lower: { kind: 'stand', zigzag: true } });
      // pluie fine
      let rain = '';
      for (let i = 0; i < 160; i++) {
        const x = 20 + S.r() * 440;
        const y = 92 + S.r() * 300;
        rain += `M${f(x)} ${f(y)}l-3 10`;
      }
      S.ln(rain, 0.5, 'ink-faint');
      S.stip(pd, { opacity: 0.35 });
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 20, 408, 130, 17, 9.5, { para: 6, indent: 8 });
    printBlock(S, 165, 408, 130, 17, 9.5, { para: 8, indent: 8 });
    printBlock(S, 310, 408, 130, 17, 9.5, { para: 5, indent: 8 });
    return S;
  },

  /* ── PH-21 : L'atelier des costumes de l'Opéra, 1948 ── */
  'ph-21'(id) {
    const S = new Scene(id, 440, 400, 'photo');
    const pd = rect(10, 10, 420, 380);
    S.p('photo-paper', rect(0, 0, 440, 400));
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // combles
      S.fill(poly([[10, 10], [430, 10], [430, 60], [220, 20], [10, 80]], true), 'dark');
      S.ln('M10 80L220 20L430 60', 2, 'ink-soft');
      // mannequins de bois, rouleaux de tissu
      for (const x of [40, 370]) {
        const m = smooth([[x - 18, 120], [x - 22, 160], [x - 14, 210], [x + 14, 210], [x + 22, 160], [x + 18, 120], [x, 112]], true);
        S.fill(m, 'light');
        S.ln(m + `M${x} 112v-14M${x} 210v80M${x - 16} 290h32`, 1, 'ink-soft');
      }
      for (let i = 0; i < 5; i++) {
        const r0 = ell(70 + i * 14, 300 - (i % 2) * 6, 7, 30);
        S.fill(r0, i % 2 ? 'light' : 'dark');
        S.ln(r0, 0.6, 'ink-soft');
      }
      // table de coupe, fer sur réchaud
      S.fill(rect(300, 300, 130, 14), 'light');
      S.ln('M310 314v76M420 314v76', 2, 'ink-soft');
      S.fill(poly([[340, 290], [372, 290], [366, 278], [348, 278]], true), 'dark');
      // estrade
      S.fill(rect(130, 330, 200, 60), 'dark');
      S.hat(rect(130, 330, 200, 60));
      const bl = person(S, 'blanche-varenque', 47, 160, 40, 0.58, { lower: { kind: 'skirt', tone: 'light', train: true, foot: 520, arms: 'none' } });
      // bras levés, elle parle
      arm(S, [[bl.fx - 34, bl.fy + 60], [bl.fx - 66, bl.fy + 30], [bl.fx - 74, bl.fy - 10]], 14, 'light', { skin: 2, size: 2.4, ang: 180 });
      arm(S, [[bl.fx + 34, bl.fy + 60], [bl.fx + 70, bl.fy + 34], [bl.fx + 82, bl.fy - 6]], 14, 'light', { skin: 2, size: 2.4, ang: 180 });
      // petites lanternes brodées sur la traîne
      let lt = '';
      for (let i = 0; i < 10; i++) lt += rect(170 + i * 16, 300 + (i % 3) * 8, 5, 8) + `M${172 + i * 16} ${300 + (i % 3) * 8}v-3`;
      S.ln(lt, 0.8, 'ink-soft');
      // Ninon à genoux, épingles aux lèvres, yeux baissés
      const nn = person(S, 'ninon-brial', 36, 230, 170, 0.5, { patch: { eyes: { lid: 0.7, gaze: 0.2 } }, lower: { kind: 'sitSkirt', foot: 300, arms: 'left' } });
      S.ln(`M${nn.fx - 6} ${nn.fy + 26}l-10 2M${nn.fx - 4} ${nn.fy + 28}l-11 6M${nn.fx - 2} ${nn.fy + 28}l-8 9`, 0.8, 'ink');
      S.stip(pd, { opacity: 0.3 });
    });
    return S;
  },

  /* ── PH-22 : « Les noces de l'année », 1951 ── */
  'ph-22'(id) {
    const S = new Scene(id, 440, 560, 'photo');
    S.p('paper', rect(0, 0, 440, 560));
    headline(S, 40, 18, 360, 22, { words: 4 });
    S.ln('M20 50H420', 0.8, 'ink-soft');
    const pd = rect(20, 62, 400, 330);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // parvis : portail d'église
      const portal = `M150 392V160Q230 70 310 160V392Z`;
      S.fill(portal, 'dark');
      S.ln(portal + 'M168 392V172Q230 96 292 172V392', 1.2, 'ink-soft');
      S.fill(rect(20, 62, 120, 330), 'mid', { opacity: 0.6 });
      S.fill(rect(320, 62, 100, 330), 'mid', { opacity: 0.6 });
      const ar = person(S, 'armand-varenque', 23, 70, 96, 0.68, { patch: { mouth: { smile: 1, teeth: true } }, lower: { kind: 'stand', hatch: true, arms: 'left' } });
      // il se protège d'une main
      arm(S, [[ar.fx + 60, ar.fy + 80], [ar.fx + 92, ar.fy + 30], [ar.fx + 70, ar.fy - 44]], 18, 'mid', { skin: 2, size: 3, ang: 200 });
      // voile court
      S.fill(smooth([[236, 120], [300, 112], [330, 200], [320, 280], [240, 280], [228, 200]], true), 'paper', { opacity: 0.85 });
      person(S, 'mathilde-rouviere', 21, 214, 112, 0.64, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'claudine' } }, lower: { kind: 'skirt', tone: 'light' } });
      // pluie de riz
      let rice = '';
      for (let i = 0; i < 140; i++) rice += ell(20 + S.r() * 400, 62 + S.r() * 220, 1.4, 0.8);
      S.fill(rice, 'paper');
      S.stip(pd, { opacity: 0.3 });
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 20, 410, 190, 14, 9.5, { para: 7, indent: 8 });
    printBlock(S, 230, 410, 190, 14, 9.5, { para: 5, indent: 8 });
    return S;
  },

  /* ── PH-23 : Couverture d'Antenne velmarchoise, 1954 (couleurs retouchées) ── */
  'ph-23'(id) {
    const S = new Scene(id, 400, 540, 'color');
    S.p('paper', rect(0, 0, 400, 540));
    S.fill(rect(0, 0, 400, 540), { c: 'wash-indigo' }, { opacity: 0.45 });
    // titre en lettres stylisées
    S.fill(rect(0, 0, 400, 86), { c: 'wash-carmin' });
    headline(S, 30, 22, 340, 42, { words: 2, cls: 'ink' });
    // médaillon : téléviseur dessiné
    const tv = rect(282, 400, 92, 74);
    S.fill(tv, { c: 'wash-safran' });
    S.ln(tv + rect(290, 408, 60, 56) + circ(362, 420, 4) + circ(362, 438, 4) + 'M310 400l-14 -18M330 400l14 -18', 1.2, 'ink');
    const mt = person(S, 'mathilde-rouviere', 24, 40, 96, 1.6, { mode: 'color', lower: { kind: 'stand', tone: { p: 'mid', c: 'wash-carmin' }, arms: 'none' }, patch: { hands: [] } });
    // microphone de studio à grille ronde
    const mx = mt.fx + 60;
    const my = mt.fy + 170;
    S.ln(`M${mx} ${my + 40}V540`, 4, 'ink');
    S.fill(circ(mx, my, 34), { c: 'wash-ardoise' });
    let gr = '';
    for (let k = -28; k <= 28; k += 7) gr += `M${mx + k} ${my - Math.sqrt(34 * 34 - k * k)}V${my + Math.sqrt(34 * 34 - k * k)}M${mx - Math.sqrt(34 * 34 - k * k)} ${my + k}H${mx + Math.sqrt(34 * 34 - k * k)}`;
    S.ln(gr, 0.6, 'ink-soft');
    S.ln(circ(mx, my, 34), 2, 'ink');
    headline(S, 30, 500, 220, 14, { words: 3, cls: 'ink-soft' });
    return S;
  },

  /* ── PH-24 : Classe de 4e B, Bains-de-Mérande, juin 1955 ── */
  'ph-24'(id) {
    const S = new Scene(id, 620, 440, 'photo');
    const win = mount(S, { inset: { x: 24, y: 22, w: 572, h: 396 } });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // préau : colonnes de fonte, tableau noir
      S.fill(rect(24, 22, 572, 40), 'dark');
      for (const x of [60, 560]) {
        S.fill(rect(x - 5, 22, 10, 300), 'dark');
        S.ln(`M${x - 12} 62h24`, 2, 'ink-soft');
      }
      const tb = rect(180, 40, 240, 70);
      S.fill(tb, 'dark');
      S.ln(handLines(S.r, 240, 80, 110, 1, 10, { h: 5, step: 5 }), 1.4, 'ink-faint');
      S.fill(rect(24, 330, 572, 90), 'mid', { opacity: 0.6 });
      const HAIR = ['brun', 'chatain', 'blond', 'noir', 'brun', 'chatain', 'gris'];
      const rows = [
        { y: 40, s: 0.4, x0: 66 }, // 4e rang (debout sur le banc)
        { y: 94, s: 0.41, x0: 60 }, // 3e rang
        { y: 148, s: 0.42, x0: 54 }, // 2e rang
        { y: 204, s: 0.43, x0: 48 }, // 1er rang (assises)
      ];
      let k = 0;
      rows.forEach((row, ri) => {
        for (let i = 0; i < 6; i++) {
          const x = row.x0 + i * 72 + (ri % 2) * 8;
          const lw = ri === 3 ? { kind: 'sitSkirt', tone: 'light', child: 0.3 } : { kind: 'stand', tone: 'light', child: 0.3, arms: 'none' };
          if (ri === 2 && i === 1) {
            person(S, 'lise-daubry', 13, x, row.y, row.s, { patch: { clothes: { type: 'dress', wash: 'paper', neck: 'round' }, mouth: { smile: 0 } }, lower: lw });
            continue;
          }
          // aucune autre élève n'a de boucles châtain clair au 2e rang ; toutes ont les cheveux tirés
          const hair = ri === 2 ? ['brun', 'noir', 'blond'][k % 3] : HAIR[k % 6];
          extra(S, { sex: 'f', age: 13, skin: 1 + (k % 3), hair, W: 22 + (k % 3), H: 35, hairStyle: 'bandeaux', mouth: { smile: (k % 4) * 0.2 }, clothes: { type: 'dress', wash: 'paper', neck: 'round' } }, x, row.y, row.s, { lower: lw });
          k++;
        }
      });
      // la professeure, debout à droite
      extra(S, { sex: 'f', age: 55, skin: 2, hair: 'gris', W: 24, H: 37, hairStyle: 'bandeaux', clothes: { type: 'suit', wash: 'wash-ardoise', blouse: 'paper' } }, 506, 40, 0.46, { lower: { kind: 'skirt', hatch: true } });
      S.stip(win.d, { opacity: 0.2 });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    return S;
  },

  /* ── PH-25 : Mariage d'Hélène et de Paul, 1956 (coupure régionale) ── */
  'ph-25'(id) {
    const S = new Scene(id, 380, 470, 'photo');
    const clip = poly([[6, 8], [374, 4], [376, 466], [4, 462]], true);
    S.p('paper', clip);
    S.ln(clip, 0.6, 'ink-faint');
    const pd = rect(24, 24, 332, 300);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // marches de la maison commune, colonnes
      for (let i = 0; i < 6; i++) S.ln(`M24 ${250 + i * 14}H356`, 1, 'ink-soft');
      S.fill(rect(24, 250, 332, 80), 'mid', { opacity: 0.5 });
      S.fill(rect(40, 24, 30, 230) + rect(310, 24, 30, 230), 'light');
      S.ln(rect(40, 24, 30, 230) + rect(310, 24, 30, 230), 1, 'ink-soft');
      S.fill(rect(70, 24, 240, 230), 'dark');
      S.fill(smooth([[190, 76], [254, 70], [270, 160], [262, 250], [184, 250], [176, 160]], true), 'paper', { opacity: 0.85 });
      person(S, 'helene-varenque', 25, 160, 66, 0.62, { patch: { hands: [], clothes: { type: 'dress', wash: 'paper', neck: 'round' }, mouth: { smile: 1, teeth: true }, eyes: { gaze: -0.5 } }, lower: { kind: 'skirt', tone: 'light' } });
      person(S, 'paul-marsal', 28, 40, 56, 0.64, { patch: { mouth: { smile: 1, teeth: true, pipe: false } }, lower: { kind: 'stand', hatch: true } });
      S.stip(pd, { opacity: 0.55 });
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 24, 340, 332, 1, 10, { align: 'center', word: [6, 12] });
    printBlock(S, 24, 362, 160, 10, 9, { para: 5, indent: 8 });
    printBlock(S, 196, 362, 160, 10, 9, { para: 4, indent: 8 });
    return S;
  },

  /* ── PH-26 : « Autoportrait », Visages de la côte, 1958 (héliogravure) ── */
  'ph-26'(id) {
    const S = new Scene(id, 420, 560, 'photo');
    S.p('photo-dark', rect(0, 0, 420, 560));
    const mir = rect(40, 30, 340, 500);
    S.fill(mir, 'mid');
    S.within(mir, () => {
      // dans le miroir : fenêtre à petits carreaux sur le port, séchoirs, fjord ; fougère en pot
      const wd = rect(220, 60, 140, 200);
      S.fill(wd, 'light');
      S.fill(poly([[220, 150], [300, 120], [360, 140], [360, 160], [220, 170]], true), 'mid');
      S.ln('M230 210v-40l10 -6v46M260 214v-46l10 -6v52M232 190h40', 1, 'ink-soft');
      S.ln(wd + 'M266 60v200M313 60v200M220 110h140M220 160h140M220 210h140', 2.4, 'ink-soft');
      S.fill(rect(210, 258, 160, 12), 'dark');
      const pot = poly([[300, 258], [336, 258], [332, 236], [304, 236]], true);
      S.fill(pot, 'mid');
      let fr = '';
      for (let i = 0; i < 7; i++) {
        const a = -2.6 + i * 0.36;
        fr += `M318 236q${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 26)} ${f(Math.cos(a) * 34)} ${f(Math.sin(a) * 30 - 6)}`;
      }
      S.ln(fr, 2.4, 'ink-soft');
      // le reflet : visage et mains apparaissent inversés (mèche à gauche de l'image)
      const od = person(S, 'odile-varenque', 50, 30, 120, 1.1, { patch: { hands: [], flip: true }, lower: { kind: 'stand', zigzag: true, arms: 'none' } });
      // appareil à visée par le haut contre la poitrine
      const cam = rect(od.fx - 10, od.fy + 150, 64, 80);
      S.fill(cam, 'dark');
      S.ln(cam + circ(od.fx + 22, od.fy + 176, 11) + circ(od.fx + 22, od.fy + 208, 12), 1.2, 'ink-soft');
      S.fill(circ(od.fx + 22, od.fy + 208, 7), 'mid');
      hand(S, od.fx - 12, od.fy + 236, 160, 3.6, { skin: 2 });
      // main droite sur le déclencheur (côté droit de l'image), cicatrice de brûlure
      hand(S, od.fx + 62, od.fy + 196, 120, 3.6, { skin: 2, burn: true });
      // piqûres du tain
      let sp = '';
      for (let i = 0; i < 70; i++) sp += circ(40 + S.r() * 340, 30 + S.r() * 500, 0.6 + S.r() * 2.4);
      S.fill(sp, 'light', { opacity: 0.7 });
      S.stip(mir, { opacity: 0.4 });
    });
    S.ln(mir + rect(32, 22, 356, 516), 2, 'ink-faint');
    return S;
  },

  /* ── PH-27 : Nécrologie de Marc Dobrin, 1959 (coupure étrangère) ── */
  'ph-27'(id) {
    const S = new Scene(id, 360, 460, 'photo');
    const clip = poly([[4, 6], [356, 2], [358, 456], [2, 452]], true);
    S.p('paper', clip);
    S.ln(clip, 0.6, 'ink-faint');
    headline(S, 90, 20, 180, 16, { words: 2 });
    const pd = rect(110, 46, 140, 170);
    S.within(pd, () => {
      S.p('photo-light', pd);
      const md = person(S, 'marcel-daubry', 61, 116, 52, 0.85, { patch: { hands: [] }, lower: { kind: 'stand', hatch: true, arms: 'none' } });
      // verres fumés ronds
      S.fill(circ(md.fx - 3, md.fy - 2, 9.5) + ell(md.fx + 25, md.fy + 3, 7.5, 9), 'dark', { opacity: 0.85 });
      // main droite sur le revers : chevalière à l'auriculaire
      hand(S, md.fx + 24, md.fy + 66, 200, 2.8, { skin: 2, ring: true });
      S.stip(pd, { opacity: 0.5 });
    });
    S.ln(pd, 0.8, 'ink');
    printBlock(S, 20, 236, 152, 22, 9, { para: 8, indent: 8 });
    printBlock(S, 188, 236, 152, 22, 9, { para: 6, indent: 8 });
    S.ln('M180 232V440', 0.5, 'ink-faint');
    return S;
  },

  /* ── PH-28 : Inauguration du Lecteur LX-2, novembre 1973 ── */
  'ph-28'(id) {
    const S = new Scene(id, 560, 380, 'photo');
    const pd = rect(10, 10, 540, 360);
    S.p('photo-paper', rect(0, 0, 560, 380));
    S.within(pd, () => {
      S.p('photo-mid', pd);
      // boiseries, bustes
      let wood = '';
      for (let x = 10; x < 560; x += 60) wood += rect(x + 6, 20, 48, 120);
      S.ln(wood, 1, 'ink-faint');
      for (const x of [60, 500]) {
        S.fill(rect(x - 16, 120, 32, 60), 'dark');
        S.fill(ell(x, 96, 16, 22), 'light');
        S.ln(ell(x, 96, 16, 22), 0.8, 'ink-soft');
      }
      // console à écran vert, clavier, imprimante
      const con = rect(210, 180, 150, 110);
      S.fill(con, 'light');
      S.ln(con, 1, 'ink-soft');
      S.fill(rect(226, 192, 118, 70), 'dark');
      S.ln(textLines(S.r, 234, 204, 100, 5, 10, { word: [2, 6], gap: 2 }), 1.2, 'ink-faint');
      S.fill(poly([[200, 300], [370, 300], [380, 326], [190, 326]], true), 'light');
      S.ln('M200 308h170M196 316h178', 0.6, 'ink-soft');
      S.fill(rect(380, 250, 70, 56), 'light');
      S.ln(rect(380, 250, 70, 56) + 'M386 250v-12h58v12', 1, 'ink-soft');
      S.fill(rect(10, 326, 540, 44), 'dark');
      extra(S, { sex: 'm', age: 65, skin: 2, hair: 'gris', W: 25, H: 37, hairStyle: 'short', hairOpt: { receding: true }, glasses: { type: 'round' }, clothes: { type: 'coat', wash: 'wash-ardoise', vest: 'wash-ardoise', collar: 'turn', tie: 'tie' } }, 40, 70, 0.62, { lower: { kind: 'stand', hatch: true, arms: 'none' } });
      const cl = person(S, 'claude-sauge', 35, 150, 84, 0.6, { patch: { hands: [] }, lower: { kind: 'stand', arms: 'left' } });
      arm(S, [[cl.fx + 34, cl.fy + 78], [cl.fx + 70, cl.fy + 112], [cl.fx + 104, cl.fy + 104]], 16, 'mid', { skin: 2, size: 2.6, ang: -110 });
      const li = person(S, 'lise-daubry', 31, 380, 64, 0.62, { patch: { hands: [] }, lower: { kind: 'stand', tone: 'light', arms: 'left' } });
      // microfiche tenue à contre-jour, gants de coton blancs
      arm(S, [[li.fx + 46, li.fy + 80], [li.fx + 76, li.fy + 40], [li.fx + 70, li.fy - 2]], 16, 'light', { skin: 2, size: 2.6, glove: true, ang: 180 });
      const mf = rect(li.fx + 50, li.fy - 54, 40, 30);
      S.fill(mf, 'paper', { opacity: 0.9 });
      S.ln(mf, 0.8, 'ink');
      let g = '';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g += rect(li.fx + 54 + i * 9, li.fy - 50 + j * 9, 7, 7);
      S.fill(g, 'mid', { opacity: 0.6 });
      S.stip(pd, { opacity: 0.35 });
    });
    return S;
  },

  /* ── PH-29 : « Le dernier gardien de Tennok », 1972 ── */
  'ph-29'(id) {
    const S = new Scene(id, 400, 520, 'photo');
    const pd = rect(10, 10, 380, 500);
    S.p('photo-paper', rect(0, 0, 400, 520));
    S.within(pd, () => {
      S.p('photo-light', pd);
      // en contrebas : la mer, des récifs, l'abri du canot
      S.fill(rect(10, 230, 380, 280), 'mid', { opacity: 0.7 });
      waterLines(S, 10, 236, 390, 500, { sp: 6 });
      reefs(S, 20, 380, 320, 18, 10);
      const sh = poly([[250, 420], [250, 392], [282, 376], [314, 392], [314, 420]], true);
      S.fill(sh, 'light');
      S.ln(sh, 0.8, 'ink-soft');
      person(S, 'tavik-varenque', 40, 90, 20, 1.15, { lower: { kind: 'stand', zigzag: true, arms: 'none' } });
      // carnet de croquis fermé contre la poitrine
      const nb = poly([[160, 300], [226, 290], [236, 366], [168, 376]], true);
      S.fill(nb, 'dark');
      S.ln(nb, 1, 'ink');
      hand(S, 180, 320, -80, 4, { skin: 2 });
      // rambarde de la galerie
      let rail = 'M10 380H390M10 392H390';
      for (let x = 20; x < 390; x += 26) rail += `M${x} 380V510`;
      S.ln(rail, 3, 'ink');
      S.stip(pd, { opacity: 0.3 });
    });
    return S;
  },

  /* ── EP-02 : Carte postale de Vellaak, juin 1975 (couleurs passées) ── */
  'ep-02'(id) {
    const S = new Scene(id, 540, 360, 'color');
    S.p('paper', rect(0, 0, 540, 360));
    const pd = rect(12, 12, 516, 336);
    S.within(pd, () => {
      // crépuscule
      S.fill(rect(12, 12, 516, 120), { c: 'wash-lilas' });
      S.fill(rect(12, 110, 516, 110), { c: 'wash-safran' }, { opacity: 0.5 });
      S.fill(rect(12, 220, 516, 130), { c: 'water' });
      waterLines(S, 12, 226, 528, 348, { sp: 6, cls: 'ink-faint' });
      // cap
      const cape = smooth([[180, 240], [240, 210], [360, 200], [460, 218], [528, 236], [528, 260], [180, 260]], true);
      S.fill(cape, { c: 'wash-ardoise' });
      S.ln(cape, 0.8, 'ink-soft');
      const lh = lighthouse(S, 380, 210, 170, { band: 'red', lit: true, beam: 'right', wBase: 0.18, wTop: 0.13 });
      // silhouette minuscule accoudée à la galerie, tournée vers la lumière
      const [gx0, gx1, gy] = lh.gallery;
      S.black(ell(gx1 - 4, gy - 9, 1.6, 1.8) + rect(gx1 - 5.5, gy - 7.4, 3, 6));
      void gx0;
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

};
