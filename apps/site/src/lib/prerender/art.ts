/**
 * Art du jeu lu au prérendu (serveur seulement) : couches de la carte (`art/map/*.svg`, cartographe)
 * et portraits (`content/cases/<id>/portraits/*.svg`). Rien de tout cela n'arrive dans le JS client :
 * les pages qui l'utilisent sont prérendues sans hydratation (`csr = false`).
 * Les fichiers absents (cartographe pas encore livré) donnent `null` : les pages ont un repli.
 */
import { resolve } from '$app/paths';
import { parseSvg, type SvgNode } from '#lib/svg/parse';
import { MAP_LAYERS } from '#lib/content/world';
import { keyArtFiles } from '#lib/prerender/keyart';
import { PORTRAIT_PLATES } from '#lib/content/portraits';
import {
  onlyText,
  standaloneSvg,
  withoutText,
  type StandaloneSvg,
} from '#lib/prerender/standalone';

const mapFiles = import.meta.glob('../../../../../art/map/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const portraitFiles = import.meta.glob('../../../../../content/cases/*/portraits/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Id de personne → id neutre du fichier de portrait (cartographe). */
const portraitIds = import.meta.glob('../../../../../art/tools/portraits/ids.json', {
  import: 'default',
  eager: true,
}) as Record<string, Record<string, string>>;
const PORTRAIT_IDS: Record<string, string> = Object.values(portraitIds)[0] ?? {};

const base = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');

/** Couches de la carte, une `<g data-map-layer>` chacune, dans l'ordre de dessin. */
function mapLayers(): { viewBox: string; groups: SvgNode[] } | null {
  const byName = new Map(Object.entries(mapFiles).map(([p, src]) => [base(p), src]));
  const groups: SvgNode[] = [];
  let viewBox = '';
  for (const layer of MAP_LAYERS) {
    const src = byName.get(layer);
    const root = src ? parseSvg(src) : null;
    if (!root) continue;
    viewBox ||= root.a.viewBox ?? '';
    groups.push({ t: 'g', a: { 'data-map-layer': layer }, c: root.c });
  }
  return groups.length ? { viewBox: viewBox || '0 0 1350 1000', groups } : null;
}

interface MapParts {
  viewBox: string;
  /** Fond (papier, côtes) puis détail (relief, eaux, vignettes, cadre), sans texte. */
  files: StandaloneSvg[];
  /** Toponymes : les `<text>` des couches, avec leurs groupes (transformations). */
  text: SvgNode[];
}

let mapCache: MapParts | null | undefined;

function worldMapParts(): MapParts | null {
  if (mapCache !== undefined) return mapCache;
  const layers = mapLayers();
  if (!layers) return (mapCache = null);
  const { viewBox, groups } = layers;
  const [first, ...rest] = groups.map((g) => withoutText(g));
  const files = [standaloneSvg('carte-velmarche-fond', viewBox, [first!])];
  if (rest.length) files.push(standaloneSvg('carte-velmarche-detail', viewBox, rest));
  const text = groups.flatMap((g) => onlyText(g) ?? []);
  return (mapCache = { viewBox, files, text });
}

/**
 * La carte du monde en un seul SVG inline (viewBox `0 0 1350 1000`), allégé : le dessin est servi
 * par des SVG externes mis en cache (`/art/carte-velmarche-*.<hash>.svg`, deux `<image>`
 * superposées dans l'ordre des couches) et seuls les toponymes (`<text>`) restent inline,
 * par-dessus, pour garder les polices du site (une image SVG ne charge pas de police externe).
 * Mêmes coordonnées qu'avant : recadrages (`viewBox`) et `<use>` restent valables.
 *
 * `inlineFond` (carte au-dessus de la ligne de flottaison) : le fond (papier et côtes, ~18 Ko
 * gzip) est embarqué en URL `data:` ; la carte apparaît avec le HTML et le LCP mobile ne dépend
 * plus d'une requête concurrente des polices. Le détail, lourd, reste un fichier en cache.
 */
export function worldMap({ inlineFond = false }: { inlineFond?: boolean } = {}): SvgNode | null {
  const parts = worldMapParts();
  if (!parts) return null;
  const [x = 0, y = 0] = parts.viewBox.split(/[\s,]+/).map(Number);
  const images: SvgNode[] = parts.files.map((f, i) => ({
    t: 'image',
    a: {
      href: i === 0 && inlineFond ? dataUrl(f) : artUrl(f),
      x: String(x),
      y: String(y),
      width: String(f.width),
      height: String(f.height),
    },
    c: [],
  }));
  return { t: 'svg', a: { viewBox: parts.viewBox }, c: [...images, ...parts.text] };
}

/**
 * La carte en trois couches séparées, pour l'encrer couche par couche (InkReveal, DESIGN §13.6) :
 * fond et détail en images autonomes, toponymes en SVG inline (polices du site).
 */
export function worldMapLayers(): { viewBox: string; images: ArtImage[]; text: SvgNode } | null {
  const parts = worldMapParts();
  if (!parts) return null;
  return {
    viewBox: parts.viewBox,
    images: parts.files.map((f) => ({ src: artUrl(f), width: f.width, height: f.height })),
    text: { t: 'svg', a: { viewBox: parts.viewBox }, c: parts.text },
  };
}

/** URL `data:` d'un SVG autonome (encodage minimal : `%`, `#` et fins de ligne). */
function dataUrl(f: StandaloneSvg): string {
  const body = f.body.trim().replace(/%/g, '%25').replace(/#/g, '%23').replace(/\n/g, '%0A');
  return `data:image/svg+xml,${body}`;
}

/** URL publiée d'un SVG autonome (route prérendue `/art/[file]`). */
function artUrl(f: StandaloneSvg): string {
  return resolve('/art/[file]', { file: f.file });
}

const portraitCache = new Map<string, SvgNode | null>();

/** Portrait d'une personne (id de l'affaire), ou `null` s'il n'existe pas encore. */
export function portrait(person: string): SvgNode | null {
  if (portraitCache.has(person)) return portraitCache.get(person)!;
  const name = PORTRAIT_IDS[person] ?? person;
  const entry = Object.entries(portraitFiles).find(([p]) => base(p) === name);
  const node = entry ? parseSvg(entry[1]) : null;
  portraitCache.set(person, node);
  return node;
}

const portraitFileCache = new Map<string, StandaloneSvg | null>();

function portraitFile(person: string): StandaloneSvg | null {
  if (portraitFileCache.has(person)) return portraitFileCache.get(person)!;
  const node = portrait(person);
  const file = node
    ? standaloneSvg(PORTRAIT_IDS[person] ?? person, node.a.viewBox ?? '0 0 160 200', node.c)
    : null;
  portraitFileCache.set(person, file);
  return file;
}

export interface ArtImage {
  src: string;
  width: number;
  height: number;
}

/** Portrait servi comme image externe mise en cache (`/art/<id neutre>.<hash>.svg`). */
export function portraitImage(person: string): ArtImage | null {
  const f = portraitFile(person);
  return f ? { src: artUrl(f), width: f.width, height: f.height } : null;
}

/** Tous les SVG autonomes publiés sous `/art/` (entrées de la route prérendue). */
export function artFiles(): StandaloneSvg[] {
  const out: StandaloneSvg[] = [...keyArtFiles()];
  out.push(...(worldMapParts()?.files ?? []));
  for (const { person } of PORTRAIT_PLATES) {
    const f = portraitFile(person);
    if (f && !out.some((o) => o.file === f.file)) out.push(f);
  }
  return out;
}

/**
 * Quelques lieux de la couche `places` (groupes `<g id="place-<id>">`), pour un extrait léger de
 * la carte (page /design, hydratée : on n'y sérialise pas la carte entière).
 */
export function placeGroups(ids: string[]): SvgNode[] {
  const src = Object.entries(mapFiles).find(([p]) => base(p) === 'places')?.[1];
  const root = src ? parseSvg(src) : null;
  if (!root) return [];
  const out: SvgNode[] = [];
  const walk = (n: SvgNode) => {
    for (const c of n.c) {
      if (typeof c === 'string') continue;
      if (c.t === 'g' && ids.includes((c.a.id ?? '').replace(/^place-/, ''))) out.push(c);
      else walk(c);
    }
  };
  walk(root);
  return out;
}
