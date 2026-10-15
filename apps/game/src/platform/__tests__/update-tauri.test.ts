import { describe, expect, it, vi } from 'vitest';
import {
  createAndroidUpdateSource,
  createDesktopUpdateSource,
  createTauriUpdateSource,
  type PluginUpdate,
  type TauriUpdateDeps,
} from '../update-tauri';
import { ITCH_PAGE, LATEST_RELEASE_API } from '../update';

const APK =
  'https://github.com/fs0ciety7000/arbre-aux-absents/releases/download/v1.4.0/arbre-aux-absents-1.4.0.apk';

/** Mise à jour simulée du plugin : 2 morceaux de 50 octets. */
function pluginUpdate(version = '1.4.0'): PluginUpdate & { closed: number } {
  const u = {
    version,
    body: '<!-- fr -->\nNotes',
    closed: 0,
    downloadAndInstall: vi.fn(async (cb?: Parameters<PluginUpdate['downloadAndInstall']>[0]) => {
      cb?.({ event: 'Started', data: { contentLength: 100 } });
      cb?.({ event: 'Progress', data: { chunkLength: 50 } });
      cb?.({ event: 'Progress', data: { chunkLength: 50 } });
      cb?.({ event: 'Finished' });
    }),
    close: vi.fn(async () => {
      u.closed++;
    }),
  };
  return u;
}

function deps(over: Partial<TauriUpdateDeps> = {}): TauriUpdateDeps {
  return {
    check: vi.fn(async () => null),
    relaunch: vi.fn(async () => {}),
    bundleType: vi.fn(async () => 'nsis'),
    openUrl: vi.fn(async () => {}),
    fetch: vi.fn(async () => new Response('{}', { status: 200 })),
    ...over,
  };
}

describe('desktop', () => {
  it('installe avec progression puis relance', async () => {
    const update = pluginUpdate();
    const d = deps({ check: vi.fn(async () => update) });
    const src = createDesktopUpdateSource(d, '1.3.1');
    const offer = await src.check();
    expect(offer).toEqual({
      version: '1.4.0',
      notes: '<!-- fr -->\nNotes',
      action: 'install',
      url: null,
    });
    const steps: Array<[number, number | null]> = [];
    await src.install((p) => steps.push([p.downloaded, p.total]));
    expect(steps).toEqual([
      [0, 100],
      [50, 100],
      [100, 100],
      [100, 100],
    ]);
    expect(d.relaunch).toHaveBeenCalledOnce();
    expect(d.check).toHaveBeenCalledWith({ timeout: 15_000 });
  });

  it('à jour : null ; install sans offre en attente : erreur', async () => {
    const src = createDesktopUpdateSource(deps(), '1.3.1');
    expect(await src.check()).toBeNull();
    await expect(src.install(() => {})).rejects.toThrow();
  });

  it('ignore une version égale ou plus ancienne annoncée par erreur', async () => {
    const old = pluginUpdate('1.3.1');
    const src = createDesktopUpdateSource(deps({ check: vi.fn(async () => old) }), '1.3.1');
    expect(await src.check()).toBeNull();
    expect(old.closed).toBe(1);
  });

  it('deb, rpm, msi : lien itch.io, jamais d’installation', async () => {
    for (const bundle of ['deb', 'rpm', 'msi', null]) {
      const update = pluginUpdate();
      const d = deps({ check: vi.fn(async () => update), bundleType: vi.fn(async () => bundle) });
      const src = createDesktopUpdateSource(d, '1.3.1');
      const offer = await src.check();
      expect(offer).toMatchObject({ action: 'download', url: ITCH_PAGE });
      expect(update.closed).toBe(1);
      await expect(src.install(() => {})).rejects.toThrow();
      expect(await src.openDownload(offer!)).toBe(true);
      expect(d.openUrl).toHaveBeenCalledWith(ITCH_PAGE);
    }
  });

  it('une nouvelle vérification libère la mise à jour précédente', async () => {
    const first = pluginUpdate();
    const second = pluginUpdate('1.4.1');
    const check = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const src = createDesktopUpdateSource(deps({ check }), '1.3.1');
    await src.check();
    expect((await src.check())?.version).toBe('1.4.1');
    expect(first.closed).toBe(1);
  });

  it('une erreur réseau remonte (l’appelant reste silencieux)', async () => {
    const src = createDesktopUpdateSource(
      deps({ check: vi.fn(async () => Promise.reject(new Error('offline'))) }),
      '1.3.1',
    );
    await expect(src.check()).rejects.toThrow('offline');
  });
});

describe('android', () => {
  const json = {
    tag_name: 'v1.4.0',
    body: 'Notes',
    assets: [{ name: 'arbre-aux-absents-1.4.0.apk', browser_download_url: APK }],
  };

  it('lit l’API GitHub et propose l’APK signé', async () => {
    const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json(json));
    const d = deps({ fetch });
    const src = createAndroidUpdateSource(d, '1.3.1');
    const offer = await src.check();
    expect(offer).toEqual({ version: '1.4.0', notes: 'Notes', action: 'download', url: APK });
    expect(fetch.mock.calls[0]![0]).toBe(LATEST_RELEASE_API);
    expect(await src.openDownload(offer!)).toBe(true);
    expect(d.openUrl).toHaveBeenCalledWith(APK);
    await expect(src.install(() => {})).rejects.toThrow();
  });

  it('404 (aucune release) : null ; autre erreur HTTP : lève', async () => {
    const none = createAndroidUpdateSource(
      deps({ fetch: vi.fn(async () => new Response('', { status: 404 })) }),
      '1.3.1',
    );
    expect(await none.check()).toBeNull();
    const limited = createAndroidUpdateSource(
      deps({ fetch: vi.fn(async () => new Response('', { status: 403 })) }),
      '1.3.1',
    );
    await expect(limited.check()).rejects.toThrow('403');
  });

  it('refuse d’ouvrir une URL hors liste', async () => {
    const d = deps();
    const src = createAndroidUpdateSource(d, '1.3.1');
    const ok = await src.openDownload({
      version: '9.9.9',
      notes: null,
      action: 'download',
      url: 'https://evil.example/x.apk',
    });
    expect(ok).toBe(false);
    expect(d.openUrl).not.toHaveBeenCalled();
  });
});

it('createTauriUpdateSource choisit la source selon la plateforme', async () => {
  const d = deps({ fetch: vi.fn(async () => new Response('', { status: 404 })) });
  expect(await (await createTauriUpdateSource('android', '1.3.1', d)).check()).toBeNull();
  expect(d.fetch).toHaveBeenCalledOnce();
  expect(await (await createTauriUpdateSource('desktop', '1.3.1', d)).check()).toBeNull();
  expect(d.check).toHaveBeenCalledOnce();
});
