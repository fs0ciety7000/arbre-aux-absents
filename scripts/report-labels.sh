#!/bin/sh
# Étiquettes (et jalons) du dépôt des signalements, lues par le service apps/report
# (ARCHITECTURE §8, docs/DEPLOYMENT.md §5). Idempotent : `gh label create --force` crée ou met à
# jour (couleur, description) sans toucher aux tickets.
#
#   scripts/report-labels.sh [--dry-run] [--repo owner/nom] [--milestone vX.Y.Z]...
#
#   --repo        dépôt cible (défaut : $GITHUB_REPO, sinon fs0ciety7000/arbre-aux-absents-signalements)
#   --milestone   crée aussi ce jalon s'il n'existe pas (répétable). Un ticket fermé « completed »
#                 avec un jalon vX.Y.Z s'affiche « Corrigé dans vX.Y.Z » au joueur.
#   --dry-run     affiche les commandes sans rien envoyer
#
# Prérequis : `gh auth login` avec un compte qui administre le dépôt (pas le jeton fine-grained du
# service, qui n'a que Issues RW + Metadata R et ne peut pas gérer les jalons). Aucun jeton n'est
# lu ni écrit par ce script.
set -eu

repo="${GITHUB_REPO:-fs0ciety7000/arbre-aux-absents-signalements}"
dry=0
milestones=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --repo)
      [ $# -ge 2 ] || { echo "report-labels: --repo attend owner/nom" >&2; exit 2; }
      repo="$2"
      shift
      ;;
    --milestone)
      [ $# -ge 2 ] || { echo "report-labels: --milestone attend vX.Y.Z" >&2; exit 2; }
      echo "$2" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
        || { echo "report-labels: jalon « $2 » invalide (attendu vX.Y.Z)" >&2; exit 2; }
      milestones="$milestones $2"
      shift
      ;;
    -h | --help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "report-labels: option inconnue « $1 » (--help)" >&2
      exit 2
      ;;
  esac
  shift
done

echo "$repo" | grep -Eq '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$' \
  || { echo "report-labels: dépôt « $repo » invalide (owner/nom)" >&2; exit 2; }

if [ "$dry" = 0 ]; then
  command -v gh >/dev/null 2>&1 || { echo "report-labels: la CLI gh est requise" >&2; exit 1; }
  gh auth status >/dev/null 2>&1 || { echo "report-labels: lancer d'abord « gh auth login »" >&2; exit 1; }
fi

run() {
  if [ "$dry" = 1 ]; then
    printf '%s' "+"
    for a in "$@"; do printf " '%s'" "$a"; done
    printf '\n'
  else
    "$@"
  fi
}

# nom|couleur|description. Les noms sont ceux de apps/report/src/{render,status}.ts : ne pas les
# renommer sans changer le service (la comparaison ignore la casse, pas les accents).
labels='signalement|5319e7|Créé par le service de signalement (jeu ou site)
source:jeu|1d76db|Signalé depuis le jeu
source:site|1d76db|Signalé depuis le site
cat:bug|d73a4a|Catégorie : bogue
cat:blocked|b60205|Catégorie : bloqué dans la partie
cat:text|fbca04|Catégorie : texte, traduction
cat:display|c5def5|Catégorie : affichage
cat:audio|c5def5|Catégorie : son
cat:controls|c5def5|Catégorie : commandes, clavier, tactile
cat:performance|c5def5|Catégorie : lenteur, mémoire
cat:other|ededed|Catégorie : autre
langue:en|0e8a16|Signalement envoyé en anglais (jeu ou site)
statut:confirmé|fbca04|Statut joueur : Confirmé
statut:en-cours|0052cc|Statut joueur : En cours (ou ticket assigné)
doublon|cfd3d7|Statut joueur : Classé (doublon)
public|0e8a16|Affiché dans « Problèmes connus » (titre relu ; titre anglais : /public-title-en)'

echo "report-labels: $repo"
printf '%s\n' "$labels" | while IFS='|' read -r label color description; do
  run gh label create "$label" --repo "$repo" --color "$color" --description "$description" --force
done

for m in $milestones; do
  if [ "$dry" = 0 ] && gh api "repos/$repo/milestones?state=all&per_page=100" --paginate \
    --jq '.[].title' | grep -Fxq "$m"; then
    echo "report-labels: jalon $m déjà présent"
    continue
  fi
  run gh api --method POST "repos/$repo/milestones" -f "title=$m" \
    -f "description=Version du jeu qui corrige les tickets de ce jalon" --silent
done

echo "report-labels: OK"
