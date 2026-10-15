/**
 * Projet `en-GB` (docs/i18n/PLAN.md, lot C3) : navigateur réglé en anglais britannique
 * (`locale: 'en-GB'` → `navigator.languages` et `Accept-Language`). Le jeu (fixture `mini`,
 * traduite en anglais) est le `baseURL` ; le site prérendu et la démo réelle ont leurs propres
 * serveurs (playwright.config.ts).
 */
import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Locator, type Page } from '@playwright/test';

export { expect };

export const SITE = `http://localhost:${process.env.E2E_SITE_PORT ?? 4320}`;
export const DEMO = `http://localhost:${process.env.E2E_DEMO_PORT ?? 4322}`;

/**
 * Violations CSP relevées par la page (`securitypolicyviolation`), en plus des `console.error`
 * que Chromium émet pour chacune : posé avant tout script de la page.
 */
const CSP_PROBE = () => {
  const w = window as unknown as { __csp: string[] };
  w.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
  });
};

export async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
}

/**
 * `test` qui échoue sur toute erreur JavaScript, tout `console.error` (sauf les requêtes refusées
 * par un service simulé, voulues) et toute violation CSP.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      await page.addInitScript(CSP_PROBE);
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (/Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(m.text())) return;
        errors.push(`console: ${m.text()}`);
      });
      await use(errors);
      // Toute violation fait échouer le test, dont « script-src eval » (sonde `allowsEval` de
      // zod 4, coupée par `z.config({ jitless: true })` dans apps/game/src/zod-config.ts).
      const csp = page.isClosed() ? [] : await cspViolations(page).catch(() => []);
      expect(csp, 'violations CSP').toEqual([]);
      expect(errors, 'erreurs JavaScript pendant le test').toEqual([]);
    },
    { auto: true },
  ],
});

export async function axe(page: Page): Promise<string[]> {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return r.violations.map(
    (v) =>
      `${v.id} (${v.nodes.length}) : ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  );
}

/** Aucun défilement horizontal de la page. */
export async function noHorizontalScroll(page: Page): Promise<void> {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(width);
}

// ── Jeu en anglais ───────────────────────────────────────────────────

/** Écran titre (passe l'écran de lancement), en anglais (`Skip`, `New game`) ou en français. */
export async function gotoTitle(page: Page, path = './', lang: 'en' | 'fr' = 'en'): Promise<void> {
  await page.goto(path);
  await passLaunch(page, lang);
}

/** Passe l'écran de lancement s'il est affiché. */
export async function passLaunch(page: Page, lang: 'en' | 'fr' = 'en'): Promise<void> {
  const skip = page.getByRole('button', { name: lang === 'en' ? 'Skip' : 'Passer' }).first();
  const newGame = page.getByRole('button', {
    name: lang === 'en' ? 'New game' : 'Nouvelle partie',
  });
  await expect(skip.or(newGame).first()).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await expect(newGame).toBeVisible();
}

export const deskEn = (page: Page): Locator => page.getByRole('main', { name: 'Desk' });
export const deskFr = (page: Page): Locator => page.getByRole('main', { name: 'Bureau' });

/** Titre → New game → Desk (notes de service : None). */
export async function startNewGameEn(page: Page): Promise<void> {
  await gotoTitle(page);
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('combobox', { name: 'Office memos' }).selectOption({ label: 'None' });
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(deskEn(page)).toBeVisible();
}

/** Onglet d'un panneau du Bureau (rail, volet ou barre), dans l'une ou l'autre langue. */
export async function showPanel(page: Page, name: string | RegExp): Promise<void> {
  const tab = page
    .getByRole('tablist', {
      name: /^(Panneaux du bureau|Volet latéral|Onglets du bureau|Desk panels|Side pane|Desk tabs)$/,
    })
    .getByRole('tab', { name })
    .first();
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}

/** Panneau du Lecteur (`Lecteur` / `Reader`). */
export const reader = (page: Page): Locator =>
  page.getByRole('tabpanel', { name: /^(Lecteur|Reader)$/ });

export const slotButton = (page: Page, slot: string): Locator =>
  page.locator(`[data-tree-view] [data-slot="${slot}"]`);

/** Pause → Options → onglet Langue → langue choisie → retour au Bureau. */
export async function switchLanguageInGame(page: Page, to: 'en' | 'fr'): Promise<void> {
  const from = to === 'en' ? 'fr' : 'en';
  await page.getByRole('button', { name: 'Pause' }).click();
  await page
    .getByRole('dialog', { name: 'Pause' })
    .getByRole('button', { name: 'Options' })
    .click();
  await page.getByRole('tab', { name: from === 'fr' ? 'Langue' : 'Language' }).click();
  await page.getByRole('radio', { name: to === 'en' ? 'English' : 'Français' }).check();
  await expect(page.locator('html')).toHaveAttribute('lang', to);
  // Échap referme les Options et rend la main à la pause, qu'on quitte (Reprendre).
  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog', { name: 'Pause' });
  await pause.getByRole('button', { name: to === 'en' ? 'Resume' : 'Reprendre' }).click();
  await expect(pause).toBeHidden();
  await expect(to === 'en' ? deskEn(page) : deskFr(page)).toBeVisible();
}
