# Affaire 3 — « Les Marques de Longuegrève » : règles de jeu propres

> Auteur : `game-designer` · v0.1 · 16 oct. 2026 · mise à jour 3.0 (32 cases, 109 pièces + 2)
> Complète `GAME_DESIGN.md`, `ECRANS.md`, `SUCCES.md` et `AFFAIRE-2.md` ; ne les contredit pas.
> L'histoire (noms, pièces, textes de fin) relève du scénariste (`docs/scenario/affaire-3/`), la
> répartition en groupes, les conditions et la solvabilité du level-designer (`docs/level/`), le
> contrat de l'architecte. Noms provisoires (piste B, choisie par le propriétaire).
> **Spoilers complets.**

Rappel : les Domaines veulent exproprier l'île de Longuegrève ; il faut les ayants droit des quatre
chefs de maison de la matrice de 1868. Personne là-bas ne signait : chacun **faisait sa marque**, et
la marque dit la maison, le rang, la fille, l'épouse, l'enfant que la mer a donné. Pour 19 des 32
cases, le champ du visage devient un champ **Marque**. Le joueur apprend une grammaire (planche I du
carnet Marest, pièce de départ) et la lit sur les registres, les avirons et les croix.

---

## 0. Décisions de ce document (résumé)

| # | Sujet | Décision | Alternative écartée (à reprendre si l'humain tranche autrement) |
|---|---|---|---|
| D1 | Champ Marque | Une marque **est** un `PortraitId`. La **case** porte le type de son champ (`portraitKind: 'face' \| 'mark'`, défaut `face`) ; l'image porte le sien (`Portrait.kind`). Validation **inchangée** (même hachage, même champ `portrait`). | Champ séparé `mark` dans la réponse : double le moteur, la sauvegarde et le hachage pour rien. |
| D2 | Marque dans le texte des pièces | Nouvel inline `::mark[<portraitId>]` (contrat) : la marque est dessinée **à côté du nom** qu'elle signe ; elle rejoint d'office la galerie. | `::signature[marque : …]` en texte : la liaison nom ↔ marque passerait par la description écrite, la lecture visuelle disparaîtrait. Repli acceptable si le contrat refuse. |
| D3 | Pièces sonores | Nouveau type **`recording`** (transcription affichée, **aucun audio**). | `report` avec en-tête « Bande » : mélangé aux 9 rapports de 1908 dans le filtre des Archives, faux libellé, pas de déclencheur propre. |
| D4 | Codes de marque en recherche | **Notation Marest révisée**, lettres seules : grain = `i`, barre = `b`, talon = `+X` ; chaque code indexé aussi sous « **marque** + code ». **Aucun changement de moteur.** | Garder `·` et `/` en changeant `normalize` et `MIN_QUERY_LENGTH` : touche le hachage partagé et les affaires 1–2. |
| D5 | Noël sans parents de sang | **Simple absence de lien** ; Noël placé dans la colonne de Siméon et Ursule. | Pointillé « accueilli » : nouvelle relation au contrat, au compilé, au tracé et au lecteur d'écran ; backlog 3.1. |
| D6 | Rapport final | Mécanique de l'affaire 2 telle quelle : Q1–Q4 (`question`), puis tampon (`choice`) ; tampons indisponibles **grisés avec leur raison**. | Masquer les tampons indisponibles (affaire 1). |
| D7 | Fins | Sections et F3 conditionnées par la **réponse juste** au rapport (`answered`), comme l'affaire 2. | Conditionner par `secret` seul (le rapport ne servirait à rien). |

---

## 1. Le champ Marque

### 1.1 Définition

- **Case à marque** : case dont `portraitKind` vaut `mark`. Son champ « portrait » attend une
  **marque** (dessin de la grammaire, `Portrait.kind = 'mark'`). Toutes les autres cases restent des
  cases à visage (`portraitKind` absent = `face`) : affaires 1 et 2 inchangées.
- C'est une **donnée de case**, pas de personne : Blaise a une marque dans sa case (C13) et un visage
  sur une photo de 1889 qui ne va dans aucune case. La personne garde `portrait` (sa marque) et
  `altPortraits` (sa marque de fille, s'il y en a une).
- Affaire 3.0 : **19 cases à marque**, 13 à visage (`docs/scenario/affaire-3/02-arbre.md` §3).
- **Validation identique** (GAME_DESIGN §7.4, R1–R9) : le champ `portrait` est comparé au hachage
  de `portrait` puis de `altPortraits`. Aucune règle propre aux marques.
- **Marque de fille** (`Y-i`, `P-i`, `O-i`, `P-ii`) : acceptée comme second état de la case de
  l'épouse (`altPortraits`), exactement comme un « autre âge » d'un visage (AFFAIRE-2 §1.6). Le joueur
  n'est jamais puni d'avoir choisi la marque d'avant le mariage : la difficulté porte sur *qui*, pas
  sur *quand*.

### 1.2 Affichage sur l'arbre

| Élément | Case à visage | Case à marque |
|---|---|---|
| Libellé du champ (fiche, sélecteur, lecteur d'écran) | « Portrait » (inchangé) | « **Marque** » |
| Cadre vide | Silhouette `unknown-person` | **Pied seul** (trait vertical, sans tête), icône `unknown-mark` |
| Rendu rempli | Visage, 72 px de haut (DESIGN §10) | Marque en rendu **relevé**, 72 px de haut, trait `currentColor` sur papier |
| Fiche ouverte | 320 px | 320 px, plus la **description verbale** sous l'image (§1.6) |

- Le libellé est affiché **en permanence** sur la case (bande de 16 px sous le cadre, texte
  « Marque ») : le joueur n'a jamais à deviner quel champ est attendu (bulle `mark`, §5).
- Forme, pas couleur : le cadre d'une case à marque a les **coins coupés à 45°** (6 px) au lieu
  d'arrondis. Lisible en niveaux de gris et en contraste élevé.
- Le code de la marque (`Y-d`) **n'est jamais affiché** par l'interface (case, galerie, sélecteur) :
  il n'existe que dans les pièces qui l'écrivent (carnet Marest). Le déduire fait partie du jeu (§2).

### 1.3 Collecte

- Une marque devient **candidate** (galerie, sélecteur) quand le joueur lit une pièce qui la
  **montre** : inline `::mark[…]` dans le texte, ou `reveals.portraits` du frontmatter (objets,
  photographies d'avirons et de croix). Même règle que les visages.
- Toute pièce qui **dessine** une marque la révèle, quel que soit son support : autographe, croix,
  relevé de Marest, copie de commis (D9), gravure (D10, D11). La règle R7 (« seule compte la marque de
  l'île ») est une règle **de déduction** pour le joueur et **de solvabilité** pour le level-designer
  (≥ 2 pièces par marque juste, dont ≥ 1 autographe ou croix) ; elle n'est **pas** codée dans la
  collecte. Raison : les leurres doivent être collectables pour jouer leur rôle, et le moteur n'a pas
  à dire « cette marque est une copie » à la place du joueur.
- Une marque **dite** (bande de 1964, témoignage) ne se collecte jamais : une pièce `recording` n'a
  ni `::mark` ni `reveals.portraits` (§3, vérifié par `content:check`).
- Ratio de candidats (GAME_DESIGN §7.3) calculé **par type** : ≥ 1,5 marque candidate par case à
  marque (3.0 : 34 / 19 = 1,79) et ≥ 1,5 visage par case à visage (3.0 : ≥ 20 visages pour 13 cases).

### 1.4 Galerie (P11) : onglets Visages / Marques

- Si l'affaire contient au moins une marque (`Portrait.kind = 'mark'`), la Galerie s'intitule
  « **Galerie** » et porte deux onglets : « Visages (N) » et « Marques (N) ». Sinon, rien ne change
  (« Galerie des visages », affaires 1 et 2).
- Numérotation **par onglet** : « Visage n° 4 », « Marque n° 4 » ; ordre de collecte.
- Onglet ouvert par défaut : le dernier utilisé ; au premier passage, celui qui contient le plus
  récent élément collecté.
- Chaque vignette de marque : le dessin (≥ 96 px de haut ; 2 colonnes à 360 px), son numéro, sa
  **description verbale** en clair, « Vu dans : … » (liens vers les pièces), « Utilisée dans N
  case(s) ». Pas de code.
- Filtre texte de la galerie et du sélecteur : il porte aussi sur la description (« entaille à
  droite », « petite Potence ») : c'est un outil de lecture, pas une révélation.
- Lecteur de pièce : la section « Visages de ce document » devient « **Marques de ce document** »
  pour les marques (deux sections si la pièce montre les deux).

### 1.5 Sélecteur (P10) et dépôt

- Ouvrir le champ d'une case à marque ouvre le sélecteur **sur les marques seules** ; celui d'une
  case à visage, sur les visages seuls. Aucun basculement : l'autre type ne peut jamais être juste,
  le proposer serait de la friction sans déduction. Le type est déjà affiché sur la case : aucune
  information nouvelle n'est donnée.
- Dépôt d'un élément du mauvais type (glisser, ou « Utiliser dans l'arbre » puis choix de la case) :
  **refusé sans rien modifier**, annonce neutre « Ce champ attend une marque. » / « Ce champ attend
  un portrait. » (région live polie, 4 s à l'écran). Ce n'est pas un retour de justesse : il ne dit
  rien de la personne.
- En mode « prendre → déposer » (clavier, manette), la liste des cases cibles n'offre que les cases
  du bon type ; les autres sont présentes mais `aria-disabled`, avec la même raison.

### 1.6 Description verbale normalisée (texte alternatif)

Gabarit unique, fixé par la bible (`09-marques.md` §2) ; **jamais** « une marque » sans description :

> « **[Tête]** ; pied : **[lisse | barré | entaille à gauche | entaille à droite]**[, puis **[entaille…]**] ;
> **[un grain | deux grains]** ; talon : **[petite Fourche | petit Œil | petite Flèche | petite Potence]** »

- Segments absents omis ; ordre toujours tête → pied → grains → talon (l'ordre de lecture de la
  planche I). Vocabulaire **fermé** de 14 termes (4 têtes, lisse, barré, entaille à gauche/droite,
  puis, un/deux grains, talon + 4 petites têtes), vérifié par `content:check` sur tout `Portrait.alt`
  de type `mark` (FR et EN).
- Longueur ≤ 110 caractères. Le code n'y figure pas.
- Nom accessible d'une case à marque : « Génération 2, case non établie. Prénom : Blaise. Nom :
  Goémard. Marque : Fourche ; pied : entaille à droite. Métier : vide. »
- Inline `::mark` en mode **Transcription** : remplacé par « [marque : *description*] » en Courier
  Prime ; en mode **Original** : le dessin, avec la description en nom accessible et en info-bulle.
- Option d'accessibilité **« Décrire les marques sur l'arbre »** (désactivée par défaut, réglable à
  tout moment, sans marquage de la sauvegarde) : affiche la description sous la marque sur la case
  (2 lignes max, 12 px, ellipse ; complète dans la fiche).

### 1.7 Lisibilité du dessin (exigences chiffrées, au `cartographe` et au `design-lead`)

| Mesure (gabarit : pied = 100 unités) | Minimum | Pourquoi |
|---|---|---|
| Épaisseur du trait | 6 unités (≥ 4 px à 72 px) | Lisible à 72 px sur téléphone |
| Diamètre d'un grain | **8 unités** (la bible dit 4 : trop petit, ≈ 3 px à 72 px) | Distinguer `i` de `ii` à 72 px |
| Écart entre deux grains | 6 unités | Idem |
| Entaille | 12 unités de long, à 40 / 55 / 70 du haut (bible) | Le côté gauche/droite se lit à 48 px |
| Talon | Tête réduite au tiers, sous le pied, séparée de 6 unités | Jamais confondu avec une entaille |

- SVG monochrome en `currentColor` : suit le contraste élevé (7:1) et le thème papier.
- Inline `::mark` dans le texte : 2,5 em de haut (≥ 40 px à la taille de lecture par défaut) ; cible
  ≥ 44 × 44 px ; toucher / cliquer / `Entrée` ouvre la marque en grand (320 px) avec « Utiliser dans
  l'arbre ». Le zoom du Lecteur (×1 à ×4) s'y applique.
- Test d'acceptation : sur 360 px, 10 testeurs lisent sans zoom les 34 marques à 72 px avec ≥ 95 %
  de bonnes réponses sur le côté des entailles et le nombre de grains.

### 1.8 Contrôles (parité, ECRANS §4.5)

| Action | Souris | Tactile | Clavier | Manette |
|---|---|---|---|---|
| Changer d'onglet Visages / Marques | Clic | Toucher (onglets ≥ 44 px) | `←` / `→` dans la liste d'onglets | LB / RB (convention ECRANS §4.4) |
| Agrandir une marque d'une pièce | Clic | Toucher | `Tab` jusqu'à elle + `Entrée` | Croix + A |
| Poser une marque | Glisser sur la case, ou clic sur le champ | Toucher le champ, ou appui long 400 ms + glisser | `Entrée` sur le champ | A sur le champ ; ou « Prendre » / « Déposer » |

Aucun raccourci nouveau.

### 1.9 Retours

- Aucun retour de justesse au dépôt (P1, R4, R5) ; mêmes effets que pour un visage (son « carte
  posée », AUDIO.md).
- La bulle proposée `lg-mark-rule` (« premier dépôt d'une marque **refusée** ») est **écartée** :
  elle dirait qu'une marque est fausse, contraire à R4–R5. Remplacée par la bulle `mark-read` (§5),
  déclenchée par l'ouverture, pas par l'erreur.

---

## 2. Codes de marque et recherche

### 2.1 Constat (moteur actuel)

`normalize` (`packages/engine/src/normalize.ts`) remplace tout ce qui n'est ni lettre ni chiffre
par une espace, puis réduit ; `search` exige ≥ 2 caractères normalisés et une **égalité exacte**
avec un terme de l'index ; à la compilation, un terme déjà présent dans l'index est **ignoré sans
erreur** (premier arrivé). Avec la notation de la bible :

| Code (bible) | Normalisé | Problème |
|---|---|---|
| `Y`, `Y·`, `Y··` | `y` | 1 caractère : jamais cherchable ; et les trois se confondent |
| `A/+P` / `A+P` | `a p` | Honorine et Ursule confondues |
| `A/-g` (D7) / `A-g` (D1) | `a g` | Deux leurres confondus |
| `P-g·` (D8) / `P-g` (Fulbert) | `p g` | Leurre et marque juste confondus |
| `Y-d`, `Y d`, `Y.d`, `Y/d`, `Y–d` | `y d` | Bien : séparateurs équivalents |
| `Yd` | `yd` | Forme compacte : terme distinct, à déclarer |

`·` et `/` sont perdus, `+` et `-` ne sont que des séparateurs. La notation doit porter **toute**
l'information dans des lettres.

### 2.2 Notation retenue : notation Marest « à la machine »

Diégèse (à écrire par le scénariste dans OF-05 et OF-06) : Solange Marest tape son carnet à la
machine, qui n'a ni point médian ni barre commode ; elle note **le grain `i`** (« le point de l'i »)
et **la barre `b`**. Le perforateur du Lecteur LX-2 n'accepte que lettres et chiffres.

| Signe | Bible | Notation retenue | Exemple |
|---|---|---|---|
| Tête | `Y` `O` `A` `P` | inchangée | `Y` |
| Barre (R6) | `/` | **`-b`**, juste après la tête | `A-b`, `A-b+P`, `A-b-g` |
| Entaille aîné / puîné | `-g` / `-d` | inchangée | `O-g-g` |
| Grain aînée / cadette | `·` / `··` | **`-i` / `-ii`** | `Y-i`, `P-ii`, `P-g-i` |
| Talon | `+X` | inchangé (le `+` est un séparateur ; une tête après la première lettre est **toujours** un talon) | `Y-g+P` |

Analyse sans ambiguïté : tête ∈ {y, o, a, p} ; puis `b` facultatif ; puis 0 à 2 lettres parmi {g, d} ;
puis `i` ou `ii` facultatif ; puis une tête facultative (talon). Les 30 marques codées de la bible (34 dessins
moins D3, D9, D10, D11, sans code) donnent **30 formes normalisées distinctes** sous les trois formes du §2.3 (vérifié).

### 2.3 Termes indexés par marque

Pour chaque marque codée, le mot-clé (kind `other`, `hiddenTerm: true` sauf §2.4) déclare :

1. **« marque » + code** : `marque Y-d` → `marque y d`. Forme enseignée par la note de C. Sauge
   (OF-06) : « Le Lecteur indexe les marques sous le mot *marque* suivi de leur cote au carnet :
   *marque Y-d*. » Elle couvre aussi les **têtes seules** (`marque Y` → `marque y`, 8 caractères),
   qu'aucune autre forme ne rend cherchables.
2. **Le code seul** si sa forme normalisée fait ≥ 2 caractères : `Y-d`, `O-g-g`, `Y-g+P`.
3. **La forme compacte** (lettres collées) si elle fait ≥ 2 caractères : `Yd`, `Ogg`, `YgP`, `Abg`.

Le joueur peut donc taper `marque Y-d`, `Y-d`, `Y d`, `Y.d`, `Yd` (casse et accents indifférents).
Taper `Y` seul reçoit le message générique « au moins 2 caractères » ; `marque Y` aboutit. Un code
bien formé qui ne correspond à aucune marque rend « Aucun résultat » (comportement actuel) : c'est
une information légitime (personne n'a cette marque), pas une fuite.

Anglais : terme `mark Y-d` en plus de `marque Y-d` ; les codes ne se traduisent pas (cotes d'archive,
comme les noms propres, D3 d'i18n).

### 2.4 Termes cachés, liens et vérifications

- Codes **jamais écrits** dans une pièce lisible avant d'être utiles : `hiddenTerm: true`. Ce sont
  eux que vise le succès « Lire la grève » (§7).
- Codes **écrits** (relevés du carnet, planche I, OF-02) : `hiddenTerm` absent, `autolink: false`
  (un lien automatique sur `P 2` dans « p. 2 » serait faux) ; liens posés à la main `[[Y-d|…]]`.
- Contrôle à ajouter à `content:check` (générique, utile à toutes les affaires) : **erreur** si deux
  mots-clés ont un terme de même forme normalisée (aujourd'hui ignoré en silence) ; **erreur** si un
  terme normalisé fait < 2 caractères (jamais cherchable).
- Le moteur (`normalize`, `search`, `hashAnswer`) **ne change pas**.

### 2.5 Alternative écartée

Faire de `·` et `/` des caractères significatifs et abaisser `MIN_QUERY_LENGTH` à 1 garderait la
notation de la bible, mais `normalize` est partagé avec le hachage des réponses (`hashAnswer`) :
toute modification change les empreintes des affaires 1 et 2 (recompilation, risque de migration
des sauvegardes) pour un gain d'affichage. À ne reprendre que si l'humain tient à `·` et `/` :
il faudrait alors une normalisation **de recherche** distincte de celle du hachage.

---

## 3. Pièces sonores : type `recording`

### 3.1 Décision

**Nouveau type `recording`** (7 pièces, BD-01 à BD-07, bandes LG-64-01 à 07). **Pas d'audio** : la
pièce est la **transcription** de Solange Marest. Raisons :

1. **Coût minimal** : une entrée dans `DOCUMENT_KINDS`, deux libellés (fr, en), un style de feuille,
   une icône ; aucun champ de frontmatter nouveau (cote = `archive`, enquêtrice = `author`).
2. **Lisibilité des Archives** : le filtre par type sépare « Enregistrement » des 9 rapports de 1908
   (RP-01 à RP-09) ; avec `report`, les bandes s'y noieraient.
3. **Règle de jeu attachée au type** : une bande ne révèle jamais de marque (§1.3), vérifiable par
   `content:check` sur le type.
4. **Pas de voix enregistrée** : ni comédienne, ni fichier lourd, ni sous-titrage, ni traduction
   audio ; la parité sourds / malentendants est native ; le budget de chargement est tenu.

### 3.2 Rendu (Lecteur)

- Feuille : **papier pelure** tapé (Courier Prime), bord droit, attache **trombone**, en-tête en
  cartouche : cote (`LG-64-03`), face, date, lieu, locutrices, durée (`19'30`).
- Corps : répliques en paragraphes, nom du locuteur en petites capitales (`**VICTOIRE.**`), minutage
  en marge gauche entre crochets (`[04'12]`), didascalies en italique entre crochets (`*[rire]*`),
  mots du parler insulaire en italique avec glose en note de Marest. Tout ceci est du Markdown
  existant ; aucun bloc nouveau.
- Libellé du type : « **Enregistrement** » / « *Recording* » ; icône `reel` (bobine), DESIGN.
- Effet sonore facultatif à l'ouverture : **déclic de magnétophone + 1,5 s de souffle de bande**
  (synthétisés comme le reste, AUDIO.md), sur le canal Effets, coupé si Effets = 0 ; aucun son
  continu pendant la lecture.

### 3.3 Note de service

Nouvelle note générique `recording` (≤ 25 mots), déclenchée à la première ouverture d'une pièce de
type `recording` : « Une bande d'enquête orale, transcrite. Ce qui y est dit se recoupe comme un
écrit ; une marque dite n'est pas une marque montrée. »

---

## 4. Noël, « accueilli » : absence de lien

- **Décision** : Noël (C19, `parents: [null, null]`) n'a **aucun trait** vers Siméon et Ursule. Il
  rejoint l'arbre par son union avec Honorine (C20). Le level-designer place C19 dans la **colonne
  de Siméon et Ursule** (`column`), à la génération II : la proximité dit « de cette maison », le
  trait absent dit « pas du sang ». Le couple Siméon–Ursule reste sans descendant visible : c'est la
  question de S3, la structure la pose sans y répondre.
- **Pourquoi** : coût nul (contrat, compilé, tracé et lecteur d'écran inchangés) ; la règle de
  l'Office est un arbre **de sang** (art. 15), l'absence est donc juste et lisible. Le pointillé
  demanderait une relation nouvelle (`fosteredBy`), son affichage conditionnel (après `g-mer`, sinon
  il dévoile R6), son tracé, son nom accessible et ses tests.
- **À vérifier par le frontend** : `tree-layout` place une case de génération II sans parents à sa
  colonne sans la décaler ni tracer de trait orphelin (test unitaire avec la forme de l'affaire 3).
- **Lecteur d'écran** : la liste hiérarchique (GAME_DESIGN §17) range Noël sous « Unions de la
  génération 2 », avec « parents : non inscrits à l'arbre ». Cette mention est vraie pour toute case
  sans parents et ne dit pas pourquoi.
- **Backlog 3.1** (si le playtest montre une confusion) : pointillé « accueilli », 2 px, tiret 3 /
  espace 5, couleur d'encre secondaire, affiché seulement quand `g-mer` est établi ; nom accessible
  « Accueilli par Siméon Cormaud et Ursule Lestaud ».

---

## 5. Entrée dans l'affaire et notes de service

- **E04** : chemise « *Les Marques de Longuegrève* », cote « Dossier 77-0874 », durée indicative
  **5 h – 8 h** ; accès libre dès le premier lancement (AFFAIRE-2 §2.2), mention « Se joue seule ».
  Démo itch.io inchangée (affaire 1 seule).
- Sauvegardes, profil, statistiques : règles de AFFAIRE-2 §2.3.
- **Notes de service** (crans de AFFAIRE-2 §2.4) : les bulles `lg-` de la bible deviennent des notes
  **génériques**, déclenchées sur les données (le tutoriel ne connaît aucun id d'affaire) :

| Id | Déclencheur (donnée) | Texte (≤ 25 mots) | Bible |
|---|---|---|---|
| `mark` | Premier affichage de l'arbre contenant une case `portraitKind: 'mark'` ; cible : la première d'entre elles | « Cette personne ne signait pas. Sa case attend sa marque, pas son portrait. » | `lg-mark` |
| `mark-read` | Première ouverture du sélecteur d'un champ Marque | « Lisez une marque dans l'ordre : la tête, la barre, les entailles, les grains, le talon. » | remplace `lg-mark-rule` |
| `recording` | Première pièce `recording` ouverte | §3.3 | nouveau |

  `lg-code` (première recherche d'un code) est **abandonnée** : la recherche ne sait pas qu'un terme
  est un code, et OF-06 l'enseigne dans la fiction. Aide › Comment jouer gagne une fiche
  « **Marques** » (5 lignes : le champ Marque, les onglets, la description, la recherche
  `marque Y-d`, l'option §1.6) ; la grammaire elle-même reste dans OF-05 (c'est du contenu).
- Le prologue (`g-matrice`, 4 cases, noms et marques sur OF-02) se valide en ≈ 10 min dans les trois
  crans : il enseigne le champ Marque.
- **Indices niveau 3** d'une case à marque : palier 1 écrit par le contenu, recommandé : « Lisez sa
  marque dans l'ordre de la planche I. » ; la Révélation pose la marque juste (pas la marque de fille).

---

## 6. Rapport final et décision

### 6.1 Accès

Comme l'affaire 2 (AFFAIRE-2 §3.1) : rapport ouvert quand l'arbre est complet (32 cases établies).
Raison propre : l'arbre complet établit que Blaise est né Goémard et qu'Edmée hérite comme Félix ;
le rapport porte sur ce qu'on fait de cette vérité.

### 6.2 Questions Q1–Q4 (`kind: 'question'`)

Textes : `05-secrets-et-fins.md` §2. Règles :

- Chaque question propose : la version officielle (disponible si sa pièce est lue), la vérité
  (disponible si le secret est découvert), « **Non établi** » (toujours).
- Option indisponible : **masquée** (pas de `unavailableReason`) ; seule la décision grise ses
  options (§6.3). Raison : une question qui affiche « vous n'avez pas trouvé la vérité » dirait qu'il
  y en a une autre.
- Aucune pénalité ; une réponse fausse est une fin possible. Pas de verdict « juste / faux » à
  l'écran du rapport (le contenu ne porte pas la justesse par réponse).

### 6.3 Les trois tampons (`kind: 'choice'`, dernière étape)

| Option (id) | Libellé (effet administratif) | Disponible | Raison si grisée |
|---|---|---|---|
| `indemniser` | « Arrêter la liste des ayants droit des quatre chefs de la matrice de 1868 ; l'île passe à l'État contre indemnité. » | Toujours | — |
| `spoliation` | « Constater que l'évacuation de 1908 n'avait pas de fondement sanitaire ; demander l'annulation de la concession et la réparation due aux quatre maisons. » | `secret: S1` | « Le certificat de 1908 n'est contredit par aucune pièce. » |
| `rendre-l-ile` | « Refuser l'expropriation : l'île reste indivise aux quatre maisons ; la réserve se fera par convention avec elles. » | `secret: S3` | « La maison Cormaud n'a pas d'ayant droit établi. » |

- Grisés avec raison + bouton « Revenir au dossier » (décision ROADMAP 14/10, `unavailableReason`) :
  le joueur sait qu'une piste reste ouverte (P3).
- Disposition, confirmation, clavier, manette, lecteur d'écran : AFFAIRE-2 §3.2 à l'identique
  (cartes ≥ 72 px, empilées sous 600 px ; `radiogroup` « Décision de l'Office »).
- **Aucun tampon n'exclut les Garnaud** : la branche est toujours ayant droit (bible §7.2). Le
  rapport le dit dans toutes les fins.
- **Cohérence Q3 / « Rendre l'île »** : le contrat ne peut pas lier la disponibilité d'un tampon à
  une réponse. Un joueur qui a découvert S3 peut répondre « déshérence » à Q3 puis rendre l'île ; la
  fin le respecte (§6.4, section `s3-non` : « La part Cormaud est dévolue à l'État, qui entre dans
  l'indivision. »). Pas de blocage, pas de message d'incohérence.

### 6.4 Fins (structure ; textes : scénariste)

Arbre complet requis pour toutes. Une seule fin jouée (priorité la plus haute vraie).

| Prio | Fin | `when` (en plus de l'arbre complet) |
|---|---|---|
| 1 | F1 — Les quatre lanières | `answered: decision = rendre-l-ile` |
| 2 | F2 — La fièvre de papier | `answered: decision = spoliation` |
| 3 | F3 — L'ambre gardé | `answered: decision = indemniser` **et** `answered: Q4 = coffre` |
| 4 | F4 — L'indemnité | `answered: decision = indemniser` |

- F3 exige la **réponse** Q4 juste (qui exige S2) et non le secret seul (bible : « Indemniser + S2 ») :
  c'est le rapport que lit la Commission ; un coffre que le rapport ne mentionne pas reste fermé.
  Même logique que les sections de l'affaire 2.
- **Sections** (toutes les fins) : `s1` si Q1 = concession ; `s2` si Q4 = coffre (absente de F4 par
  construction) ; `s3` si Q3 = Noël, sinon `s3-non` (ligne sèche « La part Cormaud est dévolue à
  l'État. ») ; `s4` si Q2 = « à la place de son frère » ; `conclusion` toujours.
- F2 sans S3 : la part Cormaud tombe en déshérence (bible §7.3) — confirmé, par `s3-non`.
- **Épilogue 100 %** (arbre + S1–S4) : EP-01, EP-02, indépendants de la décision, avec une ligne qui
  la rappelle. Aucune décision n'est récompensée par du contenu exclusif.
- **Mentions marginales** (bible §3) : textes à écrire, affichage **conditionné** au lot « mention
  marginale » de l'affaire 2 (backlog ROADMAP) ; l'affaire 3 n'en dépend pas pour être jouable.
- Journal : entrée « Décision : *tampon* » ; chemise E04 : tampon de la dernière décision ; Bonus :
  « fins vues N / 4 ». Remettre un autre rapport : dépend de `reopenReport` (backlog affaire 2).

---

## 7. Succès propres à l'affaire 3

Ids préfixés `lg-`. Mêmes règles que `SUCCES.md` et AFFAIRE-2 §4 : aucun ne récompense l'absence
d'aide, aucun n'est manquable ; vocabulaire existant seulement.

| # | ID | Titre provisoire | Condition | Caché |
|---|---|---|---|---|
| 1 | `lg-la-matrice` | La matrice de 1868 | `groupLocked: g-matrice` | Non |
| 2 | `lg-les-talons` | Les talons | `groupLocked: g-talons` | Non |
| 3 | `lg-a-mi-greve` | À mi-grève | `lockedCount ≥ 16` | Non |
| 4 | `lg-quatre-maisons` | Les quatre maisons | Arbre complet (8 groupes) | Non |
| 5 | `lg-l-enfant-de-mer` | L'enfant de mer | `groupLocked: g-mer` | Oui |
| 6 | `lg-le-fils-parti` | Le fils parti | `groupLocked: g-garnaud` | Oui |
| 7 | `lg-l-ecole-et-le-feu` | L'école et le feu | `groupLocked: g-ecole` | Non |
| 8 | `lg-pas-de-fievre` | Pas de fièvre | `secret: S1` | Oui |
| 9 | `lg-le-coffre-108` | Le coffre 108 | `secret: S2` | Oui |
| 10 | `lg-devant-dieu` | Son fils devant Dieu | `secret: S3` | Oui |
| 11 | `lg-j-ai-pris-pour-j` | J'ai pris pour J. | `secret: S4` | Oui |
| 12 | `lg-tous-les-secrets` | Ce que l'ambre garde | Les 4 secrets | Non |
| 13 | `lg-lire-la-greve` | Lire la grève | `searched: marque O-g-g` **et** `not read` de toute pièce qui montre `O-g-g` (RG-15, RG-23, CN-02, PH-10) | Oui |
| 14 | `lg-toutes-les-bandes` | La dernière voix | `read` des 7 pièces `recording` | Non |
| 15 | `lg-trois-tampons` | Trois tampons | Une fin de chaque décision vue (`any` F3/F4 pour « Indemniser ») | Non |
| 16 | `lg-les-quatre-laniere` | Les quatre lanières | `endingReached: F1` | Oui |
| 17 | `lg-epilogue` | Nous avons fait nos marques | Épilogue atteint | Non |
| 18 | `lg-tout-lu` | Tout le dossier | Toutes les pièces lues | Non |
| 19 | `lg-le-golfe` | Le golfe d'Ambre | Ouvrir les 2 nouveaux lieux (`longuegreve`, `cabanes-d-ambre`) | Non |
| 20 | `lg-contre-la-montre` | Contre la marée | Chrono : rapport en < 3 h | Non |
| 21 | `lg-archiviste-eclair` | Coup d'ouest | Chrono : rapport en < 95 min | Non |

- n° 13 : `not read` n'est vrai qu'au moment de la recherche ; le succès est acquis à cet instant
  (même mécanisme que `hc-un-visage-ment-moins`). Le level-designer choisit le code (une marque juste
  dont aucune pièce de départ ni relevé n'écrit le code) et liste ses pièces.
- Seuils chrono : affaire de taille voisine de l'affaire 1 ; à recalibrer en playtest.

---

## 8. Changements nécessaires, par lot

Ordre : A (contrat, `architect`) avant B et D ; C n'a rien d'obligatoire ; E et F en parallèle.

### Lot A — Contrat (`packages/contract`, `docs/ARCHITECTURE.md` §3) — `architect`

| # | Fichier | Changement |
|---|---|---|
| A1 | `document.ts` | `DOCUMENT_KINDS` += `'recording'` (schéma inclus). |
| A2 | `family.ts` | `Portrait.kind?: 'face' \| 'mark'` (défaut `face`) + `PortraitSchema`. |
| A3 | `tree.ts` | `TreeSlot.portraitKind?: 'face' \| 'mark'` (défaut `face`) + `TreeSlotSchema` ; `CompiledSlot` l'hérite (vérifier l'`Omit`). |
| A4 | `document.ts` | `Inline` += `{ t: 'mark'; portrait: PortraitId }` + `InlineSchema`. |
| A5 | `ARCHITECTURE.md` | Syntaxe `::mark[<portraitId>]` (inline), sémantique (révèle la marque), types ci-dessus. |

Aucun changement de `SaveState`, de `SlotGuess`, du hachage ni des conditions : **pas de migration**.

### Lot B — Outils de contenu (`packages/content-tools`) — `backend`

| # | Changement |
|---|---|
| B1 | Parseur : `::mark[id]` inline ; compilation : chaque marque inline ajoutée à `reveals.portraits` de la pièce (union, ordre d'apparition). |
| B2 | i18n / projection structurelle : les inlines `mark` font partie de la structure (mêmes ids, même ordre exigés entre langues). |
| B3 | `content:check` : réponses (`portrait` + `altPortraits`) d'une case du même `kind` que son `portraitKind` ; inline `mark` vers un portrait existant de `kind: 'mark'`. |
| B4 | `content:check` : une pièce `recording` n'a ni `reveals.portraits` ni inline `mark`. |
| B5 | `content:check` : `Portrait.alt` d'une marque conforme au gabarit §1.6 (vocabulaire fermé, ≤ 110 car.). |
| B6 | `content:check` (générique) : **erreur** si deux mots-clés partagent un terme normalisé ; **erreur** si un terme normalisé fait < 2 caractères. |
| B7 | Solveur / rapport : ratio de candidats **par type** (§1.3) ; les visages ne comptent pas pour les cases à marque et inversement. |

### Lot C — Moteur (`packages/engine`) — `backend`

Rien d'obligatoire : `validate`, `search`, `normalize`, `hashAnswer` inchangés. Facultatif : sélecteur
pur `portraitKindOf(slot, c)` et `availablePortraits(s, c, kind?)` pour éviter de dupliquer le filtre
dans le jeu (tests unitaires).

### Lot D — Jeu (`apps/game`) — `frontend`

| # | Changement |
|---|---|
| D1 | Libellé de champ par case (« Marque » si `portraitKind = 'mark'`), cadre vide « pied seul », coins coupés, bande de libellé 16 px (§1.2). |
| D2 | Sélecteur P10 filtré par type ; refus neutre du mauvais type au dépôt et en « prendre → déposer » (§1.5). |
| D3 | Galerie P11 : onglets Visages / Marques (seulement si l'affaire contient des marques), numérotation par onglet, description en clair, LB/RB (§1.4, §1.8). |
| D4 | Lecteur : rendu inline `mark` (original : SVG 2,5 em, cible 44 px, agrandissement 320 px + « Utiliser dans l'arbre » ; transcription : « [marque : …] ») ; section « Marques de ce document ». |
| D5 | `kindLabels.recording` (fr « Enregistrement », en « Recording »), style de feuille `recording` dans `SHEET`, icône `reel`, effet d'ouverture facultatif (§3.2). |
| D6 | Notes de service génériques `mark`, `mark-read`, `recording` (§5) ; fiche d'aide « Marques ». |
| D7 | Option d'accessibilité « Décrire les marques sur l'arbre » (`Settings`, défaut faux) — **ajout au contrat `settings.ts`** à passer par l'architecte avec A. |
| D8 | Noms accessibles des cases à marque (§1.6) ; test `tree-layout` d'une case sans parents placée par colonne (§4). |

### Lot E — Design et illustrations — `design-lead`, `cartographe`

Token et rendu de la case à marque (coins coupés, bande de libellé), icônes `unknown-mark` et `reel`,
feuille « pelure » des enregistrements, onglets de galerie ; marques en `currentColor` ; **gabarit
corrigé** (grain 8 unités, trait 6 unités, §1.7) ; aucun code écrit dans le SVG d'une marque (le
rendu « relevé » de la bible ajoute le code à côté : à retirer des SVG de portrait, à garder dans
les illustrations du carnet).

### Lot F — Contenu — `scenariste`, `level-designer`

- `09-marques.md` et toutes les pièces : notation révisée (`-i`, `-ii`, `-b`) ; OF-05 (planche I)
  l'enseigne, OF-06 enseigne la forme `marque Y-d` ; justification « à la machine » (§2.2).
- Mots-clés de marque : trois formes de termes (§2.3), `hiddenTerm` / `autolink` (§2.4), `mark Y-d`
  dans le calque anglais.
- Ids de portrait **neutres** (`portrait-xxxxxx`, décision ROADMAP 13/10) : les noms de travail
  `lg-m-y-d` contiennent le code et ne doivent pas atteindre le compilé.
- `tree.json` : `portraitKind: 'mark'` sur les 19 cases ; C19 dans la colonne de C05–C06 (§4).
- `progression.json` : rapport et sections de fin selon §6 ; succès §7.
- Ratio de visages ≥ 20 pour 13 cases à visage (§1.3).

### Hors 3.0 (backlog)

Pointillé « accueilli » (§4) ; mentions marginales et `reopenReport` (backlog de l'affaire 2) ; audio
des bandes (non prévu).

---

## 9. Décidé (16 oct. 2026, défauts retenus)

Toutes les options par défaut sont retenues ; les alternatives restent décrites dans les sections
citées, à reprendre seulement sur nouvelle demande.

1. **Notation des codes** : sans changer `normalize` ni le moteur, **décidé** ; c'est la **notation
   « LX »** de `docs/level/longuegreve.md` §5.2–5.3 qui est retenue, **pas** celle du §2.2–2.4 : barre
   `b`, grain `pt`, talon `t` suivi de sa tête (`A-b`, `Y-pt`, `P-pt-pt`, `A-b-tP`, `O-g-tY`) ; seuls
   les 7 codes utiles sont des mots-clés, tous en `autolink: false` (liens posés à la main), sans forme
   « marque + code » ; têtes seules non indexées. Les §2.2–2.4 restent comme trace de l'alternative.
2. **Inline `::mark[<portraitId>]`** au contrat (lecture visuelle nom ↔ marque, D2) : **décidé**.
3. **Noël** : simple absence de lien ; pointillé « accueilli » au backlog 3.1 (§4) : **décidé**.
4. Libellé du champ visage : « **Portrait** » conservé (cohérent avec les affaires 1–2) : **décidé**.
5. **F3** conditionnée par la réponse Q4 = coffre (§6.4) : **décidé**.
6. « Rendre l'île » **permis** avec Q3 = déshérence, la fin le reflète (`s3-non`, §6.3) : **décidé**.
7. Sélecteur **strictement filtré** par type (§1.5) : **décidé**.
8. **Pas d'audio** pour les bandes (§3) : **décidé**.

Mise en œuvre : lot A (contrat : `recording`, `Portrait.kind`, `TreeSlot.portraitKind`, inline `mark`,
réglage `describeMarks`), lot B (outils de contenu) et lot C (sélecteurs `availablePortraits(s, c, kind)`,
`portraitKindOf`, `slotPortraitKind`) livrés ; détail des types : `docs/ARCHITECTURE.md` §3.
