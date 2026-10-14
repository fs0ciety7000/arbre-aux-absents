/**
 * Objets du bureau de l'enquêteur (art clé et vignettes), en taille-douce rehaussée d'aquarelle.
 * Chaque fonction dessine dans un repère local ; l'appelant la pose avec `S.at(x, y, { rot, flat })`.
 *  - objets « à plat » (feuilles, dossiers, carte, loupe couchée) : dessinés vus de dessus, puis
 *    écrasés par `flat` (vue de trois quarts) ;
 *  - objets « debout » (lampe, tasse, tampon) : dessinés directement à l'écran.
 * Couleurs : ART_CLASSES seulement (DESIGN.md §10). Lavis : deux couches au plus.
 */
import {
  arc,
  blob,
  circ,
  clamp,
  ell,
  f,
  handLines,
  hatchLines,
  lerp,
  poly,
  rect,
  rrect,
  smooth,
  textLines,
  tube,
} from './lib.mjs';

/* ───────────────────────── Primitives ───────────────────────── */

/** Feuille au contour légèrement irrégulier ; rend son `d`. */
export function sheetPath(r, w, h, j = 0.8) {
  return poly(
    [
      [r.jit(j), r.jit(j)],
      [w * 0.5, r.jit(j * 0.6)],
      [w + r.jit(j), r.jit(j)],
      [w + r.jit(j * 0.6), h * 0.5],
      [w + r.jit(j), h + r.jit(j)],
      [w * 0.5, h + r.jit(j * 0.6)],
      [r.jit(j), h + r.jit(j)],
      [r.jit(j * 0.6), h * 0.5],
    ],
    true,
  );
}

/** Ombre portée douce (deux voiles décalés). */
export function dropShadow(S, d, dx = 5, dy = 7) {
  S.open({ transform: `translate(${f(dx)} ${f(dy)})` });
  S.p('ombre', d);
  S.close();
  S.open({ transform: `translate(${f(dx * 0.45)} ${f(dy * 0.45)})` });
  S.p('ombre', d);
  S.close();
}

/** Feuille de papier posée : ombre, papier, grain, bord. */
export function paperSheet(S, w, h, { tone = 'paper', wash, shadow = true, grain = true } = {}) {
  const d = sheetPath(S.r, w, h);
  if (shadow) dropShadow(S, d, 4, 6);
  S.p(tone, d);
  if (wash) S.p(wash, d, { 'fill-opacity': 0.55 });
  if (grain) S.p('stipple', d, { 'fill-opacity': 0.18 });
  S.ln(d, 0.6, 'ink-soft');
  return d;
}

/** Texte SVG réel (classes label*). */
export function text(S, x, y, s, { cls = 'label-note', size, anchor, rot, extra = {} } = {}) {
  const a = {
    x: f(x),
    y: f(y),
    'font-size': size,
    'text-anchor': anchor,
    transform: rot ? `rotate(${f(rot)} ${f(x)} ${f(y)})` : undefined,
    ...extra,
  };
  const at = Object.entries(a)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  S.raw(`<text class="${cls}"${at}>${s}</text>`);
}

/* ───────────────────────── Fougère ───────────────────────── */

/**
 * Fronde de fougère : tige et pinnules (chaque pinnule est une feuille fermée, ses lobes en
 * dents). Rend { stem, pinnae[], veins, tip }.
 */
export function fernFrond(
  x,
  y,
  len,
  { angle = 0, pairs = 12, spread = 0.4, curve = 0.08, lobes = 4, r } = {},
) {
  const a = (angle * Math.PI) / 180;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const nx = -uy;
  const ny = ux;
  const at = (t) => {
    const bend = Math.sin(t * Math.PI * 0.9) * curve * len;
    return [x + ux * len * t + nx * bend, y + uy * len * t + ny * bend];
  };
  const dir = (t) => {
    const p = at(t);
    const q = at(Math.min(1, t + 0.01));
    return Math.atan2(q[0] - p[0], -(q[1] - p[1]));
  };
  const stemPts = [];
  for (let i = 0; i <= 14; i++) stemPts.push(at(i / 14));
  const pinnae = [];
  let veins = '';
  for (let i = 0; i < pairs; i++) {
    const t = 0.1 + (0.86 * i) / pairs;
    const L = len * spread * (1 - 0.78 * Math.pow(t, 1.25)) * (i === 0 ? 0.85 : 1);
    for (const side of [-1, 1]) {
      const tt = side > 0 ? t + 0.35 / pairs : t;
      const [px, py] = at(tt);
      const ang = dir(tt) + side * (1.0 + (r ? r.jit(0.06) : 0));
      const dx = Math.sin(ang);
      const dy = -Math.cos(ang);
      const nxx = -dy;
      const nyy = dx;
      const wv = L * 0.2;
      // contour lobé : `lobes` dents de chaque côté
      const up = [];
      const dn = [];
      for (let k = 0; k <= lobes; k++) {
        const s = k / lobes;
        const wk = wv * Math.sin(Math.PI * Math.min(1, s * 1.05 + 0.08)) * (1 - 0.35 * s);
        const ax = px + dx * L * s;
        const ay = py + dy * L * s;
        const bump = k % 2 ? 1 : 0.72;
        up.push([ax + nxx * wk * bump, ay + nyy * wk * bump]);
        dn.push([ax - nxx * wk * bump, ay - nyy * wk * bump]);
      }
      const tip = [px + dx * L * 1.04, py + dy * L * 1.04, 1];
      pinnae.push(smooth([[px, py, 1], ...up.slice(1), tip, ...dn.slice(1).reverse()], true, 0.8));
      veins += `M${f(px)} ${f(py)}L${f(px + dx * L * 0.85)} ${f(py + dy * L * 0.85)}`;
    }
  }
  return { stem: smooth(stemPts), pinnae, veins, tip: at(1), base: [x, y] };
}

/** Dessine une fronde (lavis sauge, trait). */
export function drawFern(S, x, y, len, o = {}) {
  const fr = fernFrond(x, y, len, { r: S.r, ...o });
  const all = fr.pinnae.join('');
  S.p('paper', all, { 'fill-opacity': o.paperOpacity ?? 0 });
  S.p(o.wash ?? 'wash-sauge', all);
  if (o.wash2) S.p(o.wash2, all, { 'fill-opacity': 0.6 });
  S.ln(all, o.w ?? 0.6, 'ink-soft');
  S.ln(fr.veins, 0.5, 'ink-faint');
  S.ln(fr.stem, o.stemW ?? 1.3, 'ink');
  return fr;
}

/* ───────────────────────── Lampe ───────────────────────── */

/**
 * Lampe articulée de laiton, debout. Origine : centre du socle au sol.
 * Rend les points utiles (dans le repère local) : bouche de l'abat-jour, axe.
 */
export function lamp(
  S,
  { stemH = 190, arm = [130, -60], aim = 35, shadeL = 74, shadeR = 50 } = {},
) {
  const r = S.r;
  // Socle (cylindre bas)
  const bx = 52;
  const by = 15;
  const bh = 12;
  const side = `M${-bx} 0A${bx} ${by} 0 0 0 ${bx} 0V${-bh}A${bx} ${by} 0 0 1 ${-bx} ${-bh}Z`;
  S.p('ombre', ell(18, 4, bx * 1.25, by * 1.3));
  S.wash(side, 'hair-blond', 'hair-roux');
  S.hatchIn(side, [-bx, -bh - by, bx, by], 80, 2.2, 0.5, 'ink-soft');
  S.wash(ell(0, -bh, bx, by), 'hair-blond', 'wash-safran');
  S.p('rehaut', ell(-14, -bh - 4, bx * 0.45, by * 0.3), { opacity: 0.5 });
  S.ln(arc(0, -bh, bx * 0.72, by * 0.72, 0, Math.PI * 2, 20), 0.6, 'ink-faint');
  S.ln(side, 1.2, 'ink');
  S.ln(ell(0, -bh, bx, by), 1, 'ink');
  // Interrupteur
  S.wash(rrect(18, -bh - 8, 12, 7, 2), 'wash-ardoise');
  S.ln(rrect(18, -bh - 8, 12, 7, 2), 0.7, 'ink');
  // Montant
  const top = [0, -stemH];
  const stem = tube([[0, -bh - 2], [0, -stemH * 0.5], top], 7, 6);
  S.wash(stem, 'hair-blond', 'wash-safran');
  S.hatchIn(stem, [2, -stemH, 6, -bh], 90, 1.4, 0.5, 'ink-soft');
  S.p('rehaut', rect(-2.4, -stemH + 6, 1.4, stemH - 24), { opacity: 0.7 });
  S.ln(stem, 1, 'ink');
  // Rotule
  const joint = (x, y) => {
    S.wash(circ(x, y, 7.5), 'hair-blond', 'hair-roux');
    S.p('rehaut', circ(x - 2.5, y - 2.5, 2.4), { opacity: 0.8 });
    S.ln(circ(x, y, 7.5), 1, 'ink');
    S.black(circ(x, y, 1.6));
  };
  // Bras
  const end = [top[0] + arm[0], top[1] + arm[1]];
  const armD = tube([top, [lerp(top[0], end[0], 0.5), lerp(top[1], end[1], 0.5) - 4], end], 6, 5);
  S.wash(armD, 'hair-blond', 'wash-safran');
  S.p(
    'rehaut',
    tube(
      [
        [top[0] + 6, top[1] - 3.5],
        [end[0] - 6, end[1] - 2.5],
      ],
      1.2,
    ),
    { opacity: 0.7 },
  );
  S.ln(armD, 1, 'ink');
  // Ressorts du bras (petits traits)
  let spring = '';
  for (let i = 0; i < 9; i++) {
    const t = 0.2 + i * 0.06;
    const x = lerp(top[0], end[0], t);
    const y = lerp(top[1], end[1], t) + 8;
    spring += `M${f(x - 1.5)} ${f(y - 2.5)}l3 5`;
  }
  S.ln(
    `M${f(top[0] + 8)} ${f(top[1] + 8)}L${f(lerp(top[0], end[0], 0.75))} ${f(lerp(top[1], end[1], 0.75) + 8)}`,
    0.6,
    'ink-soft',
  );
  S.ln(spring, 0.6, 'ink-soft');
  joint(top[0], top[1]);
  // Abat-jour : cône d'axe `aim` (degrés depuis la verticale vers la droite)
  const a = (aim * Math.PI) / 180;
  const ax = Math.sin(a);
  const ay = Math.cos(a);
  const apex = [end[0] + ax * 6, end[1] + ay * 6];
  const mouth = [apex[0] + ax * shadeL, apex[1] + ay * shadeL];
  const nx = ay;
  const ny = -ax;
  const k = 0.42; // ouverture de l'ellipse vue
  const e1 = [mouth[0] + nx * shadeR, mouth[1] + ny * shadeR];
  const e2 = [mouth[0] - nx * shadeR, mouth[1] - ny * shadeR];
  const cap1 = [apex[0] + nx * 13, apex[1] + ny * 13];
  const cap2 = [apex[0] - nx * 13, apex[1] - ny * 13];
  const rot = (Math.atan2(ny, nx) * 180) / Math.PI;
  const mouthD = `M${f(e1[0])} ${f(e1[1])}A${shadeR} ${f(shadeR * k)} ${f(rot)} 0 0 ${f(e2[0])} ${f(e2[1])}A${shadeR} ${f(shadeR * k)} ${f(rot)} 0 0 ${f(e1[0])} ${f(e1[1])}Z`;
  const back = `M${f(e1[0])} ${f(e1[1])}A${shadeR} ${f(shadeR * k)} ${f(rot)} 0 1 ${f(e2[0])} ${f(e2[1])}`;
  const shell = `M${f(cap2[0])} ${f(cap2[1])}Q${f(apex[0] - nx * 20 - ax * 6)} ${f(apex[1] - ny * 20 - ay * 6)} ${f(apex[0])} ${f(apex[1] - 0)}Q${f(apex[0] + nx * 20 - ax * 6)} ${f(apex[1] + ny * 20 - ay * 6)} ${f(cap1[0])} ${f(cap1[1])}L${f(e1[0])} ${f(e1[1])}A${shadeR} ${f(shadeR * k)} ${f(rot)} 0 1 ${f(e2[0])} ${f(e2[1])}Z`;
  // Coque émaillée vert céladon, hachée côté ombre
  S.wash(shell, 'wash-celadon', 'wash-sauge');
  S.within(shell, () => {
    S.ln(
      hatchLines([apex[0] - 90, apex[1] - 90, apex[0] + 90, apex[1] + 120], aim + 90, 2.4, r),
      0.6,
      'ink-soft',
    );
    S.p(
      'hatch-dense',
      `M${f(cap2[0])} ${f(cap2[1])}L${f(e2[0])} ${f(e2[1])}L${f(lerp(e2[0], e1[0], 0.35))} ${f(lerp(e2[1], e1[1], 0.35))}L${f(apex[0])} ${f(apex[1])}Z`,
    );
    S.p(
      'rehaut',
      tube(
        [
          [lerp(cap1[0], e1[0], 0.15), lerp(cap1[1], e1[1], 0.15)],
          [lerp(cap1[0], e1[0], 0.85), lerp(cap1[1], e1[1], 0.85)],
        ],
        3,
      ),
      { opacity: 0.55 },
    );
  });
  S.ln(shell, 1.3, 'ink');
  // Intérieur lumineux
  S.wash(mouthD, 'wash-safran');
  S.p('rehaut', mouthD, { opacity: 0.6 });
  // Ampoule
  const bulb = [mouth[0] - ax * 14, mouth[1] - ay * 14];
  S.p('rehaut', circ(bulb[0], bulb[1], 15));
  S.p('wash-safran', circ(bulb[0], bulb[1], 15), { 'fill-opacity': 0.5 });
  S.p('rehaut', circ(bulb[0], bulb[1], 9));
  S.ln(mouthD, 1.4, 'ink');
  S.ln(back, 0.6, 'ink-soft');
  // Rebord roulé de l'abat-jour
  S.ln(mouthD, 3, 'ink-soft', { 'stroke-opacity': 0.35 });
  joint(end[0], end[1]);
  return { mouth, axis: [ax, ay], shadeR, k, rot, bulb, apex };
}

/* ───────────────────────── Tasse de thé ───────────────────────── */

/** Tasse et soucoupe (debout). Origine : centre de la soucoupe. Rend le centre du thé. */
export function teacup(S, { R = 46 } = {}) {
  const r = S.r;
  // Soucoupe
  S.p('ombre', ell(10, 8, R * 1.15, R * 0.42));
  S.wash(ell(0, 0, R, R * 0.36), 'wash-celadon');
  S.p('paper', ell(0, -2, R * 0.66, R * 0.22));
  S.ln(ell(0, 0, R, R * 0.36), 1.1, 'ink');
  S.ln(ell(0, -1, R * 0.86, R * 0.29), 0.6, 'ink-soft');
  S.ln(ell(0, -2, R * 0.66, R * 0.22), 0.5, 'ink-faint');
  // Corps de la tasse
  const cw = R * 0.62;
  const top = -R * 0.85;
  const body = `M${f(-cw)} ${f(top)}C${f(-cw)} ${f(top + R * 0.55)} ${f(-cw * 0.55)} ${f(-4)} 0 ${f(-3)}C${f(cw * 0.55)} ${f(-4)} ${f(cw)} ${f(top + R * 0.55)} ${f(cw)} ${f(top)}Z`;
  // Anse
  const handle = smooth([
    [cw - 2, top + 8],
    [cw + 16, top + 4],
    [cw + 19, top + 16],
    [cw + 8, top + 30],
    [cw - 6, top + 32],
  ]);
  S.ln(handle, 6, 'ink');
  S.ln(handle, 3.4, 'ink-soft', { 'stroke-opacity': 0 });
  S.p(
    'paper',
    tube(
      [
        [cw - 2, top + 8],
        [cw + 14, top + 6],
        [cw + 16, top + 16],
        [cw + 6, top + 28],
        [cw - 6, top + 30],
      ],
      3.2,
    ),
  );
  S.wash(body, null);
  // Frise peinte (indigo) et fleurettes carmin
  S.within(body, () => {
    S.p('wash-indigo', rect(-cw, top + 9, cw * 2, 5));
    S.p('wash-celadon', rect(-cw, top + 9, cw * 2, 2));
    for (let i = -2; i <= 2; i++) {
      const x = i * cw * 0.38;
      const y = top + 26 + Math.abs(i) * 1.5;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        S.p('wash-carmin', circ(x + Math.cos(a) * 3, y + Math.sin(a) * 2.2, 2.2));
      }
      S.p('wash-safran', circ(x, y, 1.4));
      S.ln(`M${f(x + 4)} ${f(y + 1)}q5 2 9 -2`, 0.5, 'ink-faint');
    }
    S.ln(hatchLines([cw * 0.2, top, cw, 0], 100, 2.2, r), 0.5, 'ink-faint');
    S.p(
      'rehaut',
      tube(
        [
          [-cw * 0.62, top + 6],
          [-cw * 0.55, top + 30],
          [-cw * 0.35, top + 42],
        ],
        4,
        1.5,
      ),
      { opacity: 0.9 },
    );
  });
  S.ln(body, 1.2, 'ink');
  // Thé
  S.wash(ell(0, top, cw, cw * 0.32), 'wash-sienne', 'wash-safran');
  S.p('ombre', ell(cw * 0.12, top + 1.5, cw * 0.82, cw * 0.22));
  S.p('rehaut', ell(-cw * 0.35, top - 1, cw * 0.28, cw * 0.06), { opacity: 0.7 });
  S.ln(ell(0, top, cw, cw * 0.32), 1, 'ink');
  // Cuillère
  S.p(
    'wash-ardoise',
    tube(
      [
        [R * 0.2, -4],
        [R * 0.75, 4],
        [R * 1.05, 10],
      ],
      2.4,
      3,
    ),
  );
  S.ln(
    tube(
      [
        [R * 0.2, -4],
        [R * 0.75, 4],
        [R * 1.05, 10],
      ],
      2.4,
      3,
    ),
    0.6,
    'ink',
  );
  return { tea: [0, top] };
}

/** Vapeur : trois volutes (tubes de papier translucide). */
export function steam(S, x, y, { h = 110, n = 3 } = {}) {
  const r = S.r;
  for (let i = 0; i < n; i++) {
    const ox = x + (i - (n - 1) / 2) * 11;
    const pts = [];
    const ph = r.range(0, Math.PI * 2);
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push([ox + Math.sin(ph + t * 5.2) * (5 + t * 14), y - t * h * r.range(0.85, 1.05)]);
    }
    S.p('paper', tube(pts, 5.5, 1), { 'fill-opacity': 0.16 });
    S.p('paper', tube(pts.slice(0, 6), 2.2, 0.6), { 'fill-opacity': 0.28 });
  }
}

/* ───────────────────────── Loupe ───────────────────────── */

/** Loupe couchée (à plat). Origine : centre de la lentille. `inner` dessine le grossissement. */
export function magnifier(S, { R = 50, handle = 120, angle = 35, inner } = {}) {
  const a = (angle * Math.PI) / 180;
  const hx = Math.cos(a);
  const hy = Math.sin(a);
  const h0 = [hx * (R + 6), hy * (R + 6)];
  const h1 = [hx * (R + 18), hy * (R + 18)];
  const h2 = [hx * (R + handle), hy * (R + handle)];
  // Ombres
  S.open({ transform: 'translate(9 12)' });
  S.p('ombre', circ(0, 0, R + 6));
  S.p('ombre', tube([h0, h2], 13, 15));
  S.close();
  // Manche bois tourné
  const hd = tube([h1, [lerp(h1[0], h2[0], 0.5), lerp(h1[1], h2[1], 0.5)], h2], 13, 16);
  S.wash(hd, 'wash-sienne', 'wash-carmin');
  S.within(hd, () => {
    S.ln(
      hatchLines([h1[0] - 40, h1[1] - 40, h2[0] + 40, h2[1] + 40], angle + 90, 1.8, S.r),
      0.5,
      'ink-soft',
    );
  });
  S.p(
    'rehaut',
    tube(
      [
        [h1[0] + 3 * hy, h1[1] - 3 * hx],
        [h2[0] + 4 * hy, h2[1] - 4 * hx],
      ],
      2.2,
    ),
    { opacity: 0.6 },
  );
  S.ln(hd, 1.1, 'ink');
  for (const t of [0.12, 0.2, 0.86]) {
    const p = [lerp(h1[0], h2[0], t), lerp(h1[1], h2[1], t)];
    S.ln(
      `M${f(p[0] - hy * 8)} ${f(p[1] + hx * 8)}L${f(p[0] + hy * 8)} ${f(p[1] - hx * 8)}`,
      0.8,
      'ink',
    );
  }
  // Virole
  const fer = tube([h0, h1], 10, 12);
  S.wash(fer, 'wash-safran', 'wash-sienne');
  S.ln(fer, 1, 'ink');
  // Lentille
  if (inner) {
    S.within(circ(0, 0, R), inner);
  }
  S.p('water', circ(0, 0, R), { 'fill-opacity': 0.28 });
  S.p(
    'rehaut',
    `M${f(-R * 0.7)} ${f(-R * 0.15)}A${R * 0.72} ${R * 0.72} 0 0 1 ${f(-R * 0.1)} ${f(-R * 0.7)}L${f(-R * 0.05)} ${f(-R * 0.55)}A${R * 0.56} ${R * 0.56} 0 0 0 ${f(-R * 0.55)} ${f(-R * 0.1)}Z`,
    { opacity: 0.75 },
  );
  S.p('rehaut', circ(R * 0.45, R * 0.45, R * 0.07), { opacity: 0.6 });
  // Cerclage laiton
  const ring = `${circ(0, 0, R + 5)}${circ(0, 0, R)}`;
  S.wash(ring, 'wash-safran', 'wash-sienne', { 'fill-rule': 'evenodd' });
  S.p(
    'rehaut',
    arc(0, 0, R + 2.5, R + 2.5, Math.PI * 1.05, Math.PI * 1.55, 8).replace(/^M/, 'M'),
    {},
  );
  S.ln(arc(0, 0, R + 2.5, R + 2.5, Math.PI * 1.05, Math.PI * 1.55, 8), 1.6, 'ink-faint', {
    'stroke-opacity': 0,
  });
  S.ln(circ(0, 0, R + 5), 1.2, 'ink');
  S.ln(circ(0, 0, R), 0.8, 'ink');
}

/* ───────────────────────── Tampon encreur ───────────────────────── */

/** Tampon de bois debout. Origine : centre de la semelle au sol. */
export function rubberStamp(S, { w = 46 } = {}) {
  const r = S.r;
  const h = 16;
  S.p('ombre', ell(14, 4, w * 0.9, w * 0.28));
  // Semelle (caoutchouc) + plaque
  const base = `M${-w / 2} ${-3}L${-w / 2} ${-h}L${w / 2} ${-h}L${w / 2} ${-3}Q0 4 ${-w / 2} -3Z`;
  S.wash(base, 'wash-sienne', 'wash-carmin');
  S.hatchIn(base, [-w / 2, -h, w / 2, 4], 95, 2, 0.5, 'ink-soft');
  S.ln(base, 1.1, 'ink');
  S.wash(
    `M${-w / 2} ${-h}L${-w / 2 + 6} ${-h - 7}L${w / 2 - 6} ${-h - 7}L${w / 2} ${-h}Z`,
    'wash-sienne',
  );
  S.ln(`M${-w / 2} ${-h}L${-w / 2 + 6} ${-h - 7}L${w / 2 - 6} ${-h - 7}L${w / 2} ${-h}Z`, 1, 'ink');
  S.black(rect(-w / 2, -5, w, 3), { 'fill-opacity': 0.9 });
  // Manche tourné
  const neck = smooth(
    [
      [-6, -h - 7],
      [-5, -h - 20],
      [-9, -h - 32],
      [-16, -h - 48],
      [-14, -h - 62],
      [0, -h - 70],
      [14, -h - 62],
      [16, -h - 48],
      [9, -h - 32],
      [5, -h - 20],
      [6, -h - 7],
    ],
    true,
    0.8,
  );
  S.wash(neck, 'wash-sienne', 'wash-safran');
  S.hatchIn(neck, [0, -h - 72, 18, -h], 92, 1.8, 0.5, 'ink-soft');
  S.p(
    'rehaut',
    tube(
      [
        [-9, -h - 58],
        [-11, -h - 48],
        [-5, -h - 28],
      ],
      3,
      1.2,
    ),
    { opacity: 0.7 },
  );
  S.ln(neck, 1.1, 'ink');
  S.ln(arc(0, -h - 32, 9, 2.5, 0, Math.PI, 8), 0.6, 'ink-soft');
  void r;
}

/** Boîte de tampon encreur (à plat). Origine : coin. */
export function inkPad(S, { w = 96, h = 64 } = {}) {
  const box = rrect(0, 0, w, h, 6);
  dropShadow(S, box, 5, 7);
  S.wash(box, 'wash-ardoise', 'wash-indigo');
  S.ln(box, 1.1, 'ink');
  const pad = rrect(7, 7, w - 14, h - 14, 4);
  S.p('wash-indigo', pad);
  S.p('wash-lilas', pad);
  S.p('stipple', pad);
  S.p('hatch', pad, { 'fill-opacity': 0.8 });
  S.ln(pad, 0.7, 'ink-soft');
  S.p('rehaut', rrect(3, 2, w - 6, 3, 1.5), { opacity: 0.55 });
}

/**
 * Empreinte « ÉTABLI » (cadre double, texte réel, date), en encre : à poser sur une feuille.
 * Origine : centre.
 */
export function stampImprint(
  S,
  { w = 120, h = 46, word = 'ÉTABLI', date = 'oct. 1974', size = 22 } = {},
) {
  const outer = rrect(-w / 2, -h / 2, w, h, 6);
  const inner = rrect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4);
  S.ln(outer, 2.2, 'ink');
  S.ln(inner, 0.8, 'ink');
  text(S, 0, size * 0.18, word, { cls: 'label-major', size, anchor: 'middle' });
  text(S, 0, h / 2 - 7.5, date, { cls: 'label-note', size: 8.5, anchor: 'middle' });
}

/* ───────────────────────── Dossiers de kraft ───────────────────────── */

/** Pile de chemises cartonnées (à plat). Origine : coin haut gauche de la chemise du dessus. */
export function folders(S, { w = 300, h = 210, n = 3, label = 'O.R.C.', ref = 'n° 74-0112' } = {}) {
  const r = S.r;
  const tones = [
    ['skin-3', 'wash-safran'],
    ['skin-2', 'wash-sienne'],
    ['skin-4', null],
  ];
  for (let i = n - 1; i >= 0; i--) {
    const ox = i * 12 + r.jit(3);
    const oy = i * 9 + r.jit(3);
    const rot = i * 2.2 - 1;
    S.open({ transform: `translate(${f(ox)} ${f(oy)}) rotate(${f(rot)})` });
    const d = `M0 6Q0 0 6 0H${f(w * 0.36 + i * 30)}l8 -14H${f(w * 0.36 + i * 30 + 70)}l8 14H${f(w - 6)}Q${f(w)} 0 ${f(w)} 6V${f(h - 6)}Q${f(w)} ${f(h)} ${f(w - 6)} ${f(h)}H6Q0 ${f(h)} 0 ${f(h - 6)}Z`;
    if (i === n - 1) dropShadow(S, d, 7, 10);
    else S.p('ombre', d, { transform: 'translate(3 4)' });
    // feuilles qui dépassent
    S.p('paper', rect(w - 22 + r.jit(4), 18 + i * 14, 30, h - 50));
    S.ln(rect(w - 22, 18 + i * 14, 30, h - 50), 0.5, 'ink-soft');
    S.wash(d, ...tones[i % tones.length]);
    S.p('stipple', d, { 'fill-opacity': 0.35 });
    S.ln(d, 1.1, 'ink');
    S.ln(`M${f(w * 0.08)} 18H${f(w * 0.92)}`, 0.5, 'ink-faint');
    S.close();
  }
  // Étiquette de la chemise du dessus
  const lab = rect(w * 0.12, h * 0.26, w * 0.5, 54);
  S.p('paper', lab);
  S.ln(lab, 0.7, 'ink');
  S.ln(rect(w * 0.12 + 3, h * 0.26 + 3, w * 0.5 - 6, 48), 0.5, 'ink-faint');
  text(S, w * 0.12 + 10, h * 0.26 + 20, label, { cls: 'label', size: 13 });
  text(S, w * 0.12 + 10, h * 0.26 + 40, ref, { cls: 'label-note', size: 11 });
  // Cordon rouge noué
  const cx = w * 0.85;
  S.p(
    'wash-carmin',
    tube(
      [
        [cx, -4],
        [cx + 2, h * 0.5],
        [cx, h + 6],
      ],
      3,
    ),
  );
  S.p(
    'wash-carmin',
    tube(
      [
        [cx, h * 0.55],
        [cx - 18, h * 0.62],
        [cx - 30, h * 0.8],
        [cx - 22, h * 0.9],
      ],
      2.6,
      2,
    ),
  );
  S.p(
    'wash-carmin',
    tube(
      [
        [cx, h * 0.55],
        [cx + 22, h * 0.66],
        [cx + 26, h * 0.86],
      ],
      2.6,
      2,
    ),
  );
  S.ln(`M${f(cx)} -4L${f(cx + 2)} ${f(h * 0.5)}L${f(cx)} ${f(h + 6)}`, 0.5, 'ink-soft');
  S.wash(circ(cx, h * 0.53, 6), 'wash-safran', 'wash-sienne');
  S.ln(circ(cx, h * 0.53, 6), 0.8, 'ink');
  // Tampon d'archive en coin
  S.open({ transform: `translate(${f(w * 0.36)} ${f(h * 0.78)}) rotate(-8)` });
  S.ln(rrect(-34, -11, 68, 22, 3), 1, 'ink-soft');
  text(S, 0, 4, 'ARCHIVES', { cls: 'label', size: 9.5, anchor: 'middle' });
  S.close();
}

/* ───────────────────────── Arbre au crayon ───────────────────────── */

/**
 * Brouillon d'arbre généalogique (feuille à plat) : médaillons vides, liens au crayon.
 * Origine : coin haut gauche. Rend les centres des médaillons.
 */
export function treeSheet(S, { w = 380, h = 270, rows = [2, 4, 6], marks = true } = {}) {
  const r = S.r;
  paperSheet(S, w, h, { tone: 'paper' });
  // quadrillage léger
  let grid = '';
  for (let x = 16; x < w - 6; x += 16) grid += `M${x} 6V${h - 6}`;
  for (let y = 16; y < h - 6; y += 16) grid += `M6 ${y}H${w - 6}`;
  S.ln(grid, 0.5, 'ink-faint', { 'stroke-opacity': 0.35 });
  // titre manuscrit
  S.ln(handLines(r, 22, 26, w * 0.42, 1, 10, { h: 3.4, step: 3.2, last: 1 }), 0.8, 'ink');
  S.ln(`M20 33H${f(22 + w * 0.42)}`, 0.6, 'ink-soft');
  const centers = [];
  const top = 66;
  const gap = (h - top - 30) / (rows.length - 1 || 1);
  rows.forEach((n, ri) => {
    const y = top + ri * gap;
    const row = [];
    for (let i = 0; i < n; i++) {
      const x = w * ((i + 0.5) / n) * 0.88 + w * 0.06 + r.jit(3);
      row.push([x, y + r.jit(2)]);
    }
    centers.push(row);
  });
  // Liens (crayon) : couples → enfants
  let links = '';
  for (let ri = 0; ri < centers.length - 1; ri++) {
    const parents = centers[ri];
    const kids = centers[ri + 1];
    const per = kids.length / parents.length;
    for (let i = 0; i < parents.length; i += 2) {
      const a = parents[i];
      const b = parents[i + 1] ?? parents[i];
      const my = a[1] + 2;
      links += `M${f(a[0] + 18)} ${f(my)}H${f(b[0] - 18)}`;
      const mx = (a[0] + b[0]) / 2;
      const ky = kids[0][1] - 26;
      links += `M${f(mx)} ${f(my)}V${f(ky)}`;
      const k0 = Math.floor(i * per);
      const k1 = Math.min(kids.length - 1, Math.floor((i + 2) * per) - 1);
      links += `M${f(kids[k0][0])} ${f(ky)}H${f(kids[k1][0])}`;
      for (let k = k0; k <= k1; k++) links += `M${f(kids[k][0])} ${f(ky)}V${f(kids[k][1] - 17)}`;
    }
  }
  S.ln(links, 1.1, 'ink-soft');
  // Médaillons
  let ci = 0;
  for (const row of centers) {
    for (const [x, y] of row) {
      const rx = 17;
      const ry = 15;
      const d = ell(x, y, rx, ry);
      S.p('paper', d);
      const kind = (ci * 7 + 3) % 5;
      if (marks && kind === 1) S.p('wash-safran', d);
      if (marks && kind === 3) S.p('hatch', d);
      S.ln(d, 1.5, 'ink');
      S.ln(ell(x, y, rx - 3, ry - 3), 0.6, 'ink-soft');
      // nom sous le médaillon (illisible) ou point d'interrogation
      if (marks && (kind === 0 || kind === 4)) {
        text(S, x, y + 5, '?', { cls: 'label-note', size: 15, anchor: 'middle' });
      }
      S.ln(`M${f(x - 12)} ${f(y + 22)}h${f(24 * r.range(0.5, 1))}`, 0.6, 'ink-faint');
      ci++;
    }
  }
  return centers;
}

/** Crayon de papier (à plat). Origine : pointe. */
export function pencil(S, { len = 150, angle = -20 } = {}) {
  S.open({ transform: `rotate(${f(angle)})` });
  const body = poly(
    [
      [16, -4.5],
      [len, -4.5],
      [len, 4.5],
      [16, 4.5],
    ],
    true,
  );
  S.p('ombre', body, { transform: 'translate(3 5)' });
  S.wash(body, 'wash-safran', 'wash-carmin');
  S.ln(`M16 -1.5H${len}M16 1.5H${len}`, 0.5, 'ink-faint');
  S.ln(body, 0.9, 'ink');
  const tipD = `M0 0L16 -4.5V4.5Z`;
  S.wash(tipD, 'wash-sienne');
  S.black('M0 0L5 -1.4V1.4Z');
  S.ln(tipD, 0.8, 'ink');
  S.wash(rect(len, -4.5, 9, 9), 'wash-ardoise');
  S.p('wash-carmin', rect(len + 9, -4.5, 8, 9));
  S.ln(rect(len, -4.5, 17, 9), 0.8, 'ink');
  S.close();
}

/* ───────────────────────── Photographies ───────────────────────── */

/**
 * Tirage argentique à bord blanc (à plat). `scene` : 'beach' (deux silhouettes de dos vers un
 * phare), 'house' (maison et arbre), 'back' (verso manuscrit), 'group' (groupe coupé aux épaules).
 * Aucun visage n'est montré. Origine : coin haut gauche.
 */
export function photo(S, { w = 110, h = 80, scene = 'beach', border = 6, shadow = true } = {}) {
  const r = S.r;
  const d = rect(0, 0, w, h);
  if (shadow) dropShadow(S, d, 4, 6);
  S.p('photo-paper', d);
  S.ln(d, 0.5, 'ink-faint');
  const iw = w - border * 2;
  const ih = h - border * 2 - (scene === 'back' ? 0 : 4);
  const x0 = border;
  const y0 = border;
  if (scene === 'back') {
    S.ln(handLines(r, 10, 20, w - 24, 3, 12, { h: 2.6, step: 2.8 }), 0.7, 'ink-soft');
    S.ln(rrect(w - 46, h - 26, 38, 18, 3), 0.6, 'ink-faint');
    text(S, w - 27, h - 14, 'STUDIO', { cls: 'label-note', size: 7, anchor: 'middle' });
    return d;
  }
  const win = rect(x0, y0, iw, ih);
  S.within(win, () => {
    if (scene === 'beach') {
      S.p('photo-light', win);
      S.p('photo-mid', rect(x0, y0 + ih * 0.55, iw, ih * 0.45));
      S.p(
        'photo-light',
        `M${x0} ${f(y0 + ih * 0.7)}Q${f(x0 + iw * 0.5)} ${f(y0 + ih * 0.6)} ${f(x0 + iw)} ${f(y0 + ih * 0.66)}V${f(y0 + ih)}H${x0}Z`,
      );
      S.p('stipple', rect(x0, y0 + ih * 0.7, iw, ih * 0.3));
      // phare au loin
      const lx = x0 + iw * 0.78;
      const ly = y0 + ih * 0.55;
      S.p('photo-mid', `M${f(lx - 8)} ${f(ly)}Q${f(lx)} ${f(ly - 6)} ${f(lx + 14)} ${f(ly)}Z`);
      S.p(
        'photo-paper',
        poly(
          [
            [lx - 2.2, ly - 3],
            [lx - 1.4, ly - 20],
            [lx + 1.4, ly - 20],
            [lx + 2.2, ly - 3],
          ],
          true,
        ),
      );
      S.p('photo-dark', rect(lx - 1.8, ly - 13, 3.6, 3));
      S.p('photo-dark', rect(lx - 2, ly - 23, 4, 3));
      // deux silhouettes de dos
      const fig = (x, y, s, coat) => {
        S.p(
          'photo-dark',
          `M${f(x - 5 * s)} ${f(y)}L${f(x - 4 * s)} ${f(y - 16 * s)}Q${f(x)} ${f(y - 20 * s)} ${f(x + 4 * s)} ${f(y - 16 * s)}L${f(x + 5 * s)} ${f(y)}Z`,
        );
        S.p(coat, circ(x, y - 22 * s, 3.2 * s));
        S.p('photo-dark', rect(x - 3 * s, y, 2 * s, 6 * s));
        S.p('photo-dark', rect(x + 1 * s, y, 2 * s, 6 * s));
      };
      fig(x0 + iw * 0.38, y0 + ih * 0.78, 1, 'photo-dark');
      fig(x0 + iw * 0.48, y0 + ih * 0.8, 0.85, 'photo-mid');
    } else if (scene === 'house') {
      S.p('photo-light', win);
      S.p('photo-mid', rect(x0, y0 + ih * 0.72, iw, ih * 0.28));
      const hx = x0 + iw * 0.18;
      const hy = y0 + ih * 0.32;
      S.p('photo-paper', rect(hx, hy, iw * 0.46, ih * 0.42));
      S.p(
        'photo-dark',
        poly(
          [
            [hx - 4, hy],
            [hx + iw * 0.23, hy - ih * 0.2],
            [hx + iw * 0.46 + 4, hy],
          ],
          true,
        ),
      );
      for (let i = 0; i < 3; i++) S.p('photo-mid', rect(hx + 5 + i * iw * 0.14, hy + 8, 6, 9));
      S.p('photo-dark', rect(hx + iw * 0.2, hy + ih * 0.22, 7, ih * 0.2));
      S.p(
        'photo-dark',
        blob(r, x0 + iw * 0.82, y0 + ih * 0.4, iw * 0.16, ih * 0.3, { n: 14, amp: 0.15 }),
      );
      S.p('photo-dark', rect(x0 + iw * 0.81, y0 + ih * 0.6, 3, ih * 0.15));
      S.p('stipple', win, { 'fill-opacity': 0.5 });
    } else if (scene === 'group') {
      S.p('photo-light', win);
      S.p('photo-mid', rect(x0, y0 + ih * 0.62, iw, ih * 0.38));
      S.p('photo-paper', rect(x0 + iw * 0.06, y0, iw * 0.4, ih * 0.62));
      // trois personnes en buste, coupées aux épaules par le bord déchiré
      [
        [0.24, 'photo-dark', 1.05],
        [0.52, 'photo-mid', 0.95],
        [0.78, 'photo-dark', 1],
      ].forEach(([t, tone, s]) => {
        const x = x0 + iw * t;
        const sw = iw * 0.13 * s;
        const top = y0 + ih * 0.2;
        S.p(
          tone,
          `M${f(x - sw * 1.25)} ${f(y0 + ih)}L${f(x - sw * 1.15)} ${f(top + ih * 0.12)}Q${f(x - sw)} ${f(top)} ${f(x - sw * 0.3)} ${f(top - 2)}L${f(x + sw * 0.3)} ${f(top - 2)}Q${f(x + sw)} ${f(top)} ${f(x + sw * 1.15)} ${f(top + ih * 0.12)}L${f(x + sw * 1.25)} ${f(y0 + ih)}Z`,
        );
        S.p(
          'photo-light',
          poly(
            [
              [x - sw * 0.35, top - 2],
              [x, top + ih * 0.22],
              [x + sw * 0.35, top - 2],
            ],
            true,
          ),
        );
        S.p(
          tone,
          poly(
            [
              [x - 2, top + 4],
              [x, top + ih * 0.2],
              [x + 2, top + 4],
            ],
            true,
          ),
        );
      });
      S.p('stipple', win, { 'fill-opacity': 0.4 });
    }
  });
  S.ln(win, 0.5, 'ink-faint');
  if (scene === 'group') {
    // bord supérieur arraché : les têtes manquent
    const tear = [];
    for (let i = 0; i <= 12; i++) tear.push([(w * i) / 12, y0 + ih * 0.1 + r.jit(3)]);
    const td = `M-2 -2H${w + 2}V${f(tear[12][1])}${tear
      .reverse()
      .map((p) => `L${f(p[0])} ${f(p[1])}`)
      .join('')}Z`;
    S.p('paper-shade', td);
    S.p('paper', td, { transform: 'translate(0 -2)' });
  }
  return d;
}

/* ───────────────────────── Carte de la Velmarche ───────────────────────── */

/** Carte dépliée, roulée à droite (à plat). Origine : coin haut gauche. */
export function velmarcheMap(S, { w = 440, h = 310, roll = 34, labels = true, pins = true } = {}) {
  const r = S.r;
  const d = sheetPath(r, w, h, 1);
  dropShadow(S, d, 6, 9);
  S.p('paper', d);
  S.p('paper-shade', d, { 'fill-opacity': 0.4 });
  // terre et mer (repère 0..1 de la carte réelle, simplifié)
  const X = (x) => 14 + x * (w - 28);
  const Y = (y) => 14 + y * (h - 28);
  const frame = rect(X(0), Y(0), X(1) - X(0), Y(1) - Y(0));
  S.within(frame, () => {
    S.p('water', frame);
    S.p('water-deep', rect(X(0), Y(0), X(1) - X(0), Y(0.05) - Y(0)), { 'fill-opacity': 0.5 });
    const coast = [
      [0.1, 0.12],
      [0.16, 0.06],
      [0.2, 0.11],
      [0.26, 0.17],
      [0.32, 0.13],
      [0.38, 0.16],
      [0.44, 0.1],
      [0.5, 0.15],
      [0.56, 0.08],
      [0.6, 0.16],
      [0.66, 0.09],
      [0.72, 0.12],
      [0.77, 0.06],
      [0.82, 0.13],
      [0.88, 0.08],
      [0.94, 0.1],
      [1.02, 0.08],
      [1.02, 1.02],
      [0.12, 1.02],
      [0.12, 0.88],
      [0.09, 0.74],
      [0.11, 0.6],
      [0.08, 0.48],
      [0.12, 0.44],
      [0.09, 0.32],
      [0.11, 0.22],
    ].map(([x, y]) => [X(x) + r.jit(1.5), Y(y) + r.jit(1.5)]);
    const land = smooth(coast, true, 0.7);
    S.p('paper', land);
    // Ostrie (lilas), vallée (sauge), Thalberie (ardoise), monts (sienne)
    S.within(land, () => {
      S.p(
        'wash-lilas',
        smooth(
          [
            [X(0), Y(0)],
            [X(1), Y(0)],
            [X(1), Y(0.3)],
            [X(0.6), Y(0.32)],
            [X(0.3), Y(0.29)],
            [X(0), Y(0.31)],
          ],
          true,
          0.6,
        ),
      );
      S.p(
        'wash-sauge',
        smooth(
          [
            [X(0.1), Y(0.5)],
            [X(0.5), Y(0.45)],
            [X(0.8), Y(0.62)],
            [X(0.7), Y(0.82)],
            [X(0.4), Y(0.75)],
            [X(0.15), Y(0.7)],
          ],
          true,
        ),
        { 'fill-opacity': 0.8 },
      );
      S.p('wash-ardoise', rect(X(0.93), Y(0.1), X(1.05) - X(0.93), Y(1) - Y(0.1)));
      S.p(
        'wash-sienne',
        smooth(
          [
            [X(0.7), Y(1.02)],
            [X(0.72), Y(0.78)],
            [X(0.85), Y(0.66)],
            [X(1.02), Y(0.64)],
            [X(1.02), Y(1.02)],
          ],
          true,
        ),
        { 'fill-opacity': 0.7 },
      );
      // monts Corvins
      let m = '';
      for (let i = 0; i < 16; i++) {
        const x = X(r.range(0.72, 0.98));
        const y = Y(r.range(0.72, 0.97));
        const s = r.range(6, 10);
        m += `M${f(x - s)} ${f(y)}L${f(x)} ${f(y - s * 1.2)}L${f(x + s)} ${f(y)}`;
      }
      S.ln(m, 0.7, 'ink-soft');
      // forêts
      for (let i = 0; i < 14; i++) {
        const x = X(r.range(0.2, 0.7));
        const y = Y(r.range(0.4, 0.85));
        S.p('wash-sauge', circ(x, y, 3.4));
        S.ln(circ(x, y, 3.4), 0.5, 'ink-faint');
      }
      // landes (petites touffes)
      let t = '';
      for (let i = 0; i < 26; i++)
        t += `M${f(X(r.range(0.2, 0.9)))} ${f(Y(r.range(0.18, 0.28)))}l1.5 -3l1.5 3`;
      S.ln(t, 0.5, 'ink-faint');
    });
    // frontière
    S.ln(`M${f(X(0.93))} ${f(Y(0.1))}V${f(Y(1))}`, 1.6, 'ink-soft', {
      'stroke-dasharray': '6 2 1 2',
    });
    S.ln(land, 1, 'ink');
    // Orvelle (ruban) et Clairette
    const orv = [
      [X(0.08), Y(0.47)],
      [X(0.22), Y(0.47)],
      [X(0.34), Y(0.51)],
      [X(0.5), Y(0.56)],
      [X(0.62), Y(0.6)],
      [X(0.72), Y(0.7)],
      [X(0.8), Y(0.8)],
      [X(0.86), Y(0.86)],
    ];
    S.p('water-deep', tube(orv, 5, 1.2));
    S.ln(smooth(orv), 0.6, 'ink-soft');
    S.p(
      'water-deep',
      tube(
        [
          [X(0.6), Y(0.6)],
          [X(0.63), Y(0.7)],
          [X(0.6), Y(0.82)],
        ],
        2.2,
        0.8,
      ),
    );
  });
  // villes (pastilles)
  const towns = [
    ['Aubrelieu', 0.5, 0.55, 1],
    ['Port-Sénane', 0.13, 0.46, 0],
    ['Saint-Ormel', 0.34, 0.5, 0],
    ['Moulinvert', 0.62, 0.7, 0],
    ['Vellaak', 0.74, 0.1, 0],
    ['Tennok', 0.18, 0.1, 0],
  ];
  for (const [name, x, y, cap] of towns) {
    const cx = X(x);
    const cy = Y(y);
    S.wash(circ(cx, cy, cap ? 6 : 3.6), cap ? 'wash-carmin' : 'wash-safran');
    S.ln(circ(cx, cy, cap ? 6 : 3.6), 0.8, 'ink');
    if (cap) S.black(circ(cx, cy, 1.6));
    if (labels)
      text(S, cx + 7, cy - 5, name, { cls: cap ? 'label' : 'label-note', size: cap ? 10 : 8.5 });
  }
  // cartouche
  if (labels) {
    const cb = rect(X(0.14), Y(0.8), 110, 36);
    S.p('paper', cb);
    S.ln(cb, 1.4, 'ink');
    S.ln(rect(X(0.14) + 3, Y(0.8) + 3, 104, 30), 0.5, 'ink-soft');
    text(S, X(0.14) + 55, Y(0.8) + 19, 'La Velmarche', {
      cls: 'label',
      size: 10.5,
      anchor: 'middle',
    });
    text(S, X(0.14) + 55, Y(0.8) + 29, 'revue en 1974', {
      cls: 'label-note',
      size: 7.5,
      anchor: 'middle',
    });
  }
  // rose des vents
  const rx = X(0.04) + 14;
  const ry = Y(0.62);
  S.ln(circ(rx, ry, 12), 0.6, 'ink-soft');
  S.p('ink', `M${rx} ${f(ry - 16)}L${f(rx + 3)} ${ry}L${f(rx - 3)} ${ry}Z`, {
    fill: 'currentColor',
    'stroke-width': 0.5,
  });
  S.ln(
    `M${rx} ${f(ry + 16)}L${f(rx + 3)} ${ry}L${f(rx - 3)} ${ry}ZM${f(rx - 16)} ${ry}H${f(rx + 16)}`,
    0.7,
    'ink',
  );
  // double filet du cadre
  S.ln(frame, 1.6, 'ink');
  S.ln(rect(X(0) - 4, Y(0) - 4, X(1) - X(0) + 8, Y(1) - Y(0) + 8), 0.6, 'ink-soft');
  // rouleau à droite
  if (roll) {
    const rd = `M${w - 4} -6C${w + roll * 0.7} -10 ${w + roll} -4 ${w + roll} 4V${h - 2}C${w + roll} ${h + 6} ${w + roll * 0.7} ${h + 10} ${w - 4} ${h + 6}Z`;
    S.wash(rd, 'wash-safran');
    S.p('paper-shade', rd, { 'fill-opacity': 0.6 });
    S.hatchIn(rd, [w - 6, -12, w + roll + 4, h + 12], 90, 2.2, 0.5, 'ink-soft');
    S.p('rehaut', rect(w + roll * 0.25, 0, 3, h - 4), { opacity: 0.6 });
    S.ln(rd, 1.1, 'ink');
    S.wash(ell(w + roll * 0.55, h + 4, roll * 0.48, 6), 'wash-sienne');
    S.ln(ell(w + roll * 0.55, h + 4, roll * 0.48, 6), 0.8, 'ink');
    S.ln(ell(w + roll * 0.55, h + 4, roll * 0.22, 2.6), 0.6, 'ink-soft');
  }
  if (pins) {
    const P = [
      [X(0.18), Y(0.1)],
      [X(0.5), Y(0.55)],
      [X(0.62), Y(0.7)],
      [X(0.74), Y(0.1)],
    ];
    stringPins(S, P, { order: [0, 1, 2, 1, 3] });
  }
  return { X, Y };
}

/** Épingles à tête rouge reliées par un fil (à plat). */
export function stringPins(S, P, { order, sag = 6 } = {}) {
  const seq = order ?? P.map((_, i) => i);
  for (let i = 0; i < seq.length - 1; i++) {
    const a = P[seq[i]];
    const b = P[seq[i + 1]];
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag];
    const pts = [a, m, b];
    S.p(
      'ombre',
      tube(
        pts.map(([x, y]) => [x + 2, y + 3]),
        1.6,
      ),
    );
    S.p('wash-carmin', tube(pts, 1.8));
    S.p('wash-carmin', tube(pts, 1));
    S.ln(smooth(pts), 0.5, 'ink-soft', { 'stroke-opacity': 0.6 });
  }
  for (const [x, y] of P) pin(S, x, y);
}

/** Épingle vue de trois quarts. */
export function pin(S, x, y, { r = 5.2, tone = 'wash-carmin' } = {}) {
  S.p('ombre', ell(x + 4, y + 4, r * 0.9, r * 0.55));
  S.ln(`M${f(x)} ${f(y)}l${f(-r * 0.5)} ${f(-r * 0.9)}`, 1, 'ink');
  const hx = x - r * 0.6;
  const hy = y - r * 1.25;
  S.wash(circ(hx, hy, r), tone, tone);
  S.ln(circ(hx, hy, r), 0.8, 'ink');
  S.p('rehaut', circ(hx - r * 0.35, hy - r * 0.35, r * 0.32));
}

/* ───────────────────────── Herbier ───────────────────────── */

/** Planche d'herbier avec une fougère pressée (à plat). Origine : coin haut gauche. */
export function herbarium(
  S,
  { w = 190, h = 250, label = 'Herbier', note = 'n° 12', shadow = true } = {},
) {
  const r = S.r;
  const d = sheetPath(r, w, h, 0.8);
  if (shadow) dropShadow(S, d, 5, 7);
  S.p('paper', d);
  S.p('wash-safran', d, { 'fill-opacity': 0.25 });
  S.p('stipple', d, { 'fill-opacity': 0.2 });
  S.ln(d, 0.6, 'ink-soft');
  const fr = drawFern(S, w * 0.46, h * 0.86, h * 0.72, {
    angle: 8,
    pairs: 13,
    spread: 0.46,
    curve: 0.1,
    lobes: 4,
    wash2: 'wash-celadon',
  });
  // rubans de papier gommé
  const tape = (x, y, a) => {
    S.open({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)})` });
    S.p('paper-shade', rect(-14, -4.5, 28, 9), { 'fill-opacity': 0.85 });
    S.ln(rect(-14, -4.5, 28, 9), 0.5, 'ink-faint');
    S.close();
  };
  tape(w * 0.47, h * 0.8, -12);
  tape(w * 0.5, h * 0.5, 20);
  tape(w * 0.58, h * 0.25, -6);
  // étiquette
  const lx = w - 82;
  const ly = h - 48;
  S.p('paper', rect(lx, ly, 70, 38));
  S.ln(rect(lx, ly, 70, 38), 0.8, 'ink');
  S.ln(`M${lx} ${ly + 13}H${lx + 70}`, 0.5, 'ink-faint');
  text(S, lx + 35, ly + 10, label, { cls: 'label-note', size: 8, anchor: 'middle' });
  S.ln(handLines(r, lx + 6, ly + 23, 56, 2, 8, { h: 1.8, step: 2.2 }), 0.6, 'ink-soft');
  text(S, 10, h - 10, note, { cls: 'label-note', size: 8 });
  return fr;
}

/* ───────────────────────── Divers ───────────────────────── */

/** Lettre manuscrite (à plat). */
export function letter(S, { w = 150, h = 200, lines = 12, fold = true } = {}) {
  const r = S.r;
  const d = paperSheet(S, w, h);
  if (fold) {
    S.ln(`M4 ${f(h / 3)}H${f(w - 4)}M4 ${f((2 * h) / 3)}H${f(w - 4)}`, 0.5, 'ink-faint');
    S.p('paper-shade', rect(0, h / 3, w, h / 3), { 'fill-opacity': 0.35 });
  }
  S.ln(handLines(r, 14, 30, w - 28, lines, (h - 50) / lines, { h: 2.4, step: 2.6 }), 0.7, 'ink');
  return d;
}

/** Fiches bristol (à plat). */
export function indexCards(S, { w = 120, h = 76, n = 3 } = {}) {
  const r = S.r;
  for (let i = n - 1; i >= 0; i--) {
    S.open({ transform: `translate(${f(i * 8)} ${f(i * -6)}) rotate(${f(i * 4 - 3)})` });
    const d = rect(0, 0, w, h);
    S.p('ombre', d, { transform: 'translate(3 4)' });
    S.p('paper', d);
    S.ln(`M0 14H${w}`, 0.7, 'ink-soft');
    let ls = '';
    for (let y = 26; y < h - 4; y += 10) ls += `M0 ${y}H${w}`;
    S.ln(ls, 0.5, 'water', { stroke: 'currentColor', 'stroke-opacity': 0.5 });
    if (i === 0) S.ln(textLines(r, 8, 10, w * 0.6, 1, 10, { word: [6, 14] }), 1, 'ink');
    if (i === 0) S.ln(handLines(r, 8, 24, w - 16, 4, 10, { h: 2.2 }), 0.6, 'ink-soft');
    S.ln(d, 0.6, 'ink-soft');
    S.close();
  }
}

/** Trombone (à plat). */
export function paperclip(S, x, y, { a = 0, s = 1 } = {}) {
  S.open({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})` });
  const d = 'M0 0V28a5 5 0 0 0 10 0V4a3.5 3.5 0 0 0 -7 0V24';
  S.ln(d, 2.2, 'ink-faint');
  S.ln(d, 1.1, 'ink');
  S.close();
}

export {
  arc,
  blob,
  circ,
  clamp,
  ell,
  f,
  lerp,
  poly,
  rect,
  rrect,
  smooth,
  tube,
  hatchLines,
  handLines,
  textLines,
};
