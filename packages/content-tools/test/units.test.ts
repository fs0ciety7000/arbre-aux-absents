import { inflateRawSync } from 'node:zlib';
import type { Block } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { autolinkBlocks, collectRefs, normalizeWithMap, prepareTerms } from '../src/autolink';
import { evaluate, negatedAtoms, simplify, type EvalState } from '../src/conditions';
import { normalize, hashAnswer, cyrb53, shortHash } from '../src/shared';
import { checkSvg, optimizeSvg, prefixIds } from '../src/svg';
import { createZip } from '../src/zip';
import { splitSections } from '../src/sections';
import { reportCombinations } from '../src/solver';

describe('normalize / hachage', () => {
  it('NFD, diacritiques, casse, ponctuation, espaces, ligatures', () => {
    expect(normalize('  Élise  d’Ambrières-Saint-Œil !  ')).toBe('elise d ambrieres saint oeil');
    expect(normalize('ÇA—va…  BIEN')).toBe('ca va bien');
    expect(normalize('été')).toBe('ete');
    expect(normalize('...')).toBe('');
  });

  it('cyrb53 : valeurs de référence et hex sur 14 caractères', () => {
    expect(cyrb53('a')).toBe(7929297801672961);
    expect(hashAnswer('sel', 's-1', 'given', 'Élise')).toMatch(/^[0-9a-f]{14}$/);
    expect(hashAnswer('sel', 's-1', 'given', 'Élise')).toBe(
      hashAnswer('sel', 's-1', 'given', ' ELISE '),
    );
    expect(hashAnswer('sel', 's-1', 'given', 'Elise')).not.toBe(
      hashAnswer('sel', 's-2', 'given', 'Elise'),
    );
    expect(shortHash('x')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('normalizeWithMap produit exactement normalize (moteur)', () => {
    for (const x of [
      'Élise d’Œil',
      'ÆSIR ß',
      'A--b  c',
      'Łódź',
      'ﬁn ½',
      ' e\u0301te\u0301 ',
      '…',
    ]) {
      expect(normalizeWithMap(x).norm).toBe(normalize(x));
    }
  });
});

describe('liens automatiques', () => {
  const terms = prepareTerms([
    { keyword: 'ancel', term: 'Ancel Morvan' },
    { keyword: 'morvan', term: 'Morvan' },
    { keyword: 'val', term: 'Val-Dormant' },
  ]);

  it('plus long terme d’abord, accents et casse ignorés, frontières de mots', () => {
    const blocks: Block[] = [
      { t: 'p', c: [{ t: 'text', v: 'ANCEL MORVAN, puis Morvane et Morvan au val dormant.' }] },
    ];
    const { blocks: out, overlaps } = autolinkBlocks(blocks, terms);
    expect(overlaps).toEqual([]);
    expect(out[0]).toEqual({
      t: 'p',
      c: [
        { t: 'ref', keyword: 'ancel', c: [{ t: 'text', v: 'ANCEL MORVAN' }] },
        { t: 'text', v: ', puis Morvane et ' },
        { t: 'ref', keyword: 'morvan', c: [{ t: 'text', v: 'Morvan' }] },
        { t: 'text', v: ' au ' },
        { t: 'ref', keyword: 'val', c: [{ t: 'text', v: 'val dormant' }] },
        { t: 'text', v: '.' },
      ],
    });
    expect(collectRefs(out)).toEqual(['ancel', 'morvan', 'val']);
  });

  it('jamais dans un [[…]] existant, mais dans em/strong', () => {
    const blocks: Block[] = [
      {
        t: 'p',
        c: [
          { t: 'ref', keyword: 'autre', c: [{ t: 'text', v: 'Morvan' }] },
          { t: 'em', c: [{ t: 'text', v: 'Morvan' }] },
        ],
      },
    ];
    const { blocks: out } = autolinkBlocks(blocks, terms);
    expect(collectRefs(out)).toEqual(['autre', 'morvan']);
    expect(blocks[0]).toEqual({
      t: 'p',
      c: [
        { t: 'ref', keyword: 'autre', c: [{ t: 'text', v: 'Morvan' }] },
        { t: 'em', c: [{ t: 'text', v: 'Morvan' }] },
      ],
    });
  });

  it('chevauchement partiel signalé', () => {
    const t = prepareTerms([
      { keyword: 'a', term: 'Ancel Morvan' },
      { keyword: 'b', term: 'Morvan horloger' },
    ]);
    const { overlaps } = autolinkBlocks(
      [{ t: 'p', c: [{ t: 'text', v: 'Ancel Morvan horloger' }] }],
      t,
    );
    expect(overlaps).toHaveLength(1);
  });

  it('correspondance des positions après normalisation', () => {
    const m = normalizeWithMap(' Œil  d’été ');
    expect(m.norm).toBe('oeil d ete');
    expect(m.start).toHaveLength(m.norm.length);
  });
});

describe('conditions', () => {
  const state: EvalState = {
    read: new Set(['a']),
    unlocked: new Set(['a', 'b']),
    searched: new Set(),
    visited: new Set(),
    locked: new Set(['s1', 's2']),
    secrets: new Set(),
    groups: new Map([['g', ['s1', 's2']]]),
  };
  it('évaluation', () => {
    expect(
      evaluate({ all: [{ read: 'a' }, { groupLocked: 'g' }, { lockedCount: { gte: 2 } }] }, state),
    ).toBe(true);
    expect(evaluate({ any: [{ read: 'b' }, { not: { unlocked: 'b' } }] }, state)).toBe(false);
  });
  it('simplification démo', () => {
    const exists = (r: { id: string }) => r.id !== 'x';
    expect(simplify({ all: [{ read: 'a' }, { read: 'x' }] }, exists)).toBe(false);
    expect(simplify({ any: [{ read: 'a' }, { read: 'x' }] }, exists)).toEqual({ read: 'a' });
    expect(simplify({ not: { read: 'x' } }, exists)).toBe(true);
  });
  it('atomes niés', () => {
    expect(negatedAtoms({ all: [{ read: 'a' }, { not: { secret: 's' } }] })).toEqual([
      { kind: 'secret', id: 's' },
    ]);
  });
});

describe('SVG', () => {
  const good = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
  <defs><clipPath id="p-c"><rect width="10" height="10"/></clipPath></defs>
  <g clip-path="url(#p-c)"><rect class="paper ink" fill="url(#art-hatch)" width="10" height="10"/>
  <use href="#p-c"/></g></svg>`;

  it('SVG conforme accepté', () => {
    expect(checkSvg(good, { idPrefix: 'p' })).toEqual([]);
  });

  it.each([
    ['<script>', '<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>', /script/],
    ['on*', '<svg viewBox="0 0 1 1" onload="x()"/>', /événement/],
    ['foreignObject', '<svg viewBox="0 0 1 1"><foreignObject/></svg>', /foreignObject/],
    ['href externe', '<svg viewBox="0 0 1 1"><use href="https://x/y.svg#a"/></svg>', /externe/],
    [
      'xlink externe',
      '<svg viewBox="0 0 1 1"><image xlink:href="data:image/png;base64,AA"/></svg>',
      /externe/,
    ],
    ['couleur en dur', '<svg viewBox="0 0 1 1"><rect fill="#f00"/></svg>', /en dur/],
    ['style=', '<svg viewBox="0 0 1 1"><rect style="fill:red"/></svg>', /style/],
    ['<style>', '<svg viewBox="0 0 1 1"><style>rect{}</style></svg>', /style/],
    ['classe inconnue', '<svg viewBox="0 0 1 1"><rect class="rouge"/></svg>', /ART_CLASSES/],
    ['id non préfixé', '<svg viewBox="0 0 1 1"><rect id="tete"/></svg>', /préfixé/],
    ['url inconnue', '<svg viewBox="0 0 1 1"><rect fill="url(#nope)"/></svg>', /inconnu/],
    ['DOCTYPE', '<!DOCTYPE svg [<!ENTITY x "y">]><svg viewBox="0 0 1 1"/>', /DOCTYPE/],
    ['viewBox absente', '<svg/>', /viewBox/],
    [
      'href XLink sous un autre préfixe',
      '<svg viewBox="0 0 1 1" xmlns:x="http://www.w3.org/1999/xlink"><a x:href="javascript:alert(1)"><rect/></a></svg>',
      /externe/,
    ],
    [
      'élément préfixé (svg:script)',
      '<svg viewBox="0 0 1 1" xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>',
      /interdit/,
    ],
    [
      '<set> qui réécrit un lien',
      '<svg viewBox="0 0 1 1"><a href="#p-a"><set attributeName="href" to="javascript:alert(1)"/></a></svg>',
      /set/,
    ],
  ])('refuse : %s', (_name, src, re) => {
    expect(
      checkSvg(src, { idPrefix: 'p' })
        .map((p) => p.message)
        .join('\n'),
    ).toMatch(re);
  });

  it('viewBox imposée (couches)', () => {
    expect(
      checkSvg('<svg viewBox="0 0 1000 1000"/>', { idPrefix: 'base', viewBox: '0 0 1500 1000' })[0]
        ?.message,
    ).toMatch(/viewBox/);
  });

  it('optimisation : ids préfixés, url(#art-…) intacte, classe art posée', () => {
    const r = optimizeSvg(good, 'cas-');
    expect(r.problems).toEqual([]);
    expect(r.svg).toMatch(/^<svg class="art"/);
    expect(r.svg).toContain('id="cas-p-c"');
    expect(r.svg).toContain('url(#cas-p-c)');
    expect(r.svg).toContain('url(#art-hatch)');
  });

  it('prefixIds ne touche pas les ids non définis', () => {
    expect(prefixIds('<svg><g id="a"/><use href="#a"/><rect fill="url(#b)"/></svg>', 'x-')).toBe(
      '<svg><g id="x-a"/><use href="#x-a"/><rect fill="url(#b)"/></svg>',
    );
  });
});

describe('zip', () => {
  it('archive lisible : signature, nom, contenu', () => {
    const data = Buffer.from('<!doctype html>'.repeat(50));
    const zip = createZip([
      { name: 'index.html', data },
      { name: 'assets/a.js', data: Buffer.from('x') },
    ]);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
    expect(zip.readUInt16LE(zip.length - 22 + 10)).toBe(2);
    // Première entrée (tri) : assets/a.js stockée ; seconde : index.html compressée.
    const nameLen = zip.readUInt16LE(26);
    const firstSize = zip.readUInt32LE(18);
    const second = 30 + nameLen + firstSize;
    expect(zip.readUInt16LE(second + 8)).toBe(8);
    const size = zip.readUInt32LE(second + 18);
    const nl = zip.readUInt16LE(second + 26);
    expect(zip.subarray(second + 30, second + 30 + nl).toString()).toBe('index.html');
    expect(inflateRawSync(zip.subarray(second + 30 + nl, second + 30 + nl + size))).toEqual(data);
  });

  it('refuse les chemins hors archive', () => {
    expect(() => createZip([{ name: '../x', data: Buffer.from('') }])).toThrow();
  });
});

describe('rapport final et sections', () => {
  it('combinaisons : askedWhen dépend des réponses précédentes, options filtrées', () => {
    const s: EvalState = {
      read: new Set(['a']),
      unlocked: new Set(),
      searched: new Set(),
      visited: new Set(),
      locked: new Set(),
      secrets: new Set(),
      groups: new Map(),
    };
    const combos = reportCombinations(
      [
        {
          id: 'q1',
          prompt: 'Q1',
          kind: 'question',
          options: [
            { id: 'x', label: 'X' },
            { id: 'y', label: 'Y' },
          ],
        },
        {
          id: 'q2',
          prompt: 'Q2',
          kind: 'choice',
          askedWhen: { answered: { question: 'q1', option: 'x' } },
          options: [
            { id: 'u', label: 'U' },
            { id: 'v', label: 'V', availableWhen: { read: 'b' } },
          ],
        },
      ],
      s,
    );
    expect(combos.map((c) => Object.fromEntries(c))).toEqual([{ q1: 'x', q2: 'u' }, { q1: 'y' }]);
  });

  it('découpage des sections', () => {
    const { sections, errors } = splitSections([
      { t: 'p', c: [{ t: 'text', v: 'intro' }] },
      { t: 'h', level: 2, c: [{ t: 'text', v: '[a] Titre A' }] },
      { t: 'h', level: 3, c: [{ t: 'text', v: '[b] pas une section' }] },
      { t: 'h', level: 2, c: [{ t: 'text', v: '[a]' }] },
    ]);
    expect(sections.map((x) => [x.label, x.title, x.body.length])).toEqual([
      [null, null, 1],
      ['a', 'Titre A', 1],
      ['a', null, 0],
    ]);
    expect(errors).toEqual(['section [a] en double']);
  });
});
