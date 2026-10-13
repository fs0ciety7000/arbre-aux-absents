# 02 — L'arbre : la descendance d'Anselme et de Firmin Varenque

> 30 cases sur 4 générations. Chaque case = **un nom** (prénom + nom), **un visage** (portrait),
> **un métier ou rôle** (dans une liste fermée). Les identifiants (`person`, `occupation`)
> sont ceux de `content/cases/succession-varenque/family.json` (format : `docs/ARCHITECTURE.md` §3.2).
> Dates détaillées : `03-chronologie.md`. Preuves : `07-coherence.md`.

## 1. Schéma

```
I    C01 Anselme VARENQUE ══ C02 Clémence AUBERTOT
     ├─ II  C05 Augustin VARENQUE ══ C06 Henriette SORBELLE
     │      ├─ III C12 Gaspard VARENQUE ══ C13 Irène CASTAGNE
     │      │      ├─ IV C23 Augustin VARENQUE
     │      │      ├─ IV C24 Armand VARENQUE ══ C25 Mathilde ROUVIÈRE
     │      │      └─ IV C26 Hélène VARENQUE ══ C27 Paul MARSAL
     │      ├─ III C14 Blanche VARENQUE ══ C15 Marcel DAUBRY
     │      │      ╎  (adoptent en 1942 C28 Lise, en pointillé)
     │      └─ III C16 Odile VARENQUE ┄┄ C17 Orrin KESSVEL
     │             └─ IV C28 Lise DAUBRY
     ├─ II  C07 Lucien VARENQUE ┄┄ C08 Pauline SAUGE
     │      └─ III C18 Victor SAUGE ══ C19 Ninon BRIAL
     │             └─ IV C29 Claude SAUGE
     └─ II  C09 Adélaïde VARENQUE

I    C03 Firmin VARENQUE ══ C04 Maaren TENNOK
     └─ II  C10 Aldrik VARENQUE ══ C11 Tenna ORRVIK
            ├─ III C20 Firmin VARENQUE ══ C21 Hessa DRAAVIK
            │      └─ IV C30 Tavik VARENQUE
            └─ III C22 Selda VARENQUE

Anselme (C01) et Firmin (C03) sont frères : les deux arbres se rejoignent au-dessus de la
génération I (leur père Jacques Varenque, meunier, n'est pas une case).
```

Légende : `══` mariage · `┄┄` union non mariée · `│` filiation de sang · `╎` filiation adoptive
(affichée en pointillé, n'est pas une case à remplir : Lise est placée sous **Odile et Orrin**).

**Règle de placement** : l'arbre est un arbre **de sang** (c'est ce que demande la loi de 1973 :
« rétablir les filiations rompues »). Les adoptions apparaissent en pointillé une fois Lise validée.

## 2. Règle des noms

- **Canonique** = prénom usuel + **nom de naissance**. Les noms d'usage (épouse) sont **acceptés**
  comme variantes (`family[]`), car ils figurent dans les actes ; la difficulté est d'identifier
  la personne, pas d'orthographier son état civil.
- **Refusés** : les noms d'emprunt et de scène (*Blanche Aubertine*, *Nora Ilvess*, *Marc Dobrin*),
  les surnoms seuls (*le Goéland*, *Maask*, *Tante Adé*, *Claudie*, *Fougère*), le matricule
  (*P-4471*, *1187*). Ils mènent à la bonne personne mais ne sont pas son nom.
- **Ostrien** : la forme féminine en *-essa* (*Tennokessa*, *Orrvikessa*, *Draavikessa*) est
  acceptée comme graphie du même nom.

## 3. Les 30 cases

Colonnes : **id** case · `person` · génération · branche · nom canonique (variantes acceptées) ·
naissance–mort · **métier** (`occupation`) · état au départ.

| Case | `person` | G | Br. | Nom (variantes) | Dates | Métier (`occupation`) | Départ |
|---|---|---|---|---|---|---|---|
| C01 | `anselme-varenque` | I | T | **Anselme Varenque** | 1846–1919 | Papetier · `papetier` | nom + métier |
| C02 | `clemence-aubertot` | I | T | **Clémence Aubertot** (Varenque) | 1850–1931 | Botaniste · `botaniste` | vide |
| C03 | `firmin-varenque-1849` | I | P | **Firmin Varenque** | 1849–1902 | Capitaine au long cours · `capitaine` | vide |
| C04 | `maaren-tennok` | I | P | **Maaren Tennok** (Tennokessa, Varenque) | 1852–1921 | Gardien·ne de phare · `gardien-de-phare` | vide |
| C05 | `augustin-varenque-1872` | II | T | **Augustin Varenque** | 1872–1938 | Député · `depute` | vide |
| C06 | `henriette-sorbelle` | II | T | **Henriette Sorbelle** (Varenque) | 1876–1950 | Philanthrope · `philanthrope` | vide |
| C07 | `lucien-varenque` | II | A | **Lucien Varenque** | 1875–1918 | Peintre-affichiste · `affichiste` | vide |
| C08 | `pauline-sauge` | II | A | **Pauline Sauge** | 1884–1940 | Blanchisseuse · `blanchisseuse` | vide (case « ? ») |
| C09 | `adelaide-varenque` | II | T | **Adélaïde Varenque** | 1879–1974 | Institutrice · `institutrice` | **complète** |
| C10 | `aldrik-varenque` | II | P | **Aldrik Varenque** | 1874–1924 | Patron du canot de sauvetage · `patron-de-canot` | vide |
| C11 | `tenna-orrvik` | II | P | **Tenna Orrvik** (Orrvikessa, Varenque) | 1878–1950 | Receveuse des postes · `receveuse` | vide |
| C12 | `gaspard-varenque` | III | T | **Gaspard Varenque** | 1898–1971 | Directeur des Papeteries · `directeur-papeteries` | vide |
| C13 | `irene-castagne` | III | T | **Irène Castagne** (Varenque) | 1902–1945 | Pianiste · `pianiste` | vide |
| C14 | `blanche-varenque` | III | B | **Blanche Varenque** (Daubry) | 1901– | Cantatrice · `cantatrice` | vide |
| C15 | `marcel-daubry` | III | B | **Marcel Daubry** | 1896–1959 | Commissaire aux Registres · `commissaire` | vide |
| C16 | `odile-varenque` | III | B | **Odile Varenque** | 1908– (off. †1943) | Graveuse de filigranes · `graveuse` | vide |
| C17 | `orrin-kessvel` | III | B | **Orrin Kessvel** | 1905–1942 | Typographe · `typographe` | vide (case « ? ») |
| C18 | `victor-sauge` | III | A | **Victor Sauge** | 1906–1966 | Aviateur · `aviateur` | vide (case « ? ») |
| C19 | `ninon-brial` | III | A | **Ninon Brial** (Sauge) | 1912–1971 | Costumière · `costumiere` | **cachée** |
| C20 | `firmin-varenque-1900` | III | P | **Firmin Varenque** | 1900–1967 | Patron pêcheur · `patron-pecheur` | vide |
| C21 | `hessa-draavik` | III | P | **Hessa Draavik** (Draavikessa, Varenque) | 1906–1939 | Sage-femme · `sage-femme` | **cachée** |
| C22 | `selda-varenque` | III | P | **Selda Varenque** | 1903– | Journaliste · `journaliste` | vide |
| C23 | `augustin-varenque-1924` | IV | T | **Augustin Varenque** | 1924–1944 | Étudiant · `etudiant` | vide |
| C24 | `armand-varenque` | IV | T | **Armand Varenque** | 1927– | Avocat · `avocat` | nom + métier |
| C25 | `mathilde-rouviere` | IV | T | **Mathilde Rouvière** (Varenque) | 1930– | Speakerine · `speakerine` | vide |
| C26 | `helene-varenque` | IV | T | **Hélène Varenque** (Marsal) | 1931– | Médecin · `medecin` | vide |
| C27 | `paul-marsal` | IV | T | **Paul Marsal** | 1928– | Journaliste · `journaliste` | vide |
| C28 | `lise-daubry` | IV | B | **Lise Daubry** (prénom : Lise, Élise) | 1942– | Restauratrice de papier · `restauratrice` | vide (case « ? ») |
| C29 | `claude-sauge` | IV | A | **Claude Sauge** | 1938– | Ingénieure · `ingenieure` | **cachée** |
| C30 | `tavik-varenque` | IV | P | **Tavik Varenque** | 1932– | Gardien·ne de phare · `gardien-de-phare` | **cachée** |

Branches (proposition pour les groupes de validation, à arbitrer par `level-designer`) :
**T** = les Tilleuls (12 cases), **B** = les Absents (5), **A** = l'Atelier (5), **P** = le Phare (8).

Comptage : G I = 4 · G II = 7 · G III = 11 · G IV = 8 → **30**.

### Liste fermée des métiers (`occupations`)

28 métiers justes (deux partagés : `journaliste` pour Selda et Paul, `gardien-de-phare` pour Maaren
et Tavik) + **4 leurres** documentés, qui mènent à une erreur plausible :

| Leurre | Piège |
|---|---|
| `comptable` | premier métier de Marcel Daubry (RG-08, AN-02) ; il est connu comme commissaire. |
| `photographe` | métier de « Nora Ilvess » ; Odile est inscrite comme graveuse. |
| `modele` *(« Modèle d'artiste »)* | Pauline pose pour Lucien, mais son état est blanchisseuse (acte de naissance de son fils, annuaire, Œuvre). **À trancher** : leurre ou variante acceptée (voir §6). |
| `industriel` | ce que la presse dit d'Augustin et de Gaspard ; trop vague, ne correspond à aucune case. |

Métier unique par case : c'est la **qualité** qu'exige le formulaire de l'ORC, c'est-à-dire
**l'activité pour laquelle la personne est connue dans au moins deux pièces**. Augustin a été
président des Papeteries, mais il n'est **jamais** dit « directeur » : ce mot n'appartient qu'à Gaspard.

## 4. État au départ (dossier 74-0318)

- **Complète** : C09 Adélaïde (portrait OF-03 joint au dossier). Sert de tutoriel.
- **Partielles** : C01 Anselme (nom + métier, par le testament et la lettre de mission), C24 Armand
  (nom + métier, par sa lettre d'opposition) : il reste à trouver leurs visages.
- **Forme visible** : 26 cases. Le testament annonce « l'enfant de Lucien » et « l'enfant d'Odile » :
  C18 et C28 sont visibles mais marquées « ? », ainsi que leurs autres parents C08 et C17.
- **Cases cachées** (proposition de `revealedBy`) :
  - C19 Ninon et C29 Claude : quand C18 est **verrouillée** (on découvre la famille de Victor).
  - C21 Hessa et C30 Tavik : à la lecture de RG-10 ou de PH-20 (le fils du Goéland).

## 5. Pièges (outils de déduction, jamais contradictions)

| Type | Où | Comment on le lève |
|---|---|---|
| **Homonymes** | Deux **Augustin Varenque** (C05 1872–1938, député ; C23 1924–1944, étudiant fusillé). | Dates (RG-17 vs PB-04), visage (moustache cirée vs jeune homme au menton fendu), parents (RG-01 vs RG-09). |
| **Homonymes** | Deux **Firmin Varenque** (C03 1849–1902, capitaine ; C20 1900–1967, pêcheur) + Tavik : trois anneaux d'or à l'oreille gauche. | C03 barbu noir sur PH-03 (1873) et mort en 1902 ; C20 rasé sur PH-05 (1922) et PH-14 (1930), barbe grise sur PH-20 ; Tavik barbe rousse. |
| **Nom d'épouse** | Blanche Daubry, Hélène Marsal, Mathilde Varenque, « Mme Augustin Varenque », « Mme Ninon Sauge ». | Actes de mariage (RG-04, RG-07, RG-08, RG-11), faire-part DV-04. |
| **Nom de scène** | **Blanche Aubertine**, soprano. | Même adresse que Marcel Daubry (AN-02), « née Varenque » (PR-06), grain de beauté, nom tiré d'Aubertot. |
| **Surnoms** | **le Goéland** = **Maask** (en ostrien) = Firmin C20 ; **Tante Adé** = Adélaïde ; **Claudie** = Claude ; **Fougère** = Odile (nom de réseau). | Lexique ostrien DV-05 (*maask* = goéland) ; LT-13 « mon frère Firmin, le Goéland ». |
| **Graphie ostrienne** | Tennok / Tennokessa ; Orrvik / Orrvikessa ; Draavik / Draavikessa. | DV-05 : *-essa* marque le féminin. |
| **Genre supposé** | « La famille du **gardien** » (PH-04, 1910) : le gardien est **Maaren**, pas Aldrik. « Sauge C., **ingénieur** » dans l'annuaire = Claude, une femme. | AN-04 (états de service : Maaren 1883–1912) ; PH-28 « Mlle C. Sauge ». |
| **Adoption** | Lise Daubry, « née à Grisenoue de parents inconnus », adoptée par Marcel et Blanche. | Registre de Kessaar (RG-14), fragment P-4471 (RG-15), même date de naissance, prénom Élise, mèche. |
| **Enfant caché** | Victor Sauge, « père non dénommé ». | Lettres de Lucien (LT-03, LT-05), acte notarié RG-20, strabisme commun. |
| **Fausse identité** | Odile = Nora Ilvess (secret S1) ; Marcel = Marc Dobrin (S5). | Voir `05-secrets-et-fins.md`. N'empêche pas de remplir l'arbre. |
| **Faux décès** | Odile « décédée à Kessaar en 1943 ». | N'invalide pas la case (elle reste Odile Varenque, graveuse) ; la survie est un secret annexe. |
| **Fausse paternité** | Victor raconte aux journalistes (PR-07) qu'il est « fils d'un capitaine de Port-Sénane disparu en mer » : pointe vers C03. | C03 meurt en 1902, Victor naît en 1906. |
| **Faux coupable** | La famille croit que Gaspard a livré Odile (LT-16, PR-16). | Secret S5 : rapport RP-02 signé Daubry. N'affecte pas l'arbre mais les fins. |

## 6. À trancher par l'humain

1. Pauline : `modele` leurre (plus dur) ou variante acceptée (plus juste) ? Recommandation : **leurre**,
   car trois pièces disent « blanchisseuse » et une seule (CT-01) dit « modèle ».
2. Lise sous Odile et Orrin (arbre de sang) : confirmé ici ; l'alternative « sous Blanche et Marcel »
   affaiblirait la révélation.
3. Les noms d'épouse acceptés comme variantes : confirmé ici (sinon trop punitif).
