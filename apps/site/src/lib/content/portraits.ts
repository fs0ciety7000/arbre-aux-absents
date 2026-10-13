/**
 * Planches de portraits montrées par le site. Sélection volontairement partielle et légendes
 * purement graphiques : aucun nom, aucun lien de parenté, aucun rôle dans l'affaire (pas de
 * spoiler). `person` est l'id de personne de l'affaire ; le fichier (id neutre `portrait-xxxxxx`) est
 * résolu au prérendu par `art/tools/portraits/ids.json`. Ce module n'est importé qu'au prérendu.
 */
export interface PortraitPlate {
  /** Id de personne (résolu en fichier de portrait au prérendu). */
  person: string;
  /** Numéro de planche (chiffres romains). */
  plate: string;
  /** Légende visible : ce que montre le dessin. */
  caption: string;
  /** Texte alternatif : coiffure, accessoire, vêtement (DESIGN §10.7). */
  alt: string;
}

export const PORTRAIT_PLATES: PortraitPlate[] = [
  {
    person: 'adelaide-varenque',
    plate: 'I',
    caption: 'Cheveux blancs tressés en couronne, col de dentelle, broche. Lavis carmin.',
    alt: 'Portrait gravé d’une femme âgée aux cheveux blancs tressés en couronne, col de dentelle et broche, robe rose.',
  },
  {
    person: 'firmin-varenque-1849',
    plate: 'II',
    caption: 'Casquette de marin, barbe pleine, vareuse à boutons. Lavis indigo.',
    alt: 'Portrait gravé d’un homme barbu en casquette de marin et vareuse bleue à boutons.',
  },
  {
    person: 'blanche-varenque',
    plate: 'III',
    caption: 'Carré court, collier de perles, épaules nues. Lavis lilas.',
    alt: 'Portrait gravé d’une jeune femme aux cheveux châtains coupés au carré, collier de perles et robe lilas.',
  },
  {
    person: 'victor-sauge',
    plate: 'IV',
    caption: 'Casque de cuir et lunettes d’aviateur relevées. Lavis sienne.',
    alt: 'Portrait gravé d’un homme souriant en casque de cuir, lunettes d’aviateur relevées sur le front.',
  },
  {
    person: 'henriette-sorbelle',
    plate: 'V',
    caption: 'Chapeau à plume, lorgnon pendu au cou. Lavis carmin et indigo.',
    alt: 'Portrait gravé d’une femme en chapeau noir à plume, lorgnon pendu à une chaîne, corsage rose.',
  },
  {
    person: 'maaren-tennok',
    plate: 'VI',
    caption: 'Chandail ostrien à zigzags, cheveux gris nattés. Lavis céladon.',
    alt: 'Portrait gravé d’une femme âgée aux cheveux gris nattés, chandail vert à motif en zigzag.',
  },
  {
    person: 'lucien-varenque',
    plate: 'VII',
    caption: 'Feutre à larges bords, barbiche, lavallière. Lavis safran.',
    alt: 'Portrait gravé d’un homme en chapeau de feutre brun, barbiche et lavallière, veste jaune.',
  },
  {
    person: 'ninon-brial',
    plate: 'VIII',
    caption: 'Turban noué, anneaux d’oreille, gants. Lavis sauge.',
    alt: 'Portrait gravé d’une femme en turban jaune, anneaux d’oreille et gants bruns, robe verte.',
  },
  {
    person: 'tavik-varenque',
    plate: 'IX',
    caption: 'Barbe rousse, chandail à zigzags. Lavis indigo et carmin.',
    alt: 'Portrait gravé d’un homme roux et barbu en chandail bleu à motif en zigzag.',
  },
];

/** Les quatre planches de l'accueil. */
export const HOME_PLATES = PORTRAIT_PLATES.slice(0, 4);
