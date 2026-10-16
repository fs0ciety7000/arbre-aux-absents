import type {
  AchievementId,
  CaseAchievements,
  CompiledCase,
  EndingId,
  GameMode,
  LanguageSetting,
  Locale,
  ParseSaveErrorCode,
  Profile,
  ReportCategory,
  ReportRef,
  SaveSlotId,
  SaveSlotSummary,
  SaveState,
  Settings,
} from '@arbre/contract';
import {
  DEFAULT_LOCALE,
  defaultProfile,
  defaultSettings,
  hintPreset,
  ProfileSchema,
  REPORT_REF_LIMITS,
} from '@arbre/contract';
import { claimedFields, newGame, parseSave, summarize, visibleSlots } from '@arbre/engine';
import { pushToast } from '@arbre/ui';
import type { Component } from 'svelte';
import { version as APP_VERSION } from '../../../package.json';
import { audio } from '../../audio/engine';
import {
  PlatformError,
  type GamePlatform,
  type GameSaveStore,
  type GameSlotSummary,
} from '../../platform/index';
import {
  applyMessages,
  ensureMessages,
  loadMessages,
  messages,
  uiLang,
  type Messages,
} from '../../i18n/index.svelte';
import { navigatorLocales, resolveUiLanguage } from '../../i18n/resolve';
import { announcer } from './announcer.svelte';
import { loadAchievements, loadCase, loadCatalog, loadedCase, type CaseEntry } from './cases';
import { loadPlatform } from './platform-loader';
import { applySettings } from './settings-dom';
import { GameStoreImpl, type StoreHost } from './store.svelte';
import { loadUpdateSource, UpdateState } from './update.svelte';
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

/** Ouverture de « Signaler un problème » ; `error` : depuis l'écran d'erreur. */
export interface ReportRequest {
  error?: { code: string; message: string };
}

export interface ReportDraft {
  category: ReportCategory;
  description: string;
  contact: string;
}

export type LoadResult = { ok: true } | { ok: false; error: string; corrupt: boolean };

/** Chargement de l'index d'affaires des écrans hors partie (module à part, à la demande). */
export type ContentStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Écrans hors partie qui lisent l'index d'affaires (jamais une affaire entière). */
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
  /** Index d'affaires (titres, fins ; sans les succès) dans la langue du contenu. */
  cases = $state.raw<CaseEntry[]>([]);
  /** Langue du texte des affaires : celle de l'interface si elle est compilée, sinon la source. */
  contentLocale = $state<Locale>(DEFAULT_LOCALE);
  /** Index d'affaires des écrans E04, Succès, Bonus, Crédits (`ensureScreenContent`). */
  contentStatus = $state<ContentStatus>('idle');
  /** Bureau (panneaux) : préchargé depuis E04, attendu en ouvrant une partie. */
  desk = $state.raw<DeskComponent | null>(null);
  game = $state.raw<GameStoreImpl | null>(null);
  /** Emplacements manuels, puis un secours par affaire (AFFAIRE-2 §2.3). */
  saves = $state.raw<GameSlotSummary[]>([]);
  ready = $state(false);
  /** Signaler un problème (DESIGN §13.8) : ouvert, avec le contexte d'une erreur éventuelle. */
  reportRequest = $state.raw<ReportRequest | null>(null);
  /** Brouillon d'un signalement fermé sans envoi (session seulement, jamais enregistré). */
  reportDraft: ReportDraft | null = null;
  /** « Mes signalements » (DESIGN §13.9) ouvert. */
  myReportsOpen = $state(false);
  saveError = $state(false);
  fatal = $state<FatalError | null>(null);
  ending = $state<EndingId | null>(null);
  /** Mise à jour du jeu installé (D18) : invite sur l'écran titre, vérification dans Options. */
  readonly updates = new UpdateState();

  #platform = $state.raw<GamePlatform | null>(null);
  #profileTimer: ReturnType<typeof setTimeout> | undefined;
  #backUnsub: (() => void) | null = null;
  #contentLoad: Promise<boolean> | null = null;
  #deskLoad: Promise<boolean> | null = null;
  #catalogLoad: Promise<boolean> | null = null;
  #catalogReady = false;
  /** Dernière bascule de langue demandée (les précédentes, plus lentes, sont ignorées). */
  #langSeq = 0;

  get platform(): GamePlatform | null {
    return this.#platform;
  }

  /** Avertissement de stockage de la plateforme (mode secours, iframe itch…), langue courante. */
  get storageWarning(): string | null {
    return this.#platform?.storageWarning ?? null;
  }

  get settings(): Settings {
    return this.profile.settings;
  }

  /** Langue de l'interface (réactive). */
  get lang(): Locale {
    return uiLang();
  }

  /** Réglage de langue du profil (`system` par défaut, anciens profils compris). */
  get languageSetting(): LanguageSetting {
    return this.settings.language ?? 'system';
  }

  /** Langues du système (plateforme, sinon navigateur). */
  systemLocales(): readonly string[] {
    try {
      return this.#platform?.systemLocales?.() ?? navigatorLocales();
    } catch {
      return navigatorLocales();
    }
  }

  /** Langue résolue d'un réglage : profil, puis `?lang=`, puis langues du système (D6). */
  resolveLanguage(setting: LanguageSetting = this.languageSetting): Locale {
    return resolveUiLanguage(setting, this.systemLocales());
  }

  /** Le Bureau n'est pas visible (écran par-dessus, ou autre écran) : chrono arrêté. */
  get overlayOpen(): boolean {
    return this.overlay !== null || this.screen !== 'desk';
  }

  get saveStore(): GameSaveStore {
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
        const c = loadedCase(s.caseId);
        return c ? summarize(s, c) : fallbackSummary(s);
      });
      this.#platform = loaded.platform;
      const raw = await this.#safe(() => loaded.platform.saves.loadProfile(), null);
      const parsed = ProfileSchema.safeParse(raw);
      if (parsed.success) this.profile = parsed.data as Profile;
      applySettings(this.settings);
      this.#configureAudio();
      // Langue du profil avant l'écran titre (le démarrage a déjà appliqué `?lang=` / système).
      await this.applyLanguage(this.resolveLanguage());
      await this.refreshSaves();
      this.#backUnsub = loaded.platform.onBack(() => this.back());
      // Vérification silencieuse (jamais sur le web) ; n'attend pas : l'écran titre s'affiche.
      void this.updates.start(() => loadUpdateSource(loaded.platform.kind, this.version));
    } catch (err) {
      this.fail('INIT', messages.errors.caseLoad, err);
    }
    this.ready = true;
  }

  /**
   * Écrans hors partie (E04, Succès, Bonus, Crédits) : l'index d'affaires seul, petit fichier
   * (ARCHITECTURE §3.3), d'ordinaire déjà préchargé par l'écran titre. Renvoie false en cas
   * d'échec réseau (état `error`, nouvel essai possible).
   */
  ensureScreenContent(): Promise<boolean> {
    if (this.contentStatus === 'ready') return Promise.resolve(true);
    if (this.#contentLoad) return this.#contentLoad;
    this.contentStatus = 'loading';
    const run = this.ensureCatalog(true).then(
      (ok) => {
        // `false` : chargement d'arrière-plan (non strict) en cours au même moment, échoué.
        if (!ok) this.contentStatus = 'error';
        return ok;
      },
      (err: unknown) => {
        console.error('[catalogue]', err);
        this.contentStatus = 'error';
        return false;
      },
    );
    this.#contentLoad = run.finally(() => {
      this.#contentLoad = null;
    });
    return this.#contentLoad;
  }

  /**
   * Index d'affaires et Bureau (une fois) avant d'ouvrir une partie. Renvoie false en cas
   * d'échec réseau. L'affaire elle-même est chargée à part (`caseContent`).
   */
  async ensureContent(): Promise<boolean> {
    const [catalog, desk] = await Promise.all([this.ensureScreenContent(), this.#ensureDesk()]);
    return catalog && desk;
  }

  /** Préchargement du Bureau (E04) : il arrive pendant le choix, « Commencer » l'attend. */
  prefetchDesk(): void {
    void this.#ensureDesk();
  }

  /** Bureau et textes de ses panneaux (section différée du catalogue de messages), une fois. */
  #ensureDesk(): Promise<boolean> {
    if (this.desk) return Promise.resolve(true);
    if (this.#deskLoad) return this.#deskLoad;
    const run = Promise.all([import('../../shell/Desk.svelte'), ensureMessages('desk')]).then(
      ([desk]) => {
        this.desk = desk.default as DeskComponent;
        return true;
      },
      (err: unknown) => {
        console.error('[bureau]', err);
        return false;
      },
    );
    this.#deskLoad = run.finally(() => {
      this.#deskLoad = null;
    });
    return this.#deskLoad;
  }

  /**
   * Index d'affaires (titres des parties à l'écran titre et aux emplacements, chemises E04) :
   * petit fichier (≈ 0,6 Ko gz par affaire), préchargé en arrière-plan par l'écran titre ; prêt,
   * il ouvre les écrans hors partie (`contentStatus`). `strict` : l'échec est remonté (sinon
   * ignoré).
   */
  ensureCatalog(strict = false): Promise<boolean> {
    if (this.#catalogReady) return Promise.resolve(true);
    if (this.#catalogLoad) return this.#catalogLoad;
    const lang = this.lang;
    const run = loadCatalog(lang).then(
      (cat) => {
        this.cases = cat.cases;
        this.contentLocale = cat.locale;
        this.#catalogReady = true;
        this.contentStatus = 'ready';
        // La langue a changé pendant le chargement : on remet le catalogue à la page.
        if (this.lang !== lang) void this.applyLanguage(this.lang);
        return true;
      },
      (err: unknown) => {
        if (strict) throw err;
        console.warn('[catalogue]', err);
        return false;
      },
    );
    this.#catalogLoad = run.finally(() => {
      this.#catalogLoad = null;
    });
    return this.#catalogLoad;
  }

  /**
   * Succès d'une affaire (écran Succès) dans la langue courante : ceux de la partie ouverte,
   * sinon un petit fichier par affaire, sans charger l'affaire. Rejette si le réseau échoue.
   */
  achievementsOf(id: string): Promise<CaseAchievements> {
    const g = this.game?.content;
    if (g && g.id === id) return Promise.resolve(g.achievements);
    return loadAchievements(this.lang, id);
  }

  /** Affaire compilée dans la langue courante (ou la source), ou `null` si le chargement échoue. */
  async caseContent(id: string): Promise<CompiledCase | null> {
    try {
      return await loadCase(this.lang, id);
    } catch (err) {
      console.error('[affaire]', id, err);
      return null;
    }
  }

  // ── Langue ─────────────────────────────────────────────────────────

  /** Choix du joueur (écran titre, Options) : écrit dans le profil, puis bascule. */
  async setLanguage(setting: LanguageSetting): Promise<void> {
    if (setting !== this.languageSetting) this.updateSettings({ language: setting });
    await this.applyLanguage(this.resolveLanguage(setting));
  }

  /**
   * Bascule de langue : catalogue de l'interface (anglais chargé à la demande), catalogue
   * d'affaires et affaire en cours dans la nouvelle langue, puis tout est appliqué d'un coup.
   * La partie (`SaveState`) n'est pas touchée : seul `content` est remplacé. Un échec de
   * chargement laisse la langue précédente (ou le texte précédent des affaires).
   */
  async applyLanguage(lang: Locale): Promise<void> {
    const seq = ++this.#langSeq;
    const game = this.game;
    let ui: Messages;
    try {
      ui = await loadMessages(lang);
    } catch (err) {
      console.warn('[langue]', lang, err);
      return;
    }
    // Un catalogue d'affaires en cours de chargement (ancienne langue) est attendu d'abord.
    if (this.#catalogLoad) await this.#catalogLoad.catch(() => false);
    const [cat, content] = await Promise.all([
      this.#catalogReady ? loadCatalog(lang).catch(() => null) : null,
      game ? loadCase(lang, game.content.id).catch(() => null) : null,
    ]);
    if (seq !== this.#langSeq) return;
    applyMessages(lang, ui);
    if (cat) {
      this.cases = cat.cases;
      this.contentLocale = cat.locale;
    }
    if (game && content && this.game === game) game.replaceContent(content);
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

  /**
   * Titre d'affaire d'une partie sauvegardée, dans la langue courante : le résumé garde le titre
   * de la langue où il a été écrit ; l'association se fait par `caseId`, jamais par titre.
   */
  caseTitleOf(s: Pick<SaveSlotSummary, 'caseId' | 'caseTitle'>): string {
    const id = s.caseId;
    return (id ? this.findCase(id)?.content.meta.title : undefined) ?? s.caseTitle;
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
        // Rapport final : une note de service ouverte se range d'abord (tutoriel).
        if (this.ending === null && !this.game?.backIntercept?.()) this.leaveReport();
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

  // ── Signalements ───────────────────────────────────────────────────

  /** Ouvre « Signaler un problème » (écran titre, pause, aide, écran d'erreur). */
  openReport(request: ReportRequest = {}): void {
    this.reportRequest = request;
  }

  closeReport(): void {
    this.reportRequest = null;
  }

  openMyReports(): void {
    this.myReportsOpen = true;
  }

  closeMyReports(): void {
    this.myReportsOpen = false;
  }

  /** Signalements envoyés depuis cet appareil (les plus récents d'abord). */
  get reports(): ReportRef[] {
    return this.profile.reports ?? [];
  }

  /** Remplace la liste des signalements du profil (≤ 20) et l'enregistre aussitôt. */
  setReports(reports: ReportRef[]): void {
    this.profile = { ...this.profile, reports: reports.slice(0, REPORT_REF_LIMITS.max) };
    void this.saveProfile();
  }

  // ── Nouveautés (ARCHITECTURE §3.8) ─────────────────────────────────

  /** Version du jeu (apps/game/package.json), égale à la dernière entrée du journal. */
  readonly version: string = APP_VERSION;

  /**
   * Marque « Nouveau » du menu titre : les notes de cette version n'ont pas encore été ouvertes,
   * par un joueur qui a déjà joué (une toute première visite n'a rien de « nouveau »).
   */
  get changelogUnseen(): boolean {
    const p = this.profile;
    if (p.changelogSeen === this.version) return false;
    return (
      p.changelogSeen !== undefined ||
      p.tutorial !== undefined ||
      Object.keys(p.completed).length > 0 ||
      this.saves.length > 0
    );
  }

  /** L'écran Nouveautés a été ouvert : la marque disparaît jusqu'à la prochaine version. */
  markChangelogSeen(): void {
    if (this.profile.changelogSeen === this.version) return;
    this.profile = { ...this.profile, changelogSeen: this.version };
    void this.saveProfile();
  }

  // ── Emplacements ───────────────────────────────────────────────────

  async refreshSaves(): Promise<void> {
    if (!this.#platform) return;
    const list = await this.#safe(() => this.#platform!.saves.list(), [] as GameSlotSummary[]);
    this.saves = [...list].sort(
      (a, b) =>
        SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) ||
        (a.caseId ?? '').localeCompare(b.caseId ?? ''),
    );
  }

  /** Dernier emplacement joué (bouton Continuer). */
  get lastSave(): GameSlotSummary | null {
    let best: GameSlotSummary | null = null;
    for (const s of this.saves) if (!best || s.updatedAt > best.updatedAt) best = s;
    return best;
  }

  /** `caseId` : secours de cette affaire (`slot === 'auto'`). */
  async removeSlot(slot: SaveSlotId, caseId?: string): Promise<void> {
    await this.saveStore.remove(slot, caseId);
    await this.refreshSaves();
  }

  async exportSlot(slot: SaveSlotId, caseId?: string): Promise<void> {
    await this.saveStore.exportFile(slot, caseId);
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
    const content = await this.caseContent(entry.content.id);
    if (!content) return { ok: false, error: messages.errors.contentLoad };
    const res = parseSave(raw, content);
    if (!res.ok) {
      return {
        ok: false,
        error: res.code === 'newerVersion' ? messages.slots.newer : messages.slots.importInvalid,
      };
    }
    await this.saveStore.save(slot, { ...res.state, slot });
    await this.refreshSaves();
    return { ok: true };
  }

  // ── Parties ────────────────────────────────────────────────────────

  /** Renvoie false si l'affaire n'a pas pu être chargée (réseau). */
  async startNewGame(req: NewGameRequest): Promise<boolean> {
    if (!(await this.ensureContent())) return false;
    if (!this.findCase(req.caseId)) return false;
    const content = await this.caseContent(req.caseId);
    if (!content) return false;
    if (req.mode !== 'timed') this.updateSettings({ hints: hintPreset(req.hintPreset) });
    const state = newGame(content, { slot: req.slot, mode: req.mode, at: Date.now() });
    this.#openGame(content, state, { skipTutorial: req.skipTutorial, fresh: true });
    return true;
  }

  /** `caseId` : secours de cette affaire (`slot === 'auto'`) ; sinon le plus récent. */
  async loadSlot(slot: SaveSlotId, caseId?: string): Promise<LoadResult> {
    if (!(await this.ensureContent())) {
      return { ok: false, error: messages.errors.contentLoad, corrupt: false };
    }
    let raw: unknown;
    try {
      raw = await this.saveStore.load(slot, caseId);
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
    const content = await this.caseContent(entry.content.id);
    if (!content) return { ok: false, error: messages.errors.contentLoad, corrupt: false };
    const res = parseSave(raw, content);
    if (!res.ok) return { ok: false, ...parseFailure(res.code) };
    this.#openGame(content, res.state, { skipTutorial: true, fresh: false });
    return { ok: true };
  }

  async continueLast(): Promise<LoadResult> {
    const last = this.lastSave;
    if (!last) return { ok: false, error: messages.slots.none, corrupt: false };
    return this.loadSlot(last.slot, last.caseId ?? undefined);
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
    // Case revendiquée (AFFAIRE-2 §1.8) : le lecteur d'écran apprend d'emblée qu'une identité
    // de l'arbre est déclarée, pas établie.
    const claimed = visibleSlots(state, c).filter((id) => claimedFields(id, state, c).length > 0);
    if (claimed.length > 0) announcer.say(messages.announce.claimOnOpen(claimed.length));
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
    const c = this.game?.content.id === state.caseId ? this.game.content : loadedCase(state.caseId);
    return c ? summarize(state, c) : null;
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

/** Message d'un échec de `parseSave` selon son code (jamais selon le texte technique). */
export function parseFailure(code: ParseSaveErrorCode): { error: string; corrupt: boolean } {
  if (code === 'newerVersion') return { error: messages.slots.newer, corrupt: false };
  if (code === 'otherCase') return { error: messages.slots.unknownCase, corrupt: false };
  return { error: messages.slots.corrupt, corrupt: true };
}

function fallbackSummary(s: SaveState): SaveSlotSummary {
  return {
    slot: s.slot,
    caseId: s.caseId,
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
