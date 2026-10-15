/**
 * `SaveStore` générique sur un stockage clé → texte (IndexedDB, localStorage). Chaque partie est
 * écrite avec son résumé dans la même opération, pour que `list()` ne lise que les résumés.
 *
 * Clés : `save:slot-N` / `summary:slot-N` (emplacements manuels, communs) ;
 * `save:auto:<affaire>` / `summary:auto:<affaire>` (secours, un par affaire, AFFAIRE-2 §2.3).
 * L'ancien secours commun `save:auto` est rangé sous sa propre affaire au premier accès.
 */
import { SAVE_SLOT_IDS, type Profile, type SaveSlotId, type SaveState } from '@arbre/contract';
import {
  PlatformError,
  assertCaseId,
  assertSlot,
  caseIdOfRaw,
  caseIdOfSummary,
  isCaseId,
  decodeImported,
  decodeStored,
  exportFileName,
  notFound,
  readSummary,
  serialize,
  summaryFromRaw,
  summaryToStore,
  latestBackup,
  withCase,
  type FileIo,
  type GameSaveStore,
  type GameSlotSummary,
  type Summarizer,
} from './common';

export interface KvBackend {
  readonly name: 'indexeddb' | 'localstorage' | 'memory';
  get(key: string): Promise<string | null>;
  getMany(keys: string[]): Promise<Array<string | null>>;
  /** Écrit toutes les paires ou aucune (au mieux pour localStorage). */
  setMany(entries: Array<[string, string]>): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  /** Clés qui commencent par `prefix` (ordre quelconque). */
  keys(prefix: string): Promise<string[]>;
}

export const KEYS = {
  /** Emplacement manuel ; `save('auto')` est l'ancien secours commun (lu pour migration). */
  save: (slot: SaveSlotId) => `save:${slot}`,
  summary: (slot: SaveSlotId) => `summary:${slot}`,
  /** Secours de l'affaire `caseId`. */
  backup: (caseId: string) => `save:auto:${caseId}`,
  backupSummary: (caseId: string) => `summary:auto:${caseId}`,
  backupPrefix: 'save:auto:',
  profile: 'profile',
} as const;

const MANUAL_SLOTS = SAVE_SLOT_IDS.filter((s) => s !== 'auto');

function storageError(what: string, cause: unknown): PlatformError {
  const quota =
    cause instanceof Error && (cause.name === 'QuotaExceededError' || /quota/i.test(cause.message));
  return new PlatformError(
    'storage',
    quota
      ? `Espace de stockage plein : impossible de ${what}. Exportez vos parties.`
      : `Stockage indisponible : impossible de ${what}.`,
    { cause },
  );
}

export function createKvSaveStore(
  kv: KvBackend,
  summarize: () => Summarizer,
  io: FileIo,
): GameSaveStore {
  async function read(key: string, what: string): Promise<string | null> {
    try {
      return await kv.get(key);
    } catch (err) {
      throw storageError(what, err);
    }
  }

  /** Vrai une fois l'ancien secours commun traité (ou absent) : plus aucune lecture ensuite. */
  let legacyDone = false;

  /**
   * Ancien secours commun (`save:auto`, avant l'affaire 2) → secours de son affaire, sans perte :
   * copié seulement si cette affaire n'a pas déjà un secours plus récent, puis effacé.
   * Illisible : laissé tel quel (jamais supprimé), et ignoré.
   */
  async function migrateLegacy(what: string): Promise<void> {
    if (legacyDone) return;
    const raw = await read(KEYS.save('auto'), what);
    const caseId = raw === null ? null : caseIdOfRaw(raw);
    if (raw === null || caseId === null) {
      legacyDone = true;
      return;
    }
    try {
      const [current, sum] = await kv.getMany([KEYS.backup(caseId), KEYS.summary('auto')]);
      if (current === null) {
        const entries: Array<[string, string]> = [[KEYS.backup(caseId), raw]];
        if (sum != null) entries.push([KEYS.backupSummary(caseId), sum]);
        await kv.setMany(entries);
      }
      await kv.deleteMany([KEYS.save('auto'), KEYS.summary('auto')]);
      legacyDone = true;
    } catch (err) {
      throw storageError(what, err);
    }
  }

  async function listBackups(what: string): Promise<GameSlotSummary[]> {
    let ids: string[];
    try {
      ids = (await kv.keys(KEYS.backupPrefix))
        .map((k) => k.slice(KEYS.backupPrefix.length))
        .filter(isCaseId)
        .sort();
    } catch (err) {
      throw storageError(what, err);
    }
    let sums: Array<string | null>;
    try {
      sums = await kv.getMany(ids.map(KEYS.backupSummary));
    } catch (err) {
      throw storageError(what, err);
    }
    const out: GameSlotSummary[] = [];
    for (const [i, id] of ids.entries()) {
      const sum = readSummary(sums[i] ?? null, 'auto');
      if (sum) {
        out.push(withCase(sum, id));
        continue;
      }
      const raw = await read(KEYS.backup(id), what);
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
    return latestBackup(await listBackups(what));
  }

  return {
    async list(): Promise<GameSlotSummary[]> {
      const what = 'lister les parties';
      await migrateLegacy(what);
      let sums: Array<string | null>;
      try {
        sums = await kv.getMany(MANUAL_SLOTS.map(KEYS.summary));
      } catch (err) {
        throw storageError(what, err);
      }
      const out: GameSlotSummary[] = [];
      for (const [i, slot] of MANUAL_SLOTS.entries()) {
        const sum = readSummary(sums[i] ?? null, slot);
        const known = sum ? caseIdOfSummary(sum) : null;
        if (sum && known !== null) {
          out.push(withCase(sum, known));
          continue;
        }
        // Résumé absent, invalide ou sans affaire (écrit avant l'i18n) : on ne lit la partie
        // complète que dans ce cas, pour son affaire.
        const raw = await read(KEYS.save(slot), what);
        if (raw === null) continue;
        if (sum) {
          out.push(withCase(sum, caseIdOfRaw(raw)));
          continue;
        }
        const fallback = summaryFromRaw(raw, slot, summarize());
        if (fallback) out.push(withCase(fallback, caseIdOfRaw(raw)));
      }
      out.push(...(await listBackups(what)));
      return out;
    },

    async load(slot: SaveSlotId, caseId?: string): Promise<unknown | null> {
      assertSlot(slot);
      const what = 'charger la partie';
      if (slot !== 'auto') return decodeStored(await read(KEYS.save(slot), what));
      const id = await backupCase(caseId, what);
      return id === null ? null : decodeStored(await read(KEYS.backup(id), what));
    },

    async save(slot: SaveSlotId, s: SaveState): Promise<void> {
      assertSlot(slot);
      const what = 'sauvegarder la partie';
      let keys: [string, string] = [KEYS.save(slot), KEYS.summary(slot)];
      if (slot === 'auto') {
        // Le secours d'une partie va toujours sous SON affaire (AFFAIRE-2 §2.3).
        assertCaseId(s.caseId);
        await migrateLegacy(what);
        keys = [KEYS.backup(s.caseId), KEYS.backupSummary(s.caseId)];
      }
      const text = serialize(s);
      const summary = serialize(summaryToStore(s, summarize()));
      try {
        await kv.setMany([
          [keys[0], text],
          [keys[1], summary],
        ]);
      } catch (err) {
        throw storageError(what, err);
      }
    },

    async remove(slot: SaveSlotId, caseId?: string): Promise<void> {
      assertSlot(slot);
      const what = 'supprimer la partie';
      let keys = [KEYS.save(slot), KEYS.summary(slot)];
      if (slot === 'auto') {
        const id = await backupCase(caseId, what);
        if (id === null) return;
        keys = [KEYS.backup(id), KEYS.backupSummary(id)];
      }
      try {
        await kv.deleteMany(keys);
      } catch (err) {
        throw storageError(what, err);
      }
    },

    async exportFile(slot: SaveSlotId, caseId?: string): Promise<void> {
      assertSlot(slot);
      const what = 'exporter la partie';
      let key = KEYS.save(slot);
      let id: string | null = null;
      if (slot === 'auto') {
        id = await backupCase(caseId, what);
        if (id === null) throw notFound();
        key = KEYS.backup(id);
      }
      const text = await read(key, what);
      if (text === null) throw notFound();
      await io.exportText(exportFileName(slot, new Date(), id), text);
    },

    async importFile(): Promise<unknown | null> {
      const text = await io.importText();
      return text === null ? null : decodeImported(text);
    },

    async loadProfile(): Promise<unknown | null> {
      return decodeStored(await read(KEYS.profile, 'charger le profil'));
    },

    async saveProfile(p: Profile): Promise<void> {
      try {
        await kv.setMany([[KEYS.profile, serialize(p)]]);
      } catch (err) {
        throw storageError('enregistrer le profil', err);
      }
    },
  };
}
