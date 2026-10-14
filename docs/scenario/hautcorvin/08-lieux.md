# 08 — Lieux nouveaux et lieux repris (affaire 2)

> Demande au `cartographe` (`content/world/places/*.json`, `art/tools/world.py`). **Validé (v0.2)** et
> reporté dans `docs/monde/00-monde.md` §11 (lieux, toponymes, nommage thalbère, institutions, presse,
> prix). Ce fichier reste la référence de travail pour la carte.
> Positions en coordonnées normalisées (`x` 0 = ouest → 1 = est, `y` 0 = nord → 1 = sud), cohérentes
> avec la géométrie existante : Orvelle (source vers 0,878 · 0,890, passe à Hautcorvin 0,800 · 0,785),
> frontière (0,886 · 0,716 au col ; 0,906 · 0,790 ; 0,936 · 0,858), route majeure Hautcorvin → col →
> Brenzac, ruisseau affluent de rive droite (0,930 · 0,800 → 0,818 · 0,814), petit lac (0,900 · 0,860).

## 1. Les trois lieux nouveaux (avec `PlaceId`)

| `PlaceId` | Nom affiché | `kind` | Position proposée | `focusZoom` / `hitRadius` | Ce qu'on y trouve | Rôle |
|---|---|---|---|---|---|---|
| `vernezac` | **Vernezac** | `village` | **x 0,842 · y 0,814** | 3,4 / 24 | Halle des fours des Verreries (depuis 1790), Auberge des Guides, église, école, bureau de poste, brigade des douanes de la Vèze, Compagnie des guides. Sur la **Vèze**, torrent de rive droite qui descend du Pas vers l'Orvelle. | Cœur de l'affaire : l'incendie, les Neviot, le télégramme de 1976. |
| `pas-de-l-ourse` | **Le Pas de l'Ourse** | `landmark` | **x 0,902 · y 0,772** (sur la frontière) | 3,6 / 20 | Brèche dans la crête, à deux lieues au sud du col de Corvenne ; **refuge de l'Ourse** (1911) un peu en contrebas, côté velmarchois ; une **croix de fer** au troisième lacet ; une **borne-frontière** gravée. | Bastien caché (1937–1938) et arrêté (1938) ; passages de radiés (1938–1952) ; Jules tué (1944) ; épilogue. |
| `dalvezac` | **Dalvezac** (*Dalvica*) | `village` | **x 0,945 · y 0,722** (en Thalberie) | 3,4 / 22 | Hameau thalbère de charbonniers dans la vallée de la **Dalva**, à l'écart de la route col → Brenzac ; maisons de bois, meules ; école ; cimetière où repose Danela. | Les Dalvarin : exil de 1916–1921, Danela après 1938, Andrin après 1952. |

**Décision (validée)** : la **Combe-aux-Sables** n'est **pas** un lieu cliquable : simple toponyme
gravé sur la carte, sans `PlaceId` ni fiche (§2). Sa pièce propre, CP-02, est classée à `vernezac`.

**Espacements vérifiés** (en unités de viewBox, carte ≈ 1350 × 1000) : Vernezac–Hautcorvin ≈ 64 ;
libellé de la Combe à ≈ 61 de Hautcorvin et ≈ 70 de Vernezac (pas de cercle de clic) ; Pas–col de
Corvenne ≈ 60 ; Pas–Vernezac ≈ 91 ; Dalvezac–col ≈ 80 ; Dalvezac–Brenzac ≈ 108 ; Dalvezac est à
≈ 0,057 à l'est de la frontière (bien en Thalberie). Aucun cercle de clic ne se chevauche.

**Distances dans les pièces** (indépendantes du tracé exact, à respecter) : Hautcorvin → Vernezac,
**trois lieues** par la route de la Vèze (une heure en voiture en 1976, une matinée à pied) ;
Vernezac → refuge de l'Ourse, **cinq heures** de montée ; refuge → Pas, **une heure** ; Pas → Dalvezac,
**quatre heures** de descente ; Dalvezac → Brenzac, **six lieues** par la vallée de la Dalva. Le col
de Corvenne est **gardé** (fortins, poste) ; le Pas ne l'est que par les patrouilles des douanes.

### Demandes au cartographe

1. **La Vèze** : le ruisseau existant (0,930 · 0,800 → 0,818 · 0,814) prend sa source **en Thalberie**,
   au-delà de la frontière (0,910 à cette latitude). Pour qu'il descende *du* Pas, déplacer sa source
   vers **0,900 · 0,786** (sous le Pas, côté velmarchois). Libellé « la Vèze ».
2. **Route mineure** Hautcorvin → Vernezac (0,800 · 0,785 → 0,822 · 0,800 → 0,842 · 0,814), puis
   **sentier** en tirets Vernezac → refuge → Pas (0,842 · 0,814 → 0,876 · 0,792 → 0,902 · 0,772), et
   **sentier** thalbère Pas → Dalvezac (0,902 · 0,772 → 0,925 · 0,745 → 0,945 · 0,722). Le sentier ne
   rejoint pas la route du col : c'est tout son intérêt.
3. **Route mineure** Dalvezac → route majeure du col (vers 0,940 · 0,670), « vallée de la Dalva ».
4. Le **petit lac** (0,900 · 0,860) peut rester anonyme ; s'il faut un nom : « lac Noir ». Il n'entre
   dans aucune pièce.
5. Les lieux de l'affaire 1 ne bougent pas. Les vignettes nouvelles suivent le style des vignettes de
   village (Vernezac : une halle à grande cheminée trapue au bord d'un torrent ; Dalvezac : trois toits
   de bois et une meule fumante ; le Pas : une brèche, une croix, une cabane).
6. **La Combe-aux-Sables** : libellé seul, en italique de toponyme secondaire, à **0,796 · 0,846**, avec
   au plus un petit pictogramme (entaille blanche dans la pente, sans rails). Pas de vignette de lieu,
   pas de `PlaceId`.

## 2. Toponymes secondaires (sans `PlaceId`)

| Toponyme | Où | Nature | Sens, règle |
|---|---|---|---|
| **la Combe-aux-Sables** | 0,796 · 0,846, rive gauche de l'Orvelle, en face de Hautcorvin | carrière de sable blanc (libellé de carte, sans `PlaceId`) | Velmarchois transparent (*combe* + *sables*). Les carriers Neviot ; « les deux frères de la Combe » ; l'éboulement de 1919. Pièces : CP-02 (classée à `vernezac`), RG-16, PV-01. |
| **la Vèze** | torrent, du Pas à l'Orvelle par Vernezac | rivière (libellé) | Velmarchois ancien. A donné « douanes de la Vèze ». |
| **la Dalva** | torrent thalbère, de la crête vers Dalvezac | rivière (pièces seulement) | Thalbère *dalva*, « eau vive, torrent ». |
| **refuge de l'Ourse** | sous le Pas | bâtiment (pièces) | Velmarchois. Légende locale d'une ourse qui montrait le passage aux bergers. |
| **halle des fours**, **four n° 2**, **magasin des emballages** | Vernezac | bâtiments (pièces) | — |
| **rue Haute** | Hautcorvin | rue (pièces) | Boutique « Ravenel, modes ». |
| **hospice de Hautcorvin**, **paroisse Saint-Éloi** | Hautcorvin | bâtiments (pièces) | — |
| **Studio Orlhac** | Hautcorvin | atelier (pièces) | Fondé en 1890. |
| **Verrerie de Brénica** | Brenzac | entreprise (pièces) | Thalbère. |

## 3. Règle de nommage thalbère (reportée dans `docs/monde/00-monde.md` §4)

Compléments à la section « Thalbère », sans contredire l'existant (*Dobrin*, *Vasko*, *Mirela*,
*Ivela Darin*, *Ilko Varasin*, *Brénica*) :

- **Toponymes** : suffixe thalbère ***-ica*** (« lieu habité, village »), rendu en velmarchois par
  ***-zac*** : *Brénica* → **Brenzac** (déjà établi), *Dalvica* → **Dalvezac**, *Vernica* → **Vernezac**.
  Les pièces thalbères disent *Dalvica* ; les pièces velmarchoises disent Dalvezac (et souvent, par
  familiarité, Dalvica : les deux sont indexées, OF-07).
- **Vernezac** est en Velmarche mais garde un nom d'origine thalbère : avant 1811, la haute vallée était
  peuplée de familles des deux langues. *verna* = « braise » ; *Vernica*, « les braises » (la verrerie
  est plus ancienne que le nom officiel).
- **Noms de famille** en ***-in*** (« de la maison de, issu de ») : *Dalvarin*, « de ceux de la Dalva » ;
  *Rovin* ; invariables (pas de féminin, contrairement à l'ostrien).
- **Prénoms** masculins en *-ko* ou *-in* (*Dranko*, *Andrin*), féminins en *-ela* (*Danela*, *Jadela*).
- **Écriture** : les écoles thalbères enseignent un **T majuscule à boucle** (la barre se referme en
  boucle à gauche). Indice d'écriture de l'affaire 2 (EX-02).
- **Monnaie** : le *talar* (pluriel *talars*), cité une fois au plus (salaire d'Andrin à Brénica).

## 4. Lieux de l'affaire 1 repris

| `PlaceId` | Rôle dans l'affaire 2 |
|---|---|
| `hautcorvin` | Siège des Verreries et atelier d'optique, maison Tessonnal, hospice, Studio Orlhac, étude Escande, *La Sentinelle des Corvins*, dépôt de la Garde d'Ordre et du BRR (1938, 1941). Description à enrichir : « halle des fours à Vernezac ». |
| `brenzac` | Verrerie de Brénica, *Le Messager de Brenzac* (1953, 1960). |
| `kessaar` | Bagne : cellule 14 ; infirmerie ; four à chaux. |
| `col-de-corvenne` | Expulsion de 1916 ; mort de Léonce (fortin des Corneilles, 1916). |
| `aubrelieu` | ORC, Archives nationales (Lecteur), Musée des Arts du feu, Sûreté. |
| `tennok` | Carte de Léonce (1911) : la lentille de 1889. |
| `vellaak` | Audition de Teodor Haask (1976). |
| `port-senane` | Télégramme d'Andrin à sa libération (1952). |
| `monts-corvins` | Décor ; avion postal (PR-08). |

## 5. Nouvelles institutions, entreprises et presse (reportées dans `docs/monde/00-monde.md` §11)

| Nom | Nature | Fondée, siège | Note |
|---|---|---|---|
| *La Sentinelle des Corvins* | hebdomadaire régional, le samedi | 1871, Hautcorvin | Alignée de 1937 à 1952. Prix : 5 sous (1916), 15 sous (1936), 20 sous (1937), 0,30 Fn (1966), 0,40 Fn (1975–1976). |
| **Verreries de Hautcorvin** | verre, lentilles de phare, verre gravé | 1790 (existe) | Préciser : siège à Hautcorvin, **halle des fours à Vernezac**. |
| **L'Égide** | compagnie d'assurances contre l'incendie | 1858, Aubrelieu | RP-02. |
| **Studio Orlhac** | photographie | 1890, Hautcorvin | OF-02, OF-05, PH-06, PH-14–17. |
| **Compagnie des guides de Vernezac** | guides de montagne, insignes numérotés | 1898, Vernezac | PH-02, PR-08. |
| **Douanes velmarchoises, brigade de la Vèze** | administration | Vernezac | RP-04. |
| **Musée des Arts du feu** | musée (verre, céramique, émail) | Aubrelieu | EX-04. |
| **Verrerie de Brénica** | verrerie thalbère | Brenzac | CT-02. |
| **Annuaire du commerce et de l'industrie de Velmarche** | annuaire | 1926 : 12 fl. | Prix nouveau, à ajouter au §5. |
| **Le Messager de Brenzac**, édition velmarchoise | quotidien | existe | 0,20 Fn en 1953 (prix nouveau). |
| **Garde d'Ordre**, lieutenance de Hautcorvin | Régence | 1937–1952 | Remplace la gendarmerie grand-ducale. |
| **Loi de 1973, art. 12** | représentation des absents morts en détention | — | Validée ; reportée au §2. |
| **Arrêté du 20 avril 1916** ; **arrêté du 8 juillet 1938** | expulsions des Thalbères des provinces frontières | — | Reportés au §2. |
