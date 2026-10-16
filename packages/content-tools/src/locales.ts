/**
 * Traductions (ARCHITECTURE §3.7 règle 12, docs/i18n/PLAN.md) : fusion d'une affaire FR et de son
 * calque de langue, parité des unités traduisibles, termes de recherche, surcharges SVG, et filtre
 * de périmètre de `content:i18n`.
 *
 * Le calque ne porte que le texte (D2) : tout le reste est hérité du FR, si bien que l'affaire
 * fusionnée a la même structure, le même `sourceDigest` et donc le même sel (D4).
 * Une unité non traduite retombe sur le FR (traduction partielle en cours) ; les contrôles de
 * parité la signalent comme manquante.
 */
import type {
  Block,
  Inline,
  Locale,
  LocalesConfig,
  Place,
  Progression,
  WorldMap,
} from '@arbre/contract';
import type {
  CaseTranslation,
  SourceDocument,
  SourceEnding,
  SourceWorld,
  TranslationProblem,
  WorldTranslationSource,
} from './load';
import { linkTermsOf, type CompleteCase, type PrepareFallback } from './prepare';
import { parseSvgElements } from './svg';
import { normalize } from './shared';

/** Unité « affaire » : problème d'ensemble (solveur, projection hors fichier). */
export const CASE_UNIT = '(affaire)';
/** Unité du texte du monde (`content/world/locales/<loc>.json`). */
export const WORLD_UNIT = 'world';
/** Unité de la surcharge de la couche `labels`. */
export const WORLD_LABELS_UNIT = 'world/labels.svg';

/** Statut d'analyse d'une langue cible : `draft` (avertissements) ou `ready` (erreurs). */
export type LocaleLevel = 'draft' | 'ready';

export function localeLevel(
  config: LocalesConfig | null,
  locale: Locale,
  strict: readonly Locale[] = [],
): LocaleLevel {
  if (strict.includes(locale)) return 'ready';
  return config?.locales[locale].status === 'ready' ? 'ready' : 'draft';
}

// ------------------------------------------------------------------ fusion

/** Affaire dans une langue : FR + calque, avec les pièces restées en FR. */
export interface LocalizedCase {
  case: CompleteCase;
  fallback: PrepareFallback;
  /** Documents et fins effectivement traduits. */
  translatedDocuments: Set<string>;
  translatedEndings: Set<string>;
}

function defined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

/** Remplace le texte traduisible de `c` par celui du calque (repli FR unité par unité). */
export function localizeCase(c: CompleteCase, t: CaseTranslation | undefined): LocalizedCase {
  const j = t?.json ?? {};
  const meta = defined({
    ...c.meta,
    title: j.case?.title ?? c.meta.title,
    subtitle: c.meta.subtitle === undefined ? undefined : (j.case?.subtitle ?? c.meta.subtitle),
    credits: c.meta.credits === undefined ? undefined : (j.case?.credits ?? c.meta.credits),
  });

  const family = {
    ...c.family,
    occupations: c.family.occupations.map((o) => ({
      ...o,
      label: j.family?.occupations[o.id] ?? o.label,
    })),
    portraits: c.family.portraits.map((p) => {
      const tp = j.family?.portraits[p.id];
      return defined({
        ...p,
        alt: tp?.alt ?? p.alt,
        caption: p.caption === undefined ? undefined : (tp?.caption ?? p.caption),
      });
    }),
  };

  const tree = {
    ...c.tree,
    groups: c.tree.groups.map((g) => ({ ...g, label: j.tree?.groups[g.id] ?? g.label })),
  };

  const tp = j.progression;
  const progression: Progression = {
    ...c.progression,
    keywords: c.progression.keywords.map((k) => {
      const tk = tp?.keywords[k.id];
      return tk ? { ...k, label: tk.label, terms: tk.terms } : k;
    }),
    secrets: c.progression.secrets.map((s) => ({ ...s, title: tp?.secrets[s.id] ?? s.title })),
  };
  if (c.progression.report) {
    progression.report = c.progression.report.map((q) => {
      const tq = tp?.report?.[q.id];
      return {
        ...q,
        prompt: tq?.prompt ?? q.prompt,
        options: q.options.map((o) => {
          const to = tq?.options[o.id];
          return defined({
            ...o,
            label: to?.label ?? o.label,
            unavailableReason:
              o.unavailableReason === undefined
                ? undefined
                : (to?.unavailableReason ?? o.unavailableReason),
          });
        }),
      };
    });
  }

  const hints = c.hints.map((h) => ({ ...h, text: j.hints?.[h.id] ?? h.text }));
  const achievements = c.achievements.map((a) => {
    const ta = j.achievements?.[a.id];
    return ta ? { ...a, title: ta.title, description: ta.description } : a;
  });

  const documents = new Map<string, SourceDocument>();
  const translatedDocuments = new Set<string>();
  for (const d of c.documents.values()) {
    const td = t?.documents.get(d.id);
    if (!td) {
      documents.set(d.id, d);
      continue;
    }
    translatedDocuments.add(d.id);
    const fm = d.frontmatter;
    documents.set(d.id, {
      id: d.id,
      file: td.file,
      body: td.body,
      frontmatter: defined({
        ...fm,
        title: td.frontmatter.title,
        author: fm.author === undefined ? undefined : (td.frontmatter.author ?? fm.author),
        archive: fm.archive === undefined ? undefined : (td.frontmatter.archive ?? fm.archive),
        illustration: fm.illustration && {
          file: fm.illustration.file,
          alt: td.frontmatter.illustration?.alt ?? fm.illustration.alt,
        },
      }),
    });
  }

  const endings = new Map<string, SourceEnding>();
  const translatedEndings = new Set<string>();
  for (const e of c.endings.values()) {
    const te = t?.endings.get(e.id);
    if (!te) {
      endings.set(e.id, e);
      continue;
    }
    translatedEndings.add(e.id);
    endings.set(e.id, { id: e.id, file: te.file, title: te.title, body: te.body });
  }

  const illustrations = new Map(c.illustrations);
  for (const [file, svg] of t?.illustrations ?? []) {
    if (illustrations.has(file)) illustrations.set(file, svg);
  }

  const localized: CompleteCase = {
    ...c,
    meta,
    family,
    tree,
    progression,
    hints,
    achievements,
    documents,
    endings,
    illustrations,
  };
  return {
    case: localized,
    fallback: {
      terms: linkTermsOf(c),
      documents: new Set([...c.documents.keys()].filter((id) => !translatedDocuments.has(id))),
      endings: new Set([...c.endings.keys()].filter((id) => !translatedEndings.has(id))),
    },
    translatedDocuments,
    translatedEndings,
  };
}

/** Monde dans une langue : titre de la carte et descriptions des lieux (noms jamais traduits). */
export function localizeWorld(w: SourceWorld, t: WorldTranslationSource | undefined): SourceWorld {
  const data = t?.data;
  if (!data && t?.labels === undefined) return w;
  let map: WorldMap | undefined = w.map;
  if (map && data) {
    map = defined({
      ...map,
      title: data.map.title,
      attribution:
        map.attribution === undefined ? undefined : (data.map.attribution ?? map.attribution),
    });
  }
  const places = new Map<string, Place>();
  for (const [id, p] of w.places) {
    const d = data?.places[id]?.description;
    places.set(id, p.description !== undefined && d !== undefined ? { ...p, description: d } : p);
  }
  const layers = new Map(w.layers);
  if (t?.labels !== undefined && layers.has('labels')) layers.set('labels', t.labels);
  return { ...w, ...(map ? { map } : {}), places, layers };
}

// ------------------------------------------------------------------ parité (12.1)

const LIST_MAX = 8;
const list = (ids: string[]) =>
  ids.length > LIST_MAX ? `${ids.slice(0, LIST_MAX).join(', ')}… (${ids.length})` : ids.join(', ');

/** Problème de parité d'un calque : unité, message, catégorie. */
function problem(dir: string, unit: string, message: string, code: string): TranslationProblem {
  return { unit, file: `${dir}/${unit}`, message, code };
}

/** Compare des ids attendus et présents (`Record` d'un calque). */
function keyParity(
  out: TranslationProblem[],
  dir: string,
  unit: string,
  what: string,
  expected: string[],
  actual: string[],
): void {
  const a = new Set(actual);
  const e = new Set(expected);
  const missing = expected.filter((x) => !a.has(x));
  const extra = actual.filter((x) => !e.has(x));
  if (missing.length)
    out.push(problem(dir, unit, `${what} manquant(s) : ${list(missing)}`, 'missing'));
  if (extra.length) out.push(problem(dir, unit, `${what} en trop : ${list(extra)}`, 'extra'));
}

/** Champ facultatif : exigé dans le calque si et seulement s'il est présent en FR. */
function optionalParity(
  out: TranslationProblem[],
  dir: string,
  unit: string,
  what: string,
  inSource: boolean,
  inLayer: boolean,
): void {
  if (inSource && !inLayer)
    out.push(problem(dir, unit, `${what} manquant (présent en FR)`, 'missing'));
  if (!inSource && inLayer) out.push(problem(dir, unit, `${what} en trop (absent en FR)`, 'extra'));
}

/**
 * Règle 12.1 : chaque unité FR traduisible a son équivalent dans le calque, aucun extra.
 * `dir` : dossier du calque (relatif à la racine), même s'il n'existe pas.
 */
export function parityProblems(
  c: CompleteCase,
  t: CaseTranslation | undefined,
  dir: string,
): TranslationProblem[] {
  const out: TranslationProblem[] = [];
  const j = t?.json ?? {};
  const present = (unit: string, value: unknown) => {
    if (value !== undefined || t?.invalid.has(unit)) return value !== undefined;
    out.push(problem(dir, unit, 'fichier de traduction manquant', 'missing'));
    return false;
  };

  if (present('case.json', j.case) && j.case) {
    optionalParity(
      out,
      dir,
      'case.json',
      'subtitle',
      c.meta.subtitle !== undefined,
      j.case.subtitle !== undefined,
    );
    optionalParity(
      out,
      dir,
      'case.json',
      'credits',
      c.meta.credits !== undefined,
      j.case.credits !== undefined,
    );
    if (c.meta.credits && j.case.credits && c.meta.credits.length !== j.case.credits.length) {
      out.push(
        problem(
          dir,
          'case.json',
          `credits : ${j.case.credits.length} ligne(s) pour ${c.meta.credits.length} en FR`,
          'parity',
        ),
      );
    }
  }

  if (present('family.json', j.family) && j.family) {
    keyParity(
      out,
      dir,
      'family.json',
      'métier(s)',
      c.family.occupations.map((o) => o.id),
      Object.keys(j.family.occupations),
    );
    keyParity(
      out,
      dir,
      'family.json',
      'portrait(s)',
      c.family.portraits.map((p) => p.id),
      Object.keys(j.family.portraits),
    );
    for (const p of c.family.portraits) {
      const tp = j.family.portraits[p.id];
      if (tp)
        optionalParity(
          out,
          dir,
          'family.json',
          `portrait ${p.id} : caption`,
          p.caption !== undefined,
          tp.caption !== undefined,
        );
    }
  }

  if (c.tree.groups.length && present('tree.json', j.tree) && j.tree) {
    keyParity(
      out,
      dir,
      'tree.json',
      'groupe(s)',
      c.tree.groups.map((g) => g.id),
      Object.keys(j.tree.groups),
    );
  } else if (!c.tree.groups.length && j.tree && Object.keys(j.tree.groups).length) {
    keyParity(out, dir, 'tree.json', 'groupe(s)', [], Object.keys(j.tree.groups));
  }

  const prog = c.progression;
  if (present('progression.json', j.progression) && j.progression) {
    const tp = j.progression;
    keyParity(
      out,
      dir,
      'progression.json',
      'mot(s)-clé(s)',
      prog.keywords.map((k) => k.id),
      Object.keys(tp.keywords),
    );
    keyParity(
      out,
      dir,
      'progression.json',
      'secret(s)',
      prog.secrets.map((s) => s.id),
      Object.keys(tp.secrets),
    );
    const report = prog.report ?? [];
    optionalParity(
      out,
      dir,
      'progression.json',
      'report',
      report.length > 0,
      tp.report !== undefined,
    );
    if (tp.report) {
      keyParity(
        out,
        dir,
        'progression.json',
        'question(s) du rapport',
        report.map((q) => q.id),
        Object.keys(tp.report),
      );
      for (const q of report) {
        const tq = tp.report[q.id];
        if (!tq) continue;
        keyParity(
          out,
          dir,
          'progression.json',
          `option(s) de « ${q.id} »`,
          q.options.map((o) => o.id),
          Object.keys(tq.options),
        );
        for (const o of q.options) {
          const to = tq.options[o.id];
          if (to)
            optionalParity(
              out,
              dir,
              'progression.json',
              `option ${q.id}.${o.id} : unavailableReason`,
              o.unavailableReason !== undefined,
              to.unavailableReason !== undefined,
            );
        }
      }
    }
  }

  if (c.hints.length || j.hints || t?.invalid.has('hints.json')) {
    if (present('hints.json', j.hints) && j.hints)
      keyParity(
        out,
        dir,
        'hints.json',
        'aide(s)',
        c.hints.map((h) => h.id),
        Object.keys(j.hints),
      );
  }
  if (c.achievements.length || j.achievements || t?.invalid.has('achievements.json')) {
    if (present('achievements.json', j.achievements) && j.achievements)
      keyParity(
        out,
        dir,
        'achievements.json',
        'succès',
        c.achievements.map((a) => a.id),
        Object.keys(j.achievements),
      );
  }

  for (const d of c.documents.values()) {
    const unit = `documents/${d.id}.md`;
    const td = t?.documents.get(d.id);
    if (!td) {
      if (!t?.invalid.has(unit)) out.push(problem(dir, unit, 'document non traduit', 'missing'));
      continue;
    }
    const fm = d.frontmatter;
    optionalParity(
      out,
      dir,
      unit,
      'author',
      fm.author !== undefined,
      td.frontmatter.author !== undefined,
    );
    optionalParity(
      out,
      dir,
      unit,
      'archive',
      fm.archive !== undefined,
      td.frontmatter.archive !== undefined,
    );
    optionalParity(
      out,
      dir,
      unit,
      'illustration',
      fm.illustration !== undefined,
      td.frontmatter.illustration !== undefined,
    );
  }
  for (const id of t?.documents.keys() ?? []) {
    if (!c.documents.has(id))
      out.push(problem(dir, `documents/${id}.md`, 'document absent en FR', 'extra'));
  }
  for (const e of c.endings.values()) {
    const unit = `endings/${e.id}.md`;
    if (!t?.endings.has(e.id) && !t?.invalid.has(unit))
      out.push(problem(dir, unit, 'fin non traduite', 'missing'));
  }
  for (const id of t?.endings.keys() ?? []) {
    if (!c.endings.has(id))
      out.push(problem(dir, `endings/${id}.md`, 'fin absente en FR', 'extra'));
  }
  for (const file of t?.illustrations.keys() ?? []) {
    if (!c.illustrations.has(file))
      out.push(problem(dir, file, 'surcharge sans illustration de base en FR', 'extra'));
  }
  return out;
}

/** Règle 12.1 pour le monde : titre, attribution si FR, description des lieux qui en ont une. */
export function worldParityProblems(
  w: SourceWorld,
  t: WorldTranslationSource,
): TranslationProblem[] {
  const out: TranslationProblem[] = [];
  const at = (message: string, code: string): TranslationProblem => ({
    unit: WORLD_UNIT,
    file: t.file,
    message,
    code,
  });
  if (!w.map && w.places.size === 0) return out;
  if (!t.data) {
    if (!t.invalid) out.push(at('fichier de traduction manquant', 'missing'));
    return out;
  }
  if (w.map && w.map.attribution !== undefined && t.data.map.attribution === undefined)
    out.push(at('map.attribution manquante (présente en FR)', 'missing'));
  if (w.map && w.map.attribution === undefined && t.data.map.attribution !== undefined)
    out.push(at('map.attribution en trop (absente en FR)', 'extra'));
  const missing: string[] = [];
  const extra: string[] = [];
  for (const [id, p] of w.places) {
    const tp = t.data.places[id];
    if (p.description !== undefined && tp?.description === undefined) missing.push(id);
    if (p.description === undefined && tp?.description !== undefined) extra.push(id);
  }
  for (const id of Object.keys(t.data.places)) if (!w.places.has(id)) extra.push(id);
  if (missing.length)
    out.push(at(`description(s) de lieu manquante(s) : ${list(missing)}`, 'missing'));
  if (extra.length) out.push(at(`lieu(x) ou description(s) en trop : ${list(extra)}`, 'extra'));
  return out;
}

// ------------------------------------------------------------------ termes (12.5)

/**
 * Règle 12.5 : termes uniques après normalisation dans la langue ; tout terme FR égal à une
 * variante de prénom ou de nom d'une personne, ou au nom d'un lieu, figure aussi dans la langue.
 */
export function termProblems(
  source: CompleteCase,
  localized: CompleteCase,
  t: CaseTranslation | undefined,
  places: ReadonlyMap<string, Place>,
  dir: string,
): TranslationProblem[] {
  const out: TranslationProblem[] = [];
  const unit = 'progression.json';
  const owner = new Map<string, string>();
  for (const k of localized.progression.keywords) {
    for (const term of k.terms) {
      const n = normalize(term);
      if (!n) {
        out.push(
          problem(
            dir,
            unit,
            `mot-clé « ${k.id} » : terme « ${term} » vide après normalisation`,
            'terms',
          ),
        );
        continue;
      }
      const o = owner.get(n);
      if (o && o !== k.id)
        out.push(problem(dir, unit, `terme « ${n} » partagé par « ${o} » et « ${k.id} »`, 'terms'));
      else owner.set(n, k.id);
    }
  }
  const proper = new Set<string>([
    ...source.family.persons.flatMap((p) => [...p.given, ...p.family].map(normalize)),
    ...[...places.values()].map((p) => normalize(p.name)),
  ]);
  for (const k of source.progression.keywords) {
    const tk = t?.json.progression?.keywords[k.id];
    if (!tk) continue;
    const mine = new Set(tk.terms.map(normalize));
    const lost = k.terms.filter((x) => proper.has(normalize(x)) && !mine.has(normalize(x)));
    if (lost.length)
      out.push(
        problem(
          dir,
          unit,
          `mot-clé « ${k.id} » : nom propre absent des termes traduits : ${lost.join(', ')}`,
          'terms',
        ),
      );
  }
  return out;
}

// ------------------------------------------------------------------ documents (12.3, 12.4, 12.9)

function countBlocks(blocks: Block[]): { redacted: number; stamp: number } {
  let redacted = 0;
  let stamp = 0;
  const inl = (ns: Inline[]): void => {
    for (const n of ns) {
      if (n.t === 'redacted') redacted++;
      else if (n.t !== 'text' && n.t !== 'mark') inl(n.c);
    }
  };
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      switch (b.t) {
        case 'p':
        case 'signature':
        case 'h':
          inl(b.c);
          break;
        case 'quote':
          walk(b.c);
          break;
        case 'list':
          b.items.forEach(inl);
          break;
        case 'table':
          b.head.forEach(inl);
          b.rows.forEach((r) => r.forEach(inl));
          break;
        case 'figure':
          if (b.caption) inl(b.caption);
          break;
        case 'stamp':
          stamp++;
          break;
        case 'hr':
          break;
      }
    }
  };
  walk(blocks);
  return { redacted, stamp };
}

export { countBlocks as markupCounts };

/** Paragraphes (texte brut) d'une suite de blocs, citations comprises. */
export function paragraphs(blocks: Block[], text: (b: Block) => string): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.t === 'p') out.push(text(b));
    else if (b.t === 'quote') out.push(...paragraphs(b.c, text));
  }
  return out;
}

/** Nombre de mots d'un texte. */
export const wordCount = (s: string) =>
  s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// ------------------------------------------------------------------ SVG (12.8)

/** viewBox et ids d'un SVG (pour comparer une surcharge à sa base). */
export function svgShape(src: string): { viewBox: string | null; ids: string[] } {
  const { elements } = parseSvgElements(src);
  const root = elements[0];
  const viewBox = root?.name === 'svg' ? (root.attrs.get('viewBox') ?? null) : null;
  const ids = elements.map((e) => e.attrs.get('id')).filter((x): x is string => x !== undefined);
  return {
    viewBox:
      viewBox &&
      viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .join(' '),
    ids: [...new Set(ids)].sort(),
  };
}

/** Différences de forme entre une surcharge et sa base (même viewBox, mêmes ids). */
export function svgShapeProblems(base: string, override: string): string[] {
  const a = svgShape(base);
  const b = svgShape(override);
  const out: string[] = [];
  if (a.viewBox !== b.viewBox)
    out.push(`viewBox « ${b.viewBox ?? ''} » ≠ base « ${a.viewBox ?? ''} »`);
  const sb = new Set(b.ids);
  const sa = new Set(a.ids);
  const missing = a.ids.filter((x) => !sb.has(x));
  const extra = b.ids.filter((x) => !sa.has(x));
  if (missing.length) out.push(`ids absents de la surcharge : ${list(missing)}`);
  if (extra.length) out.push(`ids en trop dans la surcharge : ${list(extra)}`);
  return out;
}

// ------------------------------------------------------------------ périmètre (`--only`)

/** Glob simple → expression régulière : `**`, `*`, `?`, `{a,b}`. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  let depth = 0;
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i]!;
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else re += '.*';
      } else re += '[^/]*';
    } else if (ch === '?') re += '[^/]';
    else if (ch === '{') {
      depth++;
      re += '(?:';
    } else if (ch === '}' && depth > 0) {
      depth--;
      re += ')';
    } else if (ch === ',' && depth > 0) re += '|';
    else re += ch.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

/** Vrai si l'unité est dans le périmètre : le glob la désigne, ou désigne l'un de ses dossiers. */
export function unitInScope(unit: string, only: RegExp | null): boolean {
  if (!only) return true;
  const parts = unit.split('/');
  for (let k = parts.length; k > 0; k--) if (only.test(parts.slice(0, k).join('/'))) return true;
  return false;
}
