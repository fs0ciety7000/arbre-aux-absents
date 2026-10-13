/**
 * Presse, cartes postales, catalogues, affiches, objets et papier (séries PR, CP, CT, PB, DV, LT) :
 * docs/scenario/illustrations-presse-divers.md et illustrations-rg-lt.md.
 *
 * Convention du papier Varenque (partagée avec lt-15) : toute fougère VENDUE porte sous la tige
 * le bloc millésime + « PV » (traits illisibles) ; seule la fougère du réseau n'a rien.
 */
import { Scene, foliage, crowd, lighthouse, reefs, waterLines, printBlock, headline, fern } from './kit.mjs';
import { fam, person, extra } from './fam.mjs';
import { hand } from './people.mjs';
import { arm } from './scenes-photo.mjs';
import { rect, ell, circ, smooth, poly, tube, f, lerp, handLines } from './lib.mjs';

/** Fougère filigranée (claire) ; `sold` ajoute le bloc millésime + PV sous la tige. */
function watermark(S, x, y, len, { sold = true, cls = 'rehaut', angle = 0, pairs = 11, line = 'ink-faint' } = {}) {
  const fr = fern(x, y, len, { angle, pairs, spread: 0.42 });
  S.p(cls, fr.pinnae.join(''));
  S.p(cls, tube([[x, y], [fr.tip[0], fr.tip[1]]], len * 0.025, len * 0.012));
  S.ln(fr.pinnae.join('') + fr.stem, 0.5, line);
  if (sold) {
    // millésime et initiales, illisibles à cette taille
    const bx = x - len * 0.16;
    const by = y + len * 0.08;
    S.p(cls, rect(bx, by, len * 0.32, len * 0.12));
    S.ln(`M${f(bx + len * 0.03)} ${f(by + len * 0.06)}h${f(len * 0.1)}m${f(len * 0.05)} 0h${f(len * 0.1)}`, Math.max(0.5, len * 0.03), line, { 'stroke-linecap': 'butt' });
  }
  return fr;
}

/** Écriture claire sur fond sombre (négatif) : petits traits pleins. */
function lightWriting(S, x, y, w, n, lh, cls = 'photo-light') {
  const r = S.r;
  let d = '';
  for (let i = 0; i < n; i++) {
    let cx = x + r.range(0, 4);
    const yy = y + i * lh;
    while (cx < x + w - 6) {
      const ww = r.range(5, 16);
      const pts = [];
      for (let k = 0; k <= ww / 2; k++) pts.push([cx + k * 2, yy + (k % 2 ? -lh * 0.28 : 0) + r.jit(0.3)]);
      d += tube(pts, 0.9, 0.9);
      cx += ww + r.range(2, 5);
    }
  }
  S.p(cls, d);
}

/** Cadre de colonne de journal (filet). */
function column(S, w, h) {
  S.p('paper', rect(0, 0, w, h));
  S.ln(rect(4, 4, w - 8, h - 8), 0.8, 'ink');
}

/** Photo de presse tramée : rectangle et trame. */
function pressPhoto(S, d, base, fn, op = 0.45) {
  S.within(d, () => {
    S.p(base, d);
    fn();
    S.stip(d, { opacity: op });
  });
  S.ln(d, 0.8, 'ink');
}

/** Pierres tombales et croix. */
function graves(S, x0, x1, y, n, h) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + 0.5) / n);
    if (i % 3 === 1) d += `M${x - 1.5} ${y}v${-h}h3v${h}ZM${x - h * 0.3} ${y - h * 0.7}h${h * 0.6}v3h${-h * 0.6}Z`;
    else d += `M${x - h * 0.3} ${y}v${-h * 0.7}q${h * 0.3} ${-h * 0.4} ${h * 0.6} 0v${h * 0.7}Z`;
  }
  return d;
}

export const SCENES = {
  /* ── PR-01 : Médaille d'or de la Grande Exposition, 1889 (vignette gravée) ── */
  'pr-01'(id) {
    const S = new Scene(id, 450, 300, 'engr');
    column(S, 450, 300);
    // avers de la médaille : profil couronné sans détail, bordure de lauriers
    S.p('paper', circ(110, 150, 86));
    S.hat(circ(110, 150, 86));
    S.p('paper', circ(110, 150, 66));
    S.ln(circ(110, 150, 86) + circ(110, 150, 66), 1.2, 'ink');
    let laurel = '';
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const x = 110 + Math.cos(a) * 76;
      const y = 150 + Math.sin(a) * 76;
      laurel += smooth([[x, y], [x + Math.cos(a + 1.6) * 7 + Math.cos(a) * 3, y + Math.sin(a + 1.6) * 7 + Math.sin(a) * 3], [x + Math.cos(a + 1.6) * 12, y + Math.sin(a + 1.6) * 12]]);
    }
    S.ln(laurel, 1, 'ink-soft');
    const prof = smooth([[96, 214], [92, 190], [80, 174], [84, 160], [76, 150], [82, 146], [80, 130], [88, 112], [104, 98], [126, 100], [138, 120], [140, 150], [134, 172], [130, 214]], true);
    S.p('paper', prof);
    S.hat(prof);
    S.ln(prof, 1.1, 'ink');
    // couronne de laurier sur la tête
    let cr = '';
    for (let i = 0; i < 7; i++) cr += `M${92 + i * 6} ${110 - Math.sin(i / 2) * 4}l3 -6l3 6`;
    S.ln(cr, 0.9, 'ink');
    // la feuille devant la lampe à huile
    const lamp = smooth([[352, 270], [346, 236], [360, 220], [384, 220], [398, 236], [392, 270]], true);
    S.p('paper', lamp);
    S.hat(lamp);
    S.ln(lamp + 'M372 220V200', 1, 'ink');
    S.p('paper', ell(372, 186, 10, 18));
    S.ln(ell(372, 186, 10, 18), 0.8, 'ink');
    let glow = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      glow += `M${f(372 + Math.cos(a) * 26)} ${f(186 + Math.sin(a) * 26)}l${f(Math.cos(a) * 14)} ${f(Math.sin(a) * 14)}`;
    }
    S.ln(glow, 0.6, 'ink-faint');
    const sheet = poly([[226, 40], [356, 50], [350, 260], [218, 252]], true);
    S.p('paper', sheet);
    S.hatd(sheet, { opacity: 0.35 });
    // la fronde en clair : tige droite, onze paires, bloc millésime + PV sous la tige
    watermark(S, 286, 210, 140, { angle: 2, pairs: 11, cls: 'paper', line: 'ink-soft' });
    S.ln(sheet, 1.2, 'ink');
    // main anonyme, manchette de redingote
    const cuff = poly([[180, 300], [190, 236], [226, 232], [232, 300]], true);
    S.p('paper', cuff);
    S.hatd(cuff);
    S.ln(cuff, 1, 'ink');
    S.p('paper', rect(194, 226, 32, 12));
    S.ln(rect(194, 226, 32, 12), 0.8, 'ink');
    hand(S, 212, 228, 170, 5, {}, (v) => v);
    return S;
  },

  /* ── PR-02 : Le capitaine Firmin Varenque, 1902 (médaillon gravé) ── */
  'pr-02'(id) {
    const S = new Scene(id, 320, 400, 'engr');
    column(S, 320, 400);
    const ov = ell(160, 200, 132, 176);
    S.p('paper', ov);
    S.within(ov, () => {
      S.hatd(ov);
      fam(S, 'firmin-varenque-1849', 46, 18, 34, 1.8, { mode: 'engr', clip: true });
    });
    S.ln(ov, 2, 'ink');
    S.ln(ell(160, 200, 138, 182), 0.8, 'ink-soft');
    return S;
  },

  /* ── PR-05 : Le phare de Tennok dans la tempête, 1924 (gravure) ── */
  'pr-05'(id) {
    const S = new Scene(id, 320, 480, 'engr');
    column(S, 320, 480);
    const pd = rect(14, 14, 292, 452);
    S.within(pd, () => {
      S.hat(pd);
      // faisceau en éventail
      S.p('paper', poly([[190, 120], [306, 40], [306, 160]], true));
      S.p('paper', poly([[190, 120], [14, 60], [14, 150]], true));
      // cap rocheux
      const cape = smooth([[120, 300], [150, 260], [240, 250], [306, 270], [306, 360], [100, 360]], true);
      S.p('paper', cape);
      S.hatd(cape);
      S.ln(cape, 1, 'ink');
      lighthouse(S, 190, 262, 160, { band: 'hatch', wBase: 0.2, wTop: 0.14, line: 1.2 });
      // mer
      S.p('paper', rect(14, 330, 292, 140));
      waterLines(S, 14, 336, 306, 466, { sp: 5, cls: 'ink-soft', w: 0.7 });
      // petite coque couchée au loin
      S.p('paper', smooth([[40, 328], [70, 316], [84, 324], [60, 334]], true));
      S.ln(smooth([[40, 328], [70, 316], [84, 324], [60, 334]], true) + 'M64 322l-10 -18', 0.9, 'ink');
      // les Dents de Tennok dans l'écume
      reefs(S, 14, 306, 440, 50, 7, { tone: 'dark' });
      // pluie oblique
      let rain = '';
      for (let i = 0; i < 180; i++) {
        const x = 14 + S.r() * 320;
        const y = 14 + S.r() * 452;
        rain += `M${f(x)} ${f(y)}l-6 16`;
      }
      S.ln(rain, 0.5, 'ink-soft');
    });
    S.ln(pd, 1.4, 'ink');
    return S;
  },

  /* ── PR-06 : Blanche Aubertine dans La Lanterne d'Ostrie, 1929 ── */
  'pr-06'(id) {
    const S = new Scene(id, 340, 460, 'photo');
    S.p('paper', rect(0, 0, 340, 460));
    const pd = rect(12, 12, 316, 436);
    pressPhoto(S, pd, 'photo-dark', () => {
      S.fill(ell(170, 200, 160, 240), 'mid', { opacity: 0.8 });
      const bl = person(S, 'blanche-varenque', 28, 60, 60, 1.05, { patch: { hands: [], mouth: { smile: 0.2, teeth: true }, extras: [{ type: 'pearls', n: 17, dy: 2, sag: 9 }] }, lower: { kind: 'skirt', tone: 'mid', arms: 'left' } });
      // paillettes
      let sq = '';
      for (let i = 0; i < 80; i++) sq += circ(80 + S.r() * 170, 280 + S.r() * 170, 1);
      S.fill(sq, 'paper');
      // lanterne de marin allumée, à bout de bras
      arm(S, [[bl.fx + 70, bl.fy + 120], [bl.fx + 120, bl.fy + 80], [bl.fx + 150, bl.fy + 30]], 20, 'mid', { skin: 2, size: 3.4, ang: 190 });
      const lx = bl.fx + 150;
      const ly = bl.fy + 30;
      S.fill(circ(lx, ly + 34, 40), 'paper', { opacity: 0.5 });
      const lt = rect(lx - 16, ly + 14, 32, 44);
      S.fill(lt, 'paper');
      S.ln(lt + `M${lx - 18} ${ly + 14}h36M${lx - 18} ${ly + 58}h36M${lx - 8} ${ly + 14}q8 -16 16 0M${lx} ${ly + 14}v44`, 1.4, 'ink');
    });
    return S;
  },

  /* ── PR-08 : Le commissaire et le directeur, 1938 ── */
  'pr-08'(id) {
    const S = new Scene(id, 520, 360, 'photo');
    S.p('paper', rect(0, 0, 520, 360));
    const pd = rect(12, 12, 496, 336);
    pressPhoto(S, pd, 'photo-light', () => {
      // drapeau à plis
      const fl = smooth([[150, 12], [370, 12], [380, 200], [140, 210]], true);
      S.fill(fl, 'mid');
      let folds = '';
      for (let i = 0; i < 9; i++) folds += `M${160 + i * 24} 12q${i % 2 ? 8 : -8} 100 0 196`;
      S.ln(folds, 2.4, 'ink-faint');
      S.fill(rect(150, 90, 230, 40), 'dark', { opacity: 0.5 });
      // table couverte de piles de petits carnets gris
      const tb = rect(12, 270, 496, 80);
      S.fill(tb, 'dark');
      let nb = '';
      for (let p = 0; p < 9; p++) for (let k = 0; k < 5; k++) nb += rect(140 + p * 30 + (k % 2) * 2, 266 - k * 5, 24, 5);
      S.fill(nb, 'light');
      S.ln(nb, 0.5, 'ink-soft');
      const mc = person(S, 'marcel-daubry', 41, 20, 50, 0.95, { lower: { kind: 'stand', hatch: true, arms: 'none' } });
      // écharpe grise de fonction en sautoir
      S.fill(poly([[mc.fx - 66, mc.fy + 66], [mc.fx - 48, mc.fy + 60], [mc.fx + 60, mc.fy + 210], [mc.fx + 40, mc.fy + 220]], true), 'light', { opacity: 0.9 });
      // carnet ouvert dans la main droite
      const cb = poly([[mc.fx + 60, mc.fy + 150], [mc.fx + 96, mc.fy + 140], [mc.fx + 130, mc.fy + 152], [mc.fx + 128, mc.fy + 186], [mc.fx + 96, mc.fy + 176], [mc.fx + 62, mc.fy + 186]], true);
      S.fill(cb, 'paper');
      S.ln(cb + `M${mc.fx + 96} ${mc.fy + 140}v36`, 0.8, 'ink-soft');
      person(S, 'gaspard-varenque', 39, 300, 62, 0.92, { patch: { slouch: 0.4, eyes: { gaze: -0.6 } }, lower: { kind: 'stand', hatch: true } });
    }, 0.5);
    return S;
  },

  /* ── PR-09 : Le moulin de la Sorbe après la rafle, 1941 ── */
  'pr-09'(id) {
    const S = new Scene(id, 520, 360, 'photo');
    S.p('paper', rect(0, 0, 520, 360));
    const pd = rect(12, 12, 496, 336);
    pressPhoto(S, pd, 'photo-dark', () => {
      // toit crevé : lumière
      S.fill(poly([[200, 12], [330, 12], [380, 348], [150, 348]], true), 'mid', { opacity: 0.8 });
      S.fill(poly([[230, 12], [300, 12], [330, 348], [200, 348]], true), 'light', { opacity: 0.6 });
      // fenêtres sans vitres, hêtres derrière
      for (const x of [40, 420]) {
        const w = rect(x, 60, 56, 90);
        S.fill(w, 'light');
        S.within(w, () => foliage(S, x + 28, 100, 40, 40, { tone: 'mid' }));
        S.ln(w, 1.6, 'ink-soft');
      }
      // poutres effondrées
      S.fill(poly([[12, 40], [508, 30], [508, 44], [12, 54]], true), 'dark');
      S.fill(poly([[120, 40], [140, 36], [330, 300], [310, 306]], true), 'dark');
      S.ln('M120 40L310 306M140 36L330 300', 1, 'ink-soft');
      // cuve de pierre, presse à bras renversée, feuilles éparses
      const vat = rect(60, 250, 110, 60);
      S.fill(vat, 'mid');
      S.ln(vat, 1, 'ink-soft');
      const pr = poly([[300, 300], [380, 270], [400, 300], [320, 330]], true);
      S.fill(pr, 'dark');
      S.ln(pr + 'M350 284l40 -50M386 230l20 10M330 320l-20 20', 2, 'ink-soft');
      S.fill(circ(340, 300, 10), 'mid');
      let sh = '';
      for (let i = 0; i < 26; i++) {
        const x = 30 + S.r() * 460;
        const y = 300 + S.r() * 44;
        const a = S.r() * 3;
        sh += poly([[x, y], [x + 16 * Math.cos(a), y + 6 * Math.sin(a)], [x + 16 * Math.cos(a) - 6 * Math.sin(a), y + 6 * Math.sin(a) + 8], [x - 6 * Math.sin(a), y + 8]], true);
      }
      S.fill(sh, 'paper');
      // deux gardes en capote et calot, de dos, portant des cartons
      for (const [x, s] of [[200, 1], [430, 0.8]]) {
        const top = 340 - 230 * s;
        const coat = smooth([[x - 34 * s, top + 50 * s], [x - 44 * s, 334], [x + 44 * s, 334], [x + 34 * s, top + 50 * s], [x, top + 40 * s]], true);
        S.fill(coat, 'dark');
        S.ln(coat + `M${x} ${top + 60 * s}V334`, 0.8, 'ink-soft');
        // tête de dos : nuque et calot, aucun visage
        S.fill(ell(x, top + 22 * s, 15 * s, 19 * s), 'mid');
        S.fill(ell(x, top + 30 * s, 13 * s, 10 * s), 'dark', { opacity: 0.6 });
        S.fill(smooth([[x - 15 * s, top + 10 * s], [x, top - 4 * s], [x + 15 * s, top + 10 * s]], true), 'dark');
        const box = rect(x - 30 * s, top + 70 * s, 60 * s, 46 * s);
        S.fill(box, 'light');
        S.ln(box, 0.8, 'ink-soft');
        S.black(ell(x - 12 * s, 332, 8 * s, 3) + ell(x + 12 * s, 332, 8 * s, 3));
      }
    }, 0.55);
    return S;
  },

  /* ── PR-10 : « Les familles d'ordre accueillent les pupilles », 1942 ── */
  'pr-10'(id) {
    const S = new Scene(id, 420, 360, 'photo');
    S.p('paper', rect(0, 0, 420, 360));
    // trame grossière (points de 2,5 fois la trame commune)
    const coarse = S.uid('t');
    S.defs.push(`<pattern id="${coarse}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle class="stipple" cx="2.5" cy="2.5" r="1.7"/><circle class="stipple" cx="7" cy="7" r="1.3"/></pattern>`);
    const pd = rect(12, 12, 396, 336);
    S.within(pd, () => {
      S.p('photo-light', pd);
      // perron d'immeuble bourgeois : porte, pilastres, marches
      S.fill(rect(150, 12, 130, 230), 'mid');
      S.fill(rect(120, 12, 26, 236) + rect(284, 12, 26, 236), 'paper');
      S.ln('M150 12v230M280 12v230', 1.2, 'ink-soft');
      for (let i = 0; i < 5; i++) S.fill(rect(70 - i * 14, 242 + i * 22, 290 + i * 28, 22), i % 2 ? 'light' : 'mid');
      // le couple : visages noyés sous les bords des chapeaux (aucun trait lisible)
      const fig = (x, w, top, hatW, tone) => {
        const body = smooth([[x - w, 348], [x - w * 1.02, top + 70], [x - w * 0.6, top + 44], [x + w * 0.6, top + 44], [x + w * 1.02, top + 70], [x + w, 348]], true);
        S.fill(body, tone);
        S.fill(rect(x - 6, top + 30, 12, 16), 'mid');
        S.fill(ell(x, top + 20, 15, 20), 'mid');
        S.fill(ell(x, top + 14, 17, 15), 'dark', { opacity: 0.8 });
        S.fill(ell(x, top - 2, hatW, 6) + ell(x, top - 8, hatW * 0.6, 10), 'dark');
      };
      fig(176, 44, 70, 32, 'dark');
      fig(262, 38, 84, 26, 'mid');
      // nourrisson emmailloté dans un châle blanc : visage rond sans trait, bonnet sur le front
      S.fill(smooth([[226, 168], [262, 150], [298, 168], [288, 222], [236, 226]], true), 'paper');
      S.fill(circ(250, 172, 11), 'light');
      S.fill(smooth([[238, 166], [250, 156], [264, 164], [262, 170], [240, 172]], true), 'paper');
      // encrage irrégulier et flou de bougé
      S.push(`<path fill="url(#${coarse})" opacity="0.75" d="${pd}"/>`);
      S.fill(ell(130, 300, 120, 50), 'dark', { opacity: 0.15 });
    });
    S.ln(pd, 0.8, 'ink');
    return S;
  },

  /* ── PR-11 : Portrait gravé sur bois d'« Augustin V. », 1944 ── */
  'pr-11'(id) {
    const S = new Scene(id, 320, 320, 'engr');
    S.p('paper', rect(0, 0, 320, 320));
    // bloc encré, bords irréguliers
    let blk = 'M24 30';
    for (let i = 1; i <= 12; i++) blk += `L${24 + i * 22.6 + S.r.jit(2)} ${30 + S.r.jit(3)}`;
    for (let i = 1; i <= 12; i++) blk += `L${296 + S.r.jit(3)} ${30 + i * 22 + S.r.jit(2)}`;
    for (let i = 1; i <= 12; i++) blk += `L${296 - i * 22.6 + S.r.jit(2)} ${294 + S.r.jit(3)}`;
    blk += 'Z';
    S.black(blk);
    S.within(blk, () => {
      // tailles blanches rayonnantes dans le fond
      let cuts = '';
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        cuts += tube([[160 + Math.cos(a) * 120, 150 + Math.sin(a) * 120], [160 + Math.cos(a) * 200, 150 + Math.sin(a) * 200]], 0.6, 2.6);
      }
      S.p('paper', cuts);
      fam(S, 'augustin-varenque-1924', 20, 34, 6, 1.6, { mode: 'engr', clip: true });
    });
    return S;
  },

  /* ── PR-12 : Gaspard Varenque acquitté, 1953 (flash, de nuit) ── */
  'pr-12'(id) {
    const S = new Scene(id, 480, 360, 'photo');
    S.p('paper', rect(0, 0, 480, 360));
    const pd = rect(12, 12, 456, 336);
    pressPhoto(S, pd, 'photo-dark', () => {
      // colonnes, grand escalier éclairé au flash
      for (const x of [40, 110, 370, 440]) {
        S.fill(rect(x - 14, 12, 28, 200), 'mid');
        S.ln(`M${x - 8} 12v200M${x + 6} 12v200`, 0.6, 'ink-faint');
      }
      for (let i = 0; i < 8; i++) {
        const st = rect(12, 200 + i * 20, 456, 20);
        S.fill(st, i % 2 ? 'light' : 'mid');
        S.ln(`M12 ${200 + i * 20}H468`, 0.6, 'ink-soft');
      }
      // deux rangs de curieux flous
      crowd(S, 14, 170, 160, 6, 22, { rows: 3, hats: 0.6 });
      crowd(S, 310, 466, 160, 6, 22, { rows: 3, hats: 0.6 });
      const ga = person(S, 'gaspard-varenque', 54, 168, 60, 0.82, { patch: { hands: [], slouch: 0.5, mouth: { smile: 0 } }, lower: { kind: 'stand', hatch: true, arms: 'left' } });
      // chapeau à la main
      S.fill(ell(ga.fx - 50, ga.fy + 230, 26, 10) + ell(ga.fx - 50, ga.fy + 220, 15, 12), 'dark');
      S.ln(ell(ga.fx - 50, ga.fy + 230, 26, 10), 0.8, 'ink-soft');
    }, 0.45);
    return S;
  },

  /* ── PR-13 : « Le Goéland, 1951 », planche de Nora Ilvess ── */
  'pr-13'(id) {
    const S = new Scene(id, 360, 440, 'photo');
    S.p('paper', rect(0, 0, 360, 440));
    const pd = rect(16, 16, 328, 408);
    pressPhoto(S, pd, 'photo-dark', () => {
      const fi = person(S, 'firmin-varenque-1900', 51, 6, 30, 1.6, { patch: { mouth: { smile: 1, teeth: true }, eyes: { lid: 0.5 } }, lower: { kind: 'stand', zigzag: true, arms: 'none' } });
      void fi;
      // la barre : rayons d'une roue de gouvernail, main posée
      S.ln('M250 424L340 300M230 380L360 380M300 330L280 424', 5, 'ink');
      S.fill(circ(300, 380, 14), 'mid');
      // lumière latérale : la moitié droite dans le noir
      S.fill(poly([[230, 16], [344, 16], [344, 424], [270, 424]], true), 'dark', { opacity: 0.55 });
    }, 0.25);
    return S;
  },

  /* ── PR-15 : Victor Sauge ; ses obsèques, 1966 ── */
  'pr-15'(id) {
    const S = new Scene(id, 580, 340, 'photo');
    S.p('paper', rect(0, 0, 580, 340));
    S.ln(rect(6, 6, 568, 328), 0.8, 'ink');
    const p1 = rect(18, 40, 190, 250);
    pressPhoto(S, p1, 'photo-light', () => {
      S.fill(rect(18, 200, 190, 90), 'mid');
      S.ln('M18 210H208', 0.8, 'ink-soft');
      person(S, 'victor-sauge', 54, 20, 52, 0.98, { patch: { hat: null, hairStyle: 'short', hair: 'gris' }, lower: { kind: 'stand', arms: 'none' } });
    });
    const p2 = rect(222, 18, 340, 304);
    pressPhoto(S, p2, 'photo-light', () => {
      S.fill(graves(S, 230, 560, 150, 12, 40), 'mid');
      S.fill(rect(222, 150, 340, 172), 'paper');
      crowd(S, 230, 560, 110, 10, 18, { tone: 'dark', hats: 0.4 });
      // neige
      let sn = '';
      for (let i = 0; i < 120; i++) sn += circ(222 + S.r() * 340, 18 + S.r() * 300, 0.8 + S.r());
      const ni = person(S, 'ninon-brial', 53, 250, 50, 0.82, { patch: { hat: { type: 'turban', cls: 'hair-noir' }, hands: [] }, lower: { kind: 'skirt', tone: 'dark' } });
      person(S, 'claude-sauge', 27, 400, 56, 0.8, { patch: { hands: [] }, lower: { kind: 'stand', tone: 'dark', arms: 'right' } });
      // elle soutient sa mère par le bras
      arm(S, [[ni.fx + 216, ni.fy + 80], [ni.fx + 160, ni.fy + 140], [ni.fx + 104, ni.fy + 150]], 18, 'dark', { skin: 2, size: 3, ang: 90 });
      S.fill(sn, 'paper');
    });
    return S;
  },

  /* ── PR-16 : Photo de signature de Paul Marsal, 1968 ── */
  'pr-16'(id) {
    const S = new Scene(id, 260, 260, 'photo');
    S.p('paper', rect(0, 0, 260, 260));
    const pd = rect(12, 12, 236, 236);
    pressPhoto(S, pd, 'photo-light', () => {
      person(S, 'paul-marsal', 39, 10, 12, 1.42, { lower: false });
    }, 0.5);
    return S;
  },

  /* ── PR-17 : Les obsèques de Gaspard Varenque, 1971 ── */
  'pr-17'(id) {
    const S = new Scene(id, 560, 360, 'photo');
    S.p('paper', rect(0, 0, 560, 360));
    const pd = rect(12, 12, 536, 336);
    pressPhoto(S, pd, 'photo-light', () => {
      // allée sous les tilleuls (premiers tons de couleur, très légers)
      foliage(S, 120, 50, 160, 70, { tone: 'mid' });
      foliage(S, 440, 40, 170, 70, { tone: 'mid' });
      S.p('wash-sauge', rect(12, 12, 536, 110), { opacity: 0.35 });
      S.fill(rect(12, 120, 536, 228), 'light');
      S.p('wash-ardoise', poly([[200, 348], [260, 130], [300, 130], [400, 348]], true), { opacity: 0.45 });
      S.fill(graves(S, 20, 200, 200, 6, 40) + graves(S, 380, 540, 200, 5, 40), 'mid');
      // ouvriers en haie, casquette à la main, flous au fond
      crowd(S, 300, 540, 140, 9, 16, { hats: 0, tone: 'dark' });
      // vieille dame à canne, floue au fond
      S.fill(smooth([[330, 230], [336, 160], [350, 150], [362, 160], [366, 230]], true), 'dark', { opacity: 0.5 });
      S.fill(circ(348, 146, 7), 'mid', { opacity: 0.6 });
      S.ln('M368 180L372 232', 1, 'ink-faint');
      // le cercueil sort du cadre à gauche
      S.fill(poly([[12, 170], [80, 176], [76, 214], [12, 212]], true), 'dark');
      person(S, 'paul-marsal', 43, 300, 70, 0.56, { patch: { mouth: { pipe: false }, clothes: { type: 'coat', wash: 'wash-ardoise', collar: 'turn', tie: 'tie' } }, lower: { kind: 'stand', tone: 'light' } });
      person(S, 'armand-varenque', 44, 60, 64, 0.72, { lower: { kind: 'stand', hatch: true } });
      person(S, 'helene-varenque', 40, 180, 80, 0.66, { lower: { kind: 'skirt', hatch: true } });
    }, 0.3);
    return S;
  },

  /* ── CP-01 : Aubrelieu, place de la Charte et colonne Morel, 1905 ── */
  'cp-01'(id) {
    const S = new Scene(id, 540, 350, 'color');
    S.p('paper', rect(0, 0, 540, 350));
    const pd = rect(12, 12, 516, 300);
    S.within(pd, () => {
      // façades à balcons (lavis safran), pavés (ardoise)
      const fac = rect(12, 30, 516, 190);
      S.fill(fac, { c: 'wash-safran' });
      let w = '';
      for (let x = 30; x < 520; x += 46) for (let y = 50; y < 200; y += 50) w += rect(x, y, 22, 32);
      S.fill(w, { c: 'wash-ardoise' });
      S.ln(w, 0.6, 'ink-soft');
      let bal = '';
      for (let x = 26; x < 520; x += 46) bal += `M${x} 86h30M${x} 136h30`;
      S.ln(bal, 1.2, 'ink');
      S.ln('M12 30H528M12 220H528', 1, 'ink');
      const pave = rect(12, 220, 516, 92);
      S.fill(pave, { c: 'wash-ardoise' });
      let pv = '';
      for (let y = 226; y < 312; y += 8) pv += `M12 ${y}H528`;
      S.ln(pv, 0.5, 'ink-faint');
      // fiacre
      const fia = smooth([[360, 230], [362, 196], [420, 194], [424, 230]], true);
      S.fill(fia, 'dark');
      S.ln(fia + circ(372, 238, 12) + circ(414, 238, 12) + 'M424 216l40 4M460 206l14 -2v30', 1, 'ink');
      S.fill(ell(470, 214, 16, 10), 'mid');
      // passants
      crowd(S, 230, 340, 228, 4, 10, { hats: 0.8, blur: false });
      // colonne d'affichage
      const col = rect(70, 70, 120, 240);
      S.fill(col, { c: 'wash-sauge' });
      S.fill(smooth([[60, 70], [130, 40], [200, 70]], true), { c: 'wash-sauge' });
      S.ln(col + smooth([[60, 70], [130, 40], [200, 70]], true), 1, 'ink');
      // grande affiche : la lavandière souriante (pb-01 en miniature)
      const af = rect(84, 84, 64, 110);
      S.fill(af, { c: 'wash-safran' });
      S.ln(af, 0.8, 'ink');
      S.fill(circ(116, 112, 9), { c: 'skin-2' });
      S.fill(ell(116, 102, 12, 7), { c: 'hair-noir' });
      S.ln(circ(116, 112, 9) + 'M112 116q4 3 8 0', 0.6, 'ink');
      S.fill(poly([[104, 124], [128, 124], [134, 176], [98, 176]], true), { c: 'wash-carmin' });
      S.fill(poly([[96, 140], [138, 136], [136, 156], [98, 158]], true), 'paper');
      S.ln(poly([[96, 140], [138, 136], [136, 156], [98, 158]], true), 0.6, 'ink-soft');
      // quatre petites affiches électorales identiques à médaillon
      for (let i = 0; i < 4; i++) {
        const x = 152 + (i % 2) * 18;
        const y = 96 + Math.floor(i / 2) * 50;
        const r0 = rect(x, y, 16, 40);
        S.fill(r0, 'paper');
        S.fill(circ(x + 8, y + 10, 5), { c: 'wash-indigo' });
        S.ln(r0 + `M${x + 3} ${y + 22}h10M${x + 3} ${y + 27}h10M${x + 3} ${y + 32}h10`, 0.5, 'ink-soft');
      }
      S.stip(pd, { opacity: 0.25 });
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

  /* ── CP-02 : Tennok, le phare et les Dents, 1930 ── */
  'cp-02'(id) {
    const S = new Scene(id, 540, 350, 'color');
    S.p('paper', rect(0, 0, 540, 350));
    const pd = rect(12, 12, 516, 300);
    S.within(pd, () => {
      S.fill(rect(12, 150, 516, 170), { c: 'water' });
      waterLines(S, 12, 156, 528, 310, { sp: 6 });
      const cape = smooth([[160, 200], [220, 160], [400, 150], [528, 170], [528, 220], [160, 220]], true);
      S.fill(cape, { c: 'wash-ardoise' });
      S.hat(cape);
      S.ln(cape, 0.9, 'ink');
      lighthouse(S, 380, 160, 130, { band: 'red', wBase: 0.18, wTop: 0.13 });
      const house = poly([[420, 162], [420, 136], [450, 120], [480, 136], [480, 162]], true);
      S.fill(house, 'paper');
      S.fill(poly([[414, 138], [450, 116], [486, 138], [480, 140], [450, 124], [420, 140]], true), { c: 'wash-carmin' });
      S.ln(house, 0.8, 'ink');
      const sh = poly([[260, 168], [260, 150], [282, 140], [304, 150], [304, 168]], true);
      S.fill(sh, 'paper');
      S.ln(sh, 0.8, 'ink');
      reefs(S, 12, 528, 300, 44, 9, { tone: 'dark' });
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

  /* ── CP-03 : Aubrelieu, le palais des Chartes, vers 1970 ── */
  'cp-03'(id) {
    const S = new Scene(id, 540, 350, 'color');
    S.p('paper', rect(0, 0, 540, 350));
    const pd = rect(12, 12, 516, 300);
    S.within(pd, () => {
      const fac = rect(60, 70, 420, 140);
      S.fill(fac, { c: 'wash-safran' }, { opacity: 0.4 });
      S.fill(poly([[50, 70], [270, 24], [490, 70]], true), { c: 'wash-ardoise' });
      S.ln(poly([[50, 70], [270, 24], [490, 70]], true) + fac, 1, 'ink');
      // drapeau au fronton
      S.ln('M270 24V-4', 1, 'ink');
      S.fill(poly([[270, 0], [296, 4], [270, 12]], true), { c: 'wash-indigo' });
      let cols = '';
      for (let i = 0; i < 10; i++) cols += rect(84 + i * 40, 84, 14, 120);
      S.fill(cols, 'paper');
      S.ln(cols, 0.7, 'ink-soft');
      // perron
      for (let i = 0; i < 5; i++) S.ln(`M${150 - i * 10} ${210 + i * 6}H${390 + i * 10}`, 0.8, 'ink-soft');
      // quai, réverbères, l'Orvelle
      S.fill(rect(12, 240, 516, 20), { c: 'wash-ardoise' });
      for (const x of [40, 180, 360, 500]) {
        S.ln(`M${x} 240V180`, 1.4, 'ink');
        S.fill(ell(x, 176, 6, 8), { c: 'wash-safran' });
        S.ln(ell(x, 176, 6, 8), 0.8, 'ink');
      }
      // trois voitures des années soixante
      for (const [x, c] of [[90, 'wash-carmin'], [250, 'wash-celadon'], [400, 'wash-indigo']]) {
        const car = smooth([[x, 240], [x + 4, 226], [x + 20, 224], [x + 30, 212], [x + 60, 212], [x + 72, 224], [x + 90, 228], [x + 92, 240]], true);
        S.fill(car, { c });
        S.ln(car + circ(x + 18, 241, 6) + circ(x + 74, 241, 6), 0.9, 'ink');
      }
      S.fill(rect(12, 260, 516, 60), { c: 'water' });
      waterLines(S, 12, 264, 528, 312, { sp: 6 });
    });
    S.ln(pd, 0.8, 'ink-soft');
    return S;
  },

  /* ── CT-01 : Autoportrait au chapeau (1910), rétrospective Lucien Varenque ── */
  'ct-01'(id) {
    const S = new Scene(id, 380, 500, 'color');
    S.p('paper', rect(0, 0, 380, 500));
    S.ln(rect(14, 14, 352, 472) + rect(20, 20, 340, 460), 0.8, 'ink');
    const pd = rect(50, 70, 280, 340);
    S.within(pd, () => {
      S.fill(pd, { c: 'wash-ardoise' });
      const lu = person(S, 'lucien-varenque', 35, 44, 70, 1.6, { mode: 'color', patch: { hands: [] }, lower: { kind: 'stand', tone: { p: 'mid', c: 'wash-sienne' }, arms: 'none' } });
      // touches de peinture visibles
      let tch = '';
      for (let i = 0; i < 90; i++) {
        const x = 50 + S.r() * 280;
        const y = 70 + S.r() * 340;
        tch += `M${f(x)} ${f(y)}l${f(4 + S.r() * 4)} ${f(S.r() * 3 - 1.5)}`;
      }
      S.ln(tch, 1.2, 'ink-faint', { opacity: 0.6 });
      // une main tient un pinceau au bord du cadre
      hand(S, 300, 404, 180, 5, { skin: 2, paint: true }, (v) => v);
      S.ln('M306 380L330 330', 3, 'ink');
      S.p('wash-carmin', circ(331, 328, 4));
      void lu;
    });
    S.ln(pd, 1.2, 'ink');
    headline(S, 70, 30, 240, 20, { words: 2 });
    headline(S, 110, 430, 160, 12, { words: 3, cls: 'ink-soft' });
    return S;
  },

  /* ── CT-02 : « Pour É., 1962 », couverture de Visages de la côte (1964) ── */
  'ct-02'(id) {
    const S = new Scene(id, 420, 420, 'photo');
    S.p('photo-light', rect(0, 0, 420, 420));
    // brume, phare à peine visible au loin
    S.fill(rect(0, 0, 420, 200), 'paper', { opacity: 0.7 });
    lighthouse(S, 330, 170, 70, { band: 'dark', wBase: 0.16, wTop: 0.12, line: 0.6 });
    S.fill(rect(0, 80, 420, 120), 'paper', { opacity: 0.6 });
    S.fill(rect(0, 180, 420, 70), 'mid', { opacity: 0.6 });
    waterLines(S, 0, 184, 420, 246, { sp: 6 });
    // quai de pierre
    const quay = poly([[0, 250], [420, 236], [420, 420], [0, 420]], true);
    S.fill(quay, 'mid');
    let st = '';
    for (let y = 270; y < 420; y += 30) st += `M0 ${y}L420 ${y - 14}`;
    for (let i = 0; i < 14; i++) st += `M${i * 34} ${290 + (i % 3) * 30}v30`;
    S.ln(st, 0.6, 'ink-faint');
    // berceau d'osier vide, couverture pliée
    const cr = smooth([[130, 300], [140, 352], [290, 352], [300, 300], [214, 290]], true);
    S.fill(cr, 'light');
    let wick = '';
    for (let x = 138; x < 296; x += 7) wick += `M${x} 302q2 24 4 48`;
    for (let y = 310; y < 350; y += 7) wick += `M136 ${y}H298`;
    S.ln(wick, 0.5, 'ink-soft');
    S.ln(cr, 1.2, 'ink-soft');
    const hood = smooth([[244, 300], [256, 254], [300, 256], [306, 300]], true);
    S.fill(hood, 'light');
    S.ln(hood, 1, 'ink-soft');
    S.fill(poly([[150, 300], [240, 296], [236, 310], [154, 312]], true), 'paper');
    S.stip(rect(0, 0, 420, 420), { opacity: 0.25 });
    // titre en surimpression (illisible : le texte est dans le document)
    headline(S, 40, 30, 340, 22, { words: 3, cls: 'ink' });
    return S;
  },

  /* ── PB-01 : Affiche « La Lavandière », Savonnerie Mérande, 1905 ── */
  'pb-01'(id) {
    const S = new Scene(id, 360, 540, 'color');
    S.fill(rect(0, 0, 360, 540), { c: 'wash-safran' });
    S.ln(rect(10, 10, 340, 520), 3, 'ink');
    // corde à linge
    S.ln('M10 80Q180 110 350 70', 1.2, 'ink');
    for (const x of [40, 280]) {
      const c = poly([[x, 84], [x + 40, 86], [x + 36, 140], [x + 4, 138]], true);
      S.fill(c, 'paper');
      S.ln(c, 1.2, 'ink');
    }
    // baquet (eau)
    const tub = smooth([[70, 440], [80, 510], [280, 510], [290, 440]], true);
    S.fill(tub, { c: 'wash-sienne' });
    S.ln(tub, 2, 'ink');
    S.fill(ell(180, 440, 110, 16), { c: 'water' });
    S.ln(ell(180, 440, 110, 16), 2, 'ink');
    // la lavandière idéalisée : chignon lâche, dents écartées ; la cicatrice n'y est pas
    const pa = person(S, 'pauline-sauge', 21, 60, 90, 1.25, { mode: 'color', patch: { hands: [], marks: { chinScar: false } }, lower: { kind: 'skirt', tone: { p: 'mid', c: 'wash-carmin' }, apron: true, apronTone: 'paper', arms: 'none', foot: 330 } });
    // elle tord un drap blanc au-dessus du baquet, manches retroussées
    const sheet = smooth([[90, 380], [140, 350], [220, 372], [280, 350], [272, 400], [220, 410], [150, 396], [96, 410]], true);
    S.fill(sheet, 'paper');
    S.ln(sheet + 'M150 360q10 20 0 40M200 364q-8 22 6 44M240 360q12 22 -2 46', 1.6, 'ink');
    arm(S, [[pa.fx - 40, pa.fy + 150], [pa.fx - 66, pa.fy + 220], [104, 370]], 24, { p: 'light', c: 'skin-2' }, { skin: 2, size: 3.6, fist: true, ang: 30 });
    arm(S, [[pa.fx + 96, pa.fy + 150], [pa.fx + 130, pa.fy + 220], [266, 360]], 24, { p: 'light', c: 'skin-2' }, { skin: 2, size: 3.6, fist: true, ang: -30 });
    // gouttes
    S.fill(ell(160, 420, 3, 5) + ell(210, 426, 3, 5) + ell(250, 418, 3, 5), { c: 'water' });
    // monogramme minuscule, coin inférieur gauche (illisible)
    S.ln('M22 512l4 -10l4 10m3 -10v10h5', 0.8, 'ink');
    // bandeaux de titre (le texte est dans le document)
    headline(S, 30, 22, 300, 30, { words: 2 });
    return S;
  },

  /* ── PB-02 : Affiche électorale « Votez Augustin Varenque », 1905 ── */
  'pb-02'(id) {
    const S = new Scene(id, 360, 540, 'color');
    S.p('paper', rect(0, 0, 360, 540));
    S.p('wash-indigo', rect(0, 0, 360, 540), { opacity: 0.25 });
    S.ln(rect(10, 10, 340, 520), 2.4, 'ink');
    headline(S, 30, 26, 300, 26, { words: 2 });
    const med = ell(180, 190, 100, 124);
    S.p('wash-indigo', ell(180, 190, 108, 132), { opacity: 0.9 });
    S.p('paper', med);
    S.within(med, () => {
      S.hat(med);
      fam(S, 'augustin-varenque-1872', 33, 54, 66, 1.45, { mode: 'engr', clip: true });
      S.p('rehaut', smooth([[214, 98], [226, 90], [236, 100], [226, 106]], true), { opacity: 0.8 });
    });
    S.ln(med + ell(180, 190, 108, 132), 1.6, 'ink');
    headline(S, 40, 336, 280, 28, { words: 3 });
    S.p('wash-indigo', rect(30, 380, 300, 30));
    headline(S, 50, 386, 260, 18, { words: 3 });
    printBlock(S, 40, 430, 280, 8, 10, { align: 'center' });
    return S;
  },

  /* ── PB-03 : Affiche de La Lanterne d'Ostrie, 1929 ── */
  'pb-03'(id) {
    const S = new Scene(id, 360, 540, 'color');
    S.fill(rect(0, 0, 360, 540), { c: 'water-deep' });
    S.p('ink', rect(0, 0, 360, 300), { fill: 'currentColor', opacity: 0.55, stroke: 'none' });
    // phare lointain et faisceau
    lighthouse(S, 290, 250, 90, { band: 'dark', lit: true, beam: 200, wBase: 0.16, wTop: 0.12 });
    // vagues en arabesques
    for (let row = 0; row < 6; row++) {
      const y = 290 + row * 40;
      let d = `M0 ${y}`;
      for (let x = 0; x < 380; x += 60) d += `q15 -26 30 0q8 12 16 0q-6 -10 -14 -4q15 18 28 4`;
      d += `V540H0Z`;
      S.fill(d, { c: row % 2 ? 'water' : 'water-deep' });
      S.ln(d, 1.2, 'ink');
    }
    // lanterne de marin allumée qui flotte
    S.fill(circ(150, 330, 70), { c: 'wash-safran' }, { opacity: 0.7 });
    const lt = rect(126, 296, 48, 64);
    S.fill(lt, { c: 'wash-safran' });
    S.ln(lt + 'M120 296h60M120 360h60M134 296q16 -28 32 0M150 296v64M126 328h48', 2, 'ink');
    S.ln('M110 372q40 12 80 0', 1.4, 'ink');
    headline(S, 30, 24, 300, 30, { words: 2 });
    return S;
  },

  /* ── PB-04 : Avis de la Régence du 17 juin 1944 ── */
  'pb-04'(id) {
    const S = new Scene(id, 360, 520, 'photo');
    // déchirure en haut à droite (l'avis a été arraché du mur)
    const sheet = poly([[6, 6], [250, 6], [262, 20], [280, 14], [300, 40], [318, 36], [330, 64], [354, 70], [354, 514], [6, 514]], true);
    S.p('paper-shade', sheet);
    S.within(sheet, () => {
      S.ln(rect(18, 18, 324, 484), 9, 'ink');
      headline(S, 40, 40, 260, 26, { words: 2 });
      headline(S, 50, 80, 260, 14, { words: 4, cls: 'ink-soft' });
      const slots = [rect(40, 116, 84, 108), rect(138, 116, 84, 108), rect(236, 116, 84, 108)];
      slots.forEach((d, i) => {
        S.within(d, () => {
          S.p('photo-light', d);
          if (i === 0) person(S, 'augustin-varenque-1924', 20, 40, 106, 0.6, { lower: false });
          if (i === 1)
            extra(S, { sex: 'm', age: 24, skin: 2, hair: 'brun', W: 22, H: 38, cheek: 0, hairStyle: 'cropped', marks: { bigEars: true }, clothes: { type: 'coat', wash: 'wash-ardoise', collar: 'open' } }, 128, 104, 0.62, { lower: false });
          if (i === 2)
            extra(S, { sex: 'm', age: 31, skin: 3, hair: 'noir', W: 25, H: 37, hairStyle: 'short', nose: { proj: 1.5, len: 1.15 }, beard: { style: 'short', grow: 0.3 }, clothes: { type: 'coat', wash: 'wash-ardoise', collar: 'open' } }, 228, 104, 0.62, { lower: false });
          S.stip(d, { opacity: 0.4 });
        });
        S.ln(d, 0.8, 'ink');
        // numéro illisible
        S.ln(`M${60 + i * 98} 236h40`, 3, 'ink-soft', { 'stroke-dasharray': '5 2' });
      });
      printBlock(S, 40, 260, 280, 18, 12, { align: 'center', word: [5, 12] });
      headline(S, 70, 476, 220, 14, { words: 3 });
    });
    S.ln(sheet, 0.8, 'ink-faint');
    return S;
  },

  /* ── DV-01 : Planche d'herbier : fougère royale, 1888 ── */
  'dv-01'(id) {
    const S = new Scene(id, 380, 540, 'color');
    S.p('paper', rect(0, 0, 380, 540));
    // bords légèrement roussis
    S.p('wash-sienne', `${rect(0, 0, 380, 540)}${rect(10, 10, 360, 520)}`, { 'fill-rule': 'evenodd', opacity: 0.4 });
    S.ln(rect(1, 1, 378, 538), 0.8, 'ink-soft');
    // la fronde séchée
    const fr = fern(140, 500, 420, { angle: 4, pairs: 14, spread: 0.36, curve: 0.04 });
    S.p('wash-sauge', fr.pinnae.join(''));
    S.p('wash-sauge', tube([fr.base, [fr.tip[0], fr.tip[1]]], 4, 1.5));
    S.ln(fr.pinnae.join('') + fr.stem, 0.8, 'ink');
    // neuf bandelettes de papier gommé
    let st = '';
    const at = [[140, 470], [130, 420], [196, 380], [84, 340], [180, 290], [100, 250], [170, 200], [120, 150], [146, 110]];
    for (const [x, y] of at) st += poly([[x - 12, y - 3], [x + 12, y - 5], [x + 13, y + 3], [x - 11, y + 5]], true);
    S.p('paper', st);
    S.p('wash-safran', st, { opacity: 0.5 });
    S.ln(st, 0.6, 'ink-soft');
    // étiquette imprimée en bas à droite (cases, écriture illisible)
    const lb = rect(230, 450, 130, 70);
    S.p('paper', lb);
    S.ln(lb + 'M230 466h130M230 482h130M230 498h130M280 450v70', 0.7, 'ink');
    S.ln(handLines(S.r, 286, 462, 68, 4, 16, { h: 2.4, step: 3 }), 0.6, 'ink-soft');
    // au crayon dans la marge : quelques lignes et le croquis simplifié (onze paires, sans sporanges)
    S.ln(handLines(S.r, 260, 70, 100, 4, 13, { h: 2.4, step: 3, slant: 0.4 }), 0.5, 'ink-faint');
    const sk = fern(310, 300, 160, { angle: 0, pairs: 11, spread: 0.4 });
    S.ln(sk.stem + sk.pinnae.join(''), 0.7, 'ink-faint');
    return S;
  },

  /* ── DV-02 : Plan de table et menu du banquet du 10 juin 1922 ── */
  'dv-02'(id) {
    const S = new Scene(id, 560, 380, 'color');
    const card = rect(10, 10, 540, 360);
    S.p('paper', card);
    S.p('wash-safran', card, { opacity: 0.2 });
    // filigrane discret : fougère vendue (bloc millésime sous la tige)
    S.open({ opacity: 0.45 });
    watermark(S, 150, 350, 120, { sold: true });
    S.close();
    S.ln(card + 'M280 10V370', 0.8, 'ink-soft');
    // volet gauche : table rectangulaire, six places de chaque côté
    const tb = rect(60, 150, 180, 70);
    S.ln(tb, 1.2, 'ink');
    for (let i = 0; i < 6; i++) {
      for (const [y, dy] of [[150, -26], [220, 18]]) {
        const x = 64 + i * 30;
        S.p('wash-lilas', rect(x - 2, y + dy - 3, 28, 10), { opacity: 0.5 });
        S.ln(handLines(S.r, x, y + dy + 4, 24, 1, 8, { h: 2.6, step: 2.6, last: 1 }), 0.6, 'ink-soft');
      }
    }
    // en bout de table, côté du jardin : une place sans nom, une petite croix au crayon
    S.ln('M250 178l8 8M258 178l-8 8', 0.8, 'ink-faint');
    S.p('wash-lilas', rect(16, 176, 34, 10), { opacity: 0.5 });
    S.ln(handLines(S.r, 18, 184, 30, 1, 8, { h: 2.6, step: 2.6, last: 1 }), 0.6, 'ink-soft');
    // volet droit : menu imprimé, vignette de tilleul en tête
    S.p('wash-sauge', ell(415, 56, 24, 20));
    S.ln(ell(415, 56, 24, 20) + 'M415 76v16', 0.8, 'ink');
    headline(S, 350, 104, 130, 14, { words: 1 });
    printBlock(S, 320, 140, 190, 14, 14, { align: 'center' });
    return S;
  },

  /* ── DV-03 : Vue de microfilm MF-74-112 (registre bleu), en négatif ── */
  'dv-03'(id) {
    const S = new Scene(id, 520, 380, 'photo');
    S.p('photo-dark', rect(0, 0, 520, 380));
    // amorce perforée sur le bord gauche
    S.black(rect(0, 0, 40, 380));
    let perf = '';
    for (let y = 10; y < 380; y += 22) perf += rect(12, y, 16, 11);
    S.p('photo-mid', perf);
    // page de registre : cinq colonnes réglées, écriture serrée (claire sur sombre)
    const pg = rect(60, 30, 440, 330);
    S.p('photo-mid', pg, { opacity: 0.45 });
    let rules = '';
    for (const x of [60, 120, 230, 330, 410, 500]) rules += rect(x - 0.6, 74, 1.2, 286);
    rules += rect(60, 74, 440, 1.2) + rect(60, 92, 440, 1.2);
    S.p('photo-light', rules);
    lightWriting(S, 66, 108, 50, 14, 18);
    lightWriting(S, 126, 108, 100, 14, 18);
    lightWriting(S, 236, 108, 90, 14, 18);
    lightWriting(S, 336, 108, 70, 14, 18);
    lightWriting(S, 416, 108, 80, 14, 18);
    // mire de prise de vue : carré de cotes et règle graduée
    S.p('photo-light', rect(70, 36, 44, 30));
    S.p('photo-dark', rect(74, 40, 36, 22));
    lightWriting(S, 76, 50, 30, 1, 8);
    let rule = rect(140, 50, 160, 2);
    for (let i = 0; i <= 16; i++) rule += rect(140 + i * 10, 42, 1, i % 4 ? 8 : 14);
    S.p('photo-light', rule);
    // rayures fines de lecture
    let sc = '';
    for (let i = 0; i < 6; i++) sc += rect(50 + S.r() * 460, 0, 0.6, 380);
    S.p('photo-light', sc, { opacity: 0.5 });
    return S;
  },

  /* ── DV-04 : Faire-part de décès d'Henriette Varenque, décembre 1950 ── */
  'dv-04'(id) {
    const S = new Scene(id, 520, 360, 'color');
    S.p('paper', rect(0, 0, 520, 360));
    // large filet noir
    S.black(`${rect(4, 4, 512, 352)}${rect(22, 22, 476, 316)}`, { 'fill-rule': 'evenodd' });
    S.ln(rect(28, 28, 464, 304), 0.6, 'ink-faint');
    // fougère gaufrée à sec, coin supérieur gauche (relief blanc sur blanc)
    const fr = fern(64, 120, 70, { angle: 10, pairs: 9, spread: 0.45 });
    S.p('rehaut', fr.pinnae.join(''));
    S.ln(fr.stem + fr.pinnae.join(''), 0.5, 'ink-faint');
    S.ln(fr.pinnae.map((d) => d).join(''), 0.5, 'ink-faint', { transform: 'translate(0.8 0.8)', opacity: 0.6 });
    // texte centré en blocs illisibles
    headline(S, 170, 70, 180, 16, { words: 2 });
    printBlock(S, 120, 110, 280, 4, 14, { align: 'center' });
    headline(S, 190, 180, 140, 18, { words: 2 });
    printBlock(S, 100, 220, 320, 6, 14, { align: 'center' });
    return S;
  },

  /* ── DV-05 : Petit lexique ostrien-velmarchois, 1954 ── */
  'dv-05'(id) {
    const S = new Scene(id, 560, 380, 'color');
    // couverture papier gris-bleu (à gauche), page de garde (à droite)
    const cov = rect(20, 20, 250, 340);
    S.p('paper', cov);
    S.p('wash-indigo', cov, { opacity: 0.45 });
    S.ln(cov, 1, 'ink');
    const pg = rect(270, 20, 250, 340);
    S.p('paper', pg);
    S.ln(pg + 'M270 20V360', 1, 'ink-soft');
    S.p('paper-shade', rect(262, 20, 16, 340));
    headline(S, 50, 60, 190, 16, { words: 2 });
    headline(S, 60, 90, 170, 12, { words: 3, cls: 'ink-soft' });
    // vignette gravée : goéland au-dessus d'une vague
    S.ln(circ(145, 210, 56), 0.8, 'ink');
    S.ln('M105 210q14 -22 40 -6q26 -16 40 6M145 204l0 8l4 -2', 1.6, 'ink');
    const wave = 'M95 250q12 -18 24 0t24 0t24 0t24 0q-10 18 -24 14Z';
    S.fill(wave, { c: 'water' });
    S.ln(wave + 'M95 240q20 -8 40 0', 1, 'ink');
    // dédicace manuscrite à l'encre, écriture penchée
    S.ln(handLines(S.r, 300, 110, 190, 5, 22, { slant: 0.8, h: 4, step: 4.6 }), 0.9, 'ink');
    return S;
  },

  /* ── LT-15 : Lettre de « N. » (1962) vue par transparence sur une table lumineuse ── */
  'lt-15'(id) {
    const S = new Scene(id, 420, 560, 'color');
    S.p('rehaut', rect(0, 0, 420, 560));
    S.open({ transform: 'rotate(-3 210 280)' });
    const sh = rect(50, 40, 320, 460);
    S.p('paper', sh);
    S.p('paper-shade', sh, { opacity: 0.7 });
    S.within(sh, () => {
      // vergeures serrées et chaînettes espacées, plus claires par transparence
      let vg = '';
      for (let y = 42; y < 500; y += 3.2) vg += rect(50, y, 320, 0.8);
      S.p('rehaut', vg, { opacity: 0.8 });
      let ch = '';
      for (let x = 66; x < 370; x += 26) ch += rect(x, 40, 1.4, 460);
      S.p('rehaut', ch);
      // filigrane : fronde de fougère royale, coin inférieur gauche ; rien sous la tige
      watermark(S, 112, 476, 96, { sold: false, pairs: 12, line: 'ink-soft' });
      // pli horizontal au tiers
      S.p('paper-shade', rect(50, 192, 320, 3));
      S.ln('M50 193.5H370', 0.5, 'ink-faint');
      // écriture serrée qui ne penche pas, par-dessus le filigrane
      S.ln(handLines(S.r, 76, 90, 270, 15, 24, { slant: 0, h: 3.6, step: 4.2, last: 0.4 }), 0.8, 'ink-soft');
    });
    S.ln(sh, 0.6, 'ink-faint');
    // seule initiale lisible
    S.push('<text class="label-note" x="314" y="474" font-size="22">N.</text>');
    S.close();
    return S;
  },
};
