import type { Action, SaveState } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  endingSections,
  evaluate,
  parseSave,
  pruneReport,
  reportQuestions,
} from '../src';
import { C, clone, deepFreeze, play, start } from './helpers';

const answer = (question: string, option: string, at = 5000): Action => ({
  type: 'answer',
  question,
  option,
  at,
});
const rejected = (reason: string) => [{ type: 'rejected', reason }];

/** État où le secret est trouvé et le télégramme lu (toutes les options disponibles). */
function informed(): SaveState {
  return deepFreeze({
    ...start(),
    read: { ...start().read, 'telegramme-juno': 2000 },
    secrets: { 'sec-double-vie': 2000 },
    updatedAt: 2000,
  });
}

describe('action answer', () => {
  it('enregistre une réponse, modifiable, sans événement', () => {
    const r = play(informed(), [answer('q-auteur', 'o-juno'), answer('q-auteur', 'o-tam', 5100)]);
    expect(r.events).toEqual([]);
    expect(r.state.report).toEqual({ 'q-auteur': 'o-tam' });
    expect(r.state.updatedAt).toBe(5100);
    const same = applyAction(r.state, answer('q-auteur', 'o-tam', 6000), C);
    expect(same.state).toBe(r.state);
  });

  it('refus : question ou option inconnue, question non posée, option indisponible, après finish', () => {
    const s = start();
    expect(applyAction(s, answer('q-x', 'o-tam'), C).events).toEqual(rejected('unknownId'));
    expect(applyAction(s, answer('q-auteur', 'o-x'), C).events).toEqual(rejected('unknownId'));
    expect(applyAction(s, answer('q-remise', 'o-garder'), C).events).toEqual(
      rejected('notAvailable'),
    );
    expect(applyAction(s, answer('q-auteur', 'o-juno'), C).events).toEqual(
      rejected('notAvailable'),
    );
    const done: SaveState = deepFreeze({ ...informed(), ending: 'fin-arbre' });
    const t = applyAction(done, answer('q-auteur', 'o-tam'), C);
    expect(t.events).toEqual(rejected('notAvailable'));
    expect(t.state).toBe(done);
  });

  it('changer une réponse retire les réponses des questions qui ne sont plus posées', () => {
    const r = play(informed(), [
      answer('q-auteur', 'o-tam'),
      answer('q-remise', 'o-remettre', 5100),
    ]);
    expect(r.state.report).toEqual({ 'q-auteur': 'o-tam', 'q-remise': 'o-remettre' });
    const r2 = play(r.state, [answer('q-auteur', 'o-elna', 5200)]);
    expect(r2.state.report).toEqual({ 'q-auteur': 'o-elna' });
  });

  it('newGame commence avec un rapport vide', () => {
    expect(start().report).toEqual({});
  });
});

describe('condition answered', () => {
  it('vraie seulement pour l’option donnée', () => {
    const s: SaveState = deepFreeze({ ...start(), report: { 'q-auteur': 'o-tam' } });
    expect(evaluate({ answered: { question: 'q-auteur', option: 'o-tam' } }, s, C)).toBe(true);
    expect(evaluate({ answered: { question: 'q-auteur', option: 'o-elna' } }, s, C)).toBe(false);
    expect(evaluate({ answered: { question: 'q-remise', option: 'o-garder' } }, s, C)).toBe(false);
    const legacy = { ...s, report: undefined } as unknown as SaveState;
    expect(evaluate({ answered: { question: 'q-auteur', option: 'o-tam' } }, legacy, C)).toBe(
      false,
    );
  });
});

describe('reportQuestions', () => {
  it('questions posées, options disponibles, réponse actuelle', () => {
    expect(reportQuestions(start(), C)).toEqual([
      {
        id: 'q-auteur',
        prompt: 'Qui a envoyé le télégramme ?',
        kind: 'question',
        options: [
          { id: 'o-tam', label: 'Tam Marrel' },
          { id: 'o-elna', label: 'Elna Sorvo' },
        ],
        answer: null,
      },
    ]);
    const s = play(informed(), [answer('q-auteur', 'o-tam')]).state;
    const qs = reportQuestions(s, C);
    expect(qs.map((q) => q.id)).toEqual(['q-auteur', 'q-remise']);
    expect(qs[0]?.options).toHaveLength(3);
    expect(qs[0]?.answer).toBe('o-tam');
    expect(qs[1]?.options.map((o) => o.id)).toEqual(['o-garder', 'o-remettre']);
    expect(reportQuestions(s, { ...C, report: [] })).toEqual([]);
  });
});

describe('endingSections', () => {
  it('sections sans condition ou vraies, dans l’ordre ; fin inconnue → []', () => {
    const s: SaveState = deepFreeze({
      ...informed(),
      report: { 'q-auteur': 'o-tam', 'q-remise': 'o-garder' },
    });
    expect(endingSections('fin-verite', s, C)).toEqual([
      { label: 'commun', title: null, body: C.endings['fin-verite']!.sections[0]!.body },
      {
        label: 'garde',
        title: 'Le dossier gardé',
        body: C.endings['fin-verite']!.sections[2]!.body,
      },
    ]);
    expect(endingSections('fin-inconnue', s, C)).toEqual([]);
  });
});

describe('pruneReport', () => {
  it('point fixe sans muter l’entrée', () => {
    const input = deepFreeze({ 'q-remise': 'o-garder', 'q-auteur': 'o-elna', 'q-x': 'o-y' });
    const r = pruneReport(input, start(), C);
    expect(r.report).toEqual({ 'q-auteur': 'o-elna' });
    expect(r.removed.sort()).toEqual(['q-remise', 'q-x']);
  });
});

describe('parseSave et rapport', () => {
  it('rapport absent → {} ; ids inconnus et questions non posées retirés et listés', () => {
    const s = informed();
    const { report: _r, ...legacy } = clone(s);
    const r1 = parseSave(legacy, C);
    expect(r1.ok && r1.state.report).toEqual({});

    const r2 = parseSave(
      {
        ...clone(s),
        report: { 'q-x': 'o-tam', 'q-auteur': 'o-x' },
      },
      C,
    );
    expect(r2.ok && r2.dropped).toEqual(['report-question:q-x', 'report-option:q-auteur:o-x']);
    expect(r2.ok && r2.state.report).toEqual({});

    const r3 = parseSave(
      { ...clone(s), report: { 'q-auteur': 'o-elna', 'q-remise': 'o-garder' } },
      C,
    );
    expect(r3.ok && r3.dropped).toEqual(['report-unasked:q-remise']);
    expect(r3.ok && r3.state.report).toEqual({ 'q-auteur': 'o-elna' });

    const ok = parseSave(
      { ...clone(s), report: { 'q-auteur': 'o-tam', 'q-remise': 'o-remettre' } },
      C,
    );
    expect(ok.ok && ok.dropped).toEqual([]);
  });
});
