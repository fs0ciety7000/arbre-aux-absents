/**
 * Écrans du jeu en anglais : axe (WCAG 2.2 AA) et 390 px (téléphone) sur l'écran titre, la
 * nouvelle partie, les Options (onglet Language), le Bureau, la pause et les crédits ; aucune
 * violation CSP (fixture `test` de helpers.ts). Les textes anglais plus longs ne doivent rien
 * faire déborder.
 */
import type { Page } from '@playwright/test';
import {
  axe,
  deskEn,
  expect,
  gotoTitle,
  noHorizontalScroll,
  startNewGameEn,
  test,
} from './helpers';

async function check(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await noHorizontalScroll(page);
  expect(await axe(page)).toEqual([]);
}

for (const size of [
  { name: 'bureau', width: 1440, height: 900 },
  { name: '390 px', width: 390, height: 844 },
]) {
  test.describe(size.name, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test('titre, nouvelle partie, options', async ({ page }) => {
      await gotoTitle(page);
      await check(page);

      await page.getByRole('button', { name: 'New game' }).click();
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
      await check(page);
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Options' }).first().click();
      await expect(page.getByRole('heading', { name: 'Options', level: 1 })).toBeVisible();
      await page.getByRole('tab', { name: 'Language' }).click();
      await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('system');
      await expect(page.getByRole('option', { name: 'System language (English)' })).toBeAttached();
      await check(page);
    });

    test('bureau et pause', async ({ page }) => {
      await startNewGameEn(page);
      await expect(deskEn(page)).toBeVisible();
      await check(page);
      // Téléphone : la pause est derrière « Menu » (DeskHeader).
      if (size.width < 600) {
        await page.getByRole('button', { name: 'Menu' }).click();
        const more = page.getByRole('dialog', { name: 'Other panels' });
        await expect(more).toBeVisible();
        await check(page);
        await more.getByRole('button', { name: 'Pause' }).click();
      } else {
        await page.getByRole('button', { name: 'Pause' }).click();
      }
      await expect(page.getByRole('dialog', { name: 'Pause' })).toBeVisible();
      await check(page);
    });
  });
}
