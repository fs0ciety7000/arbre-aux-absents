/**
 * Mise à jour du jeu installé (D18, ARCHITECTURE §4) : logique pure, sans import Tauri.
 *
 * - **Desktop** (Windows NSIS, macOS, AppImage) : `@tauri-apps/plugin-updater` lit
 *   `latest.json` de la dernière release GitHub (côté Rust, signature minisign vérifiée),
 *   télécharge, installe puis relance (`update-tauri.ts`).
 * - **Linux .deb/.rpm, Windows .msi** : pas d'installation depuis le jeu (paquets système) ; le jeu
 *   propose la page itch.io.
 * - **Android** : pas de mise à jour silencieuse hors Play Store. Le WebView ne peut pas lire
 *   `latest.json` (github.com n'envoie pas d'en-têtes CORS) : le jeu lit l'API GitHub de la
 *   dernière release (CORS ouvert) et propose l'APK signé qui y est joint, ouvert dans le navigateur.
 * - **Web** (itch.io HTML5) : rien, la page est toujours à jour.
 *
 * Les notes viennent de `content/changelog.json` (`scripts/release-notes.mjs`) : une section par
 * langue, balisée `<!-- fr -->` / `<!-- en -->` (commentaires invisibles sur la page GitHub).
 */
import type { Locale } from '@arbre/contract';

/** Dépôt public qui porte les releases (binaires, `latest.json`, APK). */
export const UPDATE_REPO = 'fs0ciety7000/arbre-aux-absents';
/** Dernière release publiée (API GitHub, CORS ouvert) : lue sur Android. */
export const LATEST_RELEASE_API = `https://api.github.com/repos/${UPDATE_REPO}/releases/latest`;
/** Préfixe des fichiers d'une release (APK Android). */
export const RELEASE_DOWNLOAD_PREFIX = `https://github.com/${UPDATE_REPO}/releases/download/`;
/** Page du jeu sur itch.io : repli quand l'installation depuis le jeu n'est pas possible. */
export const ITCH_PAGE = 'https://cardorinteractive.itch.io/arbre-aux-absents';
/** Délai d'une vérification (réseau lent ou hors ligne : abandon silencieux). */
export const UPDATE_CHECK_TIMEOUT_MS = 15_000;
/** Longueur maximale des notes affichées (le reste est coupé). */
export const MAX_NOTES_CHARS = 2000;

/**
 * Nouvelle version trouvée.
 * - `install` : téléchargement, installation et relance depuis le jeu (desktop) ;
 * - `download` : lien ouvert dans le navigateur (`url` : APK de la release ou page itch.io).
 */
export interface UpdateOffer {
  version: string;
  /** Notes brutes (deux langues balisées, ou texte simple) ; `null` si absentes. */
  notes: string | null;
  action: 'install' | 'download';
  url: string | null;
}

/** Avancement du téléchargement (octets) ; `total` inconnu si le serveur ne l'annonce pas. */
export interface UpdateProgress {
  downloaded: number;
  total: number | null;
}

/** Source de mise à jour de la plateforme (absente sur le web). */
export interface UpdateSource {
  /** Nouvelle version, ou `null` (à jour). Lève si la vérification échoue (réseau, manifeste). */
  check(): Promise<UpdateOffer | null>;
  /** `install` : télécharge, installe, relance. Ne revient pas en cas de succès sous Windows. */
  install(onProgress: (p: UpdateProgress) => void): Promise<void>;
  /** `download` : ouvre `offer.url` dans le navigateur ; false si refusé. */
  openDownload(offer: UpdateOffer): Promise<boolean>;
}

// ---------------------------------------------------------------------------------------------
// Versions

interface ParsedVersion {
  core: [number, number, number];
  pre: string[];
}

const SEMVER =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/;

/** Version semver (préfixe `v` toléré), ou `null` si illisible. */
export function parseVersion(v: unknown): ParsedVersion | null {
  if (typeof v !== 'string' || v.length > 64) return null;
  const m = SEMVER.exec(v.trim());
  if (!m) return null;
  return {
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre: m[4] ? m[4].split('.') : [],
  };
}

function comparePre(a: string[], b: string[]): number {
  // Sans pré-version > avec pré-version (1.0.0 > 1.0.0-rc.1).
  if (a.length === 0 || b.length === 0) return b.length - a.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = Number(x) - Number(y);
      if (d !== 0) return Math.sign(d);
    } else if (nx !== ny) {
      return nx ? -1 : 1;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** -1, 0 ou 1 selon semver ; `null` si l'une des deux est illisible. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    const d = pa.core[i]! - pb.core[i]!;
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  const p = comparePre(pa.pre, pb.pre);
  return p === 0 ? 0 : p > 0 ? 1 : -1;
}

/** Vrai seulement si `candidate` est une version lisible strictement plus récente. */
export function isNewer(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) === 1;
}

/** Version affichable (`v1.4.0` → `1.4.0`). */
export function displayVersion(v: string): string {
  return v.trim().replace(/^v/, '');
}

// ---------------------------------------------------------------------------------------------
// Notes

const SECTION = /<!--\s*(fr|en)\s*-->/g;

/**
 * Notes dans la langue demandée : la section balisée `<!-- fr -->` / `<!-- en -->` si elle existe,
 * sinon l'autre langue, sinon le texte entier (commentaires HTML retirés). Texte brut, coupé à
 * `MAX_NOTES_CHARS` ; `null` si vide.
 */
export function notesFor(body: string | null | undefined, lang: Locale): string | null {
  if (typeof body !== 'string') return null;
  const sections = new Map<string, string>();
  const marks = [...body.matchAll(SECTION)];
  for (let i = 0; i < marks.length; i++) {
    const mark = marks[i]!;
    const start = mark.index + mark[0].length;
    const end = marks[i + 1]?.index ?? body.length;
    sections.set(mark[1]!, body.slice(start, end));
  }
  const other: Locale = lang === 'fr' ? 'en' : 'fr';
  const raw = sections.get(lang) ?? sections.get(other) ?? body;
  const text = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text === '') return null;
  return text.length > MAX_NOTES_CHARS ? `${text.slice(0, MAX_NOTES_CHARS - 1).trimEnd()}…` : text;
}

// ---------------------------------------------------------------------------------------------
// URLs et release GitHub (Android)

/** URL qu'une offre `download` peut ouvrir : APK d'une release du dépôt, ou la page itch.io. */
export function isUpdateDownloadUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length > 2048) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:' || u.username !== '' || u.password !== '' || u.port !== '') {
    return false;
  }
  if (u.href === ITCH_PAGE || u.href.startsWith(`${ITCH_PAGE}/`)) return true;
  return (
    u.href.startsWith(RELEASE_DOWNLOAD_PREFIX) &&
    !u.pathname.includes('..') &&
    u.pathname.toLowerCase().endsWith('.apk')
  );
}

/** Nom de l'APK signé joint à la release (`scripts/android-sign.sh`). */
export function signedApkName(version: string): string {
  return `arbre-aux-absents-${displayVersion(version)}.apk`;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Réponse de `GET /repos/…/releases/latest` → offre Android, ou `null` (à jour, brouillon,
 * pré-version, réponse illisible). L'APK signé de la release est proposé ; s'il manque, la page
 * itch.io.
 */
export function offerFromGithubRelease(json: unknown, current: string): UpdateOffer | null {
  if (!isRecord(json)) return null;
  if (json.draft === true || json.prerelease === true) return null;
  const tag = json.tag_name;
  if (typeof tag !== 'string' || parseVersion(tag) === null) return null;
  if (!isNewer(tag, current)) return null;
  const version = displayVersion(tag);
  const wanted = signedApkName(version);
  let url: string | null = null;
  if (Array.isArray(json.assets)) {
    for (const a of json.assets) {
      if (!isRecord(a) || a.name !== wanted) continue;
      if (isUpdateDownloadUrl(a.browser_download_url)) url = a.browser_download_url;
      break;
    }
  }
  return {
    version,
    notes: typeof json.body === 'string' ? json.body : null,
    action: 'download',
    url: url ?? ITCH_PAGE,
  };
}

/**
 * Paquets que le jeu sait mettre à jour lui-même (`getBundleType()` de `@tauri-apps/api/app`) :
 * l'installeur NSIS (celui d'itch.io), l'app macOS (dmg) et l'AppImage. Les paquets système
 * (deb, rpm) et le MSI renvoient vers itch.io.
 */
export const SELF_UPDATING_BUNDLES: readonly string[] = Object.freeze(['nsis', 'app', 'appimage']);

export function canSelfUpdate(bundle: string | null | undefined): boolean {
  return typeof bundle === 'string' && SELF_UPDATING_BUNDLES.includes(bundle);
}
