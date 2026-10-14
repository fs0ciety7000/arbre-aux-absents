/**
 * Distribution de l'affaire 2 (`revenant-hautcorvin`) : chaque personne des photographies est tirée
 * du générateur des portraits (art/tools/portraits/people-hautcorvin.mjs) pour que le visage
 * corresponde à sa case. Les âges hors portrait suivent docs/scenario/hautcorvin/04-personnages.md
 * et 07-coherence.md §4 : retouches ci-dessous (cheveux, barbe, chapeau), traits héréditaires gardés.
 *
 * Côtés (DESIGN §10.7) : gauche du sujet = droite de l'image. Fossette (joue gauche), épi, iris
 * clair ou noir, sourcils joints et lobe sont portés par la spec du portrait ; ne jamais les retirer.
 */
import { extra as famExtra, fam, garmentTone, lower, person, resolveSpec } from '../fam.mjs';
import { hand } from '../people.mjs';
import { ell, f, tube } from '../lib.mjs';

/** Nom court → nom de travail du portrait de case. */
export const ID = {
  evariste: 'hc-evariste-41',
  clotilde: 'hc-clotilde-33',
  dranko: 'hc-dranko-60',
  barthelemy: 'hc-barthelemy-64',
  annette: 'hc-annette-60',
  honore: 'hc-honore-85',
  eugenie: 'hc-eugenie-31',
  danela: 'hc-danela-24',
  marguerite: 'hc-marguerite-32',
  leonce: 'hc-leonce-30',
  jules: 'hc-jules-34',
  philomene: 'hc-philomene-31',
  colombe: 'hc-colombe-69',
  aime: 'hc-aime-38',
  bastien: 'hc-bastien-27',
  lucie: 'hc-lucie-23',
  andrin: 'hc-andrin-27',
  andrin41: 'hc-andrin-41',
  andrin63: 'hc-andrin-63',
  victorin: 'hc-victorin-32',
  remi: 'hc-remi-39',
  odette: 'hc-odette-34',
  hugues: 'hc-hugues-29',
  sabine: 'hc-sabine-24',
  isaure: 'hc-isaure-41',
  julien: 'hc-julien-32',
  agnes: 'hc-agnes-36',
  pierre: 'hc-pierre-25',
  gilles: 'hc-gilles-37',
  brigitte: 'hc-brigitte-32',
  mallet: 'hc-leurre-mallet',
  lavergne: 'hc-leurre-lavergne',
  fauvel: 'hc-leurre-fauvel',
  leon: 'hc-leurre-leon-escande',
  rovin: 'hc-leurre-rovin',
  pradeil: 'hc-leurre-pradeil',
};

/**
 * Retouches par âge : [âge maximal, patch] dans l'ordre croissant ; la première entrée dont l'âge
 * maximal couvre l'âge demandé s'applique (sinon aucune : visage du portrait).
 */
const AGES = {
  evariste: [[60, {}], [99, { hair: 'gris', beard: { style: 'collar', cls: 'hair-gris' }, brows: { color: 'gris' } }]],
  clotilde: [[40, {}], [65, { hair: 'gris' }], [99, { hair: 'gris', brows: { color: 'gris' } }]],
  barthelemy: [[60, { hair: 'brun', moustache: { style: 'horseshoe', cls: 'hair-brun' }, brows: { color: 'brun' } }]],
  annette: [[57, { hair: 'brun', brows: { color: 'brun' } }]],
  honore: [
    [12, { hair: 'chatain', hairStyle: 'short', hairOpt: { cowlick: true, receding: false }, brows: { color: 'chatain', thick: 1 }, clothes: { type: 'smock', wash: 'wash-ardoise' }, hands: [], extras: [] }],
    [40, { hair: 'chatain', hairOpt: { cowlick: true, receding: false, vol: 0.06 }, brows: { color: 'chatain', thick: 1.3 }, moustache: { style: 'short' }, hat: { type: 'flatcap', cls: 'paper-shade', back: 1 }, hands: [], extras: [] }],
    [52, { hair: 'chatain', hairOpt: { receding: true, vol: 0.06 }, brows: { color: 'chatain', thick: 1.5 }, moustache: { style: 'short' }, hands: [], extras: [] }],
    [70, { hair: 'gris', hairOpt: { receding: true, vol: 0.1 }, brows: { color: 'gris', thick: 1.8 }, moustache: { style: 'short', cls: 'hair-gris' }, hands: [], extras: [] }],
    [84, { hands: [], extras: [] }],
  ],
  eugenie: [[35, {}], [99, { hat: { type: 'turban', cls: 'wash-lilas' } }]],
  danela: [[30, {}], [55, { hair: 'brun' }], [99, { hair: 'gris', brows: { color: 'noir' } }]],
  leonce: [[99, { hands: [] }]],
  jules: [[30, { moustache: null }]],
  philomene: [[40, {}], [99, { hair: 'gris', brows: { color: 'gris' } }]],
  colombe: [
    [12, { hair: 'chatain', hairStyle: 'bob', hairOpt: { len: 0.7 }, brows: { color: 'chatain' }, glasses: null, clothes: { type: 'dress', wash: 'paper' }, extras: [] }],
    [40, { hair: 'chatain', hairStyle: 'lowBun', brows: { color: 'chatain' }, glasses: null }],
    [56, { hair: 'chatain', hairStyle: 'bob', hairOpt: { len: 0.55, grayTemples: true }, brows: { color: 'chatain' }, glasses: { type: 'round', shell: 'hair-noir' } }],
    [99, {}],
  ],
  aime: [[50, {}], [99, { hairOpt: { grayTemples: true, shine: true } }]],
  bastien: [
    [12, { hat: null, mouth: { teeth: false }, hands: [], clothes: { type: 'smock', wash: 'wash-ardoise' } }],
    [20, { hat: null, mouth: { teeth: false }, hands: [] }],
    [99, { hands: [] }],
  ],
  andrin: [[99, { hands: [] }]],
  andrin41: [[99, { hands: [] }]],
  andrin63: [[99, { hands: [] }]],
  lucie: [[30, {}], [99, { hairStyle: 'lowBun' }]],
  victorin: [[40, {}], [99, { hair: 'gris', brows: { color: 'gris' }, clothes: { type: 'coat', wash: 'wash-sienne', dark: 'hatch', collar: 'turn', tie: 'none' }, extras: [], moustache: { style: 'short', cls: 'hair-gris' } }]],
  remi: [[12, { hat: null, beard: null, moustache: null }], [50, {}], [99, { beard: { style: 'short', cls: 'hair-gris' }, moustache: { style: 'full', cls: 'hair-gris' }, brows: { color: 'gris' } }]],
  agnes: [[14, { clothes: { type: 'dress', wash: 'paper' }, extras: [] }], [99, {}]],
  gilles: [[14, { hat: null, beard: null, moustache: null, extras: [] }], [99, {}]],
  brigitte: [[14, { hairStyle: 'bob', glasses: null, hands: [], clothes: { type: 'dress', wash: 'paper' } }], [28, { hands: [] }], [99, { hands: [] }]],
  hugues: [[30, {}], [99, { hairOpt: { receding: true, baldTop: true, grayTemples: true } }]],
  isaure: [[30, { extras: [], hairOpt: { loose: false } }], [99, {}]],
  sabine: [[30, {}], [99, {}]],
  julien: [[99, { hands: [] }]],
  odette: [[99, { hands: [] }]],
};

function merge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) out[k] = merge(a[k], v);
    else out[k] = v;
  }
  return out;
}

/** Patch d'âge (retouches de la bible) fusionné avec le patch de scène (prioritaire). */
export function agePatch(key, age, patch = {}) {
  const tbl = AGES[key] ?? [];
  const hit = tbl.find(([max]) => age <= max);
  return merge(hit ? hit[1] : {}, patch);
}

/** Personnage complet (bas du corps + buste). `o.patch` s'ajoute aux retouches d'âge. */
export function hc(S, key, age, x, y, s, o = {}) {
  if (!ID[key]) throw new Error(`personne inconnue : ${key}`);
  return person(S, ID[key], age, x, y, s, { seam: true, ...o, patch: agePatch(key, age, o.patch) });
}

/** Figurant en pied, buste et corps raccordés sans couture. */
export function extra(S, spec, x, y, s, o = {}) {
  return famExtra(S, spec, x, y, s, { seam: true, ...o });
}

/**
 * Valeur du vêtement porté par `key` à cet âge (options `torso*` de `lower()`) : pour un corps
 * dessiné à part, puis raccordé par `hc(…, { lower: false, seam: lo.seam })`.
 */
export function garment(key, age, patch) {
  return garmentTone(resolveSpec(ID[key], age, { patch: agePatch(key, age, patch) }));
}

/** Buste seul (rogné ou non). */
export function hcBust(S, key, age, x, y, s, o = {}) {
  if (!ID[key]) throw new Error(`personne inconnue : ${key}`);
  return fam(S, ID[key], age, x, y, s, { ...o, patch: agePatch(key, age, o.patch) });
}

/** Bras de scène terminé par une main (brûlure, doigts manquants…). */
export function limb(S, pts, w, tone, h = {}) {
  const d = tube(pts, w, w * 0.78);
  S.fill(d, tone);
  if (h.dense) S.hatd(d);
  if (h.hatch) S.hat(d);
  S.ln(d, 0.7, S.mode === 'photo' ? 'ink-soft' : 'ink');
  if (h.none) return d;
  const a = pts[pts.length - 1];
  const b = pts[pts.length - 2];
  const ang = (Math.atan2(a[1] - b[1], a[0] - b[0]) * 180) / Math.PI - 90;
  hand(S, a[0], a[1], h.ang ?? ang, h.size ?? w / 4.6, h, (v) => v);
  return d;
}

/** Brûlure luisante en surimpression photographique (dos de main), centre (x, y), rayon r. */
export function shinyBurn(S, x, y, r) {
  S.p('photo-paper', ell(x, y, r, r * 0.72), { opacity: 0.95 });
  S.p('rehaut', ell(x - r * 0.25, y - r * 0.2, r * 0.45, r * 0.28));
  S.ln(ell(x, y, r, r * 0.72), 0.5, 'ink-soft');
}

/** Flocons (neige qui tombe) sur une zone. */
export function snowfall(S, x0, y0, x1, y1, n, size = 1.2) {
  let d = '';
  for (let i = 0; i < n; i++) d += ell(x0 + S.r() * (x1 - x0), y0 + S.r() * (y1 - y0), size * (0.6 + S.r()), size * (0.6 + S.r()));
  S.p('photo-paper', d);
  return d;
}

export { lower, f };
