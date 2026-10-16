import {
  defaultProfile,
  SaveStateSchema,
  type Action,
  type SaveState,
  type TimedSplit,
} from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  completeCase,
  evaluateAchievements,
  newGame,
  officialTime,
  parseSave,
  recordContest,
  splitDeltas,
  upgradeSave,
} from '../src';
import { CLAIM, CLAIMED_SLOT, claimedCase } from './fixtures/claimed';
import {
  AINES_RESEARCH,
  C,
  clone,
  deepFreeze,
  events,
  fill,
  FULL_ROUTE,
  play,
  start,
} from './helpers';

const tick = (deltaMs: number): Action => ({ type: 'tick', deltaMs });
const reopen = (at: number): Action => ({ type: 'reopenReport', at });

/** Route complète avec du temps de jeu entre les groupes (fractionnés distincts). */
function timedRoute(): Action[] {
  const out: Action[] = [];
  for (const a of FULL_ROUTE) {
    out.push(a);
    if (a.type === 'setSlot') out.push(tick(1000));
  }
  return out;
}

describe('rapport remis et rapport refait', () => {
  it('`finish` note le rapport remis et le temps du premier dénouement', () => {
    const r = play(start(), FULL_ROUTE);
    expect(r.state.ending).toBe('fin-verite');
    expect(r.state.endedMs).toBe(4000);
    expect(r.state.reports).toEqual([
      {
        ending: 'fin-verite',
        answers: { 'q-auteur': 'o-tam', 'q-remise': 'o-remettre' },
        at: 30000,
        elapsedMs: 4000,
      },
    ]);
    expect(SaveStateSchema.safeParse(r.state).success).toBe(true);
  });

  it('`reopenReport` : refusé avant le dénouement, puis une autre fin se remet', () => {
    expect(events(play(start(), [reopen(10)]).events, 'rejected')).toEqual([
      { type: 'rejected', reason: 'notAvailable' },
    ]);
    const done = play(start(), FULL_ROUTE).state;
    const r = play(done, [
      reopen(31000),
      tick(2000),
      { type: 'answer', question: 'q-remise', option: 'o-garder', at: 31100 },
      { type: 'finish', at: 31200 },
    ]);
    expect(events(r.events, 'rejected')).toEqual([]);
    expect(events(r.events, 'endingReached')).toEqual([
      { type: 'endingReached', id: r.state.ending },
    ]);
    expect(r.state.report['q-remise']).toBe('o-garder');
    expect(r.state.reports?.map((x) => x.ending)).toEqual(['fin-verite', r.state.ending]);
    // Le premier dénouement reste le temps de référence.
    expect(r.state.endedMs).toBe(4000);
    expect(r.state.reports?.[1]?.elapsedMs).toBe(6000);
  });

  it('rapport rouvert : `ending` revient à null, réponses gardées', () => {
    const done = play(start(), FULL_ROUTE).state;
    const r = play(done, [reopen(31000)]);
    expect(r.state.ending).toBeNull();
    expect(r.state.report).toEqual(done.report);
    expect(r.state.reports).toEqual(done.reports);
    expect(SaveStateSchema.safeParse(r.state).success).toBe(true);
  });

  it('historique borné aux 20 derniers rapports', () => {
    let s = play(start(), FULL_ROUTE).state;
    for (let i = 0; i < 25; i++) {
      s = play(s, [reopen(40000 + i * 10), { type: 'finish', at: 40005 + i * 10 }]).state;
    }
    expect(s.reports).toHaveLength(20);
    expect(s.reports?.at(-1)?.at).toBe(40245);
  });
});

describe('mode chronométré', () => {
  it('fractionnés : un par groupe établi, au temps de jeu du moment', () => {
    const r = play(start('timed'), timedRoute());
    expect(r.state.splits).toEqual([
      { group: 'grp-aines', elapsedMs: 2000 },
      { group: 'grp-cadets', elapsedMs: 6000 },
    ]);
    expect(officialTime(r.state)).toBe(r.state.endedMs);
  });

  it('aucun fractionné en mode standard', () => {
    expect(play(start(), timedRoute()).state.splits).toBeUndefined();
  });

  it('chrono figé au premier dénouement, même rapport rouvert', () => {
    const done = play(start('timed'), FULL_ROUTE).state;
    const r = play(done, [reopen(31000), tick(3000)]);
    expect(r.state.elapsedMs).toBe(done.elapsedMs);
    expect(officialTime(r.state)).toBe(4000);
    // En mode standard, le temps de jeu continue après le dénouement.
    const std = play(play(start(), FULL_ROUTE).state, [tick(3000)]);
    expect(std.state.elapsedMs).toBe(7000);
    expect(officialTime(std.state)).toBeNull();
  });

  it('succès chronométré : temps officiel (rapport rouvert compris)', () => {
    const done = play(start('timed'), FULL_ROUTE).state;
    const reopened = play(done, [reopen(31000)]).state;
    expect(evaluateAchievements(reopened, defaultProfile(), C)).toContain('ach-eclair');
  });

  it('écarts au meilleur temps par rang', () => {
    const now: TimedSplit[] = [
      { group: 'b', elapsedMs: 1000 },
      { group: 'a', elapsedMs: 5000 },
      { group: 'c', elapsedMs: 9000 },
    ];
    const best: TimedSplit[] = [
      { group: 'a', elapsedMs: 1500 },
      { group: 'b', elapsedMs: 4000 },
    ];
    expect(splitDeltas(now, best).map((d) => [d.rank, d.deltaMs])).toEqual([
      [1, -500],
      [2, 1000],
      [3, null],
    ]);
    expect(splitDeltas(now, undefined).every((d) => d.deltaMs === null)).toBe(true);
  });

  it('fiche du profil : fins vues, dernière fin, meilleur temps et ses fractionnés', () => {
    const s = play(start('timed'), timedRoute()).state;
    const first = completeCase(undefined, s, 'fin-verite');
    expect(first).toEqual({
      endings: ['fin-verite'],
      lastEnding: 'fin-verite',
      bestTimedMs: s.endedMs,
      bestSplits: s.splits,
    });
    const slower = { ...s, endedMs: (s.endedMs ?? 0) + 10 };
    expect(completeCase(first, slower, 'fin-arbre')).toEqual({
      ...first,
      endings: ['fin-verite', 'fin-arbre'],
      lastEnding: 'fin-arbre',
    });
    // Partie standard : ni temps ni fractionnés.
    const std = play(start(), FULL_ROUTE).state;
    expect(completeCase({ endings: ['fin-verite'] }, std, 'fin-verite')).toEqual({
      endings: ['fin-verite'],
      lastEnding: 'fin-verite',
    });
  });
});

describe('case revendiquée contestée', () => {
  const K = deepFreeze(clone(claimedCase));
  const begin = () =>
    play(
      deepFreeze(newGame(K, { slot: 'slot-1', mode: 'standard', at: 1000 })),
      AINES_RESEARCH,
      {},
      K,
    ).state;

  it('première contestation notée avec les champs retirés, une seule fois', () => {
    const r = play(
      begin(),
      [
        fill(CLAIMED_SLOT, 12000, { portrait: 'p-tam', occupation: null }),
        fill(CLAIMED_SLOT, 12100, { given: '' }),
      ],
      {},
      K,
    );
    expect(r.state.contested).toEqual({
      [CLAIMED_SLOT]: { at: 12000, fields: ['portrait', 'occupation'] },
    });
  });

  it('effacer la case la conteste aussi ; une case ordinaire ne l’est jamais', () => {
    const s = begin();
    const cleared = play(s, [{ type: 'clearSlot', slot: CLAIMED_SLOT, at: 12000 }], {}, K).state;
    expect(Object.keys(cleared.contested?.[CLAIMED_SLOT]?.fields ?? []).length).toBe(
      Object.values(CLAIM).filter((v) => v !== null && v !== '').length,
    );
    const other = play(s, [fill('g1-lisbe', 12000)], {}, K).state;
    expect(other.contested).toBeUndefined();
    expect(recordContest('g1-lisbe', s, other, K, 12000)).toBe(other);
  });
});

describe('sauvegarde 1.5.0 : chargée sans perte', () => {
  /** Partie dénouée telle que l'écrivait la 1.5.0 (sans les champs facultatifs). */
  function legacy(mode: SaveState['mode']): Record<string, unknown> {
    const s = clone(play(start(mode), FULL_ROUTE).state) as unknown as Record<string, unknown>;
    delete s['endedMs'];
    delete s['reports'];
    delete s['splits'];
    delete s['contested'];
    return s;
  }

  it('partie dénouée : tous les champs conservés, `endedMs` et le rapport remis déduits', () => {
    const raw = legacy('timed');
    const r = parseSave(JSON.stringify(raw), C);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dropped).toEqual([]);
    const { endedMs, reports, ...rest } = r.state;
    expect(rest).toEqual(raw);
    expect(endedMs).toBe(raw['elapsedMs']);
    expect(reports).toEqual([
      { ending: raw['ending'], answers: raw['report'], at: raw['updatedAt'], elapsedMs: 4000 },
    ]);
    // Le chrono reste figé comme en 1.5.0 et le rapport peut se refaire.
    const after = play(r.state, [tick(5000), reopen(50000)]);
    expect(after.state.elapsedMs).toBe(4000);
    expect(after.state.ending).toBeNull();
  });

  it('partie en cours : rendue telle quelle (aucun champ ajouté)', () => {
    const raw = clone(play(start(), AINES_RESEARCH).state);
    const r = parseSave(JSON.stringify(raw), C);
    expect(r).toEqual({ ok: true, state: raw, dropped: [] });
    expect(upgradeSave(raw)).toBe(raw);
  });

  it('champs facultatifs inconnus du contenu retirés', () => {
    const s = play(start('timed'), timedRoute()).state;
    const raw = {
      ...clone(s),
      splits: [...(s.splits ?? []), { group: 'grp-supprime', elapsedMs: 1 }],
      contested: { 'case-supprimee': { at: 1, fields: ['given'] } },
      reports: [
        ...(s.reports ?? []),
        { ending: 'fin-supprimee', answers: {}, at: 1, elapsedMs: 1 },
      ],
    };
    const r = parseSave(raw, C);
    expect(r.ok && r.dropped).toEqual([
      'report-ending:fin-supprimee',
      'split:grp-supprime',
      'contested:case-supprimee',
    ]);
    expect(r.ok && r.state.splits).toEqual(s.splits);
  });
});
