/**
 * Lecture du contenu source (ARCHITECTURE §3.6) : JSON et frontmatter validés par zod
 * (règle 1), Markdown analysé (règle 7). Aucune écriture.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import {
  AchievementsFileSchema,
  AchievementsTranslationSchema,
  CaseMetaSchema,
  CaseMetaTranslationSchema,
  DocumentFrontmatterTranslationSchema,
  EndingFrontmatterTranslationSchema,
  FamilyTranslationSchema,
  HintsTranslationSchema,
  LOCALES,
  LocalesConfigSchema,
  ProgressionTranslationSchema,
  TreeTranslationSchema,
  WorldTranslationSchema,
  DocumentFrontmatterSchema,
  FamilySchema,
  HintsFileSchema,
  KEBAB_CASE,
  MAP_LAYERS,
  PlaceSchema,
  ProgressionSchema,
  TextSchema,
  TreeSpecSchema,
  WorldMapSchema,
  type Achievement,
  type AchievementsTranslation,
  type Block,
  type CaseMetaTranslation,
  type DocumentFrontmatterTranslation,
  type FamilyTranslation,
  type HintsTranslation,
  type Locale,
  type LocalesConfig,
  type ProgressionTranslation,
  type TreeTranslation,
  type WorldTranslation,
  type CaseMeta,
  type DocumentFrontmatter,
  type Family,
  type Hint,
  type MapLayer,
  type Place,
  type Progression,
  type TreeSpec,
  type WorldMap,
} from '@arbre/contract';
import { parse as parseYaml, YAMLParseError } from 'yaml';
import { z } from 'zod';
import { rawContainsKey } from './conditions';
import type { IssueList } from './issues';
import { parseMarkdown, splitFrontmatter } from './markdown';

/** Frontmatter d'une fin (`endings/<id>.md`) : non couvert par le contrat, voir rapport. */
export const EndingFrontmatterSchema = z.strictObject({ title: TextSchema });

export interface SourceDocument {
  id: string;
  file: string;
  frontmatter: DocumentFrontmatter;
  body: Block[];
}

export interface SourceEnding {
  id: string;
  file: string;
  title: string;
  body: Block[];
}

/** Problème d'un fichier de traduction, émis par `check` avec la sévérité de la langue. */
export interface TranslationProblem {
  /** Unité (voir `Issue.unit`). */
  unit: string;
  file: string;
  message: string;
  line?: number;
  code: string;
}

export interface TranslatedDocument {
  id: string;
  file: string;
  frontmatter: DocumentFrontmatterTranslation;
  body: Block[];
}

export interface TranslatedEnding {
  id: string;
  file: string;
  title: string;
  body: Block[];
}

/** Fichiers JSON d'un calque de traduction (`locales/<loc>/<nom>.json`). */
export interface CaseTranslationJson {
  case?: CaseMetaTranslation;
  family?: FamilyTranslation;
  tree?: TreeTranslation;
  progression?: ProgressionTranslation;
  hints?: HintsTranslation;
  achievements?: AchievementsTranslation;
}

/** Calque de traduction d'une affaire (`content/cases/<id>/locales/<loc>/`). */
export interface CaseTranslation {
  locale: Locale;
  /** Répertoire relatif à la racine. */
  dir: string;
  json: CaseTranslationJson;
  /** Unités présentes mais invalides (JSON, schéma, frontmatter) : pas « manquantes ». */
  invalid: Set<string>;
  documents: Map<string, TranslatedDocument>;
  endings: Map<string, TranslatedEnding>;
  /** `illustrations/<nom>.svg` → source de la surcharge. */
  illustrations: Map<string, string>;
  problems: TranslationProblem[];
}

/** Traduction du monde (`content/world/locales/<loc>.json`, `art/map/locales/<loc>/labels.svg`). */
export interface WorldTranslationSource {
  locale: Locale;
  file: string;
  data?: WorldTranslation;
  /** Fichier présent mais invalide. */
  invalid: boolean;
  /** Surcharge de la couche `labels`. */
  labels?: string;
  problems: TranslationProblem[];
}

export interface SourceCase {
  id: string;
  /** Répertoire relatif à la racine (pour les messages). */
  dir: string;
  meta?: CaseMeta;
  family?: Family;
  tree?: TreeSpec;
  progression?: Progression;
  hints: Hint[];
  achievements: Achievement[];
  documents: Map<string, SourceDocument>;
  endings: Map<string, SourceEnding>;
  /** `portraits/<id>.svg` → source. */
  portraits: Map<string, string>;
  /** `illustrations/<nom>.svg` → source. */
  illustrations: Map<string, string>;
  /** Empreinte des sources FR hors `locales/` (base du sel, identique entre langues). */
  sourceDigest: string;
  /** Calques de traduction, par langue cible déclarée dans `content/locales.json`. */
  translations: Map<Locale, CaseTranslation>;
  /**
   * Fichiers obligatoires absents : l'affaire est un brouillon en cours d'écriture (avertissement,
   * fichiers présents contrôlés, ni compilation ni solveur).
   */
  missing: string[];
}

export interface SourceWorld {
  map?: WorldMap;
  places: Map<string, Place>;
  /** Couches `art/map/<couche>.svg` présentes. */
  layers: Map<MapLayer, string>;
  /** Traductions du monde, par langue cible. */
  translations: Map<Locale, WorldTranslationSource>;
}

export interface ContentSource {
  /** Racine absolue (contient `content/` et éventuellement `art/`). */
  root: string;
  /** Aucun fichier de contenu trouvé. */
  empty: boolean;
  world: SourceWorld;
  cases: SourceCase[];
  filesRead: number;
  /** `content/locales.json` ; null s'il est absent (français seul) ou invalide. */
  locales: LocalesConfig | null;
}

/** Langue source (`default`) d'une configuration, `fr` sans configuration. */
export function sourceLocale(config: LocalesConfig | null): Locale {
  return config?.default ?? 'fr';
}

/** Langues cibles (statut `draft` ou `ready`), dans l'ordre de `LOCALES`. */
export function targetLocales(config: LocalesConfig | null): Locale[] {
  if (!config) return [];
  return LOCALES.filter((l) => config.locales[l].status !== 'source');
}

/** Vrai si toutes les pièces nécessaires à la compilation sont valides. */
export function isComplete(
  c: SourceCase,
): c is SourceCase & Required<Pick<SourceCase, 'meta' | 'family' | 'tree' | 'progression'>> {
  return !!(c.meta && c.family && c.tree && c.progression);
}

async function listDir(path: string): Promise<string[]> {
  try {
    return (await readdir(path)).sort();
  } catch {
    return [];
  }
}

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

function zodMessages(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.length ? i.path.join('.') : '(racine)'} : ${i.message}`);
}

const CASE_FILES = ['case', 'family', 'tree', 'progression', 'hints', 'achievements'] as const;
const REQUIRED = new Set(['case', 'family', 'tree', 'progression']);
const CASE_DIRS = new Set(['documents', 'endings', 'portraits', 'illustrations', 'locales']);

export async function loadContent(root: string, issues: IssueList): Promise<ContentSource> {
  const rel = (p: string) => relative(root, p).split('\\').join('/') || '.';
  let filesRead = 0;

  async function readText(path: string): Promise<string | null> {
    try {
      const t = await readFile(path, 'utf8');
      filesRead++;
      return t;
    } catch {
      return null;
    }
  }

  async function readJson(path: string): Promise<{ ok: true; data: unknown } | { ok: false }> {
    const text = await readText(path);
    if (text === null) return { ok: false };
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch (e) {
      issues.error(1, rel(path), `JSON invalide : ${(e as Error).message}`);
      return { ok: false };
    }
  }

  function validate<T>(schema: z.ZodType<T>, data: unknown, path: string): T | undefined {
    const r = schema.safeParse(data);
    if (r.success) return r.data;
    for (const m of zodMessages(r.error)) issues.error(1, rel(path), m);
    return undefined;
  }

  function kebab(path: string, stem: string): boolean {
    if (KEBAB_CASE.test(stem)) return true;
    issues.error(1, rel(path), `nom non kebab-case : « ${stem} »`);
    return false;
  }

  // ---- Monde ----
  const content = join(root, 'content');
  // ---- Langues ----
  let locales: LocalesConfig | null = null;
  const localesFile = join(content, 'locales.json');
  const localesJson = await readJson(localesFile);
  if (localesJson.ok)
    locales = validate(LocalesConfigSchema, localesJson.data, localesFile) ?? null;
  const targets = targetLocales(locales);

  const world: SourceWorld = { places: new Map(), layers: new Map(), translations: new Map() };
  const mapFile = join(content, 'world', 'map.json');
  const mapJson = await readJson(mapFile);
  if (mapJson.ok) world.map = validate(WorldMapSchema, mapJson.data, mapFile);
  for (const name of await listDir(join(content, 'world', 'places'))) {
    const path = join(content, 'world', 'places', name);
    if (!name.endsWith('.json')) {
      issues.warn(1, rel(path), 'fichier inattendu (seuls les .json sont lus)');
      continue;
    }
    const stem = basename(name, '.json');
    if (!kebab(path, stem)) continue;
    const j = await readJson(path);
    if (!j.ok) continue;
    const place = validate(PlaceSchema, j.data, path);
    if (!place) continue;
    if (place.id !== stem) {
      issues.error(1, rel(path), `id « ${place.id} » ≠ nom de fichier « ${stem} »`);
      continue;
    }
    world.places.set(place.id, place);
  }
  for (const layer of MAP_LAYERS) {
    const text = await readText(join(root, 'art', 'map', `${layer}.svg`));
    if (text !== null) world.layers.set(layer, text);
  }
  for (const name of await listDir(join(content, 'world', 'locales'))) {
    const loc = basename(name, '.json') as Locale;
    if (!name.endsWith('.json') || !targets.includes(loc)) {
      issues.warn(
        1,
        rel(join(content, 'world', 'locales', name)),
        'fichier de langue inattendu (langue cible absente de content/locales.json) : ignoré',
      );
    }
  }
  for (const loc of targets) {
    const path = join(content, 'world', 'locales', `${loc}.json`);
    const t: WorldTranslationSource = {
      locale: loc,
      file: rel(path),
      invalid: false,
      problems: [],
    };
    const text = await readText(path);
    if (text !== null) {
      const problem = (message: string, code: string) =>
        t.problems.push({ unit: 'world', file: t.file, message, code });
      try {
        const r = WorldTranslationSchema.safeParse(JSON.parse(text));
        if (r.success) t.data = r.data;
        else {
          t.invalid = true;
          for (const m of zodMessages(r.error)) problem(m, 'schema');
        }
      } catch (e) {
        t.invalid = true;
        problem(`JSON invalide : ${(e as Error).message}`, 'schema');
      }
    }
    const labels = await readText(join(root, 'art', 'map', 'locales', loc, 'labels.svg'));
    if (labels !== null) t.labels = labels;
    world.translations.set(loc, t);
  }

  // ---- Affaires ----
  const cases: SourceCase[] = [];
  const casesDir = join(content, 'cases');
  for (const caseId of await listDir(casesDir)) {
    const dir = join(casesDir, caseId);
    if (!(await isDir(dir))) continue;
    if (!kebab(dir, caseId)) continue;
    const digest: string[] = [];
    const c: SourceCase = {
      id: caseId,
      dir: rel(dir),
      hints: [],
      achievements: [],
      documents: new Map(),
      endings: new Map(),
      portraits: new Map(),
      illustrations: new Map(),
      sourceDigest: '',
      translations: new Map(),
      missing: [],
    };

    for (const entry of await listDir(dir)) {
      const isJson =
        entry.endsWith('.json') && (CASE_FILES as readonly string[]).includes(entry.slice(0, -5));
      if (!isJson && !CASE_DIRS.has(entry)) {
        issues.warn(1, rel(join(dir, entry)), 'fichier ou dossier inattendu (ignoré)');
      }
    }

    for (const kind of CASE_FILES) {
      const path = join(dir, `${kind}.json`);
      const j = await readJson(path);
      if (!j.ok) {
        if (REQUIRED.has(kind) && (await readText(path)) === null) c.missing.push(`${kind}.json`);
        continue;
      }
      digest.push(`${kind}:${JSON.stringify(j.data)}`);
      // Règle 4 : `not` et `answered` réservés aux fins, aux succès, à `askedWhen` (rapport) et
      // aux sections de fin.
      if (kind !== 'achievements') {
        const outside = outcomeFree(kind, j.data);
        for (const key of ['not', 'answered']) {
          if (rawContainsKey(outside, key)) {
            issues.error(
              4,
              rel(path),
              `\`${key}\` interdit hors des fins, des succès, de askedWhen et des sections`,
            );
          }
        }
      }
      switch (kind) {
        case 'case': {
          const meta = validate(CaseMetaSchema, j.data, path);
          if (meta && meta.id !== caseId) {
            issues.error(1, rel(path), `id « ${meta.id} » ≠ nom du dossier « ${caseId} »`);
          } else c.meta = meta;
          break;
        }
        case 'family':
          c.family = validate(FamilySchema, j.data, path);
          break;
        case 'tree':
          c.tree = validate(TreeSpecSchema, j.data, path);
          break;
        case 'progression':
          c.progression = validate(ProgressionSchema, j.data, path);
          break;
        case 'hints':
          c.hints = validate(HintsFileSchema, j.data, path) ?? [];
          break;
        case 'achievements':
          c.achievements = validate(AchievementsFileSchema, j.data, path) ?? [];
          break;
      }
    }

    // Documents
    for (const name of await listDir(join(dir, 'documents'))) {
      const path = join(dir, 'documents', name);
      if (!name.endsWith('.md')) {
        issues.warn(1, rel(path), 'fichier inattendu (seuls les .md sont lus)');
        continue;
      }
      const stem = basename(name, '.md');
      if (!kebab(path, stem)) continue;
      const text = (await readText(path)) ?? '';
      digest.push(`doc:${stem}:${text}`);
      const split = splitFrontmatter(text);
      if (split.frontmatter === null) {
        issues.error(1, rel(path), 'frontmatter YAML manquant (--- … ---)', 1);
        continue;
      }
      const fm = parseFrontmatter(split.frontmatter, rel(path), issues);
      const parsed = parseMarkdown(split.body, split.bodyLine);
      for (const e of parsed.errors) issues.error(7, rel(path), e.message, e.line);
      if (fm === undefined) continue;
      // `date: 1923` est lu comme un nombre par YAML : on l'accepte comme date partielle.
      if (fm && typeof fm === 'object' && typeof (fm as { date?: unknown }).date === 'number') {
        (fm as { date: unknown }).date = String((fm as { date: number }).date);
      }
      const frontmatter = validateAt(DocumentFrontmatterSchema, fm, rel(path), issues);
      if (!frontmatter) continue;
      c.documents.set(stem, { id: stem, file: rel(path), frontmatter, body: parsed.blocks });
    }

    // Fins
    for (const name of await listDir(join(dir, 'endings'))) {
      const path = join(dir, 'endings', name);
      if (!name.endsWith('.md')) {
        issues.warn(1, rel(path), 'fichier inattendu (seuls les .md sont lus)');
        continue;
      }
      const stem = basename(name, '.md');
      if (!kebab(path, stem)) continue;
      const text = (await readText(path)) ?? '';
      digest.push(`end:${stem}:${text}`);
      const split = splitFrontmatter(text);
      if (split.frontmatter === null) {
        issues.error(1, rel(path), 'frontmatter YAML manquant (--- title: … ---)', 1);
        continue;
      }
      const fm = parseFrontmatter(split.frontmatter, rel(path), issues);
      const parsed = parseMarkdown(split.body, split.bodyLine);
      for (const e of parsed.errors) issues.error(7, rel(path), e.message, e.line);
      if (fm === undefined) continue;
      const meta = validateAt(EndingFrontmatterSchema, fm, rel(path), issues);
      if (!meta) continue;
      c.endings.set(stem, { id: stem, file: rel(path), title: meta.title, body: parsed.blocks });
    }

    // SVG
    for (const sub of ['portraits', 'illustrations'] as const) {
      for (const name of await listDir(join(dir, sub))) {
        const path = join(dir, sub, name);
        if (!name.endsWith('.svg')) {
          issues.warn(1, rel(path), 'fichier inattendu (seuls les .svg sont lus)');
          continue;
        }
        if (!kebab(path, basename(name, '.svg'))) continue;
        const text = (await readText(path)) ?? '';
        digest.push(`${sub}:${name}:${text}`);
        (sub === 'portraits' ? c.portraits : c.illustrations).set(`${sub}/${name}`, text);
      }
    }

    c.sourceDigest = digest.sort().join('\n');

    // Calques de traduction (hors empreinte : le sel ne dépend pas de la langue, D4).
    for (const name of await listDir(join(dir, 'locales'))) {
      if (!targets.includes(name as Locale)) {
        issues.warn(
          1,
          rel(join(dir, 'locales', name)),
          'dossier de langue inattendu (langue cible absente de content/locales.json) : ignoré',
        );
      }
    }
    for (const loc of targets) {
      const ldir = join(dir, 'locales', loc);
      if (!(await isDir(ldir))) continue;
      c.translations.set(loc, await loadTranslation(ldir, loc));
    }
    cases.push(c);
  }

  async function loadTranslation(ldir: string, locale: Locale): Promise<CaseTranslation> {
    const t: CaseTranslation = {
      locale,
      dir: rel(ldir),
      json: {},
      invalid: new Set(),
      documents: new Map(),
      endings: new Map(),
      illustrations: new Map(),
      problems: [],
    };
    const problem = (unit: string, message: string, code: string, line?: number) =>
      t.problems.push({ unit, file: `${t.dir}/${unit}`, message, code, ...(line ? { line } : {}) });
    const LAYER_DIRS = new Set(['documents', 'endings', 'illustrations']);
    for (const entry of await listDir(ldir)) {
      const isJson =
        entry.endsWith('.json') && (CASE_FILES as readonly string[]).includes(entry.slice(0, -5));
      if (!isJson && !LAYER_DIRS.has(entry))
        problem(entry, 'fichier ou dossier inattendu', 'extra');
    }
    const schemas = {
      case: CaseMetaTranslationSchema,
      family: FamilyTranslationSchema,
      tree: TreeTranslationSchema,
      progression: ProgressionTranslationSchema,
      hints: HintsTranslationSchema,
      achievements: AchievementsTranslationSchema,
    } as const;
    for (const kind of CASE_FILES) {
      const unit = `${kind}.json`;
      const text = await readText(join(ldir, unit));
      if (text === null) continue;
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch (e) {
        t.invalid.add(unit);
        problem(unit, `JSON invalide : ${(e as Error).message}`, 'schema');
        continue;
      }
      const r = (schemas[kind] as z.ZodType).safeParse(data);
      if (!r.success) {
        t.invalid.add(unit);
        for (const m of zodMessages(r.error)) problem(unit, m, 'schema');
        continue;
      }
      (t.json as Record<string, unknown>)[kind] = r.data;
    }
    for (const sub of ['documents', 'endings'] as const) {
      for (const name of await listDir(join(ldir, sub))) {
        const unit = `${sub}/${name}`;
        if (!name.endsWith('.md')) {
          problem(unit, 'fichier inattendu (seuls les .md sont lus)', 'extra');
          continue;
        }
        const stem = basename(name, '.md');
        const text = (await readText(join(ldir, sub, name))) ?? '';
        const split = splitFrontmatter(text);
        if (split.frontmatter === null) {
          t.invalid.add(unit);
          problem(unit, 'frontmatter YAML manquant (--- title: … ---)', 'schema', 1);
          continue;
        }
        let fm: unknown;
        try {
          fm = parseYaml(split.frontmatter, { uniqueKeys: true, prettyErrors: true });
        } catch (e) {
          const line = e instanceof YAMLParseError ? (e.linePos?.[0]?.line ?? 0) + 1 : undefined;
          t.invalid.add(unit);
          problem(unit, `YAML invalide : ${(e as Error).message.split('\n')[0]}`, 'schema', line);
          continue;
        }
        const parsed = parseMarkdown(split.body, split.bodyLine);
        for (const e of parsed.errors) problem(unit, `Markdown : ${e.message}`, 'markdown', e.line);
        const schema =
          sub === 'documents'
            ? DocumentFrontmatterTranslationSchema
            : EndingFrontmatterTranslationSchema;
        const r = (schema as z.ZodType).safeParse(fm);
        if (!r.success) {
          t.invalid.add(unit);
          for (const m of zodMessages(r.error)) problem(unit, `frontmatter ${m}`, 'schema');
          continue;
        }
        const file = `${t.dir}/${unit}`;
        if (sub === 'documents') {
          t.documents.set(stem, {
            id: stem,
            file,
            frontmatter: r.data as DocumentFrontmatterTranslation,
            body: parsed.blocks,
          });
        } else {
          t.endings.set(stem, {
            id: stem,
            file,
            title: (r.data as { title: string }).title,
            body: parsed.blocks,
          });
        }
      }
    }
    for (const name of await listDir(join(ldir, 'illustrations'))) {
      const unit = `illustrations/${name}`;
      if (!name.endsWith('.svg')) {
        problem(unit, 'fichier inattendu (seuls les .svg sont lus)', 'extra');
        continue;
      }
      t.illustrations.set(unit, (await readText(join(ldir, 'illustrations', name))) ?? '');
    }
    return t;
  }

  const empty = filesRead === 0;
  return { root, empty, world, cases, filesRead, locales };
}

/** Partie d'un fichier JSON où seules les conditions monotones sont admises. */
function outcomeFree(kind: string, data: unknown): unknown {
  if (kind !== 'progression' || !data || typeof data !== 'object') return data;
  const { endings: _e, report, ...rest } = data as Record<string, unknown>;
  const options = Array.isArray(report)
    ? report.map((q) =>
        q && typeof q === 'object' ? (q as { options?: unknown }).options : undefined,
      )
    : report;
  return { ...rest, reportOptions: options };
}

function parseFrontmatter(yaml: string, file: string, issues: IssueList): unknown {
  try {
    return parseYaml(yaml, { uniqueKeys: true, prettyErrors: true });
  } catch (e) {
    const line = e instanceof YAMLParseError ? (e.linePos?.[0]?.line ?? 0) + 1 : undefined;
    issues.error(1, file, `YAML invalide : ${(e as Error).message.split('\n')[0]}`, line);
    return undefined;
  }
}

function validateAt<T>(
  schema: z.ZodType<T>,
  data: unknown,
  file: string,
  issues: IssueList,
): T | undefined {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const m of zodMessages(r.error)) issues.error(1, file, `frontmatter ${m}`);
  return undefined;
}
