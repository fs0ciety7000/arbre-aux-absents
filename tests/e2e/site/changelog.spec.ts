/**
 * Nouveautés du site (ARCHITECTURE §3.8) : page prérendue en français et en anglais, versions de
 * la plus récente à la plus ancienne, lien du pied de page, plan du site, aucun script de page.
 * (200, axe, 390 px et lien d'évitement : pages.spec.ts.)
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const VERSION = (
  JSON.parse(readFileSync(new URL('../../../apps/game/package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

for (const c of [
  {
    path: '/nouveautes/',
    h1: 'Nouveautés',
    current: 'Version actuelle\u00a0:',
    kinds: /(Nouveauté|Amélioration|Correction)/,
    first: 'Première version publique',
    footer: 'Nouveautés',
  },
  {
    path: '/en/nouveautes/',
    h1: 'What’s new',
    current: 'Current version:',
    kinds: /(New|Improved|Fixed)/,
    first: 'First public release',
    footer: 'What’s new',
  },
]) {
  test(`${c.path} : versions, plus récente d’abord, lien du pied de page`, async ({ page }) => {
    await page.goto(c.path);
    await expect(page.getByRole('heading', { name: c.h1, level: 1 })).toBeVisible();
    await expect(page.locator('p.current')).toHaveText(`${c.current} ${VERSION}`);
    const versions = await page.locator('ol.releases > li .mat-label').allInnerTexts();
    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions[0]).toContain(VERSION);
    await expect(page.locator('ol.releases > li').first().locator('.badge').first()).toHaveText(
      c.kinds,
    );
    await expect(page.getByRole('heading', { name: c.first, level: 2 })).toBeVisible();
    // Prérendu sans hydratation : aucun module de page.
    await expect(page.locator('script[type="module"]')).toHaveCount(0);

    const footer = page.getByRole('contentinfo');
    await footer.getByRole('link', { name: c.footer, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${c.path}$`));
  });
}

test('plan du site : les deux versions de la page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('/nouveautes/</loc>');
  expect(xml).toContain('/en/nouveautes/</loc>');
});
