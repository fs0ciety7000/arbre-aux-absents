/** Chemises d'affaire (E04) : état affiché et affaire choisie par défaut. */
import type { CompiledCase, SaveSlotSummary } from '@arbre/contract';
import { defaultProfile } from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { fixtureCase } from '../../../../../../packages/engine/test/fixtures/case';
import { claimedCase } from '../../../../../../packages/engine/test/fixtures/claimed';
import { caseDuration, caseStatus, defaultCaseId, lastEndingTitle } from '../case-folders';
import { catalogEntryOf, type CaseEntry } from '../cases';

const second: CompiledCase = {
  ...claimedCase,
  id: claimedCase.id === fixtureCase.id ? `${claimedCase.id}-2` : claimedCase.id,
  meta: { ...claimedCase.meta, title: 'Le Revenant (essai)' },
};
const cases: CaseEntry[] = [
  { content: catalogEntryOf(fixtureCase), fixture: false },
  { content: catalogEntryOf(second), fixture: false },
];
const save = (caseId: string | null, updatedAt: number, progress = 0.42): SaveSlotSummary => ({
  slot: 'slot-1',
  caseId,
  // Titre de la langue où la partie a été sauvegardée : jamais utilisé pour associer.
  caseTitle: 'The Revenant (test)',
  updatedAt,
  elapsedMs: 0,
  mode: 'standard',
  progress,
});

describe('caseStatus', () => {
  it('non ouvert, en cours (meilleure progression), rapport remis', () => {
    const p = defaultProfile();
    expect(caseStatus(fixtureCase, [], p)).toBe('Non ouvert');
    const saves = [save(fixtureCase.id, 1, 0.1), save(fixtureCase.id, 2, 0.42)];
    expect(caseStatus(fixtureCase, saves, p)).toBe('En cours, 42 %');
    expect(caseStatus(second, saves, p)).toBe('Non ouvert');
    const first = Object.keys(fixtureCase.endings)[0]!;
    // Une fin inconnue du contenu (retirée par une mise à jour) n'est pas comptée.
    const done = { ...p, completed: { [fixtureCase.id]: { endings: [first, 'x'] } } };
    const total = Object.keys(fixtureCase.endings).length;
    expect(caseStatus(fixtureCase, saves, done)).toBe(
      `Rapport remis · fins découvertes 1 / ${total}`,
    );
    const timed = {
      ...p,
      completed: { [fixtureCase.id]: { endings: [first], bestTimedMs: 3_723_000 } },
    };
    expect(caseStatus(fixtureCase, saves, timed)).toBe(
      `Rapport remis · fins découvertes 1 / ${total} · meilleur temps 1:02:03`,
    );
  });
});

describe('chemise : durée et dernier dénouement', () => {
  it('durée indicative si le contenu la donne', () => {
    const meta = { ...fixtureCase.meta, durationMinutes: [255, 360] as [number, number] };
    expect(caseDuration({ meta })).toBe('4 h 15 – 6 h');
    expect(caseDuration({ meta: fixtureCase.meta })).toBeUndefined();
  });

  it('tampon : titre de la dernière fin atteinte seulement', () => {
    const [a, b] = Object.keys(fixtureCase.endings);
    const p = defaultProfile();
    expect(lastEndingTitle(fixtureCase, p)).toBeUndefined();
    const done = { ...p, completed: { [fixtureCase.id]: { endings: [a!, b!], lastEnding: a! } } };
    expect(lastEndingTitle(fixtureCase, done)).toBe(fixtureCase.endings[a!]!.title);
  });
});

describe('defaultCaseId', () => {
  it('la dernière jouée (par caseId, quel que soit le titre), sinon la première', () => {
    expect(defaultCaseId(cases, [])).toBe(fixtureCase.id);
    expect(defaultCaseId(cases, [save(fixtureCase.id, 1), save(second.id, 5)])).toBe(second.id);
    expect(defaultCaseId(cases, [save('affaire-disparue', 9)])).toBe(fixtureCase.id);
    expect(defaultCaseId(cases, [save(null, 9)])).toBe(fixtureCase.id);
    expect(defaultCaseId([], [])).toBe('');
  });

  it('avec le profil : la plus ancienne jamais commencée, sinon la dernière jouée', () => {
    const p = defaultProfile();
    // Aucune partie : la première (ordre du contenu).
    expect(defaultCaseId(cases, [], p)).toBe(fixtureCase.id);
    // La première est commencée : la seconde, jamais ouverte, même si la première est récente.
    expect(defaultCaseId(cases, [save(fixtureCase.id, 9)], p)).toBe(second.id);
    // La seconde a un dénouement sans partie gardée : toutes commencées, la dernière jouée.
    const done = { ...p, completed: { [second.id]: { endings: ['x'] } } };
    expect(defaultCaseId(cases, [save(fixtureCase.id, 9)], done)).toBe(fixtureCase.id);
  });
});
