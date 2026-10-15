/**
 * Navigation depuis les pages hydratées (signalement, suivi, problèmes connus, tickets, carte) vers
 * les autres pages du site, en français et en anglais, au téléphone et au bureau.
 *
 * Régression : depuis une page hydratée, le routeur client de SvelteKit rendait les autres pages
 * dans le navigateur alors qu'elles ne sont prévues que pour le prérendu (csr = false) ; l'accueil
 * levait une erreur (« e.setAttribute is not a function ») et affichait la page 500. Chaque lien
 * doit charger le document prérendu (app.html, data-sveltekit-reload).
 */
import { expect, test, type Page } from '@playwright/test';

const HYDRATED = ['signaler/', 'suivi/', 'problemes-connus/', 'tickets/', 'le-monde/'];

/** Cibles : l'accueil (logo de l'en-tête), deux pages prérendues et une page hydratée du pied. */
const TARGETS = [
  { slug: '', from: 'header a.home' },
  { slug: 'credits/', from: 'footer' },
  { slug: 'artbook/', from: 'footer' },
  { slug: 'le-monde/', from: 'footer' },
];

const VIEWPORTS = [
  { name: 'téléphone', width: 412, height: 915 },
  { name: 'bureau', width: 1440, height: 900 },
];

// Problèmes connus et tickets interrogent le service au chargement : simulé (liste vide).
test.beforeEach(async ({ page }) => {
  await page.route('https://arbre-api.cardormedia.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '[]',
    }),
  );
});

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

for (const lang of ['fr', 'en'] as const) {
  const prefix = lang === 'en' ? '/en/' : '/';
  for (const vp of VIEWPORTS) {
    for (const start of HYDRATED) {
      test(`${prefix}${start} (${vp.name}) → autres pages : document chargé, sans erreur`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = collectErrors(page);
        for (const target of TARGETS) {
          if (target.slug === start) continue;
          const href = `${prefix}${target.slug}`;
          await page.goto(`${prefix}${start}`);
          await expect(page.locator('h1')).toHaveCount(1);
          // Marqueur posé dans le document courant : il disparaît si le lien recharge la page.
          await page.evaluate(() => ((window as { __stale?: boolean }).__stale = true));
          const link =
            target.from === 'footer'
              ? page.locator(`footer a[href="${href}"]`).first()
              : page.locator(target.from);
          await expect(link).toHaveAttribute('href', href);
          await link.click();
          await expect(page).toHaveURL(href);
          await expect(page.locator('html')).toHaveAttribute('lang', lang);
          await expect(page.locator('main .err')).toHaveCount(0);
          await expect(page.locator('main')).toHaveCount(1);
          await expect(page.locator('h1')).toHaveCount(1);
          expect(await page.evaluate(() => (window as { __stale?: boolean }).__stale)).toBe(
            undefined,
          );
        }
        expect(errors).toEqual([]);
      });
    }
  }
}
