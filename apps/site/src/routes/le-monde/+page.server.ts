import { spotImage } from '#lib/prerender/keyart';
import type { PageServerLoad } from './$types';

// Vignettes d'aquarelle (SVG autonomes servis par /art/) : seules leurs URL vont au client.
export const load: PageServerLoad = () => ({
  spots: {
    lighthouse: spotImage('lighthouse'),
    register: spotImage('register'),
    letter: spotImage('letter'),
    pin: spotImage('map-pin'),
  },
});
