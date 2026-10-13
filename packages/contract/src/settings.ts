import { z } from 'zod';
import type { AchievementId, CaseId, EndingId } from './ids';
import { IdSchema, MsSchema } from './ids';

export const TEXT_SCALES = [0.875, 1, 1.25, 1.5, 2] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export const HINT_PRESETS = [0, 1, 2, 3, 'custom'] as const;
export type HintPreset = (typeof HINT_PRESETS)[number];
export const LONG_PRESS_MS = [300, 400, 600] as const;

export interface Volume {
  /** [0, 1] */
  master: number;
  music: number;
  ambience: number;
  sfx: number;
  ui: number;
}

/** Aides (docs/game/GAME_DESIGN.md §10) : préréglage 0 à 3, ou réglage fin. */
export interface HintSettings {
  preset: HintPreset;
  unreadBadges: boolean;
  exhaustedTerms: boolean;
  placeCounters: boolean;
  whereToLook: boolean;
  groupCounter: boolean;
  progressiveHints: boolean;
}

export interface Settings {
  textScale: TextScale;
  readingFont: 'default' | 'hyperlegible' | 'dyslexic';
  lineSpacing: 'default' | 'wide' | 'wider';
  letterSpacing: boolean;
  transcriptByDefault: boolean;
  replaceHandwriting: boolean;
  highContrast: boolean;
  reducePaperTexture: boolean;
  colorVision: 'default' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  motion: 'system' | 'reduced' | 'full';
  hints: HintSettings;
  validation: 'auto' | 'manual';
  showTimer: boolean;
  volume: Volume;
  mono: boolean;
  muteInBackground: boolean;
  haptics: boolean;
  longPressMs: (typeof LONG_PRESS_MS)[number];
  confirmClear: boolean;
  inputGlyphs: 'auto' | 'keyboard' | 'gamepad';
}

/** Contenu des préréglages d'aide (§10). */
export function hintPreset(preset: 0 | 1 | 2 | 3): HintSettings {
  return {
    preset,
    unreadBadges: preset >= 1,
    exhaustedTerms: preset >= 1,
    placeCounters: preset >= 1,
    whereToLook: preset >= 1,
    groupCounter: preset >= 2,
    progressiveHints: preset >= 3,
  };
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
  lineSpacing: 'default',
  letterSpacing: false,
  transcriptByDefault: false,
  replaceHandwriting: false,
  highContrast: false,
  reducePaperTexture: false,
  colorVision: 'default',
  motion: 'system',
  hints: Object.freeze(hintPreset(1)),
  validation: 'auto',
  showTimer: false,
  volume: Object.freeze({ master: 1, music: 0.8, ambience: 0.6, sfx: 0.8, ui: 0.6 }),
  mono: false,
  muteInBackground: true,
  haptics: true,
  longPressMs: 400,
  confirmClear: false,
  inputGlyphs: 'auto',
});

/** Copie modifiable des réglages par défaut. */
export function defaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    hints: { ...DEFAULT_SETTINGS.hints },
    volume: { ...DEFAULT_SETTINGS.volume },
  };
}

/** Profil vierge (premier lancement). */
export function defaultProfile(): Profile {
  return { schemaVersion: 1, settings: defaultSettings(), achievements: {}, completed: {} };
}

const VolumeLevelSchema = z.number().min(0).max(1);

export const VolumeSchema = z.strictObject({
  master: VolumeLevelSchema,
  music: VolumeLevelSchema,
  ambience: VolumeLevelSchema,
  sfx: VolumeLevelSchema,
  ui: VolumeLevelSchema,
});

export const HintSettingsSchema = z.strictObject({
  preset: z.union([z.literal([0, 1, 2, 3]), z.literal('custom')]),
  unreadBadges: z.boolean(),
  exhaustedTerms: z.boolean(),
  placeCounters: z.boolean(),
  whereToLook: z.boolean(),
  groupCounter: z.boolean(),
  progressiveHints: z.boolean(),
});

export const SettingsSchema = z.strictObject({
  textScale: z.literal(TEXT_SCALES),
  readingFont: z.enum(['default', 'hyperlegible', 'dyslexic']),
  lineSpacing: z.enum(['default', 'wide', 'wider']),
  letterSpacing: z.boolean(),
  transcriptByDefault: z.boolean(),
  replaceHandwriting: z.boolean(),
  highContrast: z.boolean(),
  reducePaperTexture: z.boolean(),
  colorVision: z.enum(['default', 'protanopia', 'deuteranopia', 'tritanopia']),
  motion: z.enum(['system', 'reduced', 'full']),
  hints: HintSettingsSchema,
  validation: z.enum(['auto', 'manual']),
  showTimer: z.boolean(),
  volume: VolumeSchema,
  mono: z.boolean(),
  muteInBackground: z.boolean(),
  haptics: z.boolean(),
  longPressMs: z.literal(LONG_PRESS_MS),
  confirmClear: z.boolean(),
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
