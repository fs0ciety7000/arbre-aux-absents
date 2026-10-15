/**
 * Signaler un problème depuis le jeu **en anglais** (lot B2, ARCHITECTURE §8, DESIGN §13.8–13.9),
 * service simulé (`page.route`). Complète game/report.spec.ts (parcours français, 429 et reçu en
 * anglais) : envoi réussi et lien de suivi `/en/suivi/`, hors ligne, 503, « My reports », fiche de
 * suivi (statuts du glossaire, réponse en texte brut), suppression ; le jeton ne paraît jamais dans
 * une URL du service.
 */
import type { Page, Request, Route } from '@playwright/test';
import { axe, expect, gotoTitle, noHorizontalScroll, startNewGameEn, test } from './helpers';

const API = 'https://arbre-api.cardormedia.com';
const TOKEN = 'ZyXwVuTsRqPoNmLkJiHgFe';
const DESCRIPTION = 'The parish register will not open after the second hearing.';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Retry-After',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type',
};

type Reply = { status: number; body?: unknown; headers?: Record<string, string> } | 'abort';

async function mockApi(page: Page, handler: (req: Request) => Reply): Promise<Request[]> {
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

// Signalement en anglais : le service renvoie la page de suivi anglaise (ARCHITECTURE §8).
const receipt = {
  ticket: 'AA-0108',
  token: TOKEN,
  followUrl: `https://arbre.cardormedia.com/en/suivi/#${TOKEN}`,
};

const ticketView = {
  ticket: 'AA-0108',
  status: 'fixed',
  fixedIn: 'v1.3.0',
  category: 'text',
  createdAt: Date.UTC(2026, 9, 12),
  updatedAt: Date.UTC(2026, 9, 14),
  replies: [{ at: Date.UTC(2026, 9, 13), text: '<img src=x onerror=alert(1)> Thanks, fixed.' }],
};

function api(state: { deleted: boolean }) {
  return (req: Request): Reply => {
    const path = new URL(req.url()).pathname;
    if (path === '/v1/reports' && req.method() === 'POST') return { status: 201, body: receipt };
    if (path === '/v1/tickets/current') {
      if (state.deleted) return { status: 404, body: { error: 'invalid' } };
      if (req.method() === 'DELETE') {
        state.deleted = true;
        return { status: 204 };
      }
      return { status: 200, body: ticketView };
    }
    return { status: 404, body: { error: 'invalid' } };
  };
}

const reportDialog = (page: Page) => page.getByRole('dialog', { name: 'Report a problem' });

async function openFromTitle(page: Page) {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'Report a problem' }).click();
  const dialog = reportDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: 'Category' })).toBeFocused();
  return dialog;
}

test('envoi, reçu, suivi /en/suivi/, My reports, fiche et suppression', async ({ page }) => {
  const state = { deleted: false };
  const seen = await mockApi(page, api(state));
  const dialog = await openFromTitle(page);
  const send = dialog.getByRole('button', { name: 'Send the report' });
  await expect(send).toBeDisabled();
  await expect(dialog.getByText('20 more characters before you can send.')).toBeVisible();

  await dialog
    .getByRole('combobox', { name: 'Category' })
    .selectOption({ label: 'Typo or incorrect text' });
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByText('See exactly what will be sent').click();
  await expect(dialog.locator('pre')).toContainText('"locale": "en"');
  await expect(dialog.locator('pre')).toContainText('"category": "text"');
  expect(await axe(page)).toEqual([]);

  await send.click();
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible();
  await expect(dialog.getByText('AA-0108')).toBeVisible();
  await expect(dialog.getByText(`https://arbre.cardormedia.com/en/suivi/#${TOKEN}`)).toBeVisible();

  const post = seen.find((r) => r.method() === 'POST')!;
  expect(post.postDataJSON()).toMatchObject({
    source: 'game',
    category: 'text',
    locale: 'en',
    website: '',
    diagnostics: { locale: 'en' },
  });

  // « Open the follow-up on the website » : page anglaise, jeton dans le fragment seulement.
  await page
    .context()
    .route('https://arbre.cardormedia.com/**', (r) =>
      r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Follow-up</title>' }),
    );
  const popup = page.waitForEvent('popup');
  await dialog.getByRole('button', { name: 'Open the follow-up on the website' }).click();
  const opened = await popup;
  expect(opened.url()).toBe(`https://arbre.cardormedia.com/en/suivi/#${TOKEN}`);
  await opened.close();

  // My reports → fiche de suivi : statut traduit, réponse en texte brut.
  await dialog.getByRole('button', { name: 'My reports' }).click();
  const mine = page.getByRole('dialog', { name: 'My reports' });
  await expect(mine).toBeVisible();
  await mine.getByRole('button', { name: /Typo or incorrect text/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Report AA-0108' });
  await expect(sheet.getByRole('list', { name: 'Report progress' })).toBeVisible();
  await expect(sheet.getByRole('img', { name: /Fixed in v1\.3\.0/ })).toBeVisible();
  await expect(sheet.getByText('<img src=x onerror=alert(1)> Thanks, fixed.')).toBeVisible();
  await expect(sheet.locator('img[src="x"]')).toHaveCount(0);
  expect(await axe(page)).toEqual([]);

  const get = seen.find((r) => r.method() === 'GET')!;
  expect(get.headers().authorization).toBe(`Bearer ${TOKEN}`);
  for (const r of seen) expect(r.url()).not.toContain(TOKEN);

  await sheet.getByRole('button', { name: 'Delete my report' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this report?' });
  await expect(confirm.getByRole('button', { name: 'Keep' })).toBeFocused();
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Report deleted.').first()).toBeVisible();
  expect(seen.filter((r) => r.method() === 'DELETE')).toHaveLength(1);
  await expect(mine.getByText('No reports sent from this device.')).toBeVisible();
});

test('hors ligne : message anglais, texte gardé, rapport à copier sans le contact', async ({
  page,
}) => {
  await mockApi(page, () => 'abort');
  const dialog = await openFromTitle(page);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByRole('textbox', { name: 'Contact (optional)' }).fill('me@example.test');
  await dialog.getByRole('button', { name: 'Send the report' }).click();
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('seems to be offline');
  await expect(alert.getByRole('button', { name: 'itch.io forum' })).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Description' })).toHaveValue(DESCRIPTION);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('refused')) },
    });
  });
  await alert.getByRole('button', { name: 'Copy the report' }).click();
  const area = alert.getByRole('textbox', { name: 'Report to copy' });
  await expect(area).toHaveValue(/Report · L’Arbre aux absents \(game\)/);
  await expect(area).toHaveValue(new RegExp(DESCRIPTION));
  await expect(area).not.toHaveValue(/me@example\.test/);
  expect(await axe(page)).toEqual([]);
});

test('503 « disabled » puis nouvel essai réussi', async ({ page }) => {
  let disabled = true;
  await mockApi(page, (req) =>
    disabled ? { status: 503, body: { error: 'disabled' } } : api({ deleted: false })(req),
  );
  const dialog = await openFromTitle(page);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByRole('button', { name: 'Send the report' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Reports are paused at the moment.');
  disabled = false;
  await dialog.getByRole('button', { name: 'Try again' }).click();
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible();
});

test('fiche d’un signalement supprimé ailleurs : 404 expliqué, retrait de la liste', async ({
  page,
}) => {
  const state = { deleted: false };
  await mockApi(page, api(state));
  const dialog = await openFromTitle(page);
  await dialog.getByRole('textbox', { name: 'Description' }).fill(DESCRIPTION);
  await dialog.getByRole('button', { name: 'Send the report' }).click();
  await expect(dialog.getByRole('heading', { name: 'Report received' })).toBeVisible();
  state.deleted = true; // supprimé depuis le site
  await dialog.getByRole('button', { name: 'My reports' }).click();
  const mine = page.getByRole('dialog', { name: 'My reports' });
  await mine.getByRole('button', { name: /Something doesn’t work/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Report AA-0108' });
  await expect(sheet.getByText(/This follow-up no longer exists/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Remove from the list' }).click();
  await expect(mine.getByText('No reports sent from this device.')).toBeVisible();
});

test('390 px : formulaire en anglais sans défilement horizontal, depuis la pause', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, api({ deleted: false }));
  await startNewGameEn(page);
  // Téléphone : la pause est derrière « Menu » (DeskHeader).
  await page.getByRole('button', { name: 'Menu' }).click();
  await page
    .getByRole('dialog', { name: 'Other panels' })
    .getByRole('button', { name: 'Pause' })
    .click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Report a problem' })
    .click();
  const dialog = reportDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('switch', { name: 'Attach my anonymised save' })).toBeVisible();
  await noHorizontalScroll(page);
  expect(await axe(page)).toEqual([]);
});
