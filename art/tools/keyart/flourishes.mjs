/**
 * Ornements animés : traits prêts pour le tracé (`pathLength="1"` → stroke-dasharray: 1 ;
 * stroke-dashoffset: 1 → 0), groupes nommés pour le choc du tampon et du cachet.
 * Fonctionnent en palette papier comme sous `on-night`.
 */
import { circ, f, lerp, smooth, Svg } from './lib.mjs';
import { sealAt, SPOTS } from './spots.mjs';
import { text } from './objects.mjs';

void SPOTS;

/** Pinnule de la vigne : contour fermé (pour le trait) depuis la tige. */
function leaflet(p, ang, L, wv) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  const tip = [p[0] + dx * L, p[1] + dy * L, 1];
  const m1 = [p[0] + dx * L * 0.45 + nx * wv, p[1] + dy * L * 0.45 + ny * wv];
  const m2 = [p[0] + dx * L * 0.5 - nx * wv * 0.7, p[1] + dy * L * 0.5 - ny * wv * 0.7];
  return smooth([[p[0], p[1], 1], m1, tip, m2], true, 0.9);
}

/** Vigne de fougère pour séparateur de section : tracée du centre vers les bords. */
export function fernVine(id = 'flourish-fern-vine') {
  const W = 640;
  const H = 72;
  const S = new Svg(id, W, H, { title: 'Ornement : vigne de fougère' });
  const cy = 38;
  const stems = [];
  const leaves = [];
  for (const side of [-1, 1]) {
    // tige ondulée du centre vers le bord, terminée par une crosse (spirale)
    const pts = [];
    const x0 = 320 + side * 14;
    const x1 = 320 + side * 262;
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([lerp(x0, x1, t), cy + Math.sin(t * Math.PI * 3) * 7 * (1 - t * 0.4)]);
    }
    const end = pts[pts.length - 1];
    // crosse : la spirale s'enroule vers le haut puis vers l'intérieur
    const spiral = [];
    const turns = 1.7;
    const R0 = 15;
    const c = [end[0], end[1] - R0];
    for (let i = 1; i <= 26; i++) {
      const t = i / 26;
      const a = Math.PI / 2 - side * t * turns * Math.PI * 2;
      const rr = R0 * (1 - t * 0.82);
      spiral.push([c[0] + Math.cos(a) * rr * side * -1 * -1, c[1] + Math.sin(a) * rr]);
    }
    stems.push(smooth([...pts, ...spiral]));
    // pinnules le long de la tige, décroissantes
    for (let i = 2; i < n - 2; i += 2) {
      const t = i / n;
      const p = pts[i];
      const q = pts[i + 1];
      const ta = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const L = 26 * (1 - t * 0.65);
      for (const up of [-1, 1]) {
        const ang = ta + up * side * 0.9 * -1;
        leaves.push({ d: leaflet(p, ang + (up < 0 ? 0 : 0), L, L * 0.24), t, side, up });
      }
    }
  }
  // bouton central
  const bud = smooth(
    [
      [320, cy - 14, 1],
      [328, cy],
      [320, cy + 12, 1],
      [312, cy],
    ],
    true,
  );
  // ordre de tracé : par distance au centre
  leaves.sort((a, b) => a.t - b.t || a.side - b.side || a.up - b.up);

  S.comment(
    `${id}-washes : lavis des pinnules (fondu 0 → 1 après le trait) ; ${id}-stem : deux tiges + bouton (pathLength=1, stroke-dashoffset 1 → 0, 900 ms) ; ${id}-leaves : pinnules dans l'ordre du centre vers les bords (même technique, retard i × 25 ms).`,
  );
  S.open({ id: `${id}-washes` });
  S.p('wash-sauge', leaves.map((l) => l.d).join(''));
  S.p('wash-safran', bud);
  S.close();
  S.open({ id: `${id}-stem` });
  for (const d of stems) S.p('ink', d, { 'stroke-width': 1.6, pathLength: 1 });
  S.p('ink', bud, { 'stroke-width': 1.2, pathLength: 1 });
  S.close();
  S.open({ id: `${id}-leaves` });
  for (const l of leaves) S.p('ink-soft', l.d, { 'stroke-width': 1, pathLength: 1 });
  S.close();
  S.p('ink', circ(320 - 24, cy, 2) + circ(320 + 24, cy, 2), { fill: 'currentColor' });
  return String(S);
}

/** Cachet de cire : choc (anneau, éclats), cire, fougère en relief. Origine 80 80. */
export function seal(id = 'flourish-seal') {
  const S = new Svg(id, 160, 160, { title: 'Cachet de cire à la fougère' });
  const r = S.r;
  S.comment(
    `Origine de tous les groupes : 80px 80px (transform-box: view-box). ${id}-ring : anneau de choc, scale(.6) → 1.25 + opacité 1 → 0 (420 ms) ; ${id}-burst : éclats (pathLength=1, dashoffset 1 → 0 puis fondu) ; ${id}-wax : la cire frappe, scale(1.35) → 1 (--ease-stamp, --dur-stamp).`,
  );
  S.open({ id: `${id}-ring` });
  S.p('ink-faint', circ(80, 80, 66), { 'stroke-width': 1.4, pathLength: 1 });
  S.p('ink-faint', circ(80, 80, 72), { 'stroke-width': 0.6, 'stroke-dasharray': '2 5' });
  S.close();
  S.open({ id: `${id}-burst` });
  let drops = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + r.jit(0.12);
    const r0 = 52 + r.jit(3);
    const r1 = r0 + r.range(8, 16);
    S.p(
      'ink-soft',
      `M${f(80 + Math.cos(a) * r0)} ${f(80 + Math.sin(a) * r0)}L${f(80 + Math.cos(a) * r1)} ${f(80 + Math.sin(a) * r1)}`,
      { 'stroke-width': 1.4, pathLength: 1 },
    );
    if (i % 3 === 1)
      drops += circ(
        80 + Math.cos(a + 0.2) * (r1 - 2),
        80 + Math.sin(a + 0.2) * (r1 - 2),
        r.range(1.5, 3),
      );
  }
  S.p('hair-roux', drops);
  S.p('wash-carmin', drops);
  S.close();
  S.open({ id: `${id}-wax` });
  sealAt(S, 80, 80, 46);
  S.close();
  return String(S);
}

/** Tampon « ÉTABLI » : cadre double tracé, mot, date, usure du caoutchouc. Origine 120 55. */
export function tampon(id = 'flourish-tampon') {
  const S = new Svg(id, 240, 110, { title: 'Tampon « ÉTABLI »' });
  const r = S.r;
  S.comment(
    `${id}-ink : l'empreinte entière ; origine 120px 55px ; frappe : scale(var(--stamp-from)) → 1 + opacité 0 → 1 (--ease-stamp, --dur-stamp), retard rang × --stagger. Variante tracée : ${id}-frame (pathLength=1). Usure : masque alpha ${id}-worn (suit la frappe).`,
  );
  // usure du caoutchouc : masque alpha percé de grains (indépendant de la palette)
  let holes = 'M0 0H240V110H0Z';
  for (let i = 0; i < 110; i++) holes += circ(r.range(28, 212), r.range(16, 94), r.range(0.4, 1.4));
  S.defs.push(
    `<mask id="${id}-worn" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="110"><path class="paper" fill-rule="evenodd" d="${holes}"/></mask>`,
  );
  S.open({ id: `${id}-ink`, transform: 'rotate(-5 120 55)' });
  S.open({ mask: `url(#${id}-worn)` });
  S.open({ id: `${id}-frame` });
  const rr = (x, y, w, h, q) =>
    `M${x + q} ${y}H${x + w - q}Q${x + w} ${y} ${x + w} ${y + q}V${y + h - q}Q${x + w} ${y + h} ${x + w - q} ${y + h}H${x + q}Q${x} ${y + h} ${x} ${y + h - q}V${y + q}Q${x} ${y} ${x + q} ${y}Z`;
  S.p('ink', rr(30, 18, 180, 74, 9), { 'stroke-width': 3.2, pathLength: 1 });
  S.p('ink', rr(37, 25, 166, 60, 6), { 'stroke-width': 1.1, pathLength: 1 });
  S.p('ink', 'M50 74H190', { 'stroke-width': 0.8, pathLength: 1 });
  S.close();
  text(S, 120, 66, 'ÉTABLI', { cls: 'label-major', size: 30, anchor: 'middle' });
  text(S, 120, 85, 'Office de Réinscription civile', {
    cls: 'label-note',
    size: 8,
    anchor: 'middle',
  });
  S.close();
  S.close();
  return String(S);
}
