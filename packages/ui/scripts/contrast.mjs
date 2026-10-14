#!/usr/bin/env node
// Calcul des contrastes WCAG 2.2 des tokens de couleur (docs/DESIGN.md §2.6).
// Usage : node packages/ui/scripts/contrast.mjs [--md] [--strict]
// Couvre aussi les variantes « vision des couleurs » (data-color-vision, §3.7) : contraste
// des tons d'état en vision normale ET simulée (Machado 2009, sévérité 1), et écart OKLab
// minimal entre états (distinguables), comparé à la palette par défaut ; et l'illustration
// de nuit (.art.on-night, §10.10).
//   --md      imprime les tableaux Markdown recopiés dans DESIGN.md
//   --strict  code de sortie 1 si une paire passe sous son seuil (utilisable en CI)
// Lit packages/ui/src/styles/tokens.css, résout les var() par contexte (lampe, papier,
// contraste élevé), compose les couleurs translucides sur leur fond (en sRGB, comme le
// navigateur), puis calcule (L1 + 0,05) / (L2 + 0,05).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../src/styles/tokens.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** @type {Map<string, Record<string, string>>} */
const rules = new Map();
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const decls = {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
  for (const sel of m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' '))) {
    rules.set(sel, { ...(rules.get(sel) ?? {}), ...decls });
  }
}

const ROOT = ':root';
const PAPER = "[data-surface='paper']";
const HC = ":root[data-contrast='high']";
const HC_PAPER = ":root[data-contrast='high'] [data-surface='paper']";
const KRAFT = "[data-surface='kraft']";
const HC_KRAFT = ":root[data-contrast='high'] [data-surface='kraft']";
const NIGHT = '.art.on-night';
const HC_NIGHT = ":root[data-contrast='high'] .art.on-night";
const VISIONS = { protanopia: 'protan', deuteranopia: 'deutan', tritanopia: 'tritan' };
const CV = (v) => `:root[data-color-vision='${v}']`;
const CV_PAPER = (v) => `${CV(v)} ${PAPER}`;
const HC_CV = (v) => `:root[data-contrast='high'][data-color-vision='${v}']`;
const HC_CV_PAPER = (v) => `${HC_CV(v)} ${PAPER}`;
/** Contextes : sélecteurs dans l'ordre de la cascade (racine puis élément papier). */
const contexts = {
  lampe: [ROOT],
  papier: [ROOT, PAPER],
  'lampe HC': [ROOT, HC],
  'papier HC': [ROOT, HC, PAPER, HC_PAPER],
  carte: [ROOT],
  'carte HC': [ROOT, HC],
  'carte nuit': [ROOT, NIGHT],
  'carte nuit HC': [ROOT, HC, NIGHT, HC_NIGHT],
  matières: [ROOT],
  'matières HC': [ROOT, HC],
  kraft: [ROOT, KRAFT],
  'kraft HC': [ROOT, HC, KRAFT, HC_KRAFT],
};
/** Contexte de base (palette par défaut) de chaque contexte « vision des couleurs ». */
const visionBase = {};
for (const v of Object.keys(VISIONS)) {
  const add = (name, sels, base) => {
    contexts[name] = sels;
    visionBase[name] = { base, vision: v };
  };
  add(`lampe ${v}`, [ROOT, CV(v)], 'lampe');
  add(`papier ${v}`, [ROOT, CV(v), PAPER, CV_PAPER(v)], 'papier');
  add(`lampe HC ${v}`, [ROOT, HC, CV(v), HC_CV(v)], 'lampe HC');
  add(
    `papier HC ${v}`,
    [ROOT, HC, CV(v), HC_CV(v), PAPER, HC_PAPER, CV_PAPER(v), HC_CV_PAPER(v)],
    'papier HC',
  );
}

function scope(selectors) {
  const out = {};
  for (const s of selectors) {
    if (!rules.has(s)) throw new Error(`Sélecteur absent de tokens.css : ${s}`);
    Object.assign(out, rules.get(s));
  }
  return out;
}

function resolveVar(vars, name, depth = 0) {
  if (depth > 20) throw new Error(`Boucle de var() sur ${name}`);
  const v = vars[name];
  if (v === undefined) throw new Error(`Token inconnu : ${name}`);
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(vars, ref[1], depth + 1) : v;
}

// OKLCH -> sRGB (Björn Ottosson)
function oklchToSrgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const outOfGamut = lin.some((c) => c < -0.0005 || c > 1.0005);
  const enc = (c) => {
    c = Math.min(1, Math.max(0, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return { rgb: lin.map(enc), outOfGamut };
}

function parseColor(str) {
  if (str === 'transparent') return { rgb: [0, 0, 0], alpha: 0, outOfGamut: false };
  const m = str.match(
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/,
  );
  if (!m) throw new Error(`Couleur non OKLCH : ${str}`);
  const L = Number(m[1]) / (m[2] ? 100 : 1);
  const alpha = m[5] === undefined ? 1 : Number(m[5]) / (m[6] ? 100 : 1);
  const { rgb, outOfGamut } = oklchToSrgb(L, Number(m[3]), Number(m[4]));
  return { rgb, alpha, outOfGamut };
}

const over = (top, bottom) => top.rgb.map((c, i) => top.alpha * c + (1 - top.alpha) * bottom[i]);
const lum = (rgb) => {
  const lin = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const hex = (rgb) =>
  '#' +
  rgb
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

/**
 * Paires vérifiées : [premier plan, fond (liste du dessus vers le dessous), seuil, usage].
 * Les fonds translucides sont composés sur le fond suivant, jusqu'au dernier (opaque).
 * Seuils : 4.5 texte, 3 grand texte / non-texte (bordures, focus, icônes). En HC : 7 (AAA).
 */
const T = 4.5,
  NT = 3,
  AAA = 7;
const common = (min) => [
  ['--text', ['--canvas'], min, 'texte'],
  ['--text', ['--surface-1'], min, 'texte'],
  ['--text', ['--surface-2'], min, 'texte'],
  ['--text', ['--surface-3'], min, 'texte'],
  ['--text-muted', ['--canvas'], min, 'texte secondaire'],
  ['--text-muted', ['--surface-1'], min, 'texte secondaire'],
  ['--text-muted', ['--surface-2'], min, 'texte secondaire'],
  ['--text-muted', ['--surface-3'], T, 'texte secondaire'],
  ['--text-faint', ['--surface-1'], NT, 'grand texte, désactivé'],
  ['--line-strong', ['--canvas'], NT, 'bordure de contrôle'],
  ['--line-strong', ['--surface-1'], NT, 'bordure de contrôle'],
  ['--line-strong', ['--surface-2'], NT, 'bordure de contrôle'],
  ['--accent', ['--canvas'], T, 'lien, texte d’action'],
  ['--accent', ['--surface-1'], T, 'lien, texte d’action'],
  ['--accent', ['--surface-2'], T, 'lien, texte d’action'],
  ['--accent-contrast', ['--accent'], T, 'texte du bouton principal'],
  ['--accent-contrast', ['--accent-strong'], T, 'bouton principal survolé'],
  ['--text', ['--accent-tint', '--surface-1'], T, 'texte sur lavis d’accent'],
  ['--focus', ['--canvas'], NT, 'anneau de focus'],
  ['--focus', ['--surface-1'], NT, 'anneau de focus'],
  ['--focus', ['--surface-2'], NT, 'anneau de focus'],
  ['--focus', ['--surface-3'], NT, 'anneau de focus'],
  ['--danger', ['--surface-1'], T, 'erreur'],
  ['--success', ['--surface-1'], T, 'succès'],
  ['--warning', ['--surface-1'], T, 'avertissement'],
  ['--info', ['--surface-1'], T, 'information'],
  ['--established', ['--surface-1'], T, 'tampon « Établi »'],
  ['--established', ['--canvas'], T, 'tampon « Établi »'],
  ['--keyword', ['--surface-1'], T, 'mot-clé souligné'],
  ['--established-contrast', ['--established'], T, 'texte sur tampon plein'],
  ['--canvas', ['--success'], T, 'pastille pleine'],
  ['--canvas', ['--danger'], T, 'pastille pleine'],
  ['--canvas', ['--warning'], T, 'pastille pleine'],
  ['--canvas', ['--info'], T, 'pastille pleine'],
  // Badge variant="soft" : ton sur --surface-3, pour chaque ton (neutral = --text-muted, plus haut)
  ['--success', ['--surface-3'], T, 'pastille douce succès'],
  ['--warning', ['--surface-3'], T, 'pastille douce avertissement'],
  ['--danger', ['--surface-3'], T, 'pastille douce erreur'],
  ['--info', ['--surface-3'], T, 'pastille douce information'],
  ['--established', ['--surface-3'], T, 'pastille douce établi'],
  ['--accent', ['--surface-3'], T, 'pastille douce accent'],
  ['--canvas', ['--text'], T, 'info-bulle (inversée)'],
  ['--text', ['--selection', '--surface-1'], T, 'sélection de texte'],
];
// Bureau sombre seulement (hors papier) : valeur déclarée d'une case revendiquée (§6.9)
const deskOnly = (min) => [
  ['--claim-ink-desk', ['--canvas'], min, 'valeur déclarée sur le bureau'],
  ['--claim-ink-desk', ['--surface-1'], min, 'valeur déclarée (fiche de case, sélecteur)'],
  ['--claim-ink-desk', ['--surface-2'], min, 'valeur déclarée (survol)'],
  ['--claim-ink-desk', ['--surface-3'], min, 'valeur déclarée (ligne active)'],
];
const paperOnly = (min) => [
  ['--text', ['--hl-1', '--surface-1'], min, 'surlignage 1'],
  ['--text', ['--hl-2', '--surface-1'], min, 'surlignage 2'],
  ['--text', ['--hl-3', '--surface-1'], min, 'surlignage 3'],
  ['--text', ['--hl-4', '--surface-1'], min, 'surlignage 4'],
  ['--text', ['--hl-5', '--surface-1'], min, 'surlignage 5'],
  ['--ink-hand', ['--surface-1'], min, 'écriture manuscrite'],
  ['--ink-type', ['--surface-1'], min, 'machine à écrire'],
];
// Carte et illustrations : toponymes à l'encre sur chaque pigment PUR (pire cas, opacité 1)
const washes = ['safran', 'carmin', 'indigo', 'sienne', 'sauge', 'lilas', 'celadon', 'ardoise'];
const art = (min) => [
  ['--art-ink', ['--art-paper'], min, 'toponyme sur papier'],
  ['--art-ink-soft', ['--art-paper'], min, 'légende secondaire'],
  ['--art-water-ink', ['--art-paper'], min, 'nom de cours d’eau'],
  ['--art-water-ink', ['--art-water'], min, 'nom de cours d’eau sur l’eau'],
  ['--art-ink', ['--art-water-deep'], min, 'toponyme sur eau profonde'],
  ...washes.map((w) => ['--art-ink', [`--art-wash-${w}`], min, `toponyme sur lavis ${w} pur`]),
  ['--art-ink-faint', ['--art-paper'], NT, 'trait mine de plomb (non-texte)'],
];
// Illustration de nuit : même grille, plus le trait posé directement sur le bureau sombre
const night = (min) => [
  ...art(min),
  ['--art-ink', ['--canvas'], min, 'trait, toponyme sur le bureau'],
  ['--art-ink-soft', ['--canvas'], min, 'légende sur le bureau'],
  ['--art-ink-faint', ['--canvas'], NT, 'trait fin sur le bureau (non-texte)'],
];
// v2 : matières du bureau (chemises, fiches, ruban, étiqueteuse, vermillon de marque)
const materials = (min) => [
  ['--kraft-ink', ['--kraft'], min, 'texte sur kraft (chemise)'],
  ['--kraft-ink', ['--kraft-shade'], min, 'texte sur kraft ombré (dos de chemise)'],
  ['--kraft-ink', ['--manila'], min, 'texte sur manille (étiquette, onglet clair)'],
  ['--kraft-edge', ['--kraft'], NT, 'tranche du carton (contour, non-texte)'],
  ['--ink', ['--card'], min, 'texte sur fiche bristol'],
  ['--card-margin', ['--card'], NT, 'ligne de tête rouge (non-texte)'],
  // Case revendiquée (§6.9) : cartouche « Déclaré », valeurs déclarées, bord en tirets
  ['--claim-ink', ['--claim-paper'], min, 'cartouche « Déclaré » : texte et agrafe'],
  ['--claim-ink', ['--card'], min, 'valeur déclarée sur fiche bristol'],
  ['--claim-ink', ['--paper'], min, 'valeur déclarée (liste hiérarchique, papier)'],
  ['--claim-ink', ['--paper-aged'], min, 'valeur déclarée sur papier vieilli (survol)'],
  ['--claim-edge', ['--card'], NT, 'bord en tirets de la case revendiquée (non-texte)'],
  ['--claim-edge', ['--claim-paper'], NT, 'filet du cartouche (non-texte)'],
  ['--claim-paper', ['--canvas'], NT, 'cartouche à cheval sur le bord, côté bureau (non-texte)'],
  ['--ink', ['--tape', '--paper'], min, 'texte sous ruban adhésif'],
  ['--label-tape-text', ['--label-tape'], min, 'étiqueteuse : lettres en relief (bleu)'],
  ['--label-tape-text', ['--label-tape-red'], min, 'étiqueteuse : lettres en relief (rouge)'],
  ['--brand-contrast', ['--brand-fill'], min, 'texte sur aplat vermillon'],
  ['--brand', ['--canvas'], NT, 'vermillon : grand titre, filet (≥ 3)'],
  ['--brand', ['--surface-1'], NT, 'vermillon : ornement sur panneau (≥ 3)'],
  ['--fern', ['--canvas'], NT, 'fougère : ornement (≥ 3)'],
  ['--accent-contrast', ['--accent-edge'], NT, 'tranche du bouton principal (non-texte)'],
  ['--text', ['--lamp-pool', '--canvas'], min, 'texte dans le cône de la lampe'],
  // Art clé : voile de zone calme posé sur la feuille la plus claire de l'image (pire cas)
  ['--text-muted', ['--scrim-art', '--paper-new'], min, 'texte sur l’art clé (voile, pire cas)'],
  ['--brand', ['--scrim-art', '--paper-new'], min, '« aux » du titre sur l’art clé (pire cas)'],
];
// Chemise kraft (contexte [data-surface='kraft']) : les états ne vont que sur une étiquette
// (--surface-1 = manille), jamais à même le carton.
const kraftPairs = (min) => [
  ['--text', ['--canvas'], min, 'texte'],
  ['--text', ['--surface-1'], min, 'texte'],
  ['--text', ['--surface-2'], min, 'texte'],
  ['--text-muted', ['--canvas'], min, 'texte secondaire'],
  ['--text-muted', ['--surface-1'], min, 'texte secondaire'],
  ['--text-faint', ['--surface-1'], NT, 'grand texte, désactivé'],
  ['--line-strong', ['--canvas'], NT, 'bordure de contrôle'],
  ['--line-strong', ['--surface-1'], NT, 'bordure de contrôle'],
  ['--accent', ['--surface-1'], T, 'lien, texte d’action'],
  ['--accent', ['--canvas'], NT, 'accent (grand texte, icône)'],
  ['--accent-contrast', ['--accent'], T, 'texte du bouton principal'],
  ['--focus', ['--canvas'], NT, 'anneau de focus'],
  ['--focus', ['--surface-1'], NT, 'anneau de focus'],
  ['--keyword', ['--surface-1'], T, 'mot-clé souligné'],
  ['--danger', ['--surface-1'], T, 'erreur (étiquette)'],
  ['--success', ['--surface-1'], T, 'succès (étiquette)'],
  ['--warning', ['--surface-1'], T, 'avertissement (étiquette)'],
  ['--info', ['--surface-1'], T, 'information (étiquette)'],
  ['--established', ['--surface-1'], T, 'tampon « Établi » (étiquette)'],
  ['--established', ['--canvas'], NT, 'tampon « Établi » sur le carton (grand, ≥ 3)'],
  ['--brand', ['--canvas'], NT, 'vermillon sur kraft (≥ 3)'],
  ['--brand', ['--surface-1'], T, 'vermillon sur manille (texte)'],
];
const STATES = ['--danger', '--warning', '--success', '--info', '--established'];
const isStatePair = ([fg, bgs]) => [fg, ...bgs].some((t) => STATES.includes(t));
const pairs = {
  carte: art(T),
  'carte HC': art(AAA),
  'carte nuit': night(T),
  'carte nuit HC': night(AAA),
  lampe: [...common(T), ...deskOnly(T)],
  papier: [...common(T), ...paperOnly(T)],
  'lampe HC': [...common(AAA), ...deskOnly(AAA)],
  'papier HC': [...common(AAA), ...paperOnly(AAA)],
  matières: materials(T),
  'matières HC': materials(AAA),
  kraft: kraftPairs(T),
  'kraft HC': kraftPairs(AAA),
};
// Vision des couleurs : seuls les tons d'état changent → paires qui en impliquent un
for (const [name, { base }] of Object.entries(visionBase)) {
  pairs[name] = pairs[base].filter(isStatePair);
}

// Simulation des dichromasies (Machado, Oliveira, Fernandes 2009, sévérité 1), sRGB linéaire
const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const toLin = (rgb) => rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const toEnc = (lin) =>
  lin.map((c) => {
    c = Math.min(1, Math.max(0, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  });
const simulate = (rgb, kind) => {
  const lin = toLin(rgb);
  return toEnc(MACHADO[kind].map((r) => r[0] * lin[0] + r[1] * lin[1] + r[2] * lin[2]));
};
const oklab = (rgb) => {
  const [r, g, b] = toLin(rgb);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const deltaE = (a, b) => {
  const [x, y] = [oklab(a), oklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};
/** Écart OKLab minimal exigé entre deux tons d'état, en vision simulée. */
const MIN_DELTA_E = 0.06;

const args = new Set(process.argv.slice(2));
let failures = 0;
const gamut = new Set();
const report = [];

for (const [ctx, selectors] of Object.entries(contexts)) {
  const vars = scope(selectors);
  const color = (n) => {
    const c = parseColor(resolveVar(vars, n));
    if (c.outOfGamut) gamut.add(`${n} (${ctx})`);
    return c;
  };
  const rows = [];
  for (const [fg, bgs, min, usage] of pairs[ctx]) {
    let base = color(bgs.at(-1));
    let bg = base.rgb;
    for (const layer of bgs.slice(0, -1).reverse()) bg = over(color(layer), bg);
    const f = over(color(fg), bg);
    const r = ratio(f, bg);
    const ok = r >= min;
    if (!ok) failures++;
    rows.push({ fg, bg: bgs.join(' sur '), r, min, ok, usage, fgHex: hex(f), bgHex: hex(bg) });
    const vision = visionBase[ctx]?.vision;
    if (vision) {
      // Même paire vue par la personne concernée (le rouge s'assombrit en protanopie…)
      const kind = VISIONS[vision];
      const rs = ratio(simulate(f, kind), simulate(bg, kind));
      const oks = rs >= min;
      if (!oks) failures++;
      rows.push({
        fg,
        bg: bgs.join(' sur '),
        r: rs,
        min,
        ok: oks,
        usage: `${usage} (vision simulée)`,
        fgHex: hex(simulate(f, kind)),
        bgHex: hex(simulate(bg, kind)),
      });
    }
  }
  report.push({ ctx, rows });
}

// Tons d'état distinguables : écart minimal, en vision simulée, sur --surface-1
const distinct = [];
const stateColors = (ctx, kind) => {
  const vars = scope(contexts[ctx]);
  const surface = parseColor(resolveVar(vars, '--surface-1')).rgb;
  return STATES.map((t) => {
    const rgb = over(parseColor(resolveVar(vars, t)), surface);
    return { t, rgb: kind ? simulate(rgb, kind) : rgb };
  });
};
const minPair = (cols) => {
  let best = { d: Infinity, a: '', b: '' };
  for (let i = 0; i < cols.length; i++)
    for (let j = i + 1; j < cols.length; j++) {
      const d = deltaE(cols[i].rgb, cols[j].rgb);
      if (d < best.d) best = { d, a: cols[i].t, b: cols[j].t };
    }
  return best;
};
for (const [ctx, { base, vision }] of Object.entries(visionBase)) {
  const kind = VISIONS[vision];
  const now = minPair(stateColors(ctx, kind));
  const before = minPair(stateColors(base, kind));
  const ok = now.d >= MIN_DELTA_E && now.d > before.d;
  if (!ok) failures++;
  distinct.push({ ctx, now, before, ok });
}

if (args.has('--md')) {
  console.log(
    '\n#### Vision des couleurs : tons d’état distinguables (ΔE OKLab, vision simulée)\n',
  );
  console.log('| Contexte | Écart minimal (paire) | Palette par défaut | Seuil |');
  console.log('|---|---|---|---|');
  for (const { ctx, now, before, ok } of distinct) {
    const f = (x) => x.d.toFixed(3).replace('.', ',');
    console.log(
      `| ${ctx} | **${f(now)}** ${ok ? '✓' : '✗'} (\`${now.a}\` / \`${now.b}\`) | ${f(before)} (\`${before.a}\` / \`${before.b}\`) | ${String(MIN_DELTA_E).replace('.', ',')} et > défaut |`,
    );
  }
  for (const { ctx, rows } of report) {
    console.log(`\n#### Contexte ${ctx}\n`);
    console.log('| Premier plan | Fond | Ratio | Seuil | Usage |');
    console.log('|---|---|---|---|---|');
    for (const r of rows) {
      const v = r.r.toFixed(2).replace('.', ',');
      console.log(
        `| \`${r.fg}\` | \`${r.bg}\` | **${v}** ${r.ok ? '✓' : '✗'} | ${String(r.min).replace('.', ',')} | ${r.usage} |`,
      );
    }
  }
} else {
  console.log('\n== vision des couleurs : écart OKLab minimal entre tons d’état (vision simulée)');
  for (const { ctx, now, before, ok } of distinct) {
    console.log(
      `${ok ? 'ok ' : 'KO '} ${now.d.toFixed(3)} (>= ${MIN_DELTA_E}, défaut ${before.d.toFixed(3)})  ${ctx}  · ${now.a} / ${now.b}`,
    );
  }
  for (const { ctx, rows } of report) {
    console.log(`\n== ${ctx}`);
    for (const r of rows) {
      console.log(
        `${r.ok ? 'ok ' : 'KO '} ${r.r.toFixed(2).padStart(5)} (>= ${r.min})  ${r.fg} ${r.fgHex}  sur  ${r.bg} ${r.bgHex}  · ${r.usage}`,
      );
    }
  }
}
if (gamut.size) console.log(`\nHors gamut sRGB (écrêtées) : ${[...gamut].join(', ')}`);
console.log(
  `\n${failures === 0 ? 'Toutes les paires passent.' : `${failures} paire(s) sous le seuil.`}`,
);
if (args.has('--strict') && failures > 0) process.exit(1);
