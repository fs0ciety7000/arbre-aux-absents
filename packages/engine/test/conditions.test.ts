import { defaultProfile, type OutcomeCondition, type SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { evaluate, evaluateAchievementCondition } from '../src';
import { C, deepFreeze, start } from './helpers';

function withState(patch: Partial<SaveState>): SaveState {
  return deepFreeze({ ...start(), ...patch });
}

describe('evaluate', () => {
  const s = withState({
    read: { 'lettre-notaire': 1 },
    unlocked: { 'lettre-notaire': 1, 'photo-noces': 1 },
    searched: ['kw-marrel'],
    visited: ['port-lanne'],
    locked: { 'g0-ivo': 1, 'g0-elna': 2, 'g1-tam': 2, 'g1-lisbe': 2 },
    secrets: { 'sec-double-vie': 3 },
  });

  it.each<[OutcomeCondition, boolean]>([
    [{ read: 'lettre-notaire' }, true],
    [{ read: 'photo-noces' }, false],
    [{ unlocked: 'photo-noces' }, true],
    [{ unlocked: 'epilogue' }, false],
    [{ searched: 'kw-marrel' }, true],
    [{ searched: 'kw-sorvo' }, false],
    [{ visited: 'port-lanne' }, true],
    [{ visited: 'vessaut' }, false],
    [{ locked: 'g1-tam' }, true],
    [{ locked: 'g2-mira' }, false],
    [{ groupLocked: 'grp-aines' }, true],
    [{ groupLocked: 'grp-cadets' }, false],
    [{ groupLocked: 'groupe-inconnu' }, false],
    [{ secret: 'sec-double-vie' }, true],
    [{ secret: 'autre' }, false],
    [{ lockedCount: { gte: 4 } }, true],
    [{ lockedCount: { gte: 5 } }, false],
    [{ all: [{ read: 'lettre-notaire' }, { visited: 'port-lanne' }] }, true],
    [{ all: [{ read: 'lettre-notaire' }, { visited: 'vessaut' }] }, false],
    [{ any: [{ read: 'photo-noces' }, { visited: 'port-lanne' }] }, true],
    [{ any: [{ read: 'photo-noces' }, { visited: 'vessaut' }] }, false],
    [{ not: { read: 'photo-noces' } }, true],
    [{ not: { not: { read: 'photo-noces' } } }, false],
  ])('%j → %s', (cond, expected) => {
    expect(evaluate(cond, s, C)).toBe(expected);
  });

  it('forme inconnue ou nulle → faux, sans exception', () => {
    expect(evaluate({ bidon: 1 } as unknown as OutcomeCondition, s, C)).toBe(false);
    expect(evaluate(null as unknown as OutcomeCondition, s, C)).toBe(false);
  });
});

describe('evaluateAchievementCondition', () => {
  const profile = deepFreeze(defaultProfile());

  it('endingReached : partie en cours ou profil', () => {
    const s = withState({ ending: 'fin-arbre' });
    expect(evaluateAchievementCondition({ endingReached: 'fin-arbre' }, s, profile, C)).toBe(true);
    expect(evaluateAchievementCondition({ endingReached: 'fin-verite' }, s, profile, C)).toBe(
      false,
    );
    const p2 = { ...profile, completed: { 'affaire-test': { endings: ['fin-verite'] } } };
    expect(evaluateAchievementCondition({ endingReached: 'fin-verite' }, s, p2, C)).toBe(true);
  });

  it('timedUnderMs : mode chronométré terminé sous le temps, ou meilleur temps du profil', () => {
    const base = { mode: 'timed' as const, ending: 'fin-arbre', elapsedMs: 1000 };
    expect(evaluateAchievementCondition({ timedUnderMs: 2000 }, withState(base), profile, C)).toBe(
      true,
    );
    expect(evaluateAchievementCondition({ timedUnderMs: 1000 }, withState(base), profile, C)).toBe(
      false,
    );
    expect(
      evaluateAchievementCondition(
        { timedUnderMs: 2000 },
        withState({ ...base, mode: 'standard' }),
        profile,
        C,
      ),
    ).toBe(false);
    expect(
      evaluateAchievementCondition(
        { timedUnderMs: 2000 },
        withState({ ...base, ending: null }),
        profile,
        C,
      ),
    ).toBe(false);
    const p2 = { ...profile, completed: { 'affaire-test': { endings: [], bestTimedMs: 500 } } };
    expect(evaluateAchievementCondition({ timedUnderMs: 1000 }, withState({}), p2, C)).toBe(true);
  });

  it('allSecrets, all, any, not et conditions ordinaires', () => {
    const none = withState({});
    const all = withState({ secrets: { 'sec-double-vie': 1 } });
    expect(evaluateAchievementCondition({ allSecrets: true }, none, profile, C)).toBe(false);
    expect(evaluateAchievementCondition({ allSecrets: true }, all, profile, C)).toBe(true);
    expect(evaluateAchievementCondition({ not: { allSecrets: true } }, none, profile, C)).toBe(
      true,
    );
    expect(
      evaluateAchievementCondition(
        { all: [{ allSecrets: true }, { lockedCount: { gte: 1 } }] },
        all,
        profile,
        C,
      ),
    ).toBe(true);
    expect(
      evaluateAchievementCondition(
        { any: [{ allSecrets: true }, { read: 'epilogue' }] },
        none,
        profile,
        C,
      ),
    ).toBe(false);
    expect(evaluateAchievementCondition({ locked: 'g0-ivo' }, none, profile, C)).toBe(true);
    expect(evaluateAchievementCondition(null as never, none, profile, C)).toBe(false);
    const noSecrets = { ...C, progression: { ...C.progression, secrets: [] } };
    expect(evaluateAchievementCondition({ allSecrets: true }, none, profile, noSecrets)).toBe(
      false,
    );
  });
});
