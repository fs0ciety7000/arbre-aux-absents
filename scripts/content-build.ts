/**
 * npm run content:build [-- --edition full|demo] [-- --root <dossier> --out <dossier>]
 *
 * Compile le contenu (éditions complète et démo, langue source et langues `ready`) et écrit
 * apps/game/src/generated/ et apps/site/src/generated/ (ARCHITECTURE §3.3). `--edition` choisit
 * l'édition importée par le jeu (défaut : full ; aussi via ARBRE_EDITION). Avec `--root` hors
 * dépôt, rien n'est écrit sans `--out` (le jeu dans <out>/game, le site dans <out>/site). Refuse
 * d'écrire si content:check échoue. Le module généré `cases.ts` charge à la demande catalogues,
 * affaires et illustrations par langue et par édition. Le jeu reçoit aussi `changelog.json`, les
 * notes de version de son édition (`content/changelog.json` de la racine, sinon celui du dépôt :
 * les fixtures n'en ont pas).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import type { Edition } from '@arbre/contract';
import {
  CHANGELOG_FILE,
  REPO_ROOT,
  checkContentRoot,
  loadChangelog,
  printIssues,
  resolveRoot,
  writeGenerated,
  type BuildTargets,
} from '@arbre/content-tools';

const { values } = parseArgs({
  options: {
    root: { type: 'string' },
    out: { type: 'string' },
    edition: { type: 'string', default: process.env.ARBRE_EDITION ?? 'full' },
  },
});
if (values.edition !== 'full' && values.edition !== 'demo') {
  console.error(`content:build — --edition attend full ou demo (reçu : ${values.edition})`);
  process.exit(2);
}
const edition: Edition = values.edition;
const root = await resolveRoot(values.root);
const result = await checkContentRoot(root);
const drafts = new Set(
  result.locales.targets.filter((t) => t.level === 'draft').map((t) => t.locale),
);
const errors = printIssues(result.issues, console, {
  summarize: (i) => i.rule === 12 && i.severity === 'warning' && !!i.locale && drafts.has(i.locale),
});
if (errors > 0) {
  console.error(
    `content:build — ${errors} erreur(s) : rien n'est écrit (voir npm run content:check).`,
  );
  process.exit(1);
}

let targets: BuildTargets;
if (values.out) {
  targets = { game: join(values.out, 'game'), site: join(values.out, 'site') };
} else if (root === REPO_ROOT) {
  targets = {
    game: join(REPO_ROOT, 'apps/game/src/generated'),
    site: join(REPO_ROOT, 'apps/site/src/generated'),
  };
} else {
  console.log(
    `content:build — ${result.cases.length} affaire(s) compilée(s) (aucune écriture sans --out).`,
  );
  process.exit(0);
}
const notesRoot = existsSync(join(root, CHANGELOG_FILE)) ? root : REPO_ROOT;
const notes = await loadChangelog(notesRoot);
if (!notes.changelog) {
  for (const p of notes.issues) console.error(`✗ ${p}`);
  console.error(`content:build — journal des versions invalide : rien n'est écrit.`);
  process.exit(1);
}
const changed = await writeGenerated(result, targets, edition, notes.changelog);
console.log(
  `content:build — ${result.cases.length} affaire(s), langue(s) ${result.locales.compiled.join(', ')}, jeu en édition ${edition}, ${changed.length} fichier(s) mis à jour.`,
);
