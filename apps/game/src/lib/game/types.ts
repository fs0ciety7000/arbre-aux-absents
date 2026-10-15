/**
 * Contrat interne de l'UI du jeu (orchestrateur) : interface entre le cœur de l'app
 * (`src/lib/game/**`, `src/screens/**`, `src/shell/**`) et les panneaux du Bureau (`src/panels/**`).
 * Les panneaux n'importent que ce fichier, `@arbre/engine` (sélecteurs, purs) et `@arbre/ui`.
 * Référence : docs/game/ECRANS.md §1.2 (ids P01–P16).
 */
import type {
  Action,
  CompiledCase,
  DocumentId,
  GameEvent,
  KeywordId,
  PlaceId,
  Profile,
  SaveState,
  SearchOutcome,
  Settings,
  SlotId,
} from '@arbre/contract';

/** Panneaux principaux du Bureau (onglets sur téléphone). */
export type PanelId =
  | 'tree' // P01
  | 'archives' // P02
  | 'reader' // P03
  | 'catalogue' // P04
  | 'notebook' // P05
  | 'map' // P06
  | 'pinboard' // P07
  | 'journal' // P08
  | 'help' // P09
  | 'faces'; // P11

/** Écrans hors partie (E01–E09) et le Bureau. */
export type ScreenId =
  | 'launch'
  | 'title'
  | 'slots'
  | 'new-game'
  | 'options'
  | 'achievements'
  | 'stats'
  | 'bonus'
  | 'credits'
  | 'desk'
  | 'ending';

/** Champ d'une case de l'arbre. */
export type SlotField = 'given' | 'family' | 'portrait' | 'occupation';

/** Cible de navigation transverse (un terme, un document, une case, un lieu). */
export type NavTarget =
  | { kind: 'document'; id: DocumentId; passage?: number[] }
  | { kind: 'keyword'; id: KeywordId }
  | { kind: 'slot'; id: SlotId; field?: SlotField }
  | { kind: 'place'; id: PlaceId }
  | { kind: 'panel'; id: PanelId };

/** État d'interface du Bureau (mémorisé pendant la session). */
export interface DeskUi {
  /** Panneau principal (desktop : zone centrale ; téléphone : onglet actif). */
  main: PanelId;
  /** Panneau latéral (desktop/tablette), null sur téléphone. */
  side: PanelId | null;
  openDocument: DocumentId | null;
  selectedSlot: SlotId | null;
  selectedPlace: PlaceId | null;
  /** Champ en cours d'édition (ouvre le sélecteur de candidat P10). */
  picking: { slot: SlotId; field: SlotField } | null;
  /** Dernière recherche affichée dans le Catalogue. */
  lastSearch: SearchOutcome | null;
}

/**
 * Store de partie (runes Svelte 5), fourni par le cœur via `setGame()` et lu par les panneaux
 * via `getGame()` (contexte Svelte, clé dans `context.ts`). Toutes les mutations de partie
 * passent par `dispatch` (moteur pur), qui sauvegarde automatiquement (ARCHITECTURE §4) et
 * diffuse les événements (annonces live, sons, toasts, cartes de révélation).
 */
export interface GameStore {
  readonly content: CompiledCase;
  readonly state: SaveState;
  readonly settings: Settings;
  readonly profile: Profile;
  readonly ui: DeskUi;
  dispatch(action: Action | DistributiveOmit<Action, 'at'>): GameEvent[];
  /** Navigation transverse : ouvre le bon panneau et sélectionne la cible. */
  navigate(target: NavTarget): void;
  /** Retour : ferme modal, puis panneau secondaire, puis ouvre la pause. */
  back(): void;
  /** Abonnement aux événements du moteur (retourne la désinscription). */
  onEvents(listener: (events: GameEvent[]) => void): () => void;
  updateSettings(patch: Partial<Settings>): void;
  /** Document en plein écran (couche posée par le Bureau). */
  readonly readerFull: boolean;
  setReaderFull(on: boolean): void;
  /** Ouvre un panneau (principal sur téléphone, latéral si pertinent sur grand écran). */
  showPanel(id: PanelId): void;
  /** Dernier mot-clé ciblé par `navigate` (le Carnet le met en avant). */
  readonly focusKeyword: KeywordId | null;
  /** Passage à surligner dans le Lecteur (chemin de bloc) après `navigate`. */
  readonly focusPassage: number[] | null;
  /** Cartes de révélation de la session, pour le Journal. */
  readonly reveals: RevealRecord[];
  /** Déclarations contestées de la session (case revendiquée), pour le Journal. */
  readonly contested: RevealRecord[];
  /** Fractionnés du mode chronométré (cases verrouillées à chaque étape). */
  readonly splits: Split[];
}

/** Carte de révélation archivée (session), lue par le Journal. */
export interface RevealRecord {
  at: number;
  title: string;
  lines: string[];
}

export interface Split {
  elapsedMs: number;
  count: number;
}

export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
