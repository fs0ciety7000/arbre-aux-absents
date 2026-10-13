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
}

export const BODY_LABELS = {
  redacted: 'passage caviardé',
  stamp: 'Tampon',
  figure: 'Illustration',
  imageError: 'L’image n’a pas pu être chargée.',
};
