import type {
  AchievementId,
  CompiledCase,
  EndingId,
  GameMode,
  Platform,
  Profile,
  SaveSlotId,
  SaveSlotSummary,
  SaveState,
  SaveStore,
  Settings,
} from '@arbre/contract';
import { defaultProfile, defaultSettings, hintPreset, ProfileSchema } from '@arbre/contract';
import { newGame, parseSave, summarize } from '@arbre/engine';
import { pushToast } from '@arbre/ui';
import type { Component } from 'svelte';
import { audio } from '../../audio/engine';
import { PlatformError } from '../../platform/index';
import { messages } from '../../messages.fr';
import { announcer } from './announcer.svelte';
import { loadContent, type CaseEntry } from './cases';
import { loadPlatform } from './platform-loader';
import { applySettings } from './settings-dom';
import { GameStoreImpl, type StoreHost } from './store.svelte';
import type { ScreenId } from './types';
import { viewport } from './viewport.svelte';

/** Écrans qui peuvent recouvrir le Bureau sans le démonter (depuis la pause). */
export type OverlayScreen = 'options' | 'achievements' | 'stats';

export interface FatalError {
  code: string;
  message: string;
  detail: string;
}

export interface NewGameRequest {
  caseId: string;
  mode: GameMode;
  slot: SaveSlotId;
  hintPreset: 0 | 1 | 2 | 3;
  skipTutorial: boolean;
}

export type LoadResult = { ok: true } | { ok: false; error: string; corrupt: boolean };

/** Chargement de l'affaire compilée et du Bureau (modules à part, à la demande). */
export type ContentStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Écrans hors partie qui lisent l'affaire compilée. */
export const CONTENT_SCREENS: readonly ScreenId[] = [
  'new-game',
  'achievements',
  'bonus',
  'credits',
];

type DeskComponent = Component<{ game: GameStoreImpl }>;

const SLOTS: readonly SaveSlotId[] = ['slot-1', 'slot-2', 'slot-3', 'auto'];

/**
 * Contrôleur de l'application : écrans hors partie (E01–E09), profil et réglages,
 * plateforme, création/chargement des parties. Fournit le `StoreHost` du store de partie.
 */
export class AppController implements StoreHost {
  screen = $state<ScreenId>('launch');
  /** Écran par-dessus le Bureau (options/succès/stats depuis la pause). */
  overlay = $state<OverlayScreen | null>(null);
  /** Écran à rouvrir en quittant Options/Succès/Stats hors partie. */
  returnTo = $state<ScreenId>('title');
  profile = $state<Profile>(defaultProfile());
  cases = $state.raw<CaseEntry[]>([]);
  contentStatus = $state<ContentStatus>('idle');
  /** Bureau (panneaux), chargé avec l'affaire. */
  desk = $state.raw<DeskComponent | null>(null);
  game = $state.raw<GameStoreImpl | null>(null);
  saves = $state.raw<SaveSlotSummary[]>([]);
  ready = $state(false);
  /** Avertissement de stockage de la plateforme (mode secours, iframe itch…). */
  storageWarning = $state<string | null>(null);
  saveError = $state(false);
  fatal = $state<FatalError | null>(null);
  ending = $state<EndingId | null>(null);

  #platform: Platform | null = null;
  #profileTimer: ReturnType<typeof setTimeout> | undefined;
  #backUnsub: (() => void) | null = null;
  #contentLoad: Promise<boolean> | null = null;

  get platform(): Platform | null {
    return this.#platform;
  }

  get settings(): Settings {
    return this.profile.settings;
  }

  /** Le Bureau n'est pas visible (écran par-dessus, ou autre écran) : chrono arrêté. */
  get overlayOpen(): boolean {
    return this.overlay !== null || this.screen !== 'desk';
  }

  get saveStore(): SaveStore {
    if (!this.#platform) throw new Error('plateforme non chargée');
    return this.#platform.saves;
  }

  async init(): Promise<void> {
    viewport.start();
    audio.install();
    applySettings(this.settings);
    try {
      // L'affaire (lourde) n'est pas attendue ici : chargée en commençant ou en reprenant une
      // partie (`ensureContent`). Résumés de repli d'ici là (écrits à chaque sauvegarde).
      const loaded = await loadPlatform((s) => {
        const entry = this.findCase(s.caseId);
        return entry ? summarize(s, entry.content) : fallbackSummary(s);
      });
      this.#platform = loaded.platform;
      this.storageWarning = loaded.storageWarning;
      const raw = await this.#safe(() => loaded.platform.saves.loadProfile(), null);
      const parsed = ProfileSchema.safeParse(raw);
      if (parsed.success) this.profile = parsed.data as Profile;
      applySettings(this.settings);
      this.#configureAudio();
      await this.refreshSaves();
      this.#backUnsub = loaded.platform.onBack(() => this.back());
    } catch (err) {
      this.fail('INIT', messages.errors.caseLoad, err);
    }
    this.ready = true;
  }

  /**
   * Charge l'affaire compilée et le Bureau (une fois). Renvoie false en cas d'échec réseau
   * (état `error`, nouvel essai possible).
   */
  ensureContent(): Promise<boolean> {
    if (this.contentStatus === 'ready') return Promise.resolve(true);
    if (this.#contentLoad) return this.#contentLoad;
    this.contentStatus = 'loading';
    const run = Promise.all([loadContent(), import('../../shell/Desk.svelte')]).then(
      ([content, desk]) => {
        this.cases = content.cases;
        this.desk = desk.default as DeskComponent;
        this.contentStatus = 'ready';
        return true;
      },
      (err: unknown) => {
        console.error('[affaire]', err);
        this.contentStatus = 'error';
        return false;
      },
    );
    this.#contentLoad = run.finally(() => {
      this.#contentLoad = null;
    });
    return this.#contentLoad;
  }

  dispose(): void {
    this.#backUnsub?.();
  }

  fail(code: string, message: string, err: unknown): void {
    const detail =
      err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);
    this.fatal = { code, message, detail };
  }

  findCase(id: string): CaseEntry | undefined {
    return this.cases.find((c) => c.content.id === id);
  }

  // ── Écrans ─────────────────────────────────────────────────────────

  goto(screen: ScreenId): void {
    if (screen === 'options' || screen === 'achievements' || screen === 'stats') {
      if (this.screen === 'desk') {
        this.overlay = screen;
        return;
      }
      if (this.screen !== 'options' && this.screen !== 'achievements' && this.screen !== 'stats') {
        this.returnTo = this.screen;
      }
    }
    this.overlay = null;
    this.screen = screen;
    if (screen === 'title' || screen === 'slots' || screen === 'new-game') void this.refreshSaves();
  }

  /** Quitte un écran secondaire (Options, Succès…) vers son appelant. */
  closeSecondary(): void {
    if (this.overlay) {
      this.overlay = null;
      return;
    }
    this.goto(this.returnTo === 'launch' ? 'title' : this.returnTo);
  }

  /** Retour global (Échap, bouton B, retour Android). Renvoie true si consommé. */
  back(): boolean {
    if (typeof document !== 'undefined' && document.querySelector('dialog[open]')) return false;
    if (this.overlay) {
      this.overlay = null;
      return true;
    }
    switch (this.screen) {
      case 'desk':
        this.game?.back();
        return true;
      case 'title':
      case 'launch':
        return false;
      case 'ending':
        if (this.ending === null) this.leaveReport();
        return true;
      case 'options':
      case 'achievements':
      case 'stats':
        this.closeSecondary();
        return true;
      default:
        this.goto('title');
        return true;
    }
  }

  // ── Réglages et profil ─────────────────────────────────────────────

  updateSettings(patch: Partial<Settings>): void {
    const settings = { ...this.profile.settings, ...patch };
    this.profile = { ...this.profile, settings };
    applySettings(settings);
    this.#configureAudio();
    this.#saveProfileSoon();
  }

  resetSettings(): void {
    this.updateSettings(defaultSettings());
  }

  #configureAudio(): void {
    const s = this.settings;
    audio.configure(s.volume, { mono: s.mono, muteInBackground: s.muteInBackground });
  }

  #saveProfileSoon(): void {
    clearTimeout(this.#profileTimer);
    this.#profileTimer = setTimeout(() => void this.saveProfile(), 500);
  }

  async saveProfile(): Promise<void> {
    clearTimeout(this.#profileTimer);
    if (!this.#platform) return;
    await this.#safe(
      () => this.#platform!.saves.saveProfile($state.snapshot(this.profile)),
      undefined,
    );
  }

  unlockAchievements(ids: AchievementId[], c: CompiledCase): void {
    const at = Date.now();
    const achievements = { ...this.profile.achievements };
    for (const id of ids) achievements[id] ??= at;
    this.profile = { ...this.profile, achievements };
    for (const id of ids) {
      const a = c.achievements.find((x) => x.id === id);
      if (!a) continue;
      pushToast({ tone: 'success', title: messages.achievements.unlockedToast, message: a.title });
    }
    void this.saveProfile();
  }

  saveStatus(ok: boolean): void {
    this.saveError = !ok;
  }

  // ── Emplacements ───────────────────────────────────────────────────

  async refreshSaves(): Promise<void> {
    if (!this.#platform) return;
    const list = await this.#safe(() => this.#platform!.saves.list(), [] as SaveSlotSummary[]);
    this.saves = [...list].sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
  }

  /** Dernier emplacement joué (bouton Continuer). */
  get lastSave(): SaveSlotSummary | null {
    let best: SaveSlotSummary | null = null;
    for (const s of this.saves) if (!best || s.updatedAt > best.updatedAt) best = s;
    return best;
  }

  async removeSlot(slot: SaveSlotId): Promise<void> {
    await this.saveStore.remove(slot);
    await this.refreshSaves();
  }

  async exportSlot(slot: SaveSlotId): Promise<void> {
    await this.saveStore.exportFile(slot);
  }

  /** Importe un fichier dans un emplacement ; tout passe par `parseSave`. */
  async importInto(slot: SaveSlotId): Promise<{ ok: boolean; error?: string }> {
    let raw: unknown;
    try {
      raw = await this.saveStore.importFile();
    } catch (err) {
      return {
        ok: false,
        error: err instanceof PlatformError ? err.message : messages.slots.importInvalid,
      };
    }
    if (raw === null || raw === undefined) return { ok: false };
    if (!(await this.ensureContent())) return { ok: false, error: messages.errors.contentLoad };
    const id = guessCaseId(raw);
    const entry =
      (id && this.findCase(id)) || (this.cases.length === 1 ? this.cases[0] : undefined);
    if (!entry) return { ok: false, error: messages.slots.importInvalid };
    const res = parseSave(raw, entry.content);
    if (!res.ok) return { ok: false, error: messages.slots.importInvalid };
    await this.saveStore.save(slot, { ...res.state, slot });
    await this.refreshSaves();
    return { ok: true };
  }

  // ── Parties ────────────────────────────────────────────────────────

  async startNewGame(req: NewGameRequest): Promise<void> {
    if (!(await this.ensureContent())) return;
    const entry = this.findCase(req.caseId);
    if (!entry) return;
    if (req.mode !== 'timed') this.updateSettings({ hints: hintPreset(req.hintPreset) });
    const state = newGame(entry.content, { slot: req.slot, mode: req.mode, at: Date.now() });
    this.#openGame(entry.content, state, { skipTutorial: req.skipTutorial, fresh: true });
  }

  async loadSlot(slot: SaveSlotId): Promise<LoadResult> {
    if (!(await this.ensureContent())) {
      return { ok: false, error: messages.errors.contentLoad, corrupt: false };
    }
    let raw: unknown;
    try {
      raw = await this.saveStore.load(slot);
    } catch (err) {
      if (err instanceof PlatformError && err.code === 'storage') {
        return { ok: false, error: err.message, corrupt: false };
      }
      return { ok: false, error: messages.slots.corrupt, corrupt: true };
    }
    if (raw === null || raw === undefined)
      return { ok: false, error: messages.slots.corrupt, corrupt: true };
    const id = guessCaseId(raw);
    const entry = id ? this.findCase(id) : undefined;
    if (!entry) return { ok: false, error: messages.slots.unknownCase, corrupt: false };
    const res = parseSave(raw, entry.content);
    if (!res.ok) {
      const newer = /plus récente/.test(res.error);
      return {
        ok: false,
        error: newer ? messages.slots.newer : messages.slots.corrupt,
        corrupt: !newer,
      };
    }
    this.#openGame(entry.content, res.state, { skipTutorial: true, fresh: false });
    return { ok: true };
  }

  async continueLast(): Promise<LoadResult> {
    const last = this.lastSave;
    if (!last) return { ok: false, error: messages.slots.none, corrupt: false };
    return this.loadSlot(last.slot);
  }

  #openGame(
    c: CompiledCase,
    state: SaveState,
    opts: { skipTutorial: boolean; fresh: boolean },
  ): void {
    this.closeGame();
    const store = new GameStoreImpl(c, state, this);
    store.skipTutorial = opts.skipTutorial;
    this.game = store;
    this.ending = null;
    this.overlay = null;
    this.screen = 'desk';
    store.start();
    if (opts.fresh) void store.flush(true);
    if (this.storageWarning) {
      pushToast({ tone: 'warning', title: this.storageWarning });
    }
  }

  closeGame(): void {
    this.game?.destroy();
    this.game = null;
  }

  /** P14 « Sauvegarder et quitter » : sauvegarde d'abord, puis Titre. */
  async saveAndQuit(): Promise<void> {
    const g = this.game;
    if (g) {
      // Une évaluation de groupe en attente (800 ms) est faite avant la dernière sauvegarde.
      g.prepareClose();
      await g.flush(true);
      this.closeGame();
    }
    await this.saveProfile();
    this.goto('title');
  }

  /** Sauvegarde manuelle (Ctrl+S) avec confirmation visuelle. */
  async manualSave(): Promise<void> {
    const ok = await this.game?.flush(true);
    if (ok) {
      pushToast({ tone: 'success', title: messages.desk.saved, timeout: 2500 });
      announcer.say(messages.desk.saved);
    }
  }

  // ── Dénouement ─────────────────────────────────────────────────────

  showEnding(id: EndingId): void {
    const g = this.game;
    if (g) {
      const caseId = g.content.id;
      const prev = this.profile.completed[caseId] ?? { endings: [] };
      const endings = prev.endings.includes(id) ? prev.endings : [...prev.endings, id];
      const timed = g.state.mode === 'timed' ? g.state.elapsedMs : undefined;
      const best =
        timed !== undefined && (prev.bestTimedMs === undefined || timed < prev.bestTimedMs)
          ? timed
          : prev.bestTimedMs;
      this.profile = {
        ...this.profile,
        completed: {
          ...this.profile.completed,
          [caseId]: { endings, ...(best !== undefined && best > 0 ? { bestTimedMs: best } : {}) },
        },
      };
      void this.saveProfile();
    }
    this.ending = id;
    this.overlay = null;
    this.screen = 'ending';
  }

  /** Rapport final : écran `ending` sans fin choisie (phase questions). */
  showReport(): void {
    this.ending = null;
    this.overlay = null;
    this.screen = 'ending';
  }

  /** Quitte le rapport sans le confirmer (retour au Bureau). */
  leaveReport(): void {
    this.game?.reportDismissed();
    this.screen = this.game ? 'desk' : 'title';
  }

  /** « Continuer l'enquête » après le dénouement. */
  resumeAfterEnding(): void {
    this.ending = null;
    this.screen = this.game ? 'desk' : 'title';
  }

  /** Mode chronométré débloqué après un premier dénouement. */
  timedUnlocked(caseId: string): boolean {
    return (this.profile.completed[caseId]?.endings.length ?? 0) > 0;
  }

  summarize(state: SaveState): SaveSlotSummary | null {
    const entry = this.findCase(state.caseId);
    return entry ? summarize(state, entry.content) : null;
  }

  async #safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      console.warn(err);
      return fallback;
    }
  }
}

function fallbackSummary(s: SaveState): SaveSlotSummary {
  return {
    slot: s.slot,
    caseTitle: s.caseId,
    updatedAt: s.updatedAt,
    elapsedMs: s.elapsedMs,
    mode: s.mode,
    progress: 0,
  };
}

function guessCaseId(raw: unknown): string | null {
  let v = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (v && typeof v === 'object' && 'caseId' in v && typeof v.caseId === 'string') return v.caseId;
  return null;
}
