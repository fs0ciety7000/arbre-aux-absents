/**
 * npm run content:solve [-- --locale <loc>] [-- --report] [-- --out <fichier.md>] [-- --root <dossier>]
 * Résumé du solveur ; `--report` imprime le rapport Markdown complet (ou l'écrit avec --out).
 * `--locale` résout l'affaire traduite (règle 12.7, pièces non traduites retombant sur le FR),
 * même si la langue est encore `draft`.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { LOCALES, type Locale } from '@arbre/contract';
import { checkContentRoot, resolveRoot, solveReport } from '@arbre/content-tools';

const { values } = parseArgs({
  options: {
    root: { type: 'string' },
    locale: { type: 'string' },
    report: { type: 'boolean', default: false },
    out: { type: 'string' },
  },
});
if (values.locale && !(LOCALES as readonly string[]).includes(values.locale)) {
  console.error(
    `content:solve — --locale attend ${LOCALES.join(' ou ')} (reçu : ${values.locale})`,
  );
  process.exit(2);
}
const root = await resolveRoot(values.root);
const wanted = values.locale as Locale | undefined;
const result = await checkContentRoot(root, wanted ? { strictLocales: [wanted] } : {});
const locale = wanted ?? result.locales.source;
const isSource = locale === result.locales.source;
if (!isSource && !result.locales.targets.some((t) => t.locale === locale)) {
  console.error(
    `content:solve — « ${locale} » n'est pas une langue cible de content/locales.json.`,
  );
  process.exit(2);
}

if (values.report || values.out) {
  const md = solveReport(result, locale);
  if (values.out) {
    await writeFile(resolve(process.cwd(), values.out), md, 'utf8');
    console.log(`content:solve — rapport écrit dans ${values.out}`);
  } else console.log(md);
} else {
  if (result.cases.length === 0) console.log('content:solve — aucune affaire.');
  for (const c of result.cases) {
    const l = c.locales[locale];
    if (!l?.solve) {
      console.log(`${c.id} [${locale}] : non résolue (erreurs de structure, voir content:check)`);
      continue;
    }
    const s = l.solve;
    console.log(
      `${c.id} [${locale}] : ${s.unlocked.size} document(s), ${s.locked.size} case(s) établie(s), ${s.blockedSlots.size} bloquée(s), fins ${[...s.endings.keys()].join(', ') || '—'}${l.demoSolve ? ` ; démo : ${l.demoSolve.locked.size} case(s)` : ''}`,
    );
  }
}
const solverErrors = result.issues.errors.filter((i) =>
  isSource
    ? i.rule === 6 || i.rule === 10
    : i.rule === 12 && i.locale === locale && /^règle (6|10) /.test(i.message),
).length;
if (solverErrors > 0) {
  console.error(`content:solve — ${solverErrors} erreur(s) de solvabilité (${locale}).`);
  process.exit(1);
}
