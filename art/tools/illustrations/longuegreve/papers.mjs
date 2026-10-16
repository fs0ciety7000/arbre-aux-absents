/**
 * Affaire 3 (`marques-de-longuegreve`) : planches du carnet de relevés de Solange Marest (CN-01 à
 * CN-03) et plan cadastral de 1868 (RG-06). Brief : docs/scenario/affaire-3/06-corpus.md (§ CN, RG).
 *
 * Règle d'écriture (09-marques §2, bible v0.2) : les relevés sont dessinés (rendu `releve`) ; les
 * **seuls** codes écrits sont les cotes LX portées au crayon lors du contrôle de 1977 : `A-g` et
 * `A-d` sur la planche II (CN-01), `A-b` et `A-b-g` sur la planche III (CN-02). Aucune cote sur la
 * planche IV (CN-03) ni sur le plan.
 */
import { Scene, printBlock, waterLines } from '../kit.mjs';
import { rect, ell, circ, smooth, f, handLines } from '../lib.mjs';
import { carve, label } from './cast.mjs';

/* ───────────────────────── Le carnet ───────────────────────── */

/** Page du carnet n° 3 : papier quadrillé, marge carmin, en-tête de planche, titre de la main de Marest. */
function carnet(S, plate, title, date) {
  const W = S.w;
  const H = S.h;
  S.p('paper-shade', rect(0, 0, W, H));
  S.p('ombre', rect(26, 24, W - 44, H - 40));
  const pg = rect(20, 16, W - 44, H - 40);
  S.p('paper', pg);
  let g = '';
  for (let x = 32; x < W - 24; x += 12) g += `M${x} 16V${H - 24}`;
  for (let y = 28; y < H - 24; y += 12) g += `M20 ${y}H${W - 24}`;
  S.ln(g, 0.25, 'ink-faint', { opacity: 0.7 });
  S.p('wash-carmin', `M74 16V${H - 24}`, { stroke: 'currentColor', 'stroke-width': 0.8 });
  S.ln(pg, 0.6, 'ink-soft');
  // spirale de reliure
  let sp = '';
  for (let y = 34; y < H - 30; y += 22) sp += ell(20, y, 7, 4);
  S.ln(sp, 1.2, 'ink-soft');
  label(S, 90, 50, `Carnet n° 3 — planche ${plate}`, { anchor: 'start', size: 13 });
  label(S, W - 40, 50, date, { anchor: 'end', size: 13 });
  label(S, 90, 82, title, { anchor: 'start', size: 19 });
  S.ln(`M90 92H${W - 60}`, 0.6, 'ink-soft');
}

/** Calque collé (papier pelure, coins scotchés) ; rend le rectangle. */
function calque(S, x, y, w, h, rot = 0) {
  S.open({ transform: `rotate(${f(rot)} ${f(x + w / 2)} ${f(y + h / 2)})` });
  S.p('paper-shade', rect(x, y, w, h), { opacity: 0.55 });
  S.ln(rect(x, y, w, h), 0.4, 'ink-faint');
  S.p('wash-safran', rect(x - 4, y - 3, 16, 7) + rect(x + w - 12, y + h - 4, 16, 7), { opacity: 0.45 });
  S.close();
}

/** Cote au crayon (contrôle de 1977), avec un trait de renvoi. */
function cote(S, x, y, code, to) {
  S.open({ opacity: 0.62 });
  if (to) S.ln(`M${f(x - 4)} ${f(y - 5)}L${f(to[0])} ${f(to[1])}`, 0.7, 'ink-soft');
  label(S, x, y, code, { anchor: 'start', size: 14, italic: false });
  S.close();
}

/** Note manuscrite illisible (encre de Marest). */
function note(S, x, y, w, n, lh = 15) {
  S.ln(handLines(S.r, x, y, w, n, lh, { slant: 0.5, h: 2.6, step: 3.2, last: 0.6 }), 0.7, 'ink-soft');
}

/** Esquisses de supports, au trait léger, derrière un relevé (repère : sommet du pied en x, y). */
const SUPPORT = {
  croix(S, x, y) {
    S.ln(`M${f(x - 7)} ${f(y - 34)}h14v22h26v14h-26v${f(98)}h-14v-98h-26v-14h26Z`, 0.6, 'ink-faint');
  },
  aviron(S, x, y) {
    S.ln(`M${f(x - 12)} ${f(y - 30)}V${f(y + 110)}M${f(x + 12)} ${f(y - 30)}V${f(y + 110)}`, 0.6, 'ink-faint');
    S.ln(`M${f(x - 12)} ${f(y - 30)}q12 -10 24 0`, 0.5, 'ink-faint', { 'stroke-dasharray': '2 2' });
  },
  fuseau(S, x, y) {
    S.ln(smooth([[x, y - 30, 1], [x - 14, y + 30], [x - 12, y + 90], [x, y + 112, 1], [x + 12, y + 90], [x + 14, y + 30]], true), 0.6, 'ink-faint');
  },
  tampon(S, x, y) {
    S.ln(circ(x + 4, y + 52, 64), 0.6, 'ink-faint');
  },
  caisse(S, x, y) {
    S.ln(rect(x - 46, y - 18, 92, 128) + rect(x - 40, y - 12, 80, 116), 0.5, 'ink-faint');
  },
  navette(S, x, y) {
    S.ln(smooth([[x, y - 34, 1], [x - 18, y + 20], [x - 16, y + 110], [x + 16, y + 110], [x + 18, y + 20]], true) + `M${f(x)} ${f(y - 22)}v20`, 0.6, 'ink-faint');
  },
  linteau(S, x, y) {
    S.ln(rect(x - 36, y - 16, 210, 128), 0.6, 'ink-faint');
  },
};

/** Un relevé : support esquissé, marque relevée (trait net), légende de la main de Marest. */
function releve(S, x, y, code, name, { support, s = 0.62, sub, plain = false } = {}) {
  if (support) SUPPORT[support](S, x, y);
  carve(S, code, x, y, s, plain ? 'gravure' : 'releve');
  label(S, x, y + 100 * s + (code.includes('-t') ? 30 : 16) * s + 16, name, { size: 13 });
  if (sub) label(S, x, y + 100 * s + (code.includes('-t') ? 30 : 16) * s + 32, sub, { size: 12 });
}

/* ───────────────────────── Scènes ───────────────────────── */

export const SCENES = {
  /* ── CN-01 : planche II, « Cimetière de Longuegrève », 29 août 1964 ── */
  'cn-01'(id) {
    const S = new Scene(id, 680, 900, 'color');
    carnet(S, 'II', 'Cimetière de Longuegrève — croix relevées au calque', '29.8.64');
    // les noms tels que Victoire les a dits ; deux cotes LX au crayon (contrôle de 1977)
    const crosses = [
      ['Y', 'Gervais, le garnaud'],
      ['Y-tO', 'Perrine'],
      ['O', 'Clovis'],
      ['O-tA', 'la vieille Toinette'],
      ['A', 'Siméon'],
      ['A-tP', 'Ursule'],
      ['P', 'Lubin'],
      ['P-tY', 'Apolline'],
      ['A-g', 'Jean'],
      ['A-d', 'Yves'],
      ['Y-pt-pt', 'la petite Marthe'],
      ['O-d', 'Ange', '(vide : cénotaphe)'],
      ['mer', 'Aurore'],
      ['mer', 'Aurore'],
    ];
    const cols = 4;
    crosses.forEach(([code, name, sub], i) => {
      const cx = 160 + (i % cols) * 140;
      const cy = 150 + Math.floor(i / cols) * 186;
      calque(S, cx - 48, cy - 44, 96, 150, S.r.jit(1.5));
      releve(S, cx, cy, code, name, { support: 'croix', s: 0.62, sub });
      if (code === 'A-g') cote(S, cx + 26, cy + 30, 'A-g', [cx + 12, cy + 34]);
      if (code === 'A-d') cote(S, cx + 26, cy + 30, 'A-d', [cx + 14, cy + 34]);
    });
    note(S, 430, 770, 210, 4);
    return S;
  },

  /* ── CN-02 : planche III, « Les Cabanes : avirons, caisses, linteaux », 5 septembre 1964 ── */
  'cn-02'(id) {
    const S = new Scene(id, 680, 900, 'color');
    carnet(S, 'III', 'Les Cabanes : avirons, caisses, linteaux', '5.9.64');
    const items = [
      ['Y-g-g', 'aviron', 'Gatien, mort en 44'],
      ['O-g-g', 'aviron', 'Elzéar, le batelier'],
      ['A-b', 'aviron', 'Noël, 1872', '« Flèche barrée »'],
      ['A-b-g', 'aviron', 'Lazare'],
      ['Y-g-tP', 'fuseau', 'Reine, la fileuse'],
      ['P-g-tO', 'tampon', 'Ernestine, le four'],
      ['P-g', 'caisse', 'Fulbert, goémon'],
      ['A-tP', 'navette', 'Ursule, les filets', 'passée à Honorine'],
    ];
    items.forEach(([code, support, name, sub], i) => {
      const cx = 156 + (i % 4) * 142;
      const cy = 160 + Math.floor(i / 4) * 250;
      releve(S, cx, cy, code, name, { support, s: 0.86, sub });
      if (code === 'A-b') cote(S, cx + 26, cy + 52, 'A-b', [cx + 12, cy + 36]);
      if (code === 'A-b-g') cote(S, cx + 26, cy + 92, 'A-b-g', [cx + 12, cy + 76]);
    });
    // le linteau de la maison du feu : marque, millésime et initiales taillés dans la pierre
    const lx = 160;
    const ly = 690;
    releve(S, lx, ly, 'P-d', '« la maison du feu »', { support: 'linteau', s: 0.8 });
    label(S, lx + 90, ly + 58, '1890', { size: 28, italic: false });
    label(S, lx + 150, ly + 58, 'S.B.', { size: 18, italic: false });
    note(S, 410, 700, 230, 6);
    return S;
  },

  /* ── CN-03 : planche IV, « Port-Sénane : marques hors de l'île », septembre 1964 ── */
  'cn-03'(id) {
    const S = new Scene(id, 680, 900, 'color');
    carnet(S, 'IV', 'Port-Sénane : marques hors de l’île', 'sept. 64');
    // 1. l'étiquette du Comptoir : la Fourche couronnée (gravure)
    S.ln(rect(110, 130, 160, 200), 0.6, 'ink-faint');
    S.ln(ell(190, 230, 44, 64) + ell(190, 230, 40, 60), 0.8, 'ink-soft');
    carve(S, 'fourche-couronnee', 190, 198, 0.78, 'gravure');
    label(S, 190, 356, 'Comptoir — étiquette de caisse', { size: 13 });
    note(S, 300, 150, 330, 5);
    // 2. la cloche de l'église du Môle : la « marque de l'île » (gravure du fondeur)
    const bell = smooth([[176, 412, 1], [160, 430], [152, 500], [140, 560], [112, 590, 1], [268, 590, 1], [240, 560], [228, 500], [220, 430], [204, 412, 1]], true);
    S.ln(bell + 'M146 540Q190 548 234 540', 0.7, 'ink-faint');
    carve(S, 'ile', 190, 446, 0.62, 'gravure');
    label(S, 190, 616, 'Église du Môle — cloche', { size: 13 });
    note(S, 300, 440, 330, 5);
    // 3. la cheminée de l'hôtel Garnaud, vue de la porte : la marque relevée, le millésime
    S.ln('M96 690H290M106 702H280M106 702V830M280 702V830M140 760H246V830', 0.7, 'ink-faint');
    S.ln(`M186 664q-4 -16 4 -24h12q8 8 4 24Z`, 0.6, 'ink-faint');
    carve(S, 'Y-d', 172, 708, 0.42, 'releve');
    label(S, 236, 738, '1898', { size: 16, italic: false });
    label(S, 190, 856, 'Hôtel Garnaud, quai du Môle — cheminée du salon', { size: 13 });
    note(S, 330, 700, 300, 7);
    return S;
  },

  /* ── RG-06 : plan cadastral « Les quatre lanières », feuille 4, 7 juillet 1868 ── */
  'rg-06'(id) {
    const S = new Scene(id, 600, 820, 'color');
    S.p('paper', rect(0, 0, 600, 820));
    S.p('paper-shade', rect(0, 0, 600, 820), { opacity: 0.5 });
    S.ln(rect(14, 14, 572, 792) + rect(20, 20, 560, 780), 0.8, 'ink');
    // la mer : traits d'eau horizontaux
    waterLines(S, 24, 24, 576, 796, { sp: 7, w: 0.4, cls: 'ink-faint', grow: 0 });
    // l'île : côte ouest presque droite (la grève), côte est découpée (falaises basses)
    const west = [[226, 82], [214, 160], [206, 260], [202, 360], [200, 460], [204, 560], [214, 650], [232, 720]];
    const east = [[262, 724], [318, 690], [340, 620], [356, 560], [344, 500], [366, 430], [358, 360], [376, 300], [360, 230], [366, 170], [330, 110], [292, 70], [250, 64]];
    const isle = smooth([...west, ...east], true, 0.7);
    S.p('paper', isle);
    // quatre lanières de la falaise (est) à la grève (ouest), du nord au sud
    const bands = [
      ['Lestaud', 'wash-safran', 150, 300],
      ['Goémard', 'wash-sienne', 300, 430],
      ['Oyard', 'wash-indigo', 430, 560],
      ['Cormaud', 'wash-ardoise', 560, 690],
    ];
    S.within(isle, () => {
      for (const [, cls, y0, y1] of bands) S.p(cls, rect(150, y0, 260, y1 - y0), { opacity: 0.55 });
      // grève : pointillé le long de la côte ouest
      let dots = '';
      for (let y = 90; y < 710; y += 7) dots += circ(212 + Math.sin(y / 30) * 2 - (y > 600 ? (y - 600) * 0.12 : 0) + (y < 160 ? (160 - y) * 0.12 : 0), y, 0.9);
      S.p('ink-soft', dots, { fill: 'currentColor', stroke: 'none' });
    });
    S.ln(isle, 1.3, 'ink');
    let lim = '';
    for (const [, , y0] of bands.slice(1)) lim += `M190 ${y0}H380`;
    S.ln(lim, 0.9, 'ink', { 'stroke-dasharray': '6 3' });
    bands.forEach(([name, , y0, y1]) => label(S, 288, (y0 + y1) / 2 + 4, `Lanière ${name}`, { cls: 'label', size: 11, italic: false }));
    // falaises : hachures courtes sur la côte est
    let cl = '';
    for (let i = 0; i < east.length - 1; i++) {
      const [x0, y0] = east[i];
      const [x1, y1] = east[i + 1];
      for (let t = 0; t < 1; t += 0.2) cl += `M${f(x0 + (x1 - x0) * t)} ${f(y0 + (y1 - y0) * t)}l7 2`;
    }
    S.ln(cl, 0.6, 'ink-soft');
    // le hameau (quatorze feux), la chapelle, le cimetière, sur la côte est
    let houses = '';
    for (let i = 0; i < 14; i++) houses += rect(316 + (i % 3) * 11 - (i > 8 ? 8 : 0), 380 + Math.floor(i / 3) * 12, 8, 6);
    S.fill(houses, { c: 'wash-carmin' });
    S.ln(houses, 0.6, 'ink');
    S.ln(rect(300, 470, 22, 12) + 'M311 462v-10M306 457h10', 0.8, 'ink');
    S.ln(rect(298, 494, 30, 22), 0.7, 'ink');
    let cx = '';
    for (let i = 0; i < 6; i++) cx += `M${304 + (i % 3) * 9} ${500 + Math.floor(i / 3) * 9}v6M${301 + (i % 3) * 9} ${502 + Math.floor(i / 3) * 9}h6`;
    S.ln(cx, 0.6, 'ink');
    label(S, 340, 444, 'hameau', { size: 11 });
    label(S, 356, 482, 'chapelle', { size: 11, anchor: 'start' });
    label(S, 340, 534, 'cimetière', { size: 11, anchor: 'start' });
    // la Longue Grève, le long de la côte ouest
    label(S, 176, 420, 'La Longue Grève', { cls: 'label', size: 12, italic: false, rot: -90 });
    // ajout au crayon : le feu de 1872, à la pointe nord
    S.open({ opacity: 0.6 });
    S.ln(circ(262, 86, 6) + 'M262 80v-8M256 86h-8M268 86h8', 0.8, 'ink-soft');
    label(S, 284, 60, 'feu (1872)', { anchor: 'start', size: 13, italic: false });
    S.close();
    // flèche du nord et échelle
    S.ln('M86 120V60M86 60l-8 18h16Z', 1, 'ink');
    label(S, 86, 140, 'N', { cls: 'label', size: 13, italic: false });
    S.ln('M60 760H200M60 754v12M95 756v8M130 754v12M165 756v8M200 754v12', 0.9, 'ink');
    label(S, 130, 784, '1 000 toises', { size: 11 });
    // cartouche du géomètre : titre, date, la « marque de l'île » (D11)
    S.p('paper', rect(392, 600, 176, 190));
    S.ln(rect(392, 600, 176, 190) + rect(397, 605, 166, 180), 0.9, 'ink');
    label(S, 480, 628, 'Cadastre des îles', { cls: 'label', size: 11, italic: false });
    label(S, 480, 646, 'Feuille 4 — Longuegrève', { cls: 'label', size: 10, italic: false });
    label(S, 480, 666, 'Les quatre lanières', { size: 14 });
    carve(S, 'ile', 430, 684, 0.62, 'gravure');
    label(S, 506, 712, 'levé le', { size: 11 });
    label(S, 506, 728, '7 juillet 1868', { size: 11 });
    label(S, 506, 760, 'C. Mérel, géomètre', { size: 11 });
    printBlock(S, 456, 772, 96, 1, 8, { align: 'center' });
    return S;
  },
};
