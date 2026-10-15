/**
 * Contrôle du journal des versions (`content/changelog.json`, ARCHITECTURE §3.8) : schéma,
 * ordre, unicité, et dernière entrée égale à la version du jeu (`apps/game/package.json`).
 * Chaque publication `[tauri] [itch]` doit donc apporter son entrée, sinon `content:check` échoue.
 * Avec le résultat de la compilation : les notes de la démo (`changelogForEdition`) ne nomment
 * aucune affaire, pièce ou fin absente de la démo (mêmes textes que les canaris e2e de la démo).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ChangelogSchema,
  changelogEditionLeaks,
  changelogForEdition,
  changelogVersionIssues,
  type Changelog,
} from '@arbre/contract';
import type { CaseCheck } from './check';

export const CHANGELOG_FILE = 'content/changelog.json';
export const GAME_PACKAGE_FILE = 'apps/game/package.json';

/** Journal validé sous `root`, ou ses erreurs. */
export async function loadChangelog(
  root: string,
): Promise<{ changelog: Changelog; issues: [] } | { changelog: null; issues: string[] }> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(join(root, CHANGELOG_FILE), 'utf8'));
  } catch (err) {
    return { changelog: null, issues: [`${CHANGELOG_FILE} illisible : ${(err as Error).message}`] };
  }
  const parsed = ChangelogSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      changelog: null,
      issues: parsed.error.issues.map(
        (i) => `${CHANGELOG_FILE} [${i.path.join('.')}] ${i.message}`,
      ),
    };
  }
  return { changelog: parsed.data, issues: [] };
}

/**
 * Textes de l'édition complète absents de la démo, dans toutes les langues compilées : titres des
 * affaires hors démo, titres des pièces hors démo et titres des fins (12 caractères au moins pour
 * les pièces et les fins, comme les canaris).
 */
export function fullOnlyTexts(cases: readonly CaseCheck[]): Set<string> {
  const out = new Set<string>();
  for (const c of cases) {
    for (const lc of Object.values(c.locales)) {
      const full = lc?.full?.compiled;
      if (!full) continue;
      const demo = lc?.demo?.compiled;
      if (!demo) out.add(full.meta.title);
      const demoDocs = new Set(Object.keys(demo?.documents ?? {}));
      const demoTitles = new Set(Object.values(demo?.documents ?? {}).map((d) => d.title));
      for (const [id, doc] of Object.entries(full.documents)) {
        if (demoDocs.has(id) || demoTitles.has(doc.title) || doc.title.length < 12) continue;
        out.add(doc.title);
      }
      for (const e of Object.values(full.endings)) {
        const title = (e as { title: string }).title;
        if (title.length >= 12) out.add(title);
      }
    }
  }
  return out;
}

/**
 * Erreurs du journal sous `root` (racine du dépôt). Vide si tout va bien. `cases` (affaires
 * compilées) active le contrôle des notes de la démo.
 */
export async function checkChangelog(
  root: string,
  cases?: readonly CaseCheck[],
): Promise<string[]> {
  const loaded = await loadChangelog(root);
  if (!loaded.changelog) return loaded.issues;
  let version: string;
  try {
    const pkg = JSON.parse(await readFile(join(root, GAME_PACKAGE_FILE), 'utf8')) as {
      version?: unknown;
    };
    if (typeof pkg.version !== 'string') throw new Error('champ version absent');
    version = pkg.version;
  } catch (err) {
    return [`${GAME_PACKAGE_FILE} illisible : ${(err as Error).message}`];
  }
  const issues = changelogVersionIssues(loaded.changelog, version);
  if (cases) {
    if (changelogForEdition(loaded.changelog, 'demo').length === 0) {
      issues.push('notes de la démo vides : chaque point est réservé à l’édition complète.');
    }
    issues.push(...changelogEditionLeaks(loaded.changelog, fullOnlyTexts(cases)));
  }
  return issues.map((m) => `${CHANGELOG_FILE} : ${m}`);
}
