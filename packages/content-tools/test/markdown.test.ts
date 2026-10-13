import { BlockSchema, type Block } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { parseMarkdown, splitFrontmatter, splitTableRow } from '../src/markdown';

function ok(src: string): Block[] {
  const r = parseMarkdown(src);
  expect(r.errors).toEqual([]);
  for (const b of r.blocks) expect(BlockSchema.safeParse(b).success).toBe(true);
  return r.blocks;
}

function errs(src: string, first = 1) {
  return parseMarkdown(src, first).errors;
}

describe('parseMarkdown — blocs', () => {
  it('paragraphes multilignes joints par une espace', () => {
    expect(ok('Une ligne\net la suite.\n\nAutre paragraphe.')).toEqual([
      { t: 'p', c: [{ t: 'text', v: 'Une ligne et la suite.' }] },
      { t: 'p', c: [{ t: 'text', v: 'Autre paragraphe.' }] },
    ]);
  });

  it('titres ## et ### seulement', () => {
    expect(ok('## Titre\n### Sous-titre')).toEqual([
      { t: 'h', level: 2, c: [{ t: 'text', v: 'Titre' }] },
      { t: 'h', level: 3, c: [{ t: 'text', v: 'Sous-titre' }] },
    ]);
    expect(errs('# Trop grand')[0]?.message).toMatch(/niveau 1/);
    expect(errs('#### Trop petit')[0]?.message).toMatch(/niveau 4/);
  });

  it('séparateur --- seulement', () => {
    expect(ok('a\n\n---\n\nb')[1]).toEqual({ t: 'hr' });
    expect(errs('***')[0]?.message).toMatch(/---/);
  });

  it('citation avec blocs imbriqués', () => {
    expect(ok('> ## Titre\n> texte\n>\n> - item')).toEqual([
      {
        t: 'quote',
        c: [
          { t: 'h', level: 2, c: [{ t: 'text', v: 'Titre' }] },
          { t: 'p', c: [{ t: 'text', v: 'texte' }] },
          { t: 'list', ordered: false, items: [[{ t: 'text', v: 'item' }]] },
        ],
      },
    ]);
  });

  it('listes ordonnées et non ordonnées, continuation indentée', () => {
    expect(ok('1. un\n2. deux\n   suite')).toEqual([
      {
        t: 'list',
        ordered: true,
        items: [[{ t: 'text', v: 'un' }], [{ t: 'text', v: 'deux suite' }]],
      },
    ]);
    expect(ok('- a\n* b')[0]).toMatchObject({ t: 'list', ordered: false });
  });

  it('listes imbriquées refusées', () => {
    expect(errs('- a\n  - b')[0]?.message).toMatch(/imbriquées/);
  });

  it('tableau pipe, avec [[…|…]] dans une cellule', () => {
    const [table] = ok('| A | B |\n| --- | --- |\n| [[Ida|ida-brask]] | x \\| y |');
    expect(table).toEqual({
      t: 'table',
      head: [[{ t: 'text', v: 'A' }], [{ t: 'text', v: 'B' }]],
      rows: [
        [
          [{ t: 'ref', keyword: 'ida-brask', c: [{ t: 'text', v: 'Ida' }] }],
          [{ t: 'text', v: 'x | y' }],
        ],
      ],
    });
  });

  it('tableau : séparateur manquant ou largeur incohérente', () => {
    expect(errs('| A |\n| B |')[0]?.message).toMatch(/séparateur/);
    const e = errs('| A | B |\n| --- | --- |\n| 1 |', 10);
    expect(e[0]).toEqual({ line: 12, message: 'tableau : 1 cellule(s) au lieu de 2' });
  });

  it('splitTableRow respecte échappements et liens', () => {
    expect(splitTableRow('| a | [[b|c]] | d\\|e |')).toEqual(['a', '[[b|c]]', 'd\\|e']);
  });

  it('figure avec légende', () => {
    expect(ok('![Un bac](illustrations/bac.svg "Le bac")')).toEqual([
      {
        t: 'figure',
        asset: 'illustrations/bac.svg',
        alt: 'Un bac',
        caption: [{ t: 'text', v: 'Le bac' }],
      },
    ]);
  });

  it('figure : alt vide, URL externe, chemin hors illustrations/', () => {
    expect(errs('![](illustrations/x.svg)')[0]?.message).toMatch(/alt/);
    expect(errs('![a](https://ex.org/x.svg)')[0]?.message).toMatch(/URL externe/);
    expect(errs('![a](//ex.org/x.svg)')[0]?.message).toMatch(/URL externe/);
    expect(errs('![a](portraits/x.svg)')[0]?.message).toMatch(/illustrations/);
  });

  it('::stamp et ::signature seuls sur leur ligne', () => {
    expect(ok('::stamp[Archives]\n::signature[*A.* M.]')).toEqual([
      { t: 'stamp', text: 'Archives' },
      {
        t: 'signature',
        c: [
          { t: 'em', c: [{ t: 'text', v: 'A.' }] },
          { t: 'text', v: ' M.' },
        ],
      },
    ]);
    expect(errs('Texte ::stamp[x] suite')[0]?.message).toMatch(/propre ligne/);
    expect(errs('::stamp[]')[0]?.message).toMatch(/vide/);
    expect(errs('::stamp[*gras*]')[0]?.message).toMatch(/texte simple/);
  });

  it('blocs de code et indentation refusés', () => {
    expect(errs('```\ncode\n```')[0]?.message).toMatch(/code/);
    expect(errs('    indenté')[0]?.message).toMatch(/indenté/);
  });
});

describe('parseMarkdown — en ligne', () => {
  const p = (s: string) => (ok(s)[0] as { c: unknown }).c;

  it('em, strong, imbrication, barré', () => {
    expect(p('a *b* **c *d*** ~~e~~')).toEqual([
      { t: 'text', v: 'a ' },
      { t: 'em', c: [{ t: 'text', v: 'b' }] },
      { t: 'text', v: ' ' },
      {
        t: 'strong',
        c: [
          { t: 'text', v: 'c ' },
          { t: 'em', c: [{ t: 'text', v: 'd' }] },
        ],
      },
      { t: 'text', v: ' ' },
      { t: 'strike', c: [{ t: 'text', v: 'e' }] },
    ]);
  });

  it('marques non refermées signalées', () => {
    expect(errs('a **b')[0]?.message).toMatch(/\*\* non refermé/);
    expect(errs('a *b')[0]?.message).toMatch(/\* non refermé/);
    expect(errs('a ~~b')[0]?.message).toMatch(/~~ non refermé/);
  });

  it('liens [[texte|mot-clé]]', () => {
    expect(p('Voir [[la *maison*|maison-haute]].')).toEqual([
      { t: 'text', v: 'Voir ' },
      {
        t: 'ref',
        keyword: 'maison-haute',
        c: [
          { t: 'text', v: 'la ' },
          { t: 'em', c: [{ t: 'text', v: 'maison' }] },
        ],
      },
      { t: 'text', v: '.' },
    ]);
    expect(errs('[[sans id]]')[0]?.message).toMatch(/\[\[texte\|/);
    expect(errs('[[x|Pas_Kebab]]')[0]?.message).toMatch(/invalide/);
    expect(errs('[[x|a')[0]?.message).toMatch(/non refermé/);
    expect(errs('[[a [[b|c]]|d]]').some((e) => /imbriqué/.test(e.message))).toBe(true);
  });

  it('::hand et ::redacted', () => {
    expect(p('::hand[écrit *vite*] puis ::redacted[6].')).toEqual([
      {
        t: 'hand',
        c: [
          { t: 'text', v: 'écrit ' },
          { t: 'em', c: [{ t: 'text', v: 'vite' }] },
        ],
      },
      { t: 'text', v: ' puis ' },
      { t: 'redacted', length: 6 },
      { t: 'text', v: '.' },
    ]);
    expect(errs('::redacted[0]')[0]?.message).toMatch(/entier/);
    expect(errs('::redacted[999]')[0]?.message).toMatch(/entier/);
    expect(errs('::redacted[x]')[0]?.message).toMatch(/entier/);
    expect(errs('::hand[ouvert')[0]?.message).toMatch(/non refermé/);
    expect(errs('::inconnu[x]')[0]?.message).toMatch(/directive inconnue/);
  });

  it('échappements', () => {
    expect(p('5 \\* 3 \\[x\\] a\\|b \\::hand')).toEqual([{ t: 'text', v: '5 * 3 [x] a|b ::hand' }]);
  });

  it('HTML, entités, liens Markdown, URL, code : refusés', () => {
    expect(errs('a <b>gras</b>')[0]?.message).toMatch(/HTML/);
    expect(errs('<!-- note -->')[0]?.message).toMatch(/HTML/);
    expect(errs('a &amp; b')[0]?.message).toMatch(/entité/);
    expect(errs('[texte](page.html)')[0]?.message).toMatch(/lien Markdown/);
    expect(errs('voir https://exemple.org')[0]?.message).toMatch(/URL/);
    expect(errs('voir www.exemple.org')[0]?.message).toMatch(/URL/);
    expect(errs('a `code`')[0]?.message).toMatch(/code/);
    expect(errs('image ![a](illustrations/a.svg) en ligne')[0]?.message).toMatch(/image/);
  });

  it('caractères ordinaires admis', () => {
    expect(p('3 < 4, Dupont & fils, [sic], 50 %, a|b')).toEqual([
      { t: 'text', v: '3 < 4, Dupont & fils, [sic], 50 %, a|b' },
    ]);
  });

  it('numéros de ligne exacts dans un paragraphe multiligne', () => {
    expect(errs('ligne un\nligne deux <i>\nligne trois', 7)).toEqual([
      { line: 8, message: 'HTML brut interdit' },
    ]);
  });
});

describe('splitFrontmatter', () => {
  it('sépare le YAML et numérote le corps', () => {
    const r = splitFrontmatter('---\nkind: note\ntitle: T\n---\n\nCorps <b>');
    expect(r.frontmatter).toBe('kind: note\ntitle: T');
    expect(r.bodyLine).toBe(5);
    expect(parseMarkdown(r.body, r.bodyLine).errors[0]?.line).toBe(6);
  });

  it('accepte BOM et CRLF ; absence de frontmatter', () => {
    expect(splitFrontmatter('﻿---\r\na: 1\r\n---\r\nx').frontmatter).toBe('a: 1');
    expect(splitFrontmatter('pas de frontmatter').frontmatter).toBeNull();
  });
});
