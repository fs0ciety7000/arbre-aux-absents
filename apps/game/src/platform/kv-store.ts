/**
 * `SaveStore` générique sur un stockage clé → texte (IndexedDB, localStorage). Chaque partie est
 * écrite avec son résumé dans la même opération, pour que `list()` ne lise que les résumés.
 */
import {
  SAVE_SLOT_IDS,
  type Profile,
  type SaveSlotId,
  type SaveSlotSummary,
  type SaveState,
  type SaveStore,
} from '@arbre/contract';
import {
  PlatformError,
  assertSlot,
  decodeImported,
  decodeStored,
  exportFileName,
  notFound,
  readSummary,
  serialize,
  summaryFromRaw,
  type FileIo,
  type Summarizer,
} from './common';

export interface KvBackend {
  readonly name: 'indexeddb' | 'localstorage' | 'memory';
  get(key: string): Promise<string | null>;
  getMany(keys: string[]): Promise<Array<string | null>>;
  /** Écrit toutes les paires ou aucune (au mieux pour localStorage). */
  setMany(entries: Array<[string, string]>): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}

export const KEYS = {
  save: (slot: SaveSlotId) => `save:${slot}`,
  summary: (slot: SaveSlotId) => `summary:${slot}`,
  profile: 'profile',
} as const;

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
): SaveStore {
  async function read(key: string, what: string): Promise<string | null> {
    try {
      return await kv.get(key);
    } catch (err) {
      throw storageError(what, err);
    }
  }

  return {
    async list(): Promise<SaveSlotSummary[]> {
      let sums: Array<string | null>;
      try {
        sums = await kv.getMany(SAVE_SLOT_IDS.map(KEYS.summary));
      } catch (err) {
        throw storageError('lister les parties', err);
      }
      const out: SaveSlotSummary[] = [];
      for (const [i, slot] of SAVE_SLOT_IDS.entries()) {
        const sum = readSummary(sums[i] ?? null, slot);
        if (sum) {
          out.push(sum);
          continue;
        }
        // Résumé absent ou invalide : on ne lit la partie complète que dans ce cas.
        const raw = await read(KEYS.save(slot), 'lister les parties');
        if (raw === null) continue;
        const fallback = summaryFromRaw(raw, slot, summarize());
        if (fallback) out.push(fallback);
      }
      return out;
    },

    async load(slot: SaveSlotId): Promise<unknown | null> {
      assertSlot(slot);
      return decodeStored(await read(KEYS.save(slot), 'charger la partie'));
    },

    async save(slot: SaveSlotId, s: SaveState): Promise<void> {
      assertSlot(slot);
      const text = serialize(s);
      const summary = serialize(summarize()(s));
      try {
        await kv.setMany([
          [KEYS.save(slot), text],
          [KEYS.summary(slot), summary],
        ]);
      } catch (err) {
        throw storageError('sauvegarder la partie', err);
      }
    },

    async remove(slot: SaveSlotId): Promise<void> {
      assertSlot(slot);
      try {
        await kv.deleteMany([KEYS.save(slot), KEYS.summary(slot)]);
      } catch (err) {
        throw storageError('supprimer la partie', err);
      }
    },

    async exportFile(slot: SaveSlotId): Promise<void> {
      assertSlot(slot);
      const text = await read(KEYS.save(slot), 'exporter la partie');
      if (text === null) throw notFound();
      await io.exportText(exportFileName(slot), text);
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
