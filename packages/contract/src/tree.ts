import { z } from 'zod';
import type { Condition } from './condition';
import { ConditionSchema } from './condition';
import type { GroupId, PersonId, SlotId } from './ids';
import { IdSchema, TextSchema } from './ids';

/** Case de l'arbre (`tree.json`, level-designer). */
export interface TreeSlot {
  id: SlotId;
  person: PersonId;
  generation: number;
  column: number;
  /** Connue d'emblée (tutoriel). */
  prefilled?: boolean;
  /** Branche cachée. */
  revealedBy?: Condition;
}

export interface ValidationGroup {
  id: GroupId;
  label: string;
  slots: SlotId[];
  /** ≥ 3 */
  threshold: number;
}

export interface TreeSpec {
  slots: TreeSlot[];
  groups: ValidationGroup[];
}

export const MIN_GROUP_THRESHOLD = 3;

export const TreeSlotSchema = z.strictObject({
  id: IdSchema,
  person: IdSchema,
  generation: z.number().int().nonnegative(),
  column: z.number().int().nonnegative(),
  prefilled: z.boolean().optional(),
  revealedBy: ConditionSchema.optional(),
});

export const ValidationGroupSchema = z.strictObject({
  id: IdSchema,
  label: TextSchema,
  slots: z.array(IdSchema).min(1),
  threshold: z.number().int().min(MIN_GROUP_THRESHOLD),
});

export const TreeSpecSchema = z.strictObject({
  slots: z.array(TreeSlotSchema).min(1),
  groups: z.array(ValidationGroupSchema),
});
