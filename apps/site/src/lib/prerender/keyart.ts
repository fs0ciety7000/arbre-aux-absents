/**
 * Art clé « Le bureau sous la lampe » (art/keyart, DESIGN §8.5) pour le héros du site, et
 * vignettes et ornements du site (spot-*.svg, vigne de fougère), lus au prérendu seulement.
 *
 * Performance (LCP mobile < 2 s) : l'art clé fait ~200 Ko de SVG. Il est coupé en deux, sans
 * rien redessiner, à la frontière du premier groupe animé (`-curtain`), qui est aussi le début
 * des derniers éléments peints (rideau, lampe, lumière, poussières, vapeur) :
 * - **le fond** (tout ce qui est peint avant) : SVG autonome externe, mis en cache, chargé par
 *   `<picture>` (16:9 ou 4:5 selon la largeur, sans JS) ;
 * - **la scène vivante** (le reste, ~26 Ko) : inline dans `<KeyArt animate>`, posée exactement
 *   par-dessus (même viewBox, même cadrage) ; seules ces couches bougent, en transform/opacity.
 * L'ordre de peinture est conservé, le rendu est identique à l'image d'origine.
 *
 * Langues : un fichier de `art/keyart/locales/<langue>/` remplace son homonyme français dans
 * cette langue (texte dessiné : étiquettes, tampon). Ses SVG autonomes portent le suffixe
 * `-<langue>` (`keyart-desk-en.<hash>.svg`) ; sans surcharge, la langue reprend le français.
 */
import wideSrc from '../../../../../art/keyart/keyart-desk.svg?raw';
import tallSrc from '../../../../../art/keyart/keyart-desk-tall.svg?raw';
import vineSrc from '../../../../../art/keyart/flourish-fern-vine.svg?raw';
import sealSrc from '../../../../../art/keyart/flourish-seal.svg?raw';
import tamponSrc from '../../../../../art/keyart/flourish-tampon.svg?raw';
import { parseSvg, type SvgChild, type SvgNode } from '#lib/svg/parse';
import { serialize, standaloneSvg, type StandaloneSvg } from '#lib/prerender/standalone';
import { resolve } from '$app/paths';
import type { Locale } from '@arbre/contract';
import type { ArtImage } from '#lib/prerender/art';

const spotFiles = import.meta.glob('../../../../../art/keyart/spot-*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Surcharges par langue : `art/keyart/locales/<langue>/<nom>.svg`. */
const localeFiles = import.meta.glob('../../../../../art/keyart/locales/*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const isNode = (c: SvgChild): c is SvgNode => typeof c !== 'string';

/** Ids référencés (`url(#x)`, `href="#x"`) dans un sous-arbre. */
function refs(n: SvgNode, out = new Set<string>()): Set<string> {
  for (const v of Object.values(n.a)) {
    for (const m of v.matchAll(/url\(#([^)]+)\)/g)) out.add(m[1]!);
    if (v.startsWith('#')) out.add(v.slice(1));
  }
  for (const c of n.c) if (isNode(c)) refs(c, out);
  return out;
}

export interface KeyArtParts {
  /** Fond autonome (`/art/keyart-desk.<hash>.svg`). */
  still: StandaloneSvg;
  /** Scène vivante : balisage SVG inline (racine `.art`, viewBox d'origine) pour `<KeyArt>`. */
  live: string;
  /** Description de la scène (le `<desc>` du SVG source), pour le texte alternatif. */
  alt: string;
}

function split(name: string, source: string, file = name): KeyArtParts {
  const root = parseSvg(source);
  if (!root) throw new Error(`keyart: ${name} illisible`);
  const viewBox = root.a.viewBox ?? '0 0 1600 900';
  const kids = root.c.filter(isNode);
  const cut = kids.findIndex((k) => k.a.id === `${name}-curtain`);
  if (cut < 0) throw new Error(`keyart: groupe ${name}-curtain introuvable`);
  const still = kids.slice(0, cut);
  const live = kids.slice(cut);
  // Définitions (dégradés, découpes) dont la scène vivante a besoin, avec leurs dépendances.
  const defs = kids.find((k) => k.t === 'defs');
  const byId = new Map((defs?.c ?? []).filter(isNode).map((d) => [d.a.id, d]));
  const needed = new Set<string>();
  const queue = [...live.flatMap((g) => [...refs(g)])];
  while (queue.length) {
    const id = queue.pop()!;
    if (needed.has(id) || !byId.has(id)) continue;
    needed.add(id);
    queue.push(...refs(byId.get(id)!));
  }
  const liveDefs = [...needed].map((id) => byId.get(id)!);
  const liveMarkup =
    `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${viewBox}" focusable="false">` +
    (liveDefs.length ? `<defs>${liveDefs.map(serialize).join('')}</defs>` : '') +
    live.map(serialize).join('') +
    '</svg>';
  const desc = /<desc>([\s\S]*?)<\/desc>/.exec(source)?.[1]?.trim() ?? '';
  return { still: standaloneSvg(file, viewBox, still), live: liveMarkup, alt: desc };
}

const base = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');

/** Langues qui ont des surcharges, et leurs fichiers (`en` → `keyart-desk` → source). */
const OVERRIDES = new Map<string, Map<string, string>>();
for (const [p, src] of Object.entries(localeFiles)) {
  const lang = /\/locales\/([^/]+)\//.exec(p)?.[1];
  if (!lang) continue;
  if (!OVERRIDES.has(lang)) OVERRIDES.set(lang, new Map());
  OVERRIDES.get(lang)!.set(base(p), src);
}

/** Source d'un fichier dans une langue (surcharge, sinon le français) et nom de son SVG autonome. */
function pick(lang: Locale, name: string, fallback: string): { source: string; file: string } {
  const own = OVERRIDES.get(lang)?.get(name);
  return own ? { source: own, file: `${name}-${lang}` } : { source: fallback, file: name };
}

/** Langues à produire pour la route `/art/[file]` : le français et chaque langue surchargée. */
const LANGS = (): Locale[] => [
  'fr',
  ...([...OVERRIDES.keys()].filter((l) => l !== 'fr') as Locale[]),
];

const cache = new Map<Locale, { wide: KeyArtParts; tall: KeyArtParts }>();

/** L'art clé, 16:9 et 4:5 (recomposé pour le téléphone), dans une langue. */
export function keyArt(lang: Locale = 'fr'): { wide: KeyArtParts; tall: KeyArtParts } {
  let v = cache.get(lang);
  if (!v) {
    const w = pick(lang, 'keyart-desk', wideSrc);
    const t = pick(lang, 'keyart-desk-tall', tallSrc);
    v = {
      wide: split('keyart-desk', w.source, w.file),
      tall: split('keyart-desk-tall', t.source, t.file),
    };
    cache.set(lang, v);
  }
  return v;
}

function standaloneFrom(name: string, source: string): StandaloneSvg {
  const root = parseSvg(source);
  if (!root) throw new Error(`keyart: ${name} illisible`);
  return standaloneSvg(name, root.a.viewBox ?? '0 0 240 200', root.c);
}

export type SpotName =
  | 'archives'
  | 'catalogue'
  | 'map-pin'
  | 'tree'
  | 'stamp'
  | 'magnifier'
  | 'letter'
  | 'fern'
  | 'lighthouse'
  | 'register';

const spotCache = new Map<Locale, Map<string, StandaloneSvg>>();
function spots(lang: Locale): Map<string, StandaloneSvg> {
  let v = spotCache.get(lang);
  if (!v) {
    v = new Map(
      Object.entries(spotFiles).map(([p, src]) => {
        const { source, file } = pick(lang, base(p), src);
        return [base(p), standaloneFrom(file, source)];
      }),
    );
    spotCache.set(lang, v);
  }
  return v;
}

let vineCache: StandaloneSvg | undefined;
const vine = () => (vineCache ??= standaloneFrom('flourish-fern-vine', vineSrc));

const image = (f: StandaloneSvg): ArtImage => ({
  src: resolve('/art/[file]', { file: f.file }),
  width: f.width,
  height: f.height,
});

/** Vignette d'aquarelle (`spot-<nom>.svg`) dans une langue, servie en SVG autonome. */
export function spotImage(name: SpotName, lang: Locale = 'fr'): ArtImage {
  const f = spots(lang).get(`spot-${name}`);
  if (!f) throw new Error(`keyart: vignette spot-${name} introuvable`);
  return image(f);
}

/** Vigne de fougère (séparateur de section), servie en SVG autonome (sans texte). */
export function vineImage(): ArtImage {
  return image(vine());
}

type FlourishName = 'seal' | 'tampon';
const flourishCache = new Map<Locale, Record<FlourishName, StandaloneSvg>>();
function flourishes(lang: Locale): Record<FlourishName, StandaloneSvg> {
  let v = flourishCache.get(lang);
  if (!v) {
    const seal = pick(lang, 'flourish-seal', sealSrc);
    const tampon = pick(lang, 'flourish-tampon', tamponSrc);
    v = {
      seal: standaloneFrom(seal.file, seal.source),
      tampon: standaloneFrom(tampon.file, tampon.source),
    };
    flourishCache.set(lang, v);
  }
  return v;
}

/** Ornements gravés (sceau, tampon « Établi »), servis en SVG autonomes. */
export function flourishImage(name: FlourishName, lang: Locale = 'fr'): ArtImage {
  return image(flourishes(lang)[name]);
}

const fullCache = new Map<Locale, { wide: StandaloneSvg; tall: StandaloneSvg }>();
function full(lang: Locale) {
  let v = fullCache.get(lang);
  if (!v) {
    const w = pick(lang, 'keyart-desk', wideSrc);
    const t = pick(lang, 'keyart-desk-tall', tallSrc);
    const suffix = (f: string) => f.replace(/^(keyart-desk(?:-tall)?)/, '$1-full');
    v = {
      wide: standaloneFrom(suffix(w.file), w.source),
      tall: standaloneFrom(suffix(t.file), t.source),
    };
    fullCache.set(lang, v);
  }
  return v;
}

/** L'art clé entier, figé (artbook, 404) : une seule image autonome, chargée en différé. */
export function keyArtFullImages(lang: Locale = 'fr'): {
  wide: ArtImage;
  tall: ArtImage;
  alt: string;
} {
  const f = full(lang);
  return { wide: image(f.wide), tall: image(f.tall), alt: keyArt(lang).wide.alt };
}

/** Fond de l'art clé (16:9 et 4:5) en images autonomes. */
export function keyArtImages(lang: Locale = 'fr'): { wide: ArtImage; tall: ArtImage } {
  const { wide, tall } = keyArt(lang);
  return { wide: image(wide.still), tall: image(tall.still) };
}

/** Tous les SVG autonomes de ce module, dans chaque langue (route `/art/[file]`, noms uniques). */
export function keyArtFiles(): StandaloneSvg[] {
  const byFile = new Map<string, StandaloneSvg>();
  for (const lang of LANGS()) {
    const { wide, tall } = keyArt(lang);
    const fl = flourishes(lang);
    const fu = full(lang);
    for (const f of [
      wide.still,
      tall.still,
      fu.wide,
      fu.tall,
      fl.seal,
      fl.tampon,
      ...spots(lang).values(),
    ])
      byFile.set(f.file, f);
  }
  byFile.set(vine().file, vine());
  return [...byFile.values()];
}
