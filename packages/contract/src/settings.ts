import { z } from 'zod';
import type { AchievementId, CaseId, EndingId } from './ids';
import { IdSchema, MsSchema } from './ids';
import type { LanguageSetting } from './i18n';
import { LanguageSettingSchema } from './i18n';
import type { ReportRef } from './report-ref';
import { REPORT_REF_LIMITS, ReportRefSchema } from './report-ref';

export const TEXT_SCALES = [0.875, 1, 1.25, 1.5, 2] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export const HINT_PRESETS = [0, 1, 2, 3, 'custom'] as const;
export type HintPreset = (typeof HINT_PRESETS)[number];
export const LONG_PRESS_MS = [300, 400, 600] as const;
/**
 * Taille du texte du Lecteur (A− / A+), relative au corps de lecture des pièces (déjà un cran
 * au-dessus du texte courant, DESIGN §4.2). Distincte de `textScale` (tout le jeu) et du zoom
 * du Lecteur (qui agrandit la feuille entière).
 */
export const READ_SCALES = [0.9, 1, 1.15, 1.3, 1.5] as const;
export type ReadScale = (typeof READ_SCALES)[number];
/** Largeur du volet latéral (Lecteur, Archives…) en px CSS : bornes, standard et large. */
export const SIDE_WIDTH = Object.freeze({ min: 360, standard: 440, wide: 640, max: 640 });
/**
 * Disposition du Bureau (desktop et tablette paysage) : Enquête (arbre + volet côte à côte),
 * Lecture (Lecteur ~60 %), Arbre (arbre plein Bureau, volet en fiche flottante).
 */
export const DESK_LAYOUTS = ['investigate', 'read', 'tree'] as const;
export type DeskLayout = (typeof DESK_LAYOUTS)[number];
/**
 * Position de la fiche flottante (disposition Arbre) : fractions [0, 1] de la place libre
 * (0 = bord gauche / haut, 1 = bord droit / bas), donc toujours à l'écran quelle que soit la taille.
 */
export interface CardPosition {
  x: number;
  y: number;
}

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
  /** Taille du texte du Lecteur (A− / A+). Absent des anciens profils : 1. */
  readScale: ReadScale;
  /** Largeur mémorisée du volet latéral (px, `SIDE_WIDTH`). Absent des anciens profils : 440. */
  sideWidth: number;
  /** Disposition du Bureau. Absent des anciens profils : 'investigate'. */
  layout: DeskLayout;
  /** Position mémorisée de la fiche flottante. Absent des anciens profils : en haut à droite. */
  cardPosition: CardPosition;
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
  /** Facultatif : anciens profils valides ; absent = 'system'. */
  language?: LanguageSetting;
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

/** Tutoriel en bulles (GAME_DESIGN §15) : ce que le joueur a déjà vu. */
export interface TutorialProgress {
  /** Terminé ou passé (« J'ai déjà joué », « Passer le tutoriel ») : plus aucune bulle. */
  done: boolean;
  /** Identifiants des bulles déjà montrées (≤ 32). */
  seen: string[];
}

/** Bulles mémorisées au plus (`TutorialProgress.seen`). */
export const TUTORIAL_SEEN_MAX = 32;

export interface Profile {
  schemaVersion: 1;
  settings: Settings;
  achievements: Record<AchievementId, number>;
  completed: Record<CaseId, CaseCompletion>;
  /** Absent : tutoriel jamais commencé (profils antérieurs compris). */
  tutorial?: TutorialProgress;
  /** « Mes signalements » (≤ 20, les plus récents d'abord). Absent : aucun signalement. */
  reports?: ReportRef[];
}

/** Réglages par défaut (docs/game/GAME_DESIGN.md §10, §16, §17). */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  textScale: 1,
  readScale: 1,
  sideWidth: SIDE_WIDTH.standard,
  layout: 'investigate',
  cardPosition: Object.freeze({ x: 1, y: 0 }),
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
    cardPosition: { ...DEFAULT_SETTINGS.cardPosition },
  };
}

/** Profil vierge (premier lancement). */
export function defaultProfile(): Profile {
  return { schemaVersion: 1, settings: defaultSettings(), achievements: {}, completed: {} };
}

const VolumeLevelSchema = z.number().min(0).max(1);

export const CardPositionSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

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
  // Migration douce : champs ajoutés après coup, valeur par défaut pour les profils antérieurs.
  readScale: z.literal(READ_SCALES).default(1),
  sideWidth: z.number().int().min(SIDE_WIDTH.min).max(SIDE_WIDTH.max).default(SIDE_WIDTH.standard),
  layout: z.enum(DESK_LAYOUTS).default('investigate'),
  cardPosition: CardPositionSchema.default({ x: 1, y: 0 }),
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
  language: LanguageSettingSchema.optional(),
});

export const CaseCompletionSchema = z.strictObject({
  bestTimedMs: z.number().int().positive().optional(),
  endings: z.array(IdSchema),
});

export const TutorialProgressSchema = z.strictObject({
  done: z.boolean(),
  seen: z.array(IdSchema.max(40)).max(TUTORIAL_SEEN_MAX),
});

export const ProfileSchema = z.strictObject({
  schemaVersion: z.literal(1),
  settings: SettingsSchema,
  achievements: z.record(IdSchema, MsSchema),
  completed: z.record(IdSchema, CaseCompletionSchema),
  tutorial: TutorialProgressSchema.optional(),
  reports: z.array(ReportRefSchema).max(REPORT_REF_LIMITS.max).optional(),
});
