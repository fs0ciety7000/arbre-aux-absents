/**
 * Adaptateur web (démo itch.io, navigateur) : IndexedDB natif, repli localStorage, puis mémoire
 * avec avertissement. Export = téléchargement d'un `.json`, import = `<input type=file>`.
 * Aucune dépendance, aucun code Tauri.
 */
import {
  BackRegistry,
  MAX_IMPORT_BYTES,
  PlatformError,
  STORAGE_PREFIX,
  fallbackSummarize,
  listenEscape,
  platformStrings,
  readSystemLocales,
  tooLarge,
  webOpenExternal,
  withTimeout,
  type FileIo,
  type GamePlatform,
  type LanguageSource,
  type Summarizer,
  type WindowOpener,
} from './common';
import { createKvSaveStore, type KvBackend } from './kv-store';
import { createMemoryKv } from './memory';

export const IDB_NAME = STORAGE_PREFIX;
export const IDB_VERSION = 1;
export const IDB_STORE = 'kv';
export const LS_PREFIX = `${STORAGE_PREFIX}:`;
const IDB_TIMEOUT_MS = 3000;
/** Marqueur de l'entrée d'historique posée pour intercepter « précédent ». */
const HISTORY_MARK = '__arbreBack';

// ---------------------------------------------------------------------------------------------
// IndexedDB

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('IndexedDB : requête en échec'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB : transaction en échec'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB : transaction annulée'));
  });
}

export function openIdb(factory: IDBFactory, timeoutMs = IDB_TIMEOUT_MS): Promise<IDBDatabase> {
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const r = factory.open(IDB_NAME, IDB_VERSION);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE);
    };
    r.onsuccess = () => {
      const db = r.result;
      // Un autre onglet migre la base : on libère pour ne pas le bloquer.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    r.onerror = () => reject(r.error ?? new Error('IndexedDB : ouverture impossible'));
    r.onblocked = () => reject(new Error('IndexedDB : ouverture bloquée'));
  });
  return withTimeout(opening, timeoutMs, 'IndexedDB');
}

export function idbBackend(db: IDBDatabase): KvBackend {
  const asText = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  return {
    name: 'indexeddb',
    async get(key) {
      const tx = db.transaction(IDB_STORE, 'readonly');
      return asText(await req(tx.objectStore(IDB_STORE).get(key)));
    },
    async getMany(keys) {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const values = await Promise.all(keys.map((k) => req(store.get(k))));
      return values.map(asText);
    },
    async setMany(entries) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      for (const [k, v] of entries) store.put(v, k);
      await done(tx);
    },
    async deleteMany(keys) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      for (const k of keys) store.delete(k);
      await done(tx);
    },
    async keys(prefix) {
      const tx = db.transaction(IDB_STORE, 'readonly');
      // Quelques clés seulement (profil, 3 emplacements, un secours par affaire) : pas de plage.
      const all = await req(tx.objectStore(IDB_STORE).getAllKeys());
      return all.filter((k): k is string => typeof k === 'string' && k.startsWith(prefix));
    },
  };
}

// ---------------------------------------------------------------------------------------------
// localStorage

export function localStorageBackend(ls: Storage): KvBackend {
  const k = (key: string) => LS_PREFIX + key;
  return {
    name: 'localstorage',
    get: async (key) => ls.getItem(k(key)),
    getMany: async (keys) => keys.map((key) => ls.getItem(k(key))),
    async setMany(entries) {
      // Pas de transaction : on restaure les valeurs précédentes si une écriture échoue.
      const previous = entries.map(([key]) => [key, ls.getItem(k(key))] as const);
      try {
        for (const [key, v] of entries) ls.setItem(k(key), v);
      } catch (err) {
        for (const [key, v] of previous) {
          try {
            if (v === null) ls.removeItem(k(key));
            else ls.setItem(k(key), v);
          } catch {
            /* au mieux */
          }
        }
        throw err;
      }
    },
    deleteMany: async (keys) => {
      for (const key of keys) ls.removeItem(k(key));
    },
    async keys(prefix) {
      const full = k(prefix);
      const out: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (key !== null && key.startsWith(full)) out.push(key.slice(LS_PREFIX.length));
      }
      return out;
    },
  };
}

/** Vrai si localStorage accepte une écriture (Safari privé ancien : quota 0). */
export function probeLocalStorage(ls: Storage): boolean {
  const key = `${LS_PREFIX}probe`;
  try {
    ls.setItem(key, '1');
    ls.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------------
// Fichiers

/** Téléchargement d'un texte JSON via un lien `download` temporaire. */
export function downloadIo(doc: Document): FileIo['exportText'] {
  return async (fileName, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    try {
      const a = doc.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      a.style.display = 'none';
      doc.body.append(a);
      a.click();
      a.remove();
    } finally {
      // Laisse au navigateur le temps de démarrer le téléchargement.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  };
}

/** Choix d'un fichier `.json` ; `null` si annulé. Taille contrôlée avant lecture. */
export function filePickerIo(doc: Document, win: Window): FileIo['importText'] {
  return () =>
    new Promise<string | null>((resolve, reject) => {
      const input = doc.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        win.removeEventListener('focus', onFocus);
        input.remove();
        fn();
      };
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return finish(() => resolve(null));
        if (file.size > MAX_IMPORT_BYTES) return finish(() => reject(tooLarge()));
        file.text().then(
          (t) => finish(() => resolve(t)),
          (cause: unknown) =>
            finish(() => reject(new PlatformError('unreadable', 'Fichier illisible.', { cause }))),
        );
      });
      // Événement `cancel` (navigateurs récents) ; sinon, retour du focus sans fichier choisi.
      input.addEventListener('cancel', () => finish(() => resolve(null)));
      const onFocus = () => {
        setTimeout(() => {
          if (!input.files?.length) finish(() => resolve(null));
        }, 1000);
      };
      if (!('oncancel' in input)) win.addEventListener('focus', onFocus);
      doc.body.append(input);
      input.click();
    });
}

// ---------------------------------------------------------------------------------------------
// Plateforme

export interface WebPlatformDeps {
  window?: Window;
  document?: Document;
  /** `null` pour forcer l'absence d'IndexedDB. */
  indexedDB?: IDBFactory | null;
  /** `null` pour forcer l'absence de localStorage. */
  localStorage?: Storage | null;
  storageManager?: Pick<StorageManager, 'persist' | 'persisted'> | null;
  summarize?: () => Summarizer;
  /** Remplace téléchargement et sélecteur (tests). */
  io?: FileIo;
  idbTimeoutMs?: number;
  /** Intercepte « précédent » du navigateur via une entrée d'historique (défaut : true). */
  useHistory?: boolean;
  /** Source des langues du système (défaut : `navigator`) ; `null` pour aucune. */
  navigator?: LanguageSource | null;
  /** Ouverture des liens externes (défaut : `window`). */
  opener?: WindowOpener;
}

export interface WebPlatform extends GamePlatform {
  /** Stockage effectivement utilisé. */
  readonly backend: KvBackend['name'];
}

function safe<T>(get: () => T): T | null {
  try {
    return get() ?? null;
  } catch {
    return null;
  }
}

async function pickBackend(deps: WebPlatformDeps): Promise<{ kv: KvBackend; memory: boolean }> {
  const factory = deps.indexedDB !== undefined ? deps.indexedDB : safe(() => globalThis.indexedDB);
  if (factory) {
    try {
      const db = await openIdb(factory, deps.idbTimeoutMs);
      const kv = idbBackend(db);
      await kv.get('profile'); // sonde : certains navigateurs ouvrent puis refusent les lectures
      return { kv, memory: false };
    } catch (err) {
      console.warn('[platform] IndexedDB indisponible, repli localStorage', err);
    }
  }
  const ls =
    deps.localStorage !== undefined ? deps.localStorage : safe(() => globalThis.localStorage);
  if (ls && probeLocalStorage(ls)) return { kv: localStorageBackend(ls), memory: false };
  console.warn('[platform] aucun stockage persistant, mode mémoire');
  return { kv: createMemoryKv(), memory: true };
}

/** Demande un stockage persistant (Safari/Firefox purgent l'iframe itch sinon). Au mieux. */
async function requestPersistence(sm: WebPlatformDeps['storageManager']): Promise<void> {
  try {
    if (sm && !(await sm.persisted())) await sm.persist();
  } catch {
    /* refus ou API absente : l'export manuel reste proposé */
  }
}

export async function createWebPlatform(deps: WebPlatformDeps = {}): Promise<WebPlatform> {
  const win = deps.window ?? (typeof window === 'undefined' ? undefined : window);
  const doc = deps.document ?? (typeof document === 'undefined' ? undefined : document);
  const { kv, memory } = await pickBackend(deps);
  const sm =
    deps.storageManager !== undefined
      ? deps.storageManager
      : safe(() => globalThis.navigator?.storage);
  void requestPersistence(sm);

  const io: FileIo = deps.io ?? {
    exportText: doc ? downloadIo(doc) : async () => {},
    importText: doc && win ? filePickerIo(doc, win) : async () => null,
  };

  const registry = new BackRegistry((count) => {
    if (count > 0) armHistory();
  });
  const useHistory = (deps.useHistory ?? true) && !!win;

  function armHistory(): void {
    if (!useHistory || !win) return;
    try {
      const state: unknown = win.history.state;
      const marked =
        typeof state === 'object' && state !== null && HISTORY_MARK in (state as object);
      if (!marked) win.history.pushState({ [HISTORY_MARK]: true }, '');
    } catch {
      /* historique inaccessible (iframe sandboxée) : Échap reste disponible */
    }
  }

  if (win) {
    listenEscape(win, registry);
    if (useHistory) {
      win.addEventListener('popstate', () => {
        if (registry.size === 0) return;
        // Consommé : on remet l'entrée pour intercepter le prochain « précédent ».
        if (registry.dispatch()) armHistory();
      });
    }
  }

  const fullscreenOk = !!doc && safe(() => doc.fullscreenEnabled) === true;
  const nav: LanguageSource | null =
    deps.navigator !== undefined ? deps.navigator : safe(() => globalThis.navigator);

  const platform: WebPlatform = {
    kind: 'web',
    backend: kv.name,
    // Relu à chaque accès : suit la langue de l'interface (`platformStrings`).
    get storageWarning() {
      return memory ? platformStrings().storageMemory : null;
    },
    saves: createKvSaveStore(kv, deps.summarize ?? (() => fallbackSummarize), io),
    onBack: (cb) => registry.add(cb),
    // Relu à chaque appel : `languagechange` peut modifier les préférences en cours de partie.
    systemLocales: () => readSystemLocales(nav),
    openExternal: webOpenExternal(deps.opener ?? win),
  };
  if (fullscreenOk && doc) {
    platform.setFullscreen = async (on) => {
      if (on && !doc.fullscreenElement) await doc.documentElement.requestFullscreen();
      else if (!on && doc.fullscreenElement) await doc.exitFullscreen();
    };
  }
  return platform;
}
