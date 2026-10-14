// Rendu Playwright : node shot.mjs <page.html> <out.(png|jpg|pdf)> <wmm> <hmm> [pxWidth]
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire('/home/user/arbre-aux-absents/package.json');
const { chromium } = require('playwright');
const [html, out, wmm, hmm, pxw] = process.argv.slice(2);
const W = Number(wmm), H = Number(hmm);
const cssW = (W * 96) / 25.4, cssH = (H * 96) / 25.4;
const browser = await chromium.launch();
const dsf = pxw ? Number(pxw) / cssW : 300 / 96;
const page = await browser.newPage({ viewport: { width: Math.ceil(cssW), height: Math.ceil(cssH) }, deviceScaleFactor: dsf });
await page.goto('file://' + resolve(html));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
if (out.endsWith('.pdf')) {
  // Chromium arrondit le format au pixel CSS : on imprime 1 mm plus grand, puis pdfbox.py fixe les boîtes exactes
  await page.pdf({ path: out, width: `${W + 1}mm`, height: `${H + 1}mm`, printBackground: true, pageRanges: '1', preferCSSPageSize: false, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
} else {
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: cssW, height: cssH }, type: out.endsWith('.jpg') ? 'jpeg' : 'png', ...(out.endsWith('.jpg') ? { quality: 92 } : {}) });
}
await browser.close();
console.log(out);
