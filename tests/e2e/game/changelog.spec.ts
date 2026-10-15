/**
 * Nouveautés (ARCHITECTURE §3.8) : l'écran s'ouvre depuis le titre, montre la version installée
 * et les versions publiées (la plus récente d'abord), se parcourt au clavier, passe axe et revient
 * au titre ; la marque « Nouveau » du menu apparaît pour un joueur qui a déjà joué et disparaît
 * une fois les notes ouvertes.
 */
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, gotoTitle, skipLaunch, startNewGame, test } from './helpers';

const VERSION = (
  JSON.parse(readFileSync(new URL('../../../apps/game/package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

const entry = (page: Page) => page.getByRole('button', { name: /^Nouveautés/ });

async function axe(page: Page): Promise<string[]> {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const size of [
  { name: 'bureau', width: 1440, height: 900 },
  { name: '390 px', width: 390, height: 844 },
]) {
  test(`${size.name} : ouvrir depuis le titre, parcourir, axe, retour`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await gotoTitle(page);
    // Toute première visite : rien de « nouveau ».
    await expect(entry(page)).toHaveAccessibleName('Nouveautés');
    await entry(page).click();

    await expect(page.getByRole('heading', { name: 'Nouveautés', level: 1 })).toBeVisible();
    await expect(page.getByText(`Version ${VERSION}`, { exact: true }).first()).toBeVisible();
    const releases = page.locator('article[data-version]');
    expect(await releases.count()).toBeGreaterThanOrEqual(2);
    await expect(releases.first()).toHaveAttribute('data-version', VERSION);
    await expect(releases.first().locator('.badge').first()).toHaveText(
      /(Nouveauté|Amélioration|Correction)/,
    );

    const { scroll, width } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(width);
    expect(await axe(page)).toEqual([]);

    // Clavier : Retour, puis chaque version est un arrêt de focus.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Retour' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(releases.first()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(releases.nth(1)).toBeFocused();

    // Échap (retour global) : écran titre.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeVisible();
    await expect(entry(page)).toBeVisible();
  });
}

test('marque « Nouveau » : présente après avoir joué, retirée une fois les notes ouvertes', async ({
  page,
}) => {
  await startNewGame(page);
  // Profil et secours enregistrés, puis retour au titre par un rechargement.
  await page.waitForTimeout(2_500);
  await page.reload();
  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(
    page.getByRole('button', { name: 'Passer', exact: true }).first().or(cont).first(),
  ).toBeVisible();
  await skipLaunch(page);
  await expect(cont).toBeVisible();

  await expect(entry(page)).toHaveAccessibleName('Nouveautés Nouveau');
  await entry(page).click();
  await expect(page.getByRole('heading', { name: 'Nouveautés', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(entry(page)).toHaveAccessibleName('Nouveautés');

  // Mémorisé dans le profil : toujours absente après un rechargement.
  await page.waitForTimeout(1_000);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Passer', exact: true }).first().or(cont).first(),
  ).toBeVisible();
  await skipLaunch(page);
  await expect(cont).toBeVisible();
  await expect(entry(page)).toHaveAccessibleName('Nouveautés');
});
