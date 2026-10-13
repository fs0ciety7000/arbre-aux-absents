/**
 * Défauts relevés en revue QA, non corrigés (hors périmètre d'une correction locale) :
 * chaque test décrit le comportement attendu et est marqué `test.fail()` ; il échouera
 * (« passé inattendu ») le jour où le défaut sera corrigé, pour qu'on retire la marque.
 */
import { expect, startNewGame, test } from './helpers';

test('Options ouvertes depuis la pause : un seul #contenu, lien d’évitement utile', async ({
  page,
}) => {
  // Corrigé : seul l'écran actif porte id="contenu" (le Bureau inerte le cède à l'écran
  // ouvert par-dessus), « Aller au contenu » vise donc l'écran visible.
  await startNewGame(page);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Options' })
    .click();
  await expect(page.getByRole('heading', { name: 'Options', level: 1 })).toBeVisible();
  await expect(page.locator('.desk[inert]')).toHaveCount(1);
  await expect(page.locator('[id="contenu"]')).toHaveCount(1, { timeout: 2_000 });
});
