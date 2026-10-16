# 07 — Tableau de cohérence (affaire 3)

> v0.2 (16 oct. 2026), après la relecture du `game-designer` (`docs/game/AFFAIRE-3.md`) et du
> `level-designer` (`docs/level/longuegreve.md`). Pour chaque case : les pièces qui prouvent le
> **nom** (N), le **champ** (K pour une marque, V pour un visage) et le **métier** (M) ; au moins **deux
> chemins** ; les **fausses pistes** et ce qui les lève ; les âges sur les photos ; les preuves des
> secrets ; les contrôles de la grammaire des marques ; les points à vérifier. C'est la base de travail
> du `level-designer` (graphe, solveur) et de la relecture QA. « Départ » = OF-01 à OF-08 + BD-01.
> **Portes** A, B, C : `docs/level/longuegreve.md` §4 (rappel en fin de `06-corpus.md`).
> Codes de marque en **cote LX** (`09-marques.md` §2) ; dans cette bible seulement, jamais dans un id.

## 0. Invariants

- [x] 32 cases. Pour chaque case, N, champ et M sont couverts par **au moins deux pièces distinctes**
      (§1), sauf C24, établie au départ.
- [x] **19 cases à marque, 13 à visage**. L'interface affiche la nature du champ ; le monde la justifie
      (OF-01, art. 15, al. 2 ; RG-22 pour Elzéar).
- [x] Les **23 marques justes et les 11 leurres** sont deux à deux distincts (`09-marques.md` §3).
      Chaque marque juste se calcule par les règles R1–R6 à partir de sa place dans l'arbre, et
      réciproquement.
- [x] **Notation LX** : barre `b`, grain `pt`, talon `t` suivi de la tête. Elle est annoncée par OF-06,
      pièce de départ, sur l'exemple `A-d`. La main de Marest (`·`, `/`, `+`) n'apparaît que dans OF-05.
      Deux écritures, un seul dessin : la table de conversion est dans `09-marques.md` §2.
- [x] **L'exception R6** (barre) est annoncée par une pièce de départ (OF-05) avant d'être nécessaire,
      puis redite (BD-03, PV-05). La marque de mer (leurre D3, barre sans tête) l'illustre dès OF-05.
- [x] **Une marque ne compte que par une pièce autographe** : registre, objet taillé, croix ou objet
      photographié (R7). Un relevé (CN-01, CN-02, CN-03) ou une marque dite (BD, DV-02) n'est qu'un
      appui. Chaque marque de case a **au moins deux autographes** : la contre-épreuve « une pièce
      retirée » passe (§1, `09-marques.md` §4).
- [x] **Codes en clair** : seulement OF-05 (codes de morts, main de Marest), OF-06 (`A-d`), CN-01
      (`A-g`, `A-d`) et CN-02 (`A-b`, `A-b-g`, `O-g-g`). Aucune autre pièce, fin ni épilogue n'en écrit
      un. Un code écrit après un nom est un `::mark` dessiné, jamais du texte.
- [x] **Aucun code dans un id** : les ids de portrait sont neutres (`lg-portrait-xxxxxx`). La table du
      `cartographe` fait foi (`art/tools/portraits/ids-marques-de-longuegreve.json`). Les noms de
      travail `lg-m-…` restent dans la bible.
- [x] Aucune case ne dépend d'une seule pièce à déblocage tardif. PV-06, DV-01 et OB-02 servent S2 et
      S4, jamais une case.
- [x] La branche cachée Garnaud a **trois portes** (RG-13, PH-15, EX-01, toutes au niveau C). Blaise
      lui-même en a **quatre** (RG-01, RG-02, CN-03, LT-01). BD-02 ne le révèle plus.
- [x] Les surnoms (*le garnaud*, *l'enfant de mer*, *la maîtresse*), les codes de marque, les prénoms
      seuls (CN-01, BD-05) et les noms de maison seuls ne sont jamais la réponse (`02-arbre.md` §2).
- [x] **Noël n'a aucun lien de parenté** dans l'arbre. Il est placé dans la colonne de Siméon et
      Ursule, sans trait (`02-arbre.md` §1).
- [x] Aucun métier ne désigne deux métiers d'une même personne. La règle « connu comme tel dans au moins
      deux pièces » est écrite dans OF-01. **Leurres de métier lisibles avant la case** :
      - `armateur` : PR-03, niveau 0 ;
      - `matelot` : PR-04, niveau 0, et RG-13. C'est un premier métier, quitté, comme `comptable` dans
        l'affaire 1 ;
      - `gardien-de-phare` : PV-03, niveau A.
      Chacun est contredit par au moins deux pièces (§3).
- [x] Dates et jours de la semaine vérifiés (`03-chronologie.md`, calendrier de l'enquête de 1977) ;
      âges cohérents (§4).
- [x] Monde : aucun lieu, personne ou institution réels ; aucun train. Caméos neutres : Ferrandot,
      C. Sauge, Studio Lumen, *Duchesse-d'Ambre*, Dumesnil-Corre, Phototypie de l'Orvelle. Rien des
      affaires 1 et 2 n'est dévoilé.

## 1. Tableau par case

Les pièces entre parenthèses servent d'appui (relevé, marque dite, mention) : elles ne suffisent pas
seules. Dans la colonne K, toutes les pièces hors parenthèses sont autographes.

| Case | Nom | Champ (K / V) | Métier |
|---|---|---|---|
| C01 Gervais | OF-02, RG-01, RG-05, RG-07 (+ CN-01, BD-05 : prénom) | K : OF-02, RG-05, RG-07, RG-08, RG-24 (+ CN-01) | OF-02, RG-01, RG-07, RG-08, BD-05 |
| C02 Perrine | RG-01, RG-07, RG-08 | K : RG-07, RG-08, au pied de l'acte (+ CN-01) | RG-01, RG-07, RG-08 |
| C03 Clovis | OF-02, RG-01, RG-07, RG-09 | K : OF-02, RG-05, RG-07, RG-09, PH-09 (croix) (+ CN-01, DV-02) | OF-02, RG-01, RG-07 |
| C04 Toinette | RG-01, RG-07, RG-09 | K : RG-07, RG-09, au pied de l'acte (+ CN-01) | RG-01, RG-07, BD-05 |
| C05 Siméon | OF-02, RG-01, RG-02, RG-10, RG-19 | K : OF-02, RG-05, RG-10, RG-19, RG-24 (+ CN-01) | OF-02, RG-02, RG-10, BD-03 |
| C06 Ursule | RG-01, RG-02, RG-10 | K : RG-10 (au pied de l'acte), PH-10 (navette) (+ CN-01, CN-02, BD-06) | RG-01, RG-10, BD-06 |
| C07 Lubin | OF-02, RG-01, RG-08, RG-09, RG-10 | K : OF-02, RG-05, RG-08, RG-09, RG-10, RG-24 (+ CN-01) | OF-02, RG-01, RG-08 |
| C08 Apolline | RG-01, RG-08, RG-09, RG-10 | K : RG-08, RG-09, RG-10, au pied des actes (+ CN-01) | RG-01, RG-08, BD-05 |
| C09 Josse | RG-01, RG-05, RG-08, RG-15, RP-06, BD-02 | K : RG-05, RG-07, RG-08, RG-15, RG-19, RG-24, LT-06 | RG-08, RG-15, RG-24, RP-06, BD-04 |
| C10 Reine | RG-01, RG-08, RG-15, PV-02 | K : RG-15, PH-10 (fuseau) (+ CN-02) ; fille `P-pt` : RG-08 | RG-08, RG-15, BD-04 |
| C11 Jacquette | RG-01, RG-07, RG-15, RG-18, BD-01 | K : RG-15, RG-18 (+ BD-01) ; fille `Y-pt` : RG-07 | RG-03, RG-15, RG-16, RG-18, RP-04 |
| C12 Médard | RG-01, RG-03, RG-07, BD-01, DV-02 | K : RG-05, RG-07, RG-08, RG-19, RG-24, LT-06 (+ BD-01, DV-02) | RG-07, RG-18, BD-01 |
| C13 Blaise (cachée) | RG-01, RG-02, RG-13 ; usage : OF-03, RG-12, RG-14, PR-04, RP-06 | K : RG-13, RG-20, LT-01, LT-05 (+ CN-03, PH-08, PH-15, EX-01) | RG-12, RG-14, AN-01, PR-02, PR-04 |
| C14 Amélie (cachée) | RG-12, RG-14, AN-01, PR-04 | V : PH-17, PH-01 | RG-12, RG-16, AN-01, PH-17, PR-04 |
| C15 Ernestine | RG-01, RG-09, RG-15, CN-02 | K : RG-15, PH-10 (tampon) (+ CN-02) ; fille `O-pt` : RG-09 (original) | RG-15, CN-02, BD-06 |
| C16 Fulbert | RG-01, RG-05, RG-09, RG-15, PV-04 | K : RG-05, RG-07, RG-09, RG-15, RG-19, RG-24, LT-06 (+ CN-02) | RG-09, RG-15, PV-04 |
| C17 Benoît | RG-02, RG-11, RG-15, RG-21, OF-07 | K : RG-08, RG-11, RG-15, RG-19, RG-21, RP-04, OB-05 (linteau) (+ CN-02) | RG-11, RG-16, RG-21, RP-04 |
| C18 Sidonie | OF-07, PV-03, RG-04, RG-11, LT-02 | V : PH-03, PH-02, PH-12 | OF-07, PV-03, RG-11, RG-21, RG-22 |
| C19 Noël | RG-02, RG-10, RG-15, RG-19, BD-03 | K : RG-10, RG-15, RG-18, RG-24, LT-06, OB-01, PH-10 (avirons) (+ CN-02) | RG-10, RG-18, BD-03 |
| C20 Honorine | RG-02, RG-10, RG-15, RG-18 | K : RG-15, RG-18 ; fille `P-pt-pt` : RG-10 | RG-10, RG-15, RG-18 |
| C21 Gatien | RG-03, RG-15, RG-17, RG-18, RG-22 | V : PH-04, PH-03, PH-05, PH-06, CP-01 | RG-16, RG-17, RG-18, RG-23, CT-01 |
| C22 Léontine | RG-17, PH-06, PV-02 | V : PH-06, PH-05 | RG-17, PH-06, PV-02 |
| C23 Elzéar | RG-03, RG-15, RG-22, RG-23, BD-01 | K : RG-15, RG-23, PH-10 (aviron) (+ CN-02, BD-01, BD-06) | RG-15, RG-17, RG-23 |
| C24 Victoire | **départ** (OF-01, OF-08) ; RG-03, RG-18 | **départ** (OF-08) ; PH-03, PH-04, PH-05, PH-09 | **départ** ; RG-18, RG-23 |
| C25 Lazare | RG-03, RG-15, RG-18, RG-22 | V : PH-05, PH-03 | RG-16, RG-17, RG-18 |
| C26 Clément | RG-03, RG-15, RG-18, RG-22, PV-04 | V : PH-05, PH-03 | RG-15, RG-16, RG-17, RG-18, PV-04 |
| C27 Léandre (cachée) | RG-14, PR-04, LT-05, LT-08, BD-07 | V : PH-04, PH-07 | RG-14, RG-23, PR-04, PH-04 |
| C28 Félix | OF-04, RG-17, PV-02, PR-07, PR-08, BD-05 | V : PH-14, PH-09 | OF-04, AN-02, BD-05, PR-07, PR-08 |
| C29 Rose | OF-04, RG-17, BD-06, AN-02 | V : PH-10, PH-16 | AN-02, BD-06, PH-16 |
| C30 Marin | OF-04, RG-17, PV-02, PR-07, BD-06 | V : PH-14, PH-10 | OF-04, RG-23, AN-02, PR-07 |
| C31 Aline | RP-09, RG-17, PV-04, AN-02 | V : PH-18, PH-11 | RP-09, AN-02, PH-11, PV-04 |
| C32 Edmée (cachée) | OF-03, PR-05, RP-08, PV-01, BD-07 | V : PH-13, PH-07 | OF-03, PR-05, RP-08, AN-02 |

**Contrôles de la v0.2.**
- Les épouses de 1868 (C02, C04, C06, C08) ne tirent plus leur nom de CN-01 ni de BD-05 : ces deux
  pièces ne donnent que des prénoms. Le nom complet vient des actes, RG-01 et RG-07 à RG-10.
- PH-09 ne montre lisible que la croix de Clovis. Il ne sert plus d'appui aux autres marques de la
  génération I.
- C06 Ursule a deux autographes, RG-10 et la navette (PH-10), et trois appuis.
- C17 Benoît ne tire plus son métier d'OF-07 : Ginette dit « du feu de Longuegrève », sans nommer le
  métier.
- C13 n'est plus nommé par BD-02 : Victoire dit « M. Garnaud ».

## 2. Chemins et pièges, cases clés (par porte)

### Les quatre de 1868 et les talons (C01–C08), niveau 0 et porte A

**Chemin 1, au départ.**
1. OF-02 donne les noms, les métiers et les marques des quatre chefs.
2. OF-05 donne les règles et les codes des morts ; OF-06 la cote LX.
3. BD-05 (« cimetière de Longuegrève », prénoms) rend CN-01, les croix relevées : de l'appui seulement.

**Chemin 2, par la porte A** (PV-03 → copie Brémoy).
1. RG-01 donne les baptêmes, donc les noms complets des épouses.
2. RG-07 à RG-10 sont les actes de mariage des enfants. Époux et témoins font leur marque à côté de
   leur nom ; les parents présents la font **au pied de l'acte, sans légende**, dans l'ordre de passage
   à la table :
   - RG-07 : `O-tA`, `Y-tO`, `O`, `Y` ;
   - RG-08 : `P`, `P-tY`, `Y-tO`, `Y` ;
   - RG-09 : `O`, `P-tY`, `P`, `O-tA` ;
   - RG-10 : `A-tP`, `P-tY`, `A`, `P`.
   Pour attribuer une marque, il faut lire le talon : c'est la leçon de `g-talons`.
3. Ursule a un second autographe, sa navette (PH-10, porte B), que Marin cite (BD-06).

**Piège.** L'ordre du corps de l'acte n'est jamais l'ordre du pied. Sur les croix, la marque de mer (pied
barré sans tête) et les fils noyés de Siméon (`A-g`, `A-d`) : OF-05 et OF-06 les ont annoncés.

### La Fourche (C09, C10, C21, C22, C28), porte A puis B

**Chemin.**
1. OF-04 (Félix, « cimetière de Longuegrève ») → PV-02, porte B.
2. PV-02 donne Gatien, Léontine, Reine et la lettre fermée, puis les photos PH-05, PH-06, PH-09.
3. RG-17 : Félix est fils de Gatien.
4. RG-15, la liste nominative de 1908 (porte B) : Josse `Y-g`, Reine `Y-g-tP`.
5. PH-04 et PH-06 : les visages.

**Second chemin.** RG-08, le mariage de 1879 (porte A) → PH-10, le fuseau → BD-04. Josse est aussi dans
RP-06 (« chef de la maison de ce nom »).

**Piège.** L'aviron de Gatien (`Y-g-g`, CN-02 sans cote, PH-10) ressemble à la marque de Josse ; R8 et
R3 l'écartent. CN-02 ne porte jamais ce code écrit : il contiendrait le code caché de Josse.

### L'Œil (C11, C12, C23, C29), niveau 0 puis A

**Chemin.**
1. BD-01, au départ, dit Médard, Elzéar et Jacquette.
2. DV-02, la rédaction de Victoire (porte A).
3. RG-07, le mariage de 1876.
4. RG-15 (porte B) : Jacquette `O-g-tY`, Elzéar `O-g-g`.
5. RG-23, la paie d'Elzéar ; PH-10, son aviron.

**Rose.** OF-04 → BD-06 → RG-17 → PH-10, PH-16.

**Piège.** Une marque dite (BD-01, DV-02) n'est pas une marque montrée : il faut la retrouver. La cote
`O-g-g` est écrite sur CN-02 (voir §7, point 1).

### La Potence (C15, C16, C26, C31), porte A puis B

**Chemin.**
1. RP-09 et PV-04 (Aline) donnent Clément et Fulbert.
2. RG-17.
3. RG-09, le mariage de 1877, original et double (porte A).
4. RG-15.
5. PH-10, le tampon à pain ; CN-02, le couvercle de caisse.
6. PH-05 et PH-03 pour le visage de Clément.

**Pièges.** La croix `X` du double (D9, R7) ; Delphine `P-g-pt` sur la liste (D8).

### L'école et le feu (C17, C18, C20), niveau 0 puis A

**Chemin pour Benoît et Sidonie.**
1. OF-07, au départ (« cahiers de la chapelle », « du feu de Longuegrève »).
2. PV-03, jeudi 6 octobre, porte A : la remise des cahiers.
3. RG-11, le mariage de 1890.
4. RG-21, Phares et Balises.
5. RP-04, le journal ; PH-02, PH-03.
6. La marque de Benoît sur le linteau OB-05, montré par Marin (PV-02).

**Honorine.** RG-10 → RG-15 → RG-18.

**Piège.** Le leurre `gardien-de-phare` (PV-03, niveau A) ; RG-21 et RG-16 (« gardien de feu ») le
lèvent.

### L'enfant de mer (C19, C25, C30) — l'exception jouable, niveau 0 puis B

**Chemin 1.**
1. OF-05 donne la règle de la barre, au départ.
2. OF-04 → BD-06 (« l'aviron du grand-père Noël, avec la barre »).
3. CN-02 (cote `A-b`).
4. RG-10 (« de parents inconnus, recueilli »).
5. RG-15, `A-b`, et l'aviron OB-01 et PH-10.

**Chemin 2.** PR-01 (*Aurore*) → RG-02 (baptême sous condition) → BD-03.

**Ce que le joueur doit faire.** Ne pas placer Noël comme enfant de Siméon : il est dans la colonne de
Siméon et Ursule, **sans lien de parenté**. Il l'identifie par sa marque barrée. Le couple n'a pas
d'enfant de sang vivant : `A-g` et `A-d` sont sur les croix de 1869 (CN-01).

**Piège.** Le nom Cormaud, qui est juste, fait croire à un fils de sang ; les cheveux bouclés (04 §0)
appuient l'erreur.

**S3.** RG-19 n'est communiqué qu'une fois C19 établie, ou à la porte C.

### Le fils parti (C13, C14, C27, C32) — la branche cachée, portes A, B, C

**Chemin 1, par déduction (niveau A).**
1. RG-01 : baptême de Blaise, puîné de Gervais, avec « Blaise Goémard » en marge.
2. Déduire `Y-d` (R3) et le chercher (code caché).
3. CN-03 : la cheminée de l'hôtel Garnaud, relevé de 1964 **sans code**. Blaise est révélé ; la branche
   n'apparaît pas encore.
4. Les résultats décisifs restent derrière la porte C : RG-13 (« Blaise, dit Garnaud, fils de Gervais
   Goémard »), PH-15 (la tombe de Blaise **Garnaud**), puis RG-12 (même date de naissance), RG-14 et
   PR-04.

**Chemin 2, par les archives.** RG-02 (« il part pour la Grand-Terre », « lanière Lestaud ») →
« Inscription maritime » → RG-13, porte C.

**Chemin 3, par le Comptoir (porte B).**
1. OF-03 ou BD-07 (« trident ») → PV-01, mardi 11 octobre.
2. PH-08 (la cheminée) et LT-08 (le coffre).
3. PV-02, mercredi 12 octobre → LT-01, la lettre de 1908 ouverte, qui révèle C13.
4. LT-07 (« demandez-vous qui était le cadet de Gervais ») → EX-01, porte C.

**Pièges.**
- « Enfant de Port-Sénane » : OF-03, PR-02, PR-04, RG-12, BD-07.
- Le trident (D10).
- Ange Oyard `O-d`, sur la même page de RG-13 (D4).
- `matelot` (PR-04, RG-13) et `armateur` (PR-03).
- « M. Garnaud » dans BD-02 : Victoire ne sait pas qui il est.

## 3. Fausses pistes et leur levée

| Fausse piste | Pièces qui la portent | Pièces qui la lèvent |
|---|---|---|
| Il y a eu une fièvre en 1908 | RP-01, RP-02, PR-03, LT-09, OF-03 | RP-03, RP-04, RP-05, LT-03, RG-04, LT-02, BD-02, EX-02 |
| Blaise Garnaud est un enfant de Port-Sénane | OF-03, PR-02, PR-04, RG-12, RG-14, BD-07 | RG-13, RG-01 (même date), PH-15, CN-03, LT-01, LT-07, EX-01 |
| La marque du Comptoir est un trident | BD-07, OB-04, PB-01 | R1 (Fourche), R7 (gravure) ; CN-03 (« pas une marque d'île ») |
| Noël est le fils de Siméon | son nom ; RG-24 (il vend pour la maison Cormaud) | OF-05 (barre), RG-02, RG-10, BD-03, CN-01 (`A-g`, `A-d`) |
| Une marque de talon est celle de la personne nommée à côté | RG-07 à RG-10 (pied de l'acte, sans légende) | R5 (le talon dit la maison de naissance) ; RG-01 (maisons des épouses) |
| La maison Cormaud est éteinte | RG-05 (« succession non déclarée »), OF-02 (au nom de Siméon) | RG-19 avec RG-03 ou BD-03 (S3) |
| Blaise a volé l'ambre en 1870 | RG-02 | BD-04, LT-01, DV-01 (S4) |
| Blaise n'a rien laissé aux maisons | LT-05 (« le Comptoir à mon fils »), PR-04 | LT-05 (même pièce : le coffre), RG-20, PV-06 |
| Benoît était gardien de phare | PV-03 (ce que dit la famille, niveau A) | RG-21, RG-16 (« gardien de feu »), RG-11, RP-04 |
| Blaise était matelot | PR-04 (niveau 0), RG-13 | RG-12, RG-14, AN-01, PR-02 ; premier métier, quitté |
| Blaise était armateur | PR-03 (niveau 0) | RG-12, RG-14, AN-01, PR-04 |
| La marque d'Ernestine est une croix | RG-09 (double) | RG-09 (original), RG-15, PH-10, CN-02, EX-01 |
| Une marque dite vaut une marque montrée | BD-01, BD-06, DV-02 | R7 ; les registres et les objets |
| Un relevé vaut une marque montrée | CN-01, CN-02, CN-03 | R7 (planche I, OF-05) ; les registres, les objets, les croix |
| Victoire savait qui était M. Garnaud | BD-02, LT-07 (le ton) | BD-04 (« je ne sais pas qui était le petit ») ; 04, C24 |
| « La possession de soixante-neuf ans » | OF-03 | RP-08, art. 3 : la concession porte sur l'ambre, non sur le fonds ; RG-05 (île interdite) |

## 4. Âges sur les photographies (pour le `cartographe`)

| Pièce | Date | Personnes et âges |
|---|---|---|
| PH-01 | juil. 1889 | Blaise 35, Amélie 31, Léandre 9 |
| PH-02 | juin 1897 | Sidonie 33, Gatien 15, Clément 14, Lazare 11, Victoire 4 |
| PH-17 | v. 1900 | Amélie 42 |
| CP-01 | v. 1905 (écrite en 1906) | Gatien 24, Noël ~45 |
| PH-03 | 2 avr. 1908 | Sidonie 43, Benoît 47, Jacquette 56, Gatien 26, Clément 25, Lazare 22, Victoire 15 |
| PH-06 | 14 oct. 1911 | Gatien 30, Léontine 22, Reine 58 |
| PH-04 | 1912 | Léandre 32, Gatien 31, Victoire 19 |
| PH-05 | 26 avr. 1913 | Lazare 27, Victoire 20, Noël ~52, Honorine 48, Jacquette 61, Gatien 31, Léontine 24, Félix 1, Clément 30 |
| PH-12 | 1930 | Sidonie 66, Berthe-Marie ~30 |
| PH-16 | v. 1935 | Rose 25 |
| PH-07 | 1950 | Edmée 29 ; portrait peint de Léandre à 68 |
| PH-11 | 1961 | Aline 36 |
| OF-08 | 22 août 1964 | Victoire 71 |
| PH-09 | 29 août 1964 | Victoire 71, Félix 52 ; croix de Clovis lisible, les autres non |
| PH-10 | 5 sept. 1964 | Marin 44, Rose 54 ; avirons, fuseau, tampon, navette d'Ursule |
| PH-18 | 1976 | Aline 51, Fontanet ~45 |
| PH-13, PH-14 | 15 oct. 1977 | Edmée 56 ; Marin 57, Félix 65 |

## 5. Preuves des secrets (conditions arrêtées)

| Secret | Pièces clés | Appui | Condition |
|---|---|---|---|
| S1 La fièvre de papier | RP-01 + RP-03, RP-04, RP-05, LT-03 | RP-02, RP-07, LT-02, LT-09, EX-02, RG-04, BD-02 | RP-01 lu et deux des quatre |
| S2 Les quatre coffrets | PV-06, DV-01, OB-02 | LT-05, RG-20, LT-08, BD-07, PR-04 | PV-06 lu et un de DV-01, OB-02 |
| S3 Le testament de grève | RG-19 + RG-03, BD-03 | RG-02, RG-05, RG-10, PR-01, OF-05 | RG-19 lu et un de RG-03, BD-03 |
| S4 Le fils banni | BD-04 + LT-01, DV-01 | RG-02, RP-06, TG-01, BD-02, LT-07 | BD-04 lu et un de LT-01, DV-01 |

**Accès en amont.**
- PV-06 : RG-20 lu **et** les quatre représentants établis (C28, C29, C30, C31), ou au moins 28 cases.
- RG-19 : C19 établie, ou porte C.

**Indépendance.** S1 et S3 ne demandent aucune case cachée. S4 et S2 se nourrissent de la branche
Garnaud, mais pas l'un de l'autre : S4 peut se faire par LT-01, S2 sans BD-04.

**Réponses et fins** (`05-secrets-et-fins.md`).
- Q3 et « Rendre l'île » sont indépendants : avec Q3 = déshérence, la part Cormaud entre dans
  l'indivision.
- F3 exige « Indemniser » **et** la réponse juste à Q4 (le coffre).

## 6. Cohérence avec le monde et les affaires 1 et 2

- **Positions et distances** (le `cartographe` fait foi). Longuegrève est en 0,054 · 0,530 et les
  Cabanes d'Ambre en 0,110 · 0,566.
  - Longuegrève → Cabanes : près de 5 lieues par la passe (4,9 ; 2 h 30 de vedette en 1908).
  - Cabanes → Port-Sénane : 5,3 lieues à vol d'oiseau, six lieues par la route de la côte et le bac.
  - Longuegrève → Port-Sénane : 7 lieues par mer.
  Les pièces disent « près de cinq lieues » ou « un peu plus de cinq lieues » (`08-lieux.md` §1,
  `docs/monde/00-monde.md`).
- **Port-Sénane** (lieu de l'affaire 1) : Compagnie des Paquebots (1871), *L'Écho* (1870), quai du Môle
  et quai des Messageries, Phototypie de l'Orvelle, hôpital maritime. Tout est repris sans changement.
  La *Duchesse-d'Ambre* (1889) dessert « les îles du golfe » en 1902 (affaire 1, PR-02) ; PB-02 le
  précise.
- **Bains-de-Mérande** : ville d'eaux et lycée de jeunes filles (affaire 1). Sidonie y est née et s'y
  retire ; Ginette Sollier y vit (PV-03). Rien d'autre.
- **Studio Lumen** (Aubrelieu, 1869) photographie le stand de 1889 (cohérent avec l'affaire 1, PR-01) ;
  Edmée y passe en 1965 (LT-07).
- **Imprimerie Dumesnil-Corre** (affiches) : PB-01, comme dans l'affaire 1.
- **ORC, Rosine Ferrandot, le rapporteur titulaire, C. Sauge** : cadre inchangé ; aucune allusion aux
  affaires précédentes au-delà d'une ligne de la lettre de mission.
- **Lecteur LX-2** : clavier à lettres et chiffres ; il cherche les marques par leur cote LX
  (`docs/monde/00-monde.md` §10). La cote est née de la planche I de Marest (sept. 1964), puis a été
  portée au crayon lors du contrôle de 1977.
- **Bandes de 1964** : pièces de type `recording`, transcription seule, sans son.
- **Loi de 1973** : l'**art. 15** est nouveau (`docs/monde/00-monde.md` §2). Il ne contredit ni l'art.
  4 (affaire 1), ni l'art. 9 (fonds restreints), ni l'art. 12 (affaire 2). Aucune pièce de l'affaire 3
  n'est restreinte : rien ne date de la Régence.
- **Monnaie** : florins (1868–1924), Fn (1958–1977). Les prix nouveaux sont reportés au §5 du monde :
  *L'Écho* à 12 sous en 1924, comme le *Courrier* ; 0,45 Fn en 1977 ; catalogue de 1912 ; loyer du
  coffre.
- **Ostrien** : absent, le golfe d'Ambre est velmarchois. Le **parler insulaire** n'est que du
  velmarchois avec une dizaine de mots (`08-lieux.md` §3), pas une troisième langue.
- **Aucun train** : on voyage par la vedette, le paquebot et la route de la côte.

## 7. Points faibles et à vérifier

### Résolus en v0.2

- **Densité des registres.** RG-07 à RG-10 sont derrière la porte A (PV-03). Les parents y signent au
  pied de l'acte, sans légende : impossible de remplir `g-talons` sans lire les talons.
- **Codes et recherche.** La cote LX remplace les signes `·`, `+` et `/`, que `normalize()` effaçait.
  Les sept mots-clés de code sont tous `autolink: false`.
  - Visibles : `A-d`, `A-b`, `O-g-g`.
  - Cachés : `Y-d`, `O-g-tY`, `Y-g`, `O-g`.
- **Ursule (C06).** Elle a deux autographes, RG-10 et sa navette (PH-10), et trois appuis (CN-01, CN-02,
  BD-06).
- **Le type `recording`** est décidé, ainsi que l'inline `::mark[id]` près du nom.
- **Victoire (BD-02, LT-07).** Elle ne nomme jamais Blaise. Elle ne connaît que les mots de Josse, la
  scène du quai et un soupçon né du relevé de 1964. BD-02 ne révèle plus C13.
- **Distances** : mises à jour d'après le `cartographe` (§6).
- **CP-01** : sortie de la remise de PV-03, envoyée le 14 oct. (porte B). Plus de visage de Gatien au
  niveau A.
- **PH-09** : passe par PV-02 (porte B) ; seule la croix de Clovis y est lisible.

### Ouverts

1. **Avertissements de la règle 5** de `content:check` (un terme caché présent en sous-chaîne dans le
   texte normalisé d'une pièce).
   - La cote `O-g-g`, écrite en clair dans CN-02, contient « o g », le code caché de Médard : la pièce
     déclenchera un avertissement.
   - Il faut soit tolérer cet avertissement (CN-02 n'arrive qu'après BD-06 ; Médard est établi par
     d'autres voies), soit retirer `O-g-g` de CN-02 et rendre la marque d'Elzéar seulement par
     `::mark`.
   - Décision au `level-designer` et au `backend`.
2. **Succès « Lire la grève »** (`05-secrets-et-fins.md` §5). S'il exige de chercher un code, `O-g-g`
   est déjà écrit dans CN-02 : il faut le fonder sur un code **caché** (`Y-d` ou `O-g-tY`).
3. **`docs/game/AFFAIRE-3.md` §2.2–2.4** décrit encore la notation `i`, alors que son §9 confirme LX.
   C'est hors du périmètre du scénariste : à aligner par le `game-designer`.
4. **C22, C25, C26** n'ont que deux visages chacun, tous derrière la porte B (PH-03, PH-05, PH-06). La
   contre-épreuve « une pièce retirée » passe, mais elle est mince. Option : un troisième portrait
   (album de l'Amicale, PH-05 bis), à voir avec le `level-designer`.
5. **Table d'ids du `cartographe`** (`art/tools/portraits/ids-marques-de-longuegreve.json`) : elle doit
   être versionnée avec la bible. Si elle change, réimporter la colonne « id neutre » de
   `09-marques.md` §4–5.
6. **BD-05** est rendu par « Gervais Goémard » et « cimetière de Longuegrève ». Vérifier que la route
   « Gervais Goémard » n'ouvre pas CN-01 avant OF-05 et OF-06 : ils sont au départ, donc a priori sans
   risque.
7. **Routes à confirmer par le `level-designer`** :
   - BD-05 → CN-01 en déblocage direct ;
   - RP-06 → TG-01 par « télégramme » ;
   - CP-01, rendue par « Nos côtes ».
