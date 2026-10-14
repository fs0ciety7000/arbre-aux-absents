# 07 — Tableau de cohérence (affaire 2)

> Pour chaque case : quelles pièces prouvent le **nom** (N), le **visage** (V), le **métier** (M) ;
> au moins **deux chemins** pour y arriver ; les **fausses pistes** et la façon de les écarter ; les
> âges sur les photos ; les preuves des secrets ; les points à vérifier. Base de travail du
> `level-designer` (graphe, solveur) et de la relecture QA. (R) = pièce restreinte (« Prénom Nom » exact).
> « Départ » = OF-01 à OF-08 + PV-01.

## 0. Invariants

- [x] 28 cases ; N, V et M couverts par **au moins deux pièces distinctes** chacun (§1), sauf C06
      (établie au départ) dont la case est donnée.
- [x] Aucune case ne dépend **seule** d'une pièce restreinte (PH-09, PH-10, RG-13, RG-14, RP-05, RP-06) :
      les (R) servent la confirmation (EX-03) et les secrets.
- [x] **La case revendiquée se défait sans pièce restreinte** : yeux (RP-04 vs OF-02 / EX-01), main
      (RP-04 vs EX-01), photographies d'avant 1944 (PH-18, PR-03, PH-07) ; le métier déclaré (chef de nuit)
      par RG-11, RG-17, RP-04, PH-18.
- [x] **Le visage du requérant se rattache à Andrin par une pièce antérieure à mars 1944** sans (R) :
      PH-18 (1935, légende entière), PH-07 (1937, « A. Dal[…] » par élimination) et PR-05 (1941,
      « A. Dalvarin » au fond) : trois pièces, deux fonds, trois mots-clés distincts. C'est
      indispensable : toutes les pièces d'après 1944 sont compatibles avec la version du requérant.
- [x] Traits héréditaires cohérents : fossette (Évariste → Honoré, Marguerite, Léonce → Colombe, Bastien,
      Andrin → Hugues, Isaure, Agnès) ; yeux Ravenel (Eugénie → Colombe, Bastien → Hugues, Isaure, Agnès) ;
      épi (Honoré → Bastien → Agnès ; **pas Andrin**) ; sourcils Dalvarin (Dranko → Danela → Andrin).
- [x] Aucun mot ne désigne deux métiers d'une même personne : « directeur·rice » = Évariste et Colombe
      seulement ; Honoré est « maître verrier » partout (AN-01 le dit « président », jamais « directeur ») ;
      Bastien « chef de nuit » = grade (leurre), « souffleur » = qualité.
- [x] Les surnoms, le nom de religion et les matricules ne sont jamais la réponse (02-arbre §2).
- [x] La déclaration de C15 est fausse sur **deux** champs (portrait et métier `chef-de-nuit` ; nom
      juste, décision validée) et ses valeurs sont découvertes par une pièce de départ (OF-02) :
      conforme au contrôle prévu (« fausse sur ≥ 1 champ », `docs/game/AFFAIRE-2.md` §6).
- [x] Caméos neutres : CP-01 (Tennok, la gardienne, sans nom), PV-05 (Haask, témoin neutre : §6, règle du caméo), EX-02
      (« L. Daubry, restauratrice »), OF-07 (« C. Sauge »), PR-08 (avion postal, sans nom), OF-01
      (rapporteur titularisé). Aucun secret de l'affaire 1 n'est supposé.

## 1. Tableau par case

| Case | Nom | Visage | Métier |
|---|---|---|---|
| C01 Évariste | RG-01, RG-02, PR-01, OF-01 | PH-01, PH-04 | RG-01, RG-02, PR-01 |
| C02 Clotilde | RG-01, RG-02, RG-04 | PH-01, PH-04, PH-06 | RG-01, RG-02, PR-01 |
| C03 Dranko | RG-05, PH-05 (prénom), PR-02 (nom) | PH-05, PR-02 | RG-05, PR-02, PH-05 (meule) |
| C04 Barthélemy | RG-06, PH-02 (« B. Neviot ») | PH-02, CP-02 | RG-06, CP-02, RG-16 |
| C05 Annette | RG-06, RG-05 (« Annette Neviot, née Combal ») | PH-02, CP-02 | RG-05, RG-06, AN-01 |
| C06 Honoré | départ (OF-01, OF-04) ; RG-01, PR-09 | départ (OF-05) ; PH-04, PH-06, PH-07 | départ ; RG-03, CT-01, PR-09 |
| C07 Eugénie | RG-03, PV-03, PH-04 (prénom) | PH-04, PH-06 | RG-03, AN-01 |
| C08 Danela | RG-05, PH-03, PR-07, RP-03 (nom), PV-01 (prénom) | PH-03, PH-05, PR-02, PH-07, PH-13 | RG-05, PH-03, RG-17, CT-01, PR-07 |
| C09 Marguerite | RG-01, RG-05 (« en religion sœur Agathe »), RG-16, DV-01 | PH-04, PH-06 | RG-05, RG-16, DV-01 |
| C10 Léonce | RG-01, RG-03, CP-01, RG-16 | PH-04, CP-01 | RG-03, CP-01, LT-02, RG-16 |
| C11 Jules | RG-06, PR-06, PH-02 (« J. Neviot ») | PH-02, CP-02 | RG-06, PH-02 (insigne), AN-01, PR-06 |
| C12 Philomène | RG-06, AN-01 (« Mme Ph. Neviot ») | PH-02, PH-11 | RG-06, AN-01 |
| C13 Colombe | OF-03, RG-04, RG-07, PR-09 | PH-06, PH-07, PR-05, PH-14, PH-15, PR-09 | OF-01, OF-03, AN-02, PR-09 |
| C14 Aimé | OF-03, RG-07, RP-01, PR-03 | PH-06, PH-07, PR-05, PH-14 | OF-03, RG-07, RP-01, PR-03, AN-01 |
| C15 Bastien | déclaré (OF-02, juste) ; RG-04, RG-11, RP-04, PR-03, LT-11 | **PH-18, PH-07, PR-03** (PH-09 R ; PH-06 à 18 ans) | déclaré **faux** (chef de nuit) ; RG-11, RG-17, PR-03, RP-04, PH-18, LT-11 |
| C17 Andrin (« ? ») | RG-05, RG-12, RG-15, PR-07, RP-03, TG-02, PR-05 | OF-02, PH-17, CT-02, RG-15, PH-13, **PH-18, PH-07, PR-05** (PH-10 R) | RG-12, RG-15, RP-03, PR-05, CT-02, RG-17, PH-18 |
| C16 Lucie | OF-06, RG-06, RG-08, RP-03, PR-06 | PH-08, PH-11, PB-01 | OF-06, RG-08, RP-03, PR-06, PB-01 |
| C18 Victorin | RG-08 (mention), RG-10, RP-04 (« V. Sarrade »), PV-06 | PH-11, PH-16 | RG-10, RP-04, PV-06 |
| C19 Rémi | RG-06, RG-09, PR-08 | PH-11, PR-08 (PH-02 enfant) | RG-09, PR-08 |
| C20 Odette | RG-09, PH-12 (« Mme Neviot ») | PH-11, PH-12 | RG-09, PH-12 |
| C21 Hugues | OF-03, RG-07, PH-15, PR-09 | PH-14, PH-15 | OF-03, PH-15, AN-02, PR-09 |
| C22 Sabine | RG-07 (mention), PH-15, AN-02 (« Brossal-Orlhac ») | PH-15, PH-16 (reflet) | AN-02, PH-15, PH-17, OF-02 (studio) |
| C23 Isaure | RG-07, OF-03 (usage), PH-14, PR-10 | PH-14, PH-15, PR-10 | PH-14, PR-09, PR-10 |
| C24 Julien | OF-04, RG-07 (mention), AN-02 | PH-14, PH-15 | OF-04, AN-02 |
| C25 Agnès | OF-06, RG-08, PV-04, PR-10 | PR-10, PH-16 (PH-11, PH-12 enfant) | OF-06, PV-04, PR-10 |
| C26 Pierre | RG-10, PV-04 (prénom), PR-10 | PH-16, PR-10 | AN-02, PH-16, PR-10 |
| C27 Gilles | RG-09, PR-08, AN-02 | PR-08, PH-16 | AN-02, PR-08, PH-16 (insigne) |
| C28 Brigitte | RG-09, PR-08, AN-02 | PR-08, PH-16 | AN-02, TG-02, PR-08, PH-16 |

## 2. Chemins et pièges, cases clés

### Le trio du revenant (C15, C17, C25 — groupe 3 / 3)

**C15 Bastien Tessonnal — souffleur (case revendiquée).** Nom déclaré **juste** ; visage et métier
déclarés **faux** (visage du requérant ; « chef de nuit »).
Chemin 1 (sans R) : OF-03 (« les yeux de notre mère ») → OF-02 (signalement : yeux bruns) → « Bastien
Tessonnal » → RP-04 (1938 : yeux gris, main droite) → EX-01 (aucune cicatrice à droite) → retirer le
visage déclaré ; « grève » → PR-03 (photo nommée, 1936) → PH-07 (même homme, casquette, épi) : visage.
Chemin 2 : PV-03 (« sa dent ») → PH-07 (bouche entrouverte, incisive) ; « Bastien Tessonnal » (R) →
PH-09 → EX-03.
Chemin 3 (sans PH-07) : RG-17 (« 1er prix de soufflage, Saint-Éloi 1935 ») → « Saint-Éloi » → PH-18
(B. Tessonnal nommé, yeux clairs, épi, main droite) : visage et métier.
Métier : la requête dit « chef de nuit » (leurre, aussi dans RP-01 et PR-04) ; RG-11 (liste n° 9),
RG-17, RP-04 et PH-18 disent « souffleur ».
Pièges : le visage du requérant **ressemble** (fossette, ovale). PH-06 montre Bastien à 18 ans, encore
enfant de visage.

**C17 Andrin Dalvarin — graveur sur verre (case « ? »).** Visage = celui du requérant (à déplacer).
Chemin 1 : PV-01 (« Andrin, le fils de la Thalbère ») → OF-06 (« A. Dalvarin, Dalvica », vivant en
1975) → « Andrin Dalvarin » → RG-05 (naissance), RG-12 (graveur), RG-15 (photo de 1953 = le requérant à
40 ans) → PH-07 : le jeune homme au tablier de cuir, à côté de Bastien, « A. Dal[…] » = le requérant à
24 ans (sourcils, pas d'épi) → **antérieur à 1944** : la version du requérant tombe.
Chemin 2 : « Coupe du Régent » / PR-05 (1941, « A. Dalvarin » au fond) → OB-01 → EX-04 (même main que
le verre de 1959 et que Brénica 1974) ; OF-08 → TG-02 (« ANDRIN », 1976) → EX-02.
Chemin 3 (R) : « Andrin Dalvarin » → PH-10 (1941), RG-14 (brûlure de 1943) → EX-03.
Chemin 4 (sans PH-07) : RG-17 ou RG-04 → « Saint-Éloi » → PH-18 (1935, « A. Dalvarin (gravure) »,
sourcils, pas d'épi, déjà la loupe au cordon) → **antérieur à 1944**.
Pièges : **version du requérant** (« c'est Andrin qui est mort ») : toutes les pièces postérieures à
1944 (RG-15, PH-13, PR-07, CT-02, TG-02) la confirment ; seules PH-18, PH-07, PR-05, PH-10, RG-14, LT-06,
PV-05, TG-01 la réfutent. **Faux père Léonce** : sans effet sur la case (le nom reste Dalvarin), mais
sur Q3 ; CP-01 l'écarte.

**C25 Agnès Neviot — infirmière.** Nom et métier au départ (OF-06).
Chemin 1 : OF-06 → PR-10 (photo, 1976) → PH-16 (même femme, 1974, épi, sifflet).
Chemin 2 : « Agnès Neviot » → RG-08 → PV-04 ; PH-11 / PH-12 (enfant, épi).
Pièges : « fille du Thalbère » (RP-03, Odette) : sans effet sur la case (Agnès est sous Bastien par
le schéma), effet sur S5.

### Le prologue (C07, C13, C14)

Chemin : OF-03 (Colombe, Aimé, « notre mère ») → PH-06 (mariage de 1928 : Honoré connu par OF-05 ; la
mariée à côté du marié ; la dame au ruban de velours = la mère) → RG-03 (Eugénie Ravenel, modiste) →
AN-01. Deuxième chemin : PR-05, PH-07 pour Aimé et Colombe ; PH-04 pour Eugénie.
Piège : Clotilde (72 ans) et sœur Agathe sont aussi sur PH-06 ; la légende partielle les nomme.

### Les maîtres verriers (C01, C02, C10)

Chemin : OF-01 (Évariste) → PR-01 → PH-01 (couple devant la lentille) → RG-01, RG-02. Léonce : PH-04
(verso) + CP-01 (lunettes dans la lanterne) ; métier par RG-03 (témoin, « opticien ») et CP-01.

### Le baptême de Vernezac (C03, C08, C09)

Chemin : RG-05 (Dranko, Danela, Marguerite « en religion sœur Agathe ») → PH-03 (Danela), PH-05
(Dranko), PH-04 (verso « sœur Agathe »). Deuxième chemin : PV-02 (« ma tante Marguerite, sœur
Agathe ») → RG-16 → DV-01.
Piège : **nom de religion** : le joueur doit poser « Marguerite Tessonnal », pas « sœur Agathe ».

### La maison Brossal (C21–C24)

Chemin : OF-03 (Hugues, Isaure Escande), OF-04 (Julien Escande, notaire) → RG-07 (mentions : Sabine
Orlhac, Julien Escande) → PH-14, PH-15 → AN-02.
Piège : **Me Léon Escande** (père) sur PH-14, à côté de son fils : même nez ; le père a la moustache
et 62 ans.

### Les gens de la Combe (C04, C05, C11, C12) et les guides de Vernezac (C19, C20, C27, C28)

Chemin : RG-06 → PH-02 (légende « M. et Mme B. Neviot ; le guide J. Neviot (n° 7) et Mme ») → CP-02
(la main à trois doigts, la sacoche) → AN-01. Guides : insignes **n° 7, 19, 31** sur PH-02, PH-11,
PR-08, PH-16. Brigitte : OF-08 → TG-02 → PR-08 → AN-02.
Piège : « le guide Neviot » sans prénom dans PR-06 (« le guide Jules Neviot » : nommé) et dans RG-16.

### Le Pas de l'Ourse (C16, C18, C26)

Chemin : OF-06 (Lucie, gardienne) → PH-08 / PB-01 → RG-08 (mention Sarrade) → RG-10 → PH-11 → PH-16.
Victorin aussi par RP-04 (« V. Sarrade ») et PV-06.

## 3. Fausses pistes et leur levée

| Fausse piste | Pièces qui la portent | Pièces qui la lèvent |
|---|---|---|
| Le requérant est Bastien | OF-02, PV-01, PV-02, PR-10, RG-15 et tout l'après-1944 | PH-18, PH-07, PR-03, RP-04, EX-01, LT-06, PV-05, PV-06, TG-01, EX-03 |
| Andrin est mort en 1944 | PV-01, OF-02 | TG-01 (1952), RG-14 (R), PR-07 (1960), OF-06 (écrit en 1975), PV-05 |
| Andrin est le fils de Léonce | RG-05 (parrain), PV-01, PV-07 | CP-01 (absent nov. 1911–févr. 1912), LT-01, LT-02, DV-01, RG-17 |
| Agnès est la fille du Thalbère | RP-03, Odette (PV-06, en rapport), rumeur | LT-05, LT-06, LT-11, PH-12 (épi), PH-08, DV-02 |
| Bastien a mis le feu | RP-01, RG-11, PR-04 | RG-18, RP-02, LT-10, LT-04, LT-09 |
| Andrin radié pour « outrage » | RG-12 | OB-01, RP-05 (R), EX-04 |
| Le requérant a fui un jugement pour sabotage | RP-06 (R), PV-01 | RP-06 elle-même (« Sans objet. Décédé le 9.3.44 ») |
| Le requérant a échangé les plaques à l'infirmerie, la nuit | PV-01 (« personne ne regardait ») | PV-05 (le gardien de service : « Personne n'a échangé ces deux-là »), RG-13 (constat du médecin) |
| Bastien était « chef de nuit » (métier) | OF-02 (déclaration), RP-01, PR-04 | RG-11, RG-17, RP-04, PH-18 : souffleur ; chef de nuit est un grade |
| Taille : 1,74 m en 1938, 1,71 m en 1976 | RP-04, OF-02 | **Non concluant** : EX-01 l'écarte explicitement (tassement possible). |

## 4. Âges sur les photographies (pour le `cartographe`)

| Pièce | Date | Personnes et âges |
|---|---|---|
| PH-01 | été 1889 | Évariste 41, Clotilde 33, Honoré 8 |
| CP-02 (image) | vers 1905 | Barthélemy 58, Annette 54, Jules 28 |
| PH-02 | juil. 1911 | Barthélemy 64, Annette 60, Jules 34, Philomène 31, Rémi 3, abbé Pradeil ~50 |
| CP-01 | déc. 1911 | Léonce 26 (silhouette) |
| PH-03 | juin 1912 | Danela 24 (enceinte de 7 mois) |
| PH-04 | sept. 1915 | Évariste 67, Clotilde 59, Honoré 35, Eugénie 31, Léonce 30, Marguerite 32, Colombe 9, Bastien 5 |
| PR-02 | avr. 1916 | Dranko 60, Danela 28, Andrin 3 |
| PH-05 | sept. 1916 | Dranko 60, Danela 28, Andrin 4 |
| PH-06 | oct. 1928 | Colombe 22, Aimé 29, Honoré 48, Eugénie 44, Clotilde 72, Marguerite 45, Bastien 18 |
| PH-18 | 1er déc. 1935 | Bastien 25, Andrin 23 |
| PR-03 | juin 1936 | Bastien 26 |
| PH-07 | été 1937 (juillet) | Honoré 56, Aimé 38, Danela 49, Colombe 30, Bastien 27, Andrin 24, Mallet 60, Lavergne ~50 |
| PH-08 | août 1937 | Lucie 23 |
| PH-09 (R) | 24 mai 1938 | Bastien 28 |
| PR-05 | 7 sept. 1941 | Colombe 35, Aimé 42, Andrin 29 |
| PH-10 (R) | 25 sept. 1941 | Andrin 29 |
| PH-11 | 12 avr. 1947 | Lucie 33, Victorin 32, Agnès 8, Philomène 67, Rémi 39, Odette 34, Gilles 10, Brigitte 5, Fauvel ~45 |
| PH-12 | juin 1947 | Odette 34, Agnès 8, Gilles 11, Brigitte 5 |
| RG-15 | 3 juin 1953 | Andrin 40 |
| PH-13 | été 1955 | Danela 67, Andrin 42, Jadela Rovin ~40 |
| PH-14 | 21 juin 1958 | Isaure 24, Julien 30, Léon Escande 62, Colombe 51, Aimé 59, Hugues 27, Honoré 77 |
| PH-15 | 4 juin 1960 | Hugues 29, Sabine 24, Isaure 26, Julien 32, Colombe 53, Honoré 79 |
| PB-01 | 1962 | Lucie 48 |
| OF-05 | sept. 1965 | Honoré 85 |
| PR-08 | janv. 1966 | Rémi 57, Gilles 29, Brigitte 24 |
| PH-16 | 17 févr. 1974 | Pierre 25, Gilles 37, Brigitte 32, Agnès 35, Victorin 59, Sabine 38 |
| CT-02 | 1974 | Andrin 61 |
| PR-09 | déc. 1975 | Colombe 69, Hugues 44, Isaure 41, Agnès 36 (de dos) |
| OF-02, PH-17 | 9 janv. 1976 | Andrin 63 |
| PR-10 | janv. 1976 | Isaure 41, Andrin 63, Agnès 36, Pierre 27 |

## 5. Preuves des secrets

| Secret | Pièces clés (≥ 2) | Appui | Accès sans (R) ? |
|---|---|---|---|
| S1 Le feu de 1937 | RG-18, RP-02, LT-10 | LT-04, LT-09, PV-03, RP-01, PR-04 | oui |
| S2 Le Pas de l'Ourse | DV-02, PR-06, PV-06 | CP-02, RG-16, PB-01, PV-01 | oui |
| S3 Le fils de la Thalbère | CP-01, LT-01, DV-01 | LT-02, LT-03, LT-08, RG-17, RG-05, TG-01, PH-13 | oui |
| S4 La Coupe du Régent | OB-01, EX-04, RP-05 (R) | PR-05, RG-12, PH-10 (R) | oui (OB-01 + EX-04) |
| S5 La fille du souffleur | LT-05, LT-06, LT-11 (deux sur trois) | DV-02, PH-08, PH-12, PV-06, RP-04, OB-02 | oui |

## 6. Cohérence avec l'affaire 1 et le monde

| Point | Vérification |
|---|---|
| Lentille de Tennok « des Verreries de Hautcorvin (1889) » (AN-04, affaire 1) | PR-01, PH-01, CT-01, CP-01 : même date, même maison. Léonce (1911) **révise** l'appareil, il ne le crée pas. |
| Gardiens de Tennok : Maaren jusqu'en 1912 (affaire 1, AN-04) | CP-01 (déc. 1911) : « la gardienne est une femme » : Maaren, non nommée. ✔ |
| Kessaar : écrous n° 1186–1189 le 8 nov. 1941, liste n° 41 (affaire 1, RG-13, RG-14) | Andrin : liste **n° 40** (16 oct. 1941), écrou **1171** (18 oct.) : antérieur et cohérent. Bastien : liste n° 9 (26 mars 1938), écrou 0214 (3 juin 1938). Listes de 1938 : n° 3 le 19 févr. (affaire 1). ✔ |
| BRR, fiches 41-2206/2207 le 24 oct. 1941 (affaire 1) | Andrin 41-1987 le 25 sept. 1941 ; Bastien 38-0377 en mai 1938. ✔ |
| Henri Brissac, instituteur, né en 1890 à Hautcorvin, radié liste n° 41 (affaire 1) | Cité comme maître d'école de Bastien (PV-01). Ne pas lui donner d'autre rôle. ✔ |
| Teodor Haask, « trente-quatre ans » le 11 mai 1946 (affaire 1, `content/…/rg-19.md`) | Né entre le 12 mai 1911 et le 11 mai 1912 ; « 63 ans » le 18 févr. 1976 impose le 19 févr. 1912 au plus tôt. **Date fixée : 3 avril 1912.** Vérifié (v0.2) : aucune autre date ni aucun âge de Teodor dans `docs/scenario/` (affaire 1 : 03 « 1912– », 04) ni dans `content/cases/succession-varenque/` (RG-14 1943, LT-10 « le fils Haask » 1942, RG-19, F5 : fonctions seulement). Son père Jorre est gardien adjoint de Tennok de 1905 à 1912 (AN-04) : compatible. ✔ |
| *Le Héraut* : 40 sous d'ordre en oct. 1941 (affaire 1) | PR-05, 9 sept. 1941 : 40 sous. ✔ |
| Prix 1966–1974 (*Courrier*, *Gazette* 0,35–0,40 Fn) | *La Sentinelle* (hebdo régional) : 0,30 Fn en 1966, 0,40 Fn en 1975–1976. ✔ |
| Aucun train | Andrin repart « par le col » (route) ; vedette de Kessaar à Port-Sénane (TG-01) ; avion postal (PR-08). ✔ |
| Thalbère : noms en *-in*, *-ko*, *-ela* | Dranko, Danela, Andrin, Dalvarin, Jadela Rovin. Brénica / Brenzac ; **Dalvica / Dalvezac** et **Vernica / Vernezac** suivent la même règle *-ica* → *-zac* (proposée, `08-lieux.md`). |

### Règle du caméo Teodor Haask (PV-05)

Dans l'affaire 1, Haask a inscrit un faux décès et appartenait au réseau : **rien de cela ne doit
transparaître**. Dans l'affaire 2 il est un témoin neutre, crédible sans l'affaire 1 :
- il ne parle **que** du 0214 et du 1171, de la nuit du 9 mars 1944 et de la libération de 1952 ;
- il dit vrai, et sa parole est doublée par une pièce administrative (RG-13 : constat du Dr Hervel) ;
  il n'a aucun intérêt dans le dossier ;
- interdits : tout autre détenu ou détenue, toute naissance au bagne, tout décès « irrégulier » ou
  « arrangé », toute aide aux détenus, tout billet transmis, la mer et l'immersion, Tennok, le phare,
  son père, Grisenoue, les Pupilles, la résistance, l'Ostrie au-delà de « Vellaak » ;
- formulations à éviter : « je n'ai pas échangé **ces deux-là** » (laisse entendre d'autres échanges) ;
  dire « **personne** n'a échangé ces deux-là » ;
- le requérant ne l'accuse de rien : son échange de plaques (PV-01) est un geste qu'il dit avoir fait
  seul, la nuit, « personne ne regardait ».

## 7. Points faibles et points à vérifier

1. **Le trio peut se résoudre par les traits seuls** (yeux gris sur PH-07 contre yeux sombres sur
   OF-02) dès la première heure, si le joueur regarde bien. C'est voulu (« un visage ment moins qu'un
   registre »), mais le `level-designer` peut retarder PH-07 (débloquée par « halle des fours » ou
   « Verreries de Hautcorvin » + lecture de RP-01) pour que le doute dure.
2. ~~PH-07 porte beaucoup~~ **Réglé (v0.2)** : PH-18 (1935, Studio Orlhac, mot-clé « Saint-Éloi »)
   permet la même déduction (les deux demi-frères nommés, côte à côte, avant 1944) par un autre fonds ;
   PR-03 et PR-05 restent des chemins complémentaires. À vérifier au solveur.
3. **Le requérant pourrait connaître l'erreur des yeux** et l'expliquer : PV-02 le fait dire que les
   douaniers « notent ce qu'ils veulent, la nuit, à la lanterne » et que « les yeux foncent avec l'âge » ; RP-04 (douanes) et OF-03 (sa sœur) ne viennent pas
   de Kessaar. Garder les trois sources.
4. ~~Combe-aux-Sables, lieu léger~~ **Tranché** : simple toponyme de carte, sans `PlaceId` ; CP-02
   est classée à `vernezac`.
5. **Brigitte, auteur du billet anonyme** (OF-08) : aucune pièce ne le dit explicitement ; c'est une
   déduction (papier des Postes, cachet, TG-02). Volontaire.
6. **Sabine et le négatif de profil** (PH-17) : il faut qu'une pièce explique comment l'ORC l'obtient
   (note du greffier en tête d'EX-03 : « négatif remis le 17 février par Mme S. Brossal, photographe »).
7. **Art. 12 de la loi de 1973** : validé et reporté dans `docs/monde/00-monde.md` (§2 et §11).
8. **Isaure journaliste, fille de la partie opposante** : PR-10 doit rester neutre ; en relecture,
   vérifier qu'elle ne prend pas parti.
9. Date de naissance de Julien Escande (4 janv. 1928) et de Sabine (9 févr. 1936) : fixées ici pour
   les âges ; aucune pièce ne les donne en entier (mentions marginales seulement).
