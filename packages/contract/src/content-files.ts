import type { z } from 'zod';
import { CaseMetaSchema } from './case';
import { DocumentFrontmatterSchema } from './document';
import { FamilySchema } from './family';
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

/** Schémas des données joueur (sauvegarde, profil, réglages). */
export const PLAYER_DATA_SCHEMAS = {
  save: SaveStateSchema,
  profile: ProfileSchema,
  settings: SettingsSchema,
} as const satisfies Record<string, z.ZodType>;

export type ContentFileKind = keyof typeof CONTENT_FILE_SCHEMAS;
