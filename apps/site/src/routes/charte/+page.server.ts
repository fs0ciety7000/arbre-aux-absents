import { paletteGroups } from '#lib/prerender/tokens';
import { flourishImage, spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Prérendu seulement (csr = false) : tokens et art lus au build.
export const load: PageServerLoad = () => ({
  palette: paletteGroups(),
  spots: [spotImage('lighthouse'), spotImage('archives'), spotImage('stamp')],
  seal: flourishImage('seal'),
});
