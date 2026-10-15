import { HOME_PLATES, localizePlates } from '#lib/content/portraits';
import { STRINGS, toLocale } from '#lib/i18n/index';
import { portraitImage, worldMapLayers } from '#lib/prerender/art';
import { keyArt, keyArtImages, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  const t = STRINGS[lang];
  const { wide, tall } = keyArt(lang);
  return {
    hero: { images: keyArtImages(lang), live: { wide: wide.live, tall: tall.live }, alt: wide.alt },
    map: worldMapLayers(lang),
    spots: {
      tree: spotImage('tree', lang),
      archives: spotImage('archives', lang),
      map: spotImage('map-pin', lang),
      catalogue: spotImage('catalogue', lang),
      stamp: spotImage('stamp', lang),
      magnifier: spotImage('magnifier', lang),
      register: spotImage('register', lang),
      letter: spotImage('letter', lang),
      lighthouse: spotImage('lighthouse', lang),
      fern: spotImage('fern', lang),
    },
    // L'id de personne reste au prérendu : la page ne reçoit que la planche et l'URL du dessin.
    plates: localizePlates(HOME_PLATES, t.portraits).map(({ person, ...p }) => ({
      ...p,
      image: portraitImage(person),
    })),
  };
};
