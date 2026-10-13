# art/keyart/ — art clé, vignettes, ornements animés

Taille-douce rehaussée d'aquarelle (DESIGN §10), générée par script : **ne pas retoucher les SVG
à la main**, modifier `art/tools/keyart/` puis régénérer.

```bash
node art/tools/keyart/build.mjs                 # tout, avec budgets (svgo + gzip, comme content:check)
node art/tools/keyart/build.mjs keyart-desk     # un seul fichier
node art/tools/keyart/sheet.mjs out.png --both --cols 4 --width 300 art/keyart/spot-*.svg   # planche-contact
node art/tools/keyart/sheet.mjs out.png --motion --cols 1 --width 1440 art/keyart/keyart-desk.svg  # groupes animés surlignés
```

Node 22, sans dépendance hors `svgo` (mesure) et Playwright (planches). Graine = nom du fichier
(`Svg` → `rng(hash(id))`) : deux exécutions donnent des fichiers identiques à l'octet près.

**Règles respectées** (vérifiées avec `checkSvg` + `optimizeSvg` de `packages/content-tools`, 0
problème) : couleurs **uniquement** par `ART_CLASSES` ; hors classes, seulement `none`,
`currentColor`, `url(#…)` locaux ; aucun `style=`, `<script>`, `<foreignObject>`, lien externe ;
ids préfixés par le nom du fichier. Racine `class="art"`. Les motifs `#art-hatch|-dense|stipple`
viennent de `<ArtDefs />` (à rendre sur l'écran). Aucun visage de personnage, aucun secret.

Classes « fixes » employées pour des teintes franches (elles ne changent pas sous `on-night`) :
`hair-roux|chatain|brun|blond` (bois, laiton, cire), `skin-2|3|4` (kraft), `photo-*`.

## Budgets mesurés (gzip après svgo)

| Fichier | viewBox | gzip | nœuds | Budget |
|---|---|---|---|---|
| `keyart-desk.svg` | 1600 × 900 (16:9) | 38,9 Ko | 864 | ≤ 120 Ko |
| `keyart-desk-tall.svg` | 800 × 1000 (4:5) | 34,3 Ko | 856 | ≤ 120 Ko |
| `spot-*.svg` (10) | 240 × 200 | 1,8 – 5,9 Ko | 28 – 157 | ≤ 25 Ko |
| `flourish-fern-vine.svg` | 640 × 72 | 3,8 Ko | 83 | ≤ 25 Ko |
| `flourish-seal.svg` | 160 × 160 | 2,1 Ko | 34 | ≤ 25 Ko |
| `flourish-tampon.svg` | 240 × 110 | 1,6 Ko | 12 | ≤ 25 Ko |

## 1. Art clé « Le bureau sous la lampe »

`keyart-desk.svg` (écran titre, héros du site) et `keyart-desk-tall.svg` (téléphone, recomposé et
pas seulement recadré). Bureau de 1974 vu de trois quarts : lampe articulée de laiton et sa flaque
de lumière, chemises de kraft (étiquette « O.R.C. »), brouillon d'arbre aux médaillons vides, trois
photographies sans visage (deux silhouettes de dos vers un phare, un groupe au bord supérieur
arraché, un verso « STUDIO »), carte de la Velmarche à demi déroulée avec épingles et fil rouge,
loupe (son verre grossit le phare de la photo), tampon de bois, boîte d'encre, fiche « ÉTABLI »,
tasse de thé, planche d'herbier à la fougère ; au mur, papier peint à fougères, tableau de liège,
fenêtre au crépuscule sur les toits d'Aubrelieu (dôme de l'Opéra, Citadelle sur sa colline, fenêtres
allumées, lune), rideau de velours.

**Palette** : inliner avec `class="art"` **sans `on-night`**. La nuit est peinte dans l'image
(dégradé radial d'encre `--art-ink` autour de la flaque, vitre exclue). Sous `on-night`, l'encre
devient vélin et l'image s'inverse : à éviter. Les bords valent ~`--art-ink` (L 0,27), un peu plus
clair que `--canvas` (L 0,17) : fondre les bords dans le bureau par `mask-image` (dégradé) si
l'image n'est pas plein cadre. Zone calme pour un menu ou un titre : tiers droit du 16:9 (mur sombre
et tableau de liège en haut, carte dans la pénombre en bas).

### Groupes animés

Origines en unités de viewBox, à utiliser avec `transform-box: view-box`. Animer uniquement
`transform` et `opacity` (DESIGN §7) ; sous mouvement réduit, tout est figé (l'image est complète à
l'arrêt). Les mêmes commentaires sont dans les SVG sources (svgo les retire).

| Groupe (`keyart-desk-…` / `keyart-desk-tall-…`) | Contenu | Origine 16:9 | Origine 4:5 | Animation proposée |
|---|---|---|---|---|
| `-lamp-light` | cône (5 voiles) + flaque (ellipses de lavis safran, rehaut) | 748 278 | 285 304 | vacillement : `opacity` 1 → 0,86 → 1, irrégulier (3–7 s, plusieurs `steps` décalés), jamais sous 0,8 |
| `-dust` (`-dust-far`, `-dust-near`) | poussières (rehaut) dans le faisceau, deux plans | 789 423 | 319 460 | `-far` : `translate(6px, -18px)` en 14 s ; `-near` : `translate(-10px, -26px)` en 9 s ; aller-retour, `opacity` 0,5 → 1 |
| `-steam` | trois volutes de vapeur (papier translucide) | 1270 467 | 170 357 | `translateY(-14px) scaleX(1.15)` + `opacity` 0 → 1 → 0, boucle 4–6 s |
| `-curtain` | rideau, anneaux et embrasse (la tringle reste fixe) | 512 2 | 422 4 | `rotate(±0.8deg) skewX(±1.2deg)`, 7 s, `--ease-in-out`, aller-retour |
| `-pages` (avec `-pages-shadow`) | feuille volante posée sur les dossiers | 141 644 | 13 844 | la feuille se soulève : `rotate(-4deg) skewY(-2deg)`, ombre `opacity` 1 → 0,5 ; toutes les 8–12 s, `--ease-paper` |

## 2. Vignettes (`spot-*.svg`, 240 × 200)

Fond transparent sur une tache d'aquarelle (deux lavis + éclaboussures). Pensées pour les cartes
du site (palette papier) **et** les états vides du jeu (`on-night` : rendu vérifié, voir
`captures/keyart-spots.png`). Un `<title>` décrit chaque vignette ; en décoratif, `aria-hidden`.

| Fichier | Sujet | Usage suggéré |
|---|---|---|
| `spot-archives.svg` | boîte d'archives ouverte, couvercle de biais, dossiers à onglets, étiquette « FONDS » | Archives (vide), carte « Des archives à fouiller » |
| `spot-catalogue.svg` | meuble à fiches, tiroir tiré, fiches à onglets de couleur, porte-étiquette « K–L » | Recherche LX-2 sans résultat |
| `spot-map-pin.svg` | carte de la Velmarche roulée, épingles et fil rouge, grande épingle | Carte (aucun lieu) |
| `spot-tree.svg` | arbre gravé, médaillons dorés vides, « ? » | Arbre vide, carte « Reconstituer l'arbre » |
| `spot-stamp.svg` | tampon de bois, boîte d'encre, fiche « ÉTABLI » | Case établie, carte « Établir les faits » |
| `spot-magnifier.svg` | loupe sur une photographie de maison (aucun visage) | Galerie des visages (vide) |
| `spot-letter.svg` | enveloppe, cachet de cire à la fougère, timbre, oblitération | Courrier, lettres (vide) |
| `spot-fern.svg` | fougère pressée sur une planche d'herbier | Motif de l'histoire, section « monde » |
| `spot-lighthouse.svg` | cap et phare blanc à bande rouge, maison du gardien, récif des Dents, faisceau | Carte « Un monde imaginaire », Tennok |
| `spot-register.svg` | registre de cuir à coins de laiton, chaîne et cadenas | Pièces scellées, fonds réservé |

## 3. Ornements animés

Traits prêts pour le tracé : chaque chemin à tracer porte `pathLength="1"` et un id propre (sinon
svgo les fusionne), donc `stroke-dasharray: 1; stroke-dashoffset: 1 → 0`.

| Fichier | Groupes | Animation proposée |
|---|---|---|
| `flourish-fern-vine.svg` (séparateur de section) | `-stem` : deux tiges ondulées du centre vers les bords, terminées en crosse, + bouton central ; `-leaves` : 72 pinnules, déjà triées du centre vers les bords ; `-washes` : leurs lavis (sauge, bouton safran) | tiges tracées en 900 ms, pinnules tracées avec un retard `i × 25 ms` (ordre du DOM), lavis en fondu ensuite ; à l'arrêt, tout est visible |
| `flourish-seal.svg` (cachet de cire) | `-wax` : cire (roux + carmin), fougère en relief ; `-ring` : anneau de choc ; `-burst` : 12 éclats (traits à tracer) et gouttes de cire | origine `80px 80px` : `-wax` `scale(1.35)` → 1 (`--ease-stamp`, `--dur-stamp`) ; `-ring` `scale(.6)` → 1.25 + `opacity` 1 → 0 (420 ms) ; `-burst` tracé puis fondu |
| `flourish-tampon.svg` (verrouillage d'une case) | `-ink` : empreinte entière (cadre double, « ÉTABLI », « Office de Réinscription civile »), usure par masque alpha `-worn` (suit la frappe) ; `-frame` : les trois filets (traits à tracer) | origine `120px 55px` : `scale(var(--stamp-from))` → 1 + `opacity` 0 → 1 (`--ease-stamp`, `--dur-stamp`), retard `rang × --stagger` ; variante : tracer `-frame` puis faire apparaître le mot |

## Procédé (`art/tools/keyart/`)

| Script | Rôle |
|---|---|
| `lib.mjs` | PRNG, lissage, formes, hachures, petite algèbre affine (origines des groupes), constructeur `Svg` (classes seulement, ids préfixés, id automatique des traits à tracer) |
| `objects.mjs` | objets du bureau, réutilisés par l'art clé et les vignettes : lampe, tasse et vapeur, loupe, tampon, boîte d'encre, empreinte, dossiers, brouillon d'arbre, crayon, photographies, carte de la Velmarche, épingles et fil, herbier et fougère, lettre, fiches, trombone |
| `desk.mjs` | art clé : cadrages `wide` et `tall` (positions de chaque objet), mur, fenêtre, liège, plateau, nuit, lumière, poussières, rideau |
| `spots.mjs` | les dix vignettes, cachet de cire |
| `flourishes.mjs` | vigne de fougère, cachet animé, tampon |
| `build.mjs` | écriture, budgets, origines des groupes animés |
| `sheet.mjs`, `zoom.mjs` | planches-contact (Playwright, tokens + art.css + ArtDefs), agrandissement d'une région |
