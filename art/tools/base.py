"""art/map/base.svg : papier, mers (eau et eaux profondes), terre, lavis des provinces,
frontière (liseré carmin), limite de l'Ostrie, routes."""
import math
from common import W, H, rng, d_poly, path, svg_open, blob, ribbon, offset, P
import world

PAD = 40


def build():
    r = rng('base')
    loops = world.coast_loops()
    coast_d = ''.join(d_poly(l, closed=True) for l in loops)
    deep_loops = world.coast_loops(level=34.0, min_area=400.0, smooth_tol=1.2)
    deep_d = f'M{-PAD} {-PAD}H{W + PAD:.0f}V{H + PAD:.0f}H{-PAD}z' + ''.join(d_poly(l, closed=True) for l in deep_loops)

    o = [svg_open('base', 'La Velmarche : fond de carte')]
    o.append('<defs>')
    o.append(f'<path id="base-coast" fill-rule="evenodd" d="{coast_d}"/>')
    o.append('<clipPath id="base-land"><use href="#base-coast"/></clipPath>')
    o.append('</defs>')
    # papier et mer
    o.append(f'<rect class="paper" x="{-PAD}" y="{-PAD}" width="{W + 2 * PAD:.0f}" height="{H + 2 * PAD:.0f}"/>')
    o.append(f'<rect class="water" x="{-PAD}" y="{-PAD}" width="{W + 2 * PAD:.0f}" height="{H + 2 * PAD:.0f}"/>')
    o.append(path('water-deep', deep_d, fill_rule='evenodd'))
    # terre
    o.append('<use href="#base-coast" class="paper"/>')

    land = ['<g clip-path="url(#base-land)">']
    # taches du papier (vieilli), très légères
    stains = []
    for k in range(9):
        cx, cy = r.uniform(0.1, 0.95) * W, r.uniform(0.15, 0.95) * H
        stains.append(d_poly(blob(cx, cy, r.uniform(60, 150), r.uniform(40, 110), f'st{k}', wob=0.3, n=18, rot=r.uniform(0, 3)), True))
    land.append(path('paper-shade', ''.join(stains), fill_opacity='0.2'))

    # Ostrie : lande (lilas léger) au nord de la limite de province
    lim = list(world.ostrie_limit())
    ostrie = [(-PAD, lim[0][1])] + lim + [(W + PAD, lim[-1][1]), (W + PAD, -PAD), (-PAD, -PAD)]
    land.append(path('wash-lilas', d_poly(ostrie, True), fill_opacity='0.28'))
    # vallée de l'Orvelle : prairies (sauge très légère)
    valley = []
    orv = list(world.orvelle_line())
    for k, (x, y) in enumerate(orv[::6]):
        if x > 0.80 * W:
            continue
        valley.append(d_poly(blob(x, y, r.uniform(34, 52), r.uniform(20, 30), f'va{k}', wob=0.25, n=16), True))
    land.append(path('wash-sauge', ''.join(valley), fill_opacity='0.3'))
    # Thalberie : à l'est de la frontière
    fr = list(world.frontier())
    cut = [p for p in fr if p[1] < 0.655 * H]
    tail = [(cut[-1][0] + 20, cut[-1][1] + 4), (cut[-1][0] + 50, cut[-1][1] - 14), (W + PAD, cut[-1][1] - 50)]
    thal = cut + tail + [(W + PAD, -PAD)]
    land.append(path('wash-ardoise', d_poly(thal, True), fill_opacity='0.45'))
    # liseré de frontière côté Velmarche (lavis carmin), puis le trait mixte
    band = offset(fr, -3.6)
    land.append(path('wash-carmin', d_poly(ribbon(band, [7.2] * len(band)), True), fill_opacity='0.9'))
    land.append(path('ink', d_poly(fr), stroke_width='1.1', stroke_dasharray='7 2.2 1.2 2.2'))
    land.append(path('ink-soft', d_poly(lim), stroke_width='0.7', stroke_dasharray='1 2.4'))

    # routes : grandes routes en double trait, chemins en tirets
    major, minor = world.roads()
    dd = ''
    for rd in major:
        dd += d_poly(offset(list(rd), 1.25)) + d_poly(offset(list(rd), -1.25))
    land.append(path('ink-soft', dd, stroke_width='0.55'))
    land.append(path('ink-faint', ''.join(d_poly(list(rd)) for rd in minor), stroke_width='0.8', stroke_dasharray='3 1.8'))
    land.append('</g>')
    o += land
    # trait de côte
    o.append('<use href="#base-coast" class="ink" stroke-width="1.3"/>')
    o.append('</svg>')
    return ''.join(o)


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else 'art/map/base.svg'
    open(out, 'w').write(build())
