#!/usr/bin/env node
/**
 * Génère les portraits d'une affaire dans content/cases/<case>/portraits/<portraitId>.svg
 * (id neutre lu dans la table d'ids de l'affaire : personne → portrait, voir cases.mjs).
 *
 *   node art/tools/portraits/build.mjs                              → affaire 1 (succession-varenque)
 *   node art/tools/portraits/build.mjs --case revenant-hautcorvin   → une autre affaire
 *   node art/tools/portraits/build.mjs --all                        → toutes les affaires
 *   … --sheet <dir>        → + planches HTML de contrôle (portraits, vignettes, âges ou trio)
 *   … --assign-ids         → complète la table d'ids de l'affaire (ids neutres, stables)
 *
 * Déterministe : la graine de chaque visage est tirée de son identifiant. Les ids de portrait et
 * les noms de fichier sont vérifiés uniques sur l'ensemble des affaires.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import { CASES, DEFAULT_CASE } from './cases.mjs';
import { atAge, renderFigure, renderPortrait } from './figure.mjs';
import { hash } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const BUDGET = 25 * 1024;

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const sheetRoot = opt('--sheet') ? resolve(opt('--sheet')) : null;
const assignIds = args.includes('--assign-ids');
const caseIds = args.includes('--all') ? Object.keys(CASES) : [opt('--case') ?? DEFAULT_CASE];
for (const c of caseIds) {
  if (!CASES[c]) {
    console.error(`affaire inconnue : ${c} (connues : ${Object.keys(CASES).join(', ')})`);
    process.exit(1);
  }
}

/** Même réglage que packages/content-tools/src/svg.ts (optimizeSvg). */
function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, convertColors: false } } }, 'removeScripts'],
  }).data;
  return { raw: Buffer.byteLength(svg), opt: Buffer.byteLength(out), gz: gzipSync(out).length };
}

const readIds = (c) => JSON.parse(readFileSync(new URL(CASES[c].ids, import.meta.url), 'utf8'));
const loadPeople = async (c) => (await import(CASES[c].people)).PEOPLE;

/** Ids neutres de toutes les affaires : aucun id ni fichier partagé entre deux affaires. */
function checkAcross() {
  const owner = new Map();
  for (const c of Object.keys(CASES)) {
    for (const id of Object.values(readIds(c))) {
      if (owner.has(id) && owner.get(id) !== c) throw new Error(`id de portrait « ${id} » partagé par ${owner.get(id)} et ${c}`);
      owner.set(id, c);
    }
  }
  return owner;
}

/** Complète la table d'ids d'une affaire : `<préfixe><6 hex>` tiré du nom de travail (stable). */
function assign(c, people) {
  const ids = readIds(c);
  const taken = new Set(checkAcross().keys());
  let added = 0;
  for (const p of people) {
    if (ids[p.id]) continue;
    let salt = 0;
    let id;
    do id = `${CASES[c].idPrefix}${(hash(`${c}:${p.id}:${salt++}`) & 0xffffff).toString(16).padStart(6, '0')}`;
    while (taken.has(id));
    ids[p.id] = id;
    taken.add(id);
    added++;
  }
  const ordered = Object.fromEntries(people.filter((p) => ids[p.id]).map((p) => [p.id, ids[p.id]]));
  for (const [k, v] of Object.entries(ids)) if (!(k in ordered)) ordered[k] = v;
  writeFileSync(new URL(CASES[c].ids, import.meta.url), `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`${CASES[c].ids} : ${added} id(s) ajouté(s)`);
}

const kb = (n) => `${(n / 1024).toFixed(1)} Ko`;

async function buildCase(c) {
  const people = await loadPeople(c);
  if (assignIds) assign(c, people);
  checkAcross();
  const ids = readIds(c);
  const missing = people.filter((p) => !ids[p.id]).map((p) => p.id);
  if (missing.length) {
    console.error(`${c} : pas d'id neutre pour ${missing.join(', ')} (relancer avec --assign-ids)`);
    process.exit(1);
  }
  const outDir = join(root, 'content/cases', c, 'portraits');
  mkdirSync(outDir, { recursive: true });
  const rows = [];
  const files = {};
  for (const p of people) {
    const fileId = ids[p.id];
    const svg = renderPortrait(p, { prefix: fileId });
    writeFileSync(join(outDir, `${fileId}.svg`), svg);
    files[p.id] = svg;
    rows.push({ id: p.id, file: fileId, ...svgoSize(svg) });
  }
  let over = 0;
  console.log(`— ${c} (${CASES[c].title})`);
  for (const r of rows) {
    const flag = r.gz > BUDGET ? '  > BUDGET' : '';
    if (flag) over++;
    console.log(`${r.id.padEnd(26)} ${r.file.padEnd(20)} brut ${kb(r.raw).padStart(9)}  svgo ${kb(r.opt).padStart(9)}  gzip ${kb(r.gz).padStart(8)}${flag}`);
  }
  const max = Math.max(...rows.map((r) => r.gz));
  console.log(`\n${rows.length} portraits, gzip max ${kb(max)} (budget ${kb(BUDGET)})${over ? `, ${over} hors budget` : ''}`);
  if (sheetRoot) {
    const dir = caseIds.length > 1 ? join(sheetRoot, c) : sheetRoot;
    mkdirSync(dir, { recursive: true });
    (SHEETS[c] ?? sheetsGeneric)(c, people, files, dir);
    console.log(`planches : ${dir}`);
  }
  if (over) process.exitCode = 1;
}

/* ───────────────────────── Planches de contrôle ───────────────────────── */

function page(title, cells, cols, size) {
  const css = ['packages/ui/src/styles/tokens.css', 'packages/ui/src/styles/art.css'].map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  const artDefs = /<svg[\s\S]*?<\/svg>/.exec(readFileSync(join(root, 'packages/ui/src/primitives/ArtDefs.svelte'), 'utf8'))[0];
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><title>${title}</title>
<style>${css}
body{margin:0;padding:24px;background:var(--paper, #f3ead8);font-family:serif;color:#1c2333}
h1{font-size:18px;margin:0 0 16px;font-weight:600}
.g{display:grid;grid-template-columns:repeat(${cols},${size}px);gap:18px 14px}
figure{margin:0}figure svg{display:block;width:${size}px;height:${(size * 200) / 160}px}
figcaption{font-size:11px;line-height:1.25;margin-top:4px}
.small{display:flex;gap:6px;margin-top:4px}.small svg{width:72px;height:90px}
.row{display:flex;gap:14px;align-items:flex-end}.row figure svg{width:auto}
</style><body>${artDefs.replace('class="art defs"', 'class="art" style="position:absolute"')}<h1>${title}</h1><div class="g">${cells}</div></body></html>`;
}
/** Même SVG inliné plusieurs fois : ids de clipPath renommés pour rester uniques dans la page. */
const reId = (svg, k) => svg.replace(/id="([^"]+)"/g, `id="${k}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${k}$1)`);

function sheetsGeneric(c, people, files, dir) {
  const cells = people.map((p) => `<figure>${files[p.id]}<figcaption>${p.slot ?? p.group ?? ''} · ${p.id} · ${p.age} ans</figcaption></figure>`).join('');
  writeFileSync(join(dir, 'portraits.html'), page(`${CASES[c].title} — portraits`, cells, 6, 200));
  const small = people.map((p) => `<figure>${reId(files[p.id], 's')}</figure>`).join('');
  writeFileSync(join(dir, 'portraits-72.html'), page('Cases de l’arbre (72 px)', small, 10, 72));
  const s96 = people.map((p) => `<figure>${reId(files[p.id], 'm')}<figcaption>${p.id.replace(/^hc-/, '')}</figcaption></figure>`).join('');
  writeFileSync(join(dir, 'portraits-96.html'), page('Galerie (96 px)', s96, 9, 96));
}

const SHEETS = {
  'succession-varenque'(c, people, files, dir) {
    sheetsGeneric(c, people, files, dir);
    // 1 bis. ancien intitulé de la planche des portraits de case
    const cells = people.map((p, i) => `<figure>${files[p.id]}<figcaption>C${String(i + 1).padStart(2, '0')} · ${p.id} · ${p.age} ans</figcaption></figure>`).join('');
    writeFileSync(join(dir, 'portraits.html'), page('Succession Varenque — portraits de case', cells, 6, 200));
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
    const byId = Object.fromEntries(people.map((p) => [p.id, p]));
    const ageCells = AGES.map(([id, age], i) => {
      const s = atAge(byId[id], age);
      const pre = `age${i}`;
      const svg = renderPortrait(s, { prefix: pre });
      const ph = renderPortrait(s, { prefix: `${pre}p`, mode: 'photo' });
      return `<figure><div class="small">${svg}${ph}</div><figcaption>${id} · ${age} ans (case : ${byId[id].age})</figcaption></figure>`;
    }).join('');
    writeFileSync(join(dir, 'ages.html'), page('Variantes d’âge (atAge) et tirage photo', ageCells, 6, 160));
    // 3. Démonstration de réutilisation en photo de groupe (fragments renderFigure)
    const group = ['anselme-varenque', 'clemence-aubertot', 'augustin-varenque-1872', 'lucien-varenque', 'adelaide-varenque'].map((id, i) => {
      const age = { 'anselme-varenque': 39, 'clemence-aubertot': 35, 'augustin-varenque-1872': 13, 'lucien-varenque': 9, 'adelaide-varenque': 5 }[id];
      const { defs, body } = renderFigure(atAge(byId[id], age), { prefix: `g${i}`, mode: 'photo' });
      const x = [-10, 70, 150, 205, 255][i];
      const y = [10, 14, 50, 62, 78][i];
      const sc = [1, 0.95, 0.8, 0.72, 0.62][i];
      return { defs, body: `<g transform="translate(${x} ${y}) scale(${sc})">${body}</g>` };
    });
    const groupSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="0 0 360 220" style="width:720px;height:440px"><defs>${group.map((g) => g.defs).join('')}</defs><path class="photo-paper" d="M0 0h360v220H0Z"/>${group.map((g) => g.body).join('')}<path class="ink-soft" d="M2 2h356v216H2Z"/></svg>`;
    writeFileSync(join(dir, 'group.html'), page('PH-02 (essai) : réutilisation des figures', `<figure>${groupSvg}</figure>`, 1, 720));
  },

  'revenant-hautcorvin'(c, people, files, dir) {
    sheetsGeneric(c, people, files, dir);
    // Planche de contrôle du trio (09-illustrations §3) : confondables à 96 px, distincts à 240 px,
    // et tirage noir et blanc (iris gris plus clair que la peau, iris noir).
    const trio = ['hc-bastien-27', 'hc-andrin-27', 'hc-andrin-41', 'hc-andrin-63', 'hc-agnes-36'];
    const byId = Object.fromEntries(people.map((p) => [p.id, p]));
    const sizes = [96, 240];
    let cells = '';
    for (const size of sizes) {
      cells += `<div class="row">${trio.map((id, i) => `<figure><div style="width:${size}px;height:${(size * 200) / 160}px">${reId(files[id], `z${size}${i}`).replace('<svg ', `<svg style="width:${size}px;height:${(size * 200) / 160}px" `)}</div><figcaption>${id.replace(/^hc-/, '')} · ${size} px</figcaption></figure>`).join('')}</div>`;
    }
    cells += `<div class="row">${trio
      .map((id, i) => {
        const ph = renderPortrait(byId[id], { prefix: `ph${i}`, mode: 'photo' });
        return `<figure>${ph.replace('<svg ', '<svg style="width:240px;height:300px" ')}<figcaption>${id.replace(/^hc-/, '')} · tirage</figcaption></figure>`;
      })
      .join('')}</div>`;
    writeFileSync(join(dir, 'trio.html'), page('Le trio du revenant : planche de contrôle (96 / 240 px, tirage)', cells, 1, 1400));
  },
};

for (const c of caseIds) await buildCase(c);
