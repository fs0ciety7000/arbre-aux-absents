import { defaultProfile, type GameEvent } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  endingFor,
  endingSections,
  evaluateAchievements,
  progress,
  summarize,
  whereToLook,
  type SweepGuard,
} from '../src';
import { C, events, find, FULL_ROUTE, open, play, start } from './helpers';

describe('partie complète de la fixture', () => {
  it('de la nouvelle partie à la fin « La vérité », état gelé à chaque étape', () => {
    let state = start('timed');
    let guard: SweepGuard | undefined;
    const all: GameEvent[] = [];
    for (const a of FULL_ROUTE) {
      const r = play(state, [a], guard ? { guard } : {});
      expect(events(r.events, 'rejected'), JSON.stringify(a)).toEqual([]);
      state = r.state;
      guard = r.guard;
      all.push(...r.events);
    }
    expect(events(all, 'slotsLocked').map((e) => e.ids)).toEqual([
      ['g0-elna', 'g1-tam', 'g1-lisbe'],
      ['g1-oren', 'g2-cael', 'g2-mira'],
      ['g2-juno'],
    ]);
    expect(events(all, 'secretFound')).toEqual([{ type: 'secretFound', id: 'sec-double-vie' }]);
    expect(events(all, 'endingReached')).toEqual([{ type: 'endingReached', id: 'fin-verite' }]);
    expect(state.ending).toBe('fin-verite');
    expect(state.report).toEqual({ 'q-auteur': 'o-tam', 'q-remise': 'o-remettre' });
    expect(endingSections('fin-verite', state, C).map((x) => x.label)).toEqual(['commun', 'remis']);
    expect(progress(state, C)).toEqual({ locked: 8, total: 8, visible: 8, ratio: 1, secrets: 1 });
    expect(Object.keys(state.unlocked).sort()).toEqual(Object.keys(C.documents).sort());
    // Seule piste restante : la coupure de presse facultative, jamais ouverte.
    expect(whereToLook(state, C)).toEqual({ kind: 'document', id: 'journal-crue' });

    const profile = defaultProfile();
    expect(evaluateAchievements(state, profile, C)).toEqual([
      'ach-premier-groupe',
      'ach-verite',
      'ach-eclair',
      'ach-tous-secrets',
      'ach-curieux',
    ]);
    const known = { ...profile, achievements: { 'ach-verite': 1, 'ach-eclair': 1 } };
    expect(evaluateAchievements(state, known, C)).toEqual([
      'ach-premier-groupe',
      'ach-tous-secrets',
      'ach-curieux',
    ]);
    expect(summarize(state, C)).toEqual({
      slot: 'slot-1',
      caseId: 'affaire-test',
      caseTitle: 'Les Marrel de Port-Lanne',
      updatedAt: 30000,
      elapsedMs: 4000,
      mode: 'timed',
      progress: 1,
    });
  });

  it('sans le secret : fin « L’arbre établi » (priorité) et succès « Les yeux fermés »', () => {
    const route = FULL_ROUTE.filter(
      (a) =>
        !(a.type === 'search' && a.query === 'Vessaut') &&
        !(a.type === 'openDocument' && a.id === 'acte-secret'),
    );
    const r = play(start(), route);
    // Sans le secret, l'option « remettre » n'est pas disponible : seul ce choix est refusé.
    expect(events(r.events, 'rejected')).toEqual([{ type: 'rejected', reason: 'notAvailable' }]);
    expect(r.state.report).toEqual({ 'q-auteur': 'o-tam' });
    expect(endingFor(r.state, C)).toBe('fin-arbre');
    expect(r.state.ending).toBe('fin-arbre');
    expect(endingSections('fin-arbre', r.state, C).map((x) => x.label)).toEqual([null]);
    expect(evaluateAchievements(r.state, defaultProfile(), C)).toEqual([
      'ach-premier-groupe',
      'ach-sans-secret',
      'ach-curieux',
    ]);
    // La partie continue : trouver le secret puis rejouer le dénouement change la fin.
    const r2 = play(r.state, [
      find('Vessaut', 40000),
      open('acte-secret', 40100),
      { type: 'finish', at: 40200 },
    ]);
    expect(r2.state.ending).toBe('fin-verite');
    // Après `finish`, le rapport est figé.
    expect(
      events(
        play(r2.state, [{ type: 'answer', question: 'q-auteur', option: 'o-elna', at: 40300 }])
          .events,
        'rejected',
      ),
    ).toEqual([{ type: 'rejected', reason: 'notAvailable' }]);
  });

  it('fins à égalité de priorité : l’id le plus petit l’emporte', () => {
    const c = {
      ...C,
      endings: {
        zeta: { when: { lockedCount: { gte: 1 } }, priority: 5, title: 'Z', sections: [] },
        alpha: { when: { lockedCount: { gte: 1 } }, priority: 5, title: 'A', sections: [] },
        basse: { when: { lockedCount: { gte: 1 } }, priority: 1, title: 'B', sections: [] },
      },
    };
    expect(endingFor(start(), c)).toBe('alpha');
  });
});
