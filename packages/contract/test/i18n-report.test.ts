import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import {
  AchievementsTranslationSchema,
  CaseMetaTranslationSchema,
  DocumentFrontmatterSchema,
  DocumentFrontmatterTranslationSchema,
  FamilyTranslationSchema,
  HighlightSchema,
  KnownIssueSchema,
  LocalesConfigSchema,
  ProfileSchema,
  ProgressionTranslationSchema,
  REPORT_LIMITS,
  ReportReceiptSchema,
  ReportRefSchema,
  ReportSubmissionSchema,
  SettingsSchema,
  TicketViewSchema,
  TreeTranslationSchema,
  WorldTranslationSchema,
  defaultProfile,
  defaultSettings,
  localeFromTags,
  resolveLanguage,
  type AchievementsTranslation,
  type CaseMetaTranslation,
  type DocumentFrontmatterTranslation,
  type FamilyTranslation,
  type KnownIssue,
  type LocalesConfig,
  type ProgressionTranslation,
  type ReportReceipt,
  type ReportRef,
  type ReportSubmission,
  type TicketView,
  type TreeTranslation,
  type WorldTranslation,
} from '../src';

// Alignement types écrits à la main ⇄ types inférés des schémas (vérifié par tsc).
expectTypeOf<z.output<typeof LocalesConfigSchema>>().toEqualTypeOf<LocalesConfig>();
expectTypeOf<z.output<typeof CaseMetaTranslationSchema>>().toEqualTypeOf<CaseMetaTranslation>();
expectTypeOf<z.output<typeof FamilyTranslationSchema>>().toEqualTypeOf<FamilyTranslation>();
expectTypeOf<z.output<typeof TreeTranslationSchema>>().toEqualTypeOf<TreeTranslation>();
expectTypeOf<
  z.output<typeof ProgressionTranslationSchema>
>().toEqualTypeOf<ProgressionTranslation>();
expectTypeOf<
  z.output<typeof AchievementsTranslationSchema>
>().toEqualTypeOf<AchievementsTranslation>();
expectTypeOf<
  z.output<typeof DocumentFrontmatterTranslationSchema>
>().toEqualTypeOf<DocumentFrontmatterTranslation>();
expectTypeOf<z.output<typeof WorldTranslationSchema>>().toEqualTypeOf<WorldTranslation>();
expectTypeOf<z.output<typeof ReportSubmissionSchema>>().toEqualTypeOf<ReportSubmission>();
expectTypeOf<z.output<typeof ReportReceiptSchema>>().toEqualTypeOf<ReportReceipt>();
expectTypeOf<z.output<typeof TicketViewSchema>>().toEqualTypeOf<TicketView>();
expectTypeOf<z.output<typeof KnownIssueSchema>>().toEqualTypeOf<KnownIssue>();
expectTypeOf<z.output<typeof ReportRefSchema>>().toEqualTypeOf<ReportRef>();

const TOKEN = 'abcdefghijklmnopqrstuv';

function submission(over: Partial<ReportSubmission> = {}): ReportSubmission {
  return {
    source: 'game',
    category: 'bug',
    description: 'Le registre ne s’ouvre plus après la recherche.',
    locale: 'en',
    diagnostics: {
      appVersion: '1.1.0',
      edition: 'full',
      platform: 'desktop',
      locale: 'en',
      caseId: 'succession-varenque',
      contentHash: '0a1b2c3d',
      viewport: { w: 1280, h: 800, dpr: 2 },
    },
    website: '',
    elapsedMs: 12_000,
    ...over,
  };
}

describe('langues', () => {
  it('locales.json : une seule source, la langue par défaut', () => {
    const ok = {
      default: 'fr',
      locales: {
        fr: { label: 'Français', status: 'source' },
        en: { label: 'English', status: 'draft' },
      },
    };
    expect(LocalesConfigSchema.parse(ok)).toEqual(ok);
    expect(
      LocalesConfigSchema.safeParse({
        ...ok,
        locales: { ...ok.locales, en: { label: 'English', status: 'source' } },
      }).success,
    ).toBe(false);
    expect(
      LocalesConfigSchema.safeParse({
        ...ok,
        locales: { ...ok.locales, fr: { label: 'Français', status: 'ready' } },
      }).success,
    ).toBe(false);
    expect(LocalesConfigSchema.safeParse({ ...ok, locales: { fr: ok.locales.fr } }).success).toBe(
      false,
    );
  });

  it('langue système : fr-* donne fr, toute autre langue en (D6)', () => {
    expect(localeFromTags(['fr-BE', 'en'])).toBe('fr');
    expect(localeFromTags(['FR'])).toBe('fr');
    expect(localeFromTags(['de-DE', 'fr'])).toBe('en');
    expect(localeFromTags(['en-GB'])).toBe('en');
    expect(localeFromTags([])).toBe('fr');
    expect(resolveLanguage('en', ['fr-FR'])).toBe('en');
    expect(resolveLanguage('system', ['en-US'])).toBe('en');
    expect(resolveLanguage(undefined, ['fr-CA'])).toBe('fr');
  });

  it('calques stricts : champ structurel refusé', () => {
    expect(DocumentFrontmatterTranslationSchema.safeParse({ title: 'Letter' }).success).toBe(true);
    expect(
      DocumentFrontmatterTranslationSchema.safeParse({ title: 'Letter', kind: 'letter' }).success,
    ).toBe(false);
    expect(
      DocumentFrontmatterTranslationSchema.safeParse({
        title: 'Letter',
        illustration: { alt: 'x', file: 'illustrations/a.svg' },
      }).success,
    ).toBe(false);
    expect(
      ProgressionTranslationSchema.safeParse({
        keywords: { 'mot-cle': { label: 'Fern', terms: [] } },
        secrets: {},
      }).success,
    ).toBe(false);
    expect(
      FamilyTranslationSchema.safeParse({ occupations: { 'Pas Un Id': 'x' }, portraits: {} })
        .success,
    ).toBe(false);
  });

  it('calques simples : affaire, arbre, succès, monde', () => {
    expect(
      CaseMetaTranslationSchema.safeParse({ title: 'The Revenant of Hautcorvin' }).success,
    ).toBe(true);
    expect(CaseMetaTranslationSchema.safeParse({ title: 'x', version: '1.0.0' }).success).toBe(
      false,
    );
    expect(TreeTranslationSchema.safeParse({ groups: { aines: 'The elders' } }).success).toBe(true);
    expect(
      AchievementsTranslationSchema.safeParse({ premier: { title: 'First', description: '' } })
        .success,
    ).toBe(false);
    expect(
      WorldTranslationSchema.safeParse({ map: { title: 'Map' }, places: { port: {} } }).success,
    ).toBe(true);
    expect(
      WorldTranslationSchema.safeParse({ map: { title: 'Map' }, places: { port: { name: 'P' } } })
        .success,
    ).toBe(false);
  });

  it('drapeau hearing, surlignage étiqueté, réglage de langue facultatif', () => {
    expect(
      DocumentFrontmatterSchema.safeParse({ kind: 'report', title: 'Audition', hearing: true })
        .success,
    ).toBe(true);
    const h = { doc: 'pv-01', path: [0], start: 0, end: 4, color: 1 };
    expect(HighlightSchema.safeParse(h).success).toBe(true);
    expect(HighlightSchema.safeParse({ ...h, lang: 'en' }).success).toBe(true);
    expect(HighlightSchema.safeParse({ ...h, lang: 'de' }).success).toBe(false);
    expect(SettingsSchema.safeParse(defaultSettings()).success).toBe(true);
    expect(SettingsSchema.safeParse({ ...defaultSettings(), language: 'system' }).success).toBe(
      true,
    );
    expect(SettingsSchema.safeParse({ ...defaultSettings(), language: 'de' }).success).toBe(false);
  });
});

describe('signalements', () => {
  it('accepte une soumission valide, avec contact et sauvegarde jointe', () => {
    expect(ReportSubmissionSchema.safeParse(submission()).success).toBe(true);
    const full = submission({ contact: 'moi@example.org' });
    full.diagnostics.save = { schemaVersion: 1 };
    full.diagnostics.settings = { textScale: 1.25, language: 'en' };
    expect(ReportSubmissionSchema.safeParse(full).success).toBe(true);
  });

  it('refuse description hors bornes, catégorie inconnue, clé inconnue, sauvegarde trop lourde', () => {
    const bad = (over: Partial<ReportSubmission> | Record<string, unknown>) =>
      ReportSubmissionSchema.safeParse({ ...submission(), ...over }).success;
    expect(bad({ description: 'trop court' })).toBe(false);
    expect(bad({ description: ' '.repeat(30) + 'court' })).toBe(false);
    expect(bad({ description: 'x'.repeat(REPORT_LIMITS.descriptionMax + 1) })).toBe(false);
    expect(bad({ category: 'crash' })).toBe(false);
    expect(bad({ contact: 'x'.repeat(REPORT_LIMITS.contact + 1) })).toBe(false);
    expect(bad({ ip: '1.2.3.4' })).toBe(false);
    const heavy = submission();
    heavy.diagnostics.save = { blob: 'x'.repeat(REPORT_LIMITS.saveJson) };
    expect(ReportSubmissionSchema.safeParse(heavy).success).toBe(false);
  });

  it('reçu, vue de ticket, problème connu', () => {
    expect(
      ReportReceiptSchema.safeParse({
        ticket: 'AA-0042',
        token: TOKEN,
        followUrl: 'https://arbre.cardormedia.com/suivi/#' + TOKEN,
      }).success,
    ).toBe(true);
    expect(
      ReportReceiptSchema.safeParse({ ticket: 'AA-42', token: TOKEN, followUrl: 'https://a.b/' })
        .success,
    ).toBe(false);
    expect(
      ReportReceiptSchema.safeParse({
        ticket: 'AA-0042',
        token: TOKEN,
        followUrl: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    const view: TicketView = {
      ticket: 'AA-0042',
      status: 'fixed',
      fixedIn: 'v1.2.0',
      category: 'text',
      createdAt: 1,
      updatedAt: 2,
      replies: [{ at: 2, text: 'Corrigé.' }],
    };
    expect(TicketViewSchema.parse(view)).toEqual(view);
    expect(TicketViewSchema.safeParse({ ...view, status: 'open' }).success).toBe(false);
    expect(
      KnownIssueSchema.safeParse({
        ticket: 'AA-0001',
        title: 'Carte',
        status: 'confirmed',
        updatedAt: 0,
      }).success,
    ).toBe(true);
  });

  it('profil : signalements facultatifs, bornés à 20, jeton au bon format', () => {
    const ref: ReportRef = { ticket: 'AA-0042', token: TOKEN, createdAt: 1, summary: 'Registre' };
    expect(ProfileSchema.safeParse(defaultProfile()).success).toBe(true);
    expect(ProfileSchema.safeParse({ ...defaultProfile(), reports: [ref] }).success).toBe(true);
    expect(
      ProfileSchema.safeParse({
        ...defaultProfile(),
        reports: Array.from({ length: 21 }, () => ref),
      }).success,
    ).toBe(false);
    expect(ReportRefSchema.safeParse({ ...ref, token: 'court' }).success).toBe(false);
    expect(ReportRefSchema.safeParse({ ...ref, summary: 'x'.repeat(81) }).success).toBe(false);
  });
});
