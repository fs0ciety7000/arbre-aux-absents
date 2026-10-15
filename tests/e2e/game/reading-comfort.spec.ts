/**
 * « Confort de lecture » (PROPOSITION-INTERFACE option 1) : taille du texte du Lecteur A− / A+
 * (boutons, Alt+= / Alt+-, Options), poignée du volet visible (double-clic : standard ↔ large),
 * réglages mémorisés au rechargement, aucun débordement horizontal du format large au téléphone.
 */
import type { Page } from '@playwright/test';
import { desk, expect, openDocument, reader, showPanel, startNewGame, test } from './helpers';

const DOC = 'Note du notaire';

/** Corps du texte de la pièce ouverte (px). */
async function readSize(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.reader .sheet .reading');
    return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
  });
}

async function openNote(page: Page): Promise<void> {
  await showPanel(page, /^Archives/);
  await openDocument(page, DOC);
}

/** Laisse passer l'enregistrement différé du profil (500 ms), recharge et reprend la partie. */
async function reloadAndContinue(page: Page): Promise<void> {
  await page.waitForTimeout(1_000);
  await page.reload();
  const skip = page.getByRole('button', { name: 'Passer', exact: true }).first();
  const cont = page.getByRole('button', { name: /^Continuer/ });
  await expect(skip.or(cont).first()).toBeVisible();
  // L'intro peut se terminer pendant le clic (bouton « Passer » retiré) : sans conséquence.
  if (await skip.isVisible()) await skip.click({ timeout: 5_000 }).catch(() => undefined);
  await cont.click();
  await expect(desk(page)).toBeVisible();
}

/** Débordement horizontal de la page et de la barre d'outils du Lecteur (px). */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>('.reader .toolbar')!.getBoundingClientRect();
    // Contrôles visibles (les info-bulles, masquées, peuvent dépasser sans rien couper).
    const controls = [...document.querySelectorAll('.reader .toolbar button')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0);
    return {
      page: root.scrollWidth - root.clientWidth,
      toolbar: Math.max(...controls.map((r) => r.right)) - bar.right,
    };
  });
}

test.describe('taille du texte du Lecteur', () => {
  test('A+ / A− changent le corps du texte, pas le zoom, et le réglage persiste', async ({
    page,
  }) => {
    await startNewGame(page);
    await openNote(page);
    const r = reader(page);
    const larger = r.getByRole('button', { name: 'Texte plus grand' });
    const smaller = r.getByRole('button', { name: 'Texte plus petit' });
    await expect(r.getByRole('group', { name: 'Taille du texte' })).toBeVisible();
    // Un cran au-dessus du texte courant par défaut (--read-boost).
    const uiSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('font-size')),
    );
    const base = await readSize(page);
    expect(base).toBeGreaterThan(uiSize);

    await larger.click();
    await expect.poll(() => readSize(page)).toBeGreaterThan(base);
    await expect(r.getByRole('status')).toHaveText('Texte à 115 %');
    // Le zoom de la feuille ne bouge pas.
    await expect(
      r.getByRole('button', { name: /^×1/ }).or(r.getByText('×1')).first(),
    ).toBeVisible();

    // Raccourcis Alt+= / Alt+- (Ctrl est le zoom du navigateur).
    await page.keyboard.press('Alt+=');
    await expect(r.getByRole('status')).toHaveText('Texte à 130 %');
    await page.keyboard.press('Alt+-');
    await expect(r.getByRole('status')).toHaveText('Texte à 115 %');
    const bigger = await readSize(page);

    // Aux crans extrêmes, le bouton se désactive.
    for (let i = 0; i < 5; i++) if (await smaller.isEnabled()) await smaller.click();
    await expect(smaller).toBeDisabled();
    expect(await readSize(page)).toBeLessThan(base);
    for (let i = 0; i < 3; i++) await larger.click();
    await expect(r.getByRole('status')).toHaveText('Texte à 130 %');
    await smaller.click();
    await expect.poll(() => readSize(page)).toBeCloseTo(bigger, 1);

    await reloadAndContinue(page);
    await openNote(page);
    await expect.poll(() => readSize(page)).toBeCloseTo(bigger, 1);
    // Volet étroit : barre compacte, le pourcentage n'est pas affiché ; les deux boutons sont actifs.
    await expect(reader(page).getByRole('button', { name: 'Texte plus petit' })).toBeEnabled();
  });

  test('réglable aussi dans Options › Affichage', async ({ page }) => {
    await startNewGame(page);
    await openNote(page);
    const base = await readSize(page);
    await page.getByRole('button', { name: 'Pause' }).click();
    const pause = page.getByRole('dialog', { name: 'Pause' });
    await pause.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('tab', { name: 'Affichage' }).click();
    const select = page.getByRole('combobox', { name: 'Taille du texte des documents (Lecteur)' });
    await expect(select).toHaveValue('1');
    await select.selectOption({ label: '150 %' });
    const width = page.getByRole('combobox', { name: 'Largeur du volet des documents' });
    await expect(width).toHaveValue('440');
    await width.selectOption({ label: 'Large' });
    await page.locator('.overlay').getByRole('button', { name: 'Retour' }).first().click();
    const resume = page.getByRole('button', { name: 'Reprendre' });
    await expect(resume.or(desk(page)).first()).toBeVisible();
    if (await resume.isVisible()) await resume.click();
    await expect(page.locator('.desk[inert]')).toHaveCount(0);
    await expect.poll(() => readSize(page)).toBeGreaterThan(base * 1.4);
    await expect(page.getByRole('separator', { name: 'Largeur du volet latéral' })).toHaveAttribute(
      'aria-valuenow',
      '640',
    );
  });
});

test.describe('poignée du volet', () => {
  test('visible, double-clic : standard ↔ large, largeur mémorisée', async ({ page }) => {
    await startNewGame(page);
    const handle = page.getByRole('separator', { name: 'Largeur du volet latéral' });
    const side = page.locator('aside.side');
    const width = async () => Math.round((await side.boundingBox())!.width);
    // L'encoche se voit au repos (pas un trait de 2 px).
    const grip = await handle.locator('.grip').boundingBox();
    expect(grip!.height).toBeGreaterThanOrEqual(24);
    await expect(handle).toHaveAttribute('aria-valuenow', '440');
    await expect(handle).toHaveAccessibleDescription(/double-clic/);

    await handle.dblclick();
    await expect(handle).toHaveAttribute('aria-valuenow', '640');
    await expect.poll(width).toBeGreaterThanOrEqual(600);
    await handle.dblclick();
    await expect(handle).toHaveAttribute('aria-valuenow', '440');
    await expect.poll(width).toBeLessThanOrEqual(480);

    // Clavier : Entrée bascule aussi ; flèche = ±40 px.
    await handle.focus();
    await page.keyboard.press('Enter');
    await expect(handle).toHaveAttribute('aria-valuenow', '640');
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '600');

    await reloadAndContinue(page);
    await expect(page.getByRole('separator', { name: 'Largeur du volet latéral' })).toHaveAttribute(
      'aria-valuenow',
      '600',
    );
  });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}×${viewport.height} : aucun débordement horizontal, texte au plus grand`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await startNewGame(page);
    await openNote(page);
    const r = reader(page);
    const larger = r.getByRole('button', { name: 'Texte plus grand' });
    await expect(larger).toBeVisible();
    for (let i = 0; i < 6; i++) if (await larger.isEnabled()) await larger.click();
    await expect(larger).toBeDisabled();
    const phone = viewport.width < 600;
    await expect(page.getByRole('separator', { name: 'Largeur du volet latéral' })).toHaveCount(
      phone ? 0 : 1,
    );
    if (!phone) await page.getByRole('separator', { name: 'Largeur du volet latéral' }).dblclick();
    const o = await overflow(page);
    expect(o.page).toBeLessThanOrEqual(0);
    expect(o.toolbar).toBeLessThanOrEqual(0);
    // Le texte tient dans la zone de lecture (pas de ligne coupée à droite).
    const fits = await page.evaluate(() => {
      const stage = document.querySelector('.reader .stage')!.getBoundingClientRect();
      const blocks = [...document.querySelectorAll('.reader .sheet .reading > *')]
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0);
      return Math.max(...blocks.map((b) => b.right)) <= stage.right + 1;
    });
    expect(fits).toBe(true);
  });
}
