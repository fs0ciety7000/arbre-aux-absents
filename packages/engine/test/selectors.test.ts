import type { SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  availableNames,
  availableOccupations,
  availablePortraits,
  documentText,
  exhaustedKeywords,
  hintsFor,
  keywordMentions,
  knownKeywords,
  matchName,
  newGame,
  placeCounters,
  progress,
  unreadDocuments,
  visiblePlaces,
  visibleSlots,
  whereToLook,
} from '../src';
import { C, deepFreeze, find, open, play, researched, start, visit, clone } from './helpers';

const values = (list: { value: string }[]) => list.map((x) => x.value);

describe('candidats', () => {
  it('au départ : seulement la case pré-remplie', () => {
    const s = start();
    expect(values(availableNames(s, C).given)).toEqual(['Ivo']);
    expect(values(availableNames(s, C).family)).toEqual(['Marrel']);
    expect(availablePortraits(s, C)).toEqual(['p-ivo']);
    expect(availableOccupations(s, C)).toEqual(['horloger']);
  });

  it('noms lus en mots entiers dans les documents lus, ordre de découverte, provenance', () => {
    const s = play(start(), [
      open('lettre-notaire', 2000),
      find('marrel', 2100),
      open('registre-marrel', 2200),
    ]).state;
    const names = availableNames(s, C);
    expect(values(names.given)).toEqual(['Ivo', 'Elna', 'Anselme', 'Tam', 'Tamas', 'Lisbé']);
    expect(values(names.family)).toEqual(['Marrel', 'Sorvo', 'Brévo']);
    expect(names.given.find((n) => n.value === 'Ivo')?.documents).toEqual([
      'lettre-notaire',
      'registre-marrel',
    ]);
    // « Ivo » ne doit pas être trouvé dans « Ivoire » (mots entiers).
    expect(values(names.given)).not.toContain('Oren');
  });

  it('pas de faux positif par sous-chaîne ; doublons normalisés fusionnés', () => {
    const c = deepFreeze({
      ...clone(C),
      candidates: { given: ['Ivo', 'Iv', 'IVO', ''], family: [] },
    });
    const s = play(start(), [open('lettre-notaire', 2000)], {}, c).state;
    expect(values(availableNames(s, c).given)).toEqual(['Ivo']);
  });

  it('matchName : comparaison normalisée, null si absent ou vide', () => {
    const names = availableNames(researched(), C).given;
    expect(matchName('LISBE', names)).toBe('Lisbé');
    expect(matchName('', names)).toBeNull();
    expect(matchName('Juno', names)).toBeNull();
  });

  it('portraits et métiers des documents lus ; métier débloqué par condition', () => {
    const s = researched();
    expect(availablePortraits(s, C)).toEqual([
      'p-ivo',
      'p-elna',
      'p-tam',
      'p-lisbe',
      'p-figurant',
      'p-oren',
    ]);
    expect(availableOccupations(s, C)).toEqual([
      'horloger',
      'marin',
      'tisserande',
      'meunier',
      'institutrice',
    ]);
    const c = deepFreeze({
      ...clone(C),
      progression: {
        ...clone(C.progression),
        occupationsUnlock: {
          meunier: { visited: 'port-lanne' },
          inconnu: { visited: 'port-lanne' },
        },
      },
    });
    const v = play(start(), [visit('port-lanne', 2000)], {}, c).state;
    expect(availableOccupations(v, c)).toEqual(['horloger', 'meunier']);
  });
});

describe('carnet et aides', () => {
  it('mots-clés connus : lus puis recherchés ; terme caché seulement après recherche', () => {
    const s = play(start(), [open('lettre-notaire', 2000), find('juno marrel', 2100)]).state;
    expect(knownKeywords(s, C)).toEqual(['kw-marrel', 'kw-port-lanne', 'kw-sorvo', 'kw-juno']);
    expect(keywordMentions(s, C)).toEqual({ 'kw-marrel': 1, 'kw-port-lanne': 1, 'kw-sorvo': 1 });
  });

  it('documents non lus, du plus ancien au plus récent', () => {
    const s = play(start(), [find('marrel', 2000), visit('port-lanne', 3000)]).state;
    expect(unreadDocuments(s, C)).toEqual([
      'lettre-notaire',
      'photo-noces',
      'registre-marrel',
      'annuaire-lanne',
    ]);
  });

  it('termes épuisés : toutes les fiches accessibles ouvertes', () => {
    const s = play(start(), [open('lettre-notaire', 2000)]).state;
    expect(exhaustedKeywords(s, C)).toEqual([]);
    const s2 = play(s, [find('marrel', 2100), visit('port-lanne', 2200)]).state;
    expect(exhaustedKeywords(s2, C)).toEqual(['kw-marrel', 'kw-port-lanne']);
  });

  it('Où chercher ? : non lu, puis terme productif le plus cité, puis lieu', () => {
    let s = start();
    expect(whereToLook(s, C)).toEqual({ kind: 'document', id: 'lettre-notaire' });
    s = play(s, [open('lettre-notaire', 2000), open('photo-noces', 2001)]).state;
    // kw-port-lanne est cité deux fois : il passe devant kw-marrel et kw-sorvo.
    expect(whereToLook(s, C)).toEqual({ kind: 'keyword', id: 'kw-port-lanne' });
    s = play(s, [find('port lanne', 2002), open('annuaire-lanne', 2003)]).state;
    expect(whereToLook(s, C)).toEqual({ kind: 'keyword', id: 'kw-marrel' });
    s = play(s, [
      find('marrel', 2004),
      open('registre-marrel', 2005),
      find('sorvo', 2006),
      open('photo-fratrie', 2007),
      find('ecole', 2008),
      open('lettre-lisbe', 2009),
      find('dacque', 2010),
      open('registre-dacque', 2011),
    ]).state;
    // kw-vessaut (cité, non recherché) ouvrirait la coupure de presse.
    expect(whereToLook(s, C)).toEqual({ kind: 'keyword', id: 'kw-vessaut' });
    s = play(s, [find('vessaut', 2012), open('journal-crue', 2013)]).state;
    expect(whereToLook(s, C)).toEqual({ kind: 'place', id: 'port-lanne' });
    s = play(s, [visit('port-lanne', 2014)]).state;
    expect(whereToLook(s, C)).toEqual({ kind: 'place', id: 'vessaut' });
    s = play(s, [visit('vessaut', 2015), open('moulin-vessaut', 2016)]).state;
    expect(whereToLook(s, C)).toBeNull();
  });

  it('Où chercher ? : lieu déjà ouvert à rouvrir', () => {
    const c = deepFreeze({
      ...clone(C),
      places: {
        ...clone(C.places),
        'port-lanne': {
          ...clone(C.places['port-lanne']!),
          documents: [
            { id: 'annuaire-lanne' },
            { id: 'photo-quai', requires: { read: 'annuaire-lanne' } },
          ],
        },
      },
      keywords: {},
      progression: { ...clone(C.progression), start: ['photo-noces'] },
      meta: { ...C.meta, intro: 'photo-noces' },
    });
    const s = play(
      newGameFor(c),
      [open('photo-noces', 1), visit('port-lanne', 2), open('annuaire-lanne', 3)],
      {},
      c,
    ).state;
    // Vessaut est révélé et jamais ouvert : il passe en premier.
    expect(whereToLook(s, c)).toEqual({ kind: 'place', id: 'vessaut' });
    const s2 = play(s, [visit('vessaut', 4), open('moulin-vessaut', 5)], {}, c).state;
    expect(whereToLook(s2, c)).toEqual({ kind: 'place', id: 'port-lanne' });
    expect(placeCounters(s2, c)).toEqual([
      { id: 'port-lanne', found: 1, remaining: 1 },
      { id: 'vessaut', found: 1, remaining: 0 },
    ]);
  });

  it('lieux : mentionné, ouvert, épuisé ; compteurs', () => {
    let s = start();
    expect(visiblePlaces(s, C)).toEqual([{ id: 'port-lanne', state: 'mentioned' }]);
    s = play(s, [visit('port-lanne', 2000)]).state;
    expect(visiblePlaces(s, C)).toEqual([{ id: 'port-lanne', state: 'exhausted' }]);
    s = play(s, [open('annuaire-lanne', 2001), visit('vessaut', 2002)]).state;
    expect(visiblePlaces(s, C)).toEqual([
      { id: 'port-lanne', state: 'exhausted' },
      { id: 'vessaut', state: 'open' },
    ]);
    expect(placeCounters(s, C)).toEqual([
      { id: 'port-lanne', found: 1, remaining: 0 },
      { id: 'vessaut', found: 1, remaining: 0 },
    ]);
  });

  it('cases visibles et progression', () => {
    const s = start();
    expect(visibleSlots(s, C)).not.toContain('g2-juno');
    expect(visibleSlots(s, C)).toHaveLength(7);
    expect(progress(s, C)).toEqual({ locked: 1, total: 8, ratio: 1 / 8, secrets: 0 });
    const ghost: SaveState = deepFreeze({ ...s, locked: { ...s.locked, fantome: 1 } });
    expect(progress(ghost, C).locked).toBe(1);
    expect(progress(s, { ...C, slots: {} }).ratio).toBe(0);
  });

  it('indices : statut par palier, texte seulement une fois utilisé', () => {
    const s = play(start(), [
      open('lettre-notaire', 2000),
      { type: 'useHint', id: 'h-tam-1', at: 2001 },
    ]).state;
    expect(hintsFor({ slot: 'g1-tam' }, s, C)).toEqual([
      {
        id: 'h-tam-1',
        level: 1,
        used: true,
        available: false,
        text: 'Cette personne apparaît dans un registre.',
      },
      { id: 'h-tam-2', level: 2, used: false, available: false },
      { id: 'h-tam-3', level: 3, used: false, available: false },
    ]);
    expect(hintsFor({ group: 'grp-cadets' }, s, C)).toEqual([
      { id: 'h-cadets-1', level: 1, used: false, available: false },
    ]);
    const v = play(s, [visit('port-lanne', 2002)]).state;
    expect(hintsFor({ group: 'grp-cadets' }, v, C)[0]?.available).toBe(true);
    expect(hintsFor({ slot: 'g1-oren' }, v, C)).toEqual([]);
    // Groupe entièrement verrouillé ou inconnu : indices fermés.
    const done: SaveState = deepFreeze({
      ...v,
      locked: { ...v.locked, 'g1-oren': 1, 'g2-cael': 1, 'g2-mira': 1, 'g2-juno': 1 },
    });
    expect(hintsFor({ group: 'grp-cadets' }, done, C)[0]?.available).toBe(false);
    const noGroup = { ...C, groups: [] };
    expect(hintsFor({ group: 'grp-cadets' }, v, noGroup)[0]?.available).toBe(false);
  });
});

describe('documentText', () => {
  it('extrait titre, auteur, tableaux, listes, citations, légendes, tampons', () => {
    const t = documentText(C.documents['registre-marrel']!);
    expect(t).toContain('Tamas (dit Tam)');
    expect(t).toContain('Copie conforme');
    expect(documentText(C.documents['lettre-lisbe']!)).toContain('Tendrement');
    expect(documentText(C.documents['photo-quai']!)).toContain('Caël Dacque, marin.');
    expect(documentText(C.documents['annuaire-lanne']!)).toContain('Habitants');
  });
});

function newGameFor(c: typeof C) {
  return deepFreeze(newGame(c, { slot: 'slot-2', mode: 'standard', at: 0 }));
}
