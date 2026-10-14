/**
 * Affaire 2 (`revenant-hautcorvin`) : fac-similés partiels et planches d'expertise (OF-08, RG-05 à
 * RG-18, LT-04 à LT-06, DV-01, DV-02, TG-01, TG-02, EX-02 à EX-04). Briefs :
 * docs/scenario/hautcorvin/09-illustrations.md §5. Le texte reste illisible (le Lecteur en donne la
 * transcription) ; seuls quelques signes utiles à la comparaison sont tracés nets (T, numéros).
 */
import { Scene, printBlock, headline } from '../kit.mjs';
import { rect, ell, circ, smooth, poly, f, handLines, lerp } from '../lib.mjs';
import { hcBust } from './cast.mjs';

/* ───────────────────────── Outils ───────────────────────── */

/**
 * Feuille de papier (ombre portée légère). Rend son `d`. Une feuille de biais (`rot`) ouvre un groupe
 * tourné, à refermer par `end(S)` une fois son contenu tracé ; une feuille droite n'ouvre rien.
 */
function sheet(S, x, y, w, h, { rot = 0, tone = 'paper', shade = 0.25, edge = 'ink-faint' } = {}) {
  if (rot) S.open({ transform: `rotate(${rot} ${f(x + w / 2)} ${f(y + h / 2)})` });
  S.p('ombre', rect(x + 4, y + 5, w, h));
  const d = rect(x, y, w, h);
  S.p(tone, d);
  if (shade) S.p('paper-shade', d, { opacity: shade });
  S.ln(d, 0.6, edge);
  return d;
}
const end = (S) => S.close();

/** Écriture manuscrite (illisible) : `pencil` = crayon gris, sinon encre. */
function writing(S, x, y, w, n, lh, o = {}) {
  const { pencil = false, slant = 0.5, h = 3, step = 3.6, last = 0.55, w: sw } = o;
  S.ln(handLines(S.r, x, y, w, n, lh, { slant, h, step, last }), sw ?? (pencil ? 0.7 : 0.8), pencil ? 'ink-faint' : 'ink');
}

/** Texte dactylographié ou imprimé (illisible). */
function typed(S, x, y, w, n, lh, o = {}) {
  printBlock(S, x, y, w, n, lh, { align: 'left', word: [3, 10], gap: 2.2, cls: 'ink-soft', sw: lh * 0.3, ...o });
}

/** Grille de registre : colonnes (abscisses) et lignes entre y0 et y1. */
function grid(S, xs, y0, y1, rowH, { head = 18 } = {}) {
  let d = '';
  for (const x of xs) d += `M${f(x)} ${f(y0)}V${f(y1)}`;
  d += `M${f(xs[0])} ${f(y0)}H${f(xs[xs.length - 1])}M${f(xs[0])} ${f(y0 + head)}H${f(xs[xs.length - 1])}`;
  S.ln(d, 0.8, 'ink-soft');
  let rows = '';
  for (let y = y0 + head + rowH; y < y1; y += rowH) rows += `M${f(xs[0])} ${f(y)}H${f(xs[xs.length - 1])}`;
  S.ln(rows, 0.5, 'ink-faint');
}

/**
 * T majuscule manuscrit à (x, y) (haut de la barre), hauteur h. `loop` : T thalbère, la barre se
 * referme en boucle sur la hampe ; sinon barre droite, courte, levée et détachée de la hampe
 * (écoles de la haute vallée, 07-coherence §0).
 */
function capT(S, x, y, h, loop, w = 1.4, cls = 'ink') {
  const bw = h * 0.7;
  let d;
  if (loop) {
    d = `M${f(x + bw * 0.55)} ${f(y + h * 0.02)}C${f(x + bw * 0.2)} ${f(y - h * 0.06)} ${f(x - bw * 0.42)} ${f(y - h * 0.02)} ${f(x - bw * 0.46)} ${f(y + h * 0.1)}`;
    d += `C${f(x - bw * 0.5)} ${f(y + h * 0.24)} ${f(x - bw * 0.2)} ${f(y + h * 0.26)} ${f(x - bw * 0.16)} ${f(y + h * 0.12)}C${f(x - bw * 0.12)} ${f(y)} ${f(x - bw * 0.3)} ${f(y - h * 0.04)} ${f(x - bw * 0.38)} ${f(y + h * 0.04)}`;
    d += `M${f(x + bw * 0.04)} ${f(y + h * 0.02)}`;
  } else {
    // barre droite, courte, levée, jamais liée : la hampe part plus bas (écoles de la haute vallée)
    d = `M${f(x - bw * 0.4)} ${f(y - h * 0.02)}L${f(x + bw * 0.44)} ${f(y - h * 0.07)}`;
    d += `M${f(x + bw * 0.04)} ${f(y + h * 0.1)}`;
  }
  d += `C${f(x + bw * 0.02)} ${f(y + h * 0.44)} ${f(x - bw * 0.06)} ${f(y + h * 0.8)} ${f(x - bw * 0.2)} ${f(y + h)}`;
  S.ln(d, w, cls, { 'stroke-linecap': 'round' });
}

/** Signature : initiale (T à boucle ou droite si `t`), puis paraphe. */
function signature(S, x, y, w, { t = null, h = 14, cls = 'ink', sw = 1 } = {}) {
  let ox = x;
  if (t !== null) {
    capT(S, x + h * 0.4, y - h, h, t, sw * 1.2, cls);
    ox += h * 0.8;
  }
  S.ln(handLines(S.r, ox, y, w - (ox - x), 1, 10, { slant: 0.6, h: h * 0.3, step: h * 0.32, last: 1 }), sw, cls);
  S.ln(`M${f(x + w * 0.2)} ${f(y + 5)}Q${f(x + w * 0.6)} ${f(y + 9)} ${f(x + w)} ${f(y + 1)}`, sw * 0.8, cls);
}

/** Tampon encré : cadre (rond ou rectangulaire) et texte lisible en capitales. */
function stamp(S, x, y, lines, { rot = -6, w = 220, round = false, size = 11, cls = 'ink-soft' } = {}) {
  const h = lines.length * (size + 4) + 12;
  S.open({ transform: `rotate(${rot} ${f(x)} ${f(y)})`, opacity: 0.85 });
  if (round) S.ln(circ(x, y, w / 2) + circ(x, y, w / 2 - 5), 1.4, cls);
  else S.ln(rect(x - w / 2, y - h / 2, w, h) + rect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6), 1.4, cls);
  lines.forEach((t, i) => S.push(`<text class="label" x="${f(x)}" y="${f(y - h / 2 + 10 + (i + 0.8) * (size + 4))}" text-anchor="middle" font-size="${size}">${t}</text>`));
  S.close();
}

/** Pliures (plis en croix ou en huit) : traits d'ombre et de lumière. */
function folds(S, x, y, w, h, nx, ny) {
  let d = '';
  for (let i = 1; i < nx; i++) d += `M${f(x + (w * i) / nx)} ${f(y)}V${f(y + h)}`;
  for (let j = 1; j < ny; j++) d += `M${f(x)} ${f(y + (h * j) / ny)}H${f(x + w)}`;
  S.ln(d, 1.2, 'ink-faint', { opacity: 0.5 });
  let l = '';
  for (let i = 1; i < nx; i++) l += rect(x + (w * i) / nx + 0.6, y, 1.4, h);
  for (let j = 1; j < ny; j++) l += rect(x, y + (h * j) / ny + 0.6, w, 1.4);
  S.p('rehaut', l);
}

/** Cartouche de légende sous une planche (texte réel). */
function caption(S, x, y, t, size = 12) {
  S.push(`<text class="label-note" x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="${size}" font-style="normal">${t}</text>`);
}

/* ───────────────────────── Scènes ───────────────────────── */

export { capT, signature };

export const SCENES = {
  /* ── OF-08 : billet anonyme au crayon, sur une fiche de dépôt des Postes coupée ── */
  'of-08'(id) {
    const S = new Scene(id, 480, 340, 'color');
    S.p('paper-shade', rect(0, 0, 480, 340));
    // demi-fiche : coupe aux ciseaux un peu de travers en bas
    const fic = poly([[40, 40], [440, 30], [446, 250], [300, 262], [160, 256], [44, 266]], true);
    S.open({ transform: 'rotate(-2 240 150)' });
    S.p('ombre', fic, { transform: 'translate(4 5)' });
    S.fill(fic, { c: 'wash-safran' }, { opacity: 0.35 });
    S.ln(fic, 0.6, 'ink-faint');
    // en-tête imprimé des Postes, cases à remplir
    S.ln(circ(72, 66, 14) + 'M62 66q10 -10 20 0', 0.8, 'ink-soft');
    headline(S, 96, 58, 200, 10, { words: 3, cls: 'ink-soft' });
    S.ln(rect(330, 50, 96, 30) + 'M60 104H426M60 128H426', 0.6, 'ink-soft');
    typed(S, 64, 98, 70, 1, 7);
    typed(S, 64, 122, 50, 1, 7);
    // le billet au crayon, par-dessus les rubriques
    writing(S, 70, 162, 340, 4, 22, { pencil: true, slant: 0.3, h: 4.2, step: 4.8, w: 1.1 });
    S.close();
    return S;
  },

  /* ── RG-05 : registre de baptêmes de Vernezac, 8 septembre 1912 ── */
  'rg-05'(id) {
    const S = new Scene(id, 560, 380, 'color');
    sheet(S, 20, 20, 520, 340, { shade: 0.4 });
    S.ln('M40 20V360', 0.8, 'ink-faint');
    headline(S, 160, 36, 240, 10, { words: 3, cls: 'ink-soft' });
    grid(S, [60, 120, 520], 60, 340, 128, { head: 0 });
    // deux actes : numéro, nom en marge, texte, signatures du parrain et de la marraine
    for (const [i, y] of [[0, 66], [1, 194]]) {
      writing(S, 66, y + 22, 48, 2, 14, { h: 2.6, step: 3 });
      writing(S, 130, y + 20, 380, 4, 16, { h: 2.8, step: 3.4 });
      signature(S, 140, y + 104, 130, { h: 12 });
      signature(S, 340, y + 104, 150, { h: 12, cls: i ? 'ink-soft' : 'ink' });
    }
    return S;
  },

  /* ── RG-11 : Bulletin d'Ordre n° 13, liste de radiation n° 9, 26 mars 1938 ── */
  'rg-11'(id) {
    const S = new Scene(id, 320, 560, 'color');
    sheet(S, 20, 20, 280, 520, { shade: 0.15 });
    headline(S, 50, 40, 220, 14, { words: 2 });
    S.ln('M36 64H284M36 68H284', 0.8, 'ink');
    typed(S, 40, 82, 240, 3, 9);
    S.push('<text class="label" x="160" y="132" text-anchor="middle" font-size="12">Liste n° 9</text>');
    S.ln('M110 140H210', 0.6, 'ink-soft');
    // cinq entrées : nom en capitales grasses, notice
    for (let i = 0; i < 5; i++) {
      const y = 160 + i * 70;
      headline(S, 40, y, 120 + (i % 2) * 30, 8, { words: 2, align: 'left' });
      typed(S, 40, y + 20, 240, 4, 9);
    }
    S.ln('M36 520H284', 0.6, 'ink-faint');
    return S;
  },

  /* ── RG-13 (R) : registre d'écrou n° 1 de Kessaar, f° 9, ligne 0214 ── */
  'rg-13'(id) {
    const S = new Scene(id, 600, 420, 'color');
    sheet(S, 20, 20, 560, 380, { shade: 0.45 });
    headline(S, 200, 34, 200, 10, { words: 3, cls: 'ink-soft' });
    const xs = [40, 96, 220, 330, 450, 560];
    grid(S, xs, 56, 380, 52, { head: 20 });
    for (let r = 0; r < 6; r++) {
      const y = 76 + r * 52 + 18;
      for (let c = 0; c < 5; c++) writing(S, xs[c] + 6, y, xs[c + 1] - xs[c] - 12, 2, 14, { h: 2.4, step: 2.9 });
    }
    // ligne 0214 : mention de sortie d'une autre main, plus penchée, encre plus pâle, barrée d'un trait
    const y = 76 + 3 * 52;
    S.p('wash-safran', rect(40, y, 520, 52), { opacity: 0.35 });
    S.ln(handLines(S.r, 456, y + 18, 100, 3, 12, { slant: 1.1, h: 3.2, step: 3.4 }), 0.8, 'ink-soft');
    S.ln(`M100 ${y + 26}L210 ${y + 24}`, 1, 'ink');
    return S;
  },

  /* ── RG-14 (R) : registre d'écrou n° 4, f° 31, et fiche d'infirmerie (« main gauche ») ── */
  'rg-14'(id) {
    const S = new Scene(id, 620, 440, 'color');
    sheet(S, 20, 20, 480, 380, { shade: 0.45 });
    headline(S, 160, 34, 200, 10, { words: 3, cls: 'ink-soft' });
    const xs = [40, 92, 200, 300, 400, 480];
    grid(S, xs, 56, 380, 52, { head: 20 });
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) writing(S, xs[c] + 6, 94 + r * 52, xs[c + 1] - xs[c] - 12, 2, 14, { h: 2.4, step: 2.9 });
    // fiche d'infirmerie épinglée : schéma de main gauche, dos, brûlure hachurée
    sheet(S, 360, 180, 230, 230, { rot: 5, tone: 'paper', shade: 0 });
    typed(S, 376, 204, 120, 2, 10);
    const hand = smooth([[440, 380, 1], [430, 320], [420, 290], [424, 286], [438, 300], [436, 250], [444, 248], [450, 290], [454, 240], [462, 240], [464, 290], [470, 248], [478, 250], [476, 300], [484, 268], [492, 270], [484, 320], [480, 380, 1]], true);
    S.p('paper', hand);
    S.ln(hand, 1, 'ink');
    const burn = ell(460, 336, 16, 12);
    S.p('wash-carmin', burn, { opacity: 0.6 });
    S.hatd(burn);
    S.ln(burn, 0.8, 'ink');
    writing(S, 376, 236, 70, 3, 14, { h: 2.4, step: 2.8 });
    end(S);
    return S;
  },

  /* ── RG-15 : procès-verbal de réinscription, 3 juin 1953, photo agrafée, signature au T à boucle ── */
  'rg-15'(id) {
    const S = new Scene(id, 520, 600, 'photo');
    S.p('paper', rect(0, 0, 520, 600));
    S.ln(rect(16, 16, 488, 568), 0.6, 'ink-faint');
    headline(S, 140, 40, 240, 12, { words: 3 });
    typed(S, 40, 80, 300, 10, 16);
    // photo d'identité agrafée (40 ans)
    const ph = rect(360, 72, 120, 150);
    S.within(ph, () => {
      S.p('photo-mid', ph);
      S.p('photo-light', ell(420, 140, 60, 80), { opacity: 0.5 });
      hcBust(S, 'andrin41', 40, 360, 78, 0.78, { clip: true });
    });
    S.ln(ph, 0.6, 'ink-soft');
    S.ln('M380 66v18M386 66v18', 2, 'ink-soft');
    typed(S, 40, 260, 440, 9, 16);
    // signature du réinscrit (T à boucle), témoins, cachet de la mairie
    signature(S, 60, 470, 180, { t: true, h: 22, sw: 1.1 });
    signature(S, 300, 470, 90, { h: 12, cls: 'ink-soft' });
    signature(S, 400, 470, 90, { h: 12, cls: 'ink-soft' });
    S.ln(circ(420, 540, 34) + circ(420, 540, 28), 1, 'ink-soft', { opacity: 0.7 });
    return S;
  },

  /* ── RG-17 : livre de paie de l'atelier de gravure, la ligne « D. D. — supplément » ── */
  'rg-17'(id) {
    const S = new Scene(id, 640, 420, 'color');
    // livre ouvert : deux pages, colonnes de chiffres
    sheet(S, 20, 20, 300, 380, { shade: 0.45 });
    sheet(S, 320, 20, 300, 380, { shade: 0.45 });
    S.p('ombre', rect(312, 20, 16, 380));
    for (const x0 of [30, 330]) {
      const xs = [x0 + 10, x0 + 60, x0 + 200, x0 + 280];
      grid(S, xs, 46, 380, 22, { head: 18 });
      for (let r = 0; r < 14; r++) {
        writing(S, xs[0] + 4, 82 + r * 22, 40, 1, 10, { h: 2.2, step: 2.6 });
        writing(S, xs[1] + 4, 82 + r * 22, 120, 1, 10, { h: 2.2, step: 2.6 });
        writing(S, xs[2] + 20, 82 + r * 22, 50, 1, 10, { h: 2.2, step: 2.4, last: 1 });
      }
    }
    // la ligne de Danela, d'une autre encre
    const y = 82 + 6 * 22;
    S.p('wash-safran', rect(340, y - 14, 270, 20), { opacity: 0.4 });
    S.push(`<text class="label-note" x="${374}" y="${y}" font-size="11">D. D.</text>`);
    return S;
  },

  /* ── RG-18 : main courante du gardien, foulage lu en lumière rasante ── */
  'rg-18'(id) {
    const S = new Scene(id, 560, 460, 'color');
    S.p('paper-shade', rect(0, 0, 560, 460));
    // talon de la page arrachée, à la reliure
    const stub = poly([[40, 30], [70, 30], [64, 80], [74, 140], [60, 220], [72, 300], [62, 380], [70, 430], [40, 430]], true);
    S.p('paper', stub);
    S.ln(stub, 0.8, 'ink-soft');
    S.p('ombre', rect(30, 30, 12, 400));
    // page blanche : lumière rasante venue de la gauche (dégradé en bandes), écriture en creux
    const pg = rect(80, 30, 450, 400);
    S.p('paper', pg);
    for (let i = 0; i < 8; i++) S.p('ombre', rect(80 + i * 56, 30, 56, 400), { opacity: (0.12 + i * 0.1).toFixed(2) });
    S.ln(pg, 0.6, 'ink-faint');
    S.within(pg, () => {
      // grain du papier accroché par la lumière rasante
      let grain = '';
      for (let k = 0; k < 90; k++) {
        const gx = 84 + S.r() * 440;
        const gy = 34 + S.r() * 392;
        grain += `M${f(gx)} ${f(gy)}l${f(6 + S.r() * 10)} ${f((S.r() - 0.5) * 1.2)}`;
      }
      S.ln(grain, 0.5, 'ink-faint', { opacity: 0.35 });
      for (let i = 0; i < 7; i++) {
        const y = 80 + i * 44;
        if (i === 2) {
          // la ligne lisible : creux = ombre portée en haut à gauche, arête éclairée en bas à droite
          const t = '23 h 10 — M. B. au magasin…';
          const at = (dx, dy, cls) => `<text class="${cls}" x="${110 + dx}" y="${y + 6 + dy}" font-size="25" font-style="italic" letter-spacing="0.6">${t}</text>`;
          S.push(at(1.3, 1.3, 'rehaut'), at(-1, -1, 'ombre'), at(-0.4, -0.4, 'ombre'));
          continue;
        }
        const d = handLines(S.r, 110, y, 380, 1, 10, { slant: 0.5, h: 5, step: 5.4, last: 0.7 });
        // relief : ombre dans le creux, trait pâle décalé
        S.ln(d, 1.6, 'ink-faint', { transform: 'translate(-0.8 -0.9)', opacity: 0.6 });
        S.ln(d, 0.7, 'ink-faint', { transform: 'translate(0.8 0.9)', opacity: 0.3 });
      }
    });
    return S;
  },

  /* ── LT-04 : billet au crayon de Bastien, plié en huit (T à barre droite) ── */
  'lt-04'(id) {
    const S = new Scene(id, 460, 400, 'color');
    S.p('paper-shade', rect(0, 0, 460, 400));
    sheet(S, 50, 40, 360, 320, { rot: -3, shade: 0.3 });
    folds(S, 50, 40, 360, 320, 2, 4);
    // « Tu… » ouvre deux phrases : T à barre droite, courte, levée, détachée de la hampe
    const pen = { pencil: true, slant: 0.4, h: 4.6, step: 5, w: 1.1 };
    capT(S, 86, 72, 20, false, 1.4, 'ink-faint');
    writing(S, 100, 86, 276, 1, 28, pen);
    writing(S, 76, 114, 300, 3, 28, { ...pen, last: 0.5 });
    capT(S, 236, 156, 20, false, 1.4, 'ink-faint');
    writing(S, 250, 170, 126, 1, 28, pen);
    writing(S, 76, 198, 300, 4, 28, pen);
    end(S);
    return S;
  },

  /* ── LT-05 : enveloppe retournée, « Destinataire absent — loi du 2 février 1938, art. 6 » ── */
  'lt-05'(id) {
    const S = new Scene(id, 600, 380, 'color');
    S.p('paper-shade', rect(0, 0, 600, 380));
    sheet(S, 30, 40, 540, 300, { rot: 2, shade: 0.2 });
    // timbre et oblitération, adresse manuscrite
    S.fill(rect(480, 60, 60, 70), { c: 'wash-indigo' });
    S.ln(rect(480, 60, 60, 70) + rect(486, 66, 48, 58), 0.6, 'ink-soft');
    S.ln(circ(470, 100, 26) + 'M420 92h120M420 100h120M420 108h120', 0.8, 'ink-soft', { opacity: 0.7 });
    writing(S, 150, 170, 300, 4, 26, { slant: 0.5, h: 4.4, step: 5 });
    end(S);
    stamp(S, 300, 290, ['Destinataire absent', 'Loi du 2 février 1938, art. 6'], { rot: -8, w: 330, size: 13, cls: 'ink' });
    // flèche de renvoi au crayon bleu
    S.ln('M80 120q40 -50 90 -20l-10 -10m10 10l-14 4', 1.4, 'ink-soft');
    return S;
  },

  /* ── LT-06 : bon de cantine du bagne (recto imprimé), verso au crayon serré ── */
  'lt-06'(id) {
    const S = new Scene(id, 600, 420, 'color');
    S.p('paper-shade', rect(0, 0, 600, 420));
    // recto : bon imprimé, numéro, cases
    sheet(S, 30, 40, 280, 180, { rot: -6, tone: 'paper', shade: 0.2 });
    S.fill(rect(30, 40, 280, 36), { c: 'wash-safran' }, { opacity: 0.5 });
    headline(S, 60, 50, 200, 12, { words: 2 });
    S.ln(rect(50, 96, 240, 100) + 'M50 130H290M50 163H290M170 96V196', 0.7, 'ink-soft');
    typed(S, 58, 116, 90, 3, 33);
    S.push('<text class="label-note" x="270" y="72" text-anchor="end" font-size="12" font-style="normal">N° 4117</text>');
    end(S);
    // verso : billet au crayon, écriture serrée jusqu'aux bords
    sheet(S, 250, 110, 300, 270, { rot: 4, tone: 'paper', shade: 0.35 });
    writing(S, 266, 140, 268, 14, 16, { pencil: true, slant: 0.3, h: 3, step: 3.2, w: 0.9 });
    end(S);
    return S;
  },

  /* ── DV-01 : journal de sœur Agathe, écriture de couvent, image pieuse en marque-page ── */
  'dv-01'(id) {
    const S = new Scene(id, 560, 440, 'color');
    S.p('paper-shade', rect(0, 0, 560, 440));
    // cahier ouvert, page de droite écrite d'une main régulière
    sheet(S, 30, 30, 250, 380, { shade: 0.35 });
    sheet(S, 280, 30, 250, 380, { shade: 0.35 });
    S.p('ombre', rect(272, 30, 16, 380));
    let ru = '';
    for (let y = 70; y < 400; y += 20) ru += `M44 ${y}H266M294 ${y}H516`;
    S.ln(ru, 0.5, 'ink-faint', { opacity: 0.5 });
    writing(S, 48, 66, 214, 16, 20, { slant: 0.2, h: 3.2, step: 3.8 });
    writing(S, 298, 66, 214, 10, 20, { slant: 0.2, h: 3.2, step: 3.8 });
    // image pieuse : dentelle, saint à l'auréole
    S.open({ transform: 'rotate(-8 430 320)' });
    const card = rect(370, 240, 120, 170);
    S.p('paper', card);
    let lace = '';
    for (let i = 0; i < 12; i++) lace += circ(374 + i * 10, 244, 3) + circ(374 + i * 10, 406, 3);
    for (let j = 0; j < 16; j++) lace += circ(374, 254 + j * 10, 3) + circ(486, 254 + j * 10, 3);
    S.ln(lace, 0.5, 'ink-soft');
    const fig = smooth([[430, 290], [444, 300], [450, 360], [460, 390, 1], [400, 390, 1], [410, 360], [416, 300]], true);
    S.fill(fig, { c: 'wash-indigo' });
    S.fill(circ(430, 278, 11), { c: 'skin-1' });
    S.ln(fig + circ(430, 278, 11), 0.8, 'ink');
    S.fill(circ(430, 274, 18), { c: 'wash-safran' }, { opacity: 0.6, noPaper: true });
    S.ln(circ(430, 274, 18), 0.6, 'ink-soft');
    S.close();
    return S;
  },

  /* ── DV-02 : carnet des moutons, double page (bâtons, dates), épi dessiné sur la garde ── */
  'dv-02'(id) {
    const S = new Scene(id, 560, 400, 'color');
    S.p('paper-shade', rect(0, 0, 560, 400));
    const cov = rect(20, 20, 520, 360);
    S.fill(cov, { c: 'wash-sienne' });
    S.ln(cov, 1, 'ink');
    sheet(S, 34, 30, 246, 340, { shade: 0.2 });
    sheet(S, 280, 30, 246, 340, { shade: 0.2 });
    S.p('ombre', rect(272, 30, 16, 340));
    // garde : « B. — 14.2.39 » et l'épi au crayon (tourbillon, mèche relevée)
    S.push('<text class="label-note" x="80" y="110" font-size="16">B. — 14.2.39</text>');
    let sp = 'M156 236';
    for (let i = 0; i < 40; i++) {
      const a = i * 0.42;
      const rr = 2 + i * 1.05;
      sp += `L${f(156 + Math.cos(a) * rr)} ${f(236 + Math.sin(a) * rr * 0.8)}`;
    }
    S.ln(sp, 0.8, 'ink-faint');
    let hairs = '';
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (i - 7) * 0.12;
      hairs += `M${f(156 + Math.cos(a) * 30)} ${f(236 + Math.sin(a) * 26)}Q${f(150 + (i - 7) * 4)} ${f(190)} ${f(146 + (i - 7) * 7)} ${f(170 - Math.abs(i - 7) * 2)}`;
    }
    S.ln(hairs, 0.7, 'ink-faint');
    // page : dates à gauche, bâtons groupés par cinq
    for (let r = 0; r < 12; r++) {
      const y = 70 + r * 25;
      writing(S, 296, y, 46, 1, 10, { pencil: true, h: 2.4, step: 2.6, last: 1 });
      let tally = '';
      const n = 1 + ((r * 7) % 9);
      for (let k = 0; k < n; k++) {
        const g = Math.floor(k / 5);
        const kk = k % 5;
        if (kk === 4) tally += `M${358 + g * 40 - 2} ${y - 2}l26 -10`;
        else tally += `M${360 + g * 40 + kk * 6} ${y}v-14`;
      }
      S.ln(tally, 1, 'ink-faint');
    }
    return S;
  },

  /* ── TG-01 : télégramme de Port-Sénane, 14 avril 1952, « Pour H. » au crayon ── */
  'tg-01'(id) {
    const S = new Scene(id, 600, 400, 'color');
    S.p('paper-shade', rect(0, 0, 600, 400));
    const fm = sheet(S, 30, 30, 540, 340, { shade: 0 });
    S.fill(fm, { c: 'wash-safran' }, { opacity: 0.3, noPaper: true });
    headline(S, 160, 50, 280, 14, { words: 1 });
    S.ln('M50 80H550', 1, 'ink');
    typed(S, 60, 98, 200, 2, 12);
    S.ln(rect(400, 92, 150, 40), 0.6, 'ink-soft');
    // bandes collées, texte en capitales télégraphiques
    for (let i = 0; i < 4; i++) {
      const y = 160 + i * 34;
      const w = i === 3 ? 260 : 480;
      S.p('paper', rect(60, y, w, 22));
      S.ln(rect(60, y, w, 22), 0.5, 'ink-faint');
      printBlock(S, 70, y + 11, w - 20, 1, 10, { align: 'left', word: [6, 16], last: 1, cls: 'ink' });
    }
    // mention au crayon de Danela
    S.push('<text class="label-note" x="440" y="330" font-size="20">Pour H.</text>');
    S.ln('M432 338q50 6 96 -4', 0.8, 'ink-faint');
    return S;
  },

  /* ── TG-02 : formulaire de dépôt, Vernezac, 10 janvier 1976 (T à boucle ; visa « B. Neviot ») ── */
  'tg-02'(id) {
    const S = new Scene(id, 600, 420, 'color');
    S.p('paper-shade', rect(0, 0, 600, 420));
    const fm = sheet(S, 30, 30, 540, 360, { shade: 0 });
    S.fill(fm, { c: 'wash-celadon' }, { opacity: 0.3, noPaper: true });
    S.ln(circ(70, 66, 16) + 'M58 66q12 -12 24 0', 0.8, 'ink-soft');
    headline(S, 100, 58, 260, 12, { words: 3, cls: 'ink-soft' });
    // rubriques imprimées et cases du texte
    S.ln('M50 100H550M50 140H550', 0.6, 'ink-soft');
    typed(S, 56, 94, 60, 1, 8);
    typed(S, 56, 134, 60, 1, 8);
    let cells = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) cells += rect(56 + c * 82, 160 + r * 40, 78, 34);
    S.ln(cells, 0.5, 'ink-faint');
    // écriture du déposant : capitales, adresse avec T à boucle
    writing(S, 130, 92, 220, 1, 10, { h: 3.4, step: 4, last: 1 });
    capT(S, 132, 116, 18, true, 1.2);
    writing(S, 146, 132, 200, 1, 10, { h: 3.4, step: 4, last: 1 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) if (r < 2 || c < 3) writing(S, 62 + c * 82, 182 + r * 40, 60, 1, 10, { h: 4.6, step: 5.2, last: 1, slant: 0.1 });
    // visa de la receveuse et cachet du bureau
    signature(S, 380, 350, 130, { h: 12, cls: 'ink-soft' });
    stamp(S, 160, 346, ['Vernezac', '10-1 76'], { rot: -4, w: 92, round: true, size: 10 });
    return S;
  },

  /* ── EX-02 : planche comparative des T majuscules (A 1937 contre B–E, 1953–1976) ── */
  'ex-02'(id) {
    const S = new Scene(id, 600, 460, 'color');
    S.p('paper', rect(0, 0, 600, 460));
    S.ln(rect(10, 10, 580, 440), 0.8, 'ink');
    const cell = (x, y, w, h, loop, label, o = {}) => {
      S.p('paper-shade', rect(x, y, w, h), { opacity: 0.4 });
      S.ln(rect(x, y, w, h), 0.8, 'ink-soft');
      const th = o.th ?? 80;
      const tx = x + (o.tx ?? w * 0.32);
      const ty = y + 30;
      // B : amorce d'une barre droite interrompue au tiers, recouverte par la boucle
      if (o.restart) S.ln(`M${f(tx - th * 0.7 * 0.5)} ${f(ty + th * 0.07)}L${f(tx - th * 0.7 * 0.15)} ${f(ty + th * 0.06)}`, 1.6, 'ink-soft');
      capT(S, tx, ty, th, loop, o.sw ?? 2.6, o.cls ?? 'ink');
      if (o.pre) S.push(`<text class="label-note" x="${f(tx - th * 0.42)}" y="${f(ty + th * 0.92)}" text-anchor="end" font-size="${f(th * 0.62)}" font-style="normal">${o.pre}</text>`);
      if (o.caps) S.push(`<text class="label-note" x="${f(tx + th * 0.42)}" y="${f(ty + th * 0.92)}" font-size="${f(th * 0.62)}" font-style="normal">${o.caps}</text>`);
      else S.ln(handLines(S.r, tx + th * 0.45, ty + th * 0.92, w - (tx - x) - th * 0.6, 1, 10, { slant: 0.5, h: th * 0.1, step: th * 0.1, last: 1 }), 1.4, o.cls ?? 'ink');
      caption(S, x + w / 2, y + h + 20, label, 12);
    };
    // A : le billet de 1937, au crayon (barre droite détachée)
    cell(30, 34, 260, 160, false, 'A — billet au crayon, 1.12.1937', { cls: 'ink-soft', sw: 2.2, th: 90 });
    S.push('<text class="label-note" x="440" y="100" text-anchor="middle" font-size="13">A contre B – E</text>');
    S.ln('M330 112H550', 0.6, 'ink-faint');
    // B à E : la boucle thalbère
    const cw = 126;
    cell(30, 250, cw, 150, true, 'B — 12.1.1976', { restart: true, th: 70 });
    cell(30 + (cw + 12), 250, cw, 150, true, 'C — 13.1 / 5.2.1976', { th: 70 });
    cell(30 + 2 * (cw + 12), 250, cw, 150, true, 'D — 3.6.1953', { th: 70 });
    cell(30 + 3 * (cw + 12), 250, cw, 150, true, 'E — 10.1.1976', { th: 60, tx: 52, pre: 'S', caps: 'OP', sw: 2.4 });
    return S;
  },

  /* ── EX-03 : planche comparative, trois oreilles droites (I 38-0377, II 41-1987, III négatif 1976) ── */
  'ex-03'(id) {
    const S = new Scene(id, 660, 400, 'photo');
    S.p('paper', rect(0, 0, 660, 400));
    S.ln(rect(10, 10, 640, 380), 0.8, 'ink');
    // I : lobe détaché, anthélix en arc simple, tragus pointu, hauteur moyenne, hélix régulier.
    // II et III : lobe adhérent, anthélix en Y, tragus bas et arrondi, oreille plus haute,
    // encoche de l'hélix au tiers supérieur (même point).
    const ear = (x, y, I, label, neg) => {
      const fr = rect(x, y, 190, 270);
      S.p(neg ? 'photo-dark' : 'photo-light', fr);
      S.ln(fr, 0.8, 'ink-soft');
      const cx = x + 95;
      const cy = y + 122;
      const k = I ? 0.88 : 1; // hauteur relative
      const Q = (u, v) => [cx + u, cy + v * k];
      const rim = I
        ? [Q(-20, -90), Q(30, -92), Q(58, -50), Q(56, 10), Q(34, 56), Q(30, 92), Q(4, 112), Q(-18, 96), Q(-14, 70), Q(-28, 40), Q(-44, -20), Q(-40, -70)]
        : [Q(-20, -90), Q(30, -92), Q(58, -50), Q(60, -36), [...Q(46, -27), 1], Q(58, -16), Q(56, 10), Q(34, 56), Q(18, 92), [...Q(-30, 104), 1], Q(-30, 40), Q(-44, -20), Q(-40, -70)];
      const outer = smooth(rim, true);
      S.p(neg ? 'photo-mid' : 'photo-paper', outer);
      S.ln(outer, 1.4, 'ink-soft');
      const line = 'ink-soft';
      if (!I) S.ln(`M${f(Q(-30, 104)[0])} ${f(Q(-30, 104)[1])}L${f(Q(-60, 130)[0])} ${f(Q(-60, 130)[1])}`, 1.2, line);
      else S.ln(`M${f(Q(-14, 70)[0])} ${f(Q(-14, 70)[1])}Q${f(Q(-24, 76)[0])} ${f(Q(-24, 76)[1])} ${f(Q(-40, 72)[0])} ${f(Q(-40, 72)[1])}`, 1.2, line);
      // hélix (ourlet intérieur), interrompu à l'encoche pour II et III
      const helix = I
        ? smooth([Q(-26, -72), Q(26, -76), Q(44, -44), Q(40, 4), Q(22, 40)])
        : smooth([Q(-26, -72), Q(26, -76), Q(44, -44)]) + smooth([Q(44, -12), Q(40, 4), Q(22, 40)]);
      // anthélix : arc simple (I) ou bifurqué en Y, branche supérieure épaisse (II, III)
      const anth = I
        ? `M${f(Q(20, 36)[0])} ${f(Q(20, 36)[1])}Q${f(Q(2, -10)[0])} ${f(Q(2, -10)[1])} ${f(Q(-6, -50)[0])} ${f(Q(-6, -50)[1])}`
        : `M${f(Q(20, 36)[0])} ${f(Q(20, 36)[1])}Q${f(Q(4, -10)[0])} ${f(Q(4, -10)[1])} ${f(Q(8, -40)[0])} ${f(Q(8, -40)[1])}`;
      S.ln(helix + anth, 1.1, line);
      if (!I) S.ln(`M${f(Q(6, -16)[0])} ${f(Q(6, -16)[1])}Q${f(Q(-8, -40)[0])} ${f(Q(-8, -40)[1])} ${f(Q(-18, -52)[0])} ${f(Q(-18, -52)[1])}`, 2.6, line);
      const conch = ell(cx - 4, cy + 18 * k, 16, 24 * k);
      S.p(neg ? 'photo-light' : 'photo-mid', conch);
      S.ln(conch, 0.8, line);
      // tragus : pointu et saillant (I), bas et arrondi (II, III)
      const tr = I
        ? `M${f(Q(-26, 2)[0])} ${f(Q(-26, 2)[1])}L${f(Q(-40, 14)[0])} ${f(Q(-40, 14)[1])}L${f(Q(-26, 26)[0])} ${f(Q(-26, 26)[1])}`
        : `M${f(Q(-26, 20)[0])} ${f(Q(-26, 20)[1])}Q${f(Q(-40, 30)[0])} ${f(Q(-40, 30)[1])} ${f(Q(-26, 42)[0])} ${f(Q(-26, 42)[1])}`;
      S.ln(tr, 1.3, line);
      // repères numérotés : 1 hélix (tiers supérieur), 2 anthélix, 3 tragus, 4 lobe
      const marks = [
        [...Q(50, -28), '1'],
        [...Q(12, -10), '2'],
        [...(I ? Q(-38, 14) : Q(-36, 30)), '3'],
        [...(I ? Q(6, 104) : Q(-24, 100)), '4'],
      ];
      for (const [mx, my, n] of marks) {
        S.ln(`M${f(mx)} ${f(my)}L${x + 176} ${f(my)}`, 0.5, 'ink-faint');
        S.push(`<text class="label-note" x="${x + 182}" y="${f(my + 4)}" font-size="11" font-style="normal">${n}</text>`);
      }
      caption(S, x + 95, y + 296, label, 12);
    };
    ear(30, 30, true, 'I — 38-0377 (1938)', false);
    ear(235, 30, false, 'II — 41-1987 (1941)', false);
    ear(440, 30, false, 'III — négatif du 9.1.76', true);
    return S;
  },

  /* ── EX-04 : planche comparative, feuilles de laurier gravées (1941, 1959, 1974 ; 1925) ── */
  'ex-04'(id) {
    const S = new Scene(id, 660, 400, 'photo');
    S.p('paper', rect(0, 0, 660, 400));
    S.ln(rect(10, 10, 640, 380), 0.8, 'ink');
    const leafCell = (x, y, label, flick, k) => {
      const fr = rect(x, y, 140, 300);
      S.p('photo-dark', fr);
      S.ln(fr, 0.8, 'ink-soft');
      const cx = x + 70;
      const top = y + 50 + k * 4;
      const bot = y + 240;
      const w = 30 + (k % 2) * 4;
      const leaf = smooth([[cx, bot, 1], [cx - w, lerp(bot, top, 0.45)], [cx - w * 0.4, lerp(bot, top, 0.85)], [cx + (flick ? -10 : 0), top, 1], [cx + w * 0.5, lerp(bot, top, 0.8)], [cx + w, lerp(bot, top, 0.4)]], true);
      S.p('photo-light', leaf, { opacity: 0.85 });
      S.ln(leaf, 1, 'ink-soft');
      let veins = `M${cx} ${bot}Q${cx + 2} ${lerp(bot, top, 0.5)} ${cx + (flick ? -8 : 0)} ${top + 4}`;
      for (let i = 1; i < 7; i++) {
        const yy = lerp(bot, top, i / 7.5);
        veins += `M${cx} ${f(yy)}l${-w * 0.6} ${-14}M${cx} ${f(yy)}l${w * 0.6} ${-14}`;
      }
      S.ln(veins, 0.7, 'ink-faint');
      // le coup de pointe final, à gauche de la pointe
      if (flick) S.ln(`M${cx - 10} ${top}l-12 -10`, 1.6, 'ink-soft');
      caption(S, x + 70, y + 324, label, 13);
    };
    leafCell(30, 30, '1941', true, 0);
    leafCell(186, 30, '1959', true, 1);
    leafCell(342, 30, '1974', true, 2);
    S.ln('M486 40V360', 0.8, 'ink-faint', { 'stroke-dasharray': '4 4' });
    leafCell(500, 30, '1925', false, 3);
    return S;
  },
};
