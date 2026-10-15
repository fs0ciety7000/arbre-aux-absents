// Serveur e2e du jeu : compile la fixture `mini`, construit le jeu contre elle, puis le sert
// (vite preview). Lancé par Playwright (`webServer`). E2E_SKIP_BUILD=1 réutilise le dernier build.
// Plusieurs affaires : E2E_FIXTURES=mini,claim (fixtures de packages/content-tools/fixtures,
// compilées à part puis réunies, monde de la première) et E2E_BUILD=<nom> (dossiers de contenu et de
// build à part : `<nom>/game`, `<nom>-dist`), sur le port E2E_GAME_PORT.
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const cache = resolve(repo, 'node_modules/.cache/arbre-e2e');
const config = resolve(repo, 'tests/e2e/vite.game.config.ts');
const vite = resolve(repo, 'node_modules/vite/bin/vite.js');
const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { cwd: repo, stdio: 'inherit', env: { ...process.env, ...env } });

const fixtures = (process.env.E2E_FIXTURES ?? 'mini').split(',').filter(Boolean);
const name = process.env.E2E_BUILD ?? (fixtures.length === 1 ? fixtures[0] : fixtures.join('-'));
const single = fixtures.length === 1 && fixtures[0] === 'mini' && !process.env.E2E_BUILD;
// Build historique (`mini` seule) inchangé : `mini/` et `game-dist/`.
const outDir = resolve(cache, single ? 'game-dist' : `${name}-dist`);
const content = resolve(cache, name);
const env = { E2E_GENERATED: resolve(content, 'game'), E2E_OUT_DIR: outDir };

const fixtureRoot = (id) => resolve(repo, 'packages/content-tools/fixtures', id);
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const rank = (c) => [c.meta?.order ?? Number.POSITIVE_INFINITY, c.id];
const byOrder = (a, b) => {
  const [oa, ia] = rank(a);
  const [ob, ib] = rank(b);
  return oa - ob || (ia < ib ? -1 : ia > ib ? 1 : 0);
};

/**
 * Compile chaque fixture à part (les ids de portraits sont uniques par racine de contenu), puis
 * réunit les affaires compilées dans `<content>/game` : affaires triées comme le fait
 * content-tools (`order`, puis id), illustrations par affaire, monde de la première fixture.
 */
function buildContent() {
  if (fixtures.length === 1) {
    run('npm', [
      'run',
      'content:build',
      '--',
      '--root',
      fixtureRoot(fixtures[0]),
      '--out',
      content,
    ]);
    return;
  }
  const parts = fixtures.map((id) => {
    const out = resolve(cache, `${name}-${id}`);
    run('npm', ['run', 'content:build', '--', '--root', fixtureRoot(id), '--out', out]);
    return resolve(out, 'game');
  });
  const game = resolve(content, 'game');
  rmSync(game, { recursive: true, force: true });
  mkdirSync(game, { recursive: true });
  cpSync(parts[0], game, { recursive: true });
  for (const edition of ['full', 'demo']) {
    const assets = Object.assign(
      {},
      ...parts.map((dir) => readJson(resolve(dir, `assets.${edition}.json`))),
    );
    writeFileSync(resolve(game, `assets.${edition}.json`), JSON.stringify(assets));
  }
  mergeLocalized(parts, game);
}

/**
 * Arborescence par langue (module `cases.ts`, docs/i18n/PLAN.md) : catalogues et surcharges
 * d'illustrations réunis, affaires `case.<éd>.<loc>.<id>.json` copiées, et la table
 * `caseLoaders` du module généré réécrite pour toutes les affaires.
 */
function mergeLocalized(parts, game) {
  const loader = resolve(game, 'cases.ts');
  if (!existsSync(loader)) return;
  let code = readFileSync(loader, 'utf8');
  const edition = /export const edition = '([a-z]+)'/.exec(code)?.[1];
  const locales = [
    ...(/export const locales[^=]*= \[([^\]]*)\]/.exec(code)?.[1] ?? '').matchAll(/'([a-z]+)'/g),
  ].map((m) => m[1]);
  if (!edition) return;
  const ids = {};
  for (const loc of locales) {
    const catalog = parts.flatMap((dir) => {
      const f = resolve(dir, `catalog.${edition}.${loc}.json`);
      return existsSync(f) ? readJson(f) : [];
    });
    writeFileSync(
      resolve(game, `catalog.${edition}.${loc}.json`),
      JSON.stringify(catalog.sort(byOrder)),
    );
    ids[loc] = catalog.map((c) => c.id);
    const overrides = Object.assign(
      {},
      ...parts.map((dir) => {
        const f = resolve(dir, `assets.${edition}.${loc}.json`);
        return existsSync(f) ? readJson(f) : {};
      }),
    );
    writeFileSync(resolve(game, `assets.${edition}.${loc}.json`), JSON.stringify(overrides));
    for (const dir of parts) {
      for (const id of ids[loc]) {
        const f = resolve(dir, `case.${edition}.${loc}.${id}.json`);
        if (existsSync(f)) cpSync(f, resolve(game, `case.${edition}.${loc}.${id}.json`));
      }
    }
  }
  const table = locales
    .map((loc) => {
      const rows = ids[loc].map(
        (id) => `    '${id}': () => import('./case.${edition}.${loc}.${id}.json'),`,
      );
      return `  ${loc}: {\n${rows.join('\n')}\n  },`;
    })
    .join('\n');
  code = code.replace(
    /(const caseLoaders[^\n]*\n)[\s\S]*?\n\};/,
    (_, head) => `${head}${table}\n};`,
  );
  writeFileSync(loader, code);
}

if (process.env.E2E_SKIP_BUILD !== '1' || !existsSync(resolve(outDir, 'index.html'))) {
  buildContent();
  run(process.execPath, [vite, 'build', '--config', config], env);
}
const child = spawn(process.execPath, [vite, 'preview', '--config', config], {
  cwd: repo,
  stdio: 'inherit',
  env: { ...process.env, ...env },
});
const stop = () => child.kill('SIGTERM');
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
child.on('exit', (code) => process.exit(code ?? 0));
