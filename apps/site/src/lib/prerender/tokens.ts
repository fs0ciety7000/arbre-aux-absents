/**
 * Lecture des tokens du design system (`packages/ui/src/styles/tokens.css`) au prérendu, pour la
 * page Charte : la palette affichée est celle du code, jamais une copie. Les nuanciers peignent
 * avec `var(--token)` ; la valeur OKLCH et son équivalent hexadécimal sont calculés ici.
 */
import tokensCss from '@arbre/ui/styles/tokens.css?raw';

/** Déclarations des blocs `:root { … }` (hors contraste élevé et réglages). */
function rootDeclarations(css: string): Map<string, string> {
  const out = new Map<string, string>();
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
    for (const d of m[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      out.set(d[1]!, d[2]!.trim().replace(/\s+/g, ' '));
    }
  }
  return out;
}

const DECLS = rootDeclarations(tokensCss);

/** Valeur résolue d'un token (suit les `var(--…)` en chaîne). */
export function tokenValue(name: string, depth = 0): string | null {
  const raw = DECLS.get(name);
  if (raw === undefined || depth > 8) return null;
  const ref = /^var\((--[\w-]+)\)$/.exec(raw);
  return ref ? tokenValue(ref[1]!, depth + 1) : raw;
}

/** OKLCH (`oklch(L C H)`, sans alpha) → `#rrggbb` (Ottosson, sRGB écrêté). */
export function oklchToHex(value: string): string | null {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value);
  if (!m) return null;
  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const [l, mm, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  const hex = lin
    .map((c) => {
      const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;
      return Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('');
  return `#${hex}`;
}

export interface Swatch {
  token: string;
  name: string;
  usage: string;
  value: string;
  hex: string | null;
}

export interface SwatchGroup {
  title: string;
  intro: string;
  swatches: Swatch[];
}

/** Textes de la palette dans une langue (`STRINGS[lang].palette`). */
export interface PaletteTexts {
  groups: { title: string; intro: string }[];
  swatches: Record<string, [name: string, usage: string]>;
}

/** Familles de la charte v2 (DESIGN §3 et §10.3) : tokens, dans l'ordre d'affichage. */
const GROUPS: string[][] = [
  ['--canvas', '--surface-1', '--surface-2', '--line-strong', '--text', '--text-muted'],
  [
    '--accent',
    '--accent-edge',
    '--brand',
    '--brand-fill',
    '--fern',
    '--fern-deep',
    '--established',
  ],
  [
    '--paper-new',
    '--paper',
    '--paper-aged',
    '--paper-stain',
    '--ink',
    '--ink-muted',
    '--ink-hand',
    '--paper-accent',
  ],
  [
    '--kraft',
    '--kraft-shade',
    '--manila',
    '--card',
    '--card-rule',
    '--card-margin',
    '--label-tape',
    '--label-tape-red',
  ],
  [
    '--wood',
    '--wood-lit',
    '--velvet',
    '--dusk-rose',
    '--dusk-lilac',
    '--dusk-peach',
    '--scrim-art',
  ],
  [
    '--art-wash-safran',
    '--art-wash-carmin',
    '--art-wash-indigo',
    '--art-wash-sienne',
    '--art-wash-sauge',
    '--art-wash-lilas',
    '--art-wash-celadon',
    '--art-wash-ardoise',
    '--art-water',
    '--art-water-deep',
  ],
];

function swatch(token: string, texts: PaletteTexts): Swatch {
  const [name, usage] = texts.swatches[token] ?? [token, ''];
  const value = tokenValue(token) ?? '';
  return { token, name, usage, value, hex: oklchToHex(value) };
}

/** Palette de la charte, par familles, avec les textes d'une langue. */
export function paletteGroups(texts: PaletteTexts): SwatchGroup[] {
  return GROUPS.map((tokens, i) => ({
    title: texts.groups[i]?.title ?? '',
    intro: texts.groups[i]?.intro ?? '',
    swatches: tokens.map((token) => swatch(token, texts)),
  }));
}
