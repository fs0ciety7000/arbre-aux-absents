# Affaire 2 — « Le Revenant de Hautcorvin » : règles de jeu propres

> Auteur : `game-designer` · v0.1 · 14 oct. 2026 · mise à jour 2.0 (~28 cases, ~95 pièces)
> Complète `GAME_DESIGN.md`, `ECRANS.md` et `SUCCES.md` ; ne les contredit pas. L'histoire
> (noms, pièces, textes de fin) relève du scénariste (`docs/scenario/hautcorvin/`), la
> répartition en groupes et la solvabilité du level-designer, le contrat de l'architecte.
> Les noms cités viennent du concept validé (piste C) et restent provisoires.
> **Spoilers complets.**

Rappel : un homme dépose une requête en réinscription : « Je suis Bastien Tessonnal. » La case de
Bastien arrive **déjà remplie par sa déclaration**, avec son visage. Elle est fausse : le requérant
est Andrin Dalvarin, demi-frère de Bastien, qui appartient à la case « ? » (l'enfant non reconnu
d'Honoré). Le joueur doit défaire la déclaration et reposer chaque pièce à sa place.

---

## 1. La case revendiquée

### 1.1 Définition

- **Case revendiquée** : case dont les champs sont pré-remplis au début de la partie par une
  **déclaration** (valeurs fournies par le contenu), mais **non établie**. Elle se joue comme une
  case ordinaire : le joueur peut tout retirer, tout remplacer, tout rétablir.
- Distincte de la case `prefilled` du prologue (connue d'emblée, **établie** d'office et hors groupe).
- Affaire 2.0 : **exactement une** case revendiquée (Bastien). Le moteur en accepte 0 à 3 par affaire
  (réserve pour les affaires suivantes).

### 1.2 État d'un champ : déduit, pas mémorisé

Un champ d'une case revendiquée est **déclaré** tant que sa valeur est **égale à la valeur de la
déclaration**, quelle que soit la façon dont elle y est arrivée (jamais touchée, ou rétablie, ou
re-choisie dans la liste). Sinon il est **vide** ou **posé** (par le joueur). Aucun drapeau de
provenance à sauvegarder : l'état se calcule depuis `SlotGuess` et la déclaration.

La case porte la marque « revendiquée » tant qu'**au moins un** champ est déclaré, et la perd à
l'établissement. Vidée de toute déclaration, elle s'affiche comme une case ordinaire ; « Rétablir la
déclaration » reste dans son menu.

### 1.3 Affichage (forme, pas seulement couleur)

| État de la case | Signes (cumulatifs, chacun suffit seul) |
|---|---|
| **Ouverte** (vide) | Titre « ? », `Icon unknown-person`, opacité 0,88 (DESIGN §13.3, inchangé) |
| **Remplie** par le joueur | Fiche ordinaire, valeurs dans la police de saisie du joueur |
| **Revendiquée** | 1. **Cartouche « Déclaré »** en tête de fiche (hauteur 20 px, texte + icône **agrafe** 16 px) ; 2. **bord en tirets** 2 px (tiret 6 / espace 4) au lieu du bord plein ; 3. chaque champ déclaré précédé de **guillemets « »** et écrit en Courier Prime (formulaire tapé) ; 4. pas de cadenas, pas de tampon |
| **Établie** | Tampon « Établi » + cadenas (inchangé) ; cartouche, tirets et guillemets disparaissent |

- Un champ **posé** dans une case revendiquée reprend la police du joueur et perd ses guillemets :
  on lit d'un coup d'œil ce qui vient de la requête et ce qui vient du joueur.
- Rendu exact (teinte du cartouche, papier « formulaire ») : `design-lead`, avec un token dédié
  documenté dans `DESIGN.md` §13.3. Contraste AA du cartouche, 7:1 en contraste élevé.
- Compteur `identifiés N / T` : une case revendiquée **ne compte pas** tant qu'elle n'est pas établie.

### 1.4 Actions

Sur la case (menu contextuel) et dans sa fiche :

| Action | Effet | Confirmation |
|---|---|---|
| **Retirer** (un champ) | Vide le champ | Seulement si l'option « confirmer avant d'effacer un champ » est active (GAME_DESIGN §17) |
| **Remplacer** (un champ) | Ouvre le Sélecteur P10 ; en tête de liste, une ligne non sélectionnable « Déclaré : *valeur* (requête) » | Non |
| **Retirer la déclaration** | Vide **tous** les champs encore déclarés (les champs posés restent) | Non (réversible) |
| **Rétablir la déclaration** | Remet les valeurs déclarées dans les 4 champs | Oui **si** elle écrase ≥ 1 champ posé : « Remplacer N champ(s) posé(s) par la déclaration ? » |
| **Voir la requête** | Ouvre la pièce de requête dans le Lecteur | Non |
| **Déplacer vers…** (souhaitable, tout champ rempli, toute case) | Choisir une case cible : la valeur y est posée dans le même champ et la source est vidée, en **une** action (une seule évaluation R1 par groupe touché) | Si la cible a déjà une valeur : « Remplacer *X* ? » |

« Rétablir » et « Voir la requête » restent disponibles jusqu'à l'établissement : retirer n'est
jamais une perte (P3). Les valeurs déclarées sont aussi des **candidats découverts** dès la
première pièce (la requête), donc re-sélectionnables dans les listes.

### 1.5 Validation par groupes

- Une case revendiquée est **complète** dès le départ ; elle est donc **en jeu** dans son groupe
  (§7.4) au même titre qu'une case remplie par le joueur. Aucune règle R1–R9 ne change.
- **Pas d'évaluation au chargement** : R1 ne se déclenche qu'au premier changement d'une case du
  groupe (y compris un champ de la case revendiquée).
- La déclaration est **toujours fausse sur ≥ 1 champ** (vérifié par `content:check`) : elle ne peut
  jamais s'établir seule.
- **Groupe du requérant (recommandation au level design)** : la case revendiquée, la case « ? » et
  la case d'Agnès forment un groupe de **3 cases, seuil 3**. Les trois s'établissent ensemble ou pas
  du tout. Raison : avec un groupe plus large, les autres cases s'établiraient autour d'une
  revendiquée restée ouverte et le système dirait « la déclaration ne tient pas » à la place du
  joueur (déduction par R5 au lieu des pièces). Avec 3 / 3, rien ne fuit avant la vraie déduction
  (retirer le visage du requérant de Bastien, le poser dans « ? », identifier Agnès).
- Aide niveau 2 (« N case(s) correcte(s) en jeu ») : inchangée ; elle peut laisser deviner qu'une
  case du trio est fausse. C'est une aide choisie, donc acceptable.
- Indices niveau 3 sur la case revendiquée : palier 1 = « La déclaration est une pièce comme une
  autre : recoupez-la. » (texte du contenu) ; la Révélation remplace un champ déclaré faux par le juste.

### 1.6 Visages qui vieillissent

Le requérant apparaît sur **3 visages** (1938, 1944, 1976) et Bastien sur au moins 1. Règle :
le champ portrait d'une case accepte **tout visage rattaché à la personne** dans les données
(alias de visage, comme les alias de termes). Le joueur n'est jamais puni d'avoir choisi le
« mauvais âge » du bon homme ; la difficulté porte sur *qui*, pas sur *quand*. Leurres : le
demi-frère ressemblant compte comme leurre de l'autre (≥ 1,3 visage par case tenu).

### 1.7 Retours

- **Aucun retour de justesse** au retrait ou au remplacement (P1, R4, R5).
- Retirer un champ déclaré : la valeur glisse hors de la fiche en 200 ms (0 ms en mouvement
  réduit), son « agrafe ôtée » (effets, synthétisé comme le reste, AUDIO.md), pas de vibration.
- Première modification d'une case revendiquée dans la partie : entrée au Journal « Déclaration
  contestée : *champ* » (constat d'action, pas de verdict).
- Établissement de la case : comme toute case (tampon, cadenas, annonce), puis la carte de
  révélation du jalon si le contenu en prévoit une.

### 1.8 Lecteur d'écran

Nom accessible de la case, dans la liste hiérarchique de l'arbre (§17) :
« Génération 3, case revendiquée, non établie. Prénom : Bastien, déclaré. Nom : Tessonnal,
déclaré. Portrait : visage 12, photographie de la requête, déclaré. Métier : graveur, posé par
vous. » Annonces (région live polie) :

| Événement | Annonce |
|---|---|
| Champ retiré | « Portrait déclaré retiré. Rétablir la déclaration : menu de la case. » |
| Champ remplacé | « Portrait : visage 4, posé. 2 champs déclarés sur 4. » |
| Déclaration retirée / rétablie | « Déclaration retirée : 3 champs vidés. » / « Déclaration rétablie. » |
| Déplacé | « Visage 12 déplacé de *Bastien Tessonnal* vers *case inconnue, génération 3*. » |

### 1.9 Contrôles (parité, ECRANS §4.5)

| Action | Souris | Tactile | Clavier | Manette |
|---|---|---|---|---|
| Ouvrir la fiche / un champ | Clic | Toucher la case → fiche en feuille basse, lignes de 56 px | Flèches + `Entrée` | Croix + A |
| Retirer un champ | Bouton `×` du champ (cible 44 × 44) | `×` du champ dans la fiche | `Suppr` sur le champ focalisé | X → « Retirer » |
| Remplacer | Clic sur le champ, ou glisser un candidat dessus | Toucher le champ, ou appui long + glisser | `Entrée` sur le champ | A sur le champ ; ou « Prendre » / « Déposer » |
| Menu de la case (retirer / rétablir la déclaration, voir la requête, déplacer) | Clic droit | Appui long (400 ms, réglable) | `Menu` / `Maj+F10` | X |
| Déplacer vers… | Glisser le champ rempli sur une autre case **ou** menu | Menu (le glisser d'une case à l'autre n'est pas requis) | Menu → flèches pour la case cible → `Entrée` | Menu → croix → A ; B annule |

Aucun raccourci nouveau : tout passe par les touches et le menu contextuel existants.

---

## 2. Choix et entrée dans l'affaire 2

### 2.1 Titre (E02) et Nouvelle partie (E04)

- **Continuer** reprend le dernier emplacement joué, toutes affaires confondues ; sous-titre
  « *Le Revenant de Hautcorvin* — 42 % ».
- **E04** remplace la liste déroulante d'affaires par des **chemises** (une par affaire, cible
  entière ≥ 72 px de haut ; empilées sous 600 px, côte à côte au-delà), chacune avec : titre, cote du
  dossier, durée indicative (affaire 2 : 4 h 30 – 7 h), état (« Non ouvert » / « En cours, 42 % » /
  « Rapport remis · fins vues 2 / 4 »).
- Sélection par défaut : l'affaire jamais commencée la plus ancienne ; sinon la dernière jouée.

### 2.2 Accès libre (défaut recommandé)

- L'affaire 2 est **ouverte dès le premier lancement**, sans avoir fini l'affaire 1.
- Joueur qui n'a pas remis le rapport de l'affaire 1 : la chemise porte une mention, pas un verrou :
  « Se joue seule. Conseillé après *Succession Varenque* : quelques visages y reviennent, sans
  rien en dévoiler. » Aucune confirmation supplémentaire.
- **Règle de contenu (scénariste)** : les caméos (Teodor Haask, Lise Daubry, Claude Sauge,
  rapporteur titularisé) sont **neutres vis-à-vis de l'affaire 1** : ni secret, ni fin, ni choix de
  l'affaire 1 n'est supposé ou révélé (pas de « fin canonique »). Le profil n'influence pas le
  contenu de l'affaire 2.
- Démo itch.io : inchangée (affaire 1 seule).

### 2.3 Sauvegardes séparées

- **3 emplacements + 1 secours par affaire** (E03 : onglets par affaire, l'onglet de l'affaire
  choisie en E04 ouvert d'office). Une partie de l'affaire 2 n'écrase jamais une partie de l'affaire 1.
- Migration : les sauvegardes existantes sont rangées sous l'affaire 1, sans perte.
- Profil (options, succès, tutoriel) commun ; **statistiques, chrono et Nouvelle partie +** par
  affaire (débloqués par le dénouement **de cette affaire**).
- Rien ne passe d'une affaire à l'autre : carnet, galerie, épingles et carte repartent de zéro
  (les lieux de l'affaire 1 restent en décor gravé, sans étiquette, jusqu'à leur mention).

### 2.4 Tutoriel allégé

E04 propose « Notes de service » à trois crans :

| Cran | Contenu | Défaut si… |
|---|---|---|
| **Complètes** | Les 10 bulles du tutoriel + les 3 nouveautés ci-dessous | ni rapport de l'affaire 1 remis, ni tutoriel terminé (`Profile.tutorial.done` faux) |
| **Nouveautés seulement** | 1 bulle d'accueil « titulaire » + les 3 nouveautés | rapport de l'affaire 1 remis **ou** tutoriel terminé |
| **Aucune** | Rien ; tout reste dans Aide › Comment jouer | — |

Les 3 nouveautés (≤ 25 mots chacune, une action attendue, jamais bloquantes, ids préfixés `hc-`,
montrées une fois par profil, réactivables dans Options) :

1. `hc-claim` — premier affichage de l'arbre : « Le requérant a rempli cette case lui-même. Rien n'y
   est établi : retirez ou remplacez ce qui ne tient pas. » (cible : la case revendiquée)
2. `hc-hearing` — première ouverture d'un procès-verbal d'audition : « Le requérant a été entendu.
   Ses réponses sont des pièces comme les autres : recoupez-les. »
3. `hc-decision` — ouverture du rapport final : « Ce rapport se conclut par une décision. Vous
   pourrez en remettre un autre après le dénouement. »

Aide › Comment jouer gagne une fiche « Cases revendiquées » (5 lignes + une illustration de case).
Le prologue (groupe de 3 cases autour de la requête, 10–15 min) existe dans les trois crans ; seul
le nombre de bulles change.

---

## 3. Le choix final

### 3.1 Où

Dans le **rapport final** existant (P15, `report` du contrat), une fois l'arbre complet : questions
du scénariste sur les secrets (ex. « Qui a mis le feu en 1937 ? »), puis une **décision** de type
`choice`, dernière étape avant « Remettre le rapport ». Pas avant : « laisser vivre le mensonge » n'a
de sens que si le joueur sait que c'en est un, et l'arbre complet l'établit (le visage du requérant
est dans « ? »).

### 3.2 Les trois tampons

Présentés comme trois tampons de décision, avec l'**effet administratif** (ce que fait l'Office),
jamais l'issue narrative :

| Option | Libellé (indicatif) | Disponible |
|---|---|---|
| **Dénoncer** | « Rejeter la requête et signaler l'usurpation d'identité. » | Toujours |
| **Rétablir chacun** | « Réinscrire Bastien Tessonnal à titre posthume ; reconnaître Agnès Neviot, sa fille, et Andrin Dalvarin, fils d'Honoré. » | Si le secret **filiation d'Agnès** (preuve par deux pièces) est découvert |
| **Laisser vivre le mensonge** | « Recevoir la requête : inscrire le requérant sous le nom de Bastien Tessonnal. » | Toujours |

Pourquoi cette dissymétrie : sans la preuve de la filiation, le joueur se retrouve **exactement
dans la situation d'Andrin** (mentir est le seul moyen de faire hériter Agnès). Avec la preuve, il
découvre l'ironie de l'affaire : le mensonge n'était pas nécessaire. Le dilemme du personnage
devient celui du joueur, et la meilleure issue se gagne par la déduction, pas par un clic.

- Option indisponible : affichée **grisée avec sa raison** (« La filiation d'Agnès n'est pas
  établie par deux pièces. ») et un bouton « Revenir au dossier » : le joueur sait qu'une piste
  reste ouverte (P3). (Variante à trancher : la masquer, comme dans l'affaire 1.)
- Aucune option n'est présentée comme « la bonne ». « Laisser vivre » a un coût réel écrit par le
  scénariste (Andrin perd son propre nom et celui de sa mère ; il porte une condamnation pour
  l'incendie si le secret de 1937 n'est pas prouvé).
- Confirmation : « Apposer ce tampon ? » ; focus initial sur « Relire » ; texte : « Vous pourrez
  remettre un autre rapport après le dénouement. »
- Disposition : 3 cartes empilées (≥ 72 px de haut) sous 600 px, en ligne au-delà. Clavier :
  groupe radio (flèches, `Entrée`) ; manette : croix + A, B = retour ; lecteur d'écran :
  `radiogroup` « Décision de l'Office », option indisponible `aria-disabled` + raison en description.

### 3.3 Conséquences visibles

- **Dénouement** composé (GAME_DESIGN §13.2) : tronc commun + paragraphes par secret + conclusion
  selon la décision, avec la **liste des héritiers** (comme l'affaire 1).
- **Arbre après le dénouement** (« Continuer l'enquête ») : une **mention marginale** (Courier
  Prime, ≤ 40 caractères, sous la fiche) sur les 3 cases du trio, selon la décision. Exemples :
  « Requête rejetée, 1976 » · « Réinscrit à titre posthume » · « Inscrit vivant, 1976 ». Remettre un
  autre rapport remplace les mentions.
- **Journal** : entrée « Décision : *tampon* » ; **chemise E04** : tampon de la dernière décision ;
  **Bonus** : « fins vues N / 4 ».

### 3.4 Fins (structure ; textes : scénariste)

| Prio | Fin | Condition |
|---|---|---|
| 1 | Chacun son nom | Décision « Rétablir chacun » |
| 2 | Le revenant | Décision « Laisser vivre » (paragraphe variable : secret de 1937 prouvé ou non) |
| 3 | L'imposteur, la fille reconnue | « Dénoncer » + filiation d'Agnès prouvée |
| 4 | L'imposteur | « Dénoncer » sans la filiation |

**Épilogue 100 %** (arbre + tous les secrets) : **indépendant de la décision**, avec un paragraphe
qui la rappelle. Aucune décision morale n'est récompensée par du contenu exclusif (à la différence
de l'affaire 1, où F5 exige « inscrire » ; à confirmer par l'humain).

---

## 4. Succès propres à l'affaire 2

Ids préfixés `hc-` (le profil range les succès par id : pas de collision avec l'affaire 1). Les
succès génériques déjà obtenus (première pièce, première fiche…) ne sont **pas** redéclarés.
Mêmes règles que `SUCCES.md` : aucun ne récompense l'absence d'aide, aucun n'est manquable
(« Remettre le rapport » permet toutes les décisions dans une même partie). Toutes les conditions
s'écrivent avec le vocabulaire existant (`locked`, `groupLocked`, `secret`, `read`, `searched`,
`visited`, `endingReached`, `answered`, `timedUnderMs`, `not`).

| # | ID | Titre provisoire | Condition | Caché |
|---|---|---|---|---|
| 1 | `hc-deux-pieces-pour-un-vivant` | Deux pièces pour un vivant | Établir une première série de cases | Non |
| 2 | `hc-fin-du-prologue` | La requête est recevable | Établir le groupe du prologue | Non |
| 3 | `hc-a-mi-chemin` | À mi-pente | Établir 14 cases | Non |
| 4 | `hc-l-arbre-de-hautcorvin` | L'arbre de Hautcorvin | Établir les ~28 cases | Non |
| 5 | `hc-le-revenant` | Le revenant | Établir la case revendiquée | Non |
| 6 | `hc-l-homme-du-couloir` | L'homme du couloir | Établir la case « ? » | Oui |
| 7 | `hc-les-maitres-verriers` | Les maîtres verriers | Établir la branche Tessonnal | Oui |
| 8 | `hc-les-guides-de-vernezac` | Les guides de Vernezac | Établir la branche Neviot | Oui |
| 9 | `hc-sous-la-neige` | Ce que la neige recouvre | Découvrir un premier secret | Non |
| 10 | `hc-le-feu-de-1937` | Le feu de 1937 | Découvrir qui a mis le feu à la verrerie | Oui |
| 11 | `hc-le-pas-de-l-ourse` | Le Pas de l'Ourse | Découvrir le passage des radiés | Oui |
| 12 | `hc-tous-les-secrets` | Plus rien sous la neige | Découvrir tous les secrets | Non |
| 13 | `hc-imposture` | Usurpation | Remettre un rapport qui dénonce le requérant | Oui |
| 14 | `hc-chacun-son-nom` | Chacun son nom | Voir la fin « Chacun son nom » | Oui |
| 15 | `hc-laisser-vivre` | Le mensonge vivant | Inscrire le requérant sous le nom de Bastien | Oui |
| 16 | `hc-trois-tampons` | Trois tampons | Avoir vu une fin de chaque décision (`all` de 3 `endingReached`, `any` pour « Dénoncer ») | Non |
| 17 | `hc-epilogue` | Dégel | Atteindre l'épilogue de l'affaire | Non |
| 18 | `hc-tout-lu` | Tout le dossier | Lire toutes les pièces de l'affaire | Non |
| 19 | `hc-la-haute-vallee` | La haute vallée | Ouvrir les 4 nouveaux lieux | Non |
| 20 | `hc-trop-juste` | Il répond trop juste | Lire tous les procès-verbaux d'audition | Oui |
| 21 | `hc-matricule` | Matricule | Chercher au Lecteur le matricule de Kessaar du requérant | Oui |
| 22 | `hc-un-visage-ment-moins` | Un visage ment moins qu'un registre | Établir la case « ? » sans avoir lu l'expertise d'écriture | Oui |
| 23 | `hc-contre-la-montre` | Contre la montre | Chrono : rapport en moins de 2 h 30 | Non |
| 24 | `hc-archiviste-eclair` | Verrier éclair | Chrono : rapport en moins de 75 min | Non |

Seuils chrono réduits au prorata de la taille (≈ 80 % de l'affaire 1), à recalibrer en playtest.
Succès écarté faute de condition dans le contrat : « Déclaration contestée » (retirer un premier
champ déclaré), qui demanderait un événement non monotone ; le n° 5 le couvre.

---

## 5. Vue « comparer deux pièces côte à côte » : hors 2.0, en backlog

**Décision : hors périmètre de la 2.0.** Le contenu de l'affaire 2 doit être **solvable sans elle**.

Raisons :
1. **Parité (P5)** : sur 360 px, deux pièces côte à côte font 2 × 180 px, illisibles. Une vue
   réservée au bureau et à la tablette en paysage ne peut pas porter la déduction ; elle ne serait
   qu'un confort, et un confort inégal selon l'appareil.
2. **Les ponts existent déjà** : Arbre + Lecteur côte à côte (desktop), mini-lecteur (téléphone),
   Galerie des visages (vignettes côte à côte), Tableau d'épingles.
3. **La comparaison est diégétique, et c'est mieux** : les rapprochements clés (écriture 1938 /
   1976, visages à trois âges, verre gravé) sont livrés par des **pièces d'expertise** qui
   contiennent leurs propres **planches comparatives** (contenu seul, dans l'esprit du carnet
   d'*Obra Dinn* qui compare à la place du joueur sans conclure pour lui). L'expertise montre ;
   elle ne conclut pas.
4. **Coût et risque** : deux états de Lecteur, gestion du focus et du lecteur d'écran, zoom
   synchronisé, sur la seule mise à jour qui touche déjà au contrat (case revendiquée).

**Backlog (spécification courte pour plus tard)** : « Comparer avec… » depuis le Lecteur ;
≥ 1280 px et tablette paysage : 2 volets 50 / 50, zoom et défilement synchronisables (bascule) ;
téléphone et tablette portrait : **bascule A / B** sur place (même zoom, même position, bouton et
balayage), qui reste utile à 360 px. `ECRANS.md` §3.1 promet déjà « jusqu'à 2 documents comparés » :
cette promesse relève du même backlog.

---

## 6. À signaler hors `docs/game/`

- **Contrat / moteur (architect, backend)** : déclaration sur `TreeSlot` (4 valeurs) distincte de
  `prefilled` ; `newGame` qui pose la déclaration sans verrouiller ; action « déplacer un champ » ;
  alias de visages par personne (§1.6) ; emplacements de sauvegarde par affaire + migration ;
  succès et tutoriel `seen` sans collision d'ids ; mentions marginales par fin (§3.3).
- **`content:check`** : déclaration fausse sur ≥ 1 champ ; ses valeurs découvertes par une pièce de
  départ ; case revendiquée dans un groupe ; solveur qui part de l'état déclaré.
- **Level-designer** : trio 3 / 3 (§1.5) ; dernières cases du trio les mieux documentées (R8) ;
  leurres de visages entre demi-frères.
- **Scénariste** : caméos neutres (§2.2) ; coûts de « laisser vivre » ; textes des 4 fins et des
  mentions marginales ; 3 bulles `hc-`.
- **Design-lead** : token et rendu de la case revendiquée ; chemises d'affaire en E04 ; tampons de
  décision. **Audio** (proposition) : ambiance d'hiver pour le Bureau de l'affaire 2 (vent, poêle,
  pas de pluie), mêmes humeurs.
