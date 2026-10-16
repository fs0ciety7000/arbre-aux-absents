/** Rapport Markdown du solveur (`npm run content:solve -- --report`). */
import type { Locale } from '@arbre/contract';
import type { CaseCheck, CheckResult } from './check';
import { formatIssue, RULE_TITLES, type RuleId } from './issues';
import { candidateRatios, MIN_CANDIDATE_RATIO } from './marks';
import type { SolverAction, SolverResult } from './solver';

function action(a: SolverAction): string {
  switch (a.type) {
    case 'read':
      return a.id === '(départ)' ? 'Départ' : `Lire \`${a.id}\``;
    case 'visit':
      return `Visiter \`${a.id}\``;
    case 'search':
      return `Chercher \`${a.id}\``;
    case 'lock':
      return `Établir ${a.slots.map((s) => `\`${s}\``).join(', ')} (groupe \`${a.group}\`)`;
  }
}

function list(xs: Iterable<string>): string {
  const a = [...xs];
  return a.length ? a.map((x) => `\`${x}\``).join(', ') : '—';
}

function solveSection(title: string, r: SolverResult): string[] {
  const out: string[] = [`### ${title}`, ''];
  out.push(
    `- Documents atteints : ${r.unlocked.size} · mots-clés cherchés : ${r.searched.size} · lieux visités : ${r.visited.size}`,
    `- Cases établies : ${r.locked.size} · secrets : ${list(r.secrets)}`,
    `- Fins atteignables : ${list([...r.endings].map(([id, step]) => `${id} (étape ${step})`))}`,
    `- Fins vraies à 100 % : ${list(r.endingsAtEnd)}`,
    `- Rapport final : ${r.reportCombinations} combinaison(s) de réponses explorée(s) à 100 %`,
    '',
  );
  if (r.endingAnswers.size) {
    out.push('**Réponses au rapport menant à chaque fin**', '');
    for (const [id, answers] of r.endingAnswers) {
      const pairs = Object.entries(answers).map(([q, o]) => `\`${q}\` → \`${o}\``);
      out.push(`- \`${id}\` : ${pairs.join(', ')}`);
    }
    out.push('');
  }
  if (r.blockedSlots.size) {
    out.push('**Cases jamais établies**', '');
    for (const [id, why] of r.blockedSlots) out.push(`- \`${id}\` : ${why.join(' ; ')}`);
    out.push('');
  }
  if (r.evidence.size) {
    out.push(
      '| Case | Étape | Prénom lu dans | Nom lu dans | Portrait | Métier |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const [id, e] of r.evidence) {
      out.push(
        `| \`${id}\` | ${e.step} | ${e.givenDocs.join(', ')} | ${e.familyDocs.join(', ')} | ${e.portraitDocs.join(', ')} | ${e.occupationFrom.join(', ')} |`,
      );
    }
    out.push('');
  }
  out.push(
    '<details><summary>Parcours du solveur</summary>',
    '',
    '| Étape | Action | Débloque |',
    '| --- | --- | --- |',
  );
  for (const s of r.steps) {
    const gains = [
      s.unlocked.length ? `docs ${s.unlocked.join(', ')}` : '',
      s.secrets.length ? `secrets ${s.secrets.join(', ')}` : '',
      s.revealedSlots.length && s.step > 0 ? `cases ${s.revealedSlots.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    out.push(`| ${s.step} | ${action(s.action)} | ${gains || '—'} |`);
  }
  out.push('', '</details>', '');
  return out;
}

function caseSection(c: CaseCheck, locale: Locale): string[] {
  const out = [`## Affaire \`${c.id}\``, ''];
  const l = c.locales[locale];
  if (!l?.solve) return [...out, 'Non résolue (erreurs de structure, voir plus haut).', ''];
  out.push(...solveSection('Édition complète', l.solve));
  if (l.full) {
    const ratios = candidateRatios(l.full.compiled, l.solve);
    if (ratios.some((r) => r.kind === 'mark')) {
      out.push('**Candidats par type de champ** (AFFAIRE-3 §1.3)', '');
      for (const r of ratios) {
        const flag = r.ratio < MIN_CANDIDATE_RATIO ? ` (< ${MIN_CANDIDATE_RATIO})` : '';
        out.push(
          `- ${r.kind === 'mark' ? 'Marques' : 'Visages'} : ${r.candidates} pour ${r.slots} case(s), ${r.ratio.toFixed(2)}${flag}`,
        );
      }
      out.push('');
    }
  }
  if (l.demoSolve) out.push(...solveSection('Démo', l.demoSolve));
  return out;
}

/** Rapport Markdown du solveur pour une langue (défaut : langue source). */
export function solveReport(r: CheckResult, locale?: Locale): string {
  const loc = locale ?? r.locales.source;
  const out: string[] = [
    loc === r.locales.source ? '# Rapport du solveur' : `# Rapport du solveur (${loc})`,
    '',
  ];
  out.push(
    'Hypothèses : joueur méthodique (lit tout, visite tout, cherche tout mot-clé lu) ; mots-clés',
    '`hiddenTerm` supposés déduits dès le départ ; cases pré-remplies établies d’emblée ; cases',
    'revendiquées parties vides (leur déclaration ne prouve rien), visages et métiers déclarés',
    'disponibles d’emblée (`(revendication)`) ; une case s’établit quand prénom et nom figurent chacun',
    'dans ≥ 2 documents lus, un de ses visages (tout âge) et son métier débloqués.',
    '',
  );
  const errors = r.issues.errors;
  const warnings = r.issues.warnings;
  out.push(`Erreurs : **${errors.length}** · avertissements : ${warnings.length}`, '');
  if (errors.length || warnings.length) {
    const byRule = new Map<RuleId, string[]>();
    for (const i of [...errors, ...warnings])
      byRule.set(i.rule, [...(byRule.get(i.rule) ?? []), formatIssue(i)]);
    for (const [rule, lines] of [...byRule].sort((a, b) => a[0] - b[0])) {
      out.push(`### Règle ${rule} · ${RULE_TITLES[rule]}`, '', ...lines.map((l) => `- ${l}`), '');
    }
  }
  if (r.cases.length === 0) out.push('Aucune affaire.', '');
  for (const c of r.cases) out.push(...caseSection(c, loc));
  return out.join('\n');
}
