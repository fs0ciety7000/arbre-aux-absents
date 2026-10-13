import { describe, expect, it, vi } from 'vitest';
import { createMemoryPlatform, MEMORY_STORAGE_WARNING } from '../memory';
import { makeSave } from './fixtures';

describe('adaptateur mémoire', () => {
  it('expose l’avertissement par défaut', () => {
    expect(createMemoryPlatform().storageWarning).toBe(MEMORY_STORAGE_WARNING);
    expect(createMemoryPlatform({ storageWarning: null }).storageWarning).toBeNull();
  });

  it('sauvegarde, liste, charge, supprime', async () => {
    const p = createMemoryPlatform({
      summarize: () => (s) => ({
        slot: s.slot,
        caseTitle: 'Titre',
        updatedAt: s.updatedAt,
        elapsedMs: s.elapsedMs,
        mode: s.mode,
        progress: 0.5,
      }),
    });
    const s = makeSave('slot-3');
    await p.saves.save('slot-3', s);
    expect(await p.saves.list()).toEqual([
      {
        slot: 'slot-3',
        caseTitle: 'Titre',
        updatedAt: 2000,
        elapsedMs: 5000,
        mode: 'standard',
        progress: 0.5,
      },
    ]);
    expect(await p.saves.load('slot-3')).toEqual(s);
    expect(await p.saves.load('auto')).toBeNull();
    await p.saves.remove('slot-3');
    expect(await p.saves.list()).toEqual([]);
  });

  it('list ignore une partie invalide sans résumé', async () => {
    const p = createMemoryPlatform();
    p.kv.entries.set('save:slot-1', '{"nope":1}');
    p.kv.entries.set('save:slot-2', JSON.stringify(makeSave('slot-2')));
    const list = await p.saves.list();
    expect(list.map((x) => x.slot)).toEqual(['slot-2']);
  });

  it('refuse un emplacement inconnu', async () => {
    const p = createMemoryPlatform();
    await expect(p.saves.load('../evil' as never)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('profil brut', async () => {
    const p = createMemoryPlatform();
    expect(await p.saves.loadProfile()).toBeNull();
    p.kv.entries.set('profile', 'corrompu');
    expect(await p.saves.loadProfile()).toBe('corrompu');
  });

  it('export : not-found si vide, délégué à io sinon ; import sans io = null', async () => {
    const exportText = vi.fn(async () => {});
    const p = createMemoryPlatform({ io: { exportText, importText: async () => '{"a":1}' } });
    await expect(p.saves.exportFile('auto')).rejects.toMatchObject({ code: 'not-found' });
    await p.saves.save('auto', makeSave('auto'));
    await p.saves.exportFile('auto');
    expect(exportText).toHaveBeenCalledWith(
      expect.stringMatching(/^arbre-aux-absents-auto-\d{4}-\d{2}-\d{2}\.json$/),
      expect.any(String),
    );
    expect(await p.saves.importFile()).toEqual({ a: 1 });
    expect(await createMemoryPlatform().saves.importFile()).toBeNull();
  });

  it('retour : Échap délégué', () => {
    const target = new EventTarget();
    const p = createMemoryPlatform({ keyTarget: target });
    const off = p.onBack(() => true);
    const ev = new Event('keydown', { cancelable: true }) as Event & { key: string };
    Object.assign(ev, { key: 'Escape' });
    target.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    off();
    expect(p.back()).toBe(false);
  });
});
