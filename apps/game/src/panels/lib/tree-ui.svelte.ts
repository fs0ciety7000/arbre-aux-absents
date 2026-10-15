/**
 * État d'affichage de l'arbre (vue, génération montrée, zoom), gardé par partie : le panneau est
 * démonté à chaque changement de chemise (Carte → Arbre) et remonté en plein écran ; la vue
 * choisie par le joueur ne doit pas revenir à « Arbre » ni la génération à 1 pour autant.
 * État d'interface seulement (jamais sauvegardé).
 */
export type TreeView = 'graph' | 'generation' | 'list';

export interface TreeUi {
  /** null : pas encore choisie (Générations au téléphone, Arbre ailleurs). */
  view: TreeView | null;
  /** Génération montrée (vue Générations), par sa valeur dans le contenu. */
  gen: number | null;
  zoom: number;
  /** Dernière case visée déjà montrée : un remontage ne ramène pas la vue vers elle. */
  target: string | null;
}

const byGame = new WeakMap<object, TreeUi>();

/** État de l'arbre pour une partie (clé : le magasin de la partie). */
export function treeUi(game: object): TreeUi {
  const known = byGame.get(game);
  if (known) return known;
  const ui = $state<TreeUi>({ view: null, gen: null, zoom: 1, target: null });
  byGame.set(game, ui);
  return ui;
}
