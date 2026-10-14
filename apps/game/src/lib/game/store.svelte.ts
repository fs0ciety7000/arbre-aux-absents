import type {
  AchievementId,
  Action,
  CompiledCase,
  EndingId,
  GameEvent,
  GroupId,
  Profile,
  SaveState,
  SaveStore,
  SecretId,
  Settings,
  SlotId,
} from '@arbre/contract';
import { hintPreset } from '@arbre/contract';
import {
  applyAction,
  claimedFields,
  emptyGuard,
  evaluateAchievements,
  groupCorrectCount,
  groupOf,
  isComplete,
  progress,
  settle,
  validate,
  type SweepGuard,
} from '@arbre/engine';
import { pushToast } from '@arbre/ui';
import { audio } from '../../audio/engine';
import { messages } from '../../messages.fr';
import { announcer } from './announcer.svelte';
import { generationNumber } from './generations';
import { askedQuestions } from './report';
import { FIELD_LABELS, pm } from '../../panels/messages';
import { claimFields, fieldValueLabel } from '../../panels/lib/view';
import type {
  DeskUi,
  DistributiveOmit,
  GameStore,
  NavTarget,
  PanelId,
  RevealRecord,
  Split,
} from './types';
export type { RevealRecord, Split } from './types';
import { viewport } from './viewport.svelte';

/** Délai sans modification avant l'évaluation automatique d'un groupe (GAME_DESIGN §7.4 R1). */
export const AUTO_VALIDATE_DELAY_MS = 800;
/** Sauvegarde automatique : 2 s après la dernière action (ARCHITECTURE §4). */
export const AUTOSAVE_DELAY_MS = 2000;
/** Nouvel essai après un échec d'écriture (ECRANS §5). */
export const SAVE_RETRY_MS = 30_000;
/** Copie de secours : état d'il y a au moins 10 min (GAME_DESIGN §11). */
export const BACKUP_AGE_MS = 10 * 60_000;
const HISTORY_MAX = 20;

/** Panneaux de la zone principale (desktop/tablette) ; les autres vont dans le volet. */
export const MAIN_PANELS: readonly PanelId[] = ['tree', 'map', 'pinboard', 'faces'];
export const SIDE_PANELS: readonly PanelId[] = [
  'reader',
  'archives',
  'catalogue',
  'notebook',
  'journal',
  'help',
];
/** Onglets fixes du téléphone (ECRANS §3.3). */
export const PHONE_TABS: readonly PanelId[] = ['tree', 'archives', 'catalogue', 'notebook', 'map'];

/** Modaux du Bureau (P12, P13, P14). */
export type DeskModal = { uid: number } & (
  | { kind: 'pause' }
  | { kind: 'reveal'; title: string; lines: string[] }
  | { kind: 'secret'; id: SecretId; title: string }
);
type NewModal = DistributiveOmit<DeskModal, 'uid'>;
let modalSeq = 0;

/** Ce que l'application fournit au store (réglages, profil, persistance, écrans). */
export interface StoreHost {
  readonly settings: Settings;
  readonly profile: Profile;
  readonly saveStore: SaveStore;
  updateSettings(patch: Partial<Settings>): void;
  unlockAchievements(ids: AchievementId[], c: CompiledCase): void;
  showEnding(id: EndingId): void;
  /** Arbre complet : ouvre le rapport final (questions avant `finish`). */
  showReport(): void;
  saveStatus(ok: boolean): void;
  /** Un écran recouvre le Bureau (options, succès…) : le chrono s'arrête. */
  readonly overlayOpen: boolean;
}

interface HistoryEntry {
  main: PanelId;
  side: PanelId | null;
  openDocument: DeskUi['openDocument'];
  selectedSlot: DeskUi['selectedSlot'];
  selectedPlace: DeskUi['selectedPlace'];
}

const now = () => Date.now();

/**
 * Store de partie (contrat `GameStore`, `src/lib/game/types.ts`) : enveloppe le moteur pur.
 * - `dispatch` horodate (`at`), passe le garde-fou anti-balayage et la validation **manuelle**
 *   au moteur, puis programme l'évaluation automatique du groupe 800 ms après la dernière
 *   modification (R1) ;
 * - sauvegarde 2 s après chaque action, et à la mise en arrière-plan ;
 * - fait avancer le temps de jeu (pause si l'onglet est caché, en pause ou sous un écran) ;
 * - diffuse les événements (annonces, sons, toasts, cartes de révélation, succès, fin).
 */
export class GameStoreImpl implements GameStore {
  readonly content: CompiledCase;
  readonly ui: DeskUi;

  #state = $state.raw<SaveState>(null as unknown as SaveState);
  modals = $state<DeskModal[]>([]);
  reveals = $state<RevealRecord[]>([]);
  /** Déclarations contestées de la session (AFFAIRE-2 §1.7), pour le Journal. */
  contested = $state<RevealRecord[]>([]);
  splits = $state<Split[]>([]);
  /** Dernier mot-clé ciblé par `navigate` (Carnet). */
  focusKeyword = $state<string | null>(null);
  /** Passage à mettre en évidence dans le Lecteur (`navigate` document + passage). */
  focusPassage = $state<number[] | null>(null);
  /** Mini-lecteur rangé (téléphone) jusqu'au prochain document ouvert. */
  miniReaderHidden = $state(false);
  /** Volet latéral replié (desktop/tablette). */
  sideCollapsed = $state(false);
  /** Largeur du volet latéral (px). */
  sideWidth = $state(440);
  /** Le joueur a passé le tutoriel (« J'ai déjà joué »). */
  skipTutorial = $state(false);
  saveFailed = $state(false);
  /** Retour intercepté avant la pause (note du tutoriel ouverte : Échap / B la range). */
  backIntercept: (() => boolean) | null = null;

  #host: StoreHost;
  #guard: SweepGuard = emptyGuard();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
  #listeners = new Set<(events: GameEvent[]) => void>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
  #groupTimers = new Map<GroupId, ReturnType<typeof setTimeout>>();
  #saveTimer: ReturnType<typeof setTimeout> | undefined;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #tickTimer: ReturnType<typeof setInterval> | undefined;
  #lastTick = 0;
  #dirty = false;
  #backup: { state: SaveState; at: number } | null = null;
  #pendingEnding: EndingId | null = null;
  #pendingReport = false;
  #reportRequested = false;
  #history: HistoryEntry[] = [];
  #historyIndex = -1;
  #cleanup: (() => void)[] = [];
  #destroyed = false;
  /** Fermeture en cours (sauvegarder et quitter) : plus de changement d'écran. */
  #closing = false;

  constructor(content: CompiledCase, state: SaveState, host: StoreHost) {
    this.content = content;
    this.#state = state;
    this.#host = host;
    this.#backup = { state, at: now() };
    this.ui = $state<DeskUi>({
      main: 'tree',
      side: viewport.single ? null : 'reader',
      openDocument: null,
      selectedSlot: null,
      selectedPlace: null,
      picking: null,
      lastSearch: null,
    });
    this.#pushHistory();
  }

  get state(): SaveState {
    return this.#state;
  }

  /** Réglages effectifs : en mode chronométré, aides plafonnées au niveau 1 (§13.4). */
  get settings(): Settings {
    const s = this.#host.settings;
    if (this.#state.mode !== 'timed') return s;
    const cap = hintPreset(1);
    const h = s.hints;
    return {
      ...s,
      hints: {
        preset: h.preset === 0 ? 0 : 1,
        unreadBadges: h.unreadBadges && cap.unreadBadges,
        exhaustedTerms: h.exhaustedTerms && cap.exhaustedTerms,
        placeCounters: h.placeCounters && cap.placeCounters,
        whereToLook: h.whereToLook && cap.whereToLook,
        groupCounter: false,
        progressiveHints: false,
      },
    };
  }

  get profile(): Profile {
    return this.#host.profile;
  }

  get modal(): DeskModal | null {
    return this.modals[0] ?? null;
  }

  get paused(): boolean {
    return this.modals.some((m) => m.kind === 'pause');
  }

  // ── Cycle de vie ───────────────────────────────────────────────────

  /**
   * Démarre la partie : chrono et écoute de la mise en arrière-plan. **Aucune évaluation au
   * chargement** : un groupe ne s'établit que par son déclencheur normal (R1 : une case devient
   * complète ou change, 800 ms plus tard ; ou « Soumettre la branche » en validation manuelle).
   * Une évaluation encore en attente à la fermeture est faite avant la dernière sauvegarde
   * (`prepareClose`, `destroy`, `pagehide`) : rien ne reste « à évaluer » dans une sauvegarde.
   */
  start(): void {
    if (typeof window === 'undefined') return;
    this.#lastTick = performance.now();
    this.#tickTimer = setInterval(() => this.#tick(), 1000);
    const onVisibility = () => {
      if (document.hidden) {
        this.#tick();
        // Mise en arrière-plan (téléphone : l'application peut être tuée sans `pagehide`).
        this.#runPendingGroups();
        void this.flush();
      } else this.#lastTick = performance.now();
    };
    // Fermeture de l'onglet ou de l'application : l'évaluation déclenchée (R1) mais pas encore
    // faite est faite maintenant, pour être sauvegardée avec le reste.
    const onPageHide = () => {
      this.#runPendingGroups();
      void this.flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    this.#cleanup.push(
      () => document.removeEventListener('visibilitychange', onVisibility),
      () => window.removeEventListener('pagehide', onPageHide),
    );
  }

  /**
   * Arrête minuteries et écouteurs (la sauvegarde doit avoir été faite par `flush`, après
   * `prepareClose`). Une évaluation de groupe encore en attente est faite et sauvegardée.
   */
  destroy(): void {
    if (!this.#destroyed && this.#groupTimers.size > 0) {
      this.prepareClose();
      if (this.#dirty) void this.flush();
    }
    this.#destroyed = true;
    clearInterval(this.#tickTimer);
    clearTimeout(this.#saveTimer);
    clearTimeout(this.#retryTimer);
    for (const t of this.#groupTimers.values()) clearTimeout(t);
    this.#groupTimers.clear();
    for (const fn of this.#cleanup) fn();
    this.#cleanup = [];
    this.#listeners.clear();
  }

  // ── Actions ────────────────────────────────────────────────────────

  dispatch(action: Action | DistributiveOmit<Action, 'at'>): GameEvent[] {
    const a = (
      action.type === 'tick' || 'at' in action ? action : { ...action, at: now() }
    ) as Action;
    const before = this.#state;
    const t = applyAction(before, a, this.content, { validation: 'manual', guard: this.#guard });
    this.#guard = t.guard;
    if (t.state !== before) {
      this.#state = t.state;
      if (a.type !== 'tick') this.#markDirty();
    }
    if (a.type === 'setSlot' || a.type === 'clearSlot') {
      const accepted = !t.events.some((e) => e.type === 'rejected') && t.state !== before;
      if (accepted) {
        this.#announceClaim(a.slot, before, t.state);
        this.#scheduleGroup(a.slot);
      }
    }
    if (a.type === 'search' && t.events.length > 0) {
      const res = t.events.find((e) => e.type === 'searchResult');
      if (res) this.ui.lastSearch = res.outcome;
    }
    this.#handle(t.events, a.type);
    return t.events;
  }

  onEvents(listener: (events: GameEvent[]) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  updateSettings(patch: Partial<Settings>): void {
    this.#host.updateSettings(patch);
  }

  /**
   * Case revendiquée (AFFAIRE-2 §1.8) : annonce ce qui change dans la déclaration (champ retiré
   * ou remplacé, déclaration retirée ou rétablie). Aucun retour de justesse.
   */
  #announceClaim(slot: SlotId, before: SaveState, after: SaveState): void {
    const c = this.content;
    const all = claimFields(c, slot);
    if (all.length === 0 || after.locked[slot] !== undefined) return;
    const was = claimedFields(slot, before, c);
    const now = claimedFields(slot, after, c);
    const m = messages.announce;
    if (now.length > was.length) {
      if (now.length === all.length) announcer.say(m.claimRestored);
      return;
    }
    const gone = was.filter((f) => !now.includes(f));
    if (gone.length === 0) return;
    // Agrafe ôtée (effets, coupée avec le son) ; pas de vibration (§1.7).
    audio.play('unstaple');
    // Première contestation d'une déclaration intacte : constat d'action au Journal, sans verdict.
    if (was.length === all.length) {
      this.contested = [
        ...this.contested,
        {
          at: Date.now(),
          title: pm.journal.claimContested(gone.map((f) => FIELD_LABELS[f]).join(', ')),
          lines: [],
        },
      ];
    }
    const g = after.tree[slot];
    if (gone.length > 1) {
      announcer.say(m.claimRemoved(gone.length));
      return;
    }
    const f = gone[0]!;
    const value = fieldValueLabel(c, f, g ?? null);
    announcer.say(
      value
        ? m.claimFieldReplaced(FIELD_LABELS[f], value, now.length, all.length)
        : m.claimFieldRemoved(FIELD_LABELS[f]),
    );
  }

  /** R1 : (ré)arme l'évaluation du groupe de la case, 800 ms après la dernière modification. */
  #scheduleGroup(slot: SlotId): void {
    if (this.#host.settings.validation !== 'auto') return;
    const group = groupOf(slot, this.content);
    if (!group) return;
    const pending = this.#groupTimers.get(group.id);
    const becameComplete = isComplete(this.#state.tree[slot]);
    if (!pending && !becameComplete) return;
    clearTimeout(pending);
    this.#groupTimers.set(
      group.id,
      setTimeout(() => {
        this.#groupTimers.delete(group.id);
        this.#validateGroup(group.id);
      }, AUTO_VALIDATE_DELAY_MS),
    );
  }

  /** Groupes dont l'évaluation automatique est programmée (R1). */
  get pendingGroups(): GroupId[] {
    return [...this.#groupTimers.keys()];
  }

  /**
   * Évalue tout de suite les groupes en attente (sans attendre les 800 ms) : à appeler avant
   * la dernière sauvegarde (« Sauvegarder et quitter »). Plus de changement d'écran ensuite.
   */
  prepareClose(): void {
    this.#closing = true;
    this.#runPendingGroups();
  }

  /** Fait tout de suite les évaluations programmées (R1) et annule leurs minuteries. */
  #runPendingGroups(): void {
    if (this.#destroyed) return;
    const groups = this.pendingGroups;
    for (const t of this.#groupTimers.values()) clearTimeout(t);
    this.#groupTimers.clear();
    for (const g of groups) this.#validateGroup(g);
  }

  /** Évaluation d'un seul groupe (R7), avec le garde-fou anti-balayage. */
  #validateGroup(group: GroupId): void {
    if (this.#destroyed) return;
    const s = this.#state;
    const at = Math.max(now(), s.updatedAt);
    const result = validate(s, this.content, { groups: [group], guard: this.#guard, at });
    if (result.lock.length === 0) {
      this.#handle([{ type: 'validationFailed' }], 'validate', group);
      return;
    }
    this.#applyLocks(result.lock, result.groups, at);
  }

  #applyLocks(lock: SlotId[], groups: GroupId[], at: number): void {
    const s = this.#state;
    const locked = { ...s.locked };
    for (const id of lock) locked[id] = at;
    const settled = settle({ ...s, locked, updatedAt: at }, this.content);
    this.#state = settled.state;
    this.#markDirty();
    this.#handle([{ type: 'slotsLocked', ids: lock, groups }, ...settled.events], 'validate');
  }

  // ── Événements ─────────────────────────────────────────────────────

  #handle(events: GameEvent[], source: Action['type'], group?: GroupId): void {
    if (events.length === 0) return;
    for (const e of events) this.#react(e, group);
    for (const l of this.#listeners) {
      try {
        l(events);
      } catch (err) {
        console.error(err);
      }
    }
    if (source === 'tick') return;
    const c = this.content;
    const unlocked = evaluateAchievements(this.#state, this.profile, c);
    if (unlocked.length > 0) this.#host.unlockAchievements(unlocked, c);
    const p = progress(this.#state, c);
    if (
      p.total > 0 &&
      p.locked === p.total &&
      this.#state.ending === null &&
      source !== 'finish' &&
      source !== 'answer' &&
      !this.#reportRequested
    ) {
      this.#reportRequested = true;
      if (askedQuestions(this.#state, c).length === 0) this.dispatch({ type: 'finish' });
      else {
        this.#pendingReport = true;
        this.#maybeShowEnding();
      }
    }
  }

  #react(e: GameEvent, group?: GroupId): void {
    const c = this.content;
    const m = messages;
    switch (e.type) {
      case 'documentsUnlocked': {
        if (e.ids.length === 0) break;
        audio.play('paper');
        announcer.say(m.announce.documentsUnlocked(e.ids.length));
        const first = e.ids[0]!;
        const single = e.ids.length === 1;
        pushToast({
          tone: 'info',
          title: single
            ? m.toasts.newDocument(c.documents[first]?.title ?? first)
            : m.toasts.newDocuments(e.ids.length),
          action: single
            ? {
                label: m.toasts.open,
                onclick: () => this.navigate({ kind: 'document', id: first }),
              }
            : { label: m.toasts.seeArchives, onclick: () => this.showPanel('archives') },
        });
        break;
      }
      case 'searchResult':
        if (e.outcome.normalized === '') break;
        audio.play(e.outcome.keyword ? 'type' : 'nothing');
        announcer.say(
          e.outcome.documents.length > 0
            ? m.announce.searchFound(e.outcome.documents.length)
            : m.announce.searchNone,
        );
        break;
      case 'slotsRevealed':
        announcer.say(m.announce.slotsRevealed(e.ids.length));
        break;
      case 'slotsLocked': {
        audio.play('stamp');
        setTimeout(() => audio.play('chord'), 180);
        this.#vibrate([30]);
        const names = e.ids.map((id) => this.slotName(id)).join(', ');
        announcer.say(m.announce.slotsLocked(e.ids.length, names));
        if (this.#state.mode === 'timed') {
          this.splits = [...this.splits, { elapsedMs: this.#state.elapsedMs, count: e.ids.length }];
        }
        this.#milestones(e.ids, e.groups);
        break;
      }
      case 'validationFailed': {
        const s = this.settings;
        if (group && s.hints.groupCounter && this.#state.mode !== 'timed') {
          const n = groupCorrectCount(group, this.#state, c);
          const text = m.announce.groupCounter(n);
          pushToast({ tone: 'info', title: m.toasts.groupCounterTitle, message: text });
          announcer.say(text);
        }
        break;
      }
      case 'secretFound': {
        const title = c.progression.secrets.find((x) => x.id === e.id)?.title ?? e.id;
        audio.play('reveal');
        this.#vibrate([40, 60, 40]);
        announcer.say(m.announce.secretFound(title));
        this.#enqueue({ kind: 'secret', id: e.id, title });
        break;
      }
      case 'endingReached':
        announcer.say(m.announce.endingReached);
        this.#pendingEnding = e.id;
        void this.flush();
        this.#maybeShowEnding();
        break;
      case 'rejected':
        if (e.reason === 'limit') {
          pushToast({ tone: 'warning', title: m.toasts.pinsFull, message: m.toasts.pinsFullText });
        } else if (e.reason === 'tooLong') {
          pushToast({ tone: 'warning', title: m.toasts.tooLong, timeout: 6000 });
        }
        break;
    }
  }

  /** Jalons : groupe complet, génération complète → carte de révélation (P13). */
  #milestones(ids: SlotId[], groups: GroupId[]): void {
    const c = this.content;
    const s = this.#state;
    const isLocked = (id: SlotId) => s.locked[id] !== undefined;
    const cards: RevealRecord[] = [];
    for (const gid of groups) {
      const g = c.groups.find((x) => x.id === gid);
      if (!g || !g.slots.every(isLocked)) continue;
      const names = g.slots.map((id) => this.slotName(id)).join(', ');
      cards.push({
        at: now(),
        title: messages.reveal.groupDone(g.label),
        lines: [messages.reveal.established(names)],
      });
    }
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non réactif par conception
    const gens = new Set(ids.map((id) => c.slots[id]?.generation).filter((g) => g !== undefined));
    for (const gen of gens) {
      const slots = Object.entries(c.slots).filter(([, v]) => v.generation === gen);
      const wasComplete = slots.every(([id]) => isLocked(id) && !ids.includes(id));
      if (wasComplete || !slots.every(([id]) => isLocked(id))) continue;
      const names = slots.map(([id]) => this.slotName(id)).join(', ');
      cards.push({
        at: now(),
        title: messages.reveal.generationDone(generationNumber(c, gen)),
        lines: [messages.reveal.established(names)],
      });
    }
    if (cards.length === 0) return;
    this.reveals = [...this.reveals, ...cards];
    audio.play('reveal');
    for (const card of cards)
      this.#enqueue({ kind: 'reveal', title: card.title, lines: card.lines });
  }

  /** Nom affiché d'une case (saisie du joueur). */
  slotName(id: SlotId): string {
    const g = this.#state.tree[id];
    const name = g ? `${g.given} ${g.family}`.trim() : '';
    return name || messages.announce.unknownSlot;
  }

  #vibrate(pattern: number[]): void {
    if (this.#host.settings.haptics && typeof navigator !== 'undefined') {
      navigator.vibrate?.(pattern);
    }
  }

  // ── Modaux ─────────────────────────────────────────────────────────

  #enqueue(m: NewModal): void {
    this.modals = [...this.modals, { ...m, uid: ++modalSeq } as DeskModal];
  }

  openPause(): void {
    if (this.paused) return;
    this.#tick();
    this.modals = [{ kind: 'pause', uid: ++modalSeq }, ...this.modals];
    void this.flush();
  }

  /** Ferme le modal courant (ou celui d'identifiant `uid` s'il est courant). */
  closeModal(uid?: number): void {
    if (this.modals.length === 0) return;
    if (uid !== undefined && this.modals[0]?.uid !== uid) return;
    const [first, ...rest] = this.modals;
    this.modals = rest;
    if (first?.kind === 'pause') this.#lastTick = performance.now();
    this.#maybeShowEnding();
  }

  #maybeShowEnding(): void {
    if (this.#closing) return;
    if (this.#pendingReport && this.modals.length === 0) {
      this.#pendingReport = false;
      void this.flush();
      this.#host.showReport();
      return;
    }
    if (this.#pendingEnding && this.modals.length === 0) {
      const id = this.#pendingEnding;
      this.#pendingEnding = null;
      this.#host.showEnding(id);
    }
  }

  /** Rapport confirmé : choisit la fin (`finish`). */
  finishReport(): void {
    this.dispatch({ type: 'finish' });
  }

  /** Le joueur a quitté le rapport sans confirmer : il sera reproposé au prochain verrouillage. */
  reportDismissed(): void {
    this.#reportRequested = false;
  }

  /**
   * Arbre complet, dénouement pas encore choisi : le rapport final peut être remis (action
   * « Remettre le rapport », après « Revenir au bureau » ou au rechargement de la partie).
   */
  get reportAvailable(): boolean {
    if (this.#state.ending !== null) return false;
    const p = progress(this.#state, this.content);
    return p.total > 0 && p.locked === p.total;
  }

  /** Rouvre le rapport final (questions, puis `finish` à la confirmation). */
  reopenReport(): void {
    if (!this.reportAvailable) return;
    this.#reportRequested = true;
    this.#pendingReport = false;
    this.ui.picking = null;
    void this.flush();
    this.#host.showReport();
  }

  // ── Navigation ─────────────────────────────────────────────────────

  /** Montre un panneau là où il vit selon la disposition. */
  showPanel(id: PanelId): void {
    if (viewport.single) {
      this.ui.main = id;
      this.ui.side = null;
    } else if (MAIN_PANELS.includes(id)) {
      this.ui.main = id;
    } else {
      this.ui.side = id;
      this.sideCollapsed = false;
    }
    if (id === 'reader') this.miniReaderHidden = false;
    this.#pushHistory();
  }

  /** Réaligne l'état d'interface sur la disposition courante (changement de format). */
  normalizeLayout(): void {
    if (viewport.single) {
      this.ui.side = null;
    } else {
      if (!MAIN_PANELS.includes(this.ui.main)) {
        this.ui.side = this.ui.main;
        this.ui.main = 'tree';
      }
      this.ui.side ??= 'reader';
    }
  }

  navigate(target: NavTarget): void {
    switch (target.kind) {
      case 'document':
        this.ui.openDocument = target.id;
        this.focusPassage = target.passage ?? null;
        this.miniReaderHidden = false;
        this.dispatch({ type: 'openDocument', id: target.id });
        this.showPanel('reader');
        return;
      case 'keyword':
        this.focusKeyword = target.id;
        this.showPanel('notebook');
        return;
      case 'slot':
        this.ui.selectedSlot = target.id;
        this.ui.picking = target.field ? { slot: target.id, field: target.field } : null;
        this.showPanel('tree');
        return;
      case 'place':
        this.ui.selectedPlace = target.id;
        this.showPanel('map');
        return;
      case 'panel':
        this.showPanel(target.id);
        return;
    }
  }

  /** Retour (ECRANS §2) : modal, puis panneau secondaire, puis pause. */
  back(): void {
    if (this.ui.picking) {
      this.ui.picking = null;
      return;
    }
    if (this.modals.length > 0) {
      this.closeModal();
      return;
    }
    if (this.backIntercept?.()) return;
    if (viewport.single && !PHONE_TABS.includes(this.ui.main)) {
      this.ui.main = 'tree';
      this.#pushHistory();
      return;
    }
    this.openPause();
  }

  #snapshot(): HistoryEntry {
    const u = this.ui;
    return {
      main: u.main,
      side: u.side,
      openDocument: u.openDocument,
      selectedSlot: u.selectedSlot,
      selectedPlace: u.selectedPlace,
    };
  }

  #pushHistory(): void {
    const entry = this.#snapshot();
    const current = this.#history[this.#historyIndex];
    if (current && JSON.stringify(current) === JSON.stringify(entry)) return;
    this.#history = [...this.#history.slice(0, this.#historyIndex + 1), entry].slice(-HISTORY_MAX);
    this.#historyIndex = this.#history.length - 1;
  }

  /** Historique de navigation interne (Alt+← / Alt+→), 20 entrées. */
  historyGo(delta: -1 | 1): boolean {
    const i = this.#historyIndex + delta;
    const entry = this.#history[i];
    if (!entry) return false;
    this.#historyIndex = i;
    Object.assign(this.ui, entry);
    this.normalizeLayout();
    return true;
  }

  // ── Temps ──────────────────────────────────────────────────────────

  #tick(): void {
    const t = performance.now();
    const delta = t - this.#lastTick;
    this.#lastTick = t;
    const hidden = typeof document !== 'undefined' && document.hidden;
    if (this.#destroyed || hidden || this.paused || this.#host.overlayOpen) return;
    if (delta <= 0) return;
    this.dispatch({ type: 'tick', deltaMs: Math.min(delta, 5000) });
    this.#dirty = true;
  }

  // ── Sauvegarde ─────────────────────────────────────────────────────

  #markDirty(): void {
    this.#dirty = true;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.flush(), AUTOSAVE_DELAY_MS);
  }

  /** Écrit la partie maintenant (et la copie de secours si elle a ≥ 10 min). */
  async flush(force = false): Promise<boolean> {
    clearTimeout(this.#saveTimer);
    if (!this.#dirty && !force) return true;
    const state = this.#state;
    this.#dirty = false;
    const saves = this.#host.saveStore;
    try {
      await saves.save(state.slot, state);
      if (state.slot !== 'auto' && this.#backup && now() - this.#backup.at >= BACKUP_AGE_MS) {
        // Un secours par affaire : la plateforme le range sous `caseId` (AFFAIRE-2 §2.3).
        await saves.save('auto', { ...this.#backup.state, slot: 'auto' });
        this.#backup = { state, at: now() };
      }
      if (this.saveFailed) {
        this.saveFailed = false;
        clearTimeout(this.#retryTimer);
      }
      this.#host.saveStatus(true);
      return true;
    } catch (err) {
      console.error('[sauvegarde]', err);
      this.#dirty = true;
      this.saveFailed = true;
      this.#host.saveStatus(false);
      clearTimeout(this.#retryTimer);
      if (!this.#destroyed) {
        this.#retryTimer = setTimeout(() => void this.flush(), SAVE_RETRY_MS);
      }
      return false;
    }
  }
}
