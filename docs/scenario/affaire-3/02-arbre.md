# 02 — L'arbre : les quatre maisons de Longuegrève

> **32 cases sur 4 générations.** Chaque case = **un nom** (prénom + nom), **un champ d'identité**
> (**visage** ou **marque**, selon la case) et **un métier** dans une liste fermée. Identifiants
> (`person`, `occupation`) au format de `content/cases/<id>/family.json` (contrat :
> `packages/contract/src/family.ts`, `tree.ts`). Dates : `03-chronologie.md`. Marques et leur
> grammaire : `09-marques.md`. Preuves : `07-coherence.md`. Identifiant d'affaire proposé :
> `marques-de-longuegreve`.

## 1. Schéma

```
I   C01 Gervais GOÉMARD [Y] ══ C02 Perrine OYARD [Y+O]
    ├─ II C09 Josse GOÉMARD [Y-g] ══ C10 Reine LESTAUD [Y-g+P]
    │     └─ III C21 Gatien GOÉMARD (v) ══ C22 Léontine SAUVAT (v)
    │           └─ IV C28 Félix GOÉMARD (v)
    ├─ II C11 Jacquette GOÉMARD [O-g+Y] ══ C12 Médard OYARD [O-g]      (voir maison Oyard)
    └─ II C13 Blaise GOÉMARD dit GARNAUD [Y-d] ══ C14 Amélie FERLAY (v)              [CACHÉES]
          └─ III C27 Léandre GARNAUD (v)
                └─ IV C32 Edmée GARNAUD (v)

I   C03 Clovis OYARD [O] ══ C04 Toinette CORMAUD [O+A]
    ├─ II C12 Médard OYARD [O-g] ══ C11 Jacquette GOÉMARD
    │     ├─ III C23 Elzéar OYARD [O-g-g]
    │     │     └─ IV C29 Rose OYARD (v)
    │     └─ III C24 Victoire OYARD (v) ══ C25 Lazare CORMAUD (v)        [C24 ÉTABLIE]
    │           └─ IV C30 Marin CORMAUD (v)
    └─ II C15 Ernestine OYARD [P-g+O] ══ C16 Fulbert LESTAUD [P-g]    (voir maison Lestaud)

I   C05 Siméon CORMAUD [A] ══ C06 Ursule LESTAUD [A+P]
          (aucun enfant de sang vivant : Jean [A-g] et Yves [A-d], noyés en 1869, hors arbre)
    ┆
    ┆  C19 Noël CORMAUD [A/]  — enfant de mer, recueilli par Siméon ; sans parents dans l'arbre
          ══ C20 Honorine LESTAUD [A/+P]
             └─ III C25 Lazare CORMAUD (v) ══ C24 Victoire OYARD
                   └─ IV C30 Marin CORMAUD (v)

I   C07 Lubin LESTAUD [P] ══ C08 Apolline GOÉMARD [P+Y]
    ├─ II C16 Fulbert LESTAUD [P-g] ══ C15 Ernestine OYARD
    │     └─ III C26 Clément LESTAUD (v)
    │           └─ IV C31 Aline LESTAUD (v)
    ├─ II C10 Reine LESTAUD ══ C09 Josse GOÉMARD                     (voir maison Goémard)
    ├─ II C17 Benoît LESTAUD [P-d] ══ C18 Sidonie BRÉMOY (v)         (sans enfant)
    └─ II C20 Honorine LESTAUD ══ C19 Noël CORMAUD                     (voir maison Cormaud)
```

Légende : `══` mariage · `│` filiation de sang · `┆` lien d'accueil (affichage facultatif, §6) ·
`[code]` case à **marque** (notation Marest) · `(v)` case à **visage**.

**Règle de placement** : arbre **de sang** (loi de 1973, art. 15 : « reconstituer les filiations »).
**Noël Cormaud n'a pas de parents dans l'arbre** : il entre par son mariage avec Honorine Lestaud. Le
couple Siméon–Ursule reste **sans descendant visible** : c'est voulu, et c'est la question de S3.

**Pourquoi ces 32 personnes (diégèse)** : la requête des Domaines (OF-02) demande les ayants droit des
**quatre chefs de la matrice de 1868** ; la lettre de mission (OF-01) fixe le tableau aux chefs, à
leurs épouses, à leurs enfants **qui ont tenu ou fait souche**, et à **un représentant vivant par
branche** (les autres ayants droit sont listés en annexe par l'Amicale). Les épouses venues de la
Grand-Terre (Amélie, Sidonie, Léontine) entrent comme mères ou comme témoins de l'île.

**Endogamie** : toutes les épouses des générations I et II, sauf Sidonie et Amélie, viennent d'une
autre maison de l'île. Ce n'est pas un piège : c'est ce qui rend le **talon** (R5) utile.

## 2. Règle des noms

- **Canonique** = prénom usuel + **nom de naissance**. Noms d'épouse **acceptés** comme variantes :
  Perrine **Goémard**, Toinette **Oyard**, Ursule **Cormaud**, Apolline **Lestaud**, Reine **Goémard**,
  Jacquette **Oyard**, Ernestine **Lestaud**, Sidonie **Lestaud**, Honorine **Cormaud**, Amélie
  **Garnaud**, Léontine **Goémard**, Victoire **Cormaud**, Rose **Pellerin**.
- **Graphies des commis** (acceptées, ce sont des noms écrits au son) : *Gouémard*, *Guémard* ;
  *Hoyard*, *Oyart* ; *Cormault*, *Cormeau* ; *Lestot*, *Lestaut*.
- **Blaise** : canonique **Blaise Goémard** ; **Garnaud** est accepté comme **nom d'usage** (l'état
  civil de Port-Sénane le connaît sous ce nom depuis 1871, RG-13, RG-12, RG-14). Ses descendants
  sont **nés Garnaud** : Léandre, Edmée.
- **Refusés** (mènent à la bonne personne mais ne sont pas un nom) : *le garnaud* (ramasseur d'ambre,
  surnom de métier) ; *l'enfant de mer*, *Noël de l'Aurore* ; *la maîtresse* (Sidonie) ; *le vieux
  Josse* ; les **codes de marque** (`Y-d`…) ; les noms de maison employés seuls (« la maison Oyard »).
- **Noël Cormaud** : nom **juste** (il est inscrit sous ce nom en 1885, RG-10) bien qu'il ne soit pas
  du sang : le nom suit la maison qui l'a élevé.

## 3. Les 32 cases

Colonnes : **case** · `person` · génération · groupe proposé (§5) · nom canonique (variantes) ·
naissance–mort · **champ** (`M` marque / `V` visage) · **métier** (`occupation`) · état au départ.

| Case | `person` | G | Groupe | Nom (variantes) | Dates | Champ | Métier (`occupation`) | Départ |
|---|---|---|---|---|---|---|---|---|
| C01 | `gervais-goemard` | I | matrice | **Gervais Goémard** | 1819–1887 | M `Y` | Ramasseur·se d'ambre · `ramasseur-d-ambre` | visible |
| C02 | `perrine-oyard` | I | talons | **Perrine Oyard** (Goémard) | 1823–1891 | M `Y+O` | Fileuse · `fileuse` | visible |
| C03 | `clovis-oyard` | I | matrice | **Clovis Oyard** | 1821–1880 | M `O` | Pilote du golfe · `pilote` | visible |
| C04 | `toinette-cormaud` | I | talons | **Toinette Cormaud** (Oyard) | 1826–1899 | M `O+A` | Sage-femme · `sage-femme` | visible |
| C05 | `simeon-cormaud` | I | matrice | **Siméon Cormaud** | 1817–1890 | M `A` | Charpentier de marine · `charpentier-de-marine` | visible |
| C06 | `ursule-lestaud` | I | talons | **Ursule Lestaud** (Cormaud) | 1820–1888 | M `A+P` | Ramendeuse · `ramendeuse` | visible |
| C07 | `lubin-lestaud` | I | matrice | **Lubin Lestaud** | 1824–1893 | M `P` | Goémonier · `goemonier` | visible |
| C08 | `apolline-goemard` | I | talons | **Apolline Goémard** (Lestaud) | 1828–1902 | M `P+Y` | Boulangère (four commun) · `boulangere` | visible |
| C09 | `josse-goemard` | II | goémard | **Josse Goémard** | 1848–1909 | M `Y-g` | Ramasseur·se d'ambre · `ramasseur-d-ambre` | visible |
| C10 | `reine-lestaud` | II | goémard | **Reine Lestaud** (Goémard) | 1853–1920 | M `Y-g+P` (fille : `P·`) | Fileuse · `fileuse` | visible |
| C11 | `jacquette-goemard` | II | oyard | **Jacquette Goémard** (Oyard) | 1852–1919 | M `O-g+Y` (fille : `Y·`) | Sage-femme · `sage-femme` | visible |
| C12 | `medard-oyard` | II | oyard | **Médard Oyard** | 1850–1908 | M `O-g` | Batelier · `batelier` | visible |
| C13 | `blaise-goemard` | II | garnaud | **Blaise Goémard** (Garnaud) | 1854–1924 | M `Y-d` | Négociant en ambre · `negociant-en-ambre` | **cachée** |
| C14 | `amelie-ferlay` | II | garnaud | **Amélie Ferlay** (Garnaud) | 1858–1930 | V | Libraire · `libraire` | **cachée** |
| C15 | `ernestine-oyard` | II | lestaud | **Ernestine Oyard** (Lestaud) | 1857–1921 | M `P-g+O` (fille : `O·`) | Boulangère (four commun) · `boulangere` | visible |
| C16 | `fulbert-lestaud` | II | lestaud | **Fulbert Lestaud** | 1851–1916 | M `P-g` | Goémonier · `goemonier` | visible |
| C17 | `benoit-lestaud` | II | école | **Benoît Lestaud** | 1860–1928 | M `P-d` | Gardien de feu · `gardien-de-feu` | visible |
| C18 | `sidonie-bremoy` | II | école | **Sidonie Brémoy** (Lestaud) | 1864–1950 | V | Institutrice · `institutrice` | visible |
| C19 | `noel-cormaud` | II | mer | **Noël Cormaud** | v. 1860–1931 | M `A/` | Charpentier de marine · `charpentier-de-marine` | visible |
| C20 | `honorine-lestaud` | II | école | **Honorine Lestaud** (Cormaud) | 1864–1940 | M `A/+P` (fille : `P··`) | Ramendeuse · `ramendeuse` | visible |
| C21 | `gatien-goemard` | III | goémard | **Gatien Goémard** | 1881–1944 | V | Tailleur d'ambre · `tailleur-d-ambre` | visible |
| C22 | `leontine-sauvat` | III | goémard | **Léontine Sauvat** (Goémard) | 1889–1968 | V | Couturière · `couturiere` | visible |
| C23 | `elzear-oyard` | III | oyard | **Elzéar Oyard** | 1878–1951 | M `O-g-g` | Batelier · `batelier` | visible |
| C24 | `victoire-oyard` | III | — | **Victoire Oyard** (Cormaud) | 1893–1970 | V | Trieuse d'ambre · `trieuse-d-ambre` | **établie** (`prefilled`) |
| C25 | `lazare-cormaud` | III | mer | **Lazare Cormaud** | 1886–1957 | V | Pêcheur · `pecheur` | visible |
| C26 | `clement-lestaud` | III | lestaud | **Clément Lestaud** | 1883–1950 | V | Marin (Compagnie des Paquebots) · `marin` | visible |
| C27 | `leandre-garnaud` | III | garnaud | **Léandre Garnaud** | 1880–1949 | V | Directeur·rice du Comptoir des Ambres · `directeur-comptoir` | **cachée** |
| C28 | `felix-goemard` | IV | goémard | **Félix Goémard** | 1912– | V | Patron pêcheur · `patron-pecheur` | visible |
| C29 | `rose-oyard` | IV | oyard | **Rose Oyard** (Pellerin) | 1910– | V | Marchande de poisson · `marchande-de-poisson` | visible |
| C30 | `marin-cormaud` | IV | mer | **Marin Cormaud** | 1920– | V | Contremaître (atelier des Cabanes) · `contremaitre` | visible |
| C31 | `aline-lestaud` | IV | lestaud | **Aline Lestaud** | 1925– | V | Ornithologue · `ornithologue` | visible |
| C32 | `edmee-garnaud` | IV | garnaud | **Edmée Garnaud** | 1921– | V | Directeur·rice du Comptoir des Ambres · `directeur-comptoir` | **cachée** |

Comptage : G I = 8 · G II = 12 · G III = 7 · G IV = 5 → **32**. Champs : **19 marques** (G I, G II
sauf Amélie et Sidonie, et Elzéar) et **13 visages**. Par maison : Goémard 11 (C01, C02, C09, C10, C13, C14, C21, C22, C27, C28, C32), Oyard 7 (C03, C04,
C11, C12, C23, C24, C29), Cormaud 6 (C05, C06, C19, C20, C25, C30), Lestaud 8 (C07, C08, C15, C16, C17,
C18, C26, C31) ; les épouses comptent dans la maison de leur mari, sauf Victoire (établie), comptée
dans sa maison natale.

**Pourquoi le champ change** : la lettre de mission (OF-01) pose la règle diégétique : « pour les
insulaires qui n'ont jamais signé, le tableau retient **la marque** au lieu du portrait » (loi de
1973, art. 15). L'interface affiche le libellé du champ sur chaque case (« Visage » ou « Marque ») :
le joueur n'a pas à deviner lequel. Elzéar (né en 1878) n'est allé que trois jours à l'école (RG-22) :
il a toujours marqué. Des visages de personnes « à marque » existent sur les photos (Blaise en 1889,
Benoît en 1908, Noël, Honorine et Jacquette en 1913, Reine en 1911) : ils ne vont dans aucune case.

### Liste fermée des métiers (`occupations`)

**23 métiers justes** (sept partagés, sans ambiguïté de personne) + **3 leurres** documentés.

| `id` | Libellé | Cases |
|---|---|---|
| `ramasseur-d-ambre` | Ramasseur·se d'ambre | C01, C09 |
| `fileuse` | Fileuse | C02, C10 |
| `pilote` | Pilote du golfe | C03 |
| `sage-femme` | Sage-femme | C04, C11 |
| `charpentier-de-marine` | Charpentier de marine | C05, C19 |
| `ramendeuse` | Ramendeuse (filets) | C06, C20 |
| `goemonier` | Goémonier | C07, C16 |
| `boulangere` | Boulangère (four commun) | C08, C15 |
| `batelier` | Batelier | C12, C23 |
| `negociant-en-ambre` | Négociant en ambre | C13 |
| `libraire` | Libraire | C14 |
| `gardien-de-feu` | Gardien de feu | C17 |
| `institutrice` | Institutrice | C18 |
| `tailleur-d-ambre` | Tailleur d'ambre | C21 |
| `couturiere` | Couturière | C22 |
| `trieuse-d-ambre` | Trieuse d'ambre | C24 |
| `pecheur` | Pêcheur | C25 |
| `marin` | Marin | C26 |
| `directeur-comptoir` | Directeur·rice du Comptoir des Ambres | C27, C32 |
| `patron-pecheur` | Patron pêcheur | C28 |
| `marchande-de-poisson` | Marchande de poisson | C29 |
| `contremaitre` | Contremaître | C30 |
| `ornithologue` | Ornithologue | C31 |

Les métiers partagés suivent la coutume de l'île : le métier passe de mère à belle-fille (le four
commun : Apolline puis Ernestine ; la sage-femme : Toinette puis Jacquette) ou de père en fils.

| Leurre | Piège |
|---|---|
| `matelot` *(« Matelot »)* | Ce que Blaise a été de 1871 à 1877 (RG-13). Le métier est celui pour lequel on est connu **dans au moins deux pièces** : négociant en ambre (RG-12, AN-01, RG-14, PR-04). |
| `armateur` *(« Armateur »)* | Ce que *L'Écho* dit de Blaise en 1908 (PR-03), parce qu'il possède une vedette ; aucun acte ne le dit. |
| `gardien-de-phare` *(« Gardien de phare »)* | Benoît travaillait pour Phares et Balises, mais au **feu** de Longuegrève : « gardien auxiliaire de feu » (RG-11, RG-21, RP-04). Un feu n'est pas un phare (le Lecteur affiche la définition du *Bulletin des Phares*, RG-21). |

Rappel de la règle de l'affaire 1 : le métier est **l'activité pour laquelle la personne est connue
dans au moins deux pièces**. Léandre et Edmée sont « directeur·rice » ; Blaise, fondateur, est
« négociant » partout où il est désigné par un métier.

## 4. État au départ (dossier 77-0874)

- **Établie** (`prefilled`, hors groupe) : **C24 Victoire Oyard** — la « dernière voix de
  Longuegrève », enregistrée en 1964 (portrait OF-08, nom et métier par OF-01 et OF-08). Sert de point
  d'appui, comme Honoré dans l'affaire 2.
- **Cases cachées** (proposition de `revealedBy`, à arbitrer par le `level-designer`) :
  - **C13 Blaise** : lecture de **RG-01** (baptême de 1854) **ou** de **BD-02** (« un petit Blaise,
    parti en 70 ») **ou** de **RG-02** (1870).
  - **C14 Amélie**, **C27 Léandre**, **C32 Edmée** : lecture de **RG-13** (« Blaise, dit Garnaud ») **ou**
    de **PH-15** (la tombe de Blaise Garnaud porte `Y-d`) **ou** d'**EX-01**. Le joueur sait déjà
    qu'Edmée existe (OF-03) : sa case n'apparaît que lorsque la branche est rattachée à l'île.
- **Pas de case revendiquée** (mécanique de l'affaire 2) : le doute porte ici sur des **marques**.
- Forme visible au départ : **28 cases** (1 établie, 27 vides) ; 4 cachées. Les noms des quatre chefs
  (C01, C03, C05, C07) et leurs marques sont dans une pièce de départ (OF-02) : premier groupe en
  dix minutes, qui enseigne la marque comme champ.

## 5. Groupes de validation (proposition au `level-designer`)

| Groupe | Libellé | Cases | Seuil |
|---|---|---|---|
| `g-matrice` | Les quatre de 1868 | C01 Gervais, C03 Clovis, C05 Siméon, C07 Lubin | 3 |
| `g-talons` | Les talons (épouses des chefs) | C02 Perrine, C04 Toinette, C06 Ursule, C08 Apolline | 3 |
| `g-goemard` | La Fourche | C09 Josse, C10 Reine, C21 Gatien, C22 Léontine, C28 Félix | 3 |
| `g-oyard` | L'Œil | C11 Jacquette, C12 Médard, C23 Elzéar, C29 Rose | 3 |
| `g-lestaud` | La Potence | C15 Ernestine, C16 Fulbert, C26 Clément, C31 Aline | 3 |
| `g-ecole` | L'école et le feu | C17 Benoît, C18 Sidonie, C20 Honorine | 3 |
| `g-mer` | L'enfant de mer | C19 Noël, C25 Lazare, C30 Marin | 3 |
| `g-garnaud` | Le fils parti | C13 Blaise, C14 Amélie, C27 Léandre, C32 Edmée | 3 |

Total 31 cases en groupes + C24 établie = 32. **Ordre attendu** : matrice (OF-02, CN-01) → talons
(CN-01, RG-07–RG-10) → Oyard (BD-01, DV-02, RG-15) → les autres en parallèle → Garnaud en dernier
(il exige la grammaire et un saut vers Port-Sénane).

## 6. Pièges (outils de déduction, jamais contradictions)

| Type | Où | Comment on le lève |
|---|---|---|
| **L'enfant de mer** (exception R6) | Noël `A/` porte la tête Cormaud : on le croit fils de Siméon. | OF-05 (règle et marque de mer), RG-02 (« baptisé sous condition, recueilli »), RG-10 (« de parents inconnus »), BD-03 ; les vrais fils `A-g`, `A-d` sont noyés en 1869 (CN-01). Noël n'a pas de parents dans l'arbre. |
| **Le fils parti** | Blaise est « Garnaud, né à Port-Sénane » partout sur le continent (RG-12, PR-02, PR-04, BD-07, OF-03). | RG-12 donne la **même date de naissance** que le baptême de RG-01 (3 févr. 1854) ; la cheminée (PH-08) et la tombe (PH-15) portent `Y-d` ; RG-13 relie les deux noms ; LT-07 pose la question. |
| **Le trident** | La marque de commerce du Comptoir (D10), « un trident » (BD-07). | R1 et R7 : c'est une Fourche (`Y`), mais gravée, pas autographe. Indice, pas preuve. |
| **Le puîné d'une autre maison** | Ange Oyard `O-d`, inscrit maritime le même jour que Blaise (RG-13). | La tête : Œil, pas Fourche. Leurre de recherche « puîné parti en mer ». |
| **Marques d'avirons** | `Y-g-g` (Gatien), `A/-g` (Lazare) aux Cabanes (CN-02, PH-10). | R8 : ils signent, leurs cases sont des visages ; ces marques confirment la grammaire (une génération de plus). |
| **Marque de fille** | Jacquette `Y·` (1876), Reine `P·` (1879), Ernestine `O·` (1877), Honorine `P··` (1885) sur leurs actes de mariage. | R4 → R5 : acceptées comme second état de la case (`altPortraits`). |
| **Copie de commis** | La croix `X` à la place de la marque d'Ernestine (double de RG-09). | R7 ; la page originale porte `O·`. |
| **Même métier, deux générations** | Ramasseur d'ambre (Gervais, Josse), batelier (Médard, Elzéar), sage-femme (Toinette, Jacquette), boulangère (Apolline, Ernestine), fileuse (Perrine, Reine), goémonier (Lubin, Fulbert), ramendeuse (Ursule, Honorine), charpentier (Siméon, Noël), directeur·rice (Léandre, Edmée). | Les marques et les dates départagent ; jamais deux personnes du même métier dans un même groupe sans marque ou visage distinct. |
| **Pêcheur / patron pêcheur** | Lazare et Félix. | Le patron possède son bateau (Inscription maritime, AN-02, PR-08) ; Lazare est « pêcheur » à son mariage (RG-18) et aux tables (RG-17). |
| **Gardien de feu ≠ de phare** | Benoît (leurre `gardien-de-phare`). | RG-21 (« gardien auxiliaire du feu »), RP-04, RG-11. |
| **« Enfant de notre ville »** | Fausse origine de Blaise (PR-02, PR-04, RG-12, BD-07). | Aucune naissance de Blaise à Port-Sénane aux tables ; l'acte de notoriété (RG-12) n'est qu'un témoignage ; RG-13. |
| **Noms au son** | *Gouémard*, *Oyart*, *Cormault*, *Lestot* dans les registres du continent. | Variantes acceptées (§2) ; le Lecteur les indexe ensemble (OF-06). |
| **Deux Rose ?** | Rose Oyard est « Mme Pellerin » à la halle (PH-16, AN-02). | Nom d'épouse accepté ; RG-17 (naissance, fille d'Elzéar). |

## 7. Affichage de Noël (option)

Le contrat place les cases par le **sang** (`parents`) : Noël a `parents: [null, null]` et rejoint
l'arbre par son union avec Honorine. **Option** (au `game-designer` et au `frontend`) : un trait
pointillé « accueilli » de Siméon et Ursule vers Noël, affiché **après** validation de `g-mer`, comme
le pointillé d'adoption prévu par l'affaire 1. Sans cette option, rien ne change au jeu : la case
reste juste.

## 8. À trancher par l'humain

1. Le nombre de cases (32) et le découpage en 8 groupes, dont un groupe de 5 (`g-goemard`).
2. Les métiers partagés de mère en belle-fille (coutume de l'île) : garder ou différencier.
3. L'affichage pointillé de l'accueil de Noël (§7).
4. Edmée Garnaud célibataire (pas de nom d'épouse) ; Rose « Pellerin » par mariage.
