#!/usr/bin/env node
/**
 * Planche-contact de l'art clé (Playwright/Chromium), classes résolues par tokens.css + art.css
 * + motifs de <ArtDefs />.
 *
 *   node art/tools/keyart/sheet.mjs <out.png> [--cols 3] [--width 320] [--bg desk|paper|card]
 *        [--night] [--both] [--motion] fichier.svg…
 *
 * --night : pose `on-night` sur les SVG (fond bureau) ; --both : chaque SVG en papier puis en nuit ;
 * --motion : surligne les groupes animables (ids en *-lamp-light, -dust, -steam, -curtain, -pages…).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const args = process.argv.slice(2);
const out = args.shift();
const opt = { cols: 3, width: 320, bg: 'desk', night: false, both: false, motion: false };
const files = [];
while (args.length) {
  const a = args.shift();
  if (a === '--cols') opt.cols = Number(args.shift());
  else if (a === '--width') opt.width = Number(args.shift());
  else if (a === '--bg') opt.bg = args.shift();
  else if (a === '--night') opt.night = true;
  else if (a === '--both') opt.both = true;
  else if (a === '--motion') opt.motion = true;
  else files.push(a);
}
const BG = {
  desk: 'oklch(0.17 0.022 258)',
  paper: 'oklch(0.955 0.018 90)',
  card: 'oklch(0.255 0.026 258)',
};
const css = ['tokens.css', 'art.css']
  .map((f) => readFileSync(join(root, 'packages/ui/src/styles', f), 'utf8'))
  .join('\n');
const artDefs = /<svg[\s\S]*?<\/svg>/.exec(
  readFileSync(join(root, 'packages/ui/src/primitives/ArtDefs.svelte'), 'utf8'),
)[0];
const cells = [];
for (const f of files) {
  const svg = readFileSync(f, 'utf8');
  const modes = opt.both ? [false, true] : [opt.night];
  for (const night of modes) {
    const s = night ? svg.replace('class="art"', 'class="art on-night"') : svg;
    const bg = opt.both ? (night ? BG.card : BG.paper) : BG[opt.bg];
    cells.push(
      `<figure style="background:${bg}">${s}<figcaption>${basename(f)}${night ? ' · on-night' : ''}</figcaption></figure>`,
    );
  }
}
const motionCss = opt.motion
  ? `[id$="-lamp-light"],[id$="-dust"],[id$="-steam"],[id$="-curtain"],[id$="-pages"],[id$="-stem"],[id$="-leaves"],[id$="-ring"],[id$="-burst"]{outline:2px dashed #f0f;}`
  : '';
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>${css}
body{margin:0;padding:20px;background:#1d1b19;font-family:sans-serif;color:#ddd}
.g{display:grid;grid-template-columns:repeat(${opt.cols},${opt.width}px);gap:18px;align-items:start}
figure{margin:0;padding:10px}figure svg{display:block;width:100%;height:auto}
figcaption{font-size:12px;margin-top:6px;color:#bbb}${motionCss}</style><body>${artDefs.replace('class="art defs"', 'class="art" style="position:absolute"')}<div class="g">${cells.join('')}</div></body></html>`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 40 + opt.cols * (opt.width + 38), height: 400 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.waitForTimeout(150);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
