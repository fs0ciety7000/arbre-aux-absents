# Réseaux sociaux — kit d'annonce de *L'Arbre aux absents*

Générés par `node scripts/social/render.mjs` (Playwright + Chromium, rendu déterministe : deux
exécutions donnent des fichiers identiques à l'octet près). Pour un seul fichier :
`node scripts/social/render.mjs carrousel` (filtre sur le nom).

Rien n'est redessiné : art clé `art/keyart/` (`keyart-desk.svg`, `keyart-desk-tall.svg`, vignettes
`spot-*.svg`), carte `art/map/`, captures du jeu `apps/site/static/itch/jeu-*-1920.png` (recadrées
et agrandies sur la zone utile, jamais l'écran entier réduit), logo CM Interactive
`apps/site/static/brand/interactive.svg` (inchangé), polices et couleurs du design system
(Fraunces, Oswald, Instrument Sans, Literata ; `packages/ui/src/styles/index.css`). Monde
imaginaire seulement, aucun nom réel, aucune police pixel.

Les textes des publications sont dans `POSTS.md` (tenu à part).

| Fichier | Dimensions | Poids | Réseau, publication |
|---|---|---|---|
| `instagram-carrousel-1-accroche-1080x1350.jpg` | 1080 × 1350 (4:5) | 235 Ko | Instagram, carrousel de lancement, diapo 1 : art clé, titre, « Une famille. Des archives. Des absents à retrouver. », « Faites glisser → » |
| `instagram-carrousel-2-arbre-1080x1350.jpg` | 1080 × 1350 | 213 Ko | Carrousel, diapo 2 : l'arbre (fiches établies, cases « ? »), « Reconstituer l'arbre, case par case » |
| `instagram-carrousel-3-archives-1080x1350.jpg` | 1080 × 1350 | 210 Ko | Carrousel, diapo 3 : le Lecteur (lettre manuscrite, mots-clés soulignés), « Lire les archives, croiser les indices » |
| `instagram-carrousel-4-carte-1080x1350.jpg` | 1080 × 1350 | 230 Ko | Carrousel, diapo 4 : la carte de la Velmarche, « Un monde imaginaire à explorer » |
| `instagram-carrousel-5-gratuit-1080x1350.jpg` | 1080 × 1350 | 188 Ko | Carrousel, diapo 5 : « Gratuit · Windows · macOS · Linux · Android · navigateur », `cardorinteractive.itch.io/arbre-aux-absents`, « Lien dans la bio » |
| `carre-lancement-1080x1080.jpg` | 1080 × 1080 (1:1) | 180 Ko | Instagram et Facebook, publication simple de lancement : art clé, titre, « Disponible gratuitement » |
| `story-lancement-1080x1920.jpg` | 1080 × 1920 (9:16) | 272 Ko | Story Instagram / Facebook, annonce de lancement (ajouter l'autocollant lien vers itch.io dans la zone basse) |
| `story-nouvelle-affaire-hautcorvin-1080x1920.jpg` | 1080 × 1920 (9:16) | 295 Ko | Story Instagram / Facebook, « Nouvelle affaire : Le Revenant de Hautcorvin » (v1.1.0) |
| `x-bluesky-lancement-1600x900.jpg` | 1600 × 900 (16:9) | 206 Ko | X et Bluesky, publication de lancement : visuel clé |
| `x-bluesky-gameplay-1600x900.jpg` | 1600 × 900 (16:9) | 246 Ko | X et Bluesky, publication de suivi : capture du jeu à l'échelle 1:1 (arbre + lettre dans le Lecteur) |
| `x-entete-1500x500.jpg` | 1500 × 500 (3:1) | 114 Ko | X, image d'en-tête du profil (peut servir aussi de bannière Bluesky, recadrée par le réseau) |

Tous les fichiers sont des JPEG (qualité 90, sRGB), chacun sous 1,5 Mo.

## Notes de mise en page

- **Carrousel** : ordre 1 → 5 ; chaque diapo porte son numéro (« 2 / 5 »…) et le titre en pied.
  Les captures sont agrandies de 1,4 à 1,5 × (arbre, lettre) ou 1,1 × (carte) : noms, portraits et
  écriture restent lisibles sur un téléphone.
- **Stories** : aucun texte important dans les 250 px du haut ni les 300 px du bas (barre de
  progression, nom du compte, champ de réponse). Contrôle visuel :
  `node_modules/.cache/social/story-*-zones.png` (zones réservées surlignées, non versionné).
- **Nouvelle affaire** : la story ne montre que le titre, la cote du dossier, la haute vallée sur
  la carte du jeu et la prémisse de la lettre de mission (« Un homme revient. Il demande qu'on lui
  rende son nom. ») ; aucun portrait, aucune pièce, rien de la solution.
- **En-tête X** : le coin inférieur gauche (avatar du profil) ne porte que l'art ; tout le texte est
  à droite, dans la bande centrale (le réseau rogne un peu le haut et le bas selon l'écran).
- **Contrastes** : tous les textes sont posés sur l'encre de nuit (voile ≥ 82 % sous les titres),
  sur papier, sur kraft ou sur des aplats d'étiquette, avec les paires de tokens vérifiées dans
  `docs/DESIGN.md` §3.8 (vélin sur nuit ≥ 12:1, encre sur safran ≥ 10:1, étiquette rouge 5,33:1,
  encre kraft 6,96:1 ; « de » vermillon sur kraft en grand titre ≥ 3:1).
- Signature discrète « CM Interactive » (logo officiel, couleurs d'origine sur fond sombre) sur le
  carré, les stories, la diapo 5 et le visuel clé X.
