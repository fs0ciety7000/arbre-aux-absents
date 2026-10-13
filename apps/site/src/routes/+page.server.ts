import { HOME_PLATES } from '#lib/content/portraits';
import { portraitImage, worldMapLayers } from '#lib/prerender/art';
import { keyArt, keyArtImages, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageServerLoad = () => {
  const { wide, tall } = keyArt();
  return {
    hero: { images: keyArtImages(), live: { wide: wide.live, tall: tall.live }, alt: wide.alt },
    map: worldMapLayers(),
    spots: {
      tree: spotImage('tree'),
      archives: spotImage('archives'),
      map: spotImage('map-pin'),
      catalogue: spotImage('catalogue'),
      stamp: spotImage('stamp'),
      magnifier: spotImage('magnifier'),
      register: spotImage('register'),
      letter: spotImage('letter'),
      lighthouse: spotImage('lighthouse'),
      fern: spotImage('fern'),
    },
    // L'id de personne reste au prérendu : la page ne reçoit que la planche et l'URL du dessin.
    plates: HOME_PLATES.map(({ person, ...p }) => ({ ...p, image: portraitImage(person) })),
  };
};
