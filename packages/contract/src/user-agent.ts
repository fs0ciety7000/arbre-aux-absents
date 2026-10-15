/**
 * Familles grossières du système et du navigateur pour les diagnostics d'un signalement
 * (ARCHITECTURE §8). Fonctions pures partagées par le jeu et le site : la chaîne User-Agent
 * complète n'est jamais envoyée, seulement « Windows », « Firefox 131 »… (≤ 40 caractères).
 */

/** Famille grossière du système (contrat : `ReportDiagnostics.os`), `undefined` si inconnue. */
export function osFamily(userAgent: string): string | undefined {
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(userAgent)) return 'macOS';
  if (/CrOS/i.test(userAgent)) return 'ChromeOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return undefined;
}

export interface BrowserFamilyOptions {
  /** Le jeu tourne dans Tauri (`platform` `desktop` ou `android`) : moteur intégré nommé. */
  tauri?: boolean;
}

/** Version majeure après `token/` (`Chrome/129.0.6668.70` → `129`). */
function major(userAgent: string, token: string): string | undefined {
  const m = new RegExp(`(?:^|[\\s;(])${token}/(\\d{1,4})(?!\\d)`).exec(userAgent);
  return m?.[1];
}

const named = (name: string, version: string | undefined) =>
  version ? `${name} ${version}` : name;

/**
 * Famille du navigateur et version majeure (contrat : `ReportDiagnostics.browser`) :
 * « Firefox 131 », « Chrome 129 », « Edge 129 », « Safari 18 », « Samsung Internet 26 »,
 * « WebView Android 129 », « Chrome iOS 129 »… Dans Tauri (`{ tauri: true }`) : « Tauri (WebView2 129) »,
 * « Tauri (WebKitGTK) », « Tauri (WKWebView) », « Tauri (WebView Android 129) ».
 * `undefined` si rien n'est reconnu. Jamais l'User-Agent complet.
 */
export function browserFamily(
  userAgent: string,
  opts: BrowserFamilyOptions = {},
): string | undefined {
  const ua = userAgent.slice(0, 512);
  if (opts.tauri) {
    const os = osFamily(ua);
    if (os === 'Android') return `Tauri (${named('WebView Android', major(ua, 'Chrome'))})`;
    if (os === 'Windows')
      return `Tauri (${named('WebView2', major(ua, 'Edg') ?? major(ua, 'Chrome'))})`;
    if (os === 'macOS' || os === 'iOS') return 'Tauri (WKWebView)';
    if (os === 'Linux') return 'Tauri (WebKitGTK)';
    return 'Tauri';
  }
  // Ordre : les navigateurs dérivés de Chromium ou de WebKit annoncent aussi Chrome/Safari.
  if (/\bwv\)/.test(ua) && /Android/.test(ua)) return named('WebView Android', major(ua, 'Chrome'));
  if (/FxiOS\//.test(ua)) return named('Firefox iOS', major(ua, 'FxiOS'));
  if (/CriOS\//.test(ua)) return named('Chrome iOS', major(ua, 'CriOS'));
  if (/EdgiOS\//.test(ua)) return named('Edge iOS', major(ua, 'EdgiOS'));
  if (/Firefox\//.test(ua)) return named('Firefox', major(ua, 'Firefox'));
  if (/SamsungBrowser\//.test(ua)) return named('Samsung Internet', major(ua, 'SamsungBrowser'));
  if (/\bOPR\//.test(ua)) return named('Opera', major(ua, 'OPR'));
  if (/\bEdg(?:A)?\//.test(ua)) return named('Edge', major(ua, 'Edg') ?? major(ua, 'EdgA'));
  if (/Chrome\//.test(ua) || /Chromium\//.test(ua)) {
    return named('Chrome', major(ua, 'Chrome') ?? major(ua, 'Chromium'));
  }
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return named('Safari', major(ua, 'Version'));
  if (/AppleWebKit\//.test(ua)) return 'WebKit';
  return undefined;
}
