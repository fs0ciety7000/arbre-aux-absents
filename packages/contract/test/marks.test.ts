import { describe, expect, it } from 'vitest';
import {
  BlockSchema,
  DOCUMENT_KINDS,
  DocumentFrontmatterSchema,
  FamilySchema,
  InlineSchema,
  PORTRAIT_KINDS,
  ProfileSchema,
  SettingsSchema,
  TreeSpecSchema,
  defaultProfile,
  defaultSettings,
} from '../src';
import * as fx from './fixtures';

// Affaire 3 (docs/game/AFFAIRE-3.md §8, lot A) : champ Marque, inline `mark`, pièces `recording`.

describe('marques au contrat', () => {
  it('Portrait.kind facultatif : absent (affaires 1 et 2), face ou mark ; rien d’autre', () => {
    const f = fx.clone(fx.family);
    expect(FamilySchema.parse(f).portraits[0]?.kind).toBeUndefined();
    const mark = { ...f.portraits[0]!, kind: 'mark' as const };
    expect(FamilySchema.parse({ ...f, portraits: [mark] }).portraits[0]?.kind).toBe('mark');
    expect(FamilySchema.safeParse({ ...f, portraits: [{ ...mark, kind: 'face' }] }).success).toBe(
      true,
    );
    expect(FamilySchema.safeParse({ ...f, portraits: [{ ...mark, kind: 'sign' }] }).success).toBe(
      false,
    );
    expect(PORTRAIT_KINDS).toEqual(['face', 'mark']);
  });

  it('TreeSlot.portraitKind facultatif ; valeur inconnue refusée', () => {
    const t = fx.clone(fx.tree);
    expect(TreeSpecSchema.parse(t).slots[0]?.portraitKind).toBeUndefined();
    const slot = { ...t.slots[0]!, portraitKind: 'mark' as const };
    expect(TreeSpecSchema.parse({ ...t, slots: [slot] }).slots[0]?.portraitKind).toBe('mark');
    expect(
      TreeSpecSchema.safeParse({ ...t, slots: [{ ...slot, portraitKind: 'Marque' }] }).success,
    ).toBe(false);
  });

  it('inline mark : un id de portrait kebab-case, rien de plus', () => {
    expect(InlineSchema.parse({ t: 'mark', portrait: 'portrait-a1b2c3' })).toEqual({
      t: 'mark',
      portrait: 'portrait-a1b2c3',
    });
    expect(InlineSchema.safeParse({ t: 'mark', portrait: 'Pas Un Id' }).success).toBe(false);
    expect(InlineSchema.safeParse({ t: 'mark' }).success).toBe(false);
    expect(InlineSchema.safeParse({ t: 'mark', portrait: 'a', c: [] }).success).toBe(false);
    const sig = {
      t: 'signature',
      c: [
        { t: 'text', v: 'Blaise ' },
        { t: 'mark', portrait: 'portrait-a1b2c3' },
      ],
    };
    expect(BlockSchema.parse(sig)).toEqual(sig);
  });
});

describe('pièces recording', () => {
  it('type admis dans le frontmatter', () => {
    expect(DOCUMENT_KINDS).toContain('recording');
    const fm = { ...fx.frontmatter, kind: 'recording' as const };
    const { reveals: _r, ...noReveals } = fm;
    expect(DocumentFrontmatterSchema.parse(noReveals).kind).toBe('recording');
  });
});

describe('réglage describeMarks', () => {
  it('facultatif : un profil antérieur sans le champ reste valide (migration douce)', () => {
    const s = defaultSettings();
    expect('describeMarks' in s).toBe(false);
    expect(SettingsSchema.parse(s).describeMarks).toBeUndefined();
    expect(ProfileSchema.safeParse(defaultProfile()).success).toBe(true);
    expect(SettingsSchema.parse({ ...s, describeMarks: true }).describeMarks).toBe(true);
    expect(SettingsSchema.safeParse({ ...s, describeMarks: 'oui' }).success).toBe(false);
  });
});
