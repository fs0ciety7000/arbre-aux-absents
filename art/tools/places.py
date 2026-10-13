"""art/map/places.svg : un <g id="place-<id>"> par lieu de la bible (préfixe lu par le renderer de carte), vignette gravée dessinée
autour de l'ancre (coordonnées locales, translate), lavis à l'intérieur (états du jeu,
DESIGN §10.6), toponyme du lieu dans le groupe (le jeu le passe en italique quand le lieu
n'est que « mentionné »)."""
import math
from common import f, d_poly, d_seg, d_circle, path, svg_open, rng, esc, blob, ribbon, wiggle, catmull, P, PP
import world

INK = {'stroke': 'currentColor'}


# ---------------------------------------------------------------- primitives locales

def poly(cls, pts, **kw):
    return path(cls, d_poly(pts, True), **kw)


def rect(cls, x, y, w, h, **kw):
    return path(cls, f'M{f(x)} {f(y)}h{f(w)}v{f(h)}h{f(-w)}z', **kw)


def wash(color, d, **kw):
    """Lavis avec un trait d'encre très fin (la main du coloriste)."""
    return path(f'wash-{color}', d, stroke='currentColor', **kw)


def R(x, y, w, h):
    return f'M{f(x)} {f(y)}h{f(w)}v{f(h)}h{f(-w)}z'


def C(x, y, r):
    return d_circle(x, y, r)


def ground(rx, ry, salt, dy=0):
    """Clairière de papier sous la vignette, bord en pointillé d'encre pâle."""
    pts = blob(0, dy, rx, ry, 'ground:' + salt, wob=0.12, n=20)
    return (path('paper', d_poly(pts, True))
            + path('ink-faint', d_poly(pts, True), stroke_width='0.45', stroke_dasharray='1.2 1.8'))


def house(x, y, w, h, roof='carmin', roof_h=None, door=True):
    """Maison vue de face : mur papier, toit en lavis, porte d'encre."""
    rh = roof_h if roof_h is not None else h * 0.75
    out = rect('paper', x - w / 2, y - h, w, h)
    out += wash(roof, d_poly([(x - w / 2 - 0.8, y - h), (x, y - h - rh), (x + w / 2 + 0.8, y - h)], True), stroke_width='0.6')
    out += path('ink', R(x - w / 2, y - h, w, h), stroke_width='0.6')
    if door:
        out += path('ink', R(x - w * 0.12, y - h * 0.55, w * 0.24, h * 0.55), fill='currentColor', stroke_width='0.2')
    return out


def blocks(rx, ry, salt, cls='carmin', cut=None, step=5.2, gap=1.1, dens=0.9, hatch_ratio=0.2):
    """Îlots d'une ville : quadrilatères irréguliers séparés par des rues."""
    r = rng('blocks:' + salt)
    d_w, d_h = '', ''
    y = -ry
    while y < ry:
        x = -rx + r.uniform(0, step * 0.5)
        while x < rx:
            w = step * r.uniform(0.8, 1.6)
            h = step * r.uniform(0.7, 1.1)
            cx, cy = x + w / 2, y + h / 2
            if (cx / rx) ** 2 + (cy / ry) ** 2 < 0.92 and r.random() < dens and (cut is None or cut(cx, cy)):
                j = lambda: r.uniform(-0.5, 0.5)
                q = [(x + gap / 2 + j(), y + gap / 2 + j()), (x + w - gap / 2 + j(), y + gap / 2 + j()),
                     (x + w - gap / 2 + j(), y + h - gap / 2 + j()), (x + gap / 2 + j(), y + h - gap / 2 + j())]
                if r.random() < hatch_ratio:
                    d_h += d_poly(q, True)
                else:
                    d_w += d_poly(q, True)
            x += w
        y += step * r.uniform(0.85, 1.1)
    out = ''
    if d_w:
        out += wash(cls, d_w, stroke_width='0.45')
    if d_h:
        out += path('hatch-dense', d_h) + path('ink-soft', d_h, stroke_width='0.45')
    return out


def smoke(x, y, s=1.0):
    return path('ink-faint', f'M{f(x)} {f(y)}c{f(-3 * s)} {f(-3 * s)} {f(3 * s)} {f(-5 * s)} {f(0)} {f(-9 * s)}'
                f's{f(2 * s)} {f(-5 * s)} {f(4 * s)} {f(-7 * s)}', stroke_width='0.6')


def tree(x, y, r_=2.6):
    return (path('ink-soft', f'M{f(x)} {f(y + r_ * 0.8)}v{f(2)}', stroke_width='0.6')
            + wash('sauge', C(x, y, r_), stroke_width='0.5'))


def pine(x, y, s=2.6):
    return wash('sauge', f'M{f(x)} {f(y - s * 2.2)}l{f(s)} {f(s * 2.2)}h{f(-2 * s)}z', stroke_width='0.5')


def label(pid):
    dx, dy, anchor, cls, size, rot, lines = world.PLACE_LABELS[pid]
    a = f'<text class="{cls}" x="{f(dx)}" y="{f(dy)}"'
    if anchor != 'start':
        a += f' text-anchor="{anchor}"'
    if size:
        a += f' font-size="{f(size)}"'
    if rot:
        a += f' transform="rotate({f(rot)} {f(dx)} {f(dy)})"'
    a += '>'
    if len(lines) == 1:
        return a + esc(lines[0]) + '</text>'
    for i, s in enumerate(lines):
        a += f'<tspan x="{f(dx)}"' + (f' dy="{f(size * 1.12)}"' if i else '') + f'>{esc(s)}</tspan>'
    return a + '</text>'


# ---------------------------------------------------------------- vignettes

def v_aubrelieu():
    o = [ground(50, 32, 'aub', dy=2)]
    # ville au nord de l'Orvelle (le fleuve passe vers y = +24 en local)
    orv = [(x - P(*world.PLACES['aubrelieu']['pos'])[0], y - P(*world.PLACES['aubrelieu']['pos'])[1])
           for x, y in world.orvelle_line()]

    sc = world.VSCALE['aubrelieu']

    def north(x, y):
        best = min(orv, key=lambda p: abs(p[0] - x * sc))
        return y * sc < best[1] - 5 and abs(x) < 46

    # enceinte (boulevards) : ovale d'encre pâle
    o.append(path('ink-faint', d_poly(blob(0, -2, 40, 22, 'aub-wall', wob=0.06, n=24), True), stroke_width='2.4'))
    o.append(blocks(42, 24, 'aub-n', 'carmin', cut=lambda x, y: north(x, y) and abs(x) > 9 or (north(x, y) and y > 4), step=4.6))
    o.append(path('', ''))
    # faubourg des Tanneurs, rive sud
    o.append('<g transform="translate(-6 25)">' + blocks(18, 6, 'aub-s', 'sienne', step=4.2) + '</g>')
    # citadelle (ancien BRR) : bastion étoilé à l'est
    star = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = 9 if k % 2 == 0 else 5.2
        star.append((36 + rr * math.cos(a), -16 + rr * math.sin(a)))
    o.append(wash('indigo', d_poly(star, True), stroke_width='0.6'))
    o.append(path('ink', d_poly(star, True), stroke_width='0.8'))
    o.append(path('ink-soft', R(33, -19, 6, 6), stroke_width='0.6'))
    # palais des Chartes (Archives nationales) : façade à colonnes et dôme
    o.append(rect('paper', -11, -12, 22, 10))
    o.append(wash('safran', f'M-7 -12a7 6.5 0 0 1 14 0z', stroke_width='0.6'))
    o.append(path('ink', 'M-7 -12a7 6.5 0 0 1 14 0M0 -18.5v-3.4M-1.2 -21h2.4', stroke_width='0.7'))
    o.append(path('ink', R(-11, -12, 22, 10), stroke_width='0.8'))
    o.append(path('ink-soft', ''.join(f'M{f(-9 + i * 2.6)} -11v8' for i in range(8)), stroke_width='0.6'))
    o.append(path('ink', 'M-13 -2h26', stroke_width='1'))
    o.append(path('ink', 'M-12 -12l12-3.4 12 3.4', stroke_width='0.7'))
    # opéra (petit dôme) et université (cour carrée) à l'ouest
    o.append(rect('paper', -30, -14, 10, 7))
    o.append(wash('safran', 'M-28 -14a3 3 0 0 1 6 0z', stroke_width='0.5'))
    o.append(path('ink', R(-30, -14, 10, 7) + 'M-28 -14a3 3 0 0 1 6 0', stroke_width='0.6'))
    o.append(path('ink-soft', R(-24, 4, 9, 7) + R(-21.5, 6.2, 4, 2.6), stroke_width='0.6'))
    # ponts sur l'Orvelle
    sc = world.VSCALE['aubrelieu']
    for bx in (-14, 12):
        by = min(orv, key=lambda p: abs(p[0] - bx * sc))[1] / sc
        o.append(rect('paper', bx - 1.5, by - 5, 3, 10))
        o.append(path('ink', f'M{f(bx - 1.6)} {f(by - 5)}v10M{f(bx + 1.6)} {f(by - 5)}v10', stroke_width='0.7'))
    o.append(label('aubrelieu'))
    return o


def v_moulinvert():
    o = [ground(26, 20, 'mv', dy=-2)]
    o.append(blocks(14, 7, 'mv', 'carmin', step=4.2, cut=lambda x, y: x < -2))
    # papeteries Varenque : halle à sheds
    o.append(rect('paper', -2, -10, 22, 9))
    teeth = 'M-2 -10' + ''.join('l2.75-3.6v3.6' for _ in range(8))
    o.append(wash('sienne', teeth + 'z', stroke_width='0.5'))
    o.append(path('ink', teeth + 'M-2 -10v9h22v-9', stroke_width='0.7'))
    o.append(path('ink-soft', ''.join(f'M{f(1 + i * 4)} -7.5h2v2.6h-2z' for i in range(5)), stroke_width='0.5'))
    # cheminées et fumées
    o.append(path('ink', 'M4 -13.6v-12h2.4v12M13 -13.6v-9h2v9', stroke_width='0.7'))
    o.append(smoke(5.2, -26.5, 0.9))
    o.append(smoke(14, -23.5, 0.7))
    # roue à aubes (sur la Clairette, à l'ouest) et bassins de pâte
    o.append(path('paper', C(-6, -2, 4.4)))
    o.append(path('ink', C(-6, -2, 4.4) + ''.join(d_seg(-6, -2, -6 + 4.4 * math.cos(a * math.pi / 4), -2 + 4.4 * math.sin(a * math.pi / 4)) for a in range(8)), stroke_width='0.55'))
    o.append(path('water', R(0, 2, 7, 4) + R(9, 2, 7, 4), stroke='currentColor'))
    o.append(house(-14, 6, 6, 4.5, 'carmin'))
    o.append(label('moulinvert'))
    return o


def v_foret_de_sorbe():
    o = [wash('lilas', d_poly(blob(0, -2, 14, 10, 'sorbe-l', wob=0.2, n=16), True), stroke_width='0.3', fill_opacity='0.7')]
    # moulin en ruine : murs brisés, roue à demi
    o.append(poly('paper', [(-7, 2), (-7, -6), (-3, -9), (1, -6), (2, -4), (5, -5), (6, 2)]))
    o.append(path('ink', 'M-7 2V-6l4-3 4 3M2 -4l3-1 1 7M-7 2h13', stroke_width='0.75'))
    o.append(path('ink-soft', 'M-5 -2h2v2.6h-2zM1 -1h2v3h-2z', fill='currentColor', stroke_width='0.3'))
    o.append(path('ink', 'M9 2a4 4 0 0 1 0-8M9 2V-6M9 -2l3.4-2', stroke_width='0.55'))
    o.append(path('hatch-dense', 'M-7 2V-6l4-3 4 3V2z'))
    for x, y in ((-12, 0), (-11, -8), (12, -6), (13, 2), (-2, -13), (5, -12)):
        o.append(tree(x, y, 2.6))
    o.append(label('foret-de-sorbe'))
    return o


def v_lac_d_aulne():
    o = []
    # le lac est dans water.svg : ici, chalets sur la rive nord, barque, aulnes
    o.append(wash('celadon', d_poly(blob(0, 0, 33, 15, 'aulne-w', wob=0.12, n=20, rot=-0.4), True), stroke_width='0.3', fill_opacity='0.6'))
    o.append(house(-14, -10, 6, 4, 'carmin', roof_h=4.5))
    o.append(house(-5, -15, 5, 3.5, 'safran', roof_h=4))
    o.append(path('ink', 'M3 3q4 2.4 8 0zM7 2.4v-5.4l3 4z', stroke_width='0.6'))
    o.append(path('ink-faint', 'M1 5.2h12M3 6.6h8', stroke_width='0.5'))
    for x, y in ((-22, -4), (-19, -11), (20, -10), (24, -3), (-26, 3)):
        o.append(tree(x, y, 2.4))
    o.append(label('lac-d-aulne'))
    return o


def v_saint_ormel():
    o = [ground(26, 18, 'so', dy=0)]
    o.append(blocks(24, 12, 'so', 'carmin', step=4.4, cut=lambda x, y: abs(x) > 9 or y > 4))
    # cathédrale : nef, transept, flèche, deux tours en façade (ouest)
    o.append(rect('paper', -9, -8, 18, 8))
    o.append(wash('ardoise', 'M-9 -8l2-3h16l2 3z', stroke_width='0.5'))
    o.append(path('ink', R(-9, -8, 18, 8) + 'M-9 -8l2-3h16l2 3', stroke_width='0.7'))
    o.append(rect('paper', -13, -15, 6, 15))
    o.append(wash('ardoise', 'M-13 -15l3-6 3 6z', stroke_width='0.5'))
    o.append(path('ink', R(-13, -15, 6, 15) + 'M-13 -15l3-6 3 6M-10 -21v-2', stroke_width='0.7'))
    o.append(path('ink', 'M3 -11l1.4-12 1.4 12M4.4 -23v-2.4M3.4 -24.4h2', stroke_width='0.7'))
    o.append(path('ink-soft', ''.join(f'M{f(-6 + i * 3)} -6.2a1 1 0 0 1 2 0v3.6h-2z' for i in range(5)) + 'M-11 -11a1 1 0 0 1 2 0v4h-2z', fill='currentColor', stroke_width='0.2'))
    o.append(wash('lilas', C(-10, -4.6, 1.6), stroke_width='0.4'))
    o.append(label('saint-ormel'))
    return o


def v_port_senane():
    o = [ground(30, 17, 'ps', dy=-6)]
    o.append(blocks(26, 12, 'ps', 'carmin', step=4.4, cut=lambda x, y: y < -1 and x < 14))
    # quais et bassins sur l'estuaire (le fleuve passe vers y = +11,5 en local)
    o.append(rect('paper', -24, 2, 46, 5))
    o.append(path('ink', 'M-24 2h46M-24 7h10v3h4v-3h10v3h4v-3h10v3h4v-3h4', stroke_width='0.7'))
    # vapeur de la Compagnie des Paquebots : coque, cheminées, fumée (à quai)
    o.append(wash('indigo', 'M-6 10.5h20l-2.6 3.4h-15z', stroke_width='0.6'))
    o.append(path('ink', 'M-6 10.5h20l-2.6 3.4h-15zM-2 10.5v-2h12v2', stroke_width='0.7'))
    o.append(wash('carmin', R(1, 5, 2.2, 3.4) + R(6, 5, 2.2, 3.4), stroke_width='0.5'))
    o.append(smoke(2.1, 4.6, 0.6))
    # grue de chantier naval
    o.append(path('ink', 'M18 2v-16l10 4M18 -14l-4 3M26 -10.6v5', stroke_width='0.7'))
    # hôpital maritime / théâtre : façade claire
    o.append(rect('paper', -26, -12, 9, 7))
    o.append(wash('safran', 'M-27 -12l5.5-3 5.5 3z', stroke_width='0.5'))
    o.append(path('ink', R(-26, -12, 9, 7) + 'M-27 -12l5.5-3 5.5 3', stroke_width='0.6'))
    o.append(label('port-senane'))
    return o


def v_bains_de_merande():
    o = [ground(28, 19, 'bm', dy=-2)]
    o.append(blocks(24, 12, 'bm', 'carmin', step=4.4, cut=lambda x, y: abs(x) > 12 or y > 5, dens=0.75))
    # thermes : rotonde à coupole et colonnade
    o.append(rect('paper', -11, -8, 22, 8))
    o.append(wash('safran', 'M-5 -8a5 5.6 0 0 1 10 0z', stroke_width='0.5'))
    o.append(path('ink', R(-11, -8, 22, 8) + 'M-5 -8a5 5.6 0 0 1 10 0M0 -13.6v-2.6', stroke_width='0.7'))
    o.append(path('ink-soft', ''.join(f'M{f(-9.5 + i * 2.7)} -7v6' for i in range(8)), stroke_width='0.55'))
    o.append(path('ink', 'M-12 0h24', stroke_width='0.9'))
    # vapeurs des sources
    o.append(smoke(-9, -10, 0.55))
    o.append(smoke(9, -10, 0.55))
    # sanatorium sur la colline, savonnerie
    o.append(house(18, -10, 8, 5, 'celadon', roof_h=3, door=False))
    o.append(house(-19, -8, 7, 5, 'sienne', roof_h=3))
    o.append(label('bains-de-merande'))
    return o


def v_hautcorvin():
    o = [ground(24, 17, 'hc', dy=-2)]
    o.append(blocks(20, 9, 'hc', 'carmin', step=4.2, cut=lambda x, y: x > -4, dens=0.8))
    # four de verrerie (bouteille) et sa fumée
    o.append(wash('sienne', 'M-14 2c-2-5 0-9 2-12v-3h2v3c2 3 4 7 2 12z', stroke_width='0.5'))
    o.append(path('ink', 'M-14 2c-2-5 0-9 2-12v-3h2v3c2 3 4 7 2 12zM-15 2h10', stroke_width='0.7'))
    o.append(smoke(-11, -14, 0.8))
    # garnison : fort carré, drapeau
    o.append(wash('indigo', R(4, -14, 12, 8), stroke_width='0.5'))
    o.append(path('ink', R(4, -14, 12, 8) + 'M4 -14' + ''.join('h1.5v-1.5h1.5v1.5' for _ in range(4)) + 'M10 -15.5v-7l4 1.6-4 1.6', stroke_width='0.65'))
    o.append(label('hautcorvin'))
    return o


def v_col_de_corvenne():
    o = []
    o.append(wash('ardoise', d_poly(blob(0, -2, 13, 9, 'col', wob=0.2, n=14), True), stroke_width='0.3', fill_opacity='0.8'))
    # fortin crénelé
    o.append(rect('paper', -9, -9, 8, 9))
    o.append(path('ink', R(-9, -9, 8, 9) + 'M-9 -9' + ''.join('v-1.6h1.6v1.6h0.4' for _ in range(4)) + 'M-6.2 -4h2.4v4', stroke_width='0.65'))
    o.append(path('hatch-dense', R(-3.6, -9, 2.6, 9)))
    # croix des morts sur son tertre
    o.append(path('ink', 'M3 2q4-4 8 0M7 0v-11M4.4 -8h5.2', stroke_width='0.8'))
    o.append(label('col-de-corvenne'))
    return o


def v_monts_corvins():
    o = []
    # lavis de la chaîne (sous les sommets du relief), puis trois grands sommets enneigés
    from relief import SPINE
    from common import chaikin, ribbon as rib
    sp = catmull(PP(SPINE), 6)
    chain = chaikin(rib(sp, [150 + 40 * math.sin(i / 9) for i in range(len(sp))]), 3, closed=True)
    x0, y0 = world.place_xy('monts-corvins')
    sc = world.VSCALE['monts-corvins']
    chain = [((x - x0) / sc, (y - y0) / sc) for x, y in chain]
    o.append(path('wash-sienne', d_poly(chain, True), fill_opacity='0.3'))
    r = rng('monts-vignette')
    for (x, y, w, h) in ((-17, 9, 30, 22), (15, 10, 28, 19), (0, 7, 36, 30)):
        ax, ay = x + 1, y - h
        # versants dentelés : quelques ressauts le long de chaque arête
        left = [(x - w / 2, y)]
        for t in (0.3, 0.55, 0.78):
            left.append((x - w / 2 + (ax - x + w / 2) * t + r.uniform(-1, 1), y - h * t + r.uniform(-1.2, 1.2)))
        right = []
        for t in (0.22, 0.45, 0.7):
            right.append((ax + (x + w / 2 - ax) * t + r.uniform(-1, 1), ay + h * t + r.uniform(-1.2, 1.2)))
        right.append((x + w / 2, y))
        body = left + [(ax, ay)] + right
        foot = (x + w * 0.1, y)
        o.append(poly('paper', body))
        o.append(path('hatch', d_poly([(ax, ay)] + right + [foot], True)))
        o.append(wash('sienne', d_poly(left + [(ax, ay), (ax - 1, ay + h * 0.4), (x - w * 0.05, y)], True), stroke_width='0.3'))
        snow = [left[3], (ax, ay), right[0], (right[0][0] - 1.5, right[0][1] + 2.2), (ax - 0.5, ay + h * 0.2),
                (ax - 2.5, ay + h * 0.32), (left[3][0] + 0.8, left[3][1] + 1.6)]
        o.append(poly('paper', snow))
        o.append(path('ink', d_poly(body) + d_poly([(ax, ay), (ax - 1, ay + h * 0.45), foot]), stroke_width='0.8'))
        o.append(path('ink-faint', d_poly(snow[2:]), stroke_width='0.5'))
    o.append(pine(-30, 12, 2.6))
    o.append(pine(-25, 14, 2.2))
    o.append(pine(30, 13, 2.4))
    o.append(label('monts-corvins'))
    return o


def v_brenzac():
    o = [ground(22, 17, 'bz', dy=-2)]
    # enceinte ronde à tours, ville thalbère
    o.append(blocks(14, 9, 'bz', 'carmin', step=4.0, cut=lambda x, y: abs(x) > 5 or y > 2))
    o.append(path('ink', d_poly(blob(0, -1, 17, 12, 'bz-w', wob=0.05, n=22), True), stroke_width='1.1'))
    o.append(path('ink', ''.join(C(17 * math.cos(a), -1 + 12 * math.sin(a), 1.6) for a in (0.3, 1.4, 2.5, 3.6, 4.7, 5.6)), fill='currentColor', stroke_width='0.3'))
    # église à bulbe (cuivre vert-de-gris)
    o.append(rect('paper', -3, -10, 6, 10))
    o.append(wash('celadon', 'M-3.2 -10c-1.6-2 0-4 3.2-6.4 3.2 2.4 4.8 4.4 3.2 6.4z', stroke_width='0.5'))
    o.append(path('ink', R(-3, -10, 6, 10) + 'M-3.2 -10c-1.6-2 0-4 3.2-6.4 3.2 2.4 4.8 4.4 3.2 6.4M0 -16.4v-2.4M-1 -17.8h2', stroke_width='0.7'))
    o.append(label('brenzac'))
    return o


def v_grisenoue():
    o = [wash('lilas', d_poly(blob(0, -3, 20, 13, 'gn', wob=0.15, n=16), True), stroke_width='0.3', fill_opacity='0.75')]
    # bourg : quelques maisons
    o.append(house(-14, 6, 6, 4, 'carmin', roof_h=3.4))
    o.append(house(-7, 9, 5, 3.6, 'ardoise', roof_h=3))
    # ruines calcinées de l'institution des Pupilles : façade éventrée, sans toit
    o.append(poly('paper', [(-6, 0), (-6, -10), (-2, -13), (1, -10), (4, -11), (7, -8), (10, -12), (14, -9), (14, 0)]))
    o.append(path('hatch-dense', d_poly([(-6, 0), (-6, -10), (-2, -13), (1, -10), (4, -11), (7, -8), (10, -12), (14, -9), (14, 0)], True)))
    o.append(path('ink', 'M-6 0V-10l4-3 3 3 3-1 3 3 3-4 4 3V0z', stroke_width='0.75'))
    o.append(path('paper', ''.join(R(-4 + i * 4, -7, 2, 3) for i in range(5))))
    o.append(path('ink', ''.join(R(-4 + i * 4, -7, 2, 3) for i in range(5)), stroke_width='0.5'))
    # roseaux
    o.append(path('ink-soft', 'M14 6h7M16 6l-1-4M17.5 6v-5M19 6l1-4M-22 0h6M-20 0l-1-3.4M-19 0v-4.4M-17.6 0l.8-3.4', stroke_width='0.5'))
    o.append(label('grisenoue'))
    return o


def v_landes():
    o = [wash('lilas', d_poly(blob(0, 0, 18, 10, 'ld', wob=0.25, n=14), True), stroke_width='0.3', fill_opacity='0.8')]
    # trois menhirs et une bergerie (enclos rond)
    o.append(path('ink', 'M-12 4l.6-10q1.4-1.6 2.8 0l.6 10zM-6 4l.4-7q1-1.2 2 0l.4 7zM-1 4l.3-5q.8-1 1.6 0l.3 5z', fill='currentColor', stroke_width='0.3'))
    o.append(path('ink-soft', C(9, 1, 5.5), stroke_width='0.7', stroke_dasharray='1.2 0.8'))
    o.append(house(9, 1.6, 5, 3, 'sienne', roof_h=2.6, door=False))
    o.append(path('ink-faint', 'M-16 6l1.4 1.4 1.4-1.4M-2 8l1.4 1.4 1.4-1.4M14 8l1.4 1.4 1.4-1.4', stroke_width='0.5'))
    o.append(label('landes-d-ostrie'))
    return o


def v_tennok():
    o = []
    # rochers, maison du gardien, abri du canot, phare blanc à bande rouge
    o.append(path('paper', d_poly(blob(0, 4, 14, 6, 'tk-rock', wob=0.2, n=14), True)))
    o.append(path('hatch', d_poly(blob(3, 6, 11, 4, 'tk-rock2', wob=0.25, n=12), True)))
    o.append(path('ink-soft', d_poly(blob(0, 4, 14, 6, 'tk-rock', wob=0.2, n=14), True), stroke_width='0.6'))
    o.append(house(-8.5, 4, 6, 4, 'carmin', roof_h=3))
    o.append(house(8.5, 5, 5, 3, 'ardoise', roof_h=2.2, door=False))
    tower = [(-2.6, 3), (-1.6, -16), (1.6, -16), (2.6, 3)]
    o.append(poly('paper', tower))
    o.append(wash('carmin', d_poly([(-2.2, -4), (-1.9, -10), (1.9, -10), (2.2, -4)], True), stroke_width='0.3'))
    o.append(path('ink', d_poly(tower, True) + R(-2.2, -20, 4.4, 4) + 'M-2.8 -20h5.6M-1.6 -20l1.6-2.6 1.6 2.6', stroke_width='0.7'))
    o.append(wash('safran', R(-1.6, -19.4, 3.2, 3), stroke_width='0.3'))
    o.append(path('ink-faint', 'M-4 -18h-7M4 -18h7M-3.6 -21l-6-3.4M3.6 -21l6-3.4M-3.6 -15l-6 3M3.6 -15l6 3', stroke_width='0.5'))
    o.append(label('tennok'))
    return o


def v_vellaak():
    o = [ground(20, 13, 'vk', dy=0)]
    roofs = ('carmin', 'safran', 'indigo', 'carmin', 'sauge')
    for i, (x, y) in enumerate(((-12, -2), (-5, -5), (2, -3), (9, -6), (-8, 5))):
        o.append(house(x, y, 5, 3.6, roofs[i], roof_h=3.4))
    # séchoirs à poisson (chevalets) et barques
    o.append(path('ink', 'M5 6l2-5 2 5M11 6l2-5 2 5M7 1h6', stroke_width='0.6'))
    o.append(path('ink-soft', 'M8 1.6v2M9.6 1.6v2.4M11.4 1.6v2', stroke_width='0.45'))
    o.append(path('ink', 'M-2 10q3 2 6 0zM-6 12q2.4 1.6 4.8 0z', stroke_width='0.6'))
    o.append(label('vellaak'))
    return o


def v_kessaar():
    o = []
    # bagne : enceinte, blocs cellulaires, infirmerie, petit phare
    o.append(wash('ardoise', R(-12, -6, 20, 10), stroke_width='0.3'))
    o.append(path('ink', R(-12, -6, 20, 10), stroke_width='1'))
    o.append(path('hatch-dense', R(-10, -4, 6, 6) + R(-2, -4, 6, 6)))
    o.append(path('ink-soft', R(-10, -4, 6, 6) + R(-2, -4, 6, 6), stroke_width='0.5'))
    o.append(house(12, 3, 5, 3, 'lilas', roof_h=2.4, door=False))
    o.append(path('paper', 'M-17 3l.6-8h2l.6 8z'))
    o.append(path('ink', 'M-17 3l.6-8h2l.6 8zM-16.8 -5l1.2-2 1.2 2', stroke_width='0.6'))
    o.append(label('kessaar'))
    return o


def v_mer_grise():
    o = []
    # phoque sur un rocher, brume
    o.append('<g transform="translate(-118 2)">'
             + path('paper', d_poly(blob(0, 4, 7, 2.6, 'mg-rock', wob=0.2, n=10), True))
             + path('ink-soft', d_poly(blob(0, 4, 7, 2.6, 'mg-rock', wob=0.2, n=10), True), stroke_width='0.5')
             + wash('ardoise', 'M-6 2c2-3 6-4 9-3 2 .6 3-1 4.6-1.6-.4 1.6-1.6 2.2-2.6 2.4 1 1 2.4 1.4 3 2.2z', stroke_width='0.6')
             + '</g>')
    o.append(path('ink-faint', 'M106 -6h22M110 -3h14M116 0h10', stroke_width='0.6', stroke_dasharray='4 2'))
    o.append(label('mer-grise'))
    return o


def v_golfe_d_ambre():
    o = []
    # trois-mâts sous voiles, ambre sur la grève
    o.append(wash('sienne', 'M-12 6h24l-4 5h-16z', stroke_width='0.6'))
    o.append(path('ink', 'M-12 6h24l-4 5h-16zM-6 6v-20M2 6v-24M9 6v-16', stroke_width='0.7'))
    sails = (R(-10, -12, 8, 5) + R(-9.5, -6, 7, 5) + R(-2, -17, 8, 5) + R(-1.5, -11, 7, 5) + R(-1, -5, 6, 4)
             + R(6, -9, 6, 4) + R(6.4, -4, 5.2, 3.4))
    o.append(path('paper', sails))
    o.append(path('ink-soft', sails, stroke_width='0.55'))
    o.append(path('ink-faint', 'M-16 13q4-2 8 0t8 0t8 0t8 0', stroke_width='0.5'))
    o.append(label('golfe-d-ambre'))
    return o


def v_orvelle():
    o = []
    # bac à traille : câble d'une rive à l'autre, bac plat, passeur
    o.append(path('ink-faint', 'M-3 -11L3 11', stroke_width='0.5', stroke_dasharray='1.2 1'))
    o.append(wash('sienne', d_poly([(-4, -2.4), (4.4, -0.2), (3.6, 2.4), (-4.8, 0.2)], True), stroke_width='0.6'))
    o.append(path('ink', 'M-1 -1v-3.4M-1.8 -3h1.6', stroke_width='0.55'))
    o.append(path('ink', 'M-6 -10h4M2 10h4', stroke_width='1'))
    o.append(label('orvelle'))
    return o


DRAW = {
    'aubrelieu': v_aubrelieu, 'moulinvert': v_moulinvert, 'foret-de-sorbe': v_foret_de_sorbe,
    'lac-d-aulne': v_lac_d_aulne, 'saint-ormel': v_saint_ormel, 'port-senane': v_port_senane,
    'bains-de-merande': v_bains_de_merande, 'hautcorvin': v_hautcorvin, 'col-de-corvenne': v_col_de_corvenne,
    'monts-corvins': v_monts_corvins, 'brenzac': v_brenzac, 'grisenoue': v_grisenoue,
    'landes-d-ostrie': v_landes, 'tennok': v_tennok, 'vellaak': v_vellaak, 'kessaar': v_kessaar,
    'mer-grise': v_mer_grise, 'golfe-d-ambre': v_golfe_d_ambre, 'orvelle': v_orvelle,
}

# Ordre de dessin : mers et régions d'abord (sous les villes), puis du nord au sud.
ORDER = ['mer-grise', 'golfe-d-ambre', 'monts-corvins', 'landes-d-ostrie', 'orvelle', 'kessaar', 'tennok',
         'vellaak', 'grisenoue', 'port-senane', 'saint-ormel', 'aubrelieu', 'brenzac', 'foret-de-sorbe',
         'moulinvert', 'col-de-corvenne', 'bains-de-merande', 'hautcorvin', 'lac-d-aulne']


def build():
    assert set(ORDER) == set(world.PLACES) == set(DRAW)
    o = [svg_open('places', 'La Velmarche : lieux')]
    for pid in ORDER:
        x, y = world.place_xy(pid)
        parts = [s for s in DRAW[pid]() if s]
        sc = world.VSCALE.get(pid, 1.0)
        art, lab = ''.join(parts[:-1]), parts[-1]
        inner = (f'<g transform="scale({f(sc)})">{art}</g>' if sc != 1 else art) + lab
        o.append(f'<g id="place-{pid}" transform="translate({f(x)} {f(y)})">{inner}</g>')
    o.append('</svg>')
    return ''.join(o)
