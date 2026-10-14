/**
 * Régressions relevées pendant les captures d'écran :
 * - métier des fiches de l'arbre coupé au milieu d'un mot (360 px et desktop) ;
 * - illustration d'en-tête des documents (`illustration:` du frontmatter) jamais affichée ;
 * - groupes établis tout seuls à la reprise d'une partie (aucun déclencheur R1).
 */
import type { Page } from '@playwright/test';
import {
  desk,
  expect,
  fillSlot,
  gotoTitle,
  openDocument,
  reader,
  readForElders,
  saveAndQuit,
  search,
  searchAndRead,
  showPanel,
  slotButton,
  SOLUTION,
  startNewGame,
  test,
  type SlotKey,
} from './helpers';

const ELDERS: SlotKey[] = ['s-ancel', 's-ida', 's-tomas'];

/** Chaque mot du métier tient sur une seule ligne, rien ne déborde de la fiche. */
async function expectWholeWords(page: Page): Promise<void> {
  const report = await page
    .locator('[data-tree-view] [data-slot] .occ:not(.hint)')
    .evaluateAll((els) =>
      els.map((el) => {
        const text = el.textContent ?? '';
        const node = el.firstChild;
        const split: string[] = [];
        if (node && node.nodeType === Node.TEXT_NODE) {
          // Mots séparés par des espaces ; un trait d'union existant est un point de coupure permis.
          for (const m of text.matchAll(/[^\s-]+-?/g)) {
            const r = document.createRange();
            r.setStart(node, m.index);
            r.setEnd(node, m.index + m[0].length);
            const tops = new Set([...r.getClientRects()].map((x) => Math.round(x.top)));
            if (tops.size > 1) split.push(m[0]);
          }
        }
        return { text, split, overflow: el.scrollWidth - el.clientWidth };
      }),
    );
  expect(report.length).toBeGreaterThan(0);
  for (const r of report) {
    expect(r.split, `mot coupé dans « ${r.text} »`).toEqual([]);
    expect(r.overflow, `débordement de « ${r.text} »`).toBeLessThanOrEqual(0);
  }
}

/** Un métier fait d'un seul très long mot : le corps se réduit pour qu'il tienne, sans coupure. */
async function expectLongWordShrinks(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const res = await page
    .locator('[data-tree-view] [data-slot] .occ:not(.hint)')
    .first()
    .evaluate((el: HTMLElement) => {
      const before = parseFloat(getComputedStyle(el).fontSize);
      // Plus long que tout métier de l'affaire, mais lisible : au-delà (~25 lettres), le corps
      // tomberait sous la taille minimale de police du navigateur (6 px) et déborderait.
      const word = 'Contremaîtresse';
      el.textContent = word;
      el.style.setProperty('--occ-chars', String(word.length));
      const after = parseFloat(getComputedStyle(el).fontSize);
      // Largeur réelle du texte (Range) contre la boîte : scrollWidth/clientWidth arrondissent
      // chacun de leur côté et donnent 1 px de « débordement » fantôme selon la largeur.
      const range = document.createRange();
      range.selectNodeContents(el);
      const text = range.getBoundingClientRect().width;
      const box = el.getBoundingClientRect().width;
      return { before, after, overflow: text - box - 0.5 };
    });
  expect(res.after).toBeLessThan(res.before);
  expect(res.overflow).toBeLessThanOrEqual(0);
}

async function fillOccupations(page: Page, slots: SlotKey[]): Promise<void> {
  await readForElders(page);
  for (const slot of slots) {
    const { portrait, occupation } = SOLUTION[slot];
    await fillSlot(page, slot, { portrait, occupation });
  }
  await showPanel(page, 'Arbre');
}

test.describe('fiches de l’arbre : métier', () => {
  test('desktop : le métier ne se coupe qu’entre les mots', async ({ page }) => {
    test.setTimeout(90_000);
    await startNewGame(page);
    await fillOccupations(page, ['s-tomas', 's-ida']);
    await expect(slotButton(page, 's-tomas').locator('.occ')).toHaveText('Passeur du bac');
    await expectWholeWords(page);
    await expectLongWordShrinks(page);
  });

  test.describe('téléphone 360 px', () => {
    test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

    test('le métier ne se coupe qu’entre les mots', async ({ page }) => {
      test.setTimeout(120_000);
      await startNewGame(page);
      // Vue par génération au téléphone : cases de la première génération.
      await fillOccupations(page, ['s-ancel', 's-ida']);
      await expectWholeWords(page);
      // Métier de plusieurs mots (contenu réel : « Capitaine au long cours ») : coupé entre les mots.
      await page
        .locator('[data-tree-view] [data-slot] .occ:not(.hint)')
        .first()
        .evaluate((el: HTMLElement) => {
          el.textContent = 'Capitaine au long cours';
          el.style.setProperty('--occ-chars', '9');
        });
      await expectWholeWords(page);
      await expectLongWordShrinks(page);
    });
  });
});

test('Lecteur : l’illustration d’en-tête du document est affichée, avec son texte alternatif', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const alt = 'Un couple de jeunes mariés pose debout, côte à côte';
  await startNewGame(page);
  await searchAndRead(page, 'Ancel Morvan', 'Lettre d’Ancel à Ida');
  await searchAndRead(page, 'Ida Brask', 'Acte de mariage');
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Photographie de noces');

  const art = reader(page).locator('figure.lead');
  await expect(art).toHaveCount(1);
  const img = art.getByRole('img', { name: alt });
  await expect(img).toBeVisible();
  await expect(img.locator('svg')).toHaveCount(1);
  // Entre le titre et le texte de la pièce.
  const order = await reader(page)
    .locator('.sheet-rustle > .sheet')
    .evaluate((sheet) =>
      [...sheet.querySelectorAll('.doc-title, figure.lead, .reading')].map((e) => e.className),
    );
  expect(order.map((c) => c.split(' ')[0])).toEqual(['doc-title', 'doc-figure', 'reading']);

  // Transcription : le texte alternatif en clair, pas d'image.
  await reader(page).getByRole('button', { name: 'Transcription' }).click();
  await expect(art.getByRole('img')).toHaveCount(0);
  await expect(art).toContainText(alt);

  // Pièce dont le corps contient déjà la même figure : pas de doublon.
  await reader(page).getByRole('button', { name: 'Original' }).click();
  await search(page, 'Val-Dormant');
  await openDocument(page, 'Carte postale du bac');
  await expect(reader(page).locator('figure.lead')).toHaveCount(0);
});

test.describe('reprise d’une partie : aucun groupe établi sans déclencheur', () => {
  async function setValidation(page: Page, value: 'Automatique' | 'Bouton'): Promise<void> {
    await page.getByRole('button', { name: 'Options' }).first().click();
    const select = page.getByLabel('Validation des cases');
    const option = await select
      .locator('option')
      .filter({ hasText: new RegExp(`^${value}`) })
      .getAttribute('value');
    await select.selectOption(option!);
    await page.getByRole('button', { name: 'Retour' }).first().click();
    await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeVisible();
  }

  async function continueGame(page: Page): Promise<void> {
    await page.getByRole('button', { name: /^Continuer/ }).click();
    await expect(desk(page)).toBeVisible();
    await showPanel(page, 'Arbre');
  }

  const expectOpen = async (page: Page, slots: SlotKey[]) => {
    for (const slot of slots) {
      await expect(slotButton(page, slot)).toHaveAccessibleName(/case ouverte$/);
    }
  };

  test('groupe faux ou partiel : toujours ouvert après rechargement', async ({ page }) => {
    test.setTimeout(120_000);
    await startNewGame(page);
    await readForElders(page);
    await fillSlot(page, 's-ancel', { ...SOLUTION['s-ancel'], occupation: 'Brodeuse' });
    await fillSlot(page, 's-ida', SOLUTION['s-ida']);
    const { given, family } = SOLUTION['s-tomas'];
    await fillSlot(page, 's-tomas', { given, family });
    await page.waitForTimeout(1_500);
    await expectOpen(page, ELDERS);
    await saveAndQuit(page);

    await page.reload();
    const skip = page.getByRole('button', { name: 'Passer' }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await continueGame(page);
    await page.waitForTimeout(1_500);
    await expectOpen(page, ELDERS);
  });

  test('groupe juste jamais évalué : ouvert à la reprise, établi par le déclencheur normal', async ({
    page,
  }) => {
    test.setTimeout(150_000);
    // Rempli en validation manuelle sans « Soumettre la branche » : juste, mais jamais évalué.
    await gotoTitle(page);
    await setValidation(page, 'Bouton');
    await startNewGame(page);
    await readForElders(page);
    for (const slot of ELDERS) await fillSlot(page, slot, SOLUTION[slot]);
    await page.waitForTimeout(1_500);
    await expectOpen(page, ELDERS);
    await saveAndQuit(page);

    // Reprise en validation automatique : le chargement n'est pas un déclencheur (R1).
    await setValidation(page, 'Automatique');
    await continueGame(page);
    await page.waitForTimeout(2_000);
    await expectOpen(page, ELDERS);
    await expect(page.getByRole('dialog', { name: /Révélation|établie/ })).toHaveCount(0);

    // Déclencheur normal : une case du groupe change et reste complète → établi 800 ms après.
    await fillSlot(page, 's-tomas', { occupation: 'Brodeuse' });
    await fillSlot(page, 's-tomas', { occupation: SOLUTION['s-tomas'].occupation });
    for (const slot of ELDERS) {
      await expect(slotButton(page, slot)).toHaveAccessibleName(/case établie$/, {
        timeout: 5_000,
      });
    }
  });
});
