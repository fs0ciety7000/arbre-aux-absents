/** Problèmes signalés par la chaîne de contenu (ARCHITECTURE §3.7). */

import type { Locale } from '@arbre/contract';

/** Numéro de règle de §3.7 (1 à 12). */
export type RuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

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
  12: 'Traductions',
};

export interface Issue {
  rule: RuleId;
  severity: 'error' | 'warning';
  /** Chemin relatif à la racine du contenu. */
  file: string;
  line?: number;
  message: string;
  /** Règle 12 : langue concernée. */
  locale?: Locale;
  /** Règle 12 : affaire concernée (absent pour le monde). */
  caseId?: string;
  /**
   * Règle 12 : unité traduite, chemin relatif au dossier de langue (`documents/x.md`,
   * `progression.json`, `illustrations/x.svg`), `world` ou `world/labels.svg` pour le monde,
   * `(affaire)` pour un problème d'ensemble. Sert au filtre `--only` de `content:i18n`.
   */
  unit?: string;
  /** Règle 12 : catégorie courte (`missing`, `extra`, `schema`, `links`…), pour les résumés. */
  code?: string;
}

/** Champs facultatifs d'un problème. */
export type IssueExtra = Partial<Pick<Issue, 'line' | 'locale' | 'caseId' | 'unit' | 'code'>>;

export class IssueList {
  readonly items: Issue[] = [];
  private readonly seen = new Set<string>();

  add(i: Issue): void {
    const key = `${i.severity}|${i.rule}|${i.locale ?? ''}|${i.file}|${i.line ?? ''}|${i.message}`;
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

  /** Problème de sévérité donnée, avec ses champs facultatifs (règle 12). */
  report(
    severity: Issue['severity'],
    rule: RuleId,
    file: string,
    message: string,
    extra: IssueExtra = {},
  ): void {
    const clean = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== undefined && v !== 0),
    ) as IssueExtra;
    this.add({ rule, severity, file, message, ...clean });
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
  const loc = i.locale ? ` · ${i.locale}` : '';
  return `${mark} [règle ${i.rule} · ${RULE_TITLES[i.rule]}${loc}] ${where} — ${i.message}`;
}
