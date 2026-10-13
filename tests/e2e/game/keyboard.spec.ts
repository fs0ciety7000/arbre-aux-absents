import type { Page } from '@playwright/test';
import { desk, expect, reader, slotButton, test } from './helpers';

/** Nom lisible de l'élément actif (aria-label, sinon texte). */
const activeName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return '';
    const label = (el as HTMLInputElement).labels?.[0]?.innerText;
    return (el.getAttribute('aria-label') ?? label ?? el.innerText ?? '')
      .trim()
      .replace(/\s+/g, ' ');
  });

/**
 * Tabule jusqu'à l'élément dont le nom correspond (au plus `max` pressions). Sans tenir compte
 * de la casse : `innerText` suit `text-transform` (boutons en capitales Oswald, DESIGN v2).
 */
async function tabTo(page: Page, name: RegExp, max = 60): Promise<void> {
  const re = name.flags.includes('i') ? name : new RegExp(name.source, name.flags + 'i');
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (re.test(await activeName(page))) return;
  }
  throw new Error(`Tab : « ${name} » jamais atteint (dernier : « ${await activeName(page)} »)`);
}

/**
 * L'élément actif porte un anneau de focus visible (DESIGN §9 : outline 3 px), sur lui-même ou
 * sur son composite (fiche dont le titre est le bouton : anneau sur la carte, `:has()`).
 */
async function expectFocusRing(page: Page): Promise<void> {
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    let width = 0;
    for (let n: HTMLElement | null = el, i = 0; n && i < 4; n = n.parentElement, i++) {
      const s = getComputedStyle(n);
      if (s.outlineStyle !== 'none') width = Math.max(width, parseFloat(s.outlineWidth));
    }
    return { width, visible: el.matches(':focus-visible') };
  });
  expect(ring.visible).toBe(true);
  expect(ring.width).toBeGreaterThanOrEqual(2);
}

test('parcours principal au clavier seul', async ({ page }) => {
  await page.goto('./');
  // Écran de lancement : une touche le passe, sans activer en plus le bouton du titre.
  await expect(page.getByRole('button', { name: 'Passer' }).last()).toBeEnabled();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Nouvelle partie' })).toHaveCount(0);

  // Le lien d'évitement précède le menu.
  await page.keyboard.press('Shift+Tab');
  expect(await activeName(page)).toBe('Aller au contenu');
  await expectFocusRing(page);

  await tabTo(page, /^Nouvelle partie$/);
  await expectFocusRing(page);
  await page.keyboard.press('Enter');
  await tabTo(page, /^Commencer$/);
  await page.keyboard.press('Enter');
  await expect(desk(page)).toBeVisible();

  // « / » ouvre le Catalogue (même quand le volet montre le Lecteur) et place le focus.
  await page.keyboard.press('/');
  const query = page.getByRole('textbox', { name: 'Requête' });
  await expect(query).toBeFocused();
  await page.keyboard.type('Ancel Morvan');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Fiches pour « Ancel Morvan »' })).toBeVisible();
  await tabTo(page, /^Lettre d’Ancel à Ida$/);
  await expectFocusRing(page);
  await page.keyboard.press('Enter');
  await expect(reader(page).getByRole('heading', { name: 'Lettre d’Ancel à Ida' })).toBeVisible();

  // Raccourci « 1 » : l'Arbre ; Tab jusqu'à une case, Entrée ouvre sa fiche.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('1');
  await tabTo(page, /case vide$/);
  await expectFocusRing(page);
  // Flèche droite : case voisine (roving tabindex).
  const first = await activeName(page);
  await page.keyboard.press('ArrowRight');
  await expect(slotButton(page, 's-ida')).toBeFocused();
  expect(first).toMatch(/case vide$/);
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
  await expect(sheet).toBeVisible();

  // Prénom : sélecteur (combobox), saisie, flèche, Entrée.
  await tabTo(page, /^prénom/i);
  await page.keyboard.press('Enter');
  const picker = page.getByRole('dialog', { name: 'Choisir : Prénom' });
  await expect(picker).toBeVisible();
  // Le focus arrive directement sur le champ de filtre (pas sur « Fermer »).
  await expect(picker.getByRole('combobox')).toBeFocused();
  await page.keyboard.type('Id');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(picker).toBeHidden();
  await expect(sheet).toContainText('Ida');

  // Échap ferme la fiche ; le focus revient sur la case.
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(slotButton(page, 's-ida')).toBeFocused();

  // Échap sur le Bureau : la pause ; Échap la referme.
  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog', { name: 'Pause' });
  await expect(pause).toBeVisible();
  // Le focus arrive sur « Reprendre » et reste piégé dans la modale (Dialog natif).
  await expect(pause.getByRole('button', { name: 'Reprendre' })).toBeFocused();
  expect(await pause.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(pause).toBeHidden();
});

test('Entrée sur le logo ne relance pas la dernière partie (Continuer)', async ({ page }) => {
  // Une partie sauvegardée : « Continuer » devient le premier bouton (focalisé) du titre.
  await page.goto('./');
  await page.getByRole('button', { name: 'Passer' }).last().click();
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
  await page.keyboard.press('Control+s');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Passer' }).last()).toBeEnabled();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /^Continuer/ })).toBeFocused();
  await expect(desk(page)).toHaveCount(0);
  // Espace aussi.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Passer' }).last()).toBeEnabled();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /^Continuer/ })).toBeFocused();
  await expect(desk(page)).toHaveCount(0);
});
