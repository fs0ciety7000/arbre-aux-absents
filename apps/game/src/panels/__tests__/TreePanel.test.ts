import type { CompiledCase, SaveStore } from '@arbre/contract';
import { defaultProfile, defaultSettings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { ICONS } from '@arbre/ui';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { fixtureCase } from '../../../../../packages/engine/test/fixtures/case';
import { GameStoreImpl, type StoreHost } from '../../lib/game/store.svelte';
import TreeHarness from './TreeHarness.svelte';

function store(content: CompiledCase = fixtureCase): GameStoreImpl {
  const host: StoreHost = {
    settings: defaultSettings(),
    profile: defaultProfile(),
    saveStore: {} as SaveStore,
    updateSettings: () => {},
    unlockAchievements: () => {},
    showEnding: () => {},
    showReport: () => {},
    saveStatus: () => {},
    overlayOpen: false,
  };
  const state = newGame(content, { slot: 'slot-1', mode: 'standard', at: 1 });
  return new GameStoreImpl(content, state, host);
}

const html = (content?: CompiledCase) =>
  render(TreeHarness, { props: { game: store(content) } })
    .body.replace(/<!--[^]*?-->/g, '')
    .replace(/ svelte-[a-z0-9]+/g, '');

describe('TreePanel', () => {
  it('les onglets de vue pilotent un tabpanel existant (aria-controls valide)', () => {
    const out = html();
    const controls = [...out.matchAll(/role="tab"[^>]*aria-controls="([^"]+)"/g)].map((m) => m[1]);
    expect(controls.length).toBe(3);
    for (const id of controls) {
      expect(out).toMatch(
        new RegExp(`id="${id}"[^>]*role="tabpanel"|role="tabpanel"[^>]*id="${id}"`),
      );
    }
    expect(out).toMatch(/role="tabpanel"[^>]*aria-labelledby="tree-view-tab-graph"/);
  });

  it('une case vide montre une silhouette neutre, jamais le visage souriant', () => {
    const out = html();
    const empty = out
      .split('data-slot=')
      .slice(1)
      .filter((s) => /case vide/.test(s));
    expect(empty.length).toBeGreaterThan(0);
    const smile = ICONS.face[3];
    const unknown = ICONS['unknown-person'][1];
    for (const slot of empty) {
      const card = slot.slice(0, slot.indexOf('</button>'));
      expect(card).not.toContain(smile);
      expect(card).toContain(unknown);
    }
  });

  it('le groupe de zoom a son propre nom (pas celui des onglets)', () => {
    expect(html()).toMatch(/class="zoom" role="group" aria-label="Zoom de l’arbre"/);
  });

  it('cote de génération : rang dans toute l’affaire, pas indice de rangée visible', () => {
    // Générations numérotées à partir de 1 dans le contenu, et un aïeul encore caché tout en haut :
    // la première rangée visible est la génération II, et le reste après sa révélation.
    const shifted = structuredClone(fixtureCase) as CompiledCase;
    for (const slot of Object.values(shifted.slots)) slot.generation += 1;
    shifted.slots['g0-aieul'] = {
      ...shifted.slots['g0-elna']!,
      id: 'g0-aieul',
      generation: 0,
      column: 5,
      unions: [],
      revealedBy: { read: 'telegramme-juno' },
    };
    const cote = (out: string, slot: string) =>
      out.match(new RegExp(`data-slot="${slot}"[^]*?class="gen num">([IVX]+)<`))?.[1];
    const out = html(shifted);
    expect(out).not.toContain('data-slot="g0-aieul"');
    expect(cote(out, 'g0-elna')).toBe('II');
    expect(cote(out, 'g1-tam')).toBe('III');
    expect(cote(out, 'g2-cael')).toBe('IV');
  });
});
