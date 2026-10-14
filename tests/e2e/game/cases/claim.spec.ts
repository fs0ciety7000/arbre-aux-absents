/**
 * Deux affaires (fixtures `mini` et `claim`, projet `game-cases`) : chemises d'affaire (E04),
 * case revendiquée (AFFAIRE-2 §1 : tirets, cartouche, valeurs déclarées, retirer / rétablir la
 * déclaration, souris et clavier), succès et crédits par affaire.
 * Dans `claim`, la case de Tomas (`s-tomas`) arrive remplie par une déclaration fausse sur le
 * visage et le métier : Tomas Morvan, « Garçon au visage rond », Meunier.
 */
import type { Locator, Page } from '@playwright/test';
import { desk, expect, gotoTitle, saveAndQuit, slotButton, test } from '../helpers';

const CLAIM = 'La requête du passeur';
const MINI = 'La malle du grenier';
const SLOT = 's-tomas';

const folders = (page: Page): Locator => page.getByRole('group', { name: 'Choisir une affaire' });
const sheet = (page: Page): Locator =>
  page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });

/** Titre → Nouvelle partie (affaire choisie) → Bureau, sans tutoriel. */
async function startCase(page: Page, title: string): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await folders(page).getByRole('radio', { name: title }).check();
  await page.getByRole('switch', { name: "J'ai déjà joué" }).click();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
}

test('E04 : une chemise par affaire, triées, la première choisie d’office', async ({ page }) => {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  const radios = folders(page).getByRole('radio');
  await expect(radios).toHaveCount(2);
  // `claim` porte order: 2, `mini` aucun : `claim` d'abord.
  await expect(radios.nth(0)).toHaveAccessibleName(CLAIM);
  await expect(radios.nth(1)).toHaveAccessibleName(MINI);
  await expect(radios.nth(0)).toBeChecked();
  await expect(radios.nth(0)).toHaveAccessibleDescription(/Non ouvert/);
  // Groupe radio natif : flèche = autre affaire.
  await radios.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeChecked();
});

test('case revendiquée : marque, nom accessible, retirer et rétablir la déclaration', async ({
  page,
}) => {
  await startCase(page, CLAIM);
  const live = page.locator('[aria-live="polite"][aria-atomic="true"].visually-hidden');
  await expect(live).toHaveText(/case de l’arbre est revendiquée/);

  const card = slotButton(page, SLOT);
  await expect(card).toHaveClass(/\bclaim-frame\b/);
  await expect(card.locator('.claim-tag')).toHaveText(/Déclaré/i);
  await expect(card).toHaveAccessibleName(/case revendiquée, non établie\./);
  await expect(card).toHaveAccessibleName(/Prénom : Tomas, déclaré\./);
  await expect(card).toHaveAccessibleName(/Métier : Meunier, déclaré\./);
  await expect(card.locator('.claim-value')).toHaveCount(3);
  // Pas compté dans « identifiés » tant que non établie.
  await expect(page.getByText(/^0 \/ \d+ identifiés$/).first()).toBeVisible();

  // Menu de la case : clic droit → fiche, mention « à vérifier ».
  await card.click({ button: 'right' });
  const s = sheet(page);
  await expect(s).toBeVisible();
  await expect(s).toContainText('Identité déclarée par le requérant : à vérifier.');

  // Retirer un champ (×) : la marque reste, le champ se vide.
  await s.getByRole('button', { name: 'Vider le champ Portrait' }).click();
  await expect(card).toHaveAccessibleName(/Portrait : à remplir\./);
  await expect(card).toHaveClass(/\bclaim-frame\b/);
  await expect(live).toHaveText(
    'Portrait déclaré retiré. Rétablir la déclaration : menu de la case.',
  );

  // Retirer la déclaration : case ordinaire.
  await s.getByRole('button', { name: 'Retirer la déclaration' }).click();
  await expect(card).not.toHaveClass(/\bclaim-frame\b/);
  await expect(card).not.toHaveAccessibleName(/revendiquée/);
  await expect(card.locator('.claim-tag')).toHaveCount(0);
  await expect(live).toHaveText(/Déclaration retirée : 3 champs vidés\./);

  // Rétablir la déclaration : tout revient (aucun champ posé, pas de confirmation).
  await s.getByRole('button', { name: 'Rétablir la déclaration' }).click();
  await expect(card).toHaveClass(/\bclaim-frame\b/);
  await expect(card).toHaveAccessibleName(/Portrait : Garçon au visage rond, déclaré\./);
  await expect(live).toHaveText('Déclaration rétablie.');
  await page.keyboard.press('Escape');
  await expect(s).toBeHidden();

  // Clavier : Maj+F10 sur la case ouvre le même menu.
  await card.focus();
  await page.keyboard.press('Shift+F10');
  await expect(s).toBeVisible();
  await expect(s.getByRole('button', { name: 'Retirer la déclaration' })).toBeVisible();
  await s.getByRole('button', { name: 'Retirer la déclaration' }).click();
  await page.keyboard.press('Escape');

  // Une déclaration retirée ne réapparaît pas au rechargement de la partie.
  await saveAndQuit(page);
  await page
    .getByRole('button', { name: /^Continuer/ })
    .first()
    .click();
  await expect(desk(page)).toBeVisible();
  await expect(slotButton(page, SLOT)).not.toHaveClass(/\bclaim-frame\b/);
  await expect(slotButton(page, SLOT)).toHaveAccessibleName(/case (ouverte|vide)$/);
});

test('succès et crédits : une section par affaire', async ({ page }) => {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Succès' }).first().click();
  for (const title of [CLAIM, MINI]) {
    const section = page.getByRole('region', { name: title });
    await expect(section).toBeVisible();
    await expect(section.getByText(/^\d+ \/ \d+ obtenus$/)).toBeVisible();
  }
  await page.getByRole('button', { name: 'Retour' }).first().click();
  await page.getByRole('button', { name: 'Crédits' }).first().click();
  await expect(page.getByRole('heading', { name: `Affaire : ${CLAIM}` })).toBeVisible();
  await expect(page.getByRole('heading', { name: `Affaire : ${MINI}` })).toBeVisible();
});
