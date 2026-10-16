import type { CompiledCase, SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { availablePortraits, portraitKindOf, slotPortraitKind, validate } from '../src';
import { C, clone, deepFreeze, start } from './helpers';

// Affaire 3, lot C (docs/game/AFFAIRE-3.md §1.5) : sélecteur filtré par type de champ.

/** Variante de la fixture : `p-figurant` est une marque, la case de Tam attend une marque. */
function withMarks(): CompiledCase {
  const c = clone(C) as CompiledCase;
  c.portraits['p-figurant'] = { ...c.portraits['p-figurant']!, kind: 'mark' };
  c.portraits['p-lisbe'] = { ...c.portraits['p-lisbe']!, kind: 'face' };
  c.slots['g1-tam'] = { ...c.slots['g1-tam']!, portraitKind: 'mark' };
  return deepFreeze(c);
}

function reading(...docs: string[]): SaveState {
  const s = clone(start());
  docs.forEach((d, i) => (s.read[d] = 3000 + i));
  return s;
}

describe('portraitKindOf / slotPortraitKind', () => {
  it('absent = face ; inconnu = face ; mark lu tel quel', () => {
    const c = withMarks();
    expect(portraitKindOf('p-tam', c)).toBe('face');
    expect(portraitKindOf('p-lisbe', c)).toBe('face');
    expect(portraitKindOf('p-figurant', c)).toBe('mark');
    expect(portraitKindOf('inconnu', c)).toBe('face');
    expect(portraitKindOf('__proto__', c)).toBe('face');
    expect(slotPortraitKind('g1-tam', c)).toBe('mark');
    expect(slotPortraitKind('g0-ivo', c)).toBe('face');
    expect(slotPortraitKind('inconnue', c)).toBe('face');
  });
});

describe('availablePortraits(s, c, kind)', () => {
  it('sans type : tout, ordre de découverte (comportement inchangé)', () => {
    const c = withMarks();
    const s = reading('photo-fratrie');
    expect(availablePortraits(s, c)).toEqual(['p-ivo', 'p-tam', 'p-lisbe', 'p-figurant']);
  });

  it('par type : visages seuls ou marques seules, même ordre', () => {
    const c = withMarks();
    const s = reading('photo-fratrie');
    expect(availablePortraits(s, c, 'face')).toEqual(['p-ivo', 'p-tam', 'p-lisbe']);
    expect(availablePortraits(s, c, 'mark')).toEqual(['p-figurant']);
    expect(availablePortraits(s, c, slotPortraitKind('g1-tam', c))).toEqual(['p-figurant']);
  });

  it('affaire sans marque : filtre face = liste complète, mark = vide', () => {
    const s = reading('photo-fratrie');
    expect(availablePortraits(s, C, 'face')).toEqual(availablePortraits(s, C));
    expect(availablePortraits(s, C, 'mark')).toEqual([]);
  });

  it('validation inchangée : un portrait du mauvais type est simplement faux', () => {
    const c = withMarks();
    const s = clone(start());
    s.tree['g1-tam'] = { given: 'Tam', family: 'Marrel', portrait: 'p-tam', occupation: 'marin' };
    expect(() => validate(s, c)).not.toThrow();
  });
});
