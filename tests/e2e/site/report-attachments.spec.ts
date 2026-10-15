/**
 * /signaler/ et /suivi/ du site, v2.5 (ARCHITECTURE §8, DESIGN §9.37–9.38, §14.6) avec le service
 * simulé : barre Markdown et aperçu, captures (fichier, collage, retrait), version et plateforme du
 * jeu déclarées, « Informations envoyées », galerie du suivi (CSP `img-src` du service) ; axe, 390 px.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request, type Route } from '@playwright/test';

const API = 'https://arbre-api.cardormedia.com';
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
const DESCRIPTION = 'Le registre paroissial ne s’ouvre plus après l’audition.';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Retry-After',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type',
};
const idOf = (n: number) => `AttachmentId0000000000${n}`.slice(-22);

async function mockApi(page: Page) {
  const seen: Request[] = [];
  let n = 0;
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    seen.push(req);
    const { pathname } = new URL(req.url());
    const reply = (status: number, body?: unknown) =>
      route.fulfill({
        status,
        headers: { ...CORS, 'content-type': 'application/json' },
        body: body === undefined ? '' : JSON.stringify(body),
      });
    if (pathname === '/v1/attachments' && req.method() === 'POST') {
      n++;
      return reply(201, {
        id: idOf(n),
        type: 'image/png',
        width: 1,
        height: 1,
        bytes: PNG.length,
        expiresAt: Date.now() + 3_600_000,
      });
    }
    if (pathname.startsWith('/v1/attachments/') && req.method() === 'DELETE') return reply(204);
    if (pathname.startsWith('/v1/attachments/')) {
      return route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'image/png' },
        body: PNG,
      });
    }
    if (pathname === '/v1/reports') {
      const body = req.postDataJSON() as { attachments?: string[] };
      return reply(201, {
        ticket: 'AA-0042',
        token: TOKEN,
        followUrl: `https://arbre.cardormedia.com/suivi/#${TOKEN}`,
        ...(body.attachments ? { attachments: body.attachments.length } : {}),
      });
    }
    if (pathname === '/v1/tickets/current') {
      return reply(200, {
        ticket: 'AA-0042',
        status: 'received',
        category: 'display',
        createdAt: Date.parse('2026-10-01T10:00:00Z'),
        updatedAt: Date.parse('2026-10-01T10:00:00Z'),
        replies: [],
        attachments: [1, 2].map((i) => ({
          id: idOf(i),
          url: `${API}/v1/attachments/${idOf(i)}?sig=${'s'.repeat(43)}`,
          type: 'image/png',
          width: 1,
          height: 1,
        })),
      });
    }
    return reply(404, { error: 'invalid' });
  });
  return seen;
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

async function noHorizontalScroll(page: Page) {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(width);
}

test('/signaler/ : Markdown, captures, version et plateforme du jeu, informations envoyées', async ({
  page,
}) => {
  const errors = watchErrors(page);
  const seen = await mockApi(page);
  await page.goto('/signaler/');
  const field = page.getByLabel('Description', { exact: true });
  await expect(field).toBeEnabled();
  await field.fill(DESCRIPTION);

  // Barre d'outils : liste à puces sur la ligne, raccourci Ctrl+B, aperçu.
  const toolbar = page.getByRole('toolbar', { name: 'Mise en forme' });
  await field.press('End');
  await page.keyboard.press('Enter');
  await toolbar.getByRole('button', { name: 'Liste à puces' }).click();
  await page.keyboard.type('étape ');
  await page.keyboard.press('Control+b');
  await page.keyboard.type('deux');
  await expect(field).toHaveValue(`${DESCRIPTION}\n- étape **deux**`);
  await toolbar.getByRole('button', { name: 'Aperçu' }).click();
  const region = page.getByRole('region', { name: 'Aperçu de la description' });
  await expect(region.getByRole('listitem')).toHaveText('étape deux');
  await expect(region.locator('strong')).toHaveText('deux');
  await toolbar.getByRole('button', { name: 'Aperçu' }).click();

  // La barre : un seul arrêt de tabulation, flèches pour circuler.
  await toolbar.getByRole('button', { name: /^Gras/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(toolbar.getByRole('button', { name: /^Italique/ })).toBeFocused();
  await page.keyboard.press('End');
  await expect(toolbar.getByRole('button', { name: 'Aperçu' })).toBeFocused();

  // Captures : fichier, collage ; retrait.
  const tray = page.getByRole('group', { name: 'Captures d’écran (facultatif)' });
  await tray.locator('input[type=file]').setInputFiles({
    name: 'ecran.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(tray.getByRole('img', { name: 'Capture 1' })).toBeVisible();
  await field.evaluate((el, b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], 'collée.png', { type: 'image/png' }));
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  }, PNG.toString('base64'));
  await expect(tray.getByText('Jointe')).toHaveCount(2);
  await tray.getByRole('button', { name: 'Retirer la capture 1 (ecran.png)' }).click();
  await expect(tray.getByRole('img')).toHaveCount(1);
  await expect.poll(() => seen.filter((r) => r.method() === 'DELETE').length).toBe(1);

  // Version du jeu préremplie (la dernière), modifiable ; mauvais format = envoi bloqué.
  const version = page.getByLabel('Version du jeu (facultatif)');
  await expect(version).toHaveValue(/^\d+\.\d+\.\d+/);
  const send = page.getByRole('button', { name: 'Envoyer le signalement' });
  await version.fill('1.2');
  await expect(page.getByText(/Format attendu/)).toBeVisible();
  await expect(send).toBeDisabled();
  await version.fill('1.2.0');
  await expect(send).toBeEnabled();
  await page.getByLabel('Plateforme du jeu (facultatif)').selectOption('android');

  const info = page.getByRole('region', { name: 'Informations envoyées avec le signalement' });
  await expect(info).toContainText('1.2.0');
  await expect(info).toContainText('Android');
  await expect(info).toContainText(/Chrome \d+/);
  expect(await axe(page)).toEqual([]);

  await send.click();
  await expect(page.getByRole('heading', { name: 'Signalement reçu' })).toBeFocused();
  const post = seen.find((r) => new URL(r.url()).pathname === '/v1/reports')!;
  const body = post.postDataJSON() as {
    attachments: string[];
    diagnostics: Record<string, unknown>;
  };
  expect(body.attachments).toEqual([idOf(2)]);
  expect(body.diagnostics).toMatchObject({
    platform: 'site',
    gameVersion: '1.2.0',
    gamePlatform: 'android',
  });
  expect(body.diagnostics.browser).toMatch(/^Chrome \d+$/);
  expect(errors).toEqual([]);
});

test('/suivi/ : captures jointes en vignettes, agrandies, CSP du service', async ({ page }) => {
  const errors = watchErrors(page);
  await mockApi(page);
  const res = await page.goto(`/suivi/#${TOKEN}`);
  expect(res?.headers()['content-security-policy']).toContain(`img-src 'self' data: blob: ${API}`);
  await expect(page.getByRole('heading', { name: 'Captures jointes' })).toBeVisible();
  const thumb = page.getByRole('img', { name: 'Capture 2 jointe au signalement' });
  await expect(thumb).toBeVisible();
  await expect
    .poll(() => thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBe(1);
  await page.getByRole('button', { name: 'Agrandir la capture 2' }).click();
  const large = page.getByRole('dialog', { name: /AA-0042 · Capture 2/ });
  await expect(large).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Agrandir la capture 2' })).toBeFocused();
  expect(errors).toEqual([]);
});

test('390 px : formulaire avec capture, sans défilement horizontal ; anglais', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/signaler/');
  await expect(page.getByLabel('Description', { exact: true })).toBeEnabled();
  await expect(page.getByRole('toolbar', { name: 'Formatting' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Screenshots (optional)' })
    .locator('input[type=file]')
    .setInputFiles({ name: 'screen.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('Attached')).toBeVisible();
  await expect(page.getByLabel('Game platform (optional)')).toHaveValue('');
  await noHorizontalScroll(page);
  expect(await axe(page)).toEqual([]);
});
