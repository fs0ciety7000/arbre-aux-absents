/**
 * Carte au téléphone et à la tablette : la carte et la fiche du lieu ont chacune leur région ;
 * la fiche défile dans la sienne, sans jamais passer sur la carte ni sur les boutons de zoom
 * (bogue de l'APK Android, 412 px en portrait).
 */
import type { Locator, Page } from '@playwright/test';
import { desk, expect, readForElders, showPanel, startNewGame, test } from './helpers';

const SHOTS = process.env.E2E_SHOTS_DIR;
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/129.0.0.0 Mobile Safari/537.36';

type Box = { x: number; y: number; width: number; height: number };

async function box(l: Locator): Promise<Box> {
  const b = await l.boundingBox();
  expect(b, 'élément affiché').not.toBeNull();
  return b!;
}

/** Recouvrement strict (plus d'un pixel) de deux rectangles. */
const overlaps = (a: Box, b: Box) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
  Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;

/** Ouvre la Carte et la fiche de Val-Dormant (fonds + termes associés). */
async function openPlace(page: Page): Promise<{ map: Locator; sheet: Locator }> {
  await startNewGame(page);
  await readForElders(page);
  await showPanel(page, 'Carte');
  const panel = desk(page).locator('.map-panel');
  await panel.getByRole('button', { name: 'Liste des lieux' }).click();
  await panel.getByRole('button', { name: /^Val-Dormant/ }).click();
  await panel.getByRole('button', { name: 'Carte', exact: true }).click();
  const sheet = panel.locator('section.place');
  await expect(sheet.getByRole('heading', { name: 'Val-Dormant' })).toBeVisible();
  const map = panel.locator('.stage');
  await expect(map).toBeVisible();
  return { map, sheet };
}

async function expectSeparated(page: Page, map: Locator, sheet: Locator, name: string) {
  // Laisse finir l'entrée de la feuille.
  await page.waitForTimeout(800);
  const zoom = map.getByRole('group', { name: 'Zoom de la carte' });
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/map-${name}.png` });
  const m = await box(map);
  const s = await box(sheet);
  const z = await box(zoom);
  expect(m.height, 'la carte garde de la hauteur').toBeGreaterThanOrEqual(120);
  expect(overlaps(s, m), 'fiche sur la carte').toBe(false);
  expect(overlaps(s, z), 'fiche sur les boutons de zoom').toBe(false);
  // Les boutons de zoom tiennent dans la carte.
  expect(z.y + z.height).toBeLessThanOrEqual(m.y + m.height + 1);

  // La fiche défile dans sa région : ses éléments restent entre ses bords.
  const scrolls = await sheet.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
  if (scrolls) {
    await sheet.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: 'instant' }));
  }
  const s2 = await box(sheet);
  expect(s2, 'la fiche ne bouge pas en défilant').toEqual(s);
  for (const item of await sheet.locator('li').all()) {
    const b = await item.boundingBox();
    if (!b || !(await item.isVisible())) continue;
    // Visible = dans la fiche ; jamais au-dessus de son bord haut (sur la carte).
    const visibleTop = Math.max(b.y, s.y);
    const visibleBottom = Math.min(b.y + b.height, s.y + s.height);
    if (visibleBottom - visibleTop <= 1) continue;
    expect(overlaps({ ...b, y: visibleTop, height: visibleBottom - visibleTop }, m)).toBe(false);
  }
  // Le point le plus haut de la fiche, au centre, appartient bien à la fiche (rien par-dessus).
  const hit = await page.evaluate(
    ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('section.place'),
    { x: s.x + s.width / 2, y: s.y + 4 },
  );
  expect(hit, 'haut de la fiche visible').toBe(true);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/map-${name}-scrolled.png` });
}

const FORMATS = [
  // Fenêtre de la WebView de l'APK (412 × 915 moins les barres du système).
  { name: 'phone-412', viewport: { width: 412, height: 823 }, mobile: true },
  { name: 'phone-360', viewport: { width: 360, height: 780 }, mobile: true },
  { name: 'phone-landscape', viewport: { width: 915, height: 412 }, mobile: true },
  { name: 'tablet-portrait', viewport: { width: 800, height: 1280 }, mobile: true },
  { name: 'tablet-landscape', viewport: { width: 1280, height: 800 }, mobile: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 }, mobile: false },
] as const;

for (const f of FORMATS) {
  test.describe(`carte et fiche du lieu : ${f.name}`, () => {
    test.use({
      viewport: f.viewport,
      isMobile: f.mobile,
      hasTouch: f.mobile,
      ...(f.mobile ? { userAgent: ANDROID_UA } : {}),
    });

    test('la fiche du lieu ne recouvre ni la carte ni le zoom', async ({ page }) => {
      test.setTimeout(90_000);
      const { map, sheet } = await openPlace(page);
      await expectSeparated(page, map, sheet, f.name);
    });
  });
}
