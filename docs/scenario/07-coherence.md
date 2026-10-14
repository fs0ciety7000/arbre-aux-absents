# 07 — Tableau de cohérence

> Pour chaque case : quelles pièces prouvent le **nom** (N), le **visage** (V), le **métier** (M),
> au moins **deux chemins** indépendants pour y arriver, et les **fausses pistes** avec la façon de
> les écarter. Base de travail du `level-designer` (graphe et solveur) et de la relecture QA.
>
> « Chemin » = suite de lectures et de recherches depuis l'état de départ (OF-01 à OF-07).
> Les termes entre guillemets sont des recherches au Lecteur. (R) = pièce restreinte (« Prénom Nom »
> exact). Toutes les cases ont N, V et M prouvés par **au moins deux pièces distinctes**.

## 0. Invariants vérifiés

- [x] 30 cases ; chaque champ N, V, M est couvert par ≥ 2 pièces (tableau §1).
- [x] Aucune case n'est déductible d'une seule pièce isolée, sauf C09 (tutoriel, complète au départ).
- [x] Chaque pièce restreinte (PH-16, PH-17, RG-14, RP-02) est **redondante** : aucune case n'en
      dépend seule ; elles servent les secrets et la confirmation.
- [x] Chaque photo de groupe a au moins une pièce qui nomme ou permet d'éliminer chaque visage.
- [x] Âges sur photos compatibles avec les dates de naissance (§4).
- [x] Les traits héréditaires sont cohérents : mèche (Clémence → Augustin, Adélaïde ; Augustin →
      Odile ; Odile → Lise), strabisme (Lucien → Victor → Claude), menton fendu (Gaspard → Augustin,
      Armand, Hélène). Les anneaux d'or (Firmin, Firmin, Tavik) sont une **coutume**, pas un trait.
- [x] Aucun mot ne désigne deux métiers : « directeur » = Gaspard seul ; Augustin est « député »
      ou « président ». « Gardien·ne de phare » = Maaren et Tavik ; « journaliste » = Selda et Paul.
- [x] Les noms de scène et d'emprunt ne sont jamais la réponse (02-arbre §2).

## 1. Tableau par case

| Case | Nom | Visage | Métier |
|---|---|---|---|
| C01 Anselme | OF-01, OF-02, RG-01, PR-01 | PH-01, PH-02 | OF-01, RG-01, PR-01, AN-01 |
| C02 Clémence | RG-01, RG-18, PH-01 (prénom), LT-01 | PH-01, PH-02, PH-05 | PR-01, DV-01, LT-01 |
| C03 Firmin (1849) | RG-02, LT-02, PR-02, PH-03 (prénom) | PH-03, PR-02 | RG-02, LT-02, PR-02, PR-05 |
| C04 Maaren | RG-02, LT-02, AN-04, PH-03 (prénom) | PH-03, PH-04 | LT-02, AN-04, PR-05 |
| C05 Augustin (1872) | RG-01, RG-04, RG-17, PR-03, PB-02 | PH-02, PB-02, PH-05 | PR-03, PB-02, RG-17 |
| C06 Henriette | RG-04, RG-18, DV-04, PH-09 (« Mme Augustin ») | PH-09, PH-05 | PH-09, LT-04, DV-04 |
| C07 Lucien | RG-01, PR-04, AN-01, CT-01 | PH-02, PH-08, CT-01 | AN-01, PR-04, CT-01 |
| C08 Pauline | RG-06, AN-01, LT-04, PH-09 (initiale) | PB-01, PH-08, PH-09 | RG-06, AN-01, PH-09, LT-04 |
| C09 Adélaïde | départ ; RG-01, PR-18 | départ (OF-03) ; PH-02, PH-05 | départ ; PR-18, OF-03 |
| C10 Aldrik | RG-03, PR-05, RP-01, PH-10 (initiale) | PH-04, PH-10 | RG-03, PR-05, RP-01, PH-10 |
| C11 Tenna | RG-03, PH-12, PR-05, CP-02 (initiale), LT-13 (prénom) | PH-04, PH-12 | RG-03, PH-12, PR-05, CP-02 |
| C12 Gaspard | OF-04, RG-05, RG-07, PR-08, PR-12, PR-17 | PH-05, PR-08, PR-12 | PR-08, PR-12, PR-17, RP-03 |
| C13 Irène | RG-07, PH-11, RG-18, DV-02 | PH-05, PH-11 | RG-07, PH-11 |
| C14 Blanche | RG-05, RG-08, RG-16, DV-04, OF-04 (usage) | PH-05, PR-06, PH-19, PH-21 | PR-06, PB-03, PH-21, AN-02, PR-14 |
| C15 Marcel | RG-08, RG-16, PR-08, AN-02, RP-02 (R) | PH-05, PR-08, PH-19 | PR-08, RG-16, PR-09, RP-02 (R) |
| C16 Odile | RG-05, RG-13, PH-06, RG-18, PH-16 (R) | PH-05, PH-06, PH-16 (R) | PH-06, RG-13, LT-08, PR-09 |
| C17 Orrin | RG-13, PH-13 (initiale), PH-17 (R), RG-14 (R), LT-08 (prénom) | PH-13, PH-17 (R) | RG-13, PH-13, LT-08 |
| C18 Victor | RG-06, PH-07, PR-07, RG-11, PR-15, AN-02 | PH-07, PH-18, PR-15 | PH-07, PR-07, RG-11, AN-02, PR-15 |
| C19 Ninon | RG-11, PH-21 (usage), PR-15, PR-14 (« née Brial ») | PH-18, PH-21, PR-15 | RG-11, PH-21, PR-15 |
| C20 Firmin (1900) | RG-03, RG-10, PH-14, PH-20 | PH-05, PH-14, PH-20, PR-13 | RG-10, PH-20, RG-19 |
| C21 Hessa | PH-14, RG-10 | PH-14, PH-15 | RG-10, PH-15 |
| C22 Selda | RG-03, RG-12, PH-13, PH-20, LT-17 | PH-13, PH-20 | RG-12, PH-13, PH-20 |
| C23 Augustin (1924) | RG-09, PB-04, PR-17, RG-18 | PB-04, PR-11 | PB-04, PR-11 |
| C24 Armand | départ (OF-04) ; RG-09, PH-22 | PH-22, PR-17 | départ (OF-04) ; PH-22, AN-03 |
| C25 Mathilde | PH-22, OF-04 (prénom), PH-23 (« Mathilde Rouvière ») | PH-22, PH-23 | PH-22, PH-23 |
| C26 Hélène | RG-09, PH-25, OF-04 (usage), LT-16, PR-17 | PH-25, PR-17 | OF-04, AN-03, LT-16 |
| C27 Paul | PH-25, PR-16, AN-03 | PH-25, PR-16 | PH-25, PR-16, AN-03 |
| C28 Lise | RG-16, LT-09, PH-24, PH-28, CP-03, DV-04, PR-10 | PH-24, PH-28 (PH-19 bébé) | OF-06, PH-28, CP-03, RP-06 |
| C29 Claude | RG-11, PR-15, LT-18, PH-28, OF-05 (initiale) | PH-28, PR-15 (PH-18 enfant) | OF-05, PH-28, LT-18, PR-15, AN-03 |
| C30 Tavik | RG-10, PH-20, PH-29, AN-04 | PH-20, PH-29 | PH-29, AN-04, LT-13 |

Filiations (placement dans l'arbre) : voir §2, ligne « Placement ».

## 2. Chemins et pièges, case par case

### Branche des Tilleuls

**C01 Anselme Varenque — papetier.**
Chemin 1 : OF-01/OF-02 (nom, métier au départ) → « Anselme » → PH-01 (verso « Anselme & Clémence ») : visage.
Chemin 2 : « Papeteries Varenque » → PR-01 (papetier médaillé) → « Grande Exposition » ; RG-01 (père
des trois enfants) → PH-02 (l'homme mûr à la cicatrice au sourcil, même que PH-01).
Pièges : aucun. Case d'apprentissage du **visage par couple** (PH-01 ne montre que deux personnes).

**C02 Clémence Aubertot — botaniste.**
Chemin 1 : OF-02 « ma mère Clémence » → « Clémence » → PH-01 (prénom, visage à la mèche) → RG-01
(nom de naissance Aubertot).
Chemin 2 : PR-01 (« Mme Varenque, botaniste ») → « fougère » → DV-01 (herbier signé C. V.) et LT-01 ;
« caveau » → RG-18 (« née Aubertot »).
Pièges : à 72 ans (PH-05) elle a les cheveux blancs, la mèche ne se voit plus ; on la reconnaît à la
broche en fougère, qu'elle porte sur PH-01, PH-02 et PH-05.

**C05 Augustin Varenque (1872) — député.**
Chemin 1 : OF-02 « mon frère Augustin » → « Augustin Varenque » → PR-03, PB-02 (visage + député),
RG-17 (mort à 66 ans, « ancien député »).
Chemin 2 : RG-01 (fils aîné) → PH-02 (garçon de 13 ans à la mèche) → PH-05 n° 3 (légende intacte).
Pièges : **homonyme C23**. La recherche « Augustin Varenque » rend aussi PB-04 (1944). On sépare par
l'âge (66 ans en 1938 / 20 ans en 1944), les parents (RG-01 / RG-09), le visage (moustache cirée et
pince-nez / menton fendu, sans moustache), RG-18 qui liste deux Augustin. Leurre `directeur-papeteries` :
RG-17 dit « président », jamais « directeur ».

**C06 Henriette Sorbelle — philanthrope.**
Chemin 1 : RG-05 (mère de Gaspard, Blanche, Odile) → « Augustin Varenque » → RG-04 (mariage, nom de
naissance) → « Sorbelle » → DV-04 (faire-part : présidente-fondatrice de l'Œuvre).
Chemin 2 : « Œuvre des Lavandières » → PH-09 (« Mme Augustin Varenque, présidente », visage) → LT-04.
Pièges : nom d'usage « Mme Augustin Varenque » ; visage à recouper entre PH-09 (36 ans, très grande,
chapeau à plumes) et PH-05 n° 4 (46 ans, face-à-main).

**C12 Gaspard Varenque — directeur des Papeteries.**
Chemin 1 : OF-04 (nom) → « Gaspard Varenque » → PR-08 (1938, photo, directeur), PR-12 (1953, photo).
Chemin 2 : RG-05 → RG-07 (marié en 1922) → PH-05 n° 1 (le marié) ; PR-17 (nécrologie).
Pièges : les visages vieillissent (23, 39, 54 ans) : constantes = lunettes rondes d'écaille et
menton fendu. Leurre `industriel` (presse). RG-07 le dit « ingénieur papetier » en 1922 : il ne devient
directeur qu'en 1925 (PR-17 : « de 1925 à 1960 »).

**C13 Irène Castagne — pianiste.**
Chemin 1 : « Gaspard Varenque » → RG-07 (Irène Castagne, pianiste) → « Irène Castagne » → PH-11 (récital, visage).
Chemin 2 : PH-05 n° 2 (la mariée) + DV-02 (plan de table : « Mme Gaspard, née Castagne ») ; RG-18.
Pièges : « M. Castagne » (son père) figure sur PH-05 et DV-02 : ce n'est pas une case.

**C23 Augustin Varenque (1924) — étudiant.**
Chemin 1 : RG-09 (fils de Gaspard) → « Augustin Varenque » → PB-04 (avis d'exécution, photo, étudiant).
Chemin 2 : « Fougère » → PR-11 (« Augustin V., vingt ans, étudiant », gravure) ; PR-17 (« son fils
Augustin fut fusillé ») ; LT-12.
Pièges : homonyme C05 (voir plus haut). PR-11 ne donne que « Augustin V. » : il faut le recouper.

**C24 Armand Varenque — avocat.**
Départ : nom + métier (OF-04). Visage — chemin 1 : « Armand Varenque » → PH-22 (« Me Armand Varenque,
avocat »). Chemin 2 : « Gaspard Varenque » → PR-17 (photo des obsèques, légendée).
Pièges : grandes oreilles et nœud papillon ; ne pas confondre avec Paul Marsal sur PR-17 (Paul a le nez cassé).

**C25 Mathilde Rouvière — speakerine.**
Chemin 1 : OF-04 « mon épouse Mathilde » → « Armand Varenque » → PH-22 (nom de naissance, speakerine).
Chemin 2 : « speakerine » ou « RTV » → PH-23 (couverture d'*Antenne velmarchoise*).
Pièges : PH-23 donne le nom (courrier des lecteurs, p. 30) mais pas le lien à la famille ; le visage
relie les deux pièces, et PH-22 seule place Mathilde comme épouse d'Armand.

**C26 Hélène Varenque — médecin.**
Chemin 1 : OF-04 « le Dr Hélène Marsal » → « Hélène Marsal » → AN-03 (pédiatre), LT-16, PR-17 (photo).
Chemin 2 : RG-09 (Hélène Varenque, 1931) → « Paul Marsal » → PH-25 (mariage : nom de naissance + visage).
Pièges : nom d'usage Marsal ; métier d'abord vu comme « Dr » (OF-04) : préciser par AN-03.

**C27 Paul Marsal — journaliste.**
Chemin 1 : PH-25 (mariage, « journaliste au *Courrier* ») → « Paul Marsal » → PR-16 (signature + photo).
Chemin 2 : LT-16 « les articles de Paul » → « Papiers de la Régence » → PR-16 ; AN-03.
Pièges : même métier que Selda (C22). Son article est la **fausse piste** principale (Gaspard délateur).

### Branche des Absents

**C14 Blanche Varenque — cantatrice.**
Chemin 1 : OF-02 « mes neveux Gaspard et Blanche » / OF-04 « ma tante Blanche Daubry » → RG-05, RG-08
→ PH-05 n° 7 (déchiré) par élimination avec DV-02.
Chemin 2 : « Aubertine » (vu sur PB-03 ou PH-21) → PR-06 (« née Varenque », photo : grain de beauté)
→ AN-02 (même adresse que Marcel Daubry).
Pièges : **nom de scène** Blanche Aubertine (refusé comme nom) ; « Aubertine » vient d'Aubertot, sa
grand-mère (indice offert, pas preuve). Visage : grain de beauté au-dessus de la lèvre, à gauche, constant de 21 à 47 ans.

**C15 Marcel Daubry — commissaire aux Registres.**
Chemin 1 : « Blanche Daubry » / RG-08 (époux, comptable) → « Marcel Daubry » → PR-08 (commissaire,
photo) → RP-02 (R).
Chemin 2 : « Lise » → RG-16 (adoptée par « Marcel Daubry, commissaire aux Registres ») → PH-19 ; PH-05 n° 9
(« M. Daubry »).
Pièges : **leurre `comptable`** (RG-08, AN-02) : il l'a été, mais toutes les pièces postérieures à 1938
le disent commissaire. Alias **Marc Dobrin** (S5) : barbe et verres fumés, mais chevalière « D » et
oreille droite entaillée (déjà visibles sur PR-08 de profil).

**C16 Odile Varenque — graveuse de filigranes.**
Chemin 1 : OF-02 « ma nièce Odile » → « Odile Varenque » → PH-06 (nom, visage, métier) ; en exact :
PH-16 (R), RG-14 (R).
Chemin 2 : RG-05 (fille d'Augustin) → « Fougère » → PR-09 (« la graveuse Odile V. ») → RG-13
(« Varenque Odile, graveuse ») ; PH-05 n° 8 (adolescente à la mèche).
Pièges : **déclarée morte** en 1943 (RG-14, RG-18) : n'empêche pas la case. Leurre `photographe` (Nora,
S1). Nom de réseau « Fougère ». La case n'exige pas de savoir qu'elle vit.

**C17 Orrin Kessvel — typographe.**
Chemin 1 : RG-13 (liste n° 41 avec Odile : « Kessvel Orrin, typographe ») → « Orrin Kessvel » → PH-17 (R)
(visage, « concubin de la précédente ») et RG-14 (R) (« compagnon déclaré du 1187 »).
Chemin 2 : LT-08 (« Orrin, typographe de Vellaak ») → « Vel Taalik » → PH-13 (« le typographe
O. Kessvel », visage, aux côtés de Selda).
Placement (père de C28) : RG-14 (compagnon du 1187, dont l'enfant est C28) + PH-17 ; LT-10 (« dis-lui
que son père… »).
Pièges : seule PH-13 le montre hors fonds restreint : le chemin 2 suffit pour le visage si l'on n'a
pas l'idée du terme exact ; le chemin 1 demande la déduction du nom complet.

**C28 Lise Daubry — restauratrice de papier.**
Chemin 1 (l'adoption) : OF-06 (« L. Daubry, restauratrice ») → « Daubry » → RG-16 (Lise, née le 3 mars
1942 « à Grisenoue », adoptée) → LT-09 (« Marcel a ramené une enfant de Grisenoue ») → PH-24 (visage, mèche).
Chemin 2 (la mère) : « Odile Varenque » (R) → RG-14 (« accouchée le 3.3.42, enfant remis à l'Œuvre des
Pupilles ») → « Pupilles » / « Grisenoue » → RP-04 → RG-15 (P-4471, née le 3.3.42, « Élise », placée chez
« M. et Mme M. D… ») ; sans fonds restreint : LT-10 (« Élise », « elle a la mèche ») + PH-24.
Visage 2 : PH-28 (« Mlle L. Daubry, restauratrice », bandeau).
Placement : **C16 + C17** par la concordance date (3.3.42) + prénom (Élise/Lise) + mèche + « M. D… ».
Pièges : naissance **falsifiée** (« Grisenoue, parents inconnus ») ; « Notre Lise » (PH-19) fait croire à
une fille de Blanche, démenti par LT-09 et CP-03 (« ma mère adoptive »). Sur PH-28 la mèche est cachée :
on la reconnaît aux sourcils épais (ceux d'Odile) et aux boucles châtain clair (celles d'Orrin).

### Branche de l'Atelier

**C07 Lucien Varenque — peintre-affichiste.**
Chemin 1 : OF-02 « mon frère Lucien » → « Lucien Varenque » → PR-04 (affichiste), CT-01 (autoportrait).
Chemin 2 : RG-01 → PH-02 (garçon de 9 ans qui louche) ; « rue des Tanneurs » → AN-01 → PH-08 (au chevalet).
Pièges : signe « L.V. » sur ses affiches (PB-01) : à relier.

**C08 Pauline Sauge — blanchisseuse.**
Chemin 1 : LT-03 (« Pauline a eu un fils, Victor ») → « Victor » → RG-06 (« Pauline Sauge,
blanchisseuse ») → « Pauline Sauge » → LT-04, PH-09 (« P. Sauge », visage parmi les protégées).
Chemin 2 : CT-01 (« *La Lavandière*, Pauline S., modèle ») → « La Lavandière » → PB-01 (visage idéalisé :
dents écartées) → PH-08 (même femme) ; « rue des Tanneurs » → AN-01 (« Sauge P., blanchisseuse »).
Pièges : **leurre `modele`** (CT-01) ; le visage idéalisé de l'affiche se confirme par le sourire à
dents écartées et la petite cicatrice au menton, visibles sur PH-09.

**C18 Victor Sauge — aviateur.**
Chemin 1 : RG-06 (fils de Pauline) → « Victor Sauge » → PH-07, PR-07, PR-15.
Chemin 2 : LT-03/LT-05 (« Victor ») → « Aéro-Velmarche » → LT-07 (Victor écrit à Adélaïde) ; AN-02.
Placement (fils de C07) : LT-03, RG-20 (S3), strabisme visible sur PH-07 et PH-18.
Pièges : PR-07 le dit « fils d'un capitaine de Port-Sénane disparu en mer » : renvoie à C03, mort en 1902.

**C19 Ninon Brial — costumière.** (case révélée par C18)
Chemin 1 : « Victor Sauge » → RG-11 (Ninon Brial, costumière) → « Ninon » → PH-21 (« Mme Ninon Sauge »).
Chemin 2 : PR-15 (« sa veuve Ninon, costumière à l'Opéra », photo des obsèques) ; PH-18 (« N. ») ;
PR-14 (1961 : « Mme Ninon Sauge, née Brial, la première costumière de l'Opéra »).
Pièges : nom d'usage Sauge ; turban et grands anneaux sur PH-18 et PH-21.

**C29 Claude Sauge — ingénieure.** (case révélée par C18)
Chemin 1 : OF-05 (« C. Sauge, ingénieure ») → « Lecteur » → PH-28 (« Mlle C. Sauge », visage).
Chemin 2 : RG-11 (mention marginale : Claude, 1938) → PR-15 (« sa fille Claude, ingénieure », photo) ;
LT-18 (« mon père disait… une lavandière et une affiche »).
Pièges : **genre** (AN-03 : « Sauge C., ingénieur ») ; surnom « Claudie » (PH-18). Léger strabisme de
l'œil gauche, comme Lucien et Victor.

### Branche du Phare

**C03 Firmin Varenque (1849) — capitaine au long cours.**
Chemin 1 : OF-01 (nom) → « Firmin Varenque » → RG-02 (capitaine), PR-02 (nécrologie, gravure).
Chemin 2 : « Tennok » → PH-03 (« Maaren ta Firmin », visage) → LT-02 (« au capitaine Firmin Varenque »).
Pièges : **homonyme C20** : la recherche « Firmin Varenque » rend aussi RG-10, PH-14, PH-20, RG-19. On
sépare par les dates (C03 meurt en 1902) et le visage (C03 : barbe noire fournie, uniforme).

**C04 Maaren Tennok — gardienne de phare.**
Chemin 1 : PH-03 (prénom) → « Maaren » → RG-02 (Maaren Tennok) → LT-02 (« ils m'ont nommée gardienne »).
Chemin 2 : « phare » / « Tennok » → AN-04 (Mme Maaren Varenque, née Tennok, 1883–1912) → PH-04
(en 1910, la gardienne en titre est donc la femme de 58 ans).
Pièges : graphies Tennok / Tennokessa (DV-05) ; **genre supposé** sur PH-04 (« la famille du gardien ») ;
leurre : Aldrik « gardien ».

**C10 Aldrik Varenque — patron du canot de sauvetage.**
Chemin 1 : RG-03 (fils de Firmin et Maaren ; « canotier au canot de sauvetage » en 1903, « patron du
canot » dans la mention marginale de 1924) → « Aldrik Varenque » → PR-05,
RP-01.
Chemin 2 : « canot de sauvetage » → PH-10 (« patron A. Varenque », visage : deux doigts manquants à la
main gauche) → PH-04 (même homme).
Pièges : on le croit gardien du phare (PH-04). Il n'a jamais tenu le feu (AN-04). Canotier dès 1902,
patron depuis l'arrivée du canot neuf *Tennok* en 1906 (PR-02 le dit « canotier » en 1902 : pas de
contradiction).

**C11 Tenna Orrvik — receveuse des postes.**
Chemin 1 : RG-03 (« Tenna Orrvik, receveuse des postes ») → « Tenna Orrvik » → PH-12 (visage, guichet).
Chemin 2 : CP-02 (cachet « Recette des postes de Tennok — T. Orrvik ») → « Orrvik » → PH-12 ; LT-13
(« notre mère Tenna ») ; PH-04 (femme à lunettes rondes et fichu noué).
Pièges : nom de naissance gardé (usage ostrien) ; graphie Orrvikessa.

**C20 Firmin Varenque (1900) — patron pêcheur.**
Chemin 1 : RG-03 (fils d'Aldrik) → « Firmin Varenque » → PH-14 (mariage, visage à 30 ans) → RG-10
(« patron pêcheur »).
Chemin 2 : « Selda Varenque » → PH-20 (« son frère Firmin, patron du *Maaren* », visage à 53 ans) ;
LT-13 « le Goéland » → « Goéland » → PR-13 (planche « Le Goéland, 1951 ») ; « Maask » + DV-05.
Pièges : homonyme C03 ; **surnoms** le Goéland / Maask ; anneau d'or comme son grand-père et son fils ;
PH-05 n° 10 (déchiré) : élimination par DV-02 (« M. Firmin Varenque, de Tennok »).

**C21 Hessa Draavik — sage-femme.** (case révélée)
Chemin 1 : RG-10 (mère de Tavik : « Hessa Draavik, sage-femme ») → « Hessa » → PH-15 (visage, sacoche).
Chemin 2 : « Firmin Varenque » → PH-14 (« Hessa Draavikessa ta Firmin Varenque ») ; CP-02 (« sa Hessa »).
Pièges : graphie Draavikessa ; elle n'a pas pu mettre Lise au monde (morte en 1939), fausse idée
qu'induit le mot « sage-femme » chez certains joueurs.

**C22 Selda Varenque — journaliste.**
Chemin 1 : RG-03 (fille d'Aldrik) → « Selda Varenque » → PH-13 (rédactrice, visage), RG-12 (radiée).
Chemin 2 : « Vel Taalik » → PH-20 (retour d'exil, visage) ; LT-13, LT-17.
Pièges : même métier que Paul (C27). Taches de rousseur héritées de Tenna.

**C30 Tavik Varenque — gardien de phare.** (case révélée)
Chemin 1 : RG-10 (fils de Firmin et d'Hessa) → « Tavik Varenque » → PH-29 (le dernier gardien).
Chemin 2 : « phare » → AN-04 (1950–1972) ; PH-20 (« son fils Tavik, gardien du feu », visage à 20 ans) ; LT-13.
Pièges : même métier que Maaren (C04) ; anneau d'or ; barbe rousse.

## 3. Fausses pistes transversales

| Fausse piste | Où elle naît | Comment l'écarter |
|---|---|---|
| Gaspard a livré Odile | PR-16, LT-16, PR-08 (photo avec Daubry) | RP-02 (R) : rapport signé Daubry ; RP-04 ; PR-09 (« vigilance du commissaire Daubry ») ; DV-03 (S2). |
| Victor fils du capitaine Firmin | PR-07 | PR-02 (mort en 1902) vs RG-06 (naissance en 1906). |
| Lise fille de Blanche | PH-19, PR-10, DV-04 | LT-09, CP-03, RG-16. |
| Lise née à Grisenoue | RG-16 | RG-15 (« provenance : Kessaar »), RG-14. |
| Nora Ilvess, Ostrienne de naissance | RG-19, PH-26 (chandail ostrien), PR-13 | RG-19 (registres brûlés : inscription sur simple déclaration) ; DV-05 (*Nora Ilvess* = « la nouvelle Fougère »). |
| Odile morte à Kessaar | RG-14, RG-18 | LT-11, RG-19, PH-26, LT-15, RP-06 (S1). |
| Aldrik gardien du phare | PH-04 | AN-04, PH-10. |
| Claude est un homme | AN-03 | PH-28, PR-15, LT-18. |
| « Directeur » = Augustin | réflexe du joueur | RG-17 (« président »), PR-17 (Gaspard directeur dès 1925). |
| Marcel Daubry vivant en 1974 | silence des pièces velmarchoises | PH-27, RP-05 (S5). |
| L'*Albatros* : naufragés inconnus | PR-05 | RP-01 (« F. V., 24 ans, de Tennok ») + LT-13 (S4). |

## 4. Photos : qui, à quel âge

| Pièce | Date | Personnes (âge) |
|---|---|---|
| PH-01 | mai 1870 | Anselme (24), Clémence (19) |
| PH-02 | été 1885 | Anselme (39), Clémence (35), Augustin (13), Lucien (9), Adélaïde (5) |
| PH-03 | juin 1873 | Firmin (23), Maaren (21) |
| PH-04 | été 1910 | Maaren (58), Aldrik (36), Tenna (32), Firmin (10), Selda (7) |
| PH-05 | 10 juin 1922 | 1 Gaspard (23), 2 Irène (19), 3 Augustin (50), 4 Henriette (46), 5 Clémence (72), 6 Adélaïde (42), 7 Blanche (21), 8 Odile (13), 9 Marcel (25), 10 Firmin (22), 11 Albert Castagne (56, hors arbre) |
| PH-06 | nov. 1937 | Odile (29) |
| PH-07 | juil. 1931 | Victor (25) |
| PH-08 | 1905 | Lucien (29), Pauline (21) |
| PH-09 | 1912 | Henriette (36), Pauline (28) + 6 blanchisseuses hors arbre |
| PH-10 | 1912 | Aldrik (38) + 7 canotiers hors arbre |
| PH-11 | 1928 | Irène (25) |
| PH-12 | 1925 | Tenna (47) |
| PH-13 | 1936 | Selda (33), Orrin (31) |
| PH-14 | 1930 | Firmin (30), Hessa (24) |
| PH-15 | 1936 | Hessa (30) |
| PH-16 | oct. 1941 | Odile (33) |
| PH-17 | oct. 1941 | Orrin (36) |
| PH-18 | été 1941 | Victor (35), Ninon (29), Claude (3) |
| PH-19 | juil. 1942 | Blanche (41), Marcel (45), Lise (4 mois) |
| PH-20 | mai 1953 | Selda (49), Firmin (53), Tavik (20) |
| PH-21 | 1948 | Ninon (36), Blanche (47) |
| PH-22 | 1951 | Armand (23), Mathilde (21) |
| PH-23 | 1954 | Mathilde (24) |
| PH-24 | juin 1955 | Lise (13) + 23 élèves hors arbre |
| PH-25 | 1956 | Hélène (25), Paul (28) |
| PH-26 | 1958 | Odile / Nora (50) |
| PH-27 | 1959 (photo de 1957) | Marcel / Dobrin (61) |
| PH-28 | nov. 1973 | M. Hautfeuille (hors arbre), Claude (35), Lise (31) |
| PH-29 | 1972 | Tavik (40) |
| PB-01 | 1905 | Pauline (21), idéalisée |
| PB-02 | 1905 | Augustin (33) |
| PB-04 | juin 1944 | Augustin (20) |
| PR-02 | 1902 | Firmin (gravure d'après une photo de 1895 : 46) |
| PR-06 | 1929 | Blanche (28) |
| PR-08 | mai 1938 | Marcel (41), Gaspard (39) |
| PR-11 | juin 1944 | Augustin (20), gravure |
| PR-12 | mai 1953 | Gaspard (54) |
| PR-13 | 1958 | Firmin (planche de 1951 : 51) |
| PR-15 | janv. 1966 | Victor (portrait vers 1960 : 54) ; obsèques : Ninon (53), Claude (27) |
| PR-16 | 1968 | Paul (39) |
| PR-17 | sept. 1971 | Armand (44), Hélène (40), Paul (43) |
| OF-03 | déc. 1969 | Adélaïde (90) |
| CT-01 | 1920 | Lucien (autoportrait de 1910 : 35) |

## 5. Secrets annexes : preuves

Chaque secret est « découvert » quand ses pièces **clés** sont lues (condition monotone) ; la
conclusion juste se choisit au rapport final (`05-secrets-et-fins.md`).

| Secret | Pièces clés (toutes requises) | Pièces d'appui | Chemins d'entrée |
|---|---|---|---|
| S1 La photographe de Vellaak | PH-26, RG-19, LT-15 | LT-11, LT-14, LT-17, OF-07, PR-13, CT-02, DV-05, RP-06 | OF-07 « photographe » ; « Nora Ilvess » (AN-03, PR-13) ; « fougère » |
| S2 Le registre bleu | DV-03, LT-12, RP-06 | OF-06, RP-03 | OF-06 « registre bleu » / « MF-74-112 » ; « Goéland » |
| S3 La reconnaissance de 1917 | RG-20, LT-05, LT-06 | LT-03, LT-07, CT-01 | LT-05 « Brunesseau » ; « reconnaissance » |
| S4 Le Goéland et l'Albatros | RP-01, LT-13 | PR-05, PH-20 | « Albatros » ; « canot de sauvetage » |
| S5 Le délateur | RP-02 (R), RP-04, PH-27 | RP-05, PR-09 | « Marcel Daubry » exact ; « Grisenoue » ; « Brenzac » |
| S6 Le secret d'Adélaïde | LT-11, LT-14, RG-14 (R) | RG-19 (témoin Haask), PR-14, CP-03, OF-02 | « Haask » ; « Maask » ; « N. » |

## 6. Points faibles connus (à surveiller au graphe)

- **C17 Orrin** et **C21 Hessa** n'ont que deux pièces de visage chacun : ne pas rendre PH-13 ou PH-15 optionnelles.
- **C25 Mathilde** : deux pièces seulement pour le métier (PH-22, PH-23) ; ajouter si besoin une
  publicité des Papeteries (1955) où elle pose, prévue en réserve (hors compte). Le nom « Rouvière »
  est désormais dans deux pièces (PH-22, PH-23, v0.2) ; PH-23 donne nom, visage et métier d'un coup,
  mais pas le placement (seule PH-22 en fait l'épouse d'Armand).
- **C19 Ninon** : « Brial » est dans RG-11 et PR-14 (v0.2), « Ninon » dans RG-11, PR-15, PH-21,
  PR-14. PR-14 n'est pas dans la démo ; il est lisible avant la porte C, ce qui laisse deviner le nom
  de jeune fille tôt (sans le placement, qui reste à RG-11).
- **C23 Augustin (1924)** : visage par PB-04 et une gravure (PR-11) ; la gravure doit rester fidèle
  (menton fendu, mèche de cheveux sur l'œil droit, écharpe).
- Les termes ostriens (*Maask*, *ilv*, *Ilvess*) ne sont cherchables qu'une fois lus : DV-05 doit être
  atteignable par deux chemins (« Selda Varenque », « Vel Taalik »).

## 7. Registre des écarts intégrés (passe de cohérence v0.2)

Le corpus rédigé (`content/cases/succession-varenque/documents/`) fait foi ; la bible le suit.
Corrections portées **dans le texte** des pièces (aucune modification de frontmatter) :

| Pièce | Écart | Correction |
| --- | --- | --- |
| LT-02 | Traduction « de la main d'Adélaïde » datée 1883 (elle a 3 ans) | Traduction faite par Adé à 13 ans, été 1893 ; intro : « écriture d'écolière, ajoutée des années plus tard » |
| PR-01 | « fille du regretté M. Hippolyte Aubertot » (vivant en 1888 et 1897) | « fille de M. Hippolyte Aubertot » |
| LT-01 / DV-01 | Planche 31 contre 27 ; osmonde datée 1888 au lieu de 1871 | Planche 27, cueillie le 14 juin 1871 |
| CT-01 | Prêt « M. Anselme Varenque » en 1920 (mort en 1919) | « Mme Anselme Varenque » |
| DV-02 | Ingénieur « Lamarque » ; RG-07 nomme Léon Vauquelin | Vauquelin |
| RG-18 | Gaspard inhumé le 6 sept. 1971 ; PR-17 : obsèques le samedi 4 | 4 septembre 1971 |
| OF-06 | Herbier « restauré en 1970 » | « en 1970-1971 » (212 planches) |
| PR-13 | 40 planches ; PH-26 : XXXVI, 36 photographies | 36 planches |
| AN-03 | 4, quai des Chartes ; OF-04 : 21 | 21, quai des Chartes |
| LT-13 | *Vel Taalik* « reparaîtra en juin » ; PH-20 : n° 1 en mai 1953 | « a reparu samedi, deux jours après mon retour » |
| PH-29 | Logement loué « un florin nouveau par an » ; AN-04 : à titre gracieux | « à titre gracieux, pour la surveillance » |
| PR-14 | Mèche blanche « découverte » en 1961 alors que LT-14 parle du ruban | Le ruban glisse au salut ; ajout de Ninon Sauge, née Brial (costume) |
| PH-23 | Prénom seul | Courrier des lecteurs : « Mathilde Rouvière » |
| PH-17, RG-14 | Terme caché « Orrin Kessvel » écrit en clair (avertissement de `content:check`) | Ligne « Identité » retirée (PH-17) ; titre d'extrait neutre (RG-14) |

Inventions des rédacteurs conservées (compatibles avec la bible, consignées dans 03, 04, 06) :
CT-01 dédicace « Pour V. » (Victor, 1920) ; RP-02 rapport qui disculpe Gaspard et où Marcel demande à
être relevé ; PB-04 visa du commissaire (Marcel contresigne l'ordre de 1944) ; RP-05 mandats anonymes
1953–1959 ; DV-03 écritures du registre bleu (T. H., N., 59 feuillets écrits sur 96) ; PR-11 note
marginale d'une main non identifiée ; DV-02 place vide pour Lucien au banquet de 1922 ; DV-05 sens des
prénoms ostriens et *daan* ; PR-14 cadenas visible ; RP-06 déclaration de Lise (14 oct. 1974).
Monde : hameaux et toponymes de la carte validés dans `docs/monde/00-monde.md` §3, prix de presse au §5.

**Validé par le propriétaire (14 oct. 2026)** : visa de Marcel sur PB-04 conservé ; mandats anonymes
de 1953–1959 conservés, sans dire si Blanche a deviné ; note marginale de PR-11 d'une main qui reste
**non identifiée** ; lettre de 1883 lue à Firmin par un matelot, traduite par Adélaïde en 1893 ;
panneau de la carte « route de Brénica » (au lieu de « vers Brénica »).
