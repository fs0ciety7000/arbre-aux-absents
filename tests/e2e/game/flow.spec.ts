import {
  expect,
  test,
  desk,
  fillSlot,
  openDocument,
  reader,
  readForElders,
  search,
  showPanel,
  slotButton,
  SOLUTION,
  startNewGame,
} from './helpers';

test.describe('parcours principal', () => {
  test('titre → nouvelle partie → Bureau', async ({ page }) => {
    await startNewGame(page);
    await expect(page.getByRole('banner', { name: 'En-tête du bureau' })).toContainText(
      '0 personne identifiée sur 6',
    );
    await expect(desk(page).getByRole('region', { name: 'Arbre' })).toBeVisible();
  });

  test('ouvrir un document depuis les Archives', async ({ page }) => {
    await startNewGame(page);
    await showPanel(page, /^Archives/);
    await openDocument(page, 'Note du notaire');
    await expect(reader(page)).toContainText('Le notaire m');
    await expect(reader(page)).toContainText('Étude Hallberg');
    // Mot-clé souligné : bouton nommé par son seul texte (le point « nouveau » est décoratif).
    await expect(
      reader(page).getByRole('button', { name: 'Ancel Morvan', exact: true }),
    ).toBeVisible();
  });

  test('chercher un mot-clé dans le Catalogue débloque une fiche', async ({ page }) => {
    await startNewGame(page);
    await search(page, 'Ancel Morvan');
    await expect(
      page.getByRole('tabpanel', { name: 'Catalogue' }).getByText('1 fiche', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lettre d’Ancel à Ida' })).toBeVisible();
    // Terme inconnu : état vide discret, aucune suggestion.
    await search(page, 'Zorglub');
    await expect(
      page.getByRole('tabpanel', { name: 'Catalogue' }).getByText('Aucune fiche pour ce terme.'),
    ).toBeVisible();
    // Historique rejouable.
    await expect(page.getByRole('button', { name: 'Relancer « Ancel Morvan »' })).toBeVisible();
  });
});

test.describe('validation par groupes', () => {
  test('un groupe juste se verrouille seul (validation auto, 800 ms)', async ({ page }) => {
    await startNewGame(page);
    await readForElders(page);
    for (const slot of ['s-ancel', 's-ida', 's-tomas'] as const) {
      await fillSlot(page, slot, SOLUTION[slot]);
    }
    // Carte de révélation « groupe complet » (P13), puis les cases sont établies.
    const reveal = page.getByRole('dialog').filter({ hasText: 'Les aînés' });
    await expect(reveal).toBeVisible({ timeout: 5_000 });
    await reveal.getByRole('button').last().click();
    for (const slot of ['s-ancel', 's-ida', 's-tomas']) {
      await expect(slotButton(page, slot)).toHaveAccessibleName(/case établie$/);
    }
    await expect(page.getByRole('banner', { name: 'En-tête du bureau' })).toContainText(
      '3 personnes identifiées sur 6',
    );
    // Le groupe verrouillé révèle deux nouvelles cases.
    await expect(slotButton(page, 's-maren')).toBeVisible();
    await expect(slotButton(page, 's-oskar')).toBeVisible();
  });

  test('un groupe faux ne donne aucun retour par case', async ({ page }) => {
    await startNewGame(page);
    await readForElders(page);
    await fillSlot(page, 's-ancel', SOLUTION['s-ancel']);
    await fillSlot(page, 's-tomas', SOLUTION['s-tomas']);
    // Ida reçoit le visage de sa sœur Edda : une seule erreur dans le groupe.
    await fillSlot(page, 's-ida', { ...SOLUTION['s-ida'], portrait: 'Femme au fichu' });
    await page.waitForTimeout(1_500); // > 800 ms : l'évaluation a eu lieu
    await expect(page.getByRole('dialog')).toHaveCount(0);
    for (const slot of ['s-ancel', 's-ida', 's-tomas']) {
      const b = slotButton(page, slot);
      await expect(b).toHaveAccessibleName(/case ouverte$/);
      await expect(b).not.toHaveAttribute('aria-invalid', /.*/);
      await expect(b).not.toHaveClass(/\b(locked|wrong|error|invalid)\b/);
    }
    await expect(page.getByRole('banner', { name: 'En-tête du bureau' })).toContainText(
      '0 personne identifiée sur 6',
    );
    // Rien qui désigne la case fausse, ni dans les notifications ni dans les annonces.
    const live = await page.locator('[aria-live], [role="status"], [role="alert"]').allInnerTexts();
    expect(live.join(' ')).not.toMatch(/Ida|portrait|faux|erron/i);
  });
});
