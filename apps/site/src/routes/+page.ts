import type { PageLoad } from './$types';

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageLoad = async () => {
  if (!import.meta.env.SSR) return { map: null, plates: [] };
  const { portraitImage, worldMap } = await import('#lib/prerender/art');
  const { HOME_PLATES } = await import('#lib/content/portraits');
  // L'id de personne reste au prérendu : la page ne reçoit que la planche et l'URL du dessin
  // (SVG externe mis en cache, id de fichier neutre).
  return {
    // Carte du héros : fond embarqué (premier rendu sans requête), détail en cache.
    map: worldMap({ inlineFond: true }),
    plates: HOME_PLATES.map(({ person, ...p }) => ({ ...p, image: portraitImage(person) })),
  };
};
