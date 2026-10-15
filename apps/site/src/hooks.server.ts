import type { Handle } from '@sveltejs/kit/hooks';
import { toLocale } from './lib/i18n/pages';
import scrollMotion from './lib/enhance/scroll-motion.js?raw';
import videoFacade from './lib/enhance/video-facade.js?raw';

/** Pages hydratées : leurs marqueurs d'hydratation doivent rester (ids de routes, D8). */
const HYDRATED = new Set([
  '/[[lang=lang]]/le-monde',
  '/[[lang=lang]]/signaler',
  '/[[lang=lang]]/suivi',
  '/[[lang=lang]]/problemes-connus',
  '/[[lang=lang]]/tickets',
  '/design',
]);

/**
 * Mouvement au défilement (lib/enhance/scroll-motion.js), réduit au strict nécessaire et posé en
 * ligne en tête de page : aucune requête de plus, exécuté avant le premier rendu (pas de saut),
 * autorisé par son empreinte dans la CSP (scripts/csp-hashes.sh).
 */
const inline = (source: string) =>
  `<script>${source
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\n\s*/g, '\n')
    .replace(/\n+/g, '\n')
    .trim()}</script>`;
const SCROLL_MOTION = inline(scrollMotion);

/** Façade de la bande-annonce (lib/enhance/video-facade.js) : accueil seulement. */
const VIDEO_FACADE = inline(videoFacade);
const WITH_VIDEO = new Set(['/[[lang=lang]]']);

/**
 * `<html lang="%lang%">` (app.html) : langue de la route (`/en/…` → `en`, sinon `fr`), posée avant
 * tout rendu (coupure des mots, lecteurs d'écran, guillemets de `.claim-value`).
 *
 * Pages prérendues sans JS (csr = false) : on retire les marqueurs d'hydratation de Svelte
 * (`<!--[-->`, `<!--]-->`, `<!---->`…), inutiles sans hydratation et très nombreux dans les SVG
 * d'art rendus nœud par nœud (près de la moitié du poids des pages).
 */
export const handle: Handle = ({ event, resolve }) => {
  const hydrated = !!event.route.id && HYDRATED.has(event.route.id);
  const lang = toLocale(event.params.lang);
  const scripts =
    SCROLL_MOTION + (event.route.id && WITH_VIDEO.has(event.route.id) ? VIDEO_FACADE : '');
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const out = hydrated ? html : html.replace(/<!--(?:\[[-!\d]*|\]|)-->/g, '');
      return out.replace('%lang%', lang).replace('</head>', `${scripts}</head>`);
    },
  });
};
