/**
 * npm run package:itch (tsx scripts/package-itch.ts) [-- --skip-build]
 *
 * Construit le jeu web deux fois (content:build --edition full puis demo, vite build) et produit
 * dist/itch/arbre-aux-absents-web.zip et dist/itch/arbre-aux-absents-demo.zip (index.html à la
 * racine, < 1000 fichiers). `--skip-build` zippe apps/game/dist et apps/game/dist-demo existants.
 * L'édition complète est remise dans apps/game/src/generated/cases.ts à la fin.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { REPO_ROOT, zipWebBuild } from '@arbre/content-tools';

const { values } = parseArgs({ options: { 'skip-build': { type: 'boolean', default: false } } });

const builds = [
  { edition: 'full', dir: 'dist', zip: 'arbre-aux-absents-web.zip' },
  { edition: 'demo', dir: 'dist-demo', zip: 'arbre-aux-absents-demo.zip' },
] as const;

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) throw new Error(`échec : ${cmd} ${args.join(' ')}`);
}

const outDir = join(REPO_ROOT, 'dist/itch');
await mkdir(outDir, { recursive: true });
try {
  for (const b of builds) {
    if (!values['skip-build']) {
      run('npx', ['tsx', 'scripts/content-build.ts', '--edition', b.edition]);
      run('npm', ['run', 'build', '-w', '@arbre/game', '--', '--outDir', b.dir, '--emptyOutDir']);
    }
    const zip = await zipWebBuild(join(REPO_ROOT, 'apps/game', b.dir));
    await writeFile(join(outDir, b.zip), zip);
    console.log(`package-itch — dist/itch/${b.zip} (${(zip.length / 1024).toFixed(0)} Ko)`);
  }
} finally {
  if (!values['skip-build']) run('npx', ['tsx', 'scripts/content-build.ts', '--edition', 'full']);
}
