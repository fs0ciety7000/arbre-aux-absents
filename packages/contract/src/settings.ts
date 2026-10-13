import { z } from 'zod';
import type { AchievementId, CaseId, EndingId } from './ids';
import { IdSchema, MsSchema } from './ids';

export const TEXT_SCALES = [1, 1.25, 1.5, 2] as const;
export type TextScale = (typeof TEXT_SCALES)[number];

export interface Volume {
  /** [0, 1] */
  master: number;
  music: number;
  sfx: number;
}

export interface Settings {
  textScale: TextScale;
  readingFont: 'default' | 'hyperlegible';
  replaceHandwriting: boolean;
  highContrast: boolean;
  motion: 'system' | 'reduced' | 'full';
  hints: 'off' | 'highlight' | 'progressive';
  validation: 'auto' | 'manual';
  showTimer: boolean;
  volume: Volume;
  inputGlyphs: 'auto' | 'keyboard' | 'gamepad';
}

export interface CaseCompletion {
  bestTimedMs?: number;
  endings: EndingId[];
}

export interface Profile {
  schemaVersion: 1;
  settings: Settings;
  achievements: Record<AchievementId, number>;
  completed: Record<CaseId, CaseCompletion>;
}

/** Réglages par défaut (docs/game/GAME_DESIGN.md §10, §16, §17). */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  textScale: 1,
  readingFont: 'default',
  replaceHandwriting: false,
  highContrast: false,
  motion: 'system',
  hints: 'highlight',
  validation: 'auto',
  showTimer: false,
  volume: Object.freeze({ master: 1, music: 0.8, sfx: 0.8 }),
  inputGlyphs: 'auto',
});

/** Copie modifiable des réglages par défaut. */
export function defaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS, volume: { ...DEFAULT_SETTINGS.volume } };
}

/** Profil vierge (premier lancement). */
export function defaultProfile(): Profile {
  return { schemaVersion: 1, settings: defaultSettings(), achievements: {}, completed: {} };
}

const VolumeLevelSchema = z.number().min(0).max(1);

export const VolumeSchema = z.strictObject({
  master: VolumeLevelSchema,
  music: VolumeLevelSchema,
  sfx: VolumeLevelSchema,
});

export const SettingsSchema = z.strictObject({
  textScale: z.literal(TEXT_SCALES),
  readingFont: z.enum(['default', 'hyperlegible']),
  replaceHandwriting: z.boolean(),
  highContrast: z.boolean(),
  motion: z.enum(['system', 'reduced', 'full']),
  hints: z.enum(['off', 'highlight', 'progressive']),
  validation: z.enum(['auto', 'manual']),
  showTimer: z.boolean(),
  volume: VolumeSchema,
  inputGlyphs: z.enum(['auto', 'keyboard', 'gamepad']),
});

export const CaseCompletionSchema = z.strictObject({
  bestTimedMs: z.number().int().positive().optional(),
  endings: z.array(IdSchema),
});

export const ProfileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  settings: SettingsSchema,
  achievements: z.record(IdSchema, MsSchema),
  completed: z.record(IdSchema, CaseCompletionSchema),
});
