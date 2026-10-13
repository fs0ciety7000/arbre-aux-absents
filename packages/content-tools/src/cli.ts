/** Aides communes aux scripts `scripts/content-*.ts`. */
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { formatIssue, type IssueList } from './issues';

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

/** Affiche les problèmes (erreurs sur stderr) et renvoie le nombre d'erreurs. */
export function printIssues(issues: IssueList, out = console): number {
  for (const i of issues.warnings) out.warn(formatIssue(i));
  for (const i of issues.errors) out.error(formatIssue(i));
  return issues.errors.length;
}
