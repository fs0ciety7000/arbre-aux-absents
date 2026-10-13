"""Utilitaires communs aux générateurs de la carte de la Velmarche (Python 3, sans dépendance).

Repère : viewBox `0 0 W H` avec W = 1000 · ASPECT, H = 1000 ; positions normalisées
(x, y) dans [0, 1], origine en haut à gauche (ARCHITECTURE §3.1, NormPoint).
Toutes les couleurs passent par les classes d'art (packages/ui/src/art-classes.ts).
"""
import math
import random

ASPECT = 1.35
W = 1000 * ASPECT
H = 1000.0

# Graines fixes : un même script produit toujours le même octet.
SEED = 1974


def rng(salt):
    """Générateur pseudo-aléatoire déterministe propre à un usage (salt : chaîne)."""
    h = 0
    for ch in f'{SEED}:{salt}':
        h = (h * 131 + ord(ch)) % 2_147_483_647
    return random.Random(h)


def P(nx, ny):
    """Normalisé → unités de viewBox."""
    return (nx * W, ny * H)


def PP(pts):
    return [P(x, y) for x, y in pts]


# ---------------------------------------------------------------- formatage

def f(v):
    """Nombre court (1 décimale)."""
    s = f'{v:.1f}'
    if s.endswith('.0'):
        s = s[:-2]
    if s.startswith('0.'):
        s = s[1:]
    elif s.startswith('-0.'):
        s = '-' + s[2:]
    return '0' if s in ('-0', '', '-') else s


def f2(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    if s.startswith('0.'):
        s = s[1:]
    elif s.startswith('-0.'):
        s = '-' + s[2:]
    return '0' if s in ('-0', '', '-') else s


def _join(nums):
    """Concatène des nombres SVG en omettant les espaces superflus."""
    out = ''
    prev = ''
    for n in nums:
        if prev and not (n.startswith('-') or (n.startswith('.') and '.' in prev)):
            out += ' '
        out += n
        prev = n
    return out


def d_poly(pts, closed=False):
    """Chemin compact : M absolu puis l relatifs calculés sur coordonnées arrondies."""
    if not pts:
        return ''
    r = [(round(x, 1), round(y, 1)) for x, y in pts]
    s = f'M{f(r[0][0])} {f(r[0][1])}'
    if len(r) > 1:
        nums = []
        px, py = r[0]
        for x, y in r[1:]:
            dx, dy = round(x - px, 1), round(y - py, 1)
            if dx == 0 and dy == 0:
                continue
            nums += [f(dx), f(dy)]
            px, py = x, y
        if nums:
            s += 'l' + _join(nums)
    if closed:
        s += 'z'
    return s


def d_seg(x1, y1, x2, y2):
    return f'M{f(x1)} {f(y1)}l{_join([f(x2 - x1), f(y2 - y1)])}'


def d_circle(x, y, r):
    return f'M{f(x - r)} {f(y)}a{f(r)} {f(r)} 0 1 0 {f(2 * r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2 * r)} 0z'


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def attrs(cls=None, **kw):
    a = f' class="{cls}"' if cls else ''
    for k, v in kw.items():
        if v is None:
            continue
        a += f' {k.rstrip("_").replace("_", "-")}="{v}"'
    return a


def path(cls, d, **kw):
    if not d:
        return ''
    return f'<path{attrs(cls, **kw)} d="{d}"/>'


def text(cls, x, y, s, size=None, anchor='middle', rot=0, italic=False, **kw):
    a = f'<text{attrs(cls)} x="{f(x)}" y="{f(y)}"'
    if anchor != 'start':
        a += f' text-anchor="{anchor}"'
    if size:
        a += f' font-size="{f(size)}"'
    if italic:
        a += ' font-style="italic"'
    if rot:
        a += f' transform="rotate({f(rot)} {f(x)} {f(y)})"'
    for k, v in kw.items():
        a += f' {k.rstrip("_").replace("_", "-")}="{v}"'
    return a + f'>{esc(s)}</text>'


def svg_open(layer, title):
    vb = f'0 0 {f2(W)} {f2(H)}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" id="{layer}-root">'
            f'<title id="{layer}-title">{esc(title)}</title>')


# ---------------------------------------------------------------- bruit

class Noise:
    """Bruit de valeur 2D lissé, à graine fixe, avec somme fractale (fbm)."""

    def __init__(self, salt):
        r = rng('noise:' + salt)
        self.perm = list(range(256))
        r.shuffle(self.perm)
        self.perm += self.perm
        self.val = [r.uniform(-1, 1) for _ in range(256)]

    def _v(self, i, j):
        return self.val[self.perm[(self.perm[i & 255] + j) & 255]]

    def at(self, x, y):
        i, j = math.floor(x), math.floor(y)
        fx, fy = x - i, y - j
        u = fx * fx * (3 - 2 * fx)
        v = fy * fy * (3 - 2 * fy)
        a = self._v(i, j) + (self._v(i + 1, j) - self._v(i, j)) * u
        b = self._v(i, j + 1) + (self._v(i + 1, j + 1) - self._v(i, j + 1)) * u
        return a + (b - a) * v

    def fbm(self, x, y, octaves=4, lac=2.0, gain=0.5):
        s, amp, fr, norm = 0.0, 1.0, 1.0, 0.0
        for k in range(octaves):
            s += amp * self.at(x * fr + 17.3 * k, y * fr - 9.1 * k)
            norm += amp
            amp *= gain
            fr *= lac
        return s / norm


# ---------------------------------------------------------------- géométrie

def dist_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
    qx, qy = ax + t * dx, ay + t * dy
    return math.hypot(px - qx, py - qy), t


def dist_polyline(px, py, pts):
    """Distance et abscisse curviligne normalisée (0..1) du point le plus proche."""
    best, best_s = 1e18, 0.0
    total = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)) or 1
    acc = 0.0
    for i in range(len(pts) - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        seg = math.hypot(bx - ax, by - ay)
        d, t = dist_seg(px, py, ax, ay, bx, by)
        if d < best:
            best, best_s = d, (acc + t * seg) / total
        acc += seg
    return best, best_s


def point_in_poly(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def signed_dist_poly(x, y, poly):
    d = min(dist_seg(x, y, *poly[i], *poly[(i + 1) % len(poly)])[0] for i in range(len(poly)))
    return -d if point_in_poly(x, y, poly) else d


def area(poly):
    a = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        a += x1 * y2 - x2 * y1
    return a / 2


def length(pts):
    return sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))


def chaikin(pts, it=2, closed=False):
    for _ in range(it):
        out = []
        n = len(pts)
        rng_ = range(n) if closed else range(n - 1)
        if not closed:
            out.append(pts[0])
        for i in rng_:
            (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
            out.append((0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2))
            out.append((0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2))
        if not closed:
            out.append(pts[-1])
        pts = out
    return pts


def simplify(pts, tol):
    """Douglas-Peucker itératif."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        dmax, idx = 0.0, -1
        for i in range(a + 1, b):
            d, _ = dist_seg(*pts[i], *pts[a], *pts[b])
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol and idx > 0:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def catmull(pts, n=6):
    """Spline de Catmull-Rom passant par les points de contrôle."""
    if len(pts) < 3:
        return pts
    ext = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(pts[-1])
    return out


def resample(pts, step):
    """Points régulièrement espacés le long d'une polyligne."""
    out = [pts[0]]
    carry = 0.0
    for i in range(len(pts) - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        seg = math.hypot(bx - ax, by - ay)
        if seg == 0:
            continue
        d = step - carry
        while d <= seg:
            t = d / seg
            out.append((ax + (bx - ax) * t, ay + (by - ay) * t))
            d += step
        carry = seg - (d - step)
    if math.hypot(out[-1][0] - pts[-1][0], out[-1][1] - pts[-1][1]) > step * 0.3:
        out.append(pts[-1])
    return out


def wiggle(pts, amp, salt, step=6, freq=0.02):
    """Rééchantillonne puis décale perpendiculairement par du bruit (tracé à la main)."""
    nz = Noise('wiggle:' + salt)
    r = resample(pts, step)
    out = []
    for i, (x, y) in enumerate(r):
        a = r[max(0, i - 1)]
        b = r[min(len(r) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, ty) or 1
        nx, ny = -ty / n, tx / n
        k = 1.0 if 0 < i < len(r) - 1 else 0.0
        o = nz.fbm(i * step * freq, 3.7, 3) * amp * k
        out.append((x + nx * o, y + ny * o))
    return out


def normals(pts):
    out = []
    for i in range(len(pts)):
        a = pts[max(0, i - 1)]
        b = pts[min(len(pts) - 1, i + 1)]
        tx, ty = b[0] - a[0], b[1] - a[1]
        n = math.hypot(tx, ty) or 1
        out.append((-ty / n, tx / n))
    return out


def offset(pts, d):
    return [(x + nx * d, y + ny * d) for (x, y), (nx, ny) in zip(pts, normals(pts))]


def ribbon(pts, widths):
    """Polygone d'un ruban à largeur variable (rivière, liseré)."""
    ns = normals(pts)
    left = [(x + nx * w / 2, y + ny * w / 2) for (x, y), (nx, ny), w in zip(pts, ns, widths)]
    right = [(x - nx * w / 2, y - ny * w / 2) for (x, y), (nx, ny), w in zip(pts, ns, widths)]
    return left + right[::-1]


def blob(cx, cy, rx, ry, salt, wob=0.18, n=28, rot=0.0):
    """Forme ronde irrégulière (lavis, lac, île)."""
    nz = Noise('blob:' + salt)
    ca, sa = math.cos(rot), math.sin(rot)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        k = 1 + wob * nz.fbm(math.cos(t) * 1.3 + 5, math.sin(t) * 1.3 + 5, 3) * 1.6
        x, y = rx * k * math.cos(t), ry * k * math.sin(t)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return chaikin(pts, 2, closed=True)


# ---------------------------------------------------------------- masque d'occupation

class Mask:
    """Grille d'occupation (cellule de `cell` unités) pour éviter les chevauchements."""

    def __init__(self, cell=3.0):
        self.c = cell
        self.nx = int(W / cell) + 2
        self.ny = int(H / cell) + 2
        self.g = bytearray(self.nx * self.ny)

    def _set(self, i, j):
        if 0 <= i < self.nx and 0 <= j < self.ny:
            self.g[j * self.nx + i] = 1

    def circle(self, x, y, r):
        c = self.c
        for j in range(int((y - r) / c), int((y + r) / c) + 1):
            for i in range(int((x - r) / c), int((x + r) / c) + 1):
                if math.hypot(i * c + c / 2 - x, j * c + c / 2 - y) <= r + c * 0.71:
                    self._set(i, j)

    def rect(self, x0, y0, x1, y1):
        c = self.c
        for j in range(int(y0 / c), int(y1 / c) + 1):
            for i in range(int(x0 / c), int(x1 / c) + 1):
                self._set(i, j)

    def polyline(self, pts, r):
        for p in resample(pts, max(1.0, self.c * 0.8)):
            self.circle(p[0], p[1], r)

    def hit(self, x, y, r=0.0):
        c = self.c
        for j in range(int((y - r) / c), int((y + r) / c) + 1):
            for i in range(int((x - r) / c), int((x + r) / c) + 1):
                if 0 <= i < self.nx and 0 <= j < self.ny and self.g[j * self.nx + i]:
                    if r == 0 or math.hypot(i * c + c / 2 - x, j * c + c / 2 - y) <= r + c * 0.71:
                        return True
        return False
