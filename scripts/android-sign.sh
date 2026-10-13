#!/usr/bin/env bash
# Signe l'APK et l'AAB release produits par `tauri android build --apk --aab` (non signés).
# Le keystore ne vit JAMAIS dans le repo : il arrive en base64 par les secrets GitHub Actions.
#
# Variables requises : ANDROID_KEYSTORE_B64, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD,
#                      ANDROID_STORE_PASSWORD ; ANDROID_HOME (SDK, build-tools installés).
# Usage : scripts/android-sign.sh <dossier gen/android> <dossier de sortie> <version>
set -euo pipefail

gen="${1:?dossier gen/android manquant}"
out="${2:?dossier de sortie manquant}"
version="${3:-0.0.0}"

for v in ANDROID_KEYSTORE_B64 ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD ANDROID_STORE_PASSWORD ANDROID_HOME; do
  [ -n "${!v:-}" ] || { echo "android-sign: variable $v absente" >&2; exit 1; }
done

build_tools=$(find "$ANDROID_HOME/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)
[ -x "$build_tools/apksigner" ] || { echo "android-sign: apksigner introuvable" >&2; exit 1; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
keystore="$work/release.jks"
printf '%s' "$ANDROID_KEYSTORE_B64" | base64 --decode > "$keystore"

mkdir -p "$out"
outputs="$gen/app/build/outputs"

apk=$(find "$outputs/apk" -name '*-release-unsigned.apk' | head -n 1)
[ -n "$apk" ] || { echo "android-sign: APK release non signé introuvable sous $outputs/apk" >&2; exit 1; }
"$build_tools/zipalign" -p -f 4 "$apk" "$work/aligned.apk"
"$build_tools/apksigner" sign \
  --ks "$keystore" --ks-key-alias "$ANDROID_KEY_ALIAS" \
  --ks-pass env:ANDROID_STORE_PASSWORD --key-pass env:ANDROID_KEY_PASSWORD \
  --out "$out/arbre-aux-absents-$version.apk" "$work/aligned.apk"
"$build_tools/apksigner" verify "$out/arbre-aux-absents-$version.apk"

aab=$(find "$outputs/bundle" -name '*-release.aab' | head -n 1)
[ -n "$aab" ] || { echo "android-sign: AAB release introuvable sous $outputs/bundle" >&2; exit 1; }
cp "$aab" "$out/arbre-aux-absents-$version.aab"
jarsigner -keystore "$keystore" \
  -storepass:env ANDROID_STORE_PASSWORD -keypass:env ANDROID_KEY_PASSWORD \
  -sigalg SHA256withRSA -digestalg SHA-256 \
  "$out/arbre-aux-absents-$version.aab" "$ANDROID_KEY_ALIAS"
jarsigner -verify "$out/arbre-aux-absents-$version.aab" >/dev/null

echo "android-sign: APK et AAB signés dans $out"
