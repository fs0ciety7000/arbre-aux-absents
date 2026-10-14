# 02 — L'arbre : les Tessonnal de Hautcorvin et les Neviot de Vernezac

> **28 cases sur 4 générations.** Chaque case = **un nom** (prénom + nom), **un visage**, **un métier**
> dans une liste fermée. Identifiants (`person`, `occupation`) au format de
> `content/cases/<id>/family.json` (contrat : `packages/contract/src/family.ts`, `tree.ts`).
> Dates détaillées : `03-chronologie.md`. Preuves : `07-coherence.md`. Lieux : `08-lieux.md`.
> Identifiant d'affaire proposé : `revenant-de-hautcorvin`.

## 1. Schéma

```
I    C01 Évariste TESSONNAL ══ C02 Clotilde MERVAUX
     ├─ II  C06 Honoré TESSONNAL ══ C07 Eugénie RAVENEL                         [C06 établie au départ]
     │      ├─ III C13 Colombe TESSONNAL ══ C14 Aimé BROSSAL
     │      │      ├─ IV C21 Hugues BROSSAL ══ C22 Sabine ORLHAC
     │      │      └─ IV C23 Isaure BROSSAL ══ C24 Julien ESCANDE
     │      └─ III C15 Bastien TESSONNAL ┄┄ C16 Lucie NEVIOT                    [C15 REVENDIQUÉE]
     │             └─ IV C25 Agnès NEVIOT
     │      C06 Honoré ┄┄ C08 Danela DALVARIN
     │             └─ III C17 « ? » Andrin DALVARIN                             [case « ? »]
     ├─ II  C09 Marguerite TESSONNAL (sœur Agathe)
     └─ II  C10 Léonce TESSONNAL

I    C03 Dranko DALVARIN
     └─ II  C08 Danela DALVARIN  (voir ci-dessus)

I    C04 Barthélemy NEVIOT ══ C05 Annette COMBAL
     └─ II  C11 Jules NEVIOT ══ C12 Philomène ARDOUIN
            ├─ III C19 Rémi NEVIOT ══ C20 Odette LAMBERGE
            │      ├─ IV C27 Gilles NEVIOT
            │      └─ IV C28 Brigitte NEVIOT
            └─ III C16 Lucie NEVIOT ══ (1947) C18 Victorin SARRADE
                   └─ IV C26 Pierre SARRADE
```

Légende : `══` mariage · `┄┄` union non mariée · `│` filiation de sang. Lucie (C16) a deux unions :
Bastien (┄┄, père d'Agnès) puis Victorin (══, père de Pierre). Agnès et Pierre sont demi-frère et
demi-sœur ; Bastien et Andrin sont demi-frères (même père, Honoré).

**Règle de placement** : arbre **de sang** (loi de 1973 : « rétablir les filiations rompues »).
Victorin n'a pas reconnu Agnès (RG-10) : aucun pointillé d'adoption.

**Pourquoi ces 28 personnes (diégèse)** : la lettre de mission (OF-01) demande le tableau de la
**descendance d'Évariste Tessonnal** (pour le testament d'Honoré et la requête 76-0012) et de
l'**ascendance maternelle de la requérante jointe Agnès Neviot** (dossier 74-0962), dont les
témoins sont à Vernezac. Les Dalvarin entrent par la case « ? ».

## 2. Règle des noms

- **Canonique** = prénom usuel + **nom de naissance**. Noms d'usage (épouse) **acceptés** comme
  variantes : Colombe **Brossal**, Eugénie **Tessonnal**, Clotilde **Tessonnal**, Odette **Neviot**,
  Lucie **Sarrade**, Isaure **Escande**, Sabine **Brossal**, Annette **Neviot**, Philomène **Neviot**.
- **Refusés** (mènent à la bonne personne mais ne sont pas son nom) : le **nom de religion**
  (*sœur Agathe*), les surnoms (*Colo*, *la Thalbère*, *le Thalbère*, *le maître*, *la gardienne
  de l'Ourse*, *les deux frères de la Combe*), les matricules (*0214*, *1171*, *38-0377*, *41-1987*),
  les insignes de guide (*n° 7*, *n° 19*, *n° 31*).
- **Thalbère** : *Dalvarin* est invariable (pas de féminin). Les formes thalbères des prénoms
  (*Andrine*, *Danéla* dans une traduction jurée) ne sont pas des variantes : la graphie velmarchoise
  de l'état civil fait foi.
- **Le requérant** : « Bastien Tessonnal » est un nom **juste**… pour la case C15. Le piège n'est pas
  le nom de la case revendiquée, c'est le **visage** qu'on y a posé.

## 3. Les 28 cases

Colonnes : **case** · `person` · génération · groupe proposé (§5) · nom canonique (variantes) ·
naissance–mort · **métier** (`occupation`) · état au départ.

| Case | `person` | G | Groupe | Nom (variantes) | Dates | Métier (`occupation`) | Départ |
|---|---|---|---|---|---|---|---|
| C01 | `evariste-tessonnal` | I | verriers | **Évariste Tessonnal** | 1848–1921 | Directeur·rice des Verreries · `directeur-verreries` | visible |
| C02 | `clotilde-mervaux` | I | verriers | **Clotilde Mervaux** (Tessonnal) | 1856–1930 | Doreuse sur verre · `doreuse` | visible |
| C03 | `dranko-dalvarin` | I | baptême | **Dranko Dalvarin** | 1856–1931 | Charbonnier · `charbonnier` | **cachée** |
| C04 | `barthelemy-neviot` | I | combe | **Barthélemy Neviot** | 1847–1919 | Carrier · `carrier` | visible |
| C05 | `annette-combal` | I | combe | **Annette Combal** (Neviot) | 1851–1927 | Sage-femme · `sage-femme` | visible |
| C06 | `honore-tessonnal` | II | — | **Honoré Tessonnal** | 1880–1975 | Maître verrier · `maitre-verrier` | **établie** (`prefilled`) |
| C07 | `eugenie-ravenel` | II | prologue | **Eugénie Ravenel** (Tessonnal) | 1883–1931 | Modiste · `modiste` | visible |
| C08 | `danela-dalvarin` | II | baptême | **Danela Dalvarin** | 1888–1960 | Graveur·se sur verre · `graveur-sur-verre` | visible |
| C09 | `marguerite-tessonnal` | II | baptême | **Marguerite Tessonnal** | 1883–1964 | Religieuse hospitalière · `religieuse` | visible |
| C10 | `leonce-tessonnal` | II | verriers | **Léonce Tessonnal** | 1885–1916 | Opticien (lentilles de phare) · `opticien` | visible |
| C11 | `jules-neviot` | II | combe | **Jules Neviot** | 1877–1944 | Guide de montagne · `guide-de-montagne` | visible |
| C12 | `philomene-ardouin` | II | combe | **Philomène Ardouin** (Neviot) | 1880–1958 | Aubergiste · `aubergiste` | visible |
| C13 | `colombe-tessonnal` | III | prologue | **Colombe Tessonnal** (Brossal) | 1906– | Directeur·rice des Verreries · `directeur-verreries` | visible |
| C14 | `aime-brossal` | III | prologue | **Aimé Brossal** | 1899–1958 | Fondé de pouvoir · `fonde-de-pouvoir` | visible |
| C15 | `bastien-tessonnal` | III | revenant | **Bastien Tessonnal** | 1910–1944 | Souffleur de verre · `souffleur` | **revendiquée** (`claim`) |
| C16 | `lucie-neviot` | III | ourse | **Lucie Neviot** (Sarrade) | 1914–1969 | Gardien·ne de refuge · `gardien-de-refuge` | visible |
| C17 | `andrin-dalvarin` | III | revenant | **Andrin Dalvarin** | 1912– | Graveur·se sur verre · `graveur-sur-verre` | visible, **« ? »** |
| C18 | `victorin-sarrade` | III | ourse | **Victorin Sarrade** | 1915– | Douanier · `douanier` | **cachée** |
| C19 | `remi-neviot` | III | vernezac | **Rémi Neviot** | 1908–1971 | Guide de montagne · `guide-de-montagne` | visible |
| C20 | `odette-lamberge` | III | vernezac | **Odette Lamberge** (Neviot) | 1912– | Institutrice · `institutrice` | visible |
| C21 | `hugues-brossal` | IV | brossal | **Hugues Brossal** | 1931– | Ingénieur verrier · `ingenieur-verrier` | visible |
| C22 | `sabine-orlhac` | IV | brossal | **Sabine Orlhac** (Brossal) | 1936– | Photographe · `photographe` | **cachée** |
| C23 | `isaure-brossal` | IV | brossal | **Isaure Brossal** (Escande) | 1934– | Journaliste · `journaliste` | visible |
| C24 | `julien-escande` | IV | brossal | **Julien Escande** | 1928– | Notaire · `notaire` | visible |
| C25 | `agnes-neviot` | IV | revenant | **Agnès Neviot** | 1939– | Infirmière · `infirmiere` | visible |
| C26 | `pierre-sarrade` | IV | ourse | **Pierre Sarrade** | 1948– | Moniteur de ski · `moniteur-de-ski` | **cachée** |
| C27 | `gilles-neviot` | IV | vernezac | **Gilles Neviot** | 1936– | Guide de montagne · `guide-de-montagne` | visible |
| C28 | `brigitte-neviot` | IV | vernezac | **Brigitte Neviot** | 1941– | Receveuse des postes · `receveuse` | **cachée** |

Comptage : G I = 5 · G II = 7 · G III = 8 · G IV = 8 → **28**. Branches : Tessonnal 13 (C01, C02,
C06, C07, C09, C10, C13, C14, C15, C21–C24), Dalvarin 3 (C03, C08, C17), Neviot 12 (C04, C05, C11,
C12, C16, C18, C19, C20, C25–C28).

### Liste fermée des métiers (`occupations`)

**24 métiers justes** (trois partagés, sans ambiguïté de personne : `directeur-verreries` pour
Évariste et Colombe, `graveur-sur-verre` pour Danela et Andrin, `guide-de-montagne` pour Jules, Rémi
et Gilles) + **3 leurres** documentés :

| `id` | Libellé |
|---|---|
| `directeur-verreries` | Directeur·rice des Verreries |
| `doreuse` | Doreuse sur verre |
| `charbonnier` | Charbonnier |
| `carrier` | Carrier |
| `sage-femme` | Sage-femme |
| `maitre-verrier` | Maître verrier |
| `modiste` | Modiste |
| `graveur-sur-verre` | Graveur·se sur verre |
| `religieuse` | Religieuse hospitalière |
| `opticien` | Opticien (lentilles de phare) |
| `guide-de-montagne` | Guide de montagne |
| `aubergiste` | Aubergiste |
| `fonde-de-pouvoir` | Fondé de pouvoir |
| `souffleur` | Souffleur de verre |
| `gardien-de-refuge` | Gardien·ne de refuge |
| `douanier` | Douanier |
| `institutrice` | Institutrice |
| `ingenieur-verrier` | Ingénieur verrier |
| `photographe` | Photographe |
| `journaliste` | Journaliste |
| `notaire` | Notaire |
| `infirmiere` | Infirmière |
| `moniteur-de-ski` | Moniteur de ski |
| `receveuse` | Receveuse des postes |

| Leurre | Piège |
|---|---|
| `chef-de-nuit` *(« Chef de nuit »)* | Grade de Bastien en 1935–1937 (RP-01, PR-04), et **métier déclaré par le requérant** dans la case revendiquée (OF-02). Sa **qualité** est souffleur (RG-11, RG-17, RP-04, PH-18). |
| `passeur` *(« Passeur·se »)* | Ce que la Garde soupçonne d'Andrin (RP-03) et ce que Lucie faisait en secret (S2) ; jamais une qualité d'état civil. |
| `verrier` *(« Verrier »)* | Ce que la presse dit de tout le monde à Hautcorvin (« le verrier Tessonnal ») ; trop vague, aucune case. |

Rappel de la règle de l'affaire 1 : le métier est **l'activité pour laquelle la personne est connue
dans au moins deux pièces**. Honoré préside le conseil des Verreries de 1921 à 1946, mais aucune pièce
ne le dit « directeur » : il est « le maître verrier » partout. « Directeur·rice » n'appartient qu'à
Évariste et à Colombe.

## 4. État au départ (dossier 76-0012)

- **Établie** (`prefilled`, hors groupe) : **C06 Honoré** (portrait OF-05 joint au dossier,
  nom et qualité par le testament OF-04 et la nécrologie). Sert de point d'appui, comme Adélaïde.
- **Revendiquée** (`claim`, dans un groupe, jamais verrouillée seule) : **C15 Bastien**. La
  déclaration (OF-02) pose :

  | Champ | Valeur déclarée | Juste ? |
  |---|---|---|
  | `given` | Bastien | oui |
  | `family` | Tessonnal | oui |
  | `portrait` | le visage du requérant à 63 ans (= portrait de case d'**Andrin**) | **non** |
  | `occupation` | `chef-de-nuit` (leurre : un grade, pas une qualité) | **non** |

  **Décision (validée)** : la déclaration est fausse sur **deux champs**, le visage et le métier ; le
  **nom reste juste**. Le joueur doit **retirer** le visage, le **déplacer** vers la case « ? » (C17),
  poser à sa place le visage de Bastien à 27 ans (PH-07, PR-03, PH-18), et remplacer « Chef de nuit »
  par « Souffleur de verre » (RG-11, RG-17, RP-04, PH-18). Le contrôle `content:check` (« fausse sur
  ≥ 1 champ ») est satisfait deux fois. Pourquoi le requérant se trompe : il a vu Bastien pour la
  dernière fois chef de nuit, en 1937, et la requête demande la « profession à la date de la
  radiation » ; la liste n° 9 (RG-11) dit, elle, « souffleur ».
- **Case « ? »** : **C17**, sous Honoré et une partenaire. Visible dès le départ parce que le pli scellé
  du testament (OF-04) est adressé « à celui de mes enfants qui n'a pas porté mon nom » : l'Office
  sait qu'il existe un autre enfant d'Honoré. Le requérant prétend que ce pli est pour lui (« j'ai
  perdu le nom en 1938 »). C08 (Danela) est visible et nommée dès PV-01 (« la Thalbère, Danela ») ;
  elle n'est pas marquée « ? ».
- **Cases cachées** (proposition de `revealedBy`, à arbitrer par le `level-designer`) :
  - **C03 Dranko** : lecture de RG-05 **ou** de PH-05.
  - **C18 Victorin** et **C26 Pierre** : lecture de RG-10 **ou** de PH-11 (Victorin seul : aussi RP-04).
  - **C22 Sabine** : lecture de RG-07 **ou** de PH-15.
  - **C28 Brigitte** : lecture de RG-09 **ou** de TG-02.
- Forme visible au départ : **23 cases** (1 établie, 1 revendiquée, 1 « ? », 20 vides).

## 5. Groupes de validation (proposition au `level-designer`)

Conforme à `docs/game/AFFAIRE-2.md` §1.5 (trio 3 / 3 autour de la case revendiquée).

| Groupe | Libellé | Cases | Seuil |
|---|---|---|---|
| `g-prologue` | Prologue — la requête et l'opposition | C07 Eugénie, C13 Colombe, C14 Aimé | 3 |
| `g-revenant` | Le revenant | C15 Bastien (revendiquée), C17 « ? », C25 Agnès | 3 |
| `g-verriers` | Les maîtres verriers | C01 Évariste, C02 Clotilde, C10 Léonce | 3 |
| `g-bapteme` | Le baptême de Vernezac | C03 Dranko, C08 Danela, C09 Marguerite | 3 |
| `g-brossal` | La maison Brossal | C21 Hugues, C22 Sabine, C23 Isaure, C24 Julien | 3 |
| `g-combe` | Les gens de la Combe | C04 Barthélemy, C05 Annette, C11 Jules, C12 Philomène | 3 |
| `g-ourse` | Le Pas de l'Ourse | C16 Lucie, C18 Victorin, C26 Pierre | 3 |
| `g-vernezac` | Les guides de Vernezac | C19 Rémi, C20 Odette, C27 Gilles, C28 Brigitte | 3 |

Total 27 cases en groupes + C06 établie = 28. Le prologue se résout avec OF-03 (noms), PH-06
(mariage de 1928, où le visage connu d'Honoré sert d'ancre) et PH-04 : 10 à 15 minutes.

## 6. Pièges (outils de déduction, jamais contradictions)

| Type | Où | Comment on le lève |
|---|---|---|
| **Case revendiquée** | C15 porte le visage du requérant et le métier « chef de nuit ». | Visage : yeux (gris en 1938 : RP-04, OF-03, LT-06 ; bruns en 1976 : OF-02, EX-01), main brûlée (droite / gauche), lobe (EX-03), photos de 1935 (PH-18), de la grève (PR-03) et de 1937 (PH-07). Métier : voir « Grade pour qualité ». |
| **Demi-frères ressemblants** | Bastien et Andrin à 27 ans : même ovale, même fossette Tessonnal, même carrure. | Bastien : **yeux gris**, **épi** au front, **lobe détaché**, incisive ébréchée, brûlure **main droite**, casquette de souffleur. Andrin : **yeux sombres**, **sourcils droits et épais** (Danela), **lobe adhérent**, pas d'épi, tablier de cuir de graveur, brûlure **main gauche** seulement après 1943. |
| **Trois âges d'un homme** | Le requérant à 23 (PH-18), 24–29 (PH-07, PH-10), 40–42 (RG-15, PH-13) et 63 ans (OF-02, PH-17, CT-02). | Sourcils, lobe, fossette, loupe de graveur au cordon (1955, 1974, 1976). |
| **Faux père (1)** | « Le fils de Léonce » : rumeur de 1912, parrainage (RG-05), le requérant lui-même (PV-01). | Léonce est à Tennok du 12 nov. 1911 au 20 févr. 1912 (CP-01) ; Andrin naît le 2 sept. 1912. LT-01, LT-02, DV-01. |
| **Faux père (2)** | « La fille du Thalbère » : la Garde (RP-03) et le village croient Agnès fille d'Andrin. | Andrin portait des vivres à Bastien caché (LT-04, PV-06) ; la lettre de 1939 (LT-05), le billet de 1944 (LT-06), l'épi d'Agnès (PH-12) et ses yeux gris. |
| **Nom de religion** | « Sœur Agathe », marraine d'Andrin, hospitalière. | RG-05 (« Marguerite Tessonnal, en religion sœur Agathe »), RG-16, DV-01. |
| **Homonymie de métier** | Trois **guides Neviot** (Jules, Rémi, Gilles) ; « le guide Neviot » dans les pièces. | Insignes numérotés visibles sur les photos (n° 7, n° 19, n° 31), dates. |
| **Grade pour qualité** | Bastien « chef de nuit » (leurre ; métier déclaré dans la requête, OF-02, et repris par la presse de 1937, PR-04). | RG-11 (liste n° 9), RG-17 (registre du personnel), RP-04 (arrestation), PH-18 (« 1er prix de soufflage ») : souffleur. |
| **Père et fils notaires** | Me Léon Escande (1958, LT-09) et Me Julien Escande (1975, OF-04) ; ils se ressemblent (leurre de visage, PH-14). | Dates, prénoms, PH-14 (les deux côte à côte : le père a la moustache). |
| **Version du requérant** | « C'est Andrin qui est mort en 1944 ; j'ai pris son nom. » Elle explique **tout** ce qui est postérieur à 1944 (RG-15, PH-13, CT-02, TG-02). | Seules les pièces **antérieures au 9 mars 1944** départagent : PH-18 (1935), PH-07 (1937), PR-03 (1936), PH-09 / PH-10 (R), RP-04 (1938), RG-14 (1943). Et Haask (PV-05). |
| **L'échange des plaques** | Le requérant dit avoir échangé, la nuit du 9 mars 1944, sa plaque matricule avec celle du mort, à l'infirmerie. | PV-05 (le gardien de service : « Personne n'a échangé ces deux-là ; le médecin était là »), RG-13 (constat du Dr Hervel), LT-06, TG-01 (Andrin lui-même annonce en 1952 la mort de Bastien). Haask y est un témoin **neutre** : rien de l'affaire 1 (07 §6). |

## 7. À trancher par l'humain

1. ~~Un seul champ faux~~ **Tranché** : deux champs faux (visage et métier `chef-de-nuit`), nom juste.
2. Agnès dans le trio du revenant (recommandation du game designer) : confirmé ici.
3. Noms d'épouse acceptés (comme l'affaire 1) ; nom de religion refusé.
