"""Géographie de la Velmarche (docs/monde/00-monde.md §3), en positions normalisées.

Calcule une fois (mémoïsé) le champ terre/mer, le trait de côte, les fleuves, les routes et
les zones réservées, partagés par toutes les couches. Les lieux du jeu sont dans PLACES ;
leurs positions sont reprises telles quelles dans content/world/places/<id>.json.
"""
import math
from functools import lru_cache
from common import (W, H, P, PP, Noise, chaikin, simplify, signed_dist_poly, dist_polyline,
                    catmull, wiggle, area, Mask, resample, blob)

# ---------------------------------------------------------------- lieux (ids de la bible)
# kind : PLACE_KINDS du contrat. pos : position normalisée (ancre de la vignette).
# label : (dx, dy, ancre) du toponyme relatif à l'ancre, en unités de viewBox.
PLACES = {
    'aubrelieu': dict(name='Aubrelieu', kind='city', pos=(0.500, 0.548), focus=3.0, hit=44),
    'moulinvert': dict(name='Moulinvert', kind='city', pos=(0.622, 0.700), focus=3.4, hit=26),
    'foret-de-sorbe': dict(name='Forêt et moulin de la Sorbe', kind='landmark', pos=(0.556, 0.638), focus=3.6, hit=22),
    'lac-d-aulne': dict(name="Lac d'Aulne", kind='landmark', pos=(0.668, 0.822), focus=3.2, hit=26),
    'saint-ormel': dict(name='Saint-Ormel', kind='city', pos=(0.340, 0.497), focus=3.2, hit=26),
    'port-senane': dict(name='Port-Sénane', kind='city', pos=(0.136, 0.455), focus=3.0, hit=34),
    'bains-de-merande': dict(name='Bains-de-Mérande', kind='city', pos=(0.222, 0.758), focus=3.0, hit=26),
    'hautcorvin': dict(name='Hautcorvin', kind='city', pos=(0.800, 0.785), focus=3.2, hit=26),
    'col-de-corvenne': dict(name='Col de Corvenne', kind='landmark', pos=(0.886, 0.716), focus=3.4, hit=24),
    'monts-corvins': dict(name='Monts Corvins', kind='mountain', pos=(0.850, 0.905), focus=1.8, hit=60),
    'brenzac': dict(name='Brenzac', kind='city', pos=(0.958, 0.615), focus=3.0, hit=26),
    'grisenoue': dict(name='Grisenoue', kind='village', pos=(0.480, 0.340), focus=3.2, hit=26),
    'landes-d-ostrie': dict(name="Landes d'Ostrie", kind='region', pos=(0.640, 0.215), focus=1.8, hit=50),
    'tennok': dict(name='Cap et phare de Tennok', kind='landmark', pos=(0.168, 0.088), focus=3.4, hit=26),
    'vellaak': dict(name='Vellaak', kind='village', pos=(0.744, 0.112), focus=3.4, hit=26),
    'kessaar': dict(name='Île de Kessaar', kind='landmark', pos=(0.458, 0.040), focus=3.4, hit=28),
    'mer-grise': dict(name='Mer Grise', kind='sea', pos=(0.640, 0.036), focus=1.5, hit=60),
    'golfe-d-ambre': dict(name="Golfe d'Ambre", kind='sea', pos=(0.066, 0.600), focus=1.5, hit=60),
    'orvelle': dict(name="L'Orvelle et la Clairette", kind='river', pos=(0.420, 0.548), focus=2.2, hit=30),
}

# Hameaux ostriens (noms de lieux de la bible §4 : Orrvik, Draavik, Kessvel, Haask) : simples
# repères gravés dans labels.svg, pas des lieux du jeu.
HAMLETS = {
    'Orrvik': (0.262, 0.172),
    'Kessvel': (0.392, 0.160),
    'Draavik': (0.868, 0.118),
    'Haask': (0.360, 0.262),
}

# ---------------------------------------------------------------- terre

# Polygone de contrôle de la terre ferme (sens horaire depuis la pointe de Tennok).
LAND = [
    (0.150, 0.060), (0.176, 0.082), (0.194, 0.122), (0.212, 0.162), (0.242, 0.186),
    (0.274, 0.176), (0.300, 0.150), (0.340, 0.130), (0.385, 0.132), (0.430, 0.138), (0.480, 0.126),
    (0.530, 0.108), (0.580, 0.098), (0.630, 0.088), (0.680, 0.080), (0.730, 0.070),
    (0.790, 0.066), (0.850, 0.062), (0.900, 0.070), (0.950, 0.064), (1.100, 0.064),
    (1.100, 1.100), (0.020, 1.100), (0.040, 0.960), (0.070, 0.900), (0.110, 0.850),
    (0.150, 0.805), (0.172, 0.785), (0.150, 0.748), (0.116, 0.706), (0.124, 0.655),
    (0.098, 0.605), (0.108, 0.550), (0.100, 0.500), (0.094, 0.440), (0.078, 0.400),
    (0.104, 0.352), (0.094, 0.310), (0.100, 0.240),
    (0.112, 0.205), (0.132, 0.172), (0.148, 0.138), (0.140, 0.098),
]

# Fjords d'Ostrie (de la mer vers le fond), largeur à l'embouchure → au fond.
FJORDS = [
    ([(0.768, 0.020), (0.758, 0.060), (0.748, 0.088), (0.746, 0.104)], 13, 3),   # Vellaak
    ([(0.640, 0.030), (0.636, 0.080), (0.626, 0.112), (0.618, 0.132)], 10, 2.4),
    ([(0.565, 0.040), (0.570, 0.100), (0.575, 0.140)], 10, 2.4),
    ([(0.865, 0.020), (0.858, 0.070), (0.850, 0.104)], 10, 2.4),
    ([(0.700, 0.030), (0.702, 0.075), (0.694, 0.098)], 5, 1.6),
    ([(0.335, 0.090), (0.330, 0.140), (0.338, 0.172)], 6, 2),
    ([(0.262, 0.120), (0.262, 0.160), (0.258, 0.182)], 9, 3),                      # baie d'Orrvik
    ([(0.475, 0.090), (0.482, 0.130), (0.490, 0.150)], 5, 1.6),
    ([(0.920, 0.030), (0.925, 0.075), (0.930, 0.095)], 5, 1.6),
    ([(0.050, 0.300), (0.100, 0.300), (0.125, 0.292)], 7, 2.5),                    # ria ouest
]

# Îles : (x, y, rx, ry) normalisés → unités.
ISLANDS = [
    (0.458, 0.042, 24, 14),   # Kessaar
    (0.118, 0.060, 5, 3.5),   # écueils au large de Tennok
    (0.540, 0.050, 6, 4),
    (0.810, 0.032, 5, 3),
    (0.060, 0.410, 6, 4),
    (0.075, 0.760, 7, 4.5),
]

# ---------------------------------------------------------------- eaux douces

ORVELLE = [
    (0.878, 0.890), (0.855, 0.862), (0.828, 0.830), (0.806, 0.806), (0.778, 0.772),
    (0.750, 0.735), (0.724, 0.694), (0.694, 0.660), (0.660, 0.630), (0.624, 0.612),
    (0.588, 0.600), (0.556, 0.588), (0.526, 0.578), (0.500, 0.572), (0.470, 0.566),
    (0.440, 0.548), (0.410, 0.534), (0.376, 0.522), (0.344, 0.512), (0.310, 0.506),
    (0.272, 0.492), (0.232, 0.482), (0.192, 0.472), (0.158, 0.469), (0.130, 0.470),
    (0.104, 0.474), (0.080, 0.478),
]
# Largeur (unités) le long de l'Orvelle, indexée par abscisse normalisée.
ORVELLE_W = [(0.0, 0.9), (0.12, 2.0), (0.35, 3.2), (0.55, 4.4), (0.75, 5.4), (0.88, 6.6), (0.94, 11), (1.0, 26)]

CLAIRETTE = [
    (0.660, 0.806), (0.652, 0.780), (0.640, 0.752), (0.628, 0.722), (0.622, 0.704),
    (0.610, 0.680), (0.596, 0.656), (0.582, 0.630), (0.570, 0.610), (0.558, 0.589),
]

STREAMS = [
    # (points, largeur source, largeur bouche)
    ([(0.482, 0.300), (0.474, 0.360), (0.462, 0.420), (0.448, 0.480), (0.440, 0.548)], 0.8, 2.0),  # la noue de Grisenoue
    ([(0.300, 0.690), (0.316, 0.630), (0.330, 0.570), (0.344, 0.512)], 0.6, 1.6),
    ([(0.282, 0.840), (0.240, 0.818), (0.200, 0.806), (0.152, 0.795)], 0.6, 1.8),
    ([(0.930, 0.800), (0.890, 0.808), (0.850, 0.812), (0.818, 0.814)], 0.6, 1.4),
    ([(0.360, 0.290), (0.346, 0.230), (0.338, 0.172)], 0.6, 1.4),
    ([(0.610, 0.270), (0.618, 0.200), (0.618, 0.132)], 0.6, 1.4),
    ([(0.860, 0.260), (0.856, 0.180), (0.850, 0.104)], 0.6, 1.4),
    ([(0.712, 0.300), (0.730, 0.200), (0.746, 0.104)], 0.6, 1.6),
    ([(0.240, 0.330), (0.180, 0.310), (0.125, 0.292)], 0.6, 1.4),
    ([(0.720, 0.920), (0.700, 0.880), (0.680, 0.836)], 0.6, 1.2),
    ([(0.620, 0.520), (0.600, 0.560), (0.588, 0.600)], 0.5, 1.2),
    ([(0.200, 0.600), (0.170, 0.560), (0.150, 0.520), (0.140, 0.472)], 0.5, 1.3),
]

LAKES = [
    # (x, y, rx, ry, rot) — le lac d'Aulne est le premier
    (0.668, 0.824, 30, 13, -0.4),
    (0.560, 0.255, 6, 3.5, 0.3),
    (0.420, 0.220, 5, 3, -0.2),
    (0.790, 0.210, 6, 3, 0.4),
    (0.900, 0.860, 5, 3, 0.2),
    (0.300, 0.420, 4, 2.6, 0.1),
]

GRISENOUE_MARSH = (0.480, 0.330, 72, 40)

# ---------------------------------------------------------------- frontières et routes

FRONTIER = [
    (0.915, 0.050), (0.928, 0.140), (0.914, 0.240), (0.934, 0.340), (0.918, 0.440),
    (0.926, 0.540), (0.908, 0.640), (0.886, 0.716), (0.906, 0.790), (0.936, 0.858),
    (0.952, 0.930), (0.972, 1.020),
]
# Limite (culturelle) de la province d'Ostrie, de la côte ouest à la frontière.
OSTRIE_LIMIT = [
    (0.094, 0.330), (0.180, 0.345), (0.270, 0.318), (0.360, 0.312), (0.430, 0.300),
    (0.530, 0.302), (0.620, 0.318), (0.720, 0.312), (0.820, 0.322), (0.922, 0.330),
]

ROADS_MAJOR = [
    [(0.136, 0.455), (0.200, 0.452), (0.270, 0.470), (0.340, 0.497), (0.420, 0.520), (0.500, 0.548)],
    [(0.500, 0.548), (0.560, 0.565), (0.640, 0.595), (0.700, 0.635), (0.742, 0.690), (0.776, 0.745), (0.800, 0.785)],
    [(0.800, 0.785), (0.836, 0.770), (0.866, 0.740), (0.886, 0.716), (0.912, 0.672), (0.940, 0.636), (0.958, 0.615)],
    [(0.500, 0.548), (0.492, 0.450), (0.480, 0.340), (0.520, 0.250), (0.600, 0.180), (0.680, 0.140), (0.744, 0.112)],
    [(0.500, 0.548), (0.530, 0.600), (0.556, 0.638), (0.590, 0.672), (0.622, 0.700)],
]
ROADS_MINOR = [
    [(0.480, 0.340), (0.400, 0.290), (0.330, 0.235), (0.262, 0.172), (0.210, 0.120), (0.168, 0.088)],
    [(0.136, 0.455), (0.160, 0.540), (0.180, 0.620), (0.205, 0.700), (0.222, 0.758)],
    [(0.222, 0.758), (0.270, 0.690), (0.300, 0.600), (0.340, 0.497)],
    [(0.622, 0.700), (0.648, 0.760), (0.668, 0.822)],
    [(0.622, 0.700), (0.680, 0.740), (0.740, 0.770), (0.800, 0.785)],
    [(0.340, 0.497), (0.400, 0.420), (0.480, 0.340)],
    [(0.744, 0.112), (0.800, 0.130), (0.868, 0.118)],
    [(0.330, 0.235), (0.360, 0.262)],
    [(0.330, 0.235), (0.392, 0.160)],
]
# Lignes maritimes (pointillés) : Compagnie des Paquebots de l'Orvelle, vedette de Kessaar.
SEA_ROUTES = [
    [(0.080, 0.478), (0.040, 0.470), (0.004, 0.452)],
    [(0.080, 0.478), (0.060, 0.380), (0.070, 0.200), (0.110, 0.060), (0.200, 0.030), (0.330, 0.050), (0.430, 0.052)],
    [(0.330, 0.050), (0.520, 0.020), (0.700, 0.032), (0.760, 0.025)],
]

# ---------------------------------------------------------------- zones réservées (unités)

CARTOUCHE = (24, 826, 384, 980)
ROSE = (86, 262, 46)               # cx, cy, r : dans le golfe d'Ambre
SCALE = (430, 924, 680, 982)


def place_xy(pid):
    return P(*PLACES[pid]['pos'])


# ---------------------------------------------------------------- champ terre / mer

GRID = 3.0
PAD = 30.0


def _width_at(table, s):
    for (s0, w0), (s1, w1) in zip(table, table[1:]):
        if s0 <= s <= s1:
            t = (s - s0) / (s1 - s0 or 1)
            return w0 + (w1 - w0) * t
    return table[-1][1]


@lru_cache(maxsize=None)
def orvelle_line():
    return tuple(wiggle(catmull(PP(ORVELLE), 5), 4.0, 'orvelle', step=4, freq=0.03))


@lru_cache(maxsize=None)
def clairette_line():
    return tuple(wiggle(catmull(PP(CLAIRETTE), 5), 2.4, 'clairette', step=4, freq=0.04))


class Field:
    """f(x, y) < 0 : terre ; > 0 : mer. Échantillonné sur une grille de GRID unités."""

    def __init__(self):
        land = PP(LAND)
        nz = Noise('coast')
        nz2 = Noise('coast-fine')
        nz3 = Noise('fjord-ridges')
        fjords = []
        for i, (p, w0, w1) in enumerate(FJORDS):
            pts = wiggle(catmull(PP(p), 6), 4.5, f'fj{i}', step=3, freq=0.06)
            xs, ys = [q[0] for q in pts], [q[1] for q in pts]
            fjords.append((pts, w0, w1, (min(xs) - 16, min(ys) - 16, max(xs) + 16, max(ys) + 16)))
        islands = [(P(x, y), rx, ry) for x, y, rx, ry in ISLANDS]
        orv = list(orvelle_line())
        estuary = [p for p in orv if p[0] < 0.20 * W]
        self.nx = int((W + 2 * PAD) / GRID) + 1
        self.ny = int((H + 2 * PAD) / GRID) + 1
        self.v = []
        for j in range(self.ny):
            y = j * GRID - PAD
            row = []
            for i in range(self.nx):
                x = i * GRID - PAD
                sd = signed_dist_poly(x, y, land)
                if sd > 70 and not any(math.hypot(x - c[0], y - c[1]) < 60 for c, _, _ in islands):
                    row.append(sd)
                    continue
                north = max(0.0, min(1.0, (0.36 * H - y) / (0.2 * H)))
                amp = 22 + 12 * north
                n = (nz.fbm(x / 120, y / 120, 3) * amp * 1.5 + nz.fbm(x / 40 + 50, y / 40, 3) * amp * 0.7
                     + nz2.fbm(x / 11, y / 11, 3) * (3 + 5 * north))
                v = sd + n
                if north > 0 and sd > -45:
                    # doigts de fjords : crêtes de bruit étirées nord-sud, par grappes
                    rn = nz3.fbm(x / 15, y / 70, 2)
                    ridge = max(0.0, 1 - abs(rn) * 9)
                    cluster = max(0.0, min(1.0, nz3.fbm(x / 160 + 30, y / 160, 2) * 2.2 + 0.45))
                    v += ridge * 32 * north * cluster * (1 - max(0.0, -sd) / 45)
                for pts, w0, w1, bb in fjords:
                    if not (bb[0] < x < bb[2] and bb[1] < y < bb[3]):
                        continue
                    d, s = dist_polyline(x, y, pts)
                    if d < 16:
                        v = max(v, (w0 + (w1 - w0) * s) - d)
                if x < 0.21 * W and 0.40 * H < y < 0.54 * H:
                    d, s = dist_polyline(x, y, estuary)
                    if d < 44:
                        w = 3.5 + 34 * max(0.0, (0.175 * W - x) / (0.095 * W)) ** 1.6
                        v = max(v, w - d)
                for (cx, cy), rx, ry in islands:
                    e = math.hypot((x - cx) / rx, (y - cy) / ry)
                    di = (e - 1) * min(rx, ry)
                    if di < 45:
                        v = min(v, di + nz2.fbm(x / 6, y / 6, 2) * 2.5 * min(1.0, rx / 8))
                row.append(v)
            self.v.append(row)
        # bordure de la grille en « mer » : tous les contours se referment hors du cadre
        for j in range(self.ny):
            for i in (0, self.nx - 1):
                self.v[j][i] = max(self.v[j][i], 40.0)
        for i in range(self.nx):
            for j in (0, self.ny - 1):
                self.v[j][i] = max(self.v[j][i], 40.0)

    def at(self, x, y):
        gx = (x + PAD) / GRID
        gy = (y + PAD) / GRID
        i = max(0, min(self.nx - 2, int(gx)))
        j = max(0, min(self.ny - 2, int(gy)))
        fx, fy = gx - i, gy - j
        a = self.v[j][i] * (1 - fx) + self.v[j][i + 1] * fx
        b = self.v[j + 1][i] * (1 - fx) + self.v[j + 1][i + 1] * fx
        return a * (1 - fy) + b * fy

    def is_land(self, x, y, margin=0.0):
        return self.at(x, y) < -margin

    def contours(self, level):
        """Marching squares : polylignes fermées au niveau `level`."""
        v = self.v
        segs = {}

        def key(i, j, o):
            return (i, j, o)

        def interp(i, j, o):
            if o == 0:  # arête horizontale (i,j)-(i+1,j)
                a, b = v[j][i], v[j][i + 1]
                t = (level - a) / (b - a)
                return ((i + t) * GRID - PAD, j * GRID - PAD)
            a, b = v[j][i], v[j + 1][i]
            t = (level - a) / (b - a)
            return (i * GRID - PAD, (j + t) * GRID - PAD)

        links = {}
        for j in range(self.ny - 1):
            for i in range(self.nx - 1):
                a = v[j][i] < level
                b = v[j][i + 1] < level
                c = v[j + 1][i + 1] < level
                d = v[j + 1][i] < level
                code = a * 8 + b * 4 + c * 2 + d
                if code in (0, 15):
                    continue
                top, right, bottom, left = key(i, j, 0), key(i + 1, j, 1), key(i, j + 1, 0), key(i, j, 1)
                center = (v[j][i] + v[j][i + 1] + v[j + 1][i] + v[j + 1][i + 1]) / 4 < level
                table = {
                    1: [(left, bottom)], 2: [(bottom, right)], 3: [(left, right)], 4: [(right, top)],
                    5: [(left, top), (right, bottom)] if not center else [(left, bottom), (right, top)],
                    6: [(bottom, top)], 7: [(left, top)], 8: [(top, left)], 9: [(top, bottom)],
                    10: [(top, right), (bottom, left)] if not center else [(top, left), (bottom, right)],
                    11: [(top, right)], 12: [(right, left)], 13: [(right, bottom)], 14: [(bottom, left)],
                }
                for p, q in table[code]:
                    links.setdefault(p, []).append(q)
                    links.setdefault(q, []).append(p)
        seen = set()
        loops = []
        for start in list(links):
            if start in seen:
                continue
            loop = [start]
            seen.add(start)
            prev, cur = None, start
            while True:
                nxt = [n for n in links[cur] if n != prev and n not in seen]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
                seen.add(cur)
                loop.append(cur)
            pts = [interp(*k) for k in loop]
            if len(pts) > 3:
                loops.append(pts)
        return loops


@lru_cache(maxsize=None)
def field():
    return Field()


@lru_cache(maxsize=None)
def coast_loops(level=0.0, min_area=20.0, smooth_tol=0.35):
    out = []
    for loop in field().contours(level):
        sm = chaikin(loop, 1, closed=True)
        sm = simplify(sm + [sm[0]], smooth_tol)[:-1]
        if abs(area(sm)) >= min_area and len(sm) > 3:
            out.append(tuple(sm))
    return tuple(out)


# ---------------------------------------------------------------- fleuves (polygones)

def river_widths(pts, table):
    total = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)) or 1
    acc, ws = 0.0, []
    for i, p in enumerate(pts):
        if i:
            acc += math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])
        ws.append(_width_at(table, acc / total))
    return ws


@lru_cache(maxsize=None)
def streams():
    out = []
    for k, (pts, w0, w1) in enumerate(STREAMS):
        line = wiggle(catmull(PP(pts), 6), 2.2, f'stream{k}', step=4, freq=0.05)
        out.append((tuple(line), w0, w1))
    return tuple(out)


@lru_cache(maxsize=None)
def roads():
    major = [tuple(wiggle(catmull(PP(r), 6), 2.5, f'rM{i}', step=5, freq=0.03)) for i, r in enumerate(ROADS_MAJOR)]
    minor = [tuple(wiggle(catmull(PP(r), 6), 2.5, f'rm{i}', step=5, freq=0.035)) for i, r in enumerate(ROADS_MINOR)]
    return tuple(major), tuple(minor)


@lru_cache(maxsize=None)
def frontier():
    return tuple(wiggle(catmull(PP(FRONTIER), 6), 3.0, 'frontier', step=4, freq=0.05))


@lru_cache(maxsize=None)
def ostrie_limit():
    return tuple(wiggle(catmull(PP(OSTRIE_LIMIT), 6), 3.0, 'ostrie', step=5, freq=0.04))


@lru_cache(maxsize=None)
def lakes():
    out = []
    for k, (x, y, rx, ry, rot) in enumerate(LAKES):
        cx, cy = P(x, y)
        out.append(tuple(blob(cx, cy, rx, ry, f'lake{k}', wob=0.22, n=22, rot=rot)))
    return tuple(out)


# ---------------------------------------------------------------- masque commun

@lru_cache(maxsize=None)
def base_mask():
    """Ce qui ne doit pas recevoir de relief ni d'arbres : routes, eaux, ornements, lieux."""
    m = Mask(3.0)
    major, minor = roads()
    for r in major:
        m.polyline(r, 4.5)
    for r in minor:
        m.polyline(r, 3.0)
    m.polyline(list(orvelle_line()), 7)
    m.polyline(list(clairette_line()), 5)
    for line, _, _ in streams():
        m.polyline(list(line), 3.5)
    for lk in lakes():
        xs = [p[0] for p in lk]
        ys = [p[1] for p in lk]
        m.circle(sum(xs) / len(xs), sum(ys) / len(ys), (max(xs) - min(xs)) / 2 + 4)
    m.rect(*CARTOUCHE)
    m.circle(ROSE[0], ROSE[1], ROSE[2] + 6)
    m.rect(*SCALE)
    return m


# ---------------------------------------------------------------- vignettes et toponymes des lieux

# Rayon dégagé autour de l'ancre (pas de relief ni d'arbres dessous).
PLACE_CLEAR = {
    'aubrelieu': 40, 'moulinvert': 26, 'foret-de-sorbe': 14, 'lac-d-aulne': 0, 'saint-ormel': 26,
    'port-senane': 30, 'bains-de-merande': 26, 'hautcorvin': 24, 'col-de-corvenne': 16,
    'monts-corvins': 20, 'brenzac': 24, 'grisenoue': 22, 'landes-d-ostrie': 14, 'tennok': 18,
    'vellaak': 20, 'kessaar': 0, 'mer-grise': 0, 'golfe-d-ambre': 0, 'orvelle': 14,
}

# Échelle de chaque vignette (le toponyme n'est pas mis à l'échelle).
VSCALE = {pid: 1.3 for pid in (
    'moulinvert', 'foret-de-sorbe', 'lac-d-aulne', 'saint-ormel', 'port-senane', 'bains-de-merande',
    'hautcorvin', 'col-de-corvenne', 'brenzac', 'grisenoue', 'landes-d-ostrie', 'tennok', 'vellaak',
    'kessaar', 'golfe-d-ambre', 'mer-grise', 'orvelle', 'monts-corvins')}
VSCALE['aubrelieu'] = 1.4
VSCALE['lac-d-aulne'] = 1.0
VSCALE['monts-corvins'] = 1.6

# Toponyme de chaque lieu : (dx, dy, ancre, classe, taille, rotation, lignes).
PLACE_LABELS = {
    'aubrelieu': (0, 60, 'middle', 'label-major', 24, 0, ['Aubrelieu']),
    'moulinvert': (38, 6, 'start', 'label', 15, 0, ['Moulinvert']),
    'foret-de-sorbe': (-30, 2, 'end', 'label', 12, 0, ['Moulin', 'de la Sorbe']),
    'lac-d-aulne': (0, 30, 'middle', 'label', 13, 0, ['Lac d’Aulne']),
    'saint-ormel': (0, -38, 'middle', 'label', 16, 0, ['Saint-Ormel']),
    'port-senane': (8, -40, 'middle', 'label', 16, 0, ['Port-Sénane']),
    'bains-de-merande': (0, 42, 'middle', 'label', 15, 0, ['Bains-de-Mérande']),
    'hautcorvin': (-34, -18, 'end', 'label', 15, 0, ['Hautcorvin']),
    'col-de-corvenne': (-6, -32, 'middle', 'label', 12, 0, ['Col de Corvenne']),
    'monts-corvins': (0, 52, 'middle', 'label-region', 21, -8, ['Monts Corvins']),
    'brenzac': (0, 40, 'middle', 'label', 14, 0, ['Brenzac']),
    'grisenoue': (0, 40, 'middle', 'label', 15, 0, ['Grisenoue']),
    'landes-d-ostrie': (0, 36, 'middle', 'label-region', 17, -3, ['Landes d’Ostrie']),
    'tennok': (30, 2, 'start', 'label', 13, 0, ['Cap et phare', 'de Tennok']),
    'vellaak': (22, 30, 'start', 'label', 14, 0, ['Vellaak']),
    'kessaar': (-40, 5, 'end', 'label', 13, 0, ['Île de Kessaar']),
    'mer-grise': (0, 10, 'middle', 'label-region', 26, 0, ['Mer Grise']),
    'golfe-d-ambre': (-42, 40, 'middle', 'label-region', 19, -90, ['Golfe d’Ambre']),
    'orvelle': (0, -12, 'middle', 'label-water', 15, 19, ['l’Orvelle']),
}


def label_box(pid, pad=3.0):
    """Boîte approximative (x0, y0, x1, y1) du toponyme d'un lieu, en unités."""
    dx, dy, anchor, cls, size, rot, lines = PLACE_LABELS[pid]
    x, y = place_xy(pid)
    track = {'label': 0.16, 'label-major': 0.22, 'label-region': 0.5, 'label-water': 0.04, 'label-note': 0}[cls]
    caps = cls in ('label', 'label-major', 'label-region')
    wmax = max(len(s) * size * ((0.74 if caps else 0.5) + track) for s in lines)
    h = size * 1.15 * len(lines)
    if rot in (-90, 90):
        wmax, h = h, wmax
        x0 = x + dx - wmax / 2
        return (x0 - pad, y + dy - h / 2 - pad, x0 + wmax + pad, y + dy + h / 2 + pad)
    x0 = x + dx - (wmax / 2 if anchor == 'middle' else (wmax if anchor == 'end' else 0))
    y0 = y + dy - size
    return (x0 - pad, y0 - pad, x0 + wmax + pad, y0 + h + pad)


@lru_cache(maxsize=None)
def full_mask():
    """Masque commun + lieux (vignettes et toponymes) : pour le relief et la végétation."""
    m = base_mask()
    m2 = Mask(m.c)
    m2.g[:] = m.g
    for pid, rad in PLACE_CLEAR.items():
        if rad:
            m2.circle(*place_xy(pid), rad * VSCALE.get(pid, 1.0))
        if PLACES[pid]['kind'] not in ('sea', 'region', 'mountain', 'river'):
            m2.rect(*label_box(pid))
    return m2


def _snap_orvelle():
    """L'ancre du lieu « orvelle » est posée sur le fil de l'eau (cours moyen)."""
    tx = 0.418 * W
    p = min(orvelle_line(), key=lambda q: abs(q[0] - tx))
    PLACES['orvelle']['pos'] = (round(p[0] / W, 3), round(p[1] / H, 3))


_snap_orvelle()
