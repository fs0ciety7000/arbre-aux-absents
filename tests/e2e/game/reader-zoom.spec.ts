/**
 * « Agrandir » le texte du Lecteur (zoom avant) et élargir le volet latéral.
 *
 * Régression : la feuille du Lecteur est posée de travers (−0,5°) autour de son centre. Le zoom
 * l'allonge (texte plus grand dans une colonne de même largeur), et une feuille très haute
 * dérivait d'autant : à ×2, les premières lignes sortaient à gauche du Lecteur (débord non
 * défilable), les dernières à droite. Le texte « agrandi » devenait illisible. L'inclinaison est
 * désormais bornée selon la hauteur. En tablette paysage, la poignée du volet n'avait aucun effet.
 */
import type { Page } from '@playwright/test';
import { expect, openDocument, reader, showPanel, startNewGame, test } from './helpers';

/** Écart entre la boîte visuelle (après rotation) de la feuille et sa largeur de mise en page. */
async function sheetGeometry(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.reader .stage')!.getBoundingClientRect();
    const sheet = document.querySelector<HTMLElement>('.reader .sheet')!;
    const box = sheet.getBoundingClientRect();
    const blocks = [...sheet.querySelectorAll('.doc-title, .reading > *')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0);
    return {
      drift: box.width - sheet.offsetWidth * Number(getComputedStyle(sheet).zoom || 1),
      textLeft: Math.min(...blocks.map((r) => r.left)),
      textRight: Math.max(...blocks.map((r) => r.right)),
      stageLeft: stage.left,
      stageRight: stage.right,
      height: box.height,
    };
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
]) {
  test.describe(`${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test('zoom avant du Lecteur : le texte grandit sans sortir du volet', async ({ page }) => {
      await startNewGame(page);
      // Volet au plus étroit : la feuille zoomée y est la plus haute.
      const handle = page.getByRole('separator', { name: 'Largeur du volet latéral' });
      await handle.focus();
      await page.keyboard.press('End');
      await showPanel(page, /^Archives/);
      await openDocument(page, 'Note du notaire');

      const r = reader(page);
      const before = await sheetGeometry(page);
      const zoomIn = r.getByRole('button', { name: 'Zoom avant' });
      for (let i = 0; i < 12; i++) await zoomIn.click();
      await expect(zoomIn).toBeDisabled();
      await expect(r.getByRole('button', { name: /^×4/ })).toBeVisible();

      const after = await sheetGeometry(page);
      expect(after.height).toBeGreaterThan(before.height * 3);
      // La pose reste une pose : quelques pixels, quelle que soit la hauteur de la feuille.
      expect(after.drift).toBeLessThanOrEqual(12);
      // Tout le texte reste dans la zone de lecture, à gauche comme à droite.
      expect(after.textLeft).toBeGreaterThanOrEqual(after.stageLeft);
      expect(after.textRight).toBeLessThanOrEqual(after.stageRight);

      // « Ajuster » ramène à ×1.
      await r.getByRole('button', { name: /^×4/ }).click();
      await expect(r.getByRole('button', { name: /^×1/ })).toBeVisible();
    });

    test('la poignée élargit le volet latéral (glisser et clavier)', async ({ page }) => {
      await startNewGame(page);
      const side = page.locator('aside.side');
      const handle = page.getByRole('separator', { name: 'Largeur du volet latéral' });
      // Largeur de mise en page, pas la boîte visuelle : juste après « Commencer », l'écran entre
      // encore en `scale()` (screenIn), et sous charge la boîte mesurait jusqu'à 492 px pour 440.
      const width = () => side.evaluate((el) => parseFloat(getComputedStyle(el).width));
      const w0 = await width();

      await handle.focus();
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await expect.poll(width).toBeGreaterThan(w0 + 40);

      const hb = (await handle.boundingBox())!;
      const w1 = await width();
      await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
      await page.mouse.down();
      await page.mouse.move(hb.x + hb.width / 2 + 100, hb.y + hb.height / 2, { steps: 5 });
      await page.mouse.up();
      await expect.poll(width).toBeLessThan(w1 - 40);
    });
  });
}
