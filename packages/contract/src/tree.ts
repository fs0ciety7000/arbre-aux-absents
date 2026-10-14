import { z } from 'zod';
import type { Condition } from './condition';
import { ConditionSchema } from './condition';
import type { GroupId, OccupationId, PersonId, PortraitId, SlotId } from './ids';
import { IdSchema, TextSchema } from './ids';

/**
 * Identité déclarée posée d'emblée sur une case revendiquée : fausse sur au moins un champ
 * (vérifié par `content:check`), jamais verrouillée.
 */
export interface SlotClaim {
  given?: string;
  family?: string;
  portrait?: PortraitId;
  occupation?: OccupationId;
}

/** Case de l'arbre (`tree.json`, level-designer). */
export interface TreeSlot {
  id: SlotId;
  person: PersonId;
  generation: number;
  column: number;
  /** Connue d'emblée et établie (tutoriel). Exclue des groupes. */
  prefilled?: boolean;
  /** Case revendiquée : pré-remplie, contestable, dans un groupe. Exclusive de `prefilled` et `revealedBy`. */
  claim?: SlotClaim;
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

export const SlotClaimSchema = z
  .strictObject({
    given: TextSchema.optional(),
    family: TextSchema.optional(),
    portrait: IdSchema.optional(),
    occupation: IdSchema.optional(),
  })
  .refine((c) => Object.keys(c).length > 0, { error: 'Revendication vide' });

export const TreeSlotSchema = z
  .strictObject({
    id: IdSchema,
    person: IdSchema,
    generation: z.number().int().nonnegative(),
    column: z.number().int().nonnegative(),
    prefilled: z.boolean().optional(),
    claim: SlotClaimSchema.optional(),
    revealedBy: ConditionSchema.optional(),
  })
  .refine((s) => !(s.prefilled && s.claim), {
    error: 'claim et prefilled sont exclusifs',
    path: ['claim'],
  })
  .refine((s) => !(s.claim && s.revealedBy), {
    error: "Une case revendiquée est visible d'emblée",
    path: ['claim'],
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
