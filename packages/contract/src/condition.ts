import { z } from 'zod';
import type { DocumentId, GroupId, KeywordId, PlaceId, SecretId, SlotId } from './ids';
import { IdSchema } from './ids';

/** MONOTONE pour tout déblocage (l'état ne fait que croître : pas d'impasse). */
export type Condition =
  | { read: DocumentId }
  | { unlocked: DocumentId }
  | { searched: KeywordId }
  | { visited: PlaceId }
  | { locked: SlotId }
  | { groupLocked: GroupId }
  | { secret: SecretId }
  | { lockedCount: { gte: number } }
  | { all: Condition[] }
  | { any: Condition[] };

/** Réservée aux fins et aux succès : autorise `not`. */
export type OutcomeCondition =
  Condition | { not: OutcomeCondition } | { all: OutcomeCondition[] } | { any: OutcomeCondition[] };

const leafConditionSchemas = [
  z.strictObject({ read: IdSchema }),
  z.strictObject({ unlocked: IdSchema }),
  z.strictObject({ searched: IdSchema }),
  z.strictObject({ visited: IdSchema }),
  z.strictObject({ locked: IdSchema }),
  z.strictObject({ groupLocked: IdSchema }),
  z.strictObject({ secret: IdSchema }),
  z.strictObject({ lockedCount: z.strictObject({ gte: z.number().int().nonnegative() }) }),
] as const;

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    ...leafConditionSchemas,
    z.strictObject({ all: z.array(ConditionSchema).min(1) }),
    z.strictObject({ any: z.array(ConditionSchema).min(1) }),
  ]),
);

export const OutcomeConditionSchema: z.ZodType<OutcomeCondition> = z.lazy(() =>
  z.union([
    ...leafConditionSchemas,
    z.strictObject({ not: OutcomeConditionSchema }),
    z.strictObject({ all: z.array(OutcomeConditionSchema).min(1) }),
    z.strictObject({ any: z.array(OutcomeConditionSchema).min(1) }),
  ]),
);
