/**
 * Signaler un problème depuis le jeu (lot B2, ARCHITECTURE §8, DESIGN §13.8–13.9) avec le service
 * simulé (`page.route`) : envoi réussi et reçu, aperçu exact, sauvegarde anonymisée sur case
 * cochée, 429 avec Retry-After, hors ligne (copier le rapport, forum), « Mes signalements », suivi
 * et suppression ; clavier et axe.
 *
 * Le build du jeu autorise `https://arbre-api.cardormedia.com` dans `connect-src` (vite/splash.ts).
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page, Request, Route } from '@playwright/test';
import { desk, expect, gotoTitle, search, startNewGame, test as base } from './helpers';

const API = 'https://arbre-api.cardormedia.com';
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
const DESCRIPTION = 'Le registre ne s’ouvre plus après la deuxième audition.';
/** Recherche tapée par le joueur (texte libre) : elle ne doit jamais partir. */
const QUERY = 'Zorglub Dupont';

/**
 * Les réponses d'erreur simulées (429, 503, réseau coupé) sont journalisées par Chromium comme
 * « Failed to load resource » : seules ces lignes-là sont tolérées.
 */
const test = base.extend<{ consoleErrors: string[] }>({
  // Remplace le contrôle (automatique) de helpers.ts, en tolérant ces seules lignes.
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
        errors.push(`console: ${m.text()}`);
      }
    });
    await use(errors);
    expect(errors, 'erreurs JavaScript pendant le test').toEqual([]);
  },
});

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Retry-After',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type',
};

type Reply = { status: number; body?: unknown; headers?: Record<string, string> } | 'abort';
type Handler = (req: Request) => Reply;

/** Service simulé : `handler` par requête, préflight CORS compris. Rend les requêtes reçues. */
async function mockApi(page: Page, handler: Handler): Promise<Request[]> {
  const seen: Request[] = [];
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    seen.push(req);
    const out = handler(req);
    if (out === 'abort') {
      await route.abort('internetdisconnected');
      return;
    }
    await route.fulfill({
      status: out.status,
      headers: { ...CORS, 'content-type': 'application/json', ...out.headers },
      body: out.body === undefined ? '' : JSON.stringify(out.body),
    });
  });
  return seen;
}

const receipt = {
  ticket: 'AA-0042',
  token: TOKEN,
  followUrl: `https://arbre.cardormedia.com/suivi/#${TOKEN}`,
};
const ticketView = {
  ticket: 'AA-0042',
  status: 'fixed',
  fixedIn: 'v1.2.0',
  category: 'blocked',
  createdAt: Date.UTC(2026, 9, 12),
  updatedAt: Date.UTC(2026, 9, 14),
  replies: [{ at: Date.UTC(2026, 9, 13), text: 'Merci, corrigé dans la prochaine version.' }],
};

/** Le service répond « reçu », puis sert le ticket et accepte la suppression. */
function happyApi(req: Request): Reply {
  const path = new URL(req.url()).pathname;
  if (path === '/v1/reports' && req.method() === 'POST') return { status: 201, body: receipt };
  if (path === '/v1/tickets/current' && req.method() === 'GET') {
    return { status: 200, body: ticketView };
  }
  if (path === '/v1/tickets/current' && req.method() === 'DELETE') return { status: 204 };
  return { status: 404, body: { error: 'invalid' } };
}

const reportDialog = (page: Page) => page.getByRole('dialog', { name: 'Signaler un problème' });

async function openFromTitle(page: Page) {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Signaler un problème' }).click();
  const dialog = reportDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

test('envoi depuis l’écran titre : aperçu exact, reçu, Mes signalements, suivi et suppression', async ({
  page,
}) => {
  const seen = await mockApi(page, happyApi);
  const dialog = await openFromTitle(page);
  // Focus initial sur le premier champ (catégorie).
  await expect(dialog.getByRole('combobox', { name: 'Catégorie' })).toBeFocused();

  const send = dialog.getByRole('button', { name: 'Envoyer le signalement' });
  await expect(send).toBeDisabled();
  await expect(dialog.getByText('Encore 20 caractères avant de pouvoir envoyer.')).toBeVisible();

  await dialog
    .getByRole('combobox', { name: 'Catégorie' })
    .selectOption({ label: 'Je suis bloqué dans l’enquête' });
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await expect(send).toBeEnabled();
  expect(await axe(page)).toEqual([]);

  // Aperçu du JSON réel : sans sauvegarde tant que la case n'est pas cochée.
  await dialog.getByText('Voir exactement ce qui sera envoyé').click();
  const preview = dialog.locator('pre');
  await expect(preview).toContainText('"source": "game"');
  await expect(preview).toContainText('"category": "blocked"');
  await expect(preview).toContainText(DESCRIPTION);
  await expect(preview).not.toContainText('"save"');
  await expect(dialog.locator('.preview-line')).toHaveText(/^Version \d+\.\d+\.\d+ · /);

  await send.click();
  await expect(dialog.getByRole('heading', { name: 'Signalement reçu' })).toBeVisible();
  await expect(dialog.getByText('AA-0042')).toBeVisible();
  await expect(dialog.getByText(`https://arbre.cardormedia.com/suivi/#${TOKEN}`)).toBeVisible();
  // « Ouvrir le suivi sur le site » : lien de la page de suivi (jeton dans le fragment).
  await page
    .context()
    .route('https://arbre.cardormedia.com/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Suivi</title>' }),
    );
  const popup = page.waitForEvent('popup');
  await dialog.getByRole('button', { name: 'Ouvrir le suivi sur le site' }).click();
  expect((await popup).url()).toBe(`https://arbre.cardormedia.com/suivi/#${TOKEN}`);
  await (await popup).close();

  const post = seen.find((r) => r.method() === 'POST')!;
  const body = post.postDataJSON() as Record<string, unknown>;
  expect(body).toMatchObject({
    source: 'game',
    category: 'blocked',
    description: DESCRIPTION,
    locale: 'fr',
    website: '',
  });
  expect(body).not.toHaveProperty('contact');
  expect((body.diagnostics as Record<string, unknown>).save).toBeUndefined();

  // Mes signalements → fiche de suivi (statut, réponse) → suppression.
  await dialog.getByRole('button', { name: 'Mes signalements' }).click();
  const mine = page.getByRole('dialog', { name: 'Mes signalements' });
  await expect(mine).toBeVisible();
  await mine.getByRole('button', { name: /Je suis bloqué dans l’enquête/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Signalement AA-0042' });
  await expect(sheet.getByRole('list', { name: 'Suivi du signalement' })).toBeVisible();
  await expect(sheet.getByRole('img', { name: /Corrigé v1\.2\.0/ })).toBeVisible();
  await expect(sheet.getByText('Merci, corrigé dans la prochaine version.')).toBeVisible();
  const get = seen.find((r) => r.method() === 'GET')!;
  expect(get.headers().authorization).toBe(`Bearer ${TOKEN}`);
  expect(get.url()).not.toContain(TOKEN);
  expect(await axe(page)).toEqual([]);

  await sheet.getByRole('button', { name: 'Supprimer mon signalement' }).click();
  const confirm = page.getByRole('dialog', { name: 'Supprimer ce signalement ?' });
  await expect(confirm.getByRole('button', { name: 'Garder' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expect(page.getByText('Signalement supprimé.').first()).toBeVisible();
  expect(seen.some((r) => r.method() === 'DELETE')).toBe(true);
  await expect(mine.getByText('Aucun signalement envoyé depuis cet appareil.')).toBeVisible();
});

test('429 : délai en clair, texte conservé, copier le rapport et forum itch.io', async ({
  page,
}) => {
  await mockApi(page, () => ({
    status: 429,
    body: { error: 'rateLimited' },
    headers: { 'Retry-After': '120' },
  }));
  const dialog = await openFromTitle(page);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByRole('button', { name: 'Envoyer le signalement' }).click();
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('Réessayez dans 2 minutes');
  await expect(alert.getByRole('button', { name: 'Copier le rapport' })).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Forum itch.io' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(DESCRIPTION);
  await expect(dialog.getByRole('button', { name: 'Réessayer' })).toBeEnabled();
});

test('hors ligne : rien n’est perdu, le rapport se copie (repli si le presse-papiers refuse)', async ({
  page,
}) => {
  await mockApi(page, () => 'abort');
  const dialog = await openFromTitle(page);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByRole('textbox', { name: 'Contact (facultatif)' }).fill('moi@exemple.test');
  await dialog.getByRole('button', { name: 'Envoyer le signalement' }).click();
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('hors ligne');
  // Presse-papiers refusé (pas de permission en test) : zone de texte à copier, sans contact.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('refusé')) },
    });
  });
  await alert.getByRole('button', { name: 'Copier le rapport' }).click();
  const area = alert.getByRole('textbox', { name: 'Rapport à copier' });
  await expect(area).toBeVisible();
  await expect(area).toHaveValue(new RegExp(DESCRIPTION));
  await expect(area).not.toHaveValue(/moi@exemple\.test/);
});

test('depuis la pause : sauvegarde jointe seulement sur case cochée, anonymisée', async ({
  page,
}) => {
  const seen = await mockApi(page, happyApi);
  await startNewGame(page);
  await search(page, QUERY);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Signaler un problème' })
    .click();
  const dialog = reportDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByText('Voir exactement ce qui sera envoyé').click();
  const preview = dialog.locator('pre');
  await expect(preview).toContainText('"caseId"');
  await expect(preview).not.toContainText('"save"');

  await dialog.getByRole('switch', { name: 'Joindre ma sauvegarde anonymisée' }).click();
  await expect(preview).toContainText('"save": {');
  await expect(preview).not.toContainText(QUERY);
  await expect(dialog.getByText(/Retirés de la sauvegarde/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Envoyer le signalement' }).click();
  await expect(dialog.getByRole('heading', { name: 'Signalement reçu' })).toBeVisible();
  const body = seen.find((r) => r.method() === 'POST')!.postDataJSON() as {
    diagnostics: {
      save?: { notebook: { notes: { text: string }[] }; searchLog: { query: string }[] };
    };
  };
  expect(body.diagnostics.save).toBeDefined();
  expect(JSON.stringify(body)).not.toContain('Zorglub');
  expect(body.diagnostics.save!.searchLog.length).toBeGreaterThan(0);
  for (const q of body.diagnostics.save!.searchLog) expect(q.query).toBe('');
  for (const n of body.diagnostics.save!.notebook.notes) expect(n.text).toBe('');

  // Fermer le reçu rend la main à la pause, puis au Bureau.
  await dialog.getByRole('button', { name: 'Fermer' }).last().click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'Pause' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(desk(page)).toBeVisible();
});

test('depuis l’en-tête du Bureau : « Signaler » au clavier, focus rendu au bouton', async ({
  page,
}) => {
  await mockApi(page, happyApi);
  await startNewGame(page);
  const header = page.getByRole('banner', { name: 'En-tête du bureau' });
  const entry = header.getByRole('button', { name: 'Signaler un problème' });
  await expect(entry).toHaveText('Signaler');
  await entry.focus();
  await page.keyboard.press('Enter');
  const dialog = reportDialog(page);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(entry).toBeFocused();
  await expect(desk(page)).toBeVisible();
});

test.describe('téléphone', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('en-tête du Bureau : icône seule, nom complet, sans débordement', async ({ page }) => {
    await mockApi(page, happyApi);
    await startNewGame(page);
    const header = page.getByRole('banner', { name: 'En-tête du bureau' });
    const entry = header.getByRole('button', { name: 'Signaler un problème' });
    await expect(entry).toBeVisible();
    await expect(entry.locator('.label')).toHaveCount(0); // icône seule (l'infobulle reste)
    const overflow = await header.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await entry.click();
    await expect(reportDialog(page)).toBeVisible();
  });
});

test('clavier : le formulaire se remplit et s’envoie sans souris, Échap le referme', async ({
  page,
}) => {
  await mockApi(page, happyApi);
  const dialog = await openFromTitle(page);
  await page.keyboard.press('Tab'); // catégorie → barre de mise en forme (un seul arrêt)
  await page.keyboard.press('Tab'); // → description
  await page.keyboard.type(DESCRIPTION);
  await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(DESCRIPTION);
  const send = dialog.getByRole('button', { name: 'Envoyer le signalement' });
  await send.focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('heading', { name: 'Signalement reçu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  // Le focus revient au lien de l'écran titre.
  await expect(page.getByRole('button', { name: 'Signaler un problème' })).toBeFocused();
});

test('en anglais : formulaire, délai du 429 et suivi sur /en/suivi/', async ({ page }) => {
  let posts = 0;
  const seen = await mockApi(page, (req) =>
    req.method() === 'POST' && posts++ === 0
      ? { status: 429, body: { error: 'rateLimited' }, headers: { 'Retry-After': '45' } }
      : happyApi(req),
  );
  await page.goto('./?lang=en');
  const skip = page.getByRole('button', { name: 'Skip' }).first();
  const newGame = page.getByRole('button', { name: 'New game' });
  await expect(skip.or(newGame).first()).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: 'Report a problem' }).click();
  const dialog = page.getByRole('dialog', { name: 'Report a problem' });
  await expect(dialog.getByRole('combobox', { name: 'Category' })).toBeFocused();
  await dialog
    .getByRole('textbox', { name: 'Description' })
    .fill('The register no longer opens after the second hearing.');
  await dialog.getByRole('button', { name: 'Send the report' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Try again in 45 seconds');
  await expect(dialog.getByRole('button', { name: 'itch.io forum' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible();
  await expect(dialog.getByText(`https://arbre.cardormedia.com/en/suivi/#${TOKEN}`)).toBeVisible();
  const body = seen.at(-1)!.postDataJSON() as { locale: string; diagnostics: { locale: string } };
  expect([body.locale, body.diagnostics.locale]).toEqual(['en', 'en']);
  expect(await axe(page)).toEqual([]);
});
