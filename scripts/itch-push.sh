#!/bin/sh
# Envoie les builds sur itch.io avec butler, un canal par cible (docs/ITCH.md §5 et §7).
#
#   sh scripts/itch-push.sh [--dry-run] [--channels "html5-demo windows …"] <artefacts> <compte/jeu>
#
# <artefacts> : dossier des artefacts CI téléchargés (`gh run download -D <artefacts>`), un
# sous-dossier par artefact (itch-zips, desktop-linux, desktop-windows, desktop-macos-universal,
# android) ou à plat. Les fichiers y sont cherchés récursivement.
# <compte/jeu> : projet itch.io, ex. `cm-interactive/arbre-aux-absents`.
# --dry-run : affiche les commandes sans rien envoyer (clé d'API non requise).
# --channels : liste de canaux à envoyer (défaut : tous ceux dont l'artefact est présent).
#
# La clé est lue dans BUTLER_API_KEY (environnement uniquement, jamais stockée ni affichée).
# --userversion = version de apps/game/package.json.
set -eu

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

dry_run=0
channels='html5-demo html5 windows macos linux android'
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --channels)
      [ $# -ge 2 ] || usage
      channels="$2"
      shift
      ;;
    -h | --help) usage ;;
    --) shift; break ;;
    -*) echo "itch-push: option inconnue : $1" >&2; usage ;;
    *) break ;;
  esac
  shift
done
[ $# -eq 2 ] || usage

artifacts="$1"
target="$2"
[ -d "$artifacts" ] || { echo "itch-push: dossier introuvable : $artifacts" >&2; exit 1; }
case "$target" in
  */*) ;;
  *) echo "itch-push: cible attendue sous la forme compte/jeu : $target" >&2; exit 1 ;;
esac
case "$target" in
  *:*) echo "itch-push: ne pas indiquer de canal dans la cible ($target)" >&2; exit 1 ;;
esac

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
version=$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  "$root/apps/game/package.json" | head -n 1)
[ -n "$version" ] || { echo "itch-push: version introuvable dans apps/game/package.json" >&2; exit 1; }
[ "$version" != "0.0.0" ] || echo "itch-push: attention, version 0.0.0 (monter apps/game/package.json avant de publier)" >&2

if [ "$dry_run" -eq 0 ]; then
  [ -n "${BUTLER_API_KEY:-}" ] || { echo "itch-push: BUTLER_API_KEY absent de l'environnement" >&2; exit 1; }
  command -v butler >/dev/null 2>&1 || { echo "itch-push: butler introuvable (https://itch.io/docs/butler/)" >&2; exit 1; }
fi

# Premier fichier dont le nom correspond au motif, hors fichiers exclus (motif d'exclusion vide : aucun).
find_one() {
  find "$artifacts" -type f -name "$1" ! -name "${2:-/}" | LC_ALL=C sort | head -n 1
}

# Affiche la commande, prête à copier (arguments entre apostrophes, celles des chemins
# échappées), puis l'exécute hors --dry-run.
run() {
  printf '+'
  for a in "$@"; do printf " '%s'" "$(printf '%s' "$a" | sed "s/'/'\\\\''/g")"; done
  printf '\n'
  [ "$dry_run" -eq 1 ] || "$@"
}

pushed=0
skipped=0
for channel in $channels; do
  exclude=''
  case "$channel" in
    html5-demo) pattern='arbre-aux-absents-demo.zip' ;;
    html5) pattern='arbre-aux-absents-web.zip' ;;
    windows) pattern='*-setup.exe' ;;
    macos) pattern='*.dmg' ;;
    linux) pattern='*.AppImage' ;;
    android)
      pattern='*.apk'
      exclude='*-debug.apk'
      ;;
    *)
      echo "itch-push: canal inconnu : $channel" >&2
      exit 1
      ;;
  esac
  file=$(find_one "$pattern" "$exclude")
  if [ -z "$file" ]; then
    if [ "$channel" = android ] && [ -n "$(find_one '*-debug.apk')" ]; then
      echo "itch-push: $channel sauté, seul un APK debug est présent (secrets de signature absents)" >&2
    else
      echo "itch-push: $channel sauté, aucun fichier « $pattern » sous $artifacts" >&2
    fi
    skipped=$((skipped + 1))
    continue
  fi
  # Les artefacts GitHub perdent le bit d'exécution : l'AppImage doit être exécutable.
  [ "$channel" != linux ] || run chmod +x "$file"
  run butler push "$file" "$target:$channel" --userversion "$version"
  pushed=$((pushed + 1))
done

if [ "$dry_run" -eq 1 ]; then
  echo "itch-push: --dry-run, rien n'a été envoyé ($pushed canal(aux) prêt(s), $skipped sauté(s))." >&2
else
  echo "itch-push: $pushed canal(aux) envoyé(s), $skipped sauté(s). Suivi : butler status $target" >&2
fi
[ "$pushed" -gt 0 ] || exit 1
