/**
 * Point d'entrée de la plateforme (ARCHITECTURE §4). L'adaptateur est choisi au build par
 * `VITE_TARGET` ('tauri' | 'web', défaut web) ; le module Tauri n'est chargé que par `import()`
 * dynamique dans une branche éliminée du bundle web.
 */
import type { SaveSlotSummary, SaveState } from '@arbre/contract';
import { fallbackSummarize, type GamePlatform, type Summarizer } from './common';
import { createMemoryPlatform } from './memory';

export {
  MAX_IMPORT_BYTES,
  PlatformError,
  exportFileName,
  type GamePlatform,
  type PlatformErrorCode,
  type Summarizer,
} from './common';
export { MEMORY_STORAGE_WARNING, createMemoryPlatform } from './memory';

export type PlatformTarget = 'tauri' | 'web';

export function platformTarget(): PlatformTarget {
  return import.meta.env.VITE_TARGET === 'tauri' ? 'tauri' : 'web';
}

let summarizer: Summarizer = fallbackSummarize;

/**
 * Calcul des résumés de `list()`, écrits à chaque sauvegarde. L'app branche ici `summarize` du
 * moteur avec l'affaire compilée correspondant à `s.caseId` ; sans cela, résumé de repli
 * (titre = id de l'affaire, progression 0 ou 1).
 */
export function setSaveSummarizer(fn: (s: SaveState) => SaveSlotSummary): void {
  summarizer = fn;
}

const currentSummarizer = () => summarizer;

let instance: Promise<GamePlatform> | null = null;

async function create(): Promise<GamePlatform> {
  try {
    if (import.meta.env.VITE_TARGET === 'tauri') {
      const { createTauriPlatform } = await import('./tauri');
      return await createTauriPlatform({ summarize: currentSummarizer });
    }
    const { createWebPlatform } = await import('./web');
    return await createWebPlatform({ summarize: currentSummarizer });
  } catch (err) {
    console.error('[platform] initialisation impossible, mode mémoire', err);
    return createMemoryPlatform({
      summarize: currentSummarizer,
      keyTarget: typeof window === 'undefined' ? undefined : window,
    });
  }
}

/** Plateforme unique de l'app (créée au premier appel). */
export function getPlatform(): Promise<GamePlatform> {
  instance ??= create();
  return instance;
}

/** Tests : oublie l'instance. */
export function resetPlatformForTests(): void {
  instance = null;
  summarizer = fallbackSummarize;
}
