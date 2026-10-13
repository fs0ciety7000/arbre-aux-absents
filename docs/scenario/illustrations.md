# Illustrations des documents — fiches de brief

> Pour le `cartographe`. Une fiche par fichier `content/cases/succession-varenque/illustrations/<id>.svg`
> référencé par un document des séries OF, PH et EP (frontmatter `illustration` ou figure du corps).
> Les âges sont ceux de `07-coherence.md` §4 ; les constantes physiques (en **gras**) sont celles de
> `04-personnages.md` et doivent rester **identiques d'une image à l'autre** et **du même côté**
> (gauche = gauche du personnage). Les portraits de case (`portraits/<id>.svg`) suivent les briefs
> de `04-personnages.md` ; l'`alt` de chaque portrait est dans `family.json`.
>
> Règles communes :
> - Style : gravure / lavis sépia ou noir et blanc selon l'époque, lisible au format téléphone ;
>   les traits distinctifs doivent se voir **sans zoom** quand ils servent à la déduction (mèche,
>   strabisme, menton fendu, doigts manquants, anneau, grain de beauté, brûlure, oreille entaillée).
> - Aucune lettre lisible dans l'image qui ne figure pas aussi dans le texte du document (accessibilité,
>   et pour ne rien prouver de plus que la pièce) ; les légendes et versos sont dans le texte, pas dans le SVG.
> - Aucun visage hors arbre ne doit ressembler à un membre de la famille (pas de mèche, pas de
>   strabisme, pas de menton fendu chez les figurants).
> - Contraintes techniques : classes de `ART_CLASSES` uniquement, ids préfixés par le fichier,
>   ≤ 60 Ko gzip (contrat §3.7, règles 8 et 9).

Repères des traits héréditaires : **mèche blanche** au-dessus du front, côté gauche (Clémence,
Augustin 1872, Adélaïde, Odile, Lise) ; **strabisme** léger de l'œil gauche, qui dévie vers
l'extérieur (Lucien, Victor, Claude) ; **menton fendu** (Gaspard, Augustin 1924, Armand, Hélène).
Coutume : **anneau d'or à l'oreille gauche** (Firmin 1849, Firmin 1900, Tavik).

---

## OF — Dossier de l'Office

### `of-03.svg` — « Adélaïde Varenque a 90 ans » (déc. 1969)
- **Support** : tirage de presse noir et blanc, portrait vertical, bords blancs.
- **Composition** : buste et genoux, assise bien droite dans un fauteuil à oreilles, trois quarts
  face ; fenêtre aux vitres embuées à gauche ; cahier d'écolier ouvert sur les genoux.
- **Personne** : `adelaide-varenque`, 90 ans. Cheveux blancs en **couronne tressée**, **grain de beauté
  sur la joue droite**, **montre de col en argent** épinglée sur une robe sombre à col blanc, regard droit
  et sévère, un pli d'amusement au coin de la bouche. La mèche n'est plus visible (cheveux blancs).
- **C'est aussi le portrait de case** : l'illustration et `portraits/adelaide-varenque.svg` doivent être
  très proches.

---

## PH — Photographies

### `ph-01.svg` — Carte-album de mariage, Studio Lumen (14 mai 1870)
- **Support** : carte-album verticale, tirage albuminé chaud, carton crème à coins dorés.
- **Décor** : toile peinte de balustrade et palmier en pot, tapis à franges.
- **Personnes** :
  - debout à gauche, `anselme-varenque`, 24 ans : cheveux bruns pleins rejetés en arrière, **favoris en
    côtelettes** courts, **cicatrice pâle en travers du sourcil gauche**, redingote raide, chaîne de montre ;
    main sur le dossier du fauteuil ;
  - assise, `clemence-aubertot`, 19 ans : bandeaux bruns, raie médiane, **mèche blanche à gauche**, col
    montant de dentelle fermé par une **broche en fronde de fougère**, bouquet de fougères et de muguet,
    demi-sourire du coin gauche.

### `ph-02.svg` — Les Tilleuls, été 1885
- **Support** : carton cabinet, tirage brun.
- **Décor** : banc de jardin sous un grand tilleul, perron d'une maison de maître, fenêtre ouverte avec
  un rideau flou.
- **Personnes** (aucun nom dans l'image) :
  - sur le banc à gauche, `anselme-varenque`, 39 ans : front dégarni, **favoris**, **cicatrice au sourcil
    gauche**, redingote, journal plié ;
  - sur le banc à droite, `clemence-aubertot`, 35 ans : **mèche blanche**, **broche fougère** ;
  - sur ses genoux, `adelaide-varenque`, 5 ans : robe à smocks, **mèche blanche nette** ;
  - debout derrière à gauche, `augustin-varenque-1872`, 13 ans : col marin, air sérieux, **mèche claire** ;
  - debout derrière à droite, `lucien-varenque`, 9 ans : culottes courtes, genoux écorchés, **l'œil
    gauche qui dévie** nettement.
- **Enjeu** : déduction par âges et traits ; les trois enfants doivent être lisibles séparément.

### `ph-03.svg` — Mariage au cap de Tennok (juin 1873)
- **Support** : tirage pâli, coins mangés d'humidité.
- **Décor** : mur blanchi d'une maison basse ; base d'une tour ronde ; en haut à gauche, coupée par le
  cadre, la galerie du phare. Vent dans les rubans.
- **Personnes** :
  - à gauche, `firmin-varenque-1849`, 23 ans : large nez, **barbe noire fournie**, **anneau d'or oreille
    gauche**, casquette d'officier, vareuse à double rangée de boutons, galons de second ;
  - à droite, `maaren-tennok`, 21 ans : mâchoire forte, yeux très clairs, **tresses blondes** sous une
    coiffe à rubans, **col blanc brodé de zigzags**, tablier brodé ; elle regarde la mer, hors champ.

### `ph-04.svg` — Carte postale « Le phare et la famille du gardien » (1910)
- **Support** : phototypie grise, format carte postale horizontal ; marge blanche en bas (la légende
  est dans le texte).
- **Décor** : à droite, le phare de Tennok (tour blanche **à bande sombre**, galerie, lanterne), maison du
  gardien, abri du canot, récifs au fond.
- **Personnes** devant la porte :
  - premier plan centre, `maaren-tennok`, 58 ans : **couronne de tresses grises** au ruban brodé, **col
    brodé de zigzags**, châle, un **trousseau de grosses clés** à la main (indice discret : c'est elle,
    la gardienne) ;
  - derrière à gauche, `aldrik-varenque`, 36 ans : rasé, buriné, **chandail à zigzags**, main gauche sur
    l'épaule du garçon, **annulaire et auriculaire manquants** bien visibles ;
  - à droite, `tenna-orrvik`, 32 ans : **lunettes rondes**, **fichu noué sur la nuque**, large sourire ;
  - devant, `firmin-varenque-1900`, 10 ans : pieds nus, visage un peu flou (il a bougé) ;
  - devant, `selda-varenque`, 7 ans : très sérieuse, poupée de chiffon sous le bras, **taches de rousseur**.

### `ph-05.svg` — Mariage de Gaspard et d'Irène (10 juin 1922)
- **Support** : grand tirage sépia paysage, carton gris à liseré doré, timbre sec du studio en bas à
  droite (sans texte lisible).
- **Décor** : perron des Tilleuls, deux tilleuls en fleurs, glycine sur la balustrade ; lumière de fin
  de matinée venant de la gauche. Tous regardent l'objectif sauf la jeune fille assise par terre.
- **Rang du fond, debout, de gauche à droite** :
  1. `marcel-daubry`, 25 ans : **très mince**, **fine moustache**, raie à gauche, paupières lourdes,
     jaquette ; **chevalière** (main droite sur le revers) ; trois quarts : **oreille droite entaillée** visible ;
  2. `blanche-varenque`, 21 ans : robe claire taille basse, **rang de perles**, cheveux ondulés courts,
     **grain de beauté au-dessus de la lèvre à gauche** ; tout près de Marcel ;
  3. `augustin-varenque-1872`, 50 ans : corpulent, **moustache en guidon grise cirée**, **pince-nez à ruban
     noir**, redingote, insigne à la boutonnière ;
  4. `gaspard-varenque`, 23 ans : le marié, jaquette, œillet blanc, **lunettes rondes d'écaille**, **menton
     fendu**, raie au milieu ; main sur l'épaule de la mariée ;
  5. Albert Castagne (hors arbre), 56 ans : favoris blancs, gilet croisé, montre ;
  6. `firmin-varenque-1900`, 22 ans : costume trop court aux poignets, rasé, hâlé, **anneau d'or oreille
     gauche**, casquette à la main, un peu à l'écart au bout du rang.
- **Rang du devant, assis, de gauche à droite** :
  1. `adelaide-varenque`, 42 ans : cheveux sombres en chignon, **mèche blanche**, **grain de beauté joue
     droite**, **montre de col**, robe sombre ;
  2. `henriette-sorbelle`, 46 ans : **très grande** même assise, chignon grisonnant, chapeau à plumes,
     **face-à-main** sur les genoux, **fossette au menton** ;
  3. `irene-castagne`, 19 ans : voile court, **carré noir**, **long cou**, **sautoir de jade** ;
  4. `clemence-aubertot`, 72 ans : cheveux blancs (mèche invisible), canne à pommeau, **broche fougère**.
- **Par terre, centre gauche** : `odile-varenque`, 13 ans, en tailleur, robe blanche froissée, deux nattes,
  **mèche blanche nette**, **sourcils épais**, tache d'encre au doigt ; elle regarde l'appareil lui-même.

### `ph-05-croquis.svg` — Verso de PH-05 : croquis numéroté
- **Support** : carton gris clair, trait de crayon.
- **Contenu** : onze ovales numérotés disposés comme sur la photo (six en haut, quatre au milieu, un en
  bas à gauche). Numéros, de gauche à droite : rang du fond **9, 7, 3, 1, 11, 10** ; rang assis **6, 4,
  2, 5** ; par terre **8**.
- **Déchirure** : le coin inférieur droit du carton manque (bord irrégulier) ; elle ne touche pas les
  ovales mais la liste écrite qui se trouve dans le texte.

### `ph-06.svg` — « Les métiers du papier », L'Œil velmarchois (nov. 1937)
- **Support** : double page de magazine illustré, similigravure ; titre en capitales art déco (non lisible
  en détail).
- **Photo principale** : `odile-varenque`, 29 ans, penchée sur un établi sous une lampe à abat-jour de
  métal. Cheveux bruns raides **coupés au menton**, **mèche blanche à gauche**, **sourcils épais** froncés,
  blouse aux manches retroussées. Main gauche : une **forme de papetier** tendue de fils de laiton (on y
  devine une fougère en fil). Main droite : un burin ; **tache claire et luisante au dos de la main droite**
  (brûlure d'acide), bien visible.
- **Vignettes** à droite : une cuve de pâte avec un ouvrier qui lève la forme ; une pile de rames.

### `ph-07.svg` — Victor Sauge devant L'Hirondelle (juil. 1931)
- **Support** : tirage de presse brillant ; retouche blanche dans le ciel.
- **Composition** : `victor-sauge`, 25 ans, appuyé d'une épaule contre l'hélice d'un biplan monomoteur ;
  **casque de cuir**, **lunettes de vol relevées**, blouson de cuir ouvert, écharpe blanche ; sourire avec
  **fossettes** ; **œil gauche légèrement dévié**. Sur le capot, une hirondelle peinte. Foule floue en
  canotiers derrière une barrière ; un mécanicien à droite.

### `ph-08.svg` — L'atelier de la rue des Tanneurs (1905)
- **Support** : petit tirage d'amateur, bords flous.
- **Décor** : atelier sous verrière, toiles retournées, poêle, cordes à linge, une **esquisse d'affiche**
  (une lavandière au panier) punaisée sur une planche.
- **Personnes** :
  - à gauche, `lucien-varenque`, 29 ans, au chevalet, tête tournée vers l'objectif : **barbe brune en
    pointe**, **chapeau de feutre à large bord**, **lavallière**, blouse ouverte, **doigts tachés de peinture**,
    **œil gauche qui dévie** ;
  - à droite, sur une estrade, `pauline-sauge`, 21 ans, en pose de lavandière : tablier de toile, manches
    retroussées, panier sur la hanche, cheveux noirs **bouclés en chignon lâche** ; elle **rit** et montre
    ses **dents de devant écartées** ; **petite cicatrice au menton**.

### `ph-09.svg` — Œuvre des Lavandières, rapport 1912 (hors-texte)
- **Support** : similigravure pleine page.
- **Décor** : lavoir couvert, poutres, bacs.
- **Personnes** : huit femmes.
  - au centre, debout, `henriette-sorbelle`, 36 ans : **très grande** (une tête de plus que toutes),
    visage long, **fossette au menton**, **chapeau à plumes d'autruche**, manteau sombre, **face-à-main** à
    la ceinture ;
  - immédiatement à sa droite (à gauche de l'image), `pauline-sauge`, 28 ans : cheveux noirs bouclés en
    chignon lâche, sourire aux **dents écartées**, **cicatrice au menton**, tablier ; un garçon d'environ
    six ans (Victor, non identifiable : pas de visage net, il regarde ailleurs) accroché à sa jupe ;
  - six blanchisseuses hors arbre, en tablier : âges et coiffures variés, aucun trait de la famille.

### `ph-10.svg` — Le canot de sauvetage de Tennok (1912)
- **Support** : phototypie grise, carte postale horizontale.
- **Décor** : canot blanc à dix avirons sur son chariot, sortant d'un abri de pierre ; le mot *TENNOK*
  sur l'étrave (seul texte admis, il est dans le document) ; phare blanc à bande sombre au fond à droite.
- **Personnes** : huit hommes en ligne, gilets de liège sur cirés, bonnets.
  - au centre, un pas en avant, `aldrik-varenque`, 38 ans : rasé, buriné, yeux enfoncés, **chandail à
    zigzags** sous le ciré ouvert, casquette dans la main droite ; **main gauche pendante, annulaire et
    auriculaire manquants** ;
  - sept canotiers hors arbre.

### `ph-11.svg` — Programme du récital d'Irène Castagne (1928)
- **Support** : couverture de programme, cadre art déco de vagues stylisées sur fond sombre.
- **Médaillon** : `irene-castagne`, 25 ans, trois quarts profil, **carré court noir**, **long cou**,
  **sautoir de jade**, mains fines croisées sous le menton.
- Le texte (titre, nom) est dans le document : dans l'image, seulement des bandeaux décoratifs.

### `ph-12.svg` — La receveuse des postes de Tennok (1925)
- **Composition** : `tenna-orrvik`, 47 ans, derrière un guichet à grille de laiton : **lunettes rondes**,
  **taches de rousseur**, **fichu sombre noué sur la nuque**, **manchettes de lustrine**, large sourire,
  un tampon levé vers l'objectif ; **brassard de deuil** au bras gauche (son mari est mort en 1924).
- **Décor** : casiers de tri, balance à plateaux, calendrier, télégraphe sous housse.

### `ph-13.svg` — La rédaction de Vel Taalik (1936)
- **Support** : page de journal, photographie en haut.
- **Décor** : atelier bas de plafond, rames de papier, presse à pédale au fond, casse de caractères.
- **Personnes** :
  - debout à gauche, `selda-varenque`, 33 ans : **cheveux courts au carré**, **taches de rousseur**,
    **veste d'homme**, **fines lunettes au bout d'une chaînette**, cigarillo éteint, une épreuve à la main ;
  - à droite, devant la casse, `orrin-kessvel`, 31 ans : grand, **cheveux blonds bouclés** sous une
    **casquette plate**, **doigts noircis d'encre**, il rit et montre une **incisive cassée** (supérieure).

### `ph-14.svg` — Mariage à Vellaak (1930)
- **Support** : tirage sous-exposé, bord gondolé.
- **Décor** : quai de bois, filets, coque d'un bateau pavoisé ; sur l'étrave, lettres *MAAR* puis un
  fanion qui cache la suite.
- **Personnes** :
  - à gauche, `firmin-varenque-1900`, 30 ans : rasé, hâlé, **anneau d'or oreille gauche**, chandail
    ostrien à zigzags neuf, casquette repoussée, manche droite remontée : **goéland tatoué** sur
    l'avant-bras droit (dessiner nettement un goéland ; le texte dit « oiseau de mer ») ; il rit ;
  - à droite, `hessa-draavik`, 24 ans : visage large, **nattes épinglées en couronne serrée**, costume
    brodé, bouquet de bruyère et d'ajonc, **tache de naissance sombre au cou, côté droit**.

### `ph-15.svg` — Les sages-femmes de la côte, Vel Taalik (1936)
- **Composition** : `hessa-draavik`, 30 ans, marche vers l'objectif sur un chemin de lande au-dessus de la
  mer, herbe couchée par le vent ; **nattes en couronne serrée**, **tache de naissance au cou à droite**,
  **sacoche de cuir** en bandoulière, lanterne éteinte à la main.

### `ph-16.svg` — Fiche BRR « VARENQUE Odile » (24 oct. 1941)
- **Support** : fiche cartonnée administrative, deux petites photos collées côte à côte, cases
  d'empreintes vides en dessous (les rubriques sont dans le texte, pas dans l'image).
- **Photos** : `odile-varenque`, 33 ans. De face : cheveux tirés, **joues creuses**, **sourcils épais**,
  **mèche blanche** échappée à gauche ; regard fixe. De profil droit : sa **main droite** tient l'ardoise
  du numéro, **cicatrice de brûlure au dos de la main** bien visible. Toise graduée derrière.
- **Ton** : sobre ; aucune trace de violence.

### `ph-17.svg` — Fiche BRR « KESSVEL Orrin » (24 oct. 1941)
- **Support** : identique à PH-16.
- **Photos** : `orrin-kessvel`, 36 ans. De face : très grand (la tête touche presque le bord), **cheveux
  tondus court** (blonds), arcade gauche un peu enflée, bouche entrouverte montrant l'**incisive supérieure
  cassée**. De profil droit : main tenant l'ardoise, **bout des doigts noirs d'encre**.

### `ph-18.svg` — Au lac d'Aulne (été 1941)
- **Support** : tirage carré à bords dentelés.
- **Décor** : ponton, barque, lac calme, aulnes, chalet à balcon découpé.
- **Personnes** dans la barque :
  - à l'arrière, `victor-sauge`, 35 ans : bras de chemise, **fine moustache**, **fossettes**, **œil gauche
    dévié**, avirons croisés ;
  - à l'avant, `ninon-brial`, 29 ans : **turban noué**, **grands anneaux aux deux oreilles**, **sourcils
    noirs épais** ; elle retient la fillette par la ceinture ;
  - `claude-sauge`, 3 ans : **frange droite**, regard bien en face, **même petit écart de l'œil gauche**,
    une main vers l'eau.

### `ph-19.svg` — « Notre Lise » (juil. 1942)
- **Support** : portrait de studio vertical, fond peint de jardin flou.
- **Personnes** :
  - assise, `blanche-varenque`, 41 ans : cheveux ondulés plus courts, **grain de beauté au-dessus de la
    lèvre à gauche**, **rang de perles** ; elle regarde l'enfant ;
  - sur ses genoux, Lise, 4 mois : robe longue, **bonnet de dentelle serré** (aucun cheveu visible : la
    mèche doit rester cachée) ;
  - debout derrière, `marcel-daubry`, 45 ans : **très mince**, **fine moustache**, raie sur le côté,
    paupières lourdes, costume sombre, insigne rond à la boutonnière ; main droite sur le dossier sans
    toucher Blanche, **chevalière à l'auriculaire** ; il regarde l'objectif, pas l'enfant.

### `ph-20.svg` — « Selda Varenque rentre d'exil », Vel Taalik (mai 1953)
- **Support** : une de journal, photo sous le titre.
- **Décor** : quai, coque noire d'un bateau de pêche, pluie fine.
- **Personnes** :
  - au centre, `selda-varenque`, 49 ans : **cheveux gris très courts**, **cigarillo**, **lunettes à chaînette**
    pendues sur le manteau ;
  - à gauche, `firmin-varenque-1900`, 53 ans : **barbe grise courte**, **anneau d'or oreille gauche**,
    chandail à zigzags, **goéland tatoué avant-bras droit**, porte une valise ;
  - à droite, `tavik-varenque`, 20 ans : **très grand**, **roux, imberbe**, **anneau d'or oreille gauche**,
    mains gauches.

### `ph-21.svg` — L'atelier des costumes de l'Opéra (1948)
- **Décor** : combles, mannequins de bois, rouleaux de tissu, table de coupe, fer sur réchaud.
- **Personnes** :
  - debout sur une estrade, `blanche-varenque`, 47 ans : robe de scène à traîne brodée de **petites
    lanternes**, cheveux ondulés courts, **grain de beauté**, **rang de perles**, bras levés, elle parle ;
  - à genoux, `ninon-brial`, 36 ans : **turban noué**, **grands anneaux aux deux oreilles**, **sourcils noirs
    épais**, trois épingles aux lèvres, **pelote à épingles au poignet** ; yeux baissés sur l'ourlet.

### `ph-22.svg` — « Les noces de l'année », L'Œil velmarchois (1951)
- **Composition** : parvis d'église, pluie de riz.
  - `armand-varenque`, 23 ans : cheveux noirs, **grandes oreilles**, **menton fendu**, jaquette, **nœud
    papillon** ; il rit et se protège d'une main ;
  - `mathilde-rouviere`, 21 ans, à son bras : **blonde en coque**, **eye-liner « œil de chat »**, **boucles
    d'oreilles perle**, robe à **col Claudine**, voile court.

### `ph-23.svg` — Couverture d'Antenne velmarchoise (1954)
- **Support** : couverture de magazine, couleurs douces retouchées ; titre du magazine en lettres
  stylisées (illisibles en détail) ; médaillon d'un téléviseur dessiné.
- **Composition** : gros plan de `mathilde-rouviere`, 24 ans : **blonde en coque**, **œil de chat**,
  **perles aux oreilles**, **col Claudine**, sourire, microphone de studio à grille ronde devant elle.

### `ph-24.svg` — Classe de 4e B, lycée de Bains-de-Mérande (juin 1955)
- **Décor** : préau à colonnes de fonte, tableau noir (le texte de la craie est dans le document).
- **Personnes** : vingt-quatre adolescentes de 13–14 ans sur quatre rangs de six, blouses claires à col
  rond, insigne sur la poche ; une professeure aux cheveux gris debout à droite.
  - **2e rang, 2e en partant de la gauche** : `lise-daubry`, 13 ans : **cheveux châtain clair bouclés**
    coupés court, **sourcils épais**, **mèche blanche nette à gauche, large comme deux doigts** ; menton
    levé, sans sourire. Elle doit se distinguer : toutes les autres ont les cheveux tirés ou une barrette.
  - Les 23 autres : variées, sans mèche, sans boucles châtain clair au 2e rang.

### `ph-25.svg` — Mariage d'Hélène et de Paul (1956)
- **Support** : coupure de journal régional, similigravure.
- **Composition** : marches d'une maison commune.
  - `helene-varenque`, 25 ans : **cheveux courts bouclés**, **lunettes à monture d'écaille**, **menton
    fendu**, robe blanche simple, voile court ;
  - `paul-marsal`, 28 ans : cheveux bouclés, **nez cassé** (arête déviée), costume sombre, **pas de pipe** ;
  - ils rient vers quelque chose hors cadre.

### `ph-26.svg` — « Autoportrait », Visages de la côte (1958)
- **Support** : héliogravure pleine page, noirs profonds.
- **Composition** : Nora Ilvess (= `odile-varenque`, 50 ans, **ne pas l'annoncer**) se photographie dans
  un grand **miroir piqué** ; appareil à visée par le haut contre la poitrine ; elle regarde son reflet.
  **Chignon bas**, **mèche blanche à gauche** (attention au miroir : sur un reflet photographié, la
  mèche — côté gauche de la personne — apparaît du côté gauche de l'image, et la main droite du côté
  droit), **sourcils épais**, **chandail ostrien à zigzags**, manches
  poussées ; **main droite** sur le déclencheur, dos de la main vers le miroir : **cicatrice de brûlure**.
- **Décor** (dans le miroir) : fenêtre à petits carreaux, port, séchoirs, morceau de fjord ; **fougère en
  pot** sur l'appui.

### `ph-27.svg` — Nécrologie de Marc Dobrin (1959)
- **Support** : coupure de journal étranger, petit portrait au-dessus de deux colonnes (texte illisible
  dans l'image).
- **Portrait** (photo de 1957) : Marc Dobrin (= `marcel-daubry`, 61 ans, **ne pas l'annoncer**) : **très
  mince**, **barbe grise courte**, **verres fumés ronds**, trois quarts vers la gauche pour montrer l'**oreille
  droite entaillée** ; main droite sur le revers, **chevalière gravée d'un D** à l'auriculaire.

### `ph-28.svg` — Inauguration du Lecteur LX-2 (nov. 1973)
- **Décor** : salle de lecture à boiseries, bustes ; console à **écran vert** et clavier, imprimante.
- **Personnes**, de gauche à droite :
  - M. Hautfeuille (hors arbre), environ 65 ans : cheveux blancs, lunettes, costume trois-pièces, mains
    derrière le dos ;
  - `claude-sauge`, 35 ans, penchée sur le clavier : **cheveux très courts**, **col roulé**, **règle à calcul
    dans la poche de poitrine**, **œil gauche légèrement dévié**, elle montre l'écran ;
  - `lise-daubry`, 31 ans : **blouse grise**, **gants de coton blanc**, **cheveux châtain clair bouclés**,
    **large bandeau** sur le front (**la mèche est cachée**), **sourcils épais** ; elle tient une microfiche
    à contre-jour.

### `ph-29.svg` — « Le dernier gardien de Tennok », Vel Taalik (1972)
- **Composition** : galerie du phare, rambarde ; en contrebas la mer, des récifs, l'abri du canot.
  `tavik-varenque`, 40 ans : **très grand**, **barbe rousse fournie**, **anneau d'or oreille gauche**,
  **chandail à zigzags reprisé aux coudes**, carnet de croquis fermé contre la poitrine.

---

## EP — Épilogue

### `ep-02.svg` — Carte postale de Vellaak (juin 1975)
- **Support** : carte postale couleur récente, teintes un peu trop douces.
- **Composition** : le phare de Tennok au crépuscule, **blanc à bande rouge**, lanterne allumée, mer calme ;
  sur la galerie, une silhouette minuscule accoudée qui regarde la lumière (non identifiable).
- Note : sur les images anciennes (PH-04, PH-10), la bande du phare est « sombre » parce que le tirage est
  monochrome ; c'est la même bande rouge.
