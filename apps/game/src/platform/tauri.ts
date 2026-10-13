/**
 * Adaptateur Tauri 2 (desktop + Android). Chargé uniquement par `import()` dynamique quand
 * `VITE_TARGET === 'tauri'` : rien de ce module n'entre dans le bundle web.
 *
 * Fichiers sous `$APPDATA/saves/` (seul dossier autorisé par la capability) :
 * - `<slot>.json` (partie), `<slot>.json.bak` (version précédente), `<slot>.summary.json` ;
 * - `profile.json` (+ `.bak`) ;
 * - `*.tmp` : écriture en cours, renommée ensuite (atomique sur le même volume).
 */
import {
  SAVE_SLOT_IDS,
  type Profile,
  type SaveSlotId,
  type SaveSlotSummary,
  type SaveState,
  type SaveStore,
} from '@arbre/contract';
import * as tauriApp from '@tauri-apps/api/app';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import {
  BaseDirectory,
  copyFile,
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  stat,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import {
  BackRegistry,
  MAX_IMPORT_BYTES,
  PlatformError,
  assertSlot,
  decodeImported,
  decodeStored,
  exportFileName,
  fallbackSummarize,
  isReadableJson,
  listenEscape,
  notFound,
  readSummary,
  serialize,
  summaryFromRaw,
  tooLarge,
  type GamePlatform,
  type Summarizer,
} from './common';
import { createMemorySaveStore } from './memory';

export const TAURI_STORAGE_WARNING =
  'Le dossier des sauvegardes est inaccessible : votre partie sera perdue à la fermeture.';

export const SAVES_DIR = 'saves';
const BASE = BaseDirectory.AppData;
const JSON_FILTERS = [{ name: 'Sauvegarde', extensions: ['json'] }];

const path = (name: string) => `${SAVES_DIR}/${name}`;
export const fileNames = {
  save: (slot: SaveSlotId) => `${slot}.json`,
  summary: (slot: SaveSlotId) => `${slot}.summary.json`,
  profile: 'profile.json',
  bak: (name: string) => `${name}.bak`,
  tmp: (name: string) => `${name}.tmp`,
};

function storageError(what: string, cause: unknown): PlatformError {
  return new PlatformError('storage', `Stockage indisponible : impossible de ${what}.`, { cause });
}

export interface TauriStoreOptions {
  summarize?: () => Summarizer;
}

export function createTauriSaveStore(opts: TauriStoreOptions = {}): SaveStore {
  const summarize = opts.summarize ?? (() => fallbackSummarize);
  let ready: Promise<void> | null = null;

  /** Crée `saves/` une fois ; réessaie au prochain appel en cas d'échec. */
  function ensureDir(): Promise<void> {
    ready ??= mkdir(SAVES_DIR, { baseDir: BASE, recursive: true }).catch((err: unknown) => {
      ready = null;
      throw err;
    });
    return ready;
  }

  async function readOpt(name: string): Promise<string | null> {
    if (!(await exists(path(name), { baseDir: BASE }))) return null;
    return readTextFile(path(name), { baseDir: BASE });
  }

  /** Écrit `name` via `name.tmp` puis renommage ; copie l'ancienne version en `.bak` si demandé. */
  async function atomicWrite(name: string, text: string, backup: boolean): Promise<void> {
    await ensureDir();
    const tmp = path(fileNames.tmp(name));
    await writeTextFile(tmp, text, { baseDir: BASE });
    if (backup && (await exists(path(name), { baseDir: BASE }))) {
      await copyFile(path(name), path(fileNames.bak(name)), {
        fromPathBaseDir: BASE,
        toPathBaseDir: BASE,
      });
    }
    await rename(tmp, path(name), { oldPathBaseDir: BASE, newPathBaseDir: BASE });
  }

  /** Texte du fichier principal, ou de `.bak` si le principal manque ou n'est pas du JSON. */
  async function readWithBackup(name: string): Promise<string | null> {
    const main = await readOpt(name).catch(() => null);
    if (main !== null && isReadableJson(main)) return main;
    const bak = await readOpt(fileNames.bak(name)).catch(() => null);
    if (bak !== null && isReadableJson(bak)) {
      console.warn(`[platform] ${name} illisible, repli sur la copie de secours`);
      return bak;
    }
    return main ?? bak;
  }

  async function listNames(): Promise<Set<string>> {
    try {
      const entries = await readDir(SAVES_DIR, { baseDir: BASE });
      return new Set(entries.filter((e) => e.isFile).map((e) => e.name));
    } catch {
      return new Set(); // dossier absent : aucune partie
    }
  }

  return {
    async list(): Promise<SaveSlotSummary[]> {
      const names = await listNames();
      const out: SaveSlotSummary[] = [];
      for (const slot of SAVE_SLOT_IDS) {
        const file = fileNames.save(slot);
        if (!names.has(file) && !names.has(fileNames.bak(file))) continue;
        const sumText = names.has(fileNames.summary(slot))
          ? await readOpt(fileNames.summary(slot)).catch(() => null)
          : null;
        const sum = readSummary(sumText, slot);
        if (sum) {
          out.push(sum);
          continue;
        }
        const raw = await readWithBackup(file);
        const fallback = raw === null ? null : summaryFromRaw(raw, slot, summarize());
        if (fallback) out.push(fallback);
      }
      return out;
    },

    async load(slot: SaveSlotId): Promise<unknown | null> {
      assertSlot(slot);
      return decodeStored(await readWithBackup(fileNames.save(slot)));
    },

    async save(slot: SaveSlotId, s: SaveState): Promise<void> {
      assertSlot(slot);
      const text = serialize(s);
      const summary = serialize(summarize()(s));
      try {
        await atomicWrite(fileNames.save(slot), text, true);
        await atomicWrite(fileNames.summary(slot), summary, false);
      } catch (err) {
        throw storageError('sauvegarder la partie', err);
      }
    },

    async remove(slot: SaveSlotId): Promise<void> {
      assertSlot(slot);
      const names = await listNames();
      const file = fileNames.save(slot);
      const sum = fileNames.summary(slot);
      const targets = [file, fileNames.bak(file), fileNames.tmp(file), sum, fileNames.tmp(sum)];
      try {
        for (const t of targets) if (names.has(t)) await remove(path(t), { baseDir: BASE });
      } catch (err) {
        throw storageError('supprimer la partie', err);
      }
    },

    async exportFile(slot: SaveSlotId): Promise<void> {
      assertSlot(slot);
      const text = await readWithBackup(fileNames.save(slot));
      if (text === null) throw notFound();
      const target = await saveDialog({
        title: 'Exporter la partie',
        defaultPath: exportFileName(slot),
        filters: JSON_FILTERS,
      });
      if (target === null) return;
      try {
        // Le chemin choisi dans le dialogue est ajouté au scope fs par plugin-dialog.
        await writeTextFile(target, text);
      } catch (err) {
        throw storageError('écrire le fichier exporté', err);
      }
    },

    async importFile(): Promise<unknown | null> {
      const picked = await openDialog({
        title: 'Importer une partie',
        multiple: false,
        directory: false,
        filters: JSON_FILTERS,
      });
      if (picked === null) return null;
      // Taille contrôlée AVANT la lecture : un fichier énorme n'est jamais chargé en mémoire.
      // `stat` indisponible (droit absent, plateforme) : la taille est contrôlée après lecture.
      let size: number | null = null;
      try {
        size = (await stat(picked)).size;
      } catch (err) {
        console.warn('[platform] taille du fichier importé inconnue', err);
      }
      if (size !== null && size > MAX_IMPORT_BYTES) throw tooLarge();
      let text: string;
      try {
        text = await readTextFile(picked);
      } catch (cause) {
        throw new PlatformError('unreadable', 'Fichier illisible.', { cause });
      }
      return decodeImported(text);
    },

    async loadProfile(): Promise<unknown | null> {
      return decodeStored(await readWithBackup(fileNames.profile));
    },

    async saveProfile(p: Profile): Promise<void> {
      try {
        await atomicWrite(fileNames.profile, serialize(p), true);
      } catch (err) {
        throw storageError('enregistrer le profil', err);
      }
    },
  };
}

type BackListener = { unregister(): Promise<void> };

/**
 * Retour Android : `onBackButtonPress` (@tauri-apps/api ≥ 2.9). L'écoute n'est active que tant
 * qu'un gestionnaire est inscrit, pour garder le comportement natif sinon. Si aucun gestionnaire
 * ne consomme l'appui, on reproduit le comportement natif (historique, sinon fermeture).
 * API absente : no-op (Échap reste disponible).
 */
function androidBack(registry: BackRegistry): (count: number) => void {
  const subscribe = (tauriApp as { onBackButtonPress?: typeof tauriApp.onBackButtonPress })
    .onBackButtonPress;
  if (typeof subscribe !== 'function') return () => {};
  let listener: Promise<BackListener | null> | null = null;
  return (count) => {
    if (count > 0 && !listener) {
      listener = subscribe(({ canGoBack }) => {
        if (registry.dispatch()) return;
        if (canGoBack) history.back();
        else void getCurrentWindow().close();
      }).catch((err: unknown) => {
        console.warn('[platform] retour Android indisponible', err);
        return null;
      });
    } else if (count === 0 && listener) {
      const l = listener;
      listener = null;
      void l.then((h) => h?.unregister());
    }
  };
}

export function detectKind(ua: string): 'android' | 'desktop' {
  return /android/i.test(ua) ? 'android' : 'desktop';
}

export async function createTauriPlatform(opts: TauriStoreOptions = {}): Promise<GamePlatform> {
  const kind = detectKind(typeof navigator === 'undefined' ? '' : navigator.userAgent);
  let onCount: (count: number) => void = () => {};
  const registry = new BackRegistry((count) => onCount(count));
  if (kind === 'android') onCount = androidBack(registry);
  if (typeof window !== 'undefined') listenEscape(window, registry);

  // Sonde : dossier des sauvegardes inaccessible → mode mémoire avec avertissement.
  let storageWarning: string | null = null;
  let saves: SaveStore;
  try {
    await mkdir(SAVES_DIR, { baseDir: BASE, recursive: true });
    saves = createTauriSaveStore(opts);
  } catch (err) {
    console.warn('[platform] dossier des sauvegardes inaccessible, mode mémoire', err);
    storageWarning = TAURI_STORAGE_WARNING;
    saves = createMemorySaveStore({ summarize: opts.summarize });
  }

  const platform: GamePlatform = {
    kind,
    storageWarning,
    saves,
    onBack: (cb) => registry.add(cb),
    quit: () => void getCurrentWindow().close(),
  };
  if (kind === 'desktop') {
    platform.setFullscreen = (on) => getCurrentWindow().setFullscreen(on);
  }
  return platform;
}
