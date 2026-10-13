/**
 * Art clé « Le bureau sous la lampe » : bureau d'enquêteur de 1974 vu de trois quarts, la nuit
 * tombant sur les toits d'Aubrelieu. Deux cadrages : 16:9 (écran titre, héros du site) et 4:5
 * (téléphone), composés séparément à partir des mêmes objets (layouts ci-dessous).
 *
 * Palette : celle du papier (racine `class="art"`, SANS `on-night`) : la nuit est peinte dans
 * l'image (encre bleu-noir en dégradé), la lampe y découpe sa flaque de lumière.
 *
 * Groupes animables (ids préfixés par le nom du fichier) : `-lamp-light`, `-dust`, `-steam`,
 * `-curtain`, `-pages` ; leur `transform-origin` (en unités de viewBox, à utiliser avec
 * `transform-box: view-box`) est écrit en commentaire et dans art/keyart/README.md.
 */
import {
  apply,
  arc,
  blob,
  circ,
  ell,
  f,
  hatchLines,
  lerp,
  mul,
  poly,
  R,
  rect,
  S as Sc,
  smooth,
  Svg,
  T,
  tube,
} from './lib.mjs';
import {
  dropShadow,
  folders,
  herbarium,
  indexCards,
  inkPad,
  lamp,
  letter,
  magnifier,
  paperclip,
  pencil,
  photo,
  pin,
  rubberStamp,
  stampImprint,
  steam,
  teacup,
  text,
  treeSheet,
  velmarcheMap,
} from './objects.mjs';

/** Cadrages. Toutes les positions en unités de viewBox. */
export const LAYOUTS = {
  wide: {
    w: 1600,
    h: 900,
    wallH: 300,
    window: { x: 70, y: 28, w: 390, h: 250 },
    cork: { x: 1150, y: 36, w: 400, h: 210 },
    lamp: { x: 540, y: 430, s: 1.22, stemH: 165, arm: [128, -30], aim: 31 },
    pool: { cx: 840, cy: 600, rx: 470, ry: 270, nx: 820, ny: 560 },
    flat: 0.16,
    items: {
      folders: { x: 70, y: 590, rot: -7 },
      page: { x: 150, y: 560, rot: 5 },
      cards: { x: 300, y: 450, rot: -4 },
      inkPad: { x: 372, y: 520, rot: 8 },
      stamp: { x: 470, y: 528 },
      imprint: { x: 436, y: 600, rot: -6 },
      tree: { x: 560, y: 430, rot: -3 },
      pencil: { x: 640, y: 690, rot: -14 },
      herb: { x: 960, y: 440, rot: 6 },
      map: { x: 1170, y: 560, rot: -4 },
      cup: { x: 1270, y: 520 },
      photoGroup: { x: 410, y: 740, rot: -9 },
      photoBeach: { x: 860, y: 700, rot: 9 },
      photoBack: { x: 1010, y: 760, rot: -5 },
      magnifier: { x: 830, y: 800, rot: 0 },
      letter: { x: 1360, y: 360, rot: 12 },
    },
  },
  tall: {
    w: 800,
    h: 1000,
    wallH: 300,
    window: { x: 40, y: 30, w: 330, h: 240 },
    cork: { x: 560, y: 40, w: 300, h: 190 },
    lamp: { x: 480, y: 440, s: 1.2, stemH: 160, arm: [-124, -26], aim: -28 },
    pool: { cx: 360, cy: 650, rx: 400, ry: 300, nx: 560, ny: 640 },
    flat: 0.16,
    items: {
      folders: { x: -60, y: 780, rot: -8 },
      page: { x: 20, y: 760, rot: 4 },
      cards: { x: 560, y: 470, rot: 6 },
      inkPad: { x: 600, y: 590, rot: -6 },
      stamp: { x: 700, y: 560 },
      imprint: { x: 640, y: 720, rot: 5 },
      tree: { x: 90, y: 430, rot: -3 },
      pencil: { x: 190, y: 690, rot: -14 },
      herb: { x: 470, y: 650, rot: 7 },
      map: { x: 560, y: 820, rot: -6 },
      cup: { x: 170, y: 410 },
      photoGroup: { x: 250, y: 870, rot: -9 },
      photoBeach: { x: 300, y: 720, rot: 9 },
      photoBack: { x: 430, y: 900, rot: -5 },
      magnifier: { x: 330, y: 820, rot: 0 },
      letter: null,
    },
  },
};

/** Construit l'art clé pour un cadrage ; rend le texte SVG et les origines des groupes animés. */
export function buildDesk(id, layoutName) {
  const L = LAYOUTS[layoutName];
  const S = new Svg(id, L.w, L.h, {
    title: 'Le bureau sous la lampe',
    desc: "Un bureau d'enquêteur de 1974 sous une lampe de laiton : dossiers de kraft, brouillon d'arbre généalogique aux médaillons vides, photographies, carte de la Velmarche, loupe, tampon, tasse de thé et fougère d'herbier ; à la fenêtre, le crépuscule sur les toits d'Aubrelieu.",
  });
  const origins = {};
  const it = L.items;
  const flat = L.flat;

  /* ── Mur et fenêtre ─────────────────────────────────────────── */
  wall(S, L);
  windowDusk(S, L);
  corkboard(S, L);

  /* ── Plateau du bureau ─────────────────────────────────────── */
  deskTop(S, L);

  /* ── Objets à plat, du fond vers l'avant ───────────────────── */
  if (it.letter)
    S.at(it.letter.x, it.letter.y, { rot: it.letter.rot, flat }, () =>
      letter(S, { w: 150, h: 196 }),
    );
  S.at(it.map.x, it.map.y, { rot: it.map.rot, flat }, () => velmarcheMap(S, { w: 460, h: 320 }));
  S.at(it.cards.x, it.cards.y, { rot: it.cards.rot, flat }, () => indexCards(S, { w: 124, h: 80 }));
  S.at(it.inkPad.x, it.inkPad.y, { rot: it.inkPad.rot, flat }, () => inkPad(S));
  S.at(it.tree.x, it.tree.y, { rot: it.tree.rot, flat }, () => treeSheet(S, { w: 390, h: 280 }));
  S.at(it.herb.x, it.herb.y, { rot: it.herb.rot, flat }, () => herbarium(S, { w: 190, h: 250 }));
  S.at(it.imprint.x, it.imprint.y, { rot: it.imprint.rot, flat }, () => {
    S.p('ombre', rect(-4, -4, 150, 100), { transform: 'translate(4 6)' });
    S.p('paper', rect(-4, -4, 150, 100));
    S.ln(textLinesLocal(S, 8, 10, 130, 2), 0.6, 'ink-faint');
    S.ln(rect(-4, -4, 150, 100), 0.6, 'ink-soft');
    S.open({ transform: 'translate(72 56) rotate(-7)' });
    stampImprint(S, { w: 116, h: 44, size: 21 });
    S.close();
  });
  S.at(it.photoGroup.x, it.photoGroup.y, { rot: it.photoGroup.rot, flat }, () =>
    photo(S, { w: 120, h: 88, scene: 'group' }),
  );
  S.at(it.photoBack.x, it.photoBack.y, { rot: it.photoBack.rot, flat }, () =>
    photo(S, { w: 104, h: 76, scene: 'back' }),
  );
  S.at(it.photoBeach.x, it.photoBeach.y, { rot: it.photoBeach.rot, flat }, () => {
    photo(S, { w: 126, h: 92, scene: 'beach' });
    paperclip(S, 14, -8, { a: 8 });
  });
  S.at(it.pencil.x, it.pencil.y, { rot: it.pencil.rot, flat }, () =>
    pencil(S, { len: 160, angle: 0 }),
  );
  // Loupe : son verre grossit le phare de la photographie de plage
  const beachM = mul(
    mul(T(it.photoBeach.x, it.photoBeach.y), Sc(1, 1 - flat)),
    R(it.photoBeach.rot),
  );
  const Wm = apply(beachM, [126 * 0.76, 92 * 0.42]);
  S.at(Wm[0] + 4, Wm[1] + 2, { rot: it.magnifier.rot, flat }, () =>
    magnifier(S, {
      R: 54,
      handle: 130,
      angle: 28,
      inner: () => {
        // copie agrandie (×1,9) de la photo, centrée sur le phare : local = S(1, 1/(1-flat))·S(k)·T(-W)·M_photo
        const k = 1.9;
        const W = [Wm[0] - 4 * 0, Wm[1]];
        const m = mul(mul(mul(Sc(1, 1 / (1 - flat)), Sc(k)), T(-W[0], -W[1])), beachM);
        S.p('photo-light', circ(0, 0, 60));
        S.open({}, m);
        photo(S, { w: 126, h: 92, scene: 'beach', shadow: false });
        S.close();
      },
    }),
  );

  /* ── Feuille qui se soulève (groupe animé) ─────────────────── */
  {
    const p = it.page;
    const m = mul(mul(T(p.x, p.y), Sc(1, 1 - flat)), R(p.rot));
    const hinge = apply(m, [0, 0]);
    const hinge2 = apply(m, [0, 200]);
    origins.pages = [(hinge[0] + hinge2[0]) / 2, (hinge[1] + hinge2[1]) / 2];
    // Dossiers sous la feuille
    S.at(it.folders.x, it.folders.y, { rot: it.folders.rot, flat }, () =>
      folders(S, { w: 330, h: 230 }),
    );
    S.comment(
      `${id}-pages : feuille volante qui se soulève. transform-origin: ${f(origins.pages[0])}px ${f(origins.pages[1])}px (bord gauche, charnière) ; animer rotate(-4deg) skewY(-2deg) + l'opacité de ${id}-pages-shadow.`,
    );
    S.open({ id: `${id}-pages` });
    S.open({ id: `${id}-pages-shadow` });
    S.at(p.x + 6, p.y + 9, { rot: p.rot, flat }, () => S.p('ombre', rect(0, 0, 150, 200)));
    S.close();
    S.at(p.x, p.y, { rot: p.rot, flat }, () => {
      S.p('paper', rect(0, 0, 150, 200));
      S.p('stipple', rect(0, 0, 150, 200), { 'fill-opacity': 0.15 });
      S.ln(`M10 20h80`, 1.2, 'ink');
      S.ln(textLinesLocal(S, 10, 34, 128, 12), 0.6, 'ink-soft');
      S.p('paper-shade', 'M150 160L150 200L112 200Q132 186 150 160Z');
      S.ln('M150 160Q132 186 112 200', 0.6, 'ink-soft');
      S.ln(rect(0, 0, 150, 200), 0.6, 'ink-soft');
    });
    S.close();
  }

  /* ── Objets debout ─────────────────────────────────────────── */
  S.at(it.stamp.x, it.stamp.y, {}, () => rubberStamp(S, { w: 46 }));
  let tea;
  S.at(it.cup.x, it.cup.y, {}, () => {
    tea = teacup(S, { R: 62 });
    tea = S.world(tea.tea);
  });

  /* ── La nuit : dégradé d'encre autour de la flaque de lumière ── */
  night(S, L);
  origins.curtain = curtain(S, L);

  /* ── La lampe et sa lumière ─────────────────────────────────── */
  let lp;
  S.at(L.lamp.x, L.lamp.y, { s: L.lamp.s ?? 1 }, () => {
    lp = lamp(S, { stemH: L.lamp.stemH, arm: L.lamp.arm, aim: L.lamp.aim, shadeL: 76, shadeR: 50 });
    lp.mouthW = S.world(lp.mouth);
    lp.shadeR *= L.lamp.s ?? 1;
  });
  const light = lightPool(S, L, lp);
  origins.lampLight = light.origin;
  origins.dust = dust(S, L, lp);

  /* ── Vapeur du thé ─────────────────────────────────────────── */
  origins.steam = tea;
  S.comment(
    `${id}-steam : vapeur du thé. transform-origin: ${f(tea[0])}px ${f(tea[1])}px (surface du thé) ; animer translateY(-14px) scaleX(1.15) + opacité 0 → 1 → 0, en boucle lente (4–6 s).`,
  );
  S.open({ id: `${id}-steam` });
  steam(S, tea[0], tea[1] - 4, { h: 130, n: 3 });
  S.close();

  return { svg: String(S), origins };
}

/* ───────────────────────── Couches ───────────────────────── */

function textLinesLocal(S, x, y, w, n) {
  let d = '';
  for (let i = 0; i < n; i++) {
    let cx = x;
    const lw = i === n - 1 ? w * 0.5 : w * S.r.range(0.85, 1);
    while (cx < x + lw - 4) {
      const ww = Math.min(S.r.range(4, 12), x + lw - cx);
      d += `M${f(cx)} ${f(y + i * 12)}h${f(ww)}`;
      cx += ww + 3;
    }
  }
  return d;
}

/** Mur sombre, papier peint à fougères discrètes. */
function wall(S, L) {
  const { w, wallH } = L;
  const pid = `${S.id}-wallpaper`;
  S.defs.push(
    `<pattern id="${pid}" width="44" height="56" patternUnits="userSpaceOnUse"><path class="ink-soft" stroke-width="0.6" d="M0 0V56M22 0V56"/><path class="ink-soft" stroke-width="0.5" d="M11 34V20M11 22l-4 -4M11 26l-5 -3M11 30l-5 -2M11 22l4 -4M11 26l5 -3M11 30l5 -2M33 6V-8M33 62V48M33 50l-4 -4M33 54l-5 -3M33 50l4 -4M33 54l5 -3"/></pattern>`,
  );
  S.black(rect(0, 0, w, wallH + 20));
  S.p('', rect(0, 0, w, wallH + 20), { fill: `url(#${pid})`, 'fill-opacity': 0.55 });
  // lambris bas
  S.p('wash-sienne', rect(0, wallH - 46, w, 46), { 'fill-opacity': 0.35 });
  S.ln(`M0 ${wallH - 46}H${w}M0 ${wallH - 40}H${w}`, 0.8, 'ink-soft');
  let pan = '';
  for (let x = 30; x < w; x += 120) pan += `M${x} ${wallH - 34}h96v28h-96Z`;
  S.ln(pan, 0.6, 'ink-faint');
}

/** Fenêtre au crépuscule : ciel en bandes de lavis, toits d'Aubrelieu, premières lumières. */
function windowDusk(S, L) {
  const { x, y, w, h } = L.window;
  const r = S.r;
  const casing = 16;
  // embrasure (ombre portée sur le mur)
  S.p('ombre', rect(x - casing - 6, y - casing - 2, w + casing * 2 + 18, h + casing * 2 + 16));
  const glass = rect(x, y, w, h);
  S.within(glass, () => {
    // Ciel : bandes (indigo → lilas → carmin → safran)
    const bands = [
      [0, 0.3, 'wash-indigo', 'wash-lilas'],
      [0.24, 0.5, 'wash-lilas', null],
      [0.44, 0.68, 'wash-lilas', 'wash-carmin'],
      [0.62, 0.84, 'wash-carmin', 'wash-safran'],
      [0.78, 1.01, 'wash-safran', null],
    ];
    S.p('paper', glass);
    for (const [a, b, c1, c2] of bands) {
      const ya = y + h * a;
      const yb = y + h * b;
      const d = smooth(
        [
          [x - 4, ya + r.jit(3), 1],
          [x + w * 0.3, ya + r.jit(5)],
          [x + w * 0.7, ya + r.jit(5)],
          [x + w + 4, ya + r.jit(3), 1],
          [x + w + 4, yb, 1],
          [x - 4, yb, 1],
        ],
        true,
      );
      S.p(c1, d);
      if (c2) S.p(c2, d, { 'fill-opacity': 0.7 });
    }
    // nuages effilés
    for (let i = 0; i < 5; i++) {
      const cy = y + h * r.range(0.32, 0.62);
      const cx = x + w * r.range(0.05, 0.9);
      S.p(
        'wash-lilas',
        tube(
          [
            [cx - 60, cy + 2],
            [cx, cy - 2],
            [cx + 70, cy + 1],
          ],
          5,
          1.5,
        ),
      );
      S.p(
        'rehaut',
        tube(
          [
            [cx - 40, cy - 1.5],
            [cx + 20, cy - 3.5],
          ],
          1.4,
          0.5,
        ),
        { opacity: 0.6 },
      );
    }
    // lune et étoiles
    S.p('rehaut', `${circ(x + w * 0.8, y + h * 0.16, 11)}`);
    S.p('wash-lilas', circ(x + w * 0.8 + 5, y + h * 0.16 - 3, 9.5), { 'fill-opacity': 0.9 });
    let stars = '';
    for (let i = 0; i < 18; i++) {
      const sx = x + r.range(6, w - 6);
      const sy = y + r.range(4, h * 0.34);
      stars += circ(sx, sy, r.range(0.6, 1.3));
    }
    S.p('rehaut', stars);
    // Collines lointaines + citadelle
    const hz = y + h * 0.7;
    const hill = smooth(
      [
        [x - 4, hz + 6, 1],
        [x + w * 0.15, hz - 10],
        [x + w * 0.38, hz - 30],
        [x + w * 0.55, hz - 22],
        [x + w * 0.75, hz - 4],
        [x + w + 4, hz - 8, 1],
        [x + w + 4, y + h + 4, 1],
        [x - 4, y + h + 4, 1],
      ],
      true,
    );
    S.p('wash-lilas', hill);
    S.p('wash-indigo', hill);
    const cx0 = x + w * 0.34;
    const cy0 = hz - 30;
    const cit = poly(
      [
        [cx0 - 30, cy0 + 8],
        [cx0 - 30, cy0 - 6],
        [cx0 - 22, cy0 - 6],
        [cx0 - 22, cy0 - 18],
        [cx0 - 14, cy0 - 18],
        [cx0 - 14, cy0 - 8],
        [cx0 + 6, cy0 - 8],
        [cx0 + 6, cy0 - 24],
        [cx0 + 16, cy0 - 24],
        [cx0 + 16, cy0 - 6],
        [cx0 + 34, cy0 - 6],
        [cx0 + 34, cy0 + 10],
      ],
      true,
    );
    S.p('wash-indigo', cit);
    S.p('hatch', cit);
    S.ln(cit, 0.6, 'ink-soft');
    // Toits : deux plans
    roofs(S, x, y + h * 0.78, w, 26, { far: true });
    roofs(S, x, y + h * 0.9, w, 40, { far: false });
    // Reflets sur la vitre
    S.p(
      'rehaut',
      poly(
        [
          [x + w * 0.08, y + h],
          [x + w * 0.2, y + h],
          [x + w * 0.55, y],
          [x + w * 0.43, y],
        ],
        true,
      ),
      { opacity: 0.08 },
    );
    S.p(
      'rehaut',
      poly(
        [
          [x + w * 0.25, y + h],
          [x + w * 0.28, y + h],
          [x + w * 0.63, y],
          [x + w * 0.6, y],
        ],
        true,
      ),
      { opacity: 0.1 },
    );
  });
  // Huisserie (bois sombre) : cadre + meneaux + petits bois
  const frame = `${rect(x - casing, y - casing, w + casing * 2, h + casing * 2)}${rect(x, y, w, h)}`;
  S.wash(frame, 'hair-brun', 'wash-carmin', { 'fill-rule': 'evenodd' });
  S.p('hatch-dense', frame, { 'fill-rule': 'evenodd' });
  S.ln(rect(x - casing, y - casing, w + casing * 2, h + casing * 2), 1.2, 'ink');
  S.ln(rect(x, y, w, h), 1, 'ink');
  const bars = [];
  bars.push(rect(x + w / 2 - 5, y, 10, h));
  for (const t of [1 / 3, 2 / 3]) bars.push(rect(x, y + h * t - 3, w, 6));
  const bd = bars.join('');
  S.wash(bd, 'hair-brun', 'wash-sienne');
  S.p('hatch', bd);
  S.ln(bd, 0.8, 'ink');
  // Lumière de la lampe sur le bois (côté droit)
  S.p('wash-safran', rect(x + w + 2, y - casing, casing - 2, h + casing * 2), {
    'fill-opacity': 0.6,
  });
  // Appui de fenêtre
  const sill = poly(
    [
      [x - casing - 14, y + h + casing],
      [x + w + casing + 14, y + h + casing],
      [x + w + casing + 22, y + h + casing + 12],
      [x - casing - 22, y + h + casing + 12],
    ],
    true,
  );
  S.wash(sill, 'wash-sienne', 'wash-safran');
  S.ln(sill, 1, 'ink');
  // Pot de fougère sur l'appui
  const px = x + w * 0.16;
  const py = y + h + casing;
  S.wash(
    poly(
      [
        [px - 16, py - 30],
        [px + 16, py - 30],
        [px + 12, py],
        [px - 12, py],
      ],
      true,
    ),
    'wash-sienne',
    'wash-carmin',
  );
  S.ln(
    poly(
      [
        [px - 16, py - 30],
        [px + 16, py - 30],
        [px + 12, py],
        [px - 12, py],
      ],
      true,
    ),
    1,
    'ink',
  );
  for (let i = 0; i < 6; i++) {
    const a = -70 + i * 28 + r.jit(6);
    const len = r.range(46, 70);
    const ang = (a * Math.PI) / 180;
    S.within(rect(x - 40, y - 40, w + 80, h + 120), () => {
      const tip = [px + Math.sin(ang) * len, py - 30 - Math.cos(ang) * len * 0.9];
      let d = `M${px} ${py - 30}Q${f(px + Math.sin(ang) * len * 0.4)} ${f(py - 30 - len * 0.7)} ${f(tip[0])} ${f(tip[1])}`;
      let leaves = '';
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        const qx = lerp(px, tip[0], t);
        const qy = lerp(py - 30, tip[1], t) - Math.sin(t * Math.PI) * 8;
        const L2 = 9 * (1 - t * 0.7);
        leaves += `M${f(qx)} ${f(qy)}l${f(-L2)} ${f(-L2 * 0.3)}M${f(qx)} ${f(qy)}l${f(L2)} ${f(-L2 * 0.3)}`;
      }
      S.ln(leaves, 2.6, 'ink', { 'stroke-opacity': 0.9 });
      S.ln(leaves, 1.4, 'ink-faint');
      S.ln(d, 1, 'ink-soft');
    });
  }
}

/** Ligne de toits (deux plans) avec cheminées et fenêtres éclairées. */
function roofs(S, x, base, w, hgt, { far }) {
  const r = S.r;
  let cx = x - 10;
  const pts = [[x - 10, base + 60, 1]];
  const chim = [];
  const wins = [];
  let dome = !far;
  while (cx < x + w + 10) {
    const bw = r.range(far ? 26 : 34, far ? 48 : 70);
    const top = base - r.range(hgt * 0.4, hgt);
    const kind = r();
    if (dome && cx > x + w * 0.55) {
      // dôme de l'Opéra, lanterne
      const dc = cx + 34;
      pts.push([cx, base - hgt * 0.6, 1], [cx + 6, base - hgt * 0.6, 1]);
      pts.push([dc - 26, base - hgt * 0.6, 1]);
      for (let a = 0; a <= 8; a++) {
        const t = Math.PI + (a / 8) * Math.PI;
        pts.push([dc + Math.cos(t) * 26, base - hgt * 0.6 + Math.sin(t) * 30, a === 8 ? 1 : 0]);
      }
      pts.push([cx + 68, base - hgt * 0.6, 1]);
      chim.push(rect(dc - 3, base - hgt * 0.6 - 44, 6, 14));
      chim.push(
        poly(
          [
            [dc - 4, base - hgt * 0.6 - 44],
            [dc, base - hgt * 0.6 - 52],
            [dc + 4, base - hgt * 0.6 - 44],
          ],
          true,
        ),
      );
      cx += 70;
      dome = false;
      continue;
    }
    if (kind < 0.45) {
      pts.push([cx, top + 10, 1], [cx + bw / 2, top - 8, 1], [cx + bw, top + 10, 1]);
    } else if (kind < 0.75) {
      pts.push([cx, top, 1], [cx + bw, top, 1]);
    } else {
      pts.push(
        [cx, top + 6, 1],
        [cx + bw * 0.3, top - 4, 1],
        [cx + bw * 0.7, top - 4, 1],
        [cx + bw, top + 6, 1],
      );
    }
    if (r() < 0.7) chim.push(rect(cx + bw * r.range(0.2, 0.7), top - r.range(8, 16), 5, 14));
    const nw = far ? 1 : 2;
    for (let k = 0; k < nw; k++)
      if (r() < 0.55)
        wins.push(rect(cx + 6 + k * (bw / 2), top + 16 + r.range(0, 10), far ? 3 : 4, far ? 4 : 6));
    cx += bw;
  }
  pts.push([x + w + 10, base + 60, 1]);
  const d = poly(pts, true);
  const cd = chim.join('');
  if (far) {
    S.p('wash-indigo', d);
    S.p('wash-ardoise', d);
    S.p('hatch', d);
    S.p('wash-indigo', cd);
    S.ln(d, 0.6, 'ink-soft');
  } else {
    S.black(d, { 'fill-opacity': 0.88 });
    S.black(cd, { 'fill-opacity': 0.88 });
    S.ln(d, 0.6, 'ink-faint');
  }
  if (wins.length) {
    S.p('rehaut', wins.join(''), { opacity: far ? 0.6 : 0.9 });
    S.p('wash-safran', wins.join(''));
  }
  // fumée
  if (!far) {
    for (let i = 0; i < 3; i++) {
      const sx = x + w * r.range(0.1, 0.9);
      S.p(
        'paper',
        tube(
          [
            [sx, base - hgt],
            [sx + 10, base - hgt - 20],
            [sx + 30, base - hgt - 32],
          ],
          4,
          9,
        ),
        { 'fill-opacity': 0.12 },
      );
    }
  }
}

/** Tableau de liège au mur (dans l'ombre) : notes et ficelle. */
function corkboard(S, L) {
  if (!L.cork) return;
  const { x, y, w, h } = L.cork;
  const r = S.r;
  const d = rect(x, y, w, h);
  S.p('ombre', d, { transform: 'translate(8 10)' });
  S.wash(d, 'hair-chatain', 'wash-safran');
  S.p('stipple', d);
  S.p('hatch', d);
  const fr = `${rect(x - 8, y - 8, w + 16, h + 16)}${d}`;
  S.wash(fr, 'hair-brun', 'wash-carmin', { 'fill-rule': 'evenodd' });
  S.ln(rect(x - 8, y - 8, w + 16, h + 16), 1.1, 'ink');
  S.ln(d, 0.8, 'ink');
  const notes = [];
  for (let i = 0; i < 6; i++) {
    const nx = x + 20 + (i % 3) * (w / 3) + r.jit(10);
    const ny = y + 18 + Math.floor(i / 3) * (h / 2) + r.jit(8);
    const nw = r.range(56, 80);
    const nh = r.range(44, 64);
    S.open({ transform: `rotate(${f(r.jit(6))} ${f(nx)} ${f(ny)})` });
    if (i === 1) {
      S.p('photo-paper', rect(nx, ny, nw, nh));
      S.p('photo-mid', rect(nx + 4, ny + 4, nw - 8, nh - 12));
      S.p(
        'photo-dark',
        poly(
          [
            [nx + 4, ny + nh - 8],
            [nx + nw * 0.4, ny + nh * 0.4],
            [nx + nw - 4, ny + nh - 8],
          ],
          true,
        ),
      );
    } else {
      S.p(i === 4 ? 'paper-shade' : 'paper', rect(nx, ny, nw, nh));
      if (i === 3) S.p('wash-safran', rect(nx, ny, nw, nh));
      S.ln(textLinesLocal(S, nx + 6, ny + 12, nw - 12, Math.floor(nh / 14)), 0.6, 'ink-soft');
    }
    S.ln(rect(nx, ny, nw, nh), 0.5, 'ink-soft');
    S.close();
    notes.push([nx + nw / 2, ny + 4]);
  }
  for (let i = 0; i < notes.length - 1; i++) {
    const a = notes[i];
    const b = notes[(i + 2) % notes.length];
    S.p('wash-carmin', tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 8], b], 1.6));
  }
  for (const [px, py] of notes) pin(S, px, py, { r: 4 });
}

/** Plateau : noyer ciré, fil du bois, chant éclairé. */
function deskTop(S, L) {
  const { w, h, wallH } = L;
  const r = S.r;
  const top = rect(-10, wallH, w + 20, h - wallH + 10);
  S.wash(top, 'hair-chatain', 'wash-sienne');
  S.p('hair-roux', top, { opacity: 0.35 });
  // fil du bois : ondes horizontales, plus serrées au fond (perspective)
  let grain = '';
  let yy = wallH + 8;
  let step = 5;
  while (yy < h + 10) {
    const pts = [];
    const ph = r.range(0, 6);
    for (let x = -20; x <= w + 20; x += 80)
      pts.push([x, yy + Math.sin(ph + x / 140) * step * 0.5 + r.jit(1)]);
    grain += smooth(pts);
    yy += step * r.range(0.8, 2.6);
    step *= 1.04;
  }
  S.ln(grain, 0.5, 'ink-soft', { 'stroke-opacity': 0.45 });
  // nœuds
  for (let i = 0; i < 4; i++) {
    const kx = r.range(80, w - 80);
    const ky = r.range(wallH + 80, h - 40);
    for (let k = 1; k < 5; k++) S.ln(ell(kx, ky, k * 7, k * 2.4), 0.5, 'ink-faint');
  }
  S.p('hatch', top, { 'fill-opacity': 0.35 });
  // chant du plateau contre le mur
  S.p('ombre', rect(-10, wallH, w + 20, 16));
  S.ln(`M-10 ${wallH}H${w + 10}`, 1.4, 'ink');
  S.p('rehaut', rect(-10, wallH + 1, w + 20, 1.6), { opacity: 0.25 });
}

/** La nuit : dégradé radial d'encre centré sur la flaque de lumière. */
function night(S, L) {
  const { cx, cy, nx: rx, ny: ry } = L.pool;
  const g = `${S.id}-night`;
  S.defs.push(
    `<radialGradient id="${g}" class="ink" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${cx} ${cy}) scale(${rx} ${ry})"><stop offset="0.22" stop-color="currentColor" stop-opacity="0"/><stop offset="0.5" stop-color="currentColor" stop-opacity="0.2"/><stop offset="0.78" stop-color="currentColor" stop-opacity="0.55"/><stop offset="1" stop-color="currentColor" stop-opacity="0.82"/></radialGradient>`,
  );
  // la vitre reste hors de la nuit (source de lumière du crépuscule)
  const gl = L.window;
  S.p('', `${rect(0, 0, L.w, L.h)}${rect(gl.x, gl.y, gl.w, gl.h)}`, {
    fill: `url(#${g})`,
    'fill-rule': 'evenodd',
  });
  // bord bas assombri (avant du bureau)
  const g2 = `${S.id}-front`;
  S.defs.push(
    `<linearGradient id="${g2}" class="ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity="0.5"/></linearGradient>`,
  );
  S.p('', rect(0, 0, L.w, L.h), { fill: `url(#${g2})` });
}

/** Cône et flaque de lumière (groupe animé `-lamp-light`). */
function lightPool(S, L, lp) {
  const { cx, cy, rx, ry } = L.pool;
  const id = `${S.id}-lamp-light`;
  const m = lp.mouthW;
  S.comment(
    `${id} : lumière de la lampe (cône + flaque). transform-origin: ${f(m[0])}px ${f(m[1])}px (bouche de l'abat-jour) ; vacillement : opacité 1 → 0.86 → 1 (irrégulier, 3–7 s), jamais sous 0.8.`,
  );
  S.open({ id });
  // cône : trois voiles de plus en plus étroits (la lumière se concentre au centre)
  for (let i = 0; i < 5; i++) {
    const k = 1 - i * 0.17;
    const pr = rx * 0.6 * k;
    const prY = ry * 0.55 * k;
    const cone = smooth(
      [
        [m[0] - lp.shadeR * 0.7 * k, m[1] - 4, 1],
        [m[0] + lp.shadeR * 0.85 * k, m[1] + 8, 1],
        [cx + pr, cy + prY * 0.1],
        [cx + pr * 0.3, cy + prY * 0.95],
        [cx - pr * 0.6, cy + prY * 0.65],
        [cx - pr * 0.95, cy - prY * 0.2],
      ],
      true,
      0.8,
    );
    S.p('wash-safran', cone, { 'fill-opacity': 0.05 + i * 0.012 });
  }
  // flaque : ellipses de lavis empilées (aquarelle)
  for (let i = 0; i < 6; i++) {
    const k = 1 - i * 0.14;
    S.p('wash-safran', ell(cx + i * 6, cy - i * 5, rx * 0.72 * k, ry * 0.7 * k), {
      'fill-opacity': 0.1 + i * 0.03,
    });
  }
  S.open({ opacity: 0.16 });
  S.p('rehaut', ell(cx + 24, cy - 24, rx * 0.36, ry * 0.32));
  S.close();
  S.open({ opacity: 0.12 });
  S.p('rehaut', ell(cx + 30, cy - 30, rx * 0.2, ry * 0.18));
  S.close();
  S.close();
  return { origin: m };
}

/** Poussières dans le faisceau (groupe animé `-dust`, deux plans `-dust-near`, `-dust-far`). */
function dust(S, L, lp) {
  const r = S.r;
  const { cx, cy } = L.pool;
  const m = lp.mouthW;
  const id = `${S.id}-dust`;
  const o = [lerp(m[0], cx, 0.45), lerp(m[1], cy, 0.45)];
  S.comment(
    `${id} : poussières dans le faisceau. transform-origin: ${f(o[0])}px ${f(o[1])}px ; ${id}-far : translate(6px, -18px) en 14 s ; ${id}-near : translate(-10px, -26px) en 9 s, aller-retour, opacité 0.5 → 1.`,
  );
  S.open({ id });
  for (const [name, n, rr, op] of [
    ['far', 26, [0.6, 1.2], 0.55],
    ['near', 14, [1.1, 2.1], 0.8],
  ]) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const t = r.range(0.1, 0.95);
      const sx = lerp(m[0], cx, t) + r.jit(40 + 160 * t);
      const sy = lerp(m[1], cy, t) + r.jit(30 + 40 * t) - 30 * t;
      d += circ(sx, sy, r.range(rr[0], rr[1]));
    }
    S.open({ id: `${id}-${name}` });
    S.p('rehaut', d, { opacity: op });
    S.close();
  }
  S.close();
  return o;
}

/** Rideau de velours (groupe animé `-curtain`, origine à la tringle). */
function curtain(S, L) {
  const { x, y, w, h } = L.window;
  const r = S.r;
  const id = `${S.id}-curtain`;
  const left = x + w + 6;
  const top = y - 26;
  const cw = 92;
  const bottom = y + h + 50;
  const origin = [left + cw / 2, top];
  // tringle
  S.wash(rect(x - 40, top - 4, w + cw + 90, 7), 'wash-safran', 'wash-sienne');
  S.ln(rect(x - 40, top - 4, w + cw + 90, 7), 0.8, 'ink');
  for (const ex of [x - 44, x + w + cw + 54]) {
    S.wash(circ(ex, top - 0.5, 7), 'wash-safran', 'wash-sienne');
    S.ln(circ(ex, top - 0.5, 7), 0.8, 'ink');
  }
  S.comment(
    `${id} : rideau. transform-origin: ${f(origin[0])}px ${f(origin[1])}px (tringle) ; balancement : rotate(±0.8deg) skewX(±1.2deg), 7 s, ease-in-out, aller-retour.`,
  );
  S.open({ id });
  const folds = 6;
  const pts = [
    [left, top, 1],
    [left + cw, top, 1],
  ];
  const hem = [];
  for (let i = 0; i <= folds; i++) {
    const t = i / folds;
    hem.push([
      left + cw + 8 - t * (cw + 12),
      bottom + Math.sin(t * Math.PI * folds) * 5 + r.jit(2),
    ]);
  }
  const d = smooth(
    [...pts, [left + cw + 4, top + h * 0.5], ...hem, [left - 6, top + h * 0.5]],
    true,
    0.5,
  );
  S.p('hair-roux', d);
  S.p('wash-carmin', d);
  S.within(d, () => {
    for (let i = 0; i < folds; i++) {
      const fx = left + (i + 0.5) * (cw / folds);
      S.p(
        'hatch-dense',
        `M${f(fx - 3)} ${top}C${f(fx - 6)} ${f(top + h * 0.4)} ${f(fx + 2)} ${f(top + h * 0.8)} ${f(fx - 5)} ${f(bottom + 10)}L${f(fx + 6)} ${f(bottom + 10)}C${f(fx + 10)} ${f(top + h * 0.8)} ${f(fx + 2)} ${f(top + h * 0.4)} ${f(fx + 5)} ${top}Z`,
      );
      S.ln(
        `M${f(fx + 6)} ${top}C${f(fx + 4)} ${f(top + h * 0.5)} ${f(fx + 10)} ${f(top + h * 0.8)} ${f(fx + 6)} ${f(bottom)}`,
        0.6,
        'ink-soft',
      );
    }
    // lumière de la lampe sur le bord droit du velours
    S.p(
      'wash-safran',
      poly(
        [
          [left + cw - 18, top],
          [left + cw + 10, top],
          [left + cw + 10, bottom + 10],
          [left + cw - 26, bottom + 10],
        ],
        true,
      ),
      { 'fill-opacity': 0.8 },
    );
    S.p('ombre', rect(left - 10, top, 30, h + 80));
    // dans la pénombre : voile d'encre (la lampe n'éclaire que le bord droit)
    S.p(
      'ink',
      poly(
        [
          [left - 20, top],
          [left + cw - 22, top],
          [left + cw - 30, bottom + 12],
          [left - 20, bottom + 12],
        ],
        true,
      ),
      { fill: 'currentColor', 'fill-opacity': 0.5, 'stroke-width': 0.5 },
    );
  });
  S.ln(d, 1, 'ink');
  // anneaux
  for (let i = 0; i < 5; i++) S.ln(ell(left + 6 + (i * (cw - 12)) / 4, top, 4, 6), 0.9, 'ink');
  // embrasse
  S.p(
    'wash-safran',
    tube(
      [
        [left - 2, top + h * 0.62],
        [left + cw * 0.5, top + h * 0.66],
        [left + cw + 6, top + h * 0.6],
      ],
      5,
    ),
  );
  S.ln(
    tube(
      [
        [left - 2, top + h * 0.62],
        [left + cw * 0.5, top + h * 0.66],
        [left + cw + 6, top + h * 0.6],
      ],
      5,
    ),
    0.6,
    'ink',
  );
  S.close();
  return origin;
}

export { blob, arc, hatchLines, dropShadow, text };
