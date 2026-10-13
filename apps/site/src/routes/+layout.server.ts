import { vineImage } from '#lib/prerender/keyart';
import type { LayoutServerLoad } from './$types';

// Art partagé par toutes les pages (prérendu) : la vigne de fougère des séparateurs de section.
export const load: LayoutServerLoad = () => ({ vine: vineImage() });
