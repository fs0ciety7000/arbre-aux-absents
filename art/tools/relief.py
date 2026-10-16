"""art/map/relief.svg : monts Corvins (profils gravés, côté d'ombre hachuré), collines en
taupinières, falaises de l'Ostrie, forêts (feuillus et pins), landes de bruyère, roselières de
Grisenoue, labours autour des villes."""
import math
from common import (W, H, rng, d_poly, d_seg, path, svg_open, PP, P, blob, catmull, dist_polyline,
                    point_in_poly, Mask, f)
import world

# Crête des monts Corvins (positions normalisées) : arc du sud au nord-est, col ménagé.
SPINE = [(0.660, 1.010), (0.720, 0.965), (0.800, 0.950), (0.880, 0.930), (0.940, 0.870),
         (0.950, 0.800), (0.920, 0.740), (0.900, 0.700), (0.930, 0.640), (0.970, 0.570), (1.020, 0.520)]

HILL_ZONES = [
    # (x, y, rx, ry, densité, taille)
    (0.585, 0.850, 85, 55, 0.75, 1.0),   # collines de Sorbe
    (0.250, 0.840, 95, 75, 0.7, 1.0),    # collines côtières de Mérande
    (0.175, 0.650, 40, 60, 0.6, 0.85),
    (0.715, 0.575, 55, 35, 0.6, 0.9),    # piémont des Corvins
    (0.680, 0.700, 40, 40, 0.6, 0.9),
    (0.420, 0.700, 70, 40, 0.45, 0.8),
    (0.970, 0.320, 40, 110, 0.6, 0.9),   # Thalberie
    (0.600, 0.420, 60, 35, 0.35, 0.75),
    (0.300, 0.250, 80, 40, 0.4, 0.8),    # Ostrie, rebord du plateau
    (0.520, 0.200, 90, 40, 0.35, 0.75),
    (0.800, 0.240, 80, 45, 0.4, 0.8),
    (0.820, 0.420, 70, 50, 0.6, 0.9),
    (0.660, 0.380, 50, 30, 0.45, 0.8),
    (0.200, 0.560, 30, 40, 0.5, 0.8),
    (0.440, 0.890, 70, 30, 0.6, 0.85),
]

FORESTS = [
    # (x, y, rx, ry, essence, densité) ; la première est la forêt de Sorbe
    (0.552, 0.640, 46, 30, 'feuillu', 1.0),
    (0.405, 0.625, 32, 17, 'feuillu', 0.85),
    (0.268, 0.560, 22, 13, 'feuillu', 0.8),
    (0.735, 0.585, 34, 16, 'feuillu', 0.85),
    (0.300, 0.395, 24, 13, 'feuillu', 0.8),
    (0.625, 0.455, 28, 14, 'feuillu', 0.8),
    (0.190, 0.880, 30, 16, 'feuillu', 0.8),
    (0.780, 0.470, 30, 18, 'feuillu', 0.8),
    (0.960, 0.460, 22, 36, 'feuillu', 0.8),
    (0.355, 0.760, 34, 18, 'feuillu', 0.8),
    (0.470, 0.770, 24, 14, 'feuillu', 0.75),
    (0.700, 0.770, 26, 18, 'pin', 0.8),
    (0.760, 0.880, 40, 22, 'pin', 0.75),
    (0.850, 0.700, 22, 22, 'pin', 0.7),
    (0.905, 0.900, 30, 20, 'pin', 0.7),
    (0.800, 0.175, 22, 10, 'pin', 0.75),
    (0.410, 0.205, 20, 9, 'pin', 0.7),
    (0.660, 0.140, 18, 9, 'pin', 0.7),
    (0.230, 0.230, 20, 10, 'pin', 0.7),
    (0.985, 0.700, 22, 30, 'pin', 0.75),
    (0.860, 0.360, 26, 15, 'feuillu', 0.8),
    (0.700, 0.470, 22, 12, 'feuillu', 0.8),
    (0.215, 0.640, 18, 12, 'feuillu', 0.8),
    (0.420, 0.440, 20, 11, 'feuillu', 0.8),
    (0.405, 0.880, 30, 13, 'feuillu', 0.8),
    (0.520, 0.930, 22, 10, 'feuillu', 0.75),
]

FIELD_TOWNS = {'aubrelieu': (40, 95, 0), 'saint-ormel': (28, 70, 0), 'port-senane': (32, 66, 0),
               'moulinvert': (26, 58, 0), 'bains-de-merande': (28, 56, 0), 'hautcorvin': (24, 40, 0),
               'grisenoue': (28, 44, 0), 'brenzac': (24, 40, 0), 'vellaak': (22, 36, 0)}


def peak(x, y, w, h, r, lean):
    """Profil de montagne : (corps, ombre, trait)."""
    ax, ay = x + lean * w, y - h
    lx, rx = x - w / 2, x + w / 2
    left, right = [], []
    for k in range(6):
        t = k / 5
        bulge = math.sin(t * math.pi) * w * 0.05
        left.append((lx + (ax - lx) * t - bulge * 0.3, y + (ay - y) * t ** 0.85 - bulge))
        right.append((ax + (rx - ax) * t + bulge * 0.3, ay + (y - ay) * t ** 1.15 - bulge * 0.6))
    # petite épaule sur un versant
    if r.random() < 0.5:
        i = 3
        right[i] = (right[i][0] + w * 0.04, right[i][1] - h * 0.06)
    body = left + right[1:]
    ridge_end = (x + lean * w * 0.3 + w * 0.12, y)
    shadow = [left[-1]] + right[1:] + [ridge_end]
    outline = d_poly(left + right[1:])
    outline += d_poly([(ax, ay), ((ax + ridge_end[0]) / 2 + w * 0.03, (ay + y) / 2), ridge_end])
    snow = ''
    if h > 24:
        sx, sy = ax, ay
        snow = d_poly([(sx - w * 0.16, sy + h * 0.28), (sx - w * 0.08, sy + h * 0.2), (sx - w * 0.02, sy + h * 0.3),
                       (sx + w * 0.06, sy + h * 0.22), (sx + w * 0.13, sy + h * 0.3)])
    return d_poly(body, True), d_poly(shadow, True), outline, snow


def build():
    r = rng('relief')
    # champ historique (sans les îles ajoutées) : le tirage reste celui de la première gravure
    fld = world.field().legacy()
    mask = world.full_mask()
    # Les ajouts de l'affaire 2 effacent ce qui les recouvre sans changer le tirage (graine) : tout
    # est tiré comme à la première gravure, puis on ne grave pas ce qui tombe sous l'overlay.
    over = world.overlay_mask()
    used = Mask(3.0)
    used.g[:] = mask.g
    for name, (hx, hy) in world.HAMLETS.items():
        x, y = P(hx, hy)
        used.circle(x, y, 8)
        used.rect(x + 3, y - 12, x + 10 + len(name) * 11, y + 2)
    o = [svg_open('relief', 'La Velmarche : relief et végétation')]
    spine = PP(SPINE)
    colx, coly = world.place_xy('col-de-corvenne')

    # ------------------------------------------------ labours (sous le reste)
    fields_o, furrows, wheat = '', '', ''
    fmask = Mask(3.0)
    for pid, (r0, r1, n) in FIELD_TOWNS.items():
        cx, cy = world.place_xy(pid)
        rot = r.uniform(-0.5, 0.5)
        ca, sa = math.cos(rot), math.sin(rot)
        cw, ch = 11.0, 8.0
        span = int(r1 / ch) + 2
        for gj in range(-span, span + 1):
            off = r.uniform(0, cw)
            for gi in range(-span, span + 1):
                u0, v0 = gi * cw + off, gj * ch
                x, y = cx + u0 * ca - v0 * sa, cy + u0 * sa + v0 * ca
                d = math.hypot(x - cx, (y - cy) * 1.25)
                if d < r0 or d > r1 or r.random() > 1.15 - (d - r0) / (r1 - r0):
                    continue
                if not fld.is_land(x, y, 5) or used.hit(x, y, 3.5):
                    continue
                w_ = cw * r.choice((1, 1, 2)) if r.random() < 0.3 else cw
                q = [(-0.5, -0.5), (w_ / cw - 0.5, -0.5), (w_ / cw - 0.5, 0.5), (-0.5, 0.5)]
                pts = []
                for qu, qv in q:
                    uu, vv = u0 + qu * cw + r.uniform(-0.6, 0.6), v0 + qv * ch + r.uniform(-0.6, 0.6)
                    pts.append((cx + uu * ca - vv * sa, cy + uu * sa + vv * ca))
                hidden = over.hit(x, y, 5)
                if r.random() < 0.35:
                    wheat += '' if hidden else d_poly(pts, True)
                else:
                    fields_o += '' if hidden else d_poly(pts, True)
                if r.random() < 0.6:
                    # sillons parallèles à un côté
                    (ax, ay), (bx, by), (cx2, cy2), (dx2, dy2) = pts
                    for t in (0.2, 0.4, 0.6, 0.8):
                        if not hidden:
                            furrows += d_seg(ax + (dx2 - ax) * t, ay + (dy2 - ay) * t, bx + (cx2 - bx) * t, by + (cy2 - by) * t)
                fmask.circle(x, y, 5)
    o.append(path('wash-safran', wheat, fill_opacity='0.35'))
    o.append(path('wash-sauge', fields_o, fill_opacity='0.25'))
    o.append(path('ink-faint', fields_o + wheat, stroke_width='0.35'))
    o.append(path('ink-faint', furrows, stroke_width='0.35'))
    for y_ in range(0, len(fmask.g)):
        if fmask.g[y_]:
            used.g[y_] = 1

    # ------------------------------------------------ falaises du nord (hachures perpendiculaires à la côte)
    cliffs = ''
    for loop in world.coast_loops():
        if len(loop) < 40:
            continue
        pts = list(loop)
        for i in range(len(pts)):
            x, y = pts[i]
            if y > 0.30 * H or x > 0.93 * W:
                continue
            a, b = pts[i - 1], pts[(i + 1) % len(pts)]
            tx, ty = b[0] - a[0], b[1] - a[1]
            n = math.hypot(tx, ty) or 1
            nx, ny = -ty / n, tx / n
            if fld.at(x + nx * 3, y + ny * 3) > fld.at(x - nx * 3, y - ny * 3):
                nx, ny = -nx, -ny
            seglen = math.hypot(b[0] - x, b[1] - y)
            steps = max(1, int(seglen / 2.6))
            for s in range(steps):
                t = s / steps
                px, py = x + (b[0] - x) * t, y + (b[1] - y) * t
                ln = r.uniform(2.5, 5.5)
                ex, ey = px + nx * ln, py + ny * ln
                if fld.is_land(ex, ey, 0.5) and not used.hit(ex, ey):
                    cliffs += d_seg(px + nx * 0.8, py + ny * 0.8, ex, ey)
    o.append(path('ink-faint', cliffs, stroke_width='0.5'))

    # ------------------------------------------------ landes de bruyère et menhirs (Ostrie)
    tufts = ''
    menhirs = ''
    lim = list(world.ostrie_limit())
    for k in range(1400):
        x, y = r.uniform(0.11 * W, 0.92 * W), r.uniform(0.11 * H, 0.34 * H)
        d, s = dist_polyline(x, y, lim)
        ylim = lim[min(len(lim) - 1, int(s * (len(lim) - 1)))][1]
        if y > ylim - 4 or not fld.is_land(x, y, 4) or used.hit(x, y, 3):
            continue
        if r.random() < 0.45:
            continue
        s_ = r.uniform(1.6, 2.6)
        tufts += f'M{f(x - s_)} {f(y - s_ * 0.8)}l{f(s_)} {f(s_ * 0.8)}l{f(s_)} {f(-s_ * 0.8)}M{f(x)} {f(y)}v{f(-s_ * 1.1)}'
    for k in range(10):
        x, y = r.uniform(0.25 * W, 0.85 * W), r.uniform(0.15 * H, 0.29 * H)
        if not fld.is_land(x, y, 6) or used.hit(x, y, 4):
            continue
        menhirs += f'M{f(x - 1.2)} {f(y)}l{f(0.3)} {f(-4.6)}q{f(0.9)} {f(-1)} {f(1.8)} 0l{f(0.3)} {f(4.6)}z'
        used.circle(x, y, 4)
    o.append(path('ink-faint', tufts, stroke_width='0.5'))
    o.append(path('ink', menhirs, fill='currentColor', stroke_width='0.3'))

    # ------------------------------------------------ roselières de Grisenoue
    gx, gy, grx, gry = world.GRISENOUE_MARSH
    cx0, cy0 = P(gx, gy)
    reeds = ''
    marsh = blob(cx0, cy0, grx, gry, 'marsh', wob=0.25, n=20)
    for k in range(260):
        a = r.uniform(0, 2 * math.pi)
        rr = math.sqrt(r.random())
        x, y = cx0 + math.cos(a) * grx * rr, cy0 + math.sin(a) * gry * rr
        if used.hit(x, y, 3.2):
            continue
        reeds += f'M{f(x - 3)} {f(y)}h6M{f(x - 1.4)} {f(y)}l-.8-3.2M{f(x)} {f(y)}v-4.2M{f(x + 1.4)} {f(y)}l.8-3.2'
        used.circle(x, y, 3.4)
    o.append(path('wash-celadon', d_poly(marsh, True), fill_opacity='0.45'))
    o.append(path('ink-soft', reeds, stroke_width='0.45'))

    # ------------------------------------------------ collines (taupinières, sans corps)
    hill_out, hill_hatch = '', ''
    for zx, zy, zrx, zry, dens, size in HILL_ZONES:
        cx, cy = P(zx, zy)
        n = int(zrx * zry / 160 * dens)
        for k in range(n * 3):
            if n <= 0:
                break
            a = r.uniform(0, 2 * math.pi)
            rr = math.sqrt(r.random())
            x, y = cx + math.cos(a) * zrx * rr, cy + math.sin(a) * zry * rr
            w = r.uniform(12, 22) * size
            h = w * r.uniform(0.28, 0.42)
            if not fld.is_land(x, y, 4) or used.hit(x, y - h / 2, w * 0.45):
                continue
            hidden = over.hit(x, y - h / 2, w * 0.45)
            # arc du sommet
            if not hidden:
                hill_out += f'M{f(x - w / 2)} {f(y)}q{f(w * 0.45)} {f(-h * 2)} {f(w)} 0'
            # hachures côté est (ombre)
            m = 0 if hidden else 5
            for j in range(1, m + 1):
                t = 0.5 + 0.45 * j / (m + 1)
                px = x - w / 2 + w * (0.45 * 2 * t * (1 - t) + t * t)
                py = y - 4 * h * t * (1 - t)
                hill_hatch += d_seg(px - 0.3, py + 0.9, px - 1.6, y - 0.3)
            used.circle(x, y - h / 2, w * 0.5)
            n -= 1
    o.append(path('ink-soft', hill_out, stroke_width='0.7'))
    o.append(path('ink-faint', hill_hatch, stroke_width='0.45'))

    # ------------------------------------------------ forêts
    crowns, trunks, pines, shades, under = '', '', '', '', ''
    for k, (fx, fy, frx, fry, kind, dens) in enumerate(FORESTS):
        cx, cy = P(fx, fy)
        poly = blob(cx, cy, frx, fry, f'forest{k}', wob=0.3, n=20, rot=r.uniform(-0.3, 0.3))
        under += d_poly(poly, True)
        pts = []
        y = cy - fry * 1.4
        row = 0
        while y < cy + fry * 1.4:
            x = cx - frx * 1.4 + (row % 2) * 2.8
            while x < cx + frx * 1.4:
                jx, jy = x + r.uniform(-1.4, 1.4), y + r.uniform(-1.2, 1.2)
                if point_in_poly(jx, jy, poly) and r.random() < dens and fld.is_land(jx, jy, 2) and not used.hit(jx, jy, 2.4):
                    pts.append((jx, jy))
                x += 5.6
            y += 4.6
            row += 1
        pts.sort(key=lambda p: p[1])
        for x, y in pts:
            hidden = over.hit(x, y, 2.4)
            if kind == 'feuillu':
                rr = r.uniform(2.3, 3.1)
                if hidden:
                    continue
                crowns += (f'M{f(x - rr)} {f(y)}a{f(rr)} {f(rr * 0.92)} 0 1 1 {f(2 * rr)} 0'
                           f'a{f(rr)} {f(rr * 0.92)} 0 1 1 {f(-2 * rr)} 0z')
                trunks += f'M{f(x)} {f(y + rr * 0.9)}v{f(1.6)}'
                shades += f'M{f(x + rr * 0.15)} {f(y + rr * 0.85)}a{f(rr)} {f(rr)} 0 0 0 {f(rr * 0.8)} {f(-rr * 1.1)}'
            else:
                s = r.uniform(2.2, 3.0)
                if hidden:
                    continue
                pines += f'M{f(x)} {f(y - s * 2)}l{f(s * 0.9)} {f(s * 2)}h{f(-s * 1.8)}z'
                trunks += f'M{f(x)} {f(y)}v{f(1.4)}'
        for x, y in pts:
            used.circle(x, y, 2.2)
    o.append(path('wash-sauge', under, fill_opacity='0.4'))
    o.append(path('ink-soft', trunks, stroke_width='0.6'))
    o.append(path('wash-sauge', crowns + pines, stroke='currentColor'))
    o.append(path('ink-soft', shades, stroke_width='0.7'))

    # ------------------------------------------------ monts Corvins (profils, du fond vers l'avant)
    peaks = []
    gy_ = 0.58 * H
    while gy_ < H + 20:
        gx_ = 0.62 * W
        while gx_ < W + 20:
            x, y = gx_ + r.uniform(-6, 6), gy_ + r.uniform(-4, 4)
            d, _ = dist_polyline(x, y, spine)
            sc = max(0.0, 1 - d / 120)
            if sc > 0 and r.random() < 0.25 + sc * 0.9 and math.hypot(x - colx, y - coly) > 30:
                w = 18 + 36 * sc ** 1.2 * r.uniform(0.75, 1.15)
                h = w * r.uniform(0.5, 0.7)
                if fld.is_land(x, y, 2) and not used.hit(x, y - h * 0.45, w * 0.36):
                    peaks.append((y, x, w, h))
            gx_ += 15
        gy_ += 11
    peaks.sort()
    pk_used = Mask(3.0)
    kept = []
    for y, x, w, h in peaks:
        if pk_used.hit(x, y - h * 0.5, w * 0.12):
            continue
        body, shadow, outline, snow = peak(x, y, w, h, r, r.uniform(-0.08, 0.1))
        pk_used.circle(x, y - h * 0.5, w * 0.16)
        if over.hit(x, y - h * 0.3, w * 0.17):
            continue
        kept.append((y, x, w, h, body, shadow, outline, snow))
    # Regarnissage (affaire 2) : petits sommets, tirage à part, dans les trouées laissées par l'overlay.
    r2 = rng('relief-overlay')
    kmask = Mask(3.0)
    for y, x, w, h, *_ in kept:
        kmask.circle(x, y - h * 0.45, w * 0.3)
    fr = list(world.frontier())
    gy_ = 0.70 * H
    while gy_ < 0.82 * H:
        gx_ = 0.90 * W
        while gx_ < 0.99 * W:
            x, y = gx_ + r2.uniform(-5, 5), gy_ + r2.uniform(-3, 3)
            w = r2.uniform(16, 26)
            h = w * r2.uniform(0.5, 0.65)
            d, _ = dist_polyline(x, y, spine)
            east = x > max(p[0] for p in fr if abs(p[1] - y) < 6) + w * 0.6 if any(abs(p[1] - y) < 6 for p in fr) else False
            if (east and d < 110 and fld.is_land(x, y, 2) and not used.hit(x, y - h * 0.45, w * 0.3)
                    and not over.hit(x, y - h * 0.4, w * 0.36) and not kmask.hit(x, y - h * 0.45, w * 0.3)
                    and math.hypot(x - colx, y - coly) > 30):
                kept.append((y, x, w, h) + peak(x, y, w, h, r2, r2.uniform(-0.08, 0.1)))
                kmask.circle(x, y - h * 0.45, w * 0.32)
            gx_ += 12
        gy_ += 9
    kept.sort(key=lambda k: k[0])
    for y, x, w, h, body, shadow, outline, snow in kept:
        o.append(path('paper', body))
        o.append(path('hatch', shadow))
        o.append(path('ink-soft', outline + snow, stroke_width='0.75' if h > 20 else '0.6'))
    o.append('</svg>')
    return ''.join(o)
