# 08 — Lieux nouveaux et lieux repris (affaire 3)

> Demande au `cartographe` (`content/world/places/*.json`, `art/tools/world.py`). **Provisoire** (piste
> B retenue, noms provisoires) ; reporté dans `docs/monde/00-monde.md` §12, marqué « affaire 3, provisoire ».
> Positions en coordonnées normalisées (`x` 0 = ouest → 1 = est, `y` 0 = nord → 1 = sud), vérifiées
> contre la géométrie existante (`LAND`, `ISLANDS`, `CARTOUCHE`, `ROSE` de `art/tools/world.py`) : côte
> ouest vers x 0,100–0,108 entre y 0,50 et 0,55 ; estuaire de l'Orvelle vers y 0,47 ; Port-Sénane
> 0,136 · 0,455 ; libellé « Golfe d'Ambre » 0,066 · 0,600 (rayon 60) ; îlots existants 0,060 · 0,410 et
> 0,075 · 0,760.

## 1. Les deux lieux nouveaux (avec `PlaceId`)

| `PlaceId` | Nom affiché | `kind` | Position proposée | `focusZoom` / `hitRadius` | Ce qu'on y trouve | Rôle |
|---|---|---|---|---|---|---|
| `longuegreve` | **Longuegrève** | `landmark` | **x 0,054 · y 0,530** | 3,4 / 24 | Île longue et basse, orientée nord-sud (≈ 2 lieues sur ⅓ de lieue) ; à l'ouest, la **Longue Grève** (plage de l'ambre) ; à l'est, les falaises basses, le hameau brûlé (quatorze ruines, quatre linteaux marqués), la chapelle en ruine, le **cimetière** intact ; au nord, la **pointe du Feu** et son feu à gaz (1872, automatique depuis 1908). Inhabitée depuis 1908 ; sternes et macareux. | Cœur de l'affaire : les quatre lanières, le cimetière (1964, 1978), la grève. |
| `cabanes-d-ambre` | **Les Cabanes d'Ambre** | `village` | **x 0,110 · y 0,566** | 3,4 / 22 | Hameau de hangars et de cabanes de bois sur la côte, face à l'île, bâti par le Comptoir en 1908 ; l'**atelier de taille** du Comptoir ; la **jetée** ; le hangar à bateaux de l'Amicale ; une chapelle de planches. Section de la commune de Port-Sénane. | Les évacués et leurs descendants ; l'enquête orale de 1964 ; l'Amicale. |

**Positions définitives** (16 oct. 2026, `cartographe`, `10-illustrations.md` §1) : les positions
proposées en v0.1 (0,050 · 0,520 et 0,112 · 0,530) ont été déplacées pour la lisibilité de la carte :
l'île descend pour dégager le libellé de l'estuaire et celui du golfe, les Cabanes descendent pour faire
face à l'île et dégager la vignette du trois-mâts. Les espacements et l'absence de chevauchement sont
vérifiés par le `cartographe` sur le tirage.

**Distances dans les pièces** (à respecter ; d'après les positions définitives) : Longuegrève →
Cabanes, **près de 5 lieues** par la passe (4,9 ; 2 h 30 de vedette en 1908, comme le livre de bord RP-03 :
7 h 10 – 9 h 40 ; une demi-journée à la voile) ; Cabanes → Port-Sénane, **un peu plus de 5 lieues** à vol
d'oiseau (5,3), **six lieues** par la route de la côte, qui rejoint la route de Bains et passe l'estuaire
au bac (une heure et quart de voiture en 1977) ; Longuegrève → Port-Sénane, 7 lieues par mer (escale de
la *Duchesse-d'Ambre*). Par temps clair, on voit l'île depuis la jetée des Cabanes.

### Demandes au cartographe

1. **Longuegrève** : nouvelle île dans `ISLANDS`, allongée nord-sud (rx ≈ 6, ry ≈ 19 unités), à
   0,054 · 0,530 ; côte ouest presque droite (la grève), côte est découpée. Vignette : quatre toits
   rompus, une croix, un petit feu à la pointe nord.
2. **Les Cabanes d'Ambre** : vignette de village côtier (une longue halle basse, une jetée, des
   cabanes). Route côtière mineure **Cabanes → Port-Sénane** (réalisée : raccord à la route de Bains,
   puis la route existante et le bac de l'estuaire). Aucun pont, aucun rail.
3. **La passe des Cabanes** : pointillés de navigation Cabanes → Longuegrève (pas de libellé
   obligatoire). La ligne des Paquebots peut faire un crochet vers Longuegrève (escale jusqu'en 1908).
4. Les lieux des affaires 1 et 2 ne bougent pas. Les deux îlots existants restent anonymes (option :
   celui de 0,060 · 0,410, devant l'estuaire, peut s'appeler « l'Enclume », sans pièce).

## 2. Toponymes secondaires (sans `PlaceId`)

| Toponyme | Où | Nature | Sens, règle |
|---|---|---|---|
| **la Longue Grève** | côte ouest de Longuegrève | plage (libellé possible) | Velmarchois transparent ; a donné son nom à l'île. |
| **la pointe du Feu** | nord de l'île | pointe (pièces) | Le feu de 1872. |
| **les quatre lanières** | l'île | parcellaire (pièces) | Les lots de 1868, de la falaise à la grève. |
| **la passe des Cabanes** | entre l'île et la côte | chenal (pièces) | Le pilote Clovis Oyard la connaissait « à la couleur ». |
| **quai du Môle**, **église du Môle**, **hôtel Garnaud** | Port-Sénane | rue, église, maison (pièces) | Quai du Môle déjà dans les pièces de l'affaire 1. L'hôtel Garnaud (1898) est le siège du Comptoir. |
| **quai des Messageries**, **librairie Ferlay** | Port-Sénane | rue, boutique (pièces) | Quai déjà dans l'affaire 1. |
| **la halle aux poissons** | Port-Sénane | bâtiment (pièces) | Rose Pellerin. |
| **Hôpital maritime** | Port-Sénane | bâtiment (existe) | Registre des tournées (RP-05). |

## 3. Le parler insulaire (reporté dans `docs/monde/00-monde.md` §4)

Les insulaires parlent **velmarchois** ; leur parler n'ajoute qu'une dizaine de mots et la façon de
nommer les marques. **Pas de troisième langue.**

| Mot | Sens |
|---|---|
| *garnaud* | ramasseur d'ambre à la grève ; par extension, celui qui a la main heureuse. Origine du nom pris par Blaise. |
| *la lanière* | le lot d'une maison, de la falaise à la grève. |
| *le coup d'ouest* | tempête d'ouest, qui jette l'ambre sur la grève. |
| *la Grand-Terre* | le continent. |
| *faire sa marque* | signer. |
| *le pied*, *la tête*, *l'entaille*, *le grain*, *le talon*, *la barre* | les parties d'une marque (`09-marques.md`). |
| *la Fourche*, *l'Œil*, *la Flèche*, *la Potence* | les quatre têtes. |
| *l'enfant de mer* | l'enfant trouvé sur la grève et élevé par une maison. |
| *les quatre* | le conseil des quatre chefs de maison. |
| *le premier ambre* | vers douze ans, le jour où l'on reçoit sa marque. |

**Noms de famille insulaires** : suffixes ***-ard*** et ***-aud*** (« de la grève », disent les
insulaires), tirés des choses du rivage : *Goémard* (goémon), *Oyard* (oyat), *Cormaud* (cormoran),
*Lestaud* (lest). Les commis du continent les écrivent au son (*Gouémard*, *Oyart*, *Cormault*,
*Lestot*). *Garnaud* imite ces noms sans être celui d'une maison. **Prénoms** : français et anciens
(Gervais, Josse, Médard, Siméon, Lubin, Perrine, Toinette, Apolline, Jacquette, Elzéar) ; on donne
*Noël* aux enfants de mer.

## 4. Lieux existants repris

| `PlaceId` | Rôle dans l'affaire 3 |
|---|---|
| `port-senane` | Comptoir des Ambres et hôtel Garnaud (quai du Môle), librairie Ferlay, Caisse d'épargne, Inscription maritime, hôpital maritime, étude Lhermet, église du Môle (la cloche), cimetière (tombe de Blaise), *L'Écho*, halle aux poissons. Description à enrichir : « Comptoir des Ambres ». |
| `golfe-d-ambre` | Description à enrichir : « et les îles du golfe, dont Longuegrève, inhabitée depuis 1908 ». |
| `bains-de-merande` | Naissance et retraite de Sidonie ; Ginette Sollier. |
| `aubrelieu` | ORC, Archives nationales (Lecteur), Université (Laboratoire des parlers et usages), Grande Exposition (1889). |

## 5. Nouvelles institutions, entreprises et presse (reportées dans `docs/monde/00-monde.md`)

| Nom | Nature | Fondée, siège | Note |
|---|---|---|---|
| **Comptoir des Ambres B. Garnaud & Cie** (puis Comptoir des Ambres) | négoce et taille de l'ambre | 1886, Port-Sénane (quai du Môle) ; atelier aux Cabanes (1908) | Marque de commerce : la Fourche couronnée ; devise « Ce que l'ambre garde, il le garde entier ». Concession des grèves de Longuegrève 1908–1958, renouvelée jusqu'en 1983. |
| **Librairie Ferlay** | librairie | Port-Sénane, quai des Messageries | AN-01, PH-17. |
| **Photographie Hamelot** | photographe | Port-Sénane, quai des Messageries | PH-05. |
| **Étude Lhermet** | notaires | Port-Sénane | RG-19, LT-05. |
| **Caisse d'épargne de Port-Sénane** | caisse d'épargne, location de coffres | 1835, Port-Sénane | RG-20, PV-06. |
| **Districts et commissaires de district** | administration grand-ducale (puis républicaine) | — | District de l'Estuaire (Port-Sénane) : commissaire, médecin des épidémies. |
| **Inscription maritime** | registre des gens de mer | Port-Sénane | RG-13. |
| **Cadastre grand-ducal des îles** | levé de 1868 | — | RG-05, RG-06. |
| **Administration des Domaines** | biens de l'État, expropriations | Aubrelieu | OF-02. |
| **Service des Réserves naturelles** | protection de la nature | 1972, Aubrelieu | RP-09. |
| **Société ornithologique du golfe** | association savante | Port-Sénane | PH-11. |
| **Laboratoire des parlers et usages** | Université d'Aubrelieu | — | Fonds Marest (1964). |
| **Feu de Longuegrève** | Phares et Balises | 1872 ; automatique (gaz) en 1908 | RG-21, RP-04. |
| **Loi de 1973, art. 15** | registres détruits par l'autorité ; la marque vaut signature | 14 mai 1973 | OF-01, OF-02. |
