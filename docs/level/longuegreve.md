# Level design — affaire `marques-de-longuegreve` (*Les Marques de Longuegrève*)

> Auteur : `level-designer` · v0.1 · 16 oct. 2026 · affaire 3, branche `claude/affaire-3`.
> État : **graphe avant rédaction** (bible v0.1, 109 pièces + 2 d'épilogue listées, aucune pièce
> rédigée, aucun fichier `content/`). Ce document fixe ce que les JSON de
> `content/cases/marques-de-longuegreve/{tree,progression,hints,achievements}.json` devront dire, et ce
> que la rédaction doit garantir (§13).
> Sources : bible `docs/scenario/affaire-3/` (02, 03, 05, 06, 07, 08, 09), règles
> `docs/game/GAME_DESIGN.md` §4, §7–§10, contrat `docs/ARCHITECTURE.md` §3 (dont §3.7 bis, règle 13 :
> marques et `recording`), moteur `packages/engine/src/{normalize,search}.ts`.
> Preuve de solvabilité : §10 (modèle du graphe et solveur « en couches », contre-épreuves).
> **v0.2 (16 oct. 2026)** : relecture du contenu rédigé v1.0 (111 pièces, JSON complets) au §19,
> qui fait foi là où il contredit les §2–§17 (écarts, contre-épreuves, aides, durée, corrections).

## 1. Principes retenus

| Principe | Mise en œuvre |
|---|---|
| Plusieurs entrées ouvertes | 9 pièces de départ (OF-01 à OF-08, BD-01), **deux groupes ouvrables d'emblée** (`g-matrice`, tutoriel ; `g-oyard`, la famille de Victoire), puis deux de niveau A et trois de niveau B, ouvrables en parallèle. |
| Chaque case par ≥ 2 chemins | Nom, champ (marque ou visage) et métier couverts par ≥ 2 pièces chacun (07 §1). Contre-épreuve « une pièce retirée » (§10.3) : **aucune** des 100 pièces hors départ n'est nécessaire à une case. Une marque n'est comptée que par une pièce **autographe** (registre, objet taillé, croix photographiée), jamais par un relevé ni une marque « dite » (R7). |
| Aucune case par une pièce isolée | Seule C24 (Victoire) est pré-remplie. Le prologue (`g-matrice`) demande déjà deux pièces : OF-02 (matrice) et RG-05 (mutations) ; c'est le seul groupe qu'un document de départ porte presque seul (tutoriel). |
| Difficulté qui monte par branche | Trois portes : 0 → A → B → C (plafond de GAME_DESIGN §8.2). Pièges croissants : la tête (maison) → le talon (épouse) → les grains (marque de fille, autre âge) → la barre (enfant de mer) → le nom d'usage et la marque déduite (`Y-d`, le fils parti). |
| Jamais d'impasse | Conditions monotones partout (le `not` n'apparaît que dans les fins et un succès) ; chaque porte a au moins deux clés, dont un compteur de cases établies. |
| Le soupçon tôt, la preuve tard | Comme le revenant de l'affaire 2 : on peut **déduire** au niveau A que l'hôtel Garnaud porte la marque du cadet de Gervais (CN-03), on ne peut **établir** la branche qu'au niveau C. |

## 2. Points d'entrée

| Pièce de départ | Ce qu'elle ouvre (mots-clés, lieux) | Branche amorcée |
|---|---|---|
| OF-01 lettre de mission | « matrice de 1868 », « Comptoir des Ambres », « Amicale des Cabanes », « Victoire Oyard », « évacuation » ; lieux Longuegrève, Cabanes d'Ambre, Port-Sénane | Prologue, Oyard |
| OF-02 requête et matrice (✎) | « Gervais Goémard », « Clovis Oyard », « Siméon Cormaud », « Lubin Lestaud », « cadastre », « lanière », « réserve », « Bernard Fontanet » ; marques `Y`, `O`, `A`, `P` en fac-similé (`::mark`) | **Tutoriel** (`g-matrice`) |
| OF-03 opposition du Comptoir | « Edmée Garnaud », « Blaise Garnaud », « Léandre Garnaud », « concession », « certificat sanitaire » | Garnaud (fausse piste), S1 |
| OF-04 mémoire de l'Amicale | « Marin Cormaud », « Félix Goémard », « Rose Pellerin », « Rose Oyard », « fièvre », « cimetière de Longuegrève » (§13) | Oyard (Rose), mer, Goémard |
| OF-05 planche I de Marest (✎) | grammaire R1–R8 ; « enfant de mer », « Aurore », « Solange Marest » ; codes des **morts** seulement (`A-g`, `A-d`, `Y··`, `/`) | Tutoriel des marques, mer |
| OF-06 note de C. Sauge | « Phares et Balises », « Inscription maritime », « Hôpital maritime » ; **notation du Lecteur** (§5) avec l'exemple `A-d` | Aide de recherche |
| OF-07 lettre de Ginette Sollier | « Sidonie Brémoy », « Benoît Lestaud », « feu de Longuegrève », « cahiers de la chapelle » ; lieu Bains-de-Mérande | École (porte A) |
| OF-08 portrait de Victoire | visage de C24 (ancre), « trieuse d'ambre » | Case établie |
| BD-01 bande « Les marques » (✎) | « Médard Oyard », « Elzéar Oyard », « Jacquette Goémard », « école de Longuegrève » ; marques **dites** | **Oyard** (deuxième entrée) |

Lieux visibles d'emblée : **Aubrelieu** (presse : PR-01, PR-08). Révélés par la lecture : Port-Sénane
(OF-01, OF-03), Longuegrève (OF-01, OF-02), les Cabanes d'Ambre (OF-01, OF-04), Bains-de-Mérande
(OF-07). Aucun autre lieu n'est nécessaire.

## 3. Arbre et groupes (`tree.json`)

32 cases, générations 1 à 4 (Goémard à gauche, Oyard et Cormaud au centre, Lestaud à droite ; la branche
Garnaud sous Gervais, à l'extrême gauche). `portraitKind: "mark"` sur les 19 cases à marque (02 §3).
Pré-remplie : **C24** Victoire. Cachées :

| Case | `revealedBy` (`any`) | Niveau typique |
|---|---|---|
| C13 Blaise | RG-01, RG-02, CN-03, LT-01 | A |
| C14 Amélie, C27 Léandre, C32 Edmée | RG-13, PH-15, EX-01 | C |

Écart à la bible (02 §4) : **BD-02 ne révèle plus C13** (§12.3, dosage de ce que savait Victoire) ;
CN-03 et LT-01 le remplacent, ce qui garde quatre portes à la case.

| Groupe | Cases | Seuil | Niveau | Ce qui le rend difficile |
|---|---|---|---|---|
| `g-matrice` | C01 Gervais, C03 Clovis, C05 Siméon, C07 Lubin | 3 | 0 | Tutoriel : la marque comme champ ; la tête dit la maison. 10–15 min. |
| `g-oyard` | C11 Jacquette, C12 Médard, C23 Elzéar, C29 Rose | 3 | 0 | Marques **dites** (BD-01, DV-02) à retrouver tracées ; marque de fille `Y·` ; Rose sous son nom d'épouse. |
| `g-talons` | C02 Perrine, C04 Toinette, C06 Ursule, C08 Apolline | 3 | A | **Le talon** : lire la maison natale sous le pied ; les marques des parents sont en pied d'acte, sans légende (§12.2). |
| `g-ecole` | C17 Benoît, C18 Sidonie, C20 Honorine | 3 | A | Leurre `gardien-de-phare` ; deux marques d'Honorine (`P··` puis `A/+P`) ; Sidonie sous trois noms. |
| `g-goemard` | C09 Josse, C10 Reine, C21 Gatien, C22 Léontine, C28 Félix | 3 | B | Cinq cases ; aviron `Y-g-g` de Gatien (leurre de Josse) ; marque de fille de Reine ; visages derrière la porte B. |
| `g-lestaud` | C15 Ernestine, C16 Fulbert, C26 Clément, C31 Aline | 3 | B | La croix `X` du double (D9) ; Delphine `P-g·` (D8) ; Aline ne savait pas venir de l'île. |
| `g-mer` | C19 Noël, C25 Lazare, C30 Marin | 3 | B | **L'exception R6** : Noël porte la Flèche mais pas le sang ; aviron `A/-g` de Lazare (D7). |
| `g-garnaud` | **C13** Blaise, **C14** Amélie, **C27** Léandre, **C32** Edmée | 3 | C | Branche cachée ; nom d'usage ; marque **déduite** `Y-d` ; trident (D10), Ange `O-d` (D4), `matelot`, `armateur`. |

Partition : 4 + 4 + 4 + 3 + 5 + 4 + 3 + 4 = 31 cases (C24 exclue), seuil 3 partout.

**`g-goemard` à 5 : conservé.** Félix est le représentant vivant de la Fourche (il le faut pour PV-06) et
Léontine n'a de sens qu'avec lui. Avec le seuil 3, le premier verrouillage demande Josse, Reine (niveau A
par les registres) **et** un visage de niveau B ; les deux dernières cases se verrouillent ensuite à deux
(R8) et sont toutes deux documentées par deux visages (Léontine : PH-05, PH-06 ; Félix : PH-09, PH-14).
Le découper (Josse–Reine–Gatien / Léontine–Félix) créerait un groupe de deux, interdit.

## 4. Les trois portes

Diégèse (celle des affaires 1 et 2, plus un calendrier) : l'archiviste ne monte les cartons suivants
qu'après un tampon ; les auditions du dossier 77-0874 sont convoquées à mesure que le tableau avance.
Une porte est une condition ajoutée à **toutes** les routes d'une pièce (mot-clé, lieu, déblocage).

| Porte | Condition (`any`) | Pièces derrière la porte |
|---|---|---|
| **A** « premier tampon » | `g-matrice` établi **ou** ≥ 4 cases établies (C24 comprise : un premier verrouillage d'Oyard suffit) | Fonds Sollier : PV-03, RG-01–RG-04, RG-22, LT-02, LT-04, PH-02, PH-12, DV-02 ; état civil de la section de Longuegrève : **RG-07–RG-11** ; Hôpital maritime : **RP-05** |
| **B** « les auditions » | `g-talons` **ou** `g-ecole` établi, **ou** ≥ 12 cases | Auditions PV-01, PV-02, PV-04 et ce qu'elles apportent : archives du Comptoir (LT-03, LT-06, LT-08, RG-23, RG-24, RP-03, PH-01, PH-04, PH-07, PH-17, OB-04, CT-01, PB-01), papiers Goémard et album de l'Amicale (LT-01, OB-01, OB-05, PH-05, PH-06, PH-09), Réserves (PH-11, PH-18) ; *L'Écho* du 15 octobre (PR-07, PH-13, PH-14) et le négatif de 1908 (PH-03) ; **RG-15** (liste des évacués) ; CP-01, LT-07, TG-01, PH-08 |
| **C** « la réquisition » | `g-goemard`, `g-lestaud` **ou** `g-mer` établi, **ou** ≥ 22 cases | RG-13 (Inscription maritime), PH-15 (tombe), LT-05 (testament de Blaise), PV-05, EX-01, EX-02 ; puis RG-20 → PV-06 → OB-02, DV-01 |

Compteurs : C24 + matrice + Oyard = 9 ; + talons + école = 16 (tout le niveau A) ; un lot de trois de
plus = 19 ; deux lots de niveau B = 22. Aucun compteur n'est atteignable sans progrès au niveau qui
précède, et aucun groupe n'est la clé unique d'un autre : un joueur bloqué sur les talons ouvre B par
l'école, et inversement ; C s'ouvre par n'importe laquelle des trois branches B.

**Le calendrier doit suivre les portes** (demande au scénariste, §12.6) : Ginette Sollier (PV-03) est la
première audition, le 6 octobre ; Edmée Garnaud (PV-01) le 11, les Cabanes (PV-02) le 12, Aline (PV-04) le
13, l'article de *L'Écho* le 15, Solange Marest (PV-05) le 19, les expertises les 26 et 28, le coffre le
4 novembre. Ainsi aucune pièce datée de 1977 n'arrive avant une pièce plus ancienne de la même chaîne.

## 5. Les codes de marque au Lecteur (recherche)

### 5.1 Ce que fait le moteur (vérifié)

`search()` cherche le terme **normalisé** en correspondance exacte (`own(searchIndex, normalize(q))`),
sans flou, avec un minimum de **2 caractères** après normalisation (`MIN_QUERY_LENGTH`). `normalize()`
décompose (NFKD), retire les diacritiques, met en minuscules et remplace **tout ce qui n'est ni lettre
ni chiffre** par une espace. Conséquences sur la notation Marest (calcul fait sur les 32 codes) :

| Code Marest | Normalisé | Problème |
|---|---|---|
| `Y`, `O`, `A`, `P`, `X` | `y`, `o`… | 1 caractère : jamais cherchable (« Précisez votre recherche ») |
| `Y·`, `Y··`, `P·`, `P··`, `O·` | `y`, `p`, `o` | le grain disparaît : 1 caractère |
| `A/` | `a` | la barre disparaît : 1 caractère |
| `/` | (vide) | erreur de `content:check` |
| `A/+P` (Honorine) | `a p` | **= `A+P`** (Ursule) |
| `A/-g` (Lazare, D7) | `a g` | **= `A-g`** (Jean, D1) |
| `P-g·` (Delphine, D8) | `p g` | **= `P-g`** (Fulbert) |
| `Y-d`, `O-g-g`, `Y-g+P`, `O-g+Y`… | `y d`, `o g g`, `y g p`, `o g y` | corrects |

La notation Marest telle quelle ne peut donc pas servir de termes. Et le `+` est réservé par GAME_DESIGN
§4.2 à la combinaison de deux termes (non implémentée aujourd'hui) : `Y+O` serait lu « Y ET O ».

### 5.2 Décision : la notation du Lecteur (code LX)

OF-06 (note de C. Sauge) l'annonce dans le monde : « Le clavier du LX-2 n'a ni point, ni barre, ni
signe plus : tapez la barre `b`, le grain `pt`, le talon `t` suivi de sa tête. » Calcul sur les 32 codes :
**aucune collision**, tout code d'au moins deux signes fait ≥ 2 caractères.

| Marest | LX | Normalisé | | Marest | LX | Normalisé |
|---|---|---|---|---|---|---|
| `Y-d` | `Y-d` | `y d` | | `A/` | `A-b` | `a b` |
| `O-g+Y` | `O-g-tY` | `o g ty` | | `A/+P` | `A-b-tP` | `a b tp` |
| `Y-g+P` | `Y-g-tP` | `y g tp` | | `A/-g` | `A-b-g` | `a b g` |
| `Y·` | `Y-pt` | `y pt` | | `P··` | `P-pt-pt` | `p pt pt` |

Les têtes seules (`Y`, `O`, `A`, `P`) ne sont pas des termes : leurs pièces se trouvent par les noms des
chefs et par « Fourche », « Œil », « Flèche », « Potence » (OF-05, OB-03, CN-03).

### 5.3 Mots-clés de code retenus (7)

Indexer les 34 dessins n'apporte rien : seuls les codes qui **ouvrent** quelque chose sont des mots-clés.
Tous ont `autolink: false` : sur les 452 pièces des affaires 1 et 2, « a d » apparaît 5 fois (« à d'autres »),
« a b » 16 fois (« à B 4 »), « a g » une fois ; un lien automatique les soulignerait. Les codes visibles
sont liés à la main (`[[A-d|code-a-d]]`) dans OF-06, CN-01 et CN-02. Une marque dessinée (`::mark[lg-m-…]`)
porte un id de portrait, jamais le code : elle n'entre pas dans l'index ni dans le contrôle des termes cachés.

| Mot-clé | Termes | Caché | Résultats | Rôle |
|---|---|---|---|---|
| `code-a-d` | `A-d`, `Ad` | non (OF-06) | CN-01 | Tutoriel de la recherche par code (l'exemple de C. Sauge : le puîné noyé de Siméon). |
| `code-a-b` | `A-b`, `Ab`, `Flèche barrée` | non (CN-02) | CN-02, RG-10 [A], RG-18 | Noël (`g-mer`). |
| `code-o-g-g` | `O-g-g`, `Ogg` | non (CN-02) | CN-02 ; RG-15, RG-23 [B] | Elzéar. |
| `y-d` | `Y-d`, `Yd` | **oui** | CN-03 ; PH-08 (si PV-01 ou PV-02 lu) ; RG-13, PH-15 [C] ; RG-20 (si LT-05 lu) | **La déduction du jeu** (§7). |
| `code-o-g-ty` | `O-g-tY`, `OgtY`, `O-g+Y` | **oui** | RG-18 ; RG-15 [B] | Jacquette, déduite de DV-02 (« l'Œil de mon père et une petite Fourche dessous »). |
| `code-y-g` | `Y-g`, `Yg` | **oui** | RG-05, RG-08 [A] ; LT-06, RG-24 [B] | Josse, déduit de RG-05 (« Josse succède à Gervais » : l'aîné). |
| `code-o-g` | `O-g`, `Og` | **oui** | RG-05, RG-07 [A] ; LT-06, RG-24 [B] | Médard, déduit de BD-01 (« l'Œil et une entaille à gauche »). |

`O-g+Y` (normalisé `o g y`) reste un terme de secours tant que le `+` n'est pas un opérateur ; s'il le
devient, le moteur doit essayer le terme entier **avant** de découper (demande au `backend`, §14).
Saisies prévisibles qui ne rendent rien, à dessein : `A/+P` → `a p` (aucun mot-clé `A+P`), `A/` → trop
court. Le message diégétique d'OF-06 suffit ; la bulle `lg-code` (05 §6) peut ajouter « barre = b ».

## 6. Déblocages

### 6.1 Mots-clés (≈ 90 au modèle, davantage après rédaction)

- **Noms complets** « Prénom Nom » et formes de registre (« Goémard Josse ») ; graphies des commis
  (*Gouémard*, *Oyart*, *Cormault*, *Lestot*) en **termes du même mot-clé** (regroupées par le Lecteur,
  OF-06) — jamais un mot-clé distinct.
- **Noms d'usage séparés** : « Rose Pellerin » / « Rose Oyard », « Sidonie Lestaud » / « Sidonie Brémoy »,
  « Amélie Garnaud » / « Amélie Ferlay » : le carnet ne révèle pas l'équivalence.
- **Réservés au nom exact** (bible 06) : `blaise-goemard` (RG-02 ; RG-13 [C]), `blaise-garnaud` (RG-12,
  RG-14, PR-04, AN-01 ; TG-01 [B] ; LT-05 [C]), `noel-cormaud` (BD-03, RG-10 [A] ; CP-01 [B]).
- **Lieux, objets, événements** : « cadastre », « matrice de 1868 », « évacuation », « liste
  d'évacuation », « cimetière de Longuegrève », « aviron », « linteau », « cheminée », « hôtel Garnaud »,
  « trident », « certificat sanitaire », « Pélissart », « vedette », « journal du feu », « Inscription
  maritime », « Lhermet », « testament de grève », « coffre n° 108 », « coffre », « tombe de Blaise
  Garnaud », « cahiers de la chapelle », « école de Longuegrève », « atelier des Cabanes »,
  « lanière Lestaud »…
- **Pièges volontaires** : « Blaise Garnaud » rend la fausse origine (RG-12 « né à Port-Sénane », PR-02,
  PR-04) avant toute preuve ; « Ange Oyard » (BD-05, CN-01) rend RG-13 au niveau C, la page où il côtoie
  Blaise (D4) ; « trident » rend l'étiquette et l'affiche (D10).

Résultats conditionnés (hors portes, qui s'appliquent d'office) :

| Mot-clé | Pièce | Condition de connaissance | Raison |
|---|---|---|---|
| « Pélissart », « Hôpital maritime » | RP-05 | RP-04, LT-02 ou BD-02 lu | On ne cherche le registre des tournées qu'en sachant que le médecin est venu un samedi. |
| « Inscription maritime » | RG-13 | RG-01 ou RG-02 lu (et porte C) | Il faut savoir qu'un Blaise est « parti pour la Grand-Terre ». |
| « Lhermet », « testament de grève » | RG-19 | **C19 établie** ou porte C | L'étude ne communique une minute qu'au vu de la filiation du légataire (§8, S3). |
| « coffre n° 108 », « Caisse d'épargne », `Y-d` | RG-20 | LT-05 lu | Bible 06 : « Accès : après LT-05 ». |
| « cheminée », `Y-d` | PH-08 | PV-01 ou PV-02 lu | Bible 06. |
| « hôtel Garnaud » | CN-03 | porte B | Au niveau A, CN-03 ne vient que par la déduction de `Y-d`. |

### 6.2 Déblocages directs (`unlocks`)

| Pièce | Condition | Rôle |
|---|---|---|
| PV-03 | OF-07 lu + porte A (aussi par le lieu Bains-de-Mérande) | Ginette remet le Fonds Sollier. |
| RG-01–RG-04, RG-22, LT-02, LT-04, PH-02, PH-12, DV-02 | PV-03 lu (seconde route : « cahiers de la chapelle », « Sidonie Brémoy », « école de Longuegrève », porte A) | La copie Brémoy et l'école. **CP-01 retiré de la liste** (§12.5). |
| CN-01 | BD-05 lu (aussi `A-d`, « cimetière de Longuegrève ») | Planche II, les croix. |
| CN-02, PH-10 | BD-06 lu (aussi « aviron », `A-b`, `O-g-g`) | Planche III, les avirons. |
| PV-01 | porte B + (OF-03 ou BD-07 lu) | Edmée ; les archives du Comptoir (12 pièces, ci-dessus). |
| PV-02 | porte B + OF-04 lu | Marin et Félix ; LT-01, OB-01, OB-05, PH-05, PH-06, PH-09. |
| PV-04 | porte B + (RP-09 ou AN-02 lu) | Aline ; PH-11, PH-18. |
| PR-07 | porte B + (PV-02 ou OF-04 lu) | *L'Écho* du 15 octobre ; PH-13, PH-14 et le négatif PH-03. |
| PV-05 | porte C + OF-05 lu | Solange Marest. |
| EX-01 | PV-05 lu + (`Y-d` cherché ou RG-13 lu) | Bible 06 ; troisième porte de la branche. |
| EX-02 | porte C + RP-01 et LT-09 lus | Même machine à écrire (S1, appui). |
| **PV-06** | **RG-20 lu + C28, C29, C30, C31 établies** (ou ≥ 28 cases) | La Caisse n'ouvre qu'en présence d'un représentant établi de chaque maison (texte de PV-06). Remplace « `g-matrice` + LT-05 » (bible), trivial à ce stade. |
| OB-02, DV-01 | PV-06 lu | Le coffre. |
| EP-01 | 32 cases + 4 secrets + toutes les pièces non optionnelles débloquées | Règle des affaires 1 et 2. EP-02 suit EP-01. |

### 6.3 Lieux (`places`)

| Lieu | Révélé par | Pièces (porte) |
|---|---|---|
| `aubrelieu` | — | PR-01, PR-08 |
| `port-senane` | OF-01, OF-03 | PR-02–PR-06, AN-01, AN-02, PB-02, OB-03, RG-16, LT-09 |
| `cabanes-d-ambre` | OF-01, OF-04 | RG-17, CP-02, PH-16 ; PR-07, PH-14 (B) |
| `longuegreve` | OF-01, OF-02 | RG-05, RG-06, RP-06, RP-07, RP-09 ; PH-11, PH-18 (après PV-04) |
| `bains-de-merande` | OF-07 | PV-03 (A), PH-12 (après PV-03) |

Aucune pièce n'est accessible **seulement** par la carte (contre-épreuve des mots-clés, §10.3).

### 6.4 Métiers

23 justes + 3 leurres (`matelot`, `armateur`, `gardien-de-phare`) ; `occupationsUnlock` = colonne M de
07 §1, doublée par les `reveals.occupations`. Un leurre doit être **lisible avant** la case qu'il piège :
`armateur` l'est (PR-03, niveau 0) ; `matelot` ne l'est pas (RG-13, niveau C, quand Blaise est déjà
fillable) et `gardien-de-phare` n'est écrit nulle part (§12.7).

## 7. La branche Garnaud, pas à pas

| Niveau | Ce que le joueur peut faire | Pièces |
|---|---|---|
| 0 | Lire la fausse origine : « enfant de Port-Sénane », « né le 3 février 1854 », le trident. | OF-03, BD-07, RG-12, RG-14, PR-02, PR-04, AN-01 |
| A | Voir apparaître C13 (un Blaise baptisé en 1854, banni en 1870) ; **comparer la date** de RG-01 à celle de RG-12 ; **déduire `Y-d`** (puîné de Gervais, R3) et le chercher : CN-03 répond « Hôtel Garnaud, 1898. Qui ? » | RG-01, RG-02, OF-05, CN-03 |
| B | Remplir C13 en entier : LT-01, ouverte devant l'enquêteur, est **autographe** (`Y-d`, « Ton frère. B. ») ; la cheminée photographiée (PH-08) ; les visages d'Amélie, Léandre, Edmée. Rien ne se verrouille : les trois autres cases sont cachées. | LT-01, PH-08, PH-01, PH-04, PH-07, PH-13, PH-17, LT-07 |
| C | La branche apparaît (RG-13, PH-15 ou EX-01) ; le groupe se verrouille ; LT-05 → RG-20 → PV-06 (S2). | RG-13, PH-15, EX-01, LT-05, RG-20, PV-06 |

Le terme caché `Y-d` ne court-circuite rien : ses résultats décisifs (RG-13, PH-15) sont derrière la
porte C, et le solveur, qui suppose les termes cachés connus dès le départ, obtient les mêmes couches à
une pièce près (CN-03 en couche 1 au lieu de 2, §10.2).

## 8. Secrets, rapport, fins

| Secret | Condition (`discoveredBy`) | Niveau | Écart à la bible |
|---|---|---|---|
| `s1-fievre-de-papier` | RP-01 lu **et** deux de RP-03, RP-04, RP-05, LT-03 | A | Aucun. RP-05 passe derrière la porte A et une condition de connaissance : S1 ne tombe plus avant la fin du prologue. |
| `s4-fils-banni` | BD-04 lu **et** un de LT-01, DV-01 | B | Aucun. |
| `s3-testament-de-greve` | **RG-19 lu et un de RG-03, BD-03** | B (juste après `g-mer`) | La bible proposait « deux des trois » : RG-03 + BD-03 (une copie et un témoignage) donnaient « Rendre l'île » au niveau A. Le tampon le plus fort exige le titre (la minute), communiqué quand Noël est établi. |
| `s2-quatre-coffrets` | PV-06 lu **et** un de DV-01, OB-02 | C | PV-06 exige les quatre représentants établis (§6.2). |

Rapport (Q1–Q4, 05 §2) et décision : sans changement. Disponibilités : Q1 « fièvre » ← RP-01 ou PR-03 ;
Q2 « vol » ← RG-02 ; Q3 « déshérence » ← RG-05 ; Q4 « rien » ← LT-05 ou PR-04 ; chaque réponse juste ←
son secret ; « Non établi » toujours. Tampons : « Reconnaître la spoliation » ← S1, « Rendre l'île » ← S3,
grisés avec raison sinon (`unavailableReason`, ≤ 140 caractères, textes de 05 §2).

| Fin | `priority` | `when` (arbre complet compris) |
|---|---|---|
| `f1-les-quatre-lanieres` | 4 | décision `rendre-l-ile` |
| `f2-la-fievre-de-papier` | 3 | décision `reconnaitre-la-spoliation` |
| `f3-l-ambre-garde` | 2 | décision `indemniser` + S2 |
| `f4-l-indemnite` | 1 | décision `indemniser` + **non** S2 |

Les quatre fins sont atteignables : F1 et F2 dès que S3 / S1 le sont (niveaux B / A), F3 au niveau C, F4
par une partie qui conclut sans ouvrir le coffre (PV-06 n'est jamais obligatoire pour l'arbre).

**Succès proposés au `game-designer`** (conditions exprimables) : « Lire la grève » = `any` de
`searched` sur `y-d`, `code-o-g-ty`, `code-y-g`, `code-o-g` ; pour `y-d`, `all(searched y-d, not read
cn-03)` si les succès sont évalués à chaque action (sinon, garder les trois autres codes seulement, qui
ne sont écrits en clair nulle part) ; « L'enfant de mer » = `groupLocked g-mer` ; « Le coffre 108 » = S2 ;
« Pas de fièvre » = S1 ; « Les quatre maisons » = les quatre représentants établis. `timedTargetsMs` :
3 h, 4 h 30, 7 h.

## 9. Tableau des preuves par case

N = nom, K = marque (pièce autographe), V = visage, M = métier ; [A] / [B] / [C] = derrière la porte.
Les deux chemins n'ont aucune pièce de champ (K ou V) en commun.

| Case | Chemin 1 | Chemin 2 | Risque |
|---|---|---|---|
| C01 Gervais | OF-02 (N, K, M) → « cadastre » → RG-05 (N, K) | « Gervais Goémard » → BD-05 → CN-01 ; RG-07, RG-08 [A] (K, M) | faible (tutoriel) |
| C03 Clovis | OF-02 → RG-05 | BD-01, DV-02 [A] (N) ; RG-07, RG-09 [A] (K, M) | faible |
| C05 Siméon | OF-02 → RG-05 | BD-03 (N, M) ; RG-10 [A] (K, M) ; RG-19 [C] | faible |
| C07 Lubin | OF-02 → RG-05 | RG-08, RG-09, RG-10 [A] (K, M) | faible |
| C02 Perrine | « Josse Goémard » → RG-08 [A] (K `Y+O`, M) | « Médard Oyard » → RG-07 [A] (K, M) ; RG-01 [A] ; CN-01 (appui) | moyen (talon) |
| C04 Toinette | RG-07 [A] (K, M) | RG-09 [A] (K) ; BD-05 (M « sage-femme ») ; RG-01 [A] | moyen (talon, homonymie de métier avec Jacquette) |
| C06 Ursule | « Noël Cormaud » → RG-10 [A] (K, M) | « aviron » → BD-06 → PH-10 (navette taillée `A+P`, §12.1) ; BD-06 (M) ; RG-01 [A] | **élevé sans l'ajout du §12.1** (une seule pièce autographe) |
| C08 Apolline | RG-08 [A] (K, M) | RG-09, RG-10 [A] (K) ; BD-05 (M « le four ») | faible |
| C11 Jacquette | « Victoire Oyard » → RG-18 (K `O-g+Y`, M) | « Médard Oyard » → RG-07 [A] (K `Y·`, autre âge) ; RG-15 [B] ; RG-03 [A], RP-04 (M) | moyen (deux marques) |
| C12 Médard | BD-01 (N, M dite) → « cadastre » → RG-05 (K `O-g`) | RG-07, RG-08 [A] (K, M) ; LT-06, RG-24 [B] | faible |
| C23 Elzéar | BD-01 (N) ; OF-04 → « Rose Pellerin » → BD-06 → PH-10 (aviron `O-g-g`, M) | `O-g-g` → RG-15, RG-23 [B] (K, M « émarge sa paie ») | moyen (seule case d'Oyard sans route de niveau 0 doublée) |
| C29 Rose | OF-04 → « Rose Pellerin » → PH-16 (V, M) | BD-06 → PH-10 (V) ; RG-17, AN-02 (N, M) | faible |
| C17 Benoît | OF-07 → « feu de Longuegrève » → RG-21, RP-04 (K, M) | « Benoît Lestaud » → RG-11 [A] ; RG-08 [A] ; OB-05, RG-15 [B] | moyen (leurre `gardien-de-phare`) |
| C18 Sidonie | OF-07 → PV-03 [A] → PH-02 (V, M) | « Sidonie Brémoy » → PH-12 [A] (V) ; PH-03 [B] ; RG-11 [A], RG-21 (M) | faible |
| C20 Honorine | « Noël Cormaud » → RG-10 [A] (K `P··`, M) | « Victoire Oyard » → RG-18 (K `A/+P`, M) ; RG-15 [B] | moyen (deux marques) |
| C09 Josse | RG-05 (K `Y-g`) ; BD-04 (M) | RG-08, RG-07 [A] (K, M) ; RG-15, LT-06, RG-24 [B] | faible |
| C10 Reine | « Josse Goémard » → RG-08 [A] (K `P·`, M) | « aviron » → BD-06 → PH-10 (fuseau `Y-g+P`) ; BD-04 (N, M) ; RG-15 [B] | moyen (marque de fille) |
| C21 Gatien | « Félix Goémard » → RG-17 (N, M) → PH-05, PH-06 [B] (V) | « atelier des Cabanes » → PH-04, CT-01 [B] (V, M) ; PH-03, CP-01 [B] | moyen (leurre `Y-g-g`, cinq âges proches) |
| C22 Léontine | RG-17 (N, M) → « Léontine Sauvat » → PH-06 [B] (V, M) | PV-02 [B] → PH-05 [B] (V) | **élevé** : deux visages, tous deux [B] |
| C28 Félix | OF-04 (N, M) → PR-07 [B] → PH-14 (V) | PV-02 [B] → PH-09 (V) ; PR-08, AN-02 (M) | moyen (deux visages [B]) |
| C15 Ernestine | « Ernestine Oyard » → RG-09 [A] (K `O·`, original) | BD-06 → PH-10 (tampon `P-g+O`) ; RG-15 [B] ; BD-06 (M) | moyen (croix du double, D9) |
| C16 Fulbert | RG-05 (K `P-g`) | RG-07, RG-09 [A] (K, M) ; RG-15, LT-06 [B] ; PV-04 [B] (M) | faible (leurre D8) |
| C26 Clément | RG-17, RG-18 (N, M) → PH-05 [B] (V) | PR-07 → PH-03 [B] (V) ; PV-04 [B] (M) | **élevé** : deux visages, tous deux [B] |
| C31 Aline | « réserve » → RP-09 (N, M) → PV-04 [B] → PH-11 (V) | AN-02 (M) → PH-18 [B] (V) | moyen (deux visages [B], même audition) |
| C19 Noël | « enfant de mer » → BD-03 (N, M) → RG-10 [A] (K `A/`) | « Victoire Oyard » → RG-18 (K, M) ; PH-10 (aviron) ; OB-01 [B] | moyen (R6) |
| C25 Lazare | RG-17, RG-18 (N, M) → PH-05 [B] (V) | PH-03 [B] (V) ; RG-16 (M) | **élevé** : deux visages, tous deux [B] |
| C30 Marin | OF-04 (N, M) → BD-06 → PH-10 (V) | PR-07 → PH-14 [B] (V) ; AN-02 (M) | faible |
| C13 Blaise | RG-01 [A] (N) → `Y-d` → … RG-13 [C] (N, K) | LT-01 [B] (K) ; LT-05, RG-20 [C] (K) ; AN-01, PR-04 (M) | moyen (voulu, §7) |
| C14 Amélie | RG-12 (N, M) → PH-17 [B] (V, M) | PH-01 [B] (V) ; AN-01, PR-04 (M) | moyen |
| C27 Léandre | OF-03 → RG-14 (N, M) → PH-04 [B] (V) | PH-07 [B] (portrait peint) ; PR-04 (M) | moyen (portrait peint) |
| C32 Edmée | OF-03 (N, M) → PR-07 → PH-13 [B] (V) | PV-01 → PH-07 [B] (V) ; PR-05, RP-08 (M) | faible |

## 10. Preuve de solvabilité

### 10.1 Méthode

Pas encore de contenu : la preuve est faite sur un **modèle exécutable du graphe** (hors dépôt, comme
pour les affaires 1 et 2) qui reprend ce document : 109 pièces, 9 de départ, ≈ 90 mots-clés avec
résultats et conditions, 5 lieux, 3 portes, 31 cases avec leurs pièces N / K-V / M de 07 §1 (ajustées par
le §12), 4 secrets. Le joueur modélisé est celui du solveur de `content-tools` (lit tout ce qui est
débloqué, visite tout lieu visible, cherche tout mot-clé lu, établit une case dès que son nom est lu dans
≥ 2 pièces, son champ et son métier débloqués, en respectant les seuils), **plus strict** sur un point :
une marque ne compte que par une pièce autographe (les relevés CN-01–CN-03 et les marques dites ne
remplissent rien, R7). Deux modes pour les termes cachés : « solveur » (connus dès le départ) et
« déduit » (connus quand la pièce qui permet la déduction est lue : `Y-d` après RG-01 ou RG-02 et OF-05,
etc.). Une **couche** = tout lire, tout visiter, tout chercher jusqu'au point fixe, puis verrouiller.

### 10.2 Résultat (mode « déduit » ; mode « solveur » identique sauf CN-03 en couche 1)

| Couche | Pièces lues | Cases établies (C24 comprise) | Groupes établis | Secrets |
|---|---|---|---|---|
| 1 | 47 | 9 | `g-matrice`, `g-oyard` | — |
| 2 | 65 | 16 | `g-talons`, `g-ecole` | S1 |
| 3 | 98 | 28 | `g-goemard`, `g-lestaud`, `g-mer` | S4 |
| 4 | 109 | 32 | `g-garnaud` | S3, S2 |

- **109 / 109 pièces** atteintes, **32 / 32 cases**, **4 / 4 secrets**, tous les mots-clés cherchés.
- Pièces par niveau d'arrivée : 0 = 47, A = 18, B = 33, C = 11. C'est la courbe voulue : chaque
  couche correspond à une porte, les deux entrées se font ensemble, le niveau B est le plus long.
- Aucune condition de déblocage n'emploie `not` ; toutes les portes ont un compteur pour seconde clé.

### 10.3 Contre-épreuves

- **Une pièce retirée** (chacune des 100 pièces hors départ, tour à tour) : **aucune** n'empêche
  d'établir une case. Les 32 cases restent établies dans les 100 cas.
- **Pièces nécessaires à un secret** : ses pièces clés seulement, voulu : RP-01 (S1), BD-04 (S4), RG-19
  (S3), LT-05 → RG-20 → PV-06 (S2, chaîne du coffre).
- **Pièces à une seule entrée** (hors départ) : LT-01 (par PV-02 : la lettre est remise par Félix),
  EX-01 (par PV-05), EX-02, RG-20, PV-06, OB-02, DV-01 (chaînes voulues). Aucune ne porte seule un
  champ de case (LT-01 : C13 a trois autres pièces autographes ; S4 a DV-01).
- **Un mot-clé retiré** (chacun, tour à tour) : **aucun** ne casse une case ni ne rend une pièce
  inatteignable (après l'ajout de seconde route à BD-04, TG-01, CP-01, BD-07, RP-01, LT-07, DV-02).
- **Ursule sans la navette** (bible actuelle) : retirer RG-10 empêche d'établir C06 (seule pièce
  autographe). Avec la navette (§12.1), plus rien ne casse : c'est la justification de la demande.

### 10.4 Après rédaction

Le modèle ne remplace pas `content:check` : une fois les pièces écrites, `npm run content:solve --
--report` doit retrouver 109 pièces, 32 cases, 4 secrets, 4 fins, et les couches du §10.2 (script de
couches à rejouer, comme pour l'affaire 2, §9.4). Écart attendu : le solveur réel compte une marque dès
qu'une pièce la révèle (relevé compris) ; s'il établit une case plus tôt que le modèle, c'est qu'un
relevé porte `reveals.portraits` : à corriger dans la pièce, pas dans le graphe.

## 11. Ordre de remplissage possible et chemin critique

**Chemin critique** (le plus court pour finir, ≈ 40 lectures utiles) : OF-02 → « cadastre » → RG-05 →
`g-matrice` → PV-03 (porte A) → RG-01 (Blaise apparaît) ; « Josse Goémard », « Médard Oyard »,
« Noël Cormaud » → RG-07, RG-08, RG-10 → `g-talons` (porte B) → PV-02 (PH-05, PH-06, PH-09, LT-01) et
PR-07 (PH-03, PH-14) → `g-mer` → RG-19 (S3) et `g-goemard` (porte C) → « Inscription maritime » → RG-13
(la branche apparaît) → `g-garnaud` → « coffre » → LT-05 → RG-20 → PV-06 → rapport.

**Ordre typique** (joueur moyen) :

1. *Prologue* : matrice (OF-02, RG-05, CN-01 par l'exemple `A-d` d'OF-06). Bulle `lg-mark`.
2. *Entrée Victoire* : Oyard (BD-01, RG-18, BD-06, PH-10, PH-16) ; S1 se dessine (RP-01, RP-04).
3. *Niveau A* : la copie Brémoy (PV-03, RG-01–RG-04) ; les mariages (RG-07–RG-11) → talons et école ;
   la date de RG-12 ; `Y-d` → CN-03 pour qui déduit ; S1 (RP-05).
4. *Niveau B* : les auditions ; les photographies ; Goémard, Lestaud, la mer en parallèle ; LT-01 (S4) ;
   RG-19 dès Noël établi (S3).
5. *Niveau C* : RG-13, PH-15, EX-01 ; Garnaud ; le testament et le coffre (S2) ; rapport, tampon.

## 12. Ajustements demandés au scénariste

Les trois points faibles de 07 §7, puis ce que le graphe exige.

1. **C06 Ursule trop mince (07 §7.4).** Ajouter **la navette à ramender d'Ursule**, taillée `A+P`, que
   Honorine a reçue avec le métier (coutume de mère à belle-fille, 02 §3) : sur l'établi de **PH-10**, dans
   **CN-02** (« navette `A+P` : Ursule, les filets ; passée à Honorine ») et dans **BD-06** (Marin : « la
   navette de la vieille Ursule, la ramendeuse, ma grand-mère Honorine l'a eue avec les filets »). Gain :
   une deuxième pièce autographe (objet taillé), un troisième métier, aucune pièce nouvelle. L'option de la
   bible (Ursule marraine en 1885) ajoute un acte et n'est pas nécessaire.
2. **`g-talons` rempli trop vite (07 §7.1).** (a) Dans RG-07 à RG-10, les parents présents « ont fait
   leur marque **au pied de l'acte** », **sans légende**, dans l'ordre où ils ont passé ; leurs noms et
   métiers sont dans le corps de l'acte. Attribuer `Y+O` à Perrine exige donc de **lire le talon** (et c'est
   la leçon du groupe). Les époux et témoins gardent leur marque à côté de leur nom. (b) Graphe : RG-07 à
   RG-11 derrière la porte A et rendus par les noms **des enfants** (Médard, Josse, Fulbert, Noël, Benoît),
   pas des chefs. (c) CN-01 nomme les croix **au prénom** (« Perrine », « la vieille Toinette »), comme
   Victoire les a lues, pas « Perrine Oyard ».
3. **Ce que savait Victoire (07 §7.6).** Règle proposée : Victoire sait (a) ce que Josse a dit en 1909
   (BD-04 : « le petit a dit que c'était lui »), (b) ce qu'elle a vu sur le quai en 1908, (c) ce que la
   cheminée lui fait soupçonner en 1965 (LT-07) ; elle ne dit **jamais** que Garnaud est un Goémard ni ne
   nomme Blaise. En pratique : **retirer de BD-02** « les Goémard avaient eu deux garçons, Josse et un petit
   Blaise parti en 70 » (sinon `Y-d` se déduit en couche 1, avant le prologue, et la révélation centrale
   tombe dans la première demi-heure ; l'information est déjà dans RG-02) ; garder « comme à un chien, ou
   comme à un frère, je ne sais pas » (ambigu, relu au second passage). BD-02 ne révèle plus C13. LT-07
   reste telle quelle, derrière la porte B.
4. **Exemples de codes.** OF-06 donne l'exemple `A-d` (Yves, noyé) au lieu de `Y-d`, et la notation du
   Lecteur (§5.2) ; OF-05 n'écrit en clair que des codes de morts (`A-g`, `A-d`, `Y··`, `/`), aucun code
   de l'arbre (pas les exemples de 09 §2 : `Y-d`, `O-g-g`, `A/`…). Tout code écrit en clair ailleurs que
   dans CN-01–CN-03 ruine la déduction correspondante.
5. **CP-01 hors de PV-03** (carte de Gatien à 24 ans) : elle donnerait un visage de `g-goemard` au niveau
   A. Elle arrive par « Gatien Goémard », « Noël Cormaud » ou « Nos côtes » au niveau B.
6. **Calendrier des auditions** (vérifié, 3 oct. 1977 = lundi) : PV-03 → **jeu. 6 oct.** ; PV-01 et PH-08
   → **mar. 11 oct.** ; PV-02 et l'ouverture de LT-01 → **mer. 12 oct.** ; PV-04 jeu. 13, PR-07 / PH-13 /
   PH-14 sam. 15, PV-05 mer. 19, EX-01 mer. 26, EX-02 ven. 28, PV-06 ven. 4 nov. inchangés. À reporter
   dans 03-chronologie §7 et 06 (Fonds Sollier remis le 6).
7. **Leurres de métier lisibles à temps.** `matelot` : ajouter à PR-04 (nécrologie, niveau 0) « mousse à
   seize ans, puis **matelot** sur l'*Orvelle* ». `gardien-de-phare` : l'écrire quelque part (PV-03, Ginette :
   « mon grand-oncle Benoît, le gardien de phare », démentie par RG-21).
8. **PH-09** (cimetière, Félix à 52 ans) : fonds « tirage remis par Félix Goémard » (PV-02) plutôt que
   Fonds Marest, pour que le visage de Félix soit de niveau B. **PH-05** (Amicale) et **PH-06** (papiers
   Goémard) arrivent aussi par PV-02.
9. **Mentions exigées par les routes** (le graphe en dépend, §13) : « cimetière de Longuegrève » dans
   OF-04 ; « liste d'évacuation » ou « liste nominative » dans RP-02, RP-06 ou BD-02 ; « télégramme » dans
   RP-06 ; « Blaise Goémard » écrit tel quel (ou « Goémard Blaise ») dans RG-01 **et** RG-02 ; « cahiers
   de la chapelle » dans OF-07 ; « coffre » dans LT-08 et PV-01 ; « lanière Lestaud » dans RG-02 et BD-04 ;
   « Pélissart » dans AN-01.
10. **S3 et PV-06** : conditions modifiées (§8, §6.2) ; à reporter dans 05 §1 et 06 « Contraintes du
    graphe ».

## 13. Contraintes pour la rédaction des pièces

Chaque pièce garde les mots-clés de 06 (ligne « Mots-clés ») et ceux du §12.9. En ajouter est sans
risque tant que `content:check` ne signale pas de chevauchement de liens, **sauf** : aucun nom complet
d'une case cachée de la branche Garnaud dans une pièce de niveau 0 ou A sous une forme qui la relie à
l'île (« Blaise Garnaud, fils de Gervais »…), aucun code de l'arbre en clair hors CN-01–CN-03, aucune
marque autographe (`::mark`) dans une bande (`recording`, règle 13) ni dans un relevé qui servirait de
preuve (les planches CN montrent le **relevé** : `::mark` y est permis comme appui, mais le compte des
deux pièces se fait sur les registres et les objets).

## 14. Demandes aux autres agents

- **`backend`** : règle 5 « terme de moins de 2 caractères = erreur » (documentée en §3.7 bis,
  absente de `check.ts` aujourd'hui : un terme `Y` passerait en silence) ; si la combinaison par `+`
  (GAME_DESIGN §4.2) est implémentée, chercher d'abord la requête entière dans l'index. Aucun
  changement de `normalize()` demandé : la notation LX suffit et ne touche pas les hachages.
- **`game-designer`** (AFFAIRE-3.md) : bulles `lg-code` (« barre = b, grain = pt, talon = t »),
  succès du §8, absence de démo (comme l'affaire 2).
- **`cartographe`** : aucune demande nouvelle ; la navette `A+P` (§12.1) est un dessin d'objet dans
  l'illustration de PH-10, pas un portrait.

## 15. Aides progressives

Paliers de GAME_DESIGN §10 (1 piste, 2 document, 3 passage). Un indice ne nomme jamais une pièce de
niveau supérieur à celui où le joueur se trouve : sa disponibilité (`availableWhen`) est la porte de la
pièce qu'il cite (leçon de l'affaire 2, `c17-2`). Textes de travail, à réécrire sur les pièces rédigées.

### 15.1 Par groupe (marques)

| Groupe | 1 | 2 | 3 |
|---|---|---|---|
| `g-matrice` | « Les quatre chefs ont fait leur marque sur la même pièce. » | OF-02 | « a fait sa marque » : la tête seule, pied lisse. |
| `g-talons` | « Une épouse garde la marque de son mari ; regardez sous le pied. » | OF-05 (planche I) [0] | « le talon : une petite tête de sa maison natale ». |
| `g-mer` | « Une marque peut porter la tête d'une maison sans en être du sang. » | OF-05 [0] | « on lui barre le pied ». |
| `g-garnaud` | « La tête et les entailles suffisent à désigner une seule personne. » | RG-01 [A] | « Blaise… fils de Gervais » : le puîné, entaille à droite. |

### 15.2 Par case

| Case | 1 Piste | 2 Document (disponible) | 3 Passage |
|---|---|---|---|
| C01–C07 chefs | un registre du cadastre | RG-05 [0] | les mutations rappellent la matrice |
| C02 Perrine | un acte de mariage d'un fils Goémard | RG-08 [A] | « présents et consentants » ; le talon `Y+O` |
| C04 Toinette | un mariage de 1876 | RG-07 [A] | la marque au talon Flèche sous l'Œil |
| C06 Ursule | un mariage de 1885 | RG-10 [A] ; PH-10 [0] | la navette sur l'établi |
| C08 Apolline | un mariage de 1879 | RG-08 [A] | « boulangère » ; talon Fourche sous la Potence |
| C09 Josse | le cadastre après 1887 | RG-05 [0] | « Josse succède à Gervais » |
| C10 Reine | son mariage, avant d'être épouse | RG-08 [A] | un grain : la fille aînée de Lubin |
| C11 Jacquette | le mariage de sa fille | RG-18 [0] | la mère « veuve, sage-femme » |
| C12 Médard | une bande de 1964 | BD-01 [0] | « l'Œil et une entaille à gauche » |
| C13 Blaise | un baptême de 1854 | RG-01 [A] ; LT-01 [B] | « fils de Gervais » ; « Ton frère. B. » |
| C14 Amélie | un mariage en ville, 1878 | RG-12 [0] ; PH-17 [B] | « libraire » ; la librairie Ferlay |
| C15 Ernestine | l'original, pas le double | RG-09 [A] | la page en regard de la croix |
| C16 Fulbert | le cadastre après 1893 | RG-05 [0] | « Fulbert succède à Lubin » |
| C17 Benoît | Phares et Balises | RG-21 [0] | « gardien auxiliaire du feu » ; la définition |
| C18 Sidonie | les papiers de sa petite-nièce | PH-02 [A] | « noms au dos de la main de Sidonie » |
| C19 Noël | un mariage de 1885 | RG-10 [A] | « de parents inconnus, recueilli » |
| C20 Honorine | le mariage de son fils | RG-18 [0] | « Honorine Lestaud, ramendeuse » et sa marque |
| C21 Gatien | les tables des Cabanes | RG-17 [0] ; PH-06 [B] | « fils de Gatien Goémard, tailleur d'ambre » |
| C22 Léontine | la même table | RG-17 [0] ; PH-06 [B] | « Léontine Sauvat, couturière » ; le dos de la photo |
| C23 Elzéar | son aviron | PH-10 [0] ; RG-23 [B] | « deux entailles » ; « émarge sa paie » |
| C25 Lazare | son mariage de 1913 | RG-18 [0] ; PH-05 [B] | « Lazare Cormaud, pêcheur » |
| C26 Clément | le témoin de 1913 | RG-18 [0] ; PH-05 [B] | « Clément Lestaud, marin » |
| C27 Léandre | un décès de 1924 | RG-14 [0] ; PH-04 [B] | « son fils Léandre, directeur » |
| C28 Félix | le mémoire de l'Amicale | OF-04 [0] ; PH-14 [B] | « patron pêcheur » ; le *Saint-Gervais* |
| C29 Rose | la halle aux poissons | PH-16 [0] | « Mme Pellerin née Oyard » |
| C30 Marin | le mémoire de l'Amicale | OF-04 [0] ; PH-10 [0] | « président, contremaître » |
| C31 Aline | une note sur les oiseaux | RP-09 [0] ; PH-11 [B] | « A. Lestaud, ornithologue » |
| C32 Edmée | l'opposition du Comptoir | OF-03 [0] ; PH-13 [B] | « présidente » |

## 16. Durée estimée

Corpus prévu : 109 pièces (affaire 2 : 98 pièces, ≈ 38 700 mots, 4 h 50 – 7 h 25 mesurés sur le
modèle). L'affaire 3 ajoute l'apprentissage d'une grammaire (19 marques, 11 leurres) mais moins de
visages à comparer ; les bandes sont longues à lire.

| Phase | Joueur moyen |
|---|---|
| Prologue (`g-matrice`) | 10–20 min |
| Entrée Victoire (`g-oyard`) | 30–45 min |
| Niveau A (talons, école ; S1) | 1 h – 1 h 30 |
| Niveau B (Goémard, Lestaud, mer ; S3, S4) | 1 h 45 – 2 h 30 |
| Niveau C (Garnaud ; S2) | 45 min – 1 h 15 |
| Rapport, tampon, épilogue | 20–30 min |
| **Total** | **4 h 30 – 6 h 50** |

## 17. Points faibles et cases à risque

1. **C22 Léontine, C25 Lazare, C26 Clément** : deux visages chacun, tous de niveau B, et PH-03 / PH-05
   portent à eux deux Gatien, Clément, Lazare et Léontine (comme PH-05 dans l'affaire 1) : ne pas durcir
   leur route (PH-03 et PH-05 ont quatre routes chacune).
2. **C06 Ursule** : sûre seulement avec la navette (§12.1, §10.3).
3. **`g-oyard` ouvert d'emblée** : voulu (deuxième entrée), mais C23 Elzéar n'y a qu'une pièce de
   marque au niveau 0 (PH-10) ; le groupe se verrouille sans lui (Médard, Jacquette, Rose) et Elzéar
   reste la dernière case, verrouillée seule (R8) quand RG-15 / RG-23 arrivent. À surveiller : le joueur
   qui n'a pas vu l'aviron peut croire que la marque d'Elzéar se devine.
4. **Le talon** est la vraie difficulté du niveau A ; si les registres légendent les marques des
   parents (§12.2 non appliqué), `g-talons` devient une recopie.
5. **La déduction `Y-d`** dépend de l'écriture d'OF-05, OF-06 et BD-02 (§12.3, §12.4) : un seul code de
   l'arbre écrit en clair trop tôt avance la révélation centrale de deux portes.
6. **Solveur optimiste** sur les noms (« Goémard », « Oyard » sont partout) : les vrais pièges (talons,
   marques de fille en autre âge, barre, nom d'usage) ne se mesurent qu'en playtest.
7. **Saisies de codes à la Marest** (`A/+P`, `Y·`) : ne rendent rien, sans message propre ; OF-06 et la
   bulle `lg-code` doivent suffire. À mesurer : requêtes vides commençant par une tête.
8. **PV-06** exige les quatre représentants : un joueur qui a tout sauf Aline n'ouvre pas le coffre ;
   c'est diégétique (« en présence d'un représentant de chaque maison ») et sans impasse (compteur ≥ 28).

## 18. Régénérer

Les JSON de `content/cases/marques-de-longuegreve/` seront la source de vérité ; le modèle et les
scripts de couches et de contre-épreuve restent hors dépôt (comme pour les affaires 1 et 2). Après toute
retouche : `npx prettier --write content`, `npm run content:check`, `npm run content:solve -- --report`,
puis le script de couches. Toute retouche garde : partition des groupes, conditions monotones hors fins
et succès, portes à deux clés, résultats décisifs de `y-d` derrière la porte C, codes en `autolink: false`.

## 19. Relecture du contenu v1.0

> `level-designer` · 16 oct. 2026. Objet : la progression **réelle** (`progression.json`, `tree.json`,
> `hints.json`, les 111 pièces de `content/cases/marques-de-longuegreve/`) relue contre ce document.
> Déclencheur : sur la racine de test du scénariste (contenu identique, JSON comparés après `jq -S`,
> plus un `case.json`), le rapport `content:solve -- --report` établit `g-oyard` à l'étape 196, après la
> porte A, et non au départ comme prévu (§3, §10.2).

### 19.1 `g-oyard` « après la porte A » : artefact d'ordre du solveur, pas un défaut du contenu

Le solveur de `content-tools` n'applique **qu'une action par étape** et choisit la première de
`candidateActions()` : d'abord les lectures, puis les visites, puis les recherches, et seulement
ensuite les verrouillages, groupe par groupe **dans l'ordre de `tree.json`**. À l'étape 169, `g-matrice`
et `g-oyard` sont **tous deux** verrouillables ; `g-matrice`, premier de la liste, passe, ouvre la porte
A (16 pièces), et le solveur lit ces 16 pièces et fait 9 recherches avant de revenir aux
verrouillages : `g-oyard` tombe à l'étape 196. Son parcours est un ordre possible, pas une mesure de
profondeur.

Preuve (script « en couches » hors dépôt, §10.1, rejoué sur le modèle exporté par `solverModelFor()` :
une couche = tout lire, tout visiter, tout chercher jusqu'au point fixe, puis verrouiller **tous** les
groupes verrouillables) : à la fin de la couche 0, avant tout verrouillage, les quatre cases de
`g-oyard` sont établissables, avec des pièces de départ ou de niveau 0 seulement.

| Case | Marque ou visage (niveau 0) | Remarque |
|---|---|---|
| C11 Jacquette | RG-18 (`O-g+Y` autographe) | RG-18 par « Victoire Oyard », « Jacquette Goémard », « Lazare Cormaud »… |
| C12 Médard | RG-05 (`O-g`) | au cadastre (lieu Longuegrève) |
| C23 Elzéar | PH-10 (aviron) | CN-02 (relevé) non compté en mode strict, inutile |
| C29 Rose | PH-16, PH-10 (visages) | |

Contre-épreuve d'indépendance des deux entrées : `g-matrice` interdit, `g-oyard` seul ouvre la porte A
(C24 + 3 = 4 cases, `lockedCount` compte bien C24 : le moteur la verrouille à `newGame`) et les 28 autres
cases suivent aux mêmes couches ; `g-oyard` interdit, `g-matrice` seul fait de même. **Aucune
correction de contenu.** Pour lire un rapport du solveur, se fier aux couches ci-dessous, pas aux
numéros d'étape (demande éventuelle au `backend` : verrouiller avant de lire, ou publier les couches
dans le rapport).

### 19.2 Couches mesurées sur le contenu v1.0

Trois modes : « solveur » (termes cachés connus d'emblée, toute marque révélée compte), « déduit »
(termes cachés connus quand la pièce qui permet la déduction est lue : `y-d` ← OF-05 + RG-01 ou RG-02 ;
`code-o-g-ty` ← OF-05 + DV-02 ; `code-y-g` ← OF-05 + RG-05 ; `code-o-g` ← OF-05 + BD-01 ;
`code-o-g-g` ← OF-05 + BD-01 + (BD-06 ou PH-10)), « déduit + strict » (en plus, les relevés CN-01 à
CN-03 ne comptent pas comme marque, R7). **Les trois modes donnent les mêmes couches :**

| Couche | Pièces lues | Cases établies | Groupes établis | Secrets |
|---|---|---|---|---|
| 0 → 1 | 47 | 9 | `g-matrice`, `g-oyard` | S1 (couche 1) |
| 1 → 2 | 65 | 16 | `g-talons`, `g-ecole` | S4 |
| 2 → 3 | 98 | 28 | `g-goemard`, `g-lestaud`, `g-mer` | S3, S2 |
| 3 → 4 | 109 (+ EP-01, EP-02 = 111) | 32 | `g-garnaud` | — |

C'est exactement le §10.2 (47 / 65 / 98 / 109 ; 9 / 16 / 28 / 32), pièces par niveau d'arrivée
0 = 47, A = 18, B = 33, C = 11, épilogue = 2. Seule différence d'affichage : S2 tombe dans la couche des
trois groupes B (PV-06 exige C28–C31, établis là, et RG-20 suit LT-05, derrière C), avant `g-garnaud`.
Seul écart entre modes : C13 apparaît en couche 0 en mode « solveur » (CN-03 par `y-d`), en couche 1
sinon (voir §19.4, point 1). Le rapport réel : 0 erreur, 111 pièces, 134 mots-clés cherchés, 5 lieux,
32 cases, 4 secrets, 4 fins atteignables (243 combinaisons de rapport).

Contrôles de conformité au graphe (tous **conformes**) : portes A, B, C à deux clés (groupe ou
compteur) sur toutes les routes ; PV-03, Fonds Sollier (RG-01–RG-04, RG-22, LT-02, LT-04, PH-02,
PH-12, DV-02) et RG-07–RG-11 derrière A ; RP-05 derrière A + (RP-04, LT-02 ou BD-02) ; CP-01 hors de
PV-03 (B) ; auditions PV-01, PV-02, PV-04, PR-07 derrière B ; RG-13, PH-15, LT-05, PV-05, EX-01, EX-02
derrière C ; RG-19 derrière « C19 établie ou C » ; RG-20 après LT-05 ; PV-06 = RG-20 + C28–C31 (ou ≥ 28) ;
C14, C27, C32 révélées par RG-13, PH-15 ou EX-01 ; C13 par RG-01, RG-02, CN-03 ou LT-01 ; secrets S1–S4
et fins F1–F4 comme au §8 ; leurres lisibles à temps (`armateur` PR-03, `matelot` PR-04,
`gardien-de-phare` PV-03) ; calendrier du §12.6 respecté (PV-03 le 6 oct. … PV-06 le 4 nov.) ; BD-02 ne
nomme plus Blaise ; aucun code de l'arbre écrit en clair hors CN-01–CN-03 (OF-05 : `A-g`, `A-d`, `Y··`,
`/` ; OF-06 : `A-d`) ; RG-08 met les marques des parents au pied de l'acte, sans légende (§12.2 a) ;
la navette `A+P` est dans CN-02 et PH-10 (§12.1) ; mentions du §12.9 toutes présentes.

### 19.3 Écarts au plan (sans effet sur la solvabilité)

1. **`code-o-g-g` est caché** (`hiddenTerm`), le plan le disait lisible dans CN-02. Cohérent avec le
   texte (CN-02 ne porte en cote que `A-b` et `A-b-g`) : la marque d'Elzéar devient une déduction de
   plus. CN-02 reste atteint par BD-06 et « aviron ». À garder.
2. **Les noms des chefs rendent les mariages** (« Gervais Goémard » → RG-07, RG-08 ; « Clovis Oyard »
   → RG-07, RG-09 ; etc., porte A), contre §12.2 (b). Plus de routes, et la difficulté du talon tient au
   pied d'acte sans légende, qui est bien écrit. À garder.
3. **`y-d` a deux résultats de plus** : EX-01 (après PV-05, doublon de l'`unlock`) et EP-02 (après
   EP-01, doublon aussi). Neutres.
4. **PR-07** : B + OF-04 (le plan disait B + (PV-02 ou OF-04)) : équivalent, OF-04 est de départ.
5. **134 mots-clés** au lieu d'environ 90 : ajouts sans porte prématurée (contre-épreuve « un mot-clé
   retiré » : aucun ne casse rien).
6. **Les relevés CN-01 à CN-03 révèlent des marques** (`::mark` dans le tableau, donc
   `reveals.portraits`) : CN-01 les huit chefs et épouses, CN-02 Elzéar, Noël, Reine, Ernestine, Ursule,
   Benoît, CN-03 la marque de Blaise. Mesuré : **aucune case n'est établissable plus tôt** (mode strict
   identique). Mais voir le risque 19.4, point 2.
7. **Contre-épreuve « une pièce retirée » (§10.3) : fausse sur le contenu.** Trois auditions sont des
   **passages obligés** pour des cases :
   - **PV-01** (Edmée) → `g-garnaud` entier : les deux visages de C14 (PH-01, PH-17) et de C27 (PH-04,
     PH-07) ne viennent que par des résultats conditionnés à « PV-01 lu » ; C13 et C32 seules ne font pas
     le seuil.
   - **PV-02** (les Cabanes) → C22 Léontine : ses deux visages (PH-05, PH-06) sont remis à cette
     audition. PH-03 ne la porte pas (contrairement à ce que laissait entendre le §17.1).
   - **PV-04** (Aline) → C31 : PH-11 et PH-18 ne viennent qu'après PV-04, et le prénom « Aline » n'est
     écrit que dans RG-17 et PV-04.
   Pas d'impasse : les trois auditions sont débloquées à coup sûr (porte B + une pièce de départ ou de
   niveau 0 ; PV-01 a deux entrées, OF-03 et BD-07). Mais le principe « aucune pièce hors départ
   nécessaire à une case » n'est plus tenu. Les autres pièces nécessaires sont celles, voulues, des
   secrets (BD-04 → S4, LT-05 / RG-20 / PV-06 → S2, RG-19 → S3, RP-01 → S1).
8. **Les compteurs de porte ne sont pas des clés indépendantes** (déjà vrai dans le plan) : bloquer à la
   fois `g-talons` et `g-ecole` laisse 9 cases (le seuil de 12 est hors d'atteinte : aucun autre groupe
   n'est verrouillable au niveau A). Un joueur qui échoue aux deux reste au niveau A ; les aides des deux
   groupes sont donc critiques.

### 19.4 Cases et passages à risque (contenu v1.0)

1. **`Y-d` devinable par force brute au niveau 0.** OF-05 et OF-06 enseignent une notation où les codes
   à deux signes ne sont que huit (`Y-g`, `Y-d`, `O-g`… `P-d`). Un joueur méthodique les essaie tous dès
   la première demi-heure : `Y-d` rend CN-03 sans condition, ce qui **révèle C13** et, dans le moteur,
   rend sa marque (le dessin « de mémoire » de la cheminée) choisissable. Pas de fuite de validation (C13
   ne se verrouille qu'avec `g-garnaud`, niveau C), mais la case cachée apparaît avant le prologue, contre
   §7. Correction proposée (19.6, S1) : conditionner ce résultat à RG-01 ou RG-02, ce que la déduction
   exige de toute façon ; mesuré : couches inchangées, C13 en couche 1 dans les trois modes.
2. **Le talon court-circuité par CN-01.** CN-01 (niveau 0, par BD-05 ou « cimetière de Longuegrève »)
   donne les croix de Perrine, Toinette, Ursule et Apolline **sous leur prénom**, marque relevée à
   côté. La leçon de `g-talons` (attribuer une marque au pied d'un acte par sa tête et son talon) devient
   facultative : on recopie la planche. `g-talons` reste de niveau A (les métiers des épouses ne sont
   qu'aux registres), mais ce n'est plus la « vraie difficulté du niveau A » annoncée au §17.4. À arbitrer
   avec le scénariste (19.6, S4).
3. **C22 Léontine, C31 Aline, C14 Amélie, C27 Léandre** : deux visages chacun, mais derrière une même
   audition (19.3, point 7). Risque de jeu faible (les auditions sont des pièces qu'on lit), risque de
   graphe moyen : une retouche d'`unlocks` ou de texte sur PV-01, PV-02 ou PV-04 peut casser ces cases
   sans que `content:check` le signale, puisque le solveur ne fait pas de contre-épreuve. À rejouer après
   toute retouche.
4. **C25 Lazare, C26 Clément** : deux visages (PH-03 par PR-07, PH-05 par PV-02), indépendants : sûrs.
   **C28 Félix** : PH-09 (PV-02) et PH-14 (PR-07) : sûr.
5. **C06 Ursule** : sûre (PH-10 navette au niveau 0, RG-10 au niveau A). **C23 Elzéar** : une seule pièce
   autographe au niveau 0 (PH-10), puis RG-15 et RG-23 au niveau B : comme prévu (§17.3).
6. **C13 Blaise** : marque établissable au niveau B (LT-01, PH-08), huit pièces au total ; voulu.
7. **Niveau 0 très chargé** : 47 pièces et la moitié du texte (13 800 mots sur 27 600) sont ouvertes
   avant toute porte. Le prologue se ferme vite (OF-02 + « cadastre » → RG-05), mais un joueur qui lit
   tout avant d'établir quoi que ce soit passe plus d'une heure sans franchir de porte. Les aides de
   `g-matrice` (disponibles dès OF-02) doivent suffire ; à mesurer en playtest.
8. **Solveur optimiste sur les noms** (« Goémard », « Oyard » partout) et sur les marques de fille en
   autre âge : inchangé (§17.6), seul le playtest le mesure.

### 19.5 Aides progressives (`hints.json`, 116 indices)

Tous les indices ont un palier 1, 2, 3 pour chaque case non pré-remplie et chaque groupe ; les
`availableWhen` des cases cachées (C13, C14, C27, C32) attendent leur révélation. Deux indices citent
une pièce d'un niveau supérieur à leur disponibilité (règle du §15, leçon de `c17-2` en affaire 2) :

- **`c13-2`** (disponible à RG-01, niveau A) nomme « la lettre fermée de 1908 » (LT-01, niveau B).
- **`c06-2`** (disponible à PH-10, niveau 0) nomme « le mariage de 1885 » (RG-10, niveau A).

Le reste est conforme (les « Pièce utile » de C21–C32 attendent la photographie citée ; `g-garnaud-2`
et `-3` au niveau A nomment le puîné : c'est le « soupçon tôt » voulu, la preuve reste au niveau C).

### 19.6 Corrections à faire dans `content/`

Aucune correction **bloquante** dans les champs de progression : le contenu est solvable de bout en bout,
sans deviner, avec les couches voulues. Un seul point bloque la vérification dans le dépôt lui-même :

| Bloquant | Fichier | Champ | Valeur |
|---|---|---|---|
| B1 | `content/cases/marques-de-longuegreve/case.json` | (fichier absent) | Le créer (périmètre scénariste / `game-designer`) : sans lui, `content:check` classe l'affaire en brouillon et ne la compile ni ne la résout. La version de la racine de test convient : `id`, `title`, `subtitle`, `version: "0.1.0"`, `intro: "of-01"`, `epilogue: "ep-01"`, `timedTargetsMs: [10800000, 16200000, 25200000]` (3 h, 4 h 30, 7 h, §8), `credits`, `order: 3`. |

| Souhaitable | Fichier | Champ | Valeur |
|---|---|---|---|
| S1 | `progression.json` | `keywords[id="y-d"].results[0]` (CN-03) | ajouter `"requires": {"any": [{"read": "rg-01"}, {"read": "rg-02"}]}` (19.4, point 1). Mesuré : couches inchangées, C13 en couche 1. |
| S2 | `progression.json` | `keywords[id="service-des-reserves"].results` et `keywords[id="aline-lestaud"].results` | ajouter à chacun `{"documents": ["ph-11"], "requires": <porte B>}` avec porte B = `{"any": [{"groupLocked": "g-talons"}, {"groupLocked": "g-ecole"}, {"lockedCount": {"gte": 12}}]}`. PH-11 vient de la photothèque du Service des Réserves (« versé en 1977 »), pas de l'audition : sa route sans PV-04 est diégétique. Mesuré : C31 ne dépend plus de PV-04 ; couches inchangées. |
| S3 | `hints.json` | `c13-2.availableWhen` | `{"unlocked": "lt-01"}` (ou garder `rg-01` et réduire le texte à « Pièce utile : le premier cahier de la copie Brémoy. ») |
| S4 | `hints.json` | `c06-2.text` | « Pièce utile : la photographie du hangar à bateaux (1964). » (la mention du mariage de 1885 reste au palier 3 de C19 et de `g-talons`) |
| S5 | `documents/cn-01.md` (texte, scénariste) | lignes 2, 4, 6, 8 du tableau | À arbitrer : soit garder (CN-01 comme appui, la leçon du talon devient facultative, 19.4 point 2), soit grouper les quatre croix d'épouses sans nom dit (« les femmes, je ne vous dirai pas laquelle est laquelle : lisez le talon ») pour faire de la planche un exercice de talon. Aucun effet sur les couches dans les deux cas. |
| S6 | `progression.json` (et textes, scénariste) | routes des visages de C14 / C27 (PH-01, PH-17, PH-04, PH-07) et de C22 (PH-05, PH-06) | À arbitrer : ces visages sont remis aux auditions PV-01 et PV-02 (provenance écrite dans les pièces), donc passages obligés diégétiques. Soit accepter (consigné ici, 19.3 point 7), soit donner à **un** visage par case une seconde provenance hors audition (par exemple PH-17 « communiqué par la librairie Ferlay », rendu par « librairie Ferlay » à la porte B sans PV-01). Pas d'impasse dans les deux cas. |
| S7 | `progression.json` | `keywords[id="y-d"].results` (EX-01 et EP-02) | facultatif : retirer ces deux résultats, doublons des `unlocks` (ou les garder pour que la recherche liste ces pièces : neutre). |

Hors périmètre `content/` : `achievements.json` `lg-lire-la-greve` (`searched: y-d`) s'obtient aussi par
la force brute de 19.4 point 1, même après S1 (la recherche est enregistrée sans résultat) ; à voir avec le
`game-designer` (`all(searched y-d, read rg-01)` par exemple, ou l'accepter).

### 19.7 Durée revue

Texte réel : **27 600 mots** (affaire 2 : 38 700), répartis 13 800 au niveau 0, 4 900 au niveau A, 5 400
au niveau B (beaucoup de photographies : peu de mots, beaucoup de comparaisons), 3 100 au niveau C,
500 pour l'épilogue. Moins à lire que prévu, mais une grammaire des marques à apprendre et sept bandes
au niveau 0.

| Phase | Joueur moyen |
|---|---|
| Prologue (`g-matrice`) | 15–25 min |
| Niveau 0 : entrée Victoire (`g-oyard`), presse, bandes | 1 h – 1 h 30 |
| Niveau A (talons, école ; S1) | 45 min – 1 h 15 |
| Niveau B (Goémard, Lestaud, mer ; S3, S4) | 1 h 15 – 2 h |
| Niveau C (Garnaud ; S2) | 40 min – 1 h |
| Rapport, tampon, épilogue | 20–30 min |
| **Total** | **4 h 15 – 6 h 40** (plan : 4 h 30 – 6 h 50) |

`timedTargetsMs` (3 h, 4 h 30, 7 h) : à garder. Le succès `lg-archiviste-eclair` (1 h 35) suppose le
chemin critique du §11 (≈ 40 lectures, ≈ 10 000 mots) sans détour : jouable en seconde partie seulement.

### 19.8 Rejouer

Scripts hors dépôt (comme pour les affaires 1 et 2) : export du modèle par `checkContentRoot()` +
`solverModelFor()` de `@arbre/content-tools`, puis solveur « en couches » (trois modes ci-dessus),
contre-épreuves « une pièce retirée », « un mot-clé retiré », « un groupe interdit », et application
des corrections S1–S2 sur une copie du modèle. À rejouer après toute retouche des JSON ou des pièces ; les
attendus sont ceux du tableau 19.2 et, après S2, aucune case perdue au retrait de PV-04.
