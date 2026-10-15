/**
 * Plugin Vite : en `--mode tauri`, la CSP de `src-tauri/tauri.conf.json` doit autoriser dans
 * `connect-src` l'origine du service de signalement (`VITE_REPORT_API`, sinon la production).
 * Le build échoue si les deux divergent (sinon le signalement serait bloqué par la CSP de l'app
 * installée, sans erreur visible au build) ; en dev, simple avertissement. Le build web n'est pas
 * concerné : sa CSP en `<meta>` suit déjà `VITE_REPORT_API` (vite/splash.ts).
 */
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { reportOrigin } from './splash';

/** Sources de `connect-src` dans la CSP d'un tauri.conf.json (objet ou chaîne), sinon `null`. */
export function tauriConnectSrc(conf: unknown): string[] | null {
  const csp = (conf as { app?: { security?: { csp?: unknown } } } | null)?.app?.security?.csp;
  let value: unknown;
  if (typeof csp === 'string') {
    value = csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('connect-src '))
      ?.slice('connect-src '.length);
  } else if (csp && typeof csp === 'object') {
    value = (csp as Record<string, unknown>)['connect-src'];
  }
  if (Array.isArray(value)) value = value.join(' ');
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : null;
}

/** Message d'erreur si la CSP Tauri n'autorise pas `origin`, sinon `null`. */
export function tauriCspProblem(conf: unknown, origin: string): string | null {
  const sources = tauriConnectSrc(conf);
  if (!sources) return 'tauri.conf.json : aucune directive connect-src dans app.security.csp.';
  if (sources.some((s) => s.replace(/\/+$/, '') === origin)) return null;
  return (
    `VITE_REPORT_API (${origin}) absent du connect-src de src-tauri/tauri.conf.json ` +
    `(${sources.join(' ')}) : changer les deux ensemble (docs/DEPLOYMENT.md).`
  );
}

export function tauriReportCsp(opts: { tauriConf: string }): Plugin {
  return {
    name: 'arbre-tauri-report-csp',
    configResolved(config) {
      if (config.mode !== 'tauri') return;
      const origin = reportOrigin(config.env.VITE_REPORT_API as string | undefined);
      const problem = tauriCspProblem(JSON.parse(readFileSync(opts.tauriConf, 'utf8')), origin);
      if (!problem) return;
      if (config.command === 'build') throw new Error(problem);
      config.logger.warn(problem);
    },
  };
}
