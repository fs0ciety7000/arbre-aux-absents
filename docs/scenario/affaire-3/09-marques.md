# 09 — Grammaire des marques et catalogue (affaire 3)

> Ce que le joueur doit pouvoir **déduire** seul, sans savoir extérieur, à partir des pièces. Les
> règles sont annoncées dans le jeu par **OF-05** (carnet de Solange Marest, planche I, pièce de
> départ), reprises de vive voix par Victoire (**BD-01**) et par une écolière de 1903 (**DV-02**) ;
> l'exception est annoncée par **OF-05**, **BD-03** et **PV-05**. Source des dates : `03-chronologie.md`.
> Une marque est un `PortraitId` comme un visage (contrat inchangé, `02-arbre.md` §4) ; ce fichier fixe
> son dessin, sa **description verbale normalisée** (texte alternatif et lecteur d'écran) et son
> **code** dans la notation Marest (indexé par le Lecteur, OF-06).

## 1. Le principe (ce que dit la planche I)

À Longuegrève, personne ne signait : on **faisait sa marque**, au couteau sur les avirons, les
caisses, les fuseaux, les tampons à pain, les linteaux et les croix, à la plume (en tremblant) sur les
registres de la Grand-Terre. Depuis la matrice de 1868, une marque se compose d'un **pied** (trait
vertical) et d'une **tête** (la figure du haut) ; on y ajoute des signes selon qui l'on est. **La
marque dit la maison, le rang, le sexe et le mariage. Elle ne dit pas l'âge ni le prénom.**

## 2. Les règles (R1–R8)

**R1 — La tête, c'est la maison.** Quatre têtes, taillées en traits droits (le couteau ne fait pas de
courbes) :

| Code | Nom insulaire | Dessin | Maison |
|---|---|---|---|
| `Y` | la **Fourche** | deux branches en V au sommet du pied | **Goémard** |
| `O` | l'**Œil** | un losange fermé posé sur le pied | **Oyard** |
| `A` | la **Flèche** | un chevron pointe en haut (Λ) coiffant le pied | **Cormaud** |
| `P` | la **Potence** | un trait horizontal qui part **à droite** du sommet du pied | **Lestaud** |

**R2 — Le pied lisse, c'est un chef de 1868 (« la marque pleine »).** En 1868, pour la matrice, les
quatre chefs ont « fait leurs marques neuves » : la tête seule. Les marques d'avant 1868 (vieilles
croix) suivaient la même idée mais comptaient depuis des chefs oubliés ; **on ne les lit pas**, et
aucune n'est dans l'arbre.

**R3 — Le fils : la marque du père et une entaille.** Chaque fils reprend la marque entière de son
père et ajoute **sous** les entailles du père une **entaille** (court trait horizontal d'un seul côté
du pied) : à **gauche** pour l'**aîné** (`-g`), à **droite** pour le **puîné** (`-d`). Il n'y a que deux
entailles : « le troisième n'avait pas de lanière, il partait sans marque » (BD-01). Conséquence :
**le nombre d'entailles est le nombre de générations depuis le chef de 1868**, et on les lit de haut en
bas comme un chemin (`O-g-g` = l'aîné de l'aîné de Clovis Oyard).

**R4 — La fille : la marque du père et un grain.** Jusqu'à son mariage, une fille marque comme son
père, avec un **grain** (point creusé) **à droite de la tête** : un pour l'**aînée** (`·`), deux pour la
**cadette** (`··`). Les filles n'ont pas d'entaille.

**R5 — L'épouse : la marque du mari et un talon.** Mariée, elle prend la marque entière de son mari
et taille **sous le pied** une **petite tête de sa maison natale** : le **talon** (`+X`). Elle le garde
veuve. Sa marque de fille ne sert plus (mais reste sur les pièces d'avant son mariage).

**R6 — L'exception : l'enfant de mer (annoncée par OF-05, BD-03, PV-05).** Un enfant que la mer a
donné (trouvé vivant sur la grève) et qu'une maison élève prend la **tête de cette maison**, mais au
lieu d'une entaille on lui **barre le pied** : un trait oblique qui traverse le pied sous la tête
(`/`). « Il est de la maison, il n'est pas du sang. » Ses fils ajoutent leurs entailles **sous la
barre** ; sa femme prend son talon comme les autres. Seule, sans tête, la barre est la **marque de
mer** : celle qu'on taille sur la croix d'un noyé inconnu.

**R7 — Seule compte la marque de l'île.** La marque qu'une personne a tracée ou taillée elle-même
(registre où elle « a fait sa marque », objet qu'elle a taillé) est sa signature (loi de 1973,
art. 15) ; la marque **taillée sur sa croix par les siens** compte aussi (« on taille au mort la
marque qu'il faisait », BD-05). **Une marque recopiée par un commis, gravée par un fondeur ou
dessinée par un géomètre n'est qu'un dessin** (leurres D9, D10, D11). Le carnet de Marest est un **relevé** : il
renvoie à l'objet, il ne le remplace pas (ses planches et ses photographies sont des pièces
d'appui, qui montrent la marque autographe sur l'objet).

**R8 — L'âge de la marque.** On recevait sa marque « au premier ambre », vers douze ans (en 1868,
d'un coup, pour tous ceux qui avaient l'âge). Les enfants de l'école (nés à partir de 1879 environ)
**signent** : leur case porte un **visage**, même si leur aviron porte une marque (leurres D6, D7).

**Lecture d'une marque, dans l'ordre** : tête (maison) → barre ? (enfant de mer) → entailles de haut
en bas (rang et générations) → grains (fille) → talon (épouse, et sa maison natale).

### Notation Marest (codes indexés par le Lecteur)

`tête` puis `/` éventuelle, puis `-g` / `-d` de haut en bas, puis `·` / `··`, puis `+tête du talon`.
Exemples : `Y` · `Y-d` · `O-g-g` · `Y·` · `P··` · `Y-g+P` · `A/` · `A/+P` · `A/-g`. Variantes
acceptées par l'index (proposition au `level-designer`) : espaces, tirets ou rien (`Yd`, `Y d`, `Y-d`),
`.` pour `·`, `t` ou `+` pour le talon. Les codes sont des **mots-clés à terme caché** (`hiddenTerm`) :
on ne les trouve qu'en les déduisant, sauf ceux que montrent les pièces.

### Description verbale normalisée (gabarit)

« **[Tête]** ; pied : **[lisse | barré | entaille à gauche, puis …]** ; **[un grain | deux grains]** ;
talon : **[petite Fourche | petit Œil | petite Flèche | petite Potence]** ». Elle suffit seule à
identifier la marque (lecteur d'écran) : jamais « une marque », toujours sa description complète.

## 3. Pourquoi la grammaire est sans ambiguïté (contrôles)

- [x] Les 23 marques justes (19 cases + 4 marques de fille acceptées comme « autres âges ») sont **deux
  à deux distinctes** ; les 11 leurres aussi, et diffèrent toutes des marques justes (§4, §5).
- [x] Toute marque juste se **calcule** depuis l'arbre : tête de la maison du père (ou de la maison
  d'accueil), une entaille par génération depuis 1868, côté selon le rang ; talon = tête de la maison
  natale. Inversement, chaque marque désigne **une seule** place de l'arbre.
- [x] Aucune case n'a deux fils de même rang ; aucun troisième fils dans l'arbre (R3).
- [x] Les seules marques qui changent au cours d'une vie sont celles des filles qui se marient (R4 →
  R5) : les deux sont acceptées dans la case (`altPortraits`).
- [x] Le talon ne se confond jamais avec une entaille : il est **sous** le pied et c'est une tête.
- [x] La Potence (`P`) a son trait **au sommet**, à droite ; une entaille droite est toujours **sous
  le tiers supérieur** du pied. Le dessin le respecte (`cartographe`, §6).
- [x] L'exception (R6) est annoncée avant d'être nécessaire : OF-05 (départ) la donne avec
  l'exemple de la marque de mer ; la première marque barrée d'un vivant n'arrive qu'avec RG-10, RG-15
  ou BD-03.

## 4. Les marques justes (23)

Colonnes : **id de portrait** · code · description verbale · personne (case) · règle · pièces
**autographes** (tracées ou taillées par la personne) · pièces d'appui (croix, relevé, photo, mention). Chaque marque est montrée par **au moins deux pièces** en tout.

| `PortraitId` | Code | Description verbale | Case | Règle | Autographes | Appui |
|---|---|---|---|---|---|---|
| `lg-m-y` | `Y` | Fourche ; pied lisse | C01 Gervais Goémard | R2 | OF-02, RG-05, RG-07, RG-08, RG-24 | CN-01, PH-09, RG-06 |
| `lg-m-y-t-o` | `Y+O` | Fourche ; pied lisse ; talon : petit Œil | C02 Perrine Oyard | R5 | RG-07, RG-08 | CN-01, PH-09 |
| `lg-m-o` | `O` | Œil ; pied lisse | C03 Clovis Oyard | R2 | OF-02, RG-05, RG-07, RG-09 | CN-01, PH-09, DV-02 |
| `lg-m-o-t-a` | `O+A` | Œil ; pied lisse ; talon : petite Flèche | C04 Toinette Cormaud | R5 | RG-07, RG-09 | CN-01, PH-09 |
| `lg-m-a` | `A` | Flèche ; pied lisse | C05 Siméon Cormaud | R2 | OF-02, RG-05, RG-10, RG-19, RG-24 | CN-01, PH-09 |
| `lg-m-a-t-p` | `A+P` | Flèche ; pied lisse ; talon : petite Potence | C06 Ursule Lestaud | R5 | RG-10 | CN-01, PH-09 |
| `lg-m-p` | `P` | Potence ; pied lisse | C07 Lubin Lestaud | R2 | OF-02, RG-05, RG-08, RG-09, RG-10, RG-24 | CN-01, PH-09 |
| `lg-m-p-t-y` | `P+Y` | Potence ; pied lisse ; talon : petite Fourche | C08 Apolline Goémard | R5 | RG-08, RG-09, RG-10 | CN-01, PH-09 |
| `lg-m-y-g` | `Y-g` | Fourche ; pied : entaille à gauche | C09 Josse Goémard | R3 | RG-05, RG-07, RG-08, RG-15, RG-19, RG-24, LT-06 | — |
| `lg-m-y-g-t-p` | `Y-g+P` | Fourche ; pied : entaille à gauche ; talon : petite Potence | C10 Reine Lestaud | R5 | RG-15 | CN-02 (fuseau), PH-10 |
| `lg-m-p-pt` | `P·` | Potence ; pied lisse ; un grain | C10 Reine Lestaud (fille, 1868–1879) | R4 | RG-08 | — |
| `lg-m-o-g-t-y` | `O-g+Y` | Œil ; pied : entaille à gauche ; talon : petite Fourche | C11 Jacquette Goémard | R5 | RG-15, RG-18 | BD-01 (dite) |
| `lg-m-y-pt` | `Y·` | Fourche ; pied lisse ; un grain | C11 Jacquette Goémard (fille, 1868–1876) | R4 | RG-07 | — |
| `lg-m-o-g` | `O-g` | Œil ; pied : entaille à gauche | C12 Médard Oyard | R3 | RG-05, RG-07, RG-08, RG-19, RG-24, LT-06 | BD-01, DV-02 (dites) |
| `lg-m-y-d` | `Y-d` | Fourche ; pied : entaille à droite | C13 Blaise Goémard | R3 | RG-13, RG-20 (déposant), LT-01, LT-05 | CN-03, PH-08 (cheminée, taillée sur son ordre), PH-15 (tombe), EX-01 |
| `lg-m-p-g-t-o` | `P-g+O` | Potence ; pied : entaille à gauche ; talon : petit Œil | C15 Ernestine Oyard | R5 | RG-15 | CN-02 (tampon à pain), PH-10 |
| `lg-m-o-pt` | `O·` | Œil ; pied lisse ; un grain | C15 Ernestine Oyard (fille, 1869–1877) | R4 | RG-09 (original) | — |
| `lg-m-p-g` | `P-g` | Potence ; pied : entaille à gauche | C16 Fulbert Lestaud | R3 | RG-05, RG-07, RG-09, RG-15, RG-19, RG-24, LT-06 | CN-02 (couvercle de caisse) |
| `lg-m-p-d` | `P-d` | Potence ; pied : entaille à droite | C17 Benoît Lestaud | R3 | RG-08, RG-11, RG-15, RG-19, RG-21, RP-04 | OB-05 (linteau), CN-02 |
| `lg-m-a-b` | `A/` | Flèche ; pied barré | C19 Noël Cormaud | **R6** | RG-10, RG-15, RG-18, RG-24, LT-06 | OB-01 (aviron), CN-02, PH-10 |
| `lg-m-a-b-t-p` | `A/+P` | Flèche ; pied barré ; talon : petite Potence | C20 Honorine Lestaud | R5 + R6 | RG-15, RG-18 | — |
| `lg-m-p-pt2` | `P··` | Potence ; pied lisse ; deux grains | C20 Honorine Lestaud (fille, 1876–1885) | R4 | RG-10 | — |
| `lg-m-o-g-g` | `O-g-g` | Œil ; pied : entaille à gauche, puis entaille à gauche | C23 Elzéar Oyard | R3 | RG-15, RG-23 | CN-02 (aviron), PH-10, BD-06 (dite) |

Ernestine (née en 1857) a reçu sa marque en 1869, à douze ans. Les marques de fille des épouses de
la génération I (avant 1868) ne sont pas documentées (R2) : leurs cases n'ont qu'une marque.

## 5. Les leurres (11)

| `PortraitId` | Code | Description verbale | À qui, où | Ce qui l'écarte |
|---|---|---|---|---|
| `lg-m-a-g` (D1) | `A-g` | Flèche ; pied : entaille à gauche | **Jean Cormaud** (1844–1869), noyé ; croix (CN-01, PH-09) ; exemple d'OF-05 | Mort en 1869 ; hors arbre. Prouve que l'aîné de Siméon est mort. |
| `lg-m-a-d` (D2) | `A-d` | Flèche ; pied : entaille à droite | **Yves Cormaud** (1846–1869), noyé ; croix | Idem : Siméon n'a plus de fils de sang. |
| `lg-m-mer` (D3) | `/` | Pied barré, sans tête (marque de mer) | Les cinq noyés inconnus de l'*Aurore* (1861) ; croix ; exemple d'OF-05 | Pas une personne de l'arbre ; annonce R6. |
| `lg-m-o-d` (D4) | `O-d` | Œil ; pied : entaille à droite | **Ange Oyard** (1853–1880), puîné de Clovis, parti en mer ; RG-13 (même page que Blaise), cénotaphe (CN-01) | Leurre de **Blaise** : un autre puîné parti en 1871, mais d'Oyard. |
| `lg-m-y-pt2` (D5) | `Y··` | Fourche ; pied lisse ; deux grains | **Marthe Goémard** (1859–1870) ; croix ; exemple d'OF-05 | Morte enfant ; montre la règle des grains et que Jacquette est l'aînée. |
| `lg-m-y-g-g` (D6) | `Y-g-g` | Fourche ; pied : entaille à gauche, puis entaille à gauche | Aviron de **Gatien** (CN-02, PH-10) | Gatien signe (R8) : sa case est un visage. Leurre de **Josse** (`Y-g`). |
| `lg-m-a-b-g` (D7) | `A/-g` | Flèche ; pied barré, puis entaille à gauche | Aviron de **Lazare** (CN-02) | Lazare signe : visage. Leurre de **Noël** (`A/`). Confirme R6 (fils d'enfant de mer). |
| `lg-m-p-g-pt` (D8) | `P-g·` | Potence ; pied : entaille à gauche ; un grain | **Delphine Lestaud** (née en 1879), fille de Fulbert ; RG-15 | Hors arbre. Leurre de **Fulbert** (`P-g`) et d'**Ernestine** (`P-g+O`). |
| `lg-m-x` (D9) | `X` | Croix de Saint-André (deux traits obliques), sans pied | Double du registre de 1877 (RG-09, de la main du commis), à la place de la marque d'Ernestine | R7 : copie de commis. L'original (même pièce, page en regard) porte `O·`. |
| `lg-m-fourche-couronnee` (D10) | — | Fourche sur pied lisse, surmontée d'une couronne à trois pointes | Marque de commerce du Comptoir (OB-04, PB-01, CT-01, CN-03) ; « le trident » (BD-07) | R7 : un emblème, pas une marque. Mais c'est une **Fourche** : un indice pour S2. |
| `lg-m-ile` (D11) | — | Un seul pied portant les quatre têtes superposées (Fourche, Œil, Flèche, Potence) | Cartouche du plan de 1868 (RG-06), cloche de 1868 (OB-03), CN-03 | R7 : dessin du géomètre, gravure du fondeur. Sert de **table** des quatre têtes. |

Total : 23 marques justes + 11 leurres = **34 dessins** (PISTES : ≈ 30 dont 10 leurres).

## 6. Pour le `cartographe` (dessin des marques)

- Trait **taillé** : droit, épais, extrémités légèrement évasées ; aucune courbe, aucune lettre.
  Gabarit commun : pied de 100 unités ; tête dans les 25 du haut ; entailles de 12 unités, à 40, 55,
  70 du haut ; grains de 4 unités, à droite de la tête ; talon = tête réduite au tiers, sous le pied ;
  barre oblique de bas-gauche à haut-droite, à 35 du haut.
- Trois rendus par marque, selon le support : **taillée** (bois, pierre : relief en creux, ombre
  portée), **tracée** (registre : plume tremblée, encre), **relevée** (carnet Marest : trait net,
  code écrit à côté). La case de l'arbre affiche le rendu **relevé** (le plus lisible) ; la pièce
  montre le rendu de son support.
- Les leurres D10 et D11 sont des **gravures** (trait fin, régulier) : leur facture même dit qu'ils
  ne sont pas autographes.
- Aucune marque ne doit évoquer une lettre d'un alphabet réel ni un symbole existant (runes,
  marques de tailleurs de pierre connues, emblèmes) ; la Fourche couronnée reste une fourche, pas un
  trident mythologique.

## 7. Ce qu'on peut déduire sans pièce (exemples de jeu)

| Question | Raisonnement | Où la vérifier |
|---|---|---|
| Quelle est la marque de Blaise ? | Puîné de Gervais (RG-01) : `Y` + entaille droite = `Y-d`. | Chercher « Y-d » (code) → CN-03, PH-08, PH-15, RG-20 ; RG-13 la porte avec son nom. |
| Qui a taillé la cheminée de l'hôtel Garnaud ? | `Y-d` = le puîné de Gervais Goémard ; Gervais n'a eu qu'un puîné : Blaise. | RG-01, RG-02, puis RG-13 (« dit Garnaud »). |
| Noël est-il le fils de Siméon ? | `A/` : barre = R6, enfant de mer ; Siméon a eu deux fils de sang, `A-g` et `A-d`, noyés en 1869. | OF-05, CN-01, RG-02, BD-03. |
| La marque de Reine, mariée ? | Josse `Y-g` + talon de sa maison natale Lestaud `+P`. | RG-15, CN-02. |
| Le batelier qui émarge `O-g-g` au Comptoir ? | Œil (Oyard), deux générations, deux fois aîné : l'aîné de Médard → Elzéar. | RG-23, RG-15, BD-06. |
| Les quatre coffrets marqués `Y`, `O`, `A`, `P` ? | Têtes seules = les quatre chefs de 1868, donc les quatre maisons. | OF-02, RG-20, PV-06. |
