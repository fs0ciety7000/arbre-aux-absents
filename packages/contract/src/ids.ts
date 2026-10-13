import { z } from 'zod';

/** Identifiants : kebab-case ; id = nom de fichier quand il y en a un. */
export type CaseId = string;
export type PersonId = string;
export type SlotId = string;
export type DocumentId = string;
export type KeywordId = string;
export type PlaceId = string;
export type PortraitId = string;
export type OccupationId = string;
export type GroupId = string;
export type SecretId = string;
export type EndingId = string;
export type AchievementId = string;
export type HintId = string;

/** "1923", "1923-04", "1923-04-17" (calendrier du monde). */
export type PartialDate = string;

/** Fractions [0,1], origine en haut à gauche. */
export interface NormPoint {
  x: number;
  y: number;
}

export const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PARTIAL_DATE = /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/;
export const SEMVER =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const IdSchema = z.string().regex(KEBAB_CASE, { error: 'Identifiant kebab-case attendu' });
export const PartialDateSchema = z
  .string()
  .regex(PARTIAL_DATE, { error: 'Date partielle attendue : AAAA, AAAA-MM ou AAAA-MM-JJ' });
export const NormPointSchema = z.strictObject({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

/** Texte non vide (sans compter les espaces). */
export const TextSchema = z.string().regex(/\S/, { error: 'Texte non vide attendu' });
/** Horodatage ou durée en millisecondes. */
export const MsSchema = z.number().int().nonnegative();
