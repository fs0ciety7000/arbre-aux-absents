/**
 * Outils partagés par les adaptateurs de plateforme (web, Tauri, mémoire).
 * Aucun import Tauri ici : ce module fait partie du bundle web.
 */
import {
  GAME_MODES,
  IdSchema,
  MsSchema,
  SAVE_SLOT_IDS,
  SaveSlotIdSchema,
  SaveStateSchema,
  type Platform,
  type SaveSlotId,
  type SaveSlotSummary,
  type SaveState,
  type SaveStore,
} from '@arbre/contract';
import { z } from 'zod';

/** Taille maximale d'un fichier importé (octets), alignée sur `MAX_SAVE_CHARS` du moteur. */
export const MAX_IMPORT_BYTES = 2_000_000;

/** Préfixe des fichiers exportés et des clés de stockage. */
export const STORAGE_PREFIX = 'arbre-aux-absents';

export type PlatformErrorCode =
  /** Aucune sauvegarde dans l'emplacement demandé. */
  | 'not-found'
  /** Fichier importé trop volumineux. */
  | 'too-large'
  /** Fichier importé illisible (lecture impossible). */
  | 'unreadable'
  /** Écriture ou lecture du stockage impossible (quota, droits, disque). */
  | 'storage';

/** Erreur typée de la plateforme ; `message` est en français, affichable tel quel. */
export class PlatformError extends Error {
  readonly code: PlatformErrorCode;
  constructor(code: PlatformErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PlatformError';
    this.code = code;
  }
}

/**
 * Résumé renvoyé par `list()` : le contrat, avec l'affaire toujours renseignée quand elle est
 * lisible. Le secours automatique (`'auto'`) existe **une fois par affaire** (AFFAIRE-2 §2.3) :
 * `list()` peut donc renvoyer plusieurs résumés `slot: 'auto'`, distingués par `caseId`. Pour
 * les emplacements manuels, `caseId` vient du résumé stocké, sinon de la sauvegarde elle-même ;
 * `null` seulement si ni l'un ni l'autre ne le donne (l'UI associe par id, jamais par titre).
 */
export interface GameSlotSummary extends SaveSlotSummary {
  caseId: string | null;
}

/**
 * `SaveStore` du jeu : compatible avec le contrat, plus le secours par affaire.
 * - `save('auto', s)` écrit le secours de `s.caseId` (jamais celui d'une autre affaire) ;
 * - `load` / `remove` / `exportFile` sur `'auto'` visent le secours de `caseId`, ou, sans
 *   `caseId`, le secours le plus récent (toutes affaires) ;
 * - l'ancien secours commun (avant l'affaire 2) est rangé sous sa propre affaire au premier accès.
 * Les emplacements manuels 1 à 3 restent communs à toutes les affaires.
 */
export interface GameSaveStore extends SaveStore {
  list(): Promise<GameSlotSummary[]>;
  load(slot: SaveSlotId, caseId?: string): Promise<unknown | null>;
  remove(slot: SaveSlotId, caseId?: string): Promise<void>;
  exportFile(slot: SaveSlotId, caseId?: string): Promise<void>;
}

/** Plateforme du jeu : le contrat + l'avertissement de stockage (mode secours). */
export interface GamePlatform extends Platform {
  readonly saves: GameSaveStore;
  /** Non nul quand les parties risquent de ne pas survivre à la fermeture (texte UI, français). */
  readonly storageWarning: string | null;
}

/** Entrées/sorties de fichiers déléguées au shell (téléchargement web, dialogues Tauri). */
export interface FileIo {
  /** Propose le texte à l'utilisateur sous ce nom de fichier. */
  exportText(fileName: string, text: string): Promise<void>;
  /** Demande un fichier ; renvoie son texte ou `null` si l'utilisateur annule. */
  importText(): Promise<string | null>;
}

/** Calcule le résumé d'une partie (l'app injecte `summarize` du moteur avec l'affaire compilée). */
export type Summarizer = (s: SaveState) => SaveSlotSummary;

/** Résumé de repli quand l'affaire n'est pas connue de la plateforme. */
export const fallbackSummarize: Summarizer = (s) => ({
  slot: s.slot,
  caseId: s.caseId,
  caseTitle: s.caseId,
  updatedAt: s.updatedAt,
  elapsedMs: s.elapsedMs,
  mode: s.mode,
  progress: s.ending === null ? 0 : 1,
});

/** Les résumés stockés sont des données externes : on les valide avant de les renvoyer. */
export const SaveSlotSummarySchema = z.strictObject({
  slot: SaveSlotIdSchema,
  /** Absent des résumés écrits avant l'i18n : la plateforme le relit alors dans la partie. */
  caseId: IdSchema.max(64).nullable().optional(),
  caseTitle: z.string().max(200),
  updatedAt: MsSchema,
  elapsedMs: MsSchema,
  mode: z.enum(GAME_MODES),
  progress: z.number().min(0).max(1),
});

export function isSaveSlotId(v: unknown): v is SaveSlotId {
  return typeof v === 'string' && (SAVE_SLOT_IDS as readonly string[]).includes(v);
}

/** Refuse tout identifiant d'emplacement hors liste (pas de chemin arbitraire). */
export function assertSlot(slot: SaveSlotId): void {
  if (!isSaveSlotId(slot))
    throw new PlatformError('not-found', 'Emplacement de sauvegarde inconnu.');
}

/** Identifiant d'affaire sûr pour une clé ou un nom de fichier (kebab-case, comme `IdSchema`). */
export function isCaseId(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 64 && IdSchema.safeParse(v).success;
}

/** Refuse un identifiant d'affaire hors format (pas de chemin ni de clé arbitraire). */
export function assertCaseId(caseId: string): void {
  if (!isCaseId(caseId)) throw new PlatformError('not-found', 'Affaire de sauvegarde inconnue.');
}

/** Affaire d'une partie stockée (texte JSON), ou `null` si illisible. */
export function caseIdOfRaw(raw: string): string | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === 'object' && 'caseId' in v && isCaseId(v.caseId)) return v.caseId;
  } catch {
    /* illisible */
  }
  return null;
}

/**
 * Résumé à écrire à côté de la partie : celui du `Summarizer`, avec l'affaire de la partie
 * (même si le `Summarizer` injecté ne la renseigne pas).
 */
export function summaryToStore(s: SaveState, summarize: Summarizer): SaveSlotSummary {
  return { ...summarize(s), caseId: s.caseId };
}

/** Affaire d'un résumé stocké, si elle y figure et est sûre. */
export function caseIdOfSummary(sum: SaveSlotSummary): string | null {
  return isCaseId(sum.caseId) ? sum.caseId : null;
}

/** Résumé contrat → résumé du jeu (emplacement manuel, ou secours de `caseId`). */
export function withCase(sum: SaveSlotSummary, caseId: string | null): GameSlotSummary {
  return { ...sum, caseId };
}

/** Secours le plus récent parmi des résumés (load/remove/export de `'auto'` sans affaire). */
export function latestBackup(list: readonly GameSlotSummary[]): string | null {
  let best: GameSlotSummary | null = null;
  for (const s of list) {
    if (s.slot === 'auto' && s.caseId !== null && (!best || s.updatedAt > best.updatedAt)) best = s;
  }
  return best?.caseId ?? null;
}

/** Résumé stocké → résumé validé, ou `null`. */
export function readSummary(raw: string | null, slot: SaveSlotId): SaveSlotSummary | null {
  if (raw === null) return null;
  try {
    const r = SaveSlotSummarySchema.safeParse(JSON.parse(raw));
    return r.success && r.data.slot === slot ? r.data : null;
  } catch {
    return null;
  }
}

/**
 * Résumé de secours quand le résumé stocké manque ou est invalide : seulement si la sauvegarde
 * complète est déjà conforme au schéma (sinon l'emplacement est ignoré par `list`).
 */
export function summaryFromRaw(
  raw: string,
  slot: SaveSlotId,
  summarize: Summarizer,
): SaveSlotSummary | null {
  try {
    const r = SaveStateSchema.safeParse(JSON.parse(raw));
    if (!r.success || r.data.slot !== slot) return null;
    const s = SaveSlotSummarySchema.safeParse(summarize(r.data as SaveState));
    return s.success ? s.data : null;
  } catch {
    return null;
  }
}

/** Sérialise une partie (supprime les proxys Svelte, non clonables). */
export function serialize(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Texte stocké → valeur brute pour `parseSave` : l'objet si le JSON est lisible, sinon le texte
 * tel quel (le moteur renverra une erreur propre).
 */
export function decodeStored(text: string | null): unknown | null {
  if (text === null) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Vrai si le texte est un JSON lisible (critère de corruption côté stockage). */
export function isReadableJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** Texte importé → valeur brute, après contrôle de taille. */
export function decodeImported(text: string): unknown {
  if (byteLength(text) > MAX_IMPORT_BYTES) throw tooLarge();
  return decodeStored(text);
}

export function tooLarge(): PlatformError {
  return new PlatformError('too-large', 'Fichier trop volumineux (2 Mo au plus).');
}

export function notFound(): PlatformError {
  return new PlatformError('not-found', 'Aucune sauvegarde dans cet emplacement.');
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * `arbre-aux-absents-<slot>-<AAAA-MM-JJ>.json` (date locale) ; le secours d'une affaire donne
 * `arbre-aux-absents-auto-<affaire>-<AAAA-MM-JJ>.json`.
 */
export function exportFileName(
  slot: SaveSlotId,
  now: Date = new Date(),
  caseId: string | null = null,
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const name = slot === 'auto' && caseId !== null ? `auto-${caseId}` : slot;
  return `${STORAGE_PREFIX}-${name}-${date}.json`;
}

/**
 * Pile de gestionnaires « retour » : le dernier inscrit est appelé en premier ; on s'arrête au
 * premier qui renvoie `true`. Les sources (Échap, popstate, bouton Android) appellent `dispatch`.
 */
export class BackRegistry {
  #handlers: Array<() => boolean> = [];
  #onChange: (count: number) => void;

  constructor(onChange: (count: number) => void = () => {}) {
    this.#onChange = onChange;
  }

  get size(): number {
    return this.#handlers.length;
  }

  add(cb: () => boolean): () => void {
    const entry = () => cb();
    this.#handlers.push(entry);
    this.#onChange(this.#handlers.length);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const i = this.#handlers.lastIndexOf(entry);
      if (i >= 0) this.#handlers.splice(i, 1);
      this.#onChange(this.#handlers.length);
    };
  }

  /** Renvoie true si un gestionnaire a consommé l'événement. */
  dispatch(): boolean {
    for (let i = this.#handlers.length - 1; i >= 0; i--) {
      const h = this.#handlers[i];
      try {
        if (h?.()) return true;
      } catch (err) {
        console.error('[platform] gestionnaire retour en échec', err);
      }
    }
    return false;
  }
}

/** Branche la touche Échap sur un `BackRegistry` ; renvoie la fonction de débranchement. */
export function listenEscape(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  registry: BackRegistry,
): () => void {
  const onKey = (e: Event) => {
    const k = e as KeyboardEvent;
    if (k.key !== 'Escape' || k.defaultPrevented || k.isComposing) return;
    if (registry.dispatch()) k.preventDefault();
  };
  target.addEventListener('keydown', onKey);
  return () => target.removeEventListener('keydown', onKey);
}

/** Promesse avec délai : rejette avec `PlatformError('storage')` au-delà de `ms`. */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () =>
        reject(new PlatformError('storage', `Stockage indisponible (${what} : délai dépassé).`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// ---------------------------------------------------------------------------------------------
// Langues du système et liens externes

/** Nombre maximal d'étiquettes de langue retenues (le reste n'influence jamais le choix). */
const MAX_SYSTEM_LOCALES = 16;
/** Étiquette BCP 47 plausible (`fr`, `fr-BE`, `zh-Hant-TW`, `en_GB` sous certains WebViews). */
const LANGUAGE_TAG = /^[A-Za-z]{2,8}(?:[-_][A-Za-z0-9]{1,8})*$/;

/** Navigateur minimal lu pour les langues (injectable en test). */
export interface LanguageSource {
  readonly languages?: readonly string[] | null;
  readonly language?: string | null;
}

/**
 * Langues préférées, dans l'ordre (`navigator.languages`, sinon `navigator.language`), filtrées
 * (étiquettes valides, sans doublon, 16 au plus). Jamais d'exception ; `[]` si rien n'est lisible
 * (`resolveLanguage` retombe alors sur le français).
 */
export function readSystemLocales(source: LanguageSource | null | undefined): readonly string[] {
  if (!source) return [];
  let list: readonly unknown[] = [];
  try {
    const langs = source.languages;
    if (Array.isArray(langs) && langs.length > 0) list = langs;
    else if (typeof source.language === 'string') list = [source.language];
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const tag of list) {
    if (typeof tag !== 'string') continue;
    const t = tag.trim();
    if (!LANGUAGE_TAG.test(t) || out.includes(t)) continue;
    out.push(t);
    if (out.length >= MAX_SYSTEM_LOCALES) break;
  }
  return Object.freeze(out);
}

/** `navigator` global s'il existe (absent sous Node). */
export function globalNavigator(): LanguageSource | undefined {
  try {
    return typeof navigator === 'undefined' ? undefined : navigator;
  } catch {
    return undefined;
  }
}

/**
 * Seules origines ouvrables par `openExternal` (D11) : le site (suivi des signalements) et la page
 * itch.io (forum). Même liste que la capability `opener:allow-open-url` de Tauri.
 */
export const EXTERNAL_ORIGINS: readonly string[] = Object.freeze([
  'https://arbre.cardormedia.com',
  'https://cardorinteractive.itch.io',
]);

/** Longueur maximale d'une URL externe acceptée. */
export const MAX_EXTERNAL_URL = 2048;

/**
 * URL normalisée si elle est autorisée (https, origine de la liste, sans identifiants ni port),
 * sinon `null`. Pas de proxy ouvert : aucune autre URL ne quitte le jeu.
 */
export function allowedExternalUrl(
  url: string,
  origins: readonly string[] = EXTERNAL_ORIGINS,
): string | null {
  if (typeof url !== 'string' || url.length === 0 || url.length > MAX_EXTERNAL_URL) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username !== '' || u.password !== '' || u.port !== '') {
    return null;
  }
  return origins.includes(u.origin) ? u.href : null;
}

/** Fenêtre minimale pour ouvrir un lien (injectable en test). */
export interface WindowOpener {
  open(url: string, target: string, features: string): unknown;
}

/**
 * `openExternal` du web : URL autorisée seulement, nouvel onglet sans `opener` (le jeu n'est
 * jamais accessible à la page ouverte). Avec `noopener`, `window.open` renvoie toujours `null` :
 * un blocage par le navigateur (bloqueur de fenêtres, iframe sans `allow-popups`) n'est donc pas
 * détectable ; on renvoie true dès que l'appel a eu lieu, false si l'URL est refusée ou s'il lève.
 */
export function webOpenExternal(win: WindowOpener | undefined): (url: string) => Promise<boolean> {
  return async (url) => {
    const href = allowedExternalUrl(url);
    if (href === null || !win) return false;
    try {
      win.open(href, '_blank', 'noopener,noreferrer');
      return true;
    } catch (err) {
      console.warn('[platform] ouverture du lien impossible', err);
      return false;
    }
  };
}
