import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Pages du site (sitemap + /design, page interne du design system). */
const PAGES = ['/', '/le-monde/', '/artbook/', '/charte/', '/presse/', '/credits/', '/design/'];

for (const path of PAGES) {
  test.describe(path, () => {
    test('200, lang="fr", lien d’évitement, aucune erreur ni violation CSP', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('h1')).toHaveCount(1);
      // Lien d'évitement : premier arrêt de tabulation, vers un élément existant.
      await page.keyboard.press('Tab');
      const skip = page.locator(':focus');
      await expect(skip).toHaveAttribute('href', /^#.+/);
      const target = (await skip.getAttribute('href'))!;
      await expect(page.locator(target)).toHaveCount(1);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      expect(errors).toEqual([]);
    });

    test('390 px : aucun défilement horizontal', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      const { scroll, width } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: window.innerWidth,
      }));
      expect(scroll).toBeLessThanOrEqual(width);
    });

    test('axe (WCAG 2.2 AA)', async ({ page }) => {
      await page.goto(path);
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const violations = r.violations.map(
        (v) =>
          `${v.id} (${v.nodes.length}) : ${v.nodes
            .slice(0, 3)
            .map((n) => n.target.join(' '))
            .join(' | ')}`,
      );
      expect(violations).toEqual([]);
    });
  });
}

test('page inconnue : 404 avec la page du site', async ({ page }) => {
  const res = await page.goto('/nexiste-pas');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('link', { name: /accueil/i }).first()).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(r.violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
});
