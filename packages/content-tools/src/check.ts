/**
 * `content:check` (ARCHITECTURE §3.7) : les 11 règles, solveur compris. Ne fait aucune écriture.
 */
import { gzipSync } from 'node:zlib';
import type {
  Block,
  CompiledCase,
  Locale,
  MapLayer,
  Person,
  Place,
  SlotClaim,
  WorldMap,
} from '@arbre/contract';
import { catalogFor } from './catalog';
import { collectRefs } from './autolink';
import {
  compileCase,
  documentAssets,
  personPortraits,
  solverModelFor,
  type CompileOutput,
} from './compile';
import { conditionRefs, type AnyCondition, type AtomRef } from './conditions';
import { IssueList, RULE_TITLES, type Issue, type RuleId } from './issues';
import {
  isComplete,
  loadContent,
  sourceLocale,
  targetLocales,
  type CaseTranslation,
  type ContentSource,
  type SourceWorld,
  type TranslationProblem,
  type WorldTranslationSource,
} from './load';
import {
  CASE_UNIT,
  WORLD_LABELS_UNIT,
  WORLD_UNIT,
  localeLevel,
  localizeCase,
  localizeWorld,
  markupCounts,
  paragraphs,
  parityProblems,
  svgShapeProblems,
  termProblems,
  wordCount,
  worldParityProblems,
  type LocaleLevel,
} from './locales';
import { diffProjection, figureAssets, structuralProjection, unitOfPath } from './projection';
import { blockTexts, collectMarks, inlineText } from './markdown';
import { MIN_CANDIDATE_RATIO, candidateRatios, markAltIssues, markIssues } from './marks';
import { COMMON_SECTION, splitSections } from './sections';
import { mentions, prepareCase, type CompleteCase, type PreparedCase } from './prepare';
import { normalize } from './shared';
import { solve, type SolverResult } from './solver';
import { MIN_QUERY_LENGTH } from '@arbre/engine';
import { checkSvg, countElements, optimizeSvg } from './svg';

/** Longueur minimale d'un terme normalisé (= `MIN_QUERY_LENGTH` du moteur) : en deçà, jamais cherchable. */
export const MIN_TERM_LENGTH = MIN_QUERY_LENGTH;

/** Budgets gzip (octets) et DOM (règle 9). */
export const BUDGETS = {
  portrait: 25 * 1024,
  illustration: 60 * 1024,
  baseLayer: 60 * 1024,
  layersTotal: 300 * 1024,
  caseText: 600 * 1024,
  mapNodes: 6000,
  /** Catalogue d'affaires d'une langue et d'une édition (règle 12). */
  catalog: 20 * 1024,
} as const;

export interface CompiledWorld {
  map: WorldMap | null;
  places: Record<string, Place>;
  layers: Partial<Record<MapLayer, string>>;
}

/** Résultat de compilation et de résolution d'une affaire dans une langue. */
export interface LocaleCheck {
  locale: Locale;
  /** `source` (FR), `draft` (avertissements, sans solveur) ou `ready` (erreurs, règles rejouées). */
  level: 'source' | LocaleLevel;
  prep?: PreparedCase;
  full?: CompileOutput;
  demo?: CompileOutput;
  solve?: SolverResult;
  demoSolve?: SolverResult;
}

export interface CaseCheck {
  id: string;
  /** Langue source (FR) : mêmes valeurs que `locales.fr`. */
  prep?: PreparedCase;
  full?: CompileOutput;
  demo?: CompileOutput;
  solve?: SolverResult;
  demoSolve?: SolverResult;
  /** Par langue analysée (source comprise). */
  locales: Partial<Record<Locale, LocaleCheck>>;
}

export interface LocalesSummary {
  source: Locale;
  /** Langues cibles analysées et leur niveau. */
  targets: { locale: Locale; level: LocaleLevel }[];
  /** Langues à écrire par `content:build` : source et langues `ready` (statut du fichier). */
  compiled: Locale[];
}

export interface CheckResult {
  source: ContentSource;
  issues: IssueList;
  cases: CaseCheck[];
  /** Monde de la langue source. */
  world: CompiledWorld;
  /** Monde par langue analysée (source comprise). */
  worlds: Partial<Record<Locale, CompiledWorld>>;
  locales: LocalesSummary;
}

export interface CheckOptions {
  /**
   * Langues analysées comme `ready` (erreurs, compilation, solveur) quel que soit leur statut :
   * `content:i18n`, `content:solve -- --locale`. Elles ne sont pas écrites par le build si
   * leur statut reste `draft`.
   */
  strictLocales?: readonly Locale[];
}

const gz = (s: string) => gzipSync(Buffer.from(s, 'utf8'), { level: 9 }).length;
const kb = (n: number) => `${(n / 1024).toFixed(1)} Ko`;

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

export async function checkContentRoot(
  root: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const issues = new IssueList();
  const source = await loadContent(root, issues);
  const world = checkWorld(source.world, issues);
  const src = sourceLocale(source.locales);
  const targets = targetLocales(source.locales).map((locale) => ({
    locale,
    level: localeLevel(source.locales, locale, options.strictLocales),
  }));
  const compiledLocales: Locale[] = [
    src,
    ...targets
      .filter((t) => source.locales?.locales[t.locale].status === 'ready')
      .map((t) => t.locale),
  ];
  const worlds: CheckResult['worlds'] = { [src]: world };
  const localizedWorlds = new Map<Locale, SourceWorld>();
  for (const { locale, level } of targets) {
    const wt = source.world.translations.get(locale);
    const lw = localizeWorld(source.world, wt);
    localizedWorlds.set(locale, lw);
    worlds[locale] = checkWorldLocale(source.world, world, lw, wt, locale, level, issues);
  }
  const cases: CaseCheck[] = [];
  for (const c of source.cases) {
    const cc: CaseCheck = { id: c.id, locales: {} };
    cases.push(cc);
    if (c.missing.length > 0) {
      issues.warn(
        1,
        c.dir,
        `brouillon : ${c.missing.join(', ')} manquant(s) ; fichiers présents contrôlés, affaire ni compilée ni résolue`,
      );
      continue;
    }
    if (!isComplete(c)) {
      issues.error(1, c.dir, 'affaire invalide : compilation et solveur ignorés');
      continue;
    }
    const cache = new Map<string, ReturnType<typeof optimizeSvg>>();
    checkCase(c, source.world, issues, cc, cache);
    cc.locales[src] = {
      locale: src,
      level: 'source',
      ...(cc.prep ? { prep: cc.prep } : {}),
      ...(cc.full ? { full: cc.full } : {}),
      ...(cc.demo ? { demo: cc.demo } : {}),
      ...(cc.solve ? { solve: cc.solve } : {}),
      ...(cc.demoSolve ? { demoSolve: cc.demoSolve } : {}),
    };
    for (const { locale, level } of targets) {
      checkCaseLocale(
        c,
        source.world,
        localizedWorlds.get(locale) ?? source.world,
        c.translations.get(locale),
        locale,
        level,
        issues,
        cc,
        cache,
      );
    }
  }
  checkAcrossCases(source, issues);
  checkCatalogs(cases, [src, ...targets.map((t) => t.locale)], src, targets, issues);
  return {
    source,
    issues,
    cases,
    world,
    worlds,
    locales: { source: src, targets, compiled: compiledLocales },
  };
}

/** Budget du catalogue d'affaires par langue et par édition (règle 9, règle 12 hors source). */
function checkCatalogs(
  cases: CaseCheck[],
  locales: Locale[],
  src: Locale,
  targets: { locale: Locale; level: LocaleLevel }[],
  issues: IssueList,
): void {
  for (const locale of locales) {
    for (const edition of ['full', 'demo'] as const) {
      const compiled = cases.flatMap((c) => {
        const out = c.locales[locale]?.[edition];
        return out ? [out.compiled] : [];
      });
      if (compiled.length === 0) continue;
      const size = gz(JSON.stringify(catalogFor(compiled)));
      if (size <= BUDGETS.catalog) continue;
      const message = `catalogue ${edition}.${locale} ${kb(size)} gzip > ${kb(BUDGETS.catalog)}`;
      if (locale === src) issues.error(9, 'content/cases', message);
      else {
        const level = targets.find((t) => t.locale === locale)?.level ?? 'draft';
        issues.report(level === 'ready' ? 'error' : 'warning', 12, 'content/cases', message, {
          locale,
          unit: CASE_UNIT,
          code: 'budget',
        });
      }
    }
  }
}

/**
 * Règle 1 entre affaires : ids de succès (profil commun), ids et fichiers de portraits (chunks du
 * jeu) et rangs `order` uniques sur l'ensemble des affaires.
 */
function checkAcrossCases(source: ContentSource, issues: IssueList): void {
  const across = (what: string, entries: { caseDir: string; file: string; key: string }[]) => {
    const owners = new Map<string, string[]>();
    for (const e of entries) owners.set(e.key, [...(owners.get(e.key) ?? []), e.caseDir]);
    for (const e of entries) {
      const dirs = [...new Set(owners.get(e.key) ?? [])];
      if (dirs.length > 1) {
        const others = dirs.filter((d) => d !== e.caseDir);
        issues.error(
          1,
          `${e.caseDir}/${e.file}`,
          `${what} « ${e.key} » déjà utilisé par ${others.join(', ')}`,
        );
      }
    }
  };
  across(
    'succès',
    source.cases.flatMap((c) =>
      c.achievements.map((a) => ({ caseDir: c.dir, file: 'achievements.json', key: a.id })),
    ),
  );
  across(
    'portrait',
    source.cases.flatMap((c) =>
      (c.family?.portraits ?? []).map((p) => ({
        caseDir: c.dir,
        file: 'family.json',
        key: p.id,
      })),
    ),
  );
  // Fichiers présents sur disque (déclarés ou non) : même nom = même chunk dans le jeu.
  across(
    'fichier de portrait',
    source.cases.flatMap((c) =>
      [...c.portraits.keys()].map((file) => ({ caseDir: c.dir, file, key: file })),
    ),
  );
  across(
    'rang (order)',
    source.cases.flatMap((c) =>
      c.meta?.order === undefined
        ? []
        : [{ caseDir: c.dir, file: 'case.json', key: String(c.meta.order) }],
    ),
  );
}

// ---------------------------------------------------------------- monde

function checkWorld(w: SourceWorld, issues: IssueList): CompiledWorld {
  const out: CompiledWorld = {
    map: w.map ?? null,
    places: Object.fromEntries(w.places),
    layers: {},
  };
  if (!w.map) {
    if (w.layers.size > 0)
      issues.error(2, 'content/world/map.json', 'couches présentes sans map.json');
    return out;
  }
  const viewBox = `0 0 ${1000 * w.map.aspect} 1000`;
  let total = 0;
  let nodes = 0;
  for (const layer of w.map.layers) {
    const file = `art/map/${layer}.svg`;
    const src = w.layers.get(layer);
    if (src === undefined) {
      issues.error(2, file, `couche « ${layer} » déclarée dans map.json mais absente`);
      continue;
    }
    for (const p of checkSvg(src, {
      idPrefix: layer,
      viewBox,
      ...(layer === 'places' ? { extraPrefixes: ['place'] } : {}),
    }))
      issues.error(8, file, p.message, p.line);
    const opt = optimizeSvg(src, '');
    for (const p of opt.problems) issues.error(8, file, p.message);
    out.layers[layer] = opt.svg;
    const size = gz(opt.svg);
    total += size;
    nodes += countElements(opt.svg);
    if (layer === 'base' && size > BUDGETS.baseLayer) {
      issues.error(9, file, `couche base ${kb(size)} gzip > ${kb(BUDGETS.baseLayer)}`);
    }
  }
  for (const layer of w.layers.keys()) {
    if (!w.map.layers.includes(layer)) {
      issues.warn(2, `art/map/${layer}.svg`, 'couche absente de map.json (ignorée)');
    }
  }
  if (total > BUDGETS.layersTotal) {
    issues.error(9, 'art/map', `couches ${kb(total)} gzip > ${kb(BUDGETS.layersTotal)}`);
  }
  if (nodes > BUDGETS.mapNodes) {
    issues.error(9, 'art/map', `DOM de la carte : ${nodes} nœuds > ${BUDGETS.mapNodes}`);
  }
  return out;
}

// ---------------------------------------------------------------- affaire

function checkCase(
  c: CompleteCase,
  world: SourceWorld,
  issues: IssueList,
  out: CaseCheck,
  cache: Map<string, ReturnType<typeof optimizeSvg>>,
): void {
  const f = (name: string) => `${c.dir}/${name}`;
  const prog = c.progression;
  const errorsBefore = issues.errors.length;

  // ---- Règle 1 : unicité, id = nom de fichier
  const uniq = (file: string, what: string, ids: string[]) => {
    for (const d of duplicates(ids)) issues.error(1, f(file), `${what} « ${d} » en double`);
  };
  uniq(
    'family.json',
    'personne',
    c.family.persons.map((p) => p.id),
  );
  uniq(
    'family.json',
    'métier',
    c.family.occupations.map((o) => o.id),
  );
  uniq(
    'family.json',
    'portrait',
    c.family.portraits.map((p) => p.id),
  );
  uniq(
    'tree.json',
    'case',
    c.tree.slots.map((s) => s.id),
  );
  uniq(
    'tree.json',
    'groupe',
    c.tree.groups.map((g) => g.id),
  );
  uniq(
    'progression.json',
    'mot-clé',
    prog.keywords.map((k) => k.id),
  );
  uniq(
    'progression.json',
    'secret',
    prog.secrets.map((s) => s.id),
  );
  uniq(
    'progression.json',
    'fin',
    prog.endings.map((e) => e.id),
  );
  uniq(
    'progression.json',
    'lieu',
    prog.places.map((p) => p.place),
  );
  const report = prog.report ?? [];
  uniq(
    'progression.json',
    'question du rapport',
    report.map((q) => q.id),
  );
  for (const q of report) {
    uniq(
      'progression.json',
      `option de la question ${q.id}`,
      q.options.map((o) => o.id),
    );
    if (q.options.length < 2) {
      issues.error(1, f('progression.json'), `question « ${q.id} » : au moins 2 options`);
    }
  }
  uniq(
    'hints.json',
    'aide',
    c.hints.map((h) => h.id),
  );
  uniq(
    'achievements.json',
    'succès',
    c.achievements.map((a) => a.id),
  );
  for (const p of c.family.portraits) {
    if (p.file !== `portraits/${p.id}.svg`) {
      issues.error(
        1,
        f('family.json'),
        `portrait « ${p.id} » : fichier attendu portraits/${p.id}.svg`,
      );
    }
  }
  for (const e of prog.endings) {
    if (e.file !== `endings/${e.id}.md`) {
      issues.error(
        1,
        f('progression.json'),
        `fin « ${e.id} » : fichier attendu endings/${e.id}.md`,
      );
    }
  }

  // ---- Règle 2 : références
  const docs = new Set(c.documents.keys());
  const persons = new Map(c.family.persons.map((p) => [p.id, p]));
  const occupations = new Set(c.family.occupations.map((o) => o.id));
  const portraits = new Set(c.family.portraits.map((p) => p.id));
  const slots = new Map(c.tree.slots.map((s) => [s.id, s]));
  const groups = new Map(c.tree.groups.map((g) => [g.id, g]));
  const keywords = new Map(prog.keywords.map((k) => [k.id, k]));
  const secrets = new Set(prog.secrets.map((s) => s.id));
  const endings = new Set(prog.endings.map((e) => e.id));
  const casePlaces = new Set(prog.places.map((p) => p.place));
  const questions = new Map((prog.report ?? []).map((q) => [q.id, q]));
  const ref = (file: string, kind: string, id: string, set: { has(id: string): boolean }) => {
    if (!set.has(id)) issues.error(2, f(file), `${kind} inconnu(e) : « ${id} »`);
  };
  const condRefs = (file: string, cond: AnyCondition | undefined) => {
    if (!cond) return;
    for (const r of conditionRefs(cond)) {
      const sets: Record<AtomRef['kind'], [string, { has(id: string): boolean }]> = {
        read: ['document', docs],
        unlocked: ['document', docs],
        searched: ['mot-clé', keywords],
        visited: ['lieu', casePlaces],
        locked: ['case', slots],
        groupLocked: ['groupe', groups],
        secret: ['secret', secrets],
        endingReached: ['fin', endings],
        answered: ['question du rapport', questions],
      };
      const [kind, set] = sets[r.kind];
      ref(file, `${kind} (condition ${r.kind})`, r.id, set);
      const q = questions.get(r.id);
      if (r.kind === 'answered' && q && !q.options.some((o) => o.id === r.option)) {
        issues.error(2, f(file), `option inconnue « ${r.option} » pour la question « ${r.id} »`);
      }
    }
  };
  ref('case.json', 'document intro', c.meta.intro, docs);
  if (c.meta.epilogue) ref('case.json', 'document épilogue', c.meta.epilogue, docs);
  for (const p of c.family.persons) {
    ref('family.json', `métier de ${p.id}`, p.occupation, occupations);
    ref('family.json', `portrait de ${p.id}`, p.portrait, portraits);
    for (const x of p.altPortraits ?? [])
      ref('family.json', `autre visage de ${p.id}`, x, portraits);
    if ((p.altPortraits ?? []).includes(p.portrait))
      issues.warn(2, f('family.json'), `${p.id} : altPortraits répète le portrait canonique`);
    for (const d of duplicates(p.altPortraits ?? []))
      issues.error(1, f('family.json'), `${p.id} : autre visage « ${d} » en double`);
    for (const x of p.parents ?? [])
      if (x !== null) ref('family.json', `parent de ${p.id}`, x, persons);
    for (const x of p.unions ?? []) ref('family.json', `union de ${p.id}`, x, persons);
  }
  for (const p of c.family.portraits) {
    if (!c.portraits.has(p.file))
      issues.error(2, f(p.file), `fichier du portrait « ${p.id} » absent`);
  }
  const declaredPortraitFiles = new Set(c.family.portraits.map((p) => p.file));
  for (const file of c.portraits.keys()) {
    if (!declaredPortraitFiles.has(file))
      issues.warn(2, f(file), 'portrait non déclaré dans family.json');
  }
  const givenVariants = new Set(c.family.persons.flatMap((p) => p.given.map(normalize)));
  const familyVariants = new Set(c.family.persons.flatMap((p) => p.family.map(normalize)));
  for (const s of c.tree.slots) {
    ref('tree.json', `personne de la case ${s.id}`, s.person, persons);
    condRefs('tree.json', s.revealedBy);
    if (!s.claim) continue;
    const cl = s.claim;
    if (cl.portrait) ref('tree.json', `visage déclaré de la case ${s.id}`, cl.portrait, portraits);
    if (cl.occupation)
      ref('tree.json', `métier déclaré de la case ${s.id}`, cl.occupation, occupations);
    if (cl.given !== undefined && !givenVariants.has(normalize(cl.given))) {
      issues.error(
        2,
        f('tree.json'),
        `case « ${s.id} » : prénom déclaré « ${cl.given} » : variante d'aucune personne`,
      );
    }
    if (cl.family !== undefined && !familyVariants.has(normalize(cl.family))) {
      issues.error(
        2,
        f('tree.json'),
        `case « ${s.id} » : nom déclaré « ${cl.family} » : variante d'aucune personne`,
      );
    }
  }
  for (const g of c.tree.groups)
    for (const s of g.slots) ref('tree.json', `case du groupe ${g.id}`, s, slots);
  for (const d of prog.start) ref('progression.json', 'document de départ', d, docs);
  for (const [d, cond] of Object.entries(prog.unlocks)) {
    ref('progression.json', 'document (unlocks)', d, docs);
    condRefs('progression.json', cond);
  }
  for (const k of prog.keywords) {
    for (const r of k.results) {
      for (const d of r.documents) ref('progression.json', `document du mot-clé ${k.id}`, d, docs);
      condRefs('progression.json', r.requires);
    }
  }
  for (const p of prog.places) {
    ref('progression.json', 'lieu du monde', p.place, world.places);
    condRefs('progression.json', p.revealedBy);
    for (const d of p.documents) {
      ref('progression.json', `document du lieu ${p.place}`, d.id, docs);
      condRefs('progression.json', d.requires);
    }
  }
  for (const [o, cond] of Object.entries(prog.occupationsUnlock ?? {})) {
    ref('progression.json', 'métier (occupationsUnlock)', o, occupations);
    condRefs('progression.json', cond);
  }
  for (const s of prog.secrets) condRefs('progression.json', s.discoveredBy);
  for (const e of prog.endings) {
    condRefs('progression.json', e.when);
    if (!c.endings.has(e.id)) issues.error(2, f(e.file), `fichier de la fin « ${e.id} » absent`);
  }
  for (const q of prog.report ?? []) {
    condRefs('progression.json', q.askedWhen);
    for (const o of q.options) {
      condRefs('progression.json', o.availableWhen);
      if (o.unavailableReason !== undefined && o.availableWhen === undefined)
        issues.error(
          2,
          'progression.json',
          `rapport « ${q.id} » : l'option « ${o.id} » a une unavailableReason sans availableWhen`,
        );
    }
  }
  // Sections des fins : étiquettes du fichier ↔ clés de `sections`.
  for (const e of prog.endings) {
    const file = c.endings.get(e.id);
    if (!file) continue;
    const { sections, errors } = splitSections(file.body);
    for (const m of errors) issues.error(2, file.file, m);
    const labels = new Set(sections.map((sec) => sec.label).filter((l): l is string => l !== null));
    for (const l of labels) {
      if (l !== COMMON_SECTION && !(e.sections && l in e.sections)) {
        issues.error(
          2,
          file.file,
          `section [${l}] absente de progression.json (endings.${e.id}.sections)`,
        );
      }
    }
    for (const [l, cond] of Object.entries(e.sections ?? {})) {
      condRefs('progression.json', cond);
      if (l === COMMON_SECTION) {
        issues.error(
          2,
          f('progression.json'),
          `fin « ${e.id} » : [${COMMON_SECTION}] ne prend pas de condition`,
        );
      } else if (!labels.has(l)) {
        issues.error(
          2,
          f('progression.json'),
          `fin « ${e.id} » : section [${l}] absente de ${e.file}`,
        );
      }
    }
  }
  for (const id of c.endings.keys()) {
    if (!endings.has(id))
      issues.warn(2, f(`endings/${id}.md`), 'fin non déclarée dans progression.json');
  }
  if (prog.demo) {
    for (const d of prog.demo.documents) ref('progression.json', 'document de la démo', d, docs);
    for (const s of prog.demo.slots) ref('progression.json', 'case de la démo', s, slots);
    ref('progression.json', 'document de fin de démo', prog.demo.end, docs);
  }
  for (const h of c.hints) {
    if ('slot' in h.target) ref('hints.json', `case de l'aide ${h.id}`, h.target.slot, slots);
    else ref('hints.json', `groupe de l'aide ${h.id}`, h.target.group, groups);
    condRefs('hints.json', h.availableWhen);
  }
  for (const a of c.achievements) condRefs('achievements.json', a.when);
  for (const d of c.documents.values()) {
    const fm = d.frontmatter;
    if (fm.place) ref(relDoc(c, d.file), 'lieu', fm.place, world.places);
    for (const p of fm.reveals?.portraits ?? [])
      ref(relDoc(c, d.file), 'portrait révélé', p, portraits);
    for (const o of fm.reveals?.occupations ?? [])
      ref(relDoc(c, d.file), 'métier révélé', o, occupations);
    for (const k of collectRefs(d.body))
      ref(relDoc(c, d.file), 'mot-clé du lien [[…]]', k, keywords);
    for (const a of documentAssets(d)) {
      if (!c.illustrations.has(a)) issues.error(7, d.file, `image inexistante : ${a}`);
    }
  }
  for (const e of c.endings.values()) {
    for (const k of collectRefs(e.body))
      ref(relDoc(c, e.file), 'mot-clé du lien [[…]]', k, keywords);
    for (const a of documentAssets({ frontmatter: {}, body: e.body })) {
      if (!c.illustrations.has(a)) issues.error(7, e.file, `image inexistante : ${a}`);
    }
  }

  // ---- Règle 3 : arbre
  const slotPersons = c.tree.slots.map((s) => s.person);
  for (const d of duplicates(slotPersons))
    issues.error(3, f('tree.json'), `personne « ${d} » dans plusieurs cases`);
  const inGroup = new Map<string, string[]>();
  for (const g of c.tree.groups) {
    for (const s of g.slots) inGroup.set(s, [...(inGroup.get(s) ?? []), g.id]);
    if (g.threshold < 3) issues.error(3, f('tree.json'), `groupe « ${g.id} » : seuil < 3`);
    if (g.slots.length < g.threshold) {
      issues.warn(
        3,
        f('tree.json'),
        `groupe « ${g.id} » : ${g.slots.length} case(s) pour un seuil de ${g.threshold}`,
      );
    }
  }
  for (const s of c.tree.slots) {
    const gs = inGroup.get(s.id) ?? [];
    if (s.claim && s.prefilled) {
      issues.error(3, f('tree.json'), `case « ${s.id} » : claim et prefilled sont exclusifs`);
    }
    if (s.claim && s.revealedBy) {
      issues.error(
        3,
        f('tree.json'),
        `case revendiquée « ${s.id} » cachée (revealedBy) : une déclaration est visible d'emblée`,
      );
    }
    if (s.claim && claimIsRight(s.claim, persons.get(s.person))) {
      issues.error(
        3,
        f('tree.json'),
        `case revendiquée « ${s.id} » : déclaration juste sur ses 4 champs (elle doit être fausse sur au moins un)`,
      );
    }
    if (s.prefilled && gs.length > 0) {
      issues.error(
        3,
        f('tree.json'),
        `case pré-remplie « ${s.id} » dans un groupe (${gs.join(', ')})`,
      );
    } else if (!s.prefilled && gs.length !== 1) {
      issues.error(
        3,
        f('tree.json'),
        `case « ${s.id} » dans ${gs.length} groupe(s) : les groupes doivent partitionner les cases non pré-remplies (revendiquées comprises)`,
      );
    }
  }
  for (const p of c.family.persons) {
    const ps = (p.parents ?? []).flatMap((x) => (x === null ? [] : [x]));
    if (ps.includes(p.id)) issues.error(3, f('family.json'), `${p.id} est son propre parent`);
    if (ps.length === 2 && ps[0] === ps[1])
      issues.error(3, f('family.json'), `${p.id} : deux fois le même parent`);
    for (const x of ps) {
      const parent = persons.get(x);
      if (parent?.born && p.born && parent.born.slice(0, 4) >= p.born.slice(0, 4)) {
        issues.error(
          3,
          f('family.json'),
          `${x} (né ${parent.born}) n'est pas né avant son enfant ${p.id} (${p.born})`,
        );
      }
    }
    for (const u of p.unions ?? []) {
      if (!(persons.get(u)?.unions ?? []).includes(p.id)) {
        issues.warn(3, f('family.json'), `union ${p.id} → ${u} non réciproque`);
      }
    }
  }
  {
    const state = new Map<string, 0 | 1 | 2>();
    const visit = (id: string, path: string[]): void => {
      const st = state.get(id);
      if (st === 2) return;
      if (st === 1) {
        issues.error(3, f('family.json'), `cycle de filiation : ${[...path, id].join(' → ')}`);
        return;
      }
      state.set(id, 1);
      for (const x of persons.get(id)?.parents ?? [])
        if (x && persons.has(x)) visit(x, [...path, id]);
      state.set(id, 2);
    };
    for (const id of persons.keys()) visit(id, []);
  }

  // ---- Marques et enregistrements (§3.7 bis) : règles 1 (descriptions), 2 (::mark, recording), 3 (cases)
  for (const m of markIssues(c)) {
    if (m.severity === 'error') issues.error(m.rule, f(m.file), m.message);
    else issues.warn(m.rule, f(m.file), m.message);
  }

  // ---- Règle 4 : auto-dépendances
  const selfRef = (
    file: string,
    what: string,
    cond: AnyCondition | undefined,
    kinds: AtomRef['kind'][],
    id: string,
  ) => {
    if (cond && conditionRefs(cond).some((r) => kinds.includes(r.kind) && r.id === id)) {
      issues.error(4, f(file), `${what} « ${id} » dépend de lui-même`);
    }
  };
  for (const [d, cond] of Object.entries(prog.unlocks))
    selfRef('progression.json', 'déblocage du document', cond, ['read', 'unlocked'], d);
  for (const q of prog.report ?? []) {
    selfRef('progression.json', 'question du rapport', q.askedWhen, ['answered'], q.id);
  }
  for (const s of prog.secrets)
    selfRef('progression.json', 'secret', s.discoveredBy, ['secret'], s.id);
  for (const p of prog.places)
    selfRef('progression.json', 'lieu', p.revealedBy, ['visited'], p.place);
  for (const s of c.tree.slots) {
    selfRef('tree.json', 'case', s.revealedBy, ['locked'], s.id);
    const g = inGroup.get(s.id)?.[0];
    if (g) selfRef('tree.json', `case ${s.id} : groupe`, s.revealedBy, ['groupLocked'], g);
  }
  for (const k of prog.keywords) {
    for (const r of k.results) {
      for (const d of r.documents) {
        if (
          r.requires &&
          conditionRefs(r.requires).some(
            (x) => (x.kind === 'read' || x.kind === 'unlocked') && x.id === d,
          )
        ) {
          issues.error(
            4,
            f('progression.json'),
            `résultat du mot-clé « ${k.id} » : « ${d} » dépend de lui-même`,
          );
        }
      }
    }
  }

  // ---- Règle 5 : mots-clés (partie statique)
  const termOwner = new Map<string, string>();
  for (const k of prog.keywords) {
    const local = new Set<string>();
    for (const t of k.terms) {
      const n = normalize(t);
      if (!n) {
        issues.error(
          5,
          f('progression.json'),
          `mot-clé « ${k.id} » : terme « ${t} » vide après normalisation`,
        );
        continue;
      }
      if (n.length < MIN_TERM_LENGTH) {
        issues.error(
          5,
          f('progression.json'),
          `mot-clé « ${k.id} » : terme « ${t} » (« ${n} ») de moins de ${MIN_TERM_LENGTH} caractères, jamais cherchable`,
        );
      }
      if (local.has(n))
        issues.warn(5, f('progression.json'), `mot-clé « ${k.id} » : terme « ${t} » en double`);
      local.add(n);
      const owner = termOwner.get(n);
      if (owner && owner !== k.id) {
        issues.error(
          5,
          f('progression.json'),
          `terme « ${n} » partagé par « ${owner} » et « ${k.id} »`,
        );
      } else termOwner.set(n, k.id);
    }
  }

  // SVG (règle 8) avant compilation : une affaire aux SVG invalides n'est pas optimisée.
  for (const [file, src] of c.portraits) {
    const stem = file.slice('portraits/'.length, -4);
    for (const p of checkSvg(src, { idPrefix: stem })) issues.error(8, f(file), p.message, p.line);
  }
  for (const [file, src] of c.illustrations) {
    const stem = file.slice('illustrations/'.length, -4);
    for (const p of checkSvg(src, { idPrefix: stem })) issues.error(8, f(file), p.message, p.line);
  }

  if (issues.errors.length > errorsBefore) {
    issues.error(6, c.dir, 'erreurs de structure : compilation et solveur ignorés');
    return;
  }

  // ---- Compilation, solveur
  const prep = prepareCase(c);
  out.prep = prep;
  reportOverlaps(prep, issues);
  verifyCase(c, prep, world, issues, out, cache, 'fr', true);
}

function reportOverlaps(prep: PreparedCase, issues: IssueList): void {
  for (const { file, overlap } of prep.overlaps) {
    issues.error(
      5,
      file,
      `chevauchement de liens « ${overlap.text} » : « ${overlap.kept} » / « ${overlap.dropped} »`,
    );
  }
}

/**
 * Compilation (éditions complète et démo), solveur et règles 5 (présence), 6, 9, 10, 11.
 * Rejouée par langue (règle 12.7) sur l'affaire traduite.
 */
function verifyCase(
  c: CompleteCase,
  prep: PreparedCase,
  world: SourceWorld,
  issues: IssueList,
  out: Omit<LocaleCheck, 'locale' | 'level'>,
  cache: Map<string, ReturnType<typeof optimizeSvg>>,
  locale: Locale,
  reportSvg: boolean,
): void {
  const f = (name: string) => `${c.dir}/${name}`;
  const prog = c.progression;
  const full = compileCase(prep, world, 'full', cache, locale);
  out.full = full;
  if (reportSvg)
    for (const s of full.svgProblems)
      for (const p of s.problems) issues.error(8, s.file, p.message);
  const result = solve(solverModelFor(full.compiled, prep));
  out.solve = result;

  // ---- Règle 5 : présence dans un texte accessible
  const reachableRefs = new Set<string>();
  for (const d of result.read)
    for (const k of prep.documents.get(d)?.keywords ?? []) reachableRefs.add(k);
  for (const k of prog.keywords) {
    if (k.hiddenTerm) {
      const inText = [...prep.documents.values()].find((d) =>
        k.terms.some((t) => {
          const n = normalize(t);
          return n && d.norm.includes(` ${n} `);
        }),
      );
      if (inText) issues.warn(5, inText.file, `terme caché de « ${k.id} » écrit tel quel`);
      continue;
    }
    if (!reachableRefs.has(k.id)) {
      issues.error(5, f('progression.json'), `mot-clé « ${k.id} » absent de tout texte accessible`);
    }
  }

  // ---- Règle 6 : solvabilité
  for (const d of prep.documents.values()) {
    if (d.frontmatter.optional || d.id === c.meta.epilogue) continue;
    if (!result.unlocked.has(d.id)) issues.error(6, d.file, 'document inatteignable');
  }
  for (const [id, why] of result.blockedSlots) {
    issues.error(6, f('tree.json'), `case « ${id} » jamais établie : ${why.join(' ; ')}`);
  }
  for (const s of prog.secrets) {
    if (!result.secrets.has(s.id))
      issues.error(6, f('progression.json'), `secret « ${s.id} » inatteignable`);
  }
  for (const e of prog.endings) {
    if (!result.endings.has(e.id))
      issues.error(6, f('progression.json'), `fin « ${e.id} » inatteignable`);
  }
  if (result.endingsAtEnd.length === 0) {
    issues.error(6, f('progression.json'), 'aucune fin vraie à 100 %');
  }
  checkClaimAccess(c, prep, full.compiled, result, issues);
  // Candidats par type (AFFAIRE-3 §1.3) : seulement pour une affaire à cases Marque.
  const ratios = candidateRatios(full.compiled, result);
  if (ratios.some((r) => r.kind === 'mark')) {
    for (const r of ratios) {
      if (r.ratio < MIN_CANDIDATE_RATIO)
        issues.warn(
          6,
          f('family.json'),
          `${r.kind === 'mark' ? 'marques' : 'visages'} collectables : ${r.candidates} pour ${r.slots} case(s) (${r.ratio.toFixed(2)} < ${MIN_CANDIDATE_RATIO})`,
        );
    }
  }

  // ---- Règle 9 : budgets
  for (const p of Object.values(full.compiled.portraits)) {
    const size = gz(p.svg);
    if (size > BUDGETS.portrait)
      issues.error(9, f(p.file), `portrait ${kb(size)} gzip > ${kb(BUDGETS.portrait)}`);
  }
  for (const [file, svg] of Object.entries(full.illustrations)) {
    const size = gz(svg);
    if (size > BUDGETS.illustration)
      issues.error(9, f(file), `illustration ${kb(size)} gzip > ${kb(BUDGETS.illustration)}`);
  }
  const textSize = gz(JSON.stringify(withoutSvg(full.compiled)));
  if (textSize > BUDGETS.caseText) {
    issues.error(
      9,
      c.dir,
      `affaire compilée (texte) ${kb(textSize)} gzip > ${kb(BUDGETS.caseText)}`,
    );
  }

  // ---- Règle 11 : fuites
  for (const m of findLeaks(full.compiled, c)) issues.error(11, c.dir, `[complet] ${m}`);

  // ---- Règle 10 : démo
  if (!prog.demo) {
    issues.warn(10, f('progression.json'), 'aucune section demo : pas de démo pour cette affaire');
    return;
  }
  const demoSpec = prog.demo;
  if (!demoSpec.documents.includes(demoSpec.end)) {
    issues.error(
      10,
      f('progression.json'),
      `demo.end « ${demoSpec.end} » absent de demo.documents`,
    );
  }
  if (!demoSpec.documents.includes(c.meta.intro)) {
    issues.error(
      10,
      f('progression.json'),
      `l'intro « ${c.meta.intro} » doit faire partie de la démo`,
    );
  }
  const demo = compileCase(prep, world, 'demo', cache, locale);
  out.demo = demo;
  if (demo.compiled.progression.start.length === 0) {
    issues.error(10, f('progression.json'), 'aucun document de départ dans la démo');
  }
  const ds = solve(solverModelFor(demo.compiled, prep));
  out.demoSolve = ds;
  if (!ds.unlocked.has(demoSpec.end)) {
    issues.error(
      10,
      f('progression.json'),
      `démo : document de fin « ${demoSpec.end} » inatteignable`,
    );
  }
  for (const s of demoSpec.slots) {
    if (!ds.locked.has(s)) {
      const why = ds.blockedSlots.get(s) ?? ['case retirée de la démo'];
      issues.error(10, f('tree.json'), `démo : case « ${s} » jamais établie : ${why.join(' ; ')}`);
    }
  }
  for (const d of demoSpec.documents) {
    if (!ds.unlocked.has(d) && !prep.documents.get(d)?.frontmatter.optional) {
      issues.error(
        10,
        f('progression.json'),
        `démo : document « ${d} » inatteignable dans la démo`,
      );
    }
  }
  for (const m of demoCanaries(demo, prep)) issues.error(10, c.dir, `[démo] ${m}`);
  for (const m of findLeaks(demo.compiled, c)) issues.error(11, c.dir, `[démo] ${m}`);
}

/** Vrai si la déclaration est complète et juste sur ses 4 champs (normalisation du moteur). */
export function claimIsRight(claim: SlotClaim, p: Person | undefined): boolean {
  if (!p) return false;
  if (!claim.given || !claim.family || !claim.portrait || !claim.occupation) return false;
  return (
    p.given.some((v) => normalize(v) === normalize(claim.given!)) &&
    p.family.some((v) => normalize(v) === normalize(claim.family!)) &&
    personPortraits(p).includes(claim.portrait) &&
    p.occupation === claim.occupation
  );
}

/**
 * Règle 6 (avertissements) : une déclaration ne doit pas être le seul accès au visage juste d'une
 * case, et ses noms doivent être lus dans une pièce de départ (re-sélection après retrait).
 */
function checkClaimAccess(
  c: CompleteCase,
  prep: PreparedCase,
  compiled: CompiledCase,
  result: SolverResult,
  issues: IssueList,
): void {
  const f = (name: string) => `${c.dir}/${name}`;
  const claimed = c.tree.slots.filter((s) => s.claim);
  if (claimed.length === 0) return;
  const claimedPortraits = new Set(
    claimed.flatMap((s) => (s.claim?.portrait ? [s.claim.portrait] : [])),
  );
  const persons = new Map(c.family.persons.map((p) => [p.id, p]));
  const revealedByDocs = new Set(
    [...result.read].flatMap((d) => compiled.documents[d]?.reveals?.portraits ?? []),
  );
  for (const s of c.tree.slots) {
    const p = persons.get(s.person);
    if (!p || s.prefilled) continue;
    const faces = personPortraits(p);
    if (faces.some((x) => revealedByDocs.has(x))) continue;
    if (faces.some((x) => claimedPortraits.has(x))) {
      issues.warn(
        6,
        f('tree.json'),
        `case « ${s.id} » : son visage juste n'est accessible que par une déclaration (aucune pièce atteignable ne le révèle)`,
      );
    }
  }
  const startDocs = [c.meta.intro, ...c.progression.start]
    .map((d) => prep.documents.get(d))
    .filter((d): d is NonNullable<typeof d> => d !== undefined);
  for (const s of claimed) {
    for (const v of [s.claim?.given, s.claim?.family]) {
      if (!v) continue;
      if (!startDocs.some((d) => mentions(d.norm, [v]))) {
        issues.warn(
          6,
          f('tree.json'),
          `case revendiquée « ${s.id} » : valeur déclarée « ${v} » lue dans aucune pièce de départ`,
        );
      }
    }
  }
}

function relDoc(_c: CompleteCase, file: string): string {
  // Les fichiers de documents sont déjà relatifs à la racine ; `ref` préfixe par le dossier.
  return file.split('/').slice(-2).join('/');
}

function withoutSvg(c: CompiledCase): CompiledCase {
  return {
    ...c,
    portraits: Object.fromEntries(
      Object.entries(c.portraits).map(([k, p]) => [k, { ...p, svg: '' }]),
    ),
  };
}

/** Règle 11 : aucune note de bible ni réponse en clair (hors cases pré-remplies). */
export function findLeaks(compiled: CompiledCase, c: CompleteCase): string[] {
  const out: string[] = [];
  const json = JSON.stringify(compiled);
  if (json.includes('"bibleNotes"')) out.push('clé bibleNotes présente');
  if (/"person"\s*:/.test(json)) out.push('clé person présente (lien case → personne en clair)');
  for (const p of c.family.persons) {
    const note = p.bibleNotes?.trim();
    if (note && note.length >= 8 && json.includes(JSON.stringify(note).slice(1, -1))) {
      out.push(`notes de bible de « ${p.id} » présentes`);
    }
  }
  const otherIds = new Set<string>([
    ...Object.keys(compiled.documents),
    ...Object.keys(compiled.keywords),
    ...Object.keys(compiled.slots),
    ...Object.keys(compiled.portraits),
    ...Object.keys(compiled.occupations),
    ...Object.keys(compiled.places),
    ...compiled.groups.map((g) => g.id),
    ...compiled.progression.secrets.map((s) => s.id),
    ...Object.keys(compiled.endings),
    compiled.id,
  ]);
  for (const p of c.family.persons) {
    if (!otherIds.has(p.id) && json.includes(`"${p.id}"`))
      out.push(`id de personne « ${p.id} » présent`);
  }
  // Un portrait ne doit pas nommer la personne qu'il représente (id, texte alternatif, légende).
  for (const person of c.family.persons) {
    for (const face of personPortraits(person)) {
      const p = compiled.portraits[face];
      if (!p) continue;
      const fields = ` ${normalize(`${p.id} ${p.alt} ${p.caption ?? ''}`)} `;
      const named = [...person.given, ...person.family].some((n) => {
        const t = normalize(n);
        return t.length > 0 && fields.includes(` ${t} `);
      });
      if (named)
        out.push(`portrait « ${p.id} » : id, alt ou légende révèle le nom de « ${person.id} »`);
    }
  }
  const HEX = /^[0-9a-f]{14}$/;
  for (const s of Object.values(compiled.slots)) {
    const a = s.answer;
    const all = [...a.given, ...a.family, ...a.portrait, a.occupation];
    if (!all.every((h) => HEX.test(h))) out.push(`case « ${s.id} » : réponse non hachée`);
    const person = c.tree.slots.find((t) => t.id === s.id)?.person;
    const p = c.family.persons.find((x) => x.id === person);
    if (p && a.portrait.length !== personPortraits(p).length)
      out.push(
        `case « ${s.id} » : ${a.portrait.length} visage(s) haché(s) au lieu de ${personPortraits(p).length}`,
      );
  }
  return out;
}

/** Règle 10 : canaris — aucun texte hors démo dans le bundle démo. */
export function demoCanaries(demo: CompileOutput, prep: PreparedCase): string[] {
  const out: string[] = [];
  const bundle = JSON.stringify(demo.compiled) + JSON.stringify(demo.illustrations);
  const demoDocs = new Set(Object.keys(demo.compiled.documents));
  const demoText = [...demoDocs]
    .map((d) => prep.documents.get(d)!)
    .flatMap((d) => [d.frontmatter.title, ...blockTexts(d.body)])
    .join('\n');
  const canary = (label: string, text: string) => {
    const t = text.trim();
    if (t.length < 12 || demoText.includes(t)) return;
    if (bundle.includes(JSON.stringify(t).slice(1, -1)))
      out.push(`${label} : « ${t.slice(0, 60)} »`);
  };
  for (const d of prep.documents.values()) {
    if (demoDocs.has(d.id)) continue;
    if (bundle.includes(`"${d.id}"`)) out.push(`id de document hors démo « ${d.id} »`);
    canary(`titre hors démo (${d.id})`, d.frontmatter.title);
    for (const t of blockTexts(d.body)) canary(`texte hors démo (${d.id})`, t.slice(0, 32));
  }
  for (const e of prep.endings.values()) {
    canary(`fin (${e.id})`, e.title);
    for (const t of blockTexts(e.body)) canary(`fin (${e.id})`, t.slice(0, 32));
  }
  for (const s of prep.src.progression.secrets) {
    if (!demo.compiled.progression.secrets.some((x) => x.id === s.id))
      canary(`secret (${s.id})`, s.title);
  }
  for (const file of prep.src.illustrations.keys()) {
    if (!(file in demo.illustrations) && bundle.includes(file))
      out.push(`illustration hors démo ${file}`);
  }
  return out;
}

// ---------------------------------------------------------------- traductions (règle 12)

/** Émetteur de problèmes de règle 12 pour une langue (sévérité selon son niveau). */
function localeEmitter(
  issues: IssueList,
  locale: Locale,
  level: LocaleLevel,
  caseId: string | undefined,
) {
  const sev: Issue['severity'] = level === 'ready' ? 'error' : 'warning';
  return (p: TranslationProblem, warnOnly = false) =>
    issues.report(warnOnly ? 'warning' : sev, 12, p.file, p.message, {
      line: p.line,
      locale,
      caseId,
      unit: p.unit,
      code: p.code,
    });
}

/** Unité traduite d'un fichier (FR ou calque) d'une affaire. */
function unitOfFile(file: string, caseDir: string, layerDir: string): string {
  for (const pre of [`${layerDir}/`, `${caseDir}/`]) {
    if (file.startsWith(pre)) {
      const rest = file.slice(pre.length);
      if (/^(documents|endings|illustrations)\//.test(rest)) return rest;
      return CASE_UNIT;
    }
  }
  return CASE_UNIT;
}

const sortedSet = (xs: Iterable<string>) => [...new Set(xs)].sort();

function setDiff(a: string[], b: string[]): string | null {
  const sa = new Set(a);
  const sb = new Set(b);
  const missing = [...sa].filter((x) => !sb.has(x));
  const extra = [...sb].filter((x) => !sa.has(x));
  if (!missing.length && !extra.length) return null;
  return [
    missing.length ? `manque ${missing.join(', ')}` : '',
    extra.length ? `en trop ${extra.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join(' ; ');
}

/** Paragraphes de plus de 8 mots identiques au FR (oubli de traduction, 12.9). */
function untranslatedParagraphs(source: Block[], translated: Block[]): string[] {
  const text = (b: Block) => (b.t === 'p' ? inlineText(b.c).replace(/\s+/g, ' ').trim() : '');
  const fr = new Set(paragraphs(source, text));
  return paragraphs(translated, text).filter((p) => wordCount(p) > 8 && fr.has(p));
}

/**
 * Règle 12 pour une affaire et une langue : parité, termes, surcharges SVG, mots-clés liés et
 * figures par document, sections des fins, projection structurelle par édition ; en `ready`,
 * règles 5, 6, 9, 10 et 11 rejouées sur l'affaire traduite.
 */
function checkCaseLocale(
  c: CompleteCase,
  world: SourceWorld,
  lworld: SourceWorld,
  t: CaseTranslation | undefined,
  locale: Locale,
  level: LocaleLevel,
  issues: IssueList,
  cc: CaseCheck,
  cache: Map<string, ReturnType<typeof optimizeSvg>>,
): void {
  const dir = t?.dir ?? `${c.dir}/locales/${locale}`;
  const emit = localeEmitter(issues, locale, level, c.id);
  const at = (unit: string, message: string, code: string, line?: number): TranslationProblem => ({
    unit,
    file: unit === CASE_UNIT ? dir : `${dir}/${unit}`,
    message,
    code,
    ...(line ? { line } : {}),
  });
  for (const p of t?.problems ?? []) emit(p);
  for (const p of parityProblems(c, t, dir)) emit(p);
  const loc = localizeCase(c, t);
  for (const p of termProblems(c, loc.case, t, world.places, dir)) emit(p);

  // 12.8 : surcharges SVG (même viewBox, mêmes ids, règles 8 et 9).
  for (const [file, svg] of t?.illustrations ?? []) {
    const base = c.illustrations.get(file);
    if (base === undefined) continue; // « en trop » : parité
    const stem = file.slice('illustrations/'.length, -4);
    for (const p of checkSvg(svg, { idPrefix: stem }))
      emit(at(file, `règle 8 : ${p.message}`, 'svg', p.line));
    for (const m of svgShapeProblems(base, svg)) emit(at(file, m, 'svg'));
    const opt = optimizeSvg(svg, `${c.id}-`);
    for (const p of opt.problems) emit(at(file, `règle 8 : ${p.message}`, 'svg'));
    const size = gz(opt.svg);
    if (size > BUDGETS.illustration)
      emit(
        at(file, `règle 9 : illustration ${kb(size)} gzip > ${kb(BUDGETS.illustration)}`, 'budget'),
      );
  }

  // Sans compilation FR valide, la structure de référence manque : on s'arrête à la parité.
  if (!cc.prep || !cc.full) return;
  const lprep = prepareCase(loc.case, loc.fallback);
  for (const { file, overlap } of lprep.overlaps) {
    emit(
      at(
        unitOfFile(file, c.dir, dir),
        `règle 5 : chevauchement de liens « ${overlap.text} » : « ${overlap.kept} » / « ${overlap.dropped} »`,
        'links',
      ),
    );
  }

  // Descriptions des marques dans la langue (gabarit, longueur, doublons).
  // Seules les descriptions traduites (une description manquante relève de la parité).
  const translatedAlts = loc.case.family.portraits.filter(
    (p) => t?.json.family?.portraits[p.id]?.alt !== undefined,
  );
  for (const m of markAltIssues(translatedAlts, locale, 'family.json'))
    emit(at('family.json', m.message, 'marks'), m.severity === 'warning');

  // 12.3 : mots-clés liés (après liens automatiques) et figures identiques au FR ; balisage.
  const brokenMarks = new Set<string>();
  for (const id of loc.translatedDocuments) {
    const fr = cc.prep.documents.get(id);
    const tr = lprep.documents.get(id);
    if (!fr || !tr) continue;
    const unit = `documents/${id}.md`;
    const links = setDiff(sortedSet(fr.keywords), sortedSet(tr.keywords));
    if (links) emit(at(unit, `mots-clés liés différents du FR : ${links}`, 'links'));
    const ff = figureAssets(fr.body);
    const tf = figureAssets(tr.body);
    if (ff.join('|') !== tf.join('|'))
      emit(
        at(
          unit,
          `figures différentes du FR (même ordre exigé) : ${ff.join(', ') || '—'} / ${tf.join(', ') || '—'}`,
          'figures',
        ),
      );
    const fm = collectMarks(fr.body);
    const tm = collectMarks(tr.body);
    if (fm.join('|') !== tm.join('|')) {
      brokenMarks.add(id);
      emit(
        at(
          unit,
          `marques différentes du FR (mêmes ids, même ordre exigés) : ${fm.join(', ') || '—'} / ${tm.join(', ') || '—'}`,
          'marks',
        ),
      );
    }
    const a = markupCounts(fr.body);
    const b = markupCounts(tr.body);
    if (a.redacted !== b.redacted)
      emit(at(unit, `${b.redacted} ::redacted pour ${a.redacted} en FR`, 'markup'), true);
    if (a.stamp !== b.stamp)
      emit(at(unit, `${b.stamp} ::stamp pour ${a.stamp} en FR`, 'markup'), true);
    const same = untranslatedParagraphs(
      c.documents.get(id)!.body,
      loc.case.documents.get(id)!.body,
    );
    if (same.length)
      emit(
        at(
          unit,
          `paragraphe identique au FR (oubli ?) : « ${same[0]!.slice(0, 60)} »`,
          'untranslated',
        ),
        true,
      );
  }
  // 12.4 : fins, mêmes étiquettes de section dans le même ordre.
  const brokenSections = new Set<string>();
  for (const id of loc.translatedEndings) {
    const fr = c.endings.get(id);
    const tr = loc.case.endings.get(id);
    if (!fr || !tr) continue;
    const unit = `endings/${id}.md`;
    const a = splitSections(fr.body);
    const b = splitSections(tr.body);
    for (const m of b.errors) emit(at(unit, m, 'sections'));
    const la = a.sections.map((x) => x.label ?? '(début)');
    const lb = b.sections.map((x) => x.label ?? '(début)');
    if (la.join('|') !== lb.join('|')) {
      brokenSections.add(id);
      emit(at(unit, `sections ${lb.join(', ')} ; attendu (FR) ${la.join(', ')}`, 'sections'));
    }
    const same = untranslatedParagraphs(fr.body, tr.body);
    if (same.length)
      emit(
        at(
          unit,
          `paragraphe identique au FR (oubli ?) : « ${same[0]!.slice(0, 60)} »`,
          'untranslated',
        ),
        true,
      );
  }

  // Compilation ; en `ready`, règles rejouées (12.7).
  const lc: LocaleCheck = { locale, level, prep: lprep };
  cc.locales[locale] = lc;
  if (level === 'ready') {
    const replay = new IssueList();
    verifyCase(loc.case, lprep, lworld, replay, lc, cache, locale, false);
    for (const i of replay.items) {
      issues.report(
        i.severity === 'warning' ? 'warning' : 'error',
        12,
        i.file,
        `règle ${i.rule} (${RULE_TITLES[i.rule as RuleId]}) : ${i.message}`,
        {
          line: i.line,
          locale,
          caseId: c.id,
          unit: unitOfFile(i.file, c.dir, dir),
          code: 'replay',
        },
      );
    }
  } else {
    lc.full = compileCase(lprep, lworld, 'full', cache, locale);
    if (c.progression.demo && cc.demo) lc.demo = compileCase(lprep, lworld, 'demo', cache, locale);
  }

  // 12.6 : projection structurelle identique au FR, par édition.
  const seen = new Set<string>();
  for (const edition of ['full', 'demo'] as const) {
    const a = cc[edition]?.compiled;
    const b = lc[edition]?.compiled;
    if (!a || !b) continue;
    for (const d of diffProjection(structuralProjection(a), structuralProjection(b))) {
      const m = /^documents\.([^.]+)\.(keywords|figures)$/.exec(d.path);
      if (m && loc.translatedDocuments.has(m[1]!)) continue; // déjà signalé (12.3)
      const mk = /^documents\.([^.]+)\.(marks|reveals)/.exec(d.path);
      if (mk && brokenMarks.has(mk[1]!)) continue; // déjà signalé (12.3, marques)
      const e = /^endings\.([^.]+)\.sections/.exec(d.path);
      if (e && brokenSections.has(e[1]!)) continue; // déjà signalé (12.4)
      if (seen.has(d.path)) continue;
      seen.add(d.path);
      const unit = unitOfPath(d.path);
      emit(
        at(
          unit === WORLD_UNIT ? CASE_UNIT : unit,
          `structure différente du FR (${edition}) en ${d.path} : ${d.message}`,
          'structure',
        ),
      );
    }
  }
}

/** Règle 12 pour le monde d'une langue : parité, surcharge de `labels` (12.8). */
function checkWorldLocale(
  w: SourceWorld,
  frWorld: CompiledWorld,
  lw: SourceWorld,
  wt: WorldTranslationSource | undefined,
  locale: Locale,
  level: LocaleLevel,
  issues: IssueList,
): CompiledWorld {
  const emit = localeEmitter(issues, locale, level, undefined);
  const file = wt?.file ?? `content/world/locales/${locale}.json`;
  const t: WorldTranslationSource = wt ?? { locale, file, invalid: false, problems: [] };
  for (const p of t.problems) emit(p);
  for (const p of worldParityProblems(w, t)) emit(p);
  const out: CompiledWorld = {
    map: lw.map ?? null,
    places: Object.fromEntries(lw.places),
    layers: { ...frWorld.layers },
  };
  if (t.labels === undefined) return out;
  const labelsFile = `art/map/locales/${locale}/labels.svg`;
  const at = (message: string, code: string, line?: number): TranslationProblem => ({
    unit: WORLD_LABELS_UNIT,
    file: labelsFile,
    message,
    code,
    ...(line ? { line } : {}),
  });
  const base = w.layers.get('labels');
  if (!w.map || base === undefined || !w.map.layers.includes('labels')) {
    emit(at('surcharge sans couche labels de base', 'extra'));
    return out;
  }
  const viewBox = `0 0 ${1000 * w.map.aspect} 1000`;
  for (const p of checkSvg(t.labels, { idPrefix: 'labels', viewBox }))
    emit(at(`règle 8 : ${p.message}`, 'svg', p.line));
  for (const m of svgShapeProblems(base, t.labels)) emit(at(m, 'svg'));
  const opt = optimizeSvg(t.labels, '');
  for (const p of opt.problems) emit(at(`règle 8 : ${p.message}`, 'svg'));
  out.layers.labels = opt.svg;
  let total = 0;
  let nodes = 0;
  for (const svg of Object.values(out.layers)) {
    total += gz(svg);
    nodes += countElements(svg);
  }
  if (total > BUDGETS.layersTotal)
    emit(at(`règle 9 : couches ${kb(total)} gzip > ${kb(BUDGETS.layersTotal)}`, 'budget'));
  if (nodes > BUDGETS.mapNodes)
    emit(at(`règle 9 : DOM de la carte : ${nodes} nœuds > ${BUDGETS.mapNodes}`, 'budget'));
  return out;
}
