import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import {
  desk,
  expect,
  fillSlot,
  gotoTitle,
  openDocument,
  reader,
  readForElders,
  search,
  showPanel,
  slotButton,
  SOLUTION,
  startNewGame,
  test,
} from './helpers';

const noHorizontalScroll = async (page: Page) => {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  expect(scroll, 'défilement horizontal').toBeLessThanOrEqual(width);
};

/** Valeur d'un jeton de durée, en millisecondes (`.25s`, `.01ms`). */
const durationMs = (page: Page, token: string) =>
  page.evaluate((t) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(t).trim();
    const n = parseFloat(v);
    return v.endsWith('ms') ? n : n * 1000;
  }, token);

/** Animations en cours de plus de 150 ms (DESIGN §7 : fondus ≤ 150 ms en mouvement réduit). */
const longAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .map((a) => {
        const t = a.effect?.getComputedTiming();
        const el = (a.effect as KeyframeEffect | null)?.target as Element | null;
        const name =
          (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? '?';
        const total = Number(t?.duration ?? 0) * Number(t?.iterations ?? 1);
        return { name, total, on: `${el?.tagName ?? ''}.${el?.getAttribute('class') ?? ''}` };
      })
      .filter((a) => a.total > 150),
  );

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

test.describe('mouvement réduit', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('durées quasi nulles, aucune animation longue', async ({ page }) => {
    await startNewGame(page);
    expect(await durationMs(page, '--dur-open')).toBeLessThan(1);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('dialog', { name: 'Pause' })).toBeVisible();
    const long = await longAnimations(page);
    expect(long, 'animations de plus de 150 ms').toEqual([]);
  });

  test('le tampon de verrouillage ne rebondit pas', async ({ page }) => {
    test.setTimeout(90_000);
    await startNewGame(page);
    await readForElders(page);
    for (const slot of ['s-ancel', 's-ida', 's-tomas'] as const) {
      await fillSlot(page, slot, SOLUTION[slot]);
    }
    await expect(page.getByRole('dialog').filter({ hasText: 'Les aînés' })).toBeVisible();
    const long = await longAnimations(page);
    expect(long).toEqual([]);
  });

  test('le réglage « Animations : Réduites » suffit, même sans préférence système', async ({
    browser,
    baseURL,
  }) => {
    const page = await browser.newPage({ baseURL });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoTitle(page);
    expect(await durationMs(page, '--dur-open')).toBe(250);
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('tab', { name: 'Affichage' }).click();
    await page.getByRole('combobox', { name: 'Animations' }).selectOption({ label: 'Réduites' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    expect(await durationMs(page, '--dur-open')).toBeLessThan(1);
    await page.close();
  });
});

test.describe('téléphone 360 px', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('titre, nouvelle partie et Bureau sans défilement horizontal', async ({ page }) => {
    await gotoTitle(page);
    await noHorizontalScroll(page);
    await page.getByRole('button', { name: 'Nouvelle partie' }).click();
    await noHorizontalScroll(page);
    // Tutoriel laissé actif exprès : sa note ne doit pas faire déborder l'écran non plus.
    await page.getByRole('button', { name: 'Commencer' }).click();
    await expect(desk(page)).toBeVisible();
    await noHorizontalScroll(page);
    // Barre d'onglets basse : un panneau à la fois.
    const bar = page.getByRole('navigation', { name: /onglets|panneaux/i }).last();
    for (const name of ['Arbre', 'Archives', 'Catalogue', 'Carnet', 'Carte']) {
      await expect(bar.getByRole('tab', { name: new RegExp(`^${name}`) })).toBeVisible();
    }
    for (const name of [/^Archives/, 'Catalogue', 'Carnet', 'Carte', 'Arbre']) {
      await showPanel(page, name);
      await noHorizontalScroll(page);
    }
  });

  test('chercher, lire, remplir une case', async ({ page }) => {
    test.setTimeout(90_000);
    await startNewGame(page);
    await search(page, 'Ancel Morvan');
    await noHorizontalScroll(page);
    await openDocument(page, 'Lettre d’Ancel à Ida');
    await expect(reader(page)).toContainText('Ma chère Ida');
    await noHorizontalScroll(page);
    const { given, family } = SOLUTION['s-ancel'];
    await fillSlot(page, 's-ancel', { given, family });
    await expect(slotButton(page, 's-ancel')).toHaveAccessibleName(/^Ancel Morvan, case ouverte$/);
    await noHorizontalScroll(page);
  });

  test('« / » ouvre le Catalogue en plein écran', async ({ page }) => {
    await startNewGame(page);
    await page.keyboard.press('/');
    await expect(page.getByRole('textbox', { name: 'Requête' })).toBeFocused();
  });

  test('axe : Bureau au téléphone', async ({ page }) => {
    await startNewGame(page);
    expect(await axe(page)).toEqual([]);
  });
});

test.describe('axe (WCAG 2.2 AA)', () => {
  test('titre, nouvelle partie, Bureau, Catalogue, Lecteur, fiche, sélecteur, pause', async ({
    page,
  }) => {
    await gotoTitle(page);
    expect(await axe(page), 'titre').toEqual([]);
    await page.getByRole('button', { name: 'Nouvelle partie' }).click();
    expect(await axe(page), 'nouvelle partie').toEqual([]);
    // Tutoriel passé : la note de service a son propre audit (tutorial.spec.ts).
    await page.getByRole('switch', { name: "J'ai déjà joué" }).click();
    await page.getByRole('button', { name: 'Commencer' }).click();
    await expect(desk(page)).toBeVisible();
    expect(await axe(page), 'Bureau').toEqual([]);
    await search(page, 'Ancel Morvan');
    expect(await axe(page), 'Catalogue').toEqual([]);
    await openDocument(page, 'Lettre d’Ancel à Ida');
    expect(await axe(page), 'Lecteur').toEqual([]);
    await showPanel(page, 'Arbre');
    await page.locator('[data-tree-view] [data-slot="s-ancel"]').click();
    expect(await axe(page), 'fiche de case').toEqual([]);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Prénom/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'Choisir : Prénom' })).toBeVisible();
    expect(await axe(page), 'sélecteur').toEqual([]);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Pause' }).click();
    expect(await axe(page), 'pause').toEqual([]);
  });
});
