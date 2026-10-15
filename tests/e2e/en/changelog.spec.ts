/** “What’s new” in English: title-screen entry, release notes, axe, back to the title screen. */
import { axe, expect, gotoTitle, test } from './helpers';

test('What’s new: open from the title screen, English notes, axe, back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoTitle(page);
  await page.getByRole('button', { name: /^What’s new/ }).click();
  await expect(page.getByRole('heading', { name: 'What’s new', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const first = page.locator('article[data-version]').first();
  await expect(first.locator('.badge').first()).toHaveText(/(New|Improved|Fixed)/);
  await expect(page.getByText('First public release')).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
});
