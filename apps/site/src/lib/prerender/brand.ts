/** Emblème CARDOR Media (écran de crédits seulement), lu au prérendu. */
import emblem from '../../../../../static/brand/cardor-emblem.svg?raw';
import { parseSvg } from '#lib/svg/parse';

export const CARDOR_EMBLEM = { name: 'CARDOR Media', node: parseSvg(emblem) };
