#!/usr/bin/env node
/**
 * Génère l'art clé, les vignettes et les ornements animés dans art/keyart/.
 *
 *   node art/tools/keyart/build.mjs            → tout, avec budgets (svgo + gzip)
 *   node art/tools/keyart/build.mjs keyart-desk → seulement ceux-là
 *
 * Déterministe : chaque fichier tire sa graine de son nom (Svg → rng(hash(id))).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import { buildDesk } from './desk.mjs';
import { fernVine, seal, tampon } from './flourishes.mjs';
import { SPOTS } from './spots.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = join(root, 'art/keyart');
const KB = 1024;

const JOBS = {
  'keyart-desk': { budget: 120 * KB, make: (id) => buildDesk(id, 'wide') },
  'keyart-desk-tall': { budget: 120 * KB, make: (id) => buildDesk(id, 'tall') },
  ...Object.fromEntries(
    Object.entries(SPOTS).map(([id, fn]) => [id, { budget: 25 * KB, make: fn }]),
  ),
  'flourish-fern-vine': { budget: 25 * KB, make: fernVine },
  'flourish-seal': { budget: 25 * KB, make: seal },
  'flourish-tampon': { budget: 25 * KB, make: tampon },
};

function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { cleanupIds: false, convertColors: false } },
      },
      'removeScripts',
    ],
  }).data;
  return {
    raw: Buffer.byteLength(svg),
    gz: gzipSync(out).length,
    nodes: (out.match(/<[a-zA-Z]/g) ?? []).length,
  };
}

const want = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const kb = (n) => `${(n / KB).toFixed(1)} Ko`;
let over = 0;
for (const [id, job] of Object.entries(JOBS)) {
  if (want.length && !want.includes(id)) continue;
  const res = job.make(id);
  const svg = typeof res === 'string' ? res : res.svg;
  writeFileSync(join(outDir, `${id}.svg`), svg);
  const { raw, gz, nodes } = svgoSize(svg);
  const flag = gz > job.budget ? `  > BUDGET ${kb(job.budget)}` : '';
  if (flag) over++;
  console.log(
    `${id.padEnd(24)} brut ${kb(raw).padStart(9)}  gzip ${kb(gz).padStart(8)}  nœuds ${String(nodes).padStart(5)}${flag}`,
  );
  if (res.origins)
    console.log(
      '   origines',
      JSON.stringify(res.origins, (k, v) => (typeof v === 'number' ? Math.round(v) : v)),
    );
}
if (over) {
  console.error(`${over} fichier(s) hors budget`);
  process.exitCode = 1;
}
