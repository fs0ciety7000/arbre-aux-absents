import { z } from 'zod';
import type { OccupationId, PartialDate, PersonId, PortraitId } from './ids';
import { IdSchema, PartialDateSchema, TextSchema } from './ids';

/** Personne de la bible (`family.json`, scenariste) : la vérité. */
export interface Person {
  id: PersonId;
  /** Variantes acceptées, la première = canonique. */
  given: string[];
  /** Nom de naissance, d'usage, graphies. */
  family: string[];
  nicknames?: string[];
  occupation: OccupationId;
  /** Visage, ou marque si la case de la personne est à marque (`TreeSlot.portraitKind`). */
  portrait: PortraitId;
  /** Autres âges du même visage (ou marque de fille d'une épouse), acceptés dans sa case. */
  altPortraits?: PortraitId[];
  born?: PartialDate;
  died?: PartialDate;
  parents?: [PersonId | null, PersonId | null];
  unions?: PersonId[];
  /** Retiré au build. */
  bibleNotes?: string;
}

export interface Occupation {
  id: OccupationId;
  label: string;
}

/**
 * Type d'image d'un portrait : visage (photographie, dessin) ou marque (signe de la grammaire des
 * marques, affaire 3). Absent = `face` : les affaires antérieures restent valides sans changement.
 */
export const PORTRAIT_KINDS = ['face', 'mark'] as const;
export type PortraitKind = (typeof PORTRAIT_KINDS)[number];
export const PortraitKindSchema = z.enum(PORTRAIT_KINDS);

export interface Portrait {
  id: PortraitId;
  /** `portraits/<id>.svg` */
  file: string;
  /** Pour une marque : description verbale normalisée (gabarit vérifié par `content:check`). */
  alt: string;
  caption?: string;
  /** Absent = `face`. */
  kind?: PortraitKind;
}

export interface Family {
  persons: Person[];
  occupations: Occupation[];
  portraits: Portrait[];
}

export const PORTRAIT_FILE = /^portraits\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

export const PersonSchema = z.strictObject({
  id: IdSchema,
  given: z.array(TextSchema).min(1),
  family: z.array(TextSchema).min(1),
  nicknames: z.array(TextSchema).optional(),
  occupation: IdSchema,
  portrait: IdSchema,
  altPortraits: z.array(IdSchema).min(1).optional(),
  born: PartialDateSchema.optional(),
  died: PartialDateSchema.optional(),
  parents: z.tuple([IdSchema.nullable(), IdSchema.nullable()]).optional(),
  unions: z.array(IdSchema).optional(),
  bibleNotes: z.string().optional(),
});

export const OccupationSchema = z.strictObject({
  id: IdSchema,
  label: TextSchema,
});

export const PortraitSchema = z.strictObject({
  id: IdSchema,
  file: z.string().regex(PORTRAIT_FILE, { error: 'Chemin attendu : portraits/<id>.svg' }),
  alt: TextSchema,
  caption: TextSchema.optional(),
  kind: PortraitKindSchema.optional(),
});

export const FamilySchema = z.strictObject({
  persons: z.array(PersonSchema).min(1),
  occupations: z.array(OccupationSchema).min(1),
  portraits: z.array(PortraitSchema).min(1),
});
