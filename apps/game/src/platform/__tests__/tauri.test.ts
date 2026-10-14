import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSave } from './fixtures';

/** Système de fichiers simulé : chemins relatifs à $APPDATA, ou absolus (dialogues). */
const fsState = vi.hoisted(() => ({
  files: new Map<string, string>(),
  dirs: new Set<string>(),
  ops: [] as string[],
  failRename: false,
  failMkdir: false,
  failStat: false,
}));
const dialogState = vi.hoisted(() => ({
  savePath: null as string | null,
  openPath: null as string | null,
}));
const appState = vi.hoisted(() => ({
  handler: null as null | ((p: { canGoBack: boolean }) => void),
  unregister: vi.fn(async () => {}),
}));
const win = vi.hoisted(() => ({
  setFullscreen: vi.fn(async () => {}),
  close: vi.fn(async () => {}),
}));

vi.mock('@tauri-apps/plugin-fs', () => {
  const missing = (p: string) => new Error(`No such file: ${p}`);
  return {
    BaseDirectory: { AppData: 14 },
    exists: vi.fn(async (p: string) => fsState.files.has(p) || fsState.dirs.has(p)),
    mkdir: vi.fn(async (p: string) => {
      if (fsState.failMkdir) throw new Error('EACCES');
      fsState.dirs.add(p);
    }),
    readDir: vi.fn(async (p: string) => {
      if (!fsState.dirs.has(p)) throw missing(p);
      return [...fsState.files.keys()]
        .filter((k) => k.startsWith(`${p}/`))
        .map((k) => ({
          name: k.slice(p.length + 1),
          isFile: true,
          isDirectory: false,
          isSymlink: false,
        }));
    }),
    readTextFile: vi.fn(async (p: string) => {
      const v = fsState.files.get(p);
      if (v === undefined) throw missing(p);
      return v;
    }),
    writeTextFile: vi.fn(async (p: string, data: string) => {
      fsState.ops.push(`write ${p}`);
      fsState.files.set(p, data);
    }),
    copyFile: vi.fn(async (from: string, to: string) => {
      fsState.ops.push(`copy ${from} ${to}`);
      const v = fsState.files.get(from);
      if (v === undefined) throw missing(from);
      fsState.files.set(to, v);
    }),
    rename: vi.fn(async (from: string, to: string) => {
      if (fsState.failRename) throw new Error('EIO');
      fsState.ops.push(`rename ${from} ${to}`);
      const v = fsState.files.get(from);
      if (v === undefined) throw missing(from);
      fsState.files.delete(from);
      fsState.files.set(to, v);
    }),
    remove: vi.fn(async (p: string) => {
      fsState.files.delete(p);
    }),
    stat: vi.fn(async (p: string) => {
      if (fsState.failStat) throw new Error('fs.stat not allowed');
      const v = fsState.files.get(p);
      if (v === undefined) throw missing(p);
      return { size: new TextEncoder().encode(v).length, isFile: true, isDirectory: false };
    }),
  };
});
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(async () => dialogState.savePath),
  open: vi.fn(async () => dialogState.openPath),
}));
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => win }));
vi.mock('@tauri-apps/api/app', () => ({
  onBackButtonPress: vi.fn(async (h: (p: { canGoBack: boolean }) => void) => {
    appState.handler = h;
    return { unregister: appState.unregister };
  }),
}));

const { createTauriPlatform, createTauriSaveStore, detectKind, TAURI_STORAGE_WARNING } =
  await import('../tauri');

beforeEach(() => {
  fsState.files.clear();
  fsState.dirs.clear();
  fsState.ops.length = 0;
  fsState.failRename = false;
  fsState.failMkdir = false;
  fsState.failStat = false;
  dialogState.savePath = null;
  dialogState.openPath = null;
  appState.handler = null;
  appState.unregister.mockClear();
  win.close.mockClear();
  vi.unstubAllGlobals();
});

describe('tauri : sauvegardes', () => {
  it('écrit via .tmp puis renomme, copie .bak de la version précédente', async () => {
    const store = createTauriSaveStore();
    const v1 = makeSave('slot-1', { elapsedMs: 1 });
    const v2 = makeSave('slot-1', { elapsedMs: 2 });
    await store.save('slot-1', v1);
    expect(fsState.ops).toEqual([
      'write saves/slot-1.json.tmp',
      'rename saves/slot-1.json.tmp saves/slot-1.json',
      'write saves/slot-1.summary.json.tmp',
      'rename saves/slot-1.summary.json.tmp saves/slot-1.summary.json',
    ]);
    fsState.ops.length = 0;
    await store.save('slot-1', v2);
    expect(fsState.ops.slice(0, 3)).toEqual([
      'write saves/slot-1.json.tmp',
      'copy saves/slot-1.json saves/slot-1.json.bak',
      'rename saves/slot-1.json.tmp saves/slot-1.json',
    ]);
    expect(JSON.parse(fsState.files.get('saves/slot-1.json.bak')!)).toEqual(v1);
    expect(await store.load('slot-1')).toEqual(v2);
    expect(fsState.files.has('saves/slot-1.json.tmp')).toBe(false);
  });

  it('renommage en échec : l’ancienne partie reste intacte, erreur storage', async () => {
    const store = createTauriSaveStore();
    const v1 = makeSave('auto', { elapsedMs: 1 });
    await store.save('auto', v1);
    fsState.failRename = true;
    await expect(store.save('auto', makeSave('auto', { elapsedMs: 9 }))).rejects.toMatchObject({
      code: 'storage',
    });
    expect(await store.load('auto')).toEqual(v1);
  });

  it('fichier corrompu → repli sur .bak', async () => {
    const store = createTauriSaveStore();
    const v1 = makeSave('slot-2', { elapsedMs: 1 });
    await store.save('slot-2', v1);
    await store.save('slot-2', makeSave('slot-2', { elapsedMs: 2 }));
    fsState.files.set('saves/slot-2.json', '{"schemaVersion":1, tronqu');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await store.load('slot-2')).toEqual(v1);
    warn.mockRestore();
  });

  it('principal et .bak corrompus → texte brut pour parseSave ; absent → null', async () => {
    const store = createTauriSaveStore();
    fsState.dirs.add('saves');
    fsState.files.set('saves/slot-3.json', 'pas du json');
    fsState.files.set('saves/slot-3.json.bak', 'pas non plus');
    expect(await store.load('slot-3')).toBe('pas du json');
    expect(await store.load('auto')).toBeNull();
  });

  it('principal absent mais .bak présent → .bak', async () => {
    const store = createTauriSaveStore();
    fsState.dirs.add('saves');
    const v = makeSave('auto');
    fsState.files.set('saves/auto.json.bak', JSON.stringify(v));
    expect(await store.load('auto')).toEqual(v);
    expect((await store.list()).map((s) => s.slot)).toEqual(['auto']);
  });

  it('list : résumés stockés, sans dossier = vide', async () => {
    const store = createTauriSaveStore({
      summarize: () => (s) => ({
        slot: s.slot,
        caseTitle: 'T',
        updatedAt: 1,
        elapsedMs: 1,
        mode: 'standard',
        progress: 1,
      }),
    });
    expect(await store.list()).toEqual([]);
    await store.save('slot-1', makeSave('slot-1'));
    await store.save('auto', makeSave('auto'));
    // Emplacements manuels d'abord, puis un secours par affaire.
    expect((await store.list()).map((s) => [s.slot, s.caseTitle, s.caseId])).toEqual([
      ['slot-1', 'T', null],
      ['auto', 'T', 'affaire-test'],
    ]);
  });

  it('remove supprime partie, .bak et résumé', async () => {
    const store = createTauriSaveStore();
    await store.save('slot-1', makeSave('slot-1'));
    await store.save('slot-1', makeSave('slot-1'));
    await store.remove('slot-1');
    expect([...fsState.files.keys()]).toEqual([]);
    await store.remove('slot-1'); // idempotent
  });

  it('profil atomique avec .bak', async () => {
    const store = createTauriSaveStore();
    expect(await store.loadProfile()).toBeNull();
    await store.saveProfile({ a: 1 } as never);
    await store.saveProfile({ a: 2 } as never);
    expect(await store.loadProfile()).toEqual({ a: 2 });
    fsState.files.set('saves/profile.json', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await store.loadProfile()).toEqual({ a: 1 });
    warn.mockRestore();
  });

  it('refuse un emplacement hors liste (pas de chemin arbitraire)', async () => {
    const store = createTauriSaveStore();
    await expect(store.save('../../etc' as never, makeSave())).rejects.toMatchObject({
      code: 'not-found',
    });
    expect(fsState.files.size).toBe(0);
  });
});

describe('tauri : secours par affaire (AFFAIRE-2 §2.3)', () => {
  const one = makeSave('auto', { caseId: 'succession-varenque', updatedAt: 1000 });
  const two = makeSave('auto', { caseId: 'deuxieme-affaire', updatedAt: 3000 });

  it('un fichier par affaire ; l’affaire 2 n’écrase pas l’affaire 1', async () => {
    const store = createTauriSaveStore();
    await store.save('auto', one);
    await store.save('auto', two);
    expect(fsState.files.has('saves/auto.succession-varenque.json')).toBe(true);
    expect(fsState.files.has('saves/auto.deuxieme-affaire.json')).toBe(true);
    expect(fsState.files.has('saves/auto.json')).toBe(false);
    expect(await store.load('auto', 'succession-varenque')).toEqual(one);
    expect(await store.load('auto')).toEqual(two); // le plus récent
    expect((await store.list()).map((s) => [s.slot, s.caseId])).toEqual([
      ['auto', 'deuxieme-affaire'],
      ['auto', 'succession-varenque'],
    ]);
    await store.remove('auto', 'deuxieme-affaire');
    expect([...fsState.files.keys()].filter((k) => k.includes('deuxieme'))).toEqual([]);
    expect(await store.load('auto', 'succession-varenque')).toEqual(one);
    await expect(store.load('auto', '../../etc')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('ancien auto.json migré sous son affaire, sans perte, au premier accès', async () => {
    fsState.dirs.add('saves');
    fsState.files.set('saves/auto.json', JSON.stringify(one));
    fsState.files.set('saves/auto.json.bak', JSON.stringify(one));
    fsState.files.set('saves/auto.summary.json', '{"invalide":true}');
    const store = createTauriSaveStore();
    await store.save('auto', two);
    expect(fsState.files.has('saves/auto.json')).toBe(false);
    expect(fsState.files.has('saves/auto.json.bak')).toBe(false);
    expect(fsState.files.has('saves/auto.summary.json')).toBe(false);
    expect(await store.load('auto', 'succession-varenque')).toEqual(one);
    expect(await store.load('auto', 'deuxieme-affaire')).toEqual(two);
  });

  it('ancien auto.json illisible : laissé tel quel', async () => {
    fsState.dirs.add('saves');
    fsState.files.set('saves/auto.json', 'tronqué');
    const store = createTauriSaveStore();
    expect(await store.list()).toEqual([]);
    expect(await store.load('auto')).toBeNull();
    expect(fsState.files.get('saves/auto.json')).toBe('tronqué');
  });
});

describe('tauri : export / import', () => {
  it('export via dialogue ; annulé = rien', async () => {
    const store = createTauriSaveStore();
    await expect(store.exportFile('auto')).rejects.toMatchObject({ code: 'not-found' });
    await store.save('auto', makeSave('auto'));
    await store.exportFile('auto');
    expect([...fsState.files.keys()].some((k) => k.startsWith('/'))).toBe(false);
    dialogState.savePath = '/home/joueur/partie.json';
    await store.exportFile('auto');
    expect(JSON.parse(fsState.files.get('/home/joueur/partie.json')!)).toEqual(makeSave('auto'));
    const { save } = await import('@tauri-apps/plugin-dialog');
    expect(vi.mocked(save).mock.calls[0]?.[0]?.defaultPath).toMatch(
      /^arbre-aux-absents-auto-affaire-test-\d{4}-\d{2}-\d{2}\.json$/,
    );
  });

  it('import : annulé, valeur brute, trop gros, illisible', async () => {
    const store = createTauriSaveStore();
    expect(await store.importFile()).toBeNull();
    dialogState.openPath = '/tmp/a.json';
    fsState.files.set('/tmp/a.json', '{"x":1}');
    expect(await store.importFile()).toEqual({ x: 1 });
    fsState.files.set('/tmp/a.json', 'x'.repeat(2_000_001));
    await expect(store.importFile()).rejects.toMatchObject({ code: 'too-large' });
    fsState.files.delete('/tmp/a.json');
    await expect(store.importFile()).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('import : taille contrôlée avant la lecture (fichier trop gros jamais lu)', async () => {
    const { readTextFile, stat } = await import('@tauri-apps/plugin-fs');
    const store = createTauriSaveStore();
    dialogState.openPath = '/tmp/gros.json';
    // 2 Mo + 1 octet en UTF-8 (caractères sur 2 octets) : la taille en octets compte.
    fsState.files.set('/tmp/gros.json', `"${'é'.repeat(1_000_000)}"`);
    vi.mocked(readTextFile).mockClear();
    await expect(store.importFile()).rejects.toMatchObject({ code: 'too-large' });
    expect(stat).toHaveBeenCalledWith('/tmp/gros.json');
    expect(readTextFile).not.toHaveBeenCalled();
  });

  it('import : sans `stat`, repli sur le contrôle après lecture', async () => {
    const store = createTauriSaveStore();
    dialogState.openPath = '/tmp/a.json';
    fsState.failStat = true;
    fsState.files.set('/tmp/a.json', '{"x":2}');
    expect(await store.importFile()).toEqual({ x: 2 });
    fsState.files.set('/tmp/a.json', 'x'.repeat(2_000_001));
    await expect(store.importFile()).rejects.toMatchObject({ code: 'too-large' });
  });
});

describe('tauri : plateforme', () => {
  it('desktop : plein écran et quitter via la fenêtre', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
    const p = await createTauriPlatform();
    expect(p.kind).toBe('desktop');
    expect(p.storageWarning).toBeNull();
    await p.setFullscreen?.(true);
    expect(win.setFullscreen).toHaveBeenCalledWith(true);
    p.quit?.();
    expect(win.close).toHaveBeenCalled();
  });

  it('android : écoute du retour seulement avec un gestionnaire', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });
    const p = await createTauriPlatform();
    expect(p.kind).toBe('android');
    expect(p.setFullscreen).toBeUndefined();
    expect(appState.handler).toBeNull();
    let consume = true;
    const off = p.onBack(() => consume);
    await Promise.resolve();
    expect(appState.handler).not.toBeNull();
    appState.handler!({ canGoBack: false });
    expect(win.close).not.toHaveBeenCalled();
    consume = false;
    appState.handler!({ canGoBack: false });
    expect(win.close).toHaveBeenCalledOnce(); // comportement natif reproduit
    off();
    await Promise.resolve();
    await Promise.resolve();
    expect(appState.unregister).toHaveBeenCalledOnce();
  });

  it('dossier inaccessible → mémoire avec avertissement', async () => {
    fsState.failMkdir = true;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = await createTauriPlatform();
    warn.mockRestore();
    expect(p.storageWarning).toBe(TAURI_STORAGE_WARNING);
    await p.saves.save('auto', makeSave('auto'));
    expect(await p.saves.load('auto')).toEqual(makeSave('auto'));
  });

  it('detectKind', () => {
    expect(detectKind('… Android 13 …')).toBe('android');
    expect(detectKind('Macintosh')).toBe('desktop');
  });
});
