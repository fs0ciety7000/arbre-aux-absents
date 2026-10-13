import { spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ spot: spotImage('register') });
