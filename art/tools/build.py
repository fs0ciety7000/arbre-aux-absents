"""Génère toute la carte de la Velmarche, de façon reproductible (graine fixe, common.SEED) :

    python3 art/tools/build.py            # les 5 couches + content/world/**
    python3 art/tools/build.py base water # seulement certaines couches

Écrit art/map/{base,relief,water,places,labels}.svg, content/world/map.json et
content/world/places/<id>.json. Python 3.10+, aucune dépendance.
"""
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)

import base  # noqa: E402
import content  # noqa: E402
import labels  # noqa: E402
import places  # noqa: E402
import relief  # noqa: E402
import water  # noqa: E402

LAYERS = {'base': base, 'relief': relief, 'water': water, 'places': places, 'labels': labels}


def main(argv):
    wanted = [a for a in argv if a in LAYERS] or list(LAYERS)
    os.makedirs(os.path.join(ROOT, 'art', 'map'), exist_ok=True)
    for name in wanted:
        t = time.time()
        svg = LAYERS[name].build()
        with open(os.path.join(ROOT, 'art', 'map', f'{name}.svg'), 'w', encoding='utf-8') as fh:
            fh.write(svg + '\n')
        print(f'art/map/{name}.svg  {len(svg) / 1024:6.1f} Ko  ({time.time() - t:.1f} s)')
    if not [a for a in argv if a in LAYERS] or 'content' in argv:
        for rel in content.write(ROOT):
            print(rel)


if __name__ == '__main__':
    main(sys.argv[1:])
