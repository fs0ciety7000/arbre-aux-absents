/** npm run content:check — provisoire (lot 0), voir scripts/lib/content-check.ts. */
import { resolve } from 'node:path';
import { checkContent } from './lib/content-check';

const root = resolve(import.meta.dirname, '../content');
const report = await checkContent(root);

if (report.filesChecked === 0) {
  console.log('content:check — aucun contenu pour l’instant (content/ vide) : OK.');
  process.exit(0);
}
for (const issue of report.issues) console.error(`✗ ${issue.file} — ${issue.message}`);
if (report.issues.length > 0) {
  console.error(`content:check — ${report.issues.length} erreur(s).`);
  process.exit(1);
}
console.log(
  `content:check — ${report.filesChecked} fichier(s), ${report.cases.length} affaire(s) : OK (schémas seulement, lot 0).`,
);
