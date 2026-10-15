/**
 * Site anglais (D8, lot B3) vu d'un navigateur en-GB : aucune redirection automatique, `hreflang`
 * réciproques qui répondent tous en 200, sélecteur de langue vers la même page, sitemap bilingue,
 * liens « Jouer » avec l'indice `?lang=en`. Axe, 390 px et lien d'évitement de chaque page :
 * site/pages.spec.ts (pages FR et /en/).
 */
import type { Page } from '@playwright/test';
import { SITE, axe, expect, noHorizontalScroll, test } from './helpers';

/** Pages publiques (sitemap) en anglais. */
const EN_PAGES = [
  '/en/',
  '/en/le-monde/',
  '/en/artbook/',
  '/en/charte/',
  '/en/presse/',
  '/en/credits/',
  '/en/signaler/',
  '/en/suivi/',
  '/en/problemes-connus/',
  '/en/confidentialite/',
];

const PROD = 'https://arbre.cardormedia.com';
const local = (href: string) => href.replace(PROD, SITE);

async function alternates(page: Page): Promise<Record<string, string>> {
  const links = await page
    .locator('head link[rel="alternate"][hreflang]')
    .evaluateAll((els) =>
      els.map((e) => [e.getAttribute('hreflang')!, e.getAttribute('href')!] as const),
    );
  return Object.fromEntries(links);
}

test.beforeEach(async ({ page }) => {
  // Problèmes connus : service simulé (liste vide).
  await page.route('https://arbre-api.cardormedia.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '[]',
    }),
  );
});

test('navigateur en-GB sur / : le site reste en français (aucune redirection)', async ({
  page,
}) => {
  const res = await page.goto(`${SITE}/`);
  expect(res?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  // Le sélecteur propose la version anglaise de la même page.
  const nav = page.getByRole('navigation', { name: 'Langue' });
  await expect(nav.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en/');
});

for (const path of EN_PAGES) {
  test(`${path} : hreflang réciproques en 200, canonique, og:locale`, async ({ page, request }) => {
    await page.goto(`${SITE}${path}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const alt = await alternates(page);
    const fr = path.replace(/^\/en\//, '/');
    expect(alt).toEqual({
      fr: `${PROD}${fr}`,
      en: `${PROD}${path}`,
      'x-default': `${PROD}${fr}`,
    });
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${PROD}${path}`,
    );
    await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'en_GB',
    );
    for (const href of Object.values(alt)) {
      expect((await request.get(local(href))).status(), href).toBe(200);
    }
    // Réciprocité : la page française renvoie vers celle-ci.
    await page.goto(`${SITE}${fr}`);
    expect((await alternates(page)).en).toBe(`${PROD}${path}`);
  });
}

test('sélecteur de langue : même page dans l’autre langue, au clavier', async ({ page }) => {
  await page.goto(`${SITE}/en/le-monde/`);
  const nav = page.getByRole('navigation', { name: 'Language' });
  await expect(nav.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'true');
  const fr = nav.getByRole('link', { name: 'Français' });
  await expect(fr).toHaveAttribute('hreflang', 'fr');
  await fr.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`${SITE}/le-monde/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page
    .getByRole('navigation', { name: 'Langue' })
    .getByRole('link', { name: 'English' })
    .click();
  await expect(page).toHaveURL(`${SITE}/en/le-monde/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('pages anglaises : liens internes sous /en/, « Jouer » avec ?lang=en', async ({ page }) => {
  for (const path of EN_PAGES) {
    await page.goto(`${SITE}${path}`);
    const hrefs = await page
      .locator('main a[href^="/"], header a[href^="/"], footer a[href^="/"]')
      .evaluateAll((as) =>
        as
          .filter((a) => !a.closest('nav.lang'))
          .map((a) => a.getAttribute('href')!)
          // Ressources (fichiers du kit presse, illustrations) : sans langue.
          .filter((h) => !/\.(zip|pdf|svg|png|jpe?g|webp|txt|xml)$/.test(h)),
      );
    for (const h of hrefs) {
      expect(h.startsWith('/en/') || h.startsWith('/jouer/'), `${path} → ${h}`).toBe(true);
      if (h.startsWith('/jouer/')) expect(h, `${path} → ${h}`).toContain('lang=en');
    }
  }
});

test('sitemap : chaque page a sa version anglaise, déclarée en xhtml:link', async ({ request }) => {
  const xml = await (await request.get(`${SITE}/sitemap.xml`)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  const fr = locs.filter((l) => !l.startsWith(`${PROD}/en/`));
  expect(fr.length).toBeGreaterThan(3);
  for (const l of fr) {
    const en = l.replace(PROD, `${PROD}/en`);
    expect(locs, `version anglaise de ${l}`).toContain(en);
    expect((await request.get(local(en))).status(), en).toBe(200);
  }
  expect(xml).toContain('hreflang="x-default"');
});

test('/en/problemes-connus/ : axe, 390 px, liste vide en anglais', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${SITE}/en/problemes-connus/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).not.toHaveAttribute('aria-busy', 'true');
  await page.waitForLoadState('networkidle');
  await noHorizontalScroll(page);
  expect(await axe(page)).toEqual([]);
});
