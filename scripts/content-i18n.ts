/**
 * npm run content:i18n [-- --case <id>] [-- --only <glob>] [-- --locale <loc>] [-- --root <dossier>]
 *                      [-- --verbose]
 * Contrôle des traductions (ARCHITECTURE §3.7 règle 12) sur un périmètre, en mode strict quel
 * que soit le statut de la langue : parité, termes, mots-clés liés, figures, sections, surcharges
 * SVG, projection structurelle, et règles 5, 6, 9, 10, 11 rejouées sur l'affaire traduite (les
 * pièces pas encore traduites retombent sur le FR).
 *
 * `--case` limite à une affaire (le monde n'est contrôlé que sans `--case`) ; `--only` est un glob
 * sur les chemins du dossier de langue (`documents/ph-*`, `{progression,family,tree}.json`,
 * `illustrations/**`) ou `world` pour le monde ; un problème d'ensemble (`(affaire)`) n'est dans
 * le périmètre que sans `--only`. Code de sortie 1 s'il reste une erreur dans le périmètre.
 */
import { parseArgs } from 'node:util';
import { LOCALES, type Locale } from '@arbre/contract';
import {
  checkContentRoot,
  formatIssue,
  globToRegExp,
  resolveRoot,
  summarizeIssues,
  targetLocales,
  unitInScope,
  loadContent,
  IssueList,
  type Issue,
} from '@arbre/content-tools';

const { values } = parseArgs({
  options: {
    case: { type: 'string' },
    only: { type: 'string' },
    locale: { type: 'string' },
    root: { type: 'string' },
    verbose: { type: 'boolean', default: false },
  },
});
const root = await resolveRoot(values.root);

// Langues cibles : lecture légère de la configuration avant l'analyse stricte.
const probe = await loadContent(root, new IssueList());
let locales = targetLocales(probe.locales);
if (values.locale) {
  if (
    !(LOCALES as readonly string[]).includes(values.locale) ||
    !locales.includes(values.locale as Locale)
  ) {
    console.error(
      `content:i18n — --locale : langue cible inconnue « ${values.locale} » (cibles : ${locales.join(', ') || 'aucune'})`,
    );
    process.exit(2);
  }
  locales = [values.locale as Locale];
}
if (locales.length === 0) {
  console.log('content:i18n — aucune langue cible dans content/locales.json.');
  process.exit(0);
}
if (values.case && !probe.cases.some((c) => c.id === values.case)) {
  console.error(`content:i18n — --case : affaire inconnue « ${values.case} »`);
  process.exit(2);
}

const result = await checkContentRoot(root, { strictLocales: locales });
const only = values.only ? globToRegExp(values.only) : null;
const inScope = (i: Issue): boolean => {
  if (i.rule !== 12 || !i.locale || !locales.includes(i.locale)) return false;
  if (values.case ? i.caseId !== values.case : false) return false;
  return unitInScope(i.unit ?? '(affaire)', only);
};
const scoped = result.issues.items.filter(inScope);

// Les « non traduit » sont résumés (une ligne par affaire) sauf --verbose.
const summarized = values.verbose ? [] : scoped.filter((i) => i.code === 'missing');
const listed = scoped.filter((i) => !summarized.includes(i));
for (const i of listed.filter((x) => x.severity === 'warning')) console.warn(formatIssue(i));
for (const i of listed.filter((x) => x.severity === 'error')) console.error(formatIssue(i));
for (const line of summarizeIssues(summarized)) console.error(line);

// Avancement par affaire et par langue.
for (const c of result.source.cases) {
  if (values.case && c.id !== values.case) continue;
  for (const loc of locales) {
    const t = c.translations.get(loc);
    console.log(
      `${c.id} · ${loc} : ${t?.documents.size ?? 0}/${c.documents.size} document(s), ${t?.endings.size ?? 0}/${c.endings.size} fin(s), ${Object.keys(t?.json ?? {}).length} fichier(s) JSON, ${t?.illustrations.size ?? 0} surcharge(s) SVG`,
    );
  }
}
const sourceErrors = result.issues.errors.filter((i) => i.rule !== 12).length;
if (sourceErrors > 0) {
  console.error(
    `content:i18n — ${sourceErrors} erreur(s) dans la langue source (npm run content:check) : analyse des traductions incomplète.`,
  );
}
const errors = scoped.filter((i) => i.severity === 'error').length;
const warnings = scoped.length - errors;
const scope = [
  values.case ? `affaire ${values.case}` : 'tout le contenu',
  values.only && `fichiers ${values.only}`,
  `langue(s) ${locales.join(', ')}`,
]
  .filter(Boolean)
  .join(', ');
if (errors > 0 || sourceErrors > 0) {
  console.error(`content:i18n (${scope}) — ${errors} erreur(s), ${warnings} avertissement(s).`);
  process.exit(1);
}
console.log(`content:i18n (${scope}) — ${warnings} avertissement(s) : OK.`);
