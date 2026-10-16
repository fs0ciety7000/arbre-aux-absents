/**
 * LCP de l'écran d'ouverture du jeu (build web réel, pas la fixture) sous bridage façon
 * Lighthouse (CDP, Chromium). Mesure, pas porte de CI : lancé seulement avec E2E_PERF=1.
 *   E2E_PERF=1 npm run test:e2e -- --project=game perf
 * E04 (choix de l'affaire) : délai entre le clic sur « Nouvelle partie » et les chemises, et octets
 * reçus pendant ce délai (l'écran ne lit que l'index des affaires, ARCHITECTURE §3.3).
 * Sert `apps/game/dist` (ou E2E_PERF_ROOT, ex. `apps/game/dist-demo`) en gzip, comme itch.io,
 * sur un port à part (E2E_PERF_PORT, défaut 4322). Construire d'abord : `npm run build -w @arbre/game`.
 *   mobile  : « Slow 4G » (RTT 562,5 ms, 1,47 Mbit/s), CPU ×4, 412 × 823
 *   desktop : RTT 40 ms, 10 Mbit/s, CPU ×1, 1350 × 940
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { expect, test, type CDPSession, type Page } from '@playwright/test';

test.skip(!process.env.E2E_PERF, 'mesure de performance : E2E_PERF=1');
test.describe.configure({ mode: 'default' });

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const root = resolve(repo, process.env.E2E_PERF_ROOT ?? 'apps/game/dist');
const port = Number(process.env.E2E_PERF_PORT ?? 4322);
const origin = `http://localhost:${port}`;

const PROFILES = {
  mobile: { viewport: { width: 412, height: 823 }, latency: 562.5, kbps: 1474.56, cpu: 4 },
  desktop: { viewport: { width: 1350, height: 940 }, latency: 40, kbps: 10240, cpu: 1 },
};

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

let server: Server | undefined;

test.beforeAll(async () => {
  if (!existsSync(join(root, 'index.html'))) throw new Error(`build absent : ${root}`);
  const gz = new Map<string, Buffer>();
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', origin);
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    let file = resolve(root, rel || 'index.html');
    if (file !== root && !file.startsWith(root + sep)) return void res.writeHead(400).end();
    if (!existsSync(file) || !statSync(file).isFile()) file = join(root, 'index.html');
    const ext = extname(file);
    let body: Uint8Array = readFileSync(file);
    const headers: Record<string, string> = {
      'content-type': TYPES[ext] ?? 'application/octet-stream',
    };
    if (ext !== '.woff2') {
      if (!gz.has(file)) gz.set(file, gzipSync(body, { level: 9 }));
      body = gz.get(file)!;
      headers['content-encoding'] = 'gzip';
    }
    res.writeHead(200, headers).end(body);
  });
  await new Promise<void>((ok) => server!.listen(port, ok));
});

test.afterAll(async () => {
  await new Promise<void>((ok) => (server ? server.close(() => ok()) : ok()));
});

interface Measure {
  lcp: number;
  element: string;
  fcp: number;
  /** Écran titre interactif (« Nouvelle partie » visible), après l'écran de lancement. */
  title: number;
}

async function throttle(page: Page, profile: keyof typeof PROFILES): Promise<CDPSession> {
  const p = PROFILES[profile];
  await page.setViewportSize(p.viewport);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: p.latency,
    downloadThroughput: (p.kbps * 1024) / 8,
    uploadThroughput: (p.kbps * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: p.cpu });
  return cdp;
}

async function measure(page: Page, profile: keyof typeof PROFILES): Promise<Measure> {
  await throttle(page, profile);
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: { t: number; el: string } };
    w.__lcp = { t: 0, el: '' };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
        const el = e.element;
        w.__lcp = {
          t: e.startTime,
          el: el ? `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}` : '?',
        };
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(`${origin}/`, { waitUntil: 'load', timeout: 90_000 });
  // Laisse l'écran de lancement puis le titre se peindre (LCP final, sans interaction).
  await page
    .getByRole('button', { name: 'Nouvelle partie' })
    .waitFor({ state: 'visible', timeout: 90_000 });
  const title = await page.evaluate(() => performance.now());
  await page.waitForTimeout(1_000);
  return page.evaluate((title) => {
    const w = window as unknown as { __lcp: { t: number; el: string } };
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    return { lcp: w.__lcp.t, element: w.__lcp.el, fcp, title };
  }, title);
}

function report(profile: string, m: Measure): void {
  const info = test.info();
  info.annotations.push(
    { type: `FCP ${profile} (ms)`, description: String(Math.round(m.fcp)) },
    { type: `LCP ${profile} (ms)`, description: `${Math.round(m.lcp)} (${m.element})` },
    { type: `Titre interactif ${profile} (ms)`, description: String(Math.round(m.title)) },
  );
  console.log(
    `[perf] ${profile} : FCP ${Math.round(m.fcp)} ms, LCP ${Math.round(m.lcp)} ms (${m.element}), ` +
      `titre interactif ${Math.round(m.title)} ms`,
  );
}

test('jeu web, desktop : LCP < 2 s', async ({ page }) => {
  const m = await measure(page, 'desktop');
  report('desktop', m);
  expect(m.lcp).toBeLessThan(2_000);
});

test('jeu web, mobile Slow 4G : LCP < 2,5 s', async ({ page }) => {
  test.setTimeout(150_000);
  const m = await measure(page, 'mobile');
  report('mobile', m);
  expect(m.lcp).toBeLessThan(2_500);
});

/**
 * E04 : écran titre atteint (logo passé), puis clic sur « Nouvelle partie » jusqu'aux chemises.
 * Octets : `encodedDataLength` (gzip) des réponses terminées pendant ce délai.
 */
async function measureCaseChoice(page: Page, profile: keyof typeof PROFILES) {
  const cdp = await throttle(page, profile);
  await page.goto(`${origin}/`, { waitUntil: 'load', timeout: 90_000 });
  const newGame = page.getByRole('button', { name: 'Nouvelle partie' });
  await newGame.waitFor({ state: 'visible', timeout: 90_000 });
  const skip = page.getByRole('button', { name: 'Passer' });
  if (await skip.isVisible()) await skip.click().catch(() => undefined);
  await page.waitForTimeout(2_500);
  const urls = new Map<string, string>();
  let bytes = 0;
  const files: string[] = [];
  cdp.on('Network.responseReceived', (e) => urls.set(e.requestId, e.response.url));
  cdp.on('Network.loadingFinished', (e) => {
    bytes += e.encodedDataLength;
    const url = urls.get(e.requestId);
    if (url) files.push(`${url.split('/').pop()} ${(e.encodedDataLength / 1024).toFixed(1)} Ko`);
  });
  const t0 = await page.evaluate(() => performance.now());
  await newGame.click();
  await page.locator('input[name="case"]').first().waitFor({ state: 'attached', timeout: 90_000 });
  await page.getByRole('button', { name: 'Commencer' }).waitFor({ state: 'visible' });
  const ms = (await page.evaluate(() => performance.now())) - t0;
  return { ms, bytes, files };
}

for (const profile of ['mobile', 'desktop'] as const) {
  test(`jeu web, ${profile} : E04 (choix de l'affaire)`, async ({ page }) => {
    test.setTimeout(150_000);
    const m = await measureCaseChoice(page, profile);
    test.info().annotations.push({
      type: `E04 ${profile} (ms)`,
      description: `${Math.round(m.ms)} (${(m.bytes / 1024).toFixed(1)} Ko)`,
    });
    console.log(
      `[perf] E04 ${profile} : ${Math.round(m.ms)} ms, ${(m.bytes / 1024).toFixed(1)} Ko reçus\n  ` +
        m.files.join('\n  '),
    );
  });
}
