/**
 * Figures des illustrations : têtes, coiffures, chapeaux, corps, mains.
 *
 * Repère local d'une tête : u = 10 (demi-largeur du visage aux pommettes), origine au centre du
 * visage, yeux à y = -1.5, menton à y = 12.6, sommet du crâne à y = -14.5. La tête est posée par
 * `<g transform="translate(cx cy) scale(u/10)">`.
 *
 * Côtés : « gauche » d'un personnage = droite de l'image quand il fait face (DESIGN §10.7,
 * docs/scenario/illustrations.md). `turn` > 0 : visage tourné vers la droite de l'image (on voit
 * davantage son côté droit, donc son oreille droite) ; `turn` ±1 : profil (nez vers la droite si +1).
 *
 * Traits de famille (toujours du même côté) : mèche blanche à gauche (image droite), strabisme de
 * l'œil gauche (image droite, vers l'extérieur), menton fendu ; anneau d'or à l'oreille gauche.
 */
import { circ, clamp, ell, f, lerp, poly, rect, smooth, tube } from './lib.mjs';

/* ───────────────────────── Valeurs ───────────────────────── */

const HAIR_TONE = {
  noir: { p: 'dark', c: 'hair-noir', e: 'dark', deep: true },
  brun: { p: 'dark', c: 'hair-brun', e: 'dark' },
  chatain: { p: 'mid', c: 'hair-chatain', e: 'mid' },
  roux: { p: 'mid', c: 'hair-roux', e: 'mid' },
  blond: { p: 'light', c: 'hair-blond', e: 'light' },
  gris: { p: 'light', c: 'hair-gris', e: 'light' },
  blanc: { p: 'paper', c: 'paper', e: 'paper' },
};

/** Valeur (photo/gravure) + pigment (couleur) d'un vêtement. */
export function cloth(p, c) {
  return { p, c: c ?? (p === 'paper' || p === 'light' ? 'paper' : p === 'dark' ? 'wash-ardoise' : 'wash-ardoise') };
}

function T(S, tone) {
  // tonalité → S.fill
  return tone;
}

/* ───────────────────────── Tête ───────────────────────── */

/** Contour du visage de face (points, sens horaire, départ au front). */
function faceOutline(sp) {
  const j = sp.jaw ?? (sp.sex === 'm' ? 0.6 : 0.2);
  const L = 1 + (sp.long ?? 0);
  const W = 1 + (sp.wide ?? 0);
  const ch = sp.child ? 0.6 : 0;
  const half = [
    [0, -11.8],
    [5.6, -11.2],
    [8.8, -8.2],
    [9.9, -3.6],
    [9.7, 0.8],
    [8.6 + j * 0.9 - ch, 5.4],
    [6.0 + j * 1.6 - ch * 0.5, 9.4],
    [3.0 + j * 0.9, 11.8],
    [0, 12.6],
  ].map(([x, y]) => [x * W, y > 0 ? y * L : y]);
  const left = half.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  return [...half, ...left];
}

/** Compression de trois-quarts (le côté vers lequel on tourne s'efface). */
function turnX(x, t) {
  if (!t) return x;
  const shift = t * 1.2;
  return (x * t > 0 ? x * (1 - 0.32 * Math.abs(t)) : x * (1 + 0.04 * Math.abs(t))) + shift;
}
const TP = (pts, t) => pts.map(([x, y, c]) => (c ? [turnX(x, t), y, 1] : [turnX(x, t), y]));

/** Profil (nez vers +x), visage complet en un contour. */
function profilePts(sp) {
  const n = sp.brokenNose ? 0.6 : 0;
  const L = 1 + (sp.long ?? 0);
  const pts = [
    [-2, -14],
    [4, -12.5],
    [7.2, -8.5],
    [8.2, -4.2],
    [7.4, -2.6],
    [9.2 + n * 0.3, 0],
    [11 + (sp.noseProj ?? 0), 3.2],
    [8.9, 4.2],
    [9.2, 6],
    [8.5, 7.2],
    [9, 8.3],
    [7.9, 9.8],
    [8.6 * (sp.sex === 'm' ? 1 : 0.97), 11.7],
    [5.4, 13.2],
    [1, 12.6],
  ].map(([x, y]) => [x, y > 0 ? y * L : y]);
  return pts;
}

/**
 * Dessine une tête. `sp` : spécification (voir l'en-tête), `o.mode` hérité de la scène.
 * Rend { d (contour), bottom (y local du menton) }.
 */
export function head(S, sp, cx, cy, u, o = {}) {
  const k = u / 10;
  const W = (x) => Math.max(x, 0.55 / k);
  const t = clamp(sp.turn ?? 0, -1, 1);
  const prof = Math.abs(t) >= 0.9;
  const s = Math.sign(t) || 1;
  const skinTone = { p: sp.pale ? 'paper' : 'light', c: `skin-${sp.skin ?? 2}` };
  const hairTone = sp.hairTone ?? HAIR_TONE[sp.hair ?? 'brun'];
  const lineCls = S.mode === 'photo' ? 'ink-soft' : 'ink';
  S.open({ transform: `translate(${f(cx)} ${f(cy)}) scale(${(Math.round(k * 1000) / 1000).toString()})${sp.tilt ? ` rotate(${sp.tilt})` : ''}` });

  const fx = prof ? 0 : t * 3.4; // décalage des traits
  const L = 1 + (sp.long ?? 0);
  const pts = prof ? (s > 0 ? profilePts(sp) : profilePts(sp).map(([x, y]) => [-x, y])) : TP(faceOutline(sp), t);
  const faceD = smooth(pts, true, 0.95);
  const skull = prof ? ell(-s * 1.5, -3.5, 10.4, 11) : '';

  /* 1. arrière : cheveux longs, voile, chapeau (fond) */
  hairBack(S, sp, t, prof, s, hairTone, W);
  if (sp.veil) {
    const v = poly([[-12, -10], [12, -10], [17, 20], [-17, 20]], true);
    S.fill(smooth([[-9, -13], [9, -13], [15, 2], [18, 24], [-18, 24], [-15, 2]], true), 'paper', { opacity: 0.85 });
    void v;
  }
  /* 2. cou */
  const neckD = prof
    ? poly([[-s * 6, 6], [s * 4.5, 10], [s * 5, 19], [-s * 7, 19]], true)
    : poly([[turnX(-4.4, t), 6], [turnX(4.4, t), 6], [turnX(4.9, t), 19], [turnX(-4.9, t), 19]], true);
  S.fill(neckD, skinTone);
  S.fill(poly(prof ? [[-s * 6, 10], [s * 4.5, 10], [s * 4.5, 14], [-s * 6, 13]] : [[turnX(-4.6, t), 10], [turnX(4.6, t), 10], [turnX(4.6, t), 14], [turnX(-4.6, t), 13]], true), 'mid', { opacity: 0.45 });
  S.ln(prof ? `M${-s * 6} 9L${-s * 7} 19M${s * 5} 12.5L${s * 5} 19` : `M${f(turnX(-4.4, t))} 9L${f(turnX(-4.9, t))} 19M${f(turnX(4.4, t))} 9L${f(turnX(4.9, t))} 19`, W(0.7), lineCls);
  if (sp.birthmark) {
    // tache de naissance au cou, côté droit du personnage (image gauche)
    const bx = prof ? -s * 2 : turnX(-2.6, t);
    S.black(ell(bx, 15.2, 1.8, 1.3), { opacity: 0.75 });
  }
  /* 3. oreilles */
  const earR = sp.bigEars ? 1.5 : 1;
  const ears = [];
  if (prof) {
    ears.push({ x: -s * 1.5, side: -s, show: true, right: s > 0 });
  } else {
    // oreille image gauche = oreille droite du personnage
    ears.push({ x: turnX(-9.7, t), side: -1, show: t > -0.6, right: true });
    ears.push({ x: turnX(9.7, t), side: 1, show: t < 0.6, right: false });
  }
  for (const e of ears) {
    if (!e.show) continue;
    const ex = prof ? e.x : e.x + e.side * 1.1 * earR;
    const ed = prof
      ? smooth([[ex - 1.3, -2.6], [ex + 1.4, -3], [ex + 2.2, 0.5], [ex + 1.2, 4.6], [ex - 0.8, 4.2], [ex - 1.6, 0.5]], true)
      : smooth([[e.x, -2.4], [e.x + e.side * 2.2 * earR, -3.6 * earR], [e.x + e.side * 2.9 * earR, 0.2], [e.x + e.side * 1.9 * earR, 4.4], [e.x, 4.3]], true);
    S.fill(ed, skinTone);
    S.ln(ed, W(0.7), lineCls);
    S.ln(prof ? `M${f(ex - 0.2)} -1Q${f(ex + 1)} 0.5 ${f(ex)} 2.5` : `M${f(e.x + e.side * 0.8)} -1.5Q${f(e.x + e.side * 2)} 0 ${f(e.x + e.side * 1.1)} 2.6`, W(0.5), 'ink-faint');
    if (sp.notch && e.right) {
      // entaille en haut du pavillon de l'oreille droite
      const nx = prof ? ex + 1.4 : e.x + e.side * 2.3 * earR;
      const ny = prof ? -2.9 : -2.9 * earR;
      S.fill(poly([[nx - 1.1, ny - 0.4], [nx - 0.1, ny + 1.6], [nx + 1.1, ny - 0.3]], true), 'paper');
      S.ln(`M${f(nx - 1.1)} ${f(ny - 0.4)}L${f(nx - 0.1)} ${f(ny + 1.6)}L${f(nx + 1.1)} ${f(ny - 0.3)}`, W(0.6), 'ink');
    }
    const lobe = prof ? [ex + 0.2, 4.6] : [e.x + e.side * 1.6 * earR, 4.6];
    if (sp.ring && !e.right) {
      S.ln(circ(lobe[0], lobe[1] + 1.4, 1.3), W(0.9), 'ink');
      S.fill(ell(lobe[0] - 0.4, lobe[1] + 0.5, 0.5, 0.4), 'paper');
    }
    if (sp.hoops) {
      S.ln(circ(lobe[0], lobe[1] + 2.6, 2.4), W(0.9), 'ink');
    }
    if (sp.pearls) {
      S.fill(circ(lobe[0], lobe[1] + 0.6, 0.95), 'paper');
      S.ln(circ(lobe[0], lobe[1] + 0.6, 0.95), W(0.5), 'ink-soft');
    }
  }
  /* 4. visage */
  if (prof) S.fill(skull, skinTone);
  S.fill(faceD, skinTone);
  // ombre (lumière venant de la gauche, ou du côté opposé à `o.light`)
  const lightSide = o.light === 'right' ? 1 : -1;
  const shD = prof ? ell(-s * 3, 3, 8, 12) : ell(-lightSide * 7.5 + fx * 0.3, 2, 6.5, 13);
  S.within(faceD, () => {
    S.fill(shD, S.mode === 'color' ? { p: 'mid', c: 'ombre' } : 'mid', { opacity: S.mode === 'color' ? 1 : 0.4 });
    if (S.mode === 'photo' && !o.noStipple) S.stip(shD, { opacity: 0.7 });
    if (S.mode === 'engr') S.hat(shD);
    if (sp.blur) S.fill(faceD, 'mid', { opacity: 0.35 });
  });
  S.ln(faceD, W(0.9), 'ink');
  /* 5. traits */
  features(S, sp, t, prof, s, fx, W, L);
  /* 6. cheveux de devant, mèche, chapeau */
  hairFront(S, sp, t, prof, s, hairTone, W, faceD);
  if (sp.glasses) glasses(S, sp, t, prof, s, fx, W);
  if (sp.hat) hat(S, sp.hat, t, prof, s, W);
  S.close();
  return { faceD };
}

function eyeAt(t, side, prof, s) {
  if (prof) return [s * 5.4, -1.6];
  const base = side * 4.3;
  const far = side * t > 0;
  return [turnX(base, t) + (far ? -side * 0.2 : 0), -1.6];
}

function features(S, sp, t, prof, s, fx, W, L) {
  const r = S.r;
  const ink = S.mode === 'photo' ? 'ink-soft' : 'ink';
  const dark = S.mode === 'photo' ? 'dark' : 'black';
  const browTh = sp.brows ?? 1;
  const sides = prof ? [s] : [-1, 1];
  const age = sp.age ?? 30;
  for (const side of sides) {
    const [ex, ey] = eyeAt(t, side, prof, s);
    const far = !prof && side * t > 0;
    const ew = (prof ? 1.4 : 2.2) * (far ? 1 - 0.3 * Math.abs(t) : 1) * (sp.child ? 1.12 : 1);
    // sourcils
    const by = ey - 2.6 - (sp.browLift ?? 0);
    const bw = ew * 1.25;
    const bd = prof
      ? `M${f(ex - s * 1.2)} ${f(by + 0.2)}Q${f(ex + s * 0.3)} ${f(by - 0.8)} ${f(ex + s * 1.8)} ${f(by + 0.3)}`
      : `M${f(ex - bw)} ${f(by + 0.6 * (side < 0 ? 1 : 0.6))}Q${f(ex)} ${f(by - 1.1)} ${f(ex + bw)} ${f(by + 0.6 * (side > 0 ? 1 : 0.6))}`;
    if (browTh >= 1.4) {
      // sourcils épais : forme pleine
      const th = 0.6 + browTh * 0.45;
      const bb = prof
        ? smooth([[ex - s * 1.4, by + 0.4], [ex + s * 0.3, by - 1], [ex + s * 2, by + 0.2], [ex + s * 0.3, by - 1 + th]], true)
        : smooth([[ex - bw, by + 0.7], [ex, by - 1.2], [ex + bw, by + 0.7], [ex, by - 1.2 + th]], true);
      S.black(bb, { opacity: sp.browGrey ? 0.45 : 0.9 });
    } else {
      S.ln(bd, W(0.6 + browTh * 0.5), ink);
    }
    if (sp.browScar && side === 1 && !prof) {
      // cicatrice pâle en travers du sourcil gauche (image droite)
      S.ln(`M${f(ex + 0.2)} ${f(by - 1.6)}L${f(ex + 1.4)} ${f(by + 1.4)}`, W(1), 'ink-faint');
      S.fill(poly([[ex + 0.1, by - 1.5], [ex + 0.9, by - 1.6], [ex + 1.6, by + 1.4], [ex + 0.8, by + 1.5]], true), 'paper');
    }
    // œil
    const closed = sp.eyes === 'closed' || sp.eyes === 'down';
    const squint = sp.eyes === 'squint' || (sp.smile ?? 0) > 0.8;
    const lid = squint ? 0.55 : sp.heavyLids ? 0.75 : 1;
    if (prof) {
      S.ln(`M${f(ex - s * 1)} ${f(ey - 0.6)}L${f(ex + s * 0.6)} ${f(ey)}L${f(ex - s * 0.7)} ${f(ey + 0.6)}`, W(0.6), ink);
      S.black(circ(ex - s * 0.1, ey, 0.45));
    } else if (closed) {
      S.ln(`M${f(ex - ew)} ${f(ey)}Q${f(ex)} ${f(ey + 1.1)} ${f(ex + ew)} ${f(ey)}`, W(0.7), ink);
    } else {
      const top = `M${f(ex - ew)} ${f(ey + 0.2)}Q${f(ex)} ${f(ey - 1.7 * lid)} ${f(ex + ew)} ${f(ey + 0.1)}`;
      const eyeD = `${top}Q${f(ex)} ${f(ey + 1.3 * lid)} ${f(ex - ew)} ${f(ey + 0.2)}Z`;
      S.fill(eyeD, 'paper');
      // iris : regard (gaze), strabisme de l'œil gauche (image droite) vers l'extérieur
      let ix = ex + (sp.gaze ?? 0) * ew * 0.4 + (far ? side * 0.15 : 0) + t * 0.5;
      if (sp.strab && side === 1) ix += ew * (sp.strabAmt ?? 0.5);
      const irR = (sp.lightEyes ? 0.85 : 0.95) * (sp.child ? 1.12 : 1);
      S.within(eyeD, () => {
        if (sp.lightEyes) {
          S.fill(circ(ix, ey, irR), 'mid');
          S.black(circ(ix, ey, irR * 0.4));
        } else S.black(circ(ix, ey, irR));
      });
      S.ln(top, W(0.8), ink);
      if (sp.heavyLids) S.ln(`M${f(ex - ew * 0.9)} ${f(ey - 0.9)}Q${f(ex)} ${f(ey - 2.1)} ${f(ex + ew * 0.9)} ${f(ey - 1)}`, W(0.5), 'ink-faint');
      if (sp.eyeliner) S.black(poly([[ex + side * ew * 0.6, ey - 0.6], [ex + side * (ew + 1.3), ey - 1.6], [ex + side * ew, ey + 0.2]], true));
      if (age > 45) S.ln(`M${f(ex + side * (ew + 0.4))} ${f(ey - 0.2)}l${f(side * 1)} -0.6M${f(ex + side * (ew + 0.4))} ${f(ey + 0.5)}l${f(side * 1)} 0.5`, W(0.45), 'ink-faint');
      if (age > 55) S.ln(`M${f(ex - ew * 0.8)} ${f(ey + 1.6)}Q${f(ex)} ${f(ey + 2.4)} ${f(ex + ew * 0.8)} ${f(ey + 1.5)}`, W(0.45), 'ink-faint');
    }
  }
  // nez
  const ny = 3.4 * L;
  if (prof) {
    S.ln(`M${f(s * 8.6)} ${f(ny + 0.4)}q${f(-s * 1.2)} 0.2 ${f(-s * 1.6)} -0.8`, W(0.6), ink);
  } else {
    const nx = fx * 1.05 + t * 1.2;
    const bk = sp.brokenNose ? 1.4 : 0;
    const bridge = sp.brokenNose
      ? `M${f(fx + 0.6 * Math.sign(t || 1))} ${f(-1)}L${f(fx + 1.4 + t)} ${f(0.9)}L${f(nx - 0.6)} ${f(ny - 0.6)}`
      : `M${f(fx + (t >= 0 ? 1 : -1) * 0.9)} ${f(-1)}Q${f(nx + t * 1.6)} ${f(1.5)} ${f(nx + t * 0.8)} ${f(ny - 0.4)}`;
    S.ln(bridge, W(0.7), 'ink-faint');
    S.ln(`M${f(nx - 1.9)} ${f(ny - 0.2)}Q${f(nx - 1.4)} ${f(ny + 1.4)} ${f(nx)} ${f(ny + 0.9)}Q${f(nx + 1.4)} ${f(ny + 1.4)} ${f(nx + 1.9)} ${f(ny - 0.2)}`, W(0.75), ink);
    if (bk) S.ln(`M${f(fx + 1.1 + t)} ${f(-0.6)}l${f(0.8)} ${f(0.4)}`, W(0.7), ink);
  }
  // bouche
  const my = 7 * L;
  const smile = sp.smile ?? 0;
  const mw = (prof ? 1.6 : 3.2) * (1 + smile * 0.25) * (sp.child ? 0.8 : 1);
  const mx = prof ? s * 7.8 : fx * 0.95;
  if (sp.open && !prof) {
    // rire, bouche ouverte, dents
    const md = `M${f(mx - mw)} ${f(my - 0.3)}Q${f(mx)} ${f(my - 1)} ${f(mx + mw)} ${f(my - 0.3)}Q${f(mx)} ${f(my + 3.6)} ${f(mx - mw)} ${f(my - 0.3)}Z`;
    S.fill(md, dark);
    const teeth = `M${f(mx - mw * 0.85)} ${f(my - 0.3)}Q${f(mx)} ${f(my - 0.9)} ${f(mx + mw * 0.85)} ${f(my - 0.3)}L${f(mx + mw * 0.6)} ${f(my + 0.9)}Q${f(mx)} ${f(my + 1.3)} ${f(mx - mw * 0.6)} ${f(my + 0.9)}Z`;
    S.fill(teeth, 'paper');
    if (sp.teeth === 'gap') S.black(rect(mx - 0.32, my - 0.7, 0.64, 1.7));
    if (sp.teeth === 'broken') S.black(poly([[mx + 0.2, my + 1], [mx + 0.2, my - 0.2], [mx + 1.1, my + 0.4], [mx + 1.5, my + 1]], true));
    S.ln(`M${f(mx - 0.15)} ${f(my - 0.6)}V${f(my + 0.9)}`, W(0.35), 'ink-faint');
    S.ln(md, W(0.7), ink);
  } else if (prof) {
    S.ln(`M${f(mx + s * 0.8)} ${f(my + 0.1)}L${f(mx - s * mw)} ${f(my + 0.3 - smile)}`, W(0.7), ink);
  } else {
    const lift = smile * 1.4;
    S.ln(`M${f(mx - mw)} ${f(my - lift)}Q${f(mx)} ${f(my + 0.9 + smile * 0.6)} ${f(mx + mw)} ${f(my - lift)}`, W(0.8), ink);
    if (!sp.noLip && sp.sex !== 'm') S.fill(`M${f(mx - mw * 0.7)} ${f(my + 0.2)}Q${f(mx)} ${f(my + 2)} ${f(mx + mw * 0.7)} ${f(my + 0.2)}Q${f(mx)} ${f(my + 0.9)} ${f(mx - mw * 0.7)} ${f(my + 0.2)}Z`, S.mode === 'color' ? { p: 'mid', c: 'blush' } : 'mid', { opacity: 0.6 });
    else S.ln(`M${f(mx - mw * 0.5)} ${f(my + 2)}Q${f(mx)} ${f(my + 2.5)} ${f(mx + mw * 0.5)} ${f(my + 2)}`, W(0.45), 'ink-faint');
    if (sp.teeth === 'gap' && smile > 0.3) {
      // sourire ouvert aux dents écartées
      const tw = mw * 0.7;
      S.fill(`M${f(mx - tw)} ${f(my - lift * 0.5)}Q${f(mx)} ${f(my + 1.6)} ${f(mx + tw)} ${f(my - lift * 0.5)}Z`, 'paper');
      S.black(rect(mx - 0.3, my - 0.2, 0.6, 1.3));
      S.ln(`M${f(mx - mw)} ${f(my - lift)}Q${f(mx)} ${f(my + 0.9 + smile * 0.6)} ${f(mx + mw)} ${f(my - lift)}`, W(0.8), ink);
    }
    if (sp.dimples) for (const d of [-1, 1]) S.ln(`M${f(mx + d * (mw + 0.9))} ${f(my - 1.2)}q${f(d * 0.4)} 0.8 0 1.7`, W(0.55), 'ink-soft');
  }
  // rides
  if (age > 40 && !prof) {
    const a = clamp((age - 40) / 40, 0, 1);
    let d = '';
    for (const side of [-1, 1]) d += `M${f(fx + side * 3)} ${f(ny + 0.6)}Q${f(fx + side * 4.4)} ${f(my - 0.5)} ${f(fx + side * (mw + 1.6))} ${f(my + 0.8)}`;
    if (a > 0.4) d += `M${f(fx - 3)} -7.5q3 -0.8 6 0M${f(fx - 2.6)} -6q2.6 -0.6 5.2 0`;
    S.ln(d, W(0.45), 'ink-faint');
  }
  // menton fendu
  if (sp.cleft) {
    const cx2 = prof ? s * 8.3 : fx * 0.85;
    if (prof) S.ln(`M${f(cx2)} ${f(10.6 * L)}q${f(s * 0.5)} 0.5 0 1`, W(0.6), ink);
    else {
      S.ln(`M${f(cx2)} ${f(10.3 * L)}Q${f(cx2 + 0.35)} ${f(11.2 * L)} ${f(cx2)} ${f(12.3 * L)}`, W(0.85), ink);
      S.fill(ell(cx2 + 0.6, 11.3 * L, 0.6, 0.9), 'mid', { opacity: 0.6 });
    }
  }
  if (sp.chinDimple && !prof) S.black(ell(fx * 0.85, 11 * L, 0.45, 0.35), { opacity: 0.7 });
  if (sp.chinScar && !prof) S.ln(`M${f(fx * 0.85 - 1.6)} ${f(10.8 * L)}l1.4 0.5`, W(0.6), 'ink-soft');
  // grains de beauté, taches de rousseur
  if (sp.mole === 'cheekR' && !prof) S.black(circ(turnX(-5.2, t), 4.2, 0.62));
  if (sp.mole === 'lipL' && !prof) S.black(circ(fx + 2.4, my - 1.8, 0.6));
  if (sp.freckles && !prof) {
    let d = '';
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      d += circ(fx + side * r.range(1.6, 6), r.range(0.4, 3.6), 0.28);
    }
    S.black(d, { opacity: 0.7 });
  }
  // moustache, barbe
  const beardTone = sp.beardTone ?? (sp.hair === 'gris' || sp.hair === 'blanc' ? 'light' : sp.hair === 'roux' || sp.hair === 'chatain' ? 'mid' : 'dark');
  const btFill = { p: beardTone, c: sp.beardHair ? `hair-${sp.beardHair}` : `hair-${sp.hair ?? 'brun'}` };
  if (sp.beard && !prof) {
    let bd;
    if (sp.beard === 'full') bd = smooth(TP([[-9.6, 1], [-9, 6], [-6.5, 11.5], [0, 15.2], [6.5, 11.5], [9, 6], [9.6, 1], [7.8, 4], [5, 8.2], [0, 9.4], [-5, 8.2], [-7.8, 4]], t), true);
    else if (sp.beard === 'short') bd = smooth(TP([[-9.4, 2], [-8.4, 7], [-5.8, 11.4], [0, 13.6], [5.8, 11.4], [8.4, 7], [9.4, 2], [7.5, 5.2], [4.6, 8.4], [0, 9.2], [-4.6, 8.4], [-7.5, 5.2]], t), true);
    else if (sp.beard === 'pointe') bd = smooth(TP([[-7.6, 5], [-5.6, 10], [-1.6, 15], [0.4, 18.5, 1], [2.4, 15], [5.6, 10], [7.6, 5], [4.6, 8.6], [0, 9.4], [-4.6, 8.6]], t), true);
    else if (sp.beard === 'chops') bd = smooth(TP([[-9.8, -3], [-9.4, 4], [-7.6, 8.4], [-6.4, 6], [-7.6, -2]], t), true) + smooth(TP([[9.8, -3], [9.4, 4], [7.6, 8.4], [6.4, 6], [7.6, -2]], t), true);
    else if (sp.beard === 'stubble') bd = smooth(TP([[-9.4, 2], [-8.2, 8], [-4, 12], [0, 12.8], [4, 12], [8.2, 8], [9.4, 2], [6, 6], [0, 8.6], [-6, 6]], t), true);
    if (bd) {
      if (sp.beard === 'stubble') S.stip(bd);
      else {
        S.fill(bd, btFill);
        if (beardTone !== 'dark') S.stip(bd, { opacity: 0.8 });
        S.ln(bd, W(0.6), 'ink-soft');
        // mèches
        let st = '';
        for (let i = 0; i < 9; i++) {
          const x = fx + r.range(-6, 6);
          const y = r.range(8.5, 12.5);
          st += `M${f(x)} ${f(y)}q${f(r.jit(0.6))} 1.4 ${f(r.jit(0.4))} 2.6`;
        }
        if (sp.beard !== 'chops') S.ln(st, W(0.45), beardTone === 'dark' ? 'ink-faint' : 'ink-soft');
      }
      // la bouche reste lisible
      if (!sp.open) S.ln(`M${f(mx - mw)} ${f(my - smile * 1.4)}Q${f(mx)} ${f(my + 0.9 + smile * 0.6)} ${f(mx + mw)} ${f(my - smile * 1.4)}`, W(0.7), 'ink');
    }
  }
  if (sp.moustache && !prof) {
    let md;
    if (sp.moustache === 'fine') md = `M${f(mx - mw * 0.95)} ${f(my - 1.2)}Q${f(mx)} ${f(my - 2.4)} ${f(mx + mw * 0.95)} ${f(my - 1.2)}Q${f(mx)} ${f(my - 1.7)} ${f(mx - mw * 0.95)} ${f(my - 1.2)}Z`;
    else if (sp.moustache === 'guidon')
      md = `M${f(mx)} ${f(my - 2.6)}Q${f(mx + 3.6)} ${f(my - 3.4)} ${f(mx + 5.2)} ${f(my - 1.4)}Q${f(mx + 6.8)} ${f(my - 2)} ${f(mx + 6.6)} ${f(my - 4)}Q${f(mx + 7.6)} ${f(my - 1)} ${f(mx + 5)} ${f(my - 0.6)}Q${f(mx + 2)} ${f(my - 1.2)} ${f(mx)} ${f(my - 1.6)}Q${f(mx - 2)} ${f(my - 1.2)} ${f(mx - 5)} ${f(my - 0.6)}Q${f(mx - 7.6)} ${f(my - 1)} ${f(mx - 6.6)} ${f(my - 4)}Q${f(mx - 6.8)} ${f(my - 2)} ${f(mx - 5.2)} ${f(my - 1.4)}Q${f(mx - 3.6)} ${f(my - 3.4)} ${f(mx)} ${f(my - 2.6)}Z`;
    else md = `M${f(mx - mw * 1.2)} ${f(my - 0.2)}Q${f(mx - mw)} ${f(my - 3)} ${f(mx)} ${f(my - 2.6)}Q${f(mx + mw)} ${f(my - 3)} ${f(mx + mw * 1.2)} ${f(my - 0.2)}Q${f(mx)} ${f(my - 1.4)} ${f(mx - mw * 1.2)} ${f(my - 0.2)}Z`;
    const mt = sp.moustacheTone ? { p: sp.moustacheTone, c: `hair-${sp.moustacheHair ?? sp.hair}` } : btFill;
    S.fill(md, mt);
    if (mt.p !== 'dark' && mt.p !== 'black') S.stip(md);
    S.ln(md, W(0.55), 'ink-soft');
  }
  if (sp.cigarillo && !prof) {
    S.fill(tube([[mx + mw * 0.6, my], [mx + mw * 0.6 + 4.5, my + 1.2]], 1, 0.9), 'dark');
  }
  if (sp.pipe && !prof) {
    const px = mx + mw * 0.7;
    S.fill(tube([[px, my + 0.2], [px + 3.4, my + 2.4]], 0.9, 1), 'dark');
    S.fill(smooth([[px + 2.8, my + 1.4], [px + 5.6, my + 1.2], [px + 5.4, my + 5.6], [px + 3.2, my + 5.4]], true), 'dark');
    S.ln(smooth([[px + 2.8, my + 1.4], [px + 5.6, my + 1.2], [px + 5.4, my + 5.6], [px + 3.2, my + 5.4]], true), W(0.5), 'ink');
  }
}

/* ───────────────────────── Coiffures ───────────────────────── */

export function hairStrands(S, d, pts, W, cls = 'ink-faint', n = 8) {
  void d;
  let st = '';
  for (let i = 0; i < n; i++) {
    const a = pts[Math.floor((i / n) * pts.length)];
    const b = pts[Math.floor(((i + 0.5) / n) * pts.length)] ?? a;
    st += `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 - 1.5)} ${f(b[0] * 0.6)} ${f(b[1] * 0.6 - 3)}`;
  }
  S.ln(st, W(0.45), cls);
}

function hairBack(S, sp, t, prof, s, tone, W) {
  const st = sp.style ?? (sp.sex === 'm' ? 'short' : 'chignon');
  const P = (pts) => (prof ? pts.map(([x, y]) => [x * 0.9 - s * 2.5, y]) : TP(pts, t));
  let d = '';
  if (st === 'bob' || st === 'bobFringe' || st === 'waves')
    d = smooth(P([[-11.6, -6], [-10.6, -12.6], [0, -15.6], [10.6, -12.6], [11.6, -6], [12, st === 'waves' ? 4 : 8.8], [10, st === 'waves' ? 5.4 : 10], [-10, st === 'waves' ? 5.4 : 10], [-12, st === 'waves' ? 4 : 8.8]]), true);
  else if (st === 'twoBraids') {
    d = smooth(P([[-11, -6], [-10, -12.5], [0, -15], [10, -12.5], [11, -6], [11, 2], [-11, 2]]), true);
  } else if (st === 'bandeaux' || st === 'crownBraids' || st === 'chignonLow' || st === 'curlyBun' || st === 'kerchief' || st === 'tied')
    d = smooth(P([[-11, -5], [-10.4, -12.4], [0, -15.2], [10.4, -12.4], [11, -5], [10.6, 2], [-10.6, 2]]), true);
  else if (st === 'long') d = smooth(P([[-11.6, -6], [-10.6, -12.6], [0, -15.6], [10.6, -12.6], [11.6, -6], [12.6, 16], [-12.6, 16]]), true);
  if (d) {
    S.fill(d, tone);
    if (tone.p === 'light' || tone.p === 'paper') S.ln(d, W(0.6), 'ink-soft');
  }
  if (st === 'twoBraids' && !prof) {
    for (const side of [-1, 1]) {
      const bx = turnX(side * 10.5, t);
      const b = tube([[bx, 2], [bx + side * 0.6, 12], [bx + side * 0.3, 22]], 4, 2.6);
      S.fill(b, tone);
      let ch = '';
      for (let y = 3; y < 22; y += 2.2) ch += `M${f(bx - 1.5)} ${f(y)}l${f(1.5)} 1.2l${f(1.5)} -1.2`;
      S.ln(ch, W(0.45), 'ink-faint');
      S.ln(b, W(0.6), 'ink-soft');
      S.fill(rect(bx - 1.3, 22, 2.6, 1.4), 'paper');
    }
  }
}

function hairFront(S, sp, t, prof, s, tone, W, faceD) {
  const r = S.r;
  const st = sp.style ?? (sp.sex === 'm' ? 'short' : 'chignon');
  const P = (pts) => (prof ? pts.map(([x, y]) => [x * 0.95 - s * 2, y]) : TP(pts, t));
  const ink = 'ink-soft';
  const light = tone.p === 'light' || tone.p === 'paper';
  const strand = light ? 'ink-soft' : 'ink-faint';
  let d;
  let parts = '';
  const hl = sp.receding ? -12.2 : -9.6; // ligne d'implantation
  if (st === 'none') return;
  if (st === 'bald') {
    // couronne de côté seulement
    for (const side of [-1, 1]) {
      const pd = smooth(P([[side * 10.6, -1.5], [side * 11, -7], [side * 9.4, -10.8], [side * 8.4, -8], [side * 9.3, -2]]), true);
      S.fill(pd, tone);
      S.ln(pd, W(0.5), ink);
    }
    S.ln(smooth(P([[-7, -12.6], [0, -14.6], [7, -12.6]])), W(0.5), 'ink-faint');
    return;
  }
  if (st === 'short' || st === 'slick' || st === 'child' || st === 'cropped' || st === 'veryShort' || st === 'curls' || st === 'tousled') {
    const top = st === 'cropped' ? -14.2 : st === 'curls' ? -16.4 : st === 'tousled' ? -16 : -15.4;
    const side = st === 'cropped' ? 10.2 : st === 'curls' ? 11.6 : 10.8;
    const pts = [[-9.6, -1], [-side, -6.5], [-9, -12.4], [0, top], [9, -12.4], [side, -6.5], [9.6, -1], [8.8, -4.5], [8.4, hl + 1.4], [3.4, hl - 0.4], [0, hl - 0.6], [-3.4, hl - 0.4], [-8.4, hl + 1.4], [-8.8, -4.5]];
    if (sp.part === 'left') pts.splice(9, 3, [3.4, hl - 0.4], [-2.6, hl - 1.6], [-3.4, hl]);
    if (st === 'curls' || st === 'tousled') {
      // contour bouclé
      const P2 = P(pts);
      let dd = `M${f(P2[0][0])} ${f(P2[0][1])}`;
      for (let i = 1; i <= P2.length; i++) {
        const p = P2[i % P2.length];
        const big = i < 8;
        dd += big ? `A2.4 2.4 0 0 1 ${f(p[0])} ${f(p[1])}` : `L${f(p[0])} ${f(p[1])}`;
      }
      d = `${dd}Z`;
    } else d = smooth(P(pts), true, 0.9);
    S.fill(d, tone);
    if (st === 'cropped') S.stip(d);
    if (st === 'curls' || st === 'tousled') {
      let c = '';
      for (let i = 0; i < 16; i++) {
        const x = r.range(-8, 8);
        const y = r.range(top + 2, hl);
        c += `M${f(turnX(x, t))} ${f(y)}a1.2 1.2 0 1 1 1.6 0.8`;
      }
      S.ln(c, W(0.45), strand);
    } else {
      // raie
      if (sp.part === 'mid') parts += `M${f(turnX(0, t))} ${f(hl - 0.6)}L${f(turnX(0, t))} ${f(top + 1)}`;
      if (sp.part === 'left') parts += `M${f(turnX(3.4, t))} ${f(hl - 0.4)}L${f(turnX(4, t))} ${f(top + 1.2)}`;
      if (sp.part === 'right') parts += `M${f(turnX(-3.4, t))} ${f(hl - 0.4)}L${f(turnX(-4, t))} ${f(top + 1.2)}`;
      let lines = '';
      for (let i = 0; i < 7; i++) {
        const x = -7 + i * 2.3;
        lines += `M${f(turnX(x, t))} ${f(hl - 0.2)}Q${f(turnX(x * 1.1, t))} ${f(-13)} ${f(turnX(x * 0.6 + (sp.part === 'mid' ? 0 : 3), t))} ${f(top + 0.8)}`;
      }
      S.ln(lines, W(0.45), strand);
    }
    if (parts) S.ln(parts, W(0.7), light ? 'ink-soft' : 'ink-faint');
    S.ln(d, W(0.6), ink);
  } else if (st === 'bandeaux' || st === 'tied' || st === 'crownBraids' || st === 'chignon' || st === 'chignonLow' || st === 'kerchief') {
    // bandeaux plats, raie au milieu, oreilles couvertes (bandeaux) ou dégagées
    const cover = st === 'bandeaux';
    const pts = cover
      ? [[-10.2, 3], [-11, -6], [-9.4, -12.4], [0, -14.8], [9.4, -12.4], [11, -6], [10.2, 3], [9, 1], [8.6, -6.6], [4, -9.8], [0, -10], [-4, -9.8], [-8.6, -6.6], [-9, 1]]
      : [[-9.8, -1], [-10.6, -6.8], [-9.2, -12.4], [0, -14.6], [9.2, -12.4], [10.6, -6.8], [9.8, -1], [8.9, -3.5], [8.4, -7.6], [3.6, -10], [0, -10.2], [-3.6, -10], [-8.4, -7.6], [-8.9, -3.5]];
    d = smooth(P(pts), true, 0.9);
    S.fill(d, tone);
    let lines = `M${f(turnX(0, t))} -10L${f(turnX(0, t))} -14.4`;
    for (let i = 1; i <= 4; i++) {
      for (const side of [-1, 1]) lines += `M${f(turnX(side * 0.6, t))} ${f(-10.2 - i * 0.9)}Q${f(turnX(side * 6, t))} ${f(-11 - i * 0.6)} ${f(turnX(side * (9 + i * 0.3), t))} ${f(-4 + i * 0.8)}`;
    }
    S.ln(lines, W(0.45), strand);
    S.ln(d, W(0.6), ink);
    if (st === 'chignon' && !prof) {
      const bx = turnX(0, t) - t * 3;
      const bun = ell(bx, -15.6, 5.2, 3.6);
      S.fill(bun, tone);
      S.ln(bun + `M${f(bx - 3)} -15.6q3 -2 6 0`, W(0.5), ink);
    }
    if (st === 'chignonLow' || prof) {
      const bx = prof ? -s * 10.5 : turnX(-Math.sign(t || 1) * 10.4, t);
      if (prof || Math.abs(t) > 0.25) {
        const bun = ell(bx, 0.5, 4.2, 4.4);
        S.fill(bun, tone);
        S.ln(bun + `M${f(bx - 2.6)} -0.8q2.6 2.6 5.2 0`, W(0.5), ink);
      }
    }
    if (st === 'crownBraids') {
      // couronne de tresses sur le haut de la tête
      const cb = smooth(P([[-10.4, -6], [-9.6, -13.4], [0, -17.2], [9.6, -13.4], [10.4, -6], [8.6, -6.6], [8, -11.6], [0, -14.4], [-8, -11.6], [-8.6, -6.6]]), true);
      S.fill(cb, tone);
      let ch = '';
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const x = Math.cos(a) * 9.2;
        const y = -6.4 + Math.sin(a) * 9;
        ch += `M${f(turnX(x - 1, t))} ${f(y - 0.6)}l${f(1)} ${f(1.2)}l${f(1)} ${f(-1.2)}`;
      }
      S.ln(ch, W(0.5), 'ink-soft');
      S.ln(cb, W(0.6), ink);
      if (sp.ribbon) S.fill(smooth(P([[-10.2, -5.6], [-9.6, -8], [-8.6, -6.6], [-9.2, -4.6]]), true), 'paper');
    }
    if (st === 'kerchief') {
      // fichu noué sur la nuque : tissu sur le haut de la tête, nœud derrière
      const kd = smooth(P([[-10.8, -2], [-10.4, -10.6], [-4, -15.4], [4, -15.4], [10.4, -10.6], [10.8, -2], [9, -5.6], [7, -9.4], [0, -11], [-7, -9.4], [-9, -5.6]]), true);
      S.fill(kd, sp.kerchiefTone ?? 'dark');
      S.ln(kd + smooth(P([[-6, -13.4], [0, -12.4], [6, -13.4]])), W(0.6), ink);
      if (!prof) {
        const kx = turnX(-Math.sign(t || 1) * 11, t);
        const knot = smooth([[kx, 0], [kx - Math.sign(t || 1) * 3, 2], [kx - Math.sign(t || 1) * 1.4, 4.6], [kx + Math.sign(t || 1) * 0.6, 2]], true);
        if (Math.abs(t) > 0.2) {
          S.fill(knot, sp.kerchiefTone ?? 'dark');
          S.ln(knot, W(0.5), ink);
        }
      }
    }
  } else if (st === 'bob' || st === 'bobFringe' || st === 'waves') {
    const len = st === 'waves' ? 4.6 : 9.6;
    const fringe = st === 'bobFringe' ? -5.8 : null;
    const pts =
      fringe !== null
        ? [[-11.6, len], [-12, -6], [-10.4, -12.8], [0, -15.6], [10.4, -12.8], [12, -6], [11.6, len], [9.6, len + 0.6], [9.4, -3], [8.8, fringe], [0, fringe - 0.4], [-8.8, fringe], [-9.4, -3], [-9.6, len + 0.6]]
        : sp.part === 'left'
          ? [[-11.6, len], [-12, -6], [-10.4, -12.8], [0, -15.6], [10.4, -12.8], [12, -6], [11.6, len], [9.6, len + 0.4], [9.2, -4], [8.4, -8.6], [3.6, -10.6], [-2, -9.2], [-8, -6.4], [-9.4, -2], [-9.6, len + 0.4]]
          : [[-11.6, len], [-12, -6], [-10.4, -12.8], [0, -15.6], [10.4, -12.8], [12, -6], [11.6, len], [9.6, len + 0.4], [9.2, -4], [8.2, -8.4], [0, -10.2], [-8.2, -8.4], [-9.2, -4], [-9.6, len + 0.4]];
    d = smooth(P(pts), true, 0.85);
    S.fill(d, tone);
    let lines = '';
    if (st === 'waves') {
      for (let i = 0; i < 4; i++) {
        const y = -11 + i * 3.6;
        lines += `M${f(turnX(-11, t))} ${f(y + 2)}q2.5 -2.4 5 0t5 0t5 0t5 0`;
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const x = -10 + i * 2.5;
        lines += `M${f(turnX(x * 0.4, t))} ${f(-14.2)}Q${f(turnX(x * 1.15, t))} ${f(-9)} ${f(turnX(x * 1.1, t))} ${f(len - 1)}`;
      }
    }
    S.ln(lines, W(0.45), strand);
    S.ln(d, W(0.6), ink);
  } else if (st === 'twoBraids') {
    d = smooth(P([[-9.8, 1], [-10.6, -6.8], [-9.2, -12.4], [0, -14.6], [9.2, -12.4], [10.6, -6.8], [9.8, 1], [8.9, -3.5], [8.4, -7.6], [3.6, -10], [0, -10.2], [-3.6, -10], [-8.4, -7.6], [-8.9, -3.5]]), true, 0.9);
    S.fill(d, tone);
    S.ln(`M${f(turnX(0, t))} -10.2L${f(turnX(0, t))} -14.4`, W(0.6), 'ink-faint');
    S.ln(d, W(0.6), ink);
  } else if (st === 'curlyBun') {
    // boucles noires en chignon lâche, mèches folles
    const P2 = P([[-10.4, 0], [-11.4, -7], [-9.6, -13], [0, -15.6], [9.6, -13], [11.4, -7], [10.4, 0], [9, -4], [8.4, -8.4], [3.6, -10.4], [0, -10.2], [-3.6, -10.4], [-8.4, -8.4], [-9, -4]]);
    let dd = `M${f(P2[0][0])} ${f(P2[0][1])}`;
    for (let i = 1; i <= P2.length; i++) {
      const p = P2[i % P2.length];
      dd += i <= 7 ? `A2.2 2.2 0 0 1 ${f(p[0])} ${f(p[1])}` : `L${f(p[0])} ${f(p[1])}`;
    }
    d = `${dd}Z`;
    const bun = smooth(P([[-7, -14], [-6, -19.4], [0, -21], [6, -19.4], [7, -14], [0, -13]]), true);
    S.fill(bun, tone);
    S.fill(d, tone);
    let c = '';
    for (let i = 0; i < 14; i++) c += `M${f(turnX(r.range(-8, 8), t))} ${f(r.range(-19, -11))}a1.3 1.3 0 1 1 1.6 0.9`;
    // mèches folles sur les tempes
    c += `M${f(turnX(-9.4, t))} -4q-1.4 2.6 0 4.6M${f(turnX(9.4, t))} -4q1.4 2.6 0 4.6`;
    S.ln(c, W(0.5), strand);
    S.ln(d + bun, W(0.6), ink);
  } else if (st === 'coque') {
    // coque blonde des années cinquante : volume haut, roulé sur le côté
    d = smooth(P([[-10, 1], [-11.6, -6], [-11, -13], [-5, -18.4], [3, -18.8], [10, -15.4], [11.6, -7], [10.4, 1], [9.2, -3], [8.6, -8], [4, -11], [-2, -9.6], [-7, -8.2], [-9, -3]]), true);
    S.fill(d, tone);
    S.ln(smooth(P([[-7, -8.6], [-4, -14.6], [3, -16.4], [9, -13]])) + smooth(P([[-9.6, -4], [-8.6, -11], [-3, -16.6]])), W(0.5), 'ink-soft');
    S.ln(d, W(0.6), ink);
  } else if (st === 'turban') {
    d = smooth(P([[-10.8, -4], [-11.6, -12], [-6, -19], [0, -20.4], [6, -19], [11.6, -12], [10.8, -4], [6, -7.4], [0, -8.4], [-6, -7.4]]), true);
    S.fill(d, sp.turbanTone ?? 'dark');
    S.ln(smooth(P([[-10, -9], [-2, -15], [9, -17]])) + smooth(P([[-9.6, -13.6], [0, -12], [10, -8.6]])) + smooth(P([[-6, -18], [2, -13], [10.6, -11]])), W(0.6), sp.turbanTone === 'light' ? 'ink-soft' : 'ink-faint');
    const knot = smooth(P([[-2.6, -9], [-3.4, -12.8], [0, -14.6], [3.4, -12.8], [2.6, -9], [0, -8.2]]), true);
    S.fill(knot, sp.turbanTone ?? 'dark');
    S.ln(knot + d, W(0.6), 'ink');
  } else if (st === 'bonnet') {
    // bonnet de dentelle serré du nourrisson : aucun cheveu visible
    d = smooth(P([[-10.6, 4], [-11.4, -6], [-9.6, -13], [0, -15.4], [9.6, -13], [11.4, -6], [10.6, 4], [9, 1], [8.6, -6], [0, -9.4], [-8.6, -6], [-9, 1]]), true);
    S.fill(d, 'paper');
    let lace = '';
    for (let i = 0; i < 12; i++) {
      const a = Math.PI + (i / 11) * Math.PI;
      lace += circ(turnX(Math.cos(a) * 9, t), -2.4 + Math.sin(a) * 7.4, 0.9);
    }
    S.ln(lace, W(0.45), 'ink-faint');
    S.ln(d + `M${f(turnX(-8.6, t))} 4q8 9 17 0`, W(0.6), ink);
  } else if (st === 'helmet') {
    d = smooth(P([[-10.4, 7], [-11.4, -4], [-10.4, -12.6], [0, -16], [10.4, -12.6], [11.4, -4], [10.4, 7], [8.6, 7], [8.8, -2], [8.4, -8.6], [0, -10], [-8.4, -8.6], [-8.8, -2], [-8.6, 7]]), true);
    S.fill(d, 'dark');
    S.ln(d + smooth(P([[0, -16], [0, -10]])) + smooth(P([[-9.8, -3], [-6, -4], [-8.6, 6]])) + smooth(P([[9.8, -3], [6, -4], [8.6, 6]])), W(0.6), 'ink');
    // lunettes de vol relevées sur le front
    for (const side of [-1, 1]) {
      const g = ell(turnX(side * 4.2, t), -11.4, 3.4, 2.4);
      S.fill(g, 'mid');
      S.fill(ell(turnX(side * 4.2, t) - 1, -12, 1.2, 0.8), 'paper');
      S.ln(g, W(0.9), 'ink');
    }
    S.ln(`M${f(turnX(-0.8, t))} -11.4h${f(1.6)}M${f(turnX(-7.6, t))} -11.4L${f(turnX(-10.8, t))} -10M${f(turnX(7.6, t))} -11.4L${f(turnX(10.8, t))} -10`, W(0.9), 'ink');
  }
  // mèche blanche au-dessus du front, côté gauche du personnage (image droite)
  if (sp.meche && st !== 'bonnet' && st !== 'turban' && st !== 'helmet') {
    const mw = sp.mecheW ?? 2.4;
    const x0 = prof ? (s > 0 ? -1 : 1) * 0 + s * 2.2 : 3.2;
    const md = prof
      ? smooth([[x0 - 1.2, -9.8], [x0 - 1.4, -13], [x0 + 0.8, -14.6], [x0 + 2.6, -13.6], [x0 + 1.4, -10.4]], true)
      : smooth(TP([[x0, hl - 0.2], [x0 - 0.4, -12.6], [x0 + 1.4, -15], [x0 + mw + 1.2, -14.4], [x0 + mw + 0.8, -12], [x0 + mw, hl + 0.4]], t), true);
    S.fill(md, { p: 'paper', c: 'rehaut' });
    S.ln(md, W(0.5), 'ink-faint');
    S.ln(prof ? '' : smooth(TP([[x0 + mw * 0.5, hl], [x0 + mw * 0.3, -12.4], [x0 + mw * 0.9, -14.4]], t)), W(0.45), 'ink-faint');
  }
  if (sp.lockOverEye && !prof) {
    // mèche de cheveux sur l'œil droit (image gauche)
    const ld = smooth(TP([[-2, -10.4], [-6, -8.6], [-6.8, -3.4], [-5.2, -0.6], [-4.4, -4.6], [-2.4, -8]], t), true);
    S.fill(ld, tone);
    S.ln(ld, W(0.5), ink);
  }
  void faceD;
}

/* ───────────────────────── Lunettes, chapeaux ───────────────────────── */

function glasses(S, sp, t, prof, s, fx, W) {
  const g = sp.glasses;
  if (prof) {
    const [ex, ey] = eyeAt(t, s, prof, s);
    S.ln(ell(ex + s * 0.4, ey, 1, 2.2) + `M${f(ex - s * 0.6)} ${f(ey - 0.4)}L${f(-s * 2)} ${f(ey - 1)}`, W(0.7), 'ink');
    return;
  }
  const L = turnX(-4.3, t);
  const R = turnX(4.3, t);
  const ry = g === 'pince' ? 2 : g === 'chain' ? 1.9 : 2.7;
  const rxL = (g === 'pince' ? 2.4 : 3.1) * (t > 0 ? 1 : 1 - 0.3 * Math.abs(t));
  const rxR = (g === 'pince' ? 2.4 : 3.1) * (t < 0 ? 1 : 1 - 0.3 * Math.abs(t));
  const lenses = ell(L, -1.5, rxL, ry) + ell(R, -1.5, rxR, ry);
  if (g === 'smoked') S.fill(lenses, 'dark', { opacity: 0.85 });
  else S.fill(lenses, 'paper', { opacity: 0.25 });
  const heavy = g === 'round' || g === 'smoked';
  S.ln(lenses, W(heavy ? 1.05 : 0.7), 'ink');
  S.ln(`M${f(L + rxL)} -1.8Q${f((L + R) / 2)} -3 ${f(R - rxR)} -1.8`, W(0.7), 'ink');
  if (g !== 'pince') S.ln(`M${f(L - rxL)} -1.8L${f(turnX(-9.8, t))} -2.4M${f(R + rxR)} -1.8L${f(turnX(9.8, t))} -2.4`, W(0.7), 'ink');
  if (g === 'pince') S.ln(`M${f(R + rxR)} -1.4Q${f(R + rxR + 3)} 6 ${f(R + 1.6)} 20`, W(0.8), 'ink');
  if (g === 'chain') S.ln(`M${f(L - rxL)} -1Q${f(L - rxL - 2)} 8 ${f(turnX(-9, t))} 17M${f(R + rxR)} -1Q${f(R + rxR + 2)} 8 ${f(turnX(9, t))} 17`, W(0.5), 'ink-soft', { 'stroke-dasharray': '0.8 0.8' });
  // reflets
  if (g !== 'smoked') S.ln(`M${f(L - 1.4)} -3l1.2 -0.6M${f(R - 1.4)} -3l1.2 -0.6`, W(0.5), 'ink-faint');
  else S.fill(ell(L - 1, -2.4, 0.9, 0.6) + ell(R - 1, -2.4, 0.9, 0.6), 'paper', { opacity: 0.8 });
}

function hat(S, h, t, prof, s, W) {
  const type = h.type;
  const tone = h.tone ?? 'dark';
  const P = (pts) => (prof ? pts.map(([x, y]) => [x * 0.95 - s * 1.5, y]) : TP(pts, t));
  const ink = 'ink';
  if (type === 'officer') {
    const crown = smooth(P([[-10.6, -9.8], [-12.4, -15.4], [-7, -18.6], [7, -18.6], [12.4, -15.4], [10.6, -9.8]]), true);
    S.fill(crown, tone);
    const band = poly(P([[-10.6, -9.8], [-10.8, -12.4], [10.8, -12.4], [10.6, -9.8]]), true);
    S.fill(band, 'dark');
    if (h.galon) S.ln(poly(P([[-10.8, -12], [10.8, -12]])), W(0.8), 'ink-faint');
    const visor = smooth(P([[-9.6, -10], [0, -6.8], [9.6, -10], [0, -9.2]]), true);
    S.black(visor);
    if (h.badge !== false) S.fill(ell(turnX(0, t), -14.6, 1.8, 1.4), 'light');
    S.ln(crown + band, W(0.7), ink);
  } else if (type === 'feutre') {
    const brim = ell(turnX(0, t), -11.2, 17.5, 4.2);
    S.fill(brim, tone);
    const crown = smooth(P([[-9.4, -11], [-9.6, -18.6], [-4, -21.4], [0, -19.8], [4, -21.4], [9.6, -18.6], [9.4, -11]]), true);
    S.fill(crown, tone);
    S.fill(poly(P([[-9.4, -11.2], [-9.5, -13.4], [9.5, -13.4], [9.4, -11.2]]), true), 'black');
    S.ln(brim + crown, W(0.7), ink);
    S.within(brim, () => S.fill(ell(turnX(0, t), -8.8, 13, 2.4), 'black', { opacity: 0.5 }));
  } else if (type === 'flatcap' || type === 'seacap') {
    const back = h.back ? -1.6 : 0;
    const crown = smooth(P([[-10.6, -9.4 + back], [-11.6, -14.8 + back], [-2, -18.2 + back], [8, -17.4 + back], [12.4, -13.4 + back], [10.6, -9.4 + back]]), true);
    S.fill(crown, tone);
    const peak = smooth(P([[-9.4, -9.6 + back], [0, -6.2 + back], [9.4, -9.6 + back], [0, -8.8 + back]]), true);
    S.black(peak);
    S.ln(crown + `M${f(turnX(-10, t))} ${f(-11.6 + back)}Q${f(turnX(0, t))} ${f(-10 + back)} ${f(turnX(10, t))} ${f(-11.6 + back)}`, W(0.7), ink);
  } else if (type === 'plume') {
    // grand chapeau à plumes d'autruche
    const brim = ell(turnX(0, t), -12.6, 19, 4.6);
    S.fill(brim, tone);
    const crown = smooth(P([[-9.6, -12.6], [-9.2, -19.6], [0, -21.6], [9.2, -19.6], [9.6, -12.6]]), true);
    S.fill(crown, tone);
    S.ln(brim + crown, W(0.7), ink);
    for (const [x0, a] of [[2, 1], [-6, -1], [6, 0.4]]) {
      const pd = smooth(P([[x0, -18], [x0 + a * 6, -27], [x0 + a * 14, -26], [x0 + a * 17, -20], [x0 + a * 12, -23], [x0 + a * 5, -21.6]]), true);
      S.fill(pd, 'light');
      let barbs = '';
      for (let i = 0; i < 9; i++) barbs += `M${f(turnX(x0 + a * (2 + i * 1.5), t))} ${f(-20 - Math.sin((i / 8) * Math.PI) * 5)}l${f(a * 1)} ${f(-2.2)}`;
      S.ln(pd, W(0.5), 'ink-soft');
      S.ln(barbs, W(0.45), 'ink-faint');
    }
  } else if (type === 'beanie') {
    const d = smooth(P([[-10.8, -6.6], [-11, -13], [-5, -18.4], [5, -18.4], [11, -13], [10.8, -6.6]]), true);
    S.fill(d, tone);
    let rib = '';
    for (let i = -9; i <= 9; i += 2) rib += `M${f(turnX(i, t))} -7.2L${f(turnX(i * 0.9, t))} -10.4`;
    S.ln(d + poly(P([[-10.9, -10.4], [10.9, -10.4]])), W(0.6), ink);
    S.ln(rib, W(0.45), 'ink-faint');
  } else if (type === 'calot') {
    const d = smooth(P([[-9.6, -11], [-6, -17.4], [6, -17.6], [9.6, -11]]), true);
    S.fill(d, tone);
    S.ln(d, W(0.6), ink);
  } else if (type === 'trilby') {
    const brim = ell(turnX(0, t), -10.6, 14.6, 3.4);
    S.fill(brim, tone);
    const crown = smooth(P([[-9.2, -10.6], [-9, -17.6], [0, -16.6], [9, -17.6], [9.2, -10.6]]), true);
    S.fill(crown, tone);
    S.fill(poly(P([[-9.2, -10.8], [-9.2, -12.8], [9.2, -12.8], [9.2, -10.8]]), true), 'black');
    S.ln(brim + crown, W(0.7), ink);
    S.within(brim, () => S.fill(ell(turnX(0, t), -8.4, 11, 2.2), 'black', { opacity: 0.6 }));
  } else if (type === 'ladyhat') {
    const brim = ell(turnX(0, t), -11.2, 15, 3.6);
    S.fill(brim, tone);
    const crown = smooth(P([[-8.8, -11], [-8, -17], [0, -18.6], [8, -17], [8.8, -11]]), true);
    S.fill(crown, tone);
    S.ln(brim + crown, W(0.7), ink);
    S.within(brim, () => S.fill(ell(turnX(0, t), -8.6, 12, 2.4), 'black', { opacity: 0.6 }));
  } else if (type === 'coiffe') {
    // coiffe ostrienne à rubans : bonnet blanc sur l'arrière de la tête, rubans au vent
    const d = smooth(P([[-10.4, -4], [-10.8, -12], [-4, -16.6], [4, -16.6], [10.8, -12], [10.4, -4], [8.6, -7.4], [6.6, -11.4], [0, -12.8], [-6.6, -11.4], [-8.6, -7.4]]), true);
    S.fill(d, 'paper');
    S.ln(d, W(0.6), ink);
    let emb = '';
    for (let i = -8; i < 8; i += 2) emb += `M${f(turnX(i, t))} -12.4l1 -1.2l1 1.2`;
    S.ln(emb, W(0.45), 'ink-soft');
    const rx = turnX(10.4, t);
    const rib = smooth([[rx, -5], [rx + 5, -2], [rx + 9, -4], [rx + 13, 0], [rx + 9, -1.4], [rx + 5, 0.4], [rx + 0.4, -3]], true);
    S.fill(rib, 'light');
    S.ln(rib, W(0.5), 'ink-soft');
  } else if (type === 'canotier') {
    const brim = ell(turnX(0, t), -11.6, 14, 3);
    S.fill(brim, 'light');
    const crown = poly(P([[-8.6, -11.6], [-8.6, -16.4], [8.6, -16.4], [8.6, -11.6]]), true);
    S.fill(crown, 'light');
    S.fill(poly(P([[-8.6, -11.8], [-8.6, -13.6], [8.6, -13.6], [8.6, -11.8]]), true), 'dark');
    S.ln(brim + crown, W(0.6), ink);
  }
}

/* ───────────────────────── Mains ───────────────────────── */

/**
 * Main (repère de la tête : même échelle locale). (x, y) = poignet, `ang` en degrés
 * (0 = doigts vers le bas). Options : missing [3,4] (annulaire, auriculaire), ring (chevalière à
 * l'auriculaire), burn (brûlure au dos), ink (bouts des doigts noirs), paint, glove, fist, back.
 */
export function hand(S, x, y, ang, sz, o = {}, W = (v) => v) {
  const a = (ang * Math.PI) / 180;
  const R = (u, v) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)];
  const tone = o.glove ? 'paper' : { p: 'light', c: `skin-${o.skin ?? 2}` };
  const side = o.mirror ? -1 : 1;
  // paume : du poignet (v=0) vers les doigts (v>0)
  const palm = smooth([R(-2.2 * sz, 0), R(-2.6 * sz, 3 * sz), R(-2.2 * sz, 5.2 * sz), R(2.4 * sz, 5.2 * sz), R(2.8 * sz, 3 * sz), R(2.2 * sz, 0)], true);
  S.fill(palm, tone);
  const fingers = [];
  const fl = o.fist ? 2.2 : 4.4;
  for (let i = 0; i < 4; i++) {
    const idx = side > 0 ? i : 3 - i; // 0 = index … 3 = auriculaire
    const fingerNo = idx + 1; // 1 index, 2 majeur, 3 annulaire, 4 auriculaire
    const u0 = (-1.7 + i * 1.15) * sz;
    const len = fl * sz * [1, 1.08, 1, 0.8][idx];
    if (o.missing?.includes(fingerNo)) {
      // moignon
      const st = tube([R(u0, 4.8 * sz), R(u0, 5.6 * sz)], 1.1 * sz, 1.1 * sz);
      S.fill(st, tone);
      S.ln(st, W(0.5), 'ink-soft');
      continue;
    }
    const fd = tube([R(u0, 4.6 * sz), R(u0 + 0.1 * sz, 4.6 * sz + len * 0.6), R(u0 + 0.15 * sz, 4.6 * sz + len)], 1.1 * sz, 0.95 * sz);
    fingers.push(fd);
    S.fill(fd, tone);
    S.ln(fd, W(0.5), 'ink-soft');
    if (o.ink) S.black(tube([R(u0 + 0.1 * sz, 4.6 * sz + len * 0.72), R(u0 + 0.15 * sz, 4.6 * sz + len)], 1.1 * sz, 0.95 * sz), { opacity: 0.85 });
    if (o.paint && i % 2 === 0) S.fill(circ(...R(u0, 4.6 * sz + len * 0.5), 0.5 * sz), 'dark');
    if (o.ring && fingerNo === 4) {
      const rp = R(u0, 4.6 * sz + len * 0.25);
      S.fill(ell(rp[0], rp[1], 0.9 * sz, 0.7 * sz), 'mid');
      S.ln(ell(rp[0], rp[1], 0.9 * sz, 0.7 * sz), W(0.6), 'ink');
    }
  }
  // pouce
  const th = tube([R(-side * 2 * sz, 1 * sz), R(-side * 3.6 * sz, 3.2 * sz), R(-side * 3.8 * sz, 5 * sz)], 1.3 * sz, 1 * sz);
  S.fill(th, tone);
  S.ln(th, W(0.5), 'ink-soft');
  S.ln(palm, W(0.6), 'ink-soft');
  if (o.burn) {
    // brûlure d'acide : tache claire et luisante au dos de la main
    const bd = smooth([R(-1.6 * sz, 1.4 * sz), R(0.2 * sz, 0.8 * sz), R(1.8 * sz, 2 * sz), R(1.2 * sz, 4 * sz), R(-1 * sz, 4.2 * sz), R(-1.9 * sz, 2.8 * sz)], true);
    S.fill(bd, { p: 'paper', c: 'rehaut' });
    S.ln(bd, W(0.6), 'ink-soft');
    S.ln(`M${f(R(-0.8 * sz, 2 * sz)[0])} ${f(R(-0.8 * sz, 2 * sz)[1])}L${f(R(0.8 * sz, 3 * sz)[0])} ${f(R(0.8 * sz, 3 * sz)[1])}`, W(0.45), 'ink-faint');
  }
}

/* ───────────────────────── Corps ───────────────────────── */

/**
 * Personnage complet. Repère : tête de rayon `u` (cx, cy = centre du visage).
 * pose : 'stand' | 'sit' | 'bust' | 'kneel' | 'floor' (assis en tailleur).
 * g (vêtement) : { type, tone, ... } — voir `garment`.
 * arms : [{ side: -1|1 (image), pts: [[x,y]…] (repère local), hand: {…}, bare, sleeve }].
 * bodyFirst : corps dessiné avant la tête (toujours), bras après le corps.
 */
export function figure(S, sp, cx, cy, u, o = {}) {
  const k = u / 10;
  const W = (x) => Math.max(x, 0.55 / k);
  const pose = o.pose ?? 'stand';
  const g = o.g ?? { type: 'coat' };
  const sh = (o.shoulders ?? (sp.sex === 'm' ? 13 : 11.2)) * (sp.child ? 0.78 : 1);
  const t = sp.turn ?? 0;
  const tx = (x) => x + t * 1.5;
  const H = sp.child ? 0.72 : 1;
  const yS = 19; // épaules
  const yW = 19 + 40 * H; // taille
  const yHip = 19 + 64 * H;
  const yKnee = yHip + 46 * H;
  const yFoot = o.feet ?? (pose === 'sit' ? yHip + 62 * H : yKnee + 50 * H);
  const lineCls = 'ink';
  S.open({ transform: `translate(${f(cx)} ${f(cy)}) scale(${(Math.round(k * 1000) / 1000).toString()})` });
  const tone = g.tone ?? 'dark';
  const wsh = sh * (g.wide ?? 1);
  // torse
  const waistW = wsh * (sp.sex === 'm' ? 0.82 : 0.62) * (g.stout ?? 1);
  const hipW = wsh * (sp.sex === 'm' ? 0.85 : 0.9) * (g.stout ? g.stout * 0.95 : 1);
  const torso = smooth([[tx(-wsh * 0.4), yS - 2.4], [tx(-wsh), yS + 2.5], [tx(-wsh * 1.02), yS + 10], [tx(-waistW), yW], [tx(-hipW), yHip], [tx(hipW), yHip], [tx(waistW), yW], [tx(wsh * 1.02), yS + 10], [tx(wsh), yS + 2.5], [tx(wsh * 0.4), yS - 2.4]], true, 0.8);
  // jambes / jupe
  const long = g.type === 'dress' || g.type === 'apronDress' || g.type === 'gown' || g.type === 'shawlDress' || g.type === 'costume';
  const skirtLen = g.skirt ?? (long ? 1 : 0);
  if (pose === 'stand' || pose === 'kneel') {
    if (skirtLen > 0) {
      const hem = lerp(yKnee, yFoot, skirtLen);
      const sw = hipW * (g.flare ?? 1.35) * (g.train ? 1.4 : 1);
      const sk = smooth([[tx(-waistW), yW], [tx(-hipW * 1.05), yHip], [tx(-sw), hem, 1], [tx(sw * (g.train ? 1.6 : 1)), hem, 1], [tx(hipW * 1.05), yHip], [tx(waistW), yW]], true, 0.7);
      if (skirtLen < 1 && pose === 'stand') legs(S, sp, tx, yHip, yKnee, yFoot, hipW * 0.5, g, W, true);
      S.fill(sk, g.skirtTone ?? tone);
      S.ln(sk, W(0.8), lineCls);
      let folds = '';
      for (let i = -2; i <= 2; i++) folds += `M${f(tx(i * hipW * 0.32))} ${f(yHip)}L${f(tx(i * sw * 0.42))} ${f(hem - 2)}`;
      S.ln(folds, W(0.5), 'ink-faint');
      if (g.apron) {
        const ap = smooth([[tx(-hipW * 0.75), yW], [tx(-hipW * 0.95), hem - 6, 1], [tx(hipW * 0.95), hem - 6, 1], [tx(hipW * 0.75), yW]], true, 0.6);
        S.fill(ap, g.apronTone ?? 'light');
        S.ln(ap, W(0.6), 'ink-soft');
      }
      if (pose === 'stand' && skirtLen >= 1) {
        // bouts de chaussures
        S.fill(ell(tx(-hipW * 0.35), hem + 0.6, 3, 1.4) + ell(tx(hipW * 0.35), hem + 0.6, 3, 1.4), 'black');
      }
    } else {
      legs(S, sp, tx, yHip, yKnee, yFoot, hipW * 0.5, g, W, false);
    }
  } else if (pose === 'sit') {
    // cuisses vers l'avant (raccourci), jambes verticales
    const lap = smooth([[tx(-hipW * 1.1), yHip - 6], [tx(-hipW * 1.25), yHip + 12], [tx(hipW * 1.25), yHip + 12], [tx(hipW * 1.1), yHip - 6]], true);
    if (skirtLen > 0) {
      const sw = hipW * 1.4;
      const sk = smooth([[tx(-waistW), yW], [tx(-hipW * 1.2), yHip], [tx(-sw), yFoot - 2, 1], [tx(sw), yFoot - 2, 1], [tx(hipW * 1.2), yHip], [tx(waistW), yW]], true, 0.7);
      S.fill(sk, g.skirtTone ?? tone);
      S.ln(sk, W(0.8), lineCls);
      S.ln(`M${f(tx(-hipW * 1.2))} ${f(yHip + 11)}Q${f(tx(0))} ${f(yHip + 15)} ${f(tx(hipW * 1.2))} ${f(yHip + 11)}`, W(0.6), 'ink-faint');
      S.fill(ell(tx(-hipW * 0.4), yFoot - 1, 3.2, 1.5) + ell(tx(hipW * 0.4), yFoot - 1, 3.2, 1.5), 'black');
    } else {
      for (const side of [-1, 1]) {
        const lg = tube([[tx(side * hipW * 0.55), yHip + 8], [tx(side * hipW * 0.6), yFoot - 2]], 9, 7);
        S.fill(lg, g.legTone ?? tone);
        S.ln(lg, W(0.7), lineCls);
        S.black(ell(tx(side * hipW * 0.6 + side * 1), yFoot - 1, 4.4, 1.9));
      }
      S.fill(lap, g.legTone ?? tone);
      S.ln(lap, W(0.7), lineCls);
    }
  } else if (pose === 'floor') {
    // assise en tailleur : jambes croisées en losange devant
    const lap = smooth([[tx(-hipW * 1.9), yHip + 10], [tx(-hipW * 1.2), yHip - 4], [tx(hipW * 1.2), yHip - 4], [tx(hipW * 1.9), yHip + 10], [tx(0), yHip + 16]], true);
    S.fill(lap, g.skirtTone ?? tone);
    S.ln(lap, W(0.7), lineCls);
    S.ln(`M${f(tx(-hipW * 1.5))} ${f(yHip + 6)}Q${f(tx(0))} ${f(yHip + 2)} ${f(tx(hipW * 1.5))} ${f(yHip + 8)}`, W(0.5), 'ink-faint');
  }
  {
    S.fill(torso, tone);
    garment(S, sp, g, tx, wsh, waistW, hipW, yS, yW, yHip, W);
    S.ln(torso, W(0.8), lineCls);
  }
  // bras
  for (const arm of o.arms ?? []) drawArm(S, sp, arm, tx, wsh, yS, g, W);
  S.close();
  // tête par-dessus
  head(S, sp, cx, cy, u, o.headOpts ?? {});
  // bras devant la tête (rare)
  if (o.after) o.after(S, k, W);
}

function legs(S, sp, tx, yHip, yKnee, yFoot, hw, g, W, bare) {
  const lt = g.legTone ?? (bare ? { p: 'light', c: `skin-${sp.skin ?? 2}` } : g.tone ?? 'dark');
  for (const side of [-1, 1]) {
    const x0 = tx(side * hw);
    const lg = tube([[x0, yHip - 4], [x0 + side * 0.6, yKnee], [x0 + side * 0.9, yFoot - 2]], bare ? 6 : 11, bare ? 4.4 : 8);
    S.fill(lg, lt);
    S.ln(lg, W(0.7), 'ink');
    if (g.barefoot) {
      const ft = ell(x0 + side * 2, yFoot - 0.6, 4, 1.6);
      S.fill(ft, { p: 'light', c: `skin-${sp.skin ?? 2}` });
      S.ln(ft, W(0.5), 'ink-soft');
    } else S.black(ell(x0 + side * 2, yFoot - 0.8, 5, 2));
  }
}

/** Détails de vêtement sur le torse. */
function garment(S, sp, g, tx, wsh, waistW, hipW, yS, yW, yHip, W) {
  const r = S.r;
  const type = g.type;
  const neckL = tx(-4.6);
  const neckR = tx(4.6);
  // col / chemise
  if (['coat', 'jacket', 'uniform', 'overcoat', 'leather', 'suit3', 'tailleur', 'menJacket'].includes(type)) {
    const vDepth = type === 'uniform' ? 6 : type === 'overcoat' ? 9 : type === 'leather' ? 14 : 22;
    const shirt = poly([[neckL, yS - 3], [neckR, yS - 3], [tx(0), yS + vDepth]], true);
    S.fill(shirt, g.shirt ?? 'paper');
    S.ln(`M${f(neckL)} ${f(yS - 3)}L${f(tx(0))} ${f(yS + vDepth)}L${f(neckR)} ${f(yS - 3)}`, W(0.7), 'ink');
    if (g.collar !== false && type !== 'leather') S.ln(`M${f(neckL)} ${f(yS - 3)}l2 4l2.6 -3.4M${f(neckR)} ${f(yS - 3)}l-2 4l-2.6 -3.4`, W(0.6), 'ink-soft');
    // revers
    if (type !== 'uniform') S.ln(`M${f(neckL - 1.5)} ${f(yS - 2)}L${f(tx(-5.4))} ${f(yS + vDepth * 0.5)}L${f(tx(-0.6))} ${f(yS + vDepth + 3)}M${f(neckR + 1.5)} ${f(yS - 2)}L${f(tx(5.4))} ${f(yS + vDepth * 0.5)}L${f(tx(0.6))} ${f(yS + vDepth + 3)}`, W(0.6), 'ink-faint');
    if (g.tie === 'bow') S.black(poly([[tx(-3.2), yS - 1.6], [tx(0), yS - 0.6], [tx(3.2), yS - 1.6], [tx(3.2), yS + 1.6], [tx(0), yS + 0.6], [tx(-3.2), yS + 1.6]], true));
    else if (g.tie === 'lavalliere') {
      const lv = smooth([[tx(-4.6), yS - 2], [tx(-1), yS + 1], [tx(-3.6), yS + 9], [tx(0), yS + 4], [tx(3.6), yS + 10], [tx(1), yS + 1], [tx(4.6), yS - 2], [tx(0), yS - 0.4]], true);
      S.fill(lv, g.tieTone ?? 'dark');
      S.ln(lv, W(0.5), 'ink-soft');
    } else if (g.tie === 'cravat' || g.tie === true) S.fill(poly([[tx(-1.3), yS - 1.4], [tx(1.3), yS - 1.4], [tx(1.8), yS + vDepth * 0.8], [tx(0), yS + vDepth * 0.95], [tx(-1.8), yS + vDepth * 0.8]], true), g.tieTone ?? 'dark');
    if (g.flower) {
      S.fill(circ(tx(-wsh * 0.5), yS + 6, 1.8), 'paper');
      S.ln(circ(tx(-wsh * 0.5), yS + 6, 1.8), W(0.5), 'ink-soft');
    }
    if (g.badge) {
      S.fill(circ(tx(-wsh * 0.5), yS + 6, 1.1), 'light');
      S.ln(circ(tx(-wsh * 0.5), yS + 6, 1.1), W(0.5), 'ink-soft');
    }
    if (g.chain) S.ln(`M${f(tx(-wsh * 0.45))} ${f(yS + 26)}Q${f(tx(-1))} ${f(yS + 31)} ${f(tx(wsh * 0.4))} ${f(yS + 24)}`, W(0.6), 'ink-soft');
    // boutons
    let b = '';
    if (type === 'uniform') {
      for (let i = 0; i < 5; i++) for (const s2 of [-1, 1]) b += circ(tx(s2 * 3.8), yS + 6 + i * 6.4, 0.9);
      S.fill(b, 'paper');
      S.ln(`M${f(tx(-1))} ${f(yS + vDepth)}V${f(yHip - 2)}`, W(0.6), 'ink-soft');
      if (g.galons) S.ln(`M${f(tx(-wsh * 0.98))} ${f(yS + 30)}l6 0M${f(tx(-wsh * 0.98))} ${f(yS + 32.6)}l6 0`, W(0.8), 'ink-faint');
    } else {
      for (let i = 0; i < 2; i++) b += circ(tx(0.8), yS + vDepth + 6 + i * 6, 0.7);
      S.fill(b, 'mid');
    }
    if (g.sash) {
      // écharpe de fonction en sautoir
      const sd = poly([[tx(-wsh * 0.9), yS + 1], [tx(-wsh * 0.6), yS - 1], [tx(waistW * 1.1), yW + 4], [tx(waistW * 0.8), yW + 8]], true);
      S.fill(sd, g.sash);
      S.ln(sd, W(0.6), 'ink-soft');
    }
  } else if (type === 'sweater' || type === 'turtleneck') {
    const col = smooth([[tx(-5.4), yS - 4], [tx(5.4), yS - 4], [tx(5.6), yS + 0.6], [tx(-5.6), yS + 0.6]], true);
    S.fill(col, g.tone ?? 'mid');
    S.ln(col, W(0.6), 'ink-soft');
    let rib = '';
    for (let x = -5; x <= 5; x += 1.3) rib += `M${f(tx(x))} ${f(yS - 3.6)}V${f(yS + 0.4)}`;
    S.ln(rib, W(0.45), 'ink-faint');
    if (type === 'sweater' && g.zigzag !== false) {
      // bandes de zigzags ostriens
      for (const yy of [yS + 8, yS + 13]) {
        let z = `M${f(tx(-wsh))} ${f(yy)}`;
        const n = 12;
        for (let i = 1; i <= n; i++) z += `L${f(tx(-wsh + (2 * wsh * i) / n))} ${f(yy + (i % 2 ? -2.2 : 0))}`;
        S.ln(z, W(0.9), g.zigCls ?? 'ink');
      }
      const band = rect(tx(-wsh), yS + 5.4, 2 * wsh, 2);
      S.fill(band, 'dark', { opacity: 0.5 });
      if (g.darned) S.ln(`M${f(tx(-wsh * 1.05))} ${f(yS + 30)}h4m-4 1.2h4m-4 1.2h4M${f(tx(wsh * 1.05 - 4))} ${f(yS + 30)}h4m-4 1.2h4m-4 1.2h4`, W(0.5), 'ink-soft');
    }
    let knit = '';
    for (let i = 0; i < 14; i++) knit += `M${f(tx(r.range(-wsh * 0.8, wsh * 0.8)))} ${f(r.range(yS + 17, yHip - 4))}v2`;
    S.ln(knit, W(0.45), 'ink-faint');
  } else if (['dress', 'gown', 'blouse', 'apronDress', 'shawlDress', 'costume', 'smock', 'stageDress', 'labcoat', 'cire', 'sailor', 'schoolBlouse'].includes(type)) {
    if (g.collar === 'high') {
      const c = rect(tx(-4.8), yS - 6, 9.6, 6);
      S.fill(c, 'paper');
      S.ln(c, W(0.5), 'ink-soft');
      let lace = '';
      for (let x = -4.4; x < 4.6; x += 1.4) lace += circ(tx(x), yS - 0.2, 0.5);
      S.ln(lace, W(0.45), 'ink-faint');
    } else if (g.collar === 'white' || g.collar === 'claudine' || g.collar === 'round') {
      for (const side of [-1, 1]) {
        const c = smooth([[tx(side * 0.2), yS - 1.6], [tx(side * 5), yS - 3], [tx(side * 7.4), yS + 1.4], [tx(side * 3), yS + (g.collar === 'claudine' ? 4.6 : 3.2)]], true);
        S.fill(c, 'paper');
        S.ln(c, W(0.5), 'ink-soft');
      }
    } else if (g.collar === 'zigzag') {
      const c = smooth([[tx(-6.4), yS - 3], [tx(6.4), yS - 3], [tx(7.4), yS + 3], [tx(0), yS + 7], [tx(-7.4), yS + 3]], true);
      S.fill(c, 'paper');
      let z = `M${f(tx(-6.6))} ${f(yS + 1)}`;
      for (let i = 1; i <= 10; i++) z += `L${f(tx(-6.6 + i * 1.32))} ${f(yS + 1 + (i % 2 ? 2 : 0) + (i > 3 && i < 7 ? 1.4 : 0))}`;
      S.ln(c, W(0.5), 'ink-soft');
      S.ln(z, W(0.7), 'ink');
    } else if (g.collar === 'sailor') {
      const c = poly([[tx(-wsh * 0.9), yS + 1], [tx(-4), yS - 3], [tx(0), yS + 12], [tx(4), yS - 3], [tx(wsh * 0.9), yS + 1], [tx(wsh * 0.7), yS + 9], [tx(-wsh * 0.7), yS + 9]], true);
      S.fill(c, 'paper');
      S.ln(c + `M${f(tx(-wsh * 0.8))} ${f(yS + 7)}L${f(tx(-3))} ${f(yS + 6)}M${f(tx(wsh * 0.8))} ${f(yS + 7)}L${f(tx(3))} ${f(yS + 6)}`, W(0.5), 'ink-soft');
      S.black(poly([[tx(-1.6), yS + 9], [tx(1.6), yS + 9], [tx(0), yS + 14]], true));
    }
    if (type === 'shawlDress') {
      const sh2 = smooth([[tx(-wsh * 1.05), yS + 1], [tx(0), yS - 2], [tx(wsh * 1.05), yS + 1], [tx(wsh * 0.6), yS + 22], [tx(0), yS + 30, 1], [tx(-wsh * 0.6), yS + 22]], true);
      S.fill(sh2, g.shawlTone ?? 'mid');
      S.ln(sh2, W(0.6), 'ink-soft');
      let fr = '';
      for (let i = -6; i <= 6; i++) fr += `M${f(tx(i * wsh * 0.09))} ${f(yS + 22 + (6 - Math.abs(i)) * 1.2)}l0 2.4`;
      S.ln(fr, W(0.45), 'ink-faint');
    }
    if (g.pearls) {
      let pr = '';
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (0.15 + 0.7 * (i / 10));
        pr += circ(tx(Math.cos(a) * 5.8), yS - 2 + Math.sin(a) * 5, 0.75);
      }
      S.fill(pr, 'paper');
      S.ln(pr, W(0.45), 'ink-soft');
    }
    if (g.jade) {
      S.ln(`M${f(tx(-4.4))} ${f(yS - 2)}Q${f(tx(0))} ${f(yS + 30)} ${f(tx(4.4))} ${f(yS - 2)}`, W(1.1), 'ink-soft', { 'stroke-dasharray': '1.2 0.7' });
      S.fill(ell(tx(0), yS + 15, 1.6, 2.2), 'mid');
    }
    if (g.brooch === 'fern') {
      const bx = tx(0);
      const by = yS - 1;
      S.fill(ell(bx, by, 1.8, 2.4), 'light');
      S.ln(`M${f(bx)} ${f(by + 2)}V${f(by - 2)}M${f(bx)} ${f(by + 1)}l-1.2 -1M${f(bx)} ${f(by + 1)}l1.2 -1M${f(bx)} ${f(by - 0.3)}l-1 -1M${f(bx)} ${f(by - 0.3)}l1 -1`, W(0.45), 'ink');
    }
    if (g.watch) {
      // montre de col en argent épinglée (côté gauche du personnage, image droite)
      const wx = tx(wsh * 0.42);
      const wy = yS + 6;
      S.ln(`M${f(wx - 1.6)} ${f(wy - 4)}l1.6 1.6l1.6 -1.6`, W(0.5), 'ink-soft');
      S.fill(circ(wx, wy, 2), 'paper');
      S.ln(circ(wx, wy, 2) + `M${f(wx)} ${f(wy)}v-1.2M${f(wx)} ${f(wy)}h0.9`, W(0.55), 'ink');
    }
    if (type === 'labcoat' || type === 'cire' || type === 'schoolBlouse') {
      S.ln(`M${f(tx(0))} ${f(yS + 2)}V${f(yHip)}`, W(0.6), 'ink-soft');
      let b = '';
      for (let i = 0; i < 4; i++) b += circ(tx(0.9), yS + 6 + i * 8, 0.6);
      S.fill(b, 'mid');
      if (g.pocket) {
        S.ln(rect(tx(-wsh * 0.7), yS + 8, 5, 4), W(0.5), 'ink-soft');
        if (g.insignia) S.fill(circ(tx(-wsh * 0.7 + 2.5), yS + 10, 0.8), 'dark');
      }
    }
    if (g.cork) {
      // gilet de liège : rangées de blocs lacés
      let blocks = '';
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 5; i++) blocks += rect(tx(-wsh * 0.86 + i * wsh * 0.35), yS + 3 + row * 8.4, wsh * 0.31, 7.4);
      S.fill(blocks, 'light');
      S.ln(blocks, W(0.5), 'ink-soft');
    }
    if (g.lanterns) {
      let lt = '';
      for (let i = 0; i < 5; i++) lt += rect(tx(-wsh * 0.6 + i * wsh * 0.3), yW + 6 + (i % 2) * 6, 1.6, 2.4);
      S.ln(lt, W(0.45), 'ink-soft');
    }
    if (g.sequins) {
      let sq = '';
      for (let i = 0; i < 26; i++) sq += circ(tx(r.range(-wsh * 0.8, wsh * 0.8)), r.range(yS + 6, yHip + 10), 0.45);
      S.fill(sq, 'paper');
    }
  }
  if (g.belt) S.fill(rect(tx(-waistW), yW - 1, 2 * waistW, 2.6), 'black', { opacity: 0.7 });
  if (g.embroidery) {
    let z = `M${f(tx(-waistW))} ${f(yW + 4)}`;
    for (let i = 1; i <= 10; i++) z += `L${f(tx(-waistW + (2 * waistW * i) / 10))} ${f(yW + 4 + (i % 2 ? -2 : 0))}`;
    S.ln(z, W(0.7), 'ink');
  }
  if (g.strap) {
    // bandoulière (sacoche)
    S.ln(`M${f(tx(wsh * 0.7))} ${f(yS - 1)}L${f(tx(-waistW * 1.1))} ${f(yW + 6)}`, W(1.6), 'ink');
  }
}

function drawArm(S, sp, arm, tx, wsh, yS, g, W) {
  const side = arm.side;
  const sx = tx(side * (wsh - 2.6));
  const pts = [[sx, yS + 3], ...arm.pts.map(([x, y]) => [x, y])];
  const sleeveTone = arm.tone ?? g.sleeveTone ?? g.tone ?? 'dark';
  const skin = { p: 'light', c: `skin-${sp.skin ?? 2}` };
  const n = pts.length;
  const wrist = pts[n - 1];
  if (arm.bare) {
    // bras de chemise ou manche retroussée : manche jusqu'au coude, avant-bras nu
    const elbow = pts[Math.max(1, n - 2)];
    const up = tube(pts.slice(0, Math.max(2, n - 1)), 8, 6.6);
    const fore = tube([elbow, wrist], 6, 4.6);
    S.fill(fore, skin);
    S.ln(fore, W(0.6), 'ink-soft');
    if (arm.tattoo) {
      // goéland tatoué, ailes ouvertes, bec crochu
      const mx = lerp(elbow[0], wrist[0], 0.45);
      const my = lerp(elbow[1], wrist[1], 0.45);
      const tt = arm.tattoo === true ? 1 : arm.tattoo;
      S.ln(`M${f(mx - 2.6 * tt)} ${f(my - 0.4 * tt)}Q${f(mx - 1.4 * tt)} ${f(my - 1.8 * tt)} ${f(mx)} ${f(my)}Q${f(mx + 1.4 * tt)} ${f(my - 1.8 * tt)} ${f(mx + 2.6 * tt)} ${f(my - 0.4 * tt)}M${f(mx)} ${f(my)}l0 ${f(1.2 * tt)}l${f(0.5 * tt)} ${f(-0.3 * tt)}`, W(0.7), 'ink');
    }
    S.fill(up, sleeveTone);
    if (arm.rolled !== false) S.fill(tube([pts[n - 2] ?? elbow, lerpPt(elbow, wrist, 0.12)], 7.4, 7), sleeveTone);
    S.ln(up, W(0.7), 'ink');
  } else {
    const sl = tube(pts, 8.4, 6.4);
    S.fill(sl, sleeveTone);
    S.ln(sl, W(0.7), 'ink');
    if (arm.cuff) {
      const c = tube([lerpPt(pts[n - 2], wrist, 0.6), wrist], 6.8, 6.6);
      S.fill(c, arm.cuff);
      S.ln(c, W(0.5), 'ink-soft');
    }
  }
  if (arm.hand !== false) {
    const h = arm.hand ?? {};
    const prev = pts[n - 2];
    const ang = (Math.atan2(wrist[1] - prev[1], wrist[0] - prev[0]) * 180) / Math.PI - 90;
    hand(S, wrist[0], wrist[1], h.ang ?? ang, h.size ?? 1.05, { skin: sp.skin, ...h }, W);
  }
  if (arm.hold) arm.hold(S, wrist, W);
}

function lerpPt(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

export { T };
