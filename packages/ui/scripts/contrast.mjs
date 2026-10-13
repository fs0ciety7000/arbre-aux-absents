#!/usr/bin/env node
// Calcul des contrastes WCAG 2.2 des tokens de couleur (docs/DESIGN.md §2.6).
// Usage : node packages/ui/scripts/contrast.mjs [--md] [--strict]
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
const contexts = {
  lampe: [ROOT],
  papier: [ROOT, PAPER],
  'lampe HC': [ROOT, HC],
  'papier HC': [ROOT, HC, PAPER, HC_PAPER],
  carte: [ROOT],
  'carte HC': [ROOT, HC],
};

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
  ['--success', ['--surface-3'], T, 'pastille douce'],
  ['--danger', ['--surface-3'], T, 'pastille douce'],
  ['--established', ['--surface-3'], T, 'pastille douce'],
  ['--accent', ['--surface-3'], T, 'pastille douce'],
  ['--canvas', ['--text'], T, 'info-bulle (inversée)'],
  ['--text', ['--selection', '--surface-1'], T, 'sélection de texte'],
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
const pairs = {
  carte: art(T),
  'carte HC': art(AAA),
  lampe: common(T),
  papier: [...common(T), ...paperOnly(T)],
  'lampe HC': common(AAA),
  'papier HC': [...common(AAA), ...paperOnly(AAA)],
};

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
  }
  report.push({ ctx, rows });
}

if (args.has('--md')) {
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
