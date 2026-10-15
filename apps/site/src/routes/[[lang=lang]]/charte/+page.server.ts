import { STRINGS, toLocale } from '#lib/i18n/index';
import { paletteGroups } from '#lib/prerender/tokens';
import { flourishImage, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Prérendu seulement (csr = false) : tokens et art lus au build.
export const load: PageServerLoad = ({ params }) => ({
  palette: paletteGroups(STRINGS[toLocale(params.lang)].palette),
  spots: [spotImage('lighthouse'), spotImage('archives'), spotImage('stamp')],
  seal: flourishImage('seal'),
});
