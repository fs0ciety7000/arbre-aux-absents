/**
 * Tutoriel en bulles : progression dans le profil (`Profile.tutorial`, contrat), choix de la
 * prochaine note, gestes de la note (Compris, Passer, Échap). L'affichage est fait par
 * `TutorialLayer.svelte` avec la primitive `Coachmark`.
 */
import { TUTORIAL_SEEN_MAX, type Profile, type TutorialProgress } from '@arbre/contract';
import {
  baselineOf,
  nextStep,
  TUTORIAL_STEPS,
  type TutorialBaseline,
  type TutorialContext,
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
 * Nouvelle partie (E04) : « J'ai déjà joué » termine le tutoriel ; sinon il commence (premier
 * jeu) ou reprend où il en était. Un tutoriel déjà terminé ne revient pas tout seul.
 */
export function prepareTutorial(host: TutorialHost, skip: boolean): void {
  const t = host.profile.tutorial;
  if (skip) {
    if (!t?.done) write(host, { done: true, seen: t?.seen ?? [] });
  } else if (!t) {
    write(host, { done: false, seen: [] });
  }
}

/** Aide › Revoir le tutoriel, Options › Jeu : les notes reviennent, même pour un geste déjà fait. */
export function restartTutorial(host: TutorialHost): void {
  write(host, { done: false, seen: [] });
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

  constructor(host: TutorialHost, game: GameStoreImpl) {
    this.#host = host;
    this.#game = game;
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
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
    const seen = [...new Set([...t.seen, ...ids])].slice(-TUTORIAL_SEEN_MAX);
    const done = TUTORIAL_STEPS.every((id) => seen.includes(id));
    write(this.#host, { done, seen });
  }
}
