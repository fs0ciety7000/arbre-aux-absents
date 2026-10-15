/**
 * Dispositions du Bureau (PROPOSITION-INTERFACE option 2) : Enquête / Lecture / Arbre (sélecteur
 * de l'en-tête, Alt+1/2/3), fiche flottante déplaçable et mémorisée, plein écran du document
 * (bouton du Lecteur, de la fiche, Échap), aucun débordement horizontal, axe sans erreur.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { desk, expect, openDocument, reader, showPanel, startNewGame, test } from './helpers';

const DOC = 'Note du notaire';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const layoutButton = (page: Page, name: 'Enquête' | 'Lecture' | 'Arbre'): Locator =>
  page
    .getByRole('group', { name: 'Disposition du bureau' })
    .getByRole('button', { name: new RegExp(`^${name}`) });
const card = (page: Page): Locator =>
  page.getByRole('complementary', { name: 'Fiche des documents' });
const full = (page: Page): Locator => page.getByRole('region', { name: 'Document en plein écran' });

async function openNote(page: Page): Promise<void> {
  await showPanel(page, /^Archives/);
  await openDocument(page, DOC);
}

/** Laisse passer l'enregistrement différé du profil, recharge et reprend la partie. */
async function reloadAndContinue(page: Page): Promise<void> {
  await page.waitForTimeout(1_000);
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer', exact: true }).first();
  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(skip.or(cont).first()).toBeVisible();
  if (await skip.isVisible()) await skip.click({ timeout: 5_000 }).catch(() => undefined);
  await cont.click();
  await expect(desk(page)).toBeVisible();
}

/** Boîte d'un élément une fois son entrée animée terminée. */
async function settled(el: Locator) {
  await el.evaluate((node) =>
    Promise.all(node.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => null))),
  );
  return (await el.boundingBox())!;
}

async function axe(page: Page, selector: string): Promise<string[]> {
  const audit = await new AxeBuilder({ page }).include(selector).withTags(TAGS).analyze();
  return audit.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`);
}

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const right = Math.max(
      ...[...document.querySelectorAll('header button, .reader .toolbar button')]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0)
        .map((r) => r.right),
    );
    return Math.max(root.scrollWidth - root.clientWidth, right - root.clientWidth);
  });
}

test('changer de disposition : sélecteur et Alt+1/2/3', async ({ page }) => {
  await startNewGame(page);
  await openNote(page);
  const zones = desk(page);
  const side = page.locator('aside.side');
  await expect(layoutButton(page, 'Enquête')).toHaveAttribute('aria-pressed', 'true');

  // Lecture : le Lecteur prend ~60 % du Bureau, la poignée disparaît.
  await layoutButton(page, 'Lecture').click();
  await expect(layoutButton(page, 'Lecture')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[aria-live="polite"][aria-atomic="true"]')).toContainText(
    'Disposition : Lecture',
  );
  const zw = (await zones.boundingBox())!.width;
  await expect.poll(async () => (await side.boundingBox())!.width / zw).toBeGreaterThan(0.55);
  await expect(page.getByRole('separator', { name: 'Largeur du volet latéral' })).toHaveCount(0);
  await expect(reader(page).getByRole('heading', { name: DOC })).toBeVisible();

  // Arbre (Alt+3) : plus de volet, la fiche flottante porte le document.
  await page.keyboard.press('Alt+3');
  await expect(layoutButton(page, 'Arbre')).toHaveAttribute('aria-pressed', 'true');
  await expect(side).toHaveCount(0);
  await expect(card(page)).toBeVisible();
  await expect(card(page).getByRole('heading', { name: DOC })).toBeVisible();
  expect(await axe(page, '[data-testid="floating-card"]')).toEqual([]);
  expect(await axe(page, 'header')).toEqual([]);

  // Repliée en onglet, puis dépliée.
  await card(page).getByRole('button', { name: 'Replier la fiche' }).click();
  await expect(card(page).getByRole('heading', { name: DOC })).toHaveCount(0);
  await card(page)
    .getByRole('button', { name: /^Déplier la fiche/ })
    .click();
  await expect(card(page).getByRole('heading', { name: DOC })).toBeVisible();

  // « Vers l'arbre » depuis Lecture repasse en Enquête.
  await page.keyboard.press('Alt+2');
  await expect(layoutButton(page, 'Lecture')).toHaveAttribute('aria-pressed', 'true');
  await reader(page).getByRole('button', { name: 'Vers l’arbre' }).click();
  await expect(layoutButton(page, 'Enquête')).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Alt+3');
  await page.keyboard.press('Alt+1');
  await expect(layoutButton(page, 'Enquête')).toHaveAttribute('aria-pressed', 'true');
  await expect(side).toBeVisible();
});

test('fiche flottante : déplacée à la souris et au clavier, position mémorisée', async ({
  page,
}) => {
  await startNewGame(page);
  await layoutButton(page, 'Arbre').click();
  const grip = card(page).getByRole('button', { name: 'Déplacer la fiche' });
  const box0 = await settled(card(page));

  const g = (await grip.boundingBox())!;
  await page.mouse.move(g.x + 40, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x + 40 - 300, g.y + g.height / 2 + 120, { steps: 8 });
  await page.mouse.up();
  const box1 = (await card(page).boundingBox())!;
  expect(box1.x).toBeLessThan(box0.x - 250);
  expect(box1.y).toBeGreaterThan(box0.y + 80);

  // Bornée à l'écran : on ne la pousse pas hors du Bureau.
  await page.mouse.move(box1.x + 60, box1.y + 20);
  await page.mouse.down();
  await page.mouse.move(-500, 2000, { steps: 6 });
  await page.mouse.up();
  const vp = page.viewportSize()!;
  const box2 = (await card(page).boundingBox())!;
  expect(box2.x).toBeGreaterThanOrEqual(0);
  expect(box2.y + box2.height).toBeLessThanOrEqual(vp.height);

  // Clavier : flèches sur la poignée.
  await grip.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowUp');
  const box3 = (await card(page).boundingBox())!;
  expect(box3.x).toBeGreaterThan(box2.x + 10);
  expect(box3.y).toBeLessThan(box2.y - 40);

  await reloadAndContinue(page);
  await expect(layoutButton(page, 'Arbre')).toHaveAttribute('aria-pressed', 'true');
  const box4 = (await card(page).boundingBox())!;
  expect(Math.abs(box4.x - box3.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(box4.y - box3.y)).toBeLessThanOrEqual(2);
});

test('plein écran du document : depuis le Lecteur et la fiche, retour par bouton et Échap', async ({
  page,
}) => {
  await startNewGame(page);
  await openNote(page);
  const fullButton = reader(page).getByRole('button', { name: 'Plein écran' });
  await fullButton.click();
  await expect(full(page)).toBeVisible();
  await expect(full(page).getByRole('heading', { name: DOC })).toBeVisible();
  // Un seul Lecteur : le Bureau, dessous, est inerte.
  await expect(page.locator('.desk[inert]')).toHaveCount(1);
  await expect(page.locator('#reader-title')).toHaveCount(1);
  // A− / A+ actifs en plein écran.
  await full(page).getByRole('button', { name: 'Texte plus grand' }).click();
  await expect(full(page).getByRole('status')).toHaveText('Texte à 115 %');
  expect(await axe(page, '[data-testid="reader-full"]')).toEqual([]);
  expect(await overflow(page)).toBeLessThanOrEqual(0);

  await page.keyboard.press('Escape');
  await expect(full(page)).toHaveCount(0);
  await expect(page.locator('.desk[inert]')).toHaveCount(0);
  await expect(reader(page).getByRole('button', { name: 'Plein écran' })).toBeFocused();

  // Disposition Arbre : la fiche passe en plein écran, « Revenir en fiche ».
  await layoutButton(page, 'Arbre').click();
  await card(page).getByRole('button', { name: 'Plein écran' }).first().click();
  await expect(full(page)).toBeVisible();
  await full(page).getByRole('button', { name: 'Revenir en fiche' }).click();
  await expect(full(page)).toHaveCount(0);
  await expect(card(page).getByRole('heading', { name: DOC })).toBeVisible();
});

test('téléphone : pas de sélecteur, plein écran disponible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startNewGame(page);
  await expect(page.getByRole('group', { name: 'Disposition du bureau' })).toHaveCount(0);
  await openNote(page);
  await reader(page).getByRole('button', { name: 'Plein écran' }).click();
  await expect(full(page)).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  await page.keyboard.press('Escape');
  await expect(full(page)).toHaveCount(0);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
]) {
  test(`${viewport.width}×${viewport.height} : aucune disposition ne déborde`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await startNewGame(page);
    await openNote(page);
    for (const name of ['Enquête', 'Lecture', 'Arbre'] as const) {
      await layoutButton(page, name).click();
      await expect(layoutButton(page, name)).toHaveAttribute('aria-pressed', 'true');
      expect(await overflow(page), name).toBeLessThanOrEqual(0);
    }
    const c = (await card(page).boundingBox())!;
    expect(c.x + c.width).toBeLessThanOrEqual(viewport.width);
  });
}
