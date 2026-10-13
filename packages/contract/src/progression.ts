import { z } from 'zod';
import type { Condition, OutcomeCondition } from './condition';
import { ConditionSchema, OutcomeConditionSchema } from './condition';
import type {
  AchievementId,
  DocumentId,
  EndingId,
  GroupId,
  HintId,
  KeywordId,
  OccupationId,
  PlaceId,
  SecretId,
  SlotId,
} from './ids';
import { IdSchema, TextSchema } from './ids';

export const KEYWORD_KINDS = [
  'person',
  'place',
  'organization',
  'event',
  'object',
  'other',
] as const;
export type KeywordKind = (typeof KEYWORD_KINDS)[number];

/** Mot-clé du moteur de recherche fictif (`progression.json`, level-designer). */
export interface Keyword {
  id: KeywordId;
  label: string;
  kind: KeywordKind;
  /** Variantes, normalisées et uniques au build. */
  terms: string[];
  /** Défaut true. */
  autolink?: boolean;
  /** Jamais écrit tel quel : déduction du joueur. */
  hiddenTerm?: boolean;
  results: { documents: DocumentId[]; requires?: Condition }[];
}

export interface CasePlace {
  place: PlaceId;
  revealedBy?: Condition;
  documents: { id: DocumentId; requires?: Condition }[];
}

export interface Secret {
  id: SecretId;
  title: string;
  discoveredBy: Condition;
}

export interface EndingSpec {
  id: EndingId;
  /** `endings/<id>.md` */
  file: string;
  when: OutcomeCondition;
  priority: number;
}

export interface DemoSpec {
  documents: DocumentId[];
  slots: SlotId[];
  end: DocumentId;
}

export interface Progression {
  start: DocumentId[];
  unlocks: Record<DocumentId, Condition>;
  keywords: Keyword[];
  places: CasePlace[];
  occupationsUnlock?: Record<OccupationId, Condition>;
  secrets: Secret[];
  endings: EndingSpec[];
  demo?: DemoSpec;
}

/** `hints.json` : tableau de `Hint` (level-designer). */
export interface Hint {
  id: HintId;
  target: { slot: SlotId } | { group: GroupId };
  level: 1 | 2 | 3;
  text: string;
  availableWhen: Condition;
}

export type AchievementCondition =
  | OutcomeCondition
  | { endingReached: EndingId }
  | { timedUnderMs: number }
  | { allSecrets: true }
  | { all: AchievementCondition[] };

/** `achievements.json` : tableau d'`Achievement` (level-designer). */
export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  hidden: boolean;
  when: AchievementCondition;
}

export const ENDING_FILE = /^endings\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

const ResultSchema = z.strictObject({
  documents: z.array(IdSchema).min(1),
  requires: ConditionSchema.optional(),
});

export const KeywordSchema = z.strictObject({
  id: IdSchema,
  label: TextSchema,
  kind: z.enum(KEYWORD_KINDS),
  terms: z.array(TextSchema).min(1),
  autolink: z.boolean().optional(),
  hiddenTerm: z.boolean().optional(),
  results: z.array(ResultSchema).min(1),
});

export const CasePlaceSchema = z.strictObject({
  place: IdSchema,
  revealedBy: ConditionSchema.optional(),
  documents: z.array(z.strictObject({ id: IdSchema, requires: ConditionSchema.optional() })),
});

export const SecretSchema = z.strictObject({
  id: IdSchema,
  title: TextSchema,
  discoveredBy: ConditionSchema,
});

export const EndingSpecSchema = z.strictObject({
  id: IdSchema,
  file: z.string().regex(ENDING_FILE, { error: 'Chemin attendu : endings/<id>.md' }),
  when: OutcomeConditionSchema,
  priority: z.number().int(),
});

export const DemoSpecSchema = z.strictObject({
  documents: z.array(IdSchema).min(1),
  slots: z.array(IdSchema),
  end: IdSchema,
});

export const ProgressionSchema = z.strictObject({
  start: z.array(IdSchema).min(1),
  unlocks: z.record(IdSchema, ConditionSchema),
  keywords: z.array(KeywordSchema),
  places: z.array(CasePlaceSchema),
  occupationsUnlock: z.record(IdSchema, ConditionSchema).optional(),
  secrets: z.array(SecretSchema),
  endings: z.array(EndingSpecSchema).min(1),
  demo: DemoSpecSchema.optional(),
});

export const HintSchema = z.strictObject({
  id: IdSchema,
  target: z.union([z.strictObject({ slot: IdSchema }), z.strictObject({ group: IdSchema })]),
  level: z.literal([1, 2, 3]),
  text: TextSchema,
  availableWhen: ConditionSchema,
});

export const HintsFileSchema = z.array(HintSchema);

export const AchievementConditionSchema: z.ZodType<AchievementCondition> = z.lazy(() =>
  z.union([
    OutcomeConditionSchema,
    z.strictObject({ endingReached: IdSchema }),
    z.strictObject({ timedUnderMs: z.number().int().positive() }),
    z.strictObject({ allSecrets: z.literal(true) }),
    z.strictObject({ all: z.array(AchievementConditionSchema).min(1) }),
  ]),
);

export const AchievementSchema = z.strictObject({
  id: IdSchema,
  title: TextSchema,
  description: TextSchema,
  hidden: z.boolean(),
  when: AchievementConditionSchema,
});

export const AchievementsFileSchema = z.array(AchievementSchema);
