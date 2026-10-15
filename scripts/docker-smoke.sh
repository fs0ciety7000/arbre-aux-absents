#!/bin/sh
# Tests de fumée des images Docker : démarre le conteneur (lecture seule, sans capacités), attend
# le HEALTHCHECK Docker, vérifie l'utilisateur non-root, puis les réponses HTTP.
#
#   scripts/docker-smoke.sh [image] [port-hôte]            site (défaut : arbre-site 8080) :
#       /healthz, accueil, CSP (dont connect-src du service de signalement), cache, 404 FR et /en/,
#       Referrer-Policy des pages de suivi
#   scripts/docker-smoke.sh --report [image] [port-hôte]   service de signalement (défaut :
#       arbre-report 8090) : /healthz JSON, base SQLite sur /data, CORS, 404, pas de node_modules
set -eu

kind=site
if [ "${1:-}" = --report ]; then
  kind=report
  shift
fi

if [ "$kind" = report ]; then
  image="${1:-arbre-report}"
  port="${2:-8090}"
  inner=8090
else
  image="${1:-arbre-site}"
  port="${2:-8080}"
  inner=8080
fi
name="arbre-$kind-smoke-$$"
base="http://127.0.0.1:$port"

fail() { echo "docker-smoke: ÉCHEC — $*" >&2; docker logs "$name" >&2 2>&1 || true; exit 1; }
# -v : supprime aussi le volume anonyme /data du service.
cleanup() { docker rm -f -v "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM

# Aucune variable d'environnement : le service démarre sans GITHUB_TOKEN (aucun appel à GitHub,
# file « pending ») ; /data reste accessible en écriture malgré --read-only (volume anonyme).
docker run -d --name "$name" -p "$port:$inner" --read-only --tmpfs /tmp:rw,size=8m \
  --cap-drop ALL --security-opt no-new-privileges "$image" >/dev/null

# Le HEALTHCHECK doit passer à « healthy » (intervalle 30 s : premier test dès le démarrage).
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$name")" = healthy ]; do
  i=$((i + 1))
  [ "$i" -le 60 ] || fail "le conteneur n'est pas « healthy » après 60 s"
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || fail "le conteneur s'est arrêté"
  sleep 1
done

[ "$(docker exec "$name" id -u)" != 0 ] || fail "le conteneur tourne en root"

if [ "$kind" = report ]; then
  headers=$(curl -sS -D - -o /dev/null "$base/healthz")
  echo "$headers" | head -n 1 | grep -q ' 200' || fail "/healthz ne répond pas 200"
  echo "$headers" | grep -qi '^content-type: application/json' || fail "/healthz n'est pas du JSON"
  curl -fsS "$base/healthz" | grep -q '"ok":true' || fail "/healthz sans \"ok\":true"

  [ -n "$(docker exec "$name" ls -A /data)" ] || fail "aucune base SQLite créée dans /data"
  docker exec "$name" test ! -e /app/node_modules || fail "node_modules présent au runtime"
  docker exec "$name" test -s /app/dist/admin.js || fail "dist/admin.js absent"
  docker exec "$name" sh -c 'touch /app/x 2>/dev/null' && fail "/app accessible en écriture"

  # CORS : origine du site autorisée, origine inconnue refusée (requête préalable).
  allowed=https://arbre.cardormedia.com
  curl -sS -D - -o /dev/null -X OPTIONS -H "Origin: $allowed" \
    -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' \
    "$base/v1/reports" | grep -qi "^access-control-allow-origin: $allowed" \
    || fail "CORS : $allowed non autorisée"
  curl -sS -D - -o /dev/null -X OPTIONS -H 'Origin: https://example.org' \
    -H 'Access-Control-Request-Method: POST' "$base/v1/reports" \
    | grep -qi '^access-control-allow-origin:' && fail "CORS : origine inconnue autorisée"

  code=$(curl -s -o /dev/null -w '%{http_code}' "$base/cette-route-n-existe-pas")
  [ "$code" = 404 ] || fail "route inconnue → $code (attendu 404)"

  echo "docker-smoke: OK ($image, service de signalement)"
  exit 0
fi

[ "$(curl -fsS "$base/healthz")" = ok ] || fail "/healthz ne répond pas « ok »"

code=$(curl -s -o /dev/null -w '%{http_code}' "$base/")
[ "$code" = 200 ] || fail "/ → $code (attendu 200)"

headers=$(curl -sSI -H 'Accept-Encoding: gzip' "$base/")
echo "$headers" | grep -qi "^content-security-policy: default-src 'self'" || fail "CSP absente"
echo "$headers" | grep -qi "frame-src https://itch.io https://www.youtube-nocookie.com;" \
  || fail "CSP : frame-src sans itch.io ni youtube-nocookie.com (widget, bande-annonce)"
echo "$headers" | grep -qi '^content-encoding: gzip' || fail "HTML non servi précompressé"
echo "$headers" | grep -qi '^cache-control: no-cache' || fail "HTML mis en cache"

asset=$(curl -fsS "$base/" | grep -o '_app/immutable/[^"]*\.js' | head -n 1 || true)
if [ -n "$asset" ]; then
  curl -sSI "$base/$asset" | grep -qi '^cache-control: public, max-age=31536000, immutable' \
    || fail "asset immuable sans cache long : $asset"
fi

code=$(curl -s -o /dev/null -w '%{http_code}' "$base/cette-page-n-existe-pas")
[ "$code" = 404 ] || fail "page inconnue → $code (attendu 404)"
curl -s "$base/cette-page-n-existe-pas" | grep -qi '<center>nginx' && fail "404 par défaut de nginx"

# Site anglais : 404 propre en anglais (/en/404.html, sinon le texte de repli de nginx.conf).
code=$(curl -s -o /dev/null -w '%{http_code}' "$base/en/this-page-does-not-exist")
[ "$code" = 404 ] || fail "page anglaise inconnue → $code (attendu 404)"
curl -s "$base/en/this-page-does-not-exist" | grep -qi 'lang="en' || fail "404 de /en/ pas en anglais"

# CSP : le service de signalement est joignable depuis le site et depuis /jouer/.
echo "$headers" | grep -qi "connect-src 'self' https://arbre-api.cardormedia.com" \
  || fail "CSP du site : connect-src sans https://arbre-api.cardormedia.com"
curl -sSI "$base/jouer/" | grep -qi "connect-src 'self' https://arbre-api.cardormedia.com" \
  || fail "CSP de /jouer/ : connect-src sans https://arbre-api.cardormedia.com"

# Pages de suivi (jeton dans le fragment) : aucun Referer, si la page existe dans ce build.
for path in /suivi/ /en/suivi/; do
  h=$(curl -sSI "$base$path")
  if echo "$h" | head -n 1 | grep -q ' 200'; then
    echo "$h" | grep -qi '^referrer-policy: no-referrer' || fail "$path sans Referrer-Policy: no-referrer"
  fi
done

echo "docker-smoke: OK ($image, site)"
