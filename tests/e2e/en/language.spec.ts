/**
 * Langue du jeu (D6, DESIGN §9.35, §13.10, ARCHITECTURE §3.4) sur la fixture `mini` traduite :
 * détection par le navigateur (en-GB → anglais, fr-BE → français), indice `?lang=`, sélecteur de
 * l'écran titre, puis bascule en cours de partie : l'arbre et la sauvegarde restent intacts, seul
 * le texte change ; chaque surlignage n'apparaît que dans sa langue (D5) ; la sauvegarde écrite
 * dans une langue se reprend dans l'autre.
 */
import type { Page } from '@playwright/test';
import {
  axe,
  deskEn,
  deskFr,
  expect,
  gotoTitle,
  passLaunch,
  reader,
  showPanel,
  slotButton,
  startNewGameEn,
  switchLanguageInGame,
  test,
} from './helpers';

test.describe('détection de la langue', () => {
  test('navigateur en-GB : écran titre en anglais, <html lang="en">', async ({ page }) => {
    await gotoTitle(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(await axe(page)).toEqual([]);
  });

  test.describe('navigateur fr-BE', () => {
    test.use({ locale: 'fr-BE' });

    test('écran titre en français', async ({ page }) => {
      await gotoTitle(page, './', 'fr');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.getByRole('radio', { name: 'Français' })).toBeChecked();
    });

    test('?lang=en l’emporte sur le navigateur (liens /jouer/?lang=en du site)', async ({
      page,
    }) => {
      await gotoTitle(page, './?lang=en', 'en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  test('?lang=fr l’emporte sur le navigateur en-GB', async ({ page }) => {
    await gotoTitle(page, './?lang=fr', 'fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });

  test('sélecteur de l’écran titre : bascule, choix gardé au rechargement', async ({ page }) => {
    await gotoTitle(page);
    const switcher = page.getByRole('group', { name: 'Language' });
    await expect(switcher).toBeVisible();
    // Clavier : Tab entre une fois dans le groupe radio, les flèches changent de langue.
    await switcher.getByRole('radio', { name: 'English' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('radio', { name: 'Français' })).toBeChecked();
    expect(await axe(page)).toEqual([]);

    // Le choix est écrit dans le profil : il l'emporte sur le navigateur au rechargement.
    await page.waitForTimeout(700); // profil enregistré 500 ms après le changement
    await gotoTitle(page, './', 'fr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    await page.getByRole('radio', { name: 'English' }).check();
    await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

/** Sélectionne tout le texte du premier bloc du Lecteur qui contient `text`. */
async function selectInReader(page: Page, text: string): Promise<void> {
  const block = reader(page).locator('[data-path]', { hasText: text }).first();
  await expect(block).toBeVisible();
  await block.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  });
}

const removeButtons = (page: Page, lang: 'en' | 'fr') =>
  reader(page).getByRole('button', {
    name: lang === 'en' ? 'Remove this highlight' : 'Retirer ce surlignage',
  });

async function highlight(page: Page, text: string, lang: 'en' | 'fr'): Promise<void> {
  await selectInReader(page, text);
  await reader(page)
    .getByRole('button', {
      name: lang === 'en' ? /^Highlight the selection: Yellow/ : /^Surligner la sélection : Jaune/,
    })
    .click();
}

async function searchAndRead(page: Page, query: string, title: string): Promise<void> {
  await showPanel(page, 'Catalogue');
  await page.getByRole('textbox', { name: 'Query' }).fill(query);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name: `Cards for “${query}”` })).toBeVisible();
  await page.getByRole('button', { name: title, exact: true }).first().click();
  await expect(reader(page).getByRole('heading', { name: title })).toBeVisible();
}

/** Remplit prénom et nom de la case d'Ancel (fiche + sélecteur), en anglais. */
async function fillAncel(page: Page): Promise<void> {
  await showPanel(page, 'Tree');
  await slotButton(page, 's-ancel').click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Slot card' });
  await expect(sheet).toBeVisible();
  for (const [field, value] of [
    ['Given name', 'Ancel'],
    ['Surname', 'Morvan'],
  ] as const) {
    await sheet
      .getByRole('button', { name: new RegExp(`^${field}\\b`) })
      .first()
      .click();
    const picker = page.getByRole('dialog', { name: /^Choose/ });
    await picker
      .getByRole('option', { name: new RegExp(`^${value}`) })
      .first()
      .click();
    await expect(picker).toBeHidden();
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
}

test('bascule en partie : arbre intact, texte traduit, surlignages par langue, sauvegarde valide dans les deux langues', async ({
  page,
}) => {
  await startNewGameEn(page);
  await searchAndRead(page, 'Ancel Morvan', 'Letter from Ancel to Ida');
  await fillAncel(page);
  const ancel = slotButton(page, 's-ancel');
  await expect(ancel).toHaveAccessibleName('Ancel Morvan, open slot');

  // Surlignage en anglais, visible dans le Lecteur anglais.
  await showPanel(page, 'Reader');
  await highlight(page, 'My dear Ida', 'en');
  await expect(removeButtons(page, 'en')).toHaveCount(1);

  // → français : même arbre (ids et réponses), libellés du contenu en français, surlignage
  // anglais gardé mais caché.
  await switchLanguageInGame(page, 'fr');
  await showPanel(page, 'Lecteur');
  await expect(reader(page).getByRole('heading', { name: 'Lettre d’Ancel à Ida' })).toBeVisible();
  await expect(removeButtons(page, 'fr')).toHaveCount(0);
  await highlight(page, 'Ma chère Ida', 'fr');
  await expect(removeButtons(page, 'fr')).toHaveCount(1);
  await expect(reader(page).getByText('Ma chère Ida,').last()).toBeVisible();
  await showPanel(page, 'Arbre');
  await expect(ancel).toHaveAccessibleName('Ancel Morvan, case ouverte');

  // → anglais : seul le surlignage anglais revient.
  await switchLanguageInGame(page, 'en');
  await showPanel(page, 'Reader');
  await expect(
    reader(page).getByRole('heading', { name: 'Letter from Ancel to Ida' }),
  ).toBeVisible();
  await expect(removeButtons(page, 'en')).toHaveCount(1);
  await expect(reader(page).locator('.extra')).toContainText('My dear Ida');
  await expect(reader(page).locator('.extra')).not.toContainText('Ma chère Ida');
  expect(await axe(page)).toEqual([]);

  // Sauvegarde écrite en anglais, reprise après rechargement, puis en français.
  await page.getByRole('button', { name: 'Pause' }).click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Save and quit' })
    .click();
  await page
    .getByRole('dialog', { name: 'Return to the title screen?' })
    .getByRole('button', { name: 'Save and quit' })
    .click();
  await expect(page.getByRole('button', { name: 'New game' })).toBeVisible();

  await page.reload();
  await passLaunch(page, 'en');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await expect(deskEn(page)).toBeVisible();
  await showPanel(page, 'Tree');
  await expect(slotButton(page, 's-ancel')).toHaveAccessibleName('Ancel Morvan, open slot');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Save and quit' })
    .click();
  await page
    .getByRole('dialog', { name: 'Return to the title screen?' })
    .getByRole('button', { name: 'Save and quit' })
    .click();

  await page.getByRole('radio', { name: 'Français' }).check();
  await page.getByRole('button', { name: /^Continuer/ }).click();
  await expect(deskFr(page)).toBeVisible();
  await showPanel(page, 'Arbre');
  await expect(slotButton(page, 's-ancel')).toHaveAccessibleName('Ancel Morvan, case ouverte');
  // Le surlignage français a survécu aux deux sauvegardes (l'anglais reste caché).
  await showPanel(page, /^Archives/);
  await page.getByRole('button', { name: 'Lettre d’Ancel à Ida', exact: true }).first().click();
  await expect(reader(page).getByRole('heading', { name: 'Lettre d’Ancel à Ida' })).toBeVisible();
  await expect(removeButtons(page, 'fr')).toHaveCount(1);
});
