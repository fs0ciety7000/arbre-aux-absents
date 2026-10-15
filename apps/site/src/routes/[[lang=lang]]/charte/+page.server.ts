import { STRINGS, toLocale } from '#lib/i18n/index';
import { paletteGroups } from '#lib/prerender/tokens';
import { flourishImage, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Prérendu seulement (csr = false) : tokens et art lus au build.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  return {
    palette: paletteGroups(STRINGS[lang].palette),
    spots: [spotImage('lighthouse', lang), spotImage('archives', lang), spotImage('stamp', lang)],
    seal: flourishImage('seal', lang),
  };
};
