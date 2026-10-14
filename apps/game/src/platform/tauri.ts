/**
 * Adaptateur Tauri 2 (desktop + Android). Chargé uniquement par `import()` dynamique quand
 * `VITE_TARGET === 'tauri'` : rien de ce module n'entre dans le bundle web.
 *
 * Fichiers sous `$APPDATA/saves/` (seul dossier autorisé par la capability) :
 * - `<slot>.json` (partie), `<slot>.json.bak` (version précédente), `<slot>.summary.json` pour les
 *   emplacements manuels `slot-1` à `slot-3` ;
 * - `auto.<affaire>.json` (+ `.bak`, `auto.<affaire>.summary.json`) : secours, un par affaire
 *   (AFFAIRE-2 §2.3). L'ancien secours commun `auto.json` est rangé sous son affaire au premier accès ;
 * - `profile.json` (+ `.bak`) ;
 * - `*.tmp` : écriture en cours, renommée ensuite (atomique sur le même volume).
 */
import { SAVE_SLOT_IDS, type Profile, type SaveSlotId, type SaveState } from '@arbre/contract';
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
  assertCaseId,
  assertSlot,
  caseIdOfRaw,
  decodeImported,
  decodeStored,
  exportFileName,
  fallbackSummarize,
  isCaseId,
  isReadableJson,
  latestBackup,
  listenEscape,
  notFound,
  readSummary,
  serialize,
  summaryFromRaw,
  tooLarge,
  withCase,
  type GamePlatform,
  type GameSaveStore,
  type GameSlotSummary,
  type Summarizer,
} from './common';
import { createMemorySaveStore } from './memory';

export const TAURI_STORAGE_WARNING =
  'Le dossier des sauvegardes est inaccessible : votre partie sera perdue à la fermeture.';

export const SAVES_DIR = 'saves';
const BASE = BaseDirectory.AppData;
const JSON_FILTERS = [{ name: 'Sauvegarde', extensions: ['json'] }];

const path = (name: string) => `${SAVES_DIR}/${name}`;
const BACKUP_FILE = /^auto\.([a-z0-9-]+)\.json(?:\.bak)?$/;
const MANUAL_SLOTS = SAVE_SLOT_IDS.filter((s) => s !== 'auto');
export const fileNames = {
  /** Emplacement manuel ; `save('auto')` est l'ancien secours commun (lu pour migration). */
  save: (slot: SaveSlotId) => `${slot}.json`,
  summary: (slot: SaveSlotId) => `${slot}.summary.json`,
  /** Secours de l'affaire `caseId` (kebab-case : aucun point, aucun séparateur de chemin). */
  backup: (caseId: string) => `auto.${caseId}.json`,
  backupSummary: (caseId: string) => `auto.${caseId}.summary.json`,
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

export function createTauriSaveStore(opts: TauriStoreOptions = {}): GameSaveStore {
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

  /** Supprime les fichiers d'une partie (principal, `.bak`, `.tmp`, résumé) présents. */
  async function removeFiles(file: string, sum: string, names: Set<string>): Promise<void> {
    const targets = [file, fileNames.bak(file), fileNames.tmp(file), sum, fileNames.tmp(sum)];
    for (const t of targets) if (names.has(t)) await remove(path(t), { baseDir: BASE });
  }

  /** Vrai une fois l'ancien secours commun traité (ou absent). */
  let legacyDone = false;

  /**
   * Ancien `auto.json` (avant l'affaire 2) → secours de son affaire, sans perte : copié si cette
   * affaire n'a pas déjà son propre secours, puis effacé. Illisible : laissé tel quel, ignoré.
   */
  async function migrateLegacy(what: string): Promise<void> {
    if (legacyDone) return;
    const file = fileNames.save('auto');
    const names = await listNames();
    if (!names.has(file) && !names.has(fileNames.bak(file))) {
      legacyDone = true;
      return;
    }
    const raw = await readWithBackup(file);
    const caseId = raw === null ? null : caseIdOfRaw(raw);
    if (raw === null || caseId === null) {
      legacyDone = true;
      return;
    }
    try {
      const target = fileNames.backup(caseId);
      if (!names.has(target) && !names.has(fileNames.bak(target))) {
        await atomicWrite(target, raw, false);
        const sum = await readOpt(fileNames.summary('auto')).catch(() => null);
        if (sum !== null) await atomicWrite(fileNames.backupSummary(caseId), sum, false);
      }
      await removeFiles(file, fileNames.summary('auto'), names);
      legacyDone = true;
    } catch (err) {
      throw storageError(what, err);
    }
  }

  async function listBackups(names: Set<string>): Promise<GameSlotSummary[]> {
    const ids = new Set<string>();
    for (const n of names) {
      const id = BACKUP_FILE.exec(n)?.[1];
      if (id !== undefined && isCaseId(id)) ids.add(id);
    }
    const out: GameSlotSummary[] = [];
    for (const id of [...ids].sort()) {
      const sumName = fileNames.backupSummary(id);
      const sumText = names.has(sumName) ? await readOpt(sumName).catch(() => null) : null;
      const sum = readSummary(sumText, 'auto');
      if (sum) {
        out.push(withCase(sum, id));
        continue;
      }
      const raw = await readWithBackup(fileNames.backup(id)).catch(() => null);
      if (raw === null || caseIdOfRaw(raw) !== id) continue;
      const fallback = summaryFromRaw(raw, 'auto', summarize());
      if (fallback) out.push(withCase(fallback, id));
    }
    return out;
  }

  /** Affaire du secours visé : `caseId` donné, sinon le secours le plus récent. */
  async function backupCase(caseId: string | undefined, what: string): Promise<string | null> {
    await migrateLegacy(what);
    if (caseId !== undefined) {
      assertCaseId(caseId);
      return caseId;
    }
    return latestBackup(await listBackups(await listNames()));
  }

  return {
    async list(): Promise<GameSlotSummary[]> {
      await migrateLegacy('lister les parties');
      const names = await listNames();
      const out: GameSlotSummary[] = [];
      for (const slot of MANUAL_SLOTS) {
        const file = fileNames.save(slot);
        if (!names.has(file) && !names.has(fileNames.bak(file))) continue;
        const sumText = names.has(fileNames.summary(slot))
          ? await readOpt(fileNames.summary(slot)).catch(() => null)
          : null;
        const sum = readSummary(sumText, slot);
        if (sum) {
          out.push(withCase(sum, null));
          continue;
        }
        const raw = await readWithBackup(file);
        const fallback = raw === null ? null : summaryFromRaw(raw, slot, summarize());
        if (fallback) out.push(withCase(fallback, null));
      }
      out.push(...(await listBackups(names)));
      return out;
    },

    async load(slot: SaveSlotId, caseId?: string): Promise<unknown | null> {
      assertSlot(slot);
      if (slot !== 'auto') return decodeStored(await readWithBackup(fileNames.save(slot)));
      const id = await backupCase(caseId, 'charger la partie');
      return id === null ? null : decodeStored(await readWithBackup(fileNames.backup(id)));
    },

    async save(slot: SaveSlotId, s: SaveState): Promise<void> {
      assertSlot(slot);
      const what = 'sauvegarder la partie';
      let file = fileNames.save(slot);
      let sumFile = fileNames.summary(slot);
      if (slot === 'auto') {
        // Le secours d'une partie va toujours sous SON affaire (AFFAIRE-2 §2.3).
        assertCaseId(s.caseId);
        await migrateLegacy(what);
        file = fileNames.backup(s.caseId);
        sumFile = fileNames.backupSummary(s.caseId);
      }
      const text = serialize(s);
      const summary = serialize(summarize()(s));
      try {
        await atomicWrite(file, text, true);
        await atomicWrite(sumFile, summary, false);
      } catch (err) {
        throw storageError(what, err);
      }
    },

    async remove(slot: SaveSlotId, caseId?: string): Promise<void> {
      assertSlot(slot);
      const what = 'supprimer la partie';
      let file = fileNames.save(slot);
      let sumFile = fileNames.summary(slot);
      if (slot === 'auto') {
        const id = await backupCase(caseId, what);
        if (id === null) return;
        file = fileNames.backup(id);
        sumFile = fileNames.backupSummary(id);
      }
      const names = await listNames();
      try {
        await removeFiles(file, sumFile, names);
      } catch (err) {
        throw storageError(what, err);
      }
    },

    async exportFile(slot: SaveSlotId, caseId?: string): Promise<void> {
      assertSlot(slot);
      let file = fileNames.save(slot);
      let id: string | null = null;
      if (slot === 'auto') {
        id = await backupCase(caseId, 'exporter la partie');
        if (id === null) throw notFound();
        file = fileNames.backup(id);
      }
      const text = await readWithBackup(file);
      if (text === null) throw notFound();
      const target = await saveDialog({
        title: 'Exporter la partie',
        defaultPath: exportFileName(slot, new Date(), id),
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
  let saves: GameSaveStore;
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
