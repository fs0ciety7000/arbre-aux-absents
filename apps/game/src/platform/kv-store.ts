/**
 * `SaveStore` générique sur un stockage clé → texte (IndexedDB, localStorage). Chaque partie est
 * écrite avec son résumé dans la même opération, pour que `list()` ne lise que les résumés.
 *
 * Clés : `save:slot-N` / `summary:slot-N` (emplacements manuels, communs) ;
 * `save:auto:<affaire>` / `summary:auto:<affaire>` (secours, un par affaire, AFFAIRE-2 §2.3) ;
 * `save:timed:<affaire>` / `summary:timed:<affaire>` (partie chronométrée, une par affaire).
 * L'ancien secours commun `save:auto` est rangé sous sa propre affaire au premier accès.
 */
import {
  CASE_SLOT_IDS,
  isCaseSlot,
  MANUAL_SLOT_IDS,
  type CaseSlotId,
  type Profile,
  type SaveSlotId,
  type SaveState,
} from '@arbre/contract';
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
  /** Emplacement propre à l'affaire `caseId` (`auto` : secours ; `timed` : chronométrée). */
  caseSave: (slot: CaseSlotId, caseId: string) => `save:${slot}:${caseId}`,
  caseSummary: (slot: CaseSlotId, caseId: string) => `summary:${slot}:${caseId}`,
  casePrefix: (slot: CaseSlotId) => `save:${slot}:`,
  profile: 'profile',
} as const;

const MANUAL_SLOTS = MANUAL_SLOT_IDS;

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

  /** Parties d'un emplacement propre aux affaires (`auto` ou `timed`), une par affaire. */
  async function listCaseSlots(slot: CaseSlotId, what: string): Promise<GameSlotSummary[]> {
    const prefix = KEYS.casePrefix(slot);
    let ids: string[];
    try {
      ids = (await kv.keys(prefix))
        .map((k) => k.slice(prefix.length))
        .filter(isCaseId)
        .sort();
    } catch (err) {
      throw storageError(what, err);
    }
    let sums: Array<string | null>;
    try {
      sums = await kv.getMany(ids.map((id) => KEYS.caseSummary(slot, id)));
    } catch (err) {
      throw storageError(what, err);
    }
    const out: GameSlotSummary[] = [];
    for (const [i, id] of ids.entries()) {
      const sum = readSummary(sums[i] ?? null, slot);
      if (sum) {
        out.push(withCase(sum, id));
        continue;
      }
      const raw = await read(KEYS.caseSave(slot, id), what);
      if (raw === null || caseIdOfRaw(raw) !== id) continue;
      const fallback = summaryFromRaw(raw, slot, summarize());
      if (fallback) out.push(withCase(fallback, id));
    }
    return out;
  }

  /** Affaire de l'emplacement visé : `caseId` donné, sinon la partie la plus récente. */
  async function caseOf(
    slot: CaseSlotId,
    caseId: string | undefined,
    what: string,
  ): Promise<string | null> {
    await migrateLegacy(what);
    if (caseId !== undefined) {
      assertCaseId(caseId);
      return caseId;
    }
    return latestBackup(await listCaseSlots(slot, what), slot);
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
      for (const slot of CASE_SLOT_IDS) out.push(...(await listCaseSlots(slot, what)));
      return out;
    },

    async load(slot: SaveSlotId, caseId?: string): Promise<unknown | null> {
      assertSlot(slot);
      const what = 'charger la partie';
      if (!isCaseSlot(slot)) return decodeStored(await read(KEYS.save(slot), what));
      const id = await caseOf(slot, caseId, what);
      return id === null ? null : decodeStored(await read(KEYS.caseSave(slot, id), what));
    },

    async save(slot: SaveSlotId, s: SaveState): Promise<void> {
      assertSlot(slot);
      const what = 'sauvegarder la partie';
      let keys: [string, string] = [KEYS.save(slot), KEYS.summary(slot)];
      if (isCaseSlot(slot)) {
        // Secours et partie chronométrée vont toujours sous LEUR affaire (AFFAIRE-2 §2.3).
        assertCaseId(s.caseId);
        await migrateLegacy(what);
        keys = [KEYS.caseSave(slot, s.caseId), KEYS.caseSummary(slot, s.caseId)];
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
      if (isCaseSlot(slot)) {
        const id = await caseOf(slot, caseId, what);
        if (id === null) return;
        keys = [KEYS.caseSave(slot, id), KEYS.caseSummary(slot, id)];
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
      if (isCaseSlot(slot)) {
        id = await caseOf(slot, caseId, what);
        if (id === null) throw notFound();
        key = KEYS.caseSave(slot, id);
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
