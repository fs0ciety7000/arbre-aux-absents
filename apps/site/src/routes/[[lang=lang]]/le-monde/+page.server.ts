import { mapTitle, sitePlaces } from '#lib/content/places';
import { WORLD_MAP } from '#lib/content/world';
import { STRINGS, toLocale } from '#lib/i18n/index';
import { spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Page hydratée : tout ce qui part au client passe par ces données, dans une seule langue
// (textes de la page, lieux décrits, titre de la carte) ; les catalogues restent au prérendu.
// Vignettes d'aquarelle : SVG autonomes servis par /art/, seules leurs URL vont au client.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  const t = STRINGS[lang];
  return {
    t: t.world,
    mapText: t.map,
    seo: { title: t.world.seoTitle, description: t.world.seoDescription },
    places: sitePlaces(lang),
    mapTitle: mapTitle(lang, WORLD_MAP.title),
    spots: {
      lighthouse: spotImage('lighthouse'),
      register: spotImage('register'),
      letter: spotImage('letter'),
      pin: spotImage('map-pin'),
    },
  };
};
