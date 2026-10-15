/**
 * Défauts relevés en revue QA (lot C3), non corrigés ici (fichiers hors périmètre) : chaque test
 * décrit le comportement attendu et est marqué `test.fail()` ; il échouera (« passé
 * inattendu ») le jour où le défaut sera corrigé, pour qu'on retire la marque.
 */
import { cspViolations, expect, gotoTitle, test } from './helpers';

test('aucune violation CSP « script-src eval » (sonde allowsEval de zod 4)', async ({ page }) => {
  // zod 4 teste `Function('')` au premier parse d'objet (sauvegardes, profil) : la CSP du jeu
  // (script-src 'self', sans 'unsafe-eval') le refuse et lève un `securitypolicyviolation`.
  // Correctif attendu : `z.config({ jitless: true })` au démarrage du jeu (boot.ts).
  test.fail();
  await gotoTitle(page);
  await page.waitForTimeout(500);
  expect(await cspViolations(page)).not.toContain('script-src eval');
});
