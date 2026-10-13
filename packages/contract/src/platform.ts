import type { Profile } from './settings';
import type { SaveSlotId, SaveSlotSummary, SaveState } from './save';

/** Stockage des parties et du profil. Tout import passe par `parseSave`. */
export interface SaveStore {
  list(): Promise<SaveSlotSummary[]>;
  load(slot: SaveSlotId): Promise<unknown | null>;
  save(slot: SaveSlotId, s: SaveState): Promise<void>;
  remove(slot: SaveSlotId): Promise<void>;
  exportFile(slot: SaveSlotId): Promise<void>;
  importFile(): Promise<unknown | null>;
  loadProfile(): Promise<unknown | null>;
  saveProfile(p: Profile): Promise<void>;
}

export type PlatformKind = 'web' | 'desktop' | 'android';

/** Seule dépendance du cœur web envers le shell (ARCHITECTURE §4). */
export interface Platform {
  kind: PlatformKind;
  saves: SaveStore;
  setFullscreen?(on: boolean): Promise<void>;
  /** Retourne une fonction de désinscription ; `cb` renvoie true si l'événement est consommé. */
  onBack(cb: () => boolean): () => void;
  quit?(): void;
}
