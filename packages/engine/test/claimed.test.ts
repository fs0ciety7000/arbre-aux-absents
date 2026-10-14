import type { Action, SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  availableNames,
  availableOccupations,
  availablePortraits,
  claimedFields,
  isSlotCorrect,
  newGame,
  parseSave,
  slotStatus,
} from '../src';
import { SOLUTION } from './fixtures/case';
import { ALT_PORTRAIT, CLAIM, CLAIMED_SLOT, claimedCase } from './fixtures/claimed';
import { AINES_RESEARCH, clone, deepFreeze, events, fill, play } from './helpers';

const K = deepFreeze(clone(claimedCase));
const TAM = CLAIMED_SLOT;

function begin(at = 1000): SaveState {
  return deepFreeze(newGame(K, { slot: 'slot-1', mode: 'standard', at }));
}

function researched(): SaveState {
  return play(begin(), AINES_RESEARCH, {}, K).state;
}

const clear = (slot: string, at: number): Action => ({ type: 'clearSlot', slot, at });

describe('case revendiquée : newGame', () => {
  it('pose la déclaration sans verrou ; la case pré-remplie reste établie', () => {
    const s = begin();
    expect(s.tree[TAM]).toEqual(CLAIM);
    expect(s.tree[TAM]).not.toBe(K.slots[TAM]!.claimedGuess);
    expect(s.locked[TAM]).toBeUndefined();
    expect(s.locked['g0-ivo']).toBe(1000);
  });

  it("valeurs déclarées disponibles d'emblée", () => {
    const s = begin();
    expect(availablePortraits(s, K)).toContain('p-juno');
    expect(availableOccupations(s, K)).toContain('marin');
    const names = availableNames(s, K);
    expect(names.given.map((n) => n.value)).toContain('Tam');
    expect(names.family.map((n) => n.value)).toContain('Marrel');
  });

  it('aucune évaluation au démarrage alors que la case est complète', () => {
    const s = begin();
    expect(Object.keys(s.locked)).toEqual(['g0-ivo']);
  });
});

describe('case revendiquée : retrait et remplacement', () => {
  it('un champ se remplace, la case se vide, la déclaration se rétablit', () => {
    const s = researched();
    const r1 = play(s, [fill(TAM, 12000, { portrait: 'p-tam', occupation: null })], {}, K);
    expect(events(r1.events, 'rejected')).toEqual([]);
    expect(r1.state.tree[TAM]).toEqual({ ...CLAIM, portrait: 'p-tam', occupation: null });

    const r2 = play(r1.state, [clear(TAM, 12100)], {}, K);
    expect(r2.state.tree[TAM]).toBeUndefined();

    const r3 = play(r2.state, [fill(TAM, 12200, { ...CLAIM })], {}, K);
    expect(events(r3.events, 'rejected')).toEqual([]);
    expect(r3.state.tree[TAM]).toEqual(CLAIM);
  });

  it('les valeurs déclarées restent disponibles après retrait et se posent ailleurs', () => {
    const s = play(begin(), [clear(TAM, 2000)], {}, K).state;
    expect(availablePortraits(s, K)).toContain('p-juno');
    expect(availableOccupations(s, K)).toContain('marin');
    const r = play(s, [fill('g1-lisbe', 2100, { portrait: 'p-juno', given: 'Tam' })], {}, K);
    expect(events(r.events, 'rejected')).toEqual([]);
    expect(r.state.tree['g1-lisbe']).toMatchObject({ portrait: 'p-juno', given: 'Tam' });
  });
});

describe('case revendiquée : validation', () => {
  it('fausse : ne se verrouille pas et ne bloque pas le seuil du groupe', () => {
    const s = researched();
    const r = play(
      s,
      [fill('g0-elna', 12000), fill('g1-lisbe', 12100), fill('g1-oren', 12200)],
      {},
      K,
    );
    expect(events(r.events, 'slotsLocked').map((e) => e.ids)).toEqual([
      ['g0-elna', 'g1-lisbe', 'g1-oren'],
    ]);
    expect(r.state.locked[TAM]).toBeUndefined();
    expect(r.state.tree[TAM]).toEqual(CLAIM);

    // Seule case restante : seuil min(3, 1) = 1, la correction l'établit.
    const r2 = play(r.state, [fill(TAM, 12300, { portrait: 'p-tam' })], {}, K);
    expect(r2.state.locked[TAM]).toBe(12300);
  });

  it('corrigée (visage d’un autre âge) : se verrouille avec son groupe', () => {
    const s = researched();
    const r = play(
      s,
      [
        fill(TAM, 12000, { portrait: ALT_PORTRAIT }),
        fill('g0-elna', 12100),
        fill('g1-lisbe', 12200),
      ],
      {},
      K,
    );
    const locked = events(r.events, 'slotsLocked');
    expect(locked).toHaveLength(1);
    expect([...locked[0]!.ids].sort()).toEqual(['g0-elna', 'g1-lisbe', TAM].sort());
    expect(r.state.locked[TAM]).toBe(12200);
  });

  it('isSlotCorrect : visage canonique et autre âge justes, autre visage faux', () => {
    const s = researched();
    const withPortrait = (portrait: string) =>
      play(s, [fill(TAM, 12000, { ...SOLUTION[TAM]!, portrait })], { validation: 'manual' }, K)
        .state;
    expect(isSlotCorrect(TAM, withPortrait('p-tam'), K)).toBe(true);
    expect(isSlotCorrect(TAM, withPortrait(ALT_PORTRAIT), K)).toBe(true);
    expect(isSlotCorrect(TAM, withPortrait('p-figurant'), K)).toBe(false);
    expect(isSlotCorrect(TAM, s, K)).toBe(false); // la déclaration est fausse
  });
});

describe('case revendiquée : parseSave', () => {
  it('ne repose jamais une déclaration effacée', () => {
    const s = play(begin(), [clear(TAM, 2000)], {}, K).state;
    expect(s.tree[TAM]).toBeUndefined();
    const r = parseSave(JSON.stringify(s), K);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.tree[TAM]).toBeUndefined();
      expect(r.dropped).toEqual([]);
    }
  });

  it('ne repose pas non plus une déclaration partiellement retirée', () => {
    const s = play(begin(), [fill(TAM, 2000, { portrait: null })], {}, K).state;
    const r = parseSave(JSON.stringify(s), K);
    expect(r.ok && r.state.tree[TAM]).toEqual({ ...CLAIM, portrait: null });
  });
});

describe('slotStatus et claimedFields', () => {
  it('les quatre états', () => {
    const s = begin();
    expect(slotStatus('g0-ivo', s, K)).toBe('locked');
    expect(slotStatus(TAM, s, K)).toBe('claimed');
    expect(slotStatus('g0-elna', s, K)).toBe('empty');
    const partial = play(s, [fill(TAM, 2000, { portrait: null })], {}, K).state;
    expect(slotStatus(TAM, partial, K)).toBe('filled');
    const cleared = play(s, [clear(TAM, 2000)], {}, K).state;
    expect(slotStatus(TAM, cleared, K)).toBe('empty');
    const restored = play(cleared, [fill(TAM, 3000, { ...CLAIM })], {}, K).state;
    expect(slotStatus(TAM, restored, K)).toBe('claimed');
    expect(slotStatus('inconnue', s, K)).toBe('empty');
  });

  it('établie après correction : locked', () => {
    const s = researched();
    const r = play(
      s,
      [fill(TAM, 12000, { portrait: 'p-tam' }), fill('g0-elna', 12100), fill('g1-lisbe', 12200)],
      {},
      K,
    );
    expect(slotStatus(TAM, r.state, K)).toBe('locked');
    expect(claimedFields(TAM, r.state, K)).toEqual([]);
  });

  it('claimedFields : champs encore égaux à la déclaration', () => {
    const s = begin();
    expect(claimedFields(TAM, s, K)).toEqual(['given', 'family', 'portrait', 'occupation']);
    const partial = play(s, [fill(TAM, 2000, { portrait: null })], {}, K).state;
    expect(claimedFields(TAM, partial, K)).toEqual(['given', 'family', 'occupation']);
    expect(claimedFields('g0-elna', s, K)).toEqual([]);
  });
});
