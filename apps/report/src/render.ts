import type { ReportSubmission } from '@arbre/contract';

/**
 * Rendu du ticket GitHub. Le texte du joueur est placé dans un bloc de code dont la clôture est
 * plus longue que toute suite d'accents graves présente : mentions, images, liens et HTML sont
 * neutralisés. Jamais de contact, de jeton ni d'IP. Le titre ne contient aucun texte du joueur
 * (l'équipe le réécrit avant de poser l'étiquette `public`).
 */

/** GitHub refuse un corps de plus de 65 536 caractères ; marge pour l'enveloppe. */
export const MAX_BODY = 60_000;

const SOURCE_LABEL = { game: 'jeu', site: 'site' } as const;

export interface IssueDraft {
  title: string;
  body: string;
  labels: string[];
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Clôture de code plus longue que toute suite d'accents graves du texte (3 au minimum). */
export function fenceFor(text: string): string {
  let longest = 0;
  for (const m of text.matchAll(/`+/g)) longest = Math.max(longest, m[0].length);
  return '`'.repeat(Math.max(3, longest + 1));
}

export function codeBlock(text: string, info = 'text'): string {
  const clean = text.replace(/\r\n?/g, '\n').replace(CONTROL, '');
  const fence = fenceFor(clean);
  return `${fence}${info}\n${clean}\n${fence}`;
}

export function issueLabels(s: Pick<ReportSubmission, 'source' | 'category' | 'locale'>): string[] {
  const labels = ['signalement', `source:${SOURCE_LABEL[s.source]}`, `cat:${s.category}`];
  if (s.locale !== 'fr') labels.push(`langue:${s.locale}`);
  return labels;
}

export function renderIssue(ticket: string, s: ReportSubmission): IssueDraft {
  const { save, ...diag } = s.diagnostics;
  const head = [
    `**${ticket}** · ${s.category} · ${SOURCE_LABEL[s.source]} · ${s.locale}`,
    '',
    '### Description',
    '',
    codeBlock(s.description),
    '',
  ];
  const diagnostics = [
    '<details><summary>Diagnostics</summary>',
    '',
    codeBlock(JSON.stringify(diag, null, 2), 'json'),
    '',
    '</details>',
  ];
  const saveBlock =
    save === undefined
      ? []
      : [
          '',
          '<details><summary>Sauvegarde anonymisée</summary>',
          '',
          codeBlock(JSON.stringify(save), 'json'),
          '',
          '</details>',
        ];
  let body = [...head, ...diagnostics, ...saveBlock, ''].join('\n');
  if (body.length > MAX_BODY) {
    body = [...head, ...diagnostics, '', '_Sauvegarde omise : trop volumineuse._', ''].join('\n');
  }
  return {
    title: `${ticket} · ${s.category} (${SOURCE_LABEL[s.source]})`,
    body,
    labels: issueLabels(s),
  };
}

/** Corps de remplacement après `DELETE /v1/tickets/current`. */
export function renderRedacted(ticket: string): string {
  return `**${ticket}**\n\nSignalement supprimé à la demande de son auteur : description et diagnostics effacés.\n`;
}
