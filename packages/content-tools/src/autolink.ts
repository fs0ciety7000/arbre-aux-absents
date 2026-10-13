/**
 * Liens automatiques des termes de mots-clés dans l'AST (ARCHITECTURE §3.2, §3.7 règle 5).
 * Comparaison sur le texte normalisé (casse, accents, ponctuation), aux frontières de mots ;
 * plus long terme d'abord ; jamais dans un `[[…]]` existant.
 */
import type { Block, Inline, KeywordId } from '@arbre/contract';
import { normalize } from './shared';

export interface LinkTerm {
  keyword: KeywordId;
  /** Terme déjà normalisé (non vide). */
  normalized: string;
}

export interface Overlap {
  /** Texte où deux termes se chevauchent partiellement. */
  text: string;
  kept: KeywordId;
  dropped: KeywordId;
}

interface NormMap {
  norm: string;
  /** Pour chaque caractère normalisé : indice de début et de fin (exclu) dans l'original. */
  start: number[];
  end: number[];
}

/** Normalise `text` caractère par caractère en gardant la correspondance avec l'original. */
export function normalizeWithMap(text: string): NormMap {
  const chars: string[] = [];
  const start: number[] = [];
  const end: number[] = [];
  let i = 0;
  for (const cp of text) {
    const from = i;
    i += cp.length;
    // Caractère par caractère avec la normalisation du moteur : une marque combinante
    // isolée disparaît, tout autre caractère sans lettre ni chiffre devient une espace.
    if (/^\p{M}+$/u.test(cp)) continue;
    const n = normalize(cp) || ' ';
    for (const c of n) {
      if (c === ' ') {
        if (chars.length === 0 || chars[chars.length - 1] === ' ') continue;
      }
      chars.push(c);
      start.push(from);
      end.push(i);
    }
  }
  while (chars.length && chars[chars.length - 1] === ' ') {
    chars.pop();
    start.pop();
    end.pop();
  }
  return { norm: chars.join(''), start, end };
}

/** Prépare la liste des termes : normalisés, non vides, du plus long au plus court. */
export function prepareTerms(terms: { keyword: KeywordId; term: string }[]): LinkTerm[] {
  const out: LinkTerm[] = [];
  const seen = new Set<string>();
  for (const t of terms) {
    const normalized = normalize(t.term);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({ keyword: t.keyword, normalized });
  }
  // Plus long d'abord ; à longueur égale, ordre alphabétique (déterministe).
  return out.sort(
    (a, b) => b.normalized.length - a.normalized.length || a.normalized.localeCompare(b.normalized),
  );
}

/** Occurrences (indices dans `norm`) d'un terme aux frontières de mots. */
export function findOccurrences(norm: string, term: string): number[] {
  const out: number[] = [];
  let from = 0;
  for (;;) {
    const at = norm.indexOf(term, from);
    if (at < 0) break;
    const before = at === 0 || norm[at - 1] === ' ';
    const after = at + term.length === norm.length || norm[at + term.length] === ' ';
    if (before && after) out.push(at);
    from = at + 1;
  }
  return out;
}

/** Vrai si `term` (normalisé) apparaît dans `text` aux frontières de mots. */
export function containsTerm(text: string, term: string): boolean {
  const t = normalize(term);
  if (!t) return false;
  return findOccurrences(normalize(text), t).length > 0;
}

interface Match {
  from: number;
  to: number;
  keyword: KeywordId;
}

/** Découpe un texte en texte + références selon les termes. */
function linkText(v: string, terms: LinkTerm[], overlaps: Overlap[]): Inline[] {
  if (terms.length === 0) return [{ t: 'text', v }];
  const map = normalizeWithMap(v);
  if (!map.norm) return [{ t: 'text', v }];
  const chosen: Match[] = [];
  for (const term of terms) {
    for (const at of findOccurrences(map.norm, term.normalized)) {
      const m: Match = { from: at, to: at + term.normalized.length, keyword: term.keyword };
      let blocked = false;
      for (const c of chosen) {
        if (m.from < c.to && c.from < m.to) {
          blocked = true;
          const nested = m.from >= c.from && m.to <= c.to;
          if (!nested && c.keyword !== m.keyword) {
            overlaps.push({
              text: map.norm.slice(Math.min(c.from, m.from), Math.max(c.to, m.to)),
              kept: c.keyword,
              dropped: m.keyword,
            });
          }
          break;
        }
      }
      if (!blocked) chosen.push(m);
    }
  }
  if (chosen.length === 0) return [{ t: 'text', v }];
  chosen.sort((a, b) => a.from - b.from);
  const out: Inline[] = [];
  let cursor = 0;
  for (const m of chosen) {
    const s = map.start[m.from]!;
    const e = map.end[m.to - 1]!;
    if (s > cursor) out.push({ t: 'text', v: v.slice(cursor, s) });
    out.push({ t: 'ref', keyword: m.keyword, c: [{ t: 'text', v: v.slice(s, e) }] });
    cursor = e;
  }
  if (cursor < v.length) out.push({ t: 'text', v: v.slice(cursor) });
  return out;
}

function linkInlines(nodes: Inline[], terms: LinkTerm[], overlaps: Overlap[]): Inline[] {
  const out: Inline[] = [];
  for (const n of nodes) {
    if (n.t === 'text') out.push(...linkText(n.v, terms, overlaps));
    else if (n.t === 'ref' || n.t === 'redacted') out.push(n);
    else out.push({ t: n.t, c: linkInlines(n.c, terms, overlaps) });
  }
  return out;
}

/** Applique les liens automatiques à un document (nouvel AST, l'entrée n'est pas modifiée). */
export function autolinkBlocks(
  blocks: Block[],
  terms: LinkTerm[],
): { blocks: Block[]; overlaps: Overlap[] } {
  const overlaps: Overlap[] = [];
  const link = (c: Inline[]) => linkInlines(c, terms, overlaps);
  const walk = (bs: Block[]): Block[] =>
    bs.map((b): Block => {
      switch (b.t) {
        case 'p':
        case 'signature':
          return { t: b.t, c: link(b.c) };
        case 'h':
          return { t: 'h', level: b.level, c: link(b.c) };
        case 'quote':
          return { t: 'quote', c: walk(b.c) };
        case 'list':
          return { t: 'list', ordered: b.ordered, items: b.items.map(link) };
        case 'table':
          return { t: 'table', head: b.head.map(link), rows: b.rows.map((r) => r.map(link)) };
        case 'figure':
          return b.caption ? { ...b, caption: link(b.caption) } : b;
        default:
          return b;
      }
    });
  return { blocks: walk(blocks), overlaps };
}

/** Identifiants des mots-clés référencés par un AST, dans l'ordre d'apparition. */
export function collectRefs(blocks: Block[]): KeywordId[] {
  const out: KeywordId[] = [];
  const seen = new Set<KeywordId>();
  const inl = (ns: Inline[]) => {
    for (const n of ns) {
      if (n.t === 'ref') {
        if (!seen.has(n.keyword)) {
          seen.add(n.keyword);
          out.push(n.keyword);
        }
        inl(n.c);
      } else if (n.t !== 'text' && n.t !== 'redacted') inl(n.c);
    }
  };
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.t === 'p' || b.t === 'signature' || b.t === 'h') inl(b.c);
      else if (b.t === 'quote') walk(b.c);
      else if (b.t === 'list') b.items.forEach(inl);
      else if (b.t === 'table') {
        b.head.forEach(inl);
        b.rows.forEach((r) => r.forEach(inl));
      } else if (b.t === 'figure' && b.caption) inl(b.caption);
    }
  };
  walk(blocks);
  return out;
}
