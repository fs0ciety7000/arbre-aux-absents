#!/usr/bin/env node
/**
 * Génère les illustrations d'une affaire dans content/cases/<case>/illustrations/<id>.svg.
 *
 *   node art/tools/illustrations/build.mjs                                → affaire 1 (succession-varenque)
 *   node art/tools/illustrations/build.mjs ph-05 pr-08                    → seulement celles-ci
 *   node art/tools/illustrations/build.mjs --case revenant-hautcorvin     → une autre affaire
 *   node art/tools/illustrations/build.mjs --all                          → toutes les affaires
 *
 * Déterministe : chaque scène tire sa graine de son identifiant (Scene → rng(hash(id))).
 * Briefs : docs/scenario/illustrations*.md (affaire 1), docs/scenario/hautcorvin/09-illustrations.md
 * (affaire 2). Classes : DESIGN.md §10 (ART_CLASSES seulement).
 *
 * Une affaire peut exporter des textes alternatifs (`ALTS`, id → alt) : la table { id: { file, alt } }
 * (`file` relatif au dossier de l'affaire) est alors réécrite à chaque build complet, hors de
 * `content/` (seuls les .svg y sont lus) : art/tools/illustrations/<TABLES[affaire]>.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const BUDGET = 60 * 1024;

/** Affaires : modules de scènes (chacun exporte `SCENES`, éventuellement `ALTS`). */
const CASES = {
  'succession-varenque': ['./scenes-photo.mjs', './scenes-print.mjs'],
  'revenant-hautcorvin': ['./hautcorvin/photos.mjs', './hautcorvin/press.mjs', './hautcorvin/papers.mjs', './hautcorvin/alts.mjs'],
};
const DEFAULT_CASE = 'succession-varenque';
/** Table des textes alternatifs par affaire (chemin relatif à ce dossier). */
const TABLES = { 'revenant-hautcorvin': 'hautcorvin/illustrations.json' };

const args = process.argv.slice(2);
const caseIds = args.includes('--all') ? Object.keys(CASES) : [args.includes('--case') ? args[args.indexOf('--case') + 1] : DEFAULT_CASE];
const want = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--case');
for (const c of caseIds) {
  if (!CASES[c]) {
    console.error(`affaire inconnue : ${c} (connues : ${Object.keys(CASES).join(', ')})`);
    process.exit(1);
  }
}

function svgoSize(svg) {
  const out = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false, convertColors: false } } }, 'removeScripts'],
  }).data;
  return { raw: Buffer.byteLength(svg), gz: gzipSync(out).length };
}

const kb = (n) => `${(n / 1024).toFixed(1)} Ko`;
let over = 0;
for (const c of caseIds) {
  const mods = await Promise.all(CASES[c].map((m) => import(m)));
  const ALL = Object.assign({}, ...mods.map((m) => m.SCENES ?? {}));
  const ALTS = Object.assign({}, ...mods.map((m) => m.ALTS ?? {}));
  const outDir = join(root, 'content/cases', c, 'illustrations');
  mkdirSync(outDir, { recursive: true });
  if (caseIds.length > 1) console.log(`── ${c}`);
  for (const [id, fn] of Object.entries(ALL).sort()) {
    if (want.length && !want.includes(id)) continue;
    const svg = String(fn(id));
    writeFileSync(join(outDir, `${id}.svg`), svg);
    const { raw, gz } = svgoSize(svg);
    const flag = gz > BUDGET ? '  > BUDGET' : '';
    if (flag) over++;
    console.log(`${id.padEnd(14)} brut ${kb(raw).padStart(9)}  gzip ${kb(gz).padStart(8)}${flag}`);
  }
  if (Object.keys(ALTS).length && !want.length) {
    const missing = Object.keys(ALL).filter((id) => !ALTS[id]);
    const orphan = Object.keys(ALTS).filter((id) => !ALL[id]);
    if (missing.length || orphan.length) {
      console.error(`textes alternatifs : manquants ${missing.join(', ') || '—'} ; sans scène ${orphan.join(', ') || '—'}`);
      process.exitCode = 1;
    }
    const table = Object.fromEntries(Object.keys(ALL).sort().map((id) => [id, { file: `illustrations/${id}.svg`, alt: ALTS[id] }]));
    writeFileSync(join(here, TABLES[c] ?? `${c}-illustrations.json`), `${JSON.stringify(table, null, 2)}\n`);
  }
}
if (over) {
  console.error(`${over} illustration(s) hors budget`);
  process.exitCode = 1;
}
