import { z } from 'zod';
import type { CaseMeta } from './case';
import type {
  AchievementId,
  CaseId,
  EndingId,
  GroupId,
  HintId,
  KeywordId,
  OccupationId,
  PlaceId,
  PortraitId,
  SecretId,
} from './ids';
import { IdSchema, TextSchema } from './ids';
import type { Achievement } from './progression';
import type { Edition } from './save';

/**
 * Traductions (docs/i18n/PLAN.md, ARCHITECTURE §3.7 règle 12). Le français est la source de
 * vérité ; chaque autre langue est un **calque** qui ne porte que les champs traduisibles,
 * indexés par les ids FR. Tout le reste (conditions, ids, `reveals`, dates…) est hérité.
 */
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

/** Réglage de langue : `system` = déduite des langues du système (`fr-*` → fr, sinon en). */
export const LANGUAGE_SETTINGS = ['system', ...LOCALES] as const;
export type LanguageSetting = (typeof LANGUAGE_SETTINGS)[number];

/** `source` : FR ; `draft` : parité en avertissements, langue non compilée ; `ready` : parité en erreurs, compilée. */
export const LOCALE_STATUSES = ['source', 'draft', 'ready'] as const;
export type LocaleStatus = (typeof LOCALE_STATUSES)[number];

/** `content/locales.json` */
export interface LocalesConfig {
  default: 'fr';
  locales: Record<Locale, { label: string; status: LocaleStatus }>;
}

/* Calques `content/cases/<id>/locales/<loc>/*.json` : clés = ids FR, objets stricts.
 * Un champ facultatif est exigé dans le calque si et seulement s'il est présent en FR
 * (contrôlé par `content:i18n`, pas par le schéma). */

/** `locales/<loc>/case.json` */
export interface CaseMetaTranslation {
  title: string;
  subtitle?: string;
  credits?: string[];
}

/** `locales/<loc>/family.json` */
export interface FamilyTranslation {
  occupations: Record<OccupationId, string>;
  portraits: Record<PortraitId, { alt: string; caption?: string }>;
}

/** `locales/<loc>/tree.json` */
export interface TreeTranslation {
  groups: Record<GroupId, string>;
}

export interface ReportOptionTranslation {
  label: string;
  unavailableReason?: string;
}

export interface ReportQuestionTranslation {
  prompt: string;
  options: Record<string, ReportOptionTranslation>;
}

/** `locales/<loc>/progression.json` */
export interface ProgressionTranslation {
  keywords: Record<KeywordId, { label: string; terms: string[] }>;
  secrets: Record<SecretId, string>;
  report?: Record<string, ReportQuestionTranslation>;
}

/** `locales/<loc>/hints.json` */
export type HintsTranslation = Record<HintId, string>;

/** `locales/<loc>/achievements.json` */
export type AchievementsTranslation = Record<AchievementId, { title: string; description: string }>;

/**
 * Frontmatter réduit de `locales/<loc>/documents/<id>.md` (strict) ; le reste est hérité du FR.
 * Les fins (`locales/<loc>/endings/<id>.md`) n'ont que `title` et gardent les mêmes étiquettes
 * de section, dans le même ordre.
 */
export interface DocumentFrontmatterTranslation {
  title: string;
  author?: string;
  archive?: string;
  illustration?: { alt: string };
}

/** Frontmatter de `locales/<loc>/endings/<id>.md`. */
export interface EndingFrontmatterTranslation {
  title: string;
}

/** `content/world/locales/<loc>.json` */
export interface WorldTranslation {
  map: { title: string; attribution?: string };
  places: Record<PlaceId, { description?: string }>;
}

/** Catalogue d'affaires par langue (E04, Succès, Bonus, Emplacements), généré, chargé avant toute affaire. */
export interface CaseCatalogEntry {
  id: CaseId;
  edition: Edition;
  locale: Locale;
  /** Empreinte structurelle, identique entre langues. */
  contentHash: string;
  meta: CaseMeta;
  achievements: Achievement[];
  endings: Record<EndingId, { title: string }>;
}

export const LocaleSchema = z.enum(LOCALES);
export const LanguageSettingSchema = z.enum(LANGUAGE_SETTINGS);
export const LocaleStatusSchema = z.enum(LOCALE_STATUSES);

export const LocalesConfigSchema = z
  .strictObject({
    default: z.literal('fr'),
    locales: z.strictObject({
      fr: z.strictObject({ label: TextSchema, status: LocaleStatusSchema }),
      en: z.strictObject({ label: TextSchema, status: LocaleStatusSchema }),
    }),
  })
  .refine((c) => c.locales[c.default].status === 'source', {
    error: 'La langue par défaut doit avoir le statut « source »',
    path: ['locales'],
  })
  .refine((c) => LOCALES.filter((l) => c.locales[l].status === 'source').length === 1, {
    error: 'Une seule langue « source »',
    path: ['locales'],
  });

export const CaseMetaTranslationSchema = z.strictObject({
  title: TextSchema,
  subtitle: TextSchema.optional(),
  credits: z.array(TextSchema).optional(),
});

export const FamilyTranslationSchema = z.strictObject({
  occupations: z.record(IdSchema, TextSchema),
  portraits: z.record(
    IdSchema,
    z.strictObject({ alt: TextSchema, caption: TextSchema.optional() }),
  ),
});

export const TreeTranslationSchema = z.strictObject({
  groups: z.record(IdSchema, TextSchema),
});

export const ReportOptionTranslationSchema = z.strictObject({
  label: TextSchema,
  unavailableReason: TextSchema.max(140).optional(),
});

export const ReportQuestionTranslationSchema = z.strictObject({
  prompt: TextSchema,
  options: z.record(IdSchema, ReportOptionTranslationSchema),
});

export const ProgressionTranslationSchema = z.strictObject({
  keywords: z.record(
    IdSchema,
    z.strictObject({ label: TextSchema, terms: z.array(TextSchema).min(1) }),
  ),
  secrets: z.record(IdSchema, TextSchema),
  report: z.record(IdSchema, ReportQuestionTranslationSchema).optional(),
});

export const HintsTranslationSchema = z.record(IdSchema, TextSchema);

export const AchievementsTranslationSchema = z.record(
  IdSchema,
  z.strictObject({ title: TextSchema, description: TextSchema }),
);

export const DocumentFrontmatterTranslationSchema = z.strictObject({
  title: TextSchema,
  author: TextSchema.optional(),
  archive: TextSchema.optional(),
  illustration: z.strictObject({ alt: TextSchema }).optional(),
});

export const EndingFrontmatterTranslationSchema = z.strictObject({
  title: TextSchema,
});

export const WorldTranslationSchema = z.strictObject({
  map: z.strictObject({ title: TextSchema, attribution: TextSchema.optional() }),
  places: z.record(IdSchema, z.strictObject({ description: TextSchema.optional() })),
});

/** Langue d'une étiquette BCP 47 (`fr-BE` → fr) ; `fr-*` donne le français, toute autre langue l'anglais (D6). */
export function localeFromTags(tags: readonly string[]): Locale {
  const first = tags.find((t) => t.trim() !== '');
  if (!first) return DEFAULT_LOCALE;
  return first.trim().toLowerCase().split(/[-_]/)[0] === 'fr' ? 'fr' : 'en';
}

/** Résout le réglage de langue : explicite, sinon déduit des langues du système. */
export function resolveLanguage(
  setting: LanguageSetting | undefined,
  systemLocales: readonly string[],
): Locale {
  if (setting && setting !== 'system') return setting;
  return localeFromTags(systemLocales);
}
