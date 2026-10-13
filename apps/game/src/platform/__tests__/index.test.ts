import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlatform, platformTarget, resetPlatformForTests, setSaveSummarizer } from '../index';
import { makeSave } from './fixtures';

afterEach(() => resetPlatformForTests());

describe('getPlatform', () => {
  it('cible web par défaut, instance unique', async () => {
    expect(platformTarget()).toBe('web');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = getPlatform();
    expect(getPlatform()).toBe(a);
    const p = await a;
    warn.mockRestore();
    expect(p.kind).toBe('web');
    // Node sans IndexedDB ni localStorage : mode mémoire avec avertissement.
    expect(p.storageWarning).not.toBeNull();
  });

  it('le summarizer injecté après coup est utilisé', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = await getPlatform();
    warn.mockRestore();
    setSaveSummarizer((s) => ({
      slot: s.slot,
      caseTitle: 'Affaire injectée',
      updatedAt: s.updatedAt,
      elapsedMs: s.elapsedMs,
      mode: s.mode,
      progress: 0.75,
    }));
    await p.saves.save('slot-1', makeSave('slot-1'));
    expect((await p.saves.list())[0]).toMatchObject({
      caseTitle: 'Affaire injectée',
      progress: 0.75,
    });
  });
});
