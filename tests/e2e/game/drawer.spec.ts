/**
 * Tablette en portrait : les panneaux secondaires (Lecteur, Archives, Catalogue, Carnet…)
 * s'ouvrent dans un tiroir bas à deux crans (40 % / 90 %) posé sur la dernière chemise
 * (ECRANS §3.2, DESIGN §5.3). Poignée : toucher, clavier (Entrée, ↑ ↓) ou glisser.
 */
import type { Page } from '@playwright/test';
import { desk, expect, openDocument, reader, showPanel, startNewGame, test } from './helpers';

const SHOTS = process.env.E2E_SHOTS_DIR;

test.use({ viewport: { width: 800, height: 1280 }, isMobile: true, hasTouch: true });

const drawer = (page: Page) => desk(page).getByRole('region', { name: 'Tiroir' });
const grip = (page: Page) =>
  drawer(page)
    .getByRole('button', { name: /tiroir$/ })
    .first();

/** Hauteur du tiroir en fraction de la zone principale (après la transition). */
async function fraction(page: Page): Promise<number> {
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const d = document.querySelector('.drawer')!.getBoundingClientRect();
    const z = document.querySelector('.single-main')!.getBoundingClientRect();
    return d.height / z.height;
  });
}

test('le Lecteur s’ouvre dans un tiroir au-dessus de l’Arbre', async ({ page }) => {
  await startNewGame(page);
  await expect(drawer(page)).toHaveCount(0);
  await showPanel(page, /^Archives/);
  await expect(drawer(page)).toBeVisible();
  // L'Arbre reste affiché sous le tiroir.
  await expect(desk(page).locator('.tree-panel')).toBeVisible();
  await openDocument(page, 'Note du notaire');
  await expect(drawer(page)).toBeVisible();
  await expect(reader(page)).toBeVisible();
  await expect(drawer(page).getByRole('tabpanel', { name: 'Lecteur' })).toBeVisible();

  // Premier cran : 40 %.
  const g = drawer(page).getByRole('button', { name: 'Agrandir ou réduire le tiroir' });
  await expect(g).toHaveAttribute('aria-expanded', 'false');
  expect(await fraction(page)).toBeCloseTo(0.4, 1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/drawer-half.png` });

  // Toucher la poignée = cran suivant (90 %), puis retour.
  await g.click();
  await expect(g).toHaveAttribute('aria-expanded', 'true');
  expect(await fraction(page)).toBeCloseTo(0.9, 1);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/drawer-full.png` });
  await g.click();
  await expect(g).toHaveAttribute('aria-expanded', 'false');

  // Clavier : ↑ / ↓, Entrée.
  await g.focus();
  await page.keyboard.press('ArrowUp');
  await expect(g).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(g).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(g).toHaveAttribute('aria-expanded', 'true');

  // Glisser la poignée vers le bas : retombe au premier cran.
  const b = (await g.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + 500, { steps: 8 });
  await page.mouse.up();
  await expect(g).toHaveAttribute('aria-expanded', 'false');
  expect(await fraction(page)).toBeCloseTo(0.4, 1);

  // Fermer : la chemise de l'Arbre reprend la zone.
  await drawer(page).getByRole('button', { name: 'Fermer le tiroir' }).click();
  await expect(drawer(page)).toHaveCount(0);
  await expect(desk(page).locator('#desk-bar-panel')).toHaveAccessibleName('Arbre');
});

test('Échap ferme le tiroir ; la Carte reste dessous', async ({ page }) => {
  await startNewGame(page);
  await showPanel(page, 'Carte');
  await showPanel(page, 'Catalogue');
  await expect(drawer(page)).toBeVisible();
  await expect(desk(page).locator('.map-panel')).toBeVisible();
  await grip(page).press('Escape');
  await expect(drawer(page)).toHaveCount(0);
  await expect(desk(page).locator('#desk-bar-panel')).toHaveAccessibleName('Carte');
});

test.describe('mouvement réduit', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });
  test('le tiroir change de cran sans transition longue', async ({ page }) => {
    await startNewGame(page);
    await showPanel(page, 'Carnet');
    await expect(drawer(page)).toBeVisible();
    await page.waitForTimeout(300);
    await grip(page).click();
    await expect(grip(page)).toHaveAttribute('aria-expanded', 'true');
    const long = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => Number(a.effect?.getComputedTiming().duration ?? 0) > 150)
        .map((a) => {
          const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
          const name = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty;
          return `${name} ${el?.tagName}.${el?.getAttribute('class')}`;
        }),
    );
    expect(long).toEqual([]);
  });
});
