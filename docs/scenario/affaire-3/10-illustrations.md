# 10 — Illustrations de l'affaire 3 : carte, marques, visages

> Livraison du `cartographe` pour « Les Marques de Longuegrève ». Sources : `08-lieux.md` (carte),
> `09-marques.md` (grammaire R1–R8, ids), `04-personnages.md` (visages, âges), `docs/game/AFFAIRE-3.md`
> §1.7 (lisibilité). Même style et mêmes formats que les affaires 1 et 2 (carton 160 × 200, classes
> d'art seulement, ids neutres). Les noms de travail (`lg-…`) sont **internes** : les fichiers et les
> pièces n'emploient que les ids neutres (`lg-portrait-xxxxxx`) de
> `art/tools/portraits/ids-marques-de-longuegreve.json`, qui **fait foi** (09 §4).
>
> Total : **73 dessins** dans `content/cases/marques-de-longuegreve/portraits/` : 34 marques
> (23 justes + 11 leurres) et 39 visages (13 de case + 16 autres âges + 4 leurres + 6 hors case), et
> **30 illustrations de pièces** dans `content/cases/marques-de-longuegreve/illustrations/` (§7).

## 1. La carte

Ajouts à la carte du monde (`art/tools/world.py`, sorties `art/map/*.svg` et `content/world/`) :

| Élément | Où | Détail |
|---|---|---|
| Île de **Longuegrève** | `ISLANDS` (7ᵉ île) | Île longue et basse nord-sud, côte ouest presque droite (la Longue Grève), falaises basses à l'est. |
| Lieu `longuegreve` (`landmark`) | **x 0,054 · y 0,530** | Vignette : grève pointillée et grains d'ambre, trois bornes des lanières, quatre pignons ruinés, chapelle en ruine, croix du cimetière, feu de la pointe du Feu au nord, sternes. |
| Lieu `cabanes-d-ambre` (`village`) | **x 0,110 · y 0,566** | Vignette : jetée sur pilotis et barque, atelier de taille (longue halle), cabanes, hangar de l'Amicale, chapelle de planches. |
| Route côtière | `ROADS_MINOR_3` | Cabanes → route de Bains (raccord au point le plus proche), puis Port-Sénane par la route existante et le bac de l'estuaire. Aucun pont. |
| La **passe** | `PASSE` | Tireté fin (`ink-soft`) de la jetée des Cabanes à la côte est de l'île. |
| Fiches de lieu | `content/world/places/` | `longuegreve.json`, `cabanes-d-ambre.json` (nouvelles) ; `golfe-d-ambre.json` (« Parmi ses îles, Longuegrève, inhabitée depuis 1908. ») et `port-senane.json` (« Comptoir des Ambres ») enrichies ; traductions dans `content/world/locales/en.json`. |

**Écarts aux positions de 08-lieux** (0,050 · 0,520 et 0,112 · 0,530) : l'île descend de 0,010 et
s'écarte de 0,004 pour ne pas mordre le libellé « estuaire » ni le grand libellé du golfe ; les Cabanes
descendent de 0,036 pour dégager la vignette du trois-mâts et faire face à l'île. Conséquences pour la
bible (à reporter par le `scenariste` dans `docs/monde/00-monde.md` et `08-lieux.md`) : Cabanes →
Port-Sénane ≈ **5,3 lieues** à vol d'oiseau (la bible dit « un peu plus de 4 ») ; Longuegrève →
Cabanes ≈ **4,9 lieues** de passe.

**Stabilité du tirage** : relief et vagues sont tirés sur le champ **sans** les ajouts
(`Field.legacy()`), puis masqués autour de l'île ; hors de la zone ajoutée, la carte est identique à
l'octet (diff : relief 12 lignes, water 10, base 6). `labels.svg` est inchangé (les deux libellés sont
dans `places.svg`, comme les autres lieux).

## 2. Les marques : grammaire graphique

Générateur : `art/tools/marques/` (`marks.mjs` grammaire et dessin, `catalog.mjs` les 34 marques,
`build.mjs` les cartes). Le code de travail est la **cote LX** de la bible (`Y-g-tP`, `A-b`,
`P-pt-pt`…) ; la main de Marest (`Y-g+P`, `A/`, `P··`) est acceptée en entrée et ramenée à la cote LX
(`toLx`). La description verbale normalisée (09 §2) est produite par `describe(code)` et sert de nom
accessible.

Gabarit (pied = 100 unités ; repère : sommet du pied en 0, 0) :

| Signe | Règle | Dessin |
|---|---|---|
| Tête `Y` Fourche | R1 Goémard | deux branches en V, de ±15 au sommet jusqu'au pied (23 de haut) |
| Tête `O` Œil | R1 Oyard | losange fermé, 24 de haut, 24 de large, posé sur le pied |
| Tête `A` Flèche | R1 Cormaud | chevron Λ dont la pointe est le sommet du pied (23 de haut, ±15) |
| Tête `P` Potence | R1 Lestaud | trait horizontal de 19 vers la **droite**, au sommet du pied |
| Pied | — | trait vertical de 0 à 100 |
| Entailles `-g` / `-d` | R3 rang, une par génération depuis 1868 | traits horizontaux de 12, côté gauche ou droit, à 40, 55, 70 du haut (sous une barre : 55, 70, 85) |
| Barre `-b` | R6 enfant de mer | oblique bas-gauche → haut-droite, de (-9, 41) à (9, 29), centrée à 35 |
| Grains `-pt`, `-pt-pt` | R4 fille | disques de **8** de diamètre à droite de la tête (au-delà de la Potence pour `P`), 6 d'écart entre deux grains |
| Talon `-tX` | R5 épouse, maison natale | tête de la maison natale réduite à **0,4**, sur un court pied à elle, **sous** le pied, 13 plus bas (≥ 6 de blanc), trait 0,72 fois plus fin |
| `mer` (D3) | annonce R6 | pied barré sans tête |
| `X` (D9) | R7 copie de commis | croix de Saint-André, sans pied |
| D10, D11 | R7 gravures | trait de **graveur** (creux cerné régulier, rempli de hachures) : Fourche couronnée dans un double ovale (sceau du Comptoir) ; un pied et les quatre têtes superposées dans un cartouche de géomètre |

Trait : **droit, sans courbe**, extrémités évasées (« taillé au couteau ») ; 6,2 unités au milieu,
plus large aux bouts, soit ≥ 4 px à 72 px (AFFAIRE-3 §1.7). Aucune tête n'est une lettre ni un symbole
existant : la Fourche reste en V sur pied court, la Potence n'a qu'un bras, la couronne de D10 est
une couronne de marchand, pas un trident.

**Trois rendus** (`renderMarkBody(code, { style })`, 09 §6) ; les cartes de case emploient le
**relevé** :

- `releve` (carnet de Marest) : trait net plein, sur papier quadrillé à marge carmin ;
- `taillee` (bois, pierre) : creux plein, lèvre éclairée (`rehaut`) décalée en bas à droite, ombre
  (`ombre`) dans le creux ; fond de planche (`wash-sienne`, fil du bois) ;
- `tracee` (registre) : plume appuyée et tremblée, même épaisseur ; fond réglé de registre ;
- `gravure` (D10, D11) : voir ci-dessus ; c'est le seul rendu de ces deux leurres.

**Aucun code n'est écrit sur les cartes** : un code en clair hors des relevés CN-01–CN-03 ruinerait la
déduction (`docs/level/longuegreve.md` §12.4 et §13). Pour illustrer ces relevés,
`markCard(m, { showCode: true })` note la cote LX au crayon (`label-note`) à côté de la marque.

## 3. Les 34 marques (ids)

Fichier : `content/cases/marques-de-longuegreve/portraits/<id neutre>.svg`. La colonne « id neutre » est
celle de 09 §4–§5 (identique).

| Travail | Id neutre | Code (LX) | Case / leurre | Personne ou support |
|---|---|---|---|---|
| `lg-m-y` | `lg-portrait-9e0e20` | `Y` | C01 | Gervais Goémard |
| `lg-m-y-t-o` | `lg-portrait-375fdd` | `Y-tO` | C02 | Perrine Oyard |
| `lg-m-o` | `lg-portrait-aa93f2` | `O` | C03 | Clovis Oyard |
| `lg-m-o-t-a` | `lg-portrait-5bbc8d` | `O-tA` | C04 | Toinette Cormaud |
| `lg-m-a` | `lg-portrait-5ce728` | `A` | C05 | Siméon Cormaud |
| `lg-m-a-t-p` | `lg-portrait-7f010c` | `A-tP` | C06 | Ursule Lestaud |
| `lg-m-p` | `lg-portrait-8084e7` | `P` | C07 | Lubin Lestaud |
| `lg-m-p-t-y` | `lg-portrait-6ff69c` | `P-tY` | C08 | Apolline Goémard |
| `lg-m-y-g` | `lg-portrait-df3f6c` | `Y-g` | C09 | Josse Goémard |
| `lg-m-y-g-t-p` | `lg-portrait-3f8d58` | `Y-g-tP` | C10 | Reine Lestaud |
| `lg-m-p-pt` | `lg-portrait-87e85e` | `P-pt` | C10 (fille) | Reine Lestaud, 1868–1879 |
| `lg-m-o-g-t-y` | `lg-portrait-309b85` | `O-g-tY` | C11 | Jacquette Goémard |
| `lg-m-y-pt` | `lg-portrait-804ae3` | `Y-pt` | C11 (fille) | Jacquette Goémard, 1868–1876 |
| `lg-m-o-g` | `lg-portrait-4db872` | `O-g` | C12 | Médard Oyard |
| `lg-m-y-d` | `lg-portrait-480ba1` | `Y-d` | C13 | Blaise Goémard |
| `lg-m-p-g-t-o` | `lg-portrait-ff741e` | `P-g-tO` | C15 | Ernestine Oyard |
| `lg-m-o-pt` | `lg-portrait-ea5469` | `O-pt` | C15 (fille) | Ernestine Oyard, 1869–1877 |
| `lg-m-p-g` | `lg-portrait-d9a1bf` | `P-g` | C16 | Fulbert Lestaud |
| `lg-m-p-d` | `lg-portrait-fdaeee` | `P-d` | C17 | Benoît Lestaud |
| `lg-m-a-b` | `lg-portrait-84365f` | `A-b` | C19 | Noël Cormaud |
| `lg-m-a-b-t-p` | `lg-portrait-99db1b` | `A-b-tP` | C20 | Honorine Lestaud |
| `lg-m-p-pt2` | `lg-portrait-1b4408` | `P-pt-pt` | C20 (fille) | Honorine Lestaud, 1876–1885 |
| `lg-m-o-g-g` | `lg-portrait-9cb0f2` | `O-g-g` | C23 | Elzéar Oyard |
| `lg-m-a-g` | `lg-portrait-97cb44` | `A-g` | D1 | Jean Cormaud, noyé en 1869 |
| `lg-m-a-d` | `lg-portrait-c33099` | `A-d` | D2 | Yves Cormaud, noyé en 1869 |
| `lg-m-mer` | `lg-portrait-ab4b4b` | `mer` (Marest `/`) | D3 | marque de mer |
| `lg-m-o-d` | `lg-portrait-29ab43` | `O-d` | D4 | Ange Oyard |
| `lg-m-y-pt2` | `lg-portrait-12b71b` | `Y-pt-pt` | D5 | Marthe Goémard |
| `lg-m-y-g-g` | `lg-portrait-d18c08` | `Y-g-g` | D6 | aviron de Gatien |
| `lg-m-a-b-g` | `lg-portrait-ed16c7` | `A-b-g` | D7 | aviron de Lazare |
| `lg-m-p-g-pt` | `lg-portrait-4439b6` | `P-g-pt` | D8 | Delphine Lestaud |
| `lg-m-x` | `lg-portrait-3f2b8f` | `X` | D9 | copie du commis (RG-09) |
| `lg-m-fourche-couronnee` | `lg-portrait-9b5710` | — | D10 | marque de commerce du Comptoir (gravure) |
| `lg-m-ile` | `lg-portrait-e5dfe7` | — | D11 | cartouche du plan de 1868, cloche (gravure) |

## 4. Les visages (39)

Générateur : `art/tools/portraits/` (même figure paramétrique que les affaires 1 et 2,
`people-longuegreve.mjs`, entrée `marques-de-longuegreve` de `cases.mjs`). Ajouts à `figure.mjs`, tous
optionnels (les 102 portraits des affaires 1 et 2 sont **identiques à l'octet**) : sourcils en accent
circonflexe (`brows.circ`), pouce coupé (`hands[].thumbCut`), oreilles décollées réglables
(`marks.earsOut`), cheveux bouclés en croissants (`HAIR.curly` + `curlLight`), tablier ciré à bavette
(`apron.bib`, `shine`), fichu noué sous le menton (`fichuChin`), lunettes rondes rafistolées
(`roundMended`), robe à col marin (`sailorDress`), accessoires `bookOpen`, `cahier`, `binoculars`,
`amberBrooch`, `amberCharm`, `pincushion`, `capInHand`, `oar` (avec, en option, une petite marque taillée
sur le manche).

**Traits héréditaires** (indices de jeu, toujours du même côté, lisibles à 96 px) :

1. **Sourcils Goémard** : en accent circonflexe, épais, pointe au milieu (air étonné) : Gatien,
   Léandre, Félix, Edmée.
2. **Yeux Oyard** : iris gris très pâle, plus clair que la peau : Victoire, Rose, Marin.
3. **Oreilles Lestaud** : grandes, décollées, lobe long détaché : Clément, Aline.
4. **Cheveux de Noël** : bouclés serrés, noirs puis gris : Lazare, Marin (personne d'autre).

Signes individuels : pouce droit coupé de Gatien (à partir de 31 ans ; absent à 24 et 26), cicatrice au
menton de Félix, lorgnon de Sidonie, broche d'ambre à insecte d'Edmée, breloque d'ambre de Léandre.

### Portraits de case (13)

| Travail | Id neutre | Case | Âge (pièce) | Constantes dessinées |
|---|---|---|---|---|
| `lg-amelie-42` | `lg-portrait-ce8a17` | C14 Amélie Ferlay | 42 (PH-17) | chignon bas, lunettes demi-lune, col haut, livre ouvert contre la poitrine |
| `lg-sidonie-43` | `lg-portrait-fe0b68` | C18 Sidonie Brémoy | 43 | chignon haut, lorgnon, châle |
| `lg-gatien-31` | `lg-portrait-e96e7a` | C21 Gatien Goémard | 31 (PH-04, PH-05) | sourcils Goémard, tablier de cuir, manches retroussées, main au pouce droit coupé |
| `lg-leontine-22` | `lg-portrait-d4d582` | C22 Léontine Sauvat | 22 (PH-06) | robe claire à col marin, pelote à épingles au poignet |
| `lg-victoire-71` | `lg-portrait-a95577` | C24 Victoire Oyard | 71 (OF-08) | yeux Oyard, fichu noir noué sous le menton, lunettes rafistolées |
| `lg-lazare-27` | `lg-portrait-491490` | C25 Lazare Cormaud | 27 | cheveux de Noël (noirs), col cassé |
| `lg-clement-30` | `lg-portrait-49c2e9` | C26 Clément Lestaud | 30 | oreilles Lestaud, vareuse, foulard, bonnet à la main |
| `lg-leandre-32` | `lg-portrait-e1d3e2` | C27 Léandre Garnaud | 32 | sourcils Goémard, moustache, raie au milieu, chaîne, breloque d'ambre |
| `lg-felix-65` | `lg-portrait-c65073` | C28 Félix Goémard | 65 | sourcils Goémard, cicatrice au menton, casquette de patron, vareuse |
| `lg-rose-54` | `lg-portrait-662e9a` | C29 Rose Oyard | 54 (PH-10) | yeux Oyard, tablier ciré, aviron de son père dans les bras |
| `lg-marin-57` | `lg-portrait-78d8f1` | C30 Marin Cormaud | 57 | cheveux de Noël (gris), blouse, crayon à l'oreille |
| `lg-aline-51` | `lg-portrait-f759a5` | C31 Aline Lestaud | 51 | oreilles Lestaud, cheveux courts, ciré, jumelles |
| `lg-edmee-56` | `lg-portrait-85b5d9` | C32 Edmée Garnaud | 56 | sourcils Goémard, coque grise, tailleur, broche d'ambre à insecte |

### Autres âges (16, `altPortraits`)

| Travail | Id neutre | Case | Âge (pièce) |
|---|---|---|---|
| `lg-amelie-31` | `lg-portrait-95b651` | C14 | 31 (PH-01), sans lunettes |
| `lg-sidonie-33` | `lg-portrait-7796db` | C18 | 33 (PH-02), cahier serré contre elle |
| `lg-sidonie-66` | `lg-portrait-589649` | C18 | 66 (PH-12) |
| `lg-gatien-24` | `lg-portrait-dbca34` | C21 | 24 (CP-01), pouce intact |
| `lg-gatien-26` | `lg-portrait-b6e782` | C21 | 26 (PH-03), pouce intact |
| `lg-leontine-24` | `lg-portrait-823a60` | C22 | 24 (PH-05) |
| `lg-victoire-15` | `lg-portrait-88a379` | C24 | 15 (PH-03) |
| `lg-victoire-20` | `lg-portrait-10fa0d` | C24 | 20 (PH-05) et 19 (PH-04) |
| `lg-lazare-22` | `lg-portrait-b40d83` | C25 | 22 (PH-03) |
| `lg-clement-25` | `lg-portrait-4a21bb` | C26 | 25 (PH-03) |
| `lg-leandre-68` | `lg-portrait-1e2c79` | C27 | 68 (portrait peint, PH-07) |
| `lg-felix-52` | `lg-portrait-259dd9` | C28 | 52 (PH-09) |
| `lg-rose-25` | `lg-portrait-491ae6` | C29 | 25 (PH-16) |
| `lg-marin-44` | `lg-portrait-3a4965` | C30 | 44 (PH-10) |
| `lg-aline-36` | `lg-portrait-fc8ada` | C31 | 36 (PH-11) |
| `lg-edmee-29` | `lg-portrait-b92caf` | C32 | 29 (PH-07) |

### Leurres de visage (4)

| Travail | Id neutre | Qui | Pourquoi |
|---|---|---|---|
| `lg-leurre-leandre-9` | `lg-portrait-0f71b8` | Léandre enfant (PH-01, 9 ans) | Pas un âge accepté ; costume marin, pourrait passer pour un frère de Blaise. |
| `lg-leurre-fontanet` | `lg-portrait-f30a8a` | l'inspecteur Fontanet (PH-18, 1977) | Homme de l'époque d'Aline, sans trait de famille. |
| `lg-leurre-berthe-marie` | `lg-portrait-8ac94a` | Berthe-Marie (PH-12, 1930), **33 ans**, cheveux bruns | Même lorgnon que Sidonie ; à 33 ans, se confond avec `lg-sidonie-33`. (Était dessinée à 64 ans : incompatible avec une fille née en 1931.) |
| `lg-leurre-tenier` | `lg-portrait-fe5f0c` | Ténier, patron de la vedette *Trident* (PH-03, 1908), 48 ans | Barbe grise pleine, casquette de marin, chandail : un homme d'âge et de mer plausibles, sans trait de famille. |

### Visages hors case (6)

Personnes à marque qui paraissent sur les photos. Aucune n'a de case de visage : ces portraits existent
pour que les photos de groupe soient cohérentes, et peuvent servir de leurres dans la galerie (proposition
au `game-designer` : « personne à marque », non branché). Groupe `hors-case` dans
`people-longuegreve.mjs`.

| Travail | Id neutre | Qui | Âge (pièce) | Constantes |
|---|---|---|---|---|
| `lg-blaise-35` | `lg-portrait-340d3e` | Blaise Garnaud | 35 (PH-01) | moustache, raie de côté, épingle de cravate d'ambre |
| `lg-benoit-47` | `lg-portrait-f47e16` | Benoît Lestaud | 47 (PH-03) | oreilles Lestaud, casquette, vareuse à boutons |
| `lg-noel-52` | `lg-portrait-d75077` | Noël Cormaud | 52 (PH-05) ; 45 en CP-01 (moustache courte) | cheveux de Noël (gris), moustache |
| `lg-honorine-48` | `lg-portrait-af7bd4` | Honorine Lestaud | 48 (PH-05) | chignon bas |
| `lg-jacquette-56` | `lg-portrait-0df611` | Jacquette Goémard | 56 (PH-03) ; 61 en PH-05 | chignon haut gris, col de dentelle |
| `lg-reine-58` | `lg-portrait-03c5f6` | Reine Lestaud | 58 (PH-06) | coiffe nouée, fuseau en main sur la photo |

## 5. Choix et écarts

1. **Âges fondus** : les âges à un an près partagent un portrait, comme dans l'affaire 2 : Gatien 30
   (PH-06) prend `lg-gatien-31`, Victoire 19 (PH-04) prend `lg-victoire-20`. Si le `level-designer`
   veut un dessin distinct, ajouter une ligne dans `people-longuegreve.mjs` puis
   `--assign-ids` (les autres ids ne bougent pas).
2. **Talon à 0,4** au lieu du tiers (09 §6, AFFAIRE-3 §1.7) : au tiers, la petite tête mesure ≈ 3 px à
   72 px et l'Œil se confond avec un grain ; à 0,4, les quatre petites têtes restent distinctes.
3. **Entailles sous la barre** à 55, 70, 85 (au lieu de 40, 55, 70) : la barre occupe 29–41 ; plus
   haut, « barre puis entaille » se lisait comme une seule figure à 72 px.
4. **Grains de 8** (AFFAIRE-3 §1.7 corrige les 4 de 09 §6) et **trait de 6,2** : appliqués.
5. **Pas de code sur les cartes** (09 §6 prévoyait « code écrit à côté » pour le relevé) : remplacé par
   l'option `showCode`, réservée aux relevés CN-01–CN-03 (level §12.4).
6. **Elzéar** : pas de visage (04 : « il fuyait les photographes »). Les personnes à marque n'ont pas de
   visage de case ; leurs visages éventuels sur les photos de groupe sont à dessiner avec les pièces
   (§7).
7. **Teintes de maison** (photos de groupe, plan RG-06) : Goémard sienne, Oyard indigo, Cormaud
   ardoise, Lestaud indigo et safran, Garnaud carmin et indigo.
8. **« L'abbé Ténier »** (commande) : la bible n'a pas d'abbé Ténier. Ténier est le patron de la vedette
   *Trident* (RP-03) ; le prêtre est l'abbé Fortuné Rabier. Dessiné : Ténier, en leurre, à la barre de la
   vedette dans PH-03. Aucun visage d'abbé.
9. **Enfants et âges hors portraits** : les âges sans portrait (Victoire 4 et 15, Lazare 11, Clément 14,
   Gatien 15, Léandre 9) sont tirés du portrait le plus proche, rajeuni (`longuegreve/cast.mjs`, table
   `AGES` : coupe au bol et robe blanche pour Victoire petite, blouses d'écolier, pas de moustache avant
   18 ans).

## 6. Générer, contrôler, budgets

```bash
python3 art/tools/build.py                        # carte (sous flock /tmp/arbre-build.lock)
node art/tools/portraits/build.mjs --case marques-de-longuegreve   # 32 visages (+ --assign-ids pour un nouveau)
node art/tools/marques/build.mjs                  # 34 marques (+ --assign-ids, --sheet <dir> : planches)
node art/tools/illustrations/build.mjs --case marques-de-longuegreve   # 30 illustrations + table des alt
node art/tools/illustrations/sheet.mjs <out.png> <cols> <largeur> <fichiers.svg…>   # planche-contact
npm run content:check                             # règles 8 (SVG) et 9 (budgets)
```

Tout est déterministe (graines tirées des noms de travail et des ids de pièce ; carte `SEED = 1974`).
Budgets (règle 9, 25 Ko gzip par portrait, 60 Ko par illustration) : marques 0,5–0,6 Ko, visages
7–10,9 Ko, illustrations 0,8–33,7 Ko (les plus lourdes : PH-02 33,7, PH-03 31,9, PH-05 31,6, CP-01 29,5) ; carte dans les budgets
de couche. Classes d'art seulement : aucun `fill="#…"`, `style=`, script, `foreignObject` ni lien
externe (66 fichiers, 0 problème au contrôle du projet). `content:check` : OK ; l'affaire est en
brouillon (pas de `case.json`), ses SVG sont contrôlés mais elle n'est pas compilée.

## 7. Les illustrations des pièces (30)

Générateur : `art/tools/illustrations/longuegreve/` (`cast.mjs` distribution, âges, marques taillées,
avirons, croix ; `photos.mjs`, `objects.mjs`, `papers.mjs` scènes ; `alts.mjs` textes alternatifs),
branché dans `art/tools/illustrations/build.mjs`. Les visages sont ceux des portraits (`figure.mjs`),
les marques celles de `marques/marks.mjs` (`taillee` sur bois et pierre, `releve` dans les carnets,
`gravure` pour D10 et D11). La table `art/tools/illustrations/longuegreve/illustrations.json`
(`{ id: { file, alt } }`) fournit l'alt à reprendre dans le frontmatter.

À référencer dans la pièce : `illustration: { file: illustrations/<id>.svg, alt: … }`.

| Pièce | Fichier | Ce que montre l'image | Visages (âge) | Marques lisibles |
|---|---|---|---|---|
| PH-01 | `illustrations/ph-01.svg` | Stand du Comptoir à la Grande Exposition (1889), vitrines d'ambre ; légende du carton « M. et Mme B. Garnaud et leur fils » | Blaise 35, Amélie 31, leurre Léandre 9 | D10 au fronton |
| PH-02 | `illustrations/ph-02.svg` | École de Longuegrève (1897), groupe devant le mur de briques | Sidonie 33 (Victoire 4 sur ses genoux), Clément 14, Lazare 11, Gatien 15, figurants | aucune |
| PH-03 | `illustrations/ph-03.svg` | Tirage bordé de noir : évacués sur la jetée des Cabanes (1908), vedette *Trident* | Ténier (leurre) à bord ; Benoît 47, Sidonie 43 (cahier), Jacquette 56, Victoire 15, Gatien 26, Lazare 22, Clément 25 | aucune |
| PH-04 | `illustrations/ph-04.svg` | Atelier des Cabanes (1912), établis, ambre sur les plateaux | Léandre 32 debout, Gatien 31 et Victoire 19 assis, ouvriers | aucune |
| PH-05 | `illustrations/ph-05.svg` | Noce de Lazare et Victoire (26.4.1913), en plein air ; légende illisible | Noël 52, Honorine 48, Jacquette 61, Victoire 20, Lazare 27, Clément 30, Gatien 31, Léontine 24 (Félix nourrisson) | aucune |
| PH-06 | `illustrations/ph-06.svg` | Noce de Gatien et Léontine, devant une maison de planches ; verso « 14.X.1911 » | Reine 58 (fuseau), Gatien 30 (pouce intact visible de face), Léontine 22 | aucune (fuseau trop petit) |
| PH-07 | `illustrations/ph-07.svg` | Salle d'exposition (1950), portrait peint entre deux vitrines | Léandre 68 (peint), Edmée 29 | aucune |
| PH-08 | `illustrations/ph-08.svg` | Manteau de cheminée de l'hôtel Garnaud ; « ORC 77-0874 — 11.10.77 » | — | `Y-d` taillée, « 1898 » |
| PH-09 | `illustrations/ph-09.svg` | Cimetière de l'île (1964) ; verso « 29 août 64 » | Victoire 71 (penchée), Félix 52 (chapeau sur la poitrine) | **seule la croix de Clovis** (`O`) ; les autres croix illisibles |
| PH-10 | `illustrations/ph-10.svg` | Hangar des Cabanes (5.9.1964) : quatre avirons pelle en l'air, établi | Marin 44, Rose 54 | avirons, de gauche à droite : `A-b` (Noël), `A-b-g` (Lazare), `O-g-g` (Elzéar), `Y-g-g` (Gatien) ; établi : fuseau `Y-g-tP` (Reine), tampon à pain `P-g-tO` (Ernestine), **navette `A-tP` (Ursule)** |
| PH-11 | `illustrations/ph-11.svg` | Baguage de sternes sur la Longue Grève (1961) | Aline 36 (buste) | aucune |
| PH-12 | `illustrations/ph-12.svg` | Jardin à treillage, Bains-de-Mérande (1930) | Sidonie 66 assise, leurre Berthe-Marie 33 | aucune |
| PH-13 | `illustrations/ph-13.svg` | Coupure de *L'Écho* (15.10.1977) : portrait au bureau, devant une vitrine ; titre et texte en faux-texte | Edmée 56 (buste) | aucune |
| PH-14 | `illustrations/ph-14.svg` | Coupure de *L'Écho* (15.10.1977) : deux hommes sur la jetée, bateau de pêche au mouillage (nom illisible) | Marin 57, Félix 65 | aucune |
| PH-15 | `illustrations/ph-15.svg` | Stèle « Blaise Garnaud, 1854 – 1924 », devise ; « ORC 77-0874 — cimetière de Port-Sénane » | — | `Y-d` taillée |
| PH-16 | `illustrations/ph-16.svg` | Étal de la halle (vers 1935), poissons, balances, ardoise | Rose 25 (buste) | aucune |
| PH-17 | `illustrations/ph-17.svg` | Devanture « Librairie Ferlay » (vers 1900) | Amélie 42 | aucune |
| PH-18 | `illustrations/ph-18.svg` | Ruine de l'île (1976), linteau | Aline 51, leurre Fontanet | `Y` taillée (petite) au linteau |
| CP-01 | `illustrations/cp-01.svg` | Carte « Nos côtes — Longuegrève : la grève aux ambres », « Phototypie de l'Orvelle » ; verso en vignette | Gatien 24 au premier plan, Noël 45 derrière, ramasseurs au loin | aucune |
| CP-02 | `illustrations/cp-02.svg` | Carte « Port-Sénane — Les Cabanes d'Ambre » ; verso en vignette | — | aucune |
| OB-01 | `illustrations/ob-01.svg` | Aviron en diagonale, loupe sur le manche | — | `A-b` taillée, « 1872 » |
| OB-03 | `illustrations/ob-03.svg` | Cloche « LONGUEGRÈVE 1868 » | — | les quatre têtes en relief, D11 en cartouche |
| OB-04 | `illustrations/ob-04.svg` | Étiquette de caisse « Comptoir des ambres, B. Garnaud & Cie — Port-Sénane », « qualité Grève », devise | — | D10 |
| OB-05 | `illustrations/ob-05.svg` | Linteau de la « maison du feu » : « 1890 », « S.B. » | — | `P-d` taillée |
| CT-01 | `illustrations/ct-01.svg` | Catalogue 1912 : photo « G. Goémard, tailleur » ; Colliers 12 fl., Broches 4 fl., Vernis à l'ambre | Gatien 31 (buste à l'établi) | D10 |
| PB-01 | `illustrations/pb-01.svg` | Affiche « L'Ambre de Longuegrève », « depuis 1886 », « Imp. lith. Dumesnil-Corre » | — | D10 |
| CN-01 | `illustrations/cn-01.svg` | Carnet n° 3, planche II, 29.8.64 : croix relevées au calque, noms de Victoire | — | 14 relevés (`releve`) ; **cotes au crayon** `A-g` (Jean), `A-d` (Yves) |
| CN-02 | `illustrations/cn-02.svg` | Carnet n° 3, planche III, 5.9.64 : avirons, caisses, linteaux ; note « Flèche barrée » | — | 8 relevés + linteau `P-d` « 1890 S.B. » ; **cotes au crayon** `A-b` (Noël), `A-b-g` (Lazare) seulement (pas d'`O-g-g`) |
| CN-03 | `illustrations/cn-03.svg` | Carnet n° 3, planche IV, sept. 64 : étiquette, cloche du Môle, cheminée de l'hôtel Garnaud | — | D10, D11, `Y-d` « 1898 » ; aucune cote écrite |
| RG-06 | `illustrations/rg-06.svg` | Plan « Cadastre des îles, feuille 4 — Longuegrève » : quatre lanières, hameau de 14 maisons, chapelle, cimetière, « La Longue Grève », crayon « feu (1872) », nord, échelle « 1 000 toises » ; cartouche « levé le 7 juillet 1868 », « C. Mérel, géomètre » | — | D11 au cartouche |

**Codes écrits** : seulement les cotes au crayon de CN-01 et CN-02 (bible v0.2 ; OF-05 et OF-06 sont
des pièces de texte du `scenariste`). Aucune image ne porte de code en clair ailleurs ; les alt n'en
écrivent aucun.

## 8. Signalements et ce qui reste

- **CN-01, nombre de croix** : le corpus dit « treize croix » mais sa liste en donne 14 (« Aurore »
  deux fois). Dessiné : **14** relevés. *Réglé (v1.0) : le texte dit « quatorze croix, dont un cénotaphe ».*
- **CN-02 et `O-g-g`** : 06-corpus (l. 17 et vers l. 1048) et 09-marques disent encore que CN-02 note
  `O-g-g`. Dessiné selon la v0.2 : pas d'`O-g-g` au crayon. *Réglé (v1.0) : bible alignée.*
- **RG-06, ordre des lanières** du nord au sud : Lestaud (safran), Goémard (sienne), Oyard (indigo),
  Cormaud (ardoise). Choix du `cartographe`. *Reporté dans `08-lieux.md` §2 et dans RG-06 (v1.0).*
- **`P-d`** (OB-05, CN-02) ressemble à un « F » : propriété de la grammaire (Potence + entaille à
  droite). À garder en tête pour la lisibilité ; pas de changement proposé sans le `level-designer`.
- **Aviron du portrait de Rose** (`lg-portrait-662e9a`) : porte déjà une petite marque `O-g-g` taillée
  (livraison précédente) ; cohérent avec PH-10.
- **Bible** : reporter les positions ajustées et les distances (§1) dans `docs/monde/00-monde.md` et
  `08-lieux.md` (périmètre du `scenariste`).
- **Frontmatter des pièces** : `illustration.file` et `alt` à reprendre de la table §7 et de
  `illustrations.json` (périmètre du `scenariste`).
