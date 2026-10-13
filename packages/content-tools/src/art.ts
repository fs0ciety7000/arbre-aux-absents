/**
 * Classes d'art admises dans les SVG (règle 8). Source de vérité : `packages/ui/src/art-classes.ts`
 * (design-lead). Import relatif car `@arbre/ui` n'exporte pas encore ce module seul (son index
 * tirera les composants Svelte) : proposer l'export `"./art-classes"` dans packages/ui.
 */
export {
  ART_CLASSES,
  ART_PAINT_KEYWORDS,
  ART_PATTERN_IDS,
  ART_ROOT_CLASS,
} from '../../ui/src/art-classes';
