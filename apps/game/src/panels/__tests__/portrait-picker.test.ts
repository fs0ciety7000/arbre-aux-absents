import { describe, expect, it } from 'vitest';
import {
  columnsFromTops,
  filterPortraits,
  gridMove,
  matchesPortrait,
  type PortraitEntry,
} from '../lib/portrait-picker';

const entries: PortraitEntry[] = [
  {
    id: 'a',
    n: 1,
    alt: 'Femme très âgée aux cheveux blancs tressés en couronne',
    docs: ['d1', 'd2'],
    docTitles: ['« Adélaïde à 90 ans » — portrait de presse', 'Photographie de famille'],
  },
  {
    id: 'b',
    n: 2,
    alt: 'Homme d’une quarantaine d’années, favoris en côtelettes',
    docs: ['d2'],
    docTitles: ['Photographie de famille'],
  },
  {
    id: 'c',
    n: 3,
    alt: 'Jeune homme à la barbe noire, casquette d’officier de marine',
    docs: [],
    docTitles: [],
  },
];

describe('matchesPortrait', () => {
  it('requête vide : tout passe', () => {
    expect(entries.every((e) => matchesPortrait(e, '  '))).toBe(true);
  });
  it('sans accents ni casse, tous les mots exigés, dans le désordre', () => {
    expect(matchesPortrait(entries[0]!, 'COURONNE tresses')).toBe(true);
    expect(matchesPortrait(entries[0]!, 'agee')).toBe(true);
    expect(matchesPortrait(entries[0]!, 'couronne barbe')).toBe(false);
  });
  it('cherche aussi dans les titres des documents « vu dans »', () => {
    expect(matchesPortrait(entries[0]!, 'adelaide presse')).toBe(true);
    expect(matchesPortrait(entries[2]!, 'presse')).toBe(false);
  });
  it('apostrophes typographiques et ponctuation ignorées', () => {
    expect(matchesPortrait(entries[1]!, "d'annees")).toBe(true);
  });
  it('le numéro du visage', () => {
    expect(matchesPortrait(entries[2]!, '3')).toBe(true);
  });
});

describe('filterPortraits', () => {
  it('garde l’ordre et combine requête et document ouvert', () => {
    expect(filterPortraits(entries, { query: '', onlyDoc: null }).map((e) => e.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(filterPortraits(entries, { query: '', onlyDoc: 'd2' }).map((e) => e.id)).toEqual([
      'a',
      'b',
    ]);
    expect(filterPortraits(entries, { query: 'homme', onlyDoc: 'd2' }).map((e) => e.id)).toEqual([
      'b',
    ]);
    expect(filterPortraits(entries, { query: 'zeppelin', onlyDoc: null })).toEqual([]);
  });
});

describe('columnsFromTops', () => {
  it('compte la première rangée (tolérance 1 px)', () => {
    expect(columnsFromTops([])).toBe(1);
    expect(columnsFromTops([10])).toBe(1);
    expect(columnsFromTops([10, 10.5, 10, 200, 200])).toBe(3);
    expect(columnsFromTops([10, 200, 390])).toBe(1);
  });
});

describe('gridMove', () => {
  // 10 tuiles sur 4 colonnes : rangées 0-3, 4-7, 8-9.
  const m = (i: number, k: string) => gridMove(i, k, 4, 10);
  it('flèches horizontales, bornées', () => {
    expect(m(0, 'ArrowRight')).toBe(1);
    expect(m(3, 'ArrowRight')).toBe(4);
    expect(m(0, 'ArrowLeft')).toBe(0);
    expect(m(9, 'ArrowRight')).toBe(9);
  });
  it('flèches verticales : rangée suivante, dernière rangée incomplète', () => {
    expect(m(1, 'ArrowDown')).toBe(5);
    expect(m(6, 'ArrowDown')).toBe(9);
    expect(m(9, 'ArrowDown')).toBe(9);
    expect(m(5, 'ArrowUp')).toBe(1);
    expect(m(2, 'ArrowUp')).toBe(2);
  });
  it('Début, Fin, pages', () => {
    expect(m(5, 'Home')).toBe(0);
    expect(m(5, 'End')).toBe(9);
    expect(m(0, 'PageDown')).toBe(9);
    expect(m(9, 'PageUp')).toBe(0);
  });
  it('autres touches et grille vide : null', () => {
    expect(m(0, 'a')).toBeNull();
    expect(gridMove(0, 'ArrowRight', 4, 0)).toBeNull();
  });
});
