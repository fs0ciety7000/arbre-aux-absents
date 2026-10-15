import { describe, expect, it } from 'vitest';
import { applyMarkdown, parseInline, parseMarkdown, type MarkdownFormat } from './markdown';

const PH = { text: 'texte', code: 'code', url: 'https://' };

/** Applique un format à `value`, sélection notée par `[` et `]` (ou `|` pour un curseur). */
function run(marked: string, format: MarkdownFormat): string {
  let start: number;
  let end: number;
  let value: string;
  if (marked.includes('|')) {
    start = end = marked.indexOf('|');
    value = marked.replace('|', '');
  } else {
    start = marked.indexOf('[');
    end = marked.indexOf(']') - 1;
    value = marked.replace('[', '').replace(']', '');
  }
  const out = applyMarkdown(value, start, end, format, PH);
  const v = out.value;
  return out.selectionStart === out.selectionEnd
    ? `${v.slice(0, out.selectionStart)}|${v.slice(out.selectionStart)}`
    : `${v.slice(0, out.selectionStart)}[${v.slice(out.selectionStart, out.selectionEnd)}]${v.slice(out.selectionEnd)}`;
}

describe('applyMarkdown : formats en ligne', () => {
  it('gras, italique, code autour de la sélection', () => {
    expect(run('Le [registre] bloque', 'bold')).toBe('Le **[registre]** bloque');
    expect(run('Le [registre] bloque', 'italic')).toBe('Le _[registre]_ bloque');
    expect(run('Le [registre] bloque', 'code')).toBe('Le `[registre]` bloque');
  });

  it('sans sélection : texte de remplacement sélectionné', () => {
    expect(run('Avant |après', 'bold')).toBe('Avant **[texte]**après');
  });

  it('espace final d’un double-clic laissé hors des marques', () => {
    expect(run('Le [registre ]bloque', 'bold')).toBe('Le **[registre]** bloque');
  });

  it('second appui : retire les marques (bascule)', () => {
    expect(run('Le **[registre]** bloque', 'bold')).toBe('Le [registre] bloque');
    expect(run('Le [**registre**] bloque', 'bold')).toBe('Le [registre] bloque');
    expect(run('Le _[mot]_', 'italic')).toBe('Le [mot]');
  });
});

describe('applyMarkdown : lignes', () => {
  it('liste à puces sur plusieurs lignes, puis retirée', () => {
    const once = run('[un\ndeux\ntrois]', 'bulletList');
    expect(once).toBe('[- un\n- deux\n- trois]');
    expect(run(once, 'bulletList')).toBe('[un\ndeux\ntrois]');
  });

  it('liste numérotée : numéros croissants, lignes vides gardées', () => {
    expect(run('[ouvrir\n\nfermer]', 'numberedList')).toBe('[1. ouvrir\n\n2. fermer]');
  });

  it('une liste devient l’autre sans double préfixe', () => {
    expect(run('[- un\n- deux]', 'numberedList')).toBe('[1. un\n2. deux]');
  });

  it('citation sur la ligne du curseur (sélection partielle étendue à la ligne)', () => {
    expect(run('avant\nla ph[ras]e\naprès', 'quote')).toBe('avant\n[> la phrase]\naprès');
  });

  it('ligne vide : préfixe inséré, curseur après', () => {
    expect(run('Étapes :\n|', 'bulletList')).toBe('Étapes :\n- |');
    expect(run('ab|c', 'quote')).toBe('> ab|c');
  });
});

describe('applyMarkdown : bloc de code et lien', () => {
  it('bloc de code sur ses propres lignes', () => {
    expect(run('Erreur : [E42 boom]', 'codeBlock')).toBe('Erreur : \n```\n[E42 boom]\n```');
    expect(run('|', 'codeBlock')).toBe('```\n[code]\n```');
  });

  it('lien : texte sélectionné, adresse à taper', () => {
    expect(run('voir [ce forum]', 'link')).toBe('voir [ce forum]([https://])');
    expect(run('voir |', 'link')).toBe('voir [[texte]](https://)');
  });

  it('lien : adresse sélectionnée, texte à taper', () => {
    expect(run('[https://exemple.org/a]', 'link')).toBe('[[texte]](https://exemple.org/a)');
  });
});

describe('parseMarkdown : aperçu sans HTML', () => {
  it('gras, italique, code, lien http(s)', () => {
    expect(parseInline('a **b** _c_ `d` [e](https://x.org)')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'd' },
      { kind: 'text', text: ' ' },
      { kind: 'link', href: 'https://x.org', children: [{ kind: 'text', text: 'e' }] },
    ]);
  });

  it('HTML et adresses dangereuses restent du texte', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'text', text: '<img src=x onerror=alert(1)>' },
    ]);
    const nodes = parseInline('[clic](javascript:alert(1))');
    expect(nodes.some((n) => n.kind === 'link')).toBe(false);
    expect(nodes.map((n) => (n.kind === 'text' ? n.text : '')).join('')).toContain('javascript:');
  });

  it('pas d’italique au milieu d’un mot (snake_case)', () => {
    expect(parseInline('save_slot_1')).toEqual([{ kind: 'text', text: 'save_slot_1' }]);
  });

  it('échappement et marques orphelines', () => {
    expect(parseInline('\\*pas\\* **ouvert')).toEqual([{ kind: 'text', text: '*pas* **ouvert' }]);
  });

  it('blocs : paragraphe, listes, citation, code', () => {
    const blocks = parseMarkdown(
      'Bonjour\nligne 2\n\n- un\n- deux\n\n3. trois\n4. quatre\n\n> cité **fort**\n\n```\n<b>x</b>\n```',
    );
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'list', 'list', 'quote', 'code']);
    expect(blocks[0]).toEqual({
      kind: 'paragraph',
      children: [
        { kind: 'text', text: 'Bonjour' },
        { kind: 'break' },
        { kind: 'text', text: 'ligne 2' },
      ],
    });
    expect(blocks[2]).toMatchObject({ kind: 'list', ordered: true, start: 3 });
    expect(blocks[4]).toEqual({ kind: 'code', text: '<b>x</b>' });
  });

  it('bloc de code non fermé : jusqu’à la fin, sans planter', () => {
    expect(parseMarkdown('```\nreste')).toEqual([{ kind: 'code', text: 'reste' }]);
  });
});
