import { toLocale } from '#lib/i18n/pages';
import { spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => ({
  spot: spotImage('register', toLocale(params.lang)),
});
