import { chromeStrings, toLocale } from '#lib/i18n/index';
import { vineImage } from '#lib/prerender/keyart';
import type { LayoutServerLoad } from './$types';

// Art partagé par toutes les pages (prérendu) : la vigne de fougère des séparateurs de section.
// Textes de l'habillage dans la langue de la route (`/en/…`), sérialisés seulement là où la page
// est hydratée (« Le monde ») : le JS client ne porte jamais les catalogues.
export const load: LayoutServerLoad = ({ params }) => ({
  vine: vineImage(),
  chrome: chromeStrings(toLocale(params.lang)),
});
