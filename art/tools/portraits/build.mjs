#!/usr/bin/env node
/**
 * Génère les portraits de l'affaire dans content/cases/<case>/portraits/<personId>.svg.
 *
 *   node art/tools/portraits/build.mjs                 → écrit les 30 portraits + budgets
 *   node art/tools/portraits/build.mjs --sheet <dir>   → + planches HTML (portraits, âges, photo)
 *
 * Déterministe : la graine de chaque visage est tirée de son identifiant.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import { atAge, renderFigure, renderPortrait, frame, VIEWBOX } from './figure.mjs';
import { PEOPLE } from './people.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const CASE = 'succession-varenque';
const outDir = join(root, 'content/cases', CASE, 'portraits');
const BUDGET = 25 * 1024;

const args = process.argv.slice(2);
const sheetDir = args.includes('--sheet') ? resolve(args[args.indexOf('--sheet') + 1]) : null;

/** Même réglage que packages/content-tools/src/svg.ts (optimizeSvg). */
function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, convertColors: false } } }, 'removeScripts'],
  }).data;
  return { raw: Buffer.byteLength(svg), opt: Buffer.byteLength(out), gz: gzipSync(out).length };
}

mkdirSync(outDir, { recursive: true });
const rows = [];
const files = {};
for (const p of PEOPLE) {
  const svg = renderPortrait(p, { prefix: p.id });
  writeFileSync(join(outDir, `${p.id}.svg`), svg);
  files[p.id] = svg;
  rows.push({ id: p.id, ...svgoSize(svg) });
}
const kb = (n) => `${(n / 1024).toFixed(1)} Ko`;
let over = 0;
for (const r of rows) {
  const flag = r.gz > BUDGET ? '  > BUDGET' : '';
  if (flag) over++;
  console.log(`${r.id.padEnd(26)} brut ${kb(r.raw).padStart(9)}  svgo ${kb(r.opt).padStart(9)}  gzip ${kb(r.gz).padStart(8)}${flag}`);
}
const max = Math.max(...rows.map((r) => r.gz));
console.log(`\n${rows.length} portraits, gzip max ${kb(max)} (budget ${kb(BUDGET)})${over ? `, ${over} hors budget` : ''}`);

if (sheetDir) {
  mkdirSync(sheetDir, { recursive: true });
  const css = ['packages/ui/src/styles/tokens.css', 'packages/ui/src/styles/art.css'].map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  const artDefs = /<svg[\s\S]*?<\/svg>/.exec(readFileSync(join(root, 'packages/ui/src/primitives/ArtDefs.svelte'), 'utf8'))[0];
  const page = (title, cells, cols, size) => `<!doctype html><html lang="fr"><meta charset="utf-8"><title>${title}</title>
<style>${css}
body{margin:0;padding:24px;background:var(--paper, #f3ead8);font-family:serif;color:#1c2333}
h1{font-size:18px;margin:0 0 16px;font-weight:600}
.g{display:grid;grid-template-columns:repeat(${cols},${size}px);gap:18px 14px}
figure{margin:0}figure svg{display:block;width:${size}px;height:${(size * 200) / 160}px}
figcaption{font-size:11px;line-height:1.25;margin-top:4px}
.small{display:flex;gap:6px;margin-top:4px}.small svg{width:72px;height:90px}
</style><body>${artDefs.replace('class="art defs"', 'class="art" style="position:absolute"')}<h1>${title}</h1><div class="g">${cells}</div></body></html>`;

  // 1. Planche des 30 portraits de case (grand + vignette 72 px)
  const cells = PEOPLE.map(
    (p, i) => `<figure>${files[p.id]}<figcaption>C${String(i + 1).padStart(2, '0')} · ${p.id} · ${p.age} ans</figcaption></figure>`,
  ).join('');
  writeFileSync(join(sheetDir, 'portraits.html'), page('Succession Varenque — portraits de case', cells, 6, 200));
  const small = PEOPLE.map((p) => `<figure>${files[p.id].replace(/id="([^"]+)"/g, 'id="s$1"').replace(/url\(#([^)]+)\)/g, 'url(#s$1)')}</figure>`).join('');
  writeFileSync(join(sheetDir, 'portraits-72.html'), page('Cases de l’arbre (72 px)', small, 10, 72));

  // 2. Variantes d'âge (API atAge) et rendu photographie
  const AGES = [
    ['anselme-varenque', 24],
    ['clemence-aubertot', 72],
    ['firmin-varenque-1849', 46],
    ['maaren-tennok', 21],
    ['augustin-varenque-1872', 13],
    ['augustin-varenque-1872', 50],
    ['adelaide-varenque', 5],
    ['adelaide-varenque', 42],
    ['lucien-varenque', 9],
    ['gaspard-varenque', 54],
    ['odile-varenque', 13],
    ['odile-varenque', 50],
    ['orrin-kessvel', 36],
    ['firmin-varenque-1900', 52],
    ['selda-varenque', 49],
    ['lise-daubry', 13],
    ['tavik-varenque', 20],
    ['victor-sauge', 31],
  ];
  const byId = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));
  const ageCells = AGES.map(([id, age], i) => {
    const s = atAge(byId[id], age);
    const pre = `age${i}`;
    const svg = renderPortrait(s, { prefix: pre });
    const ph = renderPortrait(s, { prefix: `${pre}p`, mode: 'photo' });
    return `<figure><div class="small">${svg}${ph}</div><figcaption>${id} · ${age} ans (case : ${byId[id].age})</figcaption></figure>`;
  }).join('');
  writeFileSync(join(sheetDir, 'ages.html'), page('Variantes d’âge (atAge) et tirage photo', ageCells, 6, 160));

  // 3. Démonstration de réutilisation en photo de groupe (fragments renderFigure)
  const group = ['anselme-varenque', 'clemence-aubertot', 'augustin-varenque-1872', 'lucien-varenque', 'adelaide-varenque'].map((id, i) => {
    const age = { 'anselme-varenque': 39, 'clemence-aubertot': 35, 'augustin-varenque-1872': 13, 'lucien-varenque': 9, 'adelaide-varenque': 5 }[id];
    const { defs, body } = renderFigure(atAge(byId[id], age), { prefix: `g${i}`, mode: 'photo' });
    const x = [-10, 70, 150, 205, 255][i];
    const y = [10, 14, 50, 62, 78][i];
    const sc = [1, 0.95, 0.8, 0.72, 0.62][i];
    return { defs, body: `<g transform="translate(${x} ${y}) scale(${sc})">${body}</g>` };
  });
  const fr = frame('grp', 'photo');
  void fr;
  const groupSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="0 0 360 220" style="width:720px;height:440px"><defs>${group.map((g) => g.defs).join('')}</defs><path class="photo-paper" d="M0 0h360v220H0Z"/>${group.map((g) => g.body).join('')}<path class="ink-soft" d="M2 2h356v216H2Z"/></svg>`;
  writeFileSync(join(sheetDir, 'group.html'), page('PH-02 (essai) : réutilisation des figures', `<figure>${groupSvg}</figure>`, 1, 720));
  console.log(`planches : ${sheetDir}`);
  void VIEWBOX;
}
