/**
 * Les affaires du jeu telles que le site les présente (accueil, presse) : identité du dossier et
 * chiffres publics. Les textes (titre, lieu, accroche, durée) sont dans les catalogues
 * (`STRINGS[lang].cases.items`, même ordre) ; ils s'en tiennent à la situation de départ (lettre de
 * mission) : aucun nom de personnage, aucun secret, aucun dénouement.
 *
 * Les chiffres sont vérifiés contre `content/cases/<id>/` par `cases.test.ts`.
 */
export interface SiteCase {
  /** Id de l'affaire (`content/cases/<id>/`). */
  id: string;
  /** Numéro du dossier de l'Office (sous-titre de l'affaire). */
  file: string;
  /** Cases de l'arbre (`tree.json`). */
  slots: number;
  /** Pièces d'archives (`documents/*.md`). */
  documents: number;
  /** Fins (`endings/*.md`). */
  endings: number;
  /** Version du jeu où l'affaire est arrivée, si elle est récente (étiquette « Nouveau »). */
  since?: string;
}

/** Dans l'ordre du jeu (`case.json` › `order`). */
export const SITE_CASES: SiteCase[] = [
  { id: 'succession-varenque', file: '74-0318', slots: 30, documents: 118, endings: 6 },
  { id: 'revenant-hautcorvin', file: '76-0012', slots: 28, documents: 98, endings: 4 },
  {
    id: 'marques-de-longuegreve',
    file: '77-0874',
    slots: 32,
    documents: 111,
    endings: 4,
    since: '1.5',
  },
];

/**
 * Marques des quatre chefs de maison de l'affaire 3, telles que la matrice de 1868 les montre dans
 * la pièce d'ouverture (OF-02) : ids neutres des fichiers (`content/cases/marques-de-longuegreve/
 * portraits/`). Aucune autre marque n'est publiée (leur grammaire se déduit en jeu).
 */
export const HOUSE_MARKS = [
  'lg-portrait-9e0e20',
  'lg-portrait-aa93f2',
  'lg-portrait-5ce728',
  'lg-portrait-8084e7',
] as const;

/**
 * Illustrations de pièces de l'affaire 3 montrées par l'artbook (`content/cases/
 * marques-de-longuegreve/illustrations/<id>.svg`) : décor et objets, ni visage identifiable, ni
 * marque à déduire. Légendes : catalogues (`artbook.longuegreve.pieces`).
 */
export const LONGUEGREVE_PIECES = ['cp-01', 'ob-03', 'pb-01', 'ph-11'] as const;
export type LonguegrevePiece = (typeof LONGUEGREVE_PIECES)[number];
