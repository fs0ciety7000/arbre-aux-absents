/**
 * Mise à jour du jeu installé (D18) : le build web (démo itch.io HTML5, `/jouer/`) n'en a aucune
 * trace. Pas d'invite sur l'écran titre, pas de « Rechercher une mise à jour » dans Options ›
 * Données, aucune requête vers GitHub, et ni le plugin updater ni l'API des releases dans le bundle.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { expect, gotoTitle, test } from './helpers';

test('build web : aucune trace de la mise à jour', async ({ page, baseURL }) => {
  const github: string[] = [];
  page.on('request', (r) => {
    if (/(^|\.)github(usercontent)?\.com$/.test(new URL(r.url()).hostname)) github.push(r.url());
  });
  const scripts = new Map<string, Promise<string>>();
  page.on('response', (r) => {
    if (r.request().resourceType() === 'script') scripts.set(r.url(), r.text());
  });

  await gotoTitle(page);
  await expect(page.getByTestId('update-notice')).toHaveCount(0);

  await page.getByRole('button', { name: 'Options' }).click();
  await page.getByRole('tab', { name: 'Données' }).click();
  await expect(page.getByRole('button', { name: 'Signaler un problème' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rechercher une mise à jour' })).toHaveCount(0);
  await expect(page.getByText('Version installée')).toHaveCount(0);
  await expect(page.getByTestId('update-notice')).toHaveCount(0);

  expect(github).toEqual([]);
  // Scripts réellement chargés : ni le plugin updater, ni l'API des releases.
  const sources = await Promise.all(scripts.values());
  expect(sources.length).toBeGreaterThan(0);
  for (const src of sources) {
    expect(src).not.toContain('plugin:updater');
    expect(src).not.toContain('api.github.com');
  }
  expect(baseURL).toBeTruthy();
});

test('build web : le bundle entier ignore la mise à jour', () => {
  // Tous les fragments du build servi (y compris ceux jamais chargés par ce parcours).
  const dist = new URL('../../../node_modules/.cache/arbre-e2e/game-dist/assets/', import.meta.url);
  const files = readdirSync(dist).filter((f) => f.endsWith('.js'));
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    const src = readFileSync(new URL(f, dist), 'utf8');
    expect(src, f).not.toContain('plugin:updater');
    expect(src, f).not.toContain('plugin:process');
    expect(src, f).not.toContain('api.github.com');
  }
});
