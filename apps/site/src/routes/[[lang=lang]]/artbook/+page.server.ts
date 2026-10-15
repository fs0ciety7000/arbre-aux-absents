import { PORTRAIT_PLATES, localizePlates } from '#lib/content/portraits';
import { STRINGS, toLocale } from '#lib/i18n/index';
import { portraitImage, worldMap } from '#lib/prerender/art';
import { flourishImage, keyArtFullImages, spotImage, type SpotName } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

/** Vignettes d'aquarelle de l'artbook, dans cet ordre (légendes : catalogue, aucun indice). */
const SPOTS: SpotName[] = [
  'tree',
  'archives',
  'lighthouse',
  'catalogue',
  'letter',
  'stamp',
  'magnifier',
  'register',
  'map-pin',
  'fern',
];

// Prérendu seulement (csr = false) : l'art est lu au build et n'entre jamais dans le JS client.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  const t = STRINGS[lang];
  const keyart = keyArtFullImages();
  return {
    keyart: { ...keyart, alt: t.meta.keyArtAlt ?? keyart.alt },
    spots: SPOTS.map((name) => ({
      name,
      title: t.artbook.spots.names[name],
      image: spotImage(name),
    })),
    seal: flourishImage('seal'),
    map: worldMap({ lang }),
    // L'id de personne reste au prérendu : la page ne reçoit que la planche et l'URL du dessin.
    plates: localizePlates(PORTRAIT_PLATES, t.portraits).map(({ person, ...p }) => ({
      ...p,
      image: portraitImage(person),
    })),
  };
};
