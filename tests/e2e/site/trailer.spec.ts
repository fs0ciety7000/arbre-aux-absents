import { expect, test } from '@playwright/test';

/**
 * Bande-annonce de l'accueil : façade (affiche locale, aucune requête vers YouTube), lecteur
 * youtube-nocookie.com au clic seulement, autorisé par la CSP (`frame-src`), repli sans JS.
 * YouTube n'est jamais joint : le lecteur est remplacé par une page vide.
 */
const EMBED = /^https:\/\/www\.youtube-nocookie\.com\/embed\/rHGYNDYgdhg\?autoplay=1&rel=0$/;
const WATCH = 'https://www.youtube.com/watch?v=rHGYNDYgdhg';

test.describe('bande-annonce', () => {
  test('façade puis lecteur au clic, sans requête YouTube avant', async ({ page }) => {
    const youtube: string[] = [];
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('request', (r) => {
      if (/youtube|ytimg|googlevideo/.test(r.url())) youtube.push(r.url());
    });
    await page.route(/youtube-nocookie\.com/, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>lecteur</title><p>lecteur</p>',
      }),
    );

    const res = await page.goto('/');
    const csp = res?.headers()['content-security-policy'] ?? '';
    expect(csp).toMatch(/frame-src https:\/\/itch\.io https:\/\/www\.youtube-nocookie\.com;/);

    const section = page.locator('section', {
      has: page.getByRole('heading', { level: 2, name: /sous la lampe/ }),
    });
    const facade = section.getByRole('button', { name: /Lire la bande-annonce/ });
    await facade.scrollIntoViewIfNeeded();
    await expect(facade).toBeVisible();
    await expect(facade).toHaveAttribute('href', WATCH);
    const poster = section.locator('img.trailer-poster');
    await expect(poster).toBeVisible();
    expect(await poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    // 16:9, mesuré sur la mise en page (la révélation au défilement incline le cadre).
    const ratio = await section
      .locator('.trailer')
      .evaluate((el: HTMLElement) => el.offsetWidth / el.offsetHeight);
    expect(Math.abs(ratio - 16 / 9)).toBeLessThan(0.02);
    await expect(section.locator('iframe')).toHaveCount(0);
    expect(youtube).toEqual([]);

    // Clavier : Tab jusqu'à la façade, puis Entrée.
    await facade.focus();
    await page.keyboard.press('Enter');
    const frame = section.locator('iframe');
    await expect(frame).toHaveAttribute('src', EMBED);
    await expect(frame).toHaveAttribute('title', /Bande-annonce/);
    await expect(frame).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.frameLocator('iframe.trailer-frame').locator('p')).toHaveText('lecteur');
    expect(youtube.every((u) => u.startsWith('https://www.youtube-nocookie.com/embed/'))).toBe(
      true,
    );
    expect(errors.filter((e) => /Content Security Policy|Refused/.test(e))).toEqual([]);
  });

  test('clic à la souris : le lecteur remplace la façade', async ({ page }) => {
    await page.route(/youtube-nocookie\.com/, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>lecteur</title><p>lecteur</p>',
      }),
    );
    await page.goto('/');
    await page.getByRole('button', { name: /Lire la bande-annonce/ }).click();
    await expect(page.locator('iframe.trailer-frame')).toHaveAttribute('src', EMBED);
    await expect(page.getByRole('button', { name: /Lire la bande-annonce/ })).toHaveCount(0);
  });

  test('sans JS : un lien vers YouTube', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const link = page.getByRole('link', { name: /Lire la bande-annonce/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', WATCH);
    await expect(page.locator('iframe.trailer-frame')).toHaveCount(0);
    await context.close();
  });

  test('VideoObject en JSON-LD et og:video', async ({ page }) => {
    await page.goto('/');
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    expect(ld).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      embedUrl: 'https://www.youtube-nocookie.com/embed/rHGYNDYgdhg',
      contentUrl: WATCH,
      duration: 'PT1M0S',
    });
    expect(ld.thumbnailUrl[0]).toMatch(/^https:\/\/arbre\.cardormedia\.com\/trailer\/.+\.jpg$/);
    await expect(page.locator('meta[property="og:video"]')).toHaveAttribute(
      'content',
      'https://www.youtube-nocookie.com/embed/rHGYNDYgdhg',
    );
  });
});
