/**
 * Tutoriel en bulles : choix de la prochaine note (just-in-time), notes passées en silence quand
 * le geste est déjà fait, mode « revoir », progression dans le profil.
 */
import { defaultProfile, ProfileSchema, type SaveState } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it } from 'vitest';
import { SOLUTION, fixtureCase as c } from '../../../../../packages/engine/test/fixtures/case';
import { baselineOf, nextStep, type TutorialContext, type TutorialStepId } from '../steps';
import { prepareTutorial, restartTutorial, type TutorialHost } from '../tutorial.svelte';

function ctx(state: SaveState, seen: TutorialStepId[] = [], over: Partial<TutorialContext> = {}) {
  const start = newGame(c, { slot: 'slot-1', mode: 'standard', at: 1 });
  return {
    state,
    content: c,
    ui: { main: 'tree', side: 'reader', openDocument: null },
    modalOpen: false,
    base: baselineOf(start),
    seen: (id: TutorialStepId) => seen.includes(id),
    ...over,
  } satisfies TutorialContext;
}

const fresh = () => newGame(c, { slot: 'slot-1', mode: 'standard', at: 1 });
const firstDoc = () => Object.keys(fresh().unlocked)[0]!;

describe('tutoriel : prochaine note', () => {
  it('commence par les Archives, puis le Lecteur quand une pièce est ouverte', () => {
    const s = fresh();
    expect(nextStep(ctx(s), false).step?.id).toBe('welcome');
    const doc = firstDoc();
    const read = { ...s, read: { [doc]: 2 } };
    const r = nextStep(
      ctx(read, [], { ui: { main: 'tree', side: 'reader', openDocument: doc } }),
      false,
    );
    // Pièce déjà lue : la note d'accueil est comptée vue sans être montrée.
    expect(r.silent).toContain('welcome');
    expect(r.step?.id).toBe('reader');
  });

  it('un geste déjà fait n’est pas expliqué ; en mode « revoir », il l’est', () => {
    const s = {
      ...fresh(),
      read: { [firstDoc()]: 2 },
      searchLog: [{ query: 'x', keyword: null, at: 3 }],
    };
    const seen: TutorialStepId[] = ['welcome', 'reader'];
    const normal = nextStep(ctx(s, seen), false);
    expect(normal.silent).toContain('catalogue');
    expect(normal.step?.id).not.toBe('catalogue');
    expect(nextStep(ctx(s, seen), true).step?.id).toBe('catalogue');
  });

  it('case pleine : la note des groupes, puis le tampon après la révélation', () => {
    const id = Object.keys(SOLUTION).find((x) => fresh().locked[x] === undefined)!;
    const seen: TutorialStepId[] = ['welcome', 'reader', 'catalogue', 'tree', 'faces'];
    const start = fresh();
    const full = { ...start, tree: { ...start.tree, [id]: { ...SOLUTION[id]! } } };
    expect(nextStep(ctx(full, seen), false).step?.id).toBe('groups');
    const locked = { ...full, locked: { ...start.locked, [id]: 5 } };
    // Révélation à l'écran : on attend qu'elle soit fermée.
    expect(nextStep(ctx(locked, seen, { modalOpen: true }), false).step?.id).not.toBe(
      'established',
    );
    expect(nextStep(ctx(locked, seen), false).step?.id).toBe('established');
  });

  it('rien quand tout a été vu', () => {
    const all: TutorialStepId[] = [
      'welcome',
      'reader',
      'catalogue',
      'tree',
      'faces',
      'groups',
      'established',
      'notebook',
      'map',
      'help',
    ];
    expect(nextStep(ctx(fresh(), all), false).step).toBeNull();
  });
});

describe('tutoriel : progression dans le profil', () => {
  function host(): TutorialHost {
    return { profile: defaultProfile(), saveProfile: async () => {} };
  }

  it('« J’ai déjà joué » le termine ; sinon il commence une fois, puis reste tel quel', () => {
    const h = host();
    prepareTutorial(h, false);
    expect(h.profile.tutorial).toEqual({ done: false, seen: [] });
    h.profile = { ...h.profile, tutorial: { done: false, seen: ['welcome'] } };
    prepareTutorial(h, false);
    expect(h.profile.tutorial?.seen).toEqual(['welcome']);
    prepareTutorial(h, true);
    expect(h.profile.tutorial).toEqual({ done: true, seen: ['welcome'] });
    expect(ProfileSchema.safeParse(h.profile).success).toBe(true);
  });

  it('« Revoir le tutoriel » repart de zéro', () => {
    const h = host();
    h.profile = { ...h.profile, tutorial: { done: true, seen: ['welcome', 'reader'] } };
    restartTutorial(h);
    expect(h.profile.tutorial).toEqual({ done: false, seen: [] });
  });
});
