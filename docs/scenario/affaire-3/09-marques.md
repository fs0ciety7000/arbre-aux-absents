# 09 — Grammaire des marques et catalogue (affaire 3)

> Ce que le joueur doit pouvoir **déduire** seul, sans savoir extérieur, à partir des pièces. Les
> règles sont annoncées dans le jeu par **OF-05** (carnet de Solange Marest, planche I, pièce de
> départ), reprises de vive voix par Victoire (**BD-01**) et par une écolière de 1903 (**DV-02**) ;
> l'exception est annoncée par **OF-05**, **BD-03** et **PV-05**. Source des dates : `03-chronologie.md`.
> Une marque est un `PortraitId` comme un visage (`Portrait.kind = 'mark'`, case `portraitKind:
> 'mark'` : `docs/game/AFFAIRE-3.md` §1) ; ce fichier fixe son dessin, sa **description verbale
> normalisée** (texte alternatif et lecteur d'écran), son **id neutre** et son **code** en cote LX
> (notation du Lecteur, OF-06 ; décision du 16 oct. 2026, `docs/level/longuegreve.md` §5.2).

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
père, avec un **grain** (point creusé) **à droite de la tête** : un pour l'**aînée** (`-pt`), deux pour la
**cadette** (`-pt-pt`). Les filles n'ont pas d'entaille.

**R5 — L'épouse : la marque du mari et un talon.** Mariée, elle prend la marque entière de son mari
et taille **sous le pied** une **petite tête de sa maison natale** : le **talon** (`-tX` : `-tO` pour une née Oyard). Elle le garde
veuve. Sa marque de fille ne sert plus (mais reste sur les pièces d'avant son mariage).

**R6 — L'exception : l'enfant de mer (annoncée par OF-05, BD-03, PV-05).** Un enfant que la mer a
donné (trouvé vivant sur la grève) et qu'une maison élève prend la **tête de cette maison**, mais au
lieu d'une entaille on lui **barre le pied** : un trait oblique qui traverse le pied sous la tête
(`-b`). « Il est de la maison, il n'est pas du sang. » Ses fils ajoutent leurs entailles **sous la
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

### Deux écritures d'un même code : la main de Marest et la cote LX

Une marque a **un seul code** ; il s'écrit de deux façons, et la bible n'emploie que la seconde.

- **Main de Marest** (carnet n° 3, 1964 ; seule la planche I, OF-05, l'emploie en clair) : tête, puis
  `/` pour la barre, puis `-g` / `-d` de haut en bas, puis `·` / `··` pour les grains, puis `+` et la
  tête du talon. Exemples écrits dans OF-05, **tous des morts** : `A-g`, `A-d`, `Y··`, `/`.
- **Cote LX** (Lecteur LX-2, dont le clavier n'a « ni point, ni barre, ni signe plus » : note de
  C. Sauge, OF-06) : **barre `b`**, **grain `pt`** (`pt-pt` pour deux), **talon `t` suivi de sa tête**,
  chaque signe séparé par un tiret. Ordre de lecture inchangé : tête → barre → entailles → grains →
  talon. C'est la notation de travail de toute la bible, celle des mots-clés de code
  (`docs/level/longuegreve.md` §5) et celle des cotes portées au crayon sur les relevés (CN-01, CN-02).

| Main de Marest | Cote LX | | Main de Marest | Cote LX |
|---|---|---|---|---|
| `Y-d` | `Y-d` | | `A/` | `A-b` |
| `Y+O` | `Y-tO` | | `A/+P` | `A-b-tP` |
| `Y-g+P` | `Y-g-tP` | | `A/-g` | `A-b-g` |
| `Y·` | `Y-pt` | | `P··` | `P-pt-pt` |
| `P-g·` | `P-g-pt` | | `/` (marque de mer) | — (barre seule : non indexée) |

Contrôle (fait sur les 34 dessins, `docs/level/longuegreve.md` §5.2) : en cote LX, deux marques
distinctes n'ont jamais la même forme normalisée par le Lecteur (`A-b-tP` ≠ `A-tP`, `A-b-g` ≠ `A-g`,
`P-g-pt` ≠ `P-g`) ; tout code d'au moins deux signes fait au moins deux caractères. Les têtes seules
(`Y`, `O`, `A`, `P`) et la barre seule ne sont pas cherchables : leurs pièces se trouvent par les noms
des chefs et par « Fourche », « Œil », « Flèche », « Potence ».

**Codes cherchables (7 mots-clés, `autolink: false`)** : `A-d` (exemple d'OF-06), `A-b` (« Flèche
barrée »), `O-g-g`, et quatre **cachés** que le joueur doit déduire : `Y-d` (Blaise), `O-g-tY`
(Jacquette), `Y-g` (Josse), `O-g` (Médard). Détail, résultats et conditions :
`docs/level/longuegreve.md` §5.3.

**Règle d'écriture des pièces** (la déduction en dépend) :
- dans le texte d'une pièce, une marque n'est **jamais** écrite par son code : elle est **dessinée**
  à côté du nom qu'elle signe, par l'inline `::mark[<id de portrait>]`, avec l'id **neutre** (§4) ;
- un code n'est écrit en clair que dans quatre pièces : **OF-05** (main de Marest, morts seulement),
  **OF-06** (l'exemple `A-d` et la règle de transcription), **CN-01** (cotes LX `A-g`, `A-d` au
  crayon) et **CN-02** (cotes `A-b`, `A-b-g`, `O-g-g`). Aucun autre, jamais un code caché ni un code
  qui le contient (`Y-g-g`, `Y-g-tP` contiennent `Y-g` ; voir 07 §7) ;
- une bande (`recording`) ne contient ni code ni `::mark` : les marques y sont **dites** (« l'Œil et une
  entaille à gauche »).

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
- [x] En cote LX, aucune collision au Lecteur (§2, « Deux écritures ») ; aucun id de portrait ne
  contient de code (§4).
- [x] L'exception (R6) est annoncée avant d'être nécessaire : OF-05 (départ) la donne avec
  l'exemple de la marque de mer ; la première marque barrée d'un vivant n'arrive qu'ensuite, par les
  avirons des Cabanes (BD-06 → CN-02, PH-10) ou par RG-10 (porte A).

## 4. Les marques justes (23)

Colonnes : **nom de travail** · **id neutre** · code (cote LX) · description verbale · personne (case) ·
règle · pièces **autographes** (tracées ou taillées par la personne, ou croix taillée par les siens) ·
pièces d'appui (relevé, photo, mention, gravure). Chaque marque juste est montrée par **au moins deux
pièces**, dont **au moins deux autographes** pour la marque de case (contre-épreuve « une pièce
retirée », `docs/level/longuegreve.md` §10.3).

**Ids.** Le nom de travail (`lg-m-…`) contient le code : il ne sert que dans la bible et comme clé de la
table du `cartographe` (`art/tools/portraits/ids-marques-de-longuegreve.json`), qui le traduit en **id
neutre** (`lg-portrait-xxxxxx`). Les pièces, `family.json` et le compilé n'emploient **que l'id neutre**
(`::mark[lg-portrait-480ba1]`) ; aucun id ne laisse lire un code. Si la table du `cartographe` change,
elle fait foi sur la colonne « id neutre ».

| Travail | Id neutre | Code | Description verbale | Case | Règle | Autographes | Appui |
|---|---|---|---|---|---|---|---|
| `lg-m-y` | `lg-portrait-9e0e20` | `Y` | Fourche ; pied lisse | C01 Gervais Goémard | R2 | OF-02, RG-05, RG-07, RG-08, RG-24 | CN-01 (croix relevée) |
| `lg-m-y-t-o` | `lg-portrait-375fdd` | `Y-tO` | Fourche ; pied lisse ; talon : petit Œil | C02 Perrine Oyard | R5 | RG-07, RG-08 (au pied de l'acte, sans légende) | CN-01 (croix relevée) |
| `lg-m-o` | `lg-portrait-aa93f2` | `O` | Œil ; pied lisse | C03 Clovis Oyard | R2 | OF-02, RG-05, RG-07, RG-09, PH-09 (sa croix, seule lisible) | CN-01, DV-02 (dite) |
| `lg-m-o-t-a` | `lg-portrait-5bbc8d` | `O-tA` | Œil ; pied lisse ; talon : petite Flèche | C04 Toinette Cormaud | R5 | RG-07, RG-09 (au pied de l'acte) | CN-01 (croix relevée) |
| `lg-m-a` | `lg-portrait-5ce728` | `A` | Flèche ; pied lisse | C05 Siméon Cormaud | R2 | OF-02, RG-05, RG-10, RG-19, RG-24 | CN-01 |
| `lg-m-a-t-p` | `lg-portrait-7f010c` | `A-tP` | Flèche ; pied lisse ; talon : petite Potence | C06 Ursule Lestaud | R5 | RG-10 (au pied de l'acte), PH-10 (sa **navette** à ramender, taillée par elle) | CN-01 (croix), CN-02 (navette relevée), BD-06 (dite) |
| `lg-m-p` | `lg-portrait-8084e7` | `P` | Potence ; pied lisse | C07 Lubin Lestaud | R2 | OF-02, RG-05, RG-08, RG-09, RG-10, RG-24 | CN-01 |
| `lg-m-p-t-y` | `lg-portrait-6ff69c` | `P-tY` | Potence ; pied lisse ; talon : petite Fourche | C08 Apolline Goémard | R5 | RG-08, RG-09, RG-10 (au pied des actes) | CN-01 (croix relevée) |
| `lg-m-y-g` | `lg-portrait-df3f6c` | `Y-g` | Fourche ; pied : entaille à gauche | C09 Josse Goémard | R3 | RG-05, RG-07, RG-08, RG-15, RG-19, RG-24, LT-06 | — |
| `lg-m-y-g-t-p` | `lg-portrait-3f8d58` | `Y-g-tP` | Fourche ; pied : entaille à gauche ; talon : petite Potence | C10 Reine Lestaud | R5 | RG-15, PH-10 (son fuseau) | CN-02 (fuseau relevé) |
| `lg-m-p-pt` | `lg-portrait-87e85e` | `P-pt` | Potence ; pied lisse ; un grain | C10 Reine Lestaud (fille, 1868–1879) | R4 | RG-08 | — |
| `lg-m-o-g-t-y` | `lg-portrait-309b85` | `O-g-tY` | Œil ; pied : entaille à gauche ; talon : petite Fourche | C11 Jacquette Goémard | R5 | RG-15, RG-18 | BD-01 (dite) |
| `lg-m-y-pt` | `lg-portrait-804ae3` | `Y-pt` | Fourche ; pied lisse ; un grain | C11 Jacquette Goémard (fille, 1868–1876) | R4 | RG-07 | — |
| `lg-m-o-g` | `lg-portrait-4db872` | `O-g` | Œil ; pied : entaille à gauche | C12 Médard Oyard | R3 | RG-05, RG-07, RG-08, RG-19, RG-24, LT-06 | BD-01, DV-02 (dites) |
| `lg-m-y-d` | `lg-portrait-480ba1` | `Y-d` | Fourche ; pied : entaille à droite | C13 Blaise Goémard | R3 | RG-13, RG-20 (déposant), LT-01, LT-05 | CN-03 (cheminée relevée, sans code), PH-08 (cheminée, taillée sur son ordre), PH-15 (tombe), EX-01 |
| `lg-m-p-g-t-o` | `lg-portrait-ff741e` | `P-g-tO` | Potence ; pied : entaille à gauche ; talon : petit Œil | C15 Ernestine Oyard | R5 | RG-15, PH-10 (son tampon à pain) | CN-02 (tampon relevé) |
| `lg-m-o-pt` | `lg-portrait-ea5469` | `O-pt` | Œil ; pied lisse ; un grain | C15 Ernestine Oyard (fille, 1869–1877) | R4 | RG-09 (original) | — |
| `lg-m-p-g` | `lg-portrait-d9a1bf` | `P-g` | Potence ; pied : entaille à gauche | C16 Fulbert Lestaud | R3 | RG-05, RG-07, RG-09, RG-15, RG-19, RG-24, LT-06 | CN-02 (couvercle de caisse) |
| `lg-m-p-d` | `lg-portrait-fdaeee` | `P-d` | Potence ; pied : entaille à droite | C17 Benoît Lestaud | R3 | RG-08, RG-11, RG-15, RG-19, RG-21, RP-04, OB-05 (linteau taillé par lui) | CN-02 |
| `lg-m-a-b` | `lg-portrait-84365f` | `A-b` | Flèche ; pied barré | C19 Noël Cormaud | **R6** | RG-10, RG-15, RG-18, RG-24, LT-06, OB-01 (aviron), PH-10 (aviron) | CN-02 (cote `A-b`) |
| `lg-m-a-b-t-p` | `lg-portrait-99db1b` | `A-b-tP` | Flèche ; pied barré ; talon : petite Potence | C20 Honorine Lestaud | R5 + R6 | RG-15, RG-18 | — |
| `lg-m-p-pt2` | `lg-portrait-1b4408` | `P-pt-pt` | Potence ; pied lisse ; deux grains | C20 Honorine Lestaud (fille, 1876–1885) | R4 | RG-10 | — |
| `lg-m-o-g-g` | `lg-portrait-9cb0f2` | `O-g-g` | Œil ; pied : entaille à gauche, puis entaille à gauche | C23 Elzéar Oyard | R3 | RG-15, RG-23, PH-10 (aviron) | CN-02 (cote `O-g-g`), BD-01, BD-06 (dites) |

Ernestine (née en 1857) a reçu sa marque en 1869, à douze ans. Les marques de fille des épouses de
la génération I (avant 1868) ne sont pas documentées (R2) : leurs cases n'ont qu'une marque.

**Les talons au pied des actes** (RG-07 à RG-10, `docs/level/longuegreve.md` §12.2) : les époux et les
témoins font leur marque **à côté de leur nom** ; les parents présents, « présents et consentants »,
nommés avec leurs métiers dans le corps de l'acte, font leur marque **au pied de l'acte, sans
légende**, dans l'ordre où ils sont passés à la table (jamais l'ordre du corps de l'acte : les mères
d'abord en 1876 et 1885, les Lestaud d'abord en 1879, l'ordre d'arrivée en 1877). Attribuer une
marque de talon exige de **lire le talon** : c'est la leçon de `g-talons`.

**La navette d'Ursule** (ajout du 16 oct. 2026, `docs/level/longuegreve.md` §12.1) : navette à
ramender en buis, où Ursule a taillé sa marque `A-tP` en 1868, quand les marques ont été refaites ; à sa mort (1888), elle
passe avec les filets à Honorine, sa nièce, femme de Noël (le métier va de mère à belle-fille, `02-arbre.md`
§3), qui n'y ajoute rien. Elle est sur l'établi du hangar en 1964 (PH-10), relevée sur la planche III
(CN-02) et dite par Marin (BD-06). Même id que la marque de case d'Ursule : un objet, pas un dessin
nouveau (`cartographe` : dessin d'objet dans l'illustration de PH-10).

## 5. Les leurres (11)

| Travail | Id neutre | Code | Description verbale | À qui, où | Ce qui l'écarte |
|---|---|---|---|---|---|
| `lg-m-a-g` (D1) | `lg-portrait-97cb44` | `A-g` | Flèche ; pied : entaille à gauche | **Jean Cormaud** (1844–1869), noyé ; croix (CN-01, cote `A-g`) ; exemple d'OF-05 (`A-g`) | Mort en 1869 ; hors arbre. Prouve que l'aîné de Siméon est mort. |
| `lg-m-a-d` (D2) | `lg-portrait-c33099` | `A-d` | Flèche ; pied : entaille à droite | **Yves Cormaud** (1846–1869), noyé ; croix (CN-01, cote `A-d`) ; exemples d'OF-05 et d'OF-06 | Idem : Siméon n'a plus de fils de sang. |
| `lg-m-mer` (D3) | `lg-portrait-ab4b4b` | — (Marest `/`) | Pied barré, sans tête (marque de mer) | Les cinq noyés inconnus de l'*Aurore* (1861) ; croix ; exemple d'OF-05 | Pas une personne de l'arbre ; annonce R6. |
| `lg-m-o-d` (D4) | `lg-portrait-29ab43` | `O-d` | Œil ; pied : entaille à droite | **Ange Oyard** (1853–1880), puîné de Clovis, parti en mer ; RG-13 (même page que Blaise), cénotaphe (CN-01) | Leurre de **Blaise** : un autre puîné parti en 1871, mais d'Oyard. |
| `lg-m-y-pt2` (D5) | `lg-portrait-12b71b` | `Y-pt-pt` | Fourche ; pied lisse ; deux grains | **Marthe Goémard** (1859–1870) ; croix (CN-01) ; exemple d'OF-05 (`Y··`) | Morte enfant ; montre la règle des grains et que Jacquette est l'aînée. |
| `lg-m-y-g-g` (D6) | `lg-portrait-d18c08` | `Y-g-g` | Fourche ; pied : entaille à gauche, puis entaille à gauche | Aviron de **Gatien** (CN-02, PH-10) | Gatien signe (R8) : sa case est un visage. Leurre de **Josse** (`Y-g`). |
| `lg-m-a-b-g` (D7) | `lg-portrait-ed16c7` | `A-b-g` | Flèche ; pied barré, puis entaille à gauche | Aviron de **Lazare** (CN-02, cote `A-b-g`) | Lazare signe : visage. Leurre de **Noël** (`A-b`). Confirme R6 (fils d'enfant de mer). |
| `lg-m-p-g-pt` (D8) | `lg-portrait-4439b6` | `P-g-pt` | Potence ; pied : entaille à gauche ; un grain | **Delphine Lestaud** (née en 1879), fille de Fulbert ; RG-15 | Hors arbre. Leurre de **Fulbert** (`P-g`) et d'**Ernestine** (`P-g-tO`). |
| `lg-m-x` (D9) | `lg-portrait-3f2b8f` | `X` | Croix de Saint-André (deux traits obliques), sans pied | Double du registre de 1877 (RG-09, de la main du commis), à la place de la marque d'Ernestine | R7 : copie de commis. L'original (même pièce, page en regard) porte `O-pt`. |
| `lg-m-fourche-couronnee` (D10) | `lg-portrait-9b5710` | — | Fourche sur pied lisse, surmontée d'une couronne à trois pointes | Marque de commerce du Comptoir (OB-04, PB-01, CT-01, CN-03) ; « le trident » (BD-07) | R7 : un emblème, pas une marque. Mais c'est une **Fourche** : un indice pour S2. |
| `lg-m-ile` (D11) | `lg-portrait-e5dfe7` | — | Un seul pied portant les quatre têtes superposées (Fourche, Œil, Flèche, Potence) | Cartouche du plan de 1868 (RG-06), cloche de 1868 (OB-03), CN-03 | R7 : dessin du géomètre, gravure du fondeur. Sert de **table** des quatre têtes. |

Total : 23 marques justes + 11 leurres = **34 dessins** (PISTES : ≈ 30 dont 10 leurres).

## 6. Pour le `cartographe` (dessin des marques)

- Trait **taillé** : droit, épais, extrémités légèrement évasées ; aucune courbe, aucune lettre.
  Gabarit commun (corrigé le 16 oct. 2026, `docs/game/AFFAIRE-3.md` §1.7) : pied de 100 unités ; trait
  de **6 unités** au moins ; tête dans les 25 du haut ; entailles de 12 unités, à 40, 55, 70 du haut ;
  grains de **8 unités** de diamètre, à droite de la tête, **6 unités** entre deux grains ; talon = tête
  réduite au tiers, sous le pied, séparée de lui de 6 unités ; barre oblique de bas-gauche à
  haut-droite, à 35 du haut.
- Trois rendus par marque, selon le support : **taillée** (bois, pierre : relief en creux, ombre
  portée), **tracée** (registre : plume tremblée, encre), **relevée** (carnet Marest : trait net). La
  case de l'arbre affiche le rendu **relevé** (le plus lisible) ; la pièce montre le rendu de son
  support.
- **Aucun code dans un SVG de marque** (portrait), ni dans son id (§4). Seules les illustrations des
  planches peuvent écrire des codes, et seulement ceux du §2 (« Règle d'écriture ») : la main de
  Marest sur la planche I (morts), les cotes LX au crayon sur les planches II et III.
- Les leurres D10 et D11 sont des **gravures** (trait fin, régulier) : leur facture même dit qu'ils
  ne sont pas autographes.
- Aucune marque ne doit évoquer une lettre d'un alphabet réel ni un symbole existant (runes,
  marques de tailleurs de pierre connues, emblèmes) ; la Fourche couronnée reste une fourche, pas un
  trident mythologique.

## 7. Ce qu'on peut déduire sans pièce (exemples de jeu)

| Question | Raisonnement | Où la vérifier |
|---|---|---|
| Quelle est la marque de Blaise ? | Puîné de Gervais (RG-01, porte A) : `Y` + entaille droite = `Y-d`. | Chercher `Y-d` (code caché) → CN-03 (« Fourche, entaille à droite. Qui ? ») ; puis PH-08, RG-13, PH-15, RG-20 selon les portes (`docs/level/longuegreve.md` §5.3). |
| Qui a taillé la cheminée de l'hôtel Garnaud ? | Fourche, entaille à droite = le puîné de Gervais Goémard ; Gervais n'a eu qu'un puîné : Blaise. | RG-01, RG-02, puis RG-13 (« dit Garnaud »). |
| Noël est-il le fils de Siméon ? | `A-b` : barre = R6, enfant de mer ; Siméon a eu deux fils de sang, `A-g` et `A-d`, noyés en 1869. | OF-05, CN-01, RG-02, BD-03. |
| La marque de Reine, mariée ? | Josse `Y-g` + talon de sa maison natale Lestaud `-tP`. | RG-15, PH-10, CN-02. |
| La marque de Jacquette, mariée ? | « L'Œil de mon père et une petite Fourche dessous » (DV-02) : `O-g-tY` (code caché). | RG-18, RG-15. |
| Qui a fait la marque au talon Potence sous la Flèche, au pied de l'acte de 1885 ? | Flèche, pied lisse, talon Potence : l'épouse du chef Cormaud, née Lestaud → Ursule. | RG-10, puis PH-10 (la navette). |
| Le batelier qui émarge `O-g-g` au Comptoir ? | Œil (Oyard), deux générations, deux fois aîné : l'aîné de Médard → Elzéar. | RG-23, RG-15, BD-06. |
| Les quatre coffrets marqués `Y`, `O`, `A`, `P` ? | Têtes seules = les quatre chefs de 1868, donc les quatre maisons. | OF-02, RG-20, PV-06. |
