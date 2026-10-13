import type { OutcomeCondition } from './condition';
import type { CaseMeta } from './case';
import type { Block, DocumentFrontmatter } from './document';
import type { Occupation, Portrait } from './family';
import type {
  CaseId,
  DocumentId,
  EndingId,
  KeywordId,
  OccupationId,
  PlaceId,
  PortraitId,
  SlotId,
} from './ids';
import type { Achievement, CasePlace, Hint, Keyword, Progression } from './progression';
import type { Edition, SlotGuess } from './save';
import type { TreeSlot, ValidationGroup } from './tree';
import type { Place } from './world';

/** Hachages cyrb53(salt|slot|champ|normalize(v)). */
export interface SlotAnswer {
  given: string[];
  family: string[];
  portrait: string;
  occupation: string;
}

export interface CompiledDocument extends DocumentFrontmatter {
  id: DocumentId;
  body: Block[];
  keywords: KeywordId[];
}

export type CompiledKeyword = Omit<Keyword, 'terms'>;

export type CompiledSlot = Omit<TreeSlot, 'person'> & {
  prefilledGuess?: SlotGuess;
  answer: SlotAnswer;
  parents: SlotId[];
  unions: SlotId[];
};

export type CompiledPortrait = Portrait & { svg: string };

export type CompiledPlace = Place & Omit<CasePlace, 'place'>;

export interface CompiledEnding {
  when: OutcomeCondition;
  priority: number;
  title: string;
  body: Block[];
}

/** Seule donnée lue par le jeu (produite par `content:build`). */
export interface CompiledCase {
  format: 1;
  id: CaseId;
  edition: Edition;
  /** 8 hex */
  contentHash: string;
  salt: string;
  meta: CaseMeta;
  documents: Record<DocumentId, CompiledDocument>;
  /** Terme normalisé → mot-clé. */
  searchIndex: Record<string, KeywordId>;
  keywords: Record<KeywordId, CompiledKeyword>;
  slots: Record<SlotId, CompiledSlot>;
  groups: ValidationGroup[];
  portraits: Record<PortraitId, CompiledPortrait>;
  occupations: Record<OccupationId, Occupation>;
  places: Record<PlaceId, CompiledPlace>;
  progression: Pick<Progression, 'start' | 'unlocks' | 'occupationsUnlock' | 'secrets'>;
  endings: Record<EndingId, CompiledEnding>;
  hints: Hint[];
  achievements: Achievement[];
  /** Noms proposables (lus dans les documents), pour la saisie par liste. */
  candidates: { given: string[]; family: string[] };
}
