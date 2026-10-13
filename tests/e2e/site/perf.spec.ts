/**
 * LCP de l'accueil sous bridage façon Lighthouse (CDP, Chromium). Mesure, pas porte de CI :
 * lancé seulement avec E2E_PERF=1 (sensible à la machine). Cible CLAUDE.md : LCP < 2 s.
 *   mobile  : « Slow 4G » appliqué (RTT 562,5 ms, 1,47 Mbit/s), CPU ×4, 412 × 823
 *   desktop : RTT 40 ms, 10 Mbit/s, CPU ×1, 1350 × 940
 */
import { expect, test, type Page } from '@playwright/test';

test.skip(!process.env.E2E_PERF, 'mesure de performance : E2E_PERF=1');

const PROFILES = {
  mobile: { viewport: { width: 412, height: 823 }, latency: 562.5, kbps: 1474.56, cpu: 4 },
  desktop: { viewport: { width: 1350, height: 940 }, latency: 40, kbps: 10240, cpu: 1 },
};

async function lcp(page: Page, profile: keyof typeof PROFILES): Promise<number> {
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
  await page.addInitScript(() => {
    (window as unknown as { __lcp: number }).__lcp = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        (window as unknown as { __lcp: number }).__lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/', { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(1_000);
  return page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
}

test('accueil, desktop : LCP < 2 s', async ({ page }) => {
  const t = await lcp(page, 'desktop');
  test.info().annotations.push({ type: 'LCP desktop (ms)', description: String(Math.round(t)) });
  expect(t).toBeLessThan(2_000);
});

test('accueil, mobile Slow 4G : LCP < 2 s', async ({ page }) => {
  // Connu (revue QA) : ~2,4–2,6 s. 6 feuilles CSS bloquantes + 186 Ko gzip de HTML (carte et
  // portraits en ligne). Retirer `test.fail` quand la correction (CSS en ligne) sera faite.
  test.fail();
  const t = await lcp(page, 'mobile');
  test.info().annotations.push({ type: 'LCP mobile (ms)', description: String(Math.round(t)) });
  expect(t).toBeLessThan(2_000);
});
