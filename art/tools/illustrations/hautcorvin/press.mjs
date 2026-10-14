/**
 * Affaire 2 (`revenant-hautcorvin`) : presse, objets, catalogues et affiche (PR-02 à PR-10, OB-01 à
 * OB-03, CT-01, CT-02, PB-01). Briefs : docs/scenario/hautcorvin/09-illustrations.md §5.
 */
import { Scene, crowd, printBlock, headline } from '../kit.mjs';
import { hand } from '../people.mjs';
import { rect, ell, circ, smooth, poly, f, handLines, lerp } from '../lib.mjs';
import { hc, hcBust, limb, snowfall } from './cast.mjs';
import { goblet } from './photos.mjs';

/* ───────────────────────── Mise en page de journal ───────────────────────── */

/** Page de journal : papier jauni, filet, titre de rubrique. */
function page(S, { aged = true } = {}) {
  S.p('paper', rect(0, 0, S.w, S.h));
  if (aged) S.p('paper-shade', rect(0, 0, S.w, S.h), { opacity: 0.5 });
  S.ln(rect(6, 6, S.w - 12, S.h - 12), 0.8, 'ink');
}

/** Photo de presse tramée : rectangle, contenu, trame. */
function pressPhoto(S, d, fn, { base = 'photo-light', op = 0.45 } = {}) {
  S.within(d, () => {
    S.p(base, d);
    fn();
    S.stip(d, { opacity: op });
  });
  S.ln(d, 0.8, 'ink');
}

/** Colonnes de texte imprimé (illisible) entre x0 et x1. */
function columns(S, x0, y0, x1, n, lines, lh = 9) {
  const gap = 12;
  const w = (x1 - x0 - gap * (n - 1)) / n;
  let rules = '';
  for (let i = 0; i < n; i++) {
    printBlock(S, x0 + i * (w + gap), y0, w, lines, lh, { para: 6, indent: 6 });
    if (i) rules += `M${f(x0 + i * (w + gap) - gap / 2)} ${f(y0 - 6)}v${f(lines * lh)}`;
  }
  S.ln(rules, 0.5, 'ink-faint');
}

/** Ruines d'une halle : pans de murs, poutres tordues, fumée. */
function ruins(S, x0, x1, ground) {
  const r = S.r;
  let walls = '';
  for (let i = 0; i < 7; i++) {
    const x = lerp(x0, x1, i / 7) + r.range(0, 20);
    const h = r.range(30, 110);
    walls += poly([[x, ground], [x, ground - h], [x + 10, ground - h - r.range(0, 16)], [x + r.range(30, 60), ground - h * r.range(0.3, 0.8)], [x + 60, ground]], true);
  }
  S.fill(walls, 'dark');
  S.ln(walls, 0.7, 'ink-soft');
  let beams = '';
  for (let i = 0; i < 9; i++) {
    const x = lerp(x0, x1, r());
    beams += `M${f(x)} ${f(ground - r.range(0, 40))}l${f(r.range(-60, 60))} ${f(r.range(-60, -10))}`;
  }
  S.ln(beams, 3, 'ink');
}

/** Fumée en volutes claires. */
function smoke(S, x, y, n, w) {
  for (let i = 0; i < n; i++) S.p('photo-light', ell(x + S.r.jit(w * 0.3) + i * 6, y - i * w * 0.4, w * (0.5 + i * 0.12), w * (0.3 + i * 0.05)), { opacity: 0.6 - i * 0.05 });
}

/** Personne vue de dos (manteau, cheveux), (x, y) = sommet de la tête, h = hauteur. */
function fromBehind(S, x, y, h, { hair = 'dark', coat = 'dark' } = {}) {
  const u = h / 100;
  const body = smooth([[x - 14 * u, y + 18 * u], [x + 14 * u, y + 18 * u], [x + 20 * u, y + 40 * u], [x + 22 * u, y + 96 * u, 1], [x - 22 * u, y + 96 * u, 1], [x - 20 * u, y + 40 * u]], true);
  S.fill(body, coat);
  S.ln(body, 0.6, 'ink-soft');
  const hd = ell(x, y + 9 * u, 8 * u, 10 * u);
  S.fill(hd, hair);
  S.ln(hd, 0.6, 'ink-soft');
  S.fill(rect(x - 9 * u, y + 96 * u, 7 * u, 4 * u) + rect(x + 2 * u, y + 96 * u, 7 * u, 4 * u), 'dark');
}

/** Laurier gravé le long d'un arc (centre cx, cy ; rayon r ; de a0 à a1). Rend le chemin. */
function laurel(S, cx, cy, r, a0, a1, n, size, cls = 'ink-soft', w = 0.6) {
  let d = `M${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)}A${f(r)} ${f(r)} 0 0 ${a1 > a0 ? 1 : 0} ${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)}`;
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    for (const side of [-1, 1]) {
      const t = a + (a1 > a0 ? 1 : -1) * 0.5 + side * 0.9;
      const tip = [px + Math.cos(t) * size, py + Math.sin(t) * size];
      const m1 = [px + Math.cos(t + 0.35) * size * 0.55, py + Math.sin(t + 0.35) * size * 0.55];
      const m2 = [px + Math.cos(t - 0.35) * size * 0.55, py + Math.sin(t - 0.35) * size * 0.55];
      const leaf = smooth([[px, py, 1], m1, [tip[0], tip[1], 1], m2], true);
      leaves.push(leaf);
      d += leaf + `M${f(px)} ${f(py)}L${f(tip[0])} ${f(tip[1])}`;
    }
  }
  S.ln(d, w, cls);
  return leaves;
}

/** Ours (silhouette gravée au trait) ; (x, y) = garrot ; s = échelle ; dir = ±1. */
function bear(S, x, y, s, dir = 1, cls = 'ink-soft', w = 0.8) {
  const P = (u, v) => [x + dir * u * s, y + v * s];
  const d = smooth([P(-40, 6), P(-30, -8), P(0, -10), P(20, -6), P(30, -2), P(44, -4), P(54, 4), P(50, 12), P(36, 12), P(30, 20), P(28, 40, 1), P(18, 40, 1), P(14, 24), P(-20, 24), P(-22, 40, 1), P(-32, 40, 1), P(-36, 20), P(-44, 14)], true);
  S.ln(d + `M${f(P(46, -2)[0])} ${f(P(46, -2)[1])}l${f(dir * 2 * s)} ${f(-6 * s)}`, w, cls);
  return d;
}

/* ───────────────────────── Scènes ───────────────────────── */

export const SCENES = {
  /* ── PR-02 : « Les Thalbères reconduits au col », 22 avril 1916 ── */
  'pr-02'(id) {
    const S = new Scene(id, 560, 460, 'photo');
    page(S);
    headline(S, 40, 22, 480, 18, { words: 4 });
    const ph = rect(20, 56, 520, 280);
    pressPhoto(S, ph, () => {
      S.fill(rect(20, 56, 520, 120), 'light');
      S.fill(poly([[20, 150], [140, 90], [260, 130], [400, 80], [540, 120], [540, 336], [20, 336]], true), 'mid');
      // barrière du col : poteau et lisse rayée, guérite
      S.fill(rect(360, 150, 50, 110), 'light');
      S.ln(rect(360, 150, 50, 110) + 'M354 150l31 -20l31 20', 1, 'ink-soft');
      let bar = '';
      for (let i = 0; i < 8; i++) bar += rect(120 + i * 30, 214, 15, 8);
      S.ln('M110 218H360', 8, 'ink-faint');
      S.fill(bar, 'dark');
      S.fill(rect(108, 210, 8, 90), 'dark');
      crowd(S, 380, 530, 220, 7, 16, { tone: 'dark', hats: 0.6, rows: 2 });
      crowd(S, 40, 120, 226, 4, 15, { tone: 'dark', hats: 0.6 });
      // le charbonnier, côté thalbère ; la graveuse et l'enfant
      hc(S, 'dranko', 60, 240, 100, 0.38, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      hc(S, 'danela', 28, 150, 110, 0.36, { patch: { clothes: { type: 'shawl', wash: 'wash-sienne', dress: 'wash-ardoise' } }, lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      hc(S, 'andrin', 3, 200, 228, 0.2, { lower: { kind: 'stand', tone: 'light', child: 1 } });
    });
    printBlock(S, 30, 350, 500, 1, 10, { align: 'center' });
    columns(S, 20, 376, 540, 3, 8);
    return S;
  },

  /* ── PR-03 : « Grève des fours à Vernezac », 13 juin 1936 ── */
  'pr-03'(id) {
    const S = new Scene(id, 560, 480, 'photo');
    page(S);
    headline(S, 50, 22, 460, 18, { words: 4 });
    const ph = rect(20, 56, 340, 330);
    pressPhoto(S, ph, () => {
      // façade de la halle des fours, grande cheminée
      S.fill(rect(20, 56, 340, 200), 'light');
      S.fill(poly([[20, 150], [190, 90], [360, 150], [360, 256], [20, 256]], true), 'mid');
      S.fill(rect(250, 56, 40, 80), 'dark');
      for (const x of [60, 150, 240, 330]) S.fill(rect(x - 18, 170, 36, 60), 'dark');
      crowd(S, 30, 350, 254, 10, 16, { tone: 'dark', hats: 0.7, rows: 2 });
      // Bastien, 26 ans, le bras levé, casquette
      hc(S, 'bastien', 26, 110, 124, 0.62, { lower: { kind: 'stand', tone: 'mid', hatch: true, arms: 'right' } });
      limb(S, [[122, 252], [96, 196], [94, 132]], 24, 'mid', { hatch: true, skin: 2, size: 4, ang: 180, fist: true });
    }, { op: 0.5 });
    printBlock(S, 26, 400, 330, 1, 10, { align: 'center' });
    columns(S, 376, 60, 540, 1, 34);
    columns(S, 20, 420, 360, 2, 5);
    return S;
  },

  /* ── PR-04 : « L'incendie de Vernezac », 4 décembre 1937 ── */
  'pr-04'(id) {
    const S = new Scene(id, 560, 440, 'photo');
    page(S);
    headline(S, 30, 22, 500, 20, { words: 5 });
    const ph = rect(20, 60, 520, 270);
    pressPhoto(S, ph, () => {
      S.fill(rect(20, 60, 520, 270), 'mid', { opacity: 0.6 });
      // la cheminée debout au milieu des ruines fumantes
      const ch = poly([[300, 300], [306, 90], [330, 90], [336, 300]], true);
      S.fill(ch, 'dark');
      S.ln(ch, 0.8, 'ink-soft');
      ruins(S, 30, 530, 300);
      smoke(S, 180, 220, 7, 60);
      smoke(S, 420, 240, 6, 50);
      S.fill(rect(20, 300, 520, 30), 'dark', { opacity: 0.8 });
      snowfall(S, 20, 60, 540, 330, 40, 1);
    }, { op: 0.5 });
    printBlock(S, 30, 344, 500, 1, 10, { align: 'center' });
    columns(S, 20, 370, 540, 3, 6);
    return S;
  },

  /* ── PR-05 : « Le Régent à Hautcorvin », Le Héraut, 9 septembre 1941 ── */
  'pr-05'(id) {
    const S = new Scene(id, 560, 480, 'photo');
    page(S, { aged: false });
    headline(S, 60, 20, 440, 22, { words: 3 });
    S.ln('M20 52H540M20 56H540', 0.8, 'ink');
    const ph = rect(20, 68, 520, 300);
    pressPhoto(S, ph, () => {
      S.fill(rect(20, 68, 520, 300), 'mid', { opacity: 0.5 });
      // au fond, flou : le graveur
      S.open({ opacity: 0.6 });
      hc(S, 'andrin', 29, 380, 88, 0.36, { lower: { kind: 'stand', tone: 'light' } });
      S.close();
      S.fill(rect(370, 80, 80, 220), 'light', { opacity: 0.35 });
      S.stip(rect(370, 80, 80, 220));
      // tenture aux armes de la Régence
      S.fill(rect(30, 68, 120, 300), 'dark', { opacity: 0.8 });
      // Mme et M. Brossal tendent la Coupe
      hc(S, 'colombe', 35, 96, 98, 0.5, { lower: { kind: 'skirt', tone: 'dark', arms: 'left' } });
      hc(S, 'aime', 42, 230, 90, 0.52, { lower: { kind: 'stand', tone: 'dark', dense: true, arms: 'left' } });
      goblet(S, 212, 186, 50, 74);
      limb(S, [[164, 200], [178, 242], [196, 232]], 16, 'dark', { skin: 1, size: 2.8, ang: -80 });
      limb(S, [[240, 196], [240, 240], [226, 232]], 18, 'dark', { dense: true, skin: 1, size: 3, ang: 80 });
    }, { op: 0.35 });
    printBlock(S, 30, 382, 500, 1, 10, { align: 'center' });
    columns(S, 20, 408, 540, 3, 6);
    return S;
  },

  /* ── PR-08 : « Les guides de Vernezac sous le col », 15 janvier 1966 ── */
  'pr-08'(id) {
    const S = new Scene(id, 580, 480, 'photo');
    page(S, { aged: false });
    headline(S, 40, 22, 500, 18, { words: 5 });
    const ph = rect(20, 56, 380, 300);
    pressPhoto(S, ph, () => {
      S.p('photo-paper', ph);
      S.fill(poly([[20, 120], [140, 70], [260, 110], [400, 60], [400, 356], [20, 356]], true), 'light');
      // la cordée dans la neige : la corde entre les deux guides
      hc(S, 'remi', 57, 60, 110, 0.5, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      hc(S, 'gilles', 29, 220, 100, 0.52, { lower: { kind: 'stand', tone: 'dark', hatch: true } });
      S.ln('M150 260Q200 310 240 262', 2, 'ink');
      S.fill(rect(20, 330, 380, 26), 'paper');
      snowfall(S, 20, 56, 400, 356, 80, 1.4);
    }, { op: 0.4 });
    // vignette : Brigitte au télégraphe
    const vg = rect(416, 56, 144, 150);
    pressPhoto(S, vg, () => {
      S.fill(rect(416, 160, 144, 46), 'dark');
      hcBust(S, 'brigitte', 24, 420, 58, 0.78, { clip: true });
      S.fill(rect(480, 184, 70, 20), 'mid');
      S.ln(rect(480, 184, 70, 20) + circ(500, 194, 5), 0.8, 'ink-soft');
    }, { op: 0.4 });
    printBlock(S, 30, 370, 360, 1, 10, { align: 'center' });
    columns(S, 416, 222, 560, 1, 28);
    columns(S, 20, 394, 400, 2, 7);
    return S;
  },

  /* ── PR-09 : « Honoré Tessonnal, le dernier maître », 20 décembre 1975 ── */
  'pr-09'(id) {
    const S = new Scene(id, 580, 480, 'photo');
    page(S, { aged: false });
    S.black(rect(20, 18, 540, 4));
    headline(S, 50, 30, 480, 18, { words: 4 });
    const ph = rect(20, 64, 540, 290);
    pressPhoto(S, ph, () => {
      S.p('photo-paper', ph);
      // cimetière sous la neige, croix et stèles
      let gv = '';
      for (let i = 0; i < 10; i++) {
        const x = 40 + i * 54;
        gv += i % 3 ? `M${x - 10} 200v-40q10 -14 20 0v40Z` : `M${x - 2} 200v-56h4v56ZM${x - 12} 158h24v4h-24Z`;
      }
      S.fill(gv, 'mid');
      S.ln('M20 200H560', 0.8, 'ink-faint');
      // au fond, seule, une jeune femme de dos
      fromBehind(S, 486, 120, 90, { coat: 'dark' });
      // Colombe, Hugues, Isaure au premier plan
      hc(S, 'hugues', 44, 60, 92, 0.48, { lower: { kind: 'stand', tone: 'dark', dense: true } });
      hc(S, 'colombe', 69, 160, 100, 0.47, { lower: { kind: 'skirt', tone: 'dark', dense: true } });
      hc(S, 'isaure', 41, 270, 98, 0.47, { lower: { kind: 'skirt', tone: 'dark', hatch: true } });
      snowfall(S, 20, 64, 560, 354, 90, 1.3);
    }, { op: 0.35 });
    printBlock(S, 30, 366, 520, 1, 10, { align: 'center' });
    columns(S, 20, 392, 560, 3, 7);
    return S;
  },

  /* ── PR-10 : « Le Revenant de Hautcorvin », 24 janvier 1976 (trois photos) ── */
  'pr-10'(id) {
    const S = new Scene(id, 620, 520, 'photo');
    page(S, { aged: false });
    // photo de signature de la journaliste, à côté du titre
    const sig = rect(20, 20, 70, 84);
    pressPhoto(S, sig, () => hcBust(S, 'isaure', 41, 12, 18, 0.5, { clip: true }), { op: 0.4 });
    headline(S, 110, 34, 490, 26, { words: 4 });
    printBlock(S, 112, 80, 300, 1, 10, { align: 'left' });
    // le requérant, de face
    const p1 = rect(20, 120, 250, 300);
    pressPhoto(S, p1, () => {
      S.fill(p1, 'mid', { opacity: 0.5 });
      hcBust(S, 'andrin63', 63, 6, 130, 1.6, { clip: true });
    }, { op: 0.45 });
    // Agnès et son demi-frère Pierre
    const p2 = rect(284, 120, 316, 230);
    pressPhoto(S, p2, () => {
      S.fill(p2, 'light');
      S.fill(rect(284, 120, 120, 230), 'mid', { opacity: 0.5 });
      hcBust(S, 'agnes', 36, 290, 130, 1.05, { clip: true });
      hcBust(S, 'pierre', 27, 430, 120, 1.1, { clip: true });
    }, { op: 0.45 });
    printBlock(S, 30, 434, 230, 1, 9, { align: 'center' });
    printBlock(S, 294, 362, 296, 1, 9, { align: 'center' });
    columns(S, 284, 386, 600, 2, 12);
    columns(S, 20, 456, 270, 1, 5);
    return S;
  },

  /* ── OB-01 : la Coupe du Régent et deux détails à la loupe (B · T · 38) ── */
  'ob-01'(id) {
    const S = new Scene(id, 680, 480, 'photo');
    S.p('photo-dark', rect(0, 0, 680, 480));
    S.p('photo-mid', ell(190, 260, 200, 220), { opacity: 0.6 });
    // la coupe entière : calice, pied, médaillon au profil, couronne de laurier
    const cx = 190;
    const cup = smooth([[60, 70, 1], [70, 180], [120, 250], [190, 268], [260, 250], [310, 180], [320, 70, 1]], true);
    S.p('photo-light', cup, { opacity: 0.8 });
    S.p('rehaut', smooth([[80, 86], [90, 180], [118, 230], [104, 180], [96, 90]], true));
    const stem = poly([[180, 268], [200, 268], [204, 390], [176, 390]], true) + ell(190, 330, 16, 8);
    const foot = ell(190, 410, 86, 18);
    S.p('photo-light', stem + foot, { opacity: 0.85 });
    S.ln(cup + stem + foot + ell(190, 70, 130, 12), 1, 'ink-soft');
    // médaillon : profil du Régent
    S.ln(circ(cx, 156, 40), 0.8, 'ink-soft');
    S.ln(smooth([[cx + 14, 126], [cx - 2, 126], [cx - 14, 140], [cx - 10, 152], [cx - 18, 160], [cx - 10, 164], [cx - 12, 176], [cx + 2, 186], [cx + 18, 188]]), 1, 'ink-soft');
    laurel(S, cx, 156, 54, Math.PI * 0.6, Math.PI * 1.45, 8, 13, 'ink-soft', 0.7);
    laurel(S, cx, 156, 54, Math.PI * 0.4, -Math.PI * 0.45, 8, 13, 'ink-soft', 0.7);
    // repère du détail (côté gauche, entre la 7e et la 8e feuille)
    S.ln(circ(cx - 52, 128, 12), 1, 'ink-faint');
    S.ln(`M${cx - 40} 124L420 120`, 0.6, 'ink-faint');
    // deux détails à la loupe : les signes minuscules entre deux feuilles
    const detail = (x, y, r, k) => {
      S.p('photo-mid', circ(x, y, r));
      S.within(circ(x, y, r), () => {
        S.p('photo-light', circ(x, y, r), { opacity: 0.6 });
        // tige de la couronne en travers, deux feuilles de part et d'autre d'un intervalle
        const st = [[x - r * 1.1, y + r * 0.55], [x, y + r * 0.12 * (k ? -1 : 1)], [x + r * 1.1, y - r * 0.5]];
        S.ln(smooth(st), 2.2, 'ink-soft');
        for (const [t, side] of [[0.24, -1], [0.3, 1], [0.7, -1], [0.76, 1]]) {
          const px = lerp(st[0][0], st[2][0], t);
          const py = lerp(st[0][1], st[2][1], t) + (k ? -1 : 1) * Math.sin(t * Math.PI) * r * 0.08;
          const ang = -0.45 + side * 0.85;
          const L = r * 0.5;
          const tip = [px + Math.cos(ang) * L * (side > 0 ? 1 : 0.9), py + Math.sin(ang) * L * side];
          const nx = -(tip[1] - py) / L;
          const ny = (tip[0] - px) / L;
          const leaf = smooth([[px, py, 1], [lerp(px, tip[0], 0.5) + nx * r * 0.12, lerp(py, tip[1], 0.5) + ny * r * 0.12], [tip[0], tip[1], 1], [lerp(px, tip[0], 0.5) - nx * r * 0.12, lerp(py, tip[1], 0.5) - ny * r * 0.12]], true);
          S.p('photo-paper', leaf, { opacity: 0.6 });
          S.ln(leaf + `M${f(px)} ${f(py)}L${f(tip[0])} ${f(tip[1])}`, 1.4, 'ink-soft');
        }
        S.push(`<text class="label-note" x="${f(x + r * 0.02)}" y="${f(y - r * 0.06)}" text-anchor="middle" font-size="${f(r * 0.15)}" font-style="normal" transform="rotate(${-22 + k * 4} ${f(x)} ${f(y)})">B · T · 38</text>`);
        S.stip(circ(x, y, r), { opacity: 0.25 });
      });
      S.ln(circ(x, y, r), 3, 'ink-soft');
      S.ln(circ(x, y, r + 4), 1, 'ink-faint');
    };
    detail(510, 130, 100, 0);
    detail(520, 360, 90, 1);
    return S;
  },

  /* ── OB-02 : le verre gravé « À la fille du souffleur — 14.II.1959 » ── */
  'ob-02'(id) {
    const S = new Scene(id, 520, 520, 'photo');
    S.p('photo-dark', rect(0, 0, 520, 520));
    // gobelet droit, légèrement évasé
    const g = poly([[140, 70], [380, 70], [360, 450], [160, 450]], true);
    S.p('photo-mid', g, { opacity: 0.55 });
    S.ln(g + ell(260, 70, 120, 12) + ell(260, 450, 100, 10), 1, 'ink-soft');
    S.p('rehaut', poly([[156, 84], [176, 84], [184, 440], [172, 440]], true), { opacity: 0.5 });
    // gravure claire : le Pas (brèche dans la crête), l'ourse et l'ourson, la devise
    const cp = [[170, 250], [200, 200], [226, 214], [250, 168], [262, 190], [276, 186], [290, 150], [320, 206], [350, 196]];
    const crest = poly([...cp, ...cp.slice().reverse().map(([x, y]) => [x, y + 7])], true);
    S.p('photo-paper', crest, { opacity: 0.75 });
    S.ln(poly(cp), 0.6, 'ink-faint');
    let rocks = '';
    for (let i = 0; i < 12; i++) rocks += `M${180 + i * 14} ${222 + (i % 3) * 8}l8 -4`;
    S.ln(rocks, 0.8, 'ink-faint');
    const b1 = bear(S, 236, 300, 1.15, 1, 'ink-soft', 1.4);
    const b2 = bear(S, 312, 330, 0.62, 1, 'ink-soft', 1.2);
    S.p('rehaut', b1 + b2, { opacity: 0.45 });
    S.ln('M176 360Q260 352 344 360', 1, 'ink-soft');
    S.push('<text class="label-note" x="260" y="394" text-anchor="middle" font-size="15">À la fille du souffleur</text>');
    S.push('<text class="label-note" x="260" y="414" text-anchor="middle" font-size="13">14.II.1959</text>');
    return S;
  },

  /* ── OB-03 : la boîte de Lucie, ouverte ── */
  'ob-03'(id) {
    const S = new Scene(id, 640, 480, 'color');
    S.p('paper', rect(0, 0, 640, 480));
    // boîte de pastilles en fer, couvercle relevé
    const lid = poly([[70, 40], [570, 40], [580, 120], [60, 120]], true);
    S.fill(lid, { p: 'mid', c: 'wash-ardoise' });
    S.ln(lid + rect(240, 60, 160, 40), 1, 'ink');
    headline(S, 260, 72, 120, 12, { words: 2, cls: 'ink-soft' });
    const box = rect(50, 130, 540, 320);
    S.fill(box, { p: 'mid', c: 'wash-ardoise' });
    S.hat(box, { opacity: 0.5 });
    S.ln(box + rect(62, 142, 516, 296), 1.2, 'ink');
    // la photographie (Lucie devant le refuge), la lettre retournée, le billet, le carnet
    const ph = rect(80, 160, 120, 150);
    S.p('photo-paper', ph);
    S.within(rect(88, 168, 104, 134), () => {
      S.p('photo-light', rect(88, 168, 104, 134));
      S.p('photo-mid', rect(140, 168, 52, 134));
      hc(S, 'lucie', 23, 92, 176, 0.2, { lower: { kind: 'skirt', tone: 'dark' } });
    });
    S.ln(ph, 0.6, 'ink-soft');
    const env = poly([[220, 156], [420, 166], [414, 286], [212, 276]], true);
    S.fill(env, 'paper');
    S.ln(env + 'M220 156L318 226L420 166', 0.8, 'ink-soft');
    S.ln(rect(372, 176, 30, 34), 0.8, 'ink-soft');
    S.fill(rect(250, 236, 120, 26), { c: 'wash-carmin' }, { opacity: 0.8, transform: 'rotate(3 310 249)', noPaper: true });
    const bon = poly([[436, 160], [560, 168], [554, 262], [430, 254]], true);
    S.fill(bon, { p: 'light', c: 'wash-safran' });
    S.ln(bon, 0.8, 'ink-soft');
    S.ln(handLines(S.r, 444, 186, 100, 5, 13, { slant: 0.4, h: 2, step: 2.6 }), 0.6, 'ink-soft');
    const nb = poly([[90, 330], [270, 320], [282, 430], [100, 440]], true);
    S.fill(nb, { p: 'dark', c: 'wash-sienne' });
    S.hat(nb);
    S.ln(nb + 'M110 330L120 440', 1, 'ink');
    // larme de verre marquée d'un B, sifflet de corne cassé en deux
    const tear = smooth([[340, 330], [370, 360], [376, 392], [356, 410], [336, 396], [334, 360]], true);
    S.fill(tear, { p: 'light', c: 'wash-celadon' });
    S.p('rehaut', ell(348, 372, 6, 12));
    S.ln(tear + `M${f(380)} ${f(330)}Q${f(420)} ${f(318)} ${f(424)} ${f(300)}`, 1, 'ink');
    S.push('<text class="label-note" x="356" y="398" text-anchor="middle" font-size="16" font-style="normal">B</text>');
    const w1 = smooth([[440, 340], [490, 350], [512, 372, 1], [496, 372], [450, 356]], true);
    const w2 = smooth([[520, 382, 1], [548, 398], [566, 420, 1], [552, 418], [524, 396]], true);
    S.fill(w1 + w2, { p: 'mid', c: 'wash-sienne' });
    S.ln(w1 + w2 + 'M440 340Q420 300 440 280', 1, 'ink');
    return S;
  },

  /* ── CT-01 : catalogue 1925, coupe n° 112 au laurier, vignette de la lentille ── */
  'ct-01'(id) {
    const S = new Scene(id, 440, 600, 'engr');
    S.p('paper', rect(0, 0, 440, 600));
    S.ln(rect(16, 16, 408, 568) + rect(22, 22, 396, 556), 0.8, 'ink');
    headline(S, 90, 44, 260, 14, { words: 3 });
    printBlock(S, 120, 74, 200, 1, 9, { align: 'center' });
    // la coupe n° 112 : calice gravé au laurier
    const cx = 220;
    const cup = smooth([[120, 120, 1], [130, 220], [170, 290], [220, 304], [270, 290], [310, 220], [320, 120, 1]], true);
    S.p('paper', cup);
    S.within(cup, () => S.hatchIn(rect(240, 110, 90, 200), [240, 110, 330, 310], 70, 3, 0.5));
    S.ln(cup + ell(cx, 120, 100, 10), 1.2, 'ink');
    laurel(S, cx, 60, 170, Math.PI * 0.68, Math.PI * 0.32, 14, 17, 'ink', 0.7);
    const stem = poly([[212, 304], [228, 304], [232, 420], [208, 420]], true) + ell(220, 360, 14, 6);
    const foot = ell(220, 432, 70, 14);
    S.p('paper', stem + foot);
    S.ln(stem + foot, 1.1, 'ink');
    S.push('<text class="label-note" x="220" y="470" text-anchor="middle" font-size="14" font-style="normal">N° 112</text>');
    printBlock(S, 80, 488, 280, 2, 11, { align: 'center' });
    // vignette de la lentille, au pied de page
    const lx = 220;
    const ly = 546;
    S.ln(ell(lx, ly, 16, 22) + ell(lx, ly, 11, 15) + ell(lx, ly, 6, 8) + `M${lx - 16} ${ly - 10}h32M${lx - 16} ${ly + 10}h32`, 0.7, 'ink');
    printBlock(S, 250, 546, 120, 1, 9, { align: 'left' });
    return S;
  },

  /* ── CT-02 : catalogue bilingue de Brénica, page « Nos graveurs », 1974 ── */
  'ct-02'(id) {
    const S = new Scene(id, 460, 600, 'photo');
    S.p('paper', rect(0, 0, 460, 600));
    headline(S, 40, 30, 380, 16, { words: 2 });
    S.ln('M30 60H430', 1, 'ink');
    // photo : le maître graveur à sa roue, loupe au cordon
    const ph = rect(40, 80, 380, 300);
    S.within(ph, () => {
      S.p('photo-light', ph);
      S.fill(rect(40, 80, 380, 300), 'mid', { opacity: 0.4 });
      S.p('rehaut', ell(110, 150, 70, 60), { opacity: 0.5 });
      hcBust(S, 'andrin63', 61, 150, 80, 1.42, { clip: false, patch: { clothes: { type: 'leatherApron', wash: 'paper-shade', apron: 'wash-sienne' } } });
      // la roue de cuivre et le verre présenté
      const bench = rect(40, 330, 380, 50);
      S.fill(bench, 'dark');
      S.fill(circ(110, 312, 26), 'mid');
      S.ln(circ(110, 312, 26) + circ(110, 312, 5) + 'M40 312H200', 1, 'ink-soft');
      goblet(S, 168, 270, 40, 56, { laurel: true });
      hand(S, 200, 300, 70, 4, { skin: 2 });
      S.stip(ph, { opacity: 0.35 });
    });
    S.ln(ph, 0.8, 'ink');
    printBlock(S, 40, 396, 380, 1, 10, { align: 'center' });
    // deux colonnes : thalbère à gauche, velmarchois à droite
    printBlock(S, 40, 424, 180, 12, 11, { para: 6, indent: 6 });
    printBlock(S, 240, 424, 180, 12, 11, { para: 6, indent: 6 });
    S.ln('M230 418V560', 0.5, 'ink-faint');
    return S;
  },

  /* ── PB-01 : affiche « Vernezac, ses guides, ses pistes, son refuge de l'Ourse », 1962 ── */
  'pb-01'(id) {
    const S = new Scene(id, 440, 620, 'color');
    S.p('paper', rect(0, 0, 440, 620));
    S.fill(rect(0, 0, 440, 620), { c: 'wash-indigo' }, { opacity: 0.55 });
    // montagne stylisée en aplats
    const m1 = poly([[0, 420], [120, 220], [180, 280], [260, 140], [360, 300], [440, 240], [440, 620], [0, 620]], true);
    S.fill(m1, { c: 'wash-ardoise' });
    S.ln(m1, 1.2, 'ink');
    const snow = poly([[260, 140], [230, 192], [250, 186], [262, 200], [276, 182], [292, 192]], true) + poly([[120, 220], [100, 254], [118, 248], [130, 258], [142, 242]], true);
    S.p('paper', snow);
    S.ln(snow, 0.8, 'ink');
    const field = poly([[0, 470], [180, 400], [440, 450], [440, 620], [0, 620]], true);
    S.p('paper', field);
    S.ln(field, 1, 'ink');
    // le refuge : cabane de pierre, toit sombre
    const hut = poly([[300, 420], [300, 380], [330, 360], [360, 380], [360, 420]], true);
    S.fill(hut, { c: 'wash-sienne' });
    S.ln(hut + 'M296 382L330 356L364 382', 1.4, 'ink');
    // pistes en lacets
    S.ln('M60 600Q140 560 100 530Q60 500 150 480Q240 460 210 440', 2, 'ink-soft', { 'stroke-dasharray': '6 5' });
    // médaillon : photo de la gardienne
    const md = circ(130, 330, 84);
    S.p('photo-paper', md);
    S.within(md, () => {
      S.p('photo-light', md);
      hcBust(S, 'lucie', 48, 54, 222, 1.08, { clip: true, mode: 'photo' });
      S.stip(md, { opacity: 0.4 });
    });
    S.ln(md, 3, 'ink');
    S.ln(circ(130, 330, 90), 1, 'ink-soft');
    // titre et accroches
    S.push('<text class="label-major" x="220" y="70" text-anchor="middle" font-size="44">Vernezac</text>');
    S.push('<text class="label" x="220" y="104" text-anchor="middle" font-size="15">ses guides · ses pistes · son refuge</text>');
    printBlock(S, 60, 560, 320, 2, 12, { align: 'center' });
    return S;
  },
};
