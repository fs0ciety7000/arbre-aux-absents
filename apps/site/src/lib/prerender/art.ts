/**
 * Art du jeu lu au prérendu (serveur seulement) : couches de la carte (`art/map/*.svg`, cartographe)
 * et portraits (`content/cases/<id>/portraits/*.svg`). Rien de tout cela n'arrive dans le JS client :
 * les pages qui l'utilisent sont prérendues sans hydratation (`csr = false`).
 * Les fichiers absents (cartographe pas encore livré) donnent `null` : les pages ont un repli.
 */
import { parseSvg, type SvgNode } from '#lib/svg/parse';
import { MAP_LAYERS } from '#lib/content/world';

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

let mapCache: SvgNode | null | undefined;

/**
 * La carte du monde en un seul SVG : une `<g data-map-layer>` par couche, dans l'ordre de dessin.
 * Toutes les couches partagent le viewBox `0 0 1350 1000`.
 */
export function worldMap(): SvgNode | null {
  if (mapCache !== undefined) return mapCache;
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
  mapCache = groups.length
    ? { t: 'svg', a: { viewBox: viewBox || '0 0 1350 1000' }, c: groups }
    : null;
  return mapCache;
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
