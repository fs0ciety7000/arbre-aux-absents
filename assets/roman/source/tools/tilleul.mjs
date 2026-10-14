/**
 * « Le tilleul aux étiquettes » : illustration de couverture (taille-douce rehaussée d'aquarelle).
 * Un vieux tilleul d'automne dont les branches portent des étiquettes de papier vierges ;
 * au loin, la vallée de la Clairette et les cheminées d'un bourg papetier au crépuscule.
 * Couleurs : classes d'art seulement (DESIGN.md §10). Graine = id (déterministe).
 */
import { Svg, smooth, poly, rect, circ, ell, lerp, f, clamp } from './lib.mjs';

/* ── utilitaires ── */
const rotp = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const xf = (pts, x, y, s, a, sy = 1) =>
  pts.map((p) => {
    const q = rotp([p[0] * s, p[1] * s], a);
    return [x + q[0], y + q[1] * sy, p[2]];
  });

/** Feuille de tilleul (cœur à pointe), tige à l'origine, pointe vers -y. */
const LEAF = [
  [0, -0.1, 1],
  [-0.3, 0.02],
  [-0.58, -0.22],
  [-0.62, -0.55],
  [-0.42, -0.86],
  [-0.12, -1.02],
  [0.04, -1.2, 1],
  [0.18, -1.0],
  [0.48, -0.84],
  [0.64, -0.52],
  [0.58, -0.2],
  [0.32, 0.02],
];

/** Bord tremblé (bande de lavis). */
function ragged(r, x0, x1, y, amp, step = 40) {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) pts.push([x, y + r.jit(amp)]);
  return pts;
}

/** Tube dont on rend aussi le côté d'ombre (droite de la direction de croissance). */
function tubeSides(pts, w0, w1) {
  const n = pts.length;
  const L = [];
  const R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return { L, R };
}

export function buildTilleul(id = 'roman-tilleul', o = {}) {
  const w = o.w ?? 800;
  const h = o.h ?? 1000;
  const S = new Svg(id, w, h, {
    title: 'Le tilleul aux étiquettes',
    desc: "Un vieux tilleul d'automne au crépuscule ; à ses branches pendent des étiquettes de papier vierges. Au loin, une rivière et les cheminées d'un bourg papetier.",
  });
  const r = S.r;
  const HZ = o.horizon ?? 640;

  /* ── Ciel ─────────────────────────────────────────────── */
  S.p('paper', rect(-10, -10, w + 20, h + 20));
  const lil = ragged(r, -20, w + 20, HZ * 0.5, 22, 60);
  S.p('wash-lilas', smooth([[-20, -20, 1], [w + 20, -20, 1], ...lil.reverse().map((p, i, a) => (i === 0 || i === a.length - 1 ? [p[0], p[1], 1] : p))], true, 0.8), { 'fill-opacity': 0.5 });
  const saf = ragged(r, -20, w + 20, HZ * 0.42, 26, 60);
  S.p('wash-safran', smooth([...saf.map((p, i, a) => (i === 0 || i === a.length - 1 ? [p[0], p[1], 1] : p)), [w + 20, HZ + 20, 1], [-20, HZ + 20, 1]], true, 0.8), { 'fill-opacity': 0.55 });
  const car = ragged(r, -20, w + 20, HZ * 0.72, 18, 70);
  S.p('wash-carmin', smooth([...car.map((p, i, a) => (i === 0 || i === a.length - 1 ? [p[0], p[1], 1] : p)), [w + 20, HZ - 30, 1], [-20, HZ - 30, 1]], true, 0.8), { 'fill-opacity': 0.4 });

  // Soleil bas
  const sun = o.sun ?? [628, HZ - 112, 42];
  S.p('rehaut', circ(sun[0], sun[1], sun[2]));
  S.p('wash-safran', circ(sun[0], sun[1], sun[2]), { 'fill-opacity': 0.8 });

  // Tailles du ciel : horizontales, serrées en haut, rompues autour du soleil
  let sl = '';
  for (let y = 6; y < HZ - 40; ) {
    const t = y / HZ;
    let x = -6;
    const yy = y;
    while (x < w + 6) {
      let seg = r.range(60, 260);
      let x2 = Math.min(w + 6, x + seg);
      const dy = Math.abs(yy - sun[1]);
      if (dy < sun[2] + 6) {
        const half = Math.sqrt((sun[2] + 6) ** 2 - dy * dy);
        const a0 = sun[0] - half;
        const a1 = sun[0] + half;
        if (x < a1 && x2 > a0) {
          if (x < a0) sl += `M${f(x)} ${f(yy + r.jit(0.3))}H${f(a0)}`;
          x = a1;
          continue;
        }
      }
      sl += `M${f(x)} ${f(yy + r.jit(0.4))}L${f(x2)} ${f(yy + r.jit(0.4))}`;
      x = x2 + (r() < 0.35 ? r.range(4, 22) : 0);
    }
    y += lerp(3.6, 10, Math.pow(t, 0.9)) * r.range(0.9, 1.1);
  }
  S.ln(sl, 0.5, 'ink-faint', { 'stroke-opacity': 0.6 });
  // anneaux du soleil
  S.ln(circ(sun[0], sun[1], sun[2]), 0.6, 'ink-faint');

  // Nuages en bandes (réserve de papier + lavis rose)
  for (const [cx, cy, cw] of o.clouds ?? [
    [250, HZ - 200, 210],
    [700, HZ - 260, 150],
    [110, HZ - 130, 140],
  ]) {
    const top = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      top.push([cx - cw / 2 + cw * t, cy - Math.sin(t * Math.PI) * r.range(8, 16)]);
    }
    const d = smooth([[cx - cw / 2 - 14, cy + 4, 1], ...top, [cx + cw / 2 + 18, cy + 3, 1], [cx, cy + 7]], true, 0.9);
    S.p('paper', d);
    S.p('wash-carmin', d, { 'fill-opacity': 0.5 });
    S.ln(smooth([[cx - cw / 2 - 14, cy + 4], [cx - cw * 0.1, cy + 7], [cx + cw / 2 + 18, cy + 3]]), 0.5, 'ink-faint');
  }
  // Oiseaux
  let birds = '';
  for (const [bx, by, bs] of [
    [640, 470, 7],
    [662, 482, 5],
    [620, 492, 4.5],
  ]) birds += `M${f(bx - bs)} ${f(by - bs * 0.3)}Q${f(bx - bs * 0.4)} ${f(by - bs * 0.6)} ${f(bx)} ${f(by)}Q${f(bx + bs * 0.4)} ${f(by - bs * 0.6)} ${f(bx + bs)} ${f(by - bs * 0.35)}`;
  S.ln(birds, 0.8, 'ink-soft');

  /* ── Collines lointaines ──────────────────────────────── */
  const far = [];
  for (let x = -20; x <= w + 40; x += 40) far.push([x, HZ - 70 + Math.sin(x / 130) * 22 + r.jit(7)]);
  const farD = smooth([...far, [w + 40, HZ + 10, 1], [-20, HZ + 10, 1]], true, 0.6);
  S.wash(farD, 'wash-ardoise', 'wash-lilas');
  S.within(farD, () => {
    let d = '';
    for (let y = HZ - 110; y < HZ + 10; y += 3.4) d += `M-20 ${f(y)}H${w + 20}`;
    S.ln(d, 0.5, 'ink-faint', { 'stroke-opacity': 0.6 });
  });
  S.ln(smooth(far), 0.7, 'ink-soft');

  const mid = [];
  for (let x = -20; x <= w + 40; x += 36) mid.push([x, HZ - 22 + Math.sin(x / 90 + 2) * 14 + r.jit(5)]);
  const midD = smooth([...mid, [w + 40, HZ + 30, 1], [-20, HZ + 30, 1]], true, 0.6);
  S.wash(midD, 'wash-sauge', 'wash-ardoise');
  S.p('hatch', midD, { 'fill-opacity': 0.7 });
  S.ln(smooth(mid), 0.8, 'ink-soft');

  /* ── Plaine, champs ───────────────────────────────────── */
  const plainY = HZ + 6;
  const plain = rect(-20, plainY, w + 40, h - plainY + 20);
  S.wash(plain, 'wash-sauge', null);
  // champs en perspective : bandes horizontales irrégulières
  let fy = plainY;
  let k = 0;
  const fieldCls = ['wash-sienne', 'wash-safran', null, 'wash-sienne', null, 'wash-safran'];
  while (fy < HZ + 150) {
    const hgt = lerp(6, 26, (fy - plainY) / 150) * r.range(0.8, 1.2);
    let x = -20;
    while (x < w + 20) {
      const fw = r.range(70, 190) * lerp(0.7, 1.4, (fy - plainY) / 150);
      const d = poly([
        [x, fy],
        [x + fw, fy + r.jit(1)],
        [x + fw + r.jit(6), fy + hgt],
        [x + r.jit(6), fy + hgt],
      ], true);
      const c = fieldCls[(k + Math.floor(x / 90)) % fieldCls.length];
      if (c) S.p(c, d, { 'fill-opacity': 0.3 });
      // sillons
      let fur = '';
      const ns = Math.max(1, Math.floor(hgt / 4));
      if ((k * 7) % 3 === 0) for (let i = 1; i < ns; i++) fur += `M${f(x + 2)} ${f(fy + (hgt * i) / ns)}H${f(x + fw - 2)}`;
      S.ln(fur, 0.5, 'ink-faint', { 'stroke-opacity': 0.55 });
      S.ln(`M${f(x + fw)} ${f(fy)}L${f(x + fw)} ${f(fy + hgt)}`, 0.5, 'ink-faint');
      x += fw;
      k++;
    }
    fy += hgt;
  }

  /* ── Rivière ──────────────────────────────────────────── */
  const riv = o.river ?? [
    [w + 20, HZ + 14],
    [640, HZ + 22],
    [520, HZ + 30],
    [420, HZ + 46],
    [250, HZ + 58],
    [100, HZ + 82],
    [-20, HZ + 100],
  ];
  const { L: rl, R: rr } = tubeSides(riv, 5, 34);
  const rivD = smooth([...rl, ...rr.reverse()], true, 0.7);
  S.p('paper', rivD);
  S.p('water', rivD);
  S.within(rivD, () => {
    let d = '';
    for (let y = HZ + 10; y < HZ + 120; y += 2.6) {
      let x = -20;
      while (x < w + 20) {
        const L = r.range(6, 30);
        if (r() < 0.6) d += `M${f(x)} ${f(y)}h${f(L)}`;
        x += L + r.range(4, 18);
      }
    }
    S.ln(d, 0.5, 'water', { stroke: 'currentColor' });
  });
  S.ln(smooth(rl), 0.7, 'ink-soft');
  S.ln(smooth(rr), 0.7, 'ink-soft');

  /* ── Bourg papetier (cheminées, ateliers à sheds, maisons) ─ */
  const town = o.town ?? { x: 190, y: HZ + 22 };
  townAt(S, town.x, town.y);

  /* ── Peupliers le long de l'eau ───────────────────────── */
  for (const [px, py, ph] of o.poplars ?? [
    [610, HZ + 30, 40],
    [634, HZ + 28, 50],
    [660, HZ + 25, 38],
    [40, HZ + 92, 40],
    [330, HZ + 52, 34],
  ]) {
    const d = smooth([[px, py, 1], [px - ph * 0.17, py - ph * 0.4], [px - 2, py - ph * 0.9], [px + 1, py - ph], [px + ph * 0.16, py - ph * 0.5], [px + 2, py, 1]], true, 0.9);
    S.wash(d, 'wash-safran', 'wash-sienne');
    S.p('hatch', d, { 'fill-opacity': 0.8 });
    S.ln(d, 0.6, 'ink-soft');
    S.ln(`M${f(px)} ${f(py)}v-6`, 0.8, 'ink');
  }

  /* ── Avant-plan : talus d'herbe ───────────────────────── */
  const gy = o.groundY ?? 850;
  const ground = [];
  for (let x = -20; x <= w + 40; x += 40) ground.push([x, gy + Math.pow((x - 420) / 420, 2) * 40 + r.jit(4)]);
  const groundD = smooth([...ground, [w + 40, h + 20, 1], [-20, h + 20, 1]], true, 0.6);
  S.wash(groundD, 'wash-sauge', 'wash-sienne');
  S.within(groundD, () => {
    S.ln(
      (() => {
        let d = '';
        for (let y = gy - 40; y < h + 10; y += 3.2 + (y - gy) * 0.012) d += `M-20 ${f(y + r.jit(1))}H${w + 20}`;
        return d;
      })(),
      0.5,
      'ink-faint',
      { 'stroke-opacity': 0.6 },
    );
    S.p('hatch', rect(-20, gy + 40, w + 40, h), { 'fill-opacity': 0.5 });
  });
  S.ln(smooth(ground), 1, 'ink-soft');

  /* ── Arbre ────────────────────────────────────────────── */
  const base = o.base ?? [416, gy + 8];
  const crown = o.crown ?? { cx: 410, cy: 380, rx: 335, ry: 290 };
  const branches = [];
  const trunkTop = [base[0] - 10, base[1] - 300];
  const trunkPts = [base, [base[0] - 4, base[1] - 90], [base[0] + 8, base[1] - 200], trunkTop];

  function inside(p) {
    return ((p[0] - crown.cx) / crown.rx) ** 2 + ((p[1] - crown.cy) / crown.ry) ** 2 < 1;
  }
  function grow(p0, ang, len, wid, depth) {
    const pts = [p0];
    let a = ang;
    let p = p0;
    const n = 4;
    for (let i = 0; i < n; i++) {
      a += r.jit(0.14);
      // les branches basses s'inclinent, les hautes se redressent
      const droop = Math.sin(a) * 0.035 * depth;
      a += a > 0 ? droop : -droop;
      let q = [p[0] + Math.sin(a) * (len / n), p[1] - Math.cos(a) * (len / n)];
      if (!inside(q) && i > 0) {
        break;
      }
      pts.push(q);
      p = q;
    }
    if (pts.length < 2) return;
    const w1 = Math.max(0.8, wid * 0.6);
    branches.push({ pts, w0: wid, w1, depth });
    if (depth >= 5 || w1 < 1) return;
    const end = pts[pts.length - 1];
    const kids = r() < 0.35 ? 3 : 2;
    for (let c = 0; c < kids; c++) {
      const sp = kids === 3 ? (c - 1) * 0.5 : (c ? 1 : -1) * r.range(0.26, 0.5);
      grow(end, a + sp + r.jit(0.1), len * r.range(0.62, 0.8), w1 * 0.92, depth + 1);
    }
    // rameau latéral à mi-longueur
    if (pts.length > 2 && r() < 0.75) {
      const m = pts[Math.floor(pts.length / 2)];
      const side = r() < 0.5 ? -1 : 1;
      grow(m, a + side * r.range(0.6, 0.95), len * 0.5, wid * 0.5, depth + 1);
    }
  }
  for (const [ang, len, wid] of o.limbs ?? [
    [-1.05, 250, 30],
    [-0.45, 220, 34],
    [0.08, 210, 56],
    [0.55, 230, 32],
    [1.12, 220, 26],
  ]) {
    const start = ang === 0.08 ? [trunkTop[0], trunkTop[1] + 12] : [trunkTop[0] + ang * 18, trunkTop[1] + 30 + Math.abs(ang) * 40];
    grow(start, ang, len, wid, 1);
  }
  // ombre portée au pied
  S.p('ombre', ell(base[0] + 60, base[1] + 6, 230, 22));

  // Brindilles (traits) d'abord, puis branches, profondes en arrière
  branches.sort((a, b) => b.depth - a.depth);
  const twigs = [];
  for (const b of branches) {
    if (b.w0 < 3.2) {
      S.ln(smooth(b.pts), clamp((b.w0 + b.w1) / 2.2, 0.6, 1.5), 'ink-soft');
      const e = b.pts[b.pts.length - 1];
      twigs.push(e);
      continue;
    }
    const { L, R } = tubeSides(b.pts, b.w0, b.w1);
    const d = smooth([...L, ...R.slice().reverse()], true, 0.7);
    S.wash(d, 'wash-sienne', b.depth < 2 ? 'wash-ardoise' : null);
    const shade = smooth([...b.pts, ...R.slice().reverse()], true, 0.7);
    S.p(b.w0 > 14 ? 'hatch-dense' : 'hatch', shade);
    S.ln(d, b.w0 > 10 ? 1.1 : 0.8, 'ink');
    if (b.depth >= 3) twigs.push(b.pts[b.pts.length - 1]);
  }
  // Tronc et empattements
  for (const [dx, wv] of [
    [-70, 26],
    [64, 24],
    [-26, 18],
  ]) {
    const root = [
      [base[0] + dx * 0.15, base[1] - 50],
      [base[0] + dx * 0.55, base[1] - 8],
      [base[0] + dx, base[1] + 10],
    ];
    const { L, R } = tubeSides(root, wv, 3);
    const d = smooth([...L, ...R.slice().reverse()], true, 0.7);
    S.wash(d, 'wash-sienne', 'wash-ardoise');
    S.p('hatch', d);
    S.ln(d, 1, 'ink');
  }
  {
    const { L, R } = tubeSides(trunkPts, 96, 58);
    const d = smooth([...L, ...R.slice().reverse()], true, 0.7);
    S.wash(d, 'wash-sienne', 'wash-ardoise');
    S.within(d, () => {
      // écorce : sillons verticaux ondulés, plus serrés côté ombre (droite)
      let bark = '';
      for (let xx = -40; xx <= 40; xx += r.range(2.6, 5)) {
        const pts = [];
        for (let t = 0; t <= 1.0001; t += 0.1) {
          const c = [lerp(base[0], trunkTop[0], t) + (t < 0.5 ? -4 * t : 6 * (t - 0.5)), lerp(base[1] + 8, trunkTop[1] - 20, t)];
          const half = lerp(48, 29, t);
          pts.push([c[0] + (xx / 40) * half + Math.sin(t * 9 + xx) * 1.6, c[1]]);
        }
        bark += smooth(pts);
      }
      S.ln(bark, 0.6, 'ink-soft');
      S.p('hatch-dense', smooth([...trunkPts, ...R.slice().reverse()], true, 0.7));
      S.p('hatch-dense', smooth([...trunkPts.map(([x, y]) => [x + 8, y]), ...R.slice().reverse()], true, 0.7));
    });
    // nœud
    S.wash(ell(base[0] - 14, base[1] - 150, 7, 11), 'wash-sienne', 'hair-brun');
    S.ln(ell(base[0] - 14, base[1] - 150, 7, 11), 0.9, 'ink');
    S.ln(ell(base[0] - 14, base[1] - 150, 11, 16), 0.6, 'ink-soft');
    // contour sans chapeau : le tronc se prolonge dans la maîtresse branche
    S.ln(smooth(L), 1.4, 'ink');
    S.ln(smooth(R), 1.4, 'ink');
  }

  /* ── Feuilles (lavis fusionnés par couleur) ───────────── */
  const leafSets = { 'wash-safran': '', 'wash-sienne': '', 'wash-sauge': '', 'wash-carmin': '' };
  let leafAll = '';
  let ribs = '';
  const addLeaf = (x, y, s, a, sy = 1, cls) => {
    const pts = xf(LEAF, x, y, s, a, sy);
    const d = smooth(pts, true, 0.9);
    leafAll += d;
    leafSets[cls] += d;
    const tip = xf([[0, -1.1]], x, y, s, a, sy)[0];
    const stem = xf([[0, 0.35]], x, y, s, a, sy)[0];
    ribs += `M${f(stem[0])} ${f(stem[1])}L${f(tip[0])} ${f(tip[1])}`;
  };
  const pickCls = () => {
    const v = r();
    return v < 0.58 ? 'wash-safran' : v < 0.9 ? 'wash-sienne' : v < 0.96 ? 'wash-sauge' : 'wash-carmin';
  };
  const seen = new Set();
  for (const t of twigs) {
    if (r() < (o.sparse ?? 0.3)) continue;
    const key = `${Math.round(t[0] / 26)},${Math.round(t[1] / 22)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const n = r.int(3, 6);
    for (let i = 0; i < n; i++) {
      addLeaf(t[0] + r.jit(22), t[1] + r.jit(18), r.range(10, 14), Math.PI + r.jit(1.4), 1, pickCls());
    }
  }
  // feuilles qui tombent
  for (let i = 0; i < (o.falling ?? 16); i++) {
    const x = r.range(60, w - 60);
    const y = r.range(HZ - 140, gy - 20);
    if (Math.abs(x - base[0]) < 60) continue;
    addLeaf(x, y, r.range(7, 10), r.range(0, Math.PI * 2), r.range(0.45, 1), pickCls());
  }
  // feuilles tombées
  for (let i = 0; i < (o.fallen ?? 70); i++) {
    const x = r.range(-10, w + 10);
    const y = r.range(gy + 10, h + 6);
    addLeaf(x, y, r.range(8, 13), r.range(0, Math.PI * 2), 0.45, pickCls());
  }
  S.p('paper', leafAll);
  for (const [cls, d] of Object.entries(leafSets)) if (d) S.p(cls, d);
  S.ln(leafAll, 0.55, 'ink-soft', { 'stroke-opacity': 0.8 });
  S.ln(ribs, 0.5, 'ink-faint');

  /* ── Étiquettes vierges ───────────────────────────────── */
  // points d'accroche sur les branches moyennes, bien répartis
  const cand = [];
  for (const b of branches) {
    if (b.depth < 2 || b.depth > 4) continue;
    for (let i = 1; i < b.pts.length; i++) {
      const p = b.pts[i];
      if (p[1] < (o.tagMinY ?? 150) || p[1] > (o.tagMaxY ?? 560)) continue;
      if (Math.abs(p[0] - base[0]) < 40 && p[1] > 460) continue;
      cand.push([p[0], p[1], b.w1]);
    }
  }
  // tri déterministe pseudo-aléatoire
  cand.sort((a, b) => ((a[0] * 7.13 + a[1] * 3.7) % 11) - ((b[0] * 7.13 + b[1] * 3.7) % 11));
  const tags = [];
  for (const c of cand) {
    if (tags.length >= (o.tags ?? 9)) break;
    if (c[0] < 70 || c[0] > w - 70) continue;
    if (tags.some((t) => Math.hypot(t[0] - c[0], t[1] - c[1]) < (o.tagGap ?? 92))) continue;
    tags.push(c);
  }
  for (const [x, y] of tags) {
    const str = r.range(18, 46);
    const rot = r.jit(0.22);
    const ex = x + Math.sin(rot) * -str * 0.3;
    const ey = y + str;
    S.ln(`M${f(x)} ${f(y)}Q${f(x + r.jit(6))} ${f(y + str * 0.6)} ${f(ex)} ${f(ey)}`, 0.7, 'ink-soft');
    S.ln(`M${f(x - 3)} ${f(y - 1)}q3 4 6 0`, 0.7, 'ink-soft');
    tagAt(S, ex, ey, rot, o.tagScale ?? 1);
  }
  // une étiquette tombée dans l'herbe
  if (o.fallenTag !== false) {
    const [fx, fy] = o.fallenTag ?? [560, gy + 52];
    S.open({ transform: `translate(${fx} ${fy}) scale(1 0.5) rotate(68)` });
    tagAt(S, 0, 0, 0, o.tagScale ?? 1, { shadow: true });
    S.ln('M0 0q-18 10 -30 4t-26 8', 0.7, 'ink-soft');
    S.close();
  }

  // brins d'herbe au premier plan
  let grass = '';
  for (let x = -10; x < w + 10; x += r.range(3, 7)) {
    const y = h + 4 - r.range(0, 30);
    const hh = r.range(8, 22);
    grass += `M${f(x)} ${f(y)}q${f(r.jit(3))} ${f(-hh * 0.6)} ${f(r.jit(6))} ${f(-hh)}`;
  }
  S.ln(grass, 0.6, 'ink-soft');

  return S;
}

/** Étiquette de papier (eyelet à l'origine, pend vers le bas). */
export function tagAt(S, x, y, rot, s = 1, { shadow = false } = {}) {
  const W = 17 * s;
  const H = 56 * s;
  const c = 6 * s;
  const pts = [
    [-W + c, -6 * s],
    [W - c, -6 * s],
    [W, -6 * s + c],
    [W, H],
    [-W, H],
    [-W, -6 * s + c],
  ];
  const a = rot;
  const P = pts.map((p) => {
    const q = rotp(p, a);
    return [x + q[0], y + q[1]];
  });
  const d = poly(P, true);
  if (shadow) S.p('ombre', poly(P.map(([px, py]) => [px + 4, py + 5]), true));
  S.p('paper', d);
  S.p('rehaut', d);
  // côté d'ombre (le papier tourne un peu)
  const sh = [
    [W - 5 * s, -6 * s + c * 0.6],
    [W, -6 * s + c],
    [W, H],
    [W - 5 * s, H],
  ].map((p) => {
    const q = rotp(p, a);
    return [x + q[0], y + q[1]];
  });
  S.p('hatch', poly(sh, true));
  // renfort de l'œillet
  const e = rotp([0, 2 * s], a);
  S.p('wash-sienne', circ(x + e[0], y + e[1], 6 * s));
  S.ln(circ(x + e[0], y + e[1], 6 * s), 0.6, 'ink-soft');
  S.black(circ(x + e[0], y + e[1], 2.2 * s));
  // lignes « Nom » vierges (pointillé) : la case attend son nom
  let lines = '';
  for (const yy of [22, 32, 42]) {
    const p0 = rotp([-W + 5 * s, yy * s], a);
    const p1 = rotp([W - 7 * s, yy * s], a);
    lines += `M${f(x + p0[0])} ${f(y + p0[1])}L${f(x + p1[0])} ${f(y + p1[1])}`;
  }
  S.ln(lines, 0.5, 'ink-faint', { 'stroke-dasharray': '1 2' });
  S.ln(d, 0.9, 'ink');
}

/** Petit bourg papetier : ateliers à sheds, deux cheminées et leurs fumées, maisons, clocher. */
function townAt(S, x, y) {
  const r = S.r;
  // fumées (réserve de papier + trait), dérivant vers la gauche
  for (const [cx, top, k] of [
    [x + 40, y - 92, 1],
    [x + 78, y - 76, 0.8],
  ]) {
    const pts = [];
    for (let i = 0; i < 6; i++) pts.push([cx - i * 9 * k - i * i * 1.2, top - i * 8 - Math.sin(i) * 3]);
    const up = pts.map(([px, py], i) => [px, py - 2 - i * 1.4]);
    const dn = pts.map(([px, py], i) => [px, py + 2 + i * 1.4]);
    const d = smooth([...up, ...dn.reverse()], true, 0.8);
    S.p('paper', d, { opacity: 0.85 });
    S.p('wash-ardoise', d, { 'fill-opacity': 0.25 });
    S.ln(d, 0.5, 'ink-faint');
  }
  // cheminées de brique
  for (const [cx, top, cw] of [
    [x + 40, y - 92, 7],
    [x + 78, y - 76, 6],
  ]) {
    const d = poly([[cx - cw / 2 - 1, y], [cx - cw / 2, top], [cx + cw / 2, top], [cx + cw / 2 + 1, y]], true);
    S.wash(d, 'wash-sienne', 'wash-carmin');
    S.p('hatch', d);
    S.ln(d, 0.7, 'ink');
    S.ln(`M${f(cx - cw / 2 - 1)} ${f(top + 3)}h${f(cw + 2)}`, 0.7, 'ink');
  }
  // ateliers à sheds
  const mw = 120;
  const mx = x - 10;
  const body = rect(mx, y - 18, mw, 18);
  S.wash(body, 'wash-safran', 'wash-ardoise');
  let saw = `M${mx} ${y - 18}`;
  for (let i = 0; i < 8; i++) saw += `l${mw / 16} -8l${mw / 16} 8`;
  const roof = `${saw}Z`;
  S.wash(roof, 'wash-ardoise', null);
  S.p('hatch-dense', roof, { 'fill-opacity': 0.6 });
  S.ln(roof, 0.6, 'ink-soft');
  let win = '';
  for (let i = 0; i < 10; i++) win += rect(mx + 6 + i * 11.4, y - 13, 5, 7);
  S.p('wash-safran', win);
  S.ln(win, 0.5, 'ink-soft');
  S.ln(body, 0.7, 'ink');
  // maisons et clocher, à gauche du moulin
  const houses = [
    [x - 70, 18, 14],
    [x - 52, 14, 12],
    [x - 34, 20, 15],
    [x - 100, 14, 11],
    [x - 118, 16, 12],
  ];
  for (const [hx, hw, hh] of houses) {
    const wall = rect(hx, y - hh * 0.6, hw, hh * 0.6);
    const roofD = poly([[hx - 1.5, y - hh * 0.6], [hx + hw / 2, y - hh * 1.25], [hx + hw + 1.5, y - hh * 0.6]], true);
    S.wash(wall, 'wash-safran', null);
    S.ln(wall, 0.5, 'ink-soft');
    S.wash(roofD, 'wash-carmin', null);
    S.p('hatch', roofD);
    S.ln(roofD, 0.6, 'ink-soft');
    S.p('wash-safran', rect(hx + hw * 0.35, y - hh * 0.4, 2.4, 3));
  }
  // clocher
  const cx = x - 86;
  const tower = rect(cx - 4, y - 30, 8, 30);
  const spire = poly([[cx - 5, y - 30], [cx, y - 52], [cx + 5, y - 30]], true);
  S.wash(tower, 'wash-ardoise', null);
  S.ln(tower, 0.6, 'ink-soft');
  S.wash(spire, 'wash-ardoise', null);
  S.p('hatch-dense', spire);
  S.ln(spire, 0.6, 'ink');
  S.ln(`M${cx} ${y - 52}v-5M${cx - 2} ${y - 55}h4`, 0.5, 'ink-soft');
  void r;
  void clamp;
}

/** Vignette : rameau de tilleul, quelques feuilles et une étiquette vierge (fond transparent). */
export function buildVignette(id = 'roman-rameau', { w = 420, h = 300, tag = true, flip = false } = {}) {
  const S = new Svg(id, w, h, {
    title: 'Rameau de tilleul et étiquette vierge',
    desc: "Un rameau de tilleul d'automne auquel pend une étiquette de papier sans nom.",
  });
  const r = S.r;
  if (flip) S.open({ transform: `translate(${w} 0) scale(-1 1)` });
  const main = [[6, 70], [90, 84], [190, 80], [290, 98], [372, 128]];
  const subs = [
    [[150, 82], [196, 48], [236, 34]],
    [[250, 90], [290, 136], [304, 170]],
    [[90, 84], [120, 120], [126, 146]],
  ];
  const leaves = [
    [236, 34, 46, 2.2, 'wash-safran'],
    [304, 170, 42, 3.3, 'wash-sienne'],
    [372, 128, 48, 2.5, 'wash-safran'],
    [126, 146, 40, 3.0, 'wash-safran'],
    [56, 74, 30, 0.5, 'wash-sienne'],
  ];
  for (const s of subs) {
    const { L, R } = tubeSides(s, 4.2, 1.4);
    const d = smooth([...L, ...R.slice().reverse()], true, 0.7);
    S.wash(d, 'wash-sienne', null);
    S.ln(d, 0.8, 'ink');
  }
  {
    const { L, R } = tubeSides(main, 11, 2);
    const d = smooth([...L, ...R.slice().reverse()], true, 0.7);
    S.wash(d, 'wash-sienne', 'wash-ardoise');
    S.p('hatch', smooth([...main, ...R.slice().reverse()], true, 0.7));
    S.ln(d, 1.1, 'ink');
    // bourgeons
    for (const [x, y] of [[132, 80], [214, 84], [330, 110]]) S.black(ell(x, y - 4, 2, 3.4));
  }
  for (const [x, y, s, a, cls] of leaves) {
    const P = LEAF.map(([px, py, c]) => {
      const q = rotp([px * s, py * s], a);
      return [x + q[0], y + q[1], c];
    });
    const d = smooth(P, true, 0.9);
    S.wash(d, cls, null);
    S.ln(d, 0.8, 'ink-soft');
    const tip = rotp([0, -1.12 * s], a);
    let v = `M${f(x)} ${f(y)}L${f(x + tip[0])} ${f(y + tip[1])}`;
    for (const t of [0.3, 0.55, 0.78]) {
      const c = [x + tip[0] * t, y + tip[1] * t];
      for (const sd of [-1, 1]) {
        const q = rotp([sd * s * 0.36, -s * 0.22], a);
        v += `M${f(c[0])} ${f(c[1])}l${f(q[0])} ${f(q[1])}`;
      }
    }
    S.ln(v, 0.5, 'ink-faint');
    S.ln(`M${f(x)} ${f(y)}l${f(rotp([0, s * 0.3], a)[0])} ${f(rotp([0, s * 0.3], a)[1])}`, 0.7, 'ink-soft');
  }
  if (tag) {
    const hx = 214;
    const hy = 84;
    S.ln(`M${hx} ${hy}Q${hx + 4} ${hy + 40} ${hx - 2} ${hy + 70}`, 0.8, 'ink-soft');
    S.ln(`M${hx - 4} ${hy - 1}q4 6 8 0`, 0.8, 'ink-soft');
    tagAt(S, hx - 2, hy + 70, 0.12, 2);
  }
  if (flip) S.close();
  void r;
  return S;
}
