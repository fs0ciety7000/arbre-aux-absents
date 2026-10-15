/**
 * Panneau Carte (audit du 15/10/2026, §4) : lieu ouvert avec des pièces encore conditionnées
 * (mention sans nombre au lieu de « Fiches à trouver : 0 »), pièces devenues accessibles
 * (pastille « + » et bouton « Rouvrir »), lieu sans fonds (« Rien à consulter ici »).
 */
import type { CompiledCase, SaveState, SaveStore } from '@arbre/contract';
import { defaultProfile, defaultSettings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { C, clone, open, play, visit } from '../../../../../packages/engine/test/helpers';
import { GameStoreImpl, type StoreHost } from '../../lib/game/store.svelte';
import MapHarness from './MapHarness.svelte';

/** Port-Lanne : l'annuaire libre, la photo du quai après lecture de l'annuaire. */
const pending: CompiledCase = {
  ...clone(C),
  places: {
    ...clone(C.places),
    'port-lanne': {
      ...clone(C.places['port-lanne']!),
      documents: [
        { id: 'annuaire-lanne' },
        { id: 'photo-quai', requires: { read: 'annuaire-lanne' } },
      ],
    },
  },
  progression: { ...clone(C.progression), start: ['photo-noces'] },
  meta: { ...C.meta, intro: 'photo-noces' },
};

const empty: CompiledCase = {
  ...clone(C),
  places: {
    ...clone(C.places),
    'port-lanne': { ...clone(C.places['port-lanne']!), documents: [] },
  },
};

function html(content: CompiledCase, steps: (s: SaveState) => SaveState): string {
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
  const state = steps(newGame(content, { slot: 'slot-1', mode: 'standard', at: 1 }));
  const game = new GameStoreImpl(content, state, host);
  game.ui.selectedPlace = 'port-lanne';
  return render(MapHarness, { props: { game } })
    .body.replace(/<!--[^]*?-->/g, '')
    .replace(/ svelte-[a-z0-9]+/g, '');
}

const spot = (out: string) => out.match(/<button[^>]*data-place="port-lanne"[^>]*>/)?.[0] ?? '';
const sheet = (out: string) => out.slice(out.indexOf('<section class="place'));

describe('MapPanel : fonds du lieu', () => {
  it('ouvert, rien d’accessible, pièces en attente : mention sans nombre, ni coche ni « + »', () => {
    const out = html(
      pending,
      (s) => play(s, [open('photo-noces', 2), visit('port-lanne', 3)], {}, pending).state,
    );
    const place = sheet(out);
    expect(place).toContain('D’autres pièces de ce fonds s’ouvriront avec l’enquête.');
    expect(place).not.toContain('Fiches à trouver');
    expect(place).not.toContain('Rouvrir le fonds du lieu');
    expect(spot(out)).toMatch(/aria-label="Port-Lanne/);
    expect(spot(out)).not.toMatch(/tout consulté|nouvelles pièces/);
  });

  it('pièces devenues accessibles : pastille « + » nommée et bouton « Rouvrir »', () => {
    const out = html(
      pending,
      (s) =>
        play(
          s,
          [open('photo-noces', 2), visit('port-lanne', 3), open('annuaire-lanne', 4)],
          {},
          pending,
        ).state,
    );
    expect(spot(out)).toMatch(/aria-label="[^"]*nouvelles pièces à consulter"/);
    const place = sheet(out);
    expect(place).toContain('De nouvelles pièces de ce fonds sont accessibles.');
    expect(place).toContain('Fiches à trouver : 1');
    expect(place).toContain('Rouvrir le fonds du lieu');
  });

  it('rouvert : épuisé, coche, plus de signal', () => {
    const out = html(
      pending,
      (s) =>
        play(
          s,
          [
            open('photo-noces', 2),
            visit('port-lanne', 3),
            open('annuaire-lanne', 4),
            visit('port-lanne', 5),
          ],
          {},
          pending,
        ).state,
    );
    expect(spot(out)).toMatch(/aria-label="[^"]*tout consulté"/);
    expect(sheet(out)).not.toMatch(/Rouvrir|D’autres pièces|nouvelles pièces/);
  });

  it('lieu sans fonds : « Rien à consulter ici », coche gardée', () => {
    const out = html(empty, (s) => play(s, [visit('port-lanne', 2)], {}, empty).state);
    expect(spot(out)).toMatch(/aria-label="[^"]*tout consulté"/);
    const place = sheet(out);
    expect(place).toContain('Rien à consulter ici.');
    expect(place).not.toMatch(/Aucun document de ce lieu|Fiches à trouver/);
  });
});
