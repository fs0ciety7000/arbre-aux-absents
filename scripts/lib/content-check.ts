/**
 * Contrôle PROVISOIRE du contenu (lot 0) : schémas zod et règle « id = nom de fichier ».
 * Les règles complètes d'ARCHITECTURE §3.7 (références, solveur, SVG…) arrivent avec
 * `packages/content-tools` (backend).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { CONTENT_FILE_SCHEMAS, KEBAB_CASE, type ContentFileKind } from '@arbre/contract';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';

export interface Issue {
  file: string;
  message: string;
}

export interface CheckReport {
  issues: Issue[];
  filesChecked: number;
  cases: string[];
}

const CASE_JSON_FILES = ['case', 'family', 'tree', 'progression', 'hints', 'achievements'] as const;
/** Fichiers obligatoires d'une affaire. */
const REQUIRED_CASE_FILES: readonly string[] = ['case', 'family', 'tree', 'progression'];

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function listDir(path: string): Promise<string[]> {
  try {
    return (await readdir(path)).sort();
  } catch {
    return [];
  }
}

/** Sépare le frontmatter YAML (`---` … `---`) du corps Markdown. */
export function splitFrontmatter(source: string): { frontmatter: string; body: string } | null {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  if (!match) return null;
  return { frontmatter: match[1] ?? '', body: text.slice(match[0].length) };
}

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path.length ? i.path.join('.') : '(racine)';
    return `${path} : ${i.message}`;
  });
}

export async function checkContent(root: string): Promise<CheckReport> {
  const issues: Issue[] = [];
  let filesChecked = 0;
  const rel = (p: string) => relative(root, p) || p;

  async function checkData(
    path: string,
    kind: ContentFileKind,
    data: unknown,
    expectedId?: string,
  ): Promise<void> {
    filesChecked++;
    const result = CONTENT_FILE_SCHEMAS[kind].safeParse(data);
    if (!result.success) {
      for (const message of formatZodIssues(result.error))
        issues.push({ file: rel(path), message });
      return;
    }
    if (expectedId !== undefined) {
      const id = (result.data as { id?: unknown }).id;
      if (id !== expectedId) {
        issues.push({
          file: rel(path),
          message: `id « ${String(id)} » différent du nom attendu « ${expectedId} »`,
        });
      }
    }
  }

  async function checkJson(path: string, kind: ContentFileKind, expectedId?: string) {
    let data: unknown;
    try {
      data = JSON.parse(await readFile(path, 'utf8'));
    } catch (e) {
      filesChecked++;
      issues.push({ file: rel(path), message: `JSON invalide : ${(e as Error).message}` });
      return;
    }
    await checkData(path, kind, data, expectedId);
  }

  function checkFileName(path: string, stem: string): boolean {
    if (KEBAB_CASE.test(stem)) return true;
    issues.push({ file: rel(path), message: `nom de fichier non kebab-case : « ${stem} »` });
    return false;
  }

  // Monde
  const world = join(root, 'world');
  const mapFile = join(world, 'map.json');
  if (await exists(mapFile)) await checkJson(mapFile, 'map');
  for (const name of await listDir(join(world, 'places'))) {
    const path = join(world, 'places', name);
    if (!name.endsWith('.json')) continue;
    const stem = basename(name, '.json');
    if (checkFileName(path, stem)) await checkJson(path, 'place', stem);
  }

  // Affaires
  const casesDir = join(root, 'cases');
  const cases: string[] = [];
  for (const caseId of await listDir(casesDir)) {
    const dir = join(casesDir, caseId);
    if (!(await stat(dir)).isDirectory()) continue;
    if (!checkFileName(dir, caseId)) continue;
    cases.push(caseId);
    for (const kind of CASE_JSON_FILES) {
      const path = join(dir, `${kind}.json`);
      if (await exists(path)) {
        await checkJson(path, kind, kind === 'case' ? caseId : undefined);
      } else if (REQUIRED_CASE_FILES.includes(kind)) {
        issues.push({ file: rel(path), message: 'fichier obligatoire manquant' });
      }
    }
    for (const sub of ['documents', 'endings'] as const) {
      for (const name of await listDir(join(dir, sub))) {
        if (!name.endsWith('.md')) continue;
        const path = join(dir, sub, name);
        if (!checkFileName(path, basename(name, '.md'))) continue;
        if (sub === 'endings') {
          filesChecked++;
          continue;
        }
        const split = splitFrontmatter(await readFile(path, 'utf8'));
        if (!split) {
          filesChecked++;
          issues.push({ file: rel(path), message: 'frontmatter YAML manquant (--- … ---)' });
          continue;
        }
        let data: unknown;
        try {
          data = parseYaml(split.frontmatter);
        } catch (e) {
          filesChecked++;
          issues.push({ file: rel(path), message: `YAML invalide : ${(e as Error).message}` });
          continue;
        }
        await checkData(path, 'document', data);
      }
    }
  }

  return { issues, filesChecked, cases };
}
