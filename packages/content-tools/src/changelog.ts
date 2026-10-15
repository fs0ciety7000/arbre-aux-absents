/**
 * Contrôle du journal des versions (`content/changelog.json`, ARCHITECTURE §3.8) : schéma,
 * ordre, unicité, et dernière entrée égale à la version du jeu (`apps/game/package.json`).
 * Chaque publication `[tauri] [itch]` doit donc apporter son entrée, sinon `content:check` échoue.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ChangelogSchema, changelogVersionIssues } from '@arbre/contract';

export const CHANGELOG_FILE = 'content/changelog.json';
export const GAME_PACKAGE_FILE = 'apps/game/package.json';

/** Erreurs du journal sous `root` (racine du dépôt). Vide si tout va bien. */
export async function checkChangelog(root: string): Promise<string[]> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(join(root, CHANGELOG_FILE), 'utf8'));
  } catch (err) {
    return [`${CHANGELOG_FILE} illisible : ${(err as Error).message}`];
  }
  const parsed = ChangelogSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `${CHANGELOG_FILE} [${i.path.join('.')}] ${i.message}`);
  }
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
  return changelogVersionIssues(parsed.data, version).map((m) => `${CHANGELOG_FILE} : ${m}`);
}
