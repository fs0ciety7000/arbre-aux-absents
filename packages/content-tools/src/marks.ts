/**
 * Marques et enregistrements (affaire 3, docs/game/AFFAIRE-3.md §1, §3 ; ARCHITECTURE §3.7 bis) :
 * gabarit de la description verbale d'une marque, types des cases, pièces `recording`, ratio de
 * candidats par type. Fonctions pures, appelées par `content:check` et le rapport du solveur.
 */
import type {
  CompiledCase,
  Locale,
  Portrait,
  PortraitKind,
  TreeSlot,
  Person,
} from '@arbre/contract';
import { personPortraits } from './compile';
import { collectMarks } from './markdown';
import type { CompleteCase } from './prepare';
import type { SolverResult } from './solver';

/** Longueur maximale d'une description verbale de marque (§1.6). */
export const MARK_ALT_MAX = 110;
/** Candidats exigés par case, pour chaque type de champ (GAME_DESIGN §7.3, AFFAIRE-3 §1.3). */
export const MIN_CANDIDATE_RATIO = 1.5;

/** Vocabulaire fermé du gabarit (§1.6), par langue. L'anglais est provisoire (calque à venir). */
interface MarkVocabulary {
  heads: readonly string[];
  /** Préfixe du segment du pied (« pied »), suivi de « : » facultatif. */
  foot: string;
  plain: string;
  barred: string;
  notches: readonly string[];
  /** Lien entre deux signes du pied (« , puis »). */
  then: string;
  grains: readonly string[];
  /** Préfixe du segment du talon (« talon »), suivi de « : ». */
  heel: string;
  heels: readonly string[];
}

export const MARK_VOCABULARY: Record<Locale, MarkVocabulary> = {
  fr: {
    heads: ['Fourche', 'Œil', 'Flèche', 'Potence'],
    foot: 'pied',
    plain: 'lisse',
    barred: 'barré',
    notches: ['entaille à gauche', 'entaille à droite'],
    then: 'puis',
    grains: ['un grain', 'deux grains'],
    heel: 'talon',
    heels: ['petite Fourche', 'petit Œil', 'petite Flèche', 'petite Potence'],
  },
  en: {
    // Les noms insulaires des têtes peuvent rester en français (noms propres, D3 d'i18n).
    heads: ['Fork', 'Eye', 'Arrow', 'Gallows', 'Fourche', 'Œil', 'Flèche', 'Potence'],
    foot: 'foot',
    plain: 'plain',
    barred: 'barred',
    notches: ['notch on the left', 'notch on the right'],
    then: 'then',
    grains: ['one grain', 'two grains'],
    heel: 'heel',
    heels: [
      'small Fork',
      'small Eye',
      'small Arrow',
      'small Gallows',
      'small Fourche',
      'small Œil',
      'small Flèche',
      'small Potence',
    ],
  },
};

/** Espaces insécables (typographie française) ramenées à l'espace simple, blancs réduits. */
function tidy(s: string): string {
  return s
    .normalize('NFC')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Vrai si la description suit la forme du gabarit (segments séparés par « ; »). */
export function isTemplateDescription(alt: string): boolean {
  return alt.includes(';');
}

/**
 * Problèmes de gabarit d'une description de marque (§1.6) : « Tête ; pied : signes ; grains ;
 * talon : petite tête », segments absents omis, ordre fixe, vocabulaire fermé. `[]` si conforme.
 * Une description sans « ; » n'est pas analysée ici (description libre : voir `markAltProblems`).
 */
export function markDescriptionProblems(alt: string, locale: Locale = 'fr'): string[] {
  const v = MARK_VOCABULARY[locale];
  const segs = tidy(alt)
    .split(/\s*;\s*/)
    .map((x) => x.trim());
  const out: string[] = [];
  const head = segs.shift() ?? '';
  if (!v.heads.includes(head)) {
    out.push(`tête « ${head} » hors vocabulaire (${v.heads.join(', ')})`);
  }
  // Segments suivants, dans l'ordre : pied, grains, talon ; chacun au plus une fois.
  let stage = 0;
  for (const seg of segs) {
    const foot = new RegExp(`^${v.foot}\\s*:?\\s+(.+)$`).exec(seg);
    const heel = new RegExp(`^${v.heel}\\s*:\\s*(.+)$`).exec(seg);
    if (foot && stage < 1) {
      stage = 1;
      const signs = foot[1]!.split(new RegExp(`\\s*,\\s*${v.then}\\s+`));
      signs.forEach((sign, i) => {
        if (i === 0 && (sign === v.plain || sign === v.barred)) {
          if (sign === v.plain && signs.length > 1)
            out.push(`pied « ${v.plain} » suivi d'autres signes`);
          return;
        }
        if (!v.notches.includes(sign))
          out.push(
            `signe du pied « ${sign} » hors vocabulaire (${[v.plain, v.barred, ...v.notches].join(', ')})`,
          );
      });
      const notches = signs.filter((s) => v.notches.includes(s)).length;
      if (notches > 2) out.push(`${notches} entailles (2 au plus)`);
      continue;
    }
    if (v.grains.includes(seg) && stage < 2) {
      stage = 2;
      continue;
    }
    if (heel && stage < 3) {
      stage = 3;
      if (!v.heels.includes(heel[1]!))
        out.push(`talon « ${heel[1]} » hors vocabulaire (${v.heels.join(', ')})`);
      continue;
    }
    out.push(`segment « ${seg} » inattendu ou hors d'ordre (tête → pied → grains → talon)`);
  }
  return out;
}

/** Problème d'une description de marque : erreurs et avertissements. */
export interface MarkAltProblems {
  errors: string[];
  warnings: string[];
}

/** Contrôle complet du texte alternatif d'une marque (longueur, gabarit, description libre). */
export function markAltProblems(alt: string, locale: Locale = 'fr'): MarkAltProblems {
  const errors: string[] = [];
  const warnings: string[] = [];
  const text = tidy(alt);
  if (text.length > MARK_ALT_MAX)
    errors.push(`description de ${text.length} caractères (${MARK_ALT_MAX} au plus)`);
  if (isTemplateDescription(text)) {
    for (const p of markDescriptionProblems(text, locale)) errors.push(`gabarit : ${p}`);
  } else {
    warnings.push('description libre (hors gabarit « Tête ; pied : … ») : dessin sans code ?');
  }
  return { errors, warnings };
}

/** Type d'un portrait (absent = `face`). */
export const kindOfPortrait = (p: Pick<Portrait, 'kind'> | undefined): PortraitKind =>
  p?.kind ?? 'face';

/** Type du champ d'une case (absent = `face`). */
export const kindOfSlot = (s: Pick<TreeSlot, 'portraitKind'>): PortraitKind =>
  s.portraitKind ?? 'face';

const KIND_LABEL: Record<PortraitKind, string> = { face: 'un visage', mark: 'une marque' };

/** Problème localisé : fichier relatif au dossier de l'affaire, règle de §3.7. */
export interface MarkIssue {
  rule: 1 | 2 | 3;
  severity: 'error' | 'warning';
  /** Relatif au dossier de l'affaire (`tree.json`, `documents/x.md`). */
  file: string;
  message: string;
}

/**
 * Contrôles structurels des marques et des enregistrements sur une affaire source (FR) :
 * `::mark` vers une marque existante, types des réponses et des déclarations, pièces `recording`,
 * descriptions des marques (gabarit, doublons).
 */
export function markIssues(c: CompleteCase): MarkIssue[] {
  const out: MarkIssue[] = [];
  const portraits = new Map(c.family.portraits.map((p) => [p.id, p]));
  const persons = new Map<string, Person>(c.family.persons.map((p) => [p.id, p]));
  const err = (rule: MarkIssue['rule'], file: string, message: string) =>
    out.push({ rule, severity: 'error', file, message });

  // ::mark dans les pièces et les fins : une marque existante.
  const inlineMarks = (file: string, marks: string[]) => {
    for (const id of new Set(marks)) {
      const p = portraits.get(id);
      if (!p) err(2, file, `::mark[${id}] : portrait inconnu`);
      else if (kindOfPortrait(p) !== 'mark')
        err(2, file, `::mark[${id}] : ce portrait est un visage (kind: 'mark' attendu)`);
    }
  };
  for (const d of c.documents.values()) {
    const marks = collectMarks(d.body);
    inlineMarks(d.file, marks);
    if (d.frontmatter.kind === 'recording') {
      if (d.frontmatter.reveals?.portraits?.length)
        err(
          2,
          d.file,
          'pièce recording : reveals.portraits interdit (une marque dite ne se collecte pas)',
        );
      if (marks.length)
        err(2, d.file, 'pièce recording : ::mark[…] interdit (une marque dite ne se montre pas)');
    }
  }
  for (const e of c.endings.values()) inlineMarks(e.file, collectMarks(e.body));

  // Types des cases : réponses et déclaration du même type que le champ.
  for (const s of c.tree.slots) {
    const kind = kindOfSlot(s);
    const p = persons.get(s.person);
    const wrong = (id: string, what: string) => {
      const portrait = portraits.get(id);
      if (portrait && kindOfPortrait(portrait) !== kind)
        err(
          3,
          'tree.json',
          `case « ${s.id} » (champ ${kind === 'mark' ? 'Marque' : 'Portrait'}) : ${what} « ${id} » est ${KIND_LABEL[kindOfPortrait(portrait)]}`,
        );
    };
    if (p) for (const id of personPortraits(p)) wrong(id, `réponse de ${p.id}`);
    if (s.claim?.portrait) wrong(s.claim.portrait, 'portrait déclaré');
  }

  // Descriptions des marques : gabarit, longueur, doublons.
  out.push(...markAltIssues(c.family.portraits, 'fr', 'family.json'));
  return out;
}

/** Descriptions des marques d'une liste de portraits (source ou calque d'une langue). */
export function markAltIssues(
  list: readonly Portrait[],
  locale: Locale,
  file: string,
): MarkIssue[] {
  const out: MarkIssue[] = [];
  const seen = new Map<string, string>();
  for (const p of list) {
    if (kindOfPortrait(p) !== 'mark') continue;
    const r = markAltProblems(p.alt, locale);
    for (const m of r.errors)
      out.push({ rule: 1, severity: 'error', file, message: `marque « ${p.id} » : ${m}` });
    for (const m of r.warnings)
      out.push({ rule: 1, severity: 'warning', file, message: `marque « ${p.id} » : ${m}` });
    const key = tidy(p.alt).toLocaleLowerCase(locale);
    const other = seen.get(key);
    if (other)
      out.push({
        rule: 1,
        severity: 'error',
        file,
        message: `marques « ${other} » et « ${p.id} » : même description (indiscernables au lecteur d'écran)`,
      });
    else seen.set(key, p.id);
  }
  return out;
}

/** Candidats d'un type de champ : cases de ce type et portraits de ce type collectables. */
export interface CandidateRatio {
  kind: PortraitKind;
  slots: number;
  candidates: number;
  ratio: number;
}

/**
 * Ratio de candidats par type (§1.3) : portraits révélés par les pièces atteintes par le solveur
 * ou posés d'emblée (cases pré-remplies, déclarations), rapportés aux cases du même type.
 * Les visages ne comptent pas pour les cases à marque, et inversement.
 */
export function candidateRatios(compiled: CompiledCase, solve: SolverResult): CandidateRatio[] {
  const seen = new Set<string>();
  for (const d of solve.read)
    for (const p of compiled.documents[d]?.reveals?.portraits ?? []) seen.add(p);
  for (const s of Object.values(compiled.slots)) {
    if (s.prefilledGuess?.portrait) seen.add(s.prefilledGuess.portrait);
    if (s.claimedGuess?.portrait) seen.add(s.claimedGuess.portrait);
  }
  const out: CandidateRatio[] = [];
  for (const kind of ['face', 'mark'] as const) {
    const slots = Object.values(compiled.slots).filter((s) => kindOfSlot(s) === kind).length;
    if (slots === 0) continue;
    const candidates = [...seen].filter(
      (id) => compiled.portraits[id] && kindOfPortrait(compiled.portraits[id]) === kind,
    ).length;
    out.push({ kind, slots, candidates, ratio: candidates / slots });
  }
  return out;
}
