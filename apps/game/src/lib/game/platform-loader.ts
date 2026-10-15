import {
  createMemoryPlatform,
  getPlatform,
  setPlatformStrings,
  setSaveSummarizer,
  type GamePlatform,
} from '../../platform/index';
import { messages } from '../../i18n/index.svelte';
import type { SaveSlotSummary, SaveState } from '@arbre/contract';

export interface LoadedPlatform {
  platform: GamePlatform;
}

/**
 * Plateforme du jeu (`src/platform`, backend) : branche le résumé des sauvegardes du moteur
 * puis renvoie l'instance unique. Repli en mémoire si l'initialisation échoue.
 */
export async function loadPlatform(
  summarize: (s: SaveState) => SaveSlotSummary,
): Promise<LoadedPlatform> {
  setSaveSummarizer(summarize);
  // Textes de la plateforme (avertissements, dialogues de fichier) dans la langue courante.
  setPlatformStrings(() => messages.platform);
  try {
    const platform = await getPlatform();
    return { platform };
  } catch (err) {
    console.warn('[plateforme] repli en mémoire', err);
    return { platform: createMemoryPlatform() };
  }
}
