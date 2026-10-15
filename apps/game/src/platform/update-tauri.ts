/**
 * Source de mise à jour sous Tauri (D18). Chargée seulement par `import()` quand
 * `VITE_TARGET === 'tauri'` : ni ce module ni les plugins n'entrent dans le bundle web.
 *
 * - desktop : `plugin-updater` (`check`, `downloadAndInstall`) puis `plugin-process` (`relaunch`) ;
 *   paquets non auto-installables (deb, rpm, msi) : même vérification, lien vers itch.io ;
 * - android : API GitHub de la dernière release, APK signé ouvert dans le navigateur.
 */
import {
  ITCH_PAGE,
  LATEST_RELEASE_API,
  UPDATE_CHECK_TIMEOUT_MS,
  canSelfUpdate,
  displayVersion,
  isNewer,
  isUpdateDownloadUrl,
  offerFromGithubRelease,
  type UpdateOffer,
  type UpdateProgress,
  type UpdateSource,
} from './update';

/** Mise à jour renvoyée par `plugin-updater` (sous-ensemble utilisé, injectable en test). */
export interface PluginUpdate {
  version: string;
  body?: string;
  downloadAndInstall(
    onEvent?: (
      e:
        | { event: 'Started'; data: { contentLength?: number } }
        | { event: 'Progress'; data: { chunkLength: number } }
        | { event: 'Finished' },
    ) => void,
  ): Promise<void>;
  close(): Promise<void>;
}

/** Dépendances natives, injectables en test. */
export interface TauriUpdateDeps {
  check(opts: { timeout: number }): Promise<PluginUpdate | null>;
  relaunch(): Promise<void>;
  bundleType(): Promise<string | null>;
  openUrl(url: string): Promise<void>;
  fetch(url: string, init: RequestInit): Promise<Response>;
}

async function defaultDeps(): Promise<TauriUpdateDeps> {
  return {
    check: async (opts) => (await import('@tauri-apps/plugin-updater')).check(opts),
    relaunch: async () => (await import('@tauri-apps/plugin-process')).relaunch(),
    bundleType: async () => {
      try {
        return String(await (await import('@tauri-apps/api/app')).getBundleType());
      } catch {
        return null;
      }
    },
    openUrl: async (url) => (await import('./opener')).tauriOpenUrl(url),
    fetch: (url, init) => fetch(url, init),
  };
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
    ? AbortSignal.timeout(ms)
    : undefined;
}

async function openDownload(deps: TauriUpdateDeps, offer: UpdateOffer): Promise<boolean> {
  const url = offer.url ?? ITCH_PAGE;
  if (!isUpdateDownloadUrl(url)) return false;
  try {
    await deps.openUrl(url);
    return true;
  } catch (err) {
    console.warn('[update] ouverture du lien impossible', err);
    return false;
  }
}

/** Desktop : `latest.json` par le plugin (signature vérifiée côté Rust). */
export function createDesktopUpdateSource(
  deps: TauriUpdateDeps,
  currentVersion: string,
): UpdateSource {
  let pending: PluginUpdate | null = null;
  let bundle: Promise<string | null> | null = null;

  return {
    async check() {
      bundle ??= deps.bundleType();
      const previous = pending;
      pending = null;
      if (previous) void previous.close().catch(() => undefined);
      const update = await deps.check({ timeout: UPDATE_CHECK_TIMEOUT_MS });
      if (!update) return null;
      // Garde-fou : le plugin compare déjà, mais une version égale ou plus ancienne n'est jamais
      // proposée (manifeste incohérent).
      if (!isNewer(update.version, currentVersion)) {
        void update.close().catch(() => undefined);
        return null;
      }
      const self = canSelfUpdate(await bundle);
      if (self) pending = update;
      else void update.close().catch(() => undefined);
      return {
        version: displayVersion(update.version),
        notes: update.body ?? null,
        action: self ? 'install' : 'download',
        url: self ? null : ITCH_PAGE,
      };
    },
    async install(onProgress: (p: UpdateProgress) => void) {
      const update = pending;
      if (!update) throw new Error('Aucune mise à jour en attente.');
      let downloaded = 0;
      let total: number | null = null;
      await update.downloadAndInstall((e) => {
        if (e.event === 'Started') total = e.data.contentLength ?? null;
        else if (e.event === 'Progress') downloaded += e.data.chunkLength;
        else if (total !== null) downloaded = total;
        onProgress({ downloaded, total });
      });
      pending = null;
      // Windows : l'installeur NSIS a déjà quitté le jeu ; macOS et Linux : relance.
      await deps.relaunch();
    },
    openDownload: (offer) => openDownload(deps, offer),
  };
}

/** Android : dernière release GitHub (API, CORS ouvert), APK signé dans le navigateur. */
export function createAndroidUpdateSource(
  deps: TauriUpdateDeps,
  currentVersion: string,
): UpdateSource {
  return {
    async check() {
      const res = await deps.fetch(LATEST_RELEASE_API, {
        headers: { Accept: 'application/vnd.github+json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: timeoutSignal(UPDATE_CHECK_TIMEOUT_MS),
      });
      // 404 : aucune release publiée encore ; pas une erreur pour le joueur.
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`API GitHub : HTTP ${res.status}`);
      return offerFromGithubRelease(await res.json(), currentVersion);
    },
    install() {
      return Promise.reject(new Error('Installation impossible depuis le jeu sur Android.'));
    },
    openDownload: (offer) => openDownload(deps, offer),
  };
}

/** Source de la plateforme Tauri courante. */
export async function createTauriUpdateSource(
  kind: 'desktop' | 'android',
  currentVersion: string,
  deps?: TauriUpdateDeps,
): Promise<UpdateSource> {
  const d = deps ?? (await defaultDeps());
  return kind === 'android'
    ? createAndroidUpdateSource(d, currentVersion)
    : createDesktopUpdateSource(d, currentVersion);
}
