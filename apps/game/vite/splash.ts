/**
 * Plugin Vite : premier affichage sans JavaScript (index.html).
 *
 * - Met en ligne la feuille de l'écran d'attente (`src/shell/splash.css`) précédée des tokens
 *   (`@arbre/ui` tokens.css) et des polices de repli métriques (`@font-face` « … fallback » de
 *   fonts.css) : l'écran se peint dès l'arrivée du HTML, sans feuille bloquante.
 * - Au build : précharge le module de démarrage (`src/boot.ts`, importé dynamiquement par
 *   `src/main.ts`), ses dépendances et sa feuille de style (`preload`, non bloquant).
 * - Paquets du dépôt sans effet de bord (`pureWorkspaceModule`) : leurs barils ne tirent dans le
 *   module de démarrage que ce qu'il importe (docs/i18n/PLAN.md §2.4).
 * - Au build web (hors `--mode tauri`, qui a sa CSP dans tauri.conf.json) : CSP en `<meta>`.
 *   Aucun script en ligne ; le seul `<style>` en ligne est autorisé par son empreinte ;
 *   `style-src-attr 'unsafe-inline'` couvre les attributs `style` posés par Svelte
 *   (`style:` et variables CSS des composants).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import type { HtmlTagDescriptor, Plugin } from 'vite';

const require = createRequire(import.meta.url);

/** Retire commentaires et blancs superflus (CSS écrit à la main, sans chaînes piégées). */
export function compactCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

/** `@font-face` des polices de repli métriques (`font-family: '… fallback'`). */
export function fallbackFaces(fontsCss: string): string {
  return (fontsCss.match(/@font-face\s*{[^}]*}/g) ?? [])
    .filter((block) => /font-family:\s*'[^']* fallback'/.test(block))
    .join('\n');
}

/** Service de signalement par défaut (ARCHITECTURE §8) ; `VITE_REPORT_API` le remplace. */
export const DEFAULT_REPORT_API = 'https://arbre-api.cardormedia.com';

/** Origine du service de signalement à autoriser dans `connect-src` (ARCHITECTURE §5). */
export function reportOrigin(value?: string): string {
  const v = (value ?? '').trim() || DEFAULT_REPORT_API;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.origin : DEFAULT_REPORT_API;
  } catch {
    return DEFAULT_REPORT_API;
  }
}

export function cspFor(styleHashes: string[], connect: string[] = []): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    `style-src 'self' ${styleHashes.join(' ')}`.trim(),
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    ["connect-src 'self'", ...connect].join(' '),
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
}

/**
 * Sources des paquets du dépôt (`@arbre/ui`, `@arbre/contract`, `@arbre/engine`) : sans effet de
 * bord au chargement (aucune instruction de premier niveau hors déclarations). Leurs barils
 * (`export * from …`) ne tirent donc que ce qui est importé : une primitive ou un schéma utilisé
 * seulement par un écran chargé à la demande reste dans le morceau de cet écran. Les feuilles de
 * style des composants (`….svelte?svelte&type=style…`) gardent leurs effets.
 */
const PURE_SOURCES = /[\\/]packages[\\/](?:ui|contract|engine)[\\/]src[\\/][^?]*\.(?:ts|svelte)$/;

/** `true` si le module peut être retiré quand aucun de ses exports n'est utilisé. */
export function pureWorkspaceModule(id: string): boolean {
  return PURE_SOURCES.test(id);
}

interface Options {
  /** Feuille de l'écran d'attente. */
  splashCss: string;
}

export function splash(opts: Options): Plugin {
  let isBuild = false;
  let mode = 'production';
  let reportApi = DEFAULT_REPORT_API;
  const uiStyles = dirname(require.resolve('@arbre/ui/styles/index.css'));

  const inlineCss = () =>
    compactCss(
      [
        fallbackFaces(readFileSync(resolve(uiStyles, 'fonts.css'), 'utf8')),
        readFileSync(resolve(uiStyles, 'tokens.css'), 'utf8'),
        readFileSync(opts.splashCss, 'utf8'),
      ].join('\n'),
    );

  return {
    name: 'arbre-splash',
    config: () => ({
      build: {
        rolldownOptions: {
          treeshake: { moduleSideEffects: (id: string) => !pureWorkspaceModule(id) },
        },
      },
    }),
    configResolved(config) {
      isBuild = config.command === 'build';
      mode = config.mode;
      reportApi = reportOrigin(config.env.VITE_REPORT_API as string | undefined);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const css = inlineCss();
        const tags: HtmlTagDescriptor[] = [
          { tag: 'style', attrs: { id: 'splash-css' }, children: css, injectTo: 'head' },
        ];
        if (isBuild && mode !== 'tauri') {
          const hash = createHash('sha256').update(css, 'utf8').digest('base64');
          tags.unshift({
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: cspFor([`'sha256-${hash}'`], [reportApi]),
            },
            injectTo: 'head-prepend',
          });
        }
        const bundle = ctx.bundle;
        if (isBuild && bundle) {
          const boot = Object.values(bundle).find(
            (c) => c.type === 'chunk' && /[\\/]src[\\/]boot\.ts$/.test(c.facadeModuleId ?? ''),
          );
          if (boot && boot.type === 'chunk') {
            // Dépendances statiques, transitives (ex. catalogue `i18n/fr` importé par un chunk
            // partagé) : aucune cascade de requêtes au premier affichage.
            const js = new Set<string>([boot.fileName]);
            const css = new Set<string>();
            for (const f of js) {
              const dep = bundle[f];
              if (dep?.type !== 'chunk') continue;
              for (const c of dep.viteMetadata?.importedCss ?? []) css.add(c);
              for (const i of dep.imports) js.add(i);
            }
            for (const f of js) {
              if (f === ctx.chunk?.fileName) continue;
              tags.push({
                tag: 'link',
                attrs: { rel: 'modulepreload', crossorigin: true, href: `./${f}` },
                injectTo: 'head',
              });
            }
            for (const f of css) {
              tags.push({
                tag: 'link',
                // `crossorigin` : même mode que la feuille insérée par le préchargeur de Vite.
                attrs: { rel: 'preload', as: 'style', crossorigin: true, href: `./${f}` },
                injectTo: 'head',
              });
            }
          }
        }
        return { html, tags };
      },
    },
  };
}
