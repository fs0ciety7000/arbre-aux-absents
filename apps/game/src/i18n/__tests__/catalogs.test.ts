import { describe, expect, it } from 'vitest';
import { en as enCore } from '../en';
import { enDesk } from '../en-desk';
import { fr as frCore } from '../fr';
import { frDesk } from '../fr-desk';
import { resolveUiLanguage, urlLanguageHint } from '../resolve';

type Tree = Record<string, unknown>;

/** Catalogues complets : base + sections différées. */
const fr = { ...frCore, ...frDesk };
const en = { ...enCore, ...enDesk };

/** Toutes les feuilles `a.b.c → valeur` d'un catalogue. */
function leaves(tree: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (tree === null || typeof tree !== 'object' || Array.isArray(tree)) {
    out.set(prefix, tree);
    return out;
  }
  for (const [k, v] of Object.entries(tree as Tree)) {
    for (const [p, leaf] of leaves(v, prefix ? `${prefix}.${k}` : k)) out.set(p, leaf);
  }
  return out;
}

describe('catalogues de l’interface', () => {
  const a = leaves(fr);
  const b = leaves(en);

  it('mêmes clés en français et en anglais', () => {
    expect([...b.keys()].sort()).toEqual([...a.keys()].sort());
  });

  it('même forme pour chaque texte (chaîne, fonction de même arité, tableau de même longueur)', () => {
    const mismatches: string[] = [];
    for (const [key, v] of a) {
      const w = b.get(key);
      if (typeof v !== typeof w) mismatches.push(`${key}: ${typeof v} / ${typeof w}`);
      else if (typeof v === 'function' && v.length !== (w as () => unknown).length)
        mismatches.push(`${key}: arité ${v.length} / ${(w as () => unknown).length}`);
      else if (Array.isArray(v) && (!Array.isArray(w) || v.length !== w.length))
        mismatches.push(`${key}: tableau`);
    }
    expect(mismatches).toEqual([]);
  });

  it('aucun texte anglais vide', () => {
    const empty = [...b].filter(([, v]) => v === '').map(([k]) => k);
    const frEmpty = new Set([...a].filter(([, v]) => v === '').map(([k]) => k));
    expect(empty.filter((k) => !frEmpty.has(k))).toEqual([]);
  });

  it('sections différées hors du catalogue de base, sans clé commune', () => {
    for (const [core, part] of [
      [frCore, frDesk],
      [enCore, enDesk],
    ] as const) {
      expect(Object.keys(part).filter((k) => k in core)).toEqual([]);
    }
  });

  it('langue et étiquette Intl', () => {
    expect([fr.lang, fr.intl, en.lang, en.intl]).toEqual(['fr', 'fr-FR', 'en', 'en-GB']);
  });
});

describe('résolution de la langue de l’interface', () => {
  it('réglage explicite d’abord', () => {
    expect(resolveUiLanguage('en', ['fr-BE'], 'fr')).toBe('en');
    expect(resolveUiLanguage('fr', ['en-US'], 'en')).toBe('fr');
  });

  it('« système » : indice ?lang, puis langues de l’appareil (fr-* → fr, sinon en)', () => {
    expect(resolveUiLanguage('system', ['fr-BE'], 'en')).toBe('en');
    expect(resolveUiLanguage('system', ['fr-BE', 'en'], null)).toBe('fr');
    expect(resolveUiLanguage(undefined, ['de-DE'], null)).toBe('en');
    expect(resolveUiLanguage('system', [], null)).toBe('fr');
  });

  it('indice d’URL', () => {
    expect(urlLanguageHint('?lang=en')).toBe('en');
    expect(urlLanguageHint('?lang=FR')).toBe('fr');
    expect(urlLanguageHint('?lang=de')).toBeNull();
    expect(urlLanguageHint('')).toBeNull();
  });
});
