# Level design — affaire `succession-varenque`

> Auteur : `level-designer` · v0.1 · 13 oct. 2026 · lot C3.
> Fichiers tenus : `content/cases/succession-varenque/{tree,progression,hints,achievements}.json`.
> Sources : bible `docs/scenario/` (02-arbre, 05-secrets-et-fins, 06-corpus, 07-coherence), règles
> `docs/game/GAME_DESIGN.md` §7–§10 et §13, contrat `docs/ARCHITECTURE.md` §3.
> Preuve de solvabilité : §8 (solveur réel de `content-tools`, corpus complet de 118 pièces).

## 1. Principes retenus

| Principe | Mise en œuvre |
|---|---|
| Plusieurs entrées ouvertes (P2) | 7 pièces de départ (OF-01 à OF-07), 4 points d'entrée narratifs, 4 groupes ouverts dès la fin du prologue. |
| Chaque case par ≥ 2 chemins | ≥ 2 pièces pour le prénom et ≥ 2 pour le nom (règle du solveur), ≥ 2 pièces de visage sauf exceptions listées au §7 ; contre-épreuve « une pièce retirée » au §8.3. |
| Aucune case par une pièce isolée | Seule C09 (Adélaïde, tutoriel) est pré-remplie. Les cases C01 et C24, « partielles » dans la bible, ne sont **pas** pré-remplies (le contrat ne connaît que la case entière) : OF-01/OF-04 donnent leurs noms et métiers dès le départ. |
| Difficulté qui monte par branche | Trois niveaux de portes douces (§4), pièges croissants (homonymes → surnoms et graphies → noms de scène, fonds restreints, adoption). |
| Jamais d'impasse (P3) | Conditions monotones partout (le `not` n'apparaît que dans les fins et les succès) ; chaque porte a au moins deux clés, dont un compteur de cases établies. |
| Anti-force brute (§4.4) | Fonds restreints sur « Prénom Nom » exact, plus une condition de connaissance (`requires`) : un terme deviné au hasard ne rend rien. |

## 2. Points d'entrée

| Pièce de départ | Ce qu'elle ouvre (mots-clés et lieux) | Branche amorcée |
|---|---|---|
| OF-01 lettre de mission | « Anselme Varenque », « Firmin Varenque », « Papeteries », lieux Aubrelieu et Moulinvert | Prologue (fondateurs), Phare |
| OF-02 testament | prénoms de toute la famille, « Tennok » (révèle le lieu), « absents » | Prologue, Phare, Atelier (« Lucien »), Absents |
| OF-03 portrait d'Adélaïde | « Adélaïde Varenque », « institutrice » | Tutoriel (C09 complète) |
| OF-04 opposition d'Armand | « Armand Varenque », « Hélène Marsal », « Blanche Daubry », « Gaspard Varenque », « Desaulnes » | Héritiers, Tilleuls, Absents |
| OF-05 mode d'emploi du Lecteur | « Lecteur LX-2 », « C. Sauge », « CVC » | Atelier (par la petite-fille) |
| OF-06 inventaire du fonds | « L. Daubry », « herbier », « registre bleu », « MF-74-112 » | Absents, secret S2 |
| OF-07 lettre anonyme | « Vellaak » (révèle le lieu), « photographe » | Phare, secret S1 |

Lieux visibles d'emblée : Aubrelieu (annuaires 1906 et 1935, affiche de l'Opéra) et Moulinvert
(naissances 1872–1879, photo des Tilleuls 1885). Les douze autres lieux apparaissent sur la carte
quand une pièce lue les mentionne (`revealedBy`).

## 3. Arbre et groupes de validation (`tree.json`)

30 cases, 4 générations, colonnes de mise en page de 0 à 14 (Tilleuls à gauche, Atelier au centre,
Phare à droite). Pré-remplie : C09. Cachées : C19, C29 (révélées par le verrouillage de C18 : on
découvre la famille de Victor) ; C21, C30 (révélées par la lecture de RG-10 ou PH-20).

| Groupe | Cases | Niveau | Ce qui le rend difficile |
|---|---|---|---|
| `g-fondateurs` (prologue) | C01 Anselme, C02 Clémence, C05 Augustin (1872) | 0 | Tutoriel : visage par couple (PH-01), puis par âge (PH-02). Homonyme C23 déjà visible. |
| `g-atelier` | C07 Lucien, C08 Pauline, C18 Victor, **C19** Ninon, **C29** Claude | A | Enfant naturel, visage idéalisé d'affiche, leurre `modele` ; deux cases cachées. |
| `g-cap` | C03 Firmin (1849), C04 Maaren, C10 Aldrik, C11 Tenna | A | Homonyme des Firmin, « famille du gardien » (genre supposé), graphies -essa. |
| `g-heritiers` | C24 Armand, C25 Mathilde, C26 Hélène, C27 Paul | A | Noms d'usage, même métier que Selda (journaliste). |
| `g-tilleuls` | C06 Henriette, C12 Gaspard, C13 Irène, C23 Augustin (1924) | B | Homonymes Augustin, « directeur » vs « industriel », PH-05 à légende déchirée. |
| `g-vellaak` | C20 Firmin (1900), **C21** Hessa, C22 Selda, **C30** Tavik | B | Surnoms (le Goéland, Maask), ostrien, deux cases cachées, trois anneaux d'or. |
| `g-absents` | C14 Blanche, C15 Marcel, C16 Odile, C17 Orrin, C28 Lise | C | Nom de scène, leurre `comptable`, déclarée morte, fonds restreints, adoption. |

Partition : 3 + 5 + 4 + 4 + 4 + 4 + 5 = 29 cases non pré-remplies, seuil 3 partout. Le groupe
`g-atelier` ne peut verrouiller ses trois premières cases (C07, C08, C18) qu'ensemble, puis ses deux
dernières se verrouillent à deux (R8) : ce sont celles qu'un document entier vient de révéler.
`g-vellaak` n'a que deux cases visibles tant que RG-10 ou PH-20 n'est pas lu : il ne peut pas se
verrouiller avant, ce qui est voulu.

## 4. Portes douces (trois niveaux, GAME_DESIGN §8.2)

Certaines pièces de **visage** (le goulot réel du solveur et du joueur) ne sont rendues par le
Lecteur, ou apportées par un lieu, qu'une fois une porte ouverte. Diégèse : l'archiviste ne monte
les cartons suivants qu'après un tampon de la Commission. Toutes les portes sont des `any` :

| Porte | Condition | Pièces derrière la porte |
|---|---|---|
| B-Tilleuls | `g-heritiers` établi **ou** ≥ 8 cases établies | PH-05, PR-08, PR-12, PH-11, PB-04, PR-11, DV-02, LT-12 |
| B-Vellaak | `g-cap` établi **ou** ≥ 12 cases | PH-14, PH-15, PH-20, PH-29, PR-13, CT-02, RG-19 |
| C-Absents | `g-tilleuls` **ou** `g-vellaak` établi **ou** ≥ 16 cases | PH-06, PH-13, PH-19, PH-24, PR-06, PH-21, PH-26 et les 4 pièces restreintes (PH-16, PH-17, RG-14, RP-02) |

Dépendance maximale : 0 → A → B → C (trois niveaux, conforme au plafond de GAME_DESIGN). Les
compteurs (8, 12, 16) garantissent qu'aucun groupe n'est la porte unique d'un autre : un joueur qui
bute sur le Phare peut ouvrir les Absents par les Tilleuls, et inversement.

Effet mesuré (solveur « en largeur », §8.2) : les groupes A se verrouillent à la couche 2 (atelier
à 3, il attend sa case cachée), les groupes B à 3, la branche des Absents se termine à 4. La branche Absents peut faire un
premier verrouillage de trois cases dès le niveau B (Blanche et Marcel par PH-05, Lise par PH-28) ;
Odile et Orrin attendent le niveau C.

## 5. Déblocages

### 5.1 Mots-clés (`keywords`, 165)

Les termes sont ceux écrits dans les pièces (liens automatiques, le plus long d'abord). Familles :

- **Noms complets** (« Prénom Nom » et formes inversées des registres et annuaires : « Varenque
  Odile », « Sauge C. », « Marsal Hélène », « Ilvess Nora », « VARENQUE Augustin ») : rendent les
  actes et la presse de la personne.
- **Prénoms seuls** (« Lucien », « Hessa », « Lise »…) : rendent les photos légendées au prénom et
  les lettres. Jamais « Blanche » (adjectif courant : « mèche blanche »).
- **Noms d'usage séparés** (« Blanche Daubry », « Hélène Marsal », « Maaren Tennokessa »,
  « Hessa Draavikessa ») : ce sont des mots-clés distincts, pour que le carnet ne révèle pas
  l'équivalence que le joueur doit établir.
- **Lieux, organisations, événements, objets, qualités** (« canot de sauvetage », « carnets gris »,
  « Phares et Balises », « speakerine »…).
- **Pièges volontaires** : « A. Varenque » rend à la fois l'annuaire de 1906 (Anselme) et la carte
  du canot (Aldrik) ; « Augustin Varenque » rend les deux Augustin (PB-04 compris).

### 5.2 Verrous des pièces restreintes (R)

| Pièce | Terme exact | Condition de connaissance (`requires`) | Porte |
|---|---|---|---|
| PH-16, RG-14 | « Odile Varenque » (ou « Varenque Odile ») | avoir lu RG-05, RG-13, PH-06 ou PR-09 | C-Absents |
| PH-17, RG-14 | « Orrin Kessvel » (`hiddenTerm`) | avoir lu RG-13, ou LT-08 **et** PH-13 | C-Absents |
| RP-02 | « Marcel Daubry » (ou « Daubry Marcel ») | avoir lu PR-09, RG-16, PR-08 ou PR-10 | C-Absents |

Le solveur suppose les `hiddenTerm` connus dès le départ ; la condition de connaissance empêche
qu'il (et un joueur qui devinerait) ouvre ces pièces avant d'avoir lu les deux moitiés du nom.

### 5.3 Déblocages directs (`unlocks`)

| Pièce | Condition | Rôle |
|---|---|---|
| LT-18 | `g-atelier` établi | **Jalon** de l'Atelier et fin de la démo (aucun mot-clé ne la rend). |
| PH-18 | C18 établie | L'album des Sauge, avec les deux cases qu'il révèle. |
| DV-02 | `g-fondateurs` établi ou PH-05 lu (et porte B) | Plan de table : lève les légendes déchirées de PH-05. |
| RG-18 | `g-fondateurs`, PR-17 ou PR-18 | Le caveau, après le prologue. |
| LT-06 | LT-05 ou RG-20 lu | Copie jointe au dépôt Brunesseau (S3). |
| LT-12 | PB-04, PR-11 ou PR-17 lu (et porte B) | La lettre de Gaspard après la mort de son fils (S2). |
| LT-11 / DV-05 | l'un par l'autre, ou LT-10, PH-20, `g-cap` | « Maask » et le lexique ostrien. |
| LT-15 / RP-06 | LT-14 ou DV-03 / LT-15 | La réponse de « N. » et l'expertise du papier (S1, S2). |
| RG-15 | RP-04 lu | La cote donnée par la Commission de 1953. |
| PB-04, CT-02, PR-16, LT-16, LT-17, CP-01, RP-05 | recoupements | Seconde route pour des pièces que la presse cite. |
| EP-01 | 30 cases + 6 secrets + **toutes les pièces non optionnelles débloquées** | Épilogue allégé (décision : pas les 116 lectures). EP-02 suit EP-01. |

### 5.4 Lieux (`places`, 14 `PlaceId` de `docs/monde/`)

Aubrelieu et Moulinvert visibles d'emblée ; Tennok, Vellaak, Port-Sénane, Saint-Ormel,
Bains-de-Mérande, Grisenoue, Kessaar, Brenzac, col de Corvenne, monts Corvins, forêt de Sorbe et
lac d'Aulne révélés par la lecture d'une pièce qui les nomme. Chaque lieu apporte ses pièces
« publiques » (registres locaux, presse locale, cartes postales). Aucune pièce n'est accessible
**seulement** par la carte (GAME_DESIGN §9) : toutes ont aussi une route au Lecteur ou un déblocage.

### 5.5 Métiers (`occupationsUnlock`)

Chaque métier (28 justes + 4 leurres : `comptable`, `photographe`, `modele`, `industriel`) entre
dans le sélecteur dès qu'une des pièces qui l'établissent (07 §1, colonne M) est lue. C'est
redondant avec les `reveals.occupations` des frontmatters, à dessein : le sélecteur ne dépend pas de
l'exhaustivité des frontmatters.

## 6. Secrets, rapport et fins

| Secret | Pièces clés (toutes lues) | Niveau |
|---|---|---|
| `s3-reconnaissance-de-1917` | RG-20, LT-05, LT-06 | A (Atelier) |
| `s4-goeland-et-albatros` | RP-01, LT-13 | A (Phare) |
| `s2-registre-bleu` | DV-03, LT-12, RP-06 | B |
| `s1-photographe-de-vellaak` | PH-26, RG-19, LT-15 | C |
| `s5-delateur` | RP-02 (R), RP-04, PH-27 | C |
| `s6-secret-d-adelaide` | LT-11, LT-14, RG-14 (R) | C |

**Rapport final** (`report`) : Q1 à Q6 de 05 §2 et le choix moral `choix-nora` (posé seulement si
Q2 = « Nora Ilvess »). Une option juste n'est proposée que si son secret est découvert ; « Gaspard »
à Q1 demande PR-16 lu ; « Oui, comme le dit le registre » à Q2 demande RG-14 ou RG-18 ; « Non
établi » est toujours proposé.

| Fin | `priority` | `when` (arbre complet compris) |
|---|---|---|
| `f5-l-arbre-entier` | 5 | les six réponses justes + `inscrire` |
| `f4-la-mere-et-la-fille` | 4 | Q2 = Nora Ilvess + `inscrire` |
| `f4-la-mere-et-la-fille-absente` | 4 | Q2 = Nora Ilvess + `taire` |
| `f3-les-deux-visages` | 3 | Q1 = Marcel + Q3 = fourni |
| `f2-le-faux-coupable` | 2 | Q1 = Gaspard |
| `f1-dossier-conforme` | 1 | arbre complet |

Sections : `[S2]` à `[S6]` s'affichent si la réponse juste correspondante est donnée, `[Q3 fourni]`
(F2) si Q3 = fourni ; les autres sections étiquetées sont toujours affichées (`lockedCount ≥ 0`).
Les sections communes en double ont reçu une étiquette propre (le parseur refuse deux `[commun]`).

**Démo** (`demo`) : 38 pièces (dossier de départ, prologue, Atelier, S3), cases du prologue et de
l'Atelier, fin = LT-18 (lettre de Claude Sauge : « une lavandière et une affiche »).

## 7. Tableau de preuves par case (chemins)

N = nom, V = visage, M = métier ; « → » = recherche au Lecteur ; (R) restreinte ; [B]/[C] derrière
une porte. Chemin 1 et chemin 2 n'ont aucune pièce de visage en commun sauf mention.

| Case | Chemin 1 | Chemin 2 | Risque |
|---|---|---|---|
| C01 Anselme | OF-01 → « Anselme Varenque » → PH-01 (V), RG-01, PR-01 | Moulinvert → RG-01 → PH-02 (V, cicatrice) | faible |
| C02 Clémence | OF-02 → « Clémence » → PH-01 (V), LT-01 | Moulinvert → RG-01 (Aubertot) → PH-02 (V) ; PR-01 (botaniste) | faible |
| C05 Augustin 1872 | OF-02 → « Augustin Varenque » → PB-02 (V, député), PR-03 | Moulinvert → PH-02 (V, 13 ans) ; RG-17 | moyen (homonyme) |
| C07 Lucien | OF-02 → « Lucien » → LT-03, PH-02 (V) | « rue des Tanneurs » → AN-01 → PH-08 (V) ; « La Lavandière » → CT-01 (V) | faible |
| C08 Pauline | « Victor » → RG-06 (N, M) → « Pauline Sauge » → PH-09 (V) | « La Lavandière » → PB-01 (V) ; AN-01 → PH-08 (V) | moyen (leurre `modele`) |
| C18 Victor | RG-06 → « Victor Sauge » → PH-07 (V), PR-07 | « Aéro-Velmarche » → LT-07 ; PR-15 (V) | faible |
| C19 Ninon | « Victor Sauge » → RG-11 (N, M) | « Ninon » → PR-15 (V) ; PH-18 (V, album) | **élevé** : « Brial » dans RG-11 seulement ; prénom dans 2 pièces avant la porte C |
| C29 Claude | OF-05 → « Lecteur LX-2 » → PH-28 (V, M) | RG-11 (marge) → PR-15 (V, M) | moyen (genre, AN-03) |
| C03 Firmin 1849 | OF-01 → « Firmin Varenque » → RG-02, PR-02 (V) | Tennok → « Firmin » → PH-03 (V) → LT-02 | moyen (homonyme) |
| C04 Maaren | « Maaren » → PH-03 (V) → RG-02 → LT-02 | Tennok → AN-04 → PH-04 (V) | moyen (genre supposé) |
| C10 Aldrik | Tennok → RG-03 → « Aldrik Varenque » → PR-05, RP-01 | « canot de sauvetage » → PH-10 (V) → PH-04 (V) | faible |
| C11 Tenna | RG-03 → « Tenna Orrvik » → PH-12 (V) | CP-02 « T. Orrvik » → « Orrvik » → PH-12 ; PH-04 (V) | faible |
| C24 Armand | OF-04 → « Armand Varenque » → PH-22 (V) | « Armand » → PR-17 (V) ; AN-03 | faible |
| C25 Mathilde | OF-04 → « Armand Varenque » → PH-22 (N, V, M) | « Mathilde » / « RTV » → PH-23 (V, M) | **élevé** : « Rouvière » dans PH-22 seulement (le nom d'usage Varenque est accepté) |
| C26 Hélène | OF-04 → « Hélène Marsal » → AN-03, LT-16, PR-17 (V) | « Hélène » → RG-09 → « Paul Marsal » → PH-25 (V) | faible |
| C27 Paul | PH-25 → « Paul Marsal » → PR-16 (V) | AN-03 → LT-16 → PR-16 ; PR-17 (V) | faible |
| C06 Henriette | « Œuvre des Lavandières » → PH-09 (V) → LT-04 | « Sorbelle » → RG-04, DV-04 ; PH-05 n° 4 [B] | moyen (nom d'usage) |
| C12 Gaspard | OF-04 → « Gaspard Varenque » → PR-08 [B], PR-12 [B] (V) | « carnets gris » → PR-08 [B] ; PH-05 n° 1 [B] | moyen (trois âges) |
| C13 Irène | « Gaspard Varenque » → RG-07 → « Irène Castagne » → PH-11 [B] | PH-05 n° 2 [B] + DV-02 [B] | moyen (2 visages, tous deux [B]) |
| C23 Augustin 1924 | RG-09 → « Augustin Varenque » → PB-04 [B] | « Fougère » → PR-11 [B] ; PR-17 (N) | moyen (homonyme) |
| C20 Firmin 1900 | RG-03 → « Hessa » → PH-14 [B] → RG-10 | « Selda Varenque » → PH-20 [B] ; « le Goéland » → PR-13 [B] | moyen (surnoms) |
| C21 Hessa | RG-10 → « Hessa » → PH-15 [B] | PH-14 [B] (« Draavikessa ») ; CP-02 | **élevé** : 2 visages seulement (PH-14, PH-15) |
| C22 Selda | « absents » → RG-12 → « Selda Varenque » → PH-20 [B] | « Vel Taalik » → PH-13 [C] ; LT-13, LT-17 | moyen |
| C30 Tavik | RG-10 → « Tavik Varenque » → PH-29 [B] | AN-04 ; PH-20 [B] ; LT-13 | faible |
| C14 Blanche | OF-04 → « Blanche Daubry » → RG-08 ; PH-05 n° 7 [B] + DV-02 | « Blanche Aubertine » → PR-06 [C], PH-21 [C] ; AN-02 | moyen (nom de scène) |
| C15 Marcel | RG-08 → « Marcel Daubry » → PR-08 [B] (V) | « Lise » → RG-16 (M) → PH-19 [C] (V) ; RP-02 (R) | moyen (leurre `comptable`) |
| C16 Odile | OF-02 → « Odile » → RG-05 ; « Odile Varenque » → PH-06 [C] | « absents » → RG-12 → « Bulletin d'Ordre » → RG-13 ; PH-05 n° 8 [B] ; PH-16 (R) | moyen |
| C17 Orrin | RG-13 → « Orrin Kessvel » (R) → PH-17 [C] | LT-08 « Orrin » → « Vel Taalik » → PH-13 [C] | **élevé** : 2 visages, tous deux [C] |
| C28 Lise | OF-06 → « L. Daubry » → PH-28 (V) ; « Lise » → RG-16, LT-09 | « Lise Daubry » → PH-24 [C] (V, mèche) ; CP-03 | moyen (adoption) |

## 8. Preuve de solvabilité

### 8.1 Solveur réel (`npm run content:solve -- --report`)

Exécuté sur le corpus complet (118 pièces) dans une racine temporaire où seuls les lots des autres
agents encore absents sont bouchonnés (lieux du monde, portraits, illustrations). Résultat :

- 118/118 pièces atteintes, 165 mots-clés cherchés, 14 lieux visités ;
- **30/30 cases établies** dans l'ordre fondateurs → atelier → cap → héritiers → tilleuls → vellaak
  → absents ;
- **6/6 secrets** ; **6/6 fins atteignables**, toutes vraies à 100 % selon les réponses ; 288
  combinaisons de réponses explorées ;
- démo : LT-18 atteinte (étape 114), cases du prologue et de l'Atelier établies.

Les seules erreurs restantes viennent d'autres lots (voir §9).

### 8.2 Profondeur (solveur « en largeur », script temporaire)

Une couche = lire tout ce qui est débloqué, visiter tout lieu visible, chercher tout mot-clé lu, puis
verrouiller. Sur les 118 pièces réelles : groupes fondateurs, cap et héritiers à la couche 2 ;
atelier, tilleuls et vellaak à 3 ; absents à 4 (C17 Orrin est la seule case à la couche 4).
Secrets : S2, S3, S4 à 3 ; S1, S5, S6 à 4. Le « joueur méthodique » cherche tout ce qu'il lit : les
couches sous-estiment le temps réel, mais l'ordre relatif (A < B < C) est celui voulu.

### 8.3 Contre-épreuve « une pièce retirée »

Pour chaque pièce non initiale (puis chaque mot-clé), on la retire et on relance le solveur : voir
ce qui casse.

- **Aucune pièce isolée n'est nécessaire à une case** : retirer n'importe laquelle des 111 pièces non
  initiales laisse les 30 cases établissables. C'est la preuve mécanique de « chaque case par au
  moins deux chemins » (au sens du solveur : nom, visage et métier).
- Pièces nécessaires à un secret : ses pièces clés seulement (voulu, 07 §5) : RG-20, LT-05, LT-06
  (S3) ; RP-01, LT-13 (S4) ; DV-03, LT-12, RP-06 (S2) ; PH-26, RG-19, LT-15 (S1) ; RP-02, RP-04,
  PH-27 (S5) ; LT-11, LT-14, RG-14 (S6).
- Toute pièce est nécessaire à l'épilogue (EP-01, EP-02), par définition (« toutes les pièces non
  optionnelles débloquées »).
- Mots-clés dont l'absence casse quelque chose : « Odile Varenque » (PH-16), « Orrin Kessvel »
  (PH-17), « Marcel Daubry » (RP-02), soit exactement les verrous des fonds restreints. Aucun autre.
- Pièces à une seule entrée de déblocage : LT-12, LT-15, RP-06 (une condition `any` à 2 ou 3
  branches chacune), LT-18 (jalon), PH-16, PH-17, RP-02 (restreintes), EP-01, EP-02.

## 9. Points faibles et cases à risque

Voir les colonnes « Risque » (§7) et la contre-épreuve (§8.3). À surveiller en playtest :

1. **C17 Orrin** : ses deux visages (PH-13, PH-17) sont derrière la porte C. C'est la dernière case
   du jeu pour la plupart des joueurs, et la seule à exiger un terme restreint pour un 2ᵉ visage.
2. **C21 Hessa** : deux pièces de visage seulement (PH-14, PH-15), toutes deux [B].
3. **C25 Mathilde** et **C19 Ninon** : le nom de naissance (Rouvière, Brial) n'est écrit que dans
   une pièce ; le solveur passe grâce au nom d'usage accepté (Varenque, Sauge).
4. **PH-05** (mariage 1922) porte 10 visages et sert trois branches : sa porte B est le point
   d'équilibre de la courbe ; ne pas la durcir.
5. Le **solveur est optimiste** sur les prénoms : « Augustin » ou « Firmin » lus n'importe où comptent
   pour les deux homonymes. Les vraies difficultés (homonymes, noms de scène) ne se mesurent qu'en
   playtest.
6. Trois rôles de la bible ne sont pas exprimables tels quels : les cases « partielles » C01 et C24
   (contrat : pré-remplie ou non) ; les succès qui comptent les visages, les requêtes combinées, les
   épingles ou les notes d'atelier (aucune condition ne les observe) : ils ont été retirés de la liste.

## 10. Régénérer

Les quatre JSON sont la source de vérité (le générateur et le script de contre-épreuve ayant servi
à les produire sont restés hors du dépôt). Après toute retouche : `npx prettier --write content`,
`npm run content:check`, `npm run content:solve -- --report`. Toute retouche doit garder : partition des groupes, conditions monotones hors fins et succès, `lt-18` hors de tout
résultat de recherche (jalon de la démo).
