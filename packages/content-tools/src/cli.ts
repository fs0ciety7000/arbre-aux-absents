/** Aides communes aux scripts `scripts/content-*.ts`. */
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { formatIssue, RULE_TITLES, type Issue, type IssueList } from './issues';

/** Racine du dépôt (contient `content/`, `art/`, `apps/`). */
export const REPO_ROOT = resolve(import.meta.dirname, '../../..');

/** Résout `--root` (relatif au répertoire courant) ; défaut : racine du dépôt. */
export async function resolveRoot(arg: string | undefined): Promise<string> {
  const root = arg ? resolve(process.cwd(), arg) : REPO_ROOT;
  try {
    if (!(await stat(root)).isDirectory()) throw new Error();
  } catch {
    throw new Error(`--root introuvable : ${root}`);
  }
  return root;
}

export interface PrintOptions {
  /** Problèmes résumés (une ligne par langue et par affaire) au lieu d'être listés. */
  summarize?: (i: Issue) => boolean;
}

/** Affiche les problèmes (erreurs sur stderr) et renvoie le nombre d'erreurs. */
export function printIssues(issues: IssueList, out = console, options: PrintOptions = {}): number {
  const summarized = options.summarize ? issues.items.filter(options.summarize) : [];
  const skip = new Set(summarized);
  for (const i of issues.warnings) if (!skip.has(i)) out.warn(formatIssue(i));
  for (const line of summarizeIssues(summarized.filter((i) => i.severity === 'warning')))
    out.warn(line);
  for (const line of summarizeIssues(summarized.filter((i) => i.severity === 'error')))
    out.error(line);
  for (const i of issues.errors) if (!skip.has(i)) out.error(formatIssue(i));
  return issues.errors.length;
}

const CODE_LABELS: Record<string, string> = {
  missing: 'non traduit',
  extra: 'en trop',
  parity: 'parité',
  schema: 'schéma',
  markdown: 'Markdown',
  terms: 'termes',
  links: 'mots-clés liés',
  figures: 'figures',
  markup: 'balisage',
  sections: 'sections',
  untranslated: 'paragraphe identique',
  svg: 'SVG',
  budget: 'budget',
  structure: 'structure',
  replay: 'règles rejouées',
};

/** Résumé des problèmes de traduction : une ligne par langue, sévérité et affaire (ou monde). */
export function summarizeIssues(items: readonly Issue[]): string[] {
  const groups = new Map<string, Issue[]>();
  for (const i of items) {
    const key = `${i.severity}|${i.rule}|${i.locale ?? ''}|${i.caseId ?? ''}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  const lines: string[] = [];
  for (const group of groups.values()) {
    const first = group[0]!;
    const where = first.caseId ? `content/cases/${first.caseId}` : 'content/world';
    const byCode = new Map<string, Issue[]>();
    for (const i of group) {
      const code = i.code ?? 'autre';
      byCode.set(code, [...(byCode.get(code) ?? []), i]);
    }
    const parts = [...byCode].map(([code, xs]) => {
      const label = CODE_LABELS[code] ?? code;
      if (code !== 'missing') return `${label} ${xs.length}`;
      const docs = xs.filter((x) => x.unit?.startsWith('documents/')).length;
      const ends = xs.filter((x) => x.unit?.startsWith('endings/')).length;
      const others = xs
        .filter((x) => !x.unit?.startsWith('documents/') && !x.unit?.startsWith('endings/'))
        .map((x) => x.unit ?? '?');
      const detail = [
        docs ? `${docs} document(s)` : '',
        ends ? `${ends} fin(s)` : '',
        ...[...new Set(others)],
      ].filter(Boolean);
      return `${label} : ${detail.join(', ')}`;
    });
    const mark = first.severity === 'error' ? '✗' : '!';
    const loc = first.locale ? ` · ${first.locale}` : '';
    const n = group.length;
    lines.push(
      `${mark} [règle ${first.rule} · ${RULE_TITLES[first.rule]}${loc}] ${where} — ${n} problème(s) : ${parts.join(' ; ')}`,
    );
  }
  return lines;
}
