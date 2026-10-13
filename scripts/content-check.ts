/**
 * npm run content:check [-- --root <dossier>] — les 11 règles d'ARCHITECTURE §3.7, solveur compris.
 * Code de sortie 1 s'il reste une erreur. Aucune écriture.
 */
import { parseArgs } from 'node:util';
import { checkContentRoot, printIssues, resolveRoot } from '@arbre/content-tools';

const { values } = parseArgs({ options: { root: { type: 'string' } } });
const root = await resolveRoot(values.root);
const result = await checkContentRoot(root);

if (result.source.empty) {
  console.log(`content:check — aucun contenu sous ${root} : OK.`);
  process.exit(0);
}
const errors = printIssues(result.issues);
const summary = `${result.source.filesRead} fichier(s), ${result.cases.length} affaire(s), ${result.issues.warnings.length} avertissement(s)`;
if (errors > 0) {
  console.error(`content:check — ${errors} erreur(s) ; ${summary}.`);
  process.exit(1);
}
console.log(`content:check — ${summary} : OK.`);
