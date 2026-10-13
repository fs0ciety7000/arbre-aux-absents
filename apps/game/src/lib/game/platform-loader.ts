import { getPlatform, setSaveSummarizer, type GamePlatform } from '../../platform/index';
import { createMemoryPlatform } from '../../platform/index';
import type { SaveSlotSummary, SaveState } from '@arbre/contract';

export interface LoadedPlatform {
  platform: GamePlatform;
  /** Avertissement de stockage (mode secours, iframe itch…) ou null. */
  storageWarning: string | null;
}

/**
 * Plateforme du jeu (`src/platform`, backend) : branche le résumé des sauvegardes du moteur
 * puis renvoie l'instance unique. Repli en mémoire si l'initialisation échoue.
 */
export async function loadPlatform(
  summarize: (s: SaveState) => SaveSlotSummary,
): Promise<LoadedPlatform> {
  setSaveSummarizer(summarize);
  try {
    const platform = await getPlatform();
    return { platform, storageWarning: platform.storageWarning };
  } catch (err) {
    console.warn('[plateforme] repli en mémoire', err);
    const platform = createMemoryPlatform();
    return { platform, storageWarning: platform.storageWarning };
  }
}
