/**
 * Champ Marque (affaire 3, docs/game/AFFAIRE-3.md §1, §3) sur la fixture `marks`
 * (tests/e2e/fixtures/marks) : la case d'Ancel (`s-ancel`) attend une marque ; la note de départ
 * dessine deux marques (`::mark`), « Fourche ; pied lisse » (Ancel) et « Fourche ; pied : entaille
 * à gauche » (Edda, leurre) ; le bulletin est une pièce `recording`. Les autres cases restent des
 * cases à visage ; l'affaire `mini` ne change pas d'aspect.
 */
import type { Locator, Page } from '@playwright/test';
import {
  desk,
  expect,
  gotoTitle,
  openDocument,
  reader,
  showPanel,
  slotButton,
  test,
} from '../helpers';

const MARKS = 'Les marques du gué';
const MINI = 'La malle du grenier';
const ANCEL = 'Fourche ; pied lisse';
const EDDA = 'Fourche ; pied : entaille à gauche';

const folders = (page: Page): Locator => page.getByRole('group', { name: 'Choisir une affaire' });
const sheet = (page: Page): Locator =>
  page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
const picker = (page: Page): Locator => page.getByRole('dialog', { name: /^Choisir/ });
const toast = (page: Page, text: string): Locator =>
  page.locator('section[aria-live="polite"]').getByText(text, { exact: true });

async function startCase(page: Page, title: string): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await folders(page).getByRole('radio', { name: title }).check();
  await page.getByRole('combobox', { name: 'Notes de service' }).selectOption({ label: 'Aucune' });
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
}

async function readIntro(page: Page): Promise<void> {
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Note du notaire');
}

test('case à marque : bande « Marque », nom accessible, cases à visage inchangées', async ({
  page,
}) => {
  await startCase(page, MARKS);
  await showPanel(page, 'Arbre');
  const ancel = slotButton(page, 's-ancel');
  await expect(ancel).toHaveAttribute('data-field-kind', 'mark');
  await expect(ancel).toContainText('Marque');
  await expect(ancel).toHaveAccessibleName(
    /^Génération \d+, case non établie\. Prénom : vide\. Nom : vide\. Marque : vide\. Métier : vide\.$/,
  );
  const ida = slotButton(page, 's-ida');
  await expect(ida).not.toHaveAttribute('data-field-kind', 'mark');
  await expect(ida).toHaveAccessibleName(/case vide$/);

  // Fiche de la case : le champ s'appelle « Marque » ; le sélecteur ne propose rien encore.
  await ancel.click();
  const s = sheet(page);
  await s.getByRole('button', { name: /^Marque\b/ }).click();
  await expect(picker(page)).toHaveAccessibleName('Choisir : Marque');
  await expect(picker(page)).toContainText('aucune marque');
});

test('Lecteur : marques dessinées, agrandissement, transcription ; dépôt filtré par type', async ({
  page,
}) => {
  await startCase(page, MARKS);
  await readIntro(page);
  const r = reader(page);
  // Original : le dessin, nommé par sa description, ≥ 44 px de cible.
  const mark = r.getByRole('button', { name: `Marque : ${ANCEL}` });
  await expect(mark).toBeVisible();
  const box = await mark.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(r.getByRole('button', { name: `Marque : ${EDDA}` })).toBeVisible();
  // Section des marques de la pièce (pas « Visages de ce document »).
  await expect(r.getByRole('heading', { name: 'Marques de ce document' })).toBeVisible();
  await expect(r.getByRole('heading', { name: 'Visages de ce document' })).toHaveCount(0);

  // Transcription : « [marque : description] ».
  await r.getByRole('button', { name: 'Transcription' }).click();
  await expect(r).toContainText(`[marque : ${ANCEL}]`);
  await r.getByRole('button', { name: 'Original' }).click();

  // Entrée sur la marque : agrandissement (320 px) et « Utiliser dans l'arbre ».
  await r.getByRole('button', { name: `Marque : ${ANCEL}` }).press('Enter');
  const big = page.getByRole('dialog', { name: 'Marque' });
  await expect(big).toContainText(ANCEL);
  await big.getByRole('button', { name: 'Utiliser dans l’arbre' }).click();
  await expect(big).toBeHidden();

  // En main, une marque : la case à visage n'est pas une cible (même raison), refus neutre.
  await showPanel(page, 'Arbre');
  const ida = slotButton(page, 's-ida');
  await expect(ida).toHaveAttribute('aria-disabled', 'true');
  await expect(ida).toHaveAccessibleDescription('Ce champ attend un portrait.');
  await ida.click({ force: true }); // aria-disabled : le clic reste possible et annonce la raison
  await expect(toast(page, 'Ce champ attend un portrait.')).toBeVisible();
  await expect(ida).toHaveAccessibleName(/case vide$/);
  // La case à marque la reçoit.
  const ancel = slotButton(page, 's-ancel');
  await expect(ancel).not.toHaveAttribute('aria-disabled', 'true');
  await ancel.click();
  await expect(ancel).toHaveAccessibleName(new RegExp(`Marque : ${ANCEL}\\.`));
});

test('sélecteur et galerie : marques seules, onglets Visages / Marques', async ({ page }) => {
  await startCase(page, MARKS);
  await readIntro(page);

  // Sélecteur du champ Marque : les deux marques, numérotées comme dans leur onglet.
  await showPanel(page, 'Arbre');
  await slotButton(page, 's-ancel').click();
  await sheet(page)
    .getByRole('button', { name: /^Marque\b/ })
    .click();
  const p = picker(page);
  const grid = p.getByRole('list', { name: 'Marques collectées' });
  await expect(grid.getByRole('button')).toHaveCount(2);
  await expect(grid.getByRole('button', { name: /Marque n° 1/ })).toBeVisible();
  await expect(p.getByText('2 marques')).toBeVisible();
  await grid.getByRole('button', { name: new RegExp(EDDA) }).click();
  await expect(p).toBeHidden();
  await expect(slotButton(page, 's-ancel')).toHaveAccessibleName(new RegExp(`Marque : ${EDDA}\\.`));
  await page.keyboard.press('Escape');

  // Champ Portrait d'une case à visage : aucune marque proposée (aucun visage lu).
  await slotButton(page, 's-ida').click();
  await sheet(page)
    .getByRole('button', { name: /^Portrait\b/ })
    .click();
  await expect(picker(page)).toContainText('aucun visage');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');

  // Galerie : « Galerie », onglets avec leurs nombres ; l'onglet du plus récent (une marque).
  await showPanel(page, 'Galerie');
  const tabs = page.getByRole('tablist', { name: 'Visages ou marques' });
  await expect(tabs.getByRole('tab', { name: 'Visages (0)' })).toBeVisible();
  const marks = tabs.getByRole('tab', { name: 'Marques (2)' });
  await expect(marks).toHaveAttribute('aria-selected', 'true');
  const panel = page.getByRole('tabpanel', { name: 'Marques (2)' });
  await expect(panel.getByText('Marque n° 1')).toBeVisible();
  await expect(panel.getByText(ANCEL, { exact: true })).toBeVisible();
  await expect(panel.getByText('Utilisée dans 1 case')).toBeVisible();
  // Clavier : flèche = autre onglet.
  await marks.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.getByRole('tab', { name: 'Visages (0)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

/**
 * Lignes occupées par le texte d'un élément : un libellé de trois mots ne doit jamais tenir sur
 * plus de trois lignes (coupure au milieu d'un mot). Les sommets des caractères sont regroupés à
 * une demi-hauteur près : pendant l'entrée animée (`mv-deal`, légère rotation), ceux d'une même
 * ligne diffèrent de quelques dixièmes de pixel.
 */
async function textLines(el: Locator): Promise<number> {
  return el.evaluate((node) => {
    const boxes: { top: number; height: number }[] = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const text = t.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        if (!text[i]!.trim()) continue;
        const r = document.createRange();
        r.setStart(t, i);
        r.setEnd(t, i + 1);
        const box = r.getBoundingClientRect();
        if (box.height > 0) boxes.push({ top: box.top, height: box.height });
      }
    }
    boxes.sort((a, b) => a.top - b.top);
    let lines = 0;
    let lineTop = Number.NEGATIVE_INFINITY;
    for (const b of boxes) {
      if (b.top - lineTop > b.height / 2) {
        lines++;
        lineTop = b.top;
      }
    }
    return lines;
  });
}

test('case à marque vide : l’aide « Déposer une pièce » reste dans la fiche', async ({ page }) => {
  // QA affaire 3 : `.occ.hint { display: block }` annule le `line-clamp` de `.slot.mark-slot .occ` ;
  // sous la marque (72 px + bande), la deuxième ligne de l'aide déborde sous la fiche de 168 px.
  await startCase(page, MARKS);
  await showPanel(page, 'Arbre');
  const ancel = slotButton(page, 's-ancel');
  await expect(ancel).toBeVisible();
  const slot = (await ancel.boundingBox())!;
  const hint = (await ancel.locator('.hint').boundingBox())!;
  expect(hint.y + hint.height).toBeLessThanOrEqual(slot.y + slot.height + 1);
});

test('galerie, onglet Marques : « Utiliser dans l’arbre » sans coupure dans les mots', async ({
  page,
}) => {
  // QA affaire 3 : `.gallery.marks` (minmax(min(6.5rem, 30%), 1fr)) donne des colonnes de
  // ~104 px ; le bouton (Oswald capitales) s'y coupe lettre à lettre (« UTI / LISE / R … »).
  await startCase(page, MARKS);
  await readIntro(page);
  await showPanel(page, 'Galerie');
  const panel = page.getByRole('tabpanel', { name: 'Marques (2)' });
  const use = panel.getByRole('button', { name: 'Utiliser dans l’arbre' }).first();
  await expect(use).toBeVisible();
  expect(await textLines(use)).toBeLessThanOrEqual(3);
});

test.describe('téléphone 360 px', () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });

  test('galerie des marques : deux colonnes, libellés sans coupure dans les mots', async ({
    page,
  }) => {
    await startCase(page, MARKS);
    await readIntro(page);
    // Au téléphone, la Galerie est dans le menu (panneaux secondaires).
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('button', { name: /^Galerie/ }).click();
    const panel = page.getByRole('tabpanel', { name: 'Marques (2)' });
    const tiles = panel.locator('ul.gallery > li');
    await expect(tiles).toHaveCount(2);
    const [a, b] = [(await tiles.nth(0).boundingBox())!, (await tiles.nth(1).boundingBox())!];
    // Même rangée, côte à côte (l'entrée animée décale de quelques pixels).
    expect(Math.abs(a.y - b.y)).toBeLessThan(a.height / 2);
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.width - 1);
    const use = panel.getByRole('button', { name: 'Utiliser dans l’arbre' }).first();
    await expect(use).toBeVisible();
    expect(await textLines(use)).toBeLessThanOrEqual(3);
    expect(await textLines(panel.getByText('Marque n° 1'))).toBe(1);
  });

  test('case à marque vide : l’aide reste dans la fiche', async ({ page }) => {
    await startCase(page, MARKS);
    await showPanel(page, 'Arbre');
    const ancel = slotButton(page, 's-ancel');
    await expect(ancel).toBeVisible();
    const slot = (await ancel.boundingBox())!;
    const hint = (await ancel.locator('.hint').boundingBox())!;
    expect(hint.y + hint.height).toBeLessThanOrEqual(slot.y + slot.height + 1);
  });
});

test('pièce recording : libellé « Enregistrement », feuille pelure', async ({ page }) => {
  await startCase(page, MARKS);
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Le Petit Écho de la Lisse');
  const r = reader(page);
  await expect(r.locator('.doc-kicker')).toContainText('Enregistrement');
  await expect(r.locator('.sheet')).toHaveClass(/\bkind-recording\b/);
  await expect(r.locator('.sheet')).toHaveClass(/\btone-onion\b/);
});

test('aide : fiche « Marques » dans l’affaire à marques seulement', async ({ page }) => {
  await startCase(page, MARKS);
  await showPanel(page, 'Aide');
  await expect(page.getByRole('heading', { name: 'Marques', exact: true })).toBeVisible();

  await startCase(page, MINI);
  await showPanel(page, 'Aide');
  await expect(page.getByRole('heading', { name: 'Comment jouer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Marques', exact: true })).toHaveCount(0);
  // L'affaire sans marque garde sa « Galerie des visages », sans onglets.
  await showPanel(page, 'Galerie des visages');
  await expect(page.getByRole('tablist', { name: 'Visages ou marques' })).toHaveCount(0);
});
