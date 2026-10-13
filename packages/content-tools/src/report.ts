/** Rapport Markdown du solveur (`npm run content:solve -- --report`). */
import type { CaseCheck, CheckResult } from './check';
import { formatIssue, RULE_TITLES, type RuleId } from './issues';
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
    '',
  );
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

function caseSection(c: CaseCheck): string[] {
  const out = [`## Affaire \`${c.id}\``, ''];
  if (!c.solve) return [...out, 'Non résolue (erreurs de structure, voir plus haut).', ''];
  out.push(...solveSection('Édition complète', c.solve));
  if (c.demoSolve) out.push(...solveSection('Démo', c.demoSolve));
  return out;
}

export function solveReport(r: CheckResult): string {
  const out: string[] = ['# Rapport du solveur', ''];
  out.push(
    'Hypothèses : joueur méthodique (lit tout, visite tout, cherche tout mot-clé lu) ; mots-clés',
    '`hiddenTerm` supposés déduits dès le départ ; cases pré-remplies établies d’emblée ; une case',
    's’établit quand prénom et nom figurent chacun dans ≥ 2 documents lus, portrait et métier débloqués.',
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
  for (const c of r.cases) out.push(...caseSection(c));
  return out.join('\n');
}
