import {
  dismissReveals,
  expect,
  lockGroup,
  openDocument,
  reader,
  readForElders,
  readForYounger,
  saveAndQuit,
  showPanel,
  slotButton,
  startNewGame,
  test,
} from './helpers';

test('sauvegarder et quitter, puis Continuer, restaure la partie', async ({ page }) => {
  await startNewGame(page);
  await readForElders(page);
  await lockGroup(page, ['s-ancel', 's-ida', 's-tomas']);
  await saveAndQuit(page);

  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(cont).toContainText('La malle du grenier');
  await cont.click();
  await expect(page.getByRole('main', { name: 'Bureau' })).toBeVisible();
  for (const slot of ['s-ancel', 's-ida', 's-tomas']) {
    await expect(slotButton(page, slot)).toHaveAccessibleName(/case établie$/);
  }
  await expect(slotButton(page, 's-maren')).toBeVisible();
  // Documents lus et recherches conservés.
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Acte de mariage');
  await expect(reader(page)).toContainText('Fait au Val-Dormant');
  await showPanel(page, 'Catalogue');
  await expect(page.getByRole('button', { name: 'Relancer « Ida Brask »' })).toBeVisible();

  // Après rechargement complet (IndexedDB), la partie est toujours là.
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer' }).first();
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.getByRole('button', { name: /^Continuer/ })).toBeVisible();
});

test('arbre complet → rapport final → dénouement', async ({ page }) => {
  test.setTimeout(120_000);
  await startNewGame(page);
  await readForElders(page);
  await lockGroup(page, ['s-ancel', 's-ida', 's-tomas']);
  await readForYounger(page);
  await lockGroup(page, ['s-lena', 's-maren', 's-oskar']);
  await dismissReveals(page);

  // Rapport final (une question : la malle ; la seconde n'est posée qu'avec le secret d'Edda).
  const report = page.getByRole('main');
  await expect(
    report.getByRole('heading', { name: 'Remettre le rapport', level: 1 }),
  ).toBeVisible();
  await expect(report).toContainText('Question 1 sur 1');

  // « Revenir au bureau » puis « Remettre le rapport » (en-tête) : le rapport revient.
  await report.getByRole('button', { name: 'Revenir au bureau' }).click();
  await expect(page.getByRole('main', { name: 'Bureau' })).toBeVisible();
  await page
    .getByRole('banner', { name: 'En-tête du bureau' })
    .getByRole('button', { name: 'Remettre le rapport' })
    .click();
  await expect(
    report.getByRole('heading', { name: 'Remettre le rapport', level: 1 }),
  ).toBeVisible();
  const submit = report.getByRole('button', { name: 'Remettre le rapport' });
  await expect(submit).toBeDisabled();
  await report.getByRole('radio', { name: 'Maren Morvan' }).check();
  await submit.click();
  const confirm = page.getByRole('dialog', { name: 'Remettre le rapport ?' });
  await expect(confirm).toContainText('Maren Morvan');
  await confirm.getByRole('button', { name: 'Remettre' }).click();

  // Dénouement : la fin sans le secret.
  await expect(page.getByRole('heading', { name: 'L’arbre retrouvé' })).toBeVisible();
  await expect(page.getByText('l’arbre des Morvan est complet')).toBeVisible();
  await page.getByRole('button', { name: 'Continuer l’enquête' }).click();
  await expect(page.getByRole('main', { name: 'Bureau' })).toBeVisible();
  await expect(page.getByRole('banner', { name: 'En-tête du bureau' })).toContainText(
    '6 personnes identifiées sur 6',
  );
  await dismissReveals(page);
});
