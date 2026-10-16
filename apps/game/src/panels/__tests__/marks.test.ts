/**
 * Champ Marque côté jeu (AFFAIRE-3 §1) : libellés par case, refus neutre du mauvais type,
 * nom accessible d'une case à marque, nouveautés du tutoriel (données, aucun id d'affaire).
 */
import type { CompiledCase, SaveState } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it } from 'vitest';
import { fixtureCase as C } from '../../../../../packages/engine/test/fixtures/case';
import {
  baselineOf,
  newsApplies,
  nextStep,
  requiredSteps,
  BASE_STEPS,
  type TutorialContext,
  type TutorialStepId,
} from '../../tutorial/steps';
import {
  caseHasMarks,
  caseHasMarkSlots,
  isMarkSlot,
  portraitNumberLabel,
  refusalText,
  refusedKind,
  slotFieldArticle,
  slotFieldLabel,
} from '../lib/marks';

/** Variante de la fixture du moteur : `p-figurant` est une marque, la case de Tam en attend une. */
function withMarks(): CompiledCase {
  const c = structuredClone(C) as CompiledCase;
  c.portraits['p-figurant'] = { ...c.portraits['p-figurant']!, kind: 'mark' };
  c.slots['g1-tam'] = { ...c.slots['g1-tam']!, portraitKind: 'mark' };
  const [first] = Object.keys(c.documents);
  c.documents[first!] = { ...c.documents[first!]!, kind: 'recording' };
  return c;
}

describe('champ Marque : libellés et refus', () => {
  const c = withMarks();

  it('affaire sans marque : rien ne change (Portrait, aucun visage)', () => {
    expect(caseHasMarks(C)).toBe(false);
    expect(caseHasMarkSlots(C)).toBe(false);
    expect(slotFieldLabel(C, 'g1-tam', 'portrait')).toBe('Portrait');
    expect(slotFieldArticle(C, 'g1-tam', 'portrait')).toBe('aucun visage');
    expect(refusedKind(C, 'g1-tam', { portrait: 'p-tam' })).toBeNull();
  });

  it('case à marque : « Marque », les autres champs inchangés', () => {
    expect(caseHasMarks(c)).toBe(true);
    expect(isMarkSlot(c, 'g1-tam')).toBe(true);
    expect(isMarkSlot(c, 'g0-ivo')).toBe(false);
    expect(slotFieldLabel(c, 'g1-tam', 'portrait')).toBe('Marque');
    expect(slotFieldLabel(c, 'g1-tam', 'given')).toBe('Prénom');
    expect(slotFieldLabel(c, 'g0-ivo', 'portrait')).toBe('Portrait');
    expect(slotFieldLabel(c, null, 'portrait')).toBe('Portrait');
    expect(slotFieldArticle(c, 'g1-tam', 'portrait')).toBe('aucune marque');
  });

  it('dépôt du mauvais type refusé (dans les deux sens), le reste permis', () => {
    expect(refusedKind(c, 'g1-tam', { portrait: 'p-tam' })).toBe('mark');
    expect(refusedKind(c, 'g0-ivo', { portrait: 'p-figurant' })).toBe('face');
    expect(refusedKind(c, 'g1-tam', { portrait: 'p-figurant' })).toBeNull();
    expect(refusedKind(c, 'g0-ivo', { portrait: 'p-ivo' })).toBeNull();
    expect(refusedKind(c, 'g1-tam', { given: 'Tam', family: 'Marrel' })).toBeNull();
    expect(refusedKind(c, 'g1-tam', { portrait: null })).toBeNull();
    expect(refusalText('mark')).toBe('Ce champ attend une marque.');
    expect(refusalText('face')).toBe('Ce champ attend un portrait.');
  });

  it('numérotation par type', () => {
    expect(portraitNumberLabel('face', 4)).toBe('Visage n° 4');
    expect(portraitNumberLabel('mark', 4)).toBe('Marque n° 4');
  });
});

describe('tutoriel : nouveautés de l’affaire 3', () => {
  const c = withMarks();
  const start = newGame(c, { slot: 'slot-1', mode: 'standard', at: 1 });
  const all = (s: SaveState): SaveState => ({ ...s, revealedSlots: Object.keys(c.slots) });
  const ctx = (seen: TutorialStepId[], over: Partial<TutorialContext> = {}) =>
    ({
      state: all(start),
      content: c,
      ui: { main: 'tree', side: 'reader', openDocument: null, picking: null },
      modalOpen: false,
      base: baselineOf(start),
      seen: (id: TutorialStepId) => seen.includes(id),
      ...over,
    }) satisfies TutorialContext;
  const base: TutorialStepId[] = [...BASE_STEPS, 'returning'];

  it('s’appliquent selon les données (case à marque, pièce recording)', () => {
    expect(newsApplies('mark', C)).toBe(false);
    expect(newsApplies('mark-read', C)).toBe(false);
    expect(newsApplies('recording', C)).toBe(false);
    expect(newsApplies('mark', c)).toBe(true);
    expect(newsApplies('mark-read', c)).toBe(true);
    expect(newsApplies('recording', c)).toBe(true);
    expect(requiredSteps(c)).toEqual(expect.arrayContaining(['mark', 'mark-read', 'recording']));
    expect(requiredSteps(C)).not.toContain('mark');
  });

  it('mark : à l’arbre, sur la première case à marque', () => {
    const r = nextStep(ctx(base), false);
    expect(r.step?.id).toBe('mark');
    expect(r.step?.anchors(ctx(base))[0]).toContain('g1-tam');
  });

  it('mark-read : à l’ouverture du sélecteur d’un champ Marque seulement', () => {
    const seen: TutorialStepId[] = [...base, 'mark'];
    expect(nextStep(ctx(seen), false).step?.id).not.toBe('mark-read');
    const face = ctx(seen, {
      ui: {
        main: 'tree',
        side: 'reader',
        openDocument: null,
        picking: { slot: 'g0-ivo', field: 'portrait' },
      },
    });
    expect(nextStep(face, false).step?.id).not.toBe('mark-read');
    const mark = ctx(seen, {
      ui: {
        main: 'tree',
        side: 'reader',
        openDocument: null,
        picking: { slot: 'g1-tam', field: 'portrait' },
      },
    });
    expect(nextStep(mark, false).step?.id).toBe('mark-read');
  });

  it('recording : première pièce recording ouverte au Lecteur', () => {
    const doc = Object.keys(c.documents)[0]!;
    const seen: TutorialStepId[] = [...base, 'mark', 'mark-read'];
    const r = nextStep(
      ctx(seen, { ui: { main: 'tree', side: 'reader', openDocument: doc, picking: null } }),
      false,
    );
    expect(r.step?.id).toBe('recording');
  });
});
