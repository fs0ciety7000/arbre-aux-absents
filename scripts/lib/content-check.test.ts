import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkContent, splitFrontmatter } from './content-check';

let root: string;

async function put(path: string, content: unknown): Promise<void> {
  const file = join(root, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, typeof content === 'string' ? content : JSON.stringify(content), 'utf8');
}

const validCase = {
  case: { id: 'affaire-test', title: 'Affaire test', version: '0.1.0', intro: 'intro' },
  family: {
    persons: [{ id: 'p', given: ['A'], family: ['B'], occupation: 'o', portrait: 'r' }],
    occupations: [{ id: 'o', label: 'Métier' }],
    portraits: [{ id: 'r', file: 'portraits/r.svg', alt: 'Portrait' }],
  },
  tree: { slots: [{ id: 's', person: 'p', generation: 0, column: 0 }], groups: [] },
  progression: {
    start: ['intro'],
    unlocks: {},
    keywords: [],
    places: [],
    secrets: [],
    endings: [{ id: 'fin', file: 'endings/fin.md', when: { read: 'intro' }, priority: 0 }],
  },
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'arbre-content-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('splitFrontmatter', () => {
  it('sépare frontmatter et corps (BOM et CRLF tolérés)', () => {
    expect(splitFrontmatter('\uFEFF---\r\nkind: note\r\n---\r\nCorps')).toEqual({
      frontmatter: 'kind: note',
      body: 'Corps',
    });
  });
  it('renvoie null sans frontmatter ou sans fermeture', () => {
    expect(splitFrontmatter('Texte seul')).toBeNull();
    expect(splitFrontmatter('---\nkind: note\nCorps')).toBeNull();
  });
});

describe('checkContent (provisoire)', () => {
  it('réussit sans contenu', async () => {
    const report = await checkContent(join(root, 'absent'));
    expect(report).toEqual({ issues: [], filesChecked: 0, cases: [] });
  });

  it('valide une affaire minimale complète', async () => {
    for (const [name, data] of Object.entries(validCase)) {
      await put(`cases/affaire-test/${name}.json`, data);
    }
    await put(
      'cases/affaire-test/documents/intro.md',
      '---\nkind: letter\ntitle: Intro\n---\nTexte.',
    );
    await put('world/map.json', {
      aspect: 1.5,
      layers: ['base'],
      minZoom: 1,
      maxZoom: 4,
      title: 'Carte',
    });
    await put('world/places/port.json', {
      id: 'port',
      name: 'Port',
      kind: 'city',
      position: { x: 0.5, y: 0.5 },
    });
    const report = await checkContent(root);
    expect(report.issues).toEqual([]);
    expect(report.cases).toEqual(['affaire-test']);
    expect(report.filesChecked).toBe(7);
  });

  it('signale id ≠ nom de fichier, JSON invalide, fichier manquant, frontmatter absent', async () => {
    await put('cases/affaire-test/case.json', { ...validCase.case, id: 'autre' });
    await put('cases/affaire-test/family.json', '{ pas du json');
    await put('cases/affaire-test/progression.json', validCase.progression);
    await put('cases/affaire-test/documents/sans-entete.md', 'Texte');
    await put('cases/affaire-test/documents/Mauvais_Nom.md', '---\nkind: note\ntitle: x\n---\n');
    await put('world/places/port.json', {
      id: 'quai',
      name: 'Port',
      kind: 'city',
      position: { x: 0, y: 0 },
    });
    const { issues } = await checkContent(root);
    const messages = issues.map((i) => `${i.file} — ${i.message}`).join('\n');
    expect(messages).toMatch(/case\.json — id « autre »/);
    expect(messages).toMatch(/family\.json — JSON invalide/);
    expect(messages).toMatch(/tree\.json — fichier obligatoire manquant/);
    expect(messages).toMatch(/sans-entete\.md — frontmatter YAML manquant/);
    expect(messages).toMatch(/Mauvais_Nom\.md — nom de fichier non kebab-case/);
    expect(messages).toMatch(/port\.json — id « quai »/);
  });

  it('signale les erreurs de schéma avec leur chemin', async () => {
    await put('cases/affaire-test/case.json', validCase.case);
    await put('cases/affaire-test/family.json', validCase.family);
    await put('cases/affaire-test/tree.json', validCase.tree);
    await put('cases/affaire-test/progression.json', {
      ...validCase.progression,
      unlocks: { doc: { not: { read: 'intro' } } },
    });
    await put('cases/affaire-test/documents/intro.md', '---\nkind: email\ntitle: Intro\n---\n');
    const { issues } = await checkContent(root);
    expect(issues.map((i) => i.file).sort()).toEqual([
      join('cases', 'affaire-test', 'documents', 'intro.md'),
      join('cases', 'affaire-test', 'progression.json'),
    ]);
    expect(issues.find((i) => i.file.endsWith('intro.md'))?.message).toMatch(/^kind :/);
  });
});
