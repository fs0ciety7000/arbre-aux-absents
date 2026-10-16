/**
 * Retours de jeu d'octobre 2026 (auteur) : boutons de génération qui revenaient à 1, vues de
 * l'arbre qui « sautaient », barre de défilement parasite sur les onglets du volet, volet des
 * documents plus large, arbre en plein écran, cases établies plus visibles, fiche des documents
 * détachée dans une fenêtre (second écran).
 */
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  desk,
  expect,
  lockGroup,
  readForElders,
  showPanel,
  slotButton,
  startNewGame,
  test,
} from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
/** Le chronomètre fait avancer l'état de partie chaque seconde : on en laisse passer plusieurs. */
const TICKS = 2_600;

const layoutButton = (page: Page, name: 'Enquête' | 'Lecture' | 'Arbre'): Locator =>
  page
    .getByRole('group', { name: 'Disposition du bureau' })
    .getByRole('button', { name: new RegExp(`^${name}`) });
const card = (page: Page): Locator =>
  page.getByRole('complementary', { name: 'Fiche des documents' });
const treeFull = (page: Page): Locator =>
  page.getByRole('region', { name: 'Arbre en plein écran' });
const genButton = (page: Page, n: number): Locator =>
  page.getByRole('group', { name: 'Générations' }).getByRole('button', { name: `Génération ${n}` });

async function axe(page: Page, selector: string): Promise<string[]> {
  const audit = await new AxeBuilder({ page }).include(selector).withTags(TAGS).analyze();
  return audit.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`);
}

/** Rangées d'onglets qui défilent à la verticale (barre de défilement parasite). */
async function verticalScrollers(page: Page, scope: string): Promise<string[]> {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll<HTMLElement>(`${sel} [role="tablist"]`)]
      .filter((el) => {
        const oy = getComputedStyle(el).overflowY;
        return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight;
      })
      .map((el) => `${el.getAttribute('aria-label')} ${el.clientHeight}/${el.scrollHeight}`);
  }, scope);
}

test.describe('vues de l’arbre', () => {
  test('la génération choisie reste, même quand le temps passe', async ({ page }) => {
    await startNewGame(page);
    // Une case sélectionnée (génération I) : c'est elle qui faisait revenir la vue à 1.
    await slotButton(page, 's-ancel').click();
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Générations' }).click();
    await genButton(page, 2).click();
    await expect(genButton(page, 2)).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(TICKS);
    await expect(genButton(page, 2)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Génération 2' })).toBeVisible();

    // Changer de chemise et revenir garde la vue et la génération.
    await showPanel(page, 'Carte');
    await showPanel(page, 'Arbre');
    await expect(page.getByRole('tab', { name: 'Générations' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(genButton(page, 2)).toHaveAttribute('aria-pressed', 'true');
  });

  test('la toile et la liste ne sautent plus vers la case choisie', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await startNewGame(page);
    await slotButton(page, 's-ancel').click();
    await page.keyboard.press('Escape');
    // Zoom ×2 : la toile défile ; on s'éloigne de la case choisie.
    const tree = page.getByRole('group', { name: 'Zoom de l’arbre' });
    for (let i = 0; i < 6; i++)
      await tree.getByRole('button', { name: 'Agrandir l’arbre' }).click();
    const wrap = page.locator('.canvas-wrap');
    await wrap.evaluate((el) => el.scrollTo(el.scrollWidth, el.scrollHeight));
    const before = await wrap.evaluate((el) => [el.scrollLeft, el.scrollTop]);
    expect(before[0]! + before[1]!).toBeGreaterThan(0);
    await page.waitForTimeout(TICKS);
    expect(await wrap.evaluate((el) => [el.scrollLeft, el.scrollTop])).toEqual(before);

    await page.getByRole('tab', { name: 'Liste' }).click();
    const list = page.locator('.list-view');
    await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const top = await list.evaluate((el) => el.scrollTop);
    expect(top).toBeGreaterThan(0);
    await page.waitForTimeout(TICKS);
    expect(await list.evaluate((el) => el.scrollTop)).toBe(top);
    await expect(page.getByRole('tab', { name: 'Liste' })).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('onglets du volet', () => {
  test('aucune barre de défilement verticale, dans aucune disposition', async ({ page }) => {
    await startNewGame(page);
    await showPanel(page, /^Archives/);
    // Pastille des non lus présente (« 32 » chez l'auteur).
    await expect(
      page.getByRole('tablist', { name: 'Volet latéral' }).getByRole('tab', { name: /non lu/ }),
    ).toHaveCount(1);
    const handle = page.getByRole('separator', { name: 'Largeur du volet latéral' });
    // Volet standard (icônes seules), large (libellés), Lecture, fiche flottante.
    expect(await verticalScrollers(page, 'aside.side')).toEqual([]);
    await handle.dblclick();
    await expect(handle).toHaveAttribute('aria-valuenow', '720');
    expect(await verticalScrollers(page, 'aside.side')).toEqual([]);
    await layoutButton(page, 'Lecture').click();
    expect(await verticalScrollers(page, 'aside.side')).toEqual([]);
    await layoutButton(page, 'Arbre').click();
    await expect(card(page)).toBeVisible();
    expect(await verticalScrollers(page, '[data-testid="floating-card"]')).toEqual([]);
    // Survol d'un onglet (info-bulle) : toujours rien.
    await card(page).getByRole('tab').first().hover();
    expect(await verticalScrollers(page, '[data-testid="floating-card"]')).toEqual([]);
  });
});

test.describe('volet des documents plus large', () => {
  test('la poignée va au-delà de 640 px, l’arbre garde sa place', async ({ page }) => {
    await startNewGame(page);
    const handle = page.getByRole('separator', { name: 'Largeur du volet latéral' });
    const side = page.locator('aside.side');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(40, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    const width = (await side.boundingBox())!.width;
    expect(width).toBeGreaterThan(900);
    // L'arbre garde au moins 22 rem (352 px).
    const tree = (await desk(page).locator('.main-folder').boundingBox())!.width;
    expect(tree).toBeGreaterThanOrEqual(350);
    expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(900);

    // Écran plus étroit : la largeur mémorisée ne mange pas l'arbre.
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect
      .poll(async () => (await desk(page).locator('.main-folder').boundingBox())!.width)
      .toBeGreaterThanOrEqual(350);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      1280,
    );
  });

  test('disposition Lecture : le Lecteur prend ~70 %', async ({ page }) => {
    await startNewGame(page);
    await layoutButton(page, 'Lecture').click();
    const zw = (await desk(page).boundingBox())!.width;
    await expect
      .poll(async () => (await page.locator('aside.side').boundingBox())!.width / zw)
      .toBeGreaterThan(0.65);
  });
});

test.describe('arbre en plein écran', () => {
  test('bouton, Échap, focus rendu ; touche F ; axe', async ({ page }) => {
    await startNewGame(page);
    const button = page.getByRole('button', { name: 'Arbre en plein écran' });
    await button.click();
    await expect(treeFull(page)).toBeVisible();
    await expect(treeFull(page)).toBeFocused();
    await expect(page.locator('.desk[inert]')).toHaveCount(1);
    // Un seul arbre monté, utilisable : la fiche d'une case s'ouvre.
    await expect(page.locator('[data-tree-view]')).toHaveCount(1);
    await treeFull(page).locator('[data-slot="s-ancel"]').click();
    const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(treeFull(page)).toBeVisible();
    expect(await axe(page, '[data-testid="tree-full"]')).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(treeFull(page)).toHaveCount(0);
    await expect(page.locator('.desk[inert]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Arbre en plein écran' })).toBeFocused();
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();

    // Touche F (focus dans l'arbre), puis le bouton de la barre.
    await slotButton(page, 's-ancel').focus();
    await page.keyboard.press('f');
    await expect(treeFull(page)).toBeVisible();
    await treeFull(page).getByRole('button', { name: 'Quitter le plein écran' }).first().click();
    await expect(treeFull(page)).toHaveCount(0);
  });

  test('390 px : outils de l’arbre sans débordement, plein écran disponible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startNewGame(page);
    const button = page.getByRole('button', { name: 'Arbre en plein écran' });
    await expect(button).toBeVisible();
    const right = (await button.boundingBox())!;
    expect(right.x + right.width).toBeLessThanOrEqual(390);
    await button.click();
    await expect(treeFull(page)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
    await expect(treeFull(page)).toHaveCount(0);
  });
});

test.describe('cases établies', () => {
  test('liseré, bandeau et sceau coché, axe', async ({ page }) => {
    test.setTimeout(120_000);
    await startNewGame(page);
    await readForElders(page);
    await lockGroup(page, ['s-ancel', 's-ida', 's-tomas']);
    await showPanel(page, 'Arbre');
    const slot = slotButton(page, 's-ancel');
    await expect(slot).toHaveAccessibleName(/case établie$/);
    const seal = slot.locator('.seal');
    await expect(seal).toBeVisible();
    // Forme et couleur : sceau plein, liseré de 4 px à l'encre du tampon.
    const look = await slot.evaluate((el) => {
      const s = getComputedStyle(el);
      const seal = getComputedStyle(el.querySelector('.seal')!);
      const band = getComputedStyle(el, '::before');
      return { shadow: s.boxShadow, seal: seal.backgroundColor, band: band.blockSize };
    });
    expect(look.shadow).toContain('0px 0px 0px 4px');
    expect(look.seal).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(look.band)).toBeGreaterThan(0);
    // Une case ouverte n'a ni sceau ni liseré.
    await expect(slotButton(page, 's-lena').locator('.seal')).toHaveCount(0);
    expect(await axe(page, '[data-tree-view]')).toEqual([]);

    // Contraste élevé et vision des couleurs : le sceau reste (forme), sa couleur change.
    await page.evaluate(() => {
      document.documentElement.dataset.contrast = 'high';
      document.documentElement.dataset.colorVision = 'deuteranopia';
    });
    await expect(seal).toBeVisible();
    expect(await axe(page, '[data-tree-view]')).toEqual([]);
  });
});

test.describe('fiche des documents dans une fenêtre', () => {
  test('ouverte, synchronisée, ramenée à la fermeture', async ({ page, context }) => {
    await startNewGame(page);
    await layoutButton(page, 'Arbre').click();
    await expect(card(page)).toBeVisible();
    const [win] = await Promise.all([
      context.waitForEvent('page'),
      card(page).getByRole('button', { name: 'Ouvrir dans une fenêtre' }).click(),
    ]);
    const popout = win.getByTestId('popout-docs');
    await expect(popout).toBeVisible();
    // La fiche du Bureau ne monte plus les panneaux : un renvoi.
    await expect(card(page).getByText(/ouverts dans une autre fenêtre/)).toBeVisible();
    await expect(card(page).getByRole('tablist')).toHaveCount(0);

    // Lire et épingler dans la fenêtre : c'est la même partie.
    await win.getByRole('tab', { name: /^Archives/ }).click();
    await win.getByRole('button', { name: 'Note du notaire', exact: true }).first().click();
    await expect(win.getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
    await win.getByRole('button', { name: 'Épingler' }).first().click();
    await expect(win.getByRole('button', { name: 'Retirer l’épingle' }).first()).toBeVisible();
    expect(await verticalScrollers(win, '[data-testid="popout-docs"]')).toEqual([]);

    // Fermer la fenêtre ramène la fiche, avec le document ouvert et l'épingle.
    await win.getByRole('button', { name: 'Ramener la fiche' }).click();
    await expect.poll(() => win.isClosed()).toBe(true);
    await expect(card(page).getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
    await expect(
      card(page).getByRole('button', { name: 'Retirer l’épingle' }).first(),
    ).toBeVisible();
    await expect(card(page).getByRole('button', { name: 'Ouvrir dans une fenêtre' })).toBeFocused();

    // Quitter la disposition Arbre referme la fenêtre.
    const [again] = await Promise.all([
      context.waitForEvent('page'),
      card(page).getByRole('button', { name: 'Ouvrir dans une fenêtre' }).click(),
    ]);
    await expect(again.getByTestId('popout-docs')).toBeVisible();
    await layoutButton(page, 'Enquête').click();
    await expect.poll(() => again.isClosed()).toBe(true);
    await expect(page.locator('aside.side').getByRole('tablist')).toHaveCount(1);
  });
});

test('fiche détachée repliée : ouvrir un document dans la fenêtre la laisse repliée', async ({
  page,
  context,
}) => {
  // Retour de jeu : la fiche repliée sur le Bureau se redépliait à chaque document ouvert.
  await startNewGame(page);
  await layoutButton(page, 'Arbre').click();
  const [win] = await Promise.all([
    context.waitForEvent('page'),
    card(page).getByRole('button', { name: 'Ouvrir dans une fenêtre' }).click(),
  ]);
  await expect(win.getByTestId('popout-docs')).toBeVisible();
  await card(page).getByRole('button', { name: 'Replier la fiche' }).click();
  const expand = card(page).getByRole('button', { name: /^Déplier la fiche/ });
  await expect(expand).toBeVisible();
  await expect(card(page).getByText(/ouverts dans une autre fenêtre/)).toHaveCount(0);

  // Onglet puis document dans la fenêtre : le document s'ouvre, la fiche reste repliée.
  await win.getByRole('tab', { name: /^Archives/ }).click();
  await win.getByRole('button', { name: 'Note du notaire', exact: true }).first().click();
  await expect(win.getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
  await expect(expand).toBeVisible();
  await expect(expand).toHaveAttribute('aria-pressed', 'false');
  await expect(card(page).getByText(/ouverts dans une autre fenêtre/)).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Déplier le volet latéral', exact: true }),
  ).toBeVisible();

  // Le joueur déplie lui-même : le renvoi vers la fenêtre revient.
  await expand.click();
  await expect(card(page).getByText(/ouverts dans une autre fenêtre/)).toBeVisible();
  // Replier de nouveau puis ramener la fiche : elle revient repliée, comme laissée.
  await card(page).getByRole('button', { name: 'Replier la fiche' }).click();
  await win.close();
  await expect(card(page).getByRole('button', { name: /^Déplier la fiche/ })).toBeVisible();
  // Déplier la fiche ramenée montre le document ouvert dans la fenêtre.
  await card(page)
    .getByRole('button', { name: /^Déplier la fiche/ })
    .click();
  await expect(card(page).getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
});

test('sans Document Picture-in-Picture : fenêtre surgissante, même partie', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture;
  });
  await startNewGame(page);
  await layoutButton(page, 'Arbre').click();
  const [win] = await Promise.all([
    context.waitForEvent('page'),
    card(page).getByRole('button', { name: 'Ouvrir dans une fenêtre' }).click(),
  ]);
  await expect(win.getByTestId('popout-docs')).toBeVisible();
  await win.getByRole('tab', { name: /^Archives/ }).click();
  await win.getByRole('button', { name: 'Note du notaire', exact: true }).first().click();
  await expect(win.getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
  await win.close();
  await expect(card(page).getByRole('heading', { name: 'Note du notaire' })).toBeVisible();
});

test('cliquer ou glisser l’arbre ne sélectionne aucun texte (mini-barre de sélection d’Edge)', async ({
  page,
}) => {
  await startNewGame(page);
  const wrap = page.locator('.canvas-wrap');
  await expect(wrap).toBeVisible();
  const box = (await wrap.boundingBox())!;
  // Glissé sur le fond puis double-clic sur une fiche : rien ne doit être sélectionné.
  await page.mouse.move(box.x + 20, box.y + box.height - 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 40, { steps: 6 });
  await page.mouse.up();
  await slotButton(page, 's-ancel').dblclick();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).toBe('');
  expect(await wrap.evaluate((el) => getComputedStyle(el).userSelect)).toBe('none');
});
