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
};

export const DEFAULT_CASE = 'succession-varenque';
