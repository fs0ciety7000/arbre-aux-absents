/**
 * Signalement depuis le jeu, v2.5 (ARCHITECTURE §8, DESIGN §9.37–9.38, §13.8) avec le service
 * simulé (`page.route`) : barre Markdown (bouton, raccourci, aperçu sans HTML), captures jointes
 * (champ fichier, collage, retrait = DELETE, identifiants dans le signalement, capture manquante
 * signalée sur le reçu), « Informations envoyées », galerie de la fiche de suivi ; axe, 390 px.
 */
import AxeBuilder from '@axe-core/playwright';
import type { Page, Request, Route } from '@playwright/test';
import { expect, gotoTitle, test } from './helpers';

const API = 'https://arbre-api.cardormedia.com';
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
const DESCRIPTION = 'Le registre ne s’ouvre plus après la deuxième audition.';
/** PNG 1 × 1 valide (décodable par `createImageBitmap`). */
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

interface Api {
  seen: Request[];
  /** Pièces jointes que le service dira avoir rattachées (`ReportReceipt.attachments`). */
  attached: number | null;
}

/** Service simulé : captures, signalement, fiche de suivi (avec captures) et images signées. */
async function mockApi(page: Page): Promise<Api> {
  const api: Api = { seen: [], attached: null };
  let n = 0;
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    api.seen.push(req);
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
    if (pathname.startsWith('/v1/attachments/') && req.method() === 'GET') {
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
        ...(body.attachments ? { attachments: api.attached ?? body.attachments.length } : {}),
      });
    }
    if (pathname === '/v1/tickets/current') {
      return reply(200, {
        ticket: 'AA-0042',
        status: 'received',
        category: 'bug',
        createdAt: Date.UTC(2026, 9, 12),
        updatedAt: Date.UTC(2026, 9, 12),
        replies: [],
        attachments: [
          {
            id: idOf(2),
            url: `${API}/v1/attachments/${idOf(2)}?sig=${'s'.repeat(43)}`,
            type: 'image/png',
            width: 1,
            height: 1,
          },
        ],
      });
    }
    return reply(404, { error: 'invalid' });
  });
  return api;
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(' ')}`);
}

async function openReport(page: Page) {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Signaler un problème' }).click();
  const dialog = page.getByRole('dialog', { name: 'Signaler un problème' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Colle une image dans le champ de description (presse-papiers simulé). */
async function pasteImage(page: Page) {
  await page.locator('#report-description').evaluate((el, b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = new DataTransfer();
    data.items.add(new File([bytes], 'collée.png', { type: 'image/png' }));
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  }, PNG.toString('base64'));
}

test('barre Markdown, captures (fichier, collage, retrait), informations envoyées, galerie du suivi', async ({
  page,
}) => {
  const api = await mockApi(page);
  api.attached = 1; // le service n'en rattache qu'une : le reçu le dit.
  const dialog = await openReport(page);
  const field = dialog.getByRole('textbox', { name: 'Description' });
  await field.fill(DESCRIPTION);

  // Gras par le bouton sur un mot sélectionné, italique au clavier (Ctrl+I).
  await field.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(3, 11)); // « registre »
  const toolbar = dialog.getByRole('toolbar', { name: 'Mise en forme' });
  await toolbar.getByRole('button', { name: /^Gras/ }).click();
  await expect(field).toHaveValue('Le **registre** ne s’ouvre plus après la deuxième audition.');
  await expect(field).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.type(' Voir ');
  await page.keyboard.press('Control+i');
  await page.keyboard.type('vite');
  await expect(field).toHaveValue(/Voir _vite_$/);

  // Aperçu : rendu sans HTML (balise tapée = texte), retour à l'écriture.
  await field.press('End');
  await page.keyboard.type(' <b>brut</b>');
  await toolbar.getByRole('button', { name: 'Aperçu' }).click();
  const region = dialog.getByRole('region', { name: 'Aperçu de la description' });
  await expect(region.locator('strong')).toHaveText('registre');
  await expect(region.locator('em')).toHaveText('vite');
  await expect(region).toContainText('<b>brut</b>');
  await expect(region.locator('b')).toHaveCount(0);
  await expect(field).toBeHidden();
  await toolbar.getByRole('button', { name: 'Aperçu' }).click();
  await expect(field).toBeVisible();

  // Captures : champ fichier, puis collage ; retrait de la première (DELETE).
  const tray = dialog.getByRole('group', { name: 'Captures d’écran (facultatif)' });
  await tray.locator('input[type=file]').setInputFiles({
    name: 'ecran.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(tray.getByRole('img', { name: 'Capture 1' })).toBeVisible();
  await expect(tray.getByText('Jointe')).toBeVisible();
  await pasteImage(page);
  await expect(tray.getByRole('img', { name: 'Capture 2' })).toBeVisible();
  await expect(tray.getByText('Jointe')).toHaveCount(2);
  await expect(tray.getByText('2 captures sur 3')).toBeVisible();
  await tray.getByRole('button', { name: 'Retirer la capture 1 (ecran.png)' }).click();
  await expect(tray.getByRole('img')).toHaveCount(1);
  await expect
    .poll(() =>
      api.seen.filter((r) => r.method() === 'DELETE').map((r) => new URL(r.url()).pathname),
    )
    .toEqual([`/v1/attachments/${idOf(1)}`]);
  await pasteImage(page);
  await expect(tray.getByText('Jointe')).toHaveCount(2);

  // Informations envoyées : en clair, avant l'aperçu JSON.
  const info = dialog.getByRole('region', { name: 'Informations envoyées avec le signalement' });
  await expect(info).toContainText('Navigateur');
  await expect(info).toContainText(/Chrome \d+/);
  await expect(info).toContainText('Fenêtre');
  expect(await axe(page)).toEqual([]);

  await dialog.getByRole('button', { name: 'Envoyer le signalement' }).click();
  await expect(dialog.getByRole('heading', { name: 'Signalement reçu' })).toBeVisible();
  const post = api.seen.find((r) => new URL(r.url()).pathname === '/v1/reports')!;
  const body = post.postDataJSON() as {
    attachments: string[];
    description: string;
    diagnostics: Record<string, unknown>;
  };
  expect(body.attachments).toEqual([idOf(2), idOf(3)]);
  expect(body.description).toContain('**registre**');
  expect(body.diagnostics.browser).toMatch(/^Chrome \d+$/);
  // Upload : corps binaire brut, type de l'image, pot de miel vide.
  const upload = api.seen.find((r) => new URL(r.url()).pathname === '/v1/attachments')!;
  expect(upload.headers()['content-type']).toBe('image/png');
  expect(new URL(upload.url()).searchParams.get('website')).toBe('');
  await expect(dialog.getByText(/1 capture n’a pas pu être jointe/)).toBeVisible();

  // Fiche de suivi : vignette, agrandie au clic.
  await dialog.getByRole('button', { name: 'Mes signalements' }).click();
  const mine = page.getByRole('dialog', { name: 'Mes signalements' });
  await mine.getByRole('button', { name: /Quelque chose ne marche pas/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Signalement AA-0042' });
  await expect(sheet.getByRole('heading', { name: 'Captures jointes' })).toBeVisible();
  await expect(sheet.getByRole('img', { name: 'Capture 1 jointe au signalement' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Agrandir la capture 1' }).click();
  const large = page.getByRole('dialog', { name: /AA-0042 · Capture 1/ });
  await expect(large.getByRole('img', { name: 'Capture 1 jointe au signalement' })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(large).toBeHidden();
});

test('formulaire abandonné : captures supprimées du service ; format refusé expliqué', async ({
  page,
}) => {
  const api = await mockApi(page);
  const dialog = await openReport(page);
  const tray = dialog.getByRole('group', { name: 'Captures d’écran (facultatif)' });
  await tray.locator('input[type=file]').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: PNG },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
  ]);
  await expect(tray.getByText('Jointe')).toBeVisible();
  await dialog.getByRole('button', { name: 'Annuler' }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => api.seen.filter((r) => r.method() === 'DELETE').length).toBe(1);
});

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('390 px : barre sur deux lignes, vignette, sans défilement horizontal', async ({ page }) => {
    await mockApi(page);
    const dialog = await openReport(page);
    await dialog
      .getByRole('group', { name: 'Captures d’écran (facultatif)' })
      .locator('input[type=file]')
      .setInputFiles({ name: 'ecran.png', mimeType: 'image/png', buffer: PNG });
    await expect(dialog.getByText('Jointe')).toBeVisible();
    // Ni la page ni le corps de la feuille ne défilent horizontalement.
    for (const el of [page.locator('html'), dialog.locator('.body')]) {
      expect(await el.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeLessThanOrEqual(0);
    }
    expect(await axe(page)).toEqual([]);
  });
});
