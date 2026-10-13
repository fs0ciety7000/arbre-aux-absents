/**
 * Système paramétrique de portraits gravés (DESIGN.md §10.7).
 *
 * Un portrait = un buste de trois-quarts (visage tourné vers la gauche du spectateur, donc le
 * côté GAUCHE de la personne — mèche Aubertot, œil de Lucien, anneau des marins — est le côté
 * large, à droite de l'image), dessiné en taille-douce : contours `ink`, modelé par hachures
 * rognées, lavis `skin-*` / `hair-*` / `wash-*`, rehauts de gouache.
 *
 * API :
 *   renderFigure(spec, { prefix, mode })  → { defs, body }  fragment réutilisable (repère 160×200)
 *   renderPortrait(spec, { prefix, mode }) → SVG complet (cadre de tirage d'époque)
 *   atAge(spec, age)                      → spec de la même personne à un autre âge
 * `mode` : 'color' (gravure aquarellée) ou 'photo' (tirage argentique viré, sans couleur).
 */
import { rng, hash, f, smooth, poly, circ, ell, lerp, lerpPt, clamp, bbox, hatch, strands, inside } from './lib.mjs';

export const VIEWBOX = '0 0 160 200';
export const WIN = { x: 11, y: 8, w: 138, h: 184 };
const XM = 70;
const EY = 82;
/** Échelle globale des têtes dans la fenêtre. */
const G = 1.2;

/* ───────────────────────── Classes (couleur / photo) ───────────────────────── */

const PHOTO = {
  paper: 'photo-paper',
  'paper-shade': 'photo-light',
  ink: 'ink-soft',
  'ink-soft': 'ink-faint',
  'ink-faint': 'ink-faint',
  blush: null,
  'hair-blond': 'photo-mid',
  'hair-gris': 'photo-light',
  'hair-roux': 'photo-mid',
  'hair-chatain': 'photo-dark',
  'hair-brun': 'photo-dark',
  'hair-noir': 'photo-dark',
};
function photoClass(c) {
  if (c in PHOTO) return PHOTO[c];
  if (c.startsWith('skin-')) return 'photo-light';
  if (c.startsWith('wash-')) return 'photo-mid';
  return c;
}

/* ───────────────────────── Valeurs par défaut ───────────────────────── */

const DEFAULTS = {
  sex: 'f',
  age: 30,
  skin: 2,
  hair: 'brun',
  W: 24,
  H: 36,
  cheek: 0.4,
  jaw: 0.4,
  chin: 0.4,
  chinLen: 0,
  browRidge: 0,
  dx: 0,
  dy: 0,
  neckW: 0,
  neckLen: 0,
  shoulders: 1,
  slouch: 0,
  eyes: {},
  brows: {},
  nose: {},
  mouth: {},
  marks: {},
  beard: null,
  moustache: null,
  hairStyle: 'short',
  hairOpt: {},
  hat: null,
  glasses: null,
  earrings: null,
  clothes: { type: 'coat' },
  hands: [],
  wash: 'wash-ardoise',
};

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]))
      out[k] = merge(a[k], v);
    else out[k] = v;
  }
  return out;
}

/**
 * Même personne, autre âge. Applique les retouches de la bible (`spec.ages`, la plus proche
 * à âge égal ou inférieur pour l'âge adulte, supérieur pour l'enfance), puis le vieillissement
 * générique (rides, gris, proportions d'enfant). La silhouette de coiffure, les accessoires
 * signature et les traits héréditaires sont conservés.
 */
export function atAge(spec, age) {
  let s = merge(spec, { age });
  const table = (spec.ages ?? []).slice().sort((x, y) => x.age - y.age);
  // plus jeune : la retouche la plus proche au-dessus de l'âge demandé (et sous l'âge de case) ;
  // plus âgé : la plus proche au-dessous (et au-dessus de l'âge de case).
  const chosen =
    age < spec.age
      ? (table.find((e) => e.age >= age && e.age < spec.age) ?? null)
      : (table.filter((e) => e.age <= age && e.age > spec.age).pop() ?? null);
  if (chosen) s = merge(s, chosen.patch);
  if (age < 16) {
    const k = clamp((16 - age) / 12, 0, 1);
    s = merge(s, {
      W: s.W * (1 - 0.06 * k),
      H: s.H * (1 - 0.2 * k),
      jaw: s.jaw * (1 - 0.6 * k),
      chin: 0.3,
      cheek: Math.max(s.cheek, 0.6),
      neckW: (s.neckW ?? 0) - 0.18 * k,
      shoulders: s.shoulders * (1 - 0.25 * k),
      eyes: { size: 1 + 0.18 * k },
      nose: { len: (s.nose?.len ?? 1) * (1 - 0.25 * k), proj: (s.nose?.proj ?? 1) * (1 - 0.5 * k) },
      beard: null,
      moustache: null,
      child: k,
    });
  }
  return s;
}

/* ───────────────────────── Rendu ───────────────────────── */

export function renderFigure(input, { prefix, mode = 'color' } = {}) {
  const s = merge(DEFAULTS, input);
  const r = rng(hash(`${prefix}:${s.id ?? ''}`));
  const defs = [];
  const out = [];
  let k = 0;
  const id = () => `${prefix}-${(k++).toString(36)}`;
  const C = (c) => (mode === 'photo' ? photoClass(c) : c);
  const photo = mode === 'photo';

  const attrs = (a) =>
    Object.entries(a ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== false)
      .map(([n, v]) => ` ${n}="${v}"`)
      .join('');
  const path = (cls, d, a) => {
    if (!d) return '';
    const c = C(cls);
    if (c === null) return '';
    return `<path class="${c}" d="${d}"${attrs(a)}/>`;
  };
  const emit = (...xs) => out.push(...xs.filter(Boolean));
  /** Forme pleine : papier dessous (les lavis sont transparents), couleur, contour. */
  const solid = (d, fill, line = 'ink', a = {}) => {
    emit(path('paper', d), path(fill, d));
    if (line) emit(path(line, d, a));
  };
  const clipped = (regionD, inner) => {
    const cid = id();
    defs.push(`<clipPath id="${cid}"><path d="${regionD}"/></clipPath>`);
    return inner ? `<g clip-path="url(#${cid})">${inner}</g>` : '';
  };
  /** Hachures rognées par une région (points absolus pour la boîte). */
  const shade = (regionPts, { angle = 60, sp = 1.8, cls = 'ink-faint', bend = 0, jit = 0.25, sw, closed = true, k: kk = 1, ombre = false, gap = 0, within = null, cross = 0 } = {}) => {
    const d = smooth(regionPts, closed, kk);
    let lines = hatch(bbox(regionPts), angle, sp, r, { bend, jit, gap });
    if (cross) lines += hatch(bbox(regionPts), angle + cross, sp * 1.25, r, { bend: -bend, jit, gap });
    const inner = (ombre ? path('ombre', d) : '') + path(cls, lines, { 'stroke-width': sw });
    const g = clipped(d, inner);
    emit(within ? clipped(within, g) : g);
  };

  const W = s.W * G;
  const H = s.H * G;
  const ox = XM + s.dx;
  const oy = EY + s.dy;
  const P = (u, v, c) => (c ? [ox + u * W, oy + v * H, 1] : [ox + u * W, oy + v * H]);
  const U = (pts) => pts.map(([u, v, c]) => P(u, v, c));
  const age = s.age;
  const ag = clamp((age - 28) / 55, 0, 1);
  const child = s.child ?? 0;
  const male = s.sex === 'm';
  const skin = `skin-${s.skin}`;
  const hairCls = `hair-${s.hair}`;
  const browCls = `hair-${s.brows.color ?? (s.hair === 'gris' && age < 70 ? 'gris' : s.hair)}`;

  /* ── Géométrie du visage ── */
  const c = s.cheek;
  const j = s.jaw;
  const kc = s.chin;
  const cl = s.chinLen;
  const faceFar = [
    [-0.7, -0.5],
    [-0.76, -0.32],
    [-0.8 - 0.05 * s.browRidge, -0.13],
    [-0.71, 0.03],
    [-0.78 - 0.07 * c, 0.22],
    [-0.7 - 0.1 * c, 0.5],
    [-0.42 - 0.22 * j, 0.82 + cl * 0.5],
    [-0.16 - 0.1 * kc, 0.98 + cl],
  ];
  const chinB = [0.1 + 0.05 * kc, 1.03 + cl];
  const faceNear = [
    [0.42 + 0.28 * kc, 1.0 + cl],
    [0.86 + 0.4 * j, 0.78 + cl * 0.4],
    [1.18 + 0.05 * c, 0.42],
  ];
  const skullBack = [
    [1.45, 0.5],
    [1.66, 0.18],
    [1.7, -0.28],
    [1.52, -0.76],
    [1.08, -1.1],
    [0.45, -1.22],
    [-0.15, -1.12],
    [-0.56, -0.88],
  ];
  const faceLine = U([...faceFar, chinB, ...faceNear]);
  const headPts = U([...faceFar, chinB, ...faceNear, ...skullBack]);
  const headD = smooth(headPts, true);
  const jawPts = U([faceFar[6], faceFar[7], chinB, ...faceNear.slice(0, 2)]);

  const nb = 0.47 * (s.nose.len ?? 1); // base du nez (v)
  const mv = 0.7 + 0.02 * (s.nose.len ?? 1) - 0.02 + cl * 0.3; // bouche (v)

  /* ── 1. Fond : vignette gravée à tailles horizontales ── */
  if (s.background !== false) {
    const box = { x0: WIN.x, y0: WIN.y, x1: WIN.x + WIN.w, y1: WIN.y + WIN.h };
    // couronne dense hors de l'ovale, tailles espacées et interrompues dedans
    const ring = `M0 0h160v200H0Z${ell(80, 98, 62, 86)}`;
    const cid = id();
    defs.push(`<clipPath id="${cid}"><path d="${ring}" clip-rule="evenodd"/></clipPath>`);
    emit(clipped(ell(80, 98, 76, 100), `<g clip-path="url(#${cid})">${path('ink-faint', hatch(box, 0, photo ? 2.4 : 1.9, r, { jit: 0.12, gap: 14 }))}</g>`));
  }

  /* ── 2. Cheveux arrière (chignons, longueurs) ── */
  const hair = HAIR[s.hairStyle] ?? HAIR.short;
  const hctx = { s, P, U, r, emit, path, solid, shade, hairCls, ag, child, male, smooth, clipped, id, headD, W, H };
  if (hair.back) hair.back(hctx);

  /* ── 3. Cou ── */
  const nl = s.neckLen;
  const nw = s.neckW;
  {
    const front = U([
      [-0.27, 0.8],
      [-0.29 - nw * 0.3, 1.12],
      [-0.34 - nw, 1.55 + nl],
    ]);
    const back = U([
      [1.08 + nw, 1.55 + nl],
      [1.1 + nw * 0.5, 1.05],
      [1.24, 0.42],
    ]);
    const neckD = smooth([...front, ...back, P(0.5, 0.4)], true, 0.6);
    solid(neckD, skin, null);
    emit(path('ink-soft', smooth(front)), path('ink-soft', smooth(back)));
    // ombre portée de la mâchoire, gorge et côté du cou
    shade(
      U([
        [-0.4, 0.8],
        [-0.25, 1.0 + cl],
        [0.3, 1.1 + cl],
        [0.95, 0.92],
        [1.3, 0.6],
        [1.3, 1.6],
        [0.9, 1.6],
        [0.7, 1.3 + nl * 0.5],
        [0.2, 1.24 + nl * 0.5],
        [-0.42, 1.1],
      ]),
      { angle: 28, sp: 1.25, ombre: true, cross: 50, within: neckD },
    );
    shade(U([[-0.4, 0.9], [-0.15, 1.0], [-0.12, 1.7], [-0.45, 1.7]]), { angle: 80, sp: 1.6, within: neckD });
    if (s.marks.birthmarkNeck) {
      const [bx, by] = P(-0.1, 1.2);
      const bm = smooth([[bx - 2.6, by - 1], [bx - 0.6, by - 2.8], [bx + 2.4, by - 1.6], [bx + 2.8, by + 1.2], [bx + 0.4, by + 2.4], [bx - 2.2, by + 1.6]], true);
      emit(path('hair-brun', bm), path('hair-brun', bm), path('ink-faint', bm));
    }
    if (ag > 0.5) {
      emit(path('ink-faint', smooth(U([[0.05, 1.08], [0.02, 1.25], [-0.02, 1.45]]))));
      emit(path('ink-faint', smooth(U([[0.5, 1.05], [0.46, 1.25], [0.48, 1.42]]))));
    }
  }

  /* ── 4. Buste et vêtements ── */
  const yN = oy + (1.42 + nl) * H;
  const nx0 = P(-0.34 - nw, 0)[0];
  const nx1 = P(1.08 + nw, 0)[0];
  const cm = (nx0 + nx1) / 2 - 4; // milieu de poitrine (décalé par le trois-quarts)
  const sb = s.shoulders * G;
  const torsoPts = [
    [WIN.x - 4, 205, 1],
    [WIN.x - 4, yN + 30 - 6 * (sb - 1)],
    [XM - 42 * sb, yN + 10 + s.slouch * 2],
    [nx0 - 3, yN + 2],
    [nx0 + 6, yN - 3],
    [nx1 - 5, yN - 5],
    [nx1 + 5, yN - 1],
    [XM + 58 * sb, yN + 6 - s.slouch * 4],
    [WIN.x + WIN.w + 4, yN + 24 - 8 * (sb - 1)],
    [WIN.x + WIN.w + 4, 205, 1],
  ];
  const bctx = { s, P, U, r, emit, path, solid, shade, clipped, yN, nx0, nx1, cm, torsoPts, id, photo, hairCls, G };
  (CLOTHES[s.clothes.type] ?? CLOTHES.coat)(bctx, s.clothes);

  /* ── 5. Tête : carnation, modelé ── */
  if (hair.under) hair.under(hctx);
  solid(headD, skin, null);
  const earPts = s.marks.bigEars
    ? [[1.12, -0.16], [1.34, -0.3], [1.6, -0.14], [1.6, 0.18], [1.48, 0.4], [1.34, 0.5], [1.18, 0.44]]
    : [[1.14, -0.12], [1.28, -0.2], [1.43, -0.08], [1.42, 0.16], [1.36, 0.34], [1.29, 0.45], [1.16, 0.42]];
  const earD = smooth(U(earPts), false);
  const drawEar = () => {
    const ed = `${earD}Z`;
    solid(ed, skin, null);
    const k = s.marks.bigEars ? 1.25 : 1;
    const E = (u, v) => [1.14 + (u - 1.14) * k, v * k];
    emit(path('ombre', smooth(U([E(1.22, 0.0), E(1.32, 0.02), E(1.3, 0.2), E(1.22, 0.24)]), true)));
    shade(U([E(1.14, -0.1), E(1.3, -0.12), E(1.34, 0.3), E(1.2, 0.42)]), { angle: 80, sp: 1.4, within: ed });
    emit(path('ink-soft', earD));
    emit(path('ink-faint', smooth(U([E(1.2, -0.06), E(1.33, -0.09), E(1.37, 0.08), E(1.3, 0.22), E(1.32, 0.33)]))));
    if (s.marks.earNotch) {
      const n = U([[1.425, 0.02], [1.37, 0.07], [1.425, 0.12]]);
      emit(path('paper', `${poly(n)}Z`), path(skin, `${poly(n)}Z`), path('ink-soft', poly(n)));
    }
  };
  if (hair.coversEar && !s.marks.bigEars) drawEar();

  // modelé : côté fuyant dans l'ombre (lumière de la droite), bord de joue, tempes, orbites
  const farShade = U([
    [-0.74, -0.6],
    [-0.8, -0.13],
    [-0.71, 0.03],
    [-0.84, 0.22],
    [-0.75, 0.5],
    [-0.5, 0.86],
    [-0.2, 1.02],
    [-0.16, 0.9],
    [-0.36, 0.68],
    [-0.46, 0.46],
    [-0.5, 0.26],
    [-0.62, 0.1],
    [-0.62, -0.1],
    [-0.6, -0.3],
    [-0.6, -0.6],
  ]);
  shade(farShade, { angle: 70, sp: 1.3 + child * 0.4, ombre: true, bend: 1.2, within: headD });
  // ombre portée du nez sur la joue fuyante
  shade(U([[-0.16, 0.12], [-0.32, nb - 0.04], [-0.3, nb + 0.08], [-0.5, nb + 0.06], [-0.52, 0.3], [-0.4, 0.14]]), { angle: 70, sp: 1.3, within: headD });
  shade(
    U([
      [1.02, -0.6],
      [1.3, -0.3],
      [1.3, 0.06],
      [1.22, 0.42],
      [0.9 + 0.4 * j, 0.82],
      [0.55, 1.0 + cl],
      [0.66, 0.86],
      [0.94, 0.56],
      [1.04, 0.2],
      [1.02, -0.2],
    ]),
    { angle: 98, sp: 1.5, bend: -1.5, jit: 0.3, ombre: true, within: headD },
  );
  // orbites (côté nez) et tempe proche
  shade(U([[0.06, -0.18], [0.26, -0.14], [0.2, -0.02], [0.08, 0.06]]), { angle: 45, sp: 1.5, within: headD });
  shade(U([[0.85, -0.55], [1.1, -0.5], [1.1, -0.05], [0.95, -0.1]]), { angle: 80, sp: 1.6, within: headD });
  // sous la pommette
  shade(U([[0.3, 0.4], [0.7, 0.36], [1.04, 0.46], [0.95, 0.7], [0.7, 0.58], [0.4, 0.5]]), { angle: 84, sp: s.marks.hollow || ag > 0.6 ? 1.3 : 2.4, bend: 1, within: headD });
  if (s.eyes.deep) {
    shade(U([[0.05, -0.12], [0.45, -0.2], [0.85, -0.1], [0.82, 0.04], [0.45, -0.07], [0.1, 0.0]]), { angle: 15, sp: 1.1, ombre: true, cross: 60 });
  }
  // couleur des joues (lavis léger, femmes et enfants)
  if (!s.marks.noBlush && (!male || child) && s.skin < 4 && age < 75) {
    emit(path('blush', smooth(U([[0.46, 0.3], [0.74, 0.27], [0.95, 0.36], [0.9, 0.52], [0.68, 0.56], [0.5, 0.47]]), true)));
    emit(path('blush', smooth(U([[-0.5, 0.32], [-0.4, 0.34], [-0.4, 0.48], [-0.52, 0.52], [-0.6, 0.42]]), true)));
  }
  // contour du visage
  emit(path('ink', smooth(faceLine), { 'stroke-width': photo ? undefined : 0.9 }));
  emit(path('ink-soft', smooth(U(skullBack.slice(2)))));

  /* ── 6. Traits ── */
  const eyeSize = s.eyes.size ?? 1;
  const ex1 = P(0.5, 0);
  const ex2 = P(-0.4, 0.01);
  const a1 = 0.22 * W * eyeSize;
  const a2 = 0.16 * W * eyeSize;
  const gaze = s.eyes.gaze ?? -0.1;
  drawEye(ex1, a1, a1 * 0.44, -1, s.marks.strabismus ? 0.46 : gaze, s, true);
  drawEye(ex2, a2, a2 * 0.56, 1, gaze, s, false);

  function drawEye([x, y], a, b, inDir, g, sp, near) {
    const lid = sp.eyes.lid ?? 0;
    const up = b * (1 - 0.42 * lid);
    const I = [x + inDir * a, y + 0.2 * b];
    const O = [x - inDir * a, y - 0.04 * b];
    const upper = [I, [x + inDir * 0.45 * a, y - 0.95 * up], [x - inDir * 0.25 * a, y - 1.02 * up], O];
    const lower = [O, [x - inDir * 0.3 * a, y + 0.7 * b], [x + inDir * 0.42 * a, y + 0.74 * b], I];
    const almond = `${smooth(upper)}${smooth(lower).replace(/^M[^C]*/, '')}Z`;
    emit(path('rehaut', almond));
    const ri = b * 1.12 * (near ? 1 : 0.95);
    const ix = x + g * a;
    const iy = y + 0.1 * b;
    const rx = near ? ri : ri * 0.8;
    let iris = '';
    // ombre de la paupière sur le blanc
    iris += path('ombre', smooth([[I[0], I[1] - b], [O[0], O[1] - b], [O[0], O[1] + 0.25 * b], [x, y - 0.35 * b], [I[0], I[1] + 0.1 * b]], true));
    if (!sp.eyes.light) iris += path('ombre', ell(ix, iy, rx, ri)) + path('ombre', ell(ix, iy, rx, ri));
    let rays = '';
    for (let q = 0; q < 10; q++) {
      const t = (q / 10) * Math.PI * 2;
      rays += `M${f(ix + Math.cos(t) * rx * 0.45)} ${f(iy + Math.sin(t) * ri * 0.45)}L${f(ix + Math.cos(t) * rx * 0.95)} ${f(iy + Math.sin(t) * ri * 0.95)}`;
    }
    iris += path('ink-faint', rays);
    iris += path('ink-soft', ell(ix, iy, rx, ri), { 'stroke-width': 0.6 });
    iris += path('ink', ell(ix, iy, rx * 0.4, ri * 0.4), { fill: 'currentColor', 'stroke-width': 0.3 });
    iris += path('rehaut', circ(ix + rx * 0.28, iy - ri * 0.3, Math.max(0.4, ri * 0.16)));
    emit(clipped(almond, iris));
    // paupière supérieure : trait fort, cils
    emit(path('ink', smooth(upper), { 'stroke-width': photo ? undefined : 1.1 }));
    emit(path('ink', poly([O, [O[0] - inDir * 0.16 * a, O[1] - 0.18 * b]]), { 'stroke-width': 0.8 }));
    if (sp.eyes.liner) {
      emit(path('ink', `${poly([[O[0] + inDir * 0.2 * a, O[1] - 0.4 * b], [O[0] - inDir * 0.5 * a, O[1] - 0.8 * b], [O[0] - inDir * 0.02 * a, O[1] + 0.15 * b]])}Z`, { fill: 'currentColor', 'stroke-width': 0.5 }));
    }
    // pli et paupière lourde
    const cr = 0.95 * b + (lid ? -0.25 * b : 0.2 * b);
    const crease = [[x + inDir * 0.8 * a, y - 0.5 * b], [x + inDir * 0.1 * a, y - cr - 0.55 * b], [x - inDir * 0.6 * a, y - cr - 0.25 * b], [x - inDir * 1.02 * a, y - 0.2 * b]];
    emit(path(lid > 0.5 ? 'ink-soft' : 'ink-faint', smooth(crease), { 'stroke-width': lid > 0.5 ? 0.8 : undefined }));
    if (lid) emit(path('ombre', `${smooth(upper)}${smooth(crease.slice().reverse()).replace(/^M/, 'L')}Z`));
    // paupière inférieure, cerne
    emit(path('ink-faint', smooth([O, [x - inDir * 0.3 * a, y + 0.78 * b], [x + inDir * 0.45 * a, y + 0.8 * b]])));
    if (ag > 0.2 || sp.eyes.deep) {
      emit(path('ink-faint', smooth([[x - inDir * 0.7 * a, y + 0.95 * b], [x, y + 1.5 * b + ag * b], [x + inDir * 0.75 * a, y + 1.2 * b]])));
    }
    if (near && ag > 0.32) {
      for (let q = 0; q < 2 + Math.round(ag * 2); q++) {
        const yy = O[1] - 0.6 * b + q * 0.9 * b;
        emit(path('ink-faint', smooth([[O[0] - inDir * 0.3 * a, yy], [O[0] - inDir * 0.7 * a, yy + (q - 1) * 0.5 * b], [O[0] - inDir * 1.0 * a, yy + (q - 1.2) * 1.0 * b]])));
      }
    }
  }

  // sourcils
  {
    const thick = s.brows.thick ?? 1;
    const arch = s.brows.arch ?? 0.5;
    const lift = s.brows.lift ?? 0;
    const brow = ([x, y], a, inDir, near) => {
      const yb = y - (0.2 + lift * 0.04) * H;
      const pts = [
        [x + inDir * 1.0 * a, yb + 0.02 * H],
        [x + inDir * 0.15 * a, yb - (0.035 + 0.035 * arch) * H],
        [x - inDir * 0.75 * a, yb - (0.02 + 0.03 * arch) * H],
        [x - inDir * 1.25 * a, yb + 0.035 * H],
      ];
      const t = (0.75 + 0.55 * thick) * (near ? 1 : 0.85);
      const top = pts.map(([px, py], q) => [px, py - (t * (1 - q * 0.22)) / 2]);
      const bot = pts.map(([px, py], q) => [px, py + (t * (1 - q * 0.22)) / 2]);
      const d = `${smooth(top)}${smooth(bot.slice().reverse()).replace(/^M/, 'L')}Z`;
      emit(path(browCls, d));
      // poils gravés
      const n = Math.round(7 + 5 * thick);
      let hd = '';
      for (let q = 0; q < n; q++) {
        const tq = q / (n - 1);
        const seg = Math.min(2, Math.floor(tq * 3));
        const lt = tq * 3 - seg;
        const p0 = lerpPt(bot[seg], bot[seg + 1], lt);
        const p1 = lerpPt(top[seg], top[seg + 1], lt);
        hd += `M${f(p0[0] + r.jit(0.3))} ${f(p0[1] + 0.3)}L${f(p1[0] - inDir * 1.1 * (0.5 + tq))} ${f(p1[1] - 0.2)}`;
      }
      emit(path('ink-soft', hd, { 'stroke-width': 0.55 + 0.15 * thick }));
      if (near && s.marks.browScar) {
        const m = lerpPt(pts[1], pts[2], 0.35);
        emit(path('paper', ell(m[0], m[1] + 0.3, 0.9, 2.6), { transform: `rotate(-20 ${f(m[0])} ${f(m[1])})` }));
        emit(path('rehaut', ell(m[0], m[1] + 0.3, 0.9, 3.2), { transform: `rotate(-20 ${f(m[0])} ${f(m[1])})` }));
        emit(path('ink-faint', poly([[m[0] - 0.6, m[1] - 3], [m[0] + 1.6, m[1] + 3.4]])));
      }
    };
    brow(ex1, a1 / eyeSize, -1, true);
    brow(ex2, a2 / eyeSize, 1, false);
  }

  // nez
  {
    const np = s.nose.proj ?? 1;
    const nwid = s.nose.width ?? 1;
    const prof = [
      [-0.12, -0.04],
      [-0.17 - 0.03 * np, 0.15],
      ...(s.nose.broken ? [[-0.25 - 0.06 * np, 0.24], [-0.21 - 0.05 * np, 0.3]] : [[-0.23 - 0.07 * np, 0.3]]),
      [-0.29 - 0.11 * np, nb - 0.07],
      [-0.28 - 0.11 * np, nb - 0.01],
      [-0.19 - 0.05 * np, nb + 0.03],
      [-0.1, nb + 0.025],
    ];
    // ombre portée du nez sur la joue fuyante
    emit(path('ink-faint', smooth(U(prof.slice(0, 3)))), path('ink-soft', smooth(U(prof.slice(1))), { 'stroke-width': 0.9 }));
    // aile du nez, narine
    const ala = U([
      [-0.02, nb - 0.07],
      [0.13 * nwid, nb - 0.05],
      [0.17 * nwid, nb + 0.01],
      [0.09 * nwid, nb + 0.04],
      [0.0, nb + 0.035],
    ]);
    emit(path('ink-soft', smooth(ala), { 'stroke-width': 0.8 }));
    emit(path('ink-soft', ell(...P(-0.05, nb + 0.015), 1.3 * nwid, 0.6), { fill: 'currentColor', 'stroke-width': 0.3 }));
    // plan latéral du nez
    emit(path('ink-faint', smooth(U([[0.03, 0.04], [0.02, 0.22], [0.06, nb - 0.1]]))));
    shade(U([[-0.08, 0.02], [0.05, 0.06], [0.06, nb - 0.12], [0.16, nb - 0.06], [0.1, nb + 0.06], [-0.1, nb + 0.05], [-0.16, 0.3]]), { angle: 75, sp: 1.6 });
  }

  // bouche
  {
    const mw = s.mouth.w ?? 1;
    const full = (s.mouth.full ?? 0.5) * (1 - 0.5 * clamp((age - 60) / 30, 0, 1));
    const sm = s.mouth.smile ?? 0;
    const Cf = [-0.27 * mw, mv + 0.01 - sm * 0.035];
    const Cn = [0.46 * mw, mv + 0.005 - sm * 0.045];
    const part = [Cf, [-0.12 * mw, mv + 0.008 + sm * 0.01], [0.04, mv + 0.004 + sm * 0.022], [0.24 * mw, mv + 0.012 + sm * 0.012], Cn];
    const upTop = [
      [Cf[0] + 0.03, Cf[1] - 0.004],
      [-0.1 * mw, mv - 0.03 - 0.035 * full],
      [0.02, mv - 0.018 - 0.02 * full],
      [0.13 * mw, mv - 0.035 - 0.04 * full],
      [Cn[0] - 0.04, Cn[1] - 0.006],
    ];
    const loBot = [Cf, [-0.08 * mw, mv + 0.05 + 0.05 * full], [0.1, mv + 0.065 + 0.06 * full], [0.32 * mw, mv + 0.04 + 0.04 * full], Cn];
    const upperLip = `${smooth(U(upTop))}${smooth(U(part.slice().reverse())).replace(/^M/, 'L')}Z`;
    const lowerLip = `${smooth(U(part))}${smooth(U(loBot.slice().reverse())).replace(/^M/, 'L')}Z`;
    if (!s.marks.noLipColor) emit(path('blush', upperLip), path('blush', lowerLip));
    emit(path('ombre', upperLip));
    if (s.mouth.teeth) {
      const low = part.map(([u, v], q) => [u, v + (q === 0 || q === 4 ? 0 : 0.045 + 0.01 * sm)]);
      const td = `${smooth(U(part))}${smooth(U(low.slice().reverse())).replace(/^M/, 'L')}Z`;
      emit(path('rehaut', td), path('ink-faint', td));
      let tl = '';
      for (const u of [-0.15, 0.1, 0.26]) {
        const [x0, y0] = P(u, mv + 0.012);
        tl += `M${f(x0)} ${f(y0)}l0 ${f(0.035 * H)}`;
      }
      emit(path('ink-faint', tl));
      const [gx, gy] = P(-0.03, mv + 0.012);
      if (s.mouth.teeth === 'gap') emit(path('ink-soft', `M${f(gx - 0.5)} ${f(gy)}l1 0l-0.2 ${f(0.04 * H)}l-0.6 0Z`, { fill: 'currentColor', 'stroke-width': 0.3 }));
      if (s.mouth.teeth === 'chipped') emit(path('ink-soft', `M${f(gx + 1.2)} ${f(gy + 0.04 * H)}l2.6 0l-1.6 -1.3Z`, { fill: 'currentColor', 'stroke-width': 0.3 }));
    }
    emit(path('ink', smooth(U(part)), { 'stroke-width': photo ? undefined : 0.95 }));
    emit(path('ink-faint', smooth(U(upTop))));
    emit(path('ink-soft', smooth(U([[-0.1 * mw, mv + 0.09 + 0.04 * full], [0.08, mv + 0.105 + 0.06 * full], [0.26 * mw, mv + 0.085 + 0.04 * full]]))));
    shade(U([[-0.14, mv + 0.1 + 0.04 * full], [0.28, mv + 0.1 + 0.04 * full], [0.2, mv + 0.19], [-0.04, mv + 0.2]]), { angle: 160, sp: 1.3 });
    // philtrum et commissures
    emit(path('ink-faint', `M${f(P(-0.08, nb + 0.06)[0])} ${f(P(-0.08, nb + 0.06)[1])}L${f(P(-0.06, mv - 0.05)[0])} ${f(P(-0.06, mv - 0.05)[1])}M${f(P(0.09, nb + 0.06)[0])} ${f(P(0.09, nb + 0.06)[1])}L${f(P(0.11, mv - 0.06)[0])} ${f(P(0.11, mv - 0.06)[1])}`));
    const [cx1, cy1] = P(...Cn);
    emit(path('ink-soft', `M${f(cx1 - 1)} ${f(cy1 - 0.6 - sm)}q1.2 0.6 1.6 ${f(1.4 - sm * 1.6)}`));
    // sillons, rides, fossettes
    if (ag > 0.12 || sm > 0.3) {
      emit(path('ink-faint', smooth(U([[0.16, nb - 0.03], [0.4, nb + 0.12], [0.55, mv + 0.07 - sm * 0.02]])), { 'stroke-width': ag > 0.5 ? 0.7 : undefined }));
      emit(path('ink-faint', smooth(U([[-0.34, nb + 0.03], [-0.4, mv + 0.04]]))));
    }
    if (s.marks.dimples) {
      emit(path('ink-soft', smooth(U([[0.63, mv - 0.08], [0.67, mv - 0.02], [0.64, mv + 0.04]]))));
      emit(path('ink-faint', smooth(U([[-0.4, mv - 0.06], [-0.43, mv + 0.02]]))));
    }
    if (ag > 0.55) {
      emit(path('ink-faint', smooth(U([[Cn[0] + 0.05, Cn[1] + 0.05], [0.62, 0.86], [0.7, 0.98]]))));
      emit(path('ink-faint', smooth(U([[-0.32, mv + 0.06], [-0.36, 0.86]]))));
      let lines = '';
      for (const u of [-0.06, 0.08, 0.2]) {
        const [x0, y0] = P(u, mv - 0.03);
        lines += `M${f(x0)} ${f(y0)}l${f(r.jit(0.4))} -2`;
      }
      emit(path('ink-faint', lines));
    }
    if (ag > 0.3) {
      for (let q = 0; q < 1 + Math.round(ag * 2); q++) {
        const v = -0.42 - q * 0.1;
        emit(path('ink-faint', smooth(U([[-0.45, v + 0.02], [0.1, v - 0.03], [0.65, v + 0.01], [0.95, v + 0.05]]))));
      }
    }
    if (s.marks.cleft) {
      emit(path('ink-soft', smooth(U([[0.06, 0.9 + cl], [0.07, 0.96 + cl], [0.08, 1.02 + cl]])), { 'stroke-width': 0.9 }));
      emit(path('ombre', ell(...P(0.04, 0.97 + cl), 1.2, 2.6)));
    }
    if (s.marks.chinDimple) {
      emit(path('ink-soft', smooth(U([[0.02, 0.93 + cl], [0.08, 0.95 + cl], [0.12, 0.93 + cl]]))));
      emit(path('ombre', ell(...P(0.07, 0.94 + cl), 1.6, 1)));
    }
    if (s.marks.chinScar) {
      const [x0, y0] = P(0.22, 0.92 + cl);
      emit(path('rehaut', ell(x0, y0, 2, 0.6), { transform: `rotate(-25 ${f(x0)} ${f(y0)})` }));
      emit(path('ink-faint', `M${f(x0 - 1.8)} ${f(y0 + 0.9)}l3.6 -1.8`));
    }
    if (s.marks.mole) {
      const [x0, y0] = P(...s.marks.mole);
      emit(path('ink-soft', circ(x0, y0, 0.85), { fill: 'currentColor', 'stroke-width': 0.3 }));
    }
    if (s.marks.freckles) {
      let fd = '';
      const zone = U([[-0.5, 0.12], [0.0, 0.08], [0.9, 0.16], [1.0, 0.42], [0.6, 0.55], [0.1, 0.5], [-0.55, 0.45]]);
      const bb = bbox(zone);
      let placed = 0;
      for (let q = 0; q < 400 && placed < 40; q++) {
        const p = [r.range(bb.x0, bb.x1), r.range(bb.y0, bb.y1)];
        if (!inside(p, zone)) continue;
        fd += circ(p[0], p[1], r.range(0.3, 0.55));
        placed++;
      }
      emit(path(photo ? 'ombre' : 'hair-roux', fd), path('ombre', fd));
    }
    if (s.mouth.pipe) {
      const [px, py] = P(0.3, mv + 0.02);
      const stem = smooth([[px, py], [px - 9, py + 4], [px - 17, py + 9]]);
      emit(path('ink', stem, { 'stroke-width': 2.4 }));
      const bowl = smooth([[px - 15, py + 5, 1], [px - 21, py + 5.5], [px - 22, py + 13], [px - 18, py + 17], [px - 14, py + 13], [px - 14, py + 6, 1]], true);
      solid(bowl, 'hair-brun', 'ink');
      emit(path('ink-faint', smooth([[px - 20.5, py + 8], [px - 19, py + 14]])));
      emit(path('rehaut', ell(px - 16, py + 10, 0.8, 2.5)));
    }
  }

  /* ── 7. Pilosité faciale ── */
  if (s.beard) BEARD[s.beard.style]?.(hctx, s.beard);
  if (s.moustache) MOUSTACHE[s.moustache.style]?.(hctx, s.moustache, mv, nb);

  /* ── 8. Chevelure, mèche ── */
  hair.front?.(hctx);
  if (s.marks.meche && hair.meche !== false) {
    const m = s.marks.meche === true ? (hair.mecheZone ?? DEFAULT_MECHE) : s.marks.meche;
    const md = smooth(U(m.zone), true);
    emit(path('paper', md), path('rehaut', md));
    emit(path('ink-soft', strands([U(m.a), U(m.b)], 6, r, { jit: 0.15 }), { 'stroke-width': 0.45 }));
  }
  if (!hair.coversEar || s.marks.bigEars) drawEar();

  /* ── 9. Coiffe ── */
  if (s.hat) HATS[s.hat.type]?.(hctx, s.hat);

  /* ── 10. Lunettes, bijoux ── */
  if (s.glasses) GLASSES[s.glasses.type]?.({ ...hctx, ex1, ex2, a1, a2 }, s.glasses);
  if (s.earrings) EARRINGS[s.earrings.type]?.(hctx, s.earrings);

  /* ── 11. Mains, avant-bras, objets ── */
  for (const h of s.hands ?? []) drawHand(h);
  for (const a of s.arms ?? []) drawArm(a);
  if (s.extras) for (const x of s.extras) EXTRAS[x.type]?.(bctx, x);

  function drawHand(h) {
    const side = h.side === 'L' ? 1 : -1; // L = main gauche (côté droit de l'image)
    const tr = `translate(${f(h.x)} ${f(h.y)}) rotate(${f(h.rot ?? 0)}) scale(${f((h.scale ?? 1) * 1.45)})`;
    const parts = [];
    const pp = (cls, d, a) => parts.push(path(cls, d, a));
    const sk = h.gloved ? 'rehaut' : skin;
    // manche
    if (h.sleeve) {
      const sd = smooth([[-10, 4, 1], [-9, -1], [9, -2], [11, 4], [12, 26, 1], [-12, 26, 1]], true);
      pp('paper', sd);
      pp(h.sleeve, sd);
      if (h.sleeveDark) pp('hatch-dense', sd);
      pp('ink', sd);
      pp('ink-faint', smooth([[-9, 2], [9, 1]]));
    }
    // doigts : de l'intérieur (pouce) vers l'extérieur
    const fingers = [
      { x: -4.5, len: 12.5, ang: -8 },
      { x: -1.2, len: 14.5, ang: -2 },
      { x: 2.2, len: 13.5, ang: 4 },
      { x: 5.4, len: 10.5, ang: 10 },
    ];
    const miss = h.missing ?? [];
    fingers.forEach((fg, q) => {
      if (miss.includes(q)) return;
      const bx = fg.x * side;
      const a = ((fg.ang + (h.curl ?? 0)) * Math.PI) / 180 * side;
      const tipx = bx + Math.sin(a) * fg.len;
      const tipy = -16 - Math.cos(a) * fg.len;
      const midx = (bx + tipx) / 2;
      const midy = (-16 + tipy) / 2;
      const w = 1.75;
      const fd = smooth([[bx - w, -15], [midx - w, midy], [tipx - w * 0.85, tipy + 1.6], [tipx, tipy - 0.2], [tipx + w * 0.85, tipy + 1.6], [midx + w, midy], [bx + w, -15]], true);
      pp('paper', fd);
      pp(sk, fd);
      pp('ink-soft', fd);
      pp('ink-faint', `M${f(midx - 1.2)} ${f(midy + 0.5)}q1.2 -0.8 2.4 0M${f(lerp(midx, tipx, 0.55) - 0.9)} ${f(lerp(midy, tipy, 0.55) + 0.4)}q0.9 -0.5 1.8 0`);
      if (!h.gloved) pp('ink-faint', `M${f(tipx - 1)} ${f(tipy + 2.6)}q1 -1.2 2 0`);
      if (h.stain && h.stain.includes(q)) pp(h.stainCls ?? 'wash-carmin', circ(tipx + r.jit(0.5), tipy + 2.4, 1.3));
      if (h.ink) pp('ink-soft', smooth([[tipx - w * 0.85, tipy + 1.6], [tipx, tipy - 0.2], [tipx + w * 0.85, tipy + 1.6], [tipx + w * 0.9, tipy + 4], [tipx - w * 0.9, tipy + 4]], true), { fill: 'currentColor', 'stroke-width': 0.3 });
      if (h.ring === q) {
        const ry = lerp(-15, midy, 0.4);
        const rx = lerp(bx, midx, 0.4);
        pp('wash-safran', ell(rx, ry, w + 0.8, 1.4));
        pp('ink', ell(rx, ry, w + 0.8, 1.4), { 'stroke-width': 0.7 });
        pp('ink-soft', `M${f(rx - 0.6)} ${f(ry - 0.6)}l0.6 1.2l0.6 -1.2`, { 'stroke-width': 0.4 });
      }
    });
    if (miss.length) {
      // moignons cicatrisés
      for (const q of miss) {
        const bx = fingers[q].x * side;
        const sd = smooth([[bx - 1.75, -14], [bx - 1.5, -17.5], [bx, -18.6], [bx + 1.5, -17.5], [bx + 1.75, -14]], false);
        pp('paper', `${sd}Z`);
        pp(sk, `${sd}Z`);
        pp('ink-soft', sd);
        pp('ink-faint', `M${f(bx - 0.9)} ${f(-17.4)}l1.8 0.3`);
      }
    }
    // paume (dos de la main)
    const pd = smooth([[-7 * side, 2], [-8.2 * side, -9], [-6.8 * side, -16.5], [0, -17.6], [7.2 * side, -15.6], [7.6 * side, -6], [6 * side, 3]], true);
    pp('paper', pd);
    pp(sk, pd);
    pp('ink-soft', pd);
    // pouce
    const td = smooth([[-6.5 * side, -4], [-11 * side, -10], [-13.6 * side, -15.5], [-12 * side, -17], [-9 * side, -14.5], [-6.6 * side, -11]], true);
    pp('paper', td);
    pp(sk, td);
    pp('ink-soft', td);
    // tendons, ombre
    pp('ink-faint', `M${f(-3 * side)} -2l${f(-1.2 * side)} -11M${f(0.6 * side)} -1l${f(-0.4 * side)} -12M${f(4 * side)} -1l${f(0.6 * side)} -11`);
    pp('ombre', smooth([[3.5 * side, 2], [7.4 * side, -5], [7 * side, -15], [4.6 * side, -9]], true));
    if (h.gloved) pp('ink-faint', `M${f(-7 * side)} 0q${f(7 * side)} 2 ${f(13 * side)} 0M${f(-6.5 * side)} -2q${f(7 * side)} 1.6 ${f(13 * side)} 0`);
    if (h.burn) {
      const bd = smooth([[-3 * side, -6], [-1 * side, -10.5], [3 * side, -11], [4.8 * side, -7.6], [2.6 * side, -4], [-1 * side, -3.6]], true);
      pp('blush', bd);
      pp('blush', bd);
      pp('ink-faint', bd);
      pp('ink-faint', `M${f(-1.5 * side)} -7.5q1.5 -1.5 3 -0.4M${f(0)} -5.5q1.5 -1 3 0`);
    }
    if (h.pincushion) {
      const cd = smooth([[-8, 3], [-7.5, -1.4], [0, -4], [7.5, -1.4], [8, 3]], true);
      pp('paper', cd);
      pp(h.pincushion, cd);
      pp('ink', cd);
      pp('ink-faint', `M-7.6 3.6q7.6 2 15.2 0`);
      let pins = '';
      for (const [px, py] of [[-4, -1.8], [-1, -3], [2.4, -2.8], [5, -1.2]]) pins += `M${px} ${py}l${f(r.jit(1.2))} -3.6`;
      pp('ink', pins, { 'stroke-width': 0.5 });
      for (const [px, py] of [[-4, -1.8], [-1, -3], [2.4, -2.8], [5, -1.2]]) pp('ink', circ(px, py - 3.6, 0.55), { fill: 'currentColor', 'stroke-width': 0.2 });
    }
    emit(`<g transform="${tr}">${parts.join('')}</g>`);
  }

  function drawArm(a) {
    // avant-bras replié en travers du bas du buste
    const side = a.side === 'L' ? 1 : -1; // L : bras gauche (part du bord droit)
    const x0 = side > 0 ? WIN.x + WIN.w + 6 : WIN.x - 6;
    const x1 = a.to;
    const y0 = a.y;
    const y1 = a.y - (a.rise ?? 8);
    const w = a.w ?? 8;
    const top = [[x0, y0 - w], [lerp(x0, x1, 0.5), lerp(y0, y1, 0.5) - w - 0.6], [x1, y1 - w + 1]];
    const bot = [[x1 - side * 2, y1 + w - 1], [lerp(x0, x1, 0.5), lerp(y0, y1, 0.5) + w], [x0, y0 + w]];
    const armD = `${smooth(top)}L${f(x1 - side * 4)} ${f(y1)}${smooth(bot).replace(/^M/, 'L')}Z`;
    solid(armD, a.bare === false ? a.sleeve : skin, 'ink-soft');
    if (a.bare !== false) {
      emit(path('ink-faint', smooth([[lerp(x0, x1, 0.15), lerp(y0, y1, 0.15) + w * 0.6], [lerp(x0, x1, 0.6), lerp(y0, y1, 0.6) + w * 0.7]])));
      shade([[x0, y0 + w * 0.2], [lerp(x0, x1, 0.5), lerp(y0, y1, 0.5) + w * 0.3], [x1, y1 + w * 0.4], [x1, y1 + w], [x0, y0 + w]], { angle: 10, sp: 1.7 });
    }
    // poing (doigts repliés)
    const fx = x1 - side * 3;
    const fd = smooth([[fx + side * 2, y1 - w + 0.5], [fx - side * 6, y1 - w + 1.5], [fx - side * 9, y1 - 1], [fx - side * 8, y1 + w - 1], [fx + side * 2, y1 + w]], true);
    solid(fd, skin, 'ink-soft');
    let kn = '';
    for (let q = 1; q < 4; q++) kn += `M${f(fx - side * 8.6)} ${f(y1 - w + 1.5 + q * ((2 * w - 2) / 4))}l${f(side * 4.5)} 0`;
    emit(path('ink-faint', kn));
    // manche relevée ou manchette
    if (a.sleeve) {
      const sx = lerp(x0, x1, a.cuffAt ?? 0.42);
      const sy = lerp(y0, y1, a.cuffAt ?? 0.42);
      const sd = smooth([[x0, y0 - w - 2.5, 1], [sx, sy - w - 2.4], [sx + side * 1.5, sy], [sx, sy + w + 2.2], [x0, y0 + w + 2.5, 1]], true);
      solid(sd, a.sleeve, 'ink');
      if (a.sleeveDark) emit(path('hatch-dense', sd));
      if (a.rolled) {
        const rd = smooth([[sx + side * 4, sy - w - 2.6], [sx - side * 0.5, sy - w - 2.2], [sx - side * 1.5, sy], [sx - side * 0.5, sy + w + 2.2], [sx + side * 4, sy + w + 2.5]], true);
        solid(rd, a.sleeve, 'ink');
        emit(path('ink-faint', `M${f(sx + side * 1.5)} ${f(sy - w)}l0 ${f(2 * w)}`));
      }
    }
    if (a.tattoo) {
      const tx = lerp(x0, x1, 0.62);
      const ty = lerp(y0, y1, 0.62);
      // goéland : deux ailes en accolade
      emit(path('ink-soft', `M${f(tx - 5.5)} ${f(ty - 0.5)}q2.6 -3.4 5.5 0.6q2.9 -4 5.5 -0.6M${f(tx - 3.5)} ${f(ty + 2.6)}q1.6 -1.6 3.5 0.2q1.9 -1.8 3.5 -0.2`, { 'stroke-width': 0.8 }));
      emit(path('wash-indigo', ell(tx, ty + 0.6, 4.5, 1.6)));
    }
  }

  const body = out.join('');
  return { defs: defs.join(''), body: s.flip ? `<g transform="matrix(-1 0 0 1 160 0)">${body}</g>` : body };
}

const DEFAULT_MECHE = {
  zone: [[0.34, -0.75], [0.52, -0.745], [0.7, -0.7], [0.86, -0.86], [1.0, -1.02], [1.1, -1.12], [0.92, -1.16], [0.72, -1.12], [0.52, -1.0]],
  a: [[0.38, -0.75], [0.55, -0.96], [0.84, -1.12]],
  b: [[0.68, -0.71], [0.88, -0.9], [1.06, -1.1]],
};

/* ───────────────────────── Chevelures ─────────────────────────
 * Chaque style : back (derrière la tête), front (calotte et mèches), mecheZone, coversEar.
 * Coordonnées (u, v) du repère du visage.
 */

const SKULL = [
  [-0.72, -0.48],
  [-0.64, -0.86],
  [-0.26, -1.13],
  [0.4, -1.25],
  [1.06, -1.14],
  [1.53, -0.8],
  [1.75, -0.3],
  [1.72, 0.18],
  [1.5, 0.52],
];
function vol(pts, v, cx = 0.45, cy = -0.35) {
  return pts.map(([u, w, c]) => [cx + (u - cx) * (1 + v), cy + (w - cy) * (1 + v * 0.8), c]);
}
const HAIRLINE = [
  [-0.7, -0.46],
  [-0.52, -0.66],
  [-0.05, -0.76],
  [0.45, -0.74],
  [0.9, -0.63],
  [1.08, -0.4],
  [1.12, -0.1],
  [1.16, 0.12],
  [1.32, 0.3],
];

function cap(h, line, outer, cls, { strandsN = 0, guides = null, shadeZone = null, lineCls = 'ink', k = 1, jit = 0.35 } = {}) {
  const { U, emit, path, solid, r } = h;
  const d = smooth(U([...line, ...outer.slice().reverse()]), true, k);
  solid(d, cls ?? h.hairCls, null);
  if (shadeZone) h.shade(U(shadeZone), { angle: 35, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
  if (guides && strandsN) emit(path('ink-soft', strands(guides.map(U), strandsN, r, { jit }), { 'stroke-width': 0.5 }));
  emit(path(lineCls === 'ink' ? 'ink-soft' : lineCls, smooth(U(outer), false, k), { 'stroke-width': 0.8 }), path('ink-faint', smooth(U(line), false, k)));
  return d;
}

/** Reflet de chevelure : fines lames de gouache le long d'un arc (A, B, C). */
function sheen(h, pts) {
  const [A, B, C] = h.U(pts);
  let d = '';
  for (const k of [-1, 0, 1]) {
    const o = k * 1.6;
    const w = k === 0 ? 0.75 : 0.45;
    d += `M${f(A[0])} ${f(A[1] + o)}Q${f(B[0])} ${f(B[1] + o - w * 2)} ${f(C[0])} ${f(C[1] + o)}Q${f(B[0])} ${f(B[1] + o + w * 2)} ${f(A[0])} ${f(A[1] + o)}Z`;
  }
  h.emit(h.path('rehaut', d));
}

/** Boucles : contour festonné et petites crosses gravées dans une zone. */
function curls(h, zone, { n = 40, size = 2.2, cls } = {}) {
  const { U, emit, path, r } = h;
  const z = U(zone);
  const bb = bbox(z);
  let d = '';
  let placed = 0;
  for (let q = 0; q < 900 && placed < n; q++) {
    const p = [r.range(bb.x0, bb.x1), r.range(bb.y0, bb.y1)];
    if (!inside(p, z)) continue;
    const s = size * r.range(0.75, 1.2);
    const a = r.range(0, Math.PI * 2);
    const x1 = p[0] + Math.cos(a) * s;
    const y1 = p[1] + Math.sin(a) * s;
    d += `M${f(p[0])} ${f(p[1])}Q${f(p[0] + Math.cos(a + 1.6) * s)} ${f(p[1] + Math.sin(a + 1.6) * s)} ${f(x1)} ${f(y1)}q${f(-Math.cos(a) * s * 0.4)} ${f(-Math.sin(a) * s * 0.6)} ${f(-Math.cos(a + 0.8) * s * 0.5)} ${f(-Math.sin(a + 0.8) * s * 0.5)}`;
    placed++;
  }
  emit(path(cls ?? 'ink-soft', d, { 'stroke-width': 0.55 }));
}

/** Contour festonné (boucles) autour d'une suite de points. */
function scallop(pts, amp, r) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const L = Math.hypot(nx, ny) || 1;
    out.push([x0, y0]);
    const a = amp * r.range(0.6, 1.2);
    out.push([(x0 + x1) / 2 + (nx / L) * a, (y0 + y1) / 2 + (ny / L) * a]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Tresse : maillons obliques alternés (épi) le long d'un chemin. */
function braid(h, pathUV, width, cls) {
  const { U, emit, path } = h;
  const pts = U(pathUV);
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t < 1; t += 0.05) dense.push(lerpPt(pts[i], pts[i + 1], t));
  dense.push(pts[pts.length - 1]);
  const L = [0];
  for (let i = 1; i < dense.length; i++) L.push(L[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const at = (s0) => {
    let i = 1;
    while (i < L.length - 1 && L[i] < s0) i++;
    const t = (s0 - L[i - 1]) / (L[i] - L[i - 1] || 1);
    const p = lerpPt(dense[i - 1], dense[i], t);
    const dx = dense[i][0] - dense[i - 1][0];
    const dy = dense[i][1] - dense[i - 1][1];
    const n = Math.hypot(dx, dy) || 1;
    return [p[0], p[1], dx / n, dy / n];
  };
  const step = width * 0.46;
  let fills = '';
  let lines = '';
  let shades = '';
  for (let s0 = step * 0.5, k = 0; s0 < L[L.length - 1] - step * 0.3; s0 += step, k++) {
    const [x, y, tx, ty] = at(s0);
    const side = k % 2 ? 1 : -1;
    const nx = -ty;
    const ny = tx;
    // maillon : ovale incliné, décalé d'un côté de l'axe
    const cx = x + nx * side * width * 0.2;
    const cy = y + ny * side * width * 0.2;
    const ang = Math.atan2(ty, tx) + side * 0.75;
    const ax = Math.cos(ang);
    const ay = Math.sin(ang);
    const bx = -ay;
    const by = ax;
    const la = width * 0.6;
    const lb = width * 0.42;
    const p = (u, v) => [cx + ax * u * la + bx * v * lb, cy + ay * u * la + by * v * lb];
    const oval = smooth([p(-1, 0), p(-0.4, -1), p(0.5, -0.85), p(1, 0), p(0.4, 0.95), p(-0.5, 0.85)], true);
    fills += oval;
    lines += oval;
    lines += smooth([p(-0.6, -0.1), p(0, -0.3), p(0.6, -0.15)]) + smooth([p(-0.5, 0.25), p(0.1, 0.15), p(0.65, 0.3)]);
    shades += smooth([p(-1, 0), p(-0.2, 0.5), p(0.4, 0.95), p(1, 0), p(0.4, 0.55)], true);
  }
  // corps de la tresse
  const nrm = (i) => {
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(dense.length - 1, i + 1)];
    const n = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / n, (b[0] - a[0]) / n];
  };
  const top = dense.map((p, i) => [p[0] + nrm(i)[0] * width * 0.5, p[1] + nrm(i)[1] * width * 0.5]);
  const bot = dense.map((p, i) => [p[0] - nrm(i)[0] * width * 0.5, p[1] - nrm(i)[1] * width * 0.5]);
  const band = `${smooth(top)}${smooth(bot.slice().reverse()).replace(/^M/, 'L')}Z`;
  emit(path('paper', band), path(cls, band), path('ombre', band));
  emit(path('paper', fills), path(cls, fills), path('ombre', shades));
  emit(path('ink-soft', lines, { 'stroke-width': 0.6 }));
}

const HAIR = {
  /** Cheveux courts peignés en arrière (hommes). */
  short: {
    front(h) {
      const v = h.s.hairOpt.vol ?? 0.03;
      const hl = h.s.hairOpt.receding ? RECEDING : HAIRLINE;
      cap(h, hl, vol(SKULL, v), null, {
        strandsN: 16,
        guides: [
          [[-0.68, -0.48], [-0.5, -0.9], [0.05, -1.15], [0.7, -1.2], [1.3, -1.0]],
          [hl[2], [0.2, -0.98], [0.75, -1.12], [1.3, -0.95], [1.62, -0.6]],
          [hl[4], [1.1, -0.66], [1.38, -0.58], [1.62, -0.36], [1.7, -0.05]],
          [hl[6], [1.22, -0.12], [1.42, 0.0], [1.56, 0.18], [1.5, 0.45]],
        ],
        shadeZone: [[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]],
      });
      if (h.s.hairOpt.shine) sheen(h, [[0.1, -1.0], [0.6, -1.12], [1.0, -1.04]]);
      if (h.s.hairOpt.grayTemples) {
        const d = smooth(h.U([[0.95, -0.62], [1.1, -0.38], [1.14, 0.0], [1.3, 0.25], [1.5, 0.3], [1.55, -0.2], [1.3, -0.6]]), true);
        h.emit(h.path('hair-gris', d), h.path('rehaut', d));
        h.emit(h.path('ink-soft', strands([h.U([[1.0, -0.6], [1.3, -0.5], [1.55, -0.25]]), h.U([[1.16, 0.05], [1.35, 0.15], [1.5, 0.2]])], 5, h.r), { 'stroke-width': 0.5 }));
      }
    },
  },
  /** Raie au milieu, cheveux plaqués. */
  middlePart: {
    front(h) {
      const hl = [[-0.7, -0.46], [-0.48, -0.7], [-0.05, -0.8], [0.15, -0.84, 1], [0.5, -0.78], [0.92, -0.64], [1.08, -0.4], [1.12, -0.1], [1.16, 0.12], [1.32, 0.3]];
      cap(h, hl, vol(SKULL, 0.02), null, {
        strandsN: 0,
      });
      h.emit(h.path('ink-soft', strands([h.U([[0.12, -0.86], [-0.2, -0.82], [-0.5, -0.7], [-0.7, -0.5]]), h.U([[0.45, -1.24], [-0.15, -1.14], [-0.55, -0.88], [-0.72, -0.5]])], 6, h.r, { jit: 0.2 }), { 'stroke-width': 0.5 }));
      h.emit(h.path('ink-soft', strands([h.U([[0.18, -0.85], [0.6, -0.8], [0.98, -0.62], [1.14, -0.3]]), h.U([[0.45, -1.24], [1.1, -1.12], [1.55, -0.8], [1.72, -0.3]])], 10, h.r, { jit: 0.2 }), { 'stroke-width': 0.5 }));
      h.emit(h.path('ink', smooth(h.U([[0.15, -0.84], [0.28, -1.05], [0.42, -1.24]])), { 'stroke-width': 0.7 }));
      h.shade(h.U([[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]]), { angle: 35, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
    },
  },
  /** Raie sur le côté (fuyant), cheveux rabattus vers l'arrière. */
  sidePart: {
    front(h) {
      const o = h.s.hairOpt;
      const hl = [[-0.7, -0.46], [-0.52, -0.68], [-0.3, -0.8, 1], [0.1, -0.8], [0.55, -0.76], [0.92, -0.63], [1.08, -0.4], [1.12, -0.1], [1.16, 0.12], [1.32, 0.3]];
      cap(h, hl, vol(SKULL, o.vol ?? 0.05), null, {
        strandsN: 14,
        guides: [
          [[-0.28, -0.82], [0.05, -0.98], [0.5, -1.12], [1.0, -1.1], [1.45, -0.85]],
          [[0.1, -0.8], [0.45, -0.88], [0.95, -0.9], [1.4, -0.72], [1.7, -0.35]],
          [[0.9, -0.63], [1.1, -0.55], [1.35, -0.4], [1.55, -0.15], [1.6, 0.2]],
        ],
        shadeZone: [[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]],
      });
      h.emit(h.path('ink-soft', strands([h.U([[-0.3, -0.84], [-0.5, -0.74], [-0.7, -0.5]]), h.U([[-0.15, -1.15], [-0.6, -0.92], [-0.75, -0.5]])], 4, h.r, { jit: 0.2 }), { 'stroke-width': 0.5 }));
      h.emit(h.path('ink', smooth(h.U([[-0.3, -0.82], [-0.12, -1.0], [0.1, -1.17]])), { 'stroke-width': 0.7 }));
      if (o.shine === true) sheen(h, [[0.2, -0.95], [0.7, -1.02], [1.15, -0.88]]);
      if (o.grayTemples) {
        const d = smooth(h.U([[0.92, -0.6], [1.1, -0.38], [1.14, 0.0], [1.3, 0.25], [1.52, 0.3], [1.6, -0.2], [1.3, -0.62]]), true);
        h.emit(h.path('paper', d), h.path('hair-gris', d));
        h.emit(h.path('ink-soft', strands([h.U([[0.98, -0.6], [1.3, -0.52], [1.58, -0.25]]), h.U([[1.16, 0.08], [1.35, 0.18], [1.52, 0.22]])], 5, h.r), { 'stroke-width': 0.5 }));
        h.emit(h.path('ink-soft', d, { 'stroke-width': 0.5 }));
      }
      if (o.forelock) {
        // mèche tombant sur l'œil droit (œil fuyant)
        const d = smooth(h.U([[-0.28, -0.82], [-0.1, -0.78], [-0.2, -0.5], [-0.34, -0.22], [-0.46, -0.05], [-0.56, -0.12], [-0.5, -0.4], [-0.45, -0.66]]), true);
        h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.8 });
        h.emit(h.path('ink-soft', strands([h.U([[-0.25, -0.8], [-0.3, -0.5], [-0.48, -0.1]]), h.U([[-0.42, -0.72], [-0.48, -0.45], [-0.54, -0.12]])], 5, h.r, { jit: 0.15 }), { 'stroke-width': 0.5 }));
      }
    },
  },
  /** Bandeaux à raie médiane couvrant les oreilles, chignon bas (années 1880). */
  bandeaux: {
    coversEar: true,
    back(h) {
      const d = smooth(h.U([[1.35, -0.2], [1.75, -0.3], [2.0, 0.0], [1.98, 0.38], [1.7, 0.6], [1.38, 0.5]]), true);
      h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.9 });
      h.emit(h.path('ink-soft', `${smooth(h.U([[1.5, -0.18], [1.85, -0.1], [1.92, 0.25], [1.62, 0.42]]))}${smooth(h.U([[1.55, 0.0], [1.78, 0.12], [1.7, 0.36]]))}`, { 'stroke-width': 0.55 }));
      h.shade(h.U([[1.6, 0.2], [2.0, 0.0], [1.98, 0.38], [1.7, 0.6], [1.45, 0.5]]), { angle: 30, sp: 1.4, cls: 'ink-soft', sw: 0.5 });
    },
    front(h) {
      const outer = vol(SKULL, 0.06);
      const line = [[-0.74, -0.2], [-0.62, -0.5], [-0.3, -0.72], [0.1, -0.78, 1], [0.5, -0.72], [0.88, -0.56], [1.1, -0.26], [1.2, 0.1], [1.42, 0.32], [1.52, 0.52]];
      cap(h, line, outer, null);
      // ondulation des bandeaux : du sommet (raie) vers les tempes
      const sL = strands([h.U([[0.08, -0.8], [-0.3, -0.76], [-0.62, -0.5], [-0.74, -0.2]]), h.U([[0.38, -1.27], [-0.25, -1.16], [-0.66, -0.9], [-0.78, -0.45]])], 5, h.r, { jit: 0.2 });
      const sR = strands([h.U([[0.14, -0.8], [0.55, -0.74], [0.95, -0.52], [1.2, -0.05], [1.42, 0.3]]), h.U([[0.42, -1.28], [1.1, -1.18], [1.58, -0.82], [1.8, -0.3], [1.72, 0.2]])], 11, h.r, { jit: 0.2 });
      h.emit(h.path('ink-soft', sL + sR, { 'stroke-width': 0.5 }));
      h.emit(h.path('ink', smooth(h.U([[0.1, -0.8], [0.25, -1.05], [0.4, -1.27]])), { 'stroke-width': 0.6 }));
      h.shade(h.U([[1.0, -0.9], [1.58, -0.82], [1.8, -0.3], [1.72, 0.2], [1.45, 0.4], [1.2, 0.0]]), { angle: 40, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
    },
    mecheZone: {
      zone: [[0.16, -0.79], [0.45, -0.75], [0.75, -0.62], [0.95, -0.42], [1.04, -0.52], [0.92, -0.72], [0.62, -0.9], [0.3, -0.99]],
      a: [[0.18, -0.8], [0.5, -0.76], [0.96, -0.45]],
      b: [[0.3, -0.96], [0.62, -0.87], [1.0, -0.56]],
    },
  },
  /** Couronne de tresses (Ostrie). */
  crownBraids: {
    front(h) {
      const o = h.s.hairOpt;
      const tight = o.tight ? -0.04 : 0.02;
      cap(h, HAIRLINE.slice(0, 7).concat([[1.18, 0.1], [1.34, 0.3]]), vol(SKULL, tight), null, {
        strandsN: 14,
        guides: [
          [[-0.68, -0.48], [-0.6, -0.8], [-0.3, -1.05]],
          [[0.0, -0.76], [0.12, -0.95], [0.2, -1.12]],
          [[0.88, -0.63], [1.0, -0.86], [1.05, -1.0]],
          [[1.14, -0.1], [1.4, -0.4], [1.5, -0.7]],
        ],
        jit: 0.2,
      });
      const lift = o.tight ? 0 : 0.05;
      const path0 = [[-0.66, -0.78], [-0.4, -1.04 - lift], [0.1, -1.2 - lift], [0.65, -1.22 - lift], [1.15, -1.08 - lift], [1.55, -0.78], [1.72, -0.4]];
      braid(h, path0, (o.tight ? 7.5 : 9) * (h.W / 28.8), h.hairCls);
      if (o.ribbon) {
        const rp = h.U([[-0.62, -0.68], [-0.35, -0.94], [0.1, -1.08], [0.65, -1.1], [1.15, -0.96], [1.58, -0.66]]);
        h.emit(h.path(o.ribbon, smooth(rp.map(([x, y]) => [x, y - 1.2]).concat(rp.slice().reverse().map(([x, y]) => [x, y + 1.2])), true)));
        let zz = '';
        const dense = [];
        for (let i = 0; i < rp.length - 1; i++) for (let t = 0; t < 1; t += 0.25) dense.push(lerpPt(rp[i], rp[i + 1], t));
        dense.forEach(([x, y], i) => (zz += `${i ? 'L' : 'M'}${f(x)} ${f(y + (i % 2 ? 1 : -1))}`));
        h.emit(h.path('rehaut', smooth(rp.map(([x, y]) => [x, y - 0.4]).concat(rp.slice().reverse().map(([x, y]) => [x, y + 0.4])), true)));
        h.emit(h.path('ink-soft', zz, { 'stroke-width': 0.5 }));
      }
    },
  },
  /** Chignon lâche bouclé. */
  curlyBun: {
    back(h) {
      const z = [[0.9, -1.05], [1.3, -1.4], [1.85, -1.25], [2.05, -0.8], [1.85, -0.4], [1.4, -0.5]];
      const d = smooth(scallop(h.U(z.concat([z[0]])), 1.6, h.r), true);
      h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.8 });
      curls(h, z, { n: 14, size: 2.4 });
    },
    front(h) {
      const outer = vol(SKULL, 0.1);
      const hl = [[-0.74, -0.38], [-0.6, -0.62], [-0.2, -0.74], [0.3, -0.72], [0.8, -0.62], [1.06, -0.36], [1.12, -0.08], [1.2, 0.1], [1.35, 0.3]];
      const z = h.U([...hl, ...outer.slice().reverse()]);
      const d = smooth(scallop(z.concat([z[0]]), 1.4, h.r), true);
      h.solid(d, h.hairCls, null);
      h.shade(h.U([[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]]), { angle: 35, sp: 1.5, cls: 'ink-soft', sw: 0.5, ombre: true });
      curls(h, [...hl, ...outer.slice().reverse()], { n: 34, size: 2.3 });
      h.emit(h.path('ink-soft', d, { 'stroke-width': 0.75 }));
      // mèches folles sur la tempe
      h.emit(h.path('ink-soft', `${smooth(h.U([[-0.62, -0.55], [-0.75, -0.35], [-0.68, -0.18]]))}${smooth(h.U([[1.1, -0.1], [1.06, 0.12], [1.12, 0.3]]))}`, { 'stroke-width': 0.6 }));
    },
  },
  /** Carré (raide, au menton, ou court). */
  bob: {
    back(h) {
      const o = h.s.hairOpt;
      const len = o.len ?? 0.95;
      const d = smooth(h.U([[1.2, -0.2], [1.75, -0.25], [1.82, 0.2], [1.7, len - 0.05], [1.3, len + 0.05], [1.05, len - 0.12], [1.12, 0.3]]), true);
      h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.8 });
      h.shade(h.U([[1.2, -0.2], [1.82, 0.2], [1.7, len], [1.3, len + 0.05], [1.05, len - 0.12]]), { angle: 80, sp: 1.3, cls: 'ink-soft', sw: 0.5, ombre: true });
    },
    coversEar: true,
    front(h) {
      const o = h.s.hairOpt;
      const len = o.len ?? 0.95;
      const curl = o.curlEnds ? 0.06 : 0;
      const outer = vol(SKULL, o.vol ?? 0.07);
      const near = [[0.9, -0.66], [1.06, -0.4], [1.04, 0.0], [1.02, len - 0.25], [1.02 - curl, len - 0.02], [1.25, len + 0.06], [1.55, len - 0.02], [1.78, len - 0.2], [1.8, 0.2]];
      const fringe = o.fringe
        ? [[-0.78, -0.2], [-0.66, -0.4], [-0.35, -0.48], [0.2, -0.5], [0.6, -0.52], [0.9, -0.5]]
        : [[-0.78, -0.2], [-0.7, -0.5], [-0.4, -0.76, 1], [0.1, -0.74], [0.6, -0.7], [0.9, -0.62]];
      const farLock = [[-0.78, len - 0.35], [-0.86 + curl, len - 0.1], [-0.68, len - 0.12], [-0.64, 0.2], [-0.72, -0.15]];
      const pts = h.U([...farLock.slice(0, 3), ...fringe.slice(1), ...near.slice(1), ...outer.slice(2, 7).reverse(), [-0.82, -0.6], [-0.86, 0.0]]);
      const d = smooth(pts, true);
      h.solid(d, h.hairCls, null);
      h.shade(h.U([[1.06, -0.4], [1.5, -0.6], [1.8, 0.2], [1.7, len], [1.25, len + 0.06], [1.02, len - 0.1]]), { angle: 82, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
      const g = o.fringe
        ? [h.U([[-0.7, -0.5], [-0.5, -0.9], [-0.1, -1.2]]), h.U([[0.2, -0.5], [0.3, -0.85], [0.4, -1.25]]), h.U([[0.9, -0.5], [1.1, -0.85], [1.1, -1.12]])]
        : [h.U([[-0.4, -0.78], [-0.1, -1.0], [0.2, -1.2]]), h.U([[0.6, -0.72], [0.8, -0.95], [0.95, -1.13]])];
      h.emit(h.path('ink-soft', strands(g, o.fringe ? 16 : 14, h.r, { jit: 0.2 }), { 'stroke-width': 0.5 }));
      // retombées verticales
      h.emit(
        h.path(
          'ink-soft',
          strands([h.U([[1.0, -0.62], [1.08, -0.1], [1.04, len - 0.05]]), h.U([[1.45, -0.85], [1.75, -0.1], [1.6, len]])], 15, h.r, { jit: 0.2 }) +
            strands([h.U([[-0.55, -0.75], [-0.72, -0.2], [-0.74, len - 0.15]]), h.U([[-0.75, -0.62], [-0.84, -0.1], [-0.82, len - 0.12]])], 5, h.r, { jit: 0.15 }),
          { 'stroke-width': 0.5 },
        ),
      );
      if (o.wave) {
        let wd = '';
        for (let q = 0; q < 4; q++) {
          const v0 = -0.9 + q * 0.32;
          wd += smooth(h.U([[0.2 - q * 0.1, v0], [0.6, v0 + 0.08], [1.0, v0 - 0.04], [1.4, v0 + 0.08], [1.7, v0 + 0.02]]));
        }
        h.emit(h.path('ink-soft', wd, { 'stroke-width': 0.8 }));
        sheen(h, [[0.5, -0.92], [1.0, -0.98], [1.4, -0.82]]);
        sheen(h, [[0.6, -0.6], [1.1, -0.66], [1.5, -0.5]]);
      } else if (o.shine === true) sheen(h, [[0.25, -0.98], [0.7, -1.08], [1.15, -0.95]]);
      if (o.kissCurl) h.emit(h.path('ink', `${smooth(h.U([[-0.6, -0.46], [-0.66, -0.3], [-0.56, -0.24], [-0.54, -0.34]]))}`, { 'stroke-width': 0.9 }));
      h.emit(h.path('ink-soft', d, { 'stroke-width': 0.75 }));
    },
    mecheZone: {
      zone: [[0.3, -0.75], [0.5, -0.745], [0.66, -0.71], [0.8, -0.86], [0.98, -1.04], [1.12, -1.16], [0.92, -1.12], [0.7, -1.0], [0.5, -0.92]],
      a: [[0.34, -0.75], [0.56, -0.92], [0.9, -1.1]],
      b: [[0.64, -0.71], [0.84, -0.9], [1.08, -1.14]],
    },
  },
  /** Bouclés courts (front libre ou dégarni aux tempes). */
  curly: {
    front(h) {
      const o = h.s.hairOpt;
      const outer = vol(SKULL, o.vol ?? 0.1);
      const hl = o.receding
        ? [[-0.7, -0.5], [-0.62, -0.84], [-0.28, -0.9], [0.1, -0.86], [0.42, -0.94], [0.8, -0.88], [1.05, -0.56], [1.14, -0.15], [1.2, 0.1], [1.36, 0.3]]
        : [[-0.76, -0.4], [-0.62, -0.66], [-0.2, -0.78], [0.3, -0.76], [0.8, -0.66], [1.06, -0.4], [1.12, -0.08], [1.2, (o.len ?? 0.1)], [1.4, (o.len ?? 0.1) + 0.2]];
      const z = h.U([...hl, ...outer.slice().reverse()]);
      const d = smooth(scallop(z.concat([z[0]]), 1.5, h.r), true);
      h.solid(d, h.hairCls, null);
      h.shade(h.U([[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]]), { angle: 35, sp: 1.5, cls: 'ink-soft', sw: 0.5, ombre: true });
      curls(h, [...hl, ...outer.slice().reverse()], { n: o.n ?? 42, size: o.size ?? 2.2 });
      if (o.highlight === true) sheen(h, [[0.2, -1.02], [0.65, -1.14], [1.05, -1.0]]);
      h.emit(h.path('ink-soft', d, { 'stroke-width': 0.75 }));
    },
  },
  /** Mi-longs bouclés (sous un bandeau). */
  curlyLong: {
    coversEar: true,
    back(h) {
      const len = h.s.hairOpt.len ?? 0.85;
      const z = [[1.1, -0.4], [1.8, -0.5], [2.0, 0.1], [1.85, len], [1.4, len + 0.12], [1.1, len - 0.05], [1.12, 0.2]];
      const d = smooth(scallop(h.U(z.concat([z[0]])), 1.6, h.r), true);
      h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.8 });
      h.shade(h.U(z), { angle: 70, sp: 1.4, cls: 'ink-soft', sw: 0.5, ombre: true });
      curls(h, z, { n: 22, size: 2.4 });
    },
    front(h) {
      const len = h.s.hairOpt.len ?? 0.85;
      const outer = vol(SKULL, 0.14);
      const hl = [[-0.84, 0.3], [-0.7, 0.0], [-0.74, -0.4], [-0.55, -0.68], [-0.1, -0.78], [0.4, -0.76], [0.85, -0.66], [1.06, -0.4], [1.04, 0.0], [1.06, len - 0.1], [1.35, len + 0.05]];
      const z = h.U([...hl, ...outer.slice(0, 8).reverse(), [-0.9, -0.3]]);
      const d = smooth(scallop(z.concat([z[0]]), 1.5, h.r), true);
      h.solid(d, h.hairCls, null);
      curls(h, [...hl, ...outer.slice(0, 8).reverse(), [-0.9, -0.3]], { n: 46, size: 2.3 });
      h.shade(h.U([[1.06, -0.4], [1.6, -0.6], [1.85, 0.0], [1.6, len], [1.06, len]]), { angle: 70, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
      h.emit(h.path('ink-soft', d, { 'stroke-width': 0.75 }));
    },
  },
  /** Coque (années 1950) : volume relevé sur le dessus, rouleau à l'arrière. */
  coque: {
    back(h) {
      const d = smooth(h.U([[1.2, -0.7], [1.7, -0.9], [2.0, -0.45], [1.95, 0.05], [1.6, 0.3], [1.25, 0.1]]), true);
      h.solid(d, h.hairCls, 'ink', { 'stroke-width': 0.8 });
      h.emit(h.path('ink-soft', strands([h.U([[1.3, -0.65], [1.75, -0.7], [1.9, -0.3], [1.7, 0.1]]), h.U([[1.3, -0.3], [1.6, -0.35], [1.7, -0.05], [1.5, 0.2]])], 6, h.r, { jit: 0.2 }), { 'stroke-width': 0.5 }));
    },
    front(h) {
      const hl = [[-0.72, -0.44], [-0.55, -0.66], [-0.1, -0.76], [0.4, -0.74], [0.88, -0.63], [1.06, -0.4], [1.1, -0.1], [1.18, 0.1], [1.34, 0.3]];
      const outer = [[-0.8, -0.5], [-0.85, -0.95], [-0.5, -1.38], [0.2, -1.5], [0.9, -1.42], [1.45, -1.12], [1.78, -0.6], [1.75, 0.0], [1.52, 0.5]];
      cap(h, hl, outer, null, {
        strandsN: 16,
        guides: [
          [[-0.7, -0.46], [-0.82, -0.85], [-0.55, -1.3], [0.1, -1.45]],
          [[0.1, -0.76], [0.0, -1.0], [0.25, -1.3], [0.8, -1.4]],
          [[0.88, -0.63], [1.0, -0.9], [1.3, -1.1], [1.6, -0.9]],
          [[1.12, -0.05], [1.4, -0.3], [1.65, -0.5], [1.75, -0.4]],
        ],
        jit: 0.2,
      });
      h.emit(h.path('ink-soft', smooth(h.U([[-0.75, -0.7], [-0.4, -1.05], [0.3, -1.12], [0.9, -1.0]])), { 'stroke-width': 0.7 }));
    },
  },
  /** Ras (très court). */
  cropped: {
    front(h) {
      const o = h.s.hairOpt;
      const hl = o.fringe
        ? [[-0.72, -0.42], [-0.6, -0.56], [-0.2, -0.62], [0.3, -0.62], [0.75, -0.56], [1.02, -0.4], [1.1, -0.1], [1.16, 0.1], [1.32, 0.3]]
        : HAIRLINE;
      const outer = vol(SKULL, o.vol ?? -0.01);
      const zz = h.U([...hl, ...outer.slice().reverse()]);
      const d = smooth(scallop(zz.concat([zz[0]]), 0.7, h.r), true);
      h.solid(d, h.hairCls, null);
      // poils courts : stipple + petits traits
      h.emit(h.path('stipple', d));
      let tk = '';
      const z = h.U([...hl, ...outer.slice().reverse()]);
      const bb = bbox(z);
      const [qx, qy] = h.P(0.1, -0.2);
      for (let q = 0, n = 0; q < 2000 && n < 220; q++) {
        const p = [h.r.range(bb.x0, bb.x1), h.r.range(bb.y0, bb.y1)];
        if (!inside(p, z)) continue;
        const a = Math.atan2(p[1] - qy, p[0] - qx) + h.r.jit(0.3);
        const L = h.r.range(1.4, 2.6);
        tk += `M${f(p[0])} ${f(p[1])}l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`;
        n++;
      }
      h.emit(h.path('ink-soft', tk, { 'stroke-width': 0.5 }));
      h.shade(h.U([[1.1, -0.6], [1.5, -0.8], [1.75, -0.3], [1.72, 0.18], [1.5, 0.52], [1.3, 0.3], [1.2, -0.2]]), { angle: 35, sp: 1.6, cls: 'ink-soft', sw: 0.5, ombre: true });
      h.emit(h.path('ink-soft', d, { 'stroke-width': 0.75 }));
    },
  },
  /** Rien de visible (coiffe couvrante). */
  none: {},
};

const RECEDING = [
  [-0.7, -0.52],
  [-0.58, -0.84],
  [-0.2, -0.98],
  [0.22, -0.9],
  [0.62, -1.0],
  [0.98, -0.76],
  [1.1, -0.42],
  [1.14, -0.1],
  [1.18, 0.12],
  [1.32, 0.3],
];

/* ───────────────────────── Barbes et moustaches ───────────────────────── */

function hairMass(h, top, bot, n, { line = 'ink', jit = 0.3, bulge = 0.6, cls } = {}) {
  const { U, emit, path, solid, r } = h;
  const T = U(top);
  const B = U(bot);
  const d = `${smooth(T)}${smooth(B.slice().reverse()).replace(/^M/, 'L')}Z`;
  solid(d, cls ?? h.hairCls, null);
  let sd = '';
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const a = sampleAt(T, t);
    const b = sampleAt(B, t);
    const m = lerpPt(a, b, 0.55);
    sd += `M${f(a[0] + r.jit(jit))} ${f(a[1])}Q${f(m[0] + bulge * (t - 0.5) * 6)} ${f(m[1])} ${f(b[0] + r.jit(jit))} ${f(b[1] + r.jit(jit))}`;
  }
  emit(path('ink-soft', sd, { 'stroke-width': 0.5 }));
  if (line) emit(path(line, d, { 'stroke-width': 0.8 }));
  return d;
}
function sampleAt(pts, t) {
  const n = pts.length - 1;
  const g = Math.min(n - 1, Math.floor(t * n));
  return lerpPt(pts[g], pts[g + 1], t * n - g);
}

const BEARD = {
  full(h, o) {
    const g = o.grow ?? 1;
    const top = [[-0.74, 0.3], [-0.55, 0.52], [-0.3, 0.62], [0.05, 0.84], [0.45, 0.62], [0.8, 0.5], [1.05, 0.3], [1.14, 0.0]];
    const bot = [[-0.76, 0.5], [-0.62, 0.92 * g], [-0.3, 1.18 * g], [0.15, 1.28 * g], [0.6, 1.16 * g], [1.0, 0.9 * g], [1.24, 0.55], [1.22, 0.05]];
    hairMass(h, top, bot, 26, { bulge: 0.4 });
    h.shade(h.U([[-0.76, 0.5], [-0.62, 0.92 * g], [-0.3, 1.18 * g], [0.15, 1.28 * g], [0.0, 1.0], [-0.4, 0.75]]), { angle: 70, sp: 1.3, cls: 'ink-soft', sw: 0.5 });
  },
  short(h, o) {
    const top = [[-0.72, 0.36], [-0.5, 0.56], [-0.28, 0.66], [0.05, 0.82], [0.45, 0.66], [0.8, 0.5], [1.05, 0.3], [1.14, 0.02]];
    const bot = [[-0.72, 0.5], [-0.5, 0.86], [-0.2, 1.06], [0.15, 1.12], [0.5, 1.06], [0.92, 0.84], [1.2, 0.5], [1.2, 0.04]];
    hairMass(h, top, bot, 30, { bulge: 0.2, jit: 0.2 });
    h.emit(h.path('stipple', smooth(h.U([...top, ...bot.slice().reverse()]), true)));
  },
  point(h) {
    const top = [[-0.5, 0.62], [-0.3, 0.8], [0.05, 0.86], [0.4, 0.8], [0.75, 0.66], [0.98, 0.5]];
    const bot = [[-0.52, 0.66], [-0.36, 0.98], [-0.05, 1.38], [0.05, 1.42], [0.5, 1.06], [1.0, 0.56]];
    hairMass(h, top, bot, 18, { bulge: -0.5 });
    h.shade(h.U([[-0.52, 0.66], [-0.36, 0.98], [-0.05, 1.38], [0.0, 1.0], [-0.3, 0.8]]), { angle: 60, sp: 1.3, cls: 'ink-soft', sw: 0.5 });
  },
  chops(h) {
    // favoris en côtelettes : de la tempe au bas de la joue, menton et lèvre rasés
    const top = [[1.04, -0.34], [0.98, -0.02], [0.9, 0.3], [0.74, 0.58], [0.6, 0.72]];
    const bot = [[1.16, -0.3], [1.18, 0.05], [1.17, 0.4], [1.04, 0.7], [0.74, 0.86]];
    const d = hairMass(h, top, bot, 16, { bulge: 0.15, line: 'ink-soft' });
    h.emit(h.path('stipple', d));
    const ftop = [[-0.66, -0.25], [-0.64, 0.05], [-0.62, 0.3], [-0.56, 0.5]];
    const fbot = [[-0.78, -0.25], [-0.82, 0.05], [-0.8, 0.35], [-0.68, 0.62]];
    hairMass(h, ftop, fbot, 6, { bulge: 0.1, line: 'ink-soft' });
  },

};

const MOUSTACHE = {
  full(h, o, mv, nb) {
    const top = [[-0.34, mv - 0.02], [-0.18, nb + 0.06], [0.05, nb + 0.07], [0.3, nb + 0.06], [0.55, mv - 0.02]];
    const bot = [[-0.36, mv + 0.06], [-0.18, mv + 0.02], [0.05, mv + 0.03], [0.32, mv + 0.02], [0.6, mv + 0.07]];
    hairMass(h, top, bot, 18, { bulge: 0.3, cls: o.cls });
  },
  handlebar(h, o, mv, nb) {
    const top = [[-0.5, mv - 0.16], [-0.42, mv - 0.06], [-0.2, nb + 0.06], [0.05, nb + 0.06], [0.35, nb + 0.07], [0.7, mv - 0.06], [0.86, mv - 0.2]];
    const bot = [[-0.47, mv - 0.15], [-0.4, mv + 0.02], [-0.18, mv + 0.0], [0.05, mv - 0.01], [0.35, mv + 0.0], [0.74, mv + 0.02], [0.88, mv - 0.18]];
    hairMass(h, top, bot, 22, { bulge: 0.2, cls: o.cls });
    h.emit(h.path('rehaut', smooth(h.U([[0.1, nb + 0.08], [0.45, nb + 0.1], [0.65, mv - 0.06], [0.42, nb + 0.12]]), true)));
  },
  fine(h, o, mv, nb) {
    const top = [[-0.24, mv - 0.03], [-0.1, mv - 0.07], [0.05, mv - 0.065], [0.25, mv - 0.07], [0.44, mv - 0.03]];
    const bot = [[-0.24, mv - 0.015], [-0.1, mv - 0.035], [0.05, mv - 0.03], [0.25, mv - 0.035], [0.44, mv - 0.012]];
    hairMass(h, top, bot, 12, { bulge: 0, jit: 0.1, line: 'ink-soft', cls: o.cls });
  },
};

/* ───────────────────────── Coiffes ───────────────────────── */

const HATS = {
  officer(h, o) {
    const { U, emit, path, solid, shade } = h;
    const crown = smooth(U([[-0.82, -0.86], [-0.95, -1.18], [-0.5, -1.42], [0.5, -1.5], [1.4, -1.38], [1.85, -1.12], [1.62, -0.8], [0.4, -0.86]]), true);
    solid(crown, o.cls ?? 'wash-indigo', 'ink');
    emit(path('hatch-dense', crown));
    shade(U([[0.8, -1.45], [1.4, -1.38], [1.85, -1.12], [1.62, -0.8], [1.0, -0.84]]), { angle: 50, sp: 1.2, cls: 'ink-soft', sw: 0.6 });
    const band = smooth(U([[-0.78, -0.9], [0.4, -0.9], [1.62, -0.84], [1.66, -0.66], [0.4, -0.68], [-0.74, -0.7]]), true);
    solid(band, 'hair-noir', 'ink');
    emit(path('ink-faint', smooth(U([[-0.76, -0.8], [0.4, -0.79], [1.64, -0.75]]))));
    const visor = smooth(U([[-0.76, -0.72], [-1.08, -0.6], [-0.7, -0.48], [0.2, -0.5], [0.85, -0.6], [0.6, -0.7]]), true);
    solid(visor, 'hair-noir', 'ink');
    emit(path('rehaut', smooth(U([[-0.8, -0.6], [-0.3, -0.56], [0.4, -0.58], [-0.3, -0.6]]), true)));
    if (o.badge) {
      const [bx, by] = h.P(0.1, -0.98);
      solid(ell(bx, by, 4.2, 3.4), 'wash-safran', 'ink-soft');
      emit(path('ink-soft', `M${f(bx)} ${f(by - 2.4)}l0 4.6M${f(bx - 1.8)} ${f(by + 0.6)}q1.8 2.6 3.6 0M${f(bx - 1.2)} ${f(by - 1.2)}l2.4 0`, { 'stroke-width': 0.6 }));
    }
    // ombre de la visière sur le front
    shade(U([[-0.72, -0.5], [0.2, -0.5], [0.9, -0.58], [0.9, -0.46], [0.2, -0.38], [-0.7, -0.4]]), { angle: 10, sp: 1.2, ombre: true });
  },
  sailor(h, o) {
    const { U, emit, path, solid, shade } = h;
    const crown = smooth(U([[-0.78, -0.8], [-0.9, -1.12], [-0.4, -1.36], [0.5, -1.42], [1.35, -1.3], [1.8, -1.02], [1.62, -0.72], [0.4, -0.8]]), true);
    solid(crown, o.cls ?? 'wash-indigo', 'ink');
    emit(path('hatch', crown));
    emit(path('ink-faint', smooth(U([[-0.6, -1.15], [0.4, -1.28], [1.5, -1.1]]))));
    shade(U([[0.8, -1.4], [1.35, -1.3], [1.8, -1.02], [1.62, -0.72], [1.0, -0.78]]), { angle: 50, sp: 1.3, cls: 'ink-soft', sw: 0.6 });
    const band = smooth(U([[-0.76, -0.84], [0.4, -0.84], [1.62, -0.76], [1.62, -0.62], [0.4, -0.66], [-0.72, -0.66]]), true);
    solid(band, o.cls ?? 'wash-indigo', 'ink');
    emit(path('hatch-dense', band));
    const visor = smooth(U([[-0.72, -0.68], [-0.98, -0.58], [-0.6, -0.5], [0.3, -0.54], [0.75, -0.62], [0.5, -0.68]]), true);
    solid(visor, 'hair-noir', 'ink');
    emit(path('ink-soft', smooth(U([[-0.7, -0.72], [0.0, -0.74], [0.72, -0.7]])), { 'stroke-width': 0.9, 'stroke-dasharray': '1.2 0.8' }));
    shade(U([[-0.72, -0.5], [0.3, -0.52], [0.9, -0.56], [0.9, -0.46], [0.2, -0.4], [-0.7, -0.42]]), { angle: 10, sp: 1.2, ombre: true });
  },
  flatcap(h, o) {
    const { U, emit, path, solid, shade } = h;
    const d = smooth(U([[-0.8, -0.72], [-1.1, -0.78], [-0.85, -1.02], [-0.2, -1.32], [0.7, -1.38], [1.45, -1.18], [1.82, -0.78], [1.6, -0.58], [0.6, -0.72]]), true);
    solid(d, o.cls ?? 'wash-ardoise', 'ink');
    emit(path('stipple', d));
    emit(path('ink-soft', smooth(U([[-1.05, -0.78], [-0.5, -0.86], [0.3, -0.88], [1.0, -0.8]])), { 'stroke-width': 0.8 }));
    emit(path('ink-faint', smooth(U([[-0.6, -1.08], [0.2, -1.2], [1.2, -1.08], [1.7, -0.8]]))));
    shade(U([[0.6, -0.72], [1.6, -0.58], [1.82, -0.78], [1.45, -1.18], [0.9, -1.0]]), { angle: 40, sp: 1.3, cls: 'ink-soft', sw: 0.6 });
    shade(U([[-0.8, -0.66], [0.3, -0.7], [0.9, -0.62], [0.9, -0.5], [0.2, -0.54], [-0.72, -0.5]]), { angle: 10, sp: 1.2, ombre: true });
  },
  feltBrim(h, o) {
    const { U, emit, path, solid, shade, P } = h;
    const [bx, by] = P(0.42, -0.84);
    const W = h.W;
    const rot = `rotate(-7 ${f(bx)} ${f(by)})`;
    const brim = ell(bx, by, 2.15 * W, 0.42 * W);
    emit(`<g transform="${rot}">${path('paper', brim)}${path(o.cls ?? 'wash-sienne', brim)}${path('hatch-dense', brim)}${path('ink', brim)}${path('ink-faint', ell(bx, by + 1, 1.9 * W, 0.3 * W))}</g>`);
    const crown = smooth(U([[-0.62, -0.92], [-0.66, -1.3], [-0.4, -1.62], [0.3, -1.58, 1], [0.55, -1.5], [0.8, -1.6, 1], [1.35, -1.55], [1.6, -1.28], [1.52, -0.9], [0.4, -0.78]]), true);
    solid(crown, o.cls ?? 'wash-sienne', 'ink');
    emit(path('hatch-dense', crown));
    const bandD = smooth(U([[-0.63, -1.0], [0.4, -0.88], [1.54, -0.98], [1.56, -1.12], [0.4, -1.04], [-0.64, -1.14]]), true);
    solid(bandD, 'hair-noir', 'ink-soft');
    emit(path('ink-soft', smooth(U([[0.3, -1.56], [0.42, -1.3], [0.55, -1.12]]))));
    // ombre du bord sur le haut du visage
    shade(U([[-0.85, -0.62], [0.4, -0.5], [1.3, -0.5], [1.2, -0.3], [0.3, -0.3], [-0.8, -0.38]]), { angle: 5, sp: 1.1, ombre: true });
  },
  plumes(h, o) {
    const { U, emit, path, solid, shade, P, r } = h;
    const [bx, by] = P(0.5, -0.98);
    const W = h.W;
    const rot = `rotate(-10 ${f(bx)} ${f(by)})`;
    const brim = ell(bx, by, 2.6 * W, 0.5 * W);
    emit(`<g transform="${rot}">${path('paper', brim)}${path(o.cls ?? 'wash-carmin', brim)}${path('hatch', brim)}${path('ink', brim)}${path('ink-faint', ell(bx, by - 1.2, 2.3 * W, 0.36 * W))}</g>`);
    const crown = smooth(U([[-0.5, -1.06], [-0.48, -1.38], [0.2, -1.56], [1.1, -1.5], [1.5, -1.24], [1.45, -1.0], [0.5, -0.95]]), true);
    solid(crown, o.cls ?? 'wash-carmin', 'ink');
    emit(path('hatch', crown));
    const ribbon = smooth(U([[-0.5, -1.1], [0.5, -1.0], [1.46, -1.06], [1.48, -1.2], [0.5, -1.16], [-0.49, -1.26]]), true);
    solid(ribbon, 'wash-lilas', 'ink-soft');
    // plumes d'autruche : rachis courbes et barbes
    const plumes = [
      [[0.5, -1.3], [0.7, -1.75], [1.3, -1.95], [1.95, -1.75]],
      [[0.8, -1.3], [1.4, -1.65], [2.1, -1.6], [2.5, -1.2]],
      [[1.1, -1.2], [1.8, -1.25], [2.3, -0.9], [2.35, -0.45]],
    ];
    for (const pl of plumes) {
      const pts = U(pl);
      const fringe = [];
      const back = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const p = sampleAt(pts, t);
        const q = sampleAt(pts, Math.min(1, t + 0.02));
        const dx = q[0] - p[0];
        const dy = q[1] - p[1];
        const L = Math.hypot(dx, dy) || 1;
        const w = 9.5 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 1.5;
        fringe.push([p[0] - (dy / L) * w * r.range(0.8, 1.15), p[1] + (dx / L) * w * r.range(0.8, 1.15)]);
        back.push([p[0] + (dy / L) * w * r.range(0.8, 1.15), p[1] - (dx / L) * w * r.range(0.8, 1.15)]);
      }
      const d = `${smooth(fringe)}${smooth(back.slice().reverse()).replace(/^M/, 'L')}Z`;
      solid(smooth(scallop(fringe, 1.2, r).concat(scallop(back.slice().reverse(), 1.2, r)), true), 'paper-shade', 'ink-soft', { 'stroke-width': 0.6 });
      void d;
      let barbs = '';
      for (let i = 1; i < 24; i++) {
        const t = i / 24;
        const p = sampleAt(pts, t);
        const e1 = sampleAt(fringe, Math.min(1, t + 0.06));
        const e2 = sampleAt(back, Math.min(1, t + 0.06));
        barbs += `M${f(p[0])} ${f(p[1])}Q${f((p[0] + e1[0]) / 2 + 1)} ${f((p[1] + e1[1]) / 2 + 1)} ${f(e1[0])} ${f(e1[1])}`;
        if (i % 2) barbs += `M${f(p[0])} ${f(p[1])}Q${f((p[0] + e2[0]) / 2 + 1)} ${f((p[1] + e2[1]) / 2 - 1)} ${f(e2[0])} ${f(e2[1])}`;
      }
      emit(path('ink-faint', barbs), path('ink-soft', smooth(pts), { 'stroke-width': 0.7 }));
    }
    shade(U([[-0.75, -0.62], [0.4, -0.54], [1.3, -0.56], [1.2, -0.36], [0.3, -0.36], [-0.7, -0.42]]), { angle: 5, sp: 1.2, ombre: true });
  },
  turban(h, o) {
    const { U, emit, path, solid, shade, r } = h;
    const d = smooth(U([[-0.76, -0.38], [-0.88, -0.88], [-0.48, -1.38], [0.4, -1.58], [1.32, -1.42], [1.86, -0.92], [1.86, -0.25], [1.5, 0.3], [1.14, -0.02], [1.04, -0.42], [0.5, -0.66], [-0.2, -0.64]]), true);
    solid(d, o.cls ?? 'wash-safran', 'ink');
    // plis croisés vers le nœud
    const k1 = strands([U([[-0.7, -0.45], [-0.4, -0.9], [0.2, -1.1]]), U([[1.1, -0.2], [1.3, -0.8], [0.6, -1.15]])], 7, r, { jit: 0.3 });
    const k2 = strands([U([[-0.78, -0.75], [-0.3, -1.3], [0.35, -1.25]]), U([[1.8, -0.4], [1.6, -1.1], [0.5, -1.2]])], 6, r, { jit: 0.3 });
    emit(path('ink-soft', k1 + k2, { 'stroke-width': 0.6 }));
    shade(U([[0.9, -1.3], [1.32, -1.42], [1.86, -0.92], [1.86, -0.25], [1.5, 0.3], [1.14, -0.02], [1.3, -0.6]]), { angle: 40, sp: 1.4, cls: 'ink-soft', sw: 0.5, ombre: true });
    // nœud
    const knot = smooth(U([[0.15, -1.08], [0.3, -1.4], [0.62, -1.36], [0.7, -1.1], [0.48, -0.98]]), true);
    solid(knot, o.cls ?? 'wash-safran', 'ink');
    emit(path('ink-soft', `${smooth(U([[0.25, -1.3], [0.45, -1.18], [0.62, -1.3]]))}${smooth(U([[0.28, -1.1], [0.46, -1.22], [0.6, -1.08]]))}`, { 'stroke-width': 0.6 }));
    emit(path('ombre', knot));
  },
  fichu(h, o) {
    const { U, emit, path, solid, shade } = h;
    const d = smooth(U([[-0.72, -0.44], [-0.76, -0.86], [-0.35, -1.22], [0.42, -1.32], [1.14, -1.2], [1.62, -0.84], [1.82, -0.3], [1.7, 0.2], [1.5, 0.42], [1.2, 0.0], [1.06, -0.38], [0.8, -0.6], [0.2, -0.72], [-0.4, -0.66]]), true);
    solid(d, o.cls ?? 'wash-celadon', 'ink');
    emit(path('stipple', d));
    emit(path('ink-soft', strands([U([[-0.5, -0.66], [0.2, -0.8], [1.0, -0.62], [1.2, -0.1]]), U([[-0.4, -1.15], [0.45, -1.28], [1.4, -1.0], [1.72, -0.2]])], 5, h.r, { jit: 0.3 }), { 'stroke-width': 0.5 }));
    shade(U([[1.0, -1.2], [1.62, -0.84], [1.82, -0.3], [1.7, 0.2], [1.5, 0.42], [1.2, 0.0], [1.3, -0.6]]), { angle: 40, sp: 1.4, cls: 'ink-soft', sw: 0.5, ombre: true });
    // nœud et pointes sur la nuque
    const knot = smooth(U([[1.5, 0.22], [1.78, 0.18], [1.86, 0.42], [1.6, 0.5]]), true);
    const tail1 = smooth(U([[1.62, 0.42], [1.86, 0.62], [1.98, 0.96, 1], [1.72, 0.8], [1.56, 0.5]]), true);
    const tail2 = smooth(U([[1.56, 0.44], [1.58, 0.75], [1.5, 1.02, 1], [1.4, 0.7], [1.48, 0.44]]), true);
    for (const t of [tail2, tail1, knot]) {
      solid(t, o.cls ?? 'wash-celadon', 'ink');
      emit(path('stipple', t));
    }
  },
  bandeau(h, o) {
    const { U, emit, path, solid } = h;
    const d = smooth(U([[-0.84, -0.42], [-0.62, -0.72], [-0.1, -0.86], [0.5, -0.86], [1.0, -0.74], [1.4, -0.6], [1.75, -0.45], [1.78, -0.25], [1.4, -0.38], [1.0, -0.5], [0.5, -0.6], [-0.1, -0.6], [-0.66, -0.48], [-0.86, -0.25]]), true);
    solid(d, o.cls ?? 'wash-lilas', 'ink');
    emit(path('ink-faint', strands([U([[-0.7, -0.5], [0.0, -0.66], [0.8, -0.62], [1.6, -0.42]]), U([[-0.6, -0.68], [0.0, -0.82], [0.8, -0.78], [1.6, -0.52]])], 3, h.r, { jit: 0.1 })));
    emit(path('ombre', smooth(U([[0.8, -0.62], [1.4, -0.48], [1.76, -0.3], [1.4, -0.6], [0.9, -0.74]]), true)));
    const knot = smooth(U([[1.68, -0.52], [1.92, -0.62], [2.02, -0.4], [1.85, -0.25], [1.7, -0.32]]), true);
    solid(knot, o.cls ?? 'wash-lilas', 'ink');
  },
  aviator(h, o) {
    const { U, emit, path, solid, shade, P } = h;
    const d = smooth(U([[-0.74, -0.44], [-0.82, -0.86], [-0.4, -1.24], [0.45, -1.34], [1.2, -1.2], [1.72, -0.8], [1.86, -0.2], [1.7, 0.4], [1.48, 0.7], [1.22, 0.74], [1.04, 0.5], [1.0, 0.0], [1.0, -0.42], [0.6, -0.62], [0.0, -0.68], [-0.5, -0.6]]), true);
    solid(d, o.cls ?? 'wash-sienne', 'ink');
    emit(path('hatch', d));
    // coutures
    emit(path('ink-soft', `${smooth(U([[0.0, -0.68], [0.35, -1.0], [0.45, -1.34]]))}${smooth(U([[1.0, -0.42], [1.35, -0.6], [1.72, -0.8]]))}`, { 'stroke-width': 0.6, 'stroke-dasharray': '1 0.9' }));
    shade(U([[1.0, -1.1], [1.72, -0.8], [1.86, -0.2], [1.7, 0.4], [1.48, 0.7], [1.22, 0.74], [1.3, 0.0]]), { angle: 50, sp: 1.3, cls: 'ink-soft', sw: 0.5, ombre: true });
    // rabat d'oreille et jugulaire
    const flap = smooth(U([[1.02, -0.1], [1.4, -0.16], [1.5, 0.3], [1.36, 0.66], [1.1, 0.62], [1.0, 0.3]]), true);
    solid(flap, o.cls ?? 'wash-sienne', 'ink');
    emit(path('ink-soft', flap.replace(/Z$/, ''), { 'stroke-width': 0.5, 'stroke-dasharray': '0.9 0.8', transform: 'translate(0.8 0.3) scale(0.99)' }));
    const strap = smooth(U([[1.1, 0.6], [0.95, 0.85], [0.7, 1.05], [0.62, 0.98], [0.86, 0.78], [1.02, 0.56]]), true);
    solid(strap, o.cls ?? 'wash-sienne', 'ink-soft');
    // lunettes de vol relevées sur le front
    const strapG = smooth(U([[-0.78, -0.82], [0.0, -0.98], [0.9, -1.0], [1.7, -0.75], [1.68, -0.62], [0.9, -0.86], [0.0, -0.84], [-0.76, -0.68]]), true);
    solid(strapG, 'hair-brun', 'ink-soft');
    for (const [u, v, rx, ry] of [[-0.12, -0.96, 0.32, 0.17], [0.62, -1.0, 0.36, 0.19]]) {
      const [cx, cy] = P(u, v);
      const W = h.W;
      const H = h.H;
      const ring = `${ell(cx, cy, rx * W + 1.6, ry * H + 1.6)}${ell(cx, cy, rx * W, ry * H)}`;
      emit(path('paper', ell(cx, cy, rx * W + 1.6, ry * H + 1.6)));
      emit(path('wash-celadon', ell(cx, cy, rx * W, ry * H)));
      emit(path('wash-safran', ring, { 'fill-rule': 'evenodd' }));
      emit(path('ink', ring, { 'fill-rule': 'evenodd', 'stroke-width': 0.7 }));
      emit(path('rehaut', ell(cx + rx * W * 0.3, cy - ry * H * 0.3, rx * W * 0.35, ry * H * 0.25)));
    }
    emit(path('ink', smooth(U([[0.2, -0.98], [0.26, -1.03]])), { 'stroke-width': 1.4 }));
  },
};

/* ───────────────────────── Lunettes, boucles ───────────────────────── */

const GLASSES = {
  round(h, o) {
    const { emit, path, P, ex1, ex2, s } = h;
    const W = h.W;
    const R1 = 0.31 * W * (o.size ?? 1);
    const rx2 = 0.22 * W * (o.size ?? 1);
    const [x1, y1] = [ex1[0] + 0.5, ex1[1] + 0.8];
    const [x2, y2] = [ex2[0] - 0.2, ex2[1] + 0.8];
    const thick = o.shell ? 1.5 : 0;
    // verres : reflet
    emit(path('rehaut', smooth([[x1 + R1 * 0.2, y1 - R1 * 0.85], [x1 + R1 * 0.75, y1 - R1 * 0.45], [x1 + R1 * 0.5, y1 - R1 * 0.35]], true)));
    if (o.shell) {
      const ring1 = `${circ(x1, y1, R1 + thick)}${circ(x1, y1, R1)}`;
      const ring2 = `${ell(x2, y2, rx2 + thick * 0.8, R1 + thick)}${ell(x2, y2, rx2, R1)}`;
      emit(path(o.shell, ring1, { 'fill-rule': 'evenodd' }), path(o.shell, ring2, { 'fill-rule': 'evenodd' }));
      emit(path('ink-soft', ring1, { 'fill-rule': 'evenodd', 'stroke-width': 0.6 }), path('ink-soft', ring2, { 'fill-rule': 'evenodd', 'stroke-width': 0.6 }));
    } else {
      emit(path('ink', circ(x1, y1, R1), { 'stroke-width': 0.75 }), path('ink', ell(x2, y2, rx2, R1), { 'stroke-width': 0.75 }));
    }
    const bridge = `M${f(x1 - R1 - thick)} ${f(y1 - 1)}Q${f((x1 + x2) / 2)} ${f(y1 - 4)} ${f(x2 + rx2 + thick * 0.8)} ${f(y2 - 1)}`;
    const temple = `M${f(x1 + R1 + thick * 0.5)} ${f(y1 - 1.5)}L${f(P(1.24, -0.08)[0])} ${f(P(1.24, -0.08)[1])}`;
    emit(path('ink', bridge + temple, { 'stroke-width': o.shell ? 1.4 : 0.75 }));
    if (o.chain) emit(path('ink-soft', smooth([P(1.24, -0.06), P(1.38, 0.5), P(1.2, 1.2), P(0.9, 1.6)]), { 'stroke-width': 0.6, 'stroke-dasharray': '0.7 0.7' }));
  },
  half(h, o) {
    // demi-lunes basses sur le nez, retenues par une chaînette
    const { emit, path, P, ex1, ex2, s } = h;
    const W = h.W;
    const R1 = 0.27 * W;
    const rx2 = 0.19 * W;
    const y = ex1[1] + 0.12 * h.H;
    const x1 = ex1[0] + 0.2;
    const x2 = ex2[0] - 0.3;
    const lens1 = `M${f(x1 - R1)} ${f(y)}A${f(R1)} ${f(R1 * 0.75)} 0 0 0 ${f(x1 + R1)} ${f(y)}Z`;
    const lens2 = `M${f(x2 - rx2)} ${f(y)}A${f(rx2)} ${f(R1 * 0.75)} 0 0 0 ${f(x2 + rx2)} ${f(y)}Z`;
    emit(path('rehaut', `M${f(x1 + R1 * 0.2)} ${f(y + 1)}l${f(R1 * 0.5)} 0l-1 ${f(R1 * 0.4)}Z`));
    emit(path('ink', lens1 + lens2, { 'stroke-width': 0.7 }));
    emit(path('ink', `M${f(x1 - R1)} ${f(y)}Q${f((x1 + x2) / 2)} ${f(y - 3)} ${f(x2 + rx2)} ${f(y)}M${f(x1 + R1)} ${f(y)}L${f(P(1.24, -0.05)[0])} ${f(P(1.24, -0.05)[1])}`, { 'stroke-width': 0.7 }));
    emit(path('ink-soft', smooth([P(1.24, -0.03), P(1.42, 0.45), P(1.3, 1.0), P(1.0, 1.5), P(0.5, 1.72)]), { 'stroke-width': 0.7, 'stroke-dasharray': '0.8 0.6' }));
  },
  pinceNez(h) {
    const { emit, path, P, ex1, ex2, s } = h;
    const W = h.W;
    const R = 0.24 * W;
    const rx2 = 0.17 * W;
    const [x1, y1] = [ex1[0] - 0.5, ex1[1] + 0.6];
    const [x2, y2] = [ex2[0] + 0.3, ex2[1] + 0.6];
    emit(path('rehaut', smooth([[x1 + R * 0.1, y1 - R * 0.7], [x1 + R * 0.6, y1 - R * 0.3], [x1 + R * 0.4, y1 - R * 0.2]], true)));
    emit(path('ink-soft', ell(x1, y1, R, R * 0.8) + ell(x2, y2, rx2, R * 0.8), { 'stroke-width': 0.6 }));
    emit(path('ink', `M${f(x1 - R)} ${f(y1 - 0.5)}c-1.5 -3 -4 -3 -5.2 0.2`, { 'stroke-width': 0.8 }));
    // ruban noir
    emit(path('ink', smooth([[x1 + R, y1], P(0.95, 0.35), P(1.02, 0.9), P(0.8, 1.4), P(0.6, 1.9)]), { 'stroke-width': 1.3 }));
  },
};

const EARRINGS = {
  ring(h, o) {
    const { emit, path, P } = h;
    const [x, y] = P(1.29, 0.47);
    const R = o.r ?? 2;
    const ring = `${circ(x, y + R * 0.7, R)}${circ(x, y + R * 0.7, R - 0.9)}`;
    emit(path('wash-safran', ring, { 'fill-rule': 'evenodd' }), path('wash-safran', ring, { 'fill-rule': 'evenodd' }));
    emit(path('ink', ring, { 'fill-rule': 'evenodd', 'stroke-width': 0.55 }));
  },
  hoops(h, o) {
    const { emit, path, P } = h;
    const R = o.r ?? 5.5;
    for (const [u, v, sx] of [[1.29, 0.46, 1], [-0.62, 0.6, 0.55]]) {
      const [x, y] = P(u, v);
      const ring = `${ell(x, y + R, R * sx, R)}${ell(x, y + R, R * sx - 1, R - 1)}`;
      emit(path('wash-safran', ring, { 'fill-rule': 'evenodd' }), path('wash-safran', ring, { 'fill-rule': 'evenodd' }));
      emit(path('ink', ring, { 'fill-rule': 'evenodd', 'stroke-width': 0.5 }));
    }
  },
  pearl(h) {
    const { emit, path, P } = h;
    const [x, y] = P(1.29, 0.47);
    emit(path('paper', circ(x, y + 1.6, 1.9)), path('rehaut', circ(x, y + 1.6, 1.9)), path('ink-soft', circ(x, y + 1.6, 1.9), { 'stroke-width': 0.5 }));
    emit(path('ombre', circ(x + 0.5, y + 2.1, 1.2)));
  },
};

/* ───────────────────────── Vêtements ───────────────────────── */

function torso(b, cls, dark) {
  const d = smooth(b.torsoPts, true);
  b.solid(d, cls, 'ink');
  if (dark) b.emit(b.path(dark === true ? 'hatch-dense' : dark, d));
  // modelé : ombre du côté droit de l'image (épaule fuyante dans l'ombre portée du cou)
  b.shade([[b.nx1 - 4, b.yN - 4], [b.nx1 + 30, b.yN + 4], [150, b.yN + 30], [150, 200], [b.nx1 + 4, 200]], { angle: 65, sp: 1.8, cls: 'ink-soft', sw: 0.5 });
  return d;
}
const lapelPts = (b, w = 1) => {
  const { yN, nx0, nx1, cm } = b;
  return {
    left: [[nx0 + 2, yN - 3], [nx0 - 8 * w, yN + 10], [nx0 - 3 * w, yN + 14, 1], [cm - 4, yN + 52]],
    right: [[nx1 - 2, yN - 5], [nx1 + 9 * w, yN + 10], [nx1 + 4 * w, yN + 14, 1], [cm + 6, yN + 52]],
  };
};

const CLOTHES = {
  /** Habit masculin : veste/redingote, gilet, chemise, cravate. */
  coat(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? b.s.wash, o.dark ?? true);
    // plastron (ouverture en V)
    const vee = smooth([[nx0 + 2, yN - 3], [nx0 + 6, yN + 20], [cm + 1, yN + 54, 1], [nx1 - 6, yN + 20], [nx1 - 2, yN - 5], [(nx0 + nx1) / 2, yN - 6]], true);
    solid(vee, o.vest ?? 'paper', 'ink');
    if (o.vest) {
      emit(path(o.vestDark ? 'hatch-dense' : 'hatch', vee));
      // chemise au-dessus du gilet
      const shirt = smooth([[nx0 + 4, yN - 3], [nx0 + 9, yN + 12], [cm + 1, yN + 20, 1], [nx1 - 9, yN + 12], [nx1 - 4, yN - 5]], true);
      solid(shirt, 'paper', 'ink-soft');
      let btn = '';
      for (let q = 0; q < 3; q++) btn += circ(lerp(cm + 1, cm + 2, q / 3), yN + 28 + q * 8, 0.9);
      emit(path('ink', btn, { fill: 'currentColor', 'stroke-width': 0.3 }));
      if (o.chain) emit(path('wash-safran', smooth([[cm + 2, yN + 34], [cm + 12, yN + 44], [nx1 + 6, yN + 40]]), { 'stroke-width': 0 }), path('ink', smooth([[cm + 2, yN + 34], [cm + 12, yN + 44], [nx1 + 8, yN + 40]]), { 'stroke-width': 1, 'stroke-dasharray': '1.2 0.6' }));
    }
    // revers
    if (o.lapels !== false) {
      const L = lapelPts(b, o.lapelW ?? 1);
      const ld = smooth([...L.left, [nx0 + 6, yN + 20]], true, 0.4);
      const rd = smooth([...L.right, [nx1 - 6, yN + 20]], true, 0.4);
      solid(ld, o.wash ?? b.s.wash, 'ink');
      solid(rd, o.wash ?? b.s.wash, 'ink');
      if (o.dark ?? true) emit(path('hatch', ld), path('hatch', rd));
      emit(path('ombre', rd));
    }
    COLLARS[o.collar ?? 'turn']?.(b, o);
    TIES[o.tie ?? 'none']?.(b, o);
    if (o.pocketRule) EXTRAS.slideRule(b, {});
  },
  /** Vareuse croisée d'officier. */
  uniform(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? 'wash-indigo', true);
    const flap = smooth([[nx0 + 4, yN - 2], [nx0 - 10, yN + 14], [cm - 12, yN + 60], [cm + 6, yN + 60], [nx1 - 2, yN + 16], [nx1 - 4, yN - 5]], true);
    emit(path('ink-soft', `M${f(nx1 - 2)} ${f(yN + 14)}L${f(cm + 6)} ${f(yN + 64)}`, { 'stroke-width': 1 }));
    let btn = '';
    for (let q = 0; q < 3; q++) {
      btn += circ(cm - 6 - q * 2, yN + 18 + q * 14, 1.5);
      btn += circ(cm + 12 - q * 1.2, yN + 16 + q * 14, 1.5);
    }
    emit(path('paper', btn), path('wash-safran', btn), path('wash-safran', btn), path('ink', btn, { 'stroke-width': 0.5 }));
    // col montant
    const col = smooth([[nx0 - 1, yN - 10], [nx1 + 1, yN - 13], [nx1 + 2, yN - 1], [(nx0 + nx1) / 2, yN + 3], [nx0, yN]], true);
    solid(col, o.wash ?? 'wash-indigo', 'ink');
    emit(path('hatch-dense', col));
    emit(path('ink-soft', smooth([[nx0, yN - 6], [(nx0 + nx1) / 2, yN - 4], [nx1 + 1, yN - 8]]), { 'stroke-width': 0.6, 'stroke-dasharray': '1 0.8' }));
    void flap;
  },
  /** Robe à col montant (dentelle). */
  highCollar(b, o) {
    const { yN, nx0, nx1, emit, path, solid, P, r } = b;
    torso(b, o.wash ?? b.s.wash, o.dark ?? 'hatch');
    // corsage : plis et ruchés
    let pl = '';
    for (let q = 0; q < 6; q++) {
      const x = lerp(nx0 - 6, nx1 + 8, q / 5);
      pl += `M${f(x)} ${f(yN + 6)}q${f(r.jit(2))} 18 ${f(-3 + q)} 40`;
    }
    emit(path('ink-faint', pl));
    // col montant en dentelle (de la base du cou jusque sous la mâchoire)
    const yT = P(0, o.collarTop ?? 1.02)[1];
    const col = smooth([[nx0 - 1, yT + 2], [nx0 - 1, yN + 2], [(nx0 + nx1) / 2, yN + 6], [nx1 + 1, yN], [nx1 + 1, yT - 2], [(nx0 + nx1) / 2, yT + 4]], true);
    solid(col, o.collar ?? 'paper', null);
    emit(path('ink-soft', smooth([[nx0 - 1, yT + 2], [nx0 - 1, yN + 2], [(nx0 + nx1) / 2, yN + 6], [nx1 + 1, yN], [nx1 + 1, yT - 2]]), { 'stroke-width': 0.7 }));
    let lace = '';
    for (let q = 0; q < 5; q++) {
      const y = lerp(yT + 4, yN, q / 5);
      lace += smooth([[nx0, y], [(nx0 + nx1) / 2, y + 4], [nx1, y - 2]]);
    }
    emit(path('stipple', col), path('ink-faint', lace));
    // bord festonné
    const sc = [];
    for (let q = 0; q <= 10; q++) {
      const x = lerp(nx0 - 1, nx1 + 1, q / 10);
      const y = lerp(yT + 2, yT - 2, q / 10) + Math.sin((q / 10) * Math.PI) * 2;
      sc.push([x, y - (q % 2 ? 1.4 : 0)]);
    }
    emit(path('ink-soft', smooth(sc), { 'stroke-width': 0.6 }));
    b.shade([[nx0 - 1, yT + 2], [nx0 + 8, yT + 4], [nx0 + 6, yN + 4], [nx0 - 1, yN + 2]], { angle: 80, sp: 1.3 });
    if (o.brooch === 'fern') EXTRAS.fernBrooch(b, { x: (nx0 + nx1) / 2 - 1, y: yN - 3 });
    if (o.watch) EXTRAS.colWatch(b, { x: P(0.9, 2.0)[0], y: P(0.9, 2.0)[1] });
    void P;
  },
  /** Châle de laine sur robe, col brodé de zigzags. */
  shawl(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.dress ?? 'wash-ardoise', 'hatch');
    // châle croisé
    const sl = smooth([[3, yN + 24], [nx0 - 8, yN + 6], [nx0 + 2, yN + 10], [cm + 16, yN + 70], [cm - 4, 205, 1], [3, 205, 1]], true);
    const sr = smooth([[157, yN + 20], [nx1 + 8, yN + 2], [nx1 - 2, yN + 8], [cm - 10, yN + 60], [cm + 30, 205, 1], [157, 205, 1]], true);
    for (const d of [sr, sl]) {
      solid(d, o.wash ?? b.s.wash, 'ink');
      emit(path('hatch', d));
    }
    emit(path('ink-faint', strands([[[nx0 - 6, yN + 12], [cm - 10, yN + 50], [cm - 20, 200]], [[10, yN + 30], [20, yN + 60], [20, 200]]], 6, b.r)));
    emit(path('ink-faint', strands([[[nx1 + 6, yN + 8], [cm + 10, yN + 50], [cm + 34, 200]], [[150, yN + 26], [140, yN + 60], [146, 200]]], 6, b.r)));
    // frange
    let fr = '';
    for (let x = cm - 4; x > 8; x -= 3) fr += `M${f(x)} 197l-1 4`;
    emit(path('ink-soft', fr));
    // col brodé à plat sur les épaules
    const mid = (nx0 + nx1) / 2;
    const col = smooth([[nx0 - 1, yN - 6], [nx0 - 18, yN + 2], [nx0 - 16, yN + 13], [mid - 2, yN + 19], [nx1 + 18, yN + 10], [nx1 + 20, yN - 3], [nx1 + 1, yN - 9], [mid, yN - 3]], true);
    solid(col, 'paper', 'ink');
    const edge = [[nx0 - 15, yN + 4], [nx0 - 13, yN + 11], [mid - 2, yN + 15.5], [nx1 + 15, yN + 7.5], [nx1 + 17, yN - 1]];
    const band = `${smooth(edge.map(([x, y]) => [x, y - 2.6]))}${smooth(edge.slice().reverse().map(([x, y]) => [x, y + 2.6])).replace(/^M/, 'L')}Z`;
    emit(path(o.embroidery ?? 'wash-carmin', band));
    let zz = '';
    const dense = [];
    for (let i = 0; i < edge.length - 1; i++) for (let t = 0; t < 1; t += 0.125) dense.push(lerpPt(edge[i], edge[i + 1], t));
    dense.forEach(([x, y], i) => (zz += `${i ? 'L' : 'M'}${f(x)} ${f(y + (i % 2 ? -2 : 2))}`));
    emit(path('ink', zz, { 'stroke-width': 0.7 }));
    emit(path('ink-soft', smooth([[nx0 + 2, yN - 3], [mid, yN + 2], [nx1 - 2, yN - 6]])));
  },
  /** Chandail ostrien à zigzags. */
  sweater(b, o) {
    const { yN, nx0, nx1, emit, path, solid, r } = b;
    const d = torso(b, o.wash ?? b.s.wash, 'hatch');
    // côtes verticales
    let rib = '';
    for (let x = 4; x < 158; x += 3.2) rib += `M${f(x)} ${f(yN + 10)}l${f(r.jit(0.5))} 100`;
    emit(b.clipped(d, path('ink-faint', rib)));
    // bande de zigzags
    for (const [y0, amp] of [[yN + 26, 3.2], [yN + 36, 2.2]]) {
      let zz = '';
      for (let q = 0, x = 2; x < 160; q++, x += 4) zz += `${q ? 'L' : 'M'}${f(x)} ${f(y0 + (q % 2 ? -amp : amp) + (x - 80) * 0.06)}`;
      emit(b.clipped(d, path('ink', zz, { 'stroke-width': 1.1 })));
    }
    const band = smooth([[2, yN + 21], [160, yN + 29], [160, yN + 41], [2, yN + 33]], true, 0);
    emit(b.clipped(d, path(o.band ?? 'wash-carmin', band)));
    if (o.darned) {
      const [dx, dy] = [nx1 + 22, yN + 52];
      const pd = smooth([[dx - 6, dy - 4], [dx + 6, dy - 5], [dx + 7, dy + 5], [dx - 5, dy + 6]], true);
      emit(path('wash-sienne', pd));
      let w = '';
      for (let q = -5; q <= 5; q += 1.4) w += `M${f(dx - 6)} ${f(dy + q)}l13 -0.6`;
      for (let q = -5; q <= 5; q += 1.4) w += `M${f(dx + q)} ${f(dy - 5)}l0.3 11`;
      emit(path('ink-faint', w), path('ink-soft', pd, { 'stroke-dasharray': '0.8 0.8' }));
    }
    // col rond à côtes
    const col = smooth([[nx0 - 4, yN - 4], [nx1 + 4, yN - 7], [nx1 + 6, yN + 3], [(nx0 + nx1) / 2, yN + 8], [nx0 - 6, yN + 5]], true);
    solid(col, o.wash ?? b.s.wash, 'ink');
    let cr = '';
    for (let q = 0; q <= 16; q++) {
      const x = lerp(nx0 - 4, nx1 + 4, q / 16);
      cr += `M${f(x)} ${f(lerp(yN - 4, yN - 7, q / 16) + Math.sin((q / 16) * Math.PI) * 5)}l${f((q - 8) * 0.1)} 4`;
    }
    emit(path('ink-soft', cr, { 'stroke-width': 0.5 }));
    if (o.oilskin) {
      const od = smooth([[nx1 + 6, yN - 2], [nx1 + 30, yN + 2], [158, yN + 18], [158, 205, 1], [nx1 + 40, 205, 1], [nx1 + 26, yN + 50], [nx1 + 12, yN + 18]], true);
      solid(od, 'wash-safran', 'ink');
      emit(path('wash-safran', od));
      emit(path('ink-soft', `${smooth([[nx1 + 14, yN + 6], [nx1 + 30, yN + 40], [nx1 + 44, 200]])}${smooth([[nx1 + 26, yN + 4], [nx1 + 40, yN + 30], [nx1 + 56, 200]])}${smooth([[nx1 + 40, yN + 8], [nx1 + 52, yN + 40], [150, 190]])}`, { 'stroke-width': 0.6 }));
      b.shade([[nx1 + 12, yN + 18], [nx1 + 26, yN + 50], [nx1 + 40, 205], [nx1 + 60, 205], [nx1 + 34, yN + 20]], { angle: 70, sp: 1.4, cls: 'ink-soft', sw: 0.5 });
      emit(path('rehaut', smooth([[nx1 + 18, yN + 4], [nx1 + 36, yN + 10], [nx1 + 30, yN + 14]], true)));
    }
  },
  /** Blouse d'atelier boutonnée à petit col. */
  smock(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? b.s.wash, o.dark ?? false);
    emit(path('ink-soft', `M${f(cm + 2)} ${f(yN + 2)}L${f(cm - 2)} 200`, { 'stroke-width': 0.9 }));
    let btn = '';
    for (let q = 0; q < 4; q++) btn += circ(lerp(cm + 4, cm, q / 4), yN + 10 + q * 16, 1.1);
    emit(path('paper', btn), path('ink-soft', btn, { 'stroke-width': 0.6 }));
    let pl = '';
    for (const x of [nx0 - 14, nx0 - 4, nx1 + 10, nx1 + 22]) pl += `M${f(x)} ${f(yN + 12)}q2 30 -1 70`;
    emit(path('ink-faint', pl));
    const cL = smooth([[nx0 + 1, yN - 4], [nx0 - 6, yN + 6], [cm - 2, yN + 12, 1], [cm + 2, yN + 2]], true);
    const cR = smooth([[nx1 - 1, yN - 6], [nx1 + 8, yN + 4], [cm + 6, yN + 12, 1], [cm + 2, yN + 2]], true);
    solid(cL, o.collar ?? o.wash ?? b.s.wash, 'ink');
    solid(cR, o.collar ?? o.wash ?? b.s.wash, 'ink');
    emit(path('ombre', cR));
    if (o.pocket) {
      const pd = smooth([[nx1 + 6, yN + 24, 1], [nx1 + 22, yN + 23, 1], [nx1 + 22, yN + 40, 1], [nx1 + 6, yN + 41, 1]], true, 0);
      emit(path('ink-soft', pd));
    }
  },
  /** Corsage, tablier à bavette, manches retroussées. */
  apron(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? b.s.wash, false);
    // encolure ronde
    const neck = smooth([[nx0 - 4, yN - 3], [nx0, yN + 8], [(nx0 + nx1) / 2, yN + 12], [nx1, yN + 6], [nx1 + 4, yN - 6], [(nx0 + nx1) / 2, yN - 4]], true);
    solid(neck, b.s.skin ? `skin-${b.s.skin}` : 'skin-3', null);
    emit(path('ink', smooth([[nx0 - 4, yN - 3], [nx0, yN + 8], [(nx0 + nx1) / 2, yN + 12], [nx1, yN + 6], [nx1 + 4, yN - 6]])));
    let fr = '';
    for (let q = 0; q < 10; q++) fr += `M${f(lerp(nx0 - 2, nx1 + 2, q / 9))} ${f(yN + 6 + Math.sin((q / 9) * Math.PI) * 5)}l0 4`;
    emit(path('ink-faint', fr));
    // bavette du tablier
    const bib = smooth([[cm - 18, yN + 30, 1], [cm + 22, yN + 28, 1], [cm + 24, 205, 1], [cm - 22, 205, 1]], true, 0);
    solid(bib, 'paper-shade', 'ink');
    emit(path('stipple', bib));
    emit(path('ink-faint', `M${f(cm - 14)} ${f(yN + 36)}l1 60M${f(cm + 4)} ${f(yN + 36)}l-1 60M${f(cm + 18)} ${f(yN + 34)}l1 60`));
    // bretelles
    emit(path('ink', `M${f(cm - 18)} ${f(yN + 30)}L${f(nx0 - 14)} ${f(yN + 4)}M${f(cm + 22)} ${f(yN + 28)}L${f(nx1 + 18)} ${f(yN + 2)}`, { 'stroke-width': 2 }));
    emit(path('paper-shade', `M${f(cm - 18)} ${f(yN + 30)}L${f(nx0 - 14)} ${f(yN + 4)}L${f(nx0 - 10)} ${f(yN + 3)}L${f(cm - 14)} ${f(yN + 30)}Z`));
    // manches retroussées au-dessus du coude (bords du cadre)
    for (const sx of [1, -1]) {
      const x0 = sx > 0 ? 152 : 8;
      const xi = sx > 0 ? 128 : 32;
      const arm = smooth([[xi + sx * 2, 182], [x0, 178, 1], [x0, 205, 1], [xi, 205, 1]], true, 0.5);
      solid(arm, `skin-${b.s.skin}`, 'ink-soft');
      b.shade([[xi + sx * 8, 186], [x0, 184], [x0, 205], [xi + sx * 8, 205]], { angle: 80, sp: 1.6 });
      const cuff = smooth([[xi - sx * 1, 176], [x0, 171, 1], [x0, 182, 1], [xi + sx * 1, 187]], true, 0.6);
      solid(cuff, o.wash ?? b.s.wash, 'ink');
      emit(path('ink-faint', smooth([[xi, 181], [lerp(xi, x0, 0.5), 178], [x0, 176]])));
    }
  },
  /** Blouson d'aviateur à col de mouton. */
  leather(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    const d = torso(b, o.wash ?? 'wash-sienne', 'hatch');
    emit(path('ombre', d));
    emit(path('ink-soft', `M${f(cm + 4)} ${f(yN + 24)}L${f(cm - 2)} 200`, { 'stroke-width': 1.1 }));
    emit(path('ink-faint', `${smooth([[20, yN + 30], [30, yN + 60], [26, 200]])}${smooth([[140, yN + 26], [128, yN + 60], [134, 200]])}`));
    // col de mouton
    const fur = (pts) => smooth(scallop(pts, 1.2, b.r), true);
    const cl = fur([[nx0 + 4, yN - 8], [nx0 - 14, yN + 4], [nx0 - 18, yN + 18], [cm - 2, yN + 34], [cm + 3, yN + 24], [nx0 + 6, yN + 6], [nx0 + 4, yN - 8]]);
    const cr = fur([[nx1 - 4, yN - 10], [nx1 + 18, yN + 2], [nx1 + 22, yN + 18], [cm + 6, yN + 34], [cm + 3, yN + 24], [nx1 - 6, yN + 4], [nx1 - 4, yN - 10]]);
    for (const c of [cl, cr]) {
      solid(c, 'paper-shade', 'ink');
      emit(path('stipple', c));
    }
    emit(path('ombre', cr));
    // écharpe de soie
    const sc = smooth([[nx0 + 6, yN - 2], [nx1 - 6, yN - 4], [cm + 6, yN + 20], [cm + 1, yN + 26]], true);
    solid(sc, o.scarf ?? 'paper', 'ink-soft');
  },
  /** Col roulé (avec veste éventuelle). */
  turtle(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid, r } = b;
    const d = torso(b, o.wash ?? b.s.wash, o.dark ?? 'hatch');
    if (o.jacket) {
      const jl = smooth([[3, yN + 30], [nx0 - 14, yN + 4], [nx0 - 4, yN + 6], [cm - 12, 205, 1], [3, 205, 1]], true);
      const jr = smooth([[157, yN + 24], [nx1 + 16, yN + 0], [nx1 + 6, yN + 4], [cm + 20, 205, 1], [157, 205, 1]], true);
      for (const j of [jr, jl]) {
        solid(j, o.jacket, 'ink');
        emit(path(o.jacketDark ? 'hatch-dense' : 'hatch', j));
      }
      if (o.pocket) {
        const pd = poly([[nx1 + 14, yN + 34], [nx1 + 32, yN + 33], [nx1 + 32, yN + 36], [nx1 + 14, yN + 37]], true);
        emit(path('ink', pd, { 'stroke-width': 0.8 }));
        if (o.pocketRule) EXTRAS.slideRule(b, { x: nx1 + 22, y: yN + 34 });
      }
    } else {
      let rib = '';
      for (let x = 4; x < 158; x += 3) rib += `M${f(x)} ${f(yN + 8)}l${f(r.jit(0.4))} 100`;
      emit(b.clipped(d, path('ink-faint', rib)));
    }
    // col roulé
    const yT = yN - 0.45 * b.s.H * b.G;
    const col = smooth([[nx0 - 3, yT + 3], [(nx0 + nx1) / 2, yT + 8], [nx1 + 3, yT - 1], [nx1 + 6, yN + 2], [(nx0 + nx1) / 2, yN + 10], [nx0 - 6, yN + 4]], true);
    solid(col, o.wash ?? b.s.wash, 'ink');
    emit(path(o.dark === true ? 'hatch-dense' : 'hatch', col));
    let cr = '';
    for (let q = 0; q <= 14; q++) {
      const t = q / 14;
      cr += `M${f(lerp(nx0 - 3, nx1 + 3, t))} ${f(lerp(yT + 3, yT - 1, t) + Math.sin(t * Math.PI) * 5)}l${f((t - 0.5) * 3)} ${f(0.45 * b.s.H * b.G)}`;
    }
    emit(path('ink-soft', cr, { 'stroke-width': 0.5 }));
    emit(path('ink-soft', smooth([[nx0 - 4, yT + 12], [(nx0 + nx1) / 2, yT + 18], [nx1 + 4, yT + 8]])));
    b.shade([[nx1 - 8, yT], [nx1 + 6, yT], [nx1 + 6, yN + 4], [nx1 - 6, yN + 6]], { angle: 80, sp: 1.4, cls: 'ink-soft', sw: 0.5 });
  },
  /** Robe de scène décolletée. */
  stage(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid, P } = b;
    // épaules et gorge nues
    const skinD = smooth([[WIN.x - 4, yN + 36], [XM - 44, yN + 12], [nx0 - 3, yN + 2], [nx0 + 6, yN - 3], [nx1 - 5, yN - 5], [nx1 + 5, yN - 1], [XM + 64, yN + 8], [WIN.x + WIN.w + 4, yN + 28], [WIN.x + WIN.w + 4, 205, 1], [WIN.x - 4, 205, 1]], true);
    b.solid(skinD, `skin-${b.s.skin}`, 'ink');
    b.shade([[nx1 - 4, yN - 4], [nx1 + 30, yN + 4], [150, yN + 30], [150, yN + 40], [nx1, yN + 20]], { angle: 65, sp: 2, cls: 'ink-faint', ombre: true });
    emit(path('ink-faint', smooth([[nx0 - 8, yN + 14], [cm, yN + 18], [nx1 + 10, yN + 12]])));
    // corsage drapé
    const dress = smooth([[WIN.x - 4, yN + 50], [40, yN + 34], [cm - 4, yN + 46], [cm + 6, yN + 50, 1], [cm + 18, yN + 44], [124, yN + 30], [WIN.x + WIN.w + 4, yN + 40], [WIN.x + WIN.w + 4, 205, 1], [WIN.x - 4, 205, 1]], true);
    solid(dress, o.wash ?? b.s.wash, 'ink');
    emit(path('hatch', dress));
    emit(path('ink-soft', strands([[[30, yN + 40], [cm - 4, yN + 60], [cm + 6, yN + 60]], [[24, 200], [cm - 10, 200], [cm + 4, 200]]], 5, b.r)));
    emit(path('ink-soft', strands([[[130, yN + 34], [cm + 20, yN + 56], [cm + 8, yN + 60]], [[150, 196], [cm + 30, 200], [cm + 14, 200]]], 5, b.r)));
    emit(path('rehaut', smooth([[cm + 20, yN + 50], [124, yN + 36], [118, yN + 44], [cm + 24, yN + 56]], true)));
    void P;
  },
  /** Robe simple (encolure en V ou ronde, col Claudine possible). */
  dress(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? b.s.wash, o.dark ?? false);
    if (o.neck === 'v') {
      const vee = smooth([[nx0 - 2, yN - 4], [cm + 1, yN + 28, 1], [nx1 + 2, yN - 7], [(nx0 + nx1) / 2, yN - 8]], true);
      solid(vee, `skin-${b.s.skin}`, 'ink');
      b.shade([[nx1 - 4, yN - 6], [nx1 + 2, yN - 7], [cm + 1, yN + 28], [cm - 2, yN + 20]], { angle: 70, sp: 1.5, ombre: true });
    } else if (o.neck === 'claudine') {
      const cL = smooth([[nx0 + 1, yN - 5], [nx0 - 12, yN + 2], [nx0 - 10, yN + 14], [cm - 1, yN + 12], [cm + 2, yN + 4]], true);
      const cR = smooth([[nx1 - 1, yN - 7], [nx1 + 14, yN - 1], [nx1 + 12, yN + 12], [cm + 5, yN + 12], [cm + 2, yN + 4]], true);
      solid(cL, 'paper', 'ink');
      solid(cR, 'paper', 'ink');
      emit(path('ombre', cR));
    } else {
      const neck = smooth([[nx0 - 2, yN - 3], [nx0 + 1, yN + 6], [(nx0 + nx1) / 2, yN + 9], [nx1, yN + 4], [nx1 + 2, yN - 6], [(nx0 + nx1) / 2, yN - 5]], true);
      solid(neck, `skin-${b.s.skin}`, 'ink');
    }
    let pl = '';
    for (const x of [nx0 - 18, nx0 - 6, nx1 + 8, nx1 + 24]) pl += `M${f(x)} ${f(yN + 14)}q${f(b.r.jit(3))} 30 -2 70`;
    emit(path('ink-faint', pl));
  },
  /** Tailleur sombre sur chemisier. */
  suit(b, o) {
    const { yN, nx0, nx1, cm, emit, path, solid } = b;
    torso(b, o.wash ?? b.s.wash, true);
    const vee = smooth([[nx0 + 2, yN - 3], [nx0 + 4, yN + 16], [cm + 1, yN + 44, 1], [nx1 - 4, yN + 16], [nx1 - 2, yN - 5], [(nx0 + nx1) / 2, yN - 6]], true);
    solid(vee, o.blouse ?? 'paper', 'ink');
    const L = lapelPts(b, 1.1);
    const ld = smooth([...L.left.map(([x, y, c]) => [x, y * 1 - (y - yN) * 0.15, c]), [nx0 + 4, yN + 18]], true, 0.4);
    const rd = smooth([...L.right.map(([x, y, c]) => [x, y - (y - yN) * 0.15, c]), [nx1 - 4, yN + 18]], true, 0.4);
    for (const d of [ld, rd]) {
      solid(d, o.wash ?? b.s.wash, 'ink');
      emit(path('hatch', d));
    }
    emit(path('ombre', rd));
    // col du chemisier
    const cL = smooth([[nx0 + 1, yN - 4], [nx0 - 4, yN + 8], [cm - 1, yN + 10, 1], [cm + 2, yN + 2]], true);
    const cR = smooth([[nx1 - 1, yN - 6], [nx1 + 6, yN + 6], [cm + 5, yN + 10, 1], [cm + 2, yN + 2]], true);
    solid(cL, o.blouse ?? 'paper', 'ink-soft');
    solid(cR, o.blouse ?? 'paper', 'ink-soft');
    if (o.tie) TIES[o.tie]?.(b, o);
  },
};

const COLLARS = {
  /** Col cassé (pointes rabattues) : fin XIXe. */
  wing(b) {
    const { yN, nx0, nx1, emit, path, solid } = b;
    const yT = yN - 0.22 * b.s.H * b.G;
    const band = smooth([[nx0 - 1, yT], [(nx0 + nx1) / 2, yT + 4], [nx1 + 1, yT - 3], [nx1 + 2, yN - 2], [(nx0 + nx1) / 2, yN + 2], [nx0 - 1, yN - 1]], true);
    solid(band, 'paper', 'ink');
    const cx = (nx0 + nx1) / 2 - 4;
    const w1 = poly([[cx - 1, yT + 4], [cx - 6, yT + 9], [cx - 1, yT + 9]], true);
    const w2 = poly([[cx + 3, yT + 4], [cx + 9, yT + 9], [cx + 3, yT + 9]], true);
    solid(w1, 'paper', 'ink-soft');
    solid(w2, 'paper', 'ink-soft');
    b.shade([[nx1 - 8, yT], [nx1 + 2, yT - 3], [nx1 + 2, yN - 2], [nx1 - 6, yN]], { angle: 80, sp: 1.3 });
  },
  /** Col de chemise rabattu. */
  turn(b) {
    const { yN, nx0, nx1, cm, solid, emit, path } = b;
    const cL = smooth([[nx0 + 1, yN - 7], [nx0 - 2, yN + 6], [cm - 3, yN + 12, 1], [cm + 1, yN + 1]], true);
    const cR = smooth([[nx1 - 1, yN - 9], [nx1 + 3, yN + 4], [cm + 5, yN + 12, 1], [cm + 1, yN + 1]], true);
    solid(cL, 'paper', 'ink');
    solid(cR, 'paper', 'ink');
    emit(path('ombre', cR));
  },
  /** Col ouvert sans cravate. */
  open(b) {
    const { yN, nx0, nx1, cm, solid, emit, path } = b;
    const vee = smooth([[nx0 + 2, yN - 4], [cm + 1, yN + 16, 1], [nx1 - 2, yN - 6], [(nx0 + nx1) / 2, yN - 7]], true);
    solid(vee, `skin-${b.s.skin}`, 'ink-soft');
    const cL = smooth([[nx0 + 1, yN - 7], [nx0 - 8, yN + 8], [cm - 4, yN + 16, 1], [cm, yN + 14], [nx0 + 2, yN - 2]], true);
    const cR = smooth([[nx1 - 1, yN - 9], [nx1 + 10, yN + 4], [cm + 6, yN + 16, 1], [cm + 2, yN + 14], [nx1 - 3, yN - 4]], true);
    solid(cL, 'paper', 'ink');
    solid(cR, 'paper', 'ink');
    emit(path('ombre', cR));
  },
  none() {},
};

const TIES = {
  cravat(b) {
    const { yN, cm, solid, emit, path } = b;
    const k = smooth([[cm - 3, yN + 2], [cm + 5, yN + 1], [cm + 4, yN + 7], [cm - 2, yN + 8]], true);
    const tail = smooth([[cm - 3, yN + 6], [cm + 4, yN + 6], [cm + 7, yN + 26], [cm + 1, yN + 30], [cm - 5, yN + 24]], true);
    solid(tail, 'hair-noir', 'ink');
    solid(k, 'hair-noir', 'ink');
    emit(path('rehaut', smooth([[cm - 1, yN + 10], [cm + 2, yN + 12], [cm + 1, yN + 22]], true)));
  },
  tie(b, o) {
    const { yN, cm, solid, emit, path } = b;
    const k = poly([[cm - 2, yN + 2], [cm + 4, yN + 1], [cm + 3, yN + 7], [cm - 1, yN + 7]], true);
    const blade = poly([[cm - 1, yN + 7], [cm + 3, yN + 7], [cm + 6, yN + 42], [cm + 1, yN + 47], [cm - 3, yN + 41]], true);
    solid(blade, o.tieCls ?? 'wash-carmin', 'ink');
    emit(path('hatch', blade));
    solid(k, o.tieCls ?? 'wash-carmin', 'ink');
  },
  bow(b, o) {
    const { yN, cm, solid } = b;
    const x = cm + 1;
    const y = yN + 1;
    const wl = smooth([[x, y], [x - 7, y - 4], [x - 8, y + 4], [x, y + 1]], true);
    const wr = smooth([[x, y], [x + 8, y - 5], [x + 9, y + 3], [x, y + 1]], true);
    solid(wl, o.tieCls ?? 'hair-noir', 'ink');
    solid(wr, o.tieCls ?? 'hair-noir', 'ink');
    solid(ell(x, y + 0.5, 1.8, 2), o.tieCls ?? 'hair-noir', 'ink');
  },
  lavalliere(b, o) {
    const { yN, cm, solid, emit, path } = b;
    const x = cm + 1;
    const y = yN + 3;
    const wl = smooth([[x, y], [x - 9, y - 7], [x - 15, y + 2], [x - 6, y + 8], [x, y + 2]], true);
    const wr = smooth([[x, y], [x + 10, y - 8], [x + 17, y + 1], [x + 8, y + 9], [x, y + 2]], true);
    const t1 = smooth([[x - 1, y + 2], [x - 8, y + 20], [x - 4, y + 34], [x + 1, y + 30], [x + 1, y + 4]], true);
    const t2 = smooth([[x + 1, y + 2], [x + 10, y + 18], [x + 9, y + 32], [x + 4, y + 26], [x, y + 4]], true);
    for (const d of [t1, t2, wl, wr]) solid(d, o.tieCls ?? 'wash-indigo', 'ink');
    emit(path('ink-faint', `${smooth([[x - 2, y + 1], [x - 10, y - 2]])}${smooth([[x + 2, y + 1], [x + 12, y - 1]])}${smooth([[x - 1, y + 6], [x - 4, y + 24]])}`));
    emit(path('ombre', wr), path('ombre', t2));
    solid(ell(x, y + 1, 2.2, 2.6), o.tieCls ?? 'wash-indigo', 'ink');
  },
  scarf(b, o) {
    // écharpe à rayures de faculté
    const { yN, nx0, nx1, cm, solid, emit, path, clipped } = b;
    const wrap = smooth([[nx0 - 6, yN - 8], [nx1 + 6, yN - 12], [nx1 + 8, yN + 2], [(nx0 + nx1) / 2, yN + 8], [nx0 - 8, yN + 4]], true);
    const end = smooth([[cm - 2, yN + 2], [cm + 10, yN], [cm + 14, 205, 1], [cm, 205, 1]], true);
    const end2 = smooth([[nx1 - 2, yN], [nx1 + 10, yN + 2], [nx1 + 16, 205, 1], [nx1 + 2, 205, 1]], true);
    for (const d of [end2, end, wrap]) {
      solid(d, 'paper', 'ink');
      let st = '';
      for (let y = yN - 14; y < 205; y += 6) st += `M0 ${f(y)}L160 ${f(y + 2)}L160 ${f(y + 3)}L0 ${f(y + 1)}Z`;
      emit(clipped(d, path(o.stripes ?? 'wash-carmin', st)));
      emit(path('ink', d));
    }
    emit(path('ombre', end2));
  },
  none() {},
};

const EXTRAS = {
  fernBrooch(b, { x, y }) {
    const { emit, path, solid } = b;
    solid(ell(x, y, 3.6, 4.4), 'wash-safran', 'ink');
    let fr = `M${f(x)} ${f(y + 3.6)}Q${f(x + 0.6)} ${f(y)} ${f(x - 0.4)} ${f(y - 3.8)}`;
    for (let q = 0; q < 4; q++) {
      const yy = y + 2.4 - q * 1.6;
      fr += `M${f(x)} ${f(yy)}l-1.8 -0.9M${f(x + 0.1)} ${f(yy)}l1.8 -1`;
    }
    emit(path('ink', fr, { 'stroke-width': 0.5 }));
  },
  colWatch(b, { x, y }) {
    const { emit, path, solid } = b;
    // nœud d'épingle et montre de col en argent
    solid(smooth([[x - 4, y - 8], [x, y - 6], [x + 4, y - 8], [x + 3, y - 4], [x, y - 5], [x - 3, y - 4]], true), 'paper-shade', 'ink-soft');
    emit(path('ink-soft', `M${f(x)} ${f(y - 5)}l0 2`));
    solid(circ(x, y + 1.6, 4.4), 'paper-shade', 'ink');
    emit(path('rehaut', circ(x, y + 1.6, 3.4)), path('ink-faint', circ(x, y + 1.6, 3.2)));
    emit(path('ink', `M${f(x)} ${f(y + 1.6)}l0 -2.2M${f(x)} ${f(y + 1.6)}l1.6 0.6`, { 'stroke-width': 0.5 }));
    emit(path('ombre', smooth([[x + 1.4, y - 2.4], [x + 4.4, y + 1.6], [x + 1.4, y + 5.8], [x + 3, y + 1.6]], true)));
  },
  pearls(b, o) {
    const { emit, path, yN, nx0, nx1 } = b;
    let d = '';
    const n = o.n ?? 15;
    for (let q = 0; q < n; q++) {
      const t = q / (n - 1);
      const x = lerp(nx0 - 2, nx1 + 2, t);
      const y = lerp(yN + (o.dy ?? 4), yN + (o.dy ?? 4) - 4, t) + Math.sin(t * Math.PI) * (o.sag ?? 10);
      d += circ(x, y, 1.45);
    }
    emit(path('paper', d), path('rehaut', d), path('ink-soft', d, { 'stroke-width': 0.45 }));
    emit(path('ombre', d.replace(/M([\d.-]+) ([\d.-]+)a1\.5 1\.5/g, (m) => m)));
  },
  jade(b, o) {
    const { emit, path, yN, nx0, nx1, cm } = b;
    let d = '';
    const pts = [[nx0 - 2, yN - 1], [nx0 - 4, yN + 30], [cm - 2, yN + 60], [nx1 + 6, yN + 26], [nx1 + 2, yN - 4]];
    const dense = [];
    for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t < 1; t += 0.14) dense.push(lerpPt(pts[i], pts[i + 1], t));
    for (const [x, y] of dense) d += ell(x, y, 1.7, 1.4);
    emit(path('paper', d), path(o.cls ?? 'wash-celadon', d), path(o.cls ?? 'wash-celadon', d), path('ink-soft', d, { 'stroke-width': 0.45 }));
    const [px, py] = [cm - 2, yN + 64];
    const pend = smooth([[px - 3, py - 2], [px + 3, py - 2], [px + 2.5, py + 5], [px, py + 7], [px - 2.5, py + 5]], true);
    b.solid(pend, o.cls ?? 'wash-celadon', 'ink');
    void o;
  },
  slideRule(b, o) {
    const { emit, path, solid, yN, nx1 } = b;
    const x = o.x ?? nx1 + 20;
    const y = o.y ?? yN + 30;
    const d = poly([[x - 2.2, y - 22], [x + 2.6, y - 22.4], [x + 2.6, y + 2], [x - 2.2, y + 2]], true);
    solid(d, 'paper', 'ink');
    let t = '';
    for (let q = 0; q < 9; q++) t += `M${f(x - 2.2)} ${f(y - 20 + q * 2.4)}l${q % 2 ? 1 : 1.8} 0`;
    emit(path('ink', t, { 'stroke-width': 0.4 }), path('ink-soft', `M${f(x + 0.4)} ${f(y - 22)}l0 24`, { 'stroke-width': 0.4 }));
  },
  strap(b, o) {
    // bandoulière en travers de la poitrine et sacoche
    const { emit, path, solid, yN, nx1 } = b;
    const d = poly([[nx1 + 14, yN - 2], [nx1 + 22, yN + 2], [22, 205], [10, 205]], true);
    solid(d, o.cls ?? 'wash-sienne', 'ink');
    emit(path('hatch', d), path('ink-faint', `M${f(nx1 + 17)} ${f(yN + 1)}L15 205`, { 'stroke-dasharray': '1 1' }));
    const bag = smooth([[2, 176, 1], [36, 172, 1], [38, 205, 1], [2, 205, 1]], true, 0);
    solid(bag, o.cls ?? 'wash-sienne', 'ink');
    emit(path('hatch-dense', bag));
    const flap = smooth([[2, 174], [37, 171], [36, 186], [20, 190], [2, 188]], true);
    solid(flap, o.cls ?? 'wash-sienne', 'ink');
    emit(path('hatch', flap));
    b.solid(poly([[17, 186], [23, 186], [23, 192], [17, 192]], true), 'wash-safran', 'ink-soft');
  },
  lorgnette(b, o) {
    // face-à-main pendu à la ceinture par une chaînette
    const { emit, path, solid } = b;
    const x = o.x ?? 30;
    const y = o.y ?? 178;
    const parts = [];
    const pp = (c, d, a) => parts.push(path(c, d, a));
    pp('ink', smooth([[x + 14, 150], [x + 8, 164], [x + 1, y - 10]]), { 'stroke-width': 0.6, 'stroke-dasharray': '0.9 0.7' });
    const handle = smooth([[x - 1.6, y - 11, 1], [x + 1.6, y - 11, 1], [x + 1.4, y + 4, 1], [x - 1.4, y + 4, 1]], true, 0);
    pp('paper', handle);
    pp('wash-safran', handle);
    pp('ink', handle, { 'stroke-width': 0.7 });
    for (const dx of [-6.5, 6.5]) {
      const lens = ell(x + dx, y + 9, 5.4, 4.2);
      pp('paper', lens);
      pp('rehaut', lens);
      pp('ink', lens, { 'stroke-width': 1.1 });
      pp('ombre', ell(x + dx - 1.2, y + 10.2, 3, 2));
    }
    pp('ink', `M${f(x - 1.2)} ${f(y + 8)}q1.2 -2 2.4 0M${f(x)} ${f(y + 4)}l0 2.5`, { 'stroke-width': 0.9 });
    emit(parts.join(''));
    void solid;
  },
  cuffs(b, o) {
    // manchettes de lustrine sur les avant-bras croisés (voir arms)
    void b;
    void o;
  },
};

/* ───────────────────────── Portrait complet ───────────────────────── */

/** Cadre de tirage d'époque : carton, double filet, fenêtre 3:4 (138 × 184). */
export function frame(prefix, mode = 'color') {
  const p = mode === 'photo' ? 'photo-light' : 'paper-shade';
  const win = `M${WIN.x} ${WIN.y + 3}q0 -3 3 -3h${WIN.w - 6}q3 0 3 3v${WIN.h - 6}q0 3 -3 3h-${WIN.w - 6}q-3 0 -3 -3Z`;
  return {
    clip: `<clipPath id="${prefix}-win"><path d="${win}"/></clipPath>`,
    under: `<path class="${p}" d="M0 0h160v200H0Z"/><path class="${mode === 'photo' ? 'photo-paper' : 'paper'}" d="${win}"/>`,
    over:
      `<path class="ink" d="${win}" stroke-width="1"/>` +
      `<path class="ink-soft" d="M5 5h150v190H5Z" stroke-width="0.8"/>` +
      `<path class="ink-faint" d="M7.5 7.5h145v185H7.5Z"/>` +
      `<path class="ink-faint" d="M${WIN.x - 2.5} ${WIN.y - 2.5}h${WIN.w + 5}v${WIN.h + 5}h-${WIN.w + 5}Z"/>`,
  };
}

export function renderPortrait(spec, { prefix, mode = 'color', title } = {}) {
  const fr = frame(prefix, mode);
  const { defs, body } = renderFigure(spec, { prefix, mode });
  const t = title ? `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${VIEWBOX}" role="img">${t}` +
    `<defs>${fr.clip}${defs}</defs>` +
    fr.under +
    `<g clip-path="url(#${prefix}-win)">${body}</g>` +
    fr.over +
    `</svg>\n`
  );
}
