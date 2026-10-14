#!/bin/sh
# Maquette 3D : sh tools/mockup.sh <final>
set -e
O=$1; T=$(dirname "$0")
python3 -c "
from PIL import Image
i=Image.open('$O/finals/arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm_300dpi.png')
mm=lambda v: round(v/25.4*300)
i.crop((mm(143),mm(3),mm(163),mm(213))).save('$O/tmp-spine.png')"
node $T/mockup.mjs "$(cd $O/finals && pwd)" $O/mock.html
node $T/shot.mjs $O/mock.html $O/finals/arbre-aux-absents_maquette-3d.png 423.33 291.04 1600
python3 -c "
from PIL import Image; i=Image.open('$O/finals/arbre-aux-absents_maquette-3d.png').convert('RGB').resize((1600,1100),Image.LANCZOS); i.save('$O/finals/arbre-aux-absents_maquette-3d.png',optimize=True)"
rm $O/mock.html $O/tmp-spine.png
