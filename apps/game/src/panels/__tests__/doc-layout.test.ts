import type { Block } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  containerAt,
  inlineText,
  layoutInlines,
  passageText,
  rangesByPath,
  segmentText,
  splitFaces,
} from '../lib/doc-layout';

const blocks: Block[] = [
  {
    t: 'p',
    c: [
      { t: 'text', v: 'Bonjour ' },
      { t: 'redacted', length: 3 },
      { t: 'text', v: ' fin' },
    ],
  },
  { t: 'quote', c: [{ t: 'p', c: [{ t: 'text', v: 'cité' }] }] },
  { t: 'list', ordered: false, items: [[{ t: 'text', v: 'a' }], [{ t: 'text', v: 'b' }]] },
  {
    t: 'table',
    head: [[{ t: 'text', v: 'Nom' }]],
    rows: [[[{ t: 'text', v: 'Marrel' }]]],
  },
  { t: 'figure', asset: 'illustrations/x.svg', alt: 'x', caption: [{ t: 'text', v: 'légende' }] },
  { t: 'hr' },
];

describe('doc-layout', () => {
  it('compte les passages caviardés dans les décalages', () => {
    expect(inlineText((blocks[0] as unknown as { c: never[] }).c)).toBe('Bonjour ███ fin');
  });

  it('adresse chaque conteneur de texte', () => {
    expect(inlineText(containerAt(blocks, [1, 0])!)).toBe('cité');
    expect(inlineText(containerAt(blocks, [2, 1])!)).toBe('b');
    expect(inlineText(containerAt(blocks, [3, 0, 0])!)).toBe('Nom');
    expect(inlineText(containerAt(blocks, [3, 1, 0])!)).toBe('Marrel');
    expect(inlineText(containerAt(blocks, [4])!)).toBe('légende');
    expect(containerAt(blocks, [5])).toBeNull();
    expect(containerAt(blocks, [9])).toBeNull();
    expect(containerAt(blocks, [])).toBeNull();
  });

  it('découpe un texte par surlignages, le dernier l’emporte', () => {
    const s = segmentText('abcdefgh', 10, [
      { start: 11, end: 14, color: 1, index: 0 },
      { start: 13, end: 16, color: 3, index: 1 },
    ]);
    expect(s.map((x) => [x.v, x.color])).toEqual([
      ['a', null],
      ['bc', 1],
      ['def', 3],
      ['gh', null],
    ]);
    expect(s[2]!.start).toBe(13);
  });

  it('suit les décalages à travers les inlines imbriqués', () => {
    const nodes = layoutInlines([
      { t: 'text', v: 'ab' },
      { t: 'em', c: [{ t: 'text', v: 'cd' }] },
      { t: 'redacted', length: 2 },
      { t: 'ref', keyword: 'kw', c: [{ t: 'text', v: 'ef' }] },
    ]);
    const em = nodes[1] as { c: { segments: { start: number }[] }[] };
    expect(em.c[0]!.segments[0]!.start).toBe(2);
    expect(nodes[2]).toEqual({ t: 'redacted', length: 2, start: 4 });
    const ref = nodes[3] as { label: string; c: { segments: { start: number }[] }[] };
    expect(ref.label).toBe('ef');
    expect(ref.c[0]!.segments[0]!.start).toBe(6);
  });

  it('extrait un passage et indexe les surlignages par document', () => {
    expect(passageText(blocks, [0], 0, 7)).toBe('Bonjour');
    const m = rangesByPath(
      [
        { doc: 'a', path: [0], start: 0, end: 3, color: 2 },
        { doc: 'b', path: [0], start: 0, end: 3, color: 2 },
      ],
      'a',
    );
    expect(m.get('0')).toEqual([{ start: 0, end: 3, color: 2, index: 0 }]);
  });

  it('sépare recto (figures) et verso', () => {
    expect(splitFaces(blocks)).toEqual({ front: [4], back: [0, 1, 2, 3, 5] });
  });
});
