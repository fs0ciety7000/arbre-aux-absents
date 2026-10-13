/**
 * Préparation d'une affaire valide : liens automatiques, mots-clés référencés, texte normalisé.
 * Partagée par la compilation, les contrôles et le solveur.
 */
import type { Block, DocumentFrontmatter, KeywordId } from '@arbre/contract';
import { autolinkBlocks, collectRefs, prepareTerms, type LinkTerm, type Overlap } from './autolink';
import type { SourceCase } from './load';
import { blockTexts } from './markdown';
import { splitSections, type SourceSection } from './sections';
import { normalize } from './shared';

export type CompleteCase = SourceCase &
  Required<Pick<SourceCase, 'meta' | 'family' | 'tree' | 'progression'>>;

export interface PreparedDocument {
  id: string;
  file: string;
  frontmatter: DocumentFrontmatter;
  /** Corps après liens automatiques. */
  body: Block[];
  /** Mots-clés référencés (manuels et automatiques), ordre d'apparition. */
  keywords: KeywordId[];
  /** Texte intégral normalisé (titre compris), entouré d'espaces pour les recherches de mots. */
  norm: string;
}

export interface PreparedEnding {
  id: string;
  file: string;
  title: string;
  /** Corps entier (liens automatiques), pour les contrôles de texte. */
  body: Block[];
  /** Sections `## [étiquette] Titre`, corps après liens automatiques. */
  sections: SourceSection[];
  /** Erreurs de découpage (étiquettes en double). */
  sectionErrors: string[];
}

export interface PreparedCase {
  src: CompleteCase;
  terms: LinkTerm[];
  documents: Map<string, PreparedDocument>;
  endings: Map<string, PreparedEnding>;
  overlaps: { file: string; overlap: Overlap }[];
}

/** Termes de liens automatiques d'une affaire (hors `autolink: false` et `hiddenTerm`). */
export function linkTermsOf(c: CompleteCase): LinkTerm[] {
  return prepareTerms(
    c.progression.keywords
      .filter((k) => k.autolink !== false && !k.hiddenTerm)
      .flatMap((k) => k.terms.map((term) => ({ keyword: k.id, term }))),
  );
}

export function prepareCase(c: CompleteCase): PreparedCase {
  const terms = linkTermsOf(c);
  const overlaps: PreparedCase['overlaps'] = [];
  const documents = new Map<string, PreparedDocument>();
  for (const d of c.documents.values()) {
    const linked = autolinkBlocks(d.body, terms);
    for (const o of linked.overlaps) overlaps.push({ file: d.file, overlap: o });
    const text = [d.frontmatter.title, ...blockTexts(linked.blocks)].join('\n');
    documents.set(d.id, {
      id: d.id,
      file: d.file,
      frontmatter: d.frontmatter,
      body: linked.blocks,
      keywords: collectRefs(linked.blocks),
      norm: ` ${normalize(text)} `,
    });
  }
  const endings = new Map<string, PreparedEnding>();
  for (const e of c.endings.values()) {
    const linked = autolinkBlocks(e.body, terms);
    for (const o of linked.overlaps) overlaps.push({ file: e.file, overlap: o });
    const split = splitSections(e.body);
    const sections = split.sections.map((sec) => ({
      ...sec,
      body: autolinkBlocks(sec.body, terms).blocks,
    }));
    endings.set(e.id, {
      ...e,
      body: linked.blocks,
      sections,
      sectionErrors: split.errors,
    });
  }
  return { src: c, terms, documents, endings, overlaps };
}

/** Vrai si un texte préparé (`norm`, entouré d'espaces) contient l'un des noms donnés. */
export function mentions(norm: string, names: readonly string[]): boolean {
  return names.some((n) => {
    const t = normalize(n);
    return t.length > 0 && norm.includes(` ${t} `);
  });
}
