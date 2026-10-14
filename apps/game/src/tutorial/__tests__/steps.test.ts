/**
 * Tutoriel en bulles : choix de la prochaine note (just-in-time), notes passées en silence quand
 * le geste est déjà fait, mode « revoir », progression dans le profil.
 */
import { defaultProfile, ProfileSchema, type SaveState } from '@arbre/contract';
import { newGame } from '@arbre/engine';
import { describe, expect, it } from 'vitest';
import { SOLUTION, fixtureCase as c } from '../../../../../packages/engine/test/fixtures/case';
import { CLAIMED_SLOT, claimedCase } from '../../../../../packages/engine/test/fixtures/claimed';
import {
  BASE_STEPS,
  baselineOf,
  isHearing,
  newsApplies,
  nextStep,
  requiredSteps,
  type TutorialContext,
  type TutorialStepId,
} from '../steps';
import {
  defaultTutorialMode,
  prepareTutorial,
  restartTutorial,
  type TutorialHost,
} from '../tutorial.svelte';

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
      'returning',
    ];
    expect(nextStep(ctx(fresh(), all), false).step).toBeNull();
  });
});

describe('tutoriel : nouveautés (données, aucun id d’affaire)', () => {
  const base: TutorialStepId[] = [...BASE_STEPS];

  it('s’appliquent selon la mécanique présente dans l’affaire', () => {
    expect(newsApplies('claim', c)).toBe(false);
    expect(newsApplies('claim', claimedCase)).toBe(true);
    expect(newsApplies('decision', c)).toBe(true);
    expect(newsApplies('decision', { ...c, report: [] })).toBe(false);
    expect(isHearing({ kind: 'report', title: 'Procès-verbal d’audition de Mme X' })).toBe(true);
    expect(isHearing({ kind: 'letter', title: 'Audition' })).toBe(false);
    expect(isHearing({ kind: 'report', title: 'Rapport sur le moulin' })).toBe(false);
    expect(requiredSteps({ ...c, report: [] })).toEqual([...BASE_STEPS]);
  });

  it('cran « Nouveautés » : accueil titulaire, puis la case revendiquée à l’arbre', () => {
    const s = newGame(claimedCase, { slot: 'slot-1', mode: 'standard', at: 1 });
    const cx = (seen: TutorialStepId[], st = s) =>
      ({
        state: st,
        content: claimedCase,
        ui: { main: 'tree', side: 'reader', openDocument: null },
        modalOpen: false,
        base: baselineOf(s),
        seen: (id: TutorialStepId) => seen.includes(id),
      }) satisfies TutorialContext;
    expect(nextStep(cx(base), false).step?.id).toBe('returning');
    const r = nextStep(cx([...base, 'returning']), false);
    expect(r.step?.id).toBe('claim');
    expect(r.step?.anchors(cx(base))[0]).toContain(CLAIMED_SLOT);
    // Déclaration contestée : la note se range (geste fait).
    const touched = {
      ...s,
      tree: { ...s.tree, [CLAIMED_SLOT]: { ...s.tree[CLAIMED_SLOT]!, given: '' } },
    };
    expect(nextStep(cx([...base, 'returning'], touched), false).silent).toContain('claim');
  });

  it('la décision ne se montre qu’au rapport final, quand la question est posée', () => {
    const s = { ...fresh(), report: { 'q-auteur': 'o-tam' } };
    const all: TutorialStepId[] = [...BASE_STEPS, 'returning'];
    // Rien de nouveau au Bureau dans cette affaire : pas d'accueil titulaire.
    expect(nextStep(ctx(s, [...BASE_STEPS]), false).step).toBeNull();
    expect(nextStep(ctx(s, all), false).step).toBeNull();
    expect(nextStep(ctx(fresh(), all, { screen: 'report' }), false).step).toBeNull();
    expect(nextStep(ctx(s, all, { screen: 'report' }), false).step?.id).toBe('decision');
    // Les notes du Bureau ne se montrent pas au rapport.
    expect(nextStep(ctx(s, [], { screen: 'report' }), false).step?.id).toBe('decision');
  });
});

describe('tutoriel : progression dans le profil', () => {
  function host(): TutorialHost {
    return { profile: defaultProfile(), saveProfile: async () => {} };
  }
  const noNews = { ...c, report: [] };

  it('Complètes : commence (accueil titulaire compté vu), reprend où il en était', () => {
    const h = host();
    prepareTutorial(h, 'full', c);
    expect(h.profile.tutorial).toEqual({ done: false, seen: ['returning'] });
    h.profile = { ...h.profile, tutorial: { done: false, seen: ['welcome'] } };
    prepareTutorial(h, 'full', c);
    expect(h.profile.tutorial).toEqual({ done: false, seen: ['welcome', 'returning'] });
    // Déjà terminé : Complètes repart de zéro.
    h.profile = { ...h.profile, tutorial: { done: true, seen: [...BASE_STEPS] } };
    prepareTutorial(h, 'full', c);
    expect(h.profile.tutorial).toEqual({ done: false, seen: ['returning'] });
    expect(ProfileSchema.safeParse(h.profile).success).toBe(true);
  });

  it('Nouveautés seulement : la base comptée vue ; terminé si l’affaire n’a rien de nouveau', () => {
    const h = host();
    prepareTutorial(h, 'news', c);
    expect(h.profile.tutorial?.done).toBe(false);
    expect(h.profile.tutorial?.seen).toEqual(expect.arrayContaining([...BASE_STEPS]));
    expect(h.profile.tutorial?.seen).not.toContain('returning');
    prepareTutorial(h, 'news', noNews);
    expect(h.profile.tutorial?.done).toBe(true);
    expect(ProfileSchema.safeParse(h.profile).success).toBe(true);
  });

  it('Aucune : terminé, vues gardées', () => {
    const h = host();
    h.profile = { ...h.profile, tutorial: { done: false, seen: ['welcome'] } };
    prepareTutorial(h, 'none', c);
    expect(h.profile.tutorial).toEqual({ done: true, seen: ['welcome'] });
  });

  it('cran par défaut : Nouveautés si déjà joué (tutoriel fini ou dénouement vu)', () => {
    const p = defaultProfile();
    expect(defaultTutorialMode(p)).toBe('full');
    expect(defaultTutorialMode({ ...p, tutorial: { done: true, seen: [] } })).toBe('news');
    expect(defaultTutorialMode({ ...p, tutorial: { done: false, seen: [...BASE_STEPS] } })).toBe(
      'news',
    );
    expect(defaultTutorialMode({ ...p, tutorial: { done: false, seen: ['welcome'] } })).toBe(
      'full',
    );
    expect(defaultTutorialMode({ ...p, completed: { x: { endings: ['f1'] } } })).toBe('news');
    expect(defaultTutorialMode({ ...p, completed: { x: { endings: [] } } })).toBe('full');
  });

  it('« Revoir le tutoriel » repart de zéro', () => {
    const h = host();
    h.profile = { ...h.profile, tutorial: { done: true, seen: ['welcome', 'reader'] } };
    restartTutorial(h);
    expect(h.profile.tutorial).toEqual({ done: false, seen: ['returning'] });
  });
});
