/**
 * Rejouabilité (GAME_DESIGN §13.8) : rapport refait après le dénouement pour une autre fin, fins
 * découvertes sur le dénouement et la chemise E04 sans dévoiler les fins non vues, rapports remis
 * au Journal, emplacement dédié du mode chronométré.
 */
import {
  desk,
  dismissReveals,
  expect,
  lockGroup,
  readForElders,
  readForYounger,
  saveAndQuit,
  searchAndRead,
  showPanel,
  startNewGame,
  test,
} from './helpers';

const MINI = 'La malle du grenier';

test('refaire le rapport : une autre fin, fins découvertes, Journal, chemise E04', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await startNewGame(page);
  await readForElders(page);
  await lockGroup(page, ['s-ancel', 's-ida', 's-tomas']);
  await readForYounger(page);
  await lockGroup(page, ['s-lena', 's-maren', 's-oskar']);
  await dismissReveals(page);

  // Premier rapport : la fin sans le secret.
  const main = page.getByRole('main');
  await main.getByRole('radio', { name: 'Maren Morvan' }).check();
  await main.getByRole('button', { name: 'Remettre le rapport' }).click();
  await page
    .getByRole('dialog', { name: 'Remettre le rapport ?' })
    .getByRole('button', { name: 'Remettre' })
    .click();
  await expect(page.getByRole('heading', { name: 'L’arbre retrouvé' })).toBeVisible();

  // Fins découvertes : 1 / 2, la fin non vue reste anonyme.
  await expect(page.getByRole('heading', { name: 'Fins découvertes : 1 / 2' })).toBeVisible();
  const list = page.getByRole('list', { name: 'Fins de cette affaire' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list).toContainText('Fin non découverte');
  await expect(page.getByText('La voix d’Edda')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Refaire le rapport' })).toBeVisible();

  // Au téléphone : aucun défilement horizontal sur le dénouement.
  await page.setViewportSize({ width: 360, height: 780 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
  await page.setViewportSize({ width: 1440, height: 900 });

  // L'enquête continue : le secret d'Edda ouvre une décision, le rapport se refait de l'en-tête.
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  await expect(desk(page)).toBeVisible();
  await dismissReveals(page);
  await searchAndRead(page, 'Edda Brask', 'Lettre d’Edda');
  await dismissReveals(page);
  await page
    .getByRole('banner', { name: 'En-tête du bureau' })
    .getByRole('button', { name: 'Refaire le rapport' })
    .click();
  await expect(main.getByRole('heading', { name: 'Remettre le rapport', level: 1 })).toBeVisible();
  // Réponses gardées.
  await expect(main.getByRole('radio', { name: 'Maren Morvan' })).toBeChecked();
  await main.getByRole('button', { name: 'Suivante' }).click();
  await main.getByRole('radio', { name: 'Les garder' }).check();
  await main.getByRole('button', { name: 'Remettre le rapport' }).click();
  await page
    .getByRole('dialog', { name: 'Apposer ce tampon ?' })
    .getByRole('button', { name: 'Remettre' })
    .click();
  await expect(page.getByRole('heading', { name: 'La voix d’Edda' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fins découvertes : 2 / 2' })).toBeVisible();
  await expect(page.getByText('Toutes les fins de cette affaire sont découvertes.')).toBeVisible();

  // Journal : les deux rapports remis et la décision.
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  await expect(desk(page)).toBeVisible();
  await dismissReveals(page);
  await showPanel(page, 'Journal');
  const journal = page.getByRole('tabpanel', { name: 'Journal' });
  await expect(journal.getByText('Rapport remis : L’arbre retrouvé')).toBeVisible();
  await expect(journal.getByText('Rapport remis : La voix d’Edda')).toBeVisible();
  await expect(journal.getByText('Décision : Les garder')).toBeVisible();

  // Chemise E04 : fins découvertes ; le mode chronométré a son emplacement dédié.
  await saveAndQuit(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  const folder = page.getByRole('group', { name: 'Choisir une affaire' }).getByRole('radio', {
    name: MINI,
  });
  await expect(folder).toHaveAccessibleDescription(/fins découvertes 2 \/ 2/);
  await expect(page.getByRole('combobox', { name: 'Emplacement' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Mode' }).selectOption({ label: 'Chronométré' });
  await expect(page.getByTestId('timed-slot')).toHaveText(
    'Emplacement : partie chronométrée de cette affaire.',
  );
  await expect(page.getByRole('combobox', { name: 'Emplacement' })).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 780 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
});
