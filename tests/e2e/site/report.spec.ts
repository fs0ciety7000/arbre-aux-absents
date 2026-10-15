/**
 * Pages de signalement du site (lot B4, ARCHITECTURE §8, DESIGN §14.6) avec le service simulé
 * (`page.route`) : envoi réussi, 429 avec Retry-After, 503, hors ligne, suivi par le fragment,
 * suppression, problèmes connus ; en français et en anglais ; axe et 390 px.
 *
 * Le serveur e2e (servers/static.mjs) pose la même CSP que nginx : `connect-src` autorise
 * https://arbre-api.cardormedia.com, que `page.route` intercepte ici.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request, type Route } from '@playwright/test';

const API = 'https://arbre-api.cardormedia.com';
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
const DESCRIPTION = 'Le registre paroissial ne s’ouvre plus après l’audition.';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Retry-After',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type',
};

type Handler = (
  req: Request,
) => { status: number; body?: unknown; headers?: Record<string, string> } | 'abort';

/** Service simulé : `handler` par requête, préflight CORS compris. Rend les requêtes reçues. */
async function mockApi(page: Page, handler: Handler) {
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

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    // Une requête refusée par le service simulé est voulue (404, 429, 503, réseau coupé).
    if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(m.text()))
      errors.push(m.text());
  });
  return errors;
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

const receipt = {
  ticket: 'AA-0042',
  token: TOKEN,
  followUrl: `https://arbre.cardormedia.com/suivi/#${TOKEN}`,
};

const ticket = {
  ticket: 'AA-0042',
  status: 'in-progress',
  category: 'blocked',
  createdAt: Date.parse('2026-10-01T10:00:00Z'),
  updatedAt: Date.parse('2026-10-12T10:00:00Z'),
  replies: [
    {
      at: Date.parse('2026-10-12T10:00:00Z'),
      text: '<b>Merci</b> : reproduit.\nCorrectif en cours.',
    },
  ],
};

async function fillForm(page: Page, description = DESCRIPTION) {
  const field = page.getByLabel('Description', { exact: true });
  await expect(field).toBeEnabled();
  await page.getByLabel('Catégorie').selectOption('blocked');
  await field.fill(description);
}

test.describe('/signaler/', () => {
  test('envoi réussi : aperçu exact, reçu, lien de suivi', async ({ page }) => {
    const errors = watchErrors(page);
    const seen = await mockApi(page, () => ({ status: 201, body: receipt }));
    await page.goto('/signaler/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveText('Signaler un problème');

    const send = page.getByRole('button', { name: 'Envoyer le signalement' });
    await expect(send).toBeDisabled();
    await page.getByLabel('Description', { exact: true }).fill('Trop court');
    await expect(page.getByText('Encore 10 caractères avant de pouvoir envoyer.')).toBeVisible();

    await fillForm(page);
    await expect(send).toBeEnabled();
    await page.getByText('Voir exactement ce qui sera envoyé').click();
    const preview = page.locator('details pre');
    await expect(preview).toContainText('"platform": "site"');
    await expect(preview).toContainText('"category": "blocked"');
    await expect(preview).toContainText('registre paroissial');

    await send.click();
    await expect(page.getByRole('heading', { name: 'Signalement reçu' })).toBeFocused();
    await expect(page.getByText('AA-0042', { exact: true })).toBeVisible();
    await expect(page.getByText(`https://arbre.cardormedia.com/suivi/#${TOKEN}`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ouvrir le suivi' })).toHaveAttribute(
      'href',
      `/suivi/#${TOKEN}`,
    );

    expect(seen).toHaveLength(1);
    const body = seen[0]!.postDataJSON();
    expect(body).toMatchObject({
      source: 'site',
      category: 'blocked',
      description: DESCRIPTION,
      locale: 'fr',
      website: '',
      diagnostics: { platform: 'site', edition: 'full', locale: 'fr' },
    });
    expect(body.elapsedMs).toBeGreaterThanOrEqual(3000);
    expect(body).not.toHaveProperty('contact');
    expect(seen[0]!.headers()['authorization']).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test('429 : délai en clair, texte conservé, rapport à copier', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockApi(page, () => ({
      status: 429,
      body: { error: 'rateLimited' },
      headers: { 'Retry-After': '720' },
    }));
    await page.goto('/signaler/');
    await fillForm(page);
    await page.getByLabel('Contact (facultatif)').fill('moi@example.org');
    await page.getByRole('button', { name: 'Envoyer le signalement' }).click();

    const failure = page.getByRole('group', { name: /Le service ne répond pas/ });
    await expect(failure).toBeFocused();
    await expect(failure).toContainText('Réessayez dans 12 minutes');
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue(DESCRIPTION);
    await expect(failure.getByRole('link', { name: 'Forum itch.io' })).toHaveAttribute(
      'href',
      /itch\.io\/.+\/community$/,
    );

    await failure.getByRole('button', { name: 'Copier le rapport' }).click();
    await expect(page.getByText('Rapport copié')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(DESCRIPTION);
    expect(copied).toContain('"platform": "site"');
    expect(copied).not.toContain('moi@example.org');
  });

  test('503 et hors ligne : raison affichée, nouvel essai possible', async ({ page }) => {
    let mode: 'disabled' | 'offline' = 'disabled';
    await mockApi(page, () =>
      mode === 'offline' ? 'abort' : { status: 503, body: { error: 'disabled' } },
    );
    await page.goto('/signaler/');
    await fillForm(page);
    const send = page.getByRole('button', { name: 'Envoyer le signalement' });
    await send.click();
    const failure = page.getByRole('group', { name: /Le service ne répond pas/ });
    await expect(failure).toContainText('Les signalements sont suspendus pour le moment.');

    mode = 'offline';
    await send.click();
    await expect(failure).toContainText('semble hors ligne');
    await expect(page.getByLabel('Description', { exact: true })).toHaveValue(DESCRIPTION);
  });

  test('anglais : textes, lien de suivi sous /en/', async ({ page }) => {
    const seen = await mockApi(page, () => ({
      status: 201,
      body: { ...receipt, followUrl: `https://arbre.cardormedia.com/en/suivi/#${TOKEN}` },
    }));
    await page.goto('/en/signaler/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('Report a problem');
    await page.getByLabel('Category').selectOption('text');
    await page.getByLabel('Description', { exact: true }).fill('The ledger page shows a typo.');
    await page.getByRole('button', { name: 'Send the report' }).click();
    await expect(page.getByRole('heading', { name: 'Report received' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open the follow-up' })).toHaveAttribute(
      'href',
      `/en/suivi/#${TOKEN}`,
    );
    expect(seen[0]!.postDataJSON()).toMatchObject({ locale: 'en', category: 'text' });
  });
});

test.describe('/suivi/', () => {
  test('jeton du fragment : Bearer, fragment effacé, texte brut, suppression', async ({ page }) => {
    const errors = watchErrors(page);
    let deleted = false;
    const seen = await mockApi(page, (req) => {
      if (req.method() === 'DELETE') {
        deleted = true;
        return { status: 204 };
      }
      return deleted ? { status: 404, body: { error: 'invalid' } } : { status: 200, body: ticket };
    });
    const res = await page.goto(`/suivi/#${TOKEN}`);
    expect(res?.headers()['referrer-policy']).toBe('no-referrer');
    expect(res?.headers()['content-security-policy']).toContain(`connect-src 'self' ${API}`);
    await expect(page.getByText('AA-0042')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Suivi du signalement' })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toContainText('En cours');
    expect(new URL(page.url()).hash).toBe('');
    expect(seen[0]!.url()).toBe(`${API}/v1/tickets/current`);
    expect(seen[0]!.headers()['authorization']).toBe(`Bearer ${TOKEN}`);

    // Réponse de l'équipe : texte brut, aucun HTML interprété.
    const reply = page.locator('blockquote');
    await expect(reply).toContainText('<b>Merci</b> : reproduit.');
    await expect(reply.locator('b')).toHaveCount(0);

    expect(await axe(page)).toEqual([]);

    await page.getByRole('button', { name: 'Supprimer mon signalement' }).click();
    const dialog = page.getByRole('dialog', { name: 'Supprimer ce signalement ?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Garder' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Supprimer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Signalement supprimé' })).toBeVisible();
    expect(seen.map((r) => r.method())).toEqual(['GET', 'DELETE']);
    expect(seen[1]!.headers()['authorization']).toBe(`Bearer ${TOKEN}`);
    expect(errors).toEqual([]);
  });

  test('jeton inconnu, absent ; service en panne avec nouvel essai', async ({ page }) => {
    let status = 404;
    const seen = await mockApi(page, () =>
      status === 200 ? { status, body: ticket } : { status, body: { error: 'invalid' } },
    );
    await page.goto(`/suivi/#${TOKEN}`);
    await expect(page.getByRole('heading', { name: 'Ce suivi n’existe plus' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Signaler un problème' }).first()).toBeVisible();

    await page.goto('/suivi/');
    await expect(page.getByRole('heading', { name: 'Aucun lien de suivi' })).toBeVisible();
    expect(seen).toHaveLength(1);

    status = 503;
    await page.goto(`/suivi/#${TOKEN}`);
    await expect(
      page.getByRole('heading', { name: 'Fiche illisible pour le moment' }),
    ).toBeVisible();
    status = 200;
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByText('AA-0042')).toBeVisible();
  });

  test('anglais : statuts du glossaire', async ({ page }) => {
    await mockApi(page, () => ({
      status: 200,
      body: { ...ticket, status: 'fixed', fixedIn: 'v1.2.0', replies: [] },
    }));
    await page.goto(`/en/suivi/#${TOKEN}`);
    await expect(page.getByRole('list', { name: 'Report progress' })).toBeVisible();
    await expect(page.locator('[aria-current="step"]')).toContainText('Fixed in v1.2.0');
    await expect(page.getByText('No reply from the team yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete my report' })).toBeVisible();
  });
});

test.describe('/problemes-connus/', () => {
  const issues = [
    {
      ticket: 'AA-0007',
      title: 'Ancien souci de carte',
      status: 'fixed',
      fixedIn: 'v1.1.0',
      updatedAt: 1_000,
    },
    { ticket: 'AA-0012', title: 'Son coupé sous Android', status: 'confirmed', updatedAt: 3_000 },
  ];

  test('liste triée par mise à jour, dernier tampon', async ({ page }) => {
    const errors = watchErrors(page);
    const seen = await mockApi(page, () => ({ status: 200, body: issues }));
    await page.goto('/problemes-connus/');
    const cards = page.locator('.issues > li');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('Son coupé sous Android');
    await expect(cards.nth(0)).toContainText('Confirmé');
    await expect(cards.nth(1)).toContainText('Corrigé v1.1.0');
    expect(seen[0]!.url()).toBe(`${API}/v1/known-issues?locale=fr`);
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('vide, panne puis nouvel essai, anglais', async ({ page }) => {
    let mode: 'empty' | 'down' | 'list' = 'empty';
    await mockApi(page, () =>
      mode === 'down'
        ? { status: 503, body: { error: 'unavailable' } }
        : { status: 200, body: mode === 'empty' ? [] : issues },
    );
    await page.goto('/problemes-connus/');
    await expect(page.getByText('Aucun problème connu pour l’instant.')).toBeVisible();

    mode = 'down';
    await page.goto('/en/problemes-connus/');
    await expect(page.getByText('The register can’t be read at the moment.')).toBeVisible();
    mode = 'list';
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('.issues > li').first()).toContainText('Son coupé sous Android');
    await expect(page.locator('.issues > li').first()).toContainText('Confirmed');
  });
});

// Accessibilité et petit écran des pages hydratées, service simulé (états chargés).
for (const path of ['/signaler/', '/en/signaler/', '/problemes-connus/', '/en/suivi/']) {
  test(`${path} : axe, 390 px, lien d’évitement`, async ({ page }) => {
    const errors = watchErrors(page);
    await mockApi(page, (req) =>
      req.url().includes('known-issues')
        ? { status: 200, body: [] }
        : { status: 200, body: { ...ticket, status: 'closed', closedReason: 'not-planned' } },
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path.includes('suivi') ? `${path}#${TOKEN}` : path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).not.toHaveAttribute('aria-busy', 'true');
    await page.waitForLoadState('networkidle');
    const { scroll, width } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(width);
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', /^#.+/);
    expect(errors).toEqual([]);
  });
}
