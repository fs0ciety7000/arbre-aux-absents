/** Options de rendu partagées par `DocumentBody` et ses inlines récursifs. */
import type { KeywordId } from '@arbre/contract';
import { pm } from '../messages';

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

/** Textes du corps de document (langue courante : vue réactive du catalogue). */
export const BODY_LABELS = pm.reader;
