/** Options de rendu partagées par `DocumentBody` et ses inlines récursifs. */
import type { KeywordId } from '@arbre/contract';

export type KeywordState = 'new' | 'known' | 'searched';
export type ReadMode = 'original' | 'transcript';

export interface BodyOptions {
  mode: ReadMode;
  /** Copie décorative (loupe) : rien de focalisable, rien d'annoncé. */
  decorative: boolean;
  kwState: (kw: KeywordId) => KeywordState;
  onkeyword?: (kw: KeywordId, label: string, el: HTMLElement) => void;
  /** Glisser un mot-clé (vers l'arbre). */
  onkeyworddrag?: (kw: KeywordId, label: string, e: DragEvent) => void;
  /** Id de la description cachée d'un état (posé par la racine de `DocumentBody`). */
  kwDescription?: (state: KeywordState) => string;
}

export const BODY_LABELS = {
  redacted: 'passage caviardé',
  stamp: 'Tampon',
  figure: 'Illustration',
  imageError: 'L’image n’a pas pu être chargée.',
  imageLoading: 'Chargement de l’illustration…',
  /** État d'un mot-clé, pour les lecteurs d'écran (le style seul ne suffit pas). */
  kwState: {
    new: 'nouveau mot-clé',
    known: 'mot-clé déjà rencontré',
    searched: 'déjà consulté au Catalogue',
  } satisfies Record<KeywordState, string>,
};
