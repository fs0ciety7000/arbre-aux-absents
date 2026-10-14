/**
 * « Sous la lampe » : nature morte de bureau, la nuit (couverture, direction B).
 * Brouillon d'arbre aux médaillons vides, étiquette vierge, feuille de tilleul, dossiers,
 * lettre, photographie retournée, crayon ; lampe de laiton et sa flaque de lumière.
 */
import { Svg, smooth, rect, ell, f, lerp, mul, T, S as Sc, R, apply } from './lib.mjs';
import { treeSheet, folders, letter, photo, pencil, lamp, indexCards, paperclip } from './objects.mjs';
import { tagAt } from './tilleul.mjs';

const LEAF = [[0, -0.1, 1], [-0.3, 0.02], [-0.58, -0.22], [-0.62, -0.55], [-0.42, -0.86], [-0.12, -1.02], [0.04, -1.2, 1], [0.18, -1.0], [0.48, -0.84], [0.64, -0.52], [0.58, -0.2], [0.32, 0.02]];

export function buildNocturne(id = 'roman-nocturne') {
  const w = 800, h = 1000;
  const S = new Svg(id, w, h, {
    title: 'Sous la lampe',
    desc: "Un bureau la nuit sous une lampe de laiton : brouillon d'arbre généalogique aux médaillons vides, étiquette de papier vierge, feuille de tilleul, dossiers et lettres.",
  });
  const r = S.r;
  const flat = 0.14;
  // plateau
  const top = rect(-10, -10, w + 20, h + 20);
  S.wash(top, 'hair-chatain', 'wash-sienne');
  S.p('hair-roux', top, { 'fill-opacity': 0.3 });
  let grain = '';
  for (let y = -6; y < h + 10; ) {
    const pts = [];
    const ph = r.range(0, 6);
    for (let x = -20; x <= w + 20; x += 80) pts.push([x, y + Math.sin(ph + x / 150) * 3 + r.jit(1)]);
    grain += smooth(pts);
    y += r.range(5, 14);
  }
  S.ln(grain, 0.5, 'ink-soft', { 'stroke-opacity': 0.45 });
  S.p('hatch', top, { 'fill-opacity': 0.3 });

  const at = (x, y, rot, fn) => S.at(x, y, { rot, flat }, fn);
  at(470, 330, 9, () => letter(S, { w: 170, h: 220 }));
  at(-60, 690, -8, () => folders(S, { w: 360, h: 250, ref: 'n° 74-0318' }));
  at(560, 610, 7, () => indexCards(S, { w: 130, h: 82 }));
  // brouillon d'arbre (centre, sous la lumière)
  at(140, 400, -4, () => {
    treeSheet(S, { w: 440, h: 320, rows: [2, 4, 6] });
  });
  at(590, 760, 10, () => {
    photo(S, { w: 120, h: 88, scene: 'back' });
    paperclip(S, 12, -8, { a: 6 });
  });
  at(250, 760, -18, () => pencil(S, { len: 170, angle: 0 }));
  // étiquette vierge et feuille de tilleul posées sur le brouillon
  S.open({ transform: `translate(470 640) scale(1 ${1 - flat}) rotate(-62)` });
  tagAt(S, 0, 0, 0, 1.5, { shadow: true });
  S.ln('M0 0q-20 -8 -34 4t-30 -2', 0.8, 'ink-soft');
  S.close();
  {
    const s = 62, a = 2.3, x = 330, y = 700;
    const P = LEAF.map(([px, py, c]) => {
      const q = [px * s * Math.cos(a) - py * s * Math.sin(a), px * s * Math.sin(a) + py * s * Math.cos(a)];
      return [x + q[0], y + q[1] * (1 - flat), c];
    });
    const d = smooth(P, true, 0.9);
    S.p('ombre', d, { transform: 'translate(4 6)' });
    S.wash(d, 'wash-safran', 'wash-sienne');
    S.ln(d, 0.9, 'ink');
    const tip = [x + 1.2 * s * Math.sin(a), y - 1.2 * s * Math.cos(a) * (1 - flat)];
    const stem = [x - 0.6 * s * Math.sin(a), y + 0.6 * s * Math.cos(a) * (1 - flat)];
    S.ln(`M${f(stem[0])} ${f(stem[1])}L${f(tip[0])} ${f(tip[1])}`, 0.8, 'ink-soft');
    let veins = '';
    for (const t of [0.25, 0.45, 0.65]) {
      const c = [lerp(x, tip[0], t), lerp(y, tip[1], t)];
      for (const sd of [-1, 1]) {
        const b = a + sd * 0.9;
        veins += `M${f(c[0])} ${f(c[1])}l${f(Math.sin(b) * s * 0.45)} ${f(-Math.cos(b) * s * 0.45 * (1 - flat))}`;
      }
    }
    S.ln(veins, 0.5, 'ink-faint');
  }
  // nuit : dégradé radial d'encre autour de la flaque
  const cx = 360, cy = 600, rx = 470, ry = 420;
  const g = `${S.id}-night`;
  S.defs.push(`<radialGradient id="${g}" class="ink" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${cx} ${cy}) scale(${rx} ${ry})"><stop offset="0.2" stop-color="currentColor" stop-opacity="0"/><stop offset="0.5" stop-color="currentColor" stop-opacity="0.3"/><stop offset="0.8" stop-color="currentColor" stop-opacity="0.78"/><stop offset="1" stop-color="currentColor" stop-opacity="0.94"/></radialGradient>`);
  S.p('', rect(-10, -10, w + 20, h + 20), { fill: `url(#${g})` });
  // lampe (debout, à droite), lumière vers la gauche
  const L = { x: 660, y: 470, s: 1.15 };
  let mouthW;
  S.at(L.x, L.y, { s: L.s }, () => {
    const lp = lamp(S, { stemH: 170, arm: [-118, -24], aim: -30 });
    mouthW = S.world(lp.mouth);
  });
  const g2 = `${S.id}-top`;
  S.defs.push(`<linearGradient id="${g2}" class="ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0.85"/><stop offset="0.3" stop-color="currentColor" stop-opacity="0"/><stop offset="0.86" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity="0.7"/></linearGradient>`);
  S.p('', rect(-10, -10, w + 20, h + 20), { fill: `url(#${g2})` });
  // lumière
  for (let i = 0; i < 6; i++) {
    const k = 1 - i * 0.14;
    S.p('wash-safran', ell(cx + i * 6, cy - i * 5, rx * 0.55 * k, ry * 0.5 * k), { 'fill-opacity': 0.08 + i * 0.03 });
  }
  S.open({ opacity: 0.14 });
  S.p('rehaut', ell(cx + 20, cy - 20, rx * 0.3, ry * 0.26));
  S.close();
  // poussières
  let dust = '';
  for (let i = 0; i < 30; i++) {
    const t = r.range(0.1, 0.9);
    const x = lerp(mouthW[0], cx, t) + r.jit(30 + 120 * t);
    const y = lerp(mouthW[1], cy, t) + r.jit(30 + 40 * t);
    dust += `M${f(x - 1)} ${f(y)}a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z`;
  }
  S.p('rehaut', dust, { opacity: 0.6 });
  void mul; void T; void Sc; void R; void apply;
  return S;
}
