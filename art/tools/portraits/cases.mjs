/**
 * Affaires connues de l'outil de portraits : pour chacune, la table des visages (`people`), la table
 * des ids neutres (`ids`, personne → fichier) et le préfixe de ces ids.
 *
 * Les ids et les noms de fichier de portrait sont uniques sur l'ensemble des affaires (règle 1 de
 * `content:check`, entre affaires) : chaque affaire a son préfixe. `ids.json` (affaire 1) garde son
 * format historique, lu aussi par le site et le dossier de presse.
 */
export const CASES = {
  'succession-varenque': {
    title: 'Succession Varenque',
    people: './people.mjs',
    ids: './ids.json',
    idPrefix: 'portrait-',
  },
  'revenant-hautcorvin': {
    title: 'Le Revenant de Hautcorvin',
    people: './people-hautcorvin.mjs',
    ids: './ids-revenant-hautcorvin.json',
    idPrefix: 'hc-portrait-',
  },
  // Affaire 3 : 13 visages (people-longuegreve.mjs) ; la même table d'ids porte les 34 marques
  // (art/tools/marques/, noms de travail `lg-m-…`), conservées par --assign-ids.
  'marques-de-longuegreve': {
    title: 'Les Marques de Longuegrève',
    people: './people-longuegreve.mjs',
    ids: './ids-marques-de-longuegreve.json',
    idPrefix: 'lg-portrait-',
  },
};

export const DEFAULT_CASE = 'succession-varenque';
