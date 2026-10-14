#!/bin/sh
# Test de fumée de l'image du site : démarre le conteneur, attend le HEALTHCHECK Docker,
# puis vérifie /healthz, l'accueil, la CSP, le cache des assets et la 404.
# Usage : scripts/docker-smoke.sh [image] [port-hôte]   (défaut : arbre-site 8080)
set -eu

image="${1:-arbre-site}"
port="${2:-8080}"
name="arbre-site-smoke-$$"
base="http://127.0.0.1:$port"

fail() { echo "docker-smoke: ÉCHEC — $*" >&2; docker logs "$name" >&2 2>&1 || true; exit 1; }
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM

docker run -d --name "$name" -p "$port:8080" --read-only --tmpfs /tmp:rw,size=8m \
  --cap-drop ALL --security-opt no-new-privileges "$image" >/dev/null

# Le HEALTHCHECK doit passer à « healthy » (start-period 5 s, intervalle 30 s : premier test ~0 s).
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$name")" = healthy ]; do
  i=$((i + 1))
  [ "$i" -le 60 ] || fail "le conteneur n'est pas « healthy » après 60 s"
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] || fail "le conteneur s'est arrêté"
  sleep 1
done

[ "$(docker exec "$name" id -u)" != 0 ] || fail "le conteneur tourne en root"
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

echo "docker-smoke: OK ($image)"
