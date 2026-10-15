import type { AttachmentType, ReportDiagnostics, ReportSubmission } from '@arbre/contract';

/**
 * Rendu du ticket GitHub (dépôt privé). La description est du Markdown GitHub rendu tel quel,
 * dans une citation (`> `) qui la sépare des sections du service, après neutralisation de ce qui
 * notifie, piste ou trompe (`neutralizeMarkdown`). Diagnostics lisibles (« Environnement ») puis
 * JSON complet dans `<details>`. Jamais de contact, de jeton ni d'IP. Le titre ne contient aucun
 * texte du joueur (l'équipe le réécrit avant de poser l'étiquette `public`).
 */

/** GitHub refuse un corps de plus de 65 536 caractères ; marge pour l'enveloppe. */
export const MAX_BODY = 60_000;

const SOURCE_LABEL = { game: 'jeu', site: 'site' } as const;
const PLATFORM_LABEL = {
  web: 'Web (navigateur)',
  desktop: 'Bureau',
  android: 'Android',
  site: 'Site',
} as const;
const EDITION_LABEL = { full: 'complète', demo: 'démo' } as const;
const TYPE_LABEL: Record<AttachmentType, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
};

/** Pièce jointe telle qu'elle apparaît dans le ticket. */
export interface IssueAttachment {
  url: string;
  type: AttachmentType;
  width: number;
  height: number;
  bytes: number;
}

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

const ZW = '\u200B';
/** Contrôles de direction (texte inversé trompeur). */
const BIDI = /[\u202A-\u202E\u2066-\u2069]/g;

/**
 * Neutralise le Markdown du joueur sans le transformer en texte brut. Un espace sans chasse
 * (U+200B), invisible y compris dans un bloc de code, est inséré :
 * - après `@` suivi d'un nom (mention, notification), sauf dans une adresse (`a@b`) ;
 * - après `#` suivi d'un chiffre et dans `GH-123` (références à d'autres tickets, `o/r#12`) ;
 * - dans les URL de tickets GitHub (`github.com/o/r/issues/12`, référence croisée) ;
 * - entre `!` et `[` (image externe : pistage), devenue un simple lien ;
 * - après `<` suivi d'une lettre, `/`, `!` ou `?` (HTML brut : `<img>`, `</details>`…) ;
 * - après `&` d'une entité (`&#64;`, `&commat;` redonneraient `@`).
 * Contrôles et caractères de direction retirés, fins de ligne normalisées.
 */
export function neutralizeMarkdown(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, '')
    .replace(BIDI, '')
    .replace(/(^|[^A-Za-z0-9])@(?=[A-Za-z0-9])/g, `$1@${ZW}`)
    .replace(/#(?=\d)/g, `#${ZW}`)
    .replace(/\b(GH)-(?=\d)/gi, `$1${ZW}-`)
    .replace(/(github\.com\/[^\s/]+\/[^\s/]+\/)(issues|pull|discussions)\b/gi, `$1${ZW}$2`)
    .replace(/!(?=\[)/g, `!${ZW}`)
    .replace(/<(?=[A-Za-z/!?])/g, `<${ZW}`)
    .replace(/&(?=#|[A-Za-z][A-Za-z0-9]*;)/g, `&${ZW}`);
}

/** Texte du joueur en citation : chaque ligne préfixée, rien ne peut en sortir. */
export function quoteBlock(text: string): string {
  return neutralizeMarkdown(text)
    .split('\n')
    .map((l) => (l.trim() ? `> ${l}` : '>'))
    .join('\n');
}

/** Valeur courte en code dans une cellule de tableau (ni accent grave, ni barre, ni saut). */
function cell(v: string | number): string {
  const clean = String(v)
    .replace(CONTROL, '')
    .replace(/[\r\n`]/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
  return clean ? `\`${clean}\`` : '—';
}

const KIB = 1024;
export function formatBytes(n: number): string {
  if (n < KIB) return `${n} o`;
  if (n < KIB * KIB) return `${Math.round(n / KIB)} Ko`;
  return `${(n / (KIB * KIB)).toFixed(1).replace('.', ',')} Mo`;
}

/** Section « Environnement » : tableau lisible des diagnostics (sans réglages ni sauvegarde). */
export function renderEnvironment(d: ReportDiagnostics): string {
  const rows: [string, string][] = [
    ['Version', `${cell(d.appVersion)} · ${EDITION_LABEL[d.edition]}`],
    ['Plateforme', PLATFORM_LABEL[d.platform]],
  ];
  if (d.gameVersion !== undefined || d.gamePlatform !== undefined) {
    const parts = [
      d.gameVersion !== undefined ? cell(d.gameVersion) : 'version ?',
      d.gamePlatform !== undefined ? PLATFORM_LABEL[d.gamePlatform] : 'plateforme ?',
    ];
    rows.push(['Jeu (déclaré)', parts.join(' · ')]);
  }
  rows.push(['Système', d.os !== undefined ? cell(d.os) : '—']);
  rows.push(['Navigateur', d.browser !== undefined ? cell(d.browser) : '—']);
  rows.push(['Langue', cell(d.locale)]);
  if (d.caseId !== undefined) {
    rows.push([
      'Affaire',
      d.contentHash !== undefined ? `${cell(d.caseId)} (${cell(d.contentHash)})` : cell(d.caseId),
    ]);
  }
  const { w, h, dpr } = d.viewport;
  rows.push(['Fenêtre', `${w} × ${h} @${dpr}x`]);
  return ['| | |', '|---|---|', ...rows.map(([k, v]) => `| ${k} | ${v} |`)].join('\n');
}

/** Section des captures : images en Markdown avec leurs URL signées. */
export function renderAttachments(list: readonly IssueAttachment[]): string {
  return list
    .map(
      (a, i) =>
        `![Capture ${i + 1} · ${TYPE_LABEL[a.type]} ${a.width} × ${a.height}, ${formatBytes(a.bytes)}](${a.url})`,
    )
    .join('\n\n');
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

export function renderIssue(
  ticket: string,
  s: ReportSubmission,
  attachments: readonly IssueAttachment[] = [],
): IssueDraft {
  const { save, ...diag } = s.diagnostics;
  const head = [
    `**${ticket}** · ${s.category} · ${SOURCE_LABEL[s.source]} · ${s.locale}`,
    '',
    '### Description',
    '',
    quoteBlock(s.description),
    '',
    '### Environnement',
    '',
    renderEnvironment(s.diagnostics),
    '',
    ...(attachments.length ? ['### Captures d’écran', '', renderAttachments(attachments), ''] : []),
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
