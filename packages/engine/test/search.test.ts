import { SAVE_LIMITS } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { applyAction, search } from '../src';
import { C, events, find, open, play, researched, start } from './helpers';

describe('search (pur)', () => {
  const s = start();

  it.each([
    ['Marrel', 'kw-marrel'],
    ['  MARREL ', 'kw-marrel'],
    ['marrel!', 'kw-marrel'],
    ['Port-Lanne', 'kw-port-lanne'],
    ['port   lanne', 'kw-port-lanne'],
    ["L'école", null], // l'article n'est pas retiré (pas de liste d'articles au contrat)
    ['École de Port-Lanne', 'kw-ecole'],
    ['ecole', 'kw-ecole'],
    ['Cael', 'kw-cael'],
    ['CAËL dacque', 'kw-cael'],
    ['Juno Marrel', 'kw-juno'],
    ['Juno', null], // terme caché : seul le nom complet répond
    ['Marel', null], // aucune tolérance de frappe
    ['Marrel Sorvo', null], // pas de combinaison
    ['x', null], // trop court
    ['', null],
  ])('%j → %s', (query, keyword) => {
    expect(search(query, s, C).keyword).toBe(keyword);
  });

  it('renvoie les documents accessibles et les nouveaux', () => {
    const o = search('marrel', s, C);
    expect(o).toEqual({
      query: 'marrel',
      normalized: 'marrel',
      keyword: 'kw-marrel',
      documents: ['registre-marrel'],
      newDocuments: ['registre-marrel'],
    });
    const after = play(s, [find('marrel', 2000)]).state;
    expect(search('Marrel', after, C).newDocuments).toEqual([]);
  });

  it('respecte les conditions des résultats (requires)', () => {
    expect(search('Caël', s, C).documents).toEqual([]);
    const locked = { ...s, locked: { ...s.locked, a: 1, b: 1, c: 1 } };
    expect(search('Caël', locked, C).documents).toEqual(['photo-quai']);
  });

  it('ignore un index qui pointe vers un mot-clé ou un document absents', () => {
    const c = {
      ...C,
      searchIndex: { ...C.searchIndex, fantome: 'kw-fantome' },
      keywords: {
        ...C.keywords,
        'kw-vide': {
          id: 'kw-vide',
          label: 'Vide',
          kind: 'other' as const,
          results: [{ documents: ['nulle-part'] }],
        },
      },
    };
    expect(search('fantome', s, c).keyword).toBeNull();
    const c2 = { ...c, searchIndex: { ...c.searchIndex, vide: 'kw-vide' } };
    expect(search('vide', s, c2)).toMatchObject({ keyword: 'kw-vide', documents: [] });
    expect(search(null as never, s, C).normalized).toBe('');
  });
});

describe('action search', () => {
  it('débloque, journalise, marque le mot-clé recherché', () => {
    const r = play(start(), [find('Marrel', 2000)]);
    expect(r.events).toEqual([
      {
        type: 'searchResult',
        outcome: {
          query: 'Marrel',
          normalized: 'marrel',
          keyword: 'kw-marrel',
          documents: ['registre-marrel'],
          newDocuments: ['registre-marrel'],
        },
      },
      { type: 'documentsUnlocked', ids: ['registre-marrel'] },
    ]);
    expect(r.state.unlocked['registre-marrel']).toBe(2000);
    expect(r.state.searched).toEqual(['kw-marrel']);
    expect(r.state.searchLog).toEqual([{ query: 'Marrel', keyword: 'kw-marrel', at: 2000 }]);
  });

  it('requête vide de résultat : journalisée, sans mot-clé', () => {
    const r = play(start(), [
      find('Personne inconnue', 2000),
      find('marrel', 2100),
      find('Marrel', 2200),
    ]);
    expect(r.state.searchLog.map((e) => e.keyword)).toEqual([null, 'kw-marrel', 'kw-marrel']);
    expect(r.state.searched).toEqual(['kw-marrel']);
    expect(events(r.events, 'documentsUnlocked')).toHaveLength(1);
  });

  it('requête vide après normalisation : aucun changement d’état', () => {
    const s = start();
    const t = applyAction(s, find(' ?! ', 2000), C);
    expect(t.state).toBe(s);
    expect(t.events[0]?.type).toBe('searchResult');
  });

  it('refus : requête trop longue ou non textuelle', () => {
    const s = start();
    expect(applyAction(s, find('a'.repeat(SAVE_LIMITS.query + 1), 1), C).events).toEqual([
      { type: 'rejected', reason: 'tooLong' },
    ]);
    expect(applyAction(s, { type: 'search', query: 3 as never, at: 1 }, C).events).toEqual([
      { type: 'rejected', reason: 'notAvailable' },
    ]);
  });

  it(`journal borné à ${SAVE_LIMITS.searchLog} entrées (les plus récentes)`, () => {
    const actions = Array.from({ length: SAVE_LIMITS.searchLog + 5 }, (_, i) =>
      find(`q${i}`, 2000 + i),
    );
    const r = play(start(), actions);
    expect(r.state.searchLog).toHaveLength(SAVE_LIMITS.searchLog);
    expect(r.state.searchLog[0]?.query).toBe('q5');
  });

  it('terme caché : connu une fois recherché, révèle une case par lecture', () => {
    const r = play(researched(), [find('juno marrel', 30000), open('telegramme-juno', 30100)]);
    expect(r.state.searched).toContain('kw-juno');
    expect(r.state.revealedSlots).toEqual(['g2-juno']);
    expect(r.state.unlocked['note-juno']).toBe(30100);
  });
});
