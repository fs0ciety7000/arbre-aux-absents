/**
 * Vignettes (spot illustrations) : cartes du site, états vides du jeu. viewBox 240 × 200,
 * fond transparent posé sur une tache d'aquarelle, objet gravé et rehaussé de lavis.
 * Fonctionnent en palette papier comme sous `on-night` (aucun aplat d'encre plein).
 */
import {
  arc,
  blob,
  circ,
  ell,
  f,
  handLines,
  hatchLines,
  lerp,
  poly,
  rect,
  rrect,
  smooth,
  Svg,
  tube,
} from './lib.mjs';
import {
  dropShadow,
  drawFern,
  herbarium,
  inkPad,
  magnifier,
  paperclip,
  photo,
  pin,
  rubberStamp,
  stampImprint,
  text,
  velmarcheMap,
} from './objects.mjs';

const W = 240;
const H = 200;

/** Tache d'aquarelle de fond (deux lavis, éclaboussures). */
function splash(S, c1, c2, { cx = 120, cy = 108, rx = 100, ry = 76 } = {}) {
  const r = S.r;
  S.p(c1, blob(r, cx, cy, rx, ry, { n: 22, amp: 0.1 }));
  if (c2)
    S.p(c2, blob(r, cx + r.jit(14), cy + r.jit(10), rx * 0.66, ry * 0.62, { n: 16, amp: 0.14 }), {
      'fill-opacity': 0.8,
    });
  let dots = '';
  for (let i = 0; i < 7; i++) {
    const a = r.range(0, Math.PI * 2);
    dots += circ(
      cx + Math.cos(a) * rx * r.range(1.02, 1.15),
      cy + Math.sin(a) * ry * r.range(1.02, 1.15),
      r.range(1, 3),
    );
  }
  S.p(c1, dots);
}

function make(id, title, fn) {
  const S = new Svg(id, W, H, { title });
  fn(S, S.r);
  return String(S);
}

export const SPOTS = {
  'spot-archives': () =>
    make('spot-archives', "Boîte d'archives ouverte, dossiers qui dépassent", (S, r) => {
      splash(S, 'wash-safran', 'wash-sienne');
      const x = 58;
      const y = 78;
      const w = 118;
      const h = 82;
      const dx = 36;
      const dy = -22;
      S.p(
        'ombre',
        poly(
          [
            [x + 6, y + h + 4],
            [x + w + dx + 8, y + h + dy + 4],
            [x + w + dx + 20, y + h + dy + 12],
            [x + 18, y + h + 14],
          ],
          true,
        ),
      );
      // intérieur et dossiers
      const mouth = poly(
        [
          [x, y],
          [x + w, y],
          [x + w + dx, y + dy],
          [x + dx, y + dy],
        ],
        true,
      );
      S.p('hair-brun', mouth);
      const tones = ['wash-indigo', 'wash-safran', 'wash-carmin', 'wash-sauge', 'paper'];
      for (let i = 0; i < 6; i++) {
        const t = (i + 0.6) / 6.4;
        const bx = x + 6 + dx * t;
        const by = y + dy * t;
        const tall = r.range(16, 34);
        const d = poly(
          [
            [bx, by + 2],
            [bx + 4, by - tall],
            [bx + w - 14, by - tall - r.range(-3, 3)],
            [bx + w - 10, by + 2],
          ],
          true,
        );
        S.wash(d, i % 2 ? 'skin-3' : null, i % 2 ? null : tones[i % tones.length]);
        S.ln(d, 0.8, 'ink');
        S.wash(rect(bx + 14 + i * 9, by - tall - 7, 16, 8), tones[(i + 2) % tones.length]);
        S.ln(rect(bx + 14 + i * 9, by - tall - 7, 16, 8), 0.7, 'ink');
      }
      // faces de la boîte
      const front = rect(x, y, w, h);
      const side = poly(
        [
          [x + w, y],
          [x + w + dx, y + dy],
          [x + w + dx, y + h + dy],
          [x + w, y + h],
        ],
        true,
      );
      S.wash(front, 'skin-3', 'wash-safran');
      S.p('stipple', front, { 'fill-opacity': 0.4 });
      S.wash(side, 'skin-4', 'wash-sienne');
      S.hatchIn(side, [x + w, y + dy, x + w + dx, y + h], 70, 2.4, 0.5, 'ink-soft');
      S.ln(front, 1.3, 'ink');
      S.ln(side, 1.3, 'ink');
      // étiquette + trou de préhension
      S.p('paper', rect(x + 26, y + 20, 64, 30));
      S.ln(rect(x + 26, y + 20, 64, 30), 0.8, 'ink');
      text(S, x + 58, y + 33, 'FONDS', { cls: 'label', size: 9, anchor: 'middle' });
      S.ln(handLines(r, x + 34, y + 44, 46, 1, 6, { h: 1.8, step: 2.2, last: 1 }), 0.6, 'ink-soft');
      S.p('hair-brun', rrect(x + 44, y + 60, 30, 9, 4.5));
      S.ln(rrect(x + 44, y + 60, 30, 9, 4.5), 0.8, 'ink');
      // couvercle posé de biais
      const lid = poly(
        [
          [x - 30, y + 44],
          [x - 6, y - 8],
          [x + 4, y - 4],
          [x - 20, y + 50],
        ],
        true,
      );
      S.wash(lid, 'skin-3', 'wash-sienne');
      S.ln(lid, 1.1, 'ink');
    }),

  'spot-catalogue': () =>
    make('spot-catalogue', 'Tiroir de fichier tiré, fiches à onglets de couleur', (S, r) => {
      splash(S, 'wash-sauge', 'wash-celadon');
      // meuble (fond)
      const cab = rect(36, 40, 168, 72);
      S.wash(cab, 'hair-chatain', 'wash-sienne');
      S.ln(cab, 1.2, 'ink');
      for (let i = 0; i < 3; i++) {
        const d = rect(44 + i * 54, 48, 46, 26);
        S.p('hair-brun', d, { opacity: 0.6 });
        S.ln(d, 0.8, 'ink');
        S.wash(rect(58 + i * 54, 54, 18, 8), 'hair-blond');
        S.ln(rect(58 + i * 54, 54, 18, 8), 0.6, 'ink');
      }
      S.p('hair-brun', rect(98, 82, 46, 26));
      // tiroir tiré (vers le bas, en perspective)
      const back = [
        [96, 84],
        [146, 84],
      ];
      const fr = [
        [78, 160],
        [168, 160],
      ];
      const left = poly(
        [back[0], fr[0], [fr[0][0], fr[0][1] + 24], [back[0][0], back[0][1] + 14]],
        true,
      );
      const right = poly(
        [back[1], fr[1], [fr[1][0], fr[1][1] + 24], [back[1][0], back[1][1] + 14]],
        true,
      );
      S.wash(left, 'hair-chatain', 'wash-sienne');
      S.wash(right, 'hair-roux', 'wash-sienne');
      S.hatchIn(left, [70, 80, 100, 190], 80, 2.2, 0.5, 'ink-soft');
      // fiches
      const tabs = [
        'wash-carmin',
        'wash-safran',
        'wash-indigo',
        'paper',
        'wash-sauge',
        'wash-lilas',
      ];
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const lx = lerp(back[0][0], fr[0][0], t) + 2;
        const rx = lerp(back[1][0], fr[1][0], t) - 2;
        const yy = lerp(back[0][1], fr[0][1], t);
        const hh = lerp(10, 22, t);
        const d = poly(
          [
            [lx, yy],
            [lx, yy - hh],
            [rx, yy - hh],
            [rx, yy],
          ],
          true,
        );
        S.p('paper', d);
        S.ln(d, 0.6, 'ink-soft');
        if (i % 2 === 0 || i === 7) {
          const tx = lerp(lx, rx, ((i * 3) % 7) / 8);
          const tw = (rx - lx) * 0.22;
          const td = rect(tx, yy - hh - 5 - t * 3, tw, 5 + t * 3);
          S.wash(td, tabs[i % tabs.length]);
          S.ln(td, 0.6, 'ink');
        }
      }
      S.p('paper', rect(fr[0][0] + 2, fr[0][1] - 26, fr[1][0] - fr[0][0] - 4, 26));
      S.ln(handLines(r, fr[0][0] + 10, fr[0][1] - 14, 60, 2, 7, { h: 1.8 }), 0.6, 'ink-soft');
      S.ln(rect(fr[0][0] + 2, fr[0][1] - 26, fr[1][0] - fr[0][0] - 4, 26), 0.6, 'ink-soft');
      S.ln(left, 1.1, 'ink');
      S.ln(right, 1.1, 'ink');
      // façade du tiroir
      const face = rect(fr[0][0] - 4, fr[0][1], fr[1][0] - fr[0][0] + 8, 30);
      S.wash(face, 'hair-chatain', 'wash-safran');
      S.ln(face, 1.3, 'ink');
      S.wash(rect(108, 166, 30, 11), 'hair-blond', 'wash-safran');
      S.ln(rect(108, 166, 30, 11), 0.8, 'ink');
      text(S, 123, 174.5, 'K–L', { cls: 'label-note', size: 7.5, anchor: 'middle' });
      S.wash(arc(123, 184, 12, 5, 0, Math.PI, 8) + 'Z', 'hair-blond');
      S.ln(arc(123, 184, 12, 5, 0, Math.PI, 8), 1.4, 'ink');
    }),

  'spot-map-pin': () =>
    make('spot-map-pin', 'Carte de la Velmarche épinglée, fil rouge entre les lieux', (S) => {
      splash(S, 'water', 'wash-lilas');
      S.at(36, 44, { rot: -6, s: 0.4 }, () =>
        velmarcheMap(S, { w: 420, h: 300, roll: 30, labels: false, pins: true }),
      );
      S.at(190, 70, { s: 2.2 }, () => pin(S, 0, 0));
    }),

  'spot-tree': () =>
    make('spot-tree', 'Arbre généalogique aux médaillons vides', (S, r) => {
      splash(S, 'wash-sauge', 'wash-safran');
      // frondaison (lavis derrière les branches)
      S.p('wash-sauge', blob(r, 120, 74, 84, 54, { n: 16, amp: 0.12 }));
      S.p('wash-celadon', blob(r, 106, 66, 50, 34, { n: 12, amp: 0.15 }), { 'fill-opacity': 0.7 });
      S.p('stipple', blob(r, 120, 74, 80, 50, { n: 16, amp: 0.1 }), { 'fill-opacity': 0.5 });
      // tronc et branches (taille-douce)
      const trunk = smooth(
        [
          [104, 186, 1],
          [110, 150],
          [106, 118],
          [114, 96],
          [126, 96],
          [132, 118],
          [128, 150],
          [138, 186, 1],
        ],
        true,
      );
      S.wash(trunk, 'hair-chatain', 'wash-sienne');
      S.hatchIn(trunk, [100, 90, 140, 190], 75, 2, 0.5, 'ink-soft');
      S.ln(trunk, 1.2, 'ink');
      const br = [
        [
          [118, 110],
          [92, 86],
          [64, 72],
        ],
        [
          [120, 106],
          [146, 84],
          [176, 70],
        ],
        [
          [119, 100],
          [118, 70],
          [120, 40],
        ],
        [
          [96, 90],
          [82, 58],
          [80, 40],
        ],
        [
          [144, 88],
          [160, 56],
          [164, 38],
        ],
        [
          [112, 132],
          [80, 122],
          [48, 116],
        ],
        [
          [128, 130],
          [160, 120],
          [194, 114],
        ],
      ];
      for (const b of br) {
        const d = tube(b, 7, 2);
        S.wash(d, 'hair-chatain', 'wash-sienne');
        S.ln(d, 0.9, 'ink');
      }
      // feuilles
      for (let i = 0; i < 26; i++) {
        const b = br[i % br.length];
        const p = b[2];
        const x = p[0] + r.jit(18);
        const y = p[1] + r.jit(12);
        const a = r.range(0, Math.PI);
        const d = smooth(
          [
            [x, y, 1],
            [x + Math.cos(a) * 5 - Math.sin(a) * 3, y + Math.sin(a) * 5 + Math.cos(a) * 3],
            [x + Math.cos(a) * 10, y + Math.sin(a) * 10, 1],
            [x + Math.cos(a) * 5 + Math.sin(a) * 3, y + Math.sin(a) * 5 - Math.cos(a) * 3],
          ],
          true,
        );
        S.p(i % 3 ? 'wash-sauge' : 'wash-celadon', d);
        S.ln(d, 0.5, 'ink-soft');
      }
      // médaillons suspendus (vides)
      const meds = [
        [64, 72],
        [176, 70],
        [120, 40],
        [80, 40],
        [164, 38],
        [48, 116],
        [194, 114],
      ];
      meds.forEach(([x, y], i) => {
        S.ln(`M${x} ${y}V${y + 8}`, 0.7, 'ink');
        const cy = y + 22;
        S.p('ombre', ell(x + 2, cy + 2, 12, 14));
        S.wash(ell(x, cy, 12, 14), 'hair-blond', 'wash-safran');
        S.p('paper', ell(x, cy, 8.5, 10.5));
        if (i === 2) S.p('wash-lilas', ell(x, cy, 8.5, 10.5));
        S.ln(ell(x, cy, 12, 14), 1, 'ink');
        S.ln(ell(x, cy, 8.5, 10.5), 0.6, 'ink-soft');
        if (i % 3 === 0) text(S, x, cy + 4, '?', { cls: 'label-note', size: 11, anchor: 'middle' });
      });
    }),

  'spot-stamp': () =>
    make('spot-stamp', 'Tampon de bois et empreinte « ÉTABLI »', (S) => {
      splash(S, 'wash-carmin', 'wash-safran');
      S.at(30, 104, { rot: -4 }, () => {
        dropShadow(S, rect(0, 0, 150, 76), 4, 5);
        S.p('paper', rect(0, 0, 150, 76));
        S.ln(rect(0, 0, 150, 76), 0.6, 'ink-soft');
        S.open({ transform: 'translate(76 40) rotate(-6)' });
        stampImprint(S, { w: 118, h: 46, size: 21 });
        S.close();
      });
      S.at(150, 64, { flat: 0.3, rot: 6, s: 0.7 }, () => inkPad(S));
      S.at(196, 120, { s: 1.15 }, () => rubberStamp(S, { w: 44 }));
    }),

  'spot-magnifier': () =>
    make('spot-magnifier', 'Loupe sur une photographie de famille (visages hors champ)', (S) => {
      splash(S, 'wash-indigo', 'wash-lilas');
      S.at(42, 56, { rot: -5 }, () => {
        photo(S, { w: 150, h: 108, scene: 'house' });
        paperclip(S, 120, -10, { a: 10 });
      });
      S.at(150, 112, {}, () =>
        magnifier(S, {
          R: 38,
          handle: 64,
          angle: 40,
          inner: () => {
            S.open({ transform: 'scale(1.8) translate(-150 -112) translate(42 56) rotate(-5)' });
            photo(S, { w: 150, h: 108, scene: 'house', shadow: false });
            S.close();
          },
        }),
      );
    }),

  'spot-letter': () =>
    make('spot-letter', 'Lettre cachetée de cire, timbre et cachet postal', (S, r) => {
      splash(S, 'wash-lilas', 'wash-carmin');
      S.at(36, 54, { rot: -6 }, () => {
        const env = rect(0, 0, 168, 104);
        dropShadow(S, env, 4, 6);
        S.wash(env, 'wash-safran');
        S.p('stipple', env, { 'fill-opacity': 0.3 });
        S.ln('M0 0L84 58L168 0', 1, 'ink-soft');
        S.ln('M0 104L66 46M168 104L102 46', 0.6, 'ink-faint');
        S.ln(env, 1.1, 'ink');
        // timbre
        const st = rect(130, 8, 28, 32);
        S.p('paper', st);
        S.ln(st, 1.4, 'ink-faint', { 'stroke-dasharray': '1.5 1.5' });
        S.wash(rect(133, 11, 22, 26), 'wash-indigo');
        S.at(144, 33, { s: 0.3 }, () => drawFern(S, 0, 0, 70, { angle: 0, pairs: 7 }));
        S.ln(`${circ(128, 30, 14)}`, 0.8, 'ink-soft');
        S.ln('M108 22q8 -4 16 0t16 0M108 30q8 -4 16 0t16 0M108 38q8 -4 16 0t16 0', 0.7, 'ink-soft');
        // adresse
        S.ln(handLines(r, 30, 70, 90, 3, 9, { h: 2.4, step: 2.6 }), 0.8, 'ink');
      });
      sealAt(S, 120, 104, 22);
    }),

  'spot-fern': () =>
    make('spot-fern', "Fougère pressée sur une planche d'herbier", (S) => {
      splash(S, 'wash-sauge', 'wash-celadon', { rx: 96, ry: 82 });
      S.at(66, 14, { rot: 4, s: 0.68 }, () => herbarium(S, { w: 170, h: 250, note: '' }));
    }),

  'spot-lighthouse': () =>
    make('spot-lighthouse', 'Cap et phare de Tennok au crépuscule, récif des Dents', (S, r) => {
      const sky = blob(r, 120, 98, 104, 84, { n: 22, amp: 0.08 });
      S.within(sky, () => {
        S.p('wash-indigo', rect(0, 0, W, 70));
        S.p('wash-lilas', rect(0, 40, W, 50));
        S.p('wash-carmin', rect(0, 70, W, 30), { 'fill-opacity': 0.8 });
        S.p('wash-safran', rect(0, 88, W, 30));
        // faisceau
        S.p(
          'wash-safran',
          poly(
            [
              [134, 66],
              [240, 30],
              [240, 74],
            ],
            true,
          ),
          { 'fill-opacity': 0.7 },
        );
        S.p(
          'rehaut',
          poly(
            [
              [134, 66],
              [240, 40],
              [240, 62],
            ],
            true,
          ),
          { opacity: 0.35 },
        );
        // mer
        S.p('water', rect(0, 116, W, 90));
        S.p('water-deep', rect(0, 136, W, 70));
        let wv = '';
        for (let y = 122; y < 196; y += 6)
          for (let x = r.range(0, 20); x < W; x += r.range(16, 30))
            wv += `M${f(x)} ${f(y)}q4 -2 8 0`;
        S.ln(wv, 0.6, 'ink-soft');
        // falaise
        const cliff = smooth(
          [
            [60, 200, 1],
            [70, 140],
            [96, 112, 1],
            [158, 108, 1],
            [176, 130],
            [196, 150],
            [210, 200, 1],
          ],
          true,
        );
        S.wash(cliff, 'wash-sauge', 'wash-sienne');
        S.hatchIn(cliff, [60, 100, 210, 200], -60, 2.4, 0.5, 'ink-soft');
        S.p(
          'wash-sauge',
          smooth(
            [
              [96, 112, 1],
              [158, 108, 1],
              [170, 118],
              [100, 120],
            ],
            true,
          ),
        );
        S.ln(cliff, 1.1, 'ink');
        // récif
        for (const [x, y, s] of [
          [30, 150, 1],
          [44, 160, 0.7],
          [204, 166, 0.8],
          [18, 170, 0.6],
        ]) {
          const d = poly(
            [
              [x - 10 * s, y],
              [x - 3 * s, y - 14 * s],
              [x + 2 * s, y - 8 * s],
              [x + 8 * s, y - 18 * s],
              [x + 12 * s, y],
            ],
            true,
          );
          S.wash(d, 'wash-ardoise');
          S.p('hatch-dense', d);
          S.ln(d, 0.9, 'ink');
          S.p('rehaut', ell(x, y + 1, 16 * s, 2.5), { opacity: 0.8 });
        }
        // maison du gardien
        const hs = rect(100, 96, 24, 14);
        S.p('paper', hs);
        S.p(
          'wash-carmin',
          poly(
            [
              [98, 96],
              [112, 86],
              [126, 96],
            ],
            true,
          ),
        );
        S.ln(
          hs +
            poly([
              [98, 96],
              [112, 86],
              [126, 96],
            ]),
          0.9,
          'ink',
        );
        S.wash(rect(106, 100, 4, 5), 'wash-safran');
        // phare blanc à bande rouge
        const tw = poly(
          [
            [128, 108],
            [131, 54],
            [143, 54],
            [146, 108],
          ],
          true,
        );
        S.p('paper', tw);
        S.within(tw, () => {
          S.p('wash-carmin', rect(120, 72, 40, 12));
          S.p('wash-carmin', rect(120, 72, 40, 12));
          S.ln(hatchLines([138, 50, 150, 110], 90, 1.6, r), 0.5, 'ink-soft');
        });
        S.ln(tw, 1.1, 'ink');
        S.ln('M127 54H147', 1.4, 'ink');
        S.p('rehaut', rect(132, 42, 10, 11));
        S.p('wash-safran', rect(132, 42, 10, 11));
        S.ln(rect(132, 42, 10, 11) + 'M137 42V53', 0.8, 'ink');
        S.wash(
          poly(
            [
              [130, 42],
              [137, 33],
              [144, 42],
            ],
            true,
          ),
          'wash-carmin',
        );
        S.ln(
          poly(
            [
              [130, 42],
              [137, 33],
              [144, 42],
            ],
            true,
          ),
          0.9,
          'ink',
        );
        // mouettes
        S.ln('M60 50q4 -4 8 0q4 -4 8 0M84 38q3 -3 6 0q3 -3 6 0', 0.8, 'ink');
        let st = '';
        for (let i = 0; i < 10; i++) st += circ(r.range(20, 220), r.range(14, 40), r.range(0.5, 1));
        S.p('rehaut', st);
      });
      S.ln(sky, 0.6, 'ink-faint', { 'stroke-opacity': 0.5 });
    }),

  'spot-register': () =>
    make('spot-register', 'Registre relié de cuir, fermé par une chaîne et un cadenas', (S, r) => {
      splash(S, 'wash-ardoise', 'wash-indigo');
      // registre en perspective
      const top = poly(
        [
          [46, 86],
          [150, 58],
          [204, 92],
          [100, 124],
        ],
        true,
      );
      const front = poly(
        [
          [46, 86],
          [100, 124],
          [100, 150],
          [46, 112],
        ],
        true,
      );
      const side = poly(
        [
          [100, 124],
          [204, 92],
          [204, 118],
          [100, 150],
        ],
        true,
      );
      S.p(
        'ombre',
        poly(
          [
            [46, 116],
            [100, 156],
            [214, 120],
            [206, 112],
          ],
          true,
        ),
      );
      // tranche des pages
      S.p('paper', side);
      let pg = '';
      for (let i = 1; i < 9; i++) pg += `M100 ${124 + i * 2.9}L204 ${92 + i * 2.9}`;
      S.ln(pg, 0.5, 'ink-faint');
      S.p(
        'wash-carmin',
        poly(
          [
            [100, 124],
            [204, 92],
            [204, 95],
            [100, 127],
          ],
          true,
        ),
      );
      S.wash(front, 'hair-brun', 'wash-carmin');
      S.wash(top, 'hair-roux', 'wash-carmin');
      S.p('stipple', top, { 'fill-opacity': 0.5 });
      S.hatchIn(front, [40, 80, 104, 156], 80, 2, 0.5, 'ink-soft');
      // coins de laiton
      for (const c of [
        [
          [46, 86],
          [62, 82],
          [56, 92],
        ],
        [
          [150, 58],
          [160, 64],
          [140, 62],
        ],
        [
          [204, 92],
          [190, 96],
          [196, 86],
        ],
      ]) {
        S.wash(poly(c, true), 'hair-blond', 'wash-safran');
        S.ln(poly(c, true), 0.7, 'ink');
      }
      // étiquette
      const lab = poly(
        [
          [104, 82],
          [138, 73],
          [152, 82],
          [118, 92],
        ],
        true,
      );
      S.p('paper', lab);
      S.ln(lab, 0.8, 'ink');
      S.ln(top, 1.2, 'ink');
      S.ln(front, 1.2, 'ink');
      S.ln(side, 1.1, 'ink');
      // chaîne : maillons alternés
      const chain = [
        [30, 60],
        [72, 76],
        [120, 98],
        [160, 116],
        [176, 132],
        [190, 150],
        [200, 176],
      ];
      const pts = [];
      for (let i = 0; i < chain.length - 1; i++) {
        for (let k = 0; k < 4; k++)
          pts.push([
            lerp(chain[i][0], chain[i + 1][0], k / 4),
            lerp(chain[i][1], chain[i + 1][1], k / 4),
          ]);
      }
      pts.forEach(([x, y], i) => {
        const nx = pts[Math.min(pts.length - 1, i + 1)];
        const a = (Math.atan2(nx[1] - y, nx[0] - x) * 180) / Math.PI;
        S.open({ transform: `translate(${f(x)} ${f(y)}) rotate(${f(a)})` });
        const d = i % 2 ? ell(0, 0, 7, 2.2) : ell(0, 0, 7, 4.2) + ell(0, 0, 4.4, 1.6);
        S.wash(d, 'wash-ardoise', null, { 'fill-rule': 'evenodd' });
        S.ln(i % 2 ? ell(0, 0, 7, 2.2) : ell(0, 0, 7, 4.2), 1, 'ink');
        S.p('rehaut', ell(-2, -2, 2.5, 0.8), { opacity: 0.8 });
        S.close();
      });
      // cadenas
      const lx = 160;
      const ly = 132;
      S.ln(arc(lx, ly - 4, 10, 13, Math.PI, Math.PI * 2, 10), 4, 'ink');
      S.ln(arc(lx, ly - 4, 10, 13, Math.PI, Math.PI * 2, 10), 2, 'ink-faint');
      const body = rrect(lx - 15, ly - 4, 30, 26, 4);
      S.p('ombre', body, { transform: 'translate(3 4)' });
      S.wash(body, 'hair-blond', 'wash-safran');
      S.hatchIn(body, [lx, ly - 4, lx + 15, ly + 22], 90, 1.8, 0.5, 'ink-soft');
      S.ln(body, 1.2, 'ink');
      S.ln(circ(lx, ly + 6, 3) + `M${lx} ${ly + 8}V${ly + 15}`, 1.2, 'ink');
      void r;
    }),
};

/** Cachet de cire (rouge de cire : roux + carmin), fougère en relief. */
export function sealAt(S, cx, cy, R) {
  const r = S.r;
  const d = blob(r, cx, cy, R, R, { n: 20, amp: 0.09 });
  S.p('ombre', d, { transform: 'translate(2 3)' });
  S.p('hair-roux', d);
  S.p('wash-carmin', d);
  S.p('wash-carmin', circ(cx, cy, R * 0.72));
  S.ln(d, 1, 'ink');
  S.ln(circ(cx, cy, R * 0.72), 0.9, 'ink-soft');
  S.ln(circ(cx, cy, R * 0.62), 0.5, 'ink-soft');
  S.p(
    'rehaut',
    tube(
      [
        [cx - R * 0.7, cy - R * 0.2],
        [cx - R * 0.5, cy - R * 0.62],
        [cx - R * 0.1, cy - R * 0.8],
      ],
      R * 0.12,
      1,
    ),
    { opacity: 0.7 },
  );
  // fougère en relief
  const fr = drawFern(S, cx - R * 0.1, cy + R * 0.48, R * 0.95, {
    angle: 12,
    pairs: 7,
    wash: 'wash-carmin',
    w: 0.7,
  });
  void fr;
}

export { hatchLines };
