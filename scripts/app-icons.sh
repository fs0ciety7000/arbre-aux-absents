#!/usr/bin/env bash
# Sources des icônes de l'application (Tauri), dérivées de l'emblème du kit presse
# (cachet de cire à la fougère sur la nuit du bureau, `npm run presskit`) :
#   - app-icon.png             : l'icône à coins arrondis, 1024 px (bureau, legacy Android, iOS) ;
#   - app-icon-android-fg.png  : avant-plan de l'icône adaptative Android : l'avatar (carré plein)
#     découpé en disque fondu sur la couleur de fond (`bg_color` d'app-icon.json, #07152e),
#     réduit à 80 % : le cachet occupe ~49 % du canevas de 108 dp (≈ 53 dp), dans la zone sûre
#     de 66 dp, quel que soit le masque (cercle, squircle, goutte) et la parallaxe.
# Aussi les icônes web du jeu (apps/game/public).
# Puis : npm run tauri:icons -w @arbre/game (lit src-tauri/icons/app-icon.json).
# Dépendance : ImageMagick (convert). Usage : bash scripts/app-icons.sh
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
kit="$repo/apps/site/static/presse/kit/logos"
out="$repo/apps/game/src-tauri/icons"

cp "$kit/arbre-aux-absents-icone-1024.png" "$out/app-icon.png"

# Disque opaque jusqu'à r = 380 px, fondu (smoothstep) jusqu'à r = 500 px : au-delà, la nuit de
# l'avatar vaut déjà ~#07152e, le raccord avec la couleur de fond est invisible.
convert "$kit/arbre-aux-absents-avatar-1024.png" -alpha off \
  \( -size 1024x1024 xc: -fx 'min(1,max(0,(500-hypot(i-511.5,j-511.5))/120))' \
     -fx 'u*u*(3-2*u)' \) \
  -compose CopyOpacity -composite -compose Over \
  -filter Lanczos -resize 80% \
  -background none -gravity center -extent 1024x1024 \
  -strip "PNG32:$out/app-icon-android-fg.png"

# Icônes web du jeu (apps/game/public, copiées à la racine du build : web, itch.io, Tauri) :
# favicon 32 px et icône 192 px (coins arrondis), apple-touch-icon 180 px (carré plein, iOS arrondit).
pub="$repo/apps/game/public"
mkdir -p "$pub"
convert "$kit/arbre-aux-absents-icone-1024.png" -filter Lanczos -resize 32x32 -strip "PNG32:$pub/favicon.png"
convert "$kit/arbre-aux-absents-icone-1024.png" -filter Lanczos -resize 192x192 -strip "PNG32:$pub/icon-192.png"
convert "$kit/arbre-aux-absents-avatar-1024.png" -filter Lanczos -resize 180x180 -alpha off -strip "PNG24:$pub/apple-touch-icon.png"

echo "Sources écrites dans $out ; lancer : npm run tauri:icons -w @arbre/game"
