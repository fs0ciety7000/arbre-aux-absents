/** Options de rendu partagées par `DocumentBody` et ses inlines récursifs. */
import type { KeywordId, PortraitId } from '@arbre/contract';
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
  /** Marque dessinée (`::mark`, AFFAIRE-3 §1.6) : description verbale (texte de remplacement). */
  markAlt?: (portrait: PortraitId) => string;
  /** SVG d'une marque (`undefined` pendant le chargement, `null` si indisponible). */
  markSvg?: (portrait: PortraitId) => string | null | undefined;
  /** Agrandir une marque (toucher, clic, Entrée) : 320 px et « Utiliser dans l'arbre ». */
  onmark?: (portrait: PortraitId, el: HTMLElement) => void;
}

/** Textes du corps de document (langue courante : vue réactive du catalogue). */
export const BODY_LABELS = pm.reader;
