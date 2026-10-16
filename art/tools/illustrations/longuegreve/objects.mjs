/**
 * Affaire 3 (`marques-de-longuegreve`) : objets, catalogue et affiche (OB-01, OB-03, OB-04, OB-05,
 * CT-01, PB-01). Brief : docs/scenario/affaire-3/06-corpus.md (§ OB, CT, PB).
 *
 * Marques : taillées (`taillee`) sur l'aviron et le linteau, gravées (`gravure`) sur la cloche et les
 * imprimés du Comptoir (Fourche couronnée D10, marque de l'île D11). Aucun code écrit.
 */
import { Scene, printBlock, waterLines } from '../kit.mjs';
import { rect, ell, circ, smooth, poly, f, lerp } from '../lib.mjs';
import { amber, carve, engraved, flat, label, lgBust, oar } from './cast.mjs';
import { markStrokes } from '../../marques/marks.mjs';

/* ───────────────────────── Outils ───────────────────────── */

/** Fourche couronnée (D10) dans son double ovale, gravée ; (x, y) = centre de l'ovale. */
export function sealD10(S, x, y, s = 1, { fill = 'paper' } = {}) {
  S.p(fill, ell(x, y, 46 * s, 66 * s));
  S.ln(ell(x, y, 46 * s, 66 * s), Math.max(0.6, 1.3 * s), 'ink');
  S.ln(ell(x, y, 41 * s, 61 * s), Math.max(0.5, 0.5 * s), 'ink-soft');
  carve(S, 'fourche-couronnee', x, y - 34 * s, 0.82 * s, 'gravure');
}

/**
 * Têtes seules (sans pied), gravées au burin : les quatre têtes de la cloche. (x, y) = sommet ;
 * s = échelle. Trait régulier du graveur (creux cerné rempli de tailles).
 */
function engravedHead(S, code, x, y, s) {
  const { strokes } = markStrokes(code);
  // le dernier trait est le pied : le fondeur n'en grave qu'une amorce, sous la tête
  const foot = strokes[strokes.length - 1];
  const heads = [...strokes.slice(0, -1), [foot[0], [foot[0][0], foot[0][1] + 26]]];
  let d = '';
  for (const st of heads) d += `M${st.map(([px, py]) => `${f(x + px * s)} ${f(y + py * s)}`).join('L')}`;
  S.ln(d, 5.2 * s, 'ink-soft', { 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' });
  S.ln(d, 2.4 * s, 'photo-light', { 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt', opacity: 0.6 });
}

/** Loupe de détail : disque cerclé, contenu dessiné par `fn` (rogné), trait de rappel. */
function loupe(S, x, y, r, fn, from) {
  if (from) S.ln(`M${f(from[0])} ${f(from[1])}L${f(x - r * 0.9)} ${f(y + r * 0.3)}`, 0.7, 'ink-faint');
  S.p('photo-mid', circ(x, y, r));
  S.within(circ(x, y, r), fn);
  S.ln(circ(x, y, r), 3, 'ink-soft');
  S.ln(circ(x, y, r + 4), 1, 'ink-faint');
}

/** Fil du bois (lignes ondulées) dans une boîte. */
function woodGrain(S, x0, y0, x1, y1, sp = 6, cls = 'ink-faint') {
  let d = '';
  for (let y = y0 + sp / 2, k = 0; y < y1; y += sp, k++) d += `M${f(x0)} ${f(y)}q${f((x1 - x0) / 4)} ${f(((k * 7) % 5) - 2.5)} ${f((x1 - x0) / 2)} 0t${f((x1 - x0) / 2)} 0`;
  S.ln(d, 0.5, cls);
}

/** Pierre dressée : bloc, éclats aux arêtes, grain piqueté. */
function stoneBlock(S, x, y, w, h, tone = 'light') {
  const r = S.r;
  const d = poly([[x + r.jit(2), y + 4], [x + 6, y + r.jit(2)], [x + w * 0.4, y + r.jit(1.5)], [x + w - 8, y + r.jit(2)], [x + w + r.jit(2), y + 6], [x + w + r.jit(1.5), y + h - 6], [x + w - 6, y + h + r.jit(2)], [x + w * 0.6, y + h + r.jit(1.5)], [x + 8, y + h], [x + r.jit(2), y + h - 8]], true);
  S.fill(d, tone);
  S.stip(d, { opacity: 0.55 });
  S.ln(d, 1, 'ink-soft');
  let ch = '';
  for (let i = 0; i < 10; i++) ch += `M${f(x + r() * w)} ${f(r() < 0.5 ? y + 2 : y + h - 2)}l${f(r.jit(5))} ${f(r.jit(3))}`;
  S.ln(ch, 0.6, 'ink-faint');
  return d;
}

/* ───────────────────────── Scènes ───────────────────────── */

export const SCENES = {
  /* ── OB-01 : l'aviron de Noël Cormaud, 1872 (Amicale des Cabanes) ── */
  'ob-01'(id) {
    const S = new Scene(id, 700, 470, 'photo');
    S.p('photo-dark', rect(0, 0, 700, 470));
    S.p('photo-mid', ell(300, 250, 340, 230), { opacity: 0.35 });
    // l'aviron en travers, pale en haut à gauche, poignée usée en bas à droite
    const o = oar(S, [30, 80], [640, 430], { w: 30, blade: 0.3, code: 'A-b', at: 0.56, ms: 0.5, worn: true });
    const [mx, my] = o.mid;
    // le millésime taillé à côté de la marque
    const ang = (Math.atan2(350, 610) * 180) / Math.PI;
    S.open({ transform: `rotate(${f(ang)} ${f(mx)} ${f(my)})` });
    engraved(S, mx + 64, my + 6, '1872', { size: 15 });
    S.close();
    // loupe : la marque redressée, au couteau dans le frêne
    loupe(S, 560, 150, 118, () => {
      S.p('photo-light', circ(560, 150, 118));
      woodGrain(S, 440, 30, 680, 270, 9);
      flat(S, 506, 60, 92, 150, 'photo-paper', 0.5);
      carve(S, 'A-b', 548, 70, 1.3, 'taillee');
      engraved(S, 602, 236, '1872', { size: 22 });
      S.stip(circ(560, 150, 112), { opacity: 0.2 });
    }, [mx + 8, my - 10]);
    return S;
  },

  /* ── OB-03 : la cloche de Longuegrève, 1868 (église du Môle, Port-Sénane) ── */
  'ob-03'(id) {
    const S = new Scene(id, 560, 600, 'photo');
    S.p('photo-dark', rect(0, 0, 560, 600));
    // baie du clocher, ciel clair, joug de chêne
    const bay = `M90 600V200A190 190 0 0 1 470 200V600Z`;
    S.p('photo-light', bay);
    S.stip(bay, { opacity: 0.3 });
    S.fill(rect(70, 96, 420, 30), 'dark');
    S.ln(rect(70, 96, 420, 30), 1, 'ink-soft');
    // la cloche
    const bell = smooth([[226, 126, 1], [196, 150], [180, 240], [168, 360], [140, 450], [96, 492, 1], [464, 492, 1], [420, 450], [392, 360], [380, 240], [364, 150], [334, 126, 1]], true);
    S.fill(bell, 'mid');
    S.p('photo-light', smooth([[206, 160], [226, 140], [236, 300], [218, 470], [176, 470], [198, 300]], true), { opacity: 0.6 });
    S.p('rehaut', smooth([[214, 180], [222, 168], [224, 300], [206, 440], [198, 440], [212, 300]], true), { opacity: 0.6 });
    S.ln(bell, 1.2, 'ink-soft');
    S.ln('M150 440Q280 456 410 440M110 480Q280 498 450 480', 1, 'ink-soft');
    // anses
    S.ln('M246 126q-6 -26 12 -30M314 126q6 -26 -12 -30M270 126v-30M290 126v-30', 4, 'ink-soft');
    // bande : « LONGUEGRÈVE 1868 » entre deux filets
    S.ln('M186 214Q280 222 374 214M184 246Q280 254 376 246', 0.9, 'ink-soft');
    engraved(S, 280, 238, 'LONGUEGRÈVE 1868', { size: 17, spacing: 1.5 });
    // les quatre têtes gravées, en frise
    const heads = ['Y', 'O', 'A', 'P'];
    heads.forEach((h, i) => engravedHead(S, h, 202 + i * 52 - (h === 'P' ? 10 : 0), 270, 0.95));
    // la « marque de l'île » du fondeur (D11), dans un cartouche
    S.ln(rect(244, 312, 72, 120) + rect(248, 316, 64, 112), 0.8, 'ink-soft');
    carve(S, 'ile', 280, 324, 0.74, 'gravure');
    // battant
    S.fill(rect(276, 470, 8, 40) + circ(280, 516, 12), 'dark');
    S.ln(circ(280, 516, 12), 0.8, 'ink-soft');
    return S;
  },

  /* ── OB-04 : étiquette de caisse du Comptoir, 1910 ── */
  'ob-04'(id) {
    const S = new Scene(id, 600, 420, 'color');
    // planche de caisse
    S.fill(rect(0, 0, 600, 420), { p: 'mid', c: 'wash-sienne' });
    woodGrain(S, 0, 0, 600, 420, 12);
    S.ln('M0 140H600M0 280H600', 1.4, 'ink-soft');
    for (const [x, y] of [[20, 70], [580, 70], [20, 350], [580, 350]]) S.black(circ(x, y, 3));
    // l'étiquette collée, coin relevé
    S.open({ transform: 'rotate(-1.5 300 210)' });
    const lab = poly([[70, 50], [530, 50], [530, 370], [96, 370], [70, 346]], true);
    S.p('ombre', lab, { transform: 'translate(4 5)' });
    S.fill(lab, { c: 'wash-safran' });
    S.p('paper', lab, { opacity: 0.55 });
    S.ln(lab, 1, 'ink');
    S.ln(rect(82, 62, 436, 296) + rect(88, 68, 424, 284), 0.8, 'ink');
    S.p('paper-shade', poly([[70, 346], [96, 370], [90, 344]], true));
    sealD10(S, 150, 210, 1.05);
    label(S, 352, 110, 'Comptoir des Ambres', { cls: 'label-major', size: 18, italic: false });
    label(S, 352, 138, 'B. Garnaud & Cie — Port-Sénane', { cls: 'label', size: 10, italic: false });
    S.ln('M232 156H472', 0.8, 'ink');
    label(S, 352, 202, 'Ambre de Longuegrève', { cls: 'label', size: 15, italic: false });
    label(S, 352, 236, 'qualité Grève', { cls: 'label-note', size: 18 });
    S.ln('M232 258H472', 0.8, 'ink');
    label(S, 352, 296, '« Ce que l’ambre garde, il le garde entier »', { cls: 'label-note', size: 11 });
    S.ln(rect(252, 314, 200, 22), 0.6, 'ink-soft');
    printBlock(S, 262, 326, 180, 1, 8, { align: 'left' });
    S.close();
    return S;
  },

  /* ── OB-05 : le linteau de la maison du feu, 1890 (Amicale des Cabanes) ── */
  'ob-05'(id) {
    const S = new Scene(id, 700, 420, 'photo');
    S.p('photo-light', rect(0, 0, 700, 420));
    // bardage du hangar, le linteau posé sur deux tréteaux
    S.fill(rect(0, 0, 700, 300), 'mid');
    let b = '';
    for (let x = 16; x < 700; x += 16) b += `M${x} 0V300`;
    S.ln(b, 0.6, 'ink-faint');
    S.fill(rect(0, 300, 700, 120), 'mid', { opacity: 0.6 });
    S.fill(rect(110, 300, 16, 100) + rect(574, 300, 16, 100), 'dark');
    stoneBlock(S, 60, 130, 580, 170, 'light');
    S.p('ombre', rect(64, 300, 580, 10), { opacity: 0.6 });
    // la marque du gardien (taillée par lui), le millésime et les initiales de l'institutrice
    flat(S, 196, 150, 76, 132, 'photo-paper', 0.35);
    carve(S, 'P-d', 226, 158, 1.08, 'taillee');
    engraved(S, 370, 242, '1890', { size: 46 });
    engraved(S, 530, 238, 'S.B.', { size: 30 });
    S.stip(rect(0, 0, 700, 420), { opacity: 0.12 });
    return S;
  },

  /* ── CT-01 : catalogue du Comptoir des Ambres, 1912 ── */
  'ct-01'(id) {
    const S = new Scene(id, 460, 640, 'engr');
    S.p('paper', rect(0, 0, 460, 640));
    S.p('paper-shade', rect(0, 0, 460, 640), { opacity: 0.35 });
    S.ln(rect(16, 16, 428, 608) + rect(22, 22, 416, 596), 0.8, 'ink');
    // en-tête : Fourche couronnée et raison sociale
    sealD10(S, 76, 84, 0.66);
    label(S, 262, 74, 'Comptoir des Ambres', { cls: 'label-major', size: 15, italic: false });
    label(S, 262, 98, 'B. Garnaud & Cie — Port-Sénane', { cls: 'label', size: 9 });
    label(S, 262, 122, 'Catalogue 1912', { cls: 'label-note', size: 14 });
    S.ln('M40 140H420', 1, 'ink');
    // photo tramée : l'atelier des Cabanes, un tailleur à l'établi
    const ph = rect(40, 156, 380, 230);
    S.within(ph, () => {
      S.p('photo-light', ph);
      S.p('photo-mid', rect(40, 156, 380, 230), { opacity: 0.45 });
      S.p('photo-paper', rect(290, 166, 110, 90));
      S.ln(rect(290, 166, 110, 90) + 'M345 166v90M290 211h110', 1.4, 'ink-soft');
      lgBust(S, 'gatien', 31, 80, 176, 1.06, { clip: false, mode: 'photo' });
      S.fill(rect(40, 360, 380, 26), 'dark');
      amber(S, 230, 350, 330, 362, 6, 4);
      S.stip(ph, { opacity: 0.4 });
    });
    S.ln(ph, 0.8, 'ink');
    label(S, 230, 404, 'G. Goémard, tailleur', { size: 13 });
    printBlock(S, 40, 424, 380, 2, 10, { align: 'center' });
    // articles : collier, broche, flacon de vernis
    const items = [
      [110, 'Colliers', '12 fl.'],
      [230, 'Broches', '4 fl.'],
      [350, 'Vernis à l’ambre', ''],
    ];
    let neck = '';
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.15 + (0.7 * i) / 10);
      neck += ell(110 + Math.cos(a) * 34, 470 + Math.sin(a) * 30, 4.4, 3.6);
    }
    S.fill(neck, 'light');
    S.ln(neck + 'M76 478Q110 520 144 478', 0.8, 'ink');
    const br = ell(230, 494, 18, 13);
    S.fill(br, 'light');
    S.ln(br + ell(230, 494, 13, 9), 0.9, 'ink');
    S.hatchIn(ell(230, 494, 13, 9), [214, 482, 246, 506], 40, 2.4, 0.4);
    const fl = smooth([[338, 520, 1], [336, 486], [344, 474], [344, 462, 1], [356, 462, 1], [356, 474], [364, 486], [362, 520, 1]], true);
    S.fill(fl, 'mid');
    S.ln(fl + rect(342, 452, 16, 10), 0.9, 'ink');
    for (const [x, name, price] of items) {
      label(S, x, 548, name, { size: 12 });
      if (price) label(S, x, 566, price, { size: 12, italic: false });
    }
    printBlock(S, 40, 590, 380, 2, 10, { align: 'center' });
    return S;
  },

  /* ── PB-01 : affiche « L'Ambre de Longuegrève », 1910 (Imprimerie Dumesnil-Corre) ── */
  'pb-01'(id) {
    const S = new Scene(id, 460, 660, 'color');
    S.p('paper', rect(0, 0, 460, 660));
    // ciel de couchant, l'île basse à l'horizon, la grève et ses ambres
    S.fill(rect(0, 0, 460, 330), { c: 'wash-safran' }, { opacity: 0.8 });
    S.fill(rect(0, 220, 460, 110), { c: 'wash-carmin' }, { opacity: 0.35, noPaper: true });
    S.fill(circ(320, 300, 46), { c: 'wash-safran' });
    S.ln(circ(320, 300, 46), 1, 'ink');
    const isle = smooth([[60, 330, 1], [120, 312], [240, 304], [380, 314], [440, 330, 1]], true);
    S.fill(isle, { c: 'wash-ardoise' });
    S.ln(isle, 1, 'ink');
    S.fill(rect(0, 330, 460, 120), { c: 'wash-indigo' }, { opacity: 0.7 });
    waterLines(S, 0, 336, 460, 450, { sp: 6, w: 0.8, cls: 'ink-soft' });
    const shore = smooth([[0, 430], [140, 418], [300, 440], [460, 426], [460, 660, 1], [0, 660, 1]], true);
    S.fill(shore, { c: 'wash-sienne' }, { opacity: 0.45 });
    S.ln(shore, 1, 'ink');
    // ambres jetés par le coup d'ouest, aplats de safran
    let am = '';
    for (const [x, y, k] of [[80, 480, 1.4], [150, 500, 1], [230, 486, 1.8], [320, 512, 1.2], [380, 478, 1], [120, 540, 1.1], [270, 548, 1.5]]) am += smooth([[x - 10 * k, y], [x - 3 * k, y - 8 * k], [x + 8 * k, y - 6 * k], [x + 10 * k, y + 3 * k], [x, y + 8 * k]], true);
    S.fill(am, { c: 'wash-safran' });
    S.ln(am, 1, 'ink');
    // la Fourche couronnée dans son sceau, en haut
    sealD10(S, 230, 164, 1.15);
    label(S, 230, 40, 'L’Ambre', { cls: 'label-major', size: 22, italic: false });
    label(S, 230, 70, 'de Longuegrève', { cls: 'label-major', size: 22, italic: false });
    label(S, 230, 262, 'depuis 1886', { cls: 'label-note', size: 18 });
    // pied d'affiche
    S.fill(rect(0, 590, 460, 70), { c: 'wash-indigo' });
    label(S, 230, 624, 'Comptoir des Ambres — Port-Sénane', { cls: 'label', size: 12, italic: false });
    label(S, 448, 650, 'Imp. lith. Dumesnil-Corre', { cls: 'label-note', size: 9, anchor: 'end' });
    S.ln(rect(6, 6, 448, 648), 1, 'ink');
    return S;
  },
};

export { lerp };
