/**
 * Lecture du contenu source (ARCHITECTURE §3.6) : JSON et frontmatter validés par zod
 * (règle 1), Markdown analysé (règle 7). Aucune écriture.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import {
  AchievementsFileSchema,
  CaseMetaSchema,
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
  type Block,
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
import { rawContainsNot } from './conditions';
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
  /** Empreinte des sources (base du sel). */
  sourceDigest: string;
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
}

export interface ContentSource {
  /** Racine absolue (contient `content/` et éventuellement `art/`). */
  root: string;
  /** Aucun fichier de contenu trouvé. */
  empty: boolean;
  world: SourceWorld;
  cases: SourceCase[];
  filesRead: number;
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
const CASE_DIRS = new Set(['documents', 'endings', 'portraits', 'illustrations']);

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
  const world: SourceWorld = { places: new Map(), layers: new Map() };
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
      if (kind !== 'progression' && kind !== 'achievements' && rawContainsNot(j.data)) {
        issues.error(4, rel(path), '`not` interdit hors des fins et des succès');
      }
      if (kind === 'progression' && j.data && typeof j.data === 'object') {
        const { endings: _e, ...rest } = j.data as Record<string, unknown>;
        if (rawContainsNot(rest)) {
          issues.error(4, rel(path), '`not` interdit hors des fins et des succès');
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
    cases.push(c);
  }

  const empty = filesRead === 0;
  return { root, empty, world, cases, filesRead };
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
