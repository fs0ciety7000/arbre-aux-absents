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
 */
import wideSrc from '../../../../../art/keyart/keyart-desk.svg?raw';
import tallSrc from '../../../../../art/keyart/keyart-desk-tall.svg?raw';
import vineSrc from '../../../../../art/keyart/flourish-fern-vine.svg?raw';
import sealSrc from '../../../../../art/keyart/flourish-seal.svg?raw';
import tamponSrc from '../../../../../art/keyart/flourish-tampon.svg?raw';
import { parseSvg, type SvgChild, type SvgNode } from '#lib/svg/parse';
import { serialize, standaloneSvg, type StandaloneSvg } from '#lib/prerender/standalone';
import { resolve } from '$app/paths';
import type { ArtImage } from '#lib/prerender/art';

const spotFiles = import.meta.glob('../../../../../art/keyart/spot-*.svg', {
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

function split(name: string, source: string): KeyArtParts {
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
  return { still: standaloneSvg(name, viewBox, still), live: liveMarkup, alt: desc };
}

let cache: { wide: KeyArtParts; tall: KeyArtParts } | undefined;

/** L'art clé, 16:9 et 4:5 (recomposé pour le téléphone). */
export function keyArt(): { wide: KeyArtParts; tall: KeyArtParts } {
  return (cache ??= {
    wide: split('keyart-desk', wideSrc),
    tall: split('keyart-desk-tall', tallSrc),
  });
}

const base = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');

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

let spotCache: Map<string, StandaloneSvg> | undefined;
function spots(): Map<string, StandaloneSvg> {
  return (spotCache ??= new Map(
    Object.entries(spotFiles).map(([p, src]) => [base(p), standaloneFrom(base(p), src)]),
  ));
}

let vineCache: StandaloneSvg | undefined;
const vine = () => (vineCache ??= standaloneFrom('flourish-fern-vine', vineSrc));

const image = (f: StandaloneSvg): ArtImage => ({
  src: resolve('/art/[file]', { file: f.file }),
  width: f.width,
  height: f.height,
});

/** Vignette d'aquarelle (`spot-<nom>.svg`), servie en SVG autonome. */
export function spotImage(name: SpotName): ArtImage {
  const f = spots().get(`spot-${name}`);
  if (!f) throw new Error(`keyart: vignette spot-${name} introuvable`);
  return image(f);
}

/** Vigne de fougère (séparateur de section), servie en SVG autonome. */
export function vineImage(): ArtImage {
  return image(vine());
}

let flourishCache: Record<'seal' | 'tampon', StandaloneSvg> | undefined;
const flourishes = () =>
  (flourishCache ??= {
    seal: standaloneFrom('flourish-seal', sealSrc),
    tampon: standaloneFrom('flourish-tampon', tamponSrc),
  });

/** Ornements gravés (sceau, tampon « Établi »), servis en SVG autonomes. */
export function flourishImage(name: 'seal' | 'tampon'): ArtImage {
  return image(flourishes()[name]);
}

let fullCache: { wide: StandaloneSvg; tall: StandaloneSvg } | undefined;
const full = () =>
  (fullCache ??= {
    wide: standaloneFrom('keyart-desk-full', wideSrc),
    tall: standaloneFrom('keyart-desk-tall-full', tallSrc),
  });

/** L'art clé entier, figé (artbook, 404) : une seule image autonome, chargée en différé. */
export function keyArtFullImages(): { wide: ArtImage; tall: ArtImage; alt: string } {
  return { wide: image(full().wide), tall: image(full().tall), alt: keyArt().wide.alt };
}

/** Fond de l'art clé (16:9 et 4:5) en images autonomes. */
export function keyArtImages(): { wide: ArtImage; tall: ArtImage } {
  const { wide, tall } = keyArt();
  return { wide: image(wide.still), tall: image(tall.still) };
}

/** Tous les SVG autonomes de ce module (route `/art/[file]`). */
export function keyArtFiles(): StandaloneSvg[] {
  const { wide, tall } = keyArt();
  const f = flourishes();
  return [
    wide.still,
    tall.still,
    full().wide,
    full().tall,
    vine(),
    f.seal,
    f.tampon,
    ...spots().values(),
  ];
}
