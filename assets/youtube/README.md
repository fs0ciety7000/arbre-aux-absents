# Visuels YouTube — chaîne CM Interactive, trailer de *L'Arbre aux absents*

Générés par `node scripts/youtube/render.mjs` (Playwright + Chromium) à partir de l'art clé
(`art/keyart/keyart-desk.svg`), d'un portrait public du site (planche II, `PORTRAIT_PLATES`), du
logo officiel CM Interactive (`apps/site/static/brand/interactive.svg`, ni déformé ni redessiné) et
des polices du design system (Fraunces, Oswald, Literata, auto-hébergées). Pour régénérer un seul
fichier : `node scripts/youtube/render.mjs avatar` (filtre sur le nom).

| Fichier | Dimensions | Poids | Où dans YouTube |
|---|---|---|---|
| `miniature-trailer-a-lampe-1280x720.jpg` | 1280 × 720, JPEG | 144 Ko | Miniature de la vidéo (variante A : le bureau sous la lampe, étiquette « Bande-annonce ») |
| `miniature-trailer-b-visage-1280x720.jpg` | 1280 × 720, JPEG | 152 Ko | Miniature de la vidéo (variante B : un visage gravé et le médaillon vide « ? ») |
| `avatar-cm-interactive-sombre-800.png` | 800 × 800, PNG | 248 Ko | Photo de profil (recommandée : couleurs d'origine sur l'encre de nuit) |
| `avatar-cm-interactive-clair-800.png` | 800 × 800, PNG | 44 Ko | Photo de profil, variante claire (logo monochrome encre sur vélin) |
| `banniere-chaine-2560x1440.jpg` | 2560 × 1440, JPEG | 377 Ko | Bannière centrée sur le jeu (pour une campagne de lancement, ou une chaîne propre au jeu) |
| `banniere-zones.png` | 2560 × 1440 | — | **Contrôle seulement, ne pas téléverser** : découpes TV, ordinateur, tablette, mobile |
| `banniere-chaine-cm-interactive-2560x1440.jpg` | 2560 × 1440, JPEG | 235 Ko | **Bannière du studio** (recommandée pour la chaîne) : logo CM Interactive, nom, signature « Une division de CARDOR Media » avec le monogramme, vitrine discrète « À l’affiche : L’Arbre aux absents » |
| `banniere-chaine-cm-interactive-sans-jeu-2560x1440.jpg` | 2560 × 1440, JPEG | 223 Ko | Bannière du studio sans vitrine, valable quel que soit le jeu du moment |
| `banniere-cm-interactive-zones.png` | 2560 × 1440 | — | **Contrôle seulement** : découpes de la bannière du studio |
| `filigrane-cm-interactive-150.png` | 150 × 150, PNG transparent | 12 Ko | Filigrane de la marque (couleurs d'origine) |
| `filigrane-cm-interactive-blanc-150.png` | 150 × 150, PNG transparent | 8 Ko | Filigrane, variante blanche (plus discrète sur des images claires et chargées) |

## Où téléverser (YouTube Studio)

1. **Avatar, bannière, filigrane** : YouTube Studio › **Personnalisation** › onglet **Branding**.
   - *Photo* : `avatar-cm-interactive-sombre-800.png` (ou la variante claire). Recadrage proposé :
     garder le carré entier, le logo est déjà centré dans le cercle.
   - *Image de bannière* : `banniere-chaine-cm-interactive-2560x1440.jpg` (ou sa variante sans
     jeu ; `banniere-chaine-2560x1440.jpg` pour une période centrée sur le lancement du jeu). YouTube montre l'aperçu par appareil :
     tout le texte et les logos sont dans la zone sûre 1546 × 423 au centre, rien n'est coupé.
   - *Filigrane de la vidéo* : `filigrane-cm-interactive-150.png`, durée d'affichage au choix
     (« Fin de la vidéo » ou « Toute la vidéo »).
   - Cliquer **Publier** en haut à droite.
2. **Miniature du trailer** : YouTube Studio › **Contenu** › la vidéo › **Détails** › *Miniature* ›
   « Importer un fichier » : une des deux variantes. Pour comparer les deux, utiliser l'option
   « Tester et comparer » (test A/B des miniatures) si elle est disponible sur la chaîne.
   L'import d'une miniature personnalisée demande une chaîne validée (vérification par téléphone).

## Dimensions et limites YouTube

| Élément | Recommandé | Limites |
|---|---|---|
| Photo de profil | 800 × 800 px, affichée en rond (98 px sur ordinateur, ~40 px dans les commentaires) | PNG, JPG, GIF (non animé), BMP ; ≤ 4 Mo |
| Bannière | 2560 × 1440 px ; zone sûre texte et logos **1546 × 423** au centre | Minimum 2048 × 1152 ; ≤ 6 Mo ; TV : image entière ; ordinateur : bande 2560 × 423 ; tablette : 1855 × 423 ; mobile : 1546 × 423 |
| Miniature | 1280 × 720 px (16:9), largeur minimale 640 px | JPG, PNG, GIF ; ≤ 2 Mo |
| Filigrane | 150 × 150 px, carré, fond transparent, une seule couleur conseillée | PNG, GIF, BMP, JPG ; ≤ 1 Mo |

Notes :
- Les miniatures gardent le coin inférieur droit libre de texte (le badge de durée de YouTube s'y pose).
- Le titre est lisible à 168 × 94 px (taille des vignettes de suggestions) ; vérifié par réduction.
- La bannière du studio utilise les couleurs officielles des logos (citron #C6FF3D et olive #5B7A00
  de CM Interactive, or #D4A84B, vélin #EDE8DF et vermillon #FF3B1F de CARDOR Media) ; le fond à
  facettes est un décor généré, il n'est pas une partie du logo. Pour un futur jeu, remplacer la
  vitrine dans `studioBanner()` (`scripts/youtube/render.mjs`) ou publier la variante sans jeu.
- Le logo CM Interactive est utilisé tel quel : couleurs d'origine sur fond sombre, monochrome
  (encre de nuit ou blanc) ailleurs, jamais déformé ni recoloré dans une autre teinte.
