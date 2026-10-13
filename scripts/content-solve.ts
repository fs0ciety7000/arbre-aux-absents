/**
 * npm run content:solve [-- --report] [-- --out <fichier.md>] [-- --root <dossier>]
 * Résumé du solveur ; `--report` imprime le rapport Markdown complet (ou l'écrit avec --out).
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { checkContentRoot, resolveRoot, solveReport } from '@arbre/content-tools';

const { values } = parseArgs({
  options: {
    root: { type: 'string' },
    report: { type: 'boolean', default: false },
    out: { type: 'string' },
  },
});
const root = await resolveRoot(values.root);
const result = await checkContentRoot(root);

if (values.report || values.out) {
  const md = solveReport(result);
  if (values.out) {
    await writeFile(resolve(process.cwd(), values.out), md, 'utf8');
    console.log(`content:solve — rapport écrit dans ${values.out}`);
  } else console.log(md);
} else {
  if (result.cases.length === 0) console.log('content:solve — aucune affaire.');
  for (const c of result.cases) {
    if (!c.solve) {
      console.log(`${c.id} : non résolue (erreurs de structure, voir content:check)`);
      continue;
    }
    const s = c.solve;
    console.log(
      `${c.id} : ${s.unlocked.size} document(s), ${s.locked.size} case(s) établie(s), ${s.blockedSlots.size} bloquée(s), fins ${[...s.endings.keys()].join(', ') || '—'}${c.demoSolve ? ` ; démo : ${c.demoSolve.locked.size} case(s)` : ''}`,
    );
  }
}
const solverErrors = result.issues.errors.filter((i) => i.rule === 6 || i.rule === 10).length;
if (solverErrors > 0) {
  console.error(`content:solve — ${solverErrors} erreur(s) de solvabilité.`);
  process.exit(1);
}
