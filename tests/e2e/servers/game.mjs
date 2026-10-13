// Serveur e2e du jeu : compile la fixture `mini`, construit le jeu contre elle, puis le sert
// (vite preview). Lancé par Playwright (`webServer`). E2E_SKIP_BUILD=1 réutilise le dernier build.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const cache = resolve(repo, 'node_modules/.cache/arbre-e2e');
const config = resolve(repo, 'tests/e2e/vite.game.config.ts');
const vite = resolve(repo, 'node_modules/vite/bin/vite.js');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: repo, stdio: 'inherit' });

if (process.env.E2E_SKIP_BUILD !== '1' || !existsSync(resolve(cache, 'game-dist/index.html'))) {
  run('npm', [
    'run',
    'content:build',
    '--',
    '--root',
    'packages/content-tools/fixtures/mini',
    '--out',
    resolve(cache, 'mini'),
  ]);
  run(process.execPath, [vite, 'build', '--config', config]);
}
const child = spawn(process.execPath, [vite, 'preview', '--config', config], {
  cwd: repo,
  stdio: 'inherit',
});
const stop = () => child.kill('SIGTERM');
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
child.on('exit', (code) => process.exit(code ?? 0));
