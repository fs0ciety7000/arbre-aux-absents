/**
 * Parcours du jeu sur la fixture `mini` (packages/content-tools/fixtures/mini) : « La malle du
 * grenier », 6 cases en deux groupes de trois. Les ids de case (`data-slot`) et les textes
 * viennent de la fixture ; la solution est écrite ici en clair (tests seulement).
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

/** `test` qui échoue sur toute erreur JavaScript de la page ou `console.error`. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console: ${m.text()}`);
      });
      await use(errors);
      expect(errors, 'erreurs JavaScript pendant le test').toEqual([]);
    },
    { auto: true },
  ],
});

export interface Fill {
  given: string;
  family: string;
  /** Texte alternatif du portrait (galerie des visages). */
  portrait: string;
  occupation: string;
}

export const SOLUTION = {
  's-ancel': {
    given: 'Ancel',
    family: 'Morvan',
    portrait: 'Homme moustachu au col cassé',
    occupation: 'Horloger',
  },
  's-ida': {
    given: 'Ida',
    family: 'Brask',
    portrait: 'Femme aux cheveux tressés',
    occupation: 'Brodeuse',
  },
  's-tomas': {
    given: 'Tomas',
    family: 'Morvan',
    portrait: 'Jeune homme en casquette',
    occupation: 'Passeur du bac',
  },
  's-lena': {
    given: 'Léna',
    family: 'Solvig',
    portrait: 'Femme à lunettes rondes',
    occupation: 'Institutrice',
  },
  's-maren': {
    given: 'Maren',
    family: 'Morvan',
    portrait: 'Jeune femme au chignon',
    occupation: 'Relieuse',
  },
  's-oskar': {
    given: 'Oskar',
    family: 'Morvan',
    portrait: 'Garçon au visage rond',
    occupation: 'Meunier',
  },
} satisfies Record<string, Fill>;

export type SlotKey = keyof typeof SOLUTION;

/** Écran titre (passe l'écran de lancement). */
export async function gotoTitle(page: Page): Promise<void> {
  await page.goto('./');
  const skip = page.getByRole('button', { name: 'Passer' }).first();
  const newGame = page.getByRole('button', { name: 'Nouvelle partie' });
  await expect(skip.or(newGame).first()).toBeVisible();
  await skipLaunch(page);
  await expect(newGame).toBeVisible();
}

/**
 * Passe le logo du studio (E01) s'il est encore affiché. Le logo part seul (2 s au plus) : un clic
 * Playwright sur « Passer » vu visible un instant plus tôt peut viser un écran déjà sorti (caché,
 * puis détaché) et attendre sans fin. Le test et le clic se font donc d'un seul tenant dans la
 * page ; sinon le logo s'escamote de lui-même.
 */
export async function skipLaunch(page: Page): Promise<void> {
  await page.evaluate(() =>
    document.querySelector<HTMLButtonElement>('main.launch .stage')?.click(),
  );
}

/**
 * Titre → Nouvelle partie → Bureau. Le tutoriel en bulles est passé (cran « Aucune ») sauf
 * `tutorial: true` : ses propres tests sont dans `tutorial.spec.ts`.
 */
export async function startNewGame(page: Page, opts: { tutorial?: boolean } = {}): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Nouvelle partie' }).click();
  if (!opts.tutorial)
    await page
      .getByRole('combobox', { name: 'Notes de service' })
      .selectOption({ label: 'Aucune' });
  await page.getByRole('button', { name: 'Commencer' }).click();
  await expect(desk(page)).toBeVisible();
}

export const desk = (page: Page): Locator => page.getByRole('main', { name: 'Bureau' });

/** Ouvre un panneau du Bureau par son onglet (rail, volet ou barre). */
export async function showPanel(page: Page, name: string | RegExp): Promise<void> {
  const tab = page
    .getByRole('tablist', { name: /^(Panneaux du bureau|Volet latéral|Onglets du bureau)$/ })
    .getByRole('tab', { name })
    .first();
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** Consulte le Catalogue. */
export async function search(page: Page, query: string): Promise<void> {
  await showPanel(page, 'Catalogue');
  const field = page.getByRole('textbox', { name: 'Requête' });
  await field.fill(query);
  await page.getByRole('button', { name: 'Consulter' }).click();
  await expect(page.getByRole('heading', { name: `Fiches pour « ${query} »` })).toBeVisible();
}

/** Ouvre une fiche résultat du Catalogue (ou une carte des Archives) par son titre. */
export async function openDocument(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: title, exact: true }).first().click();
  await expect(reader(page).getByRole('heading', { name: title })).toBeVisible();
}

/** Cherche un terme puis lit la fiche indiquée. */
export async function searchAndRead(page: Page, query: string, title: string): Promise<void> {
  await search(page, query);
  await openDocument(page, title);
}

/** Panneau du Lecteur (onglet du volet latéral, ou panneau unique au téléphone). */
export const reader = (page: Page): Locator => page.getByRole('tabpanel', { name: 'Lecteur' });

export const slotButton = (page: Page, slot: string): Locator =>
  page.locator(`[data-tree-view] [data-slot="${slot}"]`);

/** Choisit une valeur dans le sélecteur de candidat (P10) déjà ouvert. */
async function choose(page: Page, field: keyof Fill, value: string): Promise<void> {
  const picker = page.getByRole('dialog', { name: /^Choisir/ });
  await expect(picker).toBeVisible();
  if (field === 'portrait') {
    await picker.getByRole('button', { name: value }).click();
  } else {
    await picker
      .getByRole('option', { name: new RegExp(`^${value}`) })
      .first()
      .click();
  }
  await expect(picker).toBeHidden();
}

const FIELD_ROW: Record<keyof Fill, string> = {
  given: 'Prénom',
  family: 'Nom',
  portrait: 'Portrait',
  occupation: 'Métier',
};

/** Remplit les quatre champs d'une case par sa fiche (P01) et le sélecteur (P10). */
export async function fillSlot(page: Page, slot: string, fill: Partial<Fill>): Promise<void> {
  await showPanel(page, 'Arbre');
  await slotButton(page, slot).click();
  const sheet = page.getByRole('dialog').filter({ hasText: 'Fiche de la case' });
  await expect(sheet).toBeVisible();
  for (const field of ['given', 'family', 'portrait', 'occupation'] as const) {
    const value = fill[field];
    if (value === undefined) continue;
    await sheet
      .getByRole('button', { name: new RegExp(`^${FIELD_ROW[field]}\\b`) })
      .first()
      .click();
    await choose(page, field, value);
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
}

/** Lit ce qu'il faut pour remplir le groupe des aînés (noms, métiers, portraits). */
export async function readForElders(page: Page): Promise<void> {
  await searchAndRead(page, 'Ancel Morvan', 'Lettre d’Ancel à Ida');
  await searchAndRead(page, 'Ida Brask', 'Acte de mariage');
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Photographie de noces');
  await searchAndRead(page, 'Val-Dormant', 'Carte postale du bac');
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Photographie au bac');
}

/** Ferme les cartes de révélation / secrets (P13) en attente. */
export async function dismissReveals(page: Page): Promise<void> {
  const card = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('button', { name: 'Continuer' }) });
  for (let i = 0; i < 6; i++) {
    try {
      await card.first().waitFor({ state: 'visible', timeout: 2_500 });
    } catch {
      return;
    }
    await card.first().getByRole('button', { name: 'Continuer' }).click();
  }
}

/** Remplit puis attend le verrouillage d'un groupe entier. */
export async function lockGroup(page: Page, slots: SlotKey[]): Promise<void> {
  for (const slot of slots) await fillSlot(page, slot, SOLUTION[slot]);
  for (const slot of slots) {
    await expect(slotButton(page, slot)).toHaveAccessibleName(/case établie$/, { timeout: 5_000 });
  }
  await dismissReveals(page);
}

/** Lectures du groupe des cadets (après le verrouillage des aînés). */
export async function readForYounger(page: Page): Promise<void> {
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Lettre de Maren');
  await searchAndRead(page, 'moulin Solvig', 'Réclame du moulin');
  await searchAndRead(page, 'école du Bac', 'Le Petit Écho de la Lisse');
  await showPanel(page, /^Archives/);
  await openDocument(page, 'Frère et sœur');
}

/** Pause → Sauvegarder et quitter → écran titre. */
export async function saveAndQuit(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Pause' }).click();
  const pause = page.getByRole('dialog', { name: 'Pause' });
  await pause.getByRole('button', { name: 'Sauvegarder et quitter' }).click();
  await page
    .getByRole('dialog', { name: 'Revenir à l’écran titre ?' })
    .getByRole('button', { name: 'Sauvegarder et quitter' })
    .click();
  await expect(page.getByRole('button', { name: 'Nouvelle partie' })).toBeVisible();
}
