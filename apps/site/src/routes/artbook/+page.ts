import type { PageLoad } from './$types';

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageLoad = async () => {
  if (!import.meta.env.SSR) return { map: null, plates: [] };
  const { portrait, worldMap } = await import('#lib/prerender/art');
  const { PORTRAIT_PLATES } = await import('#lib/content/portraits');
  // L'id de personne reste au prérendu : la page ne reçoit que la planche et son dessin.
  return {
    map: worldMap(),
    plates: PORTRAIT_PLATES.map(({ person, ...p }) => ({ ...p, node: portrait(person) })),
  };
};
