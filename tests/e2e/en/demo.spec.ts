/**
 * Canaris de la démo anglaise (ARCHITECTURE §3.7 règles 10 et 12.7) sur le **build réel** :
 * contenu du dépôt compilé en édition démo (servers/game.mjs, `E2E_REAL_CONTENT=demo`) puis
 * construit par Vite. Aucun texte de l'édition complète (pièces hors démo, fins, autre affaire)
 * ne doit figurer dans les fichiers servis, en anglais comme en français ; et la démo se joue en
 * anglais (titre, affaire, première pièce).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompiledCase } from '@arbre/contract';
import { DEMO, axe, expect, passLaunch, reader, showPanel, test } from './helpers';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const cache = resolve(repo, 'node_modules/.cache/arbre-e2e');
const dist = resolve(cache, 'real-demo-dist');

/** Contenu complet compilé (référence des canaris) : même compilation, édition complète. */
const fullDir = resolve(repo, 'apps/game/src/generated');

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

/** Tout le texte servi par la démo (JS, JSON, HTML, CSS, SVG), tel qu'il part chez le joueur. */
function servedText(): string {
  return files(dist)
    .filter((f) => /\.(js|json|html|css|svg|txt)$/.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

/** Chaîne telle qu'elle apparaît échappée dans un JSON ou un module JS. */
const escaped = (s: string) => JSON.stringify(s).slice(1, -1);

function fullCases(loc: 'fr' | 'en'): CompiledCase[] {
  return readdirSync(fullDir)
    .filter((f) => f.startsWith(`case.full.${loc}.`) && f.endsWith('.json'))
    .map((f) => readJson<CompiledCase>(join(fullDir, f)));
}

test.describe('démo anglaise : canaris', () => {
  test.skip(
    !readdirSync(fullDir).some((f) => f.startsWith('case.full.en.')),
    'contenu complet non compilé (npm run content:build)',
  );

  for (const loc of ['en', 'fr'] as const) {
    test(`aucun texte de l’édition complète (${loc}) dans les fichiers servis`, () => {
      const served = servedText();
      const demoCatalog = readJson<{ id: string; meta: { title: string } }[]>(
        join(cache, 'real-demo/game', `catalog.demo.${loc}.json`),
      );
      const demoIds = new Set(demoCatalog.map((c) => c.id));
      // Non vide : la démo contient bien son affaire, dans cette langue.
      expect(demoCatalog.length).toBeGreaterThan(0);
      for (const c of demoCatalog) expect(served).toContain(escaped(c.meta.title));

      const demoAchievements = demoCatalog.flatMap((c) =>
        readJson<CompiledCase['achievements']>(
          join(cache, 'real-demo/game', `achievements.demo.${loc}.${c.id}.json`),
        ),
      );
      const demoAchievementIds = new Set(demoAchievements.map((a) => a.id));
      // Titres que la démo sert à bon droit : ses succès (« Contre la montre » est commun) et
      // les noms de lieux de la carte (un succès peut porter le nom d'un lieu).
      const world = readJson<{ places: Record<string, { name: string }> }>(
        join(cache, 'real-demo/game', 'world.json'),
      );
      const demoAchievementTitles = new Set([
        ...demoAchievements.map((a) => a.title),
        ...Object.values(world.places).map((p) => p.name),
      ]);

      const leaks: string[] = [];
      for (const full of fullCases(loc)) {
        if (!demoIds.has(full.id)) {
          // Affaire absente de la démo : ni son titre ni ses pièces.
          if (served.includes(escaped(full.meta.title))) leaks.push(`affaire ${full.id}`);
        }
        const demoFile = join(cache, 'real-demo/game', `case.demo.${loc}.${full.id}.json`);
        const demoDocs = demoIds.has(full.id)
          ? new Set(Object.keys(readJson<CompiledCase>(demoFile).documents))
          : new Set<string>();
        const demoTitles = new Set(
          [...demoDocs].map((id) => full.documents[id]?.title).filter(Boolean),
        );
        for (const [id, doc] of Object.entries(full.documents)) {
          if (demoDocs.has(id) || demoTitles.has(doc.title) || doc.title.length < 12) continue;
          if (served.includes(escaped(doc.title))) leaks.push(`${full.id}/${id} : ${doc.title}`);
        }
        // Succès (un fichier par affaire) : ceux de l'édition complète absents de la démo.
        for (const a of full.achievements) {
          if (demoAchievementIds.has(a.id) || demoAchievementTitles.has(a.title)) continue;
          if (a.title.length < 12) continue;
          if (served.includes(escaped(a.title)))
            leaks.push(`${full.id}/succès ${a.id} : ${a.title}`);
        }
        for (const [id, e] of Object.entries(full.endings)) {
          const title = (e as { title: string }).title;
          if (title.length >= 12 && served.includes(escaped(title))) {
            leaks.push(`${full.id}/fin ${id} : ${title}`);
          }
        }
      }
      expect(leaks).toEqual([]);
    });
  }
});

test('la démo se joue en anglais : titre, affaire de la démo, première pièce', async ({ page }) => {
  await page.goto(`${DEMO}/`);
  await passLaunch(page, 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const catalog = readJson<{ id: string; meta: { title: string } }[]>(
    join(cache, 'real-demo/game', 'catalog.demo.en.json'),
  );
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.getByText(catalog[0]!.meta.title).first()).toBeVisible();
  await page.getByRole('combobox', { name: 'Office memos' }).selectOption({ label: 'None' });
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('main', { name: 'Desk' })).toBeVisible();
  // Première pièce du dossier (intro de l'affaire), en anglais, depuis les Archives.
  const demoCase = readJson<CompiledCase>(
    join(cache, 'real-demo/game', `case.demo.en.${catalog[0]!.id}.json`),
  );
  const intro = demoCase.documents[demoCase.meta.intro]!.title;
  await showPanel(page, /^Archives/);
  await page.getByRole('button', { name: intro, exact: true }).first().click();
  await expect(reader(page).getByRole('heading', { name: intro })).toBeVisible();
  expect(await axe(page)).toEqual([]);
});
