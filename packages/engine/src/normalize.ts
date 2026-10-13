/**
 * Normalisation des textes et hachage des réponses (ARCHITECTURE §3.3, §3.5).
 * `hashAnswer` est partagé avec `content-tools` : la compilation et le moteur doivent
 * produire exactement les mêmes empreintes.
 */

/** Ligatures et lettres que la décomposition NFD ne sépare pas. */
const FOLD: Readonly<Record<string, string>> = {
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  ø: 'o',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  ı: 'i',
};
const FOLD_RE = /[æœßøđðþłı]/g;
const MARKS_RE = /\p{M}+/gu;
const NON_WORD_RE = /[^\p{L}\p{N}]+/gu;

/**
 * NFD, sans diacritiques, minuscules (indépendantes de la locale), ligatures dépliées,
 * tout ce qui n'est ni lettre ni chiffre (ponctuation, symboles, espaces) → une espace,
 * espaces de bord retirées.
 */
export function normalize(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFKD')
    .replace(MARKS_RE, '')
    .toLowerCase()
    .replace(FOLD_RE, (ch) => FOLD[ch] ?? ch)
    .replace(NON_WORD_RE, ' ')
    .trim();
}

/** cyrb53 (domaine public, bryc) : hachage 53 bits rapide et déterministe. */
export function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export const ANSWER_FIELDS = ['given', 'family', 'portrait', 'occupation'] as const;
export type AnswerField = (typeof ANSWER_FIELDS)[number];

/**
 * Empreinte d'une réponse : `cyrb53(salt|slot|champ|normalize(valeur))` en hexadécimal
 * sur 14 caractères (53 bits). Les ids de portrait et de métier passent aussi par
 * `normalize` (les tirets deviennent des espaces : sans effet sur l'égalité).
 */
export function hashAnswer(salt: string, slot: string, field: AnswerField, value: string): string {
  return cyrb53(`${salt}|${slot}|${field}|${normalize(value)}`)
    .toString(16)
    .padStart(14, '0');
}
