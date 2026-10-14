/**
 * Tutoriel en bulles (GAME_DESIGN §15) : notes de service posées au fil des premiers gestes,
 * jamais bloquantes, passables, mémorisées dans le profil.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { desk, expect, gotoTitle, openDocument, reader, showPanel, test } from './helpers';

const note = (page: Page) => page.getByRole('complementary', { name: 'Note de service' });

/** Titre → Nouvelle partie (notes « Aucune » au choix) → Bureau. */
async function newGame(page: Page, alreadyPlayed = false): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  if (alreadyPlayed)
    await page
      .getByRole('combobox', { name: 'Notes de service' })
      .selectOption({ label: 'Aucune' });
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
}

/** Recharge la page et reprend la dernière partie. */
async function reloadAndContinue(page: Page): Promise<void> {
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer', exact: true }).first();
  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(skip.or(cont).first()).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await cont.click();
  await expect(desk(page)).toBeVisible();
}

test.describe('tutoriel en bulles', () => {
  test('première partie : la note suit les gestes, sans voler le focus', async ({ page }) => {
    await newGame(page);
    await expect(note(page)).toBeVisible();
    await expect(note(page)).toContainText('Le dossier attend dans les Archives');
    // Annoncée dans la région live polie de l'application.
    await expect(page.locator('[aria-live="polite"][aria-atomic="true"]')).toContainText(
      'Note de service : Bienvenue au bureau',
    );
    // Audit WCAG 2.2 AA de la note (contrastes, nom, cibles).
    const audit = await new AxeBuilder({ page })
      .include('[data-coachmark]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(audit.violations.map((v) => v.id)).toEqual([]);
    // Le focus n'est pas pris par la note.
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-coachmark]') ?? null),
    ).toBeNull();
    // Point d'ancrage : la note ne couvre pas sa cible (le premier document des Archives).
    await showPanel(page, /^Archives/);
    await openDocument(page, 'Note du notaire');
    // Geste fait : la note d'accueil se range, celle du Lecteur prend le relais.
    await expect(note(page)).toContainText('Chaque mot souligné est une piste');
    await expect(reader(page)).toBeVisible();

    // Échap range la note sans ouvrir la pause.
    await page.keyboard.press('Escape');
    await expect(note(page)).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Pause' })).toBeHidden();

    // Note suivante (Catalogue), « Compris » la range.
    await expect(note(page)).toContainText('Catalogue');
    await note(page).getByRole('button', { name: 'Compris' }).click();
    await expect(note(page)).toBeHidden();

    // Vue : elle ne revient pas après rechargement.
    await reloadAndContinue(page);
    await page.waitForTimeout(1_500);
    await expect(note(page)).toHaveCount(0);
  });

  test('Notes de service « Aucune » : aucune note', async ({ page }) => {
    await newGame(page, true);
    await showPanel(page, /^Archives/);
    await openDocument(page, 'Note du notaire');
    await page.waitForTimeout(1_500);
    await expect(note(page)).toHaveCount(0);
  });

  test('« Passer le tutoriel » : plus aucune note, même après rechargement', async ({ page }) => {
    await newGame(page);
    await expect(note(page)).toBeVisible();
    await note(page).getByRole('button', { name: 'Passer le tutoriel' }).click();
    await expect(note(page)).toHaveCount(0);
    await expect(page.locator('[aria-live="polite"][aria-atomic="true"]')).toContainText(
      'Tutoriel passé',
    );
    await showPanel(page, /^Archives/);
    await openDocument(page, 'Note du notaire');
    await page.waitForTimeout(1_500);
    await expect(note(page)).toHaveCount(0);

    await reloadAndContinue(page);
    await page.waitForTimeout(1_500);
    await expect(note(page)).toHaveCount(0);

    // Une nouvelle partie ne le relance pas non plus.
    await page.goto('./');
    await newGame(page);
    await page.waitForTimeout(1_500);
    await expect(note(page)).toHaveCount(0);
  });

  test('Aide › Revoir le tutoriel relance les notes', async ({ page }) => {
    await newGame(page, true);
    await showPanel(page, /^Archives/);
    await openDocument(page, 'Note du notaire');
    await showPanel(page, 'Aide');
    await page.getByRole('button', { name: 'Revoir le tutoriel' }).click();
    // Mode « revoir » : même un geste déjà fait est expliqué.
    await expect(note(page)).toContainText('Le dossier attend dans les Archives');
  });
});

test.describe('tutoriel au téléphone', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('la note tient dans l’écran, au-dessus de la barre d’onglets', async ({ page }) => {
    await newGame(page);
    await expect(note(page)).toBeVisible();
    await expect(note(page)).toContainText(/(touchez|cliquez sur) une première pièce/);
    const box = (await note(page).boundingBox())!;
    const bar = (await page.getByRole('navigation', { name: 'Onglets du bureau' }).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    expect(box.y + box.height).toBeLessThanOrEqual(bar.y + 1);
    // On joue à travers : l'onglet Archives reste accessible.
    await page.getByRole('tab', { name: /^Archives/ }).tap();
    await openDocument(page, 'Note du notaire');
    await expect(note(page)).toContainText('Chaque mot souligné');
  });
});
