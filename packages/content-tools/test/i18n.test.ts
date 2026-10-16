/**
 * Traductions (ARCHITECTURE §3.7 règle 12, docs/i18n/PLAN.md lot A1) sur la fixture `mini`, qui
 * porte une mini-traduction anglaise (`locales.json` : en = ready).
 */
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { newGame, validate } from '@arbre/engine';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { writeGenerated } from '../src/build';
import { checkContentRoot, demoCanaries, type CheckResult } from '../src/check';
import { summarizeIssues } from '../src/cli';
import { globToRegExp, unitInScope } from '../src/locales';
import { diffProjection, structuralProjection } from '../src/projection';

const FIXTURE = resolve(import.meta.dirname, '../fixtures/mini');
const CASE = 'content/cases/mini';
const EN = `${CASE}/locales/en`;
const temps: string[] = [];

async function tempCopy(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'arbre-i18n-'));
  temps.push(root);
  await cp(FIXTURE, root, { recursive: true });
  return root;
}

async function checkWith(mutate: (root: string) => Promise<void>): Promise<CheckResult> {
  const root = await tempCopy();
  await mutate(root);
  return checkContentRoot(root);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON modifié librement par les tests
type Json = any;

async function editJson(root: string, file: string, fn: (j: Json) => void): Promise<void> {
  const path = join(root, file);
  const data = JSON.parse(await readFile(path, 'utf8'));
  fn(data);
  await writeFile(path, JSON.stringify(data));
}

async function editText(root: string, file: string, fn: (s: string) => string): Promise<void> {
  const path = join(root, file);
  await writeFile(path, fn(await readFile(path, 'utf8')));
}

const setStatus = (root: string, status: 'draft' | 'ready') =>
  editJson(root, 'content/locales.json', (j) => (j.locales.en.status = status));

function rule12(r: CheckResult, severity: 'error' | 'warning' = 'error'): string[] {
  return r.issues.items
    .filter((i) => i.rule === 12 && i.severity === severity)
    .map((i) => `${i.unit ?? ''} ${i.message}`);
}

let base: CheckResult;
beforeAll(async () => {
  base = await checkContentRoot(FIXTURE);
});
afterAll(async () => {
  await Promise.all(temps.map((t) => rm(t, { recursive: true, force: true })));
});

describe('fixture mini en anglais (ready)', () => {
  it('passe la règle 12 sans erreur ni avertissement', () => {
    expect(base.issues.items).toEqual([]);
    expect(base.locales).toEqual({
      source: 'fr',
      targets: [{ locale: 'en', level: 'ready' }],
      compiled: ['fr', 'en'],
    });
  });

  it('sel, réponses et contentHash identiques FR/EN, par édition', () => {
    const c = base.cases[0]!;
    for (const edition of ['full', 'demo'] as const) {
      const fr = c.locales.fr![edition]!.compiled;
      const en = c.locales.en![edition]!.compiled;
      expect(fr.locale).toBe('fr');
      expect(en.locale).toBe('en');
      expect(en.salt).toBe(fr.salt);
      expect(en.contentHash).toBe(fr.contentHash);
      expect(en.slots).toEqual(fr.slots);
      expect(diffProjection(structuralProjection(fr), structuralProjection(en))).toEqual([]);
    }
    // Le FR garde ses champs de premier niveau (compatibilité).
    expect(c.full).toBe(c.locales.fr!.full);
  });

  it('texte anglais compilé, structure héritée du FR', () => {
    const en = base.cases[0]!.locales.en!.full!.compiled;
    expect(en.meta.title).toBe('The Trunk in the Attic');
    expect(en.meta.intro).toBe('intro');
    expect(en.documents['acte-mariage']).toMatchObject({
      title: 'Marriage certificate',
      kind: 'certificate',
      date: '1887-06-02',
      place: 'val-dormant',
      archive: 'Civil registers, ref. M-87',
      reveals: { occupations: ['horloger', 'brodeuse'] },
    });
    expect(en.documents['carte-postale']!.illustration).toEqual({
      file: 'illustrations/carte-val.svg',
      alt: 'The ferry on the Lisse',
    });
    expect(en.searchIndex['ferry school']).toBe('ecole-du-bac');
    expect(en.searchIndex['ecole du bac']).toBeUndefined();
    expect(en.searchIndex['val dormant']).toBe('val-dormant');
    expect(en.keywords['moulin-solvig']!.label).toBe('Solvig Mill');
    expect(en.occupations['horloger']!.label).toBe('Clockmaker');
    expect(en.groups.map((g) => g.label)).toEqual(['The elders', 'The younger ones']);
    expect(en.endings['fin-edda']!.sections.map((s) => [s.label, s.title])).toEqual([
      [null, null],
      ['maren', "The trunk at Maren's"],
      ['oskar', 'The trunk at the mill'],
      ['commun', 'Epilogue'],
    ]);
    expect(en.report[1]!.options[2]).toMatchObject({
      id: 'remettre',
      label: 'Hand them over to the Val-Dormant register',
      availableWhen: { visited: 'val-dormant' },
    });
    expect(en.places['val-dormant']!.description).toBe('Ferry village on the banks of the Lisse.');
    expect(en.achievements.map((a) => a.title)).toEqual(['Nothing Is Lost', 'Discretion']);
  });

  it('solveur par langue : mêmes fins, même parcours de cases', () => {
    const c = base.cases[0]!;
    const fr = c.locales.fr!.solve!;
    const en = c.locales.en!.solve!;
    expect([...en.endings.keys()].sort()).toEqual([...fr.endings.keys()].sort());
    expect([...en.locked].sort()).toEqual([...fr.locked].sort());
    expect(c.locales.en!.demoSolve!.locked.size).toBe(c.locales.fr!.demoSolve!.locked.size);
  });

  it('canaris de la démo anglaise : aucun texte anglais hors démo', () => {
    const en = base.cases[0]!.locales.en!;
    expect(demoCanaries(en.demo!, en.prep!)).toEqual([]);
    const bundle = JSON.stringify(en.demo!.compiled);
    expect(bundle).not.toContain('I still bind registers');
    expect(bundle).not.toContain('lettre-maren');
  });

  it('une sauvegarde FR se valide de la même façon sur le compilé anglais', () => {
    const c = base.cases[0]!;
    const fr = c.locales.fr!.full!.compiled;
    const en = c.locales.en!.full!.compiled;
    const start = newGame(fr, { slot: 'auto', mode: 'standard', at: 0 });
    const guess = (given: string, family: string, portrait: string, occupation: string) => ({
      given,
      family,
      portrait,
      occupation,
    });
    const s = {
      ...start,
      tree: {
        ...start.tree,
        's-ancel': guess('Ancel', 'Morvan', 'portrait-a', 'horloger'),
        's-ida': guess('Ida', 'Brask', 'portrait-b', 'brodeuse'),
        's-tomas': guess('Thomas', 'Morvan', 'portrait-c', 'meunier'),
      },
    };
    expect(validate(s, en)).toEqual(validate(s, fr));
    expect(validate(s, en).lock).toEqual([]);
    s.tree['s-tomas'] = guess('Thomas', 'Morvan', 'portrait-c', 'passeur');
    expect(validate(s, en)).toEqual(validate(s, fr));
    expect(validate(s, en).lock.sort()).toEqual(['s-ancel', 's-ida', 's-tomas']);
  });
});

describe('règle 12 : ruptures (en = ready → erreurs)', () => {
  it('hearing : drapeau structurel du FR, hérité par l’anglais, interdit dans le calque', async () => {
    const r = await checkWith(async (root) => {
      await editText(root, `${CASE}/documents/lettre-ancel.md`, (s) =>
        s.replace('kind: letter', 'kind: letter\nhearing: true'),
      );
      await editText(root, `${EN}/documents/photo-bac.md`, (s) =>
        s.replace('title:', 'hearing: true\ntitle:'),
      );
    });
    const c = r.cases[0]!;
    expect(c.full!.compiled.documents['lettre-ancel']!.hearing).toBe(true);
    expect(c.locales.en!.full!.compiled.documents['lettre-ancel']!.hearing).toBe(true);
    expect(c.locales.en!.full!.compiled.documents['photo-bac']!.hearing).toBeUndefined();
    expect(rule12(r).join('\n')).toMatch(/documents\/photo-bac\.md frontmatter .*hearing/);
  });

  it('mot-clé manquant dans le calque', async () => {
    const r = await checkWith((root) =>
      editJson(root, `${EN}/progression.json`, (j) => delete j.keywords['ida-brask']),
    );
    expect(rule12(r).join('\n')).toMatch(
      /progression\.json mot\(s\)-clé\(s\) manquant\(s\) : ida-brask/,
    );
  });

  it('lien perdu dans un document traduit (mots-clés liés différents du FR)', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/documents/intro.md`, (s) =>
        s.replace('Ancel Morvan, Val-Dormant', 'Ancel Morvan, the Vale'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /documents\/intro\.md mots-clés liés différents du FR : manque val-dormant/,
    );
  });

  it('figure déplacée ou changée', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/documents/carte-postale.md`, (s) =>
        s.replace('](illustrations/carte-val.svg', '](illustrations/photo-noces.svg'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(/documents\/carte-postale\.md figures différentes du FR/);
  });

  it('terme de nom propre absent des termes traduits', async () => {
    const r = await checkWith((root) =>
      editJson(
        root,
        `${EN}/progression.json`,
        (j) => (j.keywords['val-dormant'].terms = ['Sleepy Vale']),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /progression\.json mot-clé « val-dormant » : nom propre absent des termes traduits : Val-Dormant/,
    );
  });

  it('terme traduit partagé par deux mots-clés', async () => {
    const r = await checkWith((root) =>
      editJson(
        root,
        `${EN}/progression.json`,
        (j) => (j.keywords['moulin-solvig'].terms = ['Ferry School']),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /terme « ferry school » partagé par « ecole-du-bac » et « moulin-solvig »/,
    );
  });

  it('case différente : un nom lu seulement en anglais change les noms proposables', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/documents/lettre-ancel.md`, (s) =>
        s.replace('Little Tomas', 'Little Thomas'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /structure différente du FR \(full\) en candidates\.given : en trop Thomas/,
    );
  });

  it('sections des fins : étiquettes dans un autre ordre', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/endings/fin-edda.md`, (s) =>
        s
          .replace('## [maren]', '## [tmp]')
          .replace('## [oskar]', '## [maren]')
          .replace('## [tmp]', '## [oskar]'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /endings\/fin-edda\.md sections \(début\), oskar, maren, commun ; attendu \(FR\) \(début\), maren, oskar, commun/,
    );
  });

  it('parité : fichier, fin et champ facultatif manquants ; clé et document en trop', async () => {
    const r = await checkWith(async (root) => {
      await rm(join(root, EN, 'hints.json'));
      await rm(join(root, EN, 'endings/fin-arbre.md'));
      await editJson(root, `${EN}/case.json`, (j) => delete j.subtitle);
      await editJson(root, `${EN}/family.json`, (j) => (j.occupations.inconnu = 'Unknown'));
      await writeFile(join(root, EN, 'documents/en-trop.md'), '---\ntitle: Extra\n---\nText.\n');
    });
    const e = rule12(r).join('\n');
    expect(e).toMatch(/hints\.json fichier de traduction manquant/);
    expect(e).toMatch(/endings\/fin-arbre\.md fin non traduite/);
    expect(e).toMatch(/case\.json subtitle manquant/);
    expect(e).toMatch(/family\.json métier\(s\) en trop : inconnu/);
    expect(e).toMatch(/documents\/en-trop\.md document absent en FR/);
  });

  it('frontmatter traduit strict : champ structurel interdit', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/documents/photo-bac.md`, (s) =>
        s.replace('title:', 'date: 1911\ntitle:'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(/documents\/photo-bac\.md frontmatter .*date/);
  });

  it('règles rejouées : un texte alternatif anglais qui nomme la personne (11)', async () => {
    const r = await checkWith((root) =>
      editJson(
        root,
        `${EN}/family.json`,
        (j) => (j.portraits['portrait-a'].alt = 'Ancel, moustached'),
      ),
    );
    expect(rule12(r).join('\n')).toMatch(
      /règle 11 \(Fuite\) : \[complet\] portrait « portrait-a »/,
    );
  });

  it('canaris par langue : texte anglais hors démo dans le bundle démo (10)', async () => {
    const r = await checkWith((root) =>
      editJson(root, `${EN}/achievements.json`, (j) => {
        j['tout-trouve'].description = 'I still bind registers for the town hall.';
      }),
    );
    expect(rule12(r).join('\n')).toMatch(
      /règle 10 \(Démo\) : \[démo\] texte hors démo \(lettre-maren\)/,
    );
  });

  it('surcharge SVG : viewBox et ids différents de la base', async () => {
    const r = await checkWith((root) =>
      editText(root, `${EN}/illustrations/carte-val.svg`, (s) =>
        s
          .replace('viewBox="0 0 300 200"', 'viewBox="0 0 320 200"')
          .replace(/carte-val-cadre/g, 'carte-val-bord'),
      ),
    );
    const e = rule12(r).join('\n');
    expect(e).toMatch(
      /illustrations\/carte-val\.svg viewBox « 0 0 320 200 » ≠ base « 0 0 300 200 »/,
    );
    expect(e).toMatch(/ids absents de la surcharge : carte-val-cadre/);
  });

  it('monde : description de lieu manquante', async () => {
    const r = await checkWith((root) =>
      editJson(root, 'content/world/locales/en.json', (j) => delete j.places['val-dormant']),
    );
    expect(rule12(r).join('\n')).toMatch(
      /^world description\(s\) de lieu manquante\(s\) : val-dormant/m,
    );
  });

  it('avertissements : paragraphe non traduit, nombre de ::redacted', async () => {
    const r = await checkWith(async (root) => {
      await editText(root, `${EN}/documents/lettre-ancel.md`, (s) =>
        s.replace(
          'My dear Ida,',
          "L'atelier tourne : trois horloges réparées cette semaine. Le petit Tomas dort enfin\nla nuit. Embrasse ta mère pour moi, et dis-lui que la malle bleue est en sûreté.\n\nMy dear Ida,",
        ),
      );
      await editText(root, `${EN}/documents/acte-mariage.md`, (s) =>
        s.replace('::redacted[8]', 'unknown'),
      );
    });
    expect(rule12(r)).toEqual([]);
    const w = rule12(r, 'warning').join('\n');
    expect(w).toMatch(/documents\/lettre-ancel\.md paragraphe identique au FR/);
    expect(w).toMatch(/documents\/acte-mariage\.md 0 ::redacted pour 1 en FR/);
  });
});

describe('règle 12 : langue draft', () => {
  it('sans aucun fichier anglais : vert, manques en avertissements, langue non compilée', async () => {
    const r = await checkWith(async (root) => {
      await setStatus(root, 'draft');
      await rm(join(root, CASE, 'locales'), { recursive: true });
      await rm(join(root, 'content/world/locales'), { recursive: true });
    });
    expect(r.issues.errors).toEqual([]);
    expect(r.locales.compiled).toEqual(['fr']);
    const w = r.issues.warnings.filter((i) => i.rule === 12);
    expect(w.every((i) => i.code === 'missing' && i.locale === 'en')).toBe(true);
    expect(w.filter((i) => i.unit?.startsWith('documents/'))).toHaveLength(12);
    expect(w.map((i) => i.unit)).toEqual(
      expect.arrayContaining(['case.json', 'progression.json', 'world']),
    );
    // Pas de solveur en draft, mais la projection est contrôlée (repli FR : identique).
    const en = r.cases[0]!.locales.en!;
    expect(en.solve).toBeUndefined();
    expect(en.full!.compiled.contentHash).toBe(r.cases[0]!.full!.compiled.contentHash);
    expect(summarizeIssues(w)).toEqual([
      '! [règle 12 · Traductions · en] content/world — 1 problème(s) : non traduit : world',
      '! [règle 12 · Traductions · en] content/cases/mini — 20 problème(s) : non traduit : 12 document(s), 2 fin(s), case.json, family.json, tree.json, progression.json, hints.json, achievements.json',
    ]);
  });

  it('une rupture reste un avertissement en draft, une erreur en mode strict', async () => {
    const root = await tempCopy();
    await setStatus(root, 'draft');
    await editJson(root, `${EN}/progression.json`, (j) => delete j.keywords['ida-brask']);
    const draft = await checkContentRoot(root);
    expect(draft.issues.errors).toEqual([]);
    expect(rule12(draft, 'warning').join('\n')).toMatch(
      /mot\(s\)-clé\(s\) manquant\(s\) : ida-brask/,
    );
    const strict = await checkContentRoot(root, { strictLocales: ['en'] });
    expect(rule12(strict).join('\n')).toMatch(/mot\(s\)-clé\(s\) manquant\(s\) : ida-brask/);
    expect(strict.cases[0]!.locales.en!.solve).toBeDefined();
    expect(strict.locales.compiled).toEqual(['fr']); // strict n'écrit pas une langue draft
  });

  it('traduction partielle : les pièces non traduites retombent sur le FR sans fausser le solveur', async () => {
    const root = await tempCopy();
    await rm(join(root, EN, 'documents'), { recursive: true });
    const r = await checkContentRoot(root);
    const errors = r.issues.errors;
    expect(errors.every((i) => i.rule === 12 && i.code === 'missing')).toBe(true);
    expect(errors).toHaveLength(12);
    const en = r.cases[0]!.locales.en!;
    expect(en.full!.compiled.documents['intro']!.title).toBe('Note du notaire');
    expect(en.full!.compiled.documents['intro']!.keywords).toEqual(['ancel-morvan', 'val-dormant']);
    expect(en.solve!.blockedSlots.size).toBe(0);
  });
});

describe('content:i18n : périmètre', () => {
  it('glob : **, *, {a,b}, et dossiers parents', () => {
    const g = globToRegExp('{progression,family,tree}.json');
    expect(unitInScope('progression.json', g)).toBe(true);
    expect(unitInScope('hints.json', g)).toBe(false);
    expect(unitInScope('documents/ph-01.md', globToRegExp('documents/ph-*'))).toBe(true);
    expect(unitInScope('documents/pr-01.md', globToRegExp('documents/ph-*'))).toBe(false);
    expect(unitInScope('illustrations/a.svg', globToRegExp('illustrations/**'))).toBe(true);
    expect(unitInScope('world/labels.svg', globToRegExp('world'))).toBe(true);
    expect(unitInScope('world', globToRegExp('world'))).toBe(true);
    expect(unitInScope('(affaire)', globToRegExp('documents/**'))).toBe(false);
    expect(unitInScope('(affaire)', null)).toBe(true);
    expect(unitInScope('documents/a.md', globToRegExp('**/*.md'))).toBe(true);
  });
});

describe('content:build : arborescence par langue', () => {
  it('catalogues, affaires, surcharges, monde ; plus d’ancien format FR', async () => {
    const out = await mkdtemp(join(tmpdir(), 'arbre-gen-'));
    temps.push(out);
    const game = join(out, 'game');
    const site = join(out, 'site');
    await writeGenerated(base, { game, site }, 'full');
    const files = (await readdir(game)).sort();
    expect(files).toEqual([
      'achievements.demo.en.mini.json',
      'achievements.demo.fr.mini.json',
      'achievements.full.en.mini.json',
      'achievements.full.fr.mini.json',
      'assets.demo.en.json',
      'assets.demo.fr.json',
      'assets.demo.json',
      'assets.full.en.json',
      'assets.full.fr.json',
      'assets.full.json',
      'case.demo.en.mini.json',
      'case.demo.fr.mini.json',
      'case.full.en.mini.json',
      'case.full.fr.mini.json',
      'cases.ts',
      'catalog.demo.en.json',
      'catalog.demo.fr.json',
      'catalog.full.en.json',
      'catalog.full.fr.json',
      'world.en.json',
      'world.fr.json',
      'world.json',
      'world.ts',
    ]);
    const json = async (name: string) => JSON.parse(await readFile(join(game, name), 'utf8'));
    const catalog = await json('catalog.full.en.json');
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      id: 'mini',
      edition: 'full',
      locale: 'en',
      meta: { title: 'The Trunk in the Attic' },
      endings: { 'fin-arbre': { title: 'The tree restored' } },
    });
    expect(catalog[0].contentHash).toBe((await json('catalog.full.fr.json'))[0].contentHash);
    // Index léger : les succès sont à part, un fichier par affaire et par langue.
    expect(catalog[0]).not.toHaveProperty('achievements');
    const enCase = await json('case.full.en.mini.json');
    expect(await json('achievements.full.en.mini.json')).toEqual(enCase.achievements);
    expect(
      (await json('achievements.full.en.mini.json')).map((a: { title: string }) => a.title),
    ).toEqual(['Nothing Is Lost', 'Discretion']);
    expect(await json('assets.full.fr.json')).toEqual({});
    expect(Object.keys((await json('assets.full.en.json')).mini)).toEqual([
      'illustrations/carte-val.svg',
    ]);
    expect(await json('world.fr.json')).toEqual({});
    expect(await json('world.en.json')).toEqual({
      map: { title: 'Map of the Ysel Marches' },
      places: { 'val-dormant': { description: 'Ferry village on the banks of the Lisse.' } },
    });
    const loader = await readFile(join(game, 'cases.ts'), 'utf8');
    expect(loader).toContain("export const locales: readonly Locale[] = ['fr', 'en'];");
    expect(loader).toContain("'mini': () => import('./case.full.en.mini.json'),");
    expect(loader).not.toContain('case.demo.');
    expect(loader).toContain('export async function loadCatalog(loc: Locale)');
    expect(loader).toContain("'mini': () => import('./achievements.full.en.mini.json'),");
    expect(loader).toContain('export async function loadAchievements(loc: Locale, id: string)');
    expect(loader).not.toContain('achievements.demo.');
    expect(loader).toContain(
      'export function assetLoader(loc: Locale, caseId: string, key: string)',
    );
    // Site : démo seulement.
    expect((await readdir(site)).filter((f) => f.includes('full'))).toEqual([]);

    // Restes de l'ancien format (avant C1) : supprimés à la compilation suivante.
    await writeFile(join(game, 'cases.full.json'), '[]');
    await writeFile(join(game, 'cases.i18n.ts'), '');
    await writeGenerated(base, { game }, 'demo');
    const next = await readdir(game);
    expect(next).not.toContain('cases.full.json');
    expect(next).not.toContain('cases.i18n.ts');
    // Affaire retirée : ses succès compilés partent avec elle.
    await writeFile(join(game, 'achievements.full.fr.retiree.json'), '[]');
    await writeGenerated(base, { game }, 'demo');
    expect(await readdir(game)).not.toContain('achievements.full.fr.retiree.json');
    expect(await readFile(join(game, 'cases.ts'), 'utf8')).toContain(
      "import('./case.demo.en.mini.json')",
    );
  });

  it('une langue draft n’est pas écrite', async () => {
    const root = await tempCopy();
    await setStatus(root, 'draft');
    const r = await checkContentRoot(root);
    const out = await mkdtemp(join(tmpdir(), 'arbre-gen-'));
    temps.push(out);
    await writeGenerated(r, { game: out });
    const files = await readdir(out);
    expect(files.filter((f) => f.includes('.en.'))).toEqual([]);
    expect(await readFile(join(out, 'cases.ts'), 'utf8')).toContain("= ['fr'];");
  });
});
