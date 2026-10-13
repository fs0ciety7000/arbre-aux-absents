import type { Block, CompiledDocument, Inline } from '@arbre/contract';
import { normalize } from './normalize';

function inlineText(nodes: readonly Inline[], out: string[]): void {
  for (const n of nodes) {
    switch (n.t) {
      case 'text':
        out.push(n.v);
        break;
      case 'redacted':
        out.push(' ');
        break;
      default:
        inlineText(n.c, out);
    }
  }
}

function blockText(blocks: readonly Block[], out: string[]): void {
  for (const b of blocks) {
    switch (b.t) {
      case 'p':
      case 'signature':
      case 'h':
        inlineText(b.c, out);
        break;
      case 'quote':
        blockText(b.c, out);
        break;
      case 'list':
        for (const item of b.items) inlineText(item, out);
        break;
      case 'table':
        for (const cell of b.head) inlineText(cell, out);
        for (const row of b.rows) for (const cell of row) inlineText(cell, out);
        break;
      case 'figure':
        out.push(b.alt);
        if (b.caption) inlineText(b.caption, out);
        break;
      case 'stamp':
        out.push(b.text);
        break;
      case 'hr':
        break;
    }
    out.push(' ');
  }
}

/** Texte brut d'un document : titre, auteur et corps (séparés par des espaces). */
export function documentText(doc: CompiledDocument): string {
  const out: string[] = [doc.title, ' '];
  if (doc.author) out.push(doc.author, ' ');
  blockText(doc.body, out);
  return out.join(' ');
}

/** Cache par objet document (le contenu compilé est immuable) : aucun effet observable. */
const normalizedCache = new WeakMap<CompiledDocument, string>();

/** Texte normalisé encadré d'espaces, pour une recherche de mots entiers. */
export function normalizedDocumentText(doc: CompiledDocument): string {
  let text = normalizedCache.get(doc);
  if (text === undefined) {
    text = ` ${normalize(documentText(doc))} `;
    normalizedCache.set(doc, text);
  }
  return text;
}

/** Vrai si `term` (déjà normalisé, non vide) apparaît en mots entiers dans le document. */
export function documentMentions(doc: CompiledDocument, term: string): boolean {
  return term !== '' && normalizedDocumentText(doc).includes(` ${term} `);
}
