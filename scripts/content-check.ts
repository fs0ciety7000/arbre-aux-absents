/**
 * npm run content:check [-- --root <dossier>] [-- --verbose]
 * Les 12 règles d'ARCHITECTURE §3.7, solveur compris. Code de sortie 1 s'il reste une erreur.
 * Aucune écriture. Les avertissements de traduction d'une langue `draft` sont résumés (une ligne
 * par langue et par affaire) ; `--verbose` les liste, `npm run content:i18n` les détaille.
 */
import { parseArgs } from 'node:util';
import { checkContentRoot, printIssues, resolveRoot } from '@arbre/content-tools';

const { values } = parseArgs({
  options: { root: { type: 'string' }, verbose: { type: 'boolean', default: false } },
});
const root = await resolveRoot(values.root);
const result = await checkContentRoot(root);

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
