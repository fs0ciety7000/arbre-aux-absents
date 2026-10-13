/**
 * Plugin Vite : contenu compilé chargé en morceaux (perf du premier affichage).
 *
 * `content:build` écrit dans `src/generated/` un module `cases.ts` qui importe
 * `./cases.<édition>.json` et `./assets.<édition>.json` (format inchangé, voir
 * packages/content-tools/src/build.ts). Ce plugin intercepte ces deux imports, et seulement
 * ceux de `cases.ts` :
 * - `cases.<édition>.json` : le SVG des portraits est retiré (`svg: ''`) de l'affaire compilée ;
 * - `assets.<édition>.json` : remplacé par un index `affaire → clé → () => Promise<string>`,
 *   chaque illustration (clé `illustrations/<nom>.svg`) et chaque portrait (clé
 *   `portrait:<id>`) devenant un petit module importé à la demande (un fichier JS chacun).
 * Les deux fichiers lus sont ceux de l'édition que `cases.ts` importe : le build démo ne
 * contient donc que l'édition démo (canaris de la règle 10 inchangés).
 * Sans ce plugin (autres outils), `cases.ts` reste valide : `src/lib/game/content.ts` accepte
 * aussi les SVG en ligne.
 */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';

const CASES_MODULE = /[\\/]cases\.ts$/;
const DATA_IMPORT = /^\.\/(cases|assets)\.(full|demo)\.json$/;
const INDEX_PREFIX = '\0arbre-content:';
const ASSET_PUBLIC = 'virtual:arbre-asset/';
const ASSET_PREFIX = '\0' + ASSET_PUBLIC;
const ID_SUFFIX = '.lazy.js';

interface CompiledPortrait {
  svg: string;
}
interface CompiledCaseLike {
  id: string;
  portraits: Record<string, CompiledPortrait>;
}
interface AssetRef {
  file: string;
  caseId: string;
  /** `illustrations/<nom>.svg` (assets) ou `portrait:<id>` (affaire). */
  key: string;
}

/** Préfixe des clés de portraits dans l'index des assets. */
export const PORTRAIT_KEY = 'portrait:';

export function lazyContent(): Plugin {
  const refs = new Map<string, AssetRef>();
  const cache = new Map<string, { mtime: number; data: unknown }>();

  const readJson = (file: string): unknown => {
    const mtime = statSync(file).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.mtime === mtime) return hit.data;
    const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
    cache.set(file, { mtime, data });
    return data;
  };

  /** `export default` d'une grande valeur JSON (JSON.parse, plus rapide qu'un littéral). */
  const exportJson = (value: unknown) =>
    `export default JSON.parse(${JSON.stringify(JSON.stringify(value))});\n`;

  const register = (ref: AssetRef): string => {
    const hash = createHash('sha256')
      .update(`${ref.file}|${ref.caseId}|${ref.key}`)
      .digest('hex')
      .slice(0, 10);
    const slug =
      (ref.key.startsWith(PORTRAIT_KEY) ? 'portrait-' : 'illustration-') +
      basename(ref.key.replace(PORTRAIT_KEY, ''), '.svg').replace(/[^a-z0-9-]/gi, '-');
    const id = `${slug}-${hash}`;
    refs.set(id, ref);
    return id;
  };

  return {
    name: 'arbre-lazy-content',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source.startsWith(ASSET_PUBLIC)) return '\0' + source;
      if (!importer) return null;
      const from = importer.split('?')[0]!;
      const m = DATA_IMPORT.exec(source);
      if (!m || !CASES_MODULE.test(from)) return null;
      // Suffixe `.js` : l'id ne doit pas finir par `.json` (plugin JSON intégré).
      return `${INDEX_PREFIX}${m[1]}:${resolve(dirname(from), source)}${ID_SUFFIX}`;
    },

    load(id) {
      if (id.startsWith(ASSET_PREFIX)) {
        const ref = refs.get(id.slice(ASSET_PREFIX.length));
        if (!ref) throw new Error(`[arbre-lazy-content] asset inconnu : ${id}`);
        let svg: string | undefined;
        if (ref.key.startsWith(PORTRAIT_KEY)) {
          const cases = readJson(ref.file) as CompiledCaseLike[];
          svg = cases.find((c) => c.id === ref.caseId)?.portraits[
            ref.key.slice(PORTRAIT_KEY.length)
          ]?.svg;
        } else {
          const assets = readJson(ref.file) as Record<string, Record<string, string>>;
          svg = assets[ref.caseId]?.[ref.key];
        }
        if (typeof svg !== 'string') throw new Error(`[arbre-lazy-content] SVG absent : ${id}`);
        return `export default ${JSON.stringify(svg)};\n`;
      }
      if (!id.startsWith(INDEX_PREFIX)) return null;
      const rest = id.slice(INDEX_PREFIX.length);
      const sep = rest.indexOf(':');
      const kind = rest.slice(0, sep);
      const file = rest.slice(sep + 1, -ID_SUFFIX.length);
      this.addWatchFile(file);

      if (kind === 'cases') {
        const cases = readJson(file) as CompiledCaseLike[];
        const stripped = cases.map((c) => ({
          ...c,
          portraits: Object.fromEntries(
            Object.entries(c.portraits).map(([pid, p]) => [pid, { ...p, svg: '' }]),
          ),
        }));
        return exportJson(stripped);
      }

      // Index des assets : illustrations de `assets.<éd>.json`, portraits de `cases.<éd>.json`.
      const casesFile = resolve(dirname(file), basename(file).replace(/^assets\./, 'cases.'));
      this.addWatchFile(casesFile);
      const assets = readJson(file) as Record<string, Record<string, string>>;
      const cases = readJson(casesFile) as CompiledCaseLike[];
      const lines: string[] = [];
      const caseIds = new Set([...Object.keys(assets), ...cases.map((c) => c.id)]);
      for (const caseId of caseIds) {
        const entries: string[] = [];
        for (const key of Object.keys(assets[caseId] ?? {})) {
          const aid = register({ file, caseId, key });
          entries.push(
            `${JSON.stringify(key)}: () => import(${JSON.stringify(ASSET_PUBLIC + aid)}).then((m) => m.default)`,
          );
        }
        const c = cases.find((x) => x.id === caseId);
        for (const pid of Object.keys(c?.portraits ?? {})) {
          const key = PORTRAIT_KEY + pid;
          const aid = register({ file: casesFile, caseId, key });
          entries.push(
            `${JSON.stringify(key)}: () => import(${JSON.stringify(ASSET_PUBLIC + aid)}).then((m) => m.default)`,
          );
        }
        lines.push(`  ${JSON.stringify(caseId)}: {\n    ${entries.join(',\n    ')}\n  }`);
      }
      return `export default {\n${lines.join(',\n')}\n};\n`;
    },
  };
}
