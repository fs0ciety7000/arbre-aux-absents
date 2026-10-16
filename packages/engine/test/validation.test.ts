import type { CompiledCase, SaveState, SlotGuess, ValidationGroup } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  areInterchangeable,
  emptyGuard,
  groupCorrectCount,
  groupThreshold,
  isSlotCorrect,
  isSuspended,
  newGame,
  recordChanges,
  SWEEP_SUSPEND_MS,
  swapGuesses,
  validate,
} from '../src';
import { SOLUTION } from './fixtures/case';
import {
  AINES_RESEARCH,
  C,
  CADETS_RESEARCH,
  deepFreeze,
  events,
  fill,
  find,
  open,
  play,
  researched,
  start,
  clone,
} from './helpers';

function withGroups(groups: ValidationGroup[]): CompiledCase {
  return deepFreeze({ ...clone(C), groups });
}

describe('validation automatique (R1 à R3)', () => {
  it('2 cases justes : rien ; la 3e verrouille le groupe et débloque la suite', () => {
    const s = researched();
    const r1 = play(s, [fill('g0-elna', 12000), fill('g1-tam', 12100)]);
    expect(events(r1.events, 'slotsLocked')).toEqual([]);
    expect(events(r1.events, 'validationFailed')).toHaveLength(2);
    expect(r1.state.locked['g0-elna']).toBeUndefined();

    const r2 = play(r1.state, [fill('g1-lisbe', 12200)]);
    expect(r2.events[0]).toEqual({
      type: 'slotsLocked',
      ids: ['g0-elna', 'g1-tam', 'g1-lisbe'],
      groups: ['grp-aines'],
    });
    expect(r2.state.locked).toMatchObject({ 'g0-elna': 12200, 'g1-tam': 12200, 'g1-lisbe': 12200 });
    expect(events(r2.events, 'documentsUnlocked')).toEqual([
      { type: 'documentsUnlocked', ids: ['carte-tam'] },
    ]);
  });

  it('une case incomplète n’est jamais vérifiée (aucun événement)', () => {
    const r = play(researched(), [
      fill('g0-elna', 12000),
      fill('g1-tam', 12100),
      fill('g1-lisbe', 12200, { given: 'Lisbé', family: 'Marrel', portrait: 'p-lisbe' }),
    ]);
    expect(r.events).toHaveLength(2);
    expect(events(r.events, 'validationFailed')).toHaveLength(2);
    expect(Object.keys(r.state.locked)).toEqual(['g0-ivo']);
  });

  it('une erreur dans un champ suffit : silence, sans détail', () => {
    const r = play(researched(), [
      fill('g0-elna', 12000),
      fill('g1-tam', 12100, { ...SOLUTION['g1-tam'], family: 'Sorvo' }),
      fill('g1-lisbe', 12200),
    ]);
    expect(events(r.events, 'slotsLocked')).toEqual([]);
    expect(r.events.at(-1)).toEqual({ type: 'validationFailed' });
    expect(groupCorrectCount('grp-aines', r.state, C)).toBe(2);
  });

  it('variantes acceptées (prénom, nom d’usage) et graphie canonique enregistrée', () => {
    const r = play(researched(), [
      fill('g0-elna', 12000, { ...SOLUTION['g0-elna'], family: 'MARREL' }),
      fill('g1-tam', 12100, { ...SOLUTION['g1-tam'], given: 'tamas' }),
      fill('g1-lisbe', 12200, { ...SOLUTION['g1-lisbe'], given: 'LISBETH', family: 'dacque' }),
    ]);
    expect(r.state.tree['g1-lisbe']).toMatchObject({ given: 'Lisbeth', family: 'Dacque' });
    expect(r.state.tree['g0-elna']?.family).toBe('Marrel');
    expect(events(r.events, 'slotsLocked')).toHaveLength(1);
  });

  it('seuil = min(threshold, restantes) ; seules les justes se verrouillent ; R6 et R8', () => {
    const c = withGroups([
      {
        id: 'quatre',
        label: 'Q',
        slots: ['g0-elna', 'g1-tam', 'g1-lisbe', 'g1-oren'],
        threshold: 3,
      },
      { id: 'reste', label: 'R', slots: ['g2-cael', 'g2-mira', 'g2-juno'], threshold: 3 },
    ]);
    const s = researched();
    expect(groupThreshold(c.groups[0]!, s)).toBe(3);
    const r = play(
      s,
      [
        fill('g0-elna', 12000),
        fill('g1-tam', 12100, { ...SOLUTION['g1-tam'], portrait: 'p-figurant' }),
        fill('g1-lisbe', 12200),
        fill('g1-oren', 12300),
      ],
      {},
      c,
    );
    const locked = events(r.events, 'slotsLocked');
    expect(locked).toEqual([
      { type: 'slotsLocked', ids: ['g0-elna', 'g1-lisbe', 'g1-oren'], groups: ['quatre'] },
    ]);
    expect(r.state.locked['g1-tam']).toBeUndefined();
    // R6 : les verrouillées ne comptent plus ; il reste 1 case → seuil 1 (R8).
    expect(groupThreshold(c.groups[0]!, r.state)).toBe(1);
    expect(groupCorrectCount('quatre', r.state, c)).toBe(0);
    const r2 = play(r.state, [fill('g1-tam', 12400, { portrait: 'p-tam' })], {}, c);
    expect(r2.events[0]).toEqual({ type: 'slotsLocked', ids: ['g1-tam'], groups: ['quatre'] });
    expect(groupThreshold(c.groups[0]!, r2.state)).toBe(0);
    // Groupe terminé : validate ne renvoie rien pour lui.
    expect(validate(r2.state, c)).toEqual({ lock: [], groups: [] });
  });

  it('R7 : 2 + 2 justes réparties sur deux groupes ne verrouillent rien', () => {
    const c = withGroups([
      { id: 'a', label: 'A', slots: ['g0-elna', 'g1-tam', 'g2-mira'], threshold: 3 },
      { id: 'b', label: 'B', slots: ['g1-lisbe', 'g1-oren', 'g2-cael'], threshold: 3 },
    ]);
    const r = play(
      researched(),
      [fill('g0-elna', 1), fill('g1-tam', 2), fill('g1-lisbe', 3), fill('g1-oren', 4)],
      {},
      c,
    );
    expect(events(r.events, 'slotsLocked')).toEqual([]);
    expect(validate(r.state, c)).toEqual({ lock: [], groups: [] });
  });

  it('les cases cachées comptent dans les restantes du groupe', () => {
    const s = play(researched(), [fill('g0-elna', 1), fill('g1-tam', 2), fill('g1-lisbe', 3)]);
    const s2 = play(s.state, CADETS_RESEARCH).state;
    const cadets = C.groups[1]!;
    expect(groupThreshold(cadets, s2)).toBe(3); // juno cachée mais non verrouillée
    const r = play(s2, [fill('g1-oren', 30000), fill('g2-cael', 30100)]);
    expect(events(r.events, 'slotsLocked')).toEqual([]);
  });

  it('isSlotCorrect : faux pour une case vide, inconnue ou incomplète', () => {
    const s = researched();
    expect(isSlotCorrect('g1-tam', s, C)).toBe(false);
    expect(isSlotCorrect('inconnue', s, C)).toBe(false);
    expect(isSlotCorrect('g0-ivo', s, C)).toBe(true);
    expect(groupCorrectCount('inconnu', s, C)).toBe(0);
  });
});

describe('validation manuelle', () => {
  it('setSlot ne valide pas ; l’action validate verrouille', () => {
    const r = play(
      researched(),
      [fill('g0-elna', 12001), fill('g1-tam', 12002), fill('g1-lisbe', 12003)],
      { validation: 'manual' },
    );
    expect(r.events).toEqual([]);
    const v = play(r.state, [{ type: 'validate', at: 12004 }]);
    expect(events(v.events, 'slotsLocked')).toHaveLength(1);
    expect(v.state.unlocked['carte-tam']).toBe(12004);
    expect(v.state.locked['g1-tam']).toBe(12004);
  });

  it('validate sans rien à verrouiller → validationFailed', () => {
    const v = play(start(), [{ type: 'validate', at: 5000 }]);
    expect(v.events).toEqual([{ type: 'validationFailed' }]);
    expect(v.state.updatedAt).toBe(5000);
  });

  it('validate pur : filtre par groupes', () => {
    const r = play(researched(), [fill('g0-elna', 1), fill('g1-tam', 2), fill('g1-lisbe', 3)], {
      validation: 'manual',
    });
    expect(validate(r.state, C, { groups: ['grp-cadets'] }).lock).toEqual([]);
    expect(validate(r.state, C, { groups: ['grp-aines'] }).groups).toEqual(['grp-aines']);
  });
});

describe('garde-fou anti-balayage (§7.6-7)', () => {
  it('7 changements d’un même champ en 30 s suspendent le groupe 10 s, en silence', () => {
    const base = play(researched(), [fill('g0-elna', 100_000), fill('g1-lisbe', 100_100)]);
    const sweep = ['p-figurant', 'p-elna', 'p-figurant', 'p-elna', 'p-figurant', 'p-elna'];
    let r = play(
      base.state,
      [fill('g1-tam', 100_200, { ...SOLUTION['g1-tam'], portrait: 'p-oren' })],
      {
        guard: base.guard!,
      },
    );
    sweep.forEach((portrait, i) => {
      r = play(r.state, [fill('g1-tam', 101_000 + i * 1000, { portrait })], { guard: r.guard! });
    });
    expect(isSuspended(r.guard, 'grp-aines', 107_000)).toBe(true);
    // La bonne réponse arrive pendant la suspension : même retour qu'un échec.
    const during = play(r.state, [fill('g1-tam', 107_500, { portrait: 'p-tam' })], {
      guard: r.guard!,
    });
    expect(during.events).toEqual([{ type: 'validationFailed' }]);
    expect(during.state.locked['g1-tam']).toBeUndefined();
    expect(groupCorrectCount('grp-aines', during.state, C)).toBe(3);
    // Après la suspension, une validation verrouille.
    const until = during.guard!.suspendedUntil['grp-aines']!;
    expect(until).toBe(107_500 + SWEEP_SUSPEND_MS);
    const after = play(during.state, [{ type: 'validate', at: until }], { guard: during.guard! });
    expect(events(after.events, 'slotsLocked')).toHaveLength(1);
  });

  it('6 changements ne suspendent pas ; la fenêtre glisse sur 30 s', () => {
    let g = emptyGuard();
    for (let i = 0; i < 6; i++) g = recordChanges(g, 'grp', 'x', ['portrait'], i * 1000);
    expect(isSuspended(g, 'grp', 6000)).toBe(false);
    // Changements espacés de plus de 30 s : la fenêtre ne garde que les récents.
    g = recordChanges(g, 'grp', 'x', ['portrait'], 40_000);
    expect(g.changes['x|portrait']).toEqual([40_000]);
    expect(isSuspended(g, 'grp', 40_000)).toBe(false);
    expect(isSuspended(undefined, 'grp', 0)).toBe(false);
    expect(recordChanges(g, 'grp', 'x', [], 1)).toBe(g);
    // Case hors groupe : jamais de suspension.
    let h = emptyGuard();
    for (let i = 0; i < 10; i++) h = recordChanges(h, null, 'y', ['given'], i);
    expect(h.suspendedUntil).toEqual({});
  });

  it('effacer une case compte comme un changement', () => {
    const r = play(researched(), [fill('g1-tam', 1), { type: 'clearSlot', slot: 'g1-tam', at: 2 }]);
    expect(r.guard!.changes['g1-tam|given']).toEqual([11000, 11000]);
  });
});

describe('setSlot : refus', () => {
  const s = researched();
  const reject = (a: Parameters<typeof applyAction>[1], st: SaveState = s) =>
    applyAction(st, a, C).events;

  it.each([
    ['case inconnue', fill('inconnue', 1), 'unknownId'],
    ['case cachée', fill('g2-juno', 1, { given: 'Ivo' }), 'notAvailable'],
    ['case verrouillée', fill('g0-ivo', 1, { given: 'Elna' }), 'slotLocked'],
    ['prénom jamais lu', fill('g1-tam', 1, { given: 'Juno' }), 'notAvailable'],
    ['nom trop long', fill('g1-tam', 1, { family: 'x'.repeat(101) }), 'tooLong'],
    ['prénom non textuel', fill('g1-tam', 1, { given: 3 as unknown as string }), 'notAvailable'],
    ['portrait inconnu', fill('g1-tam', 1, { portrait: 'p-x' }), 'unknownId'],
    ['portrait non découvert', fill('g1-tam', 1, { portrait: 'p-juno' }), 'notAvailable'],
    ['métier inconnu', fill('g1-tam', 1, { occupation: 'pirate' }), 'unknownId'],
    ['métier non textuel', fill('g1-tam', 1, { occupation: 4 as unknown as string }), 'unknownId'],
  ])('%s', (_, action, reason) => {
    const t = applyAction(s, action, C);
    expect(t.events).toEqual([{ type: 'rejected', reason }]);
    expect(t.state).toBe(s);
  });

  it('métier non découvert', () => {
    const fresh = start();
    expect(reject(fill('g1-tam', 1, { occupation: 'marin' }), fresh)).toEqual([
      { type: 'rejected', reason: 'notAvailable' },
    ]);
  });

  it('patch non objet', () => {
    expect(reject({ type: 'setSlot', slot: 'g1-tam', patch: null as never, at: 1 })).toEqual([
      { type: 'rejected', reason: 'notAvailable' },
    ]);
  });

  it('aucun changement : aucun événement, état identique', () => {
    const r = play(s, [fill('g1-tam', 1, { given: 'Tam' })]);
    const t = applyAction(r.state, fill('g1-tam', 2, { given: 'tam' }), C);
    expect(t.events).toEqual([]);
    expect(t.state).toBe(r.state);
  });

  it('vider tous les champs retire la case ; null et chaîne vide acceptés', () => {
    const r = play(s, [
      fill('g1-tam', 1, { given: 'Tam', portrait: 'p-tam', occupation: 'marin' }),
      fill('g1-tam', 2, { given: '  ', portrait: null, occupation: null }),
    ]);
    expect(r.state.tree['g1-tam']).toBeUndefined();
  });

  it('les champs inconnus du patch sont ignorés', () => {
    const r = play(s, [fill('g1-tam', 1, { given: 'Tam', extra: 1 } as never)]);
    expect(r.state.tree['g1-tam']).toEqual({
      given: 'Tam',
      family: '',
      portrait: null,
      occupation: null,
    });
  });
});

describe('clearSlot', () => {
  it('vide une case ouverte ; refuse une case verrouillée ou inconnue ; no-op si vide', () => {
    const s = play(researched(), [fill('g1-tam', 1)]).state;
    const t = applyAction(s, { type: 'clearSlot', slot: 'g1-tam', at: 2 }, C);
    expect(t.state.tree['g1-tam']).toBeUndefined();
    expect(applyAction(s, { type: 'clearSlot', slot: 'g0-ivo', at: 2 }, C).events).toEqual([
      { type: 'rejected', reason: 'slotLocked' },
    ]);
    expect(applyAction(s, { type: 'clearSlot', slot: 'zz', at: 2 }, C).events).toEqual([
      { type: 'rejected', reason: 'unknownId' },
    ]);
    const noop = applyAction(s, { type: 'clearSlot', slot: 'g1-lisbe', at: 2 }, C);
    expect(noop.state).toBe(s);
  });
});

describe('cases cachées révélées', () => {
  it('une case révélée devient remplissable', () => {
    const s = play(researched(), [find('Juno Marrel', 50), open('telegramme-juno', 60)]);
    expect(events(s.events, 'slotsRevealed')).toEqual([
      { type: 'slotsRevealed', ids: ['g2-juno'] },
    ]);
    const r = play(s.state, [fill('g2-juno', 70, { given: 'Juno' })]);
    expect(r.state.tree['g2-juno']?.given).toBe('Juno');
  });

  it('AINES_RESEARCH suffit à rendre disponibles les candidats des aînés', () => {
    const s = play(start(), AINES_RESEARCH).state;
    expect(Object.keys(s.read)).toHaveLength(6);
  });
});

describe('couple interchangeable posé inversé (swap)', () => {
  /** Variante : Ivo n'est plus pré-rempli et rejoint le groupe des aînés avec Elna. */
  function coupleCase(): CompiledCase {
    const c = clone(C);
    const ivo = c.slots['g0-ivo']!;
    delete ivo.prefilled;
    delete ivo.prefilledGuess;
    c.groups = [
      {
        id: 'grp-aines',
        label: 'Les aînés',
        slots: ['g0-ivo', 'g0-elna', 'g1-tam', 'g1-lisbe'],
        threshold: 4,
      },
    ];
    return deepFreeze(c);
  }

  function withTree(c: CompiledCase, tree: SaveState['tree']): SaveState {
    const s = newGame(c, { slot: 'slot-1', mode: 'standard', at: 1000 });
    return deepFreeze({ ...s, tree });
  }

  const S = SOLUTION as Record<string, SlotGuess>;
  const inverted = {
    'g0-ivo': S['g0-elna']!,
    'g0-elna': S['g0-ivo']!,
    'g1-tam': S['g1-tam']!,
    'g1-lisbe': S['g1-lisbe']!,
  };

  it('seuls les époux sans parents ni enfants propres sont interchangeables', () => {
    const c = coupleCase();
    expect(areInterchangeable('g0-ivo', 'g0-elna', c)).toBe(true);
    expect(areInterchangeable('g0-elna', 'g0-ivo', c)).toBe(true);
    // Lisbé est l'enfant de sang, Oren le conjoint par alliance : pas interchangeables.
    expect(areInterchangeable('g1-lisbe', 'g1-oren', c)).toBe(false);
    expect(areInterchangeable('g1-tam', 'g1-lisbe', c)).toBe(false);
  });

  it('paire inversée juste : comptée, verrouillée, fiches échangées', () => {
    const c = coupleCase();
    const s = withTree(c, inverted);
    expect(isSlotCorrect('g0-ivo', s, c)).toBe(false);
    expect(groupCorrectCount('grp-aines', s, c)).toBe(4);
    const r = validate(s, c);
    expect(r.swap).toEqual([['g0-ivo', 'g0-elna']]);
    expect([...r.lock].sort()).toEqual(['g0-elna', 'g0-ivo', 'g1-lisbe', 'g1-tam']);

    const t = applyAction(s, { type: 'validate', at: 5000 }, c);
    expect(t.events[0]).toMatchObject({ type: 'slotsLocked', groups: ['grp-aines'] });
    expect(t.state.tree['g0-ivo']).toEqual(S['g0-ivo']);
    expect(t.state.tree['g0-elna']).toEqual(S['g0-elna']);
    expect(t.state.locked).toMatchObject({ 'g0-ivo': 5000, 'g0-elna': 5000 });
    expect(isSlotCorrect('g0-ivo', t.state, c)).toBe(true);
  });

  it('pas de swap quand les cases sont justes en direct (aucun champ swap)', () => {
    const c = coupleCase();
    const s = withTree(c, { ...inverted, 'g0-ivo': S['g0-ivo']!, 'g0-elna': S['g0-elna']! });
    const r = validate(s, c);
    expect(r.swap).toBeUndefined();
    expect(r.lock).toHaveLength(4);
  });

  it('paire inversée dont une seule fiche est juste : rien', () => {
    const c = coupleCase();
    const s = withTree(c, {
      ...inverted,
      'g0-elna': { ...S['g0-ivo']!, occupation: 'marin' },
    });
    expect(groupCorrectCount('grp-aines', s, c)).toBe(2);
    expect(validate(s, c)).toEqual({ lock: [], groups: [] });
    const t = applyAction(s, { type: 'validate', at: 5000 }, c);
    expect(t.events).toEqual([{ type: 'validationFailed' }]);
    expect(t.state.tree['g0-ivo']).toEqual(S['g0-elna']);
  });

  it('conjoint par alliance inversé (Oren ↔ Lisbé) : pas validé', () => {
    const c = withGroups([
      { id: 'grp-x', label: 'X', slots: ['g1-tam', 'g1-lisbe', 'g1-oren'], threshold: 3 },
    ]);
    const s = withTree(c, {
      'g1-tam': S['g1-tam']!,
      'g1-lisbe': S['g1-oren']!,
      'g1-oren': S['g1-lisbe']!,
    });
    expect(groupCorrectCount('grp-x', s, c)).toBe(1);
    expect(validate(s, c)).toEqual({ lock: [], groups: [] });
  });

  it('swapGuesses est pur et échange les deux fiches', () => {
    const tree = deepFreeze({ a: S['g0-ivo']!, b: S['g0-elna']!, z: S['g1-tam']! });
    const next = swapGuesses(tree, [['a', 'b']]);
    expect(next).toEqual({ a: S['g0-elna'], b: S['g0-ivo'], z: S['g1-tam'] });
    expect(tree.a).toEqual(S['g0-ivo']);
  });
});
