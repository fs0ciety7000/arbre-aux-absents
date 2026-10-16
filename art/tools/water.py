"""art/map/water.svg : lignes d'eau gravées le long des côtes, vagues du large, Orvelle,
Clairette et ruisseaux (rubans à largeur croissante), lacs, mares de Grisenoue, récifs,
lignes de paquebots, ponts."""
import math
from common import (W, H, rng, d_poly, d_seg, path, svg_open, ribbon, catmull, PP, P, blob,
                    simplify, normals, resample, chaikin, Mask)
import world


def _clip_frame(pts, m=4):
    """Coupe une polyligne en morceaux à l'intérieur du cadre."""
    out, cur = [], []
    for x, y in pts:
        if m < x < W - m and m < y < H - m:
            cur.append((x, y))
        elif cur:
            if len(cur) > 2:
                out.append(cur)
            cur = []
    if len(cur) > 2:
        out.append(cur)
    return out


def _cut_reserved(pts):
    """Retire les points tombant dans les ornements (cartouche, rose)."""
    x0, y0, x1, y1 = world.CARTOUCHE
    rx, ry, rr = world.ROSE
    out, cur = [], []
    for x, y in pts:
        bad = (x0 - 4 < x < x1 + 4 and y0 - 4 < y < y1 + 4) or math.hypot(x - rx, y - ry) < rr + 8
        if not bad:
            cur.append((x, y))
        elif cur:
            if len(cur) > 2:
                out.append(cur)
            cur = []
    if len(cur) > 2:
        out.append(cur)
    return out


def build():
    r = rng('water')
    fld = world.field()
    o = [svg_open('water', 'La Velmarche : eaux')]

    # ---- lignes d'eau parallèles à la côte (gravure)
    for level, cls, sw, dash, tol in ((4.5, 'ink-faint', '0.6', None, 0.5), (10, 'ink-faint', '0.5', None, 0.7),
                                      (17, 'ink-faint', '0.45', None, 0.9), (26, 'ink-faint', '0.4', '5 3', 1.2)):
        d = ''
        for loop in fld.contours(level):
            sm = chaikin(loop, 1, closed=True)
            sm = simplify(sm + [sm[0]], tol)
            if len(sm) < 6:
                continue
            for piece in _clip_frame(sm):
                for p2 in _cut_reserved(piece):
                    d += d_poly(p2)
        o.append(path(cls, d, stroke_width=sw, stroke_dasharray=dash))

    # ---- petites vagues du large (traits en accent circonflexe aplati)
    waves = ''
    m = Mask(6)
    m.rect(*world.CARTOUCHE)
    m.circle(world.ROSE[0], world.ROSE[1], world.ROSE[2] + 14)
    for pid in ('kessaar', 'mer-grise', 'golfe-d-ambre', 'tennok'):
        x, y = world.place_xy(pid)
        m.circle(x, y, 40 if pid not in ('mer-grise', 'golfe-d-ambre') else 70)
    n = 0
    tries = 0
    # tirage sur le champ historique (même graine, mêmes vagues) ; on n'efface ensuite que celles qui
    # tomberaient sur les ajouts (Longuegrève, la passe, les Cabanes)
    old = fld.legacy()
    over = Mask(6)
    lx, ly = world.place_xy('longuegreve')
    over.circle(lx, ly, 34)
    over.rect(*world.label_box('longuegreve'))
    over.polyline(list(world.passe()), 10)
    while n < 150 and tries < 6000:
        tries += 1
        x, y = r.uniform(16, W - 16), r.uniform(16, H - 16)
        if old.at(x, y) < 30 or m.hit(x, y, 6):
            continue
        m.circle(x, y, 22)
        w = r.uniform(4, 7)
        if not over.hit(x, y, 6):
            waves += f'M{x - w:.1f} {y:.1f}q{w / 2:.1f} {-w * 0.45:.1f} {w:.1f} 0q{w / 2:.1f} {-w * 0.45:.1f} {w:.1f} 0'
        n += 1
    o.append(path('ink-faint', waves, stroke_width='0.55'))

    # ---- lignes de paquebots (pointillés)
    sr = ''
    for k, route in enumerate(world.SEA_ROUTES):
        pts = catmull(PP(route), 8)
        for piece in _cut_reserved(pts):
            sr += d_poly(simplify(piece, 0.4))
    o.append(path('ink-soft', sr, stroke_width='0.8', stroke_dasharray='.1 3.2'))
    # la passe des Cabanes (affaire 3) : tirets courts de pilote, plus fins que les paquebots
    o.append(path('ink-soft', d_poly(simplify(list(world.passe()), 0.3)), stroke_width='0.6', stroke_dasharray='2.2 1.6'))

    # ---- fleuves et ruisseaux
    rivers = []
    orv = list(world.orvelle_line())
    ws = world.river_widths(orv, world.ORVELLE_W)
    # le ruban s'arrête où l'estuaire (creusé dans le trait de côte) prend le relais
    k = next((i for i, p in enumerate(orv) if fld.at(*p) > -1.5), len(orv) - 1)
    k = min(len(orv), k + 2)
    rivers.append(ribbon(orv[:k], ws[:k]))
    cl = list(world.clairette_line())
    rivers.append(ribbon(cl, world.river_widths(cl, [(0, 1.2), (1, 3.0)])))
    for line, w0, w1 in world.streams():
        line = list(line)
        k = next((i for i, p in enumerate(line) if fld.at(*p) > 0.5), len(line) - 1)
        line = line[:min(len(line), k + 2)]
        rivers.append(ribbon(line, world.river_widths(line, [(0, w0), (1, w1)])))
    rd = ''.join(d_poly(simplify(rv + [rv[0]], 0.25)[:-1], True) for rv in rivers)
    o.append(path('water', rd, stroke='currentColor'))
    # fil de l'eau : un trait fin au milieu de l'Orvelle (cours moyen et aval)
    mid = [p for p in orv if p[0] < 0.70 * W and p[0] > 0.16 * W]
    o.append(path('ink-faint', d_poly(simplify(mid, 0.4)), stroke_width='0.4', stroke_dasharray='6 4'))

    # ---- lacs
    lk = ''
    rings = ''
    for loop in world.lakes():
        lk += d_poly(list(loop), True)
        cx = sum(p[0] for p in loop) / len(loop)
        cy = sum(p[1] for p in loop) / len(loop)
        inner = [(cx + (x - cx) * 0.72, cy + (y - cy) * 0.72) for x, y in loop]
        rings += d_poly(inner, True)
    # mares des marais de Grisenoue
    gx, gy, grx, gry = world.GRISENOUE_MARSH
    cx0, cy0 = P(gx, gy)
    mares = 0
    tries = 0
    while mares < 16 and tries < 400:
        tries += 1
        a = r.uniform(0, 2 * math.pi)
        rr = math.sqrt(r.random())
        x, y = cx0 + math.cos(a) * grx * rr, cy0 + math.sin(a) * gry * rr
        if world.base_mask().hit(x, y, 4) or math.hypot(x - cx0, y - cy0) < 22:
            continue
        lk += d_poly(blob(x, y, r.uniform(2.5, 5), r.uniform(1.4, 2.6), f'mare{mares}', wob=0.25, n=12, rot=r.uniform(-0.4, 0.4)), True)
        mares += 1
    o.append(path('water', lk, stroke='currentColor'))
    o.append(path('ink-faint', rings, stroke_width='0.4'))

    # ---- récifs : les Dents de Tennok
    tx, ty = world.place_xy('tennok')
    reef = ''
    for k in range(9):
        a = -2.2 + k * 0.17 + r.uniform(-0.05, 0.05)
        dist = 22 + r.uniform(0, 14)
        x, y = tx + math.cos(a) * dist, ty + math.sin(a) * dist
        if fld.at(x, y) < 2:
            continue
        s = r.uniform(1.4, 2.2)
        reef += f'M{x - s:.1f} {y:.1f}h{2 * s:.1f}M{x:.1f} {y - s:.1f}v{2 * s:.1f}'
    o.append(path('ink', reef, stroke_width='0.7'))

    # ---- ponts : là où une route croise un cours d'eau
    major, minor = world.roads()
    waters = [(orv, world.river_widths(orv, world.ORVELLE_W)), (cl, [2.2] * len(cl))]
    br = ''
    for rd in list(major) + list(minor):
        rd = list(rd)
        for wl, ws in waters:
            for i in range(len(rd) - 1):
                for j in range(len(wl) - 1):
                    p = _inter(rd[i], rd[i + 1], wl[j], wl[j + 1])
                    if p and wl[j][0] > 0.15 * W:
                        x, y = p
                        tx_, ty_ = rd[i + 1][0] - rd[i][0], rd[i + 1][1] - rd[i][1]
                        n = math.hypot(tx_, ty_) or 1
                        tx_, ty_ = tx_ / n, ty_ / n
                        nx, ny = -ty_, tx_
                        half = ws[j] / 2 + 2.2
                        for s in (-1.8, 1.8):
                            br += d_seg(x - tx_ * half + nx * s, y - ty_ * half + ny * s,
                                        x + tx_ * half + nx * s, y + ty_ * half + ny * s)
    o.append(path('ink', br, stroke_width='0.9'))
    o.append('</svg>')
    return ''.join(o)


def _inter(a, b, c, d):
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = a, b, c, d
    den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    if abs(den) < 1e-9:
        return None
    t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den
    u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den
    if 0 <= t <= 1 and 0 <= u <= 1:
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))
    return None


if __name__ == '__main__':
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else 'art/map/water.svg'
    open(out, 'w').write(build())
