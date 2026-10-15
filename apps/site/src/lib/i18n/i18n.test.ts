/**
 * Site bilingue (D8) : catalogues de même forme, pages présentes dans chaque langue, `hreflang`
 * et plan du site qui pointent vers des pages générées. La partie « build » ne tourne que si
 * `apps/site/build/` existe (après `npm run build -w @arbre/site`).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORT_CATEGORIES } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { SITE_LOCALES, SITE_PAGES, pagePath, parsePagePath, toLocale } from './pages';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const ROUTES = join(SITE, 'src/routes/[[lang=lang]]');
const BUILD = join(SITE, 'build');
const ORIGIN = 'https://arbre.cardormedia.com';

/** Forme d'une valeur : clés, longueurs de listes, types (pas les textes). */
function shape(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shape);
  if (v instanceof RegExp) return 'regexp';
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, shape(x)]),
    );
  }
  return typeof v;
}

/** Chemins des segments de texte enrichi qui ne sont pas des chaînes (pour comparer à part). */
const NULLABLE = new Set(['meta.keyArtAlt', 'portraits', 'presse.facts', 'presse.kit.filesNote']);

describe('catalogues', () => {
  it('fr et en ont les mêmes clés partout', () => {
    const keys = (o: unknown, at = ''): string[] =>
      o && typeof o === 'object' && !Array.isArray(o) && !(o instanceof RegExp)
        ? Object.keys(o).flatMap((k) => {
            const path = at ? `${at}.${k}` : k;
            const child = (o as Record<string, unknown>)[k];
            return NULLABLE.has(path) || path.startsWith('presskit.')
              ? [path]
              : [path, ...keys(child, path)];
          })
        : [];
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });

  it('listes de même longueur (gestes, dates, lexique, règles, paragraphes)', () => {
    const lists = (t: typeof fr) => ({
      features: t.home.game.features.length,
      shots: t.home.shots.items.length,
      body: t.home.premise.body.length,
      events: t.world.history.events.map((e) => e.date),
      lexicon: t.world.languages.lexicon.map(([w]) => w),
      prose: t.world.languages.prose.length,
      intention: t.artbook.intention.prose.length,
      dos: t.charte.usage.dos.length,
      donts: t.charte.usage.donts.length,
      long: t.presse.long.length,
      groups: t.palette.groups.length,
      swatches: Object.keys(t.palette.swatches).sort(),
      tools: t.credits.tools.list.length,
      categories: Object.keys(t.reportCategories).sort(),
      privacy: t.privacy.sections.map((s) => [s.id, s.body.length]),
    });
    expect(lists(en)).toEqual(lists(fr));
    expect(shape(en.charte.type.fonts)).toEqual(shape(fr.charte.type.fonts));
  });

  it('signalement : une étiquette par catégorie du contrat, gabarits identiques', () => {
    for (const t of [fr, en]) {
      expect(Object.keys(t.reportCategories).sort()).toEqual([...REPORT_CATEGORIES].sort());
    }
    // Les gabarits `{n}`, `{delay}`… sont remplis par le code : mêmes trous dans chaque langue.
    const holes = (v: unknown, at = ''): string[] =>
      typeof v === 'string'
        ? [...v.matchAll(/\{(\w+)\}/g)].map((m) => `${at}:${m[1]}`)
        : v && typeof v === 'object'
          ? Object.entries(v).flatMap(([k, x]) => holes(x, `${at}.${k}`))
          : [];
    for (const key of ['report', 'follow', 'known'] as const) {
      expect(holes(en[key]).sort(), key).toEqual(holes(fr[key]).sort());
    }
  });

  it('chaque planche de portrait a sa légende anglaise', () => {
    expect(Object.keys(en.portraits).sort()).toEqual(
      ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'].sort(),
    );
  });

  it('anglais : ni guillemets français ni espace avant la ponctuation haute', () => {
    const strings: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === 'string') strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.values(v).forEach(walk);
    };
    const { presskit, ...rest } = en;
    walk(rest);
    walk(presskit.groups);
    walk(Object.values(presskit.labels));
    const bad = strings.filter((s) => /[«»]|\s[:;!?](\s|$)|[\u00a0\u202f][:;!?]/.test(s));
    expect(bad).toEqual([]);
  });
});

describe('chemins localisés', () => {
  it('pagePath / parsePagePath sont réciproques', () => {
    for (const lang of SITE_LOCALES) {
      for (const path of SITE_PAGES) {
        expect(parsePagePath(pagePath(lang, path))).toEqual({ lang, path });
      }
    }
    expect(parsePagePath('/design/')).toBeNull();
    expect(parsePagePath('/en/404.html')).toBeNull();
    expect(toLocale('en')).toBe('en');
    expect(toLocale(undefined)).toBe('fr');
  });

  it('chaque route localisée est déclarée et prérendue en anglais', () => {
    const dirs = readdirSync(ROUTES).filter((d) => statSync(join(ROUTES, d)).isDirectory());
    const pages = dirs.filter((d) => d !== '404.html').map((d) => `${d}/`);
    expect(['', ...pages].sort()).toEqual([...SITE_PAGES].sort());
    for (const d of ['', ...dirs]) {
      const file = join(ROUTES, d, '+page.ts');
      expect(existsSync(file), `${d || '/'} : +page.ts`).toBe(true);
      expect(readFileSync(file, 'utf8'), `${d || '/'} : entries anglaises`).toMatch(
        /entries: EntryGenerator = englishEntries/,
      );
    }
  });
});

const built = existsSync(join(BUILD, 'index.html'));

/** Fichier publié d'une URL du site (`/en/le-monde/` → `en/le-monde/index.html`). */
function fileOf(url: string): string {
  const path = new URL(url, ORIGIN).pathname;
  return join(BUILD, path.endsWith('/') ? `${path}index.html` : path);
}

function htmlPages(dir = BUILD): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === '_app' ? [] : htmlPages(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

describe.skipIf(!built)('site construit (apps/site/build)', () => {
  const pages = built ? htmlPages() : [];
  const rel = (f: string) => `/${relative(BUILD, f).replace(/index\.html$/, '')}`;

  it('chaque page française a sa page /en/, et inversement', () => {
    const fr = pages.map(rel).filter((p) => !p.startsWith('/en/') && !p.startsWith('/design/'));
    const enPages = pages.map(rel).filter((p) => p.startsWith('/en/'));
    expect(fr.map((p) => `/en${p}`).sort()).toEqual(enPages.sort());
    expect(enPages).toContain('/en/404.html');
  });

  it('lang de <html> selon le préfixe', () => {
    for (const f of pages) {
      const lang = /<html lang="([^"]+)"/.exec(readFileSync(f, 'utf8'))?.[1];
      expect(lang, rel(f)).toBe(rel(f).startsWith('/en/') ? 'en' : 'fr');
    }
  });

  it('chaque hreflang et chaque canonique pointent vers une page générée', () => {
    for (const f of pages) {
      const html = readFileSync(f, 'utf8');
      const links = [...html.matchAll(/<link rel="(?:alternate|canonical)"[^>]*href="([^"]+)"/g)];
      if (rel(f).endsWith('404.html') || rel(f).startsWith('/design/')) continue;
      const langs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map(
        (m) => m[1],
      );
      expect(langs.sort(), rel(f)).toEqual(['en', 'fr', 'x-default']);
      for (const [, href] of links) {
        expect(href!.startsWith(ORIGIN), href).toBe(true);
        expect(existsSync(fileOf(href!)), `${rel(f)} → ${href}`).toBe(true);
      }
    }
  });

  it('le sélecteur de langue mène à une page générée', () => {
    for (const f of pages) {
      // Le sélecteur de l'en-tête (la page /design en montre d'autres, de démonstration).
      const header = /<header[\s\S]*?<\/header>/.exec(readFileSync(f, 'utf8'))?.[0] ?? '';
      const hrefs = [...header.matchAll(/<a[^>]*href="([^"]+)"[^>]*hreflang="[^"]+"/g)];
      expect(hrefs.length, rel(f)).toBe(SITE_LOCALES.length);
      for (const [, href] of hrefs) expect(existsSync(fileOf(href!)), href).toBe(true);
    }
  });

  it('plan du site : chaque URL et chaque xhtml:link existent', () => {
    const xml = readFileSync(join(BUILD, 'sitemap.xml'), 'utf8');
    const urls = [...xml.matchAll(/(?:<loc>|href=")(https:[^<"]+)/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(SITE_PAGES.length * SITE_LOCALES.length);
    for (const u of urls) expect(existsSync(fileOf(u)), u).toBe(true);
  });

  it('liens « Jouer » : /jouer/?lang=en sur les pages anglaises', () => {
    const home = readFileSync(join(BUILD, 'en/index.html'), 'utf8');
    expect(home).toContain('href="/jouer/?lang=en"');
    expect(readFileSync(join(BUILD, 'index.html'), 'utf8')).not.toContain('/jouer/?lang=');
  });
});
