/**
 * Préparation pure de l'AST d'un document pour le rendu (`DocumentBody`) : adressage des
 * conteneurs de texte (surlignages), décalages de caractères, découpe des textes par
 * surlignage. Aucun HTML : le rendu ne produit que des nœuds texte Svelte.
 *
 * Adressage d'un conteneur de texte (`path`) :
 * - `p`, `signature`, `h`, légende de `figure` : `[b]`
 * - `quote` : `[b, ...chemin du bloc enfant]`
 * - élément de liste : `[b, i]`
 * - cellule de tableau : `[b, 0, c]` (en-tête), `[b, r + 1, c]` (ligne r)
 * Décalages : texte brut du conteneur, où `redacted` compte `length` caractères.
 */
import type { Block, Inline, KeywordId, PortraitId } from '@arbre/contract';

export type HighlightColor = 1 | 2 | 3 | 4 | 5;

export interface HighlightRange {
  start: number;
  end: number;
  color: HighlightColor;
  /** Rang dans `notebook.highlights` (pour le retirer). */
  index: number;
}

export interface Segment {
  v: string;
  /** Décalage du premier caractère dans le conteneur. */
  start: number;
  color: HighlightColor | null;
  index: number | null;
}

export type RNode =
  | { t: 'text'; segments: Segment[] }
  | { t: 'em' | 'strong' | 'hand' | 'strike'; c: RNode[] }
  | { t: 'ref'; keyword: KeywordId; label: string; c: RNode[] }
  | { t: 'redacted'; length: number; start: number }
  /** Marque dessinée (`::mark`) : aucun caractère, rendu à la charge du Lecteur. */
  | { t: 'mark'; portrait: PortraitId };

/** Texte brut d'une suite d'inlines (redacted : `length` caractères pleins). */
export function inlineText(nodes: readonly Inline[]): string {
  let out = '';
  for (const n of nodes) {
    if (n.t === 'text') out += n.v;
    else if (n.t === 'redacted') out += '█'.repeat(Math.max(0, n.length));
    else if (n.t !== 'mark') out += inlineText(n.c);
  }
  return out;
}

/** Libellé lisible d'un mot-clé tel qu'il est écrit dans le texte. */
export function refLabel(nodes: readonly Inline[]): string {
  return inlineText(nodes).replace(/█+/g, '…').trim();
}

/** Découpe `v` (débutant en `start`) selon les surlignages ; le dernier posé l'emporte. */
export function segmentText(
  v: string,
  start: number,
  ranges: readonly HighlightRange[],
): Segment[] {
  if (v.length === 0) return [];
  const hits = ranges.filter((r) => r.end > start && r.start < start + v.length && r.end > r.start);
  if (hits.length === 0) return [{ v, start, color: null, index: null }];
  const cuts = new Set<number>([0, v.length]);
  for (const r of hits) {
    cuts.add(Math.max(0, r.start - start));
    cuts.add(Math.min(v.length, r.end - start));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (b <= a) continue;
    let top: HighlightRange | null = null;
    for (const r of hits) if (r.start <= start + a && r.end >= start + b) top = r;
    const piece = v.slice(a, b);
    const prev = out[out.length - 1];
    if (prev && prev.color === (top?.color ?? null) && prev.index === (top?.index ?? null)) {
      prev.v += piece;
    } else {
      out.push({
        v: piece,
        start: start + a,
        color: top?.color ?? null,
        index: top?.index ?? null,
      });
    }
  }
  return out;
}

/** Arbre de rendu d'un conteneur : décalages calculés, textes découpés par surlignage. */
export function layoutInlines(
  nodes: readonly Inline[],
  ranges: readonly HighlightRange[] = [],
): RNode[] {
  let offset = 0;
  const walk = (list: readonly Inline[]): RNode[] =>
    list.map((n): RNode => {
      switch (n.t) {
        case 'text': {
          const node: RNode = { t: 'text', segments: segmentText(n.v, offset, ranges) };
          offset += n.v.length;
          return node;
        }
        case 'redacted': {
          const length = Math.max(0, n.length);
          const node: RNode = { t: 'redacted', length, start: offset };
          offset += length;
          return node;
        }
        case 'ref':
          return { t: 'ref', keyword: n.keyword, label: refLabel(n.c), c: walk(n.c) };
        case 'mark':
          return { t: 'mark', portrait: n.portrait };
        default:
          return { t: n.t, c: walk(n.c) };
      }
    });
  return walk(nodes);
}

/** Conteneur de texte désigné par `path`, ou `null`. */
export function containerAt(blocks: readonly Block[], path: readonly number[]): Inline[] | null {
  const [b, ...rest] = path;
  if (b === undefined) return null;
  const block = blocks[b];
  if (!block) return null;
  switch (block.t) {
    case 'p':
    case 'signature':
    case 'h':
      return rest.length === 0 ? block.c : null;
    case 'figure':
      return rest.length === 0 ? (block.caption ?? null) : null;
    case 'quote':
      return containerAt(block.c, rest);
    case 'list': {
      const [i] = rest;
      return rest.length === 1 && i !== undefined ? (block.items[i] ?? null) : null;
    }
    case 'table': {
      const [r, c] = rest;
      if (rest.length !== 2 || r === undefined || c === undefined) return null;
      const row = r === 0 ? block.head : block.rows[r - 1];
      return row?.[c] ?? null;
    }
    default:
      return null;
  }
}

export const pathKey = (path: readonly number[]): string => path.join('.');

/**
 * Un surlignage est une position dans le texte d'une langue (D5) : il ne s'affiche que dans sa
 * langue (`lang` absent = français) et reste conservé dans les autres.
 */
export function inLanguage(h: { lang?: string }, lang: string): boolean {
  return (h.lang ?? 'fr') === lang;
}

/** Surlignages d'un document indexés par conteneur, pour le texte d'une langue. */
export function rangesByPath(
  highlights: readonly {
    doc: string;
    path: number[];
    start: number;
    end: number;
    color: HighlightColor;
    lang?: string;
  }[],
  doc: string,
  lang = 'fr',
): Map<string, HighlightRange[]> {
  const out = new Map<string, HighlightRange[]>();
  highlights.forEach((h, index) => {
    if (h.doc !== doc || !inLanguage(h, lang)) return;
    const key = pathKey(h.path);
    const list = out.get(key) ?? [];
    list.push({ start: h.start, end: h.end, color: h.color, index });
    out.set(key, list);
  });
  return out;
}

/** Extrait lisible d'un passage surligné (carnet, indices). */
export function passageText(
  blocks: readonly Block[],
  path: readonly number[],
  start: number,
  end: number,
): string {
  const c = containerAt(blocks, path);
  if (!c) return '';
  return inlineText(c).slice(Math.max(0, start), Math.max(0, end)).replace(/█+/g, '…').trim();
}

/** Recto / verso : les figures sont au recto, le texte au verso (photos, cartes postales). */
export function splitFaces(blocks: readonly Block[]): { front: number[]; back: number[] } {
  const front: number[] = [];
  const back: number[] = [];
  blocks.forEach((b, i) => (b.t === 'figure' ? front : back).push(i));
  return { front, back };
}

/**
 * Illustration d'en-tête d'un document (`illustration: { file, alt }` du frontmatter), à
 * montrer en tête de la pièce. `null` si le document n'en a pas, ou si le corps contient déjà
 * une figure du même fichier (pas de doublon).
 */
export function leadIllustration(doc: {
  illustration?: { file: string; alt: string };
  body: readonly Block[];
}): { file: string; alt: string } | null {
  const art = doc.illustration;
  if (!art) return null;
  const inBody = (bs: readonly Block[]): boolean =>
    bs.some((b) => (b.t === 'figure' && b.asset === art.file) || (b.t === 'quote' && inBody(b.c)));
  return inBody(doc.body) ? null : art;
}
