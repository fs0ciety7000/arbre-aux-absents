import type { SaveSlotSummary, SaveState } from '@arbre/contract';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { KEYS } from '../kv-store';
import { createMemoryPlatform } from '../memory';
import { LS_PREFIX, createWebPlatform, idbBackend, openIdb, type WebPlatformDeps } from '../web';
import { FakeStorage, makeSave } from './fixtures';

/** Secours un par affaire (AFFAIRE-2 §2.3) : clés, migration de l'ancien secours commun. */

const CASE_1 = 'succession-varenque';
const CASE_2 = 'deuxieme-affaire';

const summarize = () => (s: SaveState) =>
  ({
    slot: s.slot,
    caseTitle: `Titre ${s.caseId}`,
    updatedAt: s.updatedAt,
    elapsedMs: s.elapsedMs,
    mode: s.mode,
    progress: 0.5,
  }) satisfies SaveSlotSummary;

function backup(caseId: string, patch: Partial<SaveState> = {}): SaveState {
  return makeSave('auto', { caseId, ...patch });
}

function platform() {
  return createMemoryPlatform({ storageWarning: null, summarize });
}

describe('secours par affaire', () => {
  it('le secours de l’affaire 2 n’écrase jamais celui de l’affaire 1', async () => {
    const p = platform();
    const one = backup(CASE_1, { elapsedMs: 111, updatedAt: 1000 });
    const two = backup(CASE_2, { elapsedMs: 222, updatedAt: 3000 });
    await p.saves.save('auto', one);
    await p.saves.save('auto', two);

    expect(p.kv.entries.has(KEYS.backup(CASE_1))).toBe(true);
    expect(p.kv.entries.has(KEYS.backup(CASE_2))).toBe(true);
    expect(p.kv.entries.has('save:auto')).toBe(false);
    expect(await p.saves.load('auto', CASE_1)).toEqual(one);
    expect(await p.saves.load('auto', CASE_2)).toEqual(two);
    // Sans affaire : le plus récent.
    expect(await p.saves.load('auto')).toEqual(two);

    const list = await p.saves.list();
    expect(list.map((s) => [s.slot, s.caseId, s.caseTitle])).toEqual([
      ['auto', CASE_2, `Titre ${CASE_2}`],
      ['auto', CASE_1, `Titre ${CASE_1}`],
    ]);
  });

  it('remove et export visent le secours d’une seule affaire', async () => {
    const exportText = vi.fn(async () => {});
    const p = createMemoryPlatform({
      storageWarning: null,
      summarize,
      io: { exportText, importText: async () => null },
    });
    await p.saves.save('auto', backup(CASE_1));
    await p.saves.save('auto', backup(CASE_2));
    await p.saves.exportFile('auto', CASE_1);
    expect(exportText).toHaveBeenCalledWith(
      expect.stringMatching(/^arbre-aux-absents-auto-succession-varenque-\d{4}-\d{2}-\d{2}\.json$/),
      JSON.stringify(backup(CASE_1)),
    );
    await p.saves.remove('auto', CASE_2);
    expect((await p.saves.list()).map((s) => s.caseId)).toEqual([CASE_1]);
    expect(await p.saves.load('auto', CASE_2)).toBeNull();
    await expect(p.saves.exportFile('auto', CASE_2)).rejects.toMatchObject({ code: 'not-found' });
    await p.saves.remove('auto', CASE_2); // idempotent
    await p.saves.remove('auto'); // le plus récent restant
    expect(await p.saves.list()).toEqual([]);
    await p.saves.remove('auto'); // aucun secours : rien
  });

  it('les emplacements manuels restent communs à toutes les affaires', async () => {
    const p = platform();
    await p.saves.save('slot-1', makeSave('slot-1', { caseId: CASE_1 }));
    await p.saves.save('slot-1', makeSave('slot-1', { caseId: CASE_2 }));
    expect(await p.saves.load('slot-1')).toMatchObject({ caseId: CASE_2 });
    expect((await p.saves.list()).map((s) => [s.slot, s.caseId])).toEqual([['slot-1', null]]);
  });

  it('refuse un identifiant d’affaire hors format (clé arbitraire)', async () => {
    const p = platform();
    await expect(p.saves.save('auto', backup('../evil'))).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(p.saves.load('auto', '../evil')).rejects.toMatchObject({ code: 'not-found' });
    await expect(p.saves.remove('auto', 'A B')).rejects.toMatchObject({ code: 'not-found' });
    // Une clé mal formée déjà présente est ignorée par list.
    p.kv.entries.set('save:auto:../evil', JSON.stringify(backup(CASE_1)));
    p.kv.entries.set(`save:auto:${CASE_2}`, JSON.stringify(backup(CASE_1)));
    expect(await p.saves.list()).toEqual([]);
  });

  it('résumé absent : recalculé depuis la partie du secours', async () => {
    const p = platform();
    p.kv.entries.set(KEYS.backup(CASE_2), JSON.stringify(backup(CASE_2)));
    expect((await p.saves.list()).map((s) => [s.caseId, s.caseTitle])).toEqual([
      [CASE_2, `Titre ${CASE_2}`],
    ]);
  });
});

describe('migration de l’ancien secours commun (save:auto)', () => {
  function withLegacy(state: SaveState | string) {
    const p = platform();
    const text = typeof state === 'string' ? state : JSON.stringify(state);
    p.kv.entries.set('save:auto', text);
    if (typeof state !== 'string') {
      p.kv.entries.set('summary:auto', JSON.stringify(summarize()(state)));
    }
    return p;
  }

  it('rangé sous son affaire au premier list, sans perte', async () => {
    const old = backup(CASE_1, { elapsedMs: 42 });
    const p = withLegacy(old);
    const list = await p.saves.list();
    expect(list).toEqual([{ ...summarize()(old), caseId: CASE_1 }]);
    expect(p.kv.entries.has('save:auto')).toBe(false);
    expect(p.kv.entries.has('summary:auto')).toBe(false);
    expect(JSON.parse(p.kv.entries.get(KEYS.backup(CASE_1))!)).toEqual(old);
    expect(p.kv.entries.has(KEYS.backupSummary(CASE_1))).toBe(true);
    expect(await p.saves.load('auto', CASE_1)).toEqual(old);
  });

  it('un secours de l’affaire 2 écrit ensuite laisse celui de l’affaire 1 intact', async () => {
    const old = backup(CASE_1, { elapsedMs: 42 });
    const p = withLegacy(old);
    // Première écriture après la mise à jour : un secours de l'affaire 2.
    await p.saves.save('auto', backup(CASE_2));
    expect(await p.saves.load('auto', CASE_1)).toEqual(old);
    expect(await p.saves.load('auto', CASE_2)).toEqual(backup(CASE_2));
    expect((await p.saves.list()).map((s) => s.caseId).sort()).toEqual([CASE_2, CASE_1].sort());
  });

  it('chargement direct du secours de l’affaire 1 (sans list préalable)', async () => {
    const old = backup(CASE_1);
    const p = withLegacy(old);
    expect(await p.saves.load('auto', CASE_1)).toEqual(old);
    expect(await p.saves.load('auto', CASE_2)).toBeNull();
  });

  it('un secours plus récent de la même affaire l’emporte ; l’ancien est effacé', async () => {
    const old = backup(CASE_1, { elapsedMs: 1 });
    const p = withLegacy(old);
    const fresh = backup(CASE_1, { elapsedMs: 2 });
    p.kv.entries.set(KEYS.backup(CASE_1), JSON.stringify(fresh));
    await p.saves.list();
    expect(await p.saves.load('auto', CASE_1)).toEqual(fresh);
    expect(p.kv.entries.has('save:auto')).toBe(false);
  });

  it('illisible : laissé tel quel, jamais supprimé, ignoré', async () => {
    const p = withLegacy('{tronqué');
    expect(await p.saves.list()).toEqual([]);
    expect(await p.saves.load('auto')).toBeNull();
    await p.saves.save('auto', backup(CASE_2));
    expect(p.kv.entries.get('save:auto')).toBe('{tronqué');
  });
});

describe('web : énumération des secours', () => {
  const deps = (extra: WebPlatformDeps): WebPlatformDeps => ({
    storageManager: null,
    io: { exportText: async () => {}, importText: async () => null },
    summarize,
    ...extra,
  });

  it('localStorage : list retrouve le secours de chaque affaire, ignore les autres préfixes', async () => {
    const ls = new FakeStorage();
    ls.setItem('autre-site:save:auto:intrus', 'x');
    const p = await createWebPlatform(deps({ indexedDB: null, localStorage: ls }));
    await p.saves.save('auto', backup(CASE_1));
    await p.saves.save('auto', backup(CASE_2));
    expect(ls.getItem(`${LS_PREFIX}save:auto:${CASE_2}`)).toBe(JSON.stringify(backup(CASE_2)));
    expect((await p.saves.list()).map((s) => s.caseId)).toEqual([CASE_2, CASE_1]);
  });

  it('IndexedDB : ancien secours migré, secours par affaire persistants', async () => {
    const idb = new IDBFactory();
    const p1 = await createWebPlatform(deps({ indexedDB: idb, localStorage: null }));
    // Ancien format : un seul secours commun.
    const old = backup(CASE_1, { elapsedMs: 7 });
    const kv = idbBackend(await openIdb(idb));
    await kv.setMany([['save:auto', JSON.stringify(old)]]);
    await p1.saves.save('auto', backup(CASE_2));
    const p2 = await createWebPlatform(deps({ indexedDB: idb, localStorage: null }));
    expect(await p2.saves.load('auto', CASE_1)).toEqual(old);
    expect((await p2.saves.list()).map((s) => s.caseId)).toEqual([CASE_2, CASE_1]);
    expect(await kv.get('save:auto')).toBeNull();
  });
});
