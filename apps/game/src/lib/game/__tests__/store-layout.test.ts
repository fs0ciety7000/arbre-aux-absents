/** Dispositions du Bureau, fiche flottante et plein écran du document (état du store). */
import { defaultProfile, defaultSettings, type Settings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it, vi } from 'vitest';
import { fixtureCase } from '../../../../../../packages/engine/test/fixtures/case';
import { createMemorySaveStore } from '../../../platform/memory';
import { clampCardPosition, moveCard } from '../reading';
import { GameStoreImpl, type StoreHost } from '../store.svelte';

function setup(patch: Partial<Settings> = {}) {
  const h = {
    settings: { ...defaultSettings(), ...patch } as Settings,
    profile: defaultProfile(),
    saveStore: createMemorySaveStore(),
    overlayOpen: false,
    updateSettings: vi.fn((p: Partial<Settings>) => {
      h.settings = { ...h.settings, ...p };
    }),
    unlockAchievements: vi.fn(),
    showEnding: vi.fn(),
    showReport: vi.fn(),
    saveStatus: vi.fn(),
  } satisfies StoreHost;
  const s = newGame(fixtureCase, { slot: 'slot-1', mode: 'standard', at: 1_000 });
  return { h, g: new GameStoreImpl(fixtureCase, s, h) };
}

describe('position de la fiche', () => {
  it('bornée à [0, 1]', () => {
    expect(clampCardPosition({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 });
    expect(clampCardPosition({ x: Number.NaN, y: 0.12345 })).toEqual({ x: 0, y: 0.123 });
  });
  it('un déplacement en px devient une fraction de la place libre', () => {
    expect(moveCard({ x: 1, y: 0 }, -450, 100, { w: 900, h: 400 })).toEqual({ x: 0.5, y: 0.25 });
    expect(moveCard({ x: 0.5, y: 0.5 }, -5000, 5000, { w: 900, h: 400 })).toEqual({ x: 0, y: 1 });
    // Pas de place libre : la position ne bouge pas sur cet axe.
    expect(moveCard({ x: 0.3, y: 0.3 }, 100, 100, { w: 0, h: 0 })).toEqual({ x: 0.3, y: 0.3 });
  });
});

describe('dispositions', () => {
  it('Lecture montre le Lecteur et enregistre la disposition', () => {
    const { g, h } = setup();
    g.sideCollapsed = true;
    g.ui.side = 'archives';
    g.setLayout('read');
    expect(h.updateSettings).toHaveBeenCalledWith({ layout: 'read' });
    expect(g.layout).toBe('read');
    expect(g.ui.side).toBe('reader');
    expect(g.sideCollapsed).toBe(false);
    g.destroy();
  });

  it('« Vers l’arbre » depuis Lecture repasse en Enquête', () => {
    const { g } = setup({ layout: 'read' });
    g.navigate({ kind: 'panel', id: 'tree' });
    expect(g.layout).toBe('investigate');
    g.destroy();
  });

  it('fiche : aperçu pendant le glissement, une écriture à la fin', () => {
    const { g, h } = setup({ layout: 'tree' });
    g.previewCardPosition({ x: 0.4, y: 0.6 });
    expect(g.cardPosition).toEqual({ x: 0.4, y: 0.6 });
    expect(h.updateSettings).not.toHaveBeenCalled();
    g.commitCardPosition();
    expect(h.updateSettings).toHaveBeenCalledWith({ cardPosition: { x: 0.4, y: 0.6 } });
    g.destroy();
  });
});

describe('plein écran du document', () => {
  it('Retour (Échap, B) le quitte avant toute pause', () => {
    const { g } = setup();
    g.setReaderFull(true);
    g.back();
    expect(g.readerFull).toBe(false);
    expect(g.modal).toBeNull();
    g.back();
    expect(g.modal?.kind).toBe('pause');
    g.destroy();
  });
});
