#!/usr/bin/env node
/**
 * Génère les 34 marques de l'affaire 3 dans content/cases/marques-de-longuegreve/portraits/<id>.svg
 * (même carton que les portraits, 160 × 200 ; rendu « relevé » du carnet de Marest ; D10 et D11 en
 * gravure). Ids neutres partagés avec les visages de l'affaire. **Aucun code écrit sur les cartes** :
 * un code en clair hors des relevés CN-01–CN-03 ruine la déduction (docs/level/longuegreve.md §12.4) ;
 * `markCard(m, { showCode: true })` le note au crayon (cote LX) pour l'illustration de ces relevés.
 *
 *   node art/tools/marques/build.mjs                 → les 34 cartes
 *   node art/tools/marques/build.mjs --assign-ids    → complète la table d'ids (ids neutres, stables)
 *   node art/tools/marques/build.mjs --sheet <dir>   → + planche de contrôle (trois rendus, 72 / 96 px)
 *
 * Déterministe (graines tirées des codes). Budget : 25 Ko gzip par carte (règle 9).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import { CASES } from '../portraits/cases.mjs';
import { frame, WIN } from '../portraits/figure.mjs';
import { hash, f, ell } from '../portraits/lib.mjs';
import { MARKS } from './catalog.mjs';
import { describe, renderMarkBody } from './marks.mjs';

const CASE = 'marques-de-longuegreve';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const BUDGET = 25 * 1024;
const args = process.argv.slice(2);
const sheetDir = args.includes('--sheet') ? resolve(args[args.indexOf('--sheet') + 1]) : null;
const idsUrl = new URL(`../portraits/${CASES[CASE].ids.replace('./', '')}`, import.meta.url);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Page du carnet : quadrillage pâle, marge rouge, la marque (et sa cote au crayon si `showCode`). */
export function markCard(m, { prefix, style, showCode = false } = {}) {
  const fr = frame(prefix);
  const st = style ?? m.style ?? 'releve';
  const tall = m.code === 'fourche-couronnee';
  const S = 1.12;
  const top = tall ? 58 : 36;
  let body = renderMarkBody(m.code, { style: st, x: 80, y: top, s: S, seed: m.id });
  if (m.code === 'fourche-couronnee') {
    // sceau de la marque de commerce : double ovale gravé
    body = `<path class="ink" d="${ell(80, 95, 50, 72)}" stroke-width="1.1"/><path class="ink-soft" d="${ell(80, 95, 46, 68)}" stroke-width=".5"/>${body}`;
  } else if (m.code === 'ile') {
    // cartouche du géomètre : double filet, coins rentrés
    body = `<path class="ink" d="M40 26h80v140h-80Z" stroke-width="1"/><path class="ink-soft" d="M44 30h72v132h-72Z" stroke-width=".5"/>${body}`;
  }
  let grid = '';
  for (let x = WIN.x + 6; x < WIN.x + WIN.w; x += 10) grid += `M${f(x)} ${WIN.y}v${WIN.h}`;
  for (let y = WIN.y + 6; y < WIN.y + WIN.h; y += 10) grid += `M${WIN.x} ${f(y)}h${WIN.w}`;
  let under;
  if (st === 'taillee') {
    // planche de bois : lavis de sienne, fil du bois en ondes longues, un nœud
    let grain = '';
    for (let y = WIN.y + 5; y < WIN.y + WIN.h; y += 7) grain += `M${WIN.x} ${f(y)}q35 ${f(((y * 7) % 5) - 2.5)} 70 0t70 0`;
    under = `<path class="wash-sienne" d="M${WIN.x} ${WIN.y}h${WIN.w}v${WIN.h}h-${WIN.w}Z"/><path class="ink-faint" d="${grain}${ell(118, 160, 7, 3)}" stroke-width=".45"/>`;
  } else if (st === 'tracee') {
    // page de registre : lignes réglées, filet de colonne
    let rules = '';
    for (let y = WIN.y + 12; y < WIN.y + WIN.h; y += 12) rules += `M${WIN.x} ${y}h${WIN.w}`;
    under = `<path class="ink-faint" d="${rules}M${WIN.x + 22} ${WIN.y}v${WIN.h}" stroke-width=".35"/>`;
  } else {
    under = `<path class="ink-faint" d="${grid}" stroke-width=".25"/><path class="wash-carmin" d="M${WIN.x + 14} ${WIN.y}v${WIN.h}" stroke="currentColor" stroke-width=".6"/>`;
  }
  const code = showCode && st === 'releve' && /^[YOAP]/.test(m.code) ? m.code : null;
  const note = code ? `<text class="label-note" x="${WIN.x + WIN.w - 8}" y="${WIN.y + WIN.h - 10}" text-anchor="end" font-size="14">${esc(code)}</text>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="0 0 160 200" role="img">` +
    `<defs>${fr.clip}</defs>${fr.under}<g clip-path="url(#${prefix}-win)">${under}${body}${note}</g>${fr.over}</svg>\n`
  );
}

function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, convertColors: false } } }, 'removeScripts'],
  }).data;
  return { raw: Buffer.byteLength(svg), gz: gzipSync(out).length };
}

function readIds() {
  try {
    return JSON.parse(readFileSync(idsUrl, 'utf8'));
  } catch {
    return {};
  }
}

/** Ids déjà pris par toutes les affaires (aucun id de portrait partagé entre deux affaires). */
function takenIds() {
  const taken = new Set();
  for (const c of Object.values(CASES)) {
    try {
      for (const v of Object.values(JSON.parse(readFileSync(new URL(`../portraits/${c.ids.replace('./', '')}`, import.meta.url), 'utf8')))) taken.add(v);
    } catch {
      /* table pas encore créée */
    }
  }
  return taken;
}

const ids = readIds();
if (args.includes('--assign-ids')) {
  const taken = takenIds();
  let added = 0;
  for (const m of MARKS) {
    if (ids[m.id]) continue;
    let salt = 0;
    let id;
    do id = `${CASES[CASE].idPrefix}${(hash(`${CASE}:${m.id}:${salt++}`) & 0xffffff).toString(16).padStart(6, '0')}`;
    while (taken.has(id));
    ids[m.id] = id;
    taken.add(id);
    added++;
  }
  writeFileSync(idsUrl, `${JSON.stringify(ids, null, 2)}\n`);
  console.log(`ids : ${added} ajouté(s)`);
}
const missing = MARKS.filter((m) => !ids[m.id]);
if (missing.length) {
  console.error(`pas d'id neutre pour ${missing.map((m) => m.id).join(', ')} (relancer avec --assign-ids)`);
  process.exit(1);
}
const codes = new Set();
for (const m of MARKS) {
  if (codes.has(m.code)) throw new Error(`marque en double : ${m.code}`);
  codes.add(m.code);
}

const outDir = join(root, 'content/cases', CASE, 'portraits');
mkdirSync(outDir, { recursive: true });
let over = 0;
const files = {};
for (const m of MARKS) {
  const svg = markCard(m, { prefix: ids[m.id] });
  writeFileSync(join(outDir, `${ids[m.id]}.svg`), svg);
  files[m.id] = svg;
  const { raw, gz } = svgoSize(svg);
  if (gz > BUDGET) over++;
  console.log(`${m.id.padEnd(24)} ${ids[m.id]}  ${m.code.padEnd(18)} ${(raw / 1024).toFixed(1).padStart(5)} Ko  gzip ${(gz / 1024).toFixed(1)} Ko  ${describe(m.code)}`);
}
console.log(`\n${MARKS.length} marques (${MARKS.filter((m) => !m.decoy).length} justes, ${MARKS.filter((m) => m.decoy).length} leurres)${over ? `, ${over} hors budget` : ''}`);

if (sheetDir) {
  mkdirSync(sheetDir, { recursive: true });
  const css = ['packages/ui/src/styles/tokens.css', 'packages/ui/src/styles/art.css'].map((p) => readFileSync(join(root, p), 'utf8')).join('\n');
  const artDefs = /<svg[\s\S]*?<\/svg>/.exec(readFileSync(join(root, 'packages/ui/src/primitives/ArtDefs.svelte'), 'utf8'))[0];
  const page = (title, cells, w) => `<!doctype html><html lang="fr"><meta charset="utf-8"><title>${title}</title><style>${css}
body{margin:0;padding:20px;background:#f3ead8;font-family:serif;color:#1c2333}h1{font-size:17px;margin:0 0 12px}
.g{display:flex;flex-wrap:wrap;gap:14px 12px}figure{margin:0;width:${w}px}figure svg{display:block;width:${w}px;height:${(w * 200) / 160}px}
figcaption{font-size:10px;line-height:1.2;margin-top:3px}.trio{display:flex;gap:4px}.trio svg{width:${w / 3 - 3}px;height:${((w / 3 - 3) * 200) / 160}px}</style>
<body>${artDefs.replace('class="art defs"', 'class="art" style="position:absolute"')}<h1>${title}</h1><div class="g">${cells}</div></body></html>`;
  const reId = (svg, k) => svg.replace(/id="([^"]+)"/g, `id="${k}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${k}$1)`);
  const cells = MARKS.map((m) => `<figure>${files[m.id]}<figcaption><b>${m.decoy ?? m.slot}${m.alt ? ' (fille)' : ''}</b> · ${esc(m.code)} · ${esc(m.who)}<br>${esc(describe(m.code))}</figcaption></figure>`).join('');
  writeFileSync(join(sheetDir, 'marques.html'), page('Marques de Longuegrève : les 34 cartes (relevé)', cells, 150));
  const small = MARKS.map((m, i) => `<figure>${reId(files[m.id], `s${i}`)}</figure>`).join('');
  writeFileSync(join(sheetDir, 'marques-72.html'), page('Cases de l’arbre (72 px)', small, 72));
  const styles = MARKS.filter((m) => !m.style)
    .map((m, i) => `<figure><div class="trio">${['releve', 'taillee', 'tracee'].map((st) => reId(markCard(m, { prefix: `t${i}${st[0]}`, style: st }), '')).join('')}</div><figcaption>${esc(m.code)} : relevé · taillée · tracée</figcaption></figure>`)
    .join('');
  writeFileSync(join(sheetDir, 'rendus.html'), page('Trois rendus par support (09-marques §6)', styles, 240));
  console.log(`planches : ${sheetDir}`);
}
if (over) process.exitCode = 1;
