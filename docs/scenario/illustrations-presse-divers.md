# Illustrations des séries PR, CP, CT, PB et DV — fiches de brief

> Pour le `cartographe`. Une fiche par fichier `content/cases/succession-varenque/illustrations/<id>.svg`
> déclaré dans le frontmatter `illustration` d'un document des séries PR (presse), CP (cartes
> postales), CT (catalogues), PB (publicités et affiches) et DV (objets). Les séries AN (annuaires)
> et RP (rapports) n'ont pas d'illustration : elles se lisent.
>
> Mêmes règles que `illustrations.md` (séries OF, PH, EP) et `illustrations-rg-lt.md` :
> - âges : `07-coherence.md` §4 ; constantes physiques (en **gras**) : `04-personnages.md`, identiques
>   d'une image à l'autre et **du même côté** (gauche = gauche du personnage) ;
> - **aucune lettre lisible** dans l'image qui ne figure pas aussi dans le texte du document : titres,
>   légendes, slogans et cachets sont dans le Markdown ; dans le SVG, le texte est rendu en traits
>   illisibles (gribouillis réguliers, `ink-soft`/`ink-faint`) ;
> - aucun figurant ne porte de trait héréditaire de la famille (mèche, strabisme, menton fendu) ni
>   d'anneau d'or à l'oreille gauche ;
> - technique et classes : `docs/DESIGN.md` §10 (taille-douce + lavis, `ART_CLASSES` seulement) ;
>   contraintes : `docs/ARCHITECTURE.md` §3.7, règles 8 et 9 (≤ 60 Ko gzip).
>
> Conventions de ces séries :
> - **Photo de presse** (tramée) : rendre la trame par `#art-stipple` sur les ombres ; cadre net, sans
>   coins arrondis ; pas de lavis vif (au plus `wash-ardoise` à faible opacité) avant 1971.
> - **Gravure de presse** (avant 1905) : trait seul `ink`/`ink-soft`, hachures `#art-hatch`, sans lavis.
> - **Affiches et cartes postales** : lavis francs (deux couches au plus), aplats décoratifs.
> - **Papier Varenque** : toute fougère **vendue** porte sous la tige l'année et « PV » (traits illisibles
>   à cette taille) ; seule la fougère du réseau et des lettres de « N. » n'a **rien** sous la tige
>   (convention partagée avec `lt-15.svg`).

Repères : **mèche blanche** au-dessus du front, côté gauche (Clémence, Augustin 1872, Adélaïde,
Odile, Lise) ; **strabisme** léger de l'œil gauche, vers l'extérieur (Lucien, Victor, Claude) ;
**menton fendu** (Gaspard, Augustin 1924, Armand, Hélène) ; **anneau d'or à l'oreille gauche**
(Firmin 1849, Firmin 1900, Tavik).

---

## PR — Presse

### `pr-01.svg` — Médaille d'or de la Grande Exposition (*Courrier*, 22 oct. 1889)
- **Support** : vignette gravée au trait dans une colonne de journal, format paysage ~ 3:2.
- **Composition** : à gauche, l'avers d'une médaille ronde (profil d'homme couronné, sans traits
  détaillés, bordure de lauriers) ; à droite, une main d'homme tient une feuille de papier devant une
  lampe à huile ; dans la feuille, en clair, une **fronde de fougère** à tige droite et onze paires de
  pinnules, avec sous la tige le petit bloc millésime + « PV » (illisible).
- **Personne** : aucune (la main est anonyme, manchette de redingote).
- **Rôle** : montre le filigrane commercial de référence (à comparer avec `lt-15.svg`).

### `pr-02.svg` — Le capitaine Firmin Varenque (*L'Écho de Port-Sénane*, mars 1902)
- **Support** : gravure en médaillon ovale, trait seul, hachures croisées dans le fond.
- **Personne** : `firmin-varenque-1849`, **46 ans** (d'après une photographie de 1895). Large nez,
  **barbe fournie grisonnante**, **anneau d'or à l'oreille gauche** bien visible (tête de trois quarts
  vers la droite pour dégager l'oreille gauche), casquette d'officier à galon, vareuse à double rangée
  de boutons. Œil rieur, pattes d'oie.
- **Constantes** à garder avec `ph-03.svg` : nez, anneau, carrure.

### `pr-05.svg` — Le phare de Tennok dans la tempête (*Courrier*, 24 nov. 1924)
- **Support** : gravure au trait, format vertical ~ 2:3, encadrée d'un filet.
- **Composition** : phare blanc à **bande rouge** (rendue en hachure dense, pas de couleur) sur un cap
  rocheux, faisceau en éventail ; pluie oblique en traits fins ; au premier plan, une ligne de récifs
  pointus (les **Dents de Tennok**) dans l'écume ; au loin, une petite coque couchée.
- **Personne** : aucune.

### `pr-06.svg` — Blanche Aubertine dans *La Lanterne d'Ostrie* (*L'Œil velmarchois*, févr. 1929)
- **Support** : photo de presse tramée, portrait vertical, studio.
- **Personne** : `blanche-varenque`, **28 ans**. Cheveux ondulés « au fer » courts, **grain de beauté
  au-dessus de la lèvre, à gauche** (net), **rang de perles**, robe de scène longue à sequins (costume
  ostrien stylisé : col à zigzags brodés), une **lanterne de marin** allumée tenue à bout de bras, regard
  vers le haut, bouche entrouverte (fin d'air).
- **Constantes** à garder avec `ph-05.svg`, `ph-19.svg`, `ph-21.svg` : grain de beauté, perles.

### `pr-08.svg` — Le commissaire et le directeur (*Le Héraut*, 21 mai 1938)
- **Support** : photo de presse tramée, paysage, contraste dur (photo de propagande).
- **Composition** : salon officiel, drapeau à plis derrière, une table couverte de piles de petits
  carnets (gris, rendus en `wash-ardoise` très léger ou en stipple).
- **Personnes** :
  - à gauche, `marcel-daubry`, **41 ans** : **très mince**, **fine moustache**, raie nette sur le côté,
    paupières lourdes, costume sombre et **écharpe grise** de fonction en sautoir ; **tourné de trois
    quarts vers la droite du lecteur** de sorte que son **oreille droite entaillée** (encoche en haut du
    pavillon) soit visible ; main droite tenant un carnet ouvert : **chevalière en or gravée « D » à
    l'auriculaire droit** ;
  - à droite, `gaspard-varenque`, **39 ans** : **lunettes rondes d'écaille**, **menton fendu**, cheveux
    plaqués **raie au milieu**, costume trois-pièces, **léger dos voûté**, il regarde le carnet, pas
    l'objectif.
- **Rôle** : deux visages de référence ; c'est cette image qui nourrit la fausse piste (ils posent
  ensemble). L'oreille et la chevalière doivent être réutilisées à l'identique sur `ph-27.svg`.

### `pr-09.svg` — Le moulin de la Sorbe après la rafle (*Le Héraut*, 21 oct. 1941)
- **Support** : photo de presse tramée, paysage, sombre.
- **Composition** : intérieur d'un vieux moulin en ruine (poutres effondrées, lumière par un toit
  crevé, hêtres derrière les fenêtres sans vitres) ; une **petite presse à bras renversée**, des feuilles
  éparses, une cuve de pierre ; deux gardes en capote et calot portent des cartons.
- **Personnes** : figurants seulement, **de dos ou de profil perdu** ; aucun visage reconnaissable.
  Ni Odile ni Orrin ne figurent sur l'image.

### `pr-10.svg` — « Les familles d'ordre accueillent les pupilles » (*Le Héraut*, 11 oct. 1942)
- **Support** : photo de presse **à trame grossière**, mal imprimée (léger flou de bougé, encrage
  irrégulier).
- **Composition** : perron d'un immeuble bourgeois (avenue de la Charte) ; un couple en tenue de ville,
  la femme tient un nourrisson emmailloté dans un châle blanc.
- **Personnes** : `marcel-daubry` (45) et `blanche-varenque` (41), mais **visages volontairement
  illisibles** : bords de chapeaux, ombre portée, trame qui mange les traits. Ni grain de beauté, ni
  oreille, ni chevalière visibles. Le nourrisson est un visage rond sans trait (le bonnet couvre le front).
- **Rôle** : la pièce prouve un nom et une adoption, pas des visages (les visages sont sur `ph-19.svg`).

### `pr-11.svg` — Portrait gravé sur bois d'« Augustin V. » (*Fougère*, juin 1944)
- **Support** : petit bois gravé imprimé en noir, ~ 1:1, sur papier pelure ; bords irréguliers du bloc,
  encrage par aplats, aucune demi-teinte (traits blancs taillés dans le noir).
- **Personne** : `augustin-varenque-1924`, **20 ans**. **Menton fendu** très marqué, **mèche de
  cheveux tombant sur l'œil droit**, **écharpe à rayures** de la faculté, col de chemise ouvert ;
  regard de face.
- **Constantes** à garder avec `pb-04.svg` : menton, mèche sur l'œil droit, écharpe.

### `pr-12.svg` — Gaspard Varenque acquitté (*Courrier*, 13 mai 1953)
- **Support** : photo de presse tramée, prise au flash, de nuit.
- **Composition** : grand escalier d'un palais de justice, colonnes ; deux rangs de curieux flous de
  part et d'autre ; un homme descend seul au centre.
- **Personne** : `gaspard-varenque`, **54 ans** : **crâne dégarni**, **lunettes rondes**, **menton
  fendu**, pardessus sombre, chapeau à la main, dos un peu voûté, visage fermé.

### `pr-13.svg` — « Le Goéland, 1951 », planche de Nora Ilvess (*L'Œil velmarchois*, oct. 1958)
- **Support** : reproduction d'une photographie d'art, cadrage serré, noirs profonds, belle lumière
  latérale (c'est une photographe de talent).
- **Personne** : `firmin-varenque-1900`, **51 ans** : **barbe grise courte**, casquette de marin
  repoussée en arrière, **anneau d'or à l'oreille gauche**, chandail à zigzags aux manches relevées,
  **goéland tatoué sur l'avant-bras droit** (bien lisible), main sur la barre ; il rit, yeux plissés.
- **Constantes** à garder avec `ph-14.svg` et `ph-20.svg` : anneau, tatouage.

### `pr-15.svg` — Victor Sauge ; ses obsèques (*Courrier*, 14 janv. 1966)
- **Support** : deux photos de presse tramées côte à côte dans un même cadre (gauche plus petite).
- **À gauche** : `victor-sauge`, **54 ans** (portrait vers 1960, en extérieur, terrain d'aviation) :
  **strabisme de l'œil gauche**, **fossettes**, **fine moustache**, tempes grises, blouson de cuir.
- **À droite** : cimetière sous la neige, sortie d'un cortège ; au premier plan
  - `ninon-brial`, **53 ans** : **turban noué** noir, **grands anneaux aux deux oreilles**, sourcils
    noirs épais, manteau noir ;
  - `claude-sauge`, **27 ans** : **cheveux très courts**, **léger strabisme de l'œil gauche**, manteau
    noir, col roulé ; elle soutient sa mère par le bras.
- **Rôle** : trois visages de l'Atelier d'un coup ; le strabisme doit se lire chez Victor **et** chez Claude.

### `pr-16.svg` — Photo de signature de Paul Marsal (*Courrier*, mars 1968)
- **Support** : petite photo tramée carrée en tête de colonne.
- **Personne** : `paul-marsal`, **39 ans** : **nez cassé** (arête déviée), **pipe** au coin de la
  bouche, **col roulé**, cheveux bouclés **dégarnis aux tempes**.

### `pr-17.svg` — Les obsèques de Gaspard Varenque (*Gazette de l'Orvelle*, sept. 1971)
- **Support** : photo de presse, paysage ; premiers tons de couleur possibles (*Gazette* de 1971) :
  lavis très léger `wash-sauge` sur les tilleuls, `wash-ardoise` sur la pierre.
- **Composition** : allée de cimetière de bourg sous les tilleuls ; ouvriers en haie, casquette à la
  main, flous au fond ; le cercueil sort du cadre à gauche.
- **Personnes** :
  - au premier rang, `armand-varenque`, **44 ans** : **grandes oreilles**, **menton fendu**, **nœud
    papillon** noir, **tempes grises** ;
  - à sa gauche, `helene-varenque`, **40 ans** : **cheveux courts bouclés**, **lunettes à monture
    d'écaille**, **menton fendu**, tailleur sombre ;
  - un pas derrière, `paul-marsal`, **43 ans** : **nez cassé**, sans pipe, imperméable.
  - (Une très vieille dame à canne, floue, au fond : Adélaïde, 91 ans ; ni montre ni visage lisibles.)
- **Piège voulu** : Armand et Paul ne doivent pas se ressembler (oreilles contre nez).

---

## CP — Cartes postales (recto illustré)

### `cp-01.svg` — Aubrelieu, la place de la Charte et la colonne Morel (1905)
- **Support** : carte postale phototypique, paysage, légèrement rehaussée à l'aquarelle (lavis
  `wash-safran` sur les façades, `wash-ardoise` sur les pavés).
- **Composition** : une place pavée, façades à balcons, un fiacre ; au premier plan une **colonne
  d'affichage** : sur la colonne, en grand, une affiche montrant **une jeune lavandière souriante**
  (silhouette reconnaissable de `pb-01.svg` en miniature : chignon lâche, manches retroussées, drap
  blanc) ; à côté, quatre petites affiches électorales identiques à médaillon (`pb-02.svg` en miniature).
- **Personnes** : passants anonymes, petits, sans traits.

### `cp-02.svg` — Tennok, le phare et les Dents (1930)
- **Support** : carte postale photographique, paysage, ciel clair, lavis `water` sur la mer.
- **Composition** : le phare blanc à bande rouge sur son cap, la maison du gardien à ses pieds,
  l'abri du canot ; au premier plan, la ligne des **Dents de Tennok** dans l'écume.
- **Personnes** : aucune.

### `cp-03.svg` — Aubrelieu, le palais des Chartes (vers 1970)
- **Support** : carte postale en couleurs « passées » (lavis `wash-safran` pâle, `water` sur
  l'Orvelle, `wash-ardoise` sur les toits).
- **Composition** : façade à colonnes d'un grand palais administratif au bord du fleuve, perron,
  réverbères, trois voitures des années soixante ; drapeau au fronton.
- **Personnes** : aucune reconnaissable.

---

## CT — Catalogues (couverture)

### `ct-01.svg` — *Autoportrait au chapeau* (1910), couverture de la rétrospective Lucien Varenque (1920)
- **Support** : reproduction en couleurs d'une huile, cadrée dans une couverture de catalogue à filet ;
  touche visible, lavis `wash-sienne` et `wash-carmin` (peinture), fond `wash-ardoise`.
- **Personne** : `lucien-varenque`, **35 ans** : **barbe brune en pointe**, **strabisme de l'œil
  gauche** (il dévie vers l'extérieur, nettement), **chapeau de feutre à large bord**, grande
  **lavallière** nouée lâche, doigts tachés de peinture (une main tient un pinceau au bord du cadre).
- **Constantes** à garder avec `ph-08.svg` et `ph-02.svg` (l'enfant qui louche).

### `ct-02.svg` — « Pour É., 1962 », couverture de *Visages de la côte* (1964)
- **Support** : photographie noir et blanc d'art, carrée, en pleine couverture.
- **Composition** : un **berceau d'osier vide** posé sur un quai de pierre, au bord de l'eau, dans la
  brume ; une couverture pliée dedans ; au loin, la silhouette d'un phare à peine visible.
- **Personnes** : aucune. Pas de mèche, pas de visage : c'est un vide.

---

## PB — Publicités et affiches

### `pb-01.svg` — Affiche « La Lavandière », Savonnerie Mérande (1905)
- **Support** : affiche lithographiée verticale ~ 2:3, aplats francs (`wash-carmin` sur le fichu,
  `wash-safran` sur le fond, `water` sur le baquet), cerne `ink` épais, style « Belle Époque ».
- **Personne** : `pauline-sauge`, **21 ans**, **idéalisée** : visage rond, cheveux noirs **bouclés en
  chignon lâche**, **sourire aux dents de devant écartées** (bien visible, c'est la preuve), manches
  retroussées, tablier ; elle tord un drap blanc au-dessus d'un baquet ; corde à linge derrière.
  La petite cicatrice au menton **n'apparaît pas** (l'affiche embellit) : elle n'est que sur les photos.
- **Signature** : un minuscule monogramme dans le coin inférieur gauche, traits illisibles (le texte
  « L.V. 05 » est dans le Markdown).
- **Constantes** à garder avec `ph-08.svg` et `ph-09.svg` : chignon, dents écartées.

### `pb-02.svg` — Affiche électorale « Votez Augustin Varenque » (1905)
- **Support** : affiche typographique deux couleurs (noir et `wash-indigo`), portrait en médaillon
  gravé en haut ; le reste en blocs de texte illisibles.
- **Personne** : `augustin-varenque-1872`, **33 ans** : corpulent, **moustache en guidon cirée**,
  **pince-nez à ruban noir**, cheveux pommadés en arrière où **la mèche blanche ne paraît que comme un
  reflet** à gauche, col cassé, cravate.

### `pb-03.svg` — Affiche de *La Lanterne d'Ostrie* (1929)
- **Support** : affiche verticale aux aplats stylisés (années vingt), `water-deep` et `water` pour la
  mer, `wash-safran` pour la lumière.
- **Composition** : une **lanterne de marin** allumée flotte sur une mer sombre ; au loin, un phare
  dont le faisceau traverse la nuit ; vagues en arabesques. **Aucun personnage.**

### `pb-04.svg` — Avis de la Régence du 17 juin 1944
- **Support** : affiche officielle verticale, **bordure noire épaisse**, texte en capitales illisible ;
  aucun lavis (papier gris).
- **Composition** : trois petites photos d'identité alignées sous le titre, chacune avec un numéro
  illisible.
- **Personnes** :
  - à gauche, `augustin-varenque-1924`, **20 ans** : **menton fendu**, **mèche de cheveux sur l'œil
    droit**, col ouvert, **écharpe à rayures** ;
  - au centre, un homme de 24 ans, maigre, cheveux ras, oreilles décollées (hors arbre) ;
  - à droite, un homme de 31 ans, barbe de trois jours, nez busqué (hors arbre).
- Une déchirure en haut à droite (l'avis a été arraché du mur).

---

## DV — Objets

### `dv-01.svg` — Planche d'herbier : fougère royale (1888)
- **Support** : grande planche d'herbier verticale, papier épais, bords légèrement roussis.
- **Composition** : une **fronde de fougère royale** séchée fixée par neuf bandelettes de papier gommé ;
  étiquette imprimée en bas à droite (cases, écriture illisible) ; dans la marge droite, au crayon,
  quelques lignes illisibles et un **croquis simplifié de la fronde** : tige droite, **onze paires de
  pinnules**, sans sporanges — c'est le dessin du futur filigrane. Lavis `wash-sauge` pâle sur la fronde.
- **Personne** : aucune.

### `dv-02.svg` — Plan de table et menu du banquet du 10 juin 1922
- **Support** : carton plié ouvert à plat, papier crème ; en transparence, discrète, la fougère du
  papier (avec son bloc millésime sous la tige).
- **Composition** : volet gauche, schéma d'une **table rectangulaire** avec six places de chaque côté,
  noms calligraphiés en traits illisibles à l'encre violette (`wash-lilas` sur les traits) ; une
  **place du côté du jardin, en bout de table, sans nom, marquée d'une petite croix au crayon** ; volet
  droit, menu imprimé en blocs illisibles, une petite vignette de tilleul en tête.
- **Personne** : aucune.

### `dv-03.svg` — Vue de microfilm MF-74-112 (registre bleu)
- **Support** : tirage papier d'une vue de microfilm 35 mm, **en négatif gris** (fond sombre, écriture
  claire), amorce de film perforée sur le bord gauche, rayures fines de lecture.
- **Composition** : une page de registre à **cinq colonnes** réglées, couverte d'une écriture serrée à
  la plume (illisible) ; en haut, une **mire de prise de vue** (petit carré de cotes et une règle
  graduée).
- **Personne** : aucune. **Pas de filigrane visible** (le microfilm ne le restitue pas : c'est dit dans RP-06).

### `dv-04.svg` — Faire-part de décès d'Henriette Varenque (déc. 1950)
- **Support** : carte rectangulaire bordée d'un **large filet noir**, texte centré en blocs illisibles.
- **Composition** : dans le coin supérieur gauche, une **petite fougère gaufrée à sec** (relief blanc
  sur blanc, rendu en `ink-faint`).
- **Personne** : aucune.

### `dv-05.svg` — *Petit lexique ostrien-velmarchois* (1954)
- **Support** : petit livre broché ouvert, couverture **papier gris-bleu** (`wash-indigo` léger) à
  gauche, page de garde à droite.
- **Composition** : sur la couverture, un titre en deux blocs illisibles et une **vignette gravée d'un
  goéland au-dessus d'une vague** ; sur la page de garde, une dédicace manuscrite de quelques lignes
  illisibles, à l'encre, écriture penchée.
- **Personne** : aucune.
