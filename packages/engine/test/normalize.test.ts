import { describe, expect, it } from 'vitest';
import { ANSWER_FIELDS, cyrb53, hashAnswer, normalize } from '../src';
import { ANSWER_VARIANTS, ANSWERS_BY_SLOT, SALT, SOLUTION } from './fixtures/case';

describe('normalize', () => {
  it.each([
    ['Élodie', 'elodie'],
    ['  PORT-LANNE  ', 'port lanne'],
    ["L'École   de   Port-Lanne !", 'l ecole de port lanne'],
    ['Caël', 'cael'],
    ['ŒUVRE Cœur', 'oeuvre coeur'],
    ['Æther straße', 'aether strasse'],
    ['Søren Łódź', 'soren lodz'],
    ['«Juno»—Marrel…', 'juno marrel'],
    ['ﬁn', 'fin'],
    ['Ｍarrel', 'marrel'],
    ['n°12, rue 3', 'n 12 rue 3'],
    ['', ''],
    ['   ', ''],
    ['!!!', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it('est idempotente', () => {
    for (const v of ['Lisbé  Marrel', 'ÉCOLE', 'a-b_c.d']) {
      expect(normalize(normalize(v))).toBe(normalize(v));
    }
  });

  it('ne lève jamais sur une entrée non textuelle', () => {
    expect(normalize(undefined as unknown as string)).toBe('');
    expect(normalize(42 as unknown as string)).toBe('');
  });
});

describe('cyrb53 et hashAnswer', () => {
  it('cyrb53 : valeurs de référence', () => {
    expect(cyrb53('')).toBe(3338908027751811);
    expect(cyrb53('a')).toBe(7929297801672961);
    expect(cyrb53('a', 1)).not.toBe(cyrb53('a'));
  });

  it('hashAnswer : 14 caractères hexadécimaux, sensibles au sel, à la case et au champ', () => {
    const h = hashAnswer('s', 'slot', 'given', 'Ivo');
    expect(h).toMatch(/^[0-9a-f]{14}$/);
    expect(hashAnswer('t', 'slot', 'given', 'Ivo')).not.toBe(h);
    expect(hashAnswer('s', 'slot2', 'given', 'Ivo')).not.toBe(h);
    expect(hashAnswer('s', 'slot', 'family', 'Ivo')).not.toBe(h);
  });

  it('hashAnswer normalise la valeur (accents, casse, ponctuation)', () => {
    expect(hashAnswer('s', 'x', 'given', 'Lisbé')).toBe(hashAnswer('s', 'x', 'given', '  LISBE '));
    expect(hashAnswer('s', 'x', 'portrait', 'p-ivo')).toBe(
      hashAnswer('s', 'x', 'portrait', 'p ivo'),
    );
  });

  it('empreintes figées de la fixture (compatibilité avec content-tools)', () => {
    expect(ANSWER_FIELDS).toEqual(['given', 'family', 'portrait', 'occupation']);
    for (const [slot, answer] of Object.entries(ANSWERS_BY_SLOT)) {
      const variants = ANSWER_VARIANTS[slot]!;
      const sol = SOLUTION[slot]!;
      expect(variants.given.map((v) => hashAnswer(SALT, slot, 'given', v))).toEqual(answer.given);
      expect(variants.family.map((v) => hashAnswer(SALT, slot, 'family', v))).toEqual(
        answer.family,
      );
      expect([hashAnswer(SALT, slot, 'portrait', sol.portrait!)]).toEqual(answer.portrait);
      expect(hashAnswer(SALT, slot, 'occupation', sol.occupation!)).toBe(answer.occupation);
    }
  });
});
