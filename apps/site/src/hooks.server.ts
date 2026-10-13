import type { Handle } from '@sveltejs/kit/hooks';

/** Pages hydratées : leurs marqueurs d'hydratation doivent rester. */
const HYDRATED = new Set(['/le-monde', '/design']);

/**
 * Pages prérendues sans JS (csr = false) : on retire les marqueurs d'hydratation de Svelte
 * (`<!--[-->`, `<!--]-->`, `<!---->`…), inutiles sans hydratation et très nombreux dans les SVG
 * d'art rendus nœud par nœud (près de la moitié du poids des pages).
 */
export const handle: Handle = ({ event, resolve }) => {
  if (event.route.id && HYDRATED.has(event.route.id)) return resolve(event);
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace(/<!--(?:\[[-!\d]*|\]|)-->/g, ''),
  });
};
