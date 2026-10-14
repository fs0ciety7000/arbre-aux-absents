/**
 * Store de partie : validation des groupes en attente à la fermeture, jamais au chargement (R1),
 * rapport final remis après « Revenir au bureau ».
 */
import type { GameEvent, SaveState, Settings } from '@arbre/contract';
import { defaultProfile, defaultSettings } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { SOLUTION, fixtureCase } from '../../../../../../packages/engine/test/fixtures/case';
import { createMemorySaveStore } from '../../../platform/memory';
import { BACKUP_AGE_MS, GameStoreImpl, type StoreHost } from '../store.svelte';

const c = fixtureCase;
const ELDERS = ['g0-elna', 'g1-tam', 'g1-lisbe'] as const;

function host(validation: Settings['validation'] = 'auto') {
  return {
    settings: { ...defaultSettings(), validation },
    profile: defaultProfile(),
    saveStore: createMemorySaveStore(),
    overlayOpen: false,
    updateSettings: vi.fn(),
    unlockAchievements: vi.fn(),
    showEnding: vi.fn(),
    showReport: vi.fn(),
    saveStatus: vi.fn(),
  } satisfies StoreHost;
}

/** Partie où tout est lu (noms, portraits et métiers disponibles). */
function base(): SaveState {
  const s = newGame(c, { slot: 'slot-1', mode: 'standard', at: 1_000 });
  const all = Object.fromEntries(Object.keys(c.documents).map((id) => [id, 1_000]));
  return { ...s, unlocked: all, read: all, revealedSlots: Object.keys(c.slots) };
}

function withElders(s: SaveState, missingGiven = false): SaveState {
  const tree = { ...s.tree };
  for (const id of ELDERS) tree[id] = { ...SOLUTION[id]! };
  if (missingGiven) tree['g1-lisbe'] = { ...tree['g1-lisbe']!, given: '' };
  return { ...s, tree };
}

const isLocked = (g: GameStoreImpl, id: string) => g.state.locked[id] !== undefined;

describe('groupes en attente (R1, 800 ms)', () => {
  it('« Sauvegarder et quitter » : prepareClose évalue tout de suite le groupe complété', () => {
    const h = host();
    const g = new GameStoreImpl(c, withElders(base(), true), h);
    g.start();
    g.dispatch({ type: 'setSlot', slot: 'g1-lisbe', patch: { given: 'Lisbé' } });
    expect(g.pendingGroups).toEqual(['grp-aines']);
    expect(isLocked(g, 'g1-lisbe')).toBe(false);
    g.prepareClose();
    expect(g.pendingGroups).toEqual([]);
    for (const id of ELDERS) expect(isLocked(g, id)).toBe(true);
    g.destroy();
  });

  it('destroy avec une évaluation en attente : verrouille et sauvegarde', async () => {
    const h = host();
    const g = new GameStoreImpl(c, withElders(base(), true), h);
    g.dispatch({ type: 'setSlot', slot: 'g1-lisbe', patch: { given: 'Lisbé' } });
    g.destroy();
    await vi.waitFor(async () => {
      const saved = (await h.saveStore.load('slot-1')) as SaveState | null;
      expect(saved?.locked['g1-lisbe']).toBeTypeOf('number');
    });
  });

  it('au chargement : un groupe complet et juste, jamais évalué, ne s’établit pas tout seul', () => {
    const g = new GameStoreImpl(c, withElders(base()), host());
    const events: GameEvent[] = [];
    g.onEvents((e) => events.push(...e));
    g.start();
    for (const id of ELDERS) expect(isLocked(g, id)).toBe(false);
    expect(g.pendingGroups).toEqual([]);
    expect(events).toEqual([]);
    g.destroy();
  });

  it('au chargement : rien non plus pour un groupe faux ou partiel, ni en validation manuelle', () => {
    const wrong = withElders(base());
    wrong.tree['g1-tam'] = { ...wrong.tree['g1-tam']!, occupation: 'meunier' };
    for (const state of [wrong, withElders(base(), true)]) {
      const g = new GameStoreImpl(c, state, host());
      const events: GameEvent[] = [];
      g.onEvents((e) => events.push(...e));
      g.start();
      expect(isLocked(g, 'g0-elna')).toBe(false);
      expect(events).toEqual([]);
      g.destroy();
    }

    const m = new GameStoreImpl(c, withElders(base()), host('manual'));
    m.start();
    expect(isLocked(m, 'g0-elna')).toBe(false);
    m.destroy();
  });

  it('après chargement, le groupe s’établit par le déclencheur normal (R1, 800 ms)', () => {
    vi.useFakeTimers();
    try {
      const g = new GameStoreImpl(c, withElders(base()), host());
      g.start();
      vi.advanceTimersByTime(5_000);
      expect(isLocked(g, 'g0-elna')).toBe(false);
      // Une case du groupe change (et reste complète) : évaluation 800 ms plus tard.
      g.dispatch({ type: 'setSlot', slot: 'g1-tam', patch: { occupation: 'meunier' } });
      g.dispatch({
        type: 'setSlot',
        slot: 'g1-tam',
        patch: { occupation: SOLUTION['g1-tam']!.occupation },
      });
      vi.advanceTimersByTime(799);
      expect(isLocked(g, 'g0-elna')).toBe(false);
      vi.advanceTimersByTime(1);
      for (const id of ELDERS) expect(isLocked(g, id)).toBe(true);
      g.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('validation manuelle : établi seulement par « Soumettre la branche »', () => {
    const m = new GameStoreImpl(c, withElders(base()), host('manual'));
    m.start();
    expect(isLocked(m, 'g0-elna')).toBe(false);
    m.dispatch({ type: 'validate' });
    for (const id of ELDERS) expect(isLocked(m, id)).toBe(true);
    m.destroy();
  });

  it('fermeture de la page : l’évaluation en attente est faite avant la sauvegarde', () => {
    // Environnement node : `start()` n'écoute la page que si `window` existe.
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('document', Object.assign(new EventTarget(), { hidden: false }));
    onTestFinished(() => void vi.unstubAllGlobals());
    const g = new GameStoreImpl(c, withElders(base(), true), host());
    g.start();
    g.dispatch({ type: 'setSlot', slot: 'g1-lisbe', patch: { given: 'Lisbé' } });
    expect(g.pendingGroups).toEqual(['grp-aines']);
    window.dispatchEvent(new Event('pagehide'));
    expect(g.pendingGroups).toEqual([]);
    for (const id of ELDERS) expect(isLocked(g, id)).toBe(true);
    g.destroy();
  });
});

describe('rapport final', () => {
  function complete(): SaveState {
    const s = base();
    const tree = Object.fromEntries(Object.keys(c.slots).map((id) => [id, { ...SOLUTION[id]! }]));
    const locked = Object.fromEntries(Object.keys(c.slots).map((id) => [id, 2_000]));
    return { ...s, tree, locked };
  }

  it('arbre complet sans dénouement : « Remettre le rapport » rouvre le rapport', () => {
    const h = host();
    const g = new GameStoreImpl(c, complete(), h);
    expect(g.reportAvailable).toBe(true);
    g.reportDismissed(); // « Revenir au bureau »
    g.reopenReport();
    expect(h.showReport).toHaveBeenCalledTimes(1);
    g.destroy();
  });

  it('indisponible tant que l’arbre est incomplet ou après le dénouement', () => {
    const h = host();
    const partial = new GameStoreImpl(c, base(), h);
    expect(partial.reportAvailable).toBe(false);
    partial.reopenReport();
    expect(h.showReport).not.toHaveBeenCalled();
    partial.destroy();

    const ended = new GameStoreImpl(c, { ...complete(), ending: Object.keys(c.endings)[0]! }, h);
    expect(ended.reportAvailable).toBe(false);
    ended.destroy();
  });
});

describe('cartes de révélation', () => {
  it('« Génération n complète » : même numéro que la cote de l’arbre (contenu numéroté dès 1)', () => {
    const shifted = structuredClone(c);
    for (const slot of Object.values(shifted.slots)) slot.generation += 1;
    const s = newGame(shifted, { slot: 'slot-1', mode: 'standard', at: 1_000 });
    const all = Object.fromEntries(Object.keys(shifted.documents).map((id) => [id, 1_000]));
    const state = withElders({ ...s, unlocked: all, read: all, revealedSlots: [] });
    const g = new GameStoreImpl(shifted, state, host('manual'));
    g.dispatch({ type: 'validate' });
    // g0-ivo (pré-rempli) et g0-elna établis : la première génération est complète.
    expect(g.reveals.map((r) => r.title)).toContain('Génération 1 complète');
    expect(g.reveals.map((r) => r.title)).not.toContain('Génération 2 complète');
    g.destroy();
  });
});

describe('secours automatique (AFFAIRE-2 §2.3)', () => {
  it('après 10 min, le secours va sous l’affaire jouée et laisse celui d’une autre affaire', async () => {
    const h = host();
    const other = { ...base(), caseId: 'autre-affaire', slot: 'auto' as const, elapsedMs: 42 };
    await h.saveStore.save('auto', other);
    let t = 1_000_000;
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => t);
    onTestFinished(() => spy.mockRestore());
    const g = new GameStoreImpl(c, base(), h);
    t += BACKUP_AGE_MS;
    expect(await g.flush(true)).toBe(true);
    g.destroy();
    expect(await h.saveStore.load('auto', 'autre-affaire')).toEqual(other);
    expect(await h.saveStore.load('auto', c.id)).toMatchObject({ caseId: c.id, slot: 'auto' });
    expect((await h.saveStore.list()).filter((s) => s.slot === 'auto')).toHaveLength(2);
  });
});
