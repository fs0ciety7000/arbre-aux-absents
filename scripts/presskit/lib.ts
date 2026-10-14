/**
 * Outils communs du kit presse (scripts/presskit/build.ts) : chemins, navigateur (Playwright,
 * Chromium), gabarit HTML qui charge le vrai design system (`@arbre/ui/styles/index.css` : tokens,
 * polices auto-hébergées, matières, art.css), lecture de l'art SVG du jeu et titre du jeu.
 *
 * Rien n'est redessiné : l'art vient de `art/` et `content/`, les couleurs et les polices des
 * tokens. Les PDF sortent de Chromium (vectoriels, polices incorporées) ; les SVG de logos sont
 * tirés de ces PDF par `pdftocairo -svg` (poppler-utils) : le texte y devient des tracés.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, type Browser, type Page } from '@playwright/test';
import { ORNAMENTS } from '../../packages/ui/src/primitives/ornaments';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/** Kit publié par le site (`/presse/kit/`). */
export const OUT = join(REPO, 'apps/site/static/presse/kit');
/** Pages HTML intermédiaires (jamais publiées). */
export const WORK = join(REPO, 'node_modules/.cache/presskit');

const STYLES = pathToFileURL(join(REPO, 'packages/ui/src/styles/index.css')).href;

export const read = (rel: string): string => readFileSync(join(REPO, rel), 'utf8');

/** Motifs de gravure partagés (`<ArtDefs />`), à poser une fois par document. */
const ART_DEFS = (() => {
  const src = read('packages/ui/src/primitives/ArtDefs.svelte');
  const svg = /<svg[\s\S]*?<\/svg>/.exec(src)?.[0];
  if (!svg) throw new Error('presskit : motifs introuvables dans ArtDefs.svelte');
  return svg;
})();

/** CSS commune des gabarits du kit : seulement des tokens et des unités relatives. */
const BASE_CSS = `
html { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: transparent; }
html, body { margin: 0; padding: 0; min-height: 0; }
body { background: none; }
.art.defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.art-fill { display: block; width: 100%; height: 100%; }

/* Titre du jeu (primitive Wordmark, DESIGN §4.3), tout en em : une seule taille à régler. */
.wm { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 0.09em;
  color: var(--text); font-size: var(--wm-size, 8rem); }
.wm.center { align-items: center; text-align: center; }
.wm .name { margin: 0; font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); line-height: var(--leading-display);
  letter-spacing: var(--tracking-display); font-size: 1em; white-space: nowrap; }
.wm.stacked .w { display: block; }
.wm .aux { font-style: italic; font-weight: var(--weight-display); color: var(--brand);
  padding-inline: 0.04em 0.1em; }
.wm .flourish { width: 2.75em; color: var(--fern); margin-block-start: -0.0625em; }
.wm .flourish svg { display: block; width: 100%; height: auto; overflow: visible; }
.wm.mono { --text: var(--mono); --brand: var(--mono); --fern: var(--mono); }

/* Logos de la maison en monochrome : teintes --logo-t1/t2/t3 (DESIGN §11). */
.house { display: flex; align-items: center; gap: 1.4em; }
.house svg { display: block; height: 100%; width: auto; }
.house .logo { height: 2.4em; --logo-t1: currentColor; --logo-t2: currentColor; --logo-t3: currentColor; }
`;

export interface Doc {
  /** Contenu du `<body>`. */
  body: string;
  /** CSS propre au document (tokens seulement). */
  css?: string;
  /** Attributs du `<html>` (ex. data-surface). */
  htmlAttrs?: string;
  title?: string;
}

/** Document HTML complet, branché sur le design system du jeu. */
export function html({ body, css = '', htmlAttrs = '', title = 'Kit presse' }: Doc): string {
  return `<!doctype html><html lang="fr" ${htmlAttrs}><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="${STYLES}"><style>${BASE_CSS}${css}</style></head>
<body>${ART_DEFS}${body}</body></html>`;
}

let browser: Browser | undefined;

export async function openBrowser(): Promise<Browser> {
  browser ??= await chromium.launch();
  return browser;
}

export async function closeBrowser(): Promise<void> {
  await browser?.close();
  browser = undefined;
}

/** Ouvre un document dans une page (fichier local : les polices se chargent par file://). */
export async function load(
  name: string,
  doc: string,
  viewport: { width: number; height: number },
  scale = 1,
): Promise<Page> {
  const b = await openBrowser();
  const page = await b.newPage({ viewport, deviceScaleFactor: scale });
  // Couleurs d'écran : sans cela, Chromium assombrit le texte clair à l'impression.
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
  mkdirSync(WORK, { recursive: true });
  const file = join(WORK, `${name}.html`);
  writeFileSync(file, doc);
  await page.goto(pathToFileURL(file).href);
  // Chaîne évaluée dans la page (les scripts n'ont pas les types du DOM).
  await page.evaluate('document.fonts.ready.then(() => true)');
  await page.waitForTimeout(100);
  return page;
}

export function ensureDir(file: string): string {
  mkdirSync(dirname(file), { recursive: true });
  return file;
}

/** PDF d'une seule page → SVG (texte en tracés), par poppler. */
export function pdfToSvg(pdf: string, svg: string): void {
  execFileSync('pdftocairo', ['-svg', '-f', '1', '-l', '1', pdf, ensureDir(svg)]);
}

/** Attributs de la racine d'un SVG d'art, remplacés ; `<title>`/`<desc>` retirés. */
export function artSvg(
  rel: string,
  attrs: Record<string, string> = {},
): { markup: string; viewBox: string } {
  const src = read(rel);
  const open = /<svg\b[^>]*>/.exec(src)?.[0];
  if (!open) throw new Error(`presskit : ${rel} n'est pas un SVG`);
  const viewBox = /viewBox="([^"]+)"/.exec(open)?.[1] ?? '0 0 100 100';
  const all: Record<string, string> = {
    xmlns: 'http://www.w3.org/2000/svg',
    class: /class="([^"]+)"/.exec(open)?.[1] ?? 'art',
    viewBox,
    'aria-hidden': 'true',
    ...attrs,
  };
  const head = `<svg ${Object.entries(all)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')}>`;
  const inner = src
    .slice(src.indexOf(open) + open.length)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<desc>[\s\S]*?<\/desc>/, '');
  return { markup: head + inner, viewBox };
}

/** Volute de fougère (ornement `flourish` de <Ornament>), en SVG inline. */
export function flourishSvg(weight = 1.5): string {
  const o = ORNAMENTS.flourish;
  return (
    `<svg viewBox="0 0 ${o.w} ${o.h}" fill="none" stroke="currentColor" stroke-width="${weight}"` +
    ` stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    o.paths.map((d) => `<path d="${d}"/>`).join('') +
    '</svg>'
  );
}

/** Le titre du jeu, comme la primitive Wordmark (empilé : écran titre ; en ligne : en-tête). */
export function wordmark({
  stacked = true,
  center = false,
  flourish = true,
  cls = '',
  id = '',
}: {
  stacked?: boolean;
  center?: boolean;
  flourish?: boolean;
  cls?: string;
  id?: string;
} = {}): string {
  const c = ['wm', stacked ? 'stacked' : 'line', center ? 'center' : '', cls]
    .filter(Boolean)
    .join(' ');
  return (
    `<div class="${c}"${id ? ` id="${id}"` : ''}>` +
    `<p class="name" aria-label="L’Arbre aux absents"><span class="w">L’Arbre</span> ` +
    `<span class="w aux">aux</span> <span class="w">absents</span></p>` +
    (flourish ? `<div class="flourish">${flourishSvg()}</div>` : '') +
    '</div>'
  );
}

const HOUSE_FILES = ['cardor-monogram', 'interactive', 'creative'] as const;

/** Les trois logos de la maison, dans l'ordre imposé (DESIGN §11), monochromes (currentColor). */
export function houseLogos(): string {
  return (
    '<div class="house">' +
    HOUSE_FILES.map((id) => {
      const svg = read(`apps/site/static/brand/${id}.svg`).replace(/\s(role)="[^"]*"/, '');
      return `<span class="logo">${svg.replace('<svg ', '<svg aria-hidden="true" ')}</span>`;
    }).join('') +
    '</div>'
  );
}

/** Taille lisible (« 1,2 Mo », « 340 Ko »), en français. */
export function humanSize(bytes: number): string {
  const fr = (n: number, d: number) => n.toFixed(d).replace('.', ',');
  if (bytes >= 1024 * 1024) return `${fr(bytes / 1024 / 1024, 1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/** Contenu d'un SVG sans sa racine (pour composer plusieurs couches dans un même `<svg>`). */
function innerSvg(rel: string): string {
  const src = read(rel);
  const open = /<svg\b[^>]*>/.exec(src)?.[0] ?? '';
  return src
    .slice(src.indexOf(open) + open.length, src.lastIndexOf('</svg>'))
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, '');
}

const MAP_LAYER_FILES = ['base', 'relief', 'water', 'places', 'labels'];

/** Carte de la Velmarche, couches superposées dans l'ordre de dessin (art/map). */
export function mapSvg(viewBox = '0 0 1350 1000', attrs = ''): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${viewBox}" aria-hidden="true" ${attrs}>` +
    MAP_LAYER_FILES.map((l) => `<g data-map-layer="${l}">${innerSvg(`art/map/${l}.svg`)}</g>`).join(
      '',
    ) +
    '</svg>'
  );
}

const PORTRAIT_IDS = JSON.parse(read('art/tools/portraits/ids.json')) as Record<string, string>;

/** Portrait gravé d'une personne (id de l'affaire → fichier neutre, comme le site). */
export function portraitSvg(person: string): string {
  const file = PORTRAIT_IDS[person] ?? person;
  return artSvg(`content/cases/succession-varenque/portraits/${file}.svg`, {
    class: 'art portrait',
  }).markup;
}

/**
 * Remplace, dans la page, chaque remplissage par motif SVG (`fill: url(#…)`, hachures et
 * pointillés de gravure, papier peint de l'art clé) par les traits du motif eux-mêmes, découpés
 * à la forme. Chromium pixellise sinon chaque motif en une image dans le PDF (20 Mo par affiche) ;
 * ainsi tout reste vectoriel et léger. Le rendu à l'écran est identique.
 */
const VECTORIZE_PATTERNS = String.raw`(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const STYLE = ['stroke', 'stroke-width', 'stroke-linecap', 'stroke-opacity', 'fill', 'fill-opacity', 'opacity'];
  let n = 0;
  const num = (v) => Math.round(v * 100) / 100;
  const els = [...document.querySelectorAll('svg *')].filter((el) => {
    if (el.closest('pattern, defs, clipPath, mask') || !(el instanceof SVGGeometryElement)) return false;
    return /^url\(/.test(getComputedStyle(el).fill);
  });
  for (const el of els) {
    const cs = getComputedStyle(el);
    const id = /url\(["']?#([^"')]+)/.exec(cs.fill)?.[1];
    const pat = id && document.getElementById(id);
    if (!pat || pat.tagName !== 'pattern') continue;
    if ((pat.getAttribute('patternUnits') ?? 'objectBoundingBox') !== 'userSpaceOnUse') continue;
    const w = +pat.getAttribute('width'), h = +pat.getAttribute('height');
    const px = +(pat.getAttribute('x') ?? 0), py = +(pat.getAttribute('y') ?? 0);
    if (!(w > 0 && h > 0)) continue;
    const box = el.getBBox();
    const t = DOMMatrix.fromMatrix(pat.patternTransform.baseVal.consolidate()?.matrix ?? new DOMMatrix());
    const inv = t.inverse();
    const pts = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
      .map(([x, y]) => new DOMPoint(x, y).matrixTransform(inv));
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const i0 = Math.floor((Math.min(...xs) - px) / w) - 1, i1 = Math.ceil((Math.max(...xs) - px) / w) + 1;
    const j0 = Math.floor((Math.min(...ys) - py) / h) - 1, j1 = Math.ceil((Math.max(...ys) - py) / h) + 1;
    if ((i1 - i0) * (j1 - j0) > 40000) continue;
    const g = document.createElementNS(NS, 'g');
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = 'pk-clip-' + n++;
    const shape = el.cloneNode(false);
    shape.removeAttribute('class'); shape.removeAttribute('id'); shape.removeAttribute('transform'); shape.removeAttribute('style');
    shape.setAttribute('clip-rule', cs.fillRule);
    clip.appendChild(shape);
    g.appendChild(clip);
    if (el.getAttribute('transform')) g.setAttribute('transform', el.getAttribute('transform'));
    g.setAttribute('clip-path', 'url(#' + clip.id + ')');
    const op = (+cs.opacity) * (+cs.fillOpacity);
    if (op < 1) g.setAttribute('opacity', String(op));
    const inner = document.createElementNS(NS, 'g');
    inner.setAttribute('transform', t.toString());
    g.appendChild(inner);
    const styled = (src, dst) => { const s = getComputedStyle(src); for (const k of STYLE) dst.style.setProperty(k, s.getPropertyValue(k)); return dst; };
    let tile = null;
    for (const c of pat.children) {
      if (c.tagName === 'line') {
        const x1 = +c.getAttribute('x1'), y1 = +c.getAttribute('y1'), x2 = +c.getAttribute('x2'), y2 = +c.getAttribute('y2');
        let d = '';
        if (x1 === x2 && Math.abs(y2 - y1) >= h) {
          for (let i = i0; i <= i1; i++) d += 'M' + num(px + i * w + x1) + ' ' + num(py + j0 * h) + 'V' + num(py + (j1 + 1) * h);
        } else if (y1 === y2 && Math.abs(x2 - x1) >= w) {
          for (let j = j0; j <= j1; j++) d += 'M' + num(px + i0 * w) + ' ' + num(py + j * h + y1) + 'H' + num(px + (i1 + 1) * w);
        } else {
          for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++)
            d += 'M' + num(px + i * w + x1) + ' ' + num(py + j * h + y1) + 'L' + num(px + i * w + x2) + ' ' + num(py + j * h + y2);
        }
        const p = styled(c, document.createElementNS(NS, 'path'));
        p.setAttribute('d', d); p.style.fill = 'none';
        inner.appendChild(p);
      } else if (c.tagName === 'circle') {
        const cx = +c.getAttribute('cx'), cy = +c.getAttribute('cy'), r = +c.getAttribute('r');
        // Point de pointillé : trait de longueur nulle à bout rond (bien plus léger qu'un cercle).
        let d = '';
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) d += 'M' + num(px + i * w + cx) + ' ' + num(py + j * h + cy) + 'h0';
        const s = getComputedStyle(c);
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.style.fill = 'none';
        p.style.stroke = s.fill;
        p.style.strokeOpacity = s.fillOpacity;
        p.style.opacity = s.opacity;
        p.style.strokeWidth = String(2 * r);
        p.style.strokeLinecap = 'round';
        inner.appendChild(p);
      } else if (c.tagName === 'path') {
        const src = c.getAttribute('d') ?? '';
        const toks = src.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
        const shift = (dx, dy) => {
          let out = '', cmd = '', k = 0;
          const ar = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
          for (const tk of toks) {
            if (/[a-zA-Z]/.test(tk)) { cmd = tk; k = 0; out += tk; continue; }
            let v = +tk;
            const up = cmd === cmd.toUpperCase();
            const U = cmd.toUpperCase();
            if (up) {
              const a = ar[U] || 2;
              const pos = k % a;
              if (U === 'H') v += dx;
              else if (U === 'V') v += dy;
              else if (U === 'A') { if (pos === 5) v += dx; if (pos === 6) v += dy; }
              else v += pos % 2 === 0 ? dx : dy;
            }
            out += (/[0-9.]$/.test(out) ? ' ' : '') + num(v);
            k++;
          }
          return out;
        };
        let d = '';
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) d += shift(px + i * w, py + j * h);
        const p = styled(c, document.createElementNS(NS, 'path'));
        p.setAttribute('d', d);
        inner.appendChild(p);
      } else {
        if (!tile) {
          tile = document.createElementNS(NS, 'g');
          tile.id = 'pk-tile-' + n++;
          const defs = document.createElementNS(NS, 'defs');
          defs.appendChild(tile);
          g.appendChild(defs);
        }
        const copy = (src) => { const k = styled(src, src.cloneNode(false)); k.removeAttribute('class'); for (const ch of src.children) k.appendChild(copy(ch)); return k; };
        tile.appendChild(copy(c));
      }
    }
    if (tile) {
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const u = document.createElementNS(NS, 'use');
        u.setAttribute('href', '#' + tile.id);
        u.setAttribute('x', String(num(px + i * w))); u.setAttribute('y', String(num(py + j * h)));
        inner.appendChild(u);
      }
    }
    el.after(g);
    el.style.fill = 'none';
  }
  return n;
})()`;

/**
 * Retire les grains de bruit (feutre, papier, kraft) : invisibles une fois imprimés, ils
 * multiplient le poids des PNG (bruit incompressible) et des PDF.
 */
export async function noGrain(page: Page): Promise<void> {
  await page.addStyleTag({
    content:
      ':root, [data-surface] { --desk-grain-image: none; --paper-grain-image: none; --kraft-fiber-image: none; }',
  });
}

/**
 * Prépare une page pour `page.pdf` : motifs vectorisés, grains de papier et de feutre retirés
 * (bruit `feTurbulence` que Chromium pixellise élément par élément : plusieurs Mo par page).
 */
export async function prepareForPdf(page: Page): Promise<number> {
  await noGrain(page);
  // Ombres floues : pixellisées une à une par Chromium. Une ombre nette garde le relief.
  await page.addStyleTag({
    content:
      ':root, [data-surface] { --shadow-paper: 0.4mm 0.7mm 0 oklch(0.1 0.03 260 / 0.28); --shadow-1: none; --shadow-2: 0.4mm 0.7mm 0 oklch(0.1 0.03 260 / 0.28); }',
  });
  return (await page.evaluate(VECTORIZE_PATTERNS)) as number;
}

/** Déclarations des blocs `:root { … }` de tokens.css (hors contextes et réglages). */
const TOKENS = (() => {
  const out = new Map<string, string>();
  const clean = read('packages/ui/src/styles/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
    for (const d of m[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      out.set(d[1]!, d[2]!.trim().replace(/\s+/g, ' '));
    }
  }
  return out;
})();

/** Valeur résolue d'un token (suit les `var(--…)`). */
export function tokenValue(name: string, depth = 0): string | null {
  const raw = TOKENS.get(name);
  if (raw === undefined || depth > 8) return null;
  const ref = /^var\((--[\w-]+)\)$/.exec(raw);
  return ref ? tokenValue(ref[1]!, depth + 1) : raw;
}

/** `oklch(L C H)` → `#rrggbb` (Ottosson, sRGB écrêté), comme la page Charte. */
export function oklchToHex(value: string): string | null {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value);
  if (!m) return null;
  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return (
    '#' +
    lin
      .map((c) => {
        const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;
        return Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

/**
 * Détail d'une illustration en JPEG (URL `data:`), pour les agrandissements de l'artbook : un
 * recadrage vectoriel recopierait toute l'image dans le PDF à chaque fois.
 */
let cropCount = 0;

export async function rasterCrop(markup: string, viewBox: string, width: number): Promise<string> {
  const [, , w = 1, h = 1] = viewBox.split(/\s+/).map(Number);
  const height = Math.round((width * h) / w);
  const svg = markup.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
  cropCount += 1;
  const page = await load(
    `crop-${cropCount}`,
    html({
      body: `<div class="crop" style="width:${width}px;height:${height}px">${svg}</div>`,
      css: '.crop > svg { display: block; width: 100%; height: 100%; }',
    }),
    { width, height },
  );
  await noGrain(page);
  const buf = await page.screenshot({
    type: 'jpeg',
    quality: 86,
    clip: { x: 0, y: 0, width, height },
  });
  await page.close();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
