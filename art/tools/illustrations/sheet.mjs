#!/usr/bin/env node
/**
 * Planche-contact des illustrations : node art/tools/illustrations/sheet.mjs <out.png> <cols> <width> file.svg…
 * Rend les SVG avec tokens.css + art.css + ArtDefs (classes résolues) via Playwright/Chromium.
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
const [out, cols = '4', width = '320', ...files] = process.argv.slice(2);
const css = ['tokens.css', 'art.css'].map((f) => readFileSync(join(root, 'packages/ui/src/styles', f), 'utf8')).join('\n');
const artDefs = /<svg[\s\S]*?<\/svg>/.exec(readFileSync(join(root, 'packages/ui/src/primitives/ArtDefs.svelte'), 'utf8'))[0];
const cells = files
  .map((f) => `<figure>${readFileSync(f, 'utf8')}<figcaption>${basename(f)}</figcaption></figure>`)
  .join('');
const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>${css}
body{margin:0;padding:20px;background:#2a2622;font-family:serif;color:#eee}
.g{display:grid;grid-template-columns:repeat(${cols},${width}px);gap:18px;align-items:start}
figure{margin:0}figure svg{display:block;width:${width}px;height:auto;background:#f3ead8}
figcaption{font-size:12px;margin-top:4px}</style><body>${artDefs.replace('class="art defs"', 'class="art" style="position:absolute"')}<div class="g">${cells}</div></body></html>`;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 40 + Number(cols) * (Number(width) + 18), height: 400 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
