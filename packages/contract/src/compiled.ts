import type { OutcomeCondition } from './condition';
import type { CaseMeta } from './case';
import type { Block, DocumentFrontmatter } from './document';
import type { Occupation, Portrait } from './family';
import type { Locale } from './i18n';
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
import type {
  Achievement,
  CasePlace,
  Hint,
  Keyword,
  Progression,
  ReportQuestion,
} from './progression';
import type { Edition, SlotGuess } from './save';
import type { TreeSlot, ValidationGroup } from './tree';
import type { Place } from './world';

/** Hachages cyrb53(salt|slot|champ|normalize(v)). */
export interface SlotAnswer {
  given: string[];
  family: string[];
  /** Visage canonique puis autres âges (`Person.altPortraits`). */
  portrait: string[];
  occupation: string;
}

export interface CompiledDocument extends DocumentFrontmatter {
  id: DocumentId;
  body: Block[];
  keywords: KeywordId[];
}

export type CompiledKeyword = Omit<Keyword, 'terms'>;

export type CompiledSlot = Omit<TreeSlot, 'person' | 'claim'> & {
  /** Uniquement avec `prefilled` : posée et verrouillée par `newGame`. */
  prefilledGuess?: SlotGuess;
  /** Case revendiquée : posée par `newGame`, jamais verrouillée, jamais reposée. */
  claimedGuess?: SlotGuess;
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
  /** Sections dans l'ordre du fichier ; `when` absent = toujours affichée. */
  sections: {
    label: string | null;
    title: string | null;
    when?: OutcomeCondition;
    body: Block[];
  }[];
}

/** Seule donnée lue par le jeu (produite par `content:build`). */
export interface CompiledCase {
  format: 1;
  id: CaseId;
  edition: Edition;
  /**
   * Langue du texte compilé. Le sel, les réponses et la structure sont identiques d'une langue
   * à l'autre (D4) : seule cette donnée et les champs traduisibles changent.
   */
  // TODO: required after wave C1 (docs/i18n/PLAN.md §3) ; facultatif tant que A1/A2 ne l'émettent pas.
  locale?: Locale;
  /**
   * 8 hex. Empreinte **structurelle** : calculée sur les sources FR hors `locales/` (ids,
   * conditions, structure), identique pour toutes les langues d'une même édition.
   */
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
  report: ReportQuestion[];
  hints: Hint[];
  achievements: Achievement[];
  /** Noms proposables (lus dans les documents), pour la saisie par liste. */
  candidates: { given: string[]; family: string[] };
}
