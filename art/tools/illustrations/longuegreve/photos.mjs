/**
 * Affaire 3 (`marques-de-longuegreve`) : photographies et cartes postales (PH-01 à PH-18, CP-01,
 * CP-02). Brief : docs/scenario/affaire-3/06-corpus.md (§ PH, CP) et 10-illustrations.md ; âges et
 * constantes : 04-personnages.md ; visages : cast.mjs (générateur des portraits de l'affaire).
 *
 * Marques photographiées (PH-08, PH-09, PH-10, PH-15, PH-18) : dessinées par marks.mjs (rendu
 * `taillee`), jamais accompagnées de leur code. PH-09 : seule la croix de Clovis est lisible.
 * Côtés (DESIGN §10.7) : gauche du sujet = droite de l'image.
 */
import { Scene, mount, wear, foliage, crowd, printBlock, headline, waterLines } from '../kit.mjs';
import { hand } from '../people.mjs';
import { rect, ell, circ, smooth, poly, tube, f, handLines } from '../lib.mjs';
import { BY_ID } from '../fam.mjs';
import { amber, carve, child, engraved, extra, flat, islandCross, islander, label, lg, lgBust, limb, oar } from './cast.mjs';

/* ───────────────────────── Supports et décors ───────────────────────── */

/** Tirage monté sur carton, timbre sec du studio en bas à droite. */
function card(S, { m = 22, mb = 30, stamp = true, tone = 'paper-shade' } = {}) {
  const win = mount(S, { m, mb, cardTone: tone });
  if (stamp) S.ln(ell(S.w - m - 44, S.h - mb / 2 - 4, 36, 7) + ell(S.w - m - 44, S.h - mb / 2 - 4, 30, 4.5), 0.5, 'ink-faint');
  return win;
}

/** Verso en vignette (de biais) : écriture manuscrite illisible, une date lisible. */
function verso(S, x, y, w, h, { rot = 5, date, lines = 4, postcard = false } = {}) {
  S.open({ transform: `rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})` });
  S.p('ombre', rect(x + 3, y + 4, w, h));
  const d = rect(x, y, w, h);
  S.p('paper', d);
  S.ln(d, 0.6, 'ink-soft');
  if (postcard) {
    S.ln(`M${f(x + w * 0.52)} ${f(y + 12)}V${f(y + h - 12)}`, 0.6, 'ink-soft');
    S.ln(rect(x + w - 34, y + 10, 24, 30), 0.8, 'ink-soft');
    S.ln(circ(x + w - 36, y + 38, 12), 0.6, 'ink-faint');
    S.ln(`M${f(x + w * 0.56)} ${f(y + h * 0.5)}h${f(w * 0.38)}M${f(x + w * 0.56)} ${f(y + h * 0.66)}h${f(w * 0.38)}M${f(x + w * 0.56)} ${f(y + h * 0.82)}h${f(w * 0.3)}`, 0.5, 'ink-faint');
    S.ln(handLines(S.r, x + 10, y + 22, w * 0.42 - 10, lines, 15, { slant: 0.55, h: 2.6, step: 3.2 }), 0.7, 'ink');
  } else {
    S.ln(handLines(S.r, x + 12, y + 26, w - 24, lines, 18, { slant: 0.5, h: 3, step: 3.6 }), 0.8, 'ink');
    if (date) label(S, x + w - 14, y + h - 14, date, { anchor: 'end', size: 12 });
  }
  S.close();
}

/** Toile de fond peinte de studio : parc, balustrade, vase. */
function backdrop(S, x0, y0, x1, y1) {
  S.fill(rect(x0, y0, x1 - x0, y1 - y0), 'mid');
  S.p('photo-light', ell((x0 + x1) / 2, y0 + (y1 - y0) * 0.35, (x1 - x0) * 0.35, (y1 - y0) * 0.3), { opacity: 0.6 });
  foliage(S, x0 + 90, y0 + 90, 110, 80, { tone: 'mid', lumps: 14, shade: false });
  foliage(S, x1 - 90, y0 + 70, 120, 90, { tone: 'mid', lumps: 14, shade: false });
  const by = y0 + (y1 - y0) * 0.58;
  let bal = `M${f(x0)} ${f(by)}H${f(x1)}M${f(x0)} ${f(by + 40)}H${f(x1)}`;
  for (let x = x0 + 10; x < x1; x += 18) bal += `M${f(x)} ${f(by + 4)}q-5 18 0 34`;
  S.ln(bal, 1, 'ink-faint');
  S.stip(rect(x0, y0, x1 - x0, y1 - y0), { opacity: 0.35 });
}

/** Mer et ciel : horizon à `hy`, lignes d'eau jusqu'à `y1`. */
function seaSky(S, x0, y0, x1, y1, hy, { sky = 'light', sea = 'mid', island = null } = {}) {
  S.fill(rect(x0, y0, x1 - x0, hy - y0), sky);
  S.fill(rect(x0, hy, x1 - x0, y1 - hy), sea, { opacity: 0.8 });
  waterLines(S, x0, hy + 3, x1, y1, { sp: 4, w: 0.5 });
  if (island) {
    const [ix0, ix1, ih] = island;
    const d = smooth([[ix0, hy, 1], [ix0 + (ix1 - ix0) * 0.15, hy - ih * 0.6], [ix0 + (ix1 - ix0) * 0.5, hy - ih], [ix0 + (ix1 - ix0) * 0.85, hy - ih * 0.7], [ix1, hy, 1]], true);
    S.fill(d, 'mid', { opacity: 0.6 });
    S.ln(d, 0.5, 'ink-faint');
  }
}

/** Planches d'une jetée en perspective (de `y0` à `y1`), lignes de fuite vers (vx, vy). */
function planks(S, x0, y0, x1, y1, { tone = 'light', sp = 9 } = {}) {
  const d = rect(x0, y0, x1 - x0, y1 - y0);
  S.fill(d, tone);
  let l = '';
  for (let y = y0 + sp, k = 0; y < y1; y += sp * (1 + k * 0.08), k++) l += `M${f(x0)} ${f(y)}H${f(x1)}`;
  S.ln(l, 0.5, 'ink-faint');
  S.ln(`M${f(x0)} ${f(y0)}H${f(x1)}`, 0.8, 'ink-soft');
}

/** Bardage de planches verticales (hangar, chapelle des Cabanes). */
function boards(S, x0, y0, x1, y1, { tone = 'mid', sp = 14 } = {}) {
  S.fill(rect(x0, y0, x1 - x0, y1 - y0), tone);
  let l = '';
  for (let x = x0 + sp; x < x1; x += sp) l += `M${f(x)} ${f(y0)}V${f(y1)}`;
  S.ln(l, 0.6, 'ink-faint');
  let k = '';
  for (let i = 0; i < 8; i++) k += ell(x0 + S.r() * (x1 - x0), y0 + S.r() * (y1 - y0), 2, 1.2);
  S.ln(k, 0.4, 'ink-faint');
}

/** Bébé emmailloté dans un bras (PH-05, Félix à un an). */
function baby(S, x, y, k = 1) {
  const sw = smooth([[x - 18 * k, y - 4 * k], [x + 4 * k, y - 14 * k], [x + 26 * k, y - 4 * k], [x + 24 * k, y + 14 * k], [x - 12 * k, y + 18 * k]], true);
  S.fill(sw, 'paper');
  S.ln(sw + `M${f(x - 6 * k)} ${f(y + 2 * k)}q12 -6 ${f(28 * k)} 4`, 0.6, 'ink-soft');
  const face = ell(x - 8 * k, y - 8 * k, 7 * k, 7.5 * k);
  S.p('photo-light', face);
  S.ln(face, 0.6, 'ink-soft');
  const bonnet = smooth([[x - 17 * k, y - 6 * k], [x - 14 * k, y - 18 * k], [x - 2 * k, y - 18 * k], [x + 2 * k, y - 6 * k], [x - 2 * k, y - 12 * k], [x - 14 * k, y - 12 * k]], true);
  S.fill(bonnet, 'paper');
  S.ln(bonnet, 0.6, 'ink-soft');
  S.black(circ(x - 11 * k, y - 8 * k, 0.8 * k) + circ(x - 5 * k, y - 8 * k, 0.8 * k));
}

/** Fronton du stand : panneau clair, Fourche couronnée gravée dans un double ovale (D10). */
function crownedFork(S, x, y, s, { oval = true } = {}) {
  if (oval) {
    S.fill(ell(x, y + 50 * s, 46 * s, 66 * s), 'paper');
    S.ln(ell(x, y + 50 * s, 46 * s, 66 * s), Math.max(0.6, 1.2 * s), 'ink');
    S.ln(ell(x, y + 50 * s, 42 * s, 62 * s), 0.5, 'ink-soft');
  }
  carve(S, 'fourche-couronnee', x, y + 12 * s, s * 0.8, 'gravure');
}

/** Vitrine de verre (ambres posés sur des gradins). */
function vitrine(S, x, y, w, h, n = 10) {
  const d = rect(x, y, w, h);
  S.fill(d, 'mid', { opacity: 0.7 });
  S.ln(d + `M${f(x)} ${f(y + h * 0.5)}H${f(x + w)}`, 0.8, 'ink-soft');
  amber(S, x + 6, y + 6, x + w - 6, y + h * 0.45, n, 3.2);
  amber(S, x + 6, y + h * 0.56, x + w - 6, y + h - 6, n, 3.2);
  S.p('rehaut', poly([[x + w * 0.1, y], [x + w * 0.22, y], [x + w * 0.08, y + h], [x, y + h * 0.9]], true), { opacity: 0.35 });
}

/** Coupure de presse : papier journal, titre et colonnes illisibles, photo tramée `ph` (rect). */
function clipping(S, ph, fn, { cols = 2, lines = 8 } = {}) {
  const W = S.w;
  const H = S.h;
  const cut = poly([[14, 16], [W * 0.4, 12], [W - 14, 18], [W - 10, H * 0.5], [W - 16, H - 14], [W * 0.5, H - 10], [12, H - 16], [16, H * 0.5]], true);
  S.p('paper-shade', rect(0, 0, W, H));
  S.p('paper', cut);
  S.p('paper-shade', cut, { opacity: 0.45 });
  S.ln(cut, 0.6, 'ink-faint');
  headline(S, 40, 30, W - 80, 14, { words: 4 });
  S.within(ph.d, () => {
    S.p('photo-light', ph.d);
    fn();
    S.stip(ph.d, { opacity: 0.5 });
  });
  S.ln(ph.d, 0.8, 'ink');
  printBlock(S, ph.x, ph.y + ph.h + 16, ph.w, 1, 9, { align: 'center', cls: 'ink-soft' });
  const y0 = ph.y + ph.h + 40;
  const gap = 14;
  const w = (W - 80 - gap * (cols - 1)) / cols;
  for (let i = 0; i < cols; i++) printBlock(S, 40 + i * (w + gap), y0, w, lines, 9, { para: 5, indent: 6 });
}

/** Barque de pêche à moteur au mouillage (le *Saint-Gervais*), de profil ; (x, y) = flottaison. */
function fishingBoat(S, x, y, k = 1) {
  const P = (u, v) => [x + u * k, y + v * k];
  const hull = smooth([P(-120, -30, 1), P(110, -36), P(140, -46, 1), P(120, 0), P(-100, 6), P(-124, -10)], true);
  S.fill(hull, 'dark');
  S.ln(hull, 0.8, 'ink-soft');
  S.ln(`M${P(-118, -22).map(f).join(' ')}L${P(126, -30).map(f).join(' ')}`, 1, 'photo-paper');
  const cab = poly([P(-40, -30), P(-40, -70), P(20, -72), P(26, -30)], true);
  S.fill(cab, 'light');
  S.ln(cab + `M${P(-30, -62).map(f).join(' ')}h${f(20 * k)}v${f(14 * k)}h${f(-20 * k)}Z`, 0.7, 'ink-soft');
  S.ln(`M${P(60, -36).map(f).join(' ')}V${f(y - 140 * k)}M${f(x + 60 * k)} ${f(y - 120 * k)}L${f(x + 130 * k)} ${f(y - 44 * k)}`, 1.2, 'ink-soft');
  S.p('photo-paper', `M${P(-100, -4).map(f).join(' ')}q${f(110 * k)} ${f(10 * k)} ${f(220 * k)} 0`, { opacity: 0.6 });
}

/** Stèle de granit à fronton cintré. Rend sa géométrie. */
function stele(S, x, base, w, h) {
  const d = `M${f(x - w / 2)} ${f(base)}V${f(base - h + w * 0.25)}Q${f(x)} ${f(base - h - w * 0.12)} ${f(x + w / 2)} ${f(base - h + w * 0.25)}V${f(base)}Z`;
  S.fill(d, 'light');
  S.stip(d, { opacity: 0.6 });
  S.p('photo-mid', `M${f(x + w * 0.38)} ${f(base)}V${f(base - h + w * 0.2)}L${f(x + w / 2)} ${f(base - h + w * 0.25)}V${f(base)}Z`, { opacity: 0.6 });
  S.ln(d, 1, 'ink-soft');
  return d;
}

/* ───────────────────────── Scènes ───────────────────────── */

export const SCENES = {
  /* ── PH-01 : le stand du Comptoir à la Grande Exposition, juillet 1889 ── */
  'ph-01'(id) {
    const S = new Scene(id, 600, 500, 'photo');
    const win = card(S, { m: 22, mb: 52 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // fond : mur tendu de toile, fronton à la Fourche couronnée, draperies
      S.fill(rect(22, 22, 556, 380), 'mid', { opacity: 0.55 });
      const ped = poly([[150, 96], [300, 34], [450, 96]], true);
      S.fill(ped, 'light');
      S.ln(ped + 'M140 96H460M140 104H460', 1, 'ink-soft');
      headline(S, 196, 112, 208, 12, { words: 3, cls: 'ink-soft' });
      crownedFork(S, 300, 40, 0.62);
      for (const x of [22, 498]) {
        S.fill(rect(x, 22, 80, 380), 'dark', { opacity: 0.6 });
        let fl = '';
        for (let i = 1; i < 6; i++) fl += `M${x + i * 14} 22q4 190 0 380`;
        S.ln(fl, 0.6, 'ink-faint');
      }
      // vitrines d'ambres de part et d'autre
      vitrine(S, 110, 150, 120, 120, 9);
      vitrine(S, 370, 150, 120, 120, 9);
      S.fill(rect(100, 270, 140, 130) + rect(360, 270, 140, 130), 'dark', { opacity: 0.8 });
      S.fill(rect(22, 400, 556, 30), 'mid');
      S.ln('M22 400H578', 0.8, 'ink-soft');
      // M. Garnaud (gauche de l'image), Mme Garnaud, leur fils devant eux
      lg(S, 'blaise', 35, 150, 120, 0.48, { lower: { kind: 'stand', hatch: true, foot: 640 } });
      lg(S, 'amelie', 31, 310, 128, 0.46, { lower: { kind: 'skirt', tone: 'mid', hatch: true, foot: 620 } });
      lg(S, 'leandre9', 9, 246, 244, 0.31, { lower: { kind: 'stand', tone: 'light', child: 0.6, legTone: 'dark' } });
      wear(S, win, { edge: 16, spots: 8, corners: [[1, 0, 44]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    label(S, 300, 474, 'M. et Mme B. Garnaud et leur fils', { size: 14 });
    return S;
  },

  /* ── PH-02 : l'école de Longuegrève, juin 1897 ── */
  'ph-02'(id) {
    const S = new Scene(id, 680, 500, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // mur de pierres sèches de l'école, fenêtre, toit bas
      S.fill(rect(22, 22, 636, 300), 'light');
      let st = '';
      for (let y = 40, k = 0; y < 322; y += 16, k++) for (let x = 22 + (k % 2) * 14; x < 658; x += 30 + (x % 7)) st += rect(x + 1, y - 13, 26, 13);
      S.ln(st, 0.5, 'ink-faint');
      S.fill(rect(450, 60, 80, 96), 'dark');
      S.ln(rect(450, 60, 80, 96) + 'M490 60v96M450 108h80', 1.2, 'ink-soft');
      S.fill(rect(22, 22, 636, 26), 'dark');
      S.fill(rect(22, 322, 636, 156), 'mid', { opacity: 0.65 });
      S.stip(rect(22, 322, 636, 156), { opacity: 0.4 });
      const s = 0.36;
      // rang debout : figurants, Clément (14), Lazare (11) ; Gatien (15) un peu à part, à droite
      extra(S, child(1, 12), 70, 140, s * 0.92, { lower: { kind: 'stand', tone: 'mid', child: 0.3 } });
      lg(S, 'clement', 14, 136, 132, s * 0.96, { lower: { kind: 'stand', tone: 'mid', hatch: true, child: 0.2 } });
      extra(S, child(2, 13), 196, 140, s * 0.92, { lower: { kind: 'shortSkirt', tone: 'mid', child: 0.3 } });
      lg(S, 'lazare', 11, 386, 150, s * 0.88, { lower: { kind: 'stand', tone: 'mid', child: 0.4 } });
      extra(S, child(4, 12), 446, 146, s * 0.9, { lower: { kind: 'shortSkirt', tone: 'light', child: 0.3 } });
      lg(S, 'gatien', 15, 552, 128, s, { lower: { kind: 'stand', tone: 'mid', hatch: true, child: 0.15 } });
      // la maîtresse assise, la petite Victoire sur ses genoux
      const chair = rect(262, 250, 100, 12);
      S.fill(chair, 'dark');
      lg(S, 'sidonie', 33, 252, 132, 0.4, { lower: { kind: 'sitSkirt', tone: 'dark', dense: true } });
      lg(S, 'victoire', 4, 286, 222, 0.2, { lower: { kind: 'sit', tone: 'paper', child: 1 } });
      // les petits, assis par terre devant
      for (const [k, x] of [[5, 120], [6, 180], [7, 420], [8, 480]]) extra(S, child(k, 7), x, 300, 0.24, { lower: { kind: 'floor', tone: k % 2 ? 'mid' : 'light', child: 0.8 } });
      wear(S, win, { edge: 14, spots: 10, corners: [[0, 1, 46]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-03 : l'arrivée des évacués sur la jetée des Cabanes, 2 avril 1908 (négatif de L'Écho) ── */
  'ph-03'(id) {
    const S = new Scene(id, 760, 500, 'photo');
    S.p('paper-shade', rect(0, 0, 760, 500));
    // tirage moderne d'après la plaque : bord noir irrégulier
    const plate = poly([[24, 20], [736, 16], [740, 484], [20, 480]], true);
    S.black(plate);
    const win = { x: 38, y: 32, w: 688, h: 436, d: poly([[38, 34], [722, 30], [724, 466], [36, 468]], true) };
    S.within(win.d, () => {
      seaSky(S, 30, 26, 730, 300, 150, { sky: 'paper', sea: 'mid', island: [480, 700, 10] });
      // la vedette à quai, à gauche ; le patron à la barre
      const hull = smooth([[30, 230, 1], [270, 222], [300, 236], [282, 270], [40, 276, 1]], true);
      S.fill(hull, 'dark');
      S.ln(hull + 'M40 244L292 238', 0.8, 'ink-soft');
      const cab = rect(120, 168, 90, 60);
      S.fill(cab, 'mid');
      S.ln(cab + 'M120 186h90M150 168v18M180 168v18', 0.8, 'ink-soft');
      S.ln('M164 168V70M164 84l60 70', 1.4, 'ink-soft');
      S.within(rect(122, 120, 86, 66), () => lgBust(S, 'tenier', 48, 132, 108, 0.36, { clip: true }));
      S.fill(rect(120, 186, 90, 42), 'mid');
      // jetée en perspective
      planks(S, 30, 300, 730, 470, { tone: 'light' });
      let piles = '';
      for (const x of [60, 200, 340, 480, 620]) piles += rect(x, 284, 10, 20);
      S.fill(piles, 'dark');
      // ballots et paniers
      for (const [x, y, w, h] of [[560, 360, 46, 28], [610, 372, 40, 22], [96, 370, 50, 30]]) {
        const b = smooth([[x, y + h], [x + 4, y + 2], [x + w / 2, y - 4], [x + w - 4, y + 2], [x + w, y + h]], true);
        S.fill(b, 'mid');
        S.ln(b + `M${x + 8} ${y + h * 0.4}h${w - 16}`, 0.6, 'ink-soft');
      }
      // les évacués : l'institutrice et son cahier, le gardien du feu, les femmes, les jeunes gens
      const s = 0.4;
      lg(S, 'benoit', 47, 236, 96, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      lg(S, 'sidonie', 43, 306, 104, s * 0.97, { patch: { extras: BY_ID['lg-sidonie-43'].extras }, lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      lg(S, 'jacquette', 56, 376, 106, s * 0.96, { lower: { kind: 'skirt', tone: 'dark', dense: true } });
      lg(S, 'victoire', 15, 438, 118, s * 0.92, { lower: { kind: 'skirt', tone: 'mid', hatch: true } });
      lg(S, 'gatien', 26, 500, 92, s, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      lg(S, 'lazare', 22, 566, 96, s, { lower: { kind: 'stand', tone: 'mid' } });
      lg(S, 'clement', 25, 632, 92, s, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      wear(S, win, { edge: 10, spots: 14 });
      S.stip(win.d, { opacity: 0.3 });
    });
    // éraflures de la plaque
    S.ln('M120 60l40 18M600 420l-30 20M300 440l60 -4', 0.5, 'photo-paper');
    return S;
  },

  /* ── PH-04 : l'atelier des Cabanes, 1912 ── */
  'ph-04'(id) {
    const S = new Scene(id, 700, 480, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // longue halle : verrières hautes, charpente
      boards(S, 22, 22, 678, 300, { tone: 'mid' });
      for (const x of [60, 220, 380, 540]) {
        S.p('photo-paper', rect(x, 40, 110, 110));
        S.ln(rect(x, 40, 110, 110) + `M${x + 55} 40v110M${x} 95h110`, 1.6, 'ink-soft');
      }
      S.ln('M22 30L678 30M22 160H678', 2, 'ink-soft');
      // ouvriers au fond, penchés sur leurs tours derrière le long établi
      for (let i = 0; i < 4; i++) extra(S, islander(i * 2 + 1, { hat: false, clothes: { type: 'smock', wash: 'paper' } }), 300 + i * 70, 128, 0.22, { light: true, patch: { tilt: 6 }, lower: { kind: 'stand', tone: 'light' } });
      S.fill(rect(290, 196, 300, 40), 'dark');
      S.ln('M290 196H590', 0.8, 'ink-soft');
      S.fill(rect(22, 300, 656, 128), 'mid', { opacity: 0.7 });
      // le directeur debout, à gauche
      lg(S, 'leandre', 32, 34, 70, 0.5, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      // Gatien assis à l'établi de taille (l'établi devant lui), sa main au pouce coupé levée
      lg(S, 'gatien', 31, 196, 120, 0.46, { lower: { kind: 'sit', tone: 'mid', hatch: true } });
      const bench = rect(170, 236, 240, 26);
      S.fill(bench, 'dark');
      S.ln(bench + 'M180 262v160M400 262v160', 1.2, 'ink-soft');
      S.fill(rect(176, 262, 228, 160), 'mid', { opacity: 0.5 });
      amber(S, 300, 224, 380, 236, 5, 4);
      S.fill(rect(340, 210, 22, 26), 'mid');
      S.ln(rect(340, 210, 22, 26) + 'M351 210v-10M330 200h42', 1, 'ink-soft');
      // Victoire au tri, la table devant elle : plateaux d'ambres
      lg(S, 'victoire', 19, 470, 150, 0.4, { lower: { kind: 'sitSkirt', tone: 'mid', hatch: true } });
      const table = rect(456, 256, 214, 18);
      S.fill(table, 'dark');
      S.ln(table + 'M466 274v150M660 274v150', 1.2, 'ink-soft');
      for (const x of [468, 560, 612]) {
        S.fill(rect(x, 244, 46, 12), 'light');
        S.ln(rect(x, 244, 46, 12), 0.6, 'ink-soft');
        amber(S, x + 4, 246, x + 42, 254, 6, 2.4);
      }
      wear(S, win, { edge: 14, spots: 9, corners: [[1, 1, 40]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-05 : mariage de Lazare et de Victoire, 26 avril 1913 (Photographie Hamelot) ── */
  'ph-05'(id) {
    const S = new Scene(id, 760, 540, 'photo');
    const win = card(S, { m: 24, mb: 40 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      backdrop(S, 24, 24, 736, 400);
      S.fill(rect(24, 400, 712, 100), 'mid');
      S.stip(rect(24, 400, 712, 100), { opacity: 0.5 });
      const s = 0.44;
      // rang du fond, debout : Noël, Honorine, Clément, Gatien, Léontine et le petit Félix
      lg(S, 'noel', 52, 30, 60, s, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      lg(S, 'honorine', 48, 112, 70, s * 0.97, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      lg(S, 'clement', 30, 452, 58, s, { patch: { extras: [{ type: 'neckerchief', cls: 'paper', embroidery: 'wash-indigo' }] }, lower: { kind: 'stand', tone: 'dark', hatch: true } });
      lg(S, 'gatien', 31, 540, 56, s, { patch: { clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'wing', tie: 'cravat' }, extras: [], hands: [] }, lower: { kind: 'stand', tone: 'dark', dense: true } });
      lg(S, 'leontine', 24, 626, 70, s * 0.97, { lower: { kind: 'skirt', tone: 'light' } });
      baby(S, 668, 172, 1.3);
      limb(S, [[704, 160], [708, 182], [684, 194]], 10, 'paper', { skin: 1, size: 2 });
      // rang de devant : Jacquette assise (veuve, en noir), les mariés
      lg(S, 'jacquette', 61, 196, 150, s, { lower: { kind: 'sitSkirt', tone: 'dark', dense: true } });
      const veil = smooth([[322, 118], [372, 108], [404, 150], [416, 340], [308, 340], [306, 160]], true);
      S.p('photo-paper', veil, { opacity: 0.6 });
      lg(S, 'victoire', 20, 312, 142, s, { lower: { kind: 'sitSkirt', tone: 'paper' } });
      lg(S, 'lazare', 27, 382, 64, s * 1.02, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      // bouquet sur les genoux de la mariée
      foliage(S, 376, 334, 20, 13, { tone: 'light', lumps: 8, shade: false });
      wear(S, win, { edge: 14, spots: 8 });
    });
    S.ln(win.d, 1, 'ink-soft');
    headline(S, 290, 512, 180, 8, { words: 2, cls: 'ink-soft' });
    return S;
  },

  /* ── PH-06 : mariage de Gatien et de Léontine, 14 octobre 1911 ── */
  'ph-06'(id) {
    const S = new Scene(id, 700, 470, 'photo');
    S.p('paper-shade', rect(0, 0, 700, 470));
    const win = { x: 22, y: 22, w: 440, h: 420, d: rect(22, 22, 440, 420) };
    S.p('photo-paper', rect(14, 14, 456, 436));
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // chapelle de planches des Cabanes, porte ouverte
      boards(S, 22, 22, 462, 300, { tone: 'light', sp: 12 });
      S.fill(rect(300, 90, 90, 210), 'dark');
      S.ln(rect(300, 90, 90, 210), 1, 'ink-soft');
      S.fill(rect(22, 300, 440, 142), 'mid', { opacity: 0.6 });
      S.stip(rect(22, 300, 440, 142), { opacity: 0.4 });
      const s = 0.44;
      // Reine au bras de son fils (à gauche de l'image), Gatien, Léontine
      lg(S, 'reine', 58, 44, 90, s * 0.96, { lower: { kind: 'skirt', tone: 'dark', dense: true } });
      // fuseau à la ceinture
      S.fill(tube([[114, 236], [118, 290]], 3.2, 2), 'light');
      S.fill(ell(118, 278, 5, 2.4), 'mid');
      S.ln(tube([[114, 236], [118, 290]], 3.2, 2) + ell(118, 278, 5, 2.4), 0.5, 'ink-soft');
      lg(S, 'gatien', 30, 128, 76, s, { patch: { clothes: { type: 'coat', wash: 'wash-ardoise', dark: true, collar: 'wing', tie: 'cravat' }, extras: [], hands: [] }, lower: { kind: 'stand', tone: 'dark', dense: true } });
      lg(S, 'leontine', 22, 236, 86, s * 0.96, { lower: { kind: 'skirt', tone: 'paper', flare: 1.45 } });
      foliage(S, 300, 240, 16, 12, { tone: 'light', lumps: 8, shade: false });
      wear(S, win, { edge: 12, spots: 6, corners: [[0, 0, 30]] });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    verso(S, 486, 150, 196, 150, { rot: 4, date: '14.X.1911', lines: 3 });
    return S;
  },
  /* ── PH-07 : la nouvelle salle d'exposition du Comptoir, 1950 ── */
  'ph-07'(id) {
    const S = new Scene(id, 600, 500, 'photo');
    const win = card(S, { m: 22, mb: 30 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // boiseries, le portrait peint du fondateur… de son fils, à 68 ans, dans un lourd cadre doré
      S.fill(rect(22, 22, 556, 330), 'mid', { opacity: 0.6 });
      let pan = '';
      for (const x of [22, 160, 440]) pan += rect(x + 10, 210, 118, 130);
      S.ln(pan, 0.8, 'ink-faint');
      const fr = rect(150, 34, 208, 252);
      S.fill(fr, 'dark');
      S.p('rehaut', rect(154, 38, 200, 6) + rect(154, 38, 6, 244), { opacity: 0.5 });
      S.ln(fr + rect(162, 46, 184, 228), 1.2, 'ink-soft');
      S.within(rect(166, 50, 176, 220), () => {
        S.p('photo-mid', rect(166, 50, 176, 220));
        lgBust(S, 'leandre', 68, 168, 52, 1.12, { clip: false });
        S.p('photo-mid', rect(166, 50, 176, 220), { opacity: 0.25 });
        S.stip(rect(166, 50, 176, 220), { opacity: 0.5 });
      });
      S.fill(rect(224, 292, 60, 12), 'light');
      // vitrines d'ambres de part et d'autre
      vitrine(S, 32, 200, 110, 110, 10);
      vitrine(S, 446, 200, 114, 110, 10);
      S.fill(rect(32, 310, 110, 80) + rect(446, 310, 114, 80), 'dark', { opacity: 0.8 });
      // parquet
      S.fill(rect(22, 352, 556, 96), 'light');
      let pq = '';
      for (let x = 0; x < 640; x += 26) pq += `M${x} 352L${x - 60} 448`;
      S.ln(pq, 0.5, 'ink-faint');
      // la présidente, debout sous le portrait
      lg(S, 'edmee', 29, 340, 104, 0.52, { lower: { kind: 'skirt', tone: 'dark', hatch: true, foot: 640 } });
      wear(S, win, { edge: 12, spots: 6 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-08 : le manteau de la cheminée du salon, hôtel Garnaud, 11 octobre 1977 (Office) ── */
  'ph-08'(id) {
    const S = new Scene(id, 600, 480, 'photo');
    S.p('paper', rect(0, 0, 600, 480));
    const win = { x: 20, y: 20, w: 560, h: 400, d: rect(20, 20, 560, 400) };
    S.within(win.d, () => {
      S.p('photo-mid', win.d);
      // papier peint sombre, foyer noir, jambages et linteau de pierre claire
      let wp = '';
      for (let x = 30; x < 580; x += 34) for (let y = 30; y < 420; y += 40) wp += ell(x + ((y / 40) % 2) * 17, y, 5, 8);
      S.ln(wp, 0.5, 'ink-faint');
      S.black(rect(170, 250, 260, 170));
      S.fill(rect(120, 230, 50, 190) + rect(430, 230, 50, 190), 'light');
      S.ln(rect(120, 230, 50, 190) + rect(430, 230, 50, 190), 0.9, 'ink-soft');
      const lin = rect(110, 150, 380, 100);
      S.fill(lin, 'light');
      S.p('photo-paper', rect(116, 156, 368, 40), { opacity: 0.5 });
      S.ln(lin + 'M110 160H490M110 240H490', 0.9, 'ink-soft');
      // tablette, vase
      const shelf = rect(90, 132, 420, 18);
      S.fill(shelf, 'light');
      S.ln(shelf, 1, 'ink-soft');
      const vase = smooth([[282, 132, 1], [272, 110], [276, 80], [288, 64], [286, 52, 1], [314, 52, 1], [312, 64], [324, 80], [328, 110], [318, 132, 1]], true);
      S.fill(vase, 'dark');
      S.p('rehaut', ell(286, 96, 4, 14), { opacity: 0.7 });
      S.ln(vase, 0.8, 'ink-soft');
      // la marque taillée dans la pierre, sous le vase, et le millésime
      flat(S, 282, 162, 46, 82, 'photo-paper', 0.35);
      carve(S, 'Y-d', 300, 168, 0.62, 'taillee');
      engraved(S, 380, 214, '1898', { size: 22 });
      // réglet de l'Office posé sur la tablette
      const rul = rect(160, 136, 90, 10);
      S.p('photo-paper', rul);
      let ticks = '';
      for (let i = 0; i <= 18; i++) ticks += `M${160 + i * 5} 136v${i % 2 ? 3 : 5}`;
      S.ln(rul + ticks, 0.6, 'ink-soft');
      // éclair du flash : reflet sur la pierre, ombre portée du vase
      S.p('ombre', smooth([[322, 132], [340, 108], [346, 70], [338, 56], [352, 70], [356, 112], [338, 134]], true), { opacity: 0.5 });
      S.stip(win.d, { opacity: 0.15 });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    label(S, 26, 450, 'ORC 77-0874 — 11.10.77', { anchor: 'start', size: 13, italic: false });
    return S;
  },

  /* ── PH-09 : le cimetière de Longuegrève, 29 août 1964 (tirage offert par S. Marest) ── */
  'ph-09'(id) {
    const S = new Scene(id, 760, 500, 'photo');
    S.p('paper-shade', rect(0, 0, 760, 500));
    const win = { x: 22, y: 22, w: 520, h: 440, d: rect(22, 22, 520, 440) };
    S.p('photo-paper', rect(12, 12, 540, 460));
    S.within(win.d, () => {
      seaSky(S, 22, 22, 542, 200, 150, { sky: 'paper', sea: 'mid' });
      // herbe rase, muret de pierres sèches
      S.fill(rect(22, 170, 520, 292), 'mid');
      S.stip(rect(22, 170, 520, 292), { opacity: 0.5 });
      let wall = '';
      for (let x = 22; x < 542; x += 16) wall += ell(x + 8, 176 + (x % 3), 9, 6);
      S.fill(wall, 'light');
      S.ln(wall, 0.5, 'ink-faint');
      // les autres croix, au fond : marques illisibles au tirage
      const back = [[60, 236, 70], [118, 230, 62], [176, 240, 74], [236, 232, 60], [300, 238, 66], [362, 230, 58], [420, 236, 70], [480, 228, 60], [520, 240, 56]];
      for (const [x, b, h] of back) islandCross(S, x, b, h, { w: 6, code: 'P', ms: 0.12, legible: false, tilt: S.r.jit(5), tone: 'light' });
      // au premier plan, la croix de Clovis : l'Œil, lisible
      islandCross(S, 150, 450, 260, { w: 24, code: 'O', ms: 0.62, tilt: -3 });
      // Félix tient son chapeau contre le vent ; Victoire penchée sur la croix
      lg(S, 'felix', 52, 380, 70, 0.5, { patch: { hat: null }, lower: { kind: 'stand', tone: 'dark', hatch: true } });
      const hat = smooth([[398, 168], [444, 162], [458, 180], [450, 202], [404, 206], [392, 188]], true);
      S.fill(hat, 'dark');
      S.ln(hat + 'M394 190Q424 196 456 188', 0.8, 'ink-soft');
      hand(S, 436, 176, -100, 2.6, { skin: 3, fist: true, mirror: true });
      lg(S, 'victoire', 71, 214, 132, 0.46, { rot: 12, patch: { tilt: 10 }, lower: { kind: 'skirt', tone: 'dark', dense: true } });
      // herbes couchées par le vent
      let gr = '';
      for (let i = 0; i < 40; i++) {
        const x = 30 + S.r() * 500;
        const y = 380 + S.r() * 80;
        gr += `M${f(x)} ${f(y)}q4 -6 12 -8`;
      }
      S.ln(gr, 0.6, 'ink-soft');
      wear(S, win, { edge: 12, spots: 8 });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    verso(S, 560, 170, 184, 150, { rot: 5, date: '29 août 64', lines: 3 });
    return S;
  },

  /* ── PH-10 : au hangar à bateaux des Cabanes, 5 septembre 1964 (Fonds Marest) ── */
  'ph-10'(id) {
    const S = new Scene(id, 900, 620, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // hangar : bardage, grande porte ouverte sur la passe
      boards(S, 22, 22, 878, 420, { tone: 'mid', sp: 16 });
      S.p('photo-paper', rect(560, 60, 300, 250));
      seaSky(S, 560, 60, 860, 310, 200, { sky: 'paper', sea: 'light' });
      S.ln(rect(560, 60, 300, 250), 2, 'ink-soft');
      S.fill(rect(22, 420, 856, 148), 'mid', { opacity: 0.7 });
      S.stip(rect(22, 420, 856, 148), { opacity: 0.4 });
      // Marin tient les avirons de son grand-père Noël et de son père Lazare ; Rose, ceux de son
      // père Elzéar et de Gatien. Pales en haut, marques taillées sur le manche, à hauteur de taille.
      lg(S, 'marin', 44, 84, 92, 0.6, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      lg(S, 'rose', 54, 326, 104, 0.58, { patch: { extras: [] }, lower: { kind: 'skirt', tone: 'mid', apron: true, apronTone: 'light' } });
      const oars = [
        { top: [52, 40], bot: [62, 556], code: 'A-b', h: [80, 236, 90] },
        { top: [232, 36], bot: [226, 556], code: 'A-b-g', h: [208, 236, -90] },
        { top: [304, 44], bot: [310, 560], code: 'O-g-g', h: [330, 250, 90] },
        { top: [480, 40], bot: [470, 560], code: 'Y-g-g', h: [454, 250, -90] },
      ];
      for (const o of oars) oar(S, o.top, o.bot, { w: 18, code: o.code, at: 0.56, ms: 0.5 });
      // mains sur les manches, au-dessus des marques
      for (const o of oars) hand(S, o.h[0], o.h[1], o.h[2], 2.6, { skin: 2, fist: true, mirror: o.h[2] < 0 });
      // l'établi, à droite : fuseau de Reine, tampon à pain d'Ernestine, navette d'Ursule, debout
      const bench = rect(540, 400, 330, 26);
      S.fill(bench, 'dark');
      S.ln(bench + 'M552 426v140M856 426v140', 1.4, 'ink-soft');
      S.fill(rect(546, 426, 318, 140), 'dark', { opacity: 0.5 });
      // fuseau (bois tourné, la marque sur le corps renflé)
      const fus = smooth([[606, 400, 1], [598, 330], [592, 270], [598, 230], [606, 210, 1], [614, 230], [620, 270], [614, 330]], true);
      S.fill(fus, 'light');
      S.ln(fus + 'M606 210V190', 1, 'ink-soft');
      S.fill(ell(606, 392, 18, 6), 'mid');
      S.ln(ell(606, 392, 18, 6), 0.6, 'ink-soft');
      flat(S, 596, 252, 22, 74, 'photo-paper', 0.6);
      carve(S, 'Y-g-tP', 606, 254, 0.42, 'taillee');
      // tampon à pain : disque de bois appuyé au mur, face gravée vers nous, poignée en dessous
      S.fill(rect(684, 360, 16, 40), 'mid');
      S.ln(rect(684, 360, 16, 40), 0.6, 'ink-soft');
      S.fill(circ(692, 300, 62), 'light');
      S.ln(circ(692, 300, 62) + circ(692, 300, 56), 0.9, 'ink-soft');
      carve(S, 'P-g-tO', 688, 250, 0.68, 'taillee');
      // navette à ramender en buis, debout, pointe en haut
      const nav = smooth([[800, 400, 1], [784, 380], [780, 300], [790, 230], [800, 200, 1], [810, 230], [820, 300], [816, 380]], true);
      S.fill(nav, 'light');
      S.ln(nav + 'M792 392h16M800 380v-22', 1, 'ink-soft');
      S.p('photo-mid', ell(800, 236, 4, 12));
      carve(S, 'A-tP', 800, 262, 0.62, 'taillee');
      wear(S, win, { edge: 14, spots: 10, corners: [[0, 1, 40]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-11 : Aline Lestaud baguant des sternes sur la Longue Grève, 1961 ── */
  'ph-11'(id) {
    const S = new Scene(id, 560, 470, 'photo');
    const win = card(S, { m: 20, mb: 26, stamp: false, tone: 'paper' });
    S.within(win.d, () => {
      seaSky(S, 20, 20, 540, 444, 140, { sky: 'paper', sea: 'light' });
      // dune et oyats
      const dune = smooth([[20, 230], [160, 180], [320, 200], [540, 170], [540, 444, 1], [20, 444, 1]], true);
      S.fill(dune, 'light');
      S.stip(dune, { opacity: 0.5 });
      let oy = '';
      for (let i = 0; i < 60; i++) {
        const x = 20 + S.r() * 520;
        const y = 196 + S.r() * 40;
        oy += `M${f(x)} ${f(y)}q${f(S.r.jit(6))} -10 ${f(S.r.jit(10))} -18`;
      }
      S.ln(oy, 0.6, 'ink-soft');
      // sternes en vol
      let tern = '';
      for (const [x, y, k] of [[90, 60, 1], [150, 90, 0.8], [420, 50, 1.1], [470, 96, 0.7], [380, 110, 0.6]]) tern += `M${f(x - 14 * k)} ${f(y - 4 * k)}q${f(8 * k)} ${f(6 * k)} ${f(14 * k)} ${f(4 * k)}q${f(6 * k)} ${f(-2 * k)} ${f(14 * k)} ${f(-8 * k)}`;
      S.ln(tern, 1.2, 'ink-soft');
      // Aline, en buste, une sterne tenue contre elle à deux mains
      lgBust(S, 'aline', 36, 110, 130, 1.44, { clip: false, patch: { extras: [] } });
      const bx = 300;
      const by = 380;
      const body = smooth([[bx - 40, by - 6], [bx - 10, by - 20], [bx + 40, by - 16], [bx + 70, by - 8], [bx + 40, by + 8], [bx - 16, by + 12]], true);
      S.fill(body, 'paper');
      S.ln(body, 0.8, 'ink-soft');
      const wing = smooth([[bx - 18, by - 14], [bx + 30, by - 18], [bx + 104, by - 26], [bx + 50, by - 4], [bx - 4, by - 2]], true);
      S.fill(wing, 'light');
      S.ln(wing + `M${bx} ${by - 10}L${bx + 80} ${by - 20}`, 0.7, 'ink-soft');
      // queue fourchue
      S.ln(poly([[bx + 66, by - 8], [bx + 118, by - 4], [bx + 80, by], [bx + 116, by + 8], [bx + 64, by + 2]], true), 0.8, 'ink-soft');
      // tête : calotte noire, bec effilé
      const head = ell(bx - 48, by - 10, 13, 11);
      S.fill(head, 'paper');
      S.ln(head, 0.8, 'ink-soft');
      S.black(smooth([[bx - 62, by - 12], [bx - 52, by - 22], [bx - 36, by - 18], [bx - 38, by - 10], [bx - 56, by - 8]], true));
      S.fill(poly([[bx - 60, by - 9], [bx - 92, by - 4], [bx - 60, by - 3]], true), 'mid');
      S.ln(poly([[bx - 60, by - 9], [bx - 92, by - 4], [bx - 60, by - 3]], true), 0.6, 'ink-soft');
      S.p('photo-paper', circ(bx - 50, by - 13, 1.4));
      // patte baguée (la bague d'aluminium)
      S.ln(`M${bx + 6} ${by + 10}l2 20`, 1.4, 'ink-soft');
      S.p('rehaut', rect(bx + 4, by + 18, 7, 5));
      S.ln(rect(bx + 4, by + 18, 7, 5), 0.5, 'ink-soft');
      hand(S, bx - 8, by + 30, 170, 3.4, { skin: 1 });
      hand(S, bx + 40, by + 26, 190, 3.4, { skin: 1, mirror: true });
      wear(S, win, { edge: 10, spots: 6 });
    });
    S.ln(win.d, 0.6, 'ink-soft');
    return S;
  },

  /* ── PH-12 : Sidonie au jardin de sa sœur, Bains-de-Mérande, 1930 ── */
  'ph-12'(id) {
    const S = new Scene(id, 560, 470, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      foliage(S, 110, 80, 140, 90, { tone: 'mid', lumps: 18 });
      foliage(S, 450, 70, 130, 80, { tone: 'dark', lumps: 16 });
      // treillage et rosiers, allée de gravier
      let tr = '';
      for (let x = 22; x < 540; x += 26) tr += `M${x} 130L${x + 60} 260M${x + 60} 130L${x} 260`;
      S.ln(tr, 0.8, 'ink-faint');
      for (const x of [60, 200, 480]) foliage(S, x, 240, 40, 26, { tone: 'mid', lumps: 10, shade: false });
      S.fill(rect(22, 280, 516, 140), 'light');
      S.stip(rect(22, 280, 516, 140), { opacity: 0.6 });
      // fauteuil d'osier, Sidonie assise ; Berthe-Marie debout derrière
      lg(S, 'berthe', 33, 296, 64, 0.48, { lower: { kind: 'skirt', tone: 'mid' } });
      const chair = smooth([[148, 250], [160, 190], [208, 176], [260, 190], [272, 250], [272, 400], [148, 400]], true);
      S.fill(chair, 'mid');
      let wk = '';
      for (let y = 186; y < 400; y += 7) wk += `M148 ${y}H272`;
      S.ln(wk, 0.4, 'ink-faint');
      S.ln(chair, 1, 'ink-soft');
      lg(S, 'sidonie', 66, 140, 140, 0.46, { lower: { kind: 'sitSkirt', tone: 'dark', dense: true } });
      wear(S, win, { edge: 14, spots: 8, corners: [[1, 1, 36]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },
  /* ── PH-13 : Edmée Garnaud à son bureau (L'Écho, 15 octobre 1977) ── */
  'ph-13'(id) {
    const S = new Scene(id, 540, 620, 'photo');
    const ph = { x: 40, y: 64, w: 460, h: 330, d: rect(40, 64, 460, 330) };
    clipping(S, ph, () => {
      // vitrine d'ambres derrière elle, bureau au premier plan
      S.fill(rect(40, 64, 460, 330), 'mid', { opacity: 0.5 });
      vitrine(S, 300, 80, 190, 170, 16);
      S.fill(rect(300, 250, 190, 60), 'dark');
      lgBust(S, 'edmee', 56, 110, 110, 1.36, { clip: false });
      const desk = rect(40, 330, 460, 64);
      S.fill(desk, 'dark');
      S.ln(desk, 0.8, 'ink-soft');
      S.p('photo-paper', rect(90, 318, 120, 16), { opacity: 0.9 });
      S.ln(rect(90, 318, 120, 16), 0.5, 'ink-soft');
    }, { cols: 3, lines: 14 });
    return S;
  },

  /* ── PH-14 : Marin Cormaud et Félix Goémard sur la jetée (L'Écho, 15 octobre 1977) ── */
  'ph-14'(id) {
    const S = new Scene(id, 600, 600, 'photo');
    const ph = { x: 40, y: 64, w: 520, h: 330, d: rect(40, 64, 520, 330) };
    clipping(S, ph, () => {
      seaSky(S, 40, 64, 560, 394, 200, { sky: 'paper', sea: 'mid', island: [380, 540, 6] });
      fishingBoat(S, 420, 250, 0.8);
      planks(S, 40, 300, 560, 394, { tone: 'light' });
      lg(S, 'marin', 57, 110, 96, 0.52, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      lg(S, 'felix', 65, 230, 90, 0.54, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
    }, { cols: 3, lines: 12 });
    return S;
  },

  /* ── PH-15 : la tombe de Blaise Garnaud, cimetière de Port-Sénane (Office, octobre 1977) ── */
  'ph-15'(id) {
    const S = new Scene(id, 520, 620, 'photo');
    S.p('paper', rect(0, 0, 520, 620));
    const win = { x: 20, y: 20, w: 480, h: 540, d: rect(20, 20, 480, 540) };
    S.within(win.d, () => {
      S.p('photo-mid', win.d);
      // allée, autres tombes floues, if
      foliage(S, 90, 90, 90, 110, { tone: 'dark', lumps: 14 });
      foliage(S, 450, 120, 80, 90, { tone: 'dark', lumps: 12 });
      for (const [x, h] of [[70, 120], [450, 100]]) {
        const d = `M${x - 26} 380V${380 - h}h52V380Z`;
        S.fill(d, 'mid', { opacity: 0.7 });
        S.ln(d, 0.6, 'ink-faint');
      }
      S.fill(rect(20, 380, 480, 180), 'light');
      S.stip(rect(20, 380, 480, 180), { opacity: 0.6 });
      // la stèle : nom, dates, marque, devise
      stele(S, 260, 470, 250, 380);
      S.fill(rect(120, 470, 280, 40), 'light');
      S.ln(rect(120, 470, 280, 40), 0.8, 'ink-soft');
      engraved(S, 260, 200, 'Blaise Garnaud', { size: 19, spacing: 1.5 });
      engraved(S, 260, 236, '1854 – 1924', { size: 18 });
      flat(S, 238, 258, 44, 82, 'photo-paper', 0.35);
      carve(S, 'Y-d', 260, 264, 0.56, 'taillee');
      engraved(S, 260, 376, 'Ce que l’ambre garde,', { size: 14, cls: 'label-note' });
      engraved(S, 260, 398, 'il le garde entier', { size: 14, cls: 'label-note' });
      // lichen
      S.p('photo-mid', ell(186, 120, 16, 8) + ell(330, 430, 22, 9), { opacity: 0.5 });
      S.stip(win.d, { opacity: 0.15 });
    });
    S.ln(win.d, 0.8, 'ink-soft');
    label(S, 24, 590, 'ORC 77-0874 — cimetière de Port-Sénane', { anchor: 'start', size: 13, italic: false });
    return S;
  },

  /* ── PH-16 : Rose Pellerin née Oyard à son étal de la halle, vers 1935 ── */
  'ph-16'(id) {
    const S = new Scene(id, 600, 470, 'photo');
    const win = card(S, { m: 22, mb: 30, stamp: false });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // la halle : arcs de fonte, verrière
      S.fill(rect(22, 22, 556, 300), 'mid', { opacity: 0.55 });
      let arcs = '';
      for (const x of [22, 200, 378]) arcs += `M${x} 300V120A89 89 0 0 1 ${x + 178} 120V300`;
      S.ln(arcs, 4, 'ink-soft');
      S.p('photo-paper', rect(22, 22, 556, 60), { opacity: 0.7 });
      crowd(S, 380, 570, 210, 6, 14, { rows: 1 });
      // Rose derrière son étal
      lgBust(S, 'rose', 25, 210, 92, 1.16, { clip: false });
      const stall = rect(40, 290, 520, 140);
      S.fill(stall, 'dark');
      S.ln(stall + 'M40 306H560', 0.8, 'ink-soft');
      // poissons sur la glace pilée
      S.p('photo-paper', rect(50, 276, 500, 20));
      let fish = '';
      for (let i = 0; i < 9; i++) {
        const x = 70 + i * 52;
        const y = 280 + (i % 2) * 6;
        fish += smooth([[x, y], [x + 18, y - 7], [x + 36, y], [x + 18, y + 6]], true) + poly([[x + 34, y], [x + 46, y - 7], [x + 46, y + 7]], true);
      }
      S.fill(fish, 'light');
      S.ln(fish, 0.6, 'ink-soft');
      // balance et ardoise des prix
      S.ln('M500 200V270M470 210H530M470 210l-8 30h16ZM530 210l-8 30h16Z', 1, 'ink-soft');
      S.fill(rect(60, 210, 70, 50), 'dark');
      S.ln(handLines(S.r, 68, 226, 54, 3, 11, { h: 2, step: 3 }), 0.6, 'photo-paper');
      wear(S, win, { edge: 12, spots: 8 });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-17 : Amélie Garnaud à la porte de la librairie Ferlay, vers 1900 ── */
  'ph-17'(id) {
    const S = new Scene(id, 520, 620, 'photo');
    const win = card(S, { m: 22, mb: 34 });
    S.within(win.d, () => {
      S.p('photo-light', win.d);
      // devanture : enseigne, vitrines de livres, porte vitrée ouverte
      S.fill(rect(22, 22, 476, 70), 'dark');
      S.p('photo-paper', rect(60, 40, 400, 36));
      S.ln(rect(60, 40, 400, 36), 1, 'ink-soft');
      label(S, 260, 66, 'Librairie Ferlay', { cls: 'label', size: 18, italic: false });
      S.fill(rect(22, 92, 476, 400), 'mid');
      for (const x of [36, 348]) {
        S.fill(rect(x, 120, 136, 250), 'light');
        let bk = '';
        for (let y = 140; y < 370; y += 40) {
          bk += `M${x} ${y + 30}H${x + 136}`;
          for (let bx = x + 6; bx < x + 130; bx += 9 + ((bx * 7) % 5)) bk += rect(bx, y + 4 + ((bx * 3) % 7), 7, 26 - ((bx * 3) % 7));
        }
        S.ln(bk, 0.6, 'ink-soft');
        S.ln(rect(x, 120, 136, 250), 1.4, 'ink-soft');
        S.p('rehaut', poly([[x + 10, 120], [x + 30, 120], [x + 6, 370], [x, 340]], true), { opacity: 0.3 });
      }
      S.fill(rect(186, 112, 150, 380), 'dark');
      S.ln(rect(186, 112, 150, 380), 1.2, 'ink-soft');
      // pavés du quai
      S.fill(rect(22, 492, 476, 72), 'light');
      let pv = '';
      for (let y = 500; y < 564; y += 10) for (let x = 22 + ((y / 10) % 2) * 8; x < 498; x += 16) pv += rect(x, y, 14, 8);
      S.ln(pv, 0.4, 'ink-faint');
      // Mme Garnaud sur le seuil, le livre contre elle
      lg(S, 'amelie', 42, 194, 158, 0.52, { lower: { kind: 'skirt', tone: 'dark', hatch: true, foot: 640 } });
      wear(S, win, { edge: 14, spots: 8, corners: [[0, 0, 36]] });
    });
    S.ln(win.d, 1, 'ink-soft');
    return S;
  },

  /* ── PH-18 : visite des ruines, Longuegrève, 1976 (Domaines) ── */
  'ph-18'(id) {
    const S = new Scene(id, 640, 480, 'photo');
    S.p('paper', rect(0, 0, 640, 480));
    // tirage moderne à bords blancs, angles arrondis
    const win = { x: 20, y: 20, w: 600, h: 420, d: rect(20, 20, 600, 420) };
    S.within(win.d, () => {
      seaSky(S, 20, 20, 620, 440, 150, { sky: 'paper', sea: 'light' });
      // pignon ruiné de pierres sèches, porte au linteau marqué
      const wall = poly([[60, 440], [60, 170], [130, 110], [200, 80], [270, 120], [300, 160], [330, 210], [340, 440]], true);
      S.fill(wall, 'mid');
      let st = '';
      for (let y = 120, k = 0; y < 440; y += 14, k++) for (let x = 60 + (k % 2) * 12; x < 340; x += 26 + (x % 5)) st += rect(x + 1, y - 11, 22, 11);
      S.within(wall, () => S.ln(st, 0.5, 'ink-faint'));
      S.ln(wall, 0.9, 'ink-soft');
      S.black(rect(150, 280, 90, 160));
      const lin = rect(136, 246, 118, 34);
      S.fill(lin, 'light');
      S.ln(lin, 0.9, 'ink-soft');
      carve(S, 'Y', 195, 250, 0.26, 'taillee');
      // herbe, oyats
      S.fill(rect(20, 400, 600, 40), 'mid');
      // Aline et l'inspecteur, debout devant la porte
      lg(S, 'aline', 51, 330, 120, 0.46, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      lg(S, 'fontanet', 52, 440, 112, 0.47, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      S.stip(win.d, { opacity: 0.2 });
    });
    S.ln(win.d, 0.6, 'ink-faint');
    return S;
  },

  /* ── CP-01 : « Nos côtes — Longuegrève : la grève aux ambres », vers 1905 ── */
  'cp-01'(id) {
    const S = new Scene(id, 760, 470, 'photo');
    S.p('paper-shade', rect(0, 0, 760, 470));
    const pc = rect(12, 12, 580, 400);
    S.p('photo-paper', pc);
    const pd = rect(24, 24, 556, 340);
    S.within(pd, () => {
      seaSky(S, 24, 24, 580, 364, 120, { sky: 'paper', sea: 'mid' });
      // la grève après un coup d'ouest : laisse de goémon, ambres
      const beach = smooth([[24, 200], [200, 186], [400, 196], [580, 182], [580, 364, 1], [24, 364, 1]], true);
      S.fill(beach, 'light');
      S.stip(beach, { opacity: 0.4 });
      let laisse = '';
      for (let x = 24; x < 580; x += 10) laisse += `M${x} ${206 + Math.sin(x / 20) * 4}q5 -4 10 0`;
      S.ln(laisse, 1.6, 'ink-soft');
      amber(S, 40, 220, 560, 350, 26, 2.6);
      // ramasseurs au loin, courbés
      for (let i = 0; i < 6; i++) extra(S, islander(i + 2, { hat: false }), 300 + i * 44, 136, 0.15, { light: true, patch: { tilt: 18 }, lower: { kind: 'stand', tone: 'mid' } });
      // derrière, le vieux Noël ; au premier plan, Gatien et son panier
      lg(S, 'noel', 45, 170, 100, 0.3, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      lg(S, 'gatien', 24, 40, 60, 0.46, { lower: { kind: 'stand', tone: 'mid', hatch: true } });
      const basket = smooth([[120, 300, 1], [176, 300, 1], [170, 344], [126, 344]], true);
      S.fill(basket, 'mid');
      let wv = '';
      for (let y = 306; y < 344; y += 6) wv += `M122 ${y}H174`;
      S.ln(basket + wv + 'M126 300Q148 270 170 300', 0.8, 'ink-soft');
      amber(S, 128, 294, 168, 302, 5, 3);
    });
    S.ln(pd, 0.6, 'ink-faint');
    label(S, 36, 388, 'Nos côtes — Longuegrève : la grève aux ambres', { anchor: 'start', size: 14 });
    label(S, 580, 404, 'Phototypie de l’Orvelle', { anchor: 'end', size: 10 });
    verso(S, 530, 250, 220, 150, { rot: 5, postcard: true, lines: 6 });
    return S;
  },

  /* ── CP-02 : « Port-Sénane — Les Cabanes d'Ambre », vers 1925 ── */
  'cp-02'(id) {
    const S = new Scene(id, 760, 470, 'photo');
    S.p('paper-shade', rect(0, 0, 760, 470));
    const pc = rect(12, 12, 580, 400);
    S.p('photo-paper', pc);
    const pd = rect(24, 24, 556, 340);
    S.within(pd, () => {
      seaSky(S, 24, 24, 580, 364, 160, { sky: 'paper', sea: 'mid', island: [40, 200, 7] });
      // la côte : hangars et cabanes de bois, la longue halle de l'atelier
      const ground = smooth([[260, 364, 1], [280, 220], [400, 196], [580, 190], [580, 364, 1]], true);
      S.fill(ground, 'light');
      S.stip(ground, { opacity: 0.4 });
      const hall = poly([[330, 230], [330, 196], [400, 172], [560, 172], [560, 230]], true);
      S.fill(hall, 'mid');
      let win = '';
      for (let x = 410; x < 550; x += 22) win += rect(x, 190, 12, 16);
      S.fill(win, 'dark');
      S.ln(hall + 'M330 196H560', 0.8, 'ink-soft');
      for (const [x, y, w, h] of [[290, 250, 40, 30], [340, 262, 46, 34], [400, 256, 38, 28], [450, 268, 50, 36], [520, 252, 44, 30]]) {
        const cab = poly([[x, y + h], [x, y], [x + w / 2, y - h * 0.4], [x + w, y], [x + w, y + h]], true);
        S.fill(cab, 'light');
        S.ln(cab, 0.7, 'ink-soft');
        S.fill(rect(x + w * 0.4, y + h * 0.4, w * 0.2, h * 0.6), 'dark');
      }
      // la chapelle de planches, son petit clocheton
      S.fill(poly([[480, 230], [480, 200], [500, 184], [520, 200], [520, 230]], true), 'light');
      S.ln('M500 184v-14M495 176h10', 0.8, 'ink-soft');
      // la jetée sur pilotis et deux barques
      S.fill(rect(120, 268, 180, 8), 'light');
      let pil = '';
      for (let x = 126; x < 300; x += 18) pil += `M${x} 276v18`;
      S.ln(pil + 'M120 268H300', 1, 'ink-soft');
      fishingBoat(S, 160, 300, 0.32);
      fishingBoat(S, 230, 316, 0.26);
      crowd(S, 300, 520, 300, 7, 6, { rows: 1 });
    });
    S.ln(pd, 0.6, 'ink-faint');
    label(S, 36, 388, 'Port-Sénane — Les Cabanes d’Ambre', { anchor: 'start', size: 14 });
    verso(S, 530, 250, 220, 150, { rot: -4, postcard: true, lines: 5 });
    return S;
  },
};
