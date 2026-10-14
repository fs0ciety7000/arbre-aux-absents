"""art/map/labels.svg : cadre gradué à double filet, noms de provinces, de pays et d'eaux,
hameaux d'Ostrie, notes du graveur, rose des vents à la fougère, échelle en lieues
velmarchoises, cartouche « La Velmarche »."""
import math
from common import W, H, f, d_poly, d_seg, d_circle, path, svg_open, text, esc, P, catmull
import world

# 1 lieue velmarchoise = 4,6 km ; le pays fait ~70 lieues d'ouest en est (bible §3), soit, de la
# côte du golfe (x ≈ 0,10) à la frontière (x ≈ 0,92), environ 1 107 unités : 15,8 u par lieue.
UNITS_PER_LIEUE = 0.82 * W / 70

M1, M2 = 5.0, 13.0


def fern(x, y, s=1.0, rot=0.0, mirror=False):
    """Crosse de fougère (ilv) : rachis courbe et pennes alternées."""
    ca, sa = math.cos(rot), math.sin(rot)
    k = -1 if mirror else 1

    def T(u, v):
        return (x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s)

    spine = [T(0, 0), T(k * 1.5, -6), T(k * 2.2, -12), T(k * 1.8, -17), T(k * 0.6, -21), T(k * -0.6, -22.5)]
    d = d_poly(catmull(spine, 4))
    leaves = ''
    for i in range(1, 8):
        t = i / 8.5
        u = k * (1.5 * math.sin(t * 3.0)) if t < 0.8 else 0
        v = -22 * t
        ln = 5.2 * (1 - t) + 1
        for side in (-1, 1):
            a = T(u, v)
            b = T(u + side * ln, v - ln * 0.55)
            leaves += d_poly([a, ((a[0] + b[0]) / 2 + 0.3 * s, (a[1] + b[1]) / 2 - 0.4 * s), b])
    return d, leaves


def rose():
    cx, cy, R = world.ROSE
    o = []
    o.append(path('paper', d_circle(cx, cy, R + 3), fill_opacity='0.88'))
    o.append(path('ink-soft', d_circle(cx, cy, R) + d_circle(cx, cy, R - 4), stroke_width='0.8'))
    o.append(path('ink-faint', d_circle(cx, cy, R * 0.42), stroke_width='0.5'))
    ticks = ''
    for k in range(64):
        a = k * math.pi / 32
        r0 = R - 4 if k % 4 else R - 8
        ticks += d_seg(cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + R * math.cos(a), cy + R * math.sin(a))
    o.append(path('ink-faint', ticks, stroke_width='0.5'))
    # pointes : 8 rhumbs ; moitié d'ombre pleine, moitié papier
    dark, light = '', ''
    for k in range(8):
        a = -math.pi / 2 + k * math.pi / 4
        L = R - 9 if k % 2 == 0 else R * 0.55
        wdt = 6.2 if k % 2 == 0 else 4.4
        tip = (cx + L * math.cos(a), cy + L * math.sin(a))
        l_ = (cx + wdt * math.cos(a - math.pi / 2), cy + wdt * math.sin(a - math.pi / 2))
        r_ = (cx + wdt * math.cos(a + math.pi / 2), cy + wdt * math.sin(a + math.pi / 2))
        dark += d_poly([(cx, cy), tip, r_], True)
        light += d_poly([(cx, cy), l_, tip], True)
    o.append(path('paper', light + dark))
    o.append(path('ink', dark, fill='currentColor', stroke_width='0.4'))
    o.append(path('ink', light, stroke_width='0.6'))
    o.append(path('wash-safran', d_circle(cx, cy, 3.2), stroke='currentColor'))
    o.append(path('ink', d_circle(cx, cy, 3.2), stroke_width='0.6'))
    # fougère au nord, en guise de fleur de lys
    d, leaves = fern(cx, cy - R - 2, 0.9)
    o.append(path('ink', d, stroke_width='0.9'))
    o.append(path('ink-soft', leaves, stroke_width='0.7'))
    for s, a in (('E', 0), ('S', 90), ('O', 180)):
        rr = R + 10
        x = cx + rr * math.cos(math.radians(a))
        y = cy + rr * math.sin(math.radians(a)) + 3.6
        o.append(text('label-note', x, y, s, size=11))
    o.append(text('label-note', cx + 12, cy - R - 6, 'N', size=11))
    return o


def scale():
    x0, y0, x1, y1 = world.SCALE
    u = UNITS_PER_LIEUE
    o = [path('paper', f'M{x0} {y0}H{x1}V{y1}H{x0}z', fill_opacity='0.92')]
    o.append(path('ink', f'M{x0} {y0}H{x1}V{y1}H{x0}z', stroke_width='1.4'))
    o.append(path('ink-soft', f'M{x0 + 3} {y0 + 3}H{x1 - 3}V{y1 - 3}H{x0 + 3}z', stroke_width='0.6'))
    o.append(text('label-note', (x0 + x1) / 2, y0 + 16, 'Échelle de dix lieues velmarchoises', size=11))
    bx = (x0 + x1) / 2 - 5 * u
    by = y0 + 23
    segs = ''
    for k in range(10):
        if k % 2 == 0:
            segs += f'M{f(bx + k * u)} {f(by)}h{f(u)}v4h{f(-u)}z'
    o.append(path('ink', segs, fill='currentColor', stroke_width='0.3'))
    o.append(path('ink', f'M{f(bx)} {f(by)}h{f(10 * u)}v4h{f(-10 * u)}z', stroke_width='0.7'))
    for k, s in ((0, '0'), (5, '5'), (10, '10')):
        o.append(text('label-note', bx + k * u, by + 15, s, size=9.5))
    o.append(text('label-note', (x0 + x1) / 2, by + 26, 'la lieue vaut 4,6 km', size=8.5))
    return o


def cartouche():
    x0, y0, x1, y1 = world.CARTOUCHE
    cx = (x0 + x1) / 2
    o = [path('paper', f'M{x0} {y0}H{x1}V{y1}H{x0}z')]
    o.append(path('hatch', f'M{x0 + 7} {y0 + 7}H{x1 - 7}V{y1 - 7}H{x0 + 7}z'))
    o.append(path('paper', f'M{x0 + 12} {y0 + 12}H{x1 - 12}V{y1 - 12}H{x0 + 12}z'))
    o.append(path('ink', f'M{x0} {y0}H{x1}V{y1}H{x0}z', stroke_width='2.6'))
    o.append(path('ink-soft', f'M{x0 + 7} {y0 + 7}H{x1 - 7}V{y1 - 7}H{x0 + 7}z'
                               f'M{x0 + 12} {y0 + 12}H{x1 - 12}V{y1 - 12}H{x0 + 12}z', stroke_width='0.8'))
    # écoinçons
    corners = ''
    for (x, y, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        corners += f'M{f(x + sx * 3)} {f(y + sy * 3)}h{f(sx * 6)}v{f(sy * 6)}h{f(-sx * 6)}z'
    o.append(path('ink', corners, fill='currentColor', stroke_width='0.3'))
    # banderole
    by = y0 + 30
    band = (f'M{f(cx - 118)} {f(by - 8)}h236l-7 8 7 8h-236l7-8z')
    o.append(path('wash-carmin', band, stroke='currentColor'))
    o.append(path('ink-soft', band, stroke_width='0.7'))
    o.append(text('label', cx, by + 4, 'Carte de la Velmarche et de l’Ostrie', size=10.5))
    # titre, fougères
    o.append(text('label-major', cx, y0 + 82, 'La Velmarche', size=27))
    for side in (-1, 1):
        d, leaves = fern(cx + side * 158, y0 + 96, 1.3, rot=side * 0.2, mirror=side > 0)
        o.append(path('ink', d, stroke_width='0.9'))
        o.append(path('ink-soft', leaves, stroke_width='0.7'))
    o.append(path('ink-soft', f'M{f(cx - 60)} {f(y0 + 98)}h120', stroke_width='0.6'))
    o.append(path('ink', f'M{f(cx - 3)} {f(y0 + 98)}l3-3 3 3-3 3z', fill='currentColor', stroke_width='0.3'))
    o.append(text('label-note', cx, y0 + 115, 'pour l’Office de Réinscription civile, d’après la carte', size=10.5))
    o.append(text('label-note', cx, y0 + 128, 'de la Grande Exposition (1889), revue en 1974', size=10.5))
    o.append(text('label-note', cx, y0 + 146, 'dressée et gravée par CM Creative Lab', size=9.5))
    return o


def frame():
    o = []
    o.append(path('paper', f'M-40 -40H{f(W + 40)}V{f(H + 40)}H-40zM{M2} {M2}V{f(H - M2)}H{f(W - M2)}V{M2}z', fill_rule='evenodd'))
    band = ''
    step = 25
    for side in range(4):
        if side in (0, 2):
            yb = M1 + 1.4 if side == 0 else H - M2 + 0.6
            x, i = M2, 0
            while x < W - M2 - 0.1:
                x2 = min(x + step, W - M2)
                if i % 2 == 0:
                    band += f'M{f(x)} {f(yb)}H{f(x2)}v6H{f(x)}z'
                x, i = x2, i + 1
        else:
            xb = M1 + 1.4 if side == 3 else W - M2 + 0.6
            y, i = M2, 0
            while y < H - M2 - 0.1:
                y2 = min(y + step, H - M2)
                if i % 2 == 0:
                    band += f'M{f(xb)} {f(y)}V{f(y2)}h6V{f(y)}z'
                y, i = y2, i + 1
    o.append(path('ink-soft', band, fill='currentColor', stroke_width='0.4'))
    o.append(path('ink', f'M{M1} {M1}H{f(W - M1)}V{f(H - M1)}H{M1}z', stroke_width='3'))
    o.append(path('ink-soft', f'M{M2} {M2}H{f(W - M2)}V{f(H - M2)}H{M2}z', stroke_width='0.8'))
    sq = ''.join(f'M{f(x)} {f(y)}h8v8h-8z' for x, y in ((M1, M1), (W - M2, M1), (M1, H - M2), (W - M2, H - M2)))
    o.append(path('ink', sq, fill='currentColor', stroke_width='0.4'))
    return o


def toponyms():
    o = []
    # provinces et pays
    for s, nx, ny, size, rot in (('Ostrie', 0.455, 0.212, 32, -2), ('Velmarche', 0.345, 0.680, 28, -3),
                                 ('Thalberie', 0.974, 0.330, 21, 90)):
        x, y = P(nx, ny)
        o.append(text('label-region', x, y, s, size=size, rot=rot))
    # eaux
    for s, nx, ny, size, rot in (('la Clairette', 0.604, 0.660, 11, 56), ('l’Orvelle', 0.716, 0.662, 11, 41),
                                 ('l’Orvelle', 0.252, 0.476, 12, 17), ('estuaire', 0.070, 0.500, 10, 0)):
        x, y = P(nx, ny)
        o.append(text('label-water', x, y, s, size=size, rot=rot))
    # notes du graveur
    tx, ty = world.place_xy('tennok')
    for s, x, y, size in (('les Dents de Tennok', tx + 6, ty - 44, 9.5),
                          ('marais de Grisenoue', P(0.545, 0.300)[0], P(0.545, 0.300)[1], 10),
                          ('collines de Sorbe', P(0.575, 0.905)[0], P(0.575, 0.905)[1], 10),
                          ('route de Brénica', P(0.990, 0.668)[0], P(0.990, 0.668)[1], 8.5),
                          ):
        o.append(text('label-note', x, y, s, size=size, anchor='end' if s == 'route de Brénica' else 'middle'))
    o.append(text('label-note', 34, 0.40 * H, 'ligne des Paquebots de l’Orvelle', size=9, rot=-90))
    # hameaux d'Ostrie
    dots = ''
    for name, (hx, hy) in world.HAMLETS.items():
        x, y = P(hx, hy)
        dots += d_circle(x, y, 1.6)
        o.append(text('label', x + 4, y - 3.5, name, size=10.5, anchor='start'))
    o.insert(0, path('ink', dots, fill='currentColor', stroke_width='0.5'))
    return o


def build():
    o = [svg_open('labels', 'La Velmarche : toponymes, cadre et cartouche')]
    o += toponyms()
    o += rose()
    o += scale()
    o += cartouche()
    o += frame()
    o.append('</svg>')
    return ''.join(s for s in o if s)
