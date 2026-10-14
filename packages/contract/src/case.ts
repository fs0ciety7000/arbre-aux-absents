import { z } from 'zod';
import type { CaseId, DocumentId } from './ids';
import { IdSchema, SEMVER, TextSchema } from './ids';

/** `case.json` (scenariste). */
export interface CaseMeta {
  id: CaseId;
  title: string;
  subtitle?: string;
  /** semver */
  version: string;
  intro: DocumentId;
  epilogue?: DocumentId;
  timedTargetsMs?: number[];
  credits?: string[];
  /** Rang d'affichage (menu, succès) ; tri (order ?? ∞, id). */
  order?: number;
}

export const CaseMetaSchema = z.strictObject({
  id: IdSchema,
  title: TextSchema,
  subtitle: TextSchema.optional(),
  version: z.string().regex(SEMVER, { error: 'Version semver attendue (ex. 1.0.0)' }),
  intro: IdSchema,
  epilogue: IdSchema.optional(),
  timedTargetsMs: z.array(z.number().int().positive()).min(1).optional(),
  credits: z.array(TextSchema).optional(),
  order: z.number().int().positive().optional(),
});
