/**
 * Préférences d'affichage du choix d'un portrait (P10), gardées le temps de la session :
 * descriptions complètes sous chaque visage (repliées par défaut). Pas dans `Settings` :
 * l'ajouter serait une évolution du contrat (profil), à décider à part.
 */
export const pickerPrefs = $state({ showDescriptions: false });
