/** Problèmes signalés par la chaîne de contenu (ARCHITECTURE §3.7). */

/** Numéro de règle de §3.7 (1 à 11). */
export type RuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const RULE_TITLES: Record<RuleId, string> = {
  1: 'Schémas',
  2: 'Références',
  3: 'Arbre',
  4: 'Conditions',
  5: 'Mots-clés',
  6: 'Solvabilité',
  7: 'Markdown',
  8: 'SVG',
  9: 'Budgets',
  10: 'Démo',
  11: 'Fuite',
};

export interface Issue {
  rule: RuleId;
  severity: 'error' | 'warning';
  /** Chemin relatif à la racine du contenu. */
  file: string;
  line?: number;
  message: string;
}

export class IssueList {
  readonly items: Issue[] = [];
  private readonly seen = new Set<string>();

  private add(i: Issue): void {
    const key = `${i.severity}|${i.rule}|${i.file}|${i.line ?? ''}|${i.message}`;
    if (this.seen.has(key)) return; // un même problème n'est signalé qu'une fois
    this.seen.add(key);
    this.items.push(i);
  }

  error(rule: RuleId, file: string, message: string, line?: number): void {
    this.add({ rule, severity: 'error', file, message, ...(line ? { line } : {}) });
  }

  warn(rule: RuleId, file: string, message: string, line?: number): void {
    this.add({ rule, severity: 'warning', file, message, ...(line ? { line } : {}) });
  }

  get errors(): Issue[] {
    return this.items.filter((i) => i.severity === 'error');
  }

  get warnings(): Issue[] {
    return this.items.filter((i) => i.severity === 'warning');
  }
}

export function formatIssue(i: Issue): string {
  const where = i.line ? `${i.file}:${i.line}` : i.file;
  const mark = i.severity === 'error' ? '✗' : '!';
  return `${mark} [règle ${i.rule} · ${RULE_TITLES[i.rule]}] ${where} — ${i.message}`;
}
