#!/bin/sh
# Rendus finaux : sh tools/finalize.sh <html> <sortie>
set -e
H=$1; O=$2; T=$(dirname "$0")
mkdir -p "$O/finals" "$O/directions" "$O/tmp"
node $T/shot.mjs $H/front-A.html $O/tmp/a.png 140 210 &
node $T/shot.mjs $H/front-A-bleed.html $O/tmp/ab.png 146 216 &
node $T/shot.mjs $H/wrap-A.html $O/tmp/w.png 306 216 &
node $T/shot.mjs $H/front-A-ebook.html $O/finals/arbre-aux-absents_ebook_1600x2560.jpg 140 224 1600 &
wait
node $T/shot.mjs $H/front-A.html $O/finals/arbre-aux-absents_1re-de-couv_140x210.pdf 140 210 &
node $T/shot.mjs $H/front-A-bleed.html $O/finals/arbre-aux-absents_1re-de-couv_146x216_fond-perdu-3mm.pdf 146 216 &
node $T/shot.mjs $H/wrap-A.html $O/finals/arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm.pdf 306 216 &
wait
python3 $T/pdfbox.py $O/finals/arbre-aux-absents_1re-de-couv_140x210.pdf 140 210
python3 $T/pdfbox.py $O/finals/arbre-aux-absents_1re-de-couv_146x216_fond-perdu-3mm.pdf 146 216 3
python3 $T/pdfbox.py $O/finals/arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm.pdf 306 216 3
node $T/shot.mjs $H/front-B.html $O/tmp/b.png 140 210 &
node $T/shot.mjs $H/front-C.html $O/tmp/c.png 140 210 &
node $T/shot.mjs $H/front-A-titre-alt.html $O/tmp/alt.png 140 210 &
wait
python3 - "$O" <<'PY'
import sys
from PIL import Image
O=sys.argv[1]
def fix(src,dst,size,dpi=300,fmt='PNG'):
    i=Image.open(src).convert('RGB')
    if i.size!=size: i=i.resize(size,Image.LANCZOS)
    i.save(dst,fmt,dpi=(dpi,dpi),**({'quality':92} if fmt=='JPEG' else {'optimize':True}))
mm=lambda v: round(v/25.4*300)
fix(f'{O}/tmp/a.png',f'{O}/finals/arbre-aux-absents_1re-de-couv_140x210_300dpi.png',(mm(140),mm(210)))
fix(f'{O}/tmp/ab.png',f'{O}/finals/arbre-aux-absents_1re-de-couv_146x216_fond-perdu-3mm_300dpi.png',(mm(146),mm(216)))
fix(f'{O}/tmp/w.png',f'{O}/finals/arbre-aux-absents_couverture-complete_306x216_fond-perdu-3mm_300dpi.png',(mm(306),mm(216)))
fix(f'{O}/finals/arbre-aux-absents_ebook_1600x2560.jpg',f'{O}/finals/arbre-aux-absents_ebook_1600x2560.jpg',(1600,2560),fmt='JPEG')
for n,src in [('A-fenetre','a'),('B-nocturne','b'),('C-blanche','c'),('A-fenetre_titre-alternatif','alt')]:
    i=Image.open(f'{O}/tmp/{src}.png').convert('RGB'); i=i.resize((1000,round(1000*i.height/i.width)),Image.LANCZOS)
    i.save(f'{O}/directions/{n}.png',optimize=True)
# planche des trois directions
ims=[Image.open(f'{O}/directions/{n}.png') for n in ['A-fenetre','B-nocturne','C-blanche']]
W=sum(i.width for i in ims)+4*60; H=ims[0].height+120
c=Image.new('RGB',(W,H),(52,50,48)); x=60
for i in ims: c.paste(i,(x,60)); x+=i.width+60
c.save(f'{O}/directions/planche-directions.png',optimize=True)
PY
rm -r "$O/tmp"
ls -la $O/finals $O/directions
