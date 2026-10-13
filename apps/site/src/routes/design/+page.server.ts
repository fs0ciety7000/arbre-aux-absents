import { placeGroups, portrait } from '#lib/prerender/art';
import { keyArt, keyArtImages, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Page hydratée : seul un extrait léger de l'art est sérialisé (quatre lieux, un portrait, la
// scène vivante de l'art clé ; le fond et les vignettes restent des images autonomes).
export const load: PageServerLoad = () => {
  const { wide, tall } = keyArt();
  return {
    places: placeGroups(['saint-ormel', 'aubrelieu', 'foret-de-sorbe', 'moulinvert']),
    portrait: portrait('adelaide-varenque'),
    hero: { images: keyArtImages(), live: { wide: wide.live, tall: tall.live }, alt: wide.alt },
    spot: spotImage('archives'),
  };
};
