# Succès — L'Arbre aux absents

> Auteur : `game-designer` · v0.1 (cadrage) · 13 oct. 2026
> **26 succès génériques**, à lier ensuite au scénario : les titres sont provisoires et neutres,
> le scénariste les renommera dans le ton du monde. `[à lier]` = paramètre fourni par l'affaire.
> Règles : aucun succès ne récompense l'absence d'aide (les aides ne sont jamais une punition) ;
> aucun succès manquable définitivement (tout reste obtenable dans la partie en cours, après le
> dénouement, ou en re-jeu) ; les succès cachés affichent « ??? » et une catégorie.

## Liste

| # | ID | Titre provisoire | Condition (chiffrée) | Catégorie | Caché |
|---|---|---|---|---|---|
| 1 | `first_document` | Première enveloppe | Lire un premier document | Prologue | Non |
| 2 | `first_search` | Fiche demandée | Obtenir un premier résultat au Catalogue | Prologue | Non |
| 3 | `first_face` | Un visage dans la foule | Collecter un premier visage sur une photo | Prologue | Non |
| 4 | `first_lock` | Établi | Verrouiller un premier groupe de cases | Prologue | Non |
| 5 | `prologue_done` | Le fil est tiré | Terminer le prologue | Prologue | Non |
| 6 | `branch_complete` | Une branche entière | Verrouiller toutes les cases d'un groupe | Arbre | Non |
| 7 | `generation_complete` | Une génération | Verrouiller toutes les cases d'une génération | Arbre | Non |
| 8 | `half_tree` | À mi-chemin | Verrouiller 50 % des cases | Arbre | Non |
| 9 | `tree_complete` | L'arbre aux absents | Verrouiller toutes les cases (dénouement) | Arbre | Non |
| 10 | `branch_[x]` | *Titre de branche* | Compléter le groupe `[à lier]` (1 succès par groupe narratif majeur, prévoir 2 à 3) | Arbre | Oui |
| 11 | `secret_first` | Ce que l'arbre ne dit pas | Découvrir un premier secret annexe | Secrets | Non |
| 12 | `secret_[x]` | *Titre de secret* | Découvrir le secret `[à lier]` (1 par secret marquant, prévoir 3) | Secrets | Oui |
| 13 | `secrets_all` | Plus aucun absent | Découvrir tous les secrets | Secrets | Non |
| 14 | `ending_[x]` | *Titre de fin* | Voir la conclusion `[à lier]` (1 par conclusion, prévoir 3) | Fins | Oui |
| 15 | `epilogue` | Épilogue | Atteindre 100 % (arbre + secrets) et voir l'épilogue | Fins | Non |
| 16 | `reader_all` | Tout lu | Lire 100 % des documents de l'affaire | Archives | Non |
| 17 | `catalogue_combined` | Recoupement | Obtenir un document réservé à une requête combinée (2 termes) | Archives | Non |
| 18 | `catalogue_50` | Habitué du Fichier | Effectuer 50 requêtes avec au moins un résultat | Archives | Non |
| 19 | `map_all` | Cartographe | Ouvrir tous les lieux de la carte | Carte | Non |
| 20 | `faces_all` | Tous les visages | Collecter tous les visages de l'affaire | Archives | Non |
| 21 | `pinboard` | Le mur de l'enquêteur | Avoir 10 épingles reliées par au moins 8 fils | Outils | Non |
| 22 | `clean_lock` | Du premier coup | Verrouiller un groupe complet (≥ 3 cases) sans aucune évaluation sans verrouillage dans ce groupe | Maîtrise | Non |
| 23 | `sharp_search` | Sans détour | Atteindre le dénouement avec ≤ 10 % de requêtes vides | Maîtrise | Non |
| 24 | `chrono_180` | Contre la montre | Mode chronométré : dénouement en moins de 3 h | Chrono | Non |
| 25 | `chrono_90` | Archiviste éclair | Mode chronométré : dénouement en moins de 90 min | Chrono | Non |
| 26 | `annotated` | Notes de l'atelier | Lire 10 notes d'auteur en Archives annotées (Nouvelle partie +) | Re-jeu | Non |

Total : 26 entrées dont 4 « gabarits » (`branch_[x]`, `secret_[x]`, `ending_[x]`) qui se
déclinent par affaire : avec les valeurs proposées (2 + 3 + 3), l'affaire du MVP compte
**30 succès** au maximum. Si on vise 26 au total, réduire les déclinaisons à 1 + 2 + 2 ou
fusionner `catalogue_50` et `sharp_search`.

## Notes d'implémentation

- Les conditions s'appuient uniquement sur les **statistiques** et événements déjà prévus dans
  `GAME_DESIGN.md` §13.6 (documents lus, requêtes, évaluations, verrouillages, secrets, fins,
  chrono) : pas de télémétrie supplémentaire.
- `clean_lock` : « évaluation sans verrouillage » = évaluation R1 qui n'atteint pas le seuil
  (GAME_DESIGN §7.4). Le groupe doit faire ≥ 3 cases.
- Les succès se stockent au **profil** (hors emplacements) ; effacer une sauvegarde ne les retire
  pas.
- Notification : bandeau discret 4 s (hors modal, sans son si l'option « effets » est à 0),
  annoncé au lecteur d'écran ; jamais pendant une carte de révélation (mis en file).
- Plateformes : écran interne au MVP ; mapping vers les succès Steam préparé (ids stables) si
  Steam arrive plus tard.

## Questions à trancher

1. Nombre cible : **26 fixes** ou **30 avec déclinaisons** par affaire ?
2. Faut-il des succès **propres à chaque affaire** (DLC) comptés à part des succès génériques ?
3. Seuils chrono (3 h / 90 min) : à recalibrer après les premiers playtests.
4. `sharp_search` pénalise-t-il implicitement l'exploration libre du Catalogue ? (alternative :
   le remplacer par « Retrouver un terme par alias »).
