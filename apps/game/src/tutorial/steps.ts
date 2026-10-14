/**
 * Étapes du tutoriel en bulles (GAME_DESIGN §15) : une note par geste, montrée **au moment
 * où il devient utile** (pas de diaporama d'entrée). Fonctions pures de l'état de partie et de
 * l'interface : testables sans DOM.
 *
 * - `when` : la note peut être montrée maintenant ;
 * - `done` : le geste attendu est fait (la note se range seule ; jamais montrée s'il l'était
 *   déjà, sauf quand le joueur a demandé à revoir le tutoriel) ;
 * - `anchors` : sélecteurs CSS de la cible, du plus précis au plus général (le premier
 *   visible gagne ; aucun : note posée en bas de l'écran).
 */
import type { CompiledCase, SaveState, SlotGuess, SlotId } from '@arbre/contract';
import { isComplete, normalize, reportQuestions } from '@arbre/engine';
import type { Device } from '@arbre/ui';
import type { DeskUi, PanelId } from '../lib/game/types';
import { messages } from '../messages.fr';

/** Les 10 notes de base (cran « Complètes »). */
export const BASE_STEPS = [
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
] as const;
/**
 * Nouveautés (AFFAIRE-2 §2.4) : montrées seulement quand l'affaire a la mécanique, déduite des
 * données (case revendiquée, pièce d'audition, décision au rapport), jamais d'un id d'affaire.
 */
export const NEWS_STEPS = ['claim', 'hearing', 'decision'] as const;
/** Nouveautés qui se montrent au Bureau (la décision attend le rapport final). */
const DESK_NEWS: readonly NewsStepId[] = ['claim', 'hearing'];
/** Accueil « titulaire » du cran « Nouveautés seulement » (remplace `welcome`). */
export const RETURNING_STEP = 'returning';
export const TUTORIAL_STEPS = [RETURNING_STEP, ...BASE_STEPS, ...NEWS_STEPS] as const;
export type TutorialStepId = (typeof TUTORIAL_STEPS)[number];
export type NewsStepId = (typeof NEWS_STEPS)[number];

/** Écran où vit la note : le Bureau, ou le rapport final. */
export type TutorialScreen = 'desk' | 'report';

/** Ce que la partie était à l'ouverture du Bureau (cases pré-remplies, partie reprise). */
export interface TutorialBaseline {
  tree: Record<SlotId, SlotGuess>;
  locked: ReadonlySet<SlotId>;
}

export interface TutorialContext {
  state: SaveState;
  content: CompiledCase;
  ui: Pick<DeskUi, 'main' | 'side' | 'openDocument'>;
  /** Un modal du Bureau (révélation, secret, pause) est ouvert. */
  modalOpen: boolean;
  base: TutorialBaseline;
  seen: (id: TutorialStepId) => boolean;
  /** Écran affiché (déf. le Bureau). */
  screen?: TutorialScreen;
}

export interface TutorialStep {
  id: TutorialStepId;
  /** Écran de la note (déf. le Bureau). */
  screen?: TutorialScreen;
  when: (c: TutorialContext) => boolean;
  done: (c: TutorialContext) => boolean;
  anchors: (c: TutorialContext) => string[];
  text: (c: TutorialContext, device: Device) => string;
}

export function baselineOf(state: SaveState): TutorialBaseline {
  return { tree: { ...state.tree }, locked: new Set(Object.keys(state.locked)) };
}

const shown = (c: TutorialContext, p: PanelId) => c.ui.main === p || c.ui.side === p;
const readCount = (c: TutorialContext) => Object.keys(c.state.read).length;
const searched = (c: TutorialContext) => c.state.searchLog.length > 0;

/** Cases que le joueur a modifiées depuis l'ouverture. */
function changedSlots(c: TutorialContext): SlotId[] {
  return Object.entries(c.state.tree)
    .filter(([id, g]) => JSON.stringify(g) !== JSON.stringify(c.base.tree[id]))
    .map(([id]) => id);
}

/** Cases pleines (4 champs) pas encore établies. */
function completeOpen(c: TutorialContext): SlotId[] {
  return Object.entries(c.state.tree)
    .filter(([id, g]) => isComplete(g) && c.state.locked[id] === undefined)
    .map(([id]) => id);
}

function newlyLocked(c: TutorialContext): SlotId[] {
  return Object.keys(c.state.locked).filter((id) => !c.base.locked.has(id));
}

const openFaces = (c: TutorialContext) => {
  const id = c.ui.openDocument;
  return id && shown(c, 'reader') ? (c.content.documents[id]?.reveals?.portraits?.length ?? 0) : 0;
};

/** Cases revendiquées (déclaration du contenu) pas encore établies. */
function openClaims(c: TutorialContext): SlotId[] {
  return Object.entries(c.content.slots)
    .filter(([id, x]) => x.claimedGuess !== undefined && c.state.locked[id] === undefined)
    .map(([id]) => id);
}

/** Une case revendiquée a été contestée (un champ n'est plus celui de la déclaration) ou établie. */
function claimTouched(c: TutorialContext): boolean {
  return Object.entries(c.content.slots).some(([id, x]) => {
    if (!x.claimedGuess) return false;
    if (c.state.locked[id] !== undefined) return true;
    return JSON.stringify(c.state.tree[id] ?? null) !== JSON.stringify(x.claimedGuess);
  });
}

/**
 * Pièce d'audition : déclencheur générique lu dans les données (procès-verbal = pièce de type
 * `report` dont le titre parle d'audition), sans id d'affaire.
 */
export function isHearing(doc: { kind: string; title: string } | undefined): boolean {
  return doc?.kind === 'report' && /\baudition\b/.test(normalize(doc.title));
}

/** Une nouveauté s'applique-t-elle à cette affaire (mécanique présente dans les données) ? */
export function newsApplies(id: NewsStepId, content: CompiledCase): boolean {
  switch (id) {
    case 'claim':
      return Object.values(content.slots).some((x) => x.claimedGuess !== undefined);
    case 'hearing':
      return Object.values(content.documents).some(isHearing);
    case 'decision':
      return (content.report ?? []).some((q) => q.kind === 'choice');
  }
}

/** Notes qu'il faut avoir vues pour que le tutoriel soit terminé dans cette affaire. */
export function requiredSteps(content: CompiledCase): TutorialStepId[] {
  return [...BASE_STEPS, ...NEWS_STEPS.filter((id) => newsApplies(id, content))];
}

// Les ids de case sont en kebab-case (contrat) : rien à échapper.
const slotSel = (id: SlotId) => `[data-tree-view] [data-slot="${id}"]`;
const tabSel = (p: PanelId) => [`#desk-rail-tab-${p}`, `#desk-side-tab-${p}`, `#desk-bar-tab-${p}`];

const t = messages.tutorial.steps;

export const STEPS: readonly TutorialStep[] = [
  {
    // Cran « Nouveautés seulement » : les notes de base sont déjà comptées vues.
    id: 'returning',
    // Seulement s'il reste une nouveauté du Bureau à signaler dans cette affaire.
    when: (c) =>
      BASE_STEPS.every((id) => c.seen(id)) &&
      DESK_NEWS.some((id) => !c.seen(id) && newsApplies(id, c.content)),
    done: (c) => readCount(c) > 0,
    anchors: () => ['[data-tour="archives-list"] > li:first-child', ...tabSel('archives')],
    text: () => t.returning(),
  },
  {
    id: 'welcome',
    when: () => true,
    done: (c) => readCount(c) > 0,
    anchors: () => ['[data-tour="archives-list"] > li:first-child', ...tabSel('archives')],
    text: (_c, d) => t.welcome(d),
  },
  {
    id: 'reader',
    when: (c) => c.ui.openDocument !== null && shown(c, 'reader'),
    done: (c) => searched(c),
    anchors: () => ['[data-tour="reader-text"] .kw', '#reader-title'],
    text: (_c, d) => t.reader(d),
  },
  {
    id: 'catalogue',
    when: (c) => c.seen('reader') || readCount(c) >= 2,
    done: (c) => searched(c),
    anchors: () => ['[data-tour="catalogue-query"]', ...tabSel('catalogue')],
    text: () => t.catalogue(),
  },
  {
    id: 'tree',
    when: (c) => c.seen('catalogue') && (searched(c) || readCount(c) >= 2),
    done: (c) => changedSlots(c).length > 0,
    anchors: (c) => {
      const open = Object.keys(c.content.slots).filter((id) => c.state.locked[id] === undefined);
      const empty = open.filter((id) => c.state.tree[id] === undefined);
      return [
        ...(empty[0] ? [slotSel(empty[0])] : []),
        '[data-tree-view] [data-slot]',
        ...tabSel('tree'),
      ];
    },
    text: (_c, d) => t.tree(d),
  },
  {
    id: 'faces',
    when: (c) => c.seen('welcome') && openFaces(c) > 0,
    done: (c) =>
      Object.entries(c.state.tree).some(
        ([id, g]) => g.portrait !== null && g.portrait !== c.base.tree[id]?.portrait,
      ),
    anchors: () => ['[data-tour="reader-faces"] li:first-child', '[data-tour="reader-faces"]'],
    text: (_c, d) => t.faces(d),
  },
  {
    id: 'groups',
    when: (c) => completeOpen(c).length > 0,
    done: (c) => newlyLocked(c).length > 0,
    anchors: (c) => {
      const id = completeOpen(c)[0];
      return [...(id ? [slotSel(id)] : []), ...tabSel('tree')];
    },
    text: (c) => {
      const id = completeOpen(c)[0];
      const g = id ? c.content.groups.find((x) => x.slots.includes(id)) : undefined;
      return t.groups(g?.slots.length ?? 3);
    },
  },
  {
    id: 'established',
    when: (c) => newlyLocked(c).length > 0 && !c.modalOpen,
    done: () => false,
    anchors: (c) => {
      const id = newlyLocked(c)[0];
      return [...(id ? [slotSel(id)] : []), ...tabSel('tree')];
    },
    text: () => t.established(),
  },
  {
    id: 'notebook',
    when: (c) => c.seen('catalogue') && readCount(c) >= 3,
    done: (c) => shown(c, 'notebook'),
    anchors: () => tabSel('notebook'),
    text: () => t.notebook(),
  },
  {
    id: 'map',
    when: (c) =>
      c.seen('notebook') &&
      Object.keys(c.state.read).some((id) => c.content.documents[id]?.place !== undefined),
    done: (c) => shown(c, 'map'),
    anchors: () => tabSel('map'),
    text: () => t.map(),
  },
  {
    id: 'help',
    when: (c) => c.seen('map') && c.seen('tree'),
    done: () => false,
    anchors: () => ['[data-tour="help"]', ...tabSel('help')],
    text: () => t.help(),
  },
  {
    id: 'claim',
    when: (c) => c.seen('tree') && shown(c, 'tree') && openClaims(c).length > 0,
    done: (c) => claimTouched(c),
    anchors: (c) => {
      const id = openClaims(c)[0];
      return [...(id ? [slotSel(id)] : []), ...tabSel('tree')];
    },
    text: () => t.claim(),
  },
  {
    id: 'hearing',
    when: (c) => {
      const id = c.ui.openDocument;
      return id !== null && shown(c, 'reader') && isHearing(c.content.documents[id]);
    },
    done: () => false,
    anchors: () => ['#reader-title'],
    text: () => t.hearing(),
  },
  {
    id: 'decision',
    screen: 'report',
    when: (c) => reportQuestions(c.state, c.content).some((q) => q.kind === 'choice'),
    done: () => false,
    anchors: () => ['[data-report-choice]', '#report-title'],
    text: () => t.decision(),
  },
];

export interface NextStep {
  /** Note à montrer (ou `null`). */
  step: TutorialStep | null;
  /** Notes dont le geste est déjà fait : comptées comme vues sans être montrées. */
  silent: TutorialStepId[];
}

/**
 * Prochaine note : la première non vue dont le moment est venu. En mode normal, une note dont
 * le geste est déjà fait est passée en silence ; en mode « revoir », elle est montrée quand même.
 */
export function nextStep(c: TutorialContext, replay: boolean): NextStep {
  const silent: TutorialStepId[] = [];
  const screen = c.screen ?? 'desk';
  for (const s of STEPS) {
    if (c.seen(s.id) || (s.screen ?? 'desk') !== screen) continue;
    if (!replay && s.done(c)) {
      silent.push(s.id);
      continue;
    }
    if (s.when(c)) return { step: s, silent };
  }
  return { step: null, silent };
}
