"""Fixe MediaBox (format exact, coin haut gauche) et TrimBox/BleedBox : python3 pdfbox.py in.pdf W H [bleed]"""
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
src, W, H = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
b = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
pt = lambda mm: mm * 72 / 25.4
r = PdfReader(src); w = PdfWriter()
for p in r.pages:
    # Chromium décale le rendu d'un pixel CSS (0,75 pt) vers le bas et la droite : on le compense
    o = 0.75
    top = float(p.mediabox.top) - o
    box = RectangleObject([o, top - pt(H), o + pt(W), top])
    p.mediabox = box; p.cropbox = box; p.bleedbox = box
    p.trimbox = RectangleObject([o + pt(b), top - pt(H) + pt(b), o + pt(W) - pt(b), top - pt(b)])
    w.add_page(p)
w.add_metadata({'/Title': "L'Arbre aux absents — couverture", '/Author': 'Nicolas Dessenius', '/Creator': 'CM Publishing'})
with open(src, 'wb') as f: w.write(f)
