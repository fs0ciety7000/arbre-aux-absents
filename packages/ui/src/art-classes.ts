/**
 * Classes d'art autorisées dans les SVG de contenu (carte, portraits, illustrations).
 * Source de vérité partagée par `src/styles/art.css` (rendu) et `content:check`
 * (ARCHITECTURE §3.7, règle 8). Guide d'usage : docs/DESIGN.md §10.
 * Toute classe ajoutée ici doit être stylée dans art.css et documentée dans DESIGN.md.
 */

export const ART_PAPER = ['paper', 'paper-shade'] as const;
export const ART_INK = ['ink', 'ink-soft', 'ink-faint'] as const;
export const ART_PATTERNS = ['hatch', 'hatch-dense', 'stipple'] as const;
export const ART_WATER = ['water', 'water-deep'] as const;
export const ART_WASHES = [
  'wash-safran',
  'wash-carmin',
  'wash-indigo',
  'wash-sienne',
  'wash-sauge',
  'wash-lilas',
  'wash-celadon',
  'wash-ardoise',
] as const;
export const ART_PORTRAIT = [
  'skin-1',
  'skin-2',
  'skin-3',
  'skin-4',
  'skin-5',
  'skin-6',
  'hair-blond',
  'hair-roux',
  'hair-chatain',
  'hair-brun',
  'hair-noir',
  'hair-gris',
  'blush',
  'rehaut',
  'ombre',
] as const;
export const ART_PHOTO = ['photo-paper', 'photo-light', 'photo-mid', 'photo-dark'] as const;
export const ART_LABELS = [
  'label',
  'label-major',
  'label-region',
  'label-water',
  'label-note',
] as const;

/** Liste complète, dans l'ordre de DESIGN.md §10.9. */
export const ART_CLASSES = [
  ...ART_PAPER,
  ...ART_INK,
  ...ART_PATTERNS,
  ...ART_WATER,
  ...ART_WASHES,
  ...ART_PORTRAIT,
  ...ART_PHOTO,
  ...ART_LABELS,
] as const;

export type ArtClass = (typeof ART_CLASSES)[number];

/** Classe posée sur la racine de tout SVG d'art inliné (sans elle, rien n'est coloré). */
export const ART_ROOT_CLASS = 'art';

/**
 * Modificateur de la racine (`class="art on-night"`, ou sur un ancêtre) : palette d'art pour un
 * SVG posé sur le bureau sombre (écran titre…), DESIGN.md §10.10. Posé par l'application,
 * jamais par un SVG de contenu (ce n'est pas une classe d'élément : absent de ART_CLASSES).
 */
export const ART_NIGHT_CLASS = 'on-night';

/** Identifiants des motifs fournis par <ArtDefs /> : `url(#…)` admis dans les SVG. */
export const ART_PATTERN_IDS = ['art-hatch', 'art-hatch-dense', 'art-stipple'] as const;

/** Valeurs de peinture admises en attribut `fill` / `stroke` en dehors des classes. */
export const ART_PAINT_KEYWORDS = ['none', 'currentColor'] as const;

const ART_CLASS_SET: ReadonlySet<string> = new Set(ART_CLASSES);

/** Vrai si `name` est une classe d'art autorisée. */
export function isArtClass(name: string): name is ArtClass {
  return ART_CLASS_SET.has(name);
}
