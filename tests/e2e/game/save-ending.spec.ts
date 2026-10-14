import AxeBuilder from '@axe-core/playwright';
import {
  dismissReveals,
  expect,
  lockGroup,
  openDocument,
  reader,
  readForElders,
  readForYounger,
  saveAndQuit,
  searchAndRead,
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

test('rapport final : la décision en tampons, option grisée avec sa raison', async ({ page }) => {
  test.setTimeout(150_000);
  await startNewGame(page);
  // Le secret d'Edda pose la seconde question, une décision (`choice`).
  await searchAndRead(page, 'Edda Brask', 'Lettre d’Edda');
  await dismissReveals(page);
  await readForElders(page);
  await lockGroup(page, ['s-ancel', 's-ida', 's-tomas']);
  await readForYounger(page);
  await lockGroup(page, ['s-lena', 's-maren', 's-oskar']);
  await dismissReveals(page);

  const report = page.getByRole('main');
  await expect(report).toContainText('Question 1 sur 2');
  await report.getByRole('radio', { name: 'Maren Morvan' }).check();
  await report.getByRole('button', { name: 'Suivante' }).click();
  await expect(report).toContainText('Question 2 sur 2');

  // Trois tampons dans un groupe radio nommé par la question.
  const group = report.getByRole('group', { name: "Que faire des lettres d'Edda ?" });
  await expect(group.getByRole('radio')).toHaveCount(3);
  const burn = group.getByRole('radio', { name: 'Les brûler' });
  const keep = group.getByRole('radio', { name: 'Les garder' });
  const hand = group.getByRole('radio', { name: 'Les remettre au registre de Val-Dormant' });
  // Indisponible : grisée, raison visible et lue en description, piste rouverte.
  await expect(hand).toBeDisabled();
  await expect(hand).toHaveAccessibleDescription(
    'Indisponible : Le registre de Val-Dormant n’a pas été consulté.',
  );
  await expect(report.getByText('Le registre de Val-Dormant n’a pas été consulté.')).toBeVisible();
  await expect(report.getByRole('button', { name: 'Revenir au dossier' })).toBeVisible();

  // Audit WCAG 2.2 AA des tampons (grisé compris), puis au téléphone : empilés, sans défilement.
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations.map((v) => `${v.id} : ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
  if (process.env.E2E_SHOTS)
    await page.screenshot({
      path: `${process.env.E2E_SHOTS}/decision-desktop.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 360, height: 780 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(360);
  if (process.env.E2E_SHOTS)
    await page.screenshot({ path: `${process.env.E2E_SHOTS}/decision-phone.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  // Clavier : les flèches parcourent les tampons disponibles et sautent l'indisponible.
  await burn.check();
  await burn.focus();
  await page.keyboard.press('ArrowRight');
  await expect(keep).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(burn).toBeChecked();
  await page.keyboard.press('ArrowRight');
  await expect(keep).toBeChecked();
  await expect(hand).not.toBeChecked();
  if (process.env.E2E_SHOTS)
    await page.screenshot({ path: `${process.env.E2E_SHOTS}/decision-checked.png` });

  // Confirmation : « Apposer ce tampon ? », focus initial sur « Relire ».
  await report.getByRole('button', { name: 'Remettre le rapport' }).click();
  const confirm = page.getByRole('dialog', { name: 'Apposer ce tampon ?' });
  await expect(confirm).toContainText('Les garder');
  await expect(confirm.getByRole('button', { name: 'Relire' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Remettre' }).click();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).not.toHaveText(
    'Remettre le rapport',
  );
});
