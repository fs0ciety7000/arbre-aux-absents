/**
 * Textes de presse, source unique : la page /presse/ et le kit presse (scripts/presskit/) les
 * lisent ici. Aucun nom de personnage, aucun secret ni dénouement de l'affaire.
 */

export interface Fact {
  term: string;
  value: string;
}

export const PRESS_FACTS: Fact[] = [
  { term: 'Titre', value: 'L’Arbre aux absents' },
  { term: 'Genre', value: 'Enquête généalogique, déduction' },
  { term: 'Développement', value: 'CM Interactive' },
  { term: 'Écriture et illustration', value: 'CM Creative Lab' },
  { term: 'Édition', value: 'CARDOR Media' },
  { term: 'Plateformes', value: 'Windows, macOS, Linux, Android, navigateur' },
  { term: 'Langues', value: 'Français, anglais (textes et interface)' },
  { term: 'Joueurs', value: 'Un joueur' },
  { term: 'Durée', value: 'Trois affaires, de quatre à dix heures chacune' },
  { term: 'Prix', value: 'Gratuit' },
  { term: 'Sortie', value: 'Octobre 2026' },
  { term: 'Site', value: 'arbre.cardormedia.com' },
];

/** Accroche de l'écran titre. */
export const PRESS_HOOK = 'Velmarche, automne 1974. Une famille entière à rendre à ses noms.';

/** Présentation en une phrase. */
export const PRESS_SHORT =
  'Un jeu d’enquête généalogique en solo : reconstituez l’arbre d’une famille sur quatre générations en croisant lettres, registres, photographies et coupures de presse, dans un pays imaginaire, la Velmarche.';

/** Présentation longue, par paragraphes. */
export const PRESS_LONG: string[] = [
  'Velmarche, octobre 1974. Vingt ans après la chute de la Régence, qui rayait des registres les citoyens jugés indésirables, une loi permet enfin de réinscrire ceux qu’on appelait les « absents ». Rapporteur à l’Office de Réinscription civile, le joueur reçoit une succession à instruire : un arbre généalogique presque vide et des cartons d’archives.',
  'Lettres, actes, photographies de groupe, annuaires, cartes postales, articles de presse et un lecteur de fiches d’époque qui répond aux mots-clés : rien n’est imposé dans l’ordre. Le joueur tire le fil qu’il veut, note, épingle et recoupe, puis remplit chaque case de l’arbre (nom, visage, métier). Les réponses ne se valident que par groupes : on ne devine pas, on déduit.',
  'Une carte gravée et aquarellée du pays ouvre les archives de chaque lieu. Des secrets annexes changent le dénouement ; succès et mode chronométré invitent à rejouer.',
  'Trois affaires indépendantes se jouent dans l’ordre qu’on veut : une succession de papetiers en 1974, un revenant chez les verriers en 1976 et, depuis la version 1.5, une île de pêcheurs évacuée en 1908, où personne ne savait signer et où l’arbre retient les marques taillées au couteau au lieu des visages.',
  'L’Arbre aux absents est développé par CM Interactive, écrit et illustré par CM Creative Lab, et édité par CARDOR Media.',
];

/** Ligne de crédits des visuels (affiches, bannières, fiche). */
export const PRESS_CREDITS =
  'Un jeu CM Interactive · Écrit et illustré par CM Creative Lab · Une production CARDOR Media';
