import type { SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { settle } from '../src';
import { C, deepFreeze, start, clone } from './helpers';

describe('settle (point fixe des déblocages)', () => {
  it('sans changement : renvoie le même état, aucun événement', () => {
    const s = start();
    const t = settle(s, C);
    expect(t.state).toBe(s);
    expect(t.events).toEqual([]);
  });

  it('cascade : déblocage → révélation → secret, en un seul appel', () => {
    const s: SaveState = deepFreeze({
      ...start(),
      updatedAt: 9000,
      read: { 'telegramme-juno': 1, 'note-juno': 2, 'acte-secret': 3 },
      searched: ['kw-vessaut'],
      locked: Object.fromEntries(Object.keys(C.slots).map((id) => [id, 5])),
    });
    const t = settle(s, C);
    expect(t.events).toEqual([
      {
        type: 'documentsUnlocked',
        ids: ['carte-tam', 'note-juno', 'acte-secret', 'epilogue'],
      },
      { type: 'slotsRevealed', ids: ['g2-juno'] },
      { type: 'secretFound', id: 'sec-double-vie' },
    ]);
    expect(t.state.unlocked['epilogue']).toBe(9000);
    expect(t.state.secrets['sec-double-vie']).toBe(9000);
  });

  it('monotone et idempotent : un second passage ne change rien', () => {
    const s: SaveState = deepFreeze({ ...start(), read: { 'telegramme-juno': 1 } });
    const once = settle(s, C);
    const twice = settle(once.state, C);
    expect(twice.state).toBe(once.state);
    expect(twice.events).toEqual([]);
    for (const id of Object.keys(s.unlocked)) expect(once.state.unlocked[id]).toBe(s.unlocked[id]);
  });

  it('dépendances en chaîne résolues quel que soit l’ordre de déclaration', () => {
    const c = deepFreeze({
      ...clone(C),
      progression: {
        ...clone(C.progression),
        // c dépend de b qui dépend de a, déclarés à l'envers
        unlocks: {
          'acte-secret': { unlocked: 'note-juno' },
          'note-juno': { unlocked: 'epilogue' },
          epilogue: { read: 'lettre-notaire' },
        },
      },
    });
    const s = deepFreeze({ ...start(), read: { 'lettre-notaire': 1 } });
    const t = settle(s, c);
    expect(t.events[0]).toEqual({
      type: 'documentsUnlocked',
      // passe 1 → epilogue ; passe 2 → note-juno ; passe 3 → acte-secret
      ids: ['epilogue', 'note-juno', 'acte-secret'],
    });
  });

  it('ignore les documents de déblocage absents du contenu (édition démo)', () => {
    const c = deepFreeze({
      ...clone(C),
      progression: {
        ...clone(C.progression),
        unlocks: { absent: { read: 'lettre-notaire' } },
      },
    });
    const s = deepFreeze({ ...start(), read: { 'lettre-notaire': 1 } });
    expect(settle(s, c).events).toEqual([]);
  });
});
