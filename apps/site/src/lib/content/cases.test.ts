import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';
import { HOUSE_MARKS, LONGUEGREVE_PIECES, SITE_CASES } from './cases';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const caseDir = (id: string) => join(root, 'content/cases', id);
const count = (dir: string, ext: string) => readdirSync(dir).filter((f) => f.endsWith(ext)).length;

describe('affaires présentées par le site', () => {
  it('une entrée par affaire du contenu, dans l’ordre du jeu', () => {
    const ids = readdirSync(join(root, 'content/cases'))
      .map((id) => ({ id, meta: JSON.parse(readFileSync(join(caseDir(id), 'case.json'), 'utf8')) }))
      .sort((a, b) => a.meta.order - b.meta.order)
      .map((c) => c.id);
    expect(SITE_CASES.map((c) => c.id)).toEqual(ids);
  });

  it.each(SITE_CASES)('$id : chiffres conformes aux données', (c) => {
    const dir = caseDir(c.id);
    const meta = JSON.parse(readFileSync(join(dir, 'case.json'), 'utf8'));
    const tree = JSON.parse(readFileSync(join(dir, 'tree.json'), 'utf8'));
    expect(meta.subtitle).toContain(c.file);
    expect(tree.slots).toHaveLength(c.slots);
    expect(count(join(dir, 'documents'), '.md')).toBe(c.documents);
    expect(count(join(dir, 'endings'), '.md')).toBe(c.endings);
  });

  it('un texte par affaire dans chaque langue', () => {
    for (const t of [fr, en]) expect(t.cases.items).toHaveLength(SITE_CASES.length);
  });

  it('marques et pièces de l’artbook : fichiers présents', () => {
    const dir = caseDir('marques-de-longuegreve');
    for (const id of HOUSE_MARKS)
      expect(existsSync(join(dir, 'portraits', `${id}.svg`))).toBe(true);
    for (const id of LONGUEGREVE_PIECES) {
      expect(existsSync(join(dir, 'illustrations', `${id}.svg`))).toBe(true);
    }
  });
});
