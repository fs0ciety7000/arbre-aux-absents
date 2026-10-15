/**
 * Plusieurs affaires, vu depuis la fixture `mini` (une seule affaire) : le choix d'affaire (E04),
 * les succès et les crédits fonctionnent avec une affaire comme avec plusieurs. Le cas à deux
 * affaires est couvert par `cases/claim.spec.ts` (projet `game-cases`).
 */
import { desk, expect, gotoTitle, test } from './helpers';

const MINI = 'La malle du grenier';

test('E04 : chemise d’affaire choisie d’office, au clavier comme à la souris', async ({ page }) => {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  const group = page.getByRole('group', { name: 'Choisir une affaire' });
  const radios = group.getByRole('radio');
  await expect(radios.first()).toBeChecked();
  await expect(group.getByRole('radio', { name: MINI })).toHaveAccessibleDescription(/Non ouvert/);
  // Le bouton radio natif couvre toute la chemise : un clic n'importe où la choisit.
  await group.getByRole('radio', { name: MINI }).click();
  await expect(group.getByRole('radio', { name: MINI })).toBeChecked();
  await group.getByRole('radio', { name: MINI }).focus();
  await page.keyboard.press('Space');
  await expect(group.getByRole('radio', { name: MINI })).toBeChecked();
  await page.getByRole('combobox', { name: 'Notes de service' }).selectOption({ label: 'Aucune' });
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
});

test('succès et crédits rangés par affaire', async ({ page }) => {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Succès' }).first().click();
  const section = page.getByRole('region', { name: MINI });
  await expect(section).toBeAttached();
  await expect(section.getByText(/^\d+ \/ \d+ obtenus$/)).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).first().click();
  await page.getByRole('button', { name: 'Crédits' }).first().click();
  await expect(page.getByRole('heading', { name: `Affaire : ${MINI}` })).toBeVisible();
});

test('retour au titre pendant que sa scène s’escamote encore : un menu neuf, accessible', async ({
  page,
}) => {
  await gotoTitle(page);
  // Transitions ralenties (×20) : la scène du titre sort encore quand le joueur y revient, comme
  // pour un joueur rapide sur une machine lente. `dispatchEvent` : rien n'attend la fin des
  // mouvements, c'est tout l'objet du test.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.05 });
  await page.getByRole('button', { name: 'Succès' }).first().dispatchEvent('click');
  await expect(page.getByRole('region', { name: MINI })).toBeAttached();
  await page.getByRole('button', { name: 'Retour' }).first().dispatchEvent('click');
  // Une seule scène du titre visible des technologies d'assistance, avec son `#contenu`.
  await expect(page.getByRole('button', { name: 'Crédits' })).toHaveCount(1);
  await expect(page.locator('#contenu')).toHaveCount(1);
  await expect(page.locator('main#contenu.title-screen')).toBeAttached();
  await page.getByRole('button', { name: 'Crédits' }).dispatchEvent('click');
  await expect(page.getByRole('heading', { name: `Affaire : ${MINI}` })).toBeAttached();
});
