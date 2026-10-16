import { z } from 'zod';
import type { KeywordId, OccupationId, PartialDate, PlaceId, PortraitId } from './ids';
import { IdSchema, PartialDateSchema, TextSchema } from './ids';

export const DOCUMENT_KINDS = [
  'letter',
  'newspaper',
  'photo',
  'register',
  'certificate',
  'postcard',
  'directory',
  'telegram',
  'catalog',
  'note',
  'object',
  'report',
  'advert',
  /** Transcription d'une bande d'enquête orale (aucun audio) ; ne révèle jamais de portrait. */
  'recording',
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/** Frontmatter YAML de `documents/<id>.md` (scenariste). */
export interface DocumentFrontmatter {
  kind: DocumentKind;
  title: string;
  date?: PartialDate;
  author?: string;
  place?: PlaceId;
  /** Fonds, cote. */
  archive?: string;
  reveals?: { portraits?: PortraitId[]; occupations?: OccupationId[] };
  illustration?: { file: string; alt: string };
  /** Non requis par le solveur. */
  optional?: boolean;
  /** Pièce d'audition (déclencheur du tutoriel) : drapeau structurel, posé en FR seulement. */
  hearing?: boolean;
}

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'em' | 'strong' | 'hand' | 'strike'; c: Inline[] }
  | { t: 'ref'; keyword: KeywordId; c: Inline[] }
  | { t: 'redacted'; length: number }
  /**
   * `::mark[<portraitId>]` : marque dessinée dans le texte, à côté du nom qu'elle signe. Le
   * portrait doit être de `kind: 'mark'` ; il rejoint d'office `reveals.portraits` au build.
   */
  | { t: 'mark'; portrait: PortraitId };

export type Block =
  | { t: 'p' | 'signature'; c: Inline[] }
  | { t: 'h'; level: 2 | 3; c: Inline[] }
  | { t: 'quote'; c: Block[] }
  | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'figure'; asset: string; alt: string; caption?: Inline[] }
  | { t: 'stamp'; text: string }
  | { t: 'hr' };

export const ILLUSTRATION_FILE = /^illustrations\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

export const DocumentKindSchema = z.enum(DOCUMENT_KINDS);

export const DocumentFrontmatterSchema = z.strictObject({
  kind: DocumentKindSchema,
  title: TextSchema,
  date: PartialDateSchema.optional(),
  author: TextSchema.optional(),
  place: IdSchema.optional(),
  archive: TextSchema.optional(),
  reveals: z
    .strictObject({
      portraits: z.array(IdSchema).min(1).optional(),
      occupations: z.array(IdSchema).min(1).optional(),
    })
    .optional(),
  illustration: z
    .strictObject({
      file: z
        .string()
        .regex(ILLUSTRATION_FILE, { error: 'Chemin attendu : illustrations/<nom>.svg' }),
      alt: TextSchema,
    })
    .optional(),
  optional: z.boolean().optional(),
  hearing: z.boolean().optional(),
});

/** AST typé produit par le parseur Markdown (contrôle des sorties du parseur, tests). */
export const InlineSchema: z.ZodType<Inline> = z.lazy(() =>
  z.union([
    z.strictObject({ t: z.literal('text'), v: z.string() }),
    z.strictObject({ t: z.enum(['em', 'strong', 'hand', 'strike']), c: z.array(InlineSchema) }),
    z.strictObject({ t: z.literal('ref'), keyword: IdSchema, c: z.array(InlineSchema) }),
    z.strictObject({ t: z.literal('redacted'), length: z.number().int().positive() }),
    z.strictObject({ t: z.literal('mark'), portrait: IdSchema }),
  ]),
);

export const BlockSchema: z.ZodType<Block> = z.lazy(() =>
  z.union([
    z.strictObject({ t: z.enum(['p', 'signature']), c: z.array(InlineSchema) }),
    z.strictObject({
      t: z.literal('h'),
      level: z.literal([2, 3]),
      c: z.array(InlineSchema),
    }),
    z.strictObject({ t: z.literal('quote'), c: z.array(BlockSchema) }),
    z.strictObject({
      t: z.literal('list'),
      ordered: z.boolean(),
      items: z.array(z.array(InlineSchema)),
    }),
    z.strictObject({
      t: z.literal('table'),
      head: z.array(z.array(InlineSchema)),
      rows: z.array(z.array(z.array(InlineSchema))),
    }),
    z.strictObject({
      t: z.literal('figure'),
      asset: z.string().min(1),
      alt: TextSchema,
      caption: z.array(InlineSchema).optional(),
    }),
    z.strictObject({ t: z.literal('stamp'), text: TextSchema }),
    z.strictObject({ t: z.literal('hr') }),
  ]),
);
