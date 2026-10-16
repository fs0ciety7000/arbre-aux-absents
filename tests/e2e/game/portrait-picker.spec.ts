/**
 * Choix d'un portrait (Sélecteur de candidat P10, champ Portrait) : grande boîte, grille de
 * visages à descriptions repliées (complètes dans le nom accessible et sur demande), filtre
 * plein texte et « document ouvert », clavier (flèches, Entrée, retour du focus), axe,
 * 390 px sans défilement horizontal. Retour de jeu : « ça va devenir ingérable une fois que
 * j'aurai débloqué tous les portraits ».
 */
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  desk,
  expect,
  readForElders,
  showPanel,
  skipLaunch,
  slotButton,
  startNewGame,
  test,
} from './helpers';

const SHOTS = process.env.E2E_PICKER_SHOTS;

/** axe sur la boîte du sélecteur seulement (le Bureau derrière est inerte). */
async function axe(page: Page, picker: Locator): Promise<string[]> {
  const r = await new AxeBuilder({ page })
    .include(`#${await picker.getAttribute('id')}`)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

/** Lit les documents des aînés (5 visages) puis ouvre le choix du portrait d'Ida. */
async function openPortraitPicker(page: Page): Promise<{ sheet: Locator; picker: Locator }> {
  await startNewGame(page);
  await readForElders(page);
  return reopenPortraitPicker(page);
}

/** Ouvre le choix du portrait d'Ida (partie en cours). */
async function reopenPortraitPicker(page: Page): Promise<{ sheet: Locator; picker: Locator }> {
  await showPanel(page, 'Arbre');
  await slotButton(page, 's-ida').click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
  await expect(sheet).toBeVisible();
  await sheet
    .getByRole('button', { name: /^Portrait\b/ })
    .first()
    .click();
  const picker = page.getByRole('dialog', { name: 'Choisir : Portrait' });
  await expect(picker).toBeVisible();
  return { sheet, picker };
}

const grid = (picker: Locator) => picker.getByRole('list', { name: 'Visages collectés' });
const tiles = (picker: Locator) => grid(picker).getByRole('button');

/** Largeur rendue du texte de description d'une tuile (1 px quand elle est repliée). */
const altWidth = (tile: Locator) =>
  tile.locator('.alt').evaluate((el) => el.getBoundingClientRect().width);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('bureau : grande grille, descriptions repliées puis affichées, filtres, clavier, axe', async ({
  page,
}) => {
  const { sheet, picker } = await openPortraitPicker(page);

  // Grande boîte : presque tout le Bureau (1440 × 900).
  const box = (await picker.boundingBox())!;
  expect(box.width).toBeGreaterThan(1200);
  expect(box.height).toBeGreaterThan(780);

  await expect(tiles(picker)).toHaveCount(5);
  await expect(picker.getByRole('status')).toHaveText('5 visages');
  // Plusieurs colonnes (au moins 4 sur une rangée).
  const tops = await tiles(picker).evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  expect(tops.filter((t) => t === tops[0]).length).toBeGreaterThanOrEqual(4);

  // Description repliée, mais dans le nom accessible ; « vu dans » complet en description.
  const ida = tiles(picker).filter({ hasText: 'Femme aux cheveux tressés' });
  await expect(ida).toHaveAccessibleName(/Femme aux cheveux tressés/);
  await expect(ida).toHaveAccessibleDescription(/vu dans : Photographie de noces/);
  expect(await altWidth(ida)).toBeLessThanOrEqual(1);
  await expect(ida).toContainText('vu dans : Photographie de noces');

  // Aperçu (desktop) : la tuile survolée en grand, avec sa description complète.
  await ida.hover();
  await expect(picker.locator('.preview')).toContainText('Femme aux cheveux tressés');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/1440-replie.png` });

  // Interrupteur « Afficher les descriptions » : texte complet sous chaque visage.
  const describe = picker.getByRole('switch', { name: 'Afficher les descriptions' });
  await describe.click();
  await expect(describe).toBeChecked();
  expect(await altWidth(ida)).toBeGreaterThan(60);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/1440-descriptions.png` });
  expect(await axe(page, picker)).toEqual([]);
  await describe.click();
  expect(await altWidth(ida)).toBeLessThanOrEqual(1);

  // Filtre : description, puis titre d'un document « vu dans ».
  const search = picker.getByRole('searchbox', { name: 'Chercher un visage' });
  await search.fill('lunettes');
  await expect(tiles(picker)).toHaveCount(1);
  await expect(picker.getByRole('status')).toHaveText('1 visage sur 5');
  await search.fill('noces');
  await expect(tiles(picker)).toHaveCount(3);
  await search.fill('zeppelin');
  await expect(tiles(picker)).toHaveCount(0);
  await expect(picker).toContainText('Aucun visage ne correspond.');
  await picker.getByRole('button', { name: 'Effacer les filtres' }).click();
  await expect(tiles(picker)).toHaveCount(5);

  // « Seulement le document ouvert » : la Photographie au bac (2 visages).
  const onlyOpen = picker.getByRole('switch', { name: /^Seulement le document ouvert/ });
  await onlyOpen.click();
  await expect(tiles(picker)).toHaveCount(2);
  await onlyOpen.click();
  await expect(tiles(picker)).toHaveCount(5);

  // Clavier : un seul arrêt de tabulation dans la grille, flèches, Entrée.
  await expect(grid(picker).locator('button[tabindex="0"]')).toHaveCount(1);
  await tiles(picker).first().focus();
  await page.keyboard.press('End');
  await expect(tiles(picker).last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tiles(picker).first()).toBeFocused();
  for (let i = 0; i < 5 && !(await ida.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('ArrowRight');
  }
  await expect(ida).toBeFocused();
  await expect(grid(picker).locator('button[tabindex="0"]')).toHaveAttribute(
    'data-portrait',
    (await ida.getAttribute('data-portrait'))!,
  );
  await page.keyboard.press('Enter');
  await expect(picker).toBeHidden();
  // Retour du focus sur la ligne « Portrait » de la fiche, qui montre le choix.
  const row = sheet.getByRole('button', { name: /^Portrait\b/ }).first();
  await expect(row).toBeFocused();

  // Rouvert : le choix actuel est marqué et prend le focus.
  await row.click();
  await expect(picker).toBeVisible();
  await expect(ida).toHaveAttribute('aria-pressed', 'true');
  await expect(ida).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
  await expect(row).toBeFocused();
});

test('390 px : plein écran, deux colonnes, aucun défilement horizontal, axe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { picker } = await openPortraitPicker(page);

  const box = (await picker.boundingBox())!;
  expect(Math.round(box.width)).toBe(390);
  await expect(tiles(picker)).toHaveCount(5);
  const tops = await tiles(picker).evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().top)),
  );
  expect(tops.filter((t) => t === tops[0]).length).toBe(2);
  // Pas d'aperçu au téléphone : l'interrupteur affiche les descriptions dans la grille.
  await expect(picker.locator('.preview')).toBeHidden();

  const id = await picker.getAttribute('id');
  const overflow = () =>
    page.evaluate((id) => {
      const d = document.getElementById(id!)!;
      return {
        doc: document.documentElement.scrollWidth,
        dialog: d.scrollWidth - d.clientWidth,
        body: [...d.querySelectorAll<HTMLElement>('*')].filter(
          (el) => el.getBoundingClientRect().right > window.innerWidth + 0.5,
        ).length,
      };
    }, id);
  expect(await overflow()).toEqual({ doc: 390, dialog: 0, body: 0 });
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/390-replie.png` });

  await picker.getByRole('switch', { name: 'Afficher les descriptions' }).click();
  expect(await overflow()).toEqual({ doc: 390, dialog: 0, body: 0 });
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/390-descriptions.png` });
  expect(await axe(page, picker)).toEqual([]);

  await tiles(picker).filter({ hasText: 'Femme aux cheveux tressés' }).click();
  await expect(picker).toBeHidden();
});

test('« Afficher les descriptions » est gardé d’un lancement à l’autre (réglage du profil)', async ({
  page,
}) => {
  const { picker } = await openPortraitPicker(page);
  const describe = picker.getByRole('switch', { name: 'Afficher les descriptions' });
  await expect(describe).not.toBeChecked();
  await describe.click();
  await expect(describe).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();

  // Laisse passer l'enregistrement différé du profil, recharge et reprend la partie.
  await page.waitForTimeout(1_000);
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer', exact: true }).first();
  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(skip.or(cont).first()).toBeVisible();
  await skipLaunch(page);
  await cont.click();
  await expect(desk(page)).toBeVisible();

  const again = (await reopenPortraitPicker(page)).picker;
  const describeAgain = again.getByRole('switch', { name: 'Afficher les descriptions' });
  await expect(describeAgain).toBeChecked();
  const ida = tiles(again).filter({ hasText: 'Femme aux cheveux tressés' });
  expect(await altWidth(ida)).toBeGreaterThan(60);
  // Replier aussi est retenu.
  await describeAgain.click();
  await expect(describeAgain).not.toBeChecked();
});
