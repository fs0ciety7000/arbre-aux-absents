#!/bin/sh
# Rendu des couvertures : sh tools/render-all.sh <html> <out>
set -e
H=$1; O=$2; T=$(dirname "$0")
mkdir -p "$O"
node $T/shot.mjs $H/front-A.html $O/A-front.png 140 210 &
node $T/shot.mjs $H/front-B.html $O/B-front.png 140 210 &
node $T/shot.mjs $H/front-C.html $O/C-front.png 140 210 &
node $T/shot.mjs $H/front-A-titre-alt.html $O/A-front-titre-alt.png 140 210 &
wait
