import { REPORT_LIMITS, SaveStateSchema } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { makeSave } from '../../../platform/__tests__/fixtures';
import { anonymiseSave, stripSave } from '../anonymise';

const PRIVATE = 'Pierre Dupont, 12 rue des Lilas';

const save = () =>
  makeSave('slot-2', {
    searchLog: [
      { query: PRIVATE, keyword: null, at: 10 },
      { query: 'registre', keyword: 'registre', at: 20 },
    ],
    tree: { 's-ancel': { given: 'Ancel', family: 'Morvan', portrait: 'p-1', occupation: null } },
    notebook: {
      pins: [{ kind: 'document', id: 'lt-01' }],
      highlights: [{ doc: 'lt-01', path: [0], start: 1, end: 4, color: 2, lang: 'en' }],
      notes: [
        { id: 'n1', text: PRIVATE, at: 30, target: { kind: 'slot', id: 's-ancel' } },
        { id: 'n2', text: '', at: 40 },
      ],
    },
    report: { q1: 'o2' },
  });

describe('sauvegarde anonymisée', () => {
  it('retire le texte des notes et des recherches, garde l’arbre et la progression', () => {
    const out = anonymiseSave(save());
    expect(out).not.toBeNull();
    const json = JSON.stringify(out!.save);
    expect(json).not.toContain('Pierre');
    expect(json).not.toContain('Lilas');
    expect(out!.save.notebook.notes.map((n) => n.text)).toEqual(['', '']);
    expect(out!.save.notebook.notes[0]!.target).toEqual({ kind: 'slot', id: 's-ancel' });
    expect(out!.save.searchLog).toEqual([
      { query: '', keyword: null, at: 10 },
      { query: '', keyword: 'registre', at: 20 },
    ]);
    expect(out!.save.tree['s-ancel']).toEqual({
      given: 'Ancel',
      family: 'Morvan',
      portrait: 'p-1',
      occupation: null,
    });
    expect(out!.save.notebook.highlights[0]!.lang).toBe('en');
    expect(out!.save.report).toEqual({ q1: 'o2' });
    expect([out!.notes, out!.queries, out!.trimmedSearches, out!.droppedHighlights]).toEqual([
      1, 2, 0, 0,
    ]);
  });

  it('reste une sauvegarde valide du contrat, sans champ inconnu', () => {
    const extra = { ...save(), playerName: 'Pierre' } as ReturnType<typeof save>;
    const stripped = stripSave(extra);
    expect(SaveStateSchema.safeParse(stripped).success).toBe(true);
    expect(JSON.stringify(stripped)).not.toContain('Pierre');
  });

  it('ne modifie pas la partie d’origine', () => {
    const s = save();
    anonymiseSave(s);
    expect(s.notebook.notes[0]!.text).toBe(PRIVATE);
    expect(s.searchLog[0]!.query).toBe(PRIVATE);
  });

  it('trop volumineuse : journal raccourci, puis surlignages retirés, sinon rien', () => {
    const searchLog = Array.from({ length: 200 }, (_, i) => ({
      query: 'x',
      keyword: `mot-${i}`,
      at: i,
    }));
    const highlights = Array.from({ length: 50 }, (_, i) => ({
      doc: `doc-${i}`,
      path: [0, 1, 2],
      start: 0,
      end: 5,
      color: 1 as const,
    }));
    const big = makeSave('auto', { searchLog, notebook: { pins: [], highlights, notes: [] } });
    const full = JSON.stringify(stripSave(big)).length;

    const trimmed = anonymiseSave(big, full - 100)!;
    expect(trimmed.trimmedSearches).toBeGreaterThan(0);
    expect(trimmed.droppedHighlights).toBe(0);
    // Les recherches gardées sont les plus récentes.
    expect(trimmed.save.searchLog.at(-1)!.keyword).toBe('mot-199');
    expect(JSON.stringify(trimmed.save).length).toBeLessThanOrEqual(full - 100);

    const bare = JSON.stringify(
      stripSave({ ...big, searchLog: [], notebook: { pins: [], highlights: [], notes: [] } }),
    ).length;
    const dropped = anonymiseSave(big, bare)!;
    expect(dropped.droppedHighlights).toBe(50);
    expect(dropped.save.searchLog).toEqual([]);

    expect(anonymiseSave(big, bare - 1)).toBeNull();
  });

  it('limite par défaut : 48 Ko de JSON', () => {
    const out = anonymiseSave(save());
    expect(JSON.stringify(out!.save).length).toBeLessThanOrEqual(REPORT_LIMITS.saveJson);
  });
});
