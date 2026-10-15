/**
 * npm run content:check [-- --root <dossier>] [-- --verbose]
 * Les 12 règles d'ARCHITECTURE §3.7, solveur compris. Code de sortie 1 s'il reste une erreur.
 * Aucune écriture. Les avertissements de traduction d'une langue `draft` sont résumés (une ligne
 * par langue et par affaire) ; `--verbose` les liste, `npm run content:i18n` les détaille.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import {
  CHANGELOG_FILE,
  REPO_ROOT,
  checkChangelog,
  checkContentRoot,
  printIssues,
  resolveRoot,
} from '@arbre/content-tools';

const { values } = parseArgs({
  options: { root: { type: 'string' }, verbose: { type: 'boolean', default: false } },
});
const root = await resolveRoot(values.root);
const result = await checkContentRoot(root);

// Journal des versions (ARCHITECTURE §3.8) : exigé dans le dépôt, contrôlé ailleurs s'il existe.
if (root === REPO_ROOT || existsSync(join(root, CHANGELOG_FILE))) {
  const problems = await checkChangelog(root);
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length > 0) {
    console.error(`content:check — ${problems.length} erreur(s) dans le journal des versions.`);
    process.exit(1);
  }
}

if (result.source.empty) {
  console.log(`content:check — aucun contenu sous ${root} : OK.`);
  process.exit(0);
}
const drafts = new Set(
  result.locales.targets.filter((t) => t.level === 'draft').map((t) => t.locale),
);
const errors = printIssues(result.issues, console, {
  summarize: values.verbose
    ? undefined
    : (i) => i.rule === 12 && i.severity === 'warning' && !!i.locale && drafts.has(i.locale),
});
const langs = result.locales.targets.map((t) => `${t.locale} (${t.level})`).join(', ');
const summary = `${result.source.filesRead} fichier(s), ${result.cases.length} affaire(s), ${result.issues.warnings.length} avertissement(s)${langs ? `, langues ${result.locales.source} + ${langs}` : ''}`;
if (errors > 0) {
  console.error(`content:check — ${errors} erreur(s) ; ${summary}.`);
  process.exit(1);
}
console.log(`content:check — ${summary} : OK.`);
