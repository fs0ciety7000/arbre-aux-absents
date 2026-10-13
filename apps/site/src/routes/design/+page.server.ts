import { placeGroups, portrait } from '#lib/prerender/art';
import type { PageServerLoad } from './$types';

// Page hydratée : seul un extrait léger de l'art est sérialisé (quatre lieux, un portrait).
export const load: PageServerLoad = () => ({
  places: placeGroups(['saint-ormel', 'aubrelieu', 'foret-de-sorbe', 'moulinvert']),
  portrait: portrait('adelaide-varenque'),
});
