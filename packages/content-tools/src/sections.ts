/**
 * Sections des fins (ARCHITECTURE §3 « Rapport final et fins à sections ») : `## [étiquette] Titre`
 * ouvre une section ; le texte avant la première section forme une section sans étiquette.
 * Un `## Titre` sans étiquette reste un titre ordinaire dans la section courante.
 */
import type { Block, Inline } from '@arbre/contract';
import { inlineText } from './markdown';

/** Étiquette réservée : section toujours affichée. */
export const COMMON_SECTION = 'commun';

const LABEL = /^\[([^\]\s][^\]]{0,39})\]\s*/;

export interface SourceSection {
  label: string | null;
  title: string | null;
  body: Block[];
}

/** Étiquette et titre d'un `## [étiquette] Titre`, sinon null. */
function sectionHeading(b: Block): { label: string; title: string | null } | null {
  if (b.t !== 'h' || b.level !== 2) return null;
  const first: Inline | undefined = b.c[0];
  if (!first || first.t !== 'text') return null;
  const m = LABEL.exec(first.v);
  if (!m) return null;
  const rest: Inline[] = [{ t: 'text', v: first.v.slice(m[0].length) }, ...b.c.slice(1)];
  const title = inlineText(rest).trim();
  return { label: m[1]!.trim(), title: title || null };
}

export function splitSections(blocks: Block[]): { sections: SourceSection[]; errors: string[] } {
  const sections: SourceSection[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let current: SourceSection = { label: null, title: null, body: [] };
  for (const b of blocks) {
    const h = sectionHeading(b);
    if (!h) {
      current.body.push(b);
      continue;
    }
    if (current.label !== null || current.body.length > 0) sections.push(current);
    if (seen.has(h.label)) errors.push(`section [${h.label}] en double`);
    seen.add(h.label);
    current = { label: h.label, title: h.title, body: [] };
  }
  if (current.label !== null || current.body.length > 0) sections.push(current);
  return { sections, errors };
}
