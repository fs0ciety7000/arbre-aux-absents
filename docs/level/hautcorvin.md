# Level design — affaire `revenant-hautcorvin` (*Le Revenant de Hautcorvin*)

> Auteur : `level-designer` · v0.1 · 14 oct. 2026 · affaire 2.
> Fichiers tenus : `content/cases/revenant-hautcorvin/{case,family,tree,progression,hints,achievements}.json`,
> squelettes `documents/*.md` (98) et `endings/*.md` (4), à réécrire par le `scenariste`.
> Sources : bible `docs/scenario/hautcorvin/` (02, 05, 06, 07, 09), règles `docs/game/AFFAIRE-2.md`
> et `GAME_DESIGN.md` §7–§10, contrat `docs/ARCHITECTURE.md` §3 (case revendiquée, `altPortraits`).
> Preuve de solvabilité : §9 (solveur réel de `content-tools` sur les 98 squelettes).

## 1. Principes retenus

| Principe | Mise en œuvre |
|---|---|
| Plusieurs entrées ouvertes | 9 pièces de départ (OF-01 à OF-08, PV-01), 5 points d'entrée narratifs, 4 groupes ouverts dès le départ en plus du prologue. |
| Chaque case par ≥ 2 chemins | Contre-épreuve « une pièce retirée » (§9.3) : aucune des 89 pièces hors départ n'est nécessaire à une case. ≥ 2 pièces de visage pour chaque case, ≥ 2 pièces pour chaque métier. |
| Aucune case par une pièce isolée | Seule C06 (Honoré) est pré-remplie (tutoriel, comme Adélaïde). La case revendiquée C15 part **vide** pour le solveur : la déclaration ne prouve rien. |
| Difficulté qui monte par branche | Deux portes douces (B, C, §5) : 0 → A → B → C, trois niveaux de dépendance, plafond de GAME_DESIGN §8.2. Pièges croissants : noms d'usage → nom de religion et homonymes de métier → demi-frères ressemblants. |
| Jamais d'impasse | Conditions monotones partout ; `not` seulement dans F4 (« sans S5 ») et deux succès. Chaque porte a ≥ 2 clés, dont un compteur. |
| Le doute dure | Le visage juste de Bastien n'existe qu'au niveau C (§4). Avant, on peut **retirer** le visage déclaré, pas **poser** le bon : aucun verrouillage ne confirme une devinette. |

## 2. Points d'entrée

| Pièce de départ | Ce qu'elle ouvre (mots-clés, lieux) | Branche amorcée |
|---|---|---|
| OF-01 lettre de mission | « Bastien Tessonnal », « Évariste Tessonnal », « Colombe Brossal », « Agnès Neviot », « Le Revenant de Hautcorvin », « tables des décès » ; lieux Vernezac, Kessaar | Verriers, revenant |
| OF-02 requête (✎) | « Eugénie Ravenel », « Jadela Rovin », « 0214 », « 1171 », « cellule 14 », « Studio Orlhac », « Dalvica » ; lieu Dalvezac ; **visage déclaré** (Andrin à 63 ans) et métier leurre `chef-de-nuit` | Prologue, revenant |
| OF-03 opposition | « Colombe Tessonnal », « Aimé Brossal », « Hugues Brossal », « Isaure Escande » | Prologue, Brossal |
| OF-04 testament | « Honoré Tessonnal » ; métier `notaire` (Julien Escande) | Brossal ; existence de la case « ? » |
| OF-05 portrait d'Honoré | visage d'Honoré (ancre du prologue) | Tutoriel (C06) |
| OF-06 requête d'Agnès | « refuge de l'Ourse », « hospice de Hautcorvin », « A. Dalvarin » ; lieu le Pas de l'Ourse ; métiers `infirmiere`, `gardien-de-refuge`, `souffleur` | Ourse, combe, revenant |
| OF-07 note de C. Sauge | « Dalvica / Dalvezac », « Brénica / Brenzac » ; lieux Dalvezac, Brenzac | Baptême (porte B) |
| OF-08 billet anonyme | « poste de Vernezac », « télégramme » → TG-02 | Vernezac (Brigitte) |
| PV-01 première audition | « Andrin Dalvarin », « Danela », « Léonce Tessonnal », « la Thalbère », « gardienne de l'Ourse », « Pas de l'Ourse », « expulsion », « Combe-aux-Sables » | Baptême, ourse, revenant |

Lieux visibles d'emblée : **Aubrelieu** (presse 1889, Bulletins d'Ordre) et **Hautcorvin** (registres,
annuaires, presse). Vernezac, le Pas de l'Ourse, Dalvezac, Brenzac, Kessaar (vide : fonds restreints),
col de Corvenne, Tennok, Vellaak et Port-Sénane apparaissent quand une pièce lue les nomme.

## 3. Arbre et groupes (`tree.json`)

28 cases, générations 1 à 4, colonnes 0 à 11 (Tessonnal à gauche, Dalvarin au centre, Neviot à
droite). Pré-remplie : **C06** Honoré. Revendiquée : **C15** Bastien (`claim`). « ? » : **C17** Andrin
(visible). Cachées, révélées par la lecture d'une pièce :

| Case | `revealedBy` |
|---|---|
| C03 Dranko | RG-05 ou PH-05 |
| C18 Victorin | RG-10, PH-11 ou RP-04 |
| C26 Pierre | RG-10 ou PH-11 |
| C22 Sabine | RG-07 ou PH-15 |
| C28 Brigitte | RG-09 ou TG-02 |

| Groupe | Cases | Niveau | Ce qui le rend difficile |
|---|---|---|---|
| `g-prologue` | C07 Eugénie, C13 Colombe, C14 Aimé | 0 | Tutoriel : PH-06 (mariage de 1928, Honoré connu sert d'ancre), noms d'usage (Brossal, Tessonnal). 10–15 min. |
| `g-verriers` | C01 Évariste, C02 Clotilde, C10 Léonce | A | Visages sur PH-01 (1889) et PH-04 (1915) ; Léonce aussi sur CP-01 (porte B). |
| `g-combe` | C04 Barthélemy, C05 Annette, C11 Jules, C12 Philomène | A | Légendes à initiales (« B. Neviot », piège avec Brigitte), noms d'épouse. |
| `g-brossal` | C21 Hugues, **C22** Sabine, C23 Isaure, C24 Julien | A | Leurre Léon Escande (PH-14) ; une case cachée. |
| `g-bapteme` | **C03** Dranko, C08 Danela, C09 Marguerite | B | Nom de religion (sœur Agathe refusé), visages thalbères derrière la porte B. |
| `g-vernezac` | C19 Rémi, C20 Odette, C27 Gilles, **C28** Brigitte | B | Trois guides Neviot (insignes 7, 19, 31), nom d'usage d'Odette, une case cachée. |
| `g-ourse` | C16 Lucie, **C18** Victorin, **C26** Pierre | B | Deux cases cachées ; leurre Fauvel (même uniforme que Victorin). |
| `g-revenant` | **C15** Bastien (revendiquée), **C17** « ? », C25 Agnès | C | Trio 3 / 3 (AFFAIRE-2 §1.5) ; demi-frères ressemblants ; trois âges du requérant. |

Partition : 3 + 3 + 4 + 4 + 3 + 4 + 3 + 3 = 27 cases (C06 exclue), seuil 3 partout.

## 4. La case revendiquée et le trio

**Déclaration** (OF-02) : `Bastien` · `Tessonnal` · visage `hc-portrait-727348` (Andrin à 63 ans) ·
`chef-de-nuit`. Fausse sur deux champs (visage, métier), conforme à la décision v0.2 de la bible.
Le nom déclaré est lu dans une pièce de départ (OF-02, OF-01) : aucun avertissement de `content:check`.

**Ce que le joueur peut faire, et quand.**

| Niveau | Pièces | Effet sur le trio |
|---|---|---|
| Départ / A | OF-03 (« les yeux de notre mère »), RP-04 (1938 : yeux gris, main droite), EX-01 (main droite intacte, main gauche brûlée), RG-11 / RP-01 / OF-06 (`souffleur`) | Retirer le visage et le métier déclarés. Rien ne se verrouille. |
| A | RG-15 (réinscription de 1953 : le requérant à 40 ans, « Andrin Dalvarin ») | Le visage déclaré a un nom… compatible avec la version du requérant (« j'ai pris son nom »). |
| B | PR-05 (1941, « A. Dalvarin » flou au fond), PH-13 (Dalvica 1955), CT-02 (Brénica 1974) | Andrin avant 1944, mais flou ; le doute reste. |
| C | **PR-03** (grève 1936), **PH-07** (four n° 2, 1937), **PH-18** (Saint-Éloi 1935), PH-09 (R) | Premier visage de Bastien ; les demi-frères côte à côte, nommés, avant 1944. Le trio peut se verrouiller. |

**Pourquoi le visage déclaré ne permet pas de deviner « ? » par élimination.**

1. **Trio 3 / 3** : poser le visage déclaré dans « ? » ne déclenche rien tant que C15 (visage de
   Bastien, `souffleur`) et C25 ne sont pas justes aussi. Le visage de Bastien n'est révélé par
   **aucune** pièce avant la porte C : une devinette sur « ? » reste sans confirmation jusque-là.
2. **Le visage déclaré n'est pas le seul visage de « ? »** : `altPortraits` (27 et 41 ans) sont acceptés.
   Le joueur peut établir C17 par le jeune homme au tablier de cuir de PH-07 / PH-18 (preuve positive)
   sans jamais « déplacer » le visage déclaré.
3. **Deux hypothèses tiennent jusqu'au niveau C** : « le requérant est Andrin » et « le requérant est
   Bastien sous le nom d'Andrin » placent le même visage dans deux cases différentes ; toutes les pièces
   d'avant C (RG-15, PH-13, CT-02, PR-10, TG-02) sont compatibles avec les deux. Seules les pièces
   antérieures au 9 mars 1944 qui montrent **les deux hommes** tranchent.
4. **Leurres de visage d'homme mûr** révélés avant le trio : Léon Escande (PH-14, A), l'abbé Pradeil
   (PH-02, A), Fauvel (PH-11, B) ; Mallet et Lavergne arrivent avec PH-07.
5. Aucune autre case ne partage le visage déclaré : les verrouillages d'autres groupes n'apprennent
   rien sur le trio (R7).

**Dosage des trois âges du requérant** (`hc-portrait-727348` = 63 ans, canonique ;
`hc-portrait-afb200` = 41 ans ; `hc-portrait-b193e0` = 27 ans) :

| Âge | Pièces qui le révèlent | Niveau |
|---|---|---|
| 63 | OF-02 (déclaration), PR-10, PH-17 (négatifs, après C22), CT-02 (61 ans) | départ, A, A/C, B |
| 41 | RG-15 (1953), PH-13 (1955) | A, B |
| 27 | PR-05 (1941, flou), PH-07, PH-18, PH-10 (R) | B, C, C, C |

Le pont 63 → 41 arrive tôt (il conforte la version du requérant) ; le pont 41 → 27, tard (il la ruine).
Bastien n'a qu'un âge (27 ans, PR-03 / PH-07 / PH-18 / PH-09), voulu par la bible.

## 5. Portes douces

Diégèse : les fonds de la haute vallée sont versés au Lecteur par lots ; l'archiviste ne monte les
cartons suivants qu'après un tampon de la Commission (comme l'affaire 1).

| Porte | Condition | Pièces derrière la porte |
|---|---|---|
| **B** | `g-prologue` établi **ou** ≥ 6 cases établies (C06 comprise) | Fonds des Verreries et fonds Honoré : PH-03, PH-05, PH-13, PR-02, RG-17, RG-18, RP-02, CT-01, CT-02, LT-01, LT-03, LT-07, LT-09, LT-11, DV-01, CP-01, PR-05, PR-06, PR-08, PH-11, PH-12, PB-01, TG-01 ; Kessaar (R) : RG-13, RG-14, RP-06, PV-05 ; PV-03 (sans PV-02) |
| **C** | `g-bapteme`, `g-vernezac` **ou** `g-ourse` établi, **ou** ≥ 16 cases | PR-03, PH-07, PH-16, PH-09 (R), PH-10 (R), RP-05 (R), OB-01, LT-08, LT-10 (par Mallet), PV-06 (par le Lecteur), PH-18 (avec C22 ou PH-17) |

Le compteur 16 n'est pas atteignable avec le seul niveau A (C06 + 3 + 3 + 4 + 4 = 15) : la porte C
exige toujours un progrès de niveau B, mais **n'importe lequel** des trois groupes B.

**PH-18 (question ouverte n° 3, tranchée)** : PH-18 se débloque au niveau C seulement, et une fois
Sabine Orlhac identifiée (C22 établie) ou ses négatifs de 1976 (PH-17) lus ; routes : recherche
« Saint-Éloi » (RG-04, RG-17) ou lecture de PH-17 + RG-17. Elle reste une preuve indépendante de PH-07
(autre fonds, autre mot-clé), mais arrive avec elle : le doute dure.

## 6. Déblocages

### 6.1 Mots-clés (102)

- **Noms complets** « Prénom Nom » (et formes de registre « Tessonnal Bastien », « Dalvarin Andrin »,
  « Neviot Lucie ») : actes, presse, photographies légendées.
- **Noms d'usage séparés** (« Colombe Brossal » / « Colombe Tessonnal », « Isaure Escande », « Sabine
  Brossal », « Annette Neviot », « Odette Neviot ») : le carnet ne révèle pas l'équivalence.
- **Prénoms seuls** (« Bastien », « Andrin », « Léonce », « Eugénie », « Colombe », « Agnès », « Lucie »,
  « Danela ») : photographies et lettres légendées au prénom.
- **Lieux, organisations, objets, événements** : « halle des fours », « four n° 2 », « grève »,
  « Saint-Éloi », « Coupe du Régent », « boîte de Lucie », « carnet des moutons », « L'Égide »…
- **Matricules** : « 0214 » / « 214 », « 1171 » (succès `hc-matricule`), « cellule 14 » → PV-05.
- **Pièges** : « B. Neviot » rend Barthélemy (PH-02) **et** Brigitte (TG-02) ; « A. Dalvarin » rend la
  presse de 1941 et le catalogue de 1974 (deux âges du même homme).

### 6.2 Pièces restreintes (R)

Rendues sur le « Prénom Nom » exact seulement (mot-clé distinct des formes de registre), derrière
une porte : « Bastien Tessonnal » → RG-13, RP-06 (B), PH-09 (C) ; « Andrin Dalvarin » → RG-14 (B),
PH-10, RP-05 (C) ; « Aimé Brossal » → RP-05 (C). Aucune case n'en dépend (§9.3).

### 6.3 Déblocages directs (`unlocks`)

| Pièce | Condition | Rôle |
|---|---|---|
| PV-02 | prologue établi, ou OF-03 + RG-04 / RG-05 | Deuxième audition (questions du rapporteur). |
| PV-03, LT-04 | PV-02 (ou porte B + OF-03) ; LT-04 ← PV-03 | Colombe remet le billet de 1937. |
| EX-01 | RP-04, PV-02 ou PV-03 | Expertise médicale (main gauche). |
| PV-04, OB-02 | RG-08 ou PR-10 ; OB-02 ← PV-04 | Audition d'Agnès, le verre de 1959. |
| LT-11 | porte B + (PV-04 ou OF-06) | La lettre de Lucie à Agnès. |
| PV-05 | RG-13 ou RG-14 (et matricules au Lecteur) | Haask. |
| PV-06 | C18 établie, ou porte C + RP-04 | Victorin remet la boîte. |
| OB-03 | PV-06 (ou « boîte de Lucie » avec C18 + porte C) | La boîte. |
| PH-08, LT-05, LT-06, DV-02 | OB-03 **ou** PV-06 | Contenu de la boîte (deux entrées : S5 ne dépend pas d'une seule pièce). |
| EX-02 | LT-04 + (RG-15 ou TG-02) | Écritures (L. Daubry). |
| EX-03 | PH-09 + PH-10 + PH-17 | Oreilles (Ravaud). |
| EX-04 | OB-01 + (OB-02 ou CT-02) | Verres gravés (Orvane). |
| OB-01 | RP-05 (ou « Coupe du Régent », porte C) | La Coupe. |
| PV-07 | `g-revenant` établi, ou EX-02 + EX-03 + OB-03 | La confrontation : **récompense**, jamais la clé du trio. |
| PH-17 | C22 établie (ou « Studio Orlhac » / « Sabine Brossal », porte C) | Négatifs de 1976. |
| PH-18 | porte C + PH-17 + RG-17 | Voir §5. |
| TG-01 | PV-05 ou LT-08 | Télégramme de 1952. |
| EP-01 | arbre complet + 5 secrets + toutes les pièces non optionnelles débloquées | Épilogue (même règle que l'affaire 1). EP-02 (optionnelle) suit EP-01. |

### 6.4 Lieux

| Lieu | Révélé par | Pièces (porte) |
|---|---|---|
| `aubrelieu` | — | PR-01, PH-01, RG-11, RG-12 |
| `hautcorvin` | — | RG-01–04, RG-07, RG-16, PR-04, PR-09, AN-01, AN-02 ; CT-01 (B) |
| `vernezac` | OF-01, PV-01 | RG-05, RG-06, RG-08–10, RG-15, CP-02, RP-01 ; PH-11, PH-12, PB-01, RG-17 (B) ; PH-16 (C) |
| `pas-de-l-ourse` | PV-01, OF-06 | PH-02, RP-03, RP-04 |
| `dalvezac` | OF-02, OF-07 | PH-05, PH-13 (B) ; LT-08 (C) |
| `brenzac` | OF-07, PR-07 | PR-07 ; PR-06, CT-02 (B) |
| `kessaar` | OF-01 | — (fonds restreints : Lecteur seulement) |
| `col-de-corvenne` | LT-02, RG-16, PR-02 | LT-02 ; PR-02 (B) |
| `tennok` | PH-01, PR-01, CT-01 | CP-01 (B) |
| `vellaak` | PV-05, RG-13 | PV-05 (B) |
| `port-senane` | TG-01, PV-05 | TG-01 (B) |

Aucune pièce n'est accessible seulement par la carte. La Combe-aux-Sables reste un toponyme (mot-clé,
pas de `PlaceId`).

### 6.5 Métiers

24 justes + 3 leurres (`chef-de-nuit`, `passeur`, `verrier`). Chaque métier entre dans le sélecteur
dès qu'une pièce qui l'établit est lue (`occupationsUnlock` = colonne M de 07 §1, doublée par les
`reveals.occupations`). `chef-de-nuit` est en plus disponible d'emblée par la déclaration.

## 7. Secrets, rapport, fins

| Secret | Condition (`discoveredBy`) | Niveau |
|---|---|---|
| `s1-le-feu-de-1937` | RG-18 + RP-02 + LT-10 | B |
| `s3-le-fils-de-la-thalbere` | CP-01 + LT-01 + DV-01 | B |
| `s2-le-pas-de-l-ourse` | DV-02 + PR-06 + PV-06 | C |
| `s4-la-coupe-du-regent` | OB-01 + EX-04 (RP-05 en appui, non requis : accès sans R) | C |
| `s5-la-fille-du-souffleur` | **deux** de LT-05, LT-06, LT-11 | C |

**S5 (question ouverte n° 1, tranchée)** : « deux pièces sur trois », comme la règle des deux pièces
de la loi de 1973, et parce que LT-11 (Agnès, porte B) et LT-05 / LT-06 (boîte, porte C) viennent de
deux sources distinctes : le joueur doit avoir ouvert la boîte **et** croisé avec une autre lettre.
Le tampon « Rétablir chacun » dépend de S5 (`availableWhen`), grisé sinon (affichage : UI).

**Rapport** : `q1-incendie` (bastien ← RG-11 / RP-01 ; aime ← S1), `q2-passeurs` (andrin ← RP-03 ;
lucie-et-jules ← S2), `q3-pere-d-andrin` (leonce ← RG-05 / PV-01 ; honore ← S3),
`q4-radiation-d-andrin` (outrage ← RG-12 ; gravure ← S4), toujours « Non établi » ; puis `decision`
(`denoncer`, `retablir-chacun` ← S5, `laisser-vivre`).

| Fin | `priority` | `when` (arbre complet compris) | Sections |
|---|---|---|---|
| `f1-chacun-son-nom` | 4 | décision `retablir-chacun` | `[s1]`–`[s4]` (réponse juste), `[conclusion]` |
| `f2-le-revenant` | 3 | décision `laisser-vivre` | idem + `[s1-non-prouve]` (Q1 ≠ Aimé) |
| `f3-l-imposteur-la-fille-reconnue` | 2 | `denoncer` + S5 | idem F1 |
| `f4-l-imposteur` | 1 | `denoncer` + **non** S5 | idem F1 |

L'épilogue ne dépend pas de la décision (AFFAIRE-2 §3.4). Les **mentions marginales** (05 §3) n'ont
pas de champ dans le contrat : à porter par l'UI ou par une évolution du contrat (signalé).

## 8. Tableau des preuves par case

N = nom, V = visage, M = métier ; [B] / [C] = derrière une porte ; (R) restreinte. Les deux chemins
n'ont aucune pièce de visage en commun.

| Case | Chemin 1 | Chemin 2 | Risque |
|---|---|---|---|
| C01 Évariste | OF-01 → « Évariste Tessonnal » → RG-01 (M) ; Aubrelieu → PH-01 (V) | « Grande Exposition » → PR-01 (M) ; PH-04 (V) | faible |
| C02 Clotilde | RG-01, RG-02 (N, M) → PH-01 (V) | RG-04 → PH-04, PH-06 (V) ; PR-01 (M) | faible |
| C03 Dranko | RG-05 (N, M, révèle) → « Dranko » → PH-05 [B] (V) | « expulsion » → PR-02 [B] (V, M) | moyen (2 visages, tous deux [B]) |
| C04 Barthélemy | RG-06 (N, M) → « refuge de l'Ourse » → PH-02 (V) | CP-02 (N, V, M) ; RG-16 (M) | moyen (« B. Neviot » = Brigitte aussi) |
| C05 Annette | RG-05, RG-06 (N, M) → PH-02 (V) | CP-02 (V, M) ; AN-01 (M) | faible |
| C07 Eugénie | OF-02 → « Eugénie Ravenel » → RG-03 (N, M), PH-04 (V) | PH-06 (V) ; AN-01 (M) | faible |
| C08 Danela | RG-05 (N, M) → PH-03 [B], PH-05 [B] (V) | PR-02 [B], PH-13 [B] (V) ; RG-17, CT-01 (M) | moyen |
| C09 Marguerite | RG-05 (« en religion sœur Agathe ») → PH-04 (V) | PV-02 → RG-16 → PH-06 (V) ; DV-01 [B] | moyen (nom de religion) |
| C10 Léonce | RG-03 (M) → PH-04 (V) | LT-02 (M) → CP-01 [B] (V) | faible |
| C11 Jules | RG-06 → PH-02 (V, insigne 7) | CP-02 (V) ; AN-01, PR-06 [B] (M) | faible |
| C12 Philomène | RG-06 (N, M) → PH-02 (V) | AN-01 (M) → PH-11 [B] (V) | moyen |
| C13 Colombe | OF-03 → PH-06 (V) ; RG-07 (N) | PH-14, PH-15, PR-09 (V) ; AN-02 (M) | faible |
| C14 Aimé | OF-03 → « Aimé Brossal » → PH-06 (V), RG-07 (M) | PH-14 (V) ; RP-01, AN-01 (M) | faible |
| C15 Bastien | RP-04 / EX-01 (retrait) → « grève » → PR-03 [C] (V, M) | RG-17 → « Saint-Éloi » → PH-18 [C] ; « halle des fours » → PH-07 [C] ; PH-09 (R) | **élevé** (§4, voulu) |
| C17 Andrin | RG-15 (N, V 41, M) → PH-07 [C] (V 27, « A. Dal… ») | « A. Dalvarin » → PR-05 [B], CT-02 [B] ; PH-18 [C] ; PH-10 (R) | **élevé** (élimination, §4) |
| C25 Agnès | OF-06 (N, M) → PR-10 (V) | RG-08 → PV-04 (M) ; PH-16 [C] (V) | faible |
| C16 Lucie | OF-06 (N, M) → PH-11 [B] (V) | PB-01 [B] (V, M) ; PH-08 (boîte) | moyen |
| C18 Victorin | RG-10 (N, M, révèle) → PH-11 [B] (V) | RP-04 (M) ; PH-16 [C] (V) | moyen (leurre Fauvel) |
| C19 Rémi | RG-09 (N, M) → PH-11 [B] (V) | PR-08 [B] (V, M, insigne 19) | moyen |
| C20 Odette | RG-09 (N, M) → PH-12 [B] (V) | PH-11 [B] (V) | moyen (nom d'usage) |
| C21 Hugues | OF-03 (M) → PH-15 (V) | PH-14 (V) ; AN-02 (M) | faible |
| C22 Sabine | RG-07 (N, révèle) → PH-15 (V, M) | AN-02 (M) ; PH-16 [C] (reflet) | moyen (1 visage avant C) |
| C23 Isaure | RG-07 → PH-14 (V, M) | PR-10 (V, M) ; PH-15 (V) | faible |
| C24 Julien | OF-04 (M) → PH-14 (V) | AN-02 (M) ; PH-15 (V) | moyen (leurre Léon Escande) |
| C26 Pierre | RG-10 (N, révèle) → PR-10 (V, M) | AN-02 (M) ; PH-16 [C] (V) | faible |
| C27 Gilles | RG-09 → PR-08 [B] (V, insigne 31) | AN-02 (M) ; PH-16 [C] (V) | moyen (homonymie de métier) |
| C28 Brigitte | OF-08 → TG-02 (révèle, M) → PR-08 [B] (V) | RG-09, AN-02 ; PH-16 [C] (V) | moyen (1 visage avant C) |

## 9. Preuve de solvabilité

### 9.1 Solveur réel (`npm run content:check`, `npm run content:solve -- --report`)

Sur les 98 squelettes et les 36 portraits du cartographe :

- 98 / 98 pièces atteintes, 102 mots-clés cherchés, 11 lieux visités ;
- **28 / 28 cases** ; ordre : prologue → verriers, baptême → revenant → Brossal, combe, ourse, Vernezac ;
- **5 / 5 secrets** ; **4 / 4 fins** atteignables (F4 par une exploration qui évite S5), F1–F3 vraies
  à 100 % ; 243 combinaisons de réponses explorées ;
- un seul avertissement : pas de section `demo` (voulu : l'affaire 2 est hors démo).

### 9.2 Profondeur (solveur « en largeur », script hors dépôt)

Une couche = tout lire, tout visiter, tout chercher jusqu'au point fixe, puis verrouiller.

| Couche | Pièces | Cases | Groupes établis | Secrets |
|---|---|---|---|---|
| 1 | 77 | 15 | prologue, verriers, Brossal, combe | — |
| 2 | 89 | 25 | baptême, ourse, Vernezac | S1, S3 |
| 3 | 97 | 28 | **revenant** | S2, S4, S5 |
| 4 | 98 | 28 | (EP-01) | — |

C'est la courbe voulue : 0 / A, puis B, puis C ; le trio est la seule case de la couche 3.

### 9.3 Contre-épreuve « une pièce retirée »

Pour chacune des 89 pièces hors départ, on la retire du modèle et on relance le solveur.

- **Aucune pièce n'est nécessaire à une case** (28 cases établies dans les 89 cas).
- Pièces nécessaires à un secret : ses pièces clés seulement : CP-01, LT-01, DV-01 (S3) ; RG-18,
  RP-02, LT-10 (S1) ; DV-02, PR-06, PV-06 (S2) ; OB-01, EX-04 (S4) ; **aucune pour S5** (deux sur trois,
  boîte à double entrée).
- Mots-clés dont l'absence casse quelque chose : « Bastien Tessonnal » (RG-13, RP-06, PH-09, EX-03) et
  « Andrin Dalvarin » (RG-14, PH-10, EX-03), soit exactement les accès aux fonds restreints. Aucune
  case touchée.
- Pièces à une seule entrée (hors départ) : EX-01 à EX-04, LT-05, LT-06, LT-11, PV-02, PV-07 (toutes
  par une condition `any` à plusieurs branches), PH-09, PH-10, RG-13, RG-14, RP-06 (restreintes),
  EP-01, EP-02.

## 10. Durée estimée

| Phase | Joueur moyen |
|---|---|
| Prologue (C07, C13, C14) | 10–20 min |
| Niveau A (verriers, combe, Brossal) | 1 h 15 – 2 h |
| Niveau B (baptême, ourse, Vernezac ; S1, S3) | 1 h 30 – 2 h 15 |
| Niveau C (trio ; S2, S4, S5) | 1 h – 1 h 45 |
| Rapport, décision, épilogue | 20–30 min |
| **Total** | **4 h 15 – 6 h 45** (cible AFFAIRE-2 : 4 h 30 – 7 h) |

`timedTargetsMs` : 3 h, 4 h 30, 7 h. Succès chronométrés : 2 h 30 et 75 min (AFFAIRE-2 §4).

## 11. Décisions prises

1. **S5** = deux de LT-05, LT-06, LT-11 (§7). 2. **PH-18** au niveau C, après C22 ou PH-17 (§5).
3. **Portraits** : ids du cartographe `hc-portrait-xxxxxx` (`art/tools/portraits/ids-revenant-hautcorvin.json`) ;
   Andrin a deux `altPortraits` (27 et 41 ans). 4. Id de l'affaire : `revenant-hautcorvin` (la bible
   proposait `revenant-de-hautcorvin`). 5. Groupes : ceux de la bible (02 §5), sans changement.
6. Restreintes : mot-clé exact distinct des formes de registre (« Tessonnal Bastien » ne les rend pas).
7. PV-07 (aveu) est une récompense du trio, jamais une clé. 8. Succès `hc-la-haute-vallee` = les
   quatre lieux de la haute vallée (Hautcorvin, Vernezac, le Pas, Dalvezac), la Combe n'ayant pas de
   `PlaceId`. 9. Pas de section `demo`.

## 12. Points faibles et cases à risque

1. **C17 et l'élimination** : le solveur ne modélise pas l'élimination (il dispose du visage déclaré
   dès le départ). La protection est structurelle (§4) ; à mesurer en playtest : temps entre le
   retrait du visage déclaré et l'établissement du trio.
2. **C15 Bastien** : quatre pièces de visage, toutes au niveau C. C'est voulu, mais le trio est la
   dernière étape pour presque tous les joueurs ; ne pas durcir la porte C.
3. **C03 Dranko** : deux visages (PH-05, PR-02), tous deux derrière B.
4. **C22 Sabine** et **C28 Brigitte** : un seul visage avant la porte C (PH-15, PR-08).
5. **Solveur optimiste sur les noms** : « Tessonnal », « Neviot », « Brossal » sont lus partout ; les
   vrais pièges (noms d'usage, nom de religion, trois guides) ne se mesurent qu'en playtest.
6. **Exemples de la bible** : OF-02, PV-02, LT-06 sont repris tels quels (commentaires de production
   retirés, `illustration` retirée en attendant les fichiers) ; dans OF-02, la ligne « Signature du
   requérant : ::signature[…] » a dû être coupée (la signature doit occuper sa propre ligne).
7. **Mentions marginales** des fins : pas de champ dans le contrat.

## 13. Contraintes pour la rédaction des pièces

Les squelettes commencent tous par la ligne « BROUILLON — squelette de level design… » (sauf les
trois exemples). En réécrivant, le scénariste **garde dans chaque pièce les mots-clés ci-dessous**
(le graphe en dépend) ; en ajouter est sans risque tant que `content:check` ne signale pas de
chevauchement. Mentions ajoutées par rapport à 06-corpus (voir 06 « Contraintes du graphe ») :
OF-01 « Le Revenant de Hautcorvin », « tables des décès » ; PV-01 « gardienne de l'Ourse »,
« expulsion » ; PV-03 « pli cacheté », « registre des rondes », « Toussaint Mallet » ; PV-04 « boîte de
Lucie » ; RG-09 « école de Vernezac », « Odette Neviot » ; RG-16 « journal de sœur Agathe »,
« col de Corvenne », « Combe-aux-Sables » ; CP-02 « Barthélemy Neviot » ; PB-01 « avion postal »,
« fête de la neige » ; AN-02 « fête de la neige » ; PH-07 « Mme C. Brossal » dans la légende.

| Pièce | Mots-clés liés dans le squelette |
|---|---|
| OF-01 | bastien-tessonnal, kessaar, colombe-brossal, verreries, agnes-neviot, honore-tessonnal, evariste-tessonnal, la-sentinelle, revenant, tables-des-deces |
| OF-02 | bastien, honore-tessonnal, eugenie-ravenel, halle-des-fours, verreries, bulletin-d-ordre, incendie, kessaar, matricule-214, cellule-14, andrin-dalvarin, matricule-1171, dalvica, jadela-rovin, studio-orlhac, bastien-tessonnal, colombe-brossal, agnes-neviot |
| OF-03 | colombe-brossal, colombe-tessonnal, verreries, hugues-brossal, isaure-escande, aime-brossal |
| OF-04 | julien-escande, honore-tessonnal |
| OF-05 | honore-tessonnal, studio-orlhac, la-sentinelle |
| OF-06 | agnes-neviot, hospice-de-hautcorvin, lucie-neviot, refuge-de-l-ourse, bastien-tessonnal, kessaar, a-dalvarin, dalvica |
| OF-07 | douanes-de-la-veze, kessaar, dalvica, brenica |
| OF-08 | poste-de-vernezac, telegramme |
| PV-01 | bastien-tessonnal, greve, incendie, aime-brossal, lucie-neviot, gardienne-de-l-ourse, pas-de-l-ourse, kessaar, matricule-214, cellule-14, andrin, thalbere, danela, expulsion, leonce-tessonnal, matricule-1171, andrin-dalvarin, combe-aux-sables |
| PV-02 | bastien-tessonnal, halle-des-fours, dalvica, colombe-brossal, colo, four-n-2, douanes-de-la-veze, incendie, magasin-des-emballages, lucie-neviot, refuge-de-l-ourse, parrain, marraine, soeur-agathe, hospice-de-hautcorvin, coupe-du-regent, kessaar, andrin-dalvarin, a-dalvarin, agnes-neviot, honore-tessonnal, agnes |
| PV-03 | colombe-brossal, bastien-tessonnal, colo, eugenie-ravenel, thalbere, hugues-brossal, pli-cachete, toussaint-mallet, registre-des-rondes |
| PV-04 | agnes-neviot, hospice-de-hautcorvin, lucie-neviot, victorin-sarrade, boite-de-lucie, pierre-sarrade, refuge-de-l-ourse, verre-grave |
| PV-05 | teodor-haask, kessaar, matricule-214, bastien-tessonnal, matricule-1171, andrin-dalvarin, thalbere, cellule-14 |
| PV-06 | victorin-sarrade, douanes-de-la-veze, pas-de-l-ourse, achille-fauvel, lucie-neviot, thalbere, andrin-dalvarin, odette-neviot, boite-de-lucie |
| PV-07 | boite-de-lucie, andrin-dalvarin, agnes-neviot, leonce-tessonnal, bastien-tessonnal, danela-dalvarin |
| EX-01 |  |
| EX-02 | andrin-dalvarin, telegramme, bastien-tessonnal |
| EX-03 | sabine-brossal, studio-orlhac |
| EX-04 | coupe-du-regent, verre-grave, verrerie-de-brenica, danela-dalvarin, a-dalvarin |
| RP-01 | halle-des-fours, bastien-tessonnal, greve, aime-brossal, toussaint-mallet, incendie |
| RP-02 | magasin-des-emballages, aime-brossal |
| RP-03 | dalvarin-andrin, thalbere, refuge-de-l-ourse, lucie-neviot |
| RP-04 | pas-de-l-ourse, tessonnal-bastien, douanes-de-la-veze, achille-fauvel, victorin-sarrade |
| RP-05 | aime-brossal, verreries, andrin-dalvarin, coupe-du-regent |
| RP-06 | bastien-tessonnal, kessaar, matricule-214 |
| RG-01 | evariste-tessonnal, clotilde-mervaux, leonce |
| RG-02 | evariste-tessonnal, clotilde-mervaux |
| RG-03 | honore-tessonnal, eugenie-ravenel, leonce-tessonnal |
| RG-04 | colombe, colombe-tessonnal, bastien-tessonnal, parrain, evariste-tessonnal, marraine, clotilde-mervaux |
| RG-05 | andrin-dalvarin, danela-dalvarin, dalvica, dranko-dalvarin, annette-neviot, pradeil, parrain, leonce-tessonnal, marraine, marguerite-tessonnal, soeur-agathe |
| RG-06 | barthelemy-neviot, annette-combal, jules-neviot, remi-neviot, lucie-neviot, philomene-ardouin, auberge-des-guides |
| RG-07 | colombe-tessonnal, aime-brossal, hugues-brossal, isaure-brossal, sabine-orlhac, julien-escande |
| RG-08 | agnes-neviot, lucie-neviot, refuge-de-l-ourse, victorin-sarrade |
| RG-09 | remi-neviot, odette-lamberge, ecole-de-vernezac, odette-neviot, gilles-neviot, brigitte-neviot |
| RG-10 | lucie-neviot, victorin-sarrade, remi-neviot, achille-fauvel, pierre-sarrade |
| RG-11 | bulletin-d-ordre, tessonnal-bastien, incendie, verreries |
| RG-12 | bulletin-d-ordre, dalvarin-andrin, kessaar |
| RG-13 | matricule-214, bastien-tessonnal, cellule-14, matricule-1171, teodor-haask |
| RG-14 | matricule-1171, andrin-dalvarin, cellule-14, matricule-214 |
| RG-15 | andrin-dalvarin |
| RG-16 | leonce-tessonnal, barthelemy-neviot, combe-aux-sables, eugenie, jules-neviot, pas-de-l-ourse, marguerite-tessonnal, soeur-agathe, journal-de-soeur-agathe, lucie, honore-tessonnal, bastien |
| RG-17 | danela-dalvarin, tessonnal-bastien, saint-eloi, dalvarin-andrin, atelier-de-gravure |
| RG-18 | magasin-des-emballages |
| PH-01 | verreries, grande-exposition, lentille-de-tennok |
| PH-02 | refuge-de-l-ourse, pas-de-l-ourse, guides-de-vernezac, pradeil, b-neviot, jules-neviot |
| PH-03 | atelier-de-gravure, verreries, danela-dalvarin |
| PH-04 | eugenie, leonce, soeur-agathe, colombe, bastien |
| PH-05 | dalvica, dranko-dalvarin, danela, andrin |
| PH-06 | colombe-tessonnal, aime-brossal, studio-orlhac, soeur-agathe, eugenie |
| PH-07 | halle-des-fours, four-n-2, aime-brossal, danela-dalvarin, toussaint-mallet |
| PH-08 |  |
| PH-09 | bastien-tessonnal |
| PH-10 | andrin-dalvarin |
| PH-11 | lucie-neviot, victorin-sarrade, lucie, agnes, achille-fauvel |
| PH-12 | ecole-de-vernezac, odette-neviot, agnes-neviot, gilles-neviot, brigitte-neviot |
| PH-13 | dalvica, jadela-rovin, danela |
| PH-14 | isaure-brossal, julien-escande, studio-orlhac, leon-escande, la-sentinelle |
| PH-15 | hugues-brossal, sabine-orlhac, studio-orlhac |
| PH-16 | fete-de-la-neige, ecole-de-ski, pierre-sarrade, gilles-neviot, brigitte-neviot, agnes |
| PH-17 | studio-orlhac, sabine-brossal |
| PH-18 | four-n-2, saint-eloi, a-dalvarin |
| LT-01 | annette-neviot, leonce, parrain, danela, honore-tessonnal |
| LT-02 | parrain, leonce-tessonnal |
| LT-03 | atelier-de-gravure, bastien, danela, dalvica |
| LT-04 | colo |
| LT-05 | bastien-tessonnal, kessaar, agnes |
| LT-06 | matricule-214, andrin, agnes |
| LT-07 | remi-neviot, thalbere, lucie-neviot |
| LT-08 | danela-dalvarin, honore-tessonnal, dalvica |
| LT-09 | colombe-brossal, leon-escande, pli-cachete, l-egide, aime-brossal |
| LT-10 | toussaint-mallet |
| LT-11 | bastien-tessonnal, thalbere, agnes |
| PR-01 | verreries, grande-exposition, lentille-de-tennok, evariste-tessonnal |
| PR-02 | expulsion, dranko-dalvarin |
| PR-03 | bastien-tessonnal, aime-brossal |
| PR-04 | halle-des-fours, bastien-tessonnal, toussaint-mallet, aime-brossal, incendie |
| PR-05 | coupe-du-regent, verreries, colombe-brossal, aime-brossal, a-dalvarin |
| PR-06 | messager-de-brenzac, brenica, lucie-neviot, refuge-de-l-ourse, jules-neviot |
| PR-07 | danela-dalvarin, verreries, dalvica, andrin-dalvarin, messager-de-brenzac |
| PR-08 | remi-neviot, gilles-neviot, guides-de-vernezac, avion-postal, brigitte-neviot |
| PR-09 | honore-tessonnal, colombe-brossal, hugues-brossal, isaure-escande, bastien |
| PR-10 | isaure-brossal, bastien-tessonnal, agnes-neviot, pierre-sarrade, verreries |
| CP-01 | leonce-tessonnal |
| CP-02 | barthelemy-neviot, combe-aux-sables, jules-neviot, carnet-des-moutons |
| OB-01 | verreries |
| OB-02 | pas-de-l-ourse, verre-grave, brenica |
| OB-03 | carnet-des-moutons, victorin-sarrade, boite-de-lucie |
| CT-01 | danela-dalvarin, verre-grave, lentille-de-tennok |
| CT-02 | verrerie-de-brenica, a-dalvarin |
| AN-01 | verreries, aime-brossal, guides-de-vernezac, jules-neviot, auberge-des-guides |
| AN-02 | julien-escande, studio-orlhac, sabine-brossal, verreries, hugues-brossal, gilles-neviot, ecole-de-ski, fete-de-la-neige, brigitte-neviot |
| PB-01 | avion-postal, fete-de-la-neige, refuge-de-l-ourse |
| DV-01 | leonce, telegramme, marguerite-tessonnal |
| DV-02 | carnet-des-moutons, dalvica |
| TG-01 | telegramme, dalvica, brenica, bastien, kessaar, andrin, danela |
| TG-02 | telegramme, poste-de-vernezac, jadela-rovin, dalvica, andrin, b-neviot |
| EP-01 |  |
| EP-02 | agnes |
