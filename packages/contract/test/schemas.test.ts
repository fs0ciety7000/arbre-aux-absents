import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import {
  AchievementConditionSchema,
  AchievementsFileSchema,
  BlockSchema,
  CaseMetaSchema,
  ConditionSchema,
  DEFAULT_SETTINGS,
  DocumentFrontmatterSchema,
  FamilySchema,
  HintsFileSchema,
  OutcomeConditionSchema,
  PlaceSchema,
  ProfileSchema,
  ProgressionSchema,
  SAVE_LIMITS,
  SaveStateSchema,
  SettingsSchema,
  TreeSpecSchema,
  WorldMapSchema,
  buildJsonSchemas,
  defaultProfile,
  defaultSettings,
  type Achievement,
  type AchievementCondition,
  type Block,
  type CaseMeta,
  type Condition,
  type DocumentFrontmatter,
  type Family,
  type Hint,
  type OutcomeCondition,
  type Place,
  type Profile,
  type Progression,
  type SaveState,
  type Settings,
  type TreeSpec,
  type WorldMap,
} from '../src';
import * as fx from './fixtures';

// Alignement types écrits à la main (§3) ⇄ types inférés des schémas (vérifié par tsc).
expectTypeOf<z.output<typeof CaseMetaSchema>>().toEqualTypeOf<CaseMeta>();
expectTypeOf<z.output<typeof FamilySchema>>().toEqualTypeOf<Family>();
expectTypeOf<z.output<typeof TreeSpecSchema>>().toEqualTypeOf<TreeSpec>();
expectTypeOf<z.output<typeof DocumentFrontmatterSchema>>().toEqualTypeOf<DocumentFrontmatter>();
expectTypeOf<z.output<typeof ProgressionSchema>>().toEqualTypeOf<Progression>();
expectTypeOf<z.output<typeof HintsFileSchema>>().toEqualTypeOf<Hint[]>();
expectTypeOf<z.output<typeof AchievementsFileSchema>>().toEqualTypeOf<Achievement[]>();
expectTypeOf<z.output<typeof WorldMapSchema>>().toEqualTypeOf<WorldMap>();
expectTypeOf<z.output<typeof PlaceSchema>>().toEqualTypeOf<Place>();
expectTypeOf<z.output<typeof SaveStateSchema>>().toEqualTypeOf<SaveState>();
expectTypeOf<z.output<typeof SettingsSchema>>().toEqualTypeOf<Settings>();
expectTypeOf<z.output<typeof ProfileSchema>>().toEqualTypeOf<Profile>();
expectTypeOf<z.output<typeof ConditionSchema>>().toEqualTypeOf<Condition>();
expectTypeOf<z.output<typeof OutcomeConditionSchema>>().toEqualTypeOf<OutcomeCondition>();
expectTypeOf<z.output<typeof AchievementConditionSchema>>().toEqualTypeOf<AchievementCondition>();
expectTypeOf<z.output<typeof BlockSchema>>().toEqualTypeOf<Block>();

function rejects(schema: z.ZodType, value: unknown): void {
  expect(schema.safeParse(value).success).toBe(false);
}

describe('identifiants et conditions', () => {
  it('accepte les conditions monotones imbriquées', () => {
    const c: Condition = {
      all: [{ read: 'a' }, { any: [{ searched: 'b' }, { lockedCount: { gte: 3 } }] }],
    };
    expect(ConditionSchema.parse(c)).toEqual(c);
  });

  it('refuse `not` dans une condition de déblocage, même imbriqué', () => {
    rejects(ConditionSchema, { not: { read: 'a' } });
    rejects(ConditionSchema, { all: [{ read: 'a' }, { not: { read: 'b' } }] });
  });

  it('accepte `not` dans une condition de fin', () => {
    expect(
      OutcomeConditionSchema.safeParse({ all: [{ read: 'a' }, { not: { not: { locked: 's' } } }] })
        .success,
    ).toBe(true);
  });

  it('refuse les clés multiples, inconnues, les ids non kebab-case et les listes vides', () => {
    rejects(ConditionSchema, { read: 'a', unlocked: 'b' });
    rejects(ConditionSchema, { opened: 'a' });
    rejects(ConditionSchema, { read: 'Lettre_Notaire' });
    rejects(ConditionSchema, { read: '-a' });
    rejects(ConditionSchema, { all: [] });
    rejects(ConditionSchema, { lockedCount: { gte: -1 } });
    rejects(ConditionSchema, { lockedCount: { gte: 1.5 } });
  });

  it('conditions de succès : feuilles propres et combinaison', () => {
    expect(AchievementConditionSchema.safeParse({ allSecrets: true }).success).toBe(true);
    rejects(AchievementConditionSchema, { allSecrets: false });
    rejects(AchievementConditionSchema, { timedUnderMs: 0 });
  });
});

describe('case.json', () => {
  it('accepte un exemple valide', () => {
    expect(CaseMetaSchema.parse(fx.caseMeta)).toEqual(fx.caseMeta);
  });
  it('refuse version non semver, clé inconnue, titre vide', () => {
    rejects(CaseMetaSchema, { ...fx.caseMeta, version: '1.0' });
    rejects(CaseMetaSchema, { ...fx.caseMeta, author: 'x' });
    rejects(CaseMetaSchema, { ...fx.caseMeta, title: '   ' });
    rejects(CaseMetaSchema, { ...fx.caseMeta, timedTargetsMs: [] });
  });
});

describe('family.json', () => {
  it('accepte un exemple valide (bibleNotes compris)', () => {
    expect(FamilySchema.parse(fx.family)).toEqual(fx.family);
  });
  it('refuse prénoms vides, dates invalides, plus de deux parents, chemin de portrait', () => {
    const f = fx.clone(fx.family);
    rejects(FamilySchema, { ...f, persons: [{ ...f.persons[0], given: [] }] });
    rejects(FamilySchema, { ...f, persons: [{ ...f.persons[0], born: '1871-13' }] });
    rejects(FamilySchema, { ...f, persons: [{ ...f.persons[0], born: '71' }] });
    rejects(FamilySchema, { ...f, persons: [{ ...f.persons[0], parents: ['a', 'b', 'c'] }] });
    rejects(FamilySchema, { ...f, portraits: [{ ...f.portraits[0], file: 'aldo.svg' }] });
    rejects(FamilySchema, {
      ...f,
      portraits: [{ ...f.portraits[0], file: '../portraits/aldo.svg' }],
    });
  });
});

describe('tree.json', () => {
  it('accepte un exemple valide', () => {
    expect(TreeSpecSchema.parse(fx.tree)).toEqual(fx.tree);
  });
  it('refuse un seuil < 3, une génération négative, une condition non monotone', () => {
    const t = fx.clone(fx.tree);
    rejects(TreeSpecSchema, { ...t, groups: [{ ...t.groups[0], threshold: 2 }] });
    rejects(TreeSpecSchema, { ...t, slots: [{ ...t.slots[0], generation: -1 }] });
    rejects(TreeSpecSchema, {
      ...t,
      slots: [{ ...t.slots[0], revealedBy: { not: { read: 'a' } } }],
    });
  });
});

describe('frontmatter de document', () => {
  it('accepte un exemple valide', () => {
    expect(DocumentFrontmatterSchema.parse(fx.frontmatter)).toEqual(fx.frontmatter);
  });
  it('refuse type inconnu, alt vide, illustration hors dossier, clé inconnue', () => {
    rejects(DocumentFrontmatterSchema, { ...fx.frontmatter, kind: 'email' });
    rejects(DocumentFrontmatterSchema, {
      ...fx.frontmatter,
      illustration: { file: 'illustrations/a.svg', alt: '' },
    });
    rejects(DocumentFrontmatterSchema, {
      ...fx.frontmatter,
      illustration: { file: 'https://x.org/a.svg', alt: 'a' },
    });
    rejects(DocumentFrontmatterSchema, { ...fx.frontmatter, html: '<b>' });
  });
});

describe('AST Markdown', () => {
  it('accepte tous les blocs du document compilé', () => {
    for (const doc of Object.values(fx.compiledCase.documents)) {
      for (const block of doc.body) expect(BlockSchema.safeParse(block).success).toBe(true);
    }
  });
  it('refuse un titre de niveau 1 et un caviardage vide', () => {
    rejects(BlockSchema, { t: 'h', level: 1, c: [] });
    rejects(BlockSchema, { t: 'p', c: [{ t: 'redacted', length: 0 }] });
    rejects(BlockSchema, { t: 'html', v: '<script>' });
  });
});

describe('progression.json', () => {
  it('accepte un exemple valide', () => {
    expect(ProgressionSchema.parse(fx.progression)).toEqual(fx.progression);
  });
  it('refuse mot-clé sans terme ni résultat, `not` dans un déblocage, fin hors dossier', () => {
    const p = fx.clone(fx.progression);
    rejects(ProgressionSchema, { ...p, keywords: [{ ...p.keywords[0], terms: [] }] });
    rejects(ProgressionSchema, { ...p, keywords: [{ ...p.keywords[0], results: [] }] });
    rejects(ProgressionSchema, { ...p, unlocks: { a: { not: { read: 'b' } } } });
    rejects(ProgressionSchema, { ...p, unlocks: { A_B: { read: 'b' } } });
    rejects(ProgressionSchema, { ...p, endings: [{ ...p.endings[0], file: 'verite.md' }] });
    rejects(ProgressionSchema, { ...p, start: [] });
  });
});

describe('hints.json et achievements.json', () => {
  it('acceptent des exemples valides', () => {
    expect(HintsFileSchema.parse(fx.hints)).toEqual(fx.hints);
    expect(AchievementsFileSchema.parse(fx.achievements)).toEqual(fx.achievements);
  });
  it('refusent palier 4, double cible, succès sans `hidden`', () => {
    const h = fx.clone(fx.hints);
    rejects(HintsFileSchema, [{ ...h[0], level: 4 }]);
    rejects(HintsFileSchema, [{ ...h[0], target: { slot: 'a', group: 'b' } }]);
    const { hidden: _hidden, ...noHidden } = fx.clone(fx.achievements)[0]!;
    rejects(AchievementsFileSchema, [noHidden]);
  });
});

describe('monde', () => {
  it('acceptent carte et lieu valides', () => {
    expect(WorldMapSchema.parse(fx.worldMap)).toEqual(fx.worldMap);
    expect(PlaceSchema.parse(fx.place)).toEqual(fx.place);
  });
  it('refusent position hors [0,1], couche inconnue ou en double, zoom inversé', () => {
    rejects(PlaceSchema, { ...fx.place, position: { x: 1.2, y: 0 } });
    rejects(PlaceSchema, { ...fx.place, kind: 'railway' });
    rejects(WorldMapSchema, { ...fx.worldMap, layers: ['base', 'rails'] });
    rejects(WorldMapSchema, { ...fx.worldMap, layers: ['base', 'base'] });
    rejects(WorldMapSchema, { ...fx.worldMap, minZoom: 9 });
  });
});

describe('sauvegarde', () => {
  it('accepte un exemple valide', () => {
    expect(SaveStateSchema.parse(fx.saveState)).toEqual(fx.saveState);
  });
  it('refuse version de schéma, emplacement, hachage, limites et surlignage inversé', () => {
    const s = fx.clone(fx.saveState);
    rejects(SaveStateSchema, { ...s, schemaVersion: 2 });
    rejects(SaveStateSchema, { ...s, slot: 'slot-4' });
    rejects(SaveStateSchema, { ...s, contentHash: 'XYZ' });
    rejects(SaveStateSchema, { ...s, cheat: true });
    rejects(SaveStateSchema, {
      ...s,
      searchLog: Array.from({ length: SAVE_LIMITS.searchLog + 1 }, (_, i) => ({
        query: 'q',
        keyword: null,
        at: i,
      })),
    });
    rejects(SaveStateSchema, {
      ...s,
      notebook: {
        ...s.notebook,
        pins: Array.from({ length: SAVE_LIMITS.pins + 1 }, () => ({ kind: 'slot', id: 'a' })),
      },
    });
    rejects(SaveStateSchema, {
      ...s,
      notebook: {
        ...s.notebook,
        notes: [{ id: 'n', text: 'x'.repeat(SAVE_LIMITS.noteText + 1), at: 0 }],
      },
    });
    rejects(SaveStateSchema, {
      ...s,
      notebook: {
        ...s.notebook,
        highlights: [{ doc: 'a', path: [0], start: 5, end: 5, color: 1 }],
      },
    });
    rejects(SaveStateSchema, { ...s, elapsedMs: -1 });
  });
});

describe('réglages et profil', () => {
  it('les valeurs par défaut sont valides et indépendantes', () => {
    expect(SettingsSchema.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(ProfileSchema.parse(defaultProfile())).toEqual(defaultProfile());
    const a = defaultSettings();
    a.volume.master = 0;
    expect(DEFAULT_SETTINGS.volume.master).toBe(1);
    expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
  });
  it('accepte un profil complet', () => {
    expect(ProfileSchema.parse(fx.profile)).toEqual(fx.profile);
  });
  it('refuse taille de texte hors crans, volume hors [0,1], réglage manquant', () => {
    rejects(SettingsSchema, { ...defaultSettings(), textScale: 1.1 });
    rejects(SettingsSchema, {
      ...defaultSettings(),
      volume: { master: 1.5, music: 1, ambience: 1, sfx: 1, ui: 1 },
    });
    const { motion: _motion, ...partial } = defaultSettings();
    rejects(SettingsSchema, partial);
    rejects(ProfileSchema, { ...fx.profile, completed: { x: { endings: [], bestTimedMs: 0 } } });
  });
});

describe('schémas JSON', () => {
  it('se génèrent pour chaque fichier de contenu et donnée joueur', () => {
    const schemas = buildJsonSchemas();
    expect(Object.keys(schemas).sort()).toEqual(
      [
        'achievements',
        'case',
        'document',
        'family',
        'hints',
        'map',
        'place',
        'profile',
        'progression',
        'save',
        'settings',
        'tree',
      ].sort(),
    );
    for (const schema of Object.values(schemas)) {
      expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    }
    expect(JSON.stringify(schemas.case)).toContain('"additionalProperties":false');
  });
});
