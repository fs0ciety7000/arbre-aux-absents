/**
 * Plugin Vite : contenu compilé chargé en morceaux (perf du premier affichage).
 *
 * `content:build` écrit dans `src/generated/` un module de chargement (`cases.ts`) qui importe
 * à la demande, par langue et par édition
 * (ARCHITECTURE §3.3) : `catalog.<éd>.<loc>.json`, `case.<éd>.<loc>.<id>.json`,
 * `assets.<éd>.json` (illustrations communes) et `assets.<éd>.<loc>.json` (surcharges de la
 * langue). Ce plugin intercepte ces imports, et seulement ceux du module de chargement :
 * - `case.<éd>.<loc>.<id>.json` : le SVG des portraits est retiré (`svg: ''`) ; chaque affaire
 *   reste un chunk, chargé en commençant une partie ou en changeant de langue ;
 * - `assets.<éd>.json` : remplacé par un index `affaire → clé → SVG paresseux`, chaque
 *   illustration (clé `illustrations/<nom>.svg`) et chaque portrait (clé `portrait:<id>`, lu
 *   dans les affaires de la langue source) devenant un petit module importé à la demande ;
 * - `assets.<éd>.<loc>.json` : même index pour les surcharges de la langue, plus les portraits
 *   dont le SVG diffère de celui de la langue source.
 * Une valeur de l'index est un *thenable* paresseux : le `assetLoader` généré la rend depuis
 * une fonction `async`, donc elle est attendue et le chargeur rend bien la chaîne SVG, sans
 * changer le module généré. Deux SVG identiques (même portrait dans deux langues) partagent un
 * seul module. Les catalogues (`catalog.*.json`) et le monde restent des imports JSON ordinaires
 * (un chunk chacun).
 * Les fichiers lus sont ceux de l'édition que le module importe : le build démo ne contient que
 * l'édition démo (canaris de la règle 10 inchangés).
 * Sans ce plugin (autres outils, tests), le module généré reste valide : les portraits sont en
 * ligne dans l'affaire et `src/panels/lib/assets.svelte.ts` les y lit.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

const LOADER_MODULE = /[\\/]cases\.ts$/;
const CASE_IMPORT = /^\.\/case\.(full|demo)\.([a-z]{2,3})\.([a-z0-9-]+)\.json$/;
const ASSETS_IMPORT = /^\.\/assets\.(full|demo)(?:\.([a-z]{2,3}))?\.json$/;
const INDEX_PREFIX = '\0arbre-content:';
const ASSET_PUBLIC = 'virtual:arbre-asset/';
const ASSET_PREFIX = '\0' + ASSET_PUBLIC;
const ID_SUFFIX = '.lazy.js';
/** Langue source du contenu (`content/locales.json`, `DEFAULT_LOCALE` du contrat). */
const SOURCE_LOCALE = 'fr';

/** Préfixe des clés de portraits dans l'index des assets. */
export const PORTRAIT_KEY = 'portrait:';

interface CompiledCaseLike {
  id: string;
  portraits: Record<string, { svg: string }>;
}
type Assets = Record<string, Record<string, string>>;

interface AssetRef {
  /** Fichier où relire le SVG. */
  file: string;
  caseId: string;
  /** `illustrations/<nom>.svg` (assets) ou `portrait:<id>` (affaire). */
  key: string;
}

/** Fichiers `case.<éd>.<loc>.<id>.json` d'un dossier généré, par id d'affaire. */
export function caseFiles(dir: string, edition: string, locale: string): Map<string, string> {
  const out = new Map<string, string>();
  const prefix = `case.${edition}.${locale}.`;
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names.sort()) {
    if (!name.startsWith(prefix) || !name.endsWith('.json')) continue;
    out.set(name.slice(prefix.length, -'.json'.length), join(dir, name));
  }
  return out;
}

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

  /** Module d'un SVG : id stable tiré de son contenu (deux SVG identiques, un module). */
  const register = (ref: AssetRef, svg: string): string => {
    const hash = createHash('sha256').update(svg).digest('hex').slice(0, 10);
    const slug =
      (ref.key.startsWith(PORTRAIT_KEY) ? 'portrait-' : 'illustration-') +
      basename(ref.key.replace(PORTRAIT_KEY, ''), '.svg').replace(/[^a-z0-9-]/gi, '-');
    const id = `${slug}-${hash}`;
    refs.set(id, ref);
    return id;
  };

  const portraitsOf = (file: string): Record<string, { svg: string }> =>
    (readJson(file) as CompiledCaseLike).portraits ?? {};

  return {
    name: 'arbre-lazy-content',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source.startsWith(ASSET_PUBLIC)) return '\0' + source;
      if (!importer) return null;
      const from = importer.split('?')[0]!;
      if (!LOADER_MODULE.test(from)) return null;
      const kind = CASE_IMPORT.test(source) ? 'case' : ASSETS_IMPORT.test(source) ? 'assets' : null;
      if (!kind) return null;
      // Suffixe `.js` : l'id ne doit pas finir par `.json` (plugin JSON intégré).
      return `${INDEX_PREFIX}${kind}:${resolve(dirname(from), source)}${ID_SUFFIX}`;
    },

    load(id) {
      if (id.startsWith(ASSET_PREFIX)) {
        const ref = refs.get(id.slice(ASSET_PREFIX.length));
        if (!ref) throw new Error(`[arbre-lazy-content] asset inconnu : ${id}`);
        const svg = ref.key.startsWith(PORTRAIT_KEY)
          ? portraitsOf(ref.file)[ref.key.slice(PORTRAIT_KEY.length)]?.svg
          : (readJson(ref.file) as Assets)[ref.caseId]?.[ref.key];
        if (typeof svg !== 'string') throw new Error(`[arbre-lazy-content] SVG absent : ${id}`);
        return `export default ${JSON.stringify(svg)};\n`;
      }
      if (!id.startsWith(INDEX_PREFIX)) return null;
      const rest = id.slice(INDEX_PREFIX.length);
      const sep = rest.indexOf(':');
      const kind = rest.slice(0, sep);
      const file = rest.slice(sep + 1, -ID_SUFFIX.length);
      this.addWatchFile(file);

      if (kind === 'case') {
        const c = readJson(file) as CompiledCaseLike;
        const portraits = Object.fromEntries(
          Object.entries(c.portraits ?? {}).map(([pid, p]) => [pid, { ...p, svg: '' }]),
        );
        return exportJson({ ...c, portraits });
      }

      // Index des assets : illustrations du fichier, portraits des affaires de la langue.
      const m = /^assets\.(full|demo)(?:\.([a-z]{2,3}))?\.json$/.exec(basename(file));
      if (!m) throw new Error(`[arbre-lazy-content] index inattendu : ${file}`);
      const edition = m[1]!;
      const locale = m[2];
      const dir = dirname(file);
      const assets = readJson(file) as Assets;
      const byCase = new Map<string, string[]>();
      const add = (ref: AssetRef, svg: string) => {
        const aid = register(ref, svg);
        const list = byCase.get(ref.caseId) ?? [];
        list.push(
          `${JSON.stringify(ref.key)}: lazy(() => import(${JSON.stringify(ASSET_PUBLIC + aid)}))`,
        );
        byCase.set(ref.caseId, list);
      };
      for (const [caseId, entries] of Object.entries(assets)) {
        for (const [key, svg] of Object.entries(entries)) add({ file, caseId, key }, svg);
      }
      const source = caseFiles(dir, edition, SOURCE_LOCALE);
      const own = locale === undefined ? source : caseFiles(dir, edition, locale);
      for (const [caseId, caseFile] of own) {
        this.addWatchFile(caseFile);
        const base = locale !== undefined && source.get(caseId);
        const baseSvgs = base ? portraitsOf(base) : {};
        for (const [pid, p] of Object.entries(portraitsOf(caseFile))) {
          if (!p.svg) continue;
          if (locale !== undefined && baseSvgs[pid]?.svg === p.svg) continue;
          add({ file: caseFile, caseId, key: PORTRAIT_KEY + pid }, p.svg);
        }
      }
      const lines = [...byCase].map(
        ([caseId, entries]) =>
          `  ${JSON.stringify(caseId)}: {\n    ${entries.join(',\n    ')}\n  }`,
      );
      return (
        '// SVG paresseux : attendu (await) par le chargeur généré, importé à ce moment-là.\n' +
        'const lazy = (load) => ({ then: (ok, ko) => load().then((m) => m.default).then(ok, ko) });\n' +
        `export default {\n${lines.join(',\n')}\n};\n`
      );
    },
  };
}
