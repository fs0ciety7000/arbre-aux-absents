import { describe, expect, it, vi } from 'vitest';
import type { UpdateOffer, UpdateSource } from '../../../platform/update';
import { loadUpdateSource, UpdateState } from '../update.svelte';

const OFFER: UpdateOffer = { version: '1.4.0', notes: null, action: 'install', url: null };

function source(over: Partial<UpdateSource> = {}): UpdateSource {
  return {
    check: vi.fn(async () => OFFER),
    install: vi.fn(async (onProgress) => {
      onProgress({ downloaded: 25, total: 100 });
      onProgress({ downloaded: 100, total: 100 });
    }),
    openDownload: vi.fn(async () => true),
    ...over,
  };
}

describe('UpdateState', () => {
  it('web (pas de source) : non pris en charge, aucune invite', async () => {
    const u = new UpdateState();
    await u.start(async () => null);
    expect(u.supported).toBe(false);
    expect(u.prompt).toBe(false);
    await u.check(true);
    expect(u.status).toBe('idle');
  });

  it('vérification au lancement : invite si une version plus récente existe', async () => {
    const u = new UpdateState();
    await u.start(async () => source());
    expect(u.supported).toBe(true);
    expect(u.status).toBe('available');
    expect(u.prompt).toBe(true);
  });

  it('échec au lancement (hors ligne) : silencieux', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const u = new UpdateState();
    await u.start(async () => source({ check: vi.fn(async () => Promise.reject(new Error('x'))) }));
    expect(u.status).toBe('idle');
    expect(u.error).toBeNull();
    expect(u.prompt).toBe(false);
    expect(info).toHaveBeenCalled();
    info.mockRestore();
  });

  it('source qui échoue à se charger : silencieux, non pris en charge', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const u = new UpdateState();
    await u.start(async () => Promise.reject(new Error('plugin')));
    expect(u.supported).toBe(false);
    info.mockRestore();
  });

  it('vérification manuelle : à jour, ou échec affiché', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const check = vi.fn<UpdateSource['check']>().mockResolvedValueOnce(null);
    const u = new UpdateState();
    await u.start(async () => source({ check }));
    expect(u.status).toBe('current');
    check.mockRejectedValueOnce(new Error('offline'));
    await u.check(true);
    expect(u.error).toBe('check');
    expect(u.status).toBe('idle');
    info.mockRestore();
  });

  it('vérifications simultanées partagées', async () => {
    const s = source();
    const u = new UpdateState();
    await u.start(async () => s);
    await Promise.all([u.check(), u.check()]);
    expect(s.check).toHaveBeenCalledTimes(2); // lancement + une seule manuelle
  });

  it('« Plus tard » masque l’invite ; une vérification manuelle la remontre', async () => {
    const u = new UpdateState();
    await u.start(async () => source());
    u.later();
    expect(u.prompt).toBe(false);
    await u.check(true);
    expect(u.prompt).toBe(true);
  });

  it('installer : sauvegarde d’abord, progression, puis installation', async () => {
    const s = source();
    const u = new UpdateState();
    await u.start(async () => s);
    const order: string[] = [];
    const seen: Array<number | null> = [];
    (s.install as ReturnType<typeof vi.fn>).mockImplementation(
      async (cb: (p: { downloaded: number; total: number | null }) => void) => {
        order.push('install');
        cb({ downloaded: 50, total: 100 });
        seen.push(u.progress);
        expect(u.status).toBe('downloading');
        expect(u.busy).toBe(true);
        u.later(); // sans effet pendant l'installation
        cb({ downloaded: 100, total: 100 });
        expect(u.status).toBe('installing');
      },
    );
    await u.apply(async () => {
      order.push('save');
    });
    expect(order).toEqual(['save', 'install']);
    expect(seen).toEqual([0.5]);
    expect(u.status).toBe('installing');
    expect(u.dismissed).toBe(false);
  });

  it('échec d’installation : erreur visible, offre conservée', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const u = new UpdateState();
    await u.start(async () =>
      source({ install: vi.fn(async () => Promise.reject(new Error('sig'))) }),
    );
    await u.apply();
    expect(u.status).toBe('available');
    expect(u.error).toBe('install');
    expect(u.prompt).toBe(true);
    warn.mockRestore();
  });

  it('offre « download » : ouvre le lien, signale un refus', async () => {
    const open = vi
      .fn<UpdateSource['openDownload']>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const offer: UpdateOffer = { version: '1.4.0', notes: null, action: 'download', url: 'x' };
    const s = source({ check: vi.fn(async () => offer), openDownload: open });
    const u = new UpdateState();
    await u.start(async () => s);
    await u.apply();
    expect(u.error).toBeNull();
    expect(s.install).not.toHaveBeenCalled();
    await u.apply();
    expect(u.error).toBe('open');
  });
});

it('loadUpdateSource : rien hors build Tauri', async () => {
  expect(await loadUpdateSource('desktop', '1.3.1')).toBeNull();
  expect(await loadUpdateSource('web', '1.3.1')).toBeNull();
});
