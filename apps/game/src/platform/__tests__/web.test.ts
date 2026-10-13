import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { MEMORY_STORAGE_WARNING } from '../memory';
import {
  LS_PREFIX,
  createWebPlatform,
  downloadIo,
  filePickerIo,
  type WebPlatformDeps,
} from '../web';
import { FakeStorage, makeSave } from './fixtures';

const base = (extra: WebPlatformDeps = {}): WebPlatformDeps => ({
  storageManager: null,
  io: { exportText: async () => {}, importText: async () => null },
  ...extra,
});

describe('web : IndexedDB', () => {
  it('choisit IndexedDB et persiste entre deux instances', async () => {
    const idb = new IDBFactory();
    const p1 = await createWebPlatform(base({ indexedDB: idb, localStorage: null }));
    expect(p1.backend).toBe('indexeddb');
    expect(p1.storageWarning).toBeNull();
    const s = makeSave('auto');
    await p1.saves.save('auto', s);
    await p1.saves.saveProfile({ x: 1 } as never);

    const p2 = await createWebPlatform(base({ indexedDB: idb, localStorage: null }));
    expect(await p2.saves.load('auto')).toEqual(s);
    expect(await p2.saves.loadProfile()).toEqual({ x: 1 });
    expect((await p2.saves.list()).map((x) => x.slot)).toEqual(['auto']);
    await p2.saves.remove('auto');
    expect(await p2.saves.load('auto')).toBeNull();
    expect(await p2.saves.list()).toEqual([]);
  });

  it('list lit les résumés sans charger les parties', async () => {
    const idb = new IDBFactory();
    let calls = 0;
    const p = await createWebPlatform(
      base({
        indexedDB: idb,
        summarize: () => (s) => {
          calls++;
          return {
            slot: s.slot,
            caseTitle: 'T',
            updatedAt: 1,
            elapsedMs: 2,
            mode: 'timed',
            progress: 0.25,
          };
        },
      }),
    );
    await p.saves.save('slot-1', makeSave('slot-1'));
    expect(calls).toBe(1);
    expect(await p.saves.list()).toEqual([
      { slot: 'slot-1', caseTitle: 'T', updatedAt: 1, elapsedMs: 2, mode: 'timed', progress: 0.25 },
    ]);
    expect(calls).toBe(1); // le résumé stocké suffit
  });

  it('demande un stockage persistant', async () => {
    const persist = vi.fn(async () => true);
    await createWebPlatform(
      base({
        indexedDB: new IDBFactory(),
        storageManager: { persisted: async () => false, persist },
      }),
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(persist).toHaveBeenCalledOnce();
  });

  it('IndexedDB qui ne répond pas → repli localStorage (délai)', async () => {
    const hung = { open: () => ({}) } as unknown as IDBFactory;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = await createWebPlatform(
      base({ indexedDB: hung, localStorage: new FakeStorage(), idbTimeoutMs: 20 }),
    );
    warn.mockRestore();
    expect(p.backend).toBe('localstorage');
  });
});

describe('web : repli localStorage', () => {
  it('sauvegarde et relit sous un préfixe', async () => {
    const ls = new FakeStorage();
    const p = await createWebPlatform(base({ indexedDB: null, localStorage: ls }));
    expect(p.backend).toBe('localstorage');
    const s = makeSave('slot-2');
    await p.saves.save('slot-2', s);
    expect(ls.getItem(`${LS_PREFIX}save:slot-2`)).toBe(JSON.stringify(s));
    expect(await p.saves.load('slot-2')).toEqual(s);
    expect((await p.saves.list())[0]?.slot).toBe('slot-2');
  });

  it('quota dépassé : erreur storage et état précédent restauré', async () => {
    const ls = new FakeStorage(4000);
    const p = await createWebPlatform(base({ indexedDB: null, localStorage: ls }));
    const small = makeSave('auto');
    await p.saves.save('auto', small);
    const big = makeSave('auto', { searched: Array.from({ length: 400 }, (_, i) => `mot-${i}`) });
    await expect(p.saves.save('auto', big)).rejects.toMatchObject({ code: 'storage' });
    expect(await p.saves.load('auto')).toEqual(small);
  });

  it('aucun stockage → mémoire avec avertissement', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = await createWebPlatform(base({ indexedDB: null, localStorage: new FakeStorage(0) }));
    warn.mockRestore();
    expect(p.backend).toBe('memory');
    expect(p.storageWarning).toBe(MEMORY_STORAGE_WARNING);
    await p.saves.save('auto', makeSave('auto'));
    expect(await p.saves.load('auto')).not.toBeNull();
  });

  it('résumé corrompu : recalcul depuis la partie', async () => {
    const ls = new FakeStorage();
    const p = await createWebPlatform(base({ indexedDB: null, localStorage: ls }));
    await p.saves.save('slot-1', makeSave('slot-1'));
    ls.setItem(`${LS_PREFIX}summary:slot-1`, '{cassé');
    expect((await p.saves.list())[0]?.caseTitle).toBe('affaire-test');
    ls.setItem(`${LS_PREFIX}save:slot-1`, '{cassé');
    expect(await p.saves.list()).toEqual([]);
    expect(await p.saves.load('slot-1')).toBe('{cassé'); // brut, pour parseSave
  });
});

describe('web : fichiers', () => {
  it('export télécharge un .json nommé', async () => {
    const clicked: Array<{ download: string; href: string }> = [];
    const doc = {
      body: { append: () => {} },
      createElement: () => {
        const a = {
          href: '',
          download: '',
          rel: '',
          style: {} as Record<string, string>,
          click: () => clicked.push({ download: a.download, href: a.href }),
          remove: () => {},
        };
        return a;
      },
    } as unknown as Document;
    vi.useFakeTimers();
    const p = await createWebPlatform({
      indexedDB: null,
      localStorage: new FakeStorage(),
      storageManager: null,
      io: { exportText: downloadIo(doc), importText: async () => null },
    });
    await expect(p.saves.exportFile('slot-1')).rejects.toMatchObject({ code: 'not-found' });
    await p.saves.save('slot-1', makeSave('slot-1'));
    await p.saves.exportFile('slot-1');
    vi.runAllTimers();
    vi.useRealTimers();
    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toMatch(/^arbre-aux-absents-slot-1-\d{4}-\d{2}-\d{2}\.json$/);
    expect(clicked[0]?.href).toMatch(/^blob:/);
  });

  function fakePicker(file: { size: number; text: () => Promise<string> } | null, cancel = false) {
    const win = new EventTarget() as unknown as Window;
    const doc = {
      body: { append: () => {} },
      createElement: () => {
        const input = new EventTarget() as EventTarget & Record<string, unknown>;
        Object.assign(input, {
          style: {},
          files: null,
          oncancel: null,
          remove: () => {},
          click: () => {
            queueMicrotask(() => {
              if (cancel) {
                input.dispatchEvent(new Event('cancel'));
                return;
              }
              input.files = file ? [file] : [];
              input.dispatchEvent(new Event('change'));
            });
          },
        });
        return input;
      },
    } as unknown as Document;
    return filePickerIo(doc, win);
  }

  it('import : texte, annulation, trop gros', async () => {
    expect(await fakePicker({ size: 7, text: async () => '{"a":1}' })()).toBe('{"a":1}');
    expect(await fakePicker(null, true)()).toBeNull();
    await expect(fakePicker({ size: 3_000_000, text: async () => '' })()).rejects.toMatchObject({
      code: 'too-large',
    });
    await expect(
      fakePicker({ size: 3, text: async () => Promise.reject(new Error('x')) })(),
    ).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('importFile renvoie la valeur brute', async () => {
    const p = await createWebPlatform(
      base({
        indexedDB: null,
        localStorage: new FakeStorage(),
        io: { exportText: async () => {}, importText: async () => '{"schemaVersion":99}' },
      }),
    );
    expect(await p.saves.importFile()).toEqual({ schemaVersion: 99 });
  });
});

describe('web : retour et plein écran', () => {
  function fakeWindow() {
    const target = new EventTarget();
    const states: unknown[] = [null];
    const win = Object.assign(target, {
      history: {
        get state() {
          return states.at(-1);
        },
        pushState: (s: unknown) => states.push(s),
      },
    });
    return {
      win: win as unknown as Window,
      states,
      pop: () => (states.pop(), target.dispatchEvent(new Event('popstate'))),
    };
  }

  it('Échap et « précédent » délégués au dernier gestionnaire', async () => {
    const { win, states, pop } = fakeWindow();
    const p = await createWebPlatform(
      base({ indexedDB: null, localStorage: new FakeStorage(), window: win }),
    );
    expect(p.setFullscreen).toBeUndefined();
    let consume = true;
    const handler = vi.fn(() => consume);
    const off = p.onBack(handler);
    expect(states).toHaveLength(2); // entrée sentinelle posée

    const esc = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' });
    win.dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);

    pop();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(states).toHaveLength(2); // consommé → sentinelle remise

    consume = false;
    pop();
    expect(states).toHaveLength(1); // non consommé → on laisse partir
    off();
  });

  it('plein écran via Fullscreen API si disponible', async () => {
    const doc = {
      fullscreenEnabled: true,
      fullscreenElement: null as unknown,
      documentElement: { requestFullscreen: vi.fn(async () => {}) },
      exitFullscreen: vi.fn(async () => {}),
    };
    const p = await createWebPlatform(
      base({
        indexedDB: null,
        localStorage: new FakeStorage(),
        document: doc as unknown as Document,
      }),
    );
    await p.setFullscreen?.(true);
    expect(doc.documentElement.requestFullscreen).toHaveBeenCalledOnce();
    doc.fullscreenElement = {};
    await p.setFullscreen?.(false);
    expect(doc.exitFullscreen).toHaveBeenCalledOnce();
  });
});
