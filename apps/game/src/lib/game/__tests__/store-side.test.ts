/** Largeur du volet latéral : lue dans les réglages, enregistrée en fin de geste seulement. */
import { SIDE_WIDTH, defaultProfile, defaultSettings, type Settings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it, vi } from 'vitest';
import { fixtureCase } from '../../../../../../packages/engine/test/fixtures/case';
import { createMemorySaveStore } from '../../../platform/memory';
import { GameStoreImpl, type StoreHost } from '../store.svelte';

function setup(sideWidth: number = SIDE_WIDTH.standard) {
  const h = {
    settings: { ...defaultSettings(), sideWidth } as Settings,
    profile: defaultProfile(),
    saveStore: createMemorySaveStore(),
    overlayOpen: false,
    updateSettings: vi.fn((patch: Partial<Settings>) => {
      h.settings = { ...h.settings, ...patch };
    }),
    unlockAchievements: vi.fn(),
    showEnding: vi.fn(),
    showReport: vi.fn(),
    saveStatus: vi.fn(),
  } satisfies StoreHost;
  const s = newGame(fixtureCase, { slot: 'slot-1', mode: 'standard', at: 1_000 });
  return { h, g: new GameStoreImpl(fixtureCase, s, h) };
}

describe('largeur du volet mémorisée', () => {
  it('part de la largeur des réglages', () => {
    const { g } = setup(600);
    expect(g.sideWidth).toBe(600);
    g.destroy();
  });

  it('glissement : aperçu sans enregistrer, puis une seule écriture à la fin', () => {
    const { g, h } = setup();
    g.previewSideWidth(500);
    g.previewSideWidth(520.4);
    expect(g.sideWidth).toBe(520);
    expect(h.updateSettings).not.toHaveBeenCalled();
    g.commitSideWidth();
    expect(h.updateSettings).toHaveBeenCalledTimes(1);
    expect(h.updateSettings).toHaveBeenCalledWith({ sideWidth: 520 });
    expect(g.sideWidth).toBe(520);
    g.destroy();
  });

  it('affectation directe bornée et enregistrée (clavier, double-clic, raccourcis)', () => {
    const { g, h } = setup();
    g.sideWidth = 10_000;
    expect(h.updateSettings).toHaveBeenLastCalledWith({ sideWidth: SIDE_WIDTH.max });
    expect(g.sideWidth).toBe(SIDE_WIDTH.max);
    g.destroy();
  });
});
