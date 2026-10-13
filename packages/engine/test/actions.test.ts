import { MAX_TICK_MS, SAVE_LIMITS, type Action, type SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { applyAction, ENGINE_LIMITS, newGame, toMs } from '../src';
import { C, deepFreeze, events, find, open, play, researched, start, visit } from './helpers';

const rejected = (reason: string) => [{ type: 'rejected', reason }];

describe('newGame', () => {
  it('documents de départ, case pré-remplie établie, aucun lu', () => {
    const s = newGame(C, { slot: 'auto', mode: 'timed', at: 1234.9 });
    expect(s).toMatchObject({
      schemaVersion: 1,
      caseId: 'affaire-test',
      contentHash: 'a1b2c3d4',
      edition: 'full',
      slot: 'auto',
      mode: 'timed',
      createdAt: 1234,
      updatedAt: 1234,
      elapsedMs: 0,
      read: {},
      ending: null,
    });
    expect(s.unlocked).toEqual({ 'lettre-notaire': 1234, 'photo-noces': 1234 });
    expect(s.locked).toEqual({ 'g0-ivo': 1234 });
    expect(s.tree['g0-ivo']).toEqual({
      given: 'Ivo',
      family: 'Marrel',
      portrait: 'p-ivo',
      occupation: 'horloger',
    });
  });

  it('horodatage invalide → 0', () => {
    expect(newGame(C, { slot: 'auto', mode: 'standard', at: Number.NaN }).createdAt).toBe(0);
    expect(toMs(-1, 7)).toBe(7);
    expect(toMs('3', 7)).toBe(7);
  });
});

describe('déterminisme et immuabilité', () => {
  it('mêmes actions → mêmes états et événements ; entrées gelées jamais modifiées', () => {
    const actions: Action[] = [
      open('lettre-notaire', 2000),
      find('marrel', 3000),
      visit('port-lanne', 4000),
    ];
    const a = play(start(), actions);
    const b = play(start(), actions);
    expect(a.state).toEqual(b.state);
    expect(a.events).toEqual(b.events);
  });

  it('action nulle ou de type inconnu → rejetée, état identique', () => {
    const s = start();
    expect(applyAction(s, null as never, C).events).toEqual(rejected('notAvailable'));
    const t = applyAction(s, { type: 'danse', at: 1 } as never, C);
    expect(t.events).toEqual(rejected('notAvailable'));
    expect(t.state).toBe(s);
  });

  it('horloge monotone : un at antérieur ou invalide prend updatedAt', () => {
    const s = play(start(), [open('lettre-notaire', 5000)]).state;
    const t = applyAction(s, open('photo-noces', 10), C);
    expect(t.state.read['photo-noces']).toBe(5000);
    const u = applyAction(s, { type: 'openDocument', id: 'photo-noces', at: Number.NaN }, C);
    expect(u.state.updatedAt).toBe(5000);
  });
});

describe('openDocument', () => {
  it('marque lu une fois (premier horodatage conservé)', () => {
    const r = play(start(), [open('lettre-notaire', 2000), open('lettre-notaire', 3000)]);
    expect(r.state.read['lettre-notaire']).toBe(2000);
    expect(r.state.updatedAt).toBe(3000);
    expect(r.events).toEqual([]);
  });

  it('refus : inconnu, non débloqué', () => {
    const s = start();
    expect(applyAction(s, open('nope', 1), C).events).toEqual(rejected('unknownId'));
    expect(applyAction(s, open('epilogue', 1), C).events).toEqual(rejected('notAvailable'));
  });
});

describe('visitPlace', () => {
  it('ouvre le fonds du lieu, puis révèle un nouveau lieu par lecture', () => {
    const r = play(start(), [visit('port-lanne', 2000), visit('port-lanne', 2100)]);
    expect(r.state.visited).toEqual(['port-lanne']);
    expect(events(r.events, 'documentsUnlocked')).toEqual([
      { type: 'documentsUnlocked', ids: ['annuaire-lanne'] },
    ]);
    expect(applyAction(r.state, visit('vessaut', 2200), C).events).toEqual(
      rejected('notAvailable'),
    );
    const r2 = play(r.state, [open('annuaire-lanne', 2300), visit('vessaut', 2400)]);
    expect(r2.state.unlocked['moulin-vessaut']).toBe(2400);
    expect(r2.state.unlocked['journal-crue']).toBeUndefined();
    // Le document conditionné arrive en rouvrant le lieu après la recherche.
    const r3 = play(r2.state, [find('vessaut', 2500), visit('vessaut', 2600)]);
    expect(r3.state.unlocked['journal-crue']).toBe(2500); // déjà via la recherche
  });

  it('refus : lieu inconnu', () => {
    expect(applyAction(start(), visit('atlantide', 1), C).events).toEqual(rejected('unknownId'));
  });
});

describe('tick', () => {
  it.each([
    [1000, 1000],
    [MAX_TICK_MS + 1, MAX_TICK_MS],
    [-50, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [12.6, 13],
  ])('deltaMs %s → +%s', (delta, expected) => {
    const s = start();
    const t = applyAction(s, { type: 'tick', deltaMs: delta }, C);
    expect(t.state.elapsedMs).toBe(expected);
    expect(t.events).toEqual([]);
    if (expected === 0) expect(t.state).toBe(s);
  });

  it('chronomètre figé au dénouement en mode chronométré, pas en standard', () => {
    const timed: SaveState = deepFreeze({ ...start('timed'), ending: 'fin-arbre', elapsedMs: 10 });
    expect(applyAction(timed, { type: 'tick', deltaMs: 100 }, C).state.elapsedMs).toBe(10);
    const std: SaveState = deepFreeze({ ...start(), ending: 'fin-arbre', elapsedMs: 10 });
    expect(applyAction(std, { type: 'tick', deltaMs: 100 }, C).state.elapsedMs).toBe(110);
  });
});

describe('épingles', () => {
  const s = researched();

  it('épingle document, mot-clé connu, case visible ; doublon ignoré ; désépingle', () => {
    const r = play(s, [
      { type: 'pin', target: { kind: 'document', id: 'lettre-notaire' }, at: 20000 },
      { type: 'pin', target: { kind: 'keyword', id: 'kw-marrel' }, at: 20001 },
      { type: 'pin', target: { kind: 'slot', id: 'g1-tam' }, at: 20002 },
      { type: 'pin', target: { kind: 'slot', id: 'g1-tam' }, at: 20003 },
    ]);
    expect(r.state.notebook.pins).toHaveLength(3);
    expect(r.events).toEqual([]);
    const u = play(r.state, [
      { type: 'unpin', target: { kind: 'slot', id: 'g1-tam' }, at: 20004 },
      { type: 'unpin', target: { kind: 'slot', id: 'g1-tam' }, at: 20005 },
    ]);
    expect(u.state.notebook.pins).toHaveLength(2);
    expect(applyAction(s, { type: 'unpin', target: null as never, at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
  });

  it.each([
    [{ kind: 'document', id: 'nope' }, 'unknownId'],
    [{ kind: 'document', id: 'epilogue' }, 'notAvailable'],
    [{ kind: 'keyword', id: 'kw-nope' }, 'unknownId'],
    [{ kind: 'keyword', id: 'kw-juno' }, 'notAvailable'],
    [{ kind: 'slot', id: 'nope' }, 'unknownId'],
    [{ kind: 'slot', id: 'g2-juno' }, 'notAvailable'],
    [{ kind: 'carte', id: 'x' }, 'notAvailable'],
    [{ kind: 'slot' }, 'unknownId'],
    [null, 'notAvailable'],
  ])('refus %j → %s', (target, reason) => {
    expect(applyAction(s, { type: 'pin', target: target as never, at: 1 }, C).events).toEqual(
      rejected(reason),
    );
  });

  it(`limite de ${SAVE_LIMITS.pins} épingles`, () => {
    const full: SaveState = deepFreeze({
      ...s,
      notebook: {
        ...s.notebook,
        pins: Array.from({ length: SAVE_LIMITS.pins }, (_, i) => ({
          kind: 'document' as const,
          id: `d${i}`,
        })),
      },
    });
    const t = applyAction(
      full,
      { type: 'pin', target: { kind: 'document', id: 'lettre-notaire' }, at: 1 },
      C,
    );
    expect(t.events).toEqual(rejected('limit'));
  });
});

describe('surlignages', () => {
  const s = researched();
  const h = { doc: 'lettre-notaire', path: [0, 1], start: 2, end: 8, color: 3 as const };

  it('ajoute, ignore un doublon, retire par index', () => {
    const r = play(s, [
      { type: 'highlight', h, at: 20000 },
      { type: 'highlight', h: { ...h }, at: 20001 },
      { type: 'highlight', h: { ...h, color: 1 }, at: 20002 },
    ]);
    expect(r.state.notebook.highlights).toHaveLength(2);
    const u = play(r.state, [{ type: 'removeHighlight', index: 0, at: 20003 }]);
    expect(u.state.notebook.highlights).toEqual([{ ...h, color: 1 }]);
  });

  it.each([
    [{ ...h, start: 9 }, 'notAvailable'],
    [{ ...h, color: 9 }, 'notAvailable'],
    [{ ...h, path: [] }, 'notAvailable'],
    [{ ...h, doc: 'inconnu' }, 'unknownId'],
    [{ ...h, doc: 'epilogue' }, 'notAvailable'],
  ])('refus %j', (bad, reason) => {
    expect(applyAction(s, { type: 'highlight', h: bad as never, at: 1 }, C).events).toEqual(
      rejected(reason),
    );
  });

  it('refus : index hors bornes ; limite', () => {
    expect(applyAction(s, { type: 'removeHighlight', index: 0, at: 1 }, C).events).toEqual(
      rejected('unknownId'),
    );
    expect(applyAction(s, { type: 'removeHighlight', index: 0.5, at: 1 }, C).events).toEqual(
      rejected('unknownId'),
    );
    const full: SaveState = deepFreeze({
      ...s,
      notebook: {
        ...s.notebook,
        highlights: Array.from({ length: ENGINE_LIMITS.highlights }, (_, i) => ({
          ...h,
          start: i,
          end: i + 1,
        })),
      },
    });
    expect(
      applyAction(full, { type: 'highlight', h: { ...h, start: 5000, end: 5001 }, at: 1 }, C)
        .events,
    ).toEqual(rejected('limit'));
  });
});

describe('notes', () => {
  const s = researched();

  it('crée (id déterministe et unique), modifie, supprime', () => {
    const r = play(s, [
      { type: 'note', text: 'Tam est marin ?', at: 20000 },
      { type: 'note', text: 'Deuxième', at: 20000 },
      { type: 'note', id: 'perso', target: { kind: 'slot', id: 'g1-tam' }, text: 'A', at: 20001 },
    ]);
    const ids = r.state.notebook.notes.map((n) => n.id);
    expect(ids).toEqual([`n${(20000).toString(36)}`, `n${(20000).toString(36)}-1`, 'perso']);
    const u = play(r.state, [{ type: 'note', id: 'perso', text: 'B', at: 20002 }]);
    expect(u.state.notebook.notes[2]).toEqual({ id: 'perso', text: 'B', at: 20002 });
    const d = play(u.state, [{ type: 'deleteNote', id: 'perso', at: 20003 }]);
    expect(d.state.notebook.notes).toHaveLength(2);
    expect(applyAction(d.state, { type: 'deleteNote', id: 'perso', at: 1 }, C).events).toEqual(
      rejected('unknownId'),
    );
  });

  it('refus : texte trop long, id invalide, cible invalide, limite', () => {
    expect(
      applyAction(s, { type: 'note', text: 'x'.repeat(SAVE_LIMITS.noteText + 1), at: 1 }, C).events,
    ).toEqual(rejected('tooLong'));
    expect(applyAction(s, { type: 'note', text: 3 as never, at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
    expect(applyAction(s, { type: 'note', id: '', text: 'a', at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
    expect(
      applyAction(s, { type: 'note', id: 'x'.repeat(65), text: 'a', at: 1 }, C).events,
    ).toEqual(rejected('tooLong'));
    expect(
      applyAction(s, { type: 'note', target: { kind: 'slot', id: 'zz' }, text: 'a', at: 1 }, C)
        .events,
    ).toEqual(rejected('unknownId'));
    const full: SaveState = deepFreeze({
      ...s,
      notebook: {
        ...s.notebook,
        notes: Array.from({ length: ENGINE_LIMITS.notes }, (_, i) => ({
          id: `k${i}`,
          text: '',
          at: 0,
        })),
      },
    });
    expect(applyAction(full, { type: 'note', text: 'a', at: 1 }, C).events).toEqual(
      rejected('limit'),
    );
    // Modifier une note existante reste possible à la limite.
    expect(applyAction(full, { type: 'note', id: 'k1', text: 'a', at: 1 }, C).events).toEqual([]);
  });
});

describe('useHint', () => {
  it('paliers dans l’ordre, conditions, case ouverte, une seule fois', () => {
    const s = start();
    expect(applyAction(s, { type: 'useHint', id: 'h-tam-1', at: 1 }, C).events).toEqual(
      rejected('notAvailable'), // lettre pas encore lue
    );
    const r = play(s, [open('lettre-notaire', 2000), { type: 'useHint', id: 'h-tam-1', at: 2001 }]);
    expect(r.state.hintsUsed).toEqual({ 'h-tam-1': 2001 });
    const again = applyAction(r.state, { type: 'useHint', id: 'h-tam-1', at: 2002 }, C);
    expect(again.state).toBe(r.state);
    // Palier 3 avant le 2 : refusé même si sa condition est remplie.
    const r2 = play(r.state, [find('marrel', 3000), open('registre-marrel', 3001)]);
    expect(applyAction(r2.state, { type: 'useHint', id: 'h-tam-3', at: 3002 }, C).events).toEqual(
      rejected('notAvailable'),
    );
    const r3 = play(r2.state, [
      { type: 'useHint', id: 'h-tam-2', at: 3003 },
      { type: 'useHint', id: 'h-tam-3', at: 3004 },
    ]);
    expect(Object.keys(r3.state.hintsUsed)).toEqual(['h-tam-1', 'h-tam-2', 'h-tam-3']);
    expect(applyAction(s, { type: 'useHint', id: 'h-x', at: 1 }, C).events).toEqual(
      rejected('unknownId'),
    );
  });

  it('refusé en mode chronométré et sur une case verrouillée', () => {
    const timed = play(start('timed'), [open('lettre-notaire', 2000)]).state;
    expect(applyAction(timed, { type: 'useHint', id: 'h-tam-1', at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
    const lockedTam: SaveState = deepFreeze({
      ...play(start(), [open('lettre-notaire', 2000)]).state,
      locked: { 'g0-ivo': 1, 'g1-tam': 2 },
    });
    expect(applyAction(lockedTam, { type: 'useHint', id: 'h-tam-1', at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
  });
});

describe('finish', () => {
  it('refusé tant qu’aucune fin n’est vraie', () => {
    expect(applyAction(start(), { type: 'finish', at: 1 }, C).events).toEqual(
      rejected('notAvailable'),
    );
  });
});
