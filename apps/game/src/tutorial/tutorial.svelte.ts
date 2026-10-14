/**
 * Tutoriel en bulles : progression dans le profil (`Profile.tutorial`, contrat), choix de la
 * prochaine note, gestes de la note (Compris, Passer, Échap). L'affichage est fait par
 * `TutorialLayer.svelte` avec la primitive `Coachmark`.
 */
import {
  TUTORIAL_SEEN_MAX,
  type CompiledCase,
  type Profile,
  type TutorialProgress,
} from '@arbre/contract';
import {
  BASE_STEPS,
  baselineOf,
  nextStep,
  requiredSteps,
  RETURNING_STEP,
  type TutorialBaseline,
  type TutorialContext,
  type TutorialScreen,
  type TutorialStep,
  type TutorialStepId,
} from './steps';
import type { GameStoreImpl } from '../lib/game/store.svelte';

/** Ce que le tutoriel lit et écrit de l'application (profil persistant). */
export interface TutorialHost {
  profile: Profile;
  saveProfile(): Promise<void>;
}

function write(host: TutorialHost, tutorial: TutorialProgress): void {
  host.profile = { ...host.profile, tutorial };
  void host.saveProfile();
}

/**
 * Crans des « Notes de service » (E04, AFFAIRE-2 §2.4). Aucun champ de plus dans le profil :
 * le cran s'écrit dans `Profile.tutorial` (contrat inchangé) au lancement de la partie.
 * - `full` (Complètes) : `done: false` ; l'accueil « titulaire » est compté vu, les 10 notes de
 *   base et les nouveautés de l'affaire restent à voir (un tutoriel terminé repart de zéro) ;
 * - `news` (Nouveautés seulement) : `done: false` ; les 10 notes de base sont comptées vues :
 *   restent l'accueil « titulaire » (une fois par profil) et les nouveautés pas encore vues ;
 * - `none` (Aucune) : `done: true`.
 * `done` passe à vrai quand les notes requises par l'affaire (base + nouveautés dont la
 * mécanique est dans ses données, `requiredSteps`) sont vues.
 */
export type TutorialMode = 'full' | 'news' | 'none';
export const TUTORIAL_MODES: readonly TutorialMode[] = ['full', 'news', 'none'];

/**
 * Cran par défaut : « Nouveautés seulement » si le joueur a déjà joué (tutoriel terminé ou passé,
 * notes de base toutes vues, ou une affaire menée jusqu'au dénouement), « Complètes » sinon.
 */
export function defaultTutorialMode(profile: Profile): TutorialMode {
  const t = profile.tutorial;
  const played =
    t?.done === true ||
    (t !== undefined && BASE_STEPS.every((id) => t.seen.includes(id))) ||
    Object.values(profile.completed).some((x) => x.endings.length > 0);
  return played ? 'news' : 'full';
}

function progressOf(seen: readonly string[], content: CompiledCase): TutorialProgress {
  const kept = [...new Set(seen)].slice(-TUTORIAL_SEEN_MAX);
  return { done: requiredSteps(content).every((id) => kept.includes(id)), seen: kept };
}

/** Nouvelle partie (E04) : écrit le cran choisi dans le profil. */
export function prepareTutorial(
  host: TutorialHost,
  mode: TutorialMode,
  content: CompiledCase,
): void {
  const t = host.profile.tutorial;
  const seen = t?.seen ?? [];
  switch (mode) {
    case 'none':
      if (!t?.done) write(host, { done: true, seen });
      return;
    case 'full':
      write(host, progressOf([...(t?.done ? [] : seen), RETURNING_STEP], content));
      return;
    case 'news':
      write(host, progressOf([...seen, ...BASE_STEPS], content));
      return;
  }
}

/** Aide › Revoir le tutoriel, Options › Jeu : les notes reviennent, même pour un geste déjà fait. */
export function restartTutorial(host: TutorialHost): void {
  write(host, { done: false, seen: [RETURNING_STEP] });
  replayRequested = true;
}

/** Mode « revoir » demandé (Aide, Options) : lu par le contrôleur à sa prochaine évaluation. */
let replayRequested = false;

const baselines = new WeakMap<GameStoreImpl, TutorialBaseline>();
const replaying = new WeakSet<GameStoreImpl>();

export class TutorialController {
  /** Note affichée. */
  current = $state<TutorialStep | null>(null);
  /** Revoir : les notes ne sont pas passées en silence quand leur geste est déjà fait. */
  get replay(): boolean {
    return replaying.has(this.#game);
  }
  #host: TutorialHost;
  #game: GameStoreImpl;
  #base: TutorialBaseline;
  /** Le geste était-il déjà fait quand la note a été montrée (mode revoir) ? */
  #doneAtShow = false;

  #screen: TutorialScreen;

  constructor(host: TutorialHost, game: GameStoreImpl, screen: TutorialScreen = 'desk') {
    this.#host = host;
    this.#game = game;
    this.#screen = screen;
    // Le Bureau garde sa référence d'ouverture même si la couche est remontée (Options…).
    let base = baselines.get(game);
    if (!base) baselines.set(game, (base = baselineOf(game.state)));
    this.#base = base;
  }

  get progress(): TutorialProgress | undefined {
    return this.#host.profile.tutorial;
  }

  /** Tutoriel en cours (commencé et ni fini ni passé). */
  get active(): boolean {
    const t = this.progress;
    return t !== undefined && !t.done;
  }

  seen = (id: TutorialStepId): boolean => this.progress?.seen.includes(id) ?? false;

  context(): TutorialContext {
    const g = this.#game;
    return {
      state: g.state,
      content: g.content,
      ui: g.ui,
      modalOpen: g.modal !== null,
      base: this.#base,
      seen: this.seen,
      screen: this.#screen,
    };
  }

  /**
   * Prochaine note à montrer (réactif : état de partie, panneaux, profil). Les notes dont le
   * geste est fait sont marquées vues au passage ; la note courante se range si son geste
   * vient d'être fait.
   */
  evaluate(): TutorialStep | null {
    if (replayRequested) {
      replayRequested = false;
      replaying.add(this.#game);
      this.current = null;
      this.#base = baselineOf(this.#game.state);
      baselines.set(this.#game, this.#base);
    }
    if (!this.active) return null;
    const c = this.context();
    const cur = this.current;
    if (cur && !this.seen(cur.id)) {
      if (cur.done(c) && !this.#doneAtShow) {
        this.#markSeen([cur.id]);
        return null;
      }
      return cur;
    }
    const { step, silent } = nextStep(c, this.replay);
    if (silent.length > 0) this.#markSeen(silent);
    return step;
  }

  /** La couche affiche cette note (après le délai de pose). */
  show(step: TutorialStep | null): void {
    if (step === this.current) return;
    this.current = step;
    this.#doneAtShow = step ? step.done(this.context()) : false;
  }

  /** « Compris » ou Échap : la note est vue. */
  dismiss(): void {
    const cur = this.current;
    if (!cur) return;
    this.current = null;
    this.#markSeen([cur.id]);
  }

  /** « Passer le tutoriel » : plus aucune note (réactivable dans Aide ou Options). */
  skip(): void {
    this.current = null;
    write(this.#host, { done: true, seen: this.progress?.seen ?? [] });
  }

  #markSeen(ids: TutorialStepId[]): void {
    const t = this.progress;
    if (!t || t.done) return;
    write(this.#host, progressOf([...t.seen, ...ids], this.#game.content));
  }
}
