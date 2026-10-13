/**
 * Adaptateur en mémoire : tests, et mode secours quand aucun stockage persistant ne fonctionne
 * (navigation privée stricte, quota nul…). Les parties ne survivent pas à la fermeture :
 * `storageWarning` le dit à l'interface.
 */
import type { SaveStore } from '@arbre/contract';
import {
  BackRegistry,
  fallbackSummarize,
  listenEscape,
  type FileIo,
  type GamePlatform,
  type Summarizer,
} from './common';
import { createKvSaveStore, type KvBackend } from './kv-store';

export const MEMORY_STORAGE_WARNING =
  'Le stockage de ce navigateur est indisponible : votre partie sera perdue à la fermeture. ' +
  'Exportez-la pour la conserver.';

/** Pas de fichier possible : export ignoré, import annulé. */
export const NO_FILE_IO: FileIo = {
  exportText: async () => {},
  importText: async () => null,
};

export interface MemoryKv extends KvBackend {
  /** Accès direct aux textes stockés (tests). */
  readonly entries: Map<string, string>;
}

export function createMemoryKv(): MemoryKv {
  const entries = new Map<string, string>();
  return {
    name: 'memory',
    entries,
    get: async (key) => entries.get(key) ?? null,
    getMany: async (keys) => keys.map((k) => entries.get(k) ?? null),
    setMany: async (pairs) => {
      for (const [k, v] of pairs) entries.set(k, v);
    },
    deleteMany: async (keys) => {
      for (const k of keys) entries.delete(k);
    },
  };
}

export interface MemoryStoreOptions {
  /** Lu à chaque sauvegarde (l'app peut l'injecter après le chargement des affaires). */
  summarize?: () => Summarizer;
  io?: FileIo;
}

export function createMemorySaveStore(
  opts: MemoryStoreOptions = {},
  kv: MemoryKv = createMemoryKv(),
): SaveStore {
  return createKvSaveStore(kv, opts.summarize ?? (() => fallbackSummarize), opts.io ?? NO_FILE_IO);
}

export interface MemoryPlatformOptions extends MemoryStoreOptions {
  /** Message affiché ; `null` pour les tests. Défaut : `MEMORY_STORAGE_WARNING`. */
  storageWarning?: string | null;
  kind?: GamePlatform['kind'];
  /** Cible des touches (Échap) ; absente en test sans DOM. */
  keyTarget?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
}

export interface MemoryPlatform extends GamePlatform {
  readonly kv: MemoryKv;
  /** Simule un appui sur « retour » (tests) ; renvoie true si consommé. */
  back(): boolean;
}

export function createMemoryPlatform(opts: MemoryPlatformOptions = {}): MemoryPlatform {
  const registry = new BackRegistry();
  // Échap reste branché pour la durée de vie de la plateforme (singleton de l'app).
  if (opts.keyTarget) listenEscape(opts.keyTarget, registry);
  const kv = createMemoryKv();
  return {
    kind: opts.kind ?? 'web',
    kv,
    saves: createMemorySaveStore(opts, kv),
    storageWarning:
      opts.storageWarning === undefined ? MEMORY_STORAGE_WARNING : opts.storageWarning,
    onBack: (cb) => registry.add(cb),
    back: () => registry.dispatch(),
  };
}
