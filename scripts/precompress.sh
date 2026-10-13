#!/bin/sh
# Précompresse (gzip -9, sans horodatage : sortie reproductible) les fichiers texte d'un dossier
# statique, pour `gzip_static on` dans nginx. Les originaux sont conservés ; un .gz qui ne fait
# pas gagner de place est supprimé. Fichiers de moins de 1 Kio ignorés.
# Usage : scripts/precompress.sh <dossier>   (défaut : apps/site/build)
set -eu

dir="${1:-apps/site/build}"
[ -d "$dir" ] || { echo "precompress: dossier introuvable : $dir" >&2; exit 1; }

find "$dir" -type f -size +1023c \( -name '*.html' -o -name '*.css' -o -name '*.js' \
  -o -name '*.mjs' -o -name '*.json' -o -name '*.svg' -o -name '*.txt' -o -name '*.xml' \
  -o -name '*.webmanifest' \) -print | while IFS= read -r f; do
  gzip -9 -n -k -f "$f"
  if [ "$(wc -c < "$f.gz")" -ge "$(wc -c < "$f")" ]; then rm -f "$f.gz"; fi
done

echo "precompress: $(find "$dir" -type f -name '*.gz' | wc -l | tr -d ' ') fichier(s) .gz dans $dir"
