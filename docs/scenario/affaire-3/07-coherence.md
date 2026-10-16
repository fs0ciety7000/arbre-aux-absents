# 07 — Tableau de cohérence (affaire 3)

> Pour chaque case : quelles pièces prouvent le **nom** (N), le **champ** (K marque ou V visage), le
> **métier** (M) ; au moins **deux chemins** ; les **fausses pistes** et leur levée ; les âges sur les
> photos ; les preuves des secrets ; les contrôles de la grammaire des marques ; les points à vérifier.
> Base de travail du `level-designer` (graphe, solveur) et de la relecture QA. « Départ » = OF-01 à
> OF-08 + BD-01.

## 0. Invariants

- [x] 32 cases ; N, champ et M couverts par **au moins deux pièces distinctes** chacun (§1), sauf C24
      (établie au départ).
- [x] **19 cases à marque, 13 à visage** ; la nature du champ est affichée par l'interface et justifiée
      dans le monde (OF-01, art. 15, al. 2 ; RG-22 pour Elzéar).
- [x] Les **23 marques justes et 11 leurres** sont deux à deux distincts (`09-marques.md` §3) ; chaque
      marque juste se calcule par les règles R1–R6 à partir de la place dans l'arbre, et réciproquement.
- [x] **L'exception R6** (barre) est annoncée par une **pièce de départ** (OF-05) avant d'être
      nécessaire, puis redite (BD-03, PV-05) ; la marque de mer `/` (leurre D3) l'illustre dès OF-05.
- [x] **Aucune marque n'est prouvée seulement par un relevé** (carnet Marest) : chaque marque juste est
      montrée par au moins une pièce **autographe** ou une **croix** (R7) et par une seconde pièce.
- [x] Aucune case ne dépend seule d'une pièce à déblocage tardif (PV-06, DV-01, OB-02 servent S2 et S4,
      jamais une case).
- [x] La branche cachée Garnaud a **trois portes** (RG-13, PH-15, EX-01) ; Blaise lui-même **trois**
      (RG-01, RG-02, BD-02).
- [x] Les surnoms (*le garnaud*, *l'enfant de mer*, *la maîtresse*), les codes de marque et les noms de
      maison seuls ne sont jamais la réponse (`02-arbre.md` §2).
- [x] Aucun métier ne désigne deux métiers d'une même personne ; la règle « connu comme tel dans au
      moins deux pièces » est écrite dans OF-01. Leurres `matelot`, `armateur`, `gardien-de-phare` :
      chacun n'a qu'une pièce, contredite par au moins deux.
- [x] Dates et jours de la semaine vérifiés (`03-chronologie.md`) ; âges cohérents (§4).
- [x] Monde : aucun lieu, personne ou institution réels ; aucun train ; caméos neutres (Ferrandot, C.
      Sauge, Studio Lumen, *Duchesse-d'Ambre*, Dumesnil-Corre, Phototypie de l'Orvelle) ; rien des
      affaires 1 et 2 n'est dévoilé.

## 1. Tableau par case

| Case | Nom | Champ (K / V) | Métier |
|---|---|---|---|
| C01 Gervais | OF-02, RG-01, RG-05, RG-07, CN-01 | K : OF-02, RG-05, RG-07, RG-08, RG-24 (+ CN-01, PH-09) | OF-02, RG-01, RG-07, RG-08, RG-13 |
| C02 Perrine | RG-01, RG-07, RG-08, CN-01 | K : RG-07, RG-08 (+ CN-01, PH-09) | RG-01, RG-07, RG-13 |
| C03 Clovis | OF-02, RG-01, RG-07, RG-09, CN-01 | K : OF-02, RG-05, RG-07, RG-09 (+ CN-01) | OF-02, RG-01, RG-07 |
| C04 Toinette | RG-01, RG-07, RG-09, CN-01 | K : RG-07, RG-09 (+ CN-01, PH-09) | RG-01, RG-07, BD-05 |
| C05 Siméon | OF-02, RG-01, RG-02, RG-10, RG-19 | K : OF-02, RG-05, RG-10, RG-19, RG-24 | OF-02, RG-02, RG-10, BD-03 |
| C06 Ursule | RG-01, RG-02, RG-10, CN-01 | K : RG-10, CN-01, PH-09 (croix) | RG-01, RG-10 |
| C07 Lubin | OF-02, RG-01, RG-08, RG-09, RG-10 | K : OF-02, RG-05, RG-08, RG-09, RG-10 | OF-02, RG-01, RG-08 |
| C08 Apolline | RG-01, RG-08, RG-09, CN-01 | K : RG-08, RG-09, RG-10 (+ CN-01) | RG-01, RG-08, BD-05 |
| C09 Josse | RG-01, RG-05, RG-08, RG-15, BD-02 | K : RG-05, RG-07, RG-08, RG-15, RG-19, RG-24, LT-06 | RG-08, RG-15, RG-24, BD-04 |
| C10 Reine | RG-01, RG-08, RG-15, PV-02 | K : RG-15, CN-02 (fuseau) ; fille `P·` : RG-08 | RG-08, RG-15, BD-04 |
| C11 Jacquette | RG-01, RG-07, RG-15, RG-18, BD-01 | K : RG-15, RG-18 ; fille `Y·` : RG-07 | RG-03, RG-15, RG-18, RP-04 |
| C12 Médard | RG-01, RG-07, RG-03, BD-01, DV-02 | K : RG-05, RG-07, RG-08, RG-19, RG-24, LT-06 | RG-07, RG-18, BD-01 |
| C13 Blaise (cachée) | RG-01, RG-02, RG-13, BD-02 ; usage : OF-03, RG-12, RG-14, PR-04 | K : RG-13, RG-20, LT-01, LT-05 (+ CN-03, PH-08, PH-15, EX-01) | RG-12, RG-14, AN-01, PR-04 |
| C14 Amélie (cachée) | RG-12, RG-14, AN-01, PR-04 | V : PH-17, PH-01 | RG-12, AN-01, PH-17, PR-04 |
| C15 Ernestine | RG-01, RG-09, RG-15, CN-02 | K : RG-15, CN-02 (tampon) ; fille `O·` : RG-09 | RG-15, CN-02, BD-06 |
| C16 Fulbert | RG-01, RG-05, RG-09, RG-15, PV-04 | K : RG-05, RG-07, RG-09, RG-15, RG-19, RG-24, LT-06 | RG-09, RG-15, PV-04 |
| C17 Benoît | RG-02, RG-11, RG-15, RG-21, OF-07 | K : RG-08, RG-11, RG-15, RG-19, RG-21, RP-04 (+ OB-05) | RG-11, RG-21, RP-04, OF-07 |
| C18 Sidonie | RG-11, OF-07, RG-04, LT-02, PV-03 | V : PH-03, PH-02, PH-12 | RG-11, RG-21, RG-22, OF-07 |
| C19 Noël | RG-02, RG-10, RG-15, RG-19, BD-03 | K : RG-10, RG-15, RG-18, RG-24, LT-06 (+ OB-01, CN-02) | RG-10, RG-18, BD-03 |
| C20 Honorine | RG-02, RG-10, RG-15, RG-18 | K : RG-15, RG-18 ; fille `P··` : RG-10 | RG-10, RG-15, RG-18 |
| C21 Gatien | RG-03, RG-15, RG-17, RG-18, RG-22 | V : PH-04, PH-03, PH-05, PH-06, CP-01 | RG-17, RG-18, RG-23, CT-01 |
| C22 Léontine | RG-17, PH-06, PV-02 | V : PH-06, PH-05 | RG-17, PH-06, PV-02 |
| C23 Elzéar | RG-03, RG-15, RG-22, RG-23, BD-01 | K : RG-15, RG-23 (+ CN-02, PH-10) | RG-15, RG-17, RG-23 |
| C24 Victoire | **départ** (OF-01, OF-08) ; RG-03, RG-18 | **départ** (OF-08) ; PH-03, PH-04, PH-05 | **départ** ; RG-18, RG-23 |
| C25 Lazare | RG-03, RG-15, RG-18, RG-22 | V : PH-05, PH-03 | RG-17, RG-18, RG-16 |
| C26 Clément | RG-03, RG-15, RG-18, RG-22, PV-04 | V : PH-05, PH-03 | RG-15, RG-17, RG-18, PV-04 |
| C27 Léandre (cachée) | RG-14, PR-04, LT-05, LT-08, BD-07 | V : PH-04, PH-07 | RG-14, RG-23, PR-04, PH-04 |
| C28 Félix | OF-04, RG-17, PV-02, PR-07, PR-08 | V : PH-14, PH-09 | OF-04, AN-02, PR-07, PR-08 |
| C29 Rose | OF-04, RG-17, BD-06, AN-02 | V : PH-10, PH-16 | AN-02, BD-06, PH-16 |
| C30 Marin | OF-04, RG-17, PV-02, PR-07, BD-06 | V : PH-14, PH-10 | OF-04, RG-23, AN-02, PR-07 |
| C31 Aline | RP-09, RG-17, PV-04, AN-02 | V : PH-18, PH-11 | RP-09, AN-02, PH-11, PV-04 |
| C32 Edmée (cachée) | OF-03, PR-05, RP-08, PV-01, BD-07 | V : PH-13, PH-07 | OF-03, PR-05, RP-08, AN-02 |

## 2. Chemins et pièges, cases clés

### Les quatre de 1868 et les talons (C01–C08)

Chemin 1 (départ) : OF-02 (noms, métiers, marques des chefs) → CN-01 / BD-05 (croix : chefs et
épouses) → RG-07, RG-08, RG-09, RG-10 (actes de mariage de leurs enfants : marques autographes des
parents présents). Chemin 2 : OF-06 (notation) → chercher un code de talon déduit (`Y+O`) → CN-01.
Piège : sur les croix, deux pieds barrés sans tête (`/`) et les fils noyés de Siméon ; OF-05 les a
annoncés.

### La Fourche (C09, C10, C21, C22, C28)

Chemin : OF-04 (Félix) → PV-02 (Gatien, Léontine, Reine) → RG-17 (Félix fils de Gatien) → RG-15 (Josse
`Y-g`, Reine `Y-g+P`) → PH-04 / PH-06 (visages). Deuxième chemin : RG-08 (mariage de 1879) → CN-02
(fuseau) → BD-04.
Piège : l'aviron `Y-g-g` de Gatien (CN-02) ressemble à la marque de Josse ; R8 et R3 l'écartent.

### L'Œil (C11, C12, C23, C29)

Chemin : BD-01 (départ : Médard, Elzéar, Jacquette dits) → DV-02 (rédaction de Victoire) → RG-07 (mariage
de 1876) → RG-15 (Jacquette `O-g+Y`, Elzéar `O-g-g`) → RG-23 (paie d'Elzéar). Rose : OF-04 → BD-06 →
RG-17 → PH-10, PH-16.
Piège : la « marque dite » (BD-01, DV-02) n'est pas une marque montrée : il faut la retrouver.

### La Potence (C15, C16, C26, C31)

Chemin : RP-09 / PV-04 (Aline : Clément, Fulbert) → RG-17 → RG-09 (mariage de 1877, original et double) →
RG-15 → CN-02 (tampon à pain, couvercle de caisse) → PH-05, PH-03 (Clément).
Pièges : la croix `X` du double (D9, R7) ; Delphine `P-g·` sur la liste (D8).

### L'école et le feu (C17, C18, C20)

Chemin : OF-07 (départ) → PV-03 (cahiers) → RG-11 (mariage de 1890) → RG-21 (Phares et Balises) → RP-04
(journal) → PH-02, PH-03. Honorine : RG-10 → RG-15 → RG-18.
Piège : `gardien-de-phare` (leurre) ; RG-21 donne la définition du feu.

### L'enfant de mer (C19, C25, C30) — l'exception jouable

Chemin 1 : OF-05 (règle de la barre, départ) → OF-04 (Marin) → BD-06 (« l'aviron du grand-père Noël, avec
la barre ») → RG-10 (« de parents inconnus, recueilli ») → RG-15 `A/`. Chemin 2 : PR-01 (*Aurore*) → RG-02
(baptême sous condition) → BD-03.
**Ce que le joueur doit faire** : ne pas placer Noël sous Siméon (il n'a pas de parents dans l'arbre),
mais l'identifier par sa marque barrée. Le couple Siméon–Ursule reste sans enfant visible : `A-g` et
`A-d` sont sur des croix de 1869 (CN-01).
Piège : le nom Cormaud (juste) fait croire à un fils de sang ; les cheveux bouclés (04 §0) appuient.

### Le fils parti (C13, C14, C27, C32) — la branche cachée

Chemin 1 (déduction) : RG-01 (baptême de Blaise, puîné de Gervais) → **déduire `Y-d`** (R3) → chercher
« Y-d » → CN-03 (la cheminée de l'hôtel Garnaud) et PH-15 (la tombe de Blaise **Garnaud**) → la branche
apparaît → RG-12 (la même date de naissance), RG-14, PR-04.
Chemin 2 (archives) : RG-02 (« il part pour la Grand-Terre ») → « Inscription maritime » → RG-13 (« Blaise,
dit Garnaud, fils de Gervais Goémard », `Y-d`).
Chemin 3 (Comptoir) : OF-03 / BD-07 (« trident ») → PV-01 → PH-08 (cheminée) ; LT-07 (« demandez-vous qui
était le cadet de Gervais ») → EX-01.
Pièges : « enfant de Port-Sénane » (OF-03, PR-02, PR-04, RG-12, BD-07), le trident (D10), Ange Oyard `O-d`
sur la même page de RG-13 (D4), `matelot` et `armateur`.

## 3. Fausses pistes et leur levée

| Fausse piste | Pièces qui la portent | Pièces qui la lèvent |
|---|---|---|
| Il y a eu une fièvre en 1908 | RP-01, RP-02, PR-03, LT-09, OF-03 | RP-03, RP-04, RP-05, LT-03, RG-04, LT-02, BD-02, EX-02 |
| Blaise Garnaud est un enfant de Port-Sénane | OF-03, PR-02, PR-04, RG-12, RG-14, BD-07 | RG-13, RG-01 (même date), PH-15, CN-03, LT-01, LT-07, EX-01 |
| La marque du Comptoir est un trident | BD-07, OB-04, PB-01 | R1 (Fourche), R7 (gravure) ; CN-03 (« pas une marque d'île ») |
| Noël est le fils de Siméon | son nom ; RG-24 (il vend pour la maison Cormaud) | OF-05 (barre), RG-02, RG-10, BD-03, CN-01 (`A-g`, `A-d`) |
| La maison Cormaud est éteinte | RG-05 (« succession non déclarée »), OF-02 (au nom de Siméon) | RG-19, RG-03, BD-03 (S3) |
| Blaise a volé l'ambre en 1870 | RG-02 | BD-04, LT-01, DV-01 (S4) |
| Blaise n'a rien laissé aux maisons | LT-05 (« le Comptoir à mon fils »), PR-04 | LT-05 (même pièce : le coffre), RG-20, PV-06 |
| Benoît était gardien de phare | son employeur (Phares et Balises) | RG-21, RG-11, RP-04 |
| Blaise était matelot ou armateur | RG-13, PR-03 | RG-12, RG-14, AN-01, PR-04 |
| La marque d'Ernestine est une croix | RG-09 (double) | RG-09 (original), RG-15, CN-02, EX-01 |
| Une marque dite vaut une marque montrée | BD-01, BD-06, DV-02 | R7 ; les registres et les objets |
| « La possession de soixante-neuf ans » | OF-03 | RP-08, art. 3 : la concession porte sur l'ambre, non sur le fonds ; RG-05 (île interdite) |

## 4. Âges sur les photographies (pour le `cartographe`)

| Pièce | Date | Personnes et âges |
|---|---|---|
| PH-01 | juil. 1889 | Blaise 35, Amélie 31, Léandre 9 |
| PH-02 | juin 1897 | Sidonie 33, Gatien 15, Clément 14, Lazare 11, Victoire 4 |
| PH-17 | v. 1900 | Amélie 42 |
| CP-01 | v. 1905 | Gatien 24, Noël ~45 |
| PH-03 | 2 avr. 1908 | Sidonie 43, Benoît 47, Jacquette 56, Gatien 26, Clément 25, Lazare 22, Victoire 15 |
| PH-06 | 14 oct. 1911 | Gatien 30, Léontine 22, Reine 58 |
| PH-04 | 1912 | Léandre 32, Gatien 31, Victoire 19 |
| PH-05 | 26 avr. 1913 | Lazare 27, Victoire 20, Noël ~52, Honorine 48, Jacquette 61, Gatien 31, Léontine 24, Félix 1, Clément 30 |
| PH-12 | 1930 | Sidonie 66, Berthe-Marie ~30 |
| PH-16 | v. 1935 | Rose 25 |
| PH-07 | 1950 | Edmée 29 ; portrait peint de Léandre à 68 |
| PH-11 | 1961 | Aline 36 |
| OF-08 | 22 août 1964 | Victoire 71 |
| PH-09 | 29 août 1964 | Victoire 71, Félix 52 |
| PH-10 | 5 sept. 1964 | Marin 44, Rose 54 |
| PH-18 | 1976 | Aline 51, Fontanet ~45 |
| PH-13, PH-14 | 15 oct. 1977 | Edmée 56 ; Marin 57, Félix 65 |

## 5. Preuves des secrets

| Secret | Pièces clés | Appui | Condition proposée |
|---|---|---|---|
| S1 La fièvre de papier | RP-01 + RP-03, RP-04, RP-05, LT-03 | RP-02, RP-07, LT-02, LT-09, EX-02, RG-04, BD-02 | RP-01 et deux des quatre |
| S2 Les quatre coffrets | LT-05, RG-20, PV-06, OB-02, DV-01 | LT-08, BD-07, PR-04 | PV-06 et un de DV-01, OB-02 |
| S3 Le testament de grève | RG-19, RG-03, BD-03 | RG-02, RG-05, RG-10, PR-01, OF-05 | deux des trois |
| S4 Le fils banni | BD-04, LT-01, DV-01 | RG-02, RP-06, TG-01, BD-02, LT-07 | BD-04 et un de LT-01, DV-01 |

Indépendance : S1 ne demande aucune case cachée ; S3 aucune ; S4 et S2 se nourrissent de la branche
Garnaud mais pas l'un de l'autre (S4 peut se faire par LT-01, S2 sans BD-04).

## 6. Cohérence avec le monde et les affaires 1 et 2

- **Port-Sénane** (lieu de l'affaire 1) : Compagnie des Paquebots (1871), *L'Écho* (1870), quai du Môle
  et quai des Messageries (pièces de l'affaire 1), Phototypie de l'Orvelle, hôpital maritime : repris
  sans changement. La *Duchesse-d'Ambre* (1889) dessert « les îles du golfe » en 1902 (affaire 1, PR-02) :
  PB-02 le précise.
- **Bains-de-Mérande** : ville d'eaux et lycée de jeunes filles (affaire 1) ; Sidonie y est née et s'y
  retire. Rien d'autre.
- **Studio Lumen** (Aubrelieu, 1869) photographie le stand de 1889 : cohérent avec l'affaire 1 (PR-01).
- **Imprimerie Dumesnil-Corre** (affiches) : PB-01, comme l'affaire 1.
- **ORC, Rosine Ferrandot, le rapporteur titulaire, le Lecteur LX-2, C. Sauge** : cadre inchangé ;
  aucune allusion aux affaires précédentes au-delà d'une ligne de la lettre de mission.
- **Loi de 1973** : l'**art. 15** est nouveau (`docs/monde/00-monde.md` §2) ; il ne contredit ni l'art. 4
  (affaire 1), ni l'art. 9 (fonds restreints), ni l'art. 12 (affaire 2). Aucune pièce de l'affaire 3
  n'est restreinte (rien de la Régence).
- **Monnaie** : florins (1868–1924), Fn (1958–1977) ; prix nouveaux reportés au §5 du monde (*L'Écho*
  12 sous en 1924 comme le *Courrier* ; 0,45 Fn en 1977 ; catalogue de 1912 ; loyer du coffre).
- **Ostrien** : absent (le golfe d'Ambre est velmarchois) ; le **parler insulaire** n'est que du
  velmarchois avec une dizaine de mots (`08-lieux.md` §3), pas une troisième langue.
- **Aucun train** ; on voyage par la vedette, le paquebot, la route de la côte.

## 7. Points faibles et à vérifier

1. **Densité des registres** : RG-07 à RG-10 donnent chacun cinq à sept marques. Risque : le joueur
   remplit `g-talons` sans lire les croix. Acceptable (ce sont des pièces autographes), mais le
   `level-designer` peut retarder RG-07–RG-10 derrière « mariage » ou les noms des mariés.
2. **Marques dites** (BD-01, BD-06, DV-02) : le moteur ne doit pas les compter comme révélant la marque
   (`reveals.portraits` vide) ; elles servent à **déduire** un code.
3. **Codes de marque comme termes cachés** : dépend de la normalisation des recherches (`·`, `+`, `/`).
   À tester par le `backend` ; repli : codes sans signes (`Ygd`, `Ypt`, `Ab`, `Atp`).
4. **Ursule** (C06) : une seule pièce autographe (RG-10) + sa croix (CN-01, PH-09) ; conforme à R7, mais
   c'est la case la plus mince. Option : ajouter sa marque comme marraine dans un acte de 1885.
5. **Le type `recording`** : sept pièces en dépendent (repli `report`).
6. **Victoire savait** (LT-07) : à doser à la rédaction pour que BD-02 ne dise pas tout.
7. **Distances** : île–Cabanes 4,4 lieues (≈ 2 h 30 de vedette en 1908) ; Cabanes–Port-Sénane 4,2 lieues
   par la route de la côte. À respecter dans les pièces (`08-lieux.md` §1).
