/** Chemises d'affaire (E04) : état affiché et affaire choisie par défaut. */
import type { CompiledCase, SaveSlotSummary } from '@arbre/contract';
import { defaultProfile } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { fixtureCase } from '../../../../../../packages/engine/test/fixtures/case';
import { claimedCase } from '../../../../../../packages/engine/test/fixtures/claimed';
import { caseStatus, defaultCaseId } from '../case-folders';
import type { CaseEntry } from '../cases';

const second: CompiledCase = {
  ...claimedCase,
  meta: { ...claimedCase.meta, title: 'Le Revenant (essai)' },
};
const cases: CaseEntry[] = [
  { content: fixtureCase, fixture: false },
  { content: second, fixture: false },
];
const save = (title: string, updatedAt: number, progress = 0.42): SaveSlotSummary => ({
  slot: 'slot-1',
  caseTitle: title,
  updatedAt,
  elapsedMs: 0,
  mode: 'standard',
  progress,
});

describe('caseStatus', () => {
  it('non ouvert, en cours (meilleure progression), rapport remis', () => {
    const p = defaultProfile();
    expect(caseStatus(fixtureCase, [], p)).toBe('Non ouvert');
    const saves = [save(fixtureCase.meta.title, 1, 0.1), save(fixtureCase.meta.title, 2, 0.42)];
    expect(caseStatus(fixtureCase, saves, p)).toBe('En cours, 42 %');
    expect(caseStatus(second, saves, p)).toBe('Non ouvert');
    const done = { ...p, completed: { [fixtureCase.id]: { endings: ['x'] } } };
    const total = Object.keys(fixtureCase.endings).length;
    expect(caseStatus(fixtureCase, saves, done)).toBe(`Rapport remis · fins vues 1 / ${total}`);
  });
});

describe('defaultCaseId', () => {
  it('la dernière jouée, sinon la première', () => {
    expect(defaultCaseId(cases, [])).toBe(fixtureCase.id);
    expect(
      defaultCaseId(cases, [save(fixtureCase.meta.title, 1), save(second.meta.title, 5)]),
    ).toBe(second.id);
    expect(defaultCaseId(cases, [save('Affaire disparue', 9)])).toBe(fixtureCase.id);
    expect(defaultCaseId([], [])).toBe('');
  });
});
