import type { z } from 'zod';
import { CaseMetaSchema } from './case';
import { DocumentFrontmatterSchema } from './document';
import { FamilySchema } from './family';
import {
  AchievementsTranslationSchema,
  CaseMetaTranslationSchema,
  DocumentFrontmatterTranslationSchema,
  EndingFrontmatterTranslationSchema,
  FamilyTranslationSchema,
  HintsTranslationSchema,
  LocalesConfigSchema,
  ProgressionTranslationSchema,
  TreeTranslationSchema,
  WorldTranslationSchema,
} from './i18n';
import { AchievementsFileSchema, HintsFileSchema, ProgressionSchema } from './progression';
import { ProfileSchema, SettingsSchema } from './settings';
import { SaveStateSchema } from './save';
import { TreeSpecSchema } from './tree';
import { PlaceSchema, WorldMapSchema } from './world';

/**
 * Schéma de chaque fichier de contenu source (ARCHITECTURE §3.6), indexé par le nom de base
 * utilisé pour `content/<nom>.schema.json`.
 */
export const CONTENT_FILE_SCHEMAS = {
  case: CaseMetaSchema,
  family: FamilySchema,
  tree: TreeSpecSchema,
  progression: ProgressionSchema,
  hints: HintsFileSchema,
  achievements: AchievementsFileSchema,
  document: DocumentFrontmatterSchema,
  map: WorldMapSchema,
  place: PlaceSchema,
} as const satisfies Record<string, z.ZodType>;

/**
 * Traductions (ARCHITECTURE §3.6, §3.7 règle 12) : `content/locales.json`, calques
 * `content/cases/<id>/locales/<loc>/*.json`, frontmatter des documents et fins traduits,
 * `content/world/locales/<loc>.json`.
 */
export const I18N_FILE_SCHEMAS = {
  locales: LocalesConfigSchema,
  'case.i18n': CaseMetaTranslationSchema,
  'family.i18n': FamilyTranslationSchema,
  'tree.i18n': TreeTranslationSchema,
  'progression.i18n': ProgressionTranslationSchema,
  'hints.i18n': HintsTranslationSchema,
  'achievements.i18n': AchievementsTranslationSchema,
  'document.i18n': DocumentFrontmatterTranslationSchema,
  'ending.i18n': EndingFrontmatterTranslationSchema,
  'world.i18n': WorldTranslationSchema,
} as const satisfies Record<string, z.ZodType>;

/** Schémas des données joueur (sauvegarde, profil, réglages). */
export const PLAYER_DATA_SCHEMAS = {
  save: SaveStateSchema,
  profile: ProfileSchema,
  settings: SettingsSchema,
} as const satisfies Record<string, z.ZodType>;

export type ContentFileKind = keyof typeof CONTENT_FILE_SCHEMAS;
