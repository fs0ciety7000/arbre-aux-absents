# L'Arbre aux absents — couverture du roman (CM Publishing)

Roman de **Nicolas Dessenius**, chez **CM Publishing**. La couverture reprend la manière du jeu
(taille-douce à l'encre ferro-gallique rehaussée d'aquarelle), mais dans la retenue d'une maison
d'édition littéraire : grandes marges, gravure encadrée, Fraunces et Literata, mention « roman »,
marque de l'éditeur. Illustrations originales (aucune capture du jeu), sans spoiler ni lieu réel :
seuls des noms de la Velmarche (Moulinvert, Office de Réinscription civile) apparaissent, et
seulement sur la quatrième.

## Directions (`directions/`, aperçus à 1000 px de large)

| Fichier | Direction | En bref |
|---|---|---|
| `A-fenetre.png` | **A « Fenêtre »** (recommandée, déclinée en version finale) | Papier crème, auteur en capitales espacées, titre en Fraunces, « roman » en italique vermillon. Gravure encadrée d'un double filet, comme une planche hors-texte : un vieux tilleul d'automne dont les branches portent des étiquettes de papier vierges, une étiquette tombée dans l'herbe ; au loin, la rivière et les cheminées d'un bourg papetier au crépuscule. |
| `B-nocturne.png` | B « Nocturne » | Illustration pleine page : le bureau la nuit sous une lampe de laiton, brouillon d'arbre aux médaillons vides, étiquette vierge, feuille de tilleul, dossiers. Texte en vélin sur le haut sombre. Plus « polar » et commercial, plus proche du jeu. |
| `C-blanche.png` | C « Blanche » | Couverture typographique à double filet (vermillon et encre), dans l'esprit des collections blanches ; une petite vignette gravée (rameau de tilleul et étiquette vierge). La plus sobre ; l'image compte peu. |
| `A-fenetre_titre-alternatif.png` | A, titre d'essai | Même face avec « Ceux que nous avons rendus absents » (voir `TITRES.md`). |
| `planche-directions.png` | Planche | Les trois directions côte à côte. |

**Recommandation : A.** C'est celle qui se lit d'abord comme un roman (pas comme une boîte de jeu)
tout en gardant une image forte et propre au livre : l'arbre aux noms manquants. B se rapproche trop
de l'art clé du jeu ; C est élégante mais muette en vignette de librairie.

## Fichiers finaux (`finals/`, direction A)

| Fichier | Format | Usage |
|---|---|---|
| `arbre-aux-absents_1re-de-couv_140x210_300dpi.png` | 140 × 210 mm, 1654 × 2480 px, 300 dpi, sans fond perdu | en ligne, fiche produit |
| `arbre-aux-absents_1re-de-couv_140x210.pdf` | PDF vectoriel, 140 × 210 mm | en ligne, presse |
| `arbre-aux-absents_1re-de-couv_146x216_fond-perdu-3mm_300dpi.png` | 146 × 216 mm (3 mm de fond perdu), 1724 × 2551 px | impression de la 1re seule |
| `arbre-aux-absents_1re-de-couv_146x216_fond-perdu-3mm.pdf` | PDF vectoriel, MediaBox/BleedBox 146 × 216, TrimBox 140 × 210 | impression |
| `arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm.pdf` | PDF vectoriel, couverture complète (4e + dos + 1re), TrimBox 300 × 210 | impression |
| `arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm_300dpi.png` | 3614 × 2551 px, 300 dpi | contrôle, BAT |
| `arbre-aux-absents_ebook_1600x2560.jpg` | 1600 × 2560 px (1:1,6), JPEG qualité 92 | ebook ; titre et auteur agrandis pour rester lisibles en vignette |
| `arbre-aux-absents_maquette-3d.png` | 1600 × 1100 px | maquette du livre posé sur un bureau (bonus) |

### Couverture complète : hypothèses à confirmer avec l'imprimeur

- Format broché 140 × 210 mm ; **dos de 20 mm**, estimé pour environ 300 pages sur un bouffant de
  80–90 g (épaisseur réelle = nombre de pages × main du papier : à recalculer avec l'imprimeur, puis
  changer `SPINE` dans `source/tools/build-covers.mjs` et relancer).
- Gabarit horizontal : 3 mm de fond perdu + 140 (4e) + 20 (dos) + 140 (1re) + 3 mm = **306 × 216 mm**.
- Dos lu **de bas en haut** (usage français), marque de l'éditeur en pied, à l'horizontale.
- Quatrième : accroche, texte de présentation, vignette, marque, crédit d'illustration et une
  **zone blanche de 38 × 22 mm** « ISBN à venir » pour l'EAN-13 (code-barres à poser en noir 100 %
  quand l'ISBN sera attribué). Pas de prix pour l'instant.
- Fichiers en **RVB** : la conversion CMJN (profil de l'imprimeur, p. ex. Fogra39/51) reste à faire
  au BAT. Les polices sont **incorporées** dans les PDF (en Type 3, car ce sont des polices
  variables) ; si le contrôle en amont de l'imprimeur les refuse, vectoriser les textes ou exporter
  en PDF/X depuis un logiciel de PAO à partir des sources.
- Pas de traits de coupe (TrimBox renseignée) ; à ajouter si l'imprimeur les demande.

## Typographie

- **Fraunces** (titre, accroche, monogramme « cm ») : axes opsz 72–144, SOFT 40, WONK 0 (1 pour le
  monogramme seulement).
- **Literata** (auteur, « roman », texte de quatrième, marque) : axe opsz.
- Ponctuation française : espaces insécables avant « : » et dans les guillemets ; césures posées à
  la main (`&shy;`) pour la justification de la quatrième.
- Aucune police pixel. Couleurs : seulement les tokens du design system du jeu (`--ink` encre
  ferro-gallique, `--paper`, `--raw-vermilion-700`, `--raw-night-950`, `--raw-vellum-100`…) et les
  classes d'art pour les illustrations.

## Marque CM Publishing

Losange à double filet, monogramme « cm » en Fraunces italique, nom en capitales espacées de
Literata ; décliné en pile (1re), en ligne (4e) et seul (dos). Dessiné pour cette couverture :
à valider avant tout autre usage.

## Sources (`source/`)

- `svg/roman-tilleul.svg` (gravure de la direction A), `svg/roman-nocturne.svg` (B),
  `svg/roman-rameau.svg` (vignette de C et de la quatrième) : SVG d'art aux classes du jeu
  (`class="art"`, aucun `fill="#…"`, `style=`, script ni lien externe). À afficher avec `tokens.css`,
  `art.css` et les motifs de `<ArtDefs />` du jeu (déjà inlinés dans les pages HTML).
- `html/*.html` : pages autonomes en millimètres (tokens, art.css et SVG inlinés ; polices dans
  `../fonts/`). Elles s'ouvrent dans Chromium ; `front-A*.html`, `front-B.html`, `front-C.html`,
  `wrap-A.html` (couverture complète), `front-A-titre-alt.html`.
- `tools/` : générateurs Node sans dépendance (graine fixe = nom du fichier, donc rendus
  reproductibles à l'octet près). `lib.mjs` et `objects.mjs` sont repris de
  `art/tools/keyart/` du jeu.

```bash
cd source
node tools/build-art.mjs svg                 # régénère les trois SVG
node tools/build-covers.mjs svg html         # régénère les pages (lit tokens.css/art.css du repo du jeu)
sh tools/finalize.sh html ..                 # PNG 300 dpi, PDF, JPEG ebook, directions
sh tools/mockup.sh ..                        # maquette 3D
```

Rendu par Playwright/Chromium (`shot.mjs`), boîtes PDF fixées par `pdfbox.py` (pypdf), redimensionnement
exact et dpi par Pillow.

## Licences

- Fraunces et Literata : **SIL Open Font License 1.1** (`source/fonts/OFL-*.txt`). Incorporation
  dans les PDF et usage commercial autorisés ; les fichiers de police ne doivent pas être vendus seuls.
- Illustrations, marque et textes : créations originales pour CM Publishing, illustrations de
  CM Creative Lab (crédit en quatrième).
