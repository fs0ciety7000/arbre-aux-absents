#!/usr/bin/env node
/**
 * Génère les illustrations de l'affaire dans content/cases/<case>/illustrations/<id>.svg.
 *
 *   node art/tools/illustrations/build.mjs            → toutes, avec budgets (svgo + gzip)
 *   node art/tools/illustrations/build.mjs ph-05 pr-08 → seulement celles-ci
 *
 * Déterministe : chaque scène tire sa graine de son identifiant (Scene → rng(hash(id))).
 * Briefs : docs/scenario/illustrations*.md. Classes : DESIGN.md §10 (ART_CLASSES seulement).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import { SCENES as A } from './scenes-photo.mjs';
import { SCENES as B } from './scenes-print.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = join(root, 'content/cases/succession-varenque/illustrations');
const BUDGET = 60 * 1024;
const ALL = { ...A, ...B };

function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, convertColors: false } } }, 'removeScripts'],
  }).data;
  return { raw: Buffer.byteLength(svg), gz: gzipSync(out).length };
}

const want = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const kb = (n) => `${(n / 1024).toFixed(1)} Ko`;
let over = 0;
for (const [id, fn] of Object.entries(ALL).sort()) {
  if (want.length && !want.includes(id)) continue;
  const svg = String(fn(id));
  writeFileSync(join(outDir, `${id}.svg`), svg);
  const { raw, gz } = svgoSize(svg);
  const flag = gz > BUDGET ? '  > BUDGET' : '';
  if (flag) over++;
  console.log(`${id.padEnd(14)} brut ${kb(raw).padStart(9)}  gzip ${kb(gz).padStart(8)}${flag}`);
}
if (over) {
  console.error(`${over} illustration(s) hors budget`);
  process.exitCode = 1;
}
