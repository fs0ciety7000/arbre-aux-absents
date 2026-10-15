/**
 * Kit d'annonce pour les réseaux sociaux (lancement + affaire 2, v1.1.0).
 *
 *   node scripts/social/render.mjs              # tout, dans assets/social/
 *   node scripts/social/render.mjs carrousel    # seulement les fichiers dont le nom contient « carrousel »
 *
 * Même procédé que `scripts/youtube/render.mjs` : rien n'est redessiné. L'art clé vient de
 * `art/keyart/`, la carte de `art/map/`, les captures du jeu de `apps/site/static/itch/`
 * (recadrées sur la zone utile, jamais réduites en entier), le logo de
 * `apps/site/static/brand/`, les polices et couleurs du design system
 * (`packages/ui/src/styles/index.css`). Rendu déterministe : Playwright + Chromium,
 * mouvement réduit, aucune donnée variable.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(REPO, 'assets/social');
const WORK = join(REPO, 'node_modules/.cache/social');
const STYLES = pathToFileURL(join(REPO, 'packages/ui/src/styles/index.css')).href;
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');

const ITCH_URL = 'cardorinteractive.itch.io/arbre-aux-absents';
const PLATFORMS = ['Windows', 'macOS', 'Linux', 'Android', 'navigateur'];

// ── Matériaux ────────────────────────────────────────────────────────────────

const ART_DEFS = /<svg[\s\S]*?<\/svg>/.exec(read('packages/ui/src/primitives/ArtDefs.svelte'))[0];

/** SVG d'art avec racine remplacée (title/desc retirés). */
function artSvg(rel, attrs = {}) {
  const src = read(rel);
  const open = /<svg\b[^>]*>/.exec(src)[0];
  const all = {
    xmlns: 'http://www.w3.org/2000/svg',
    class: /class="([^"]+)"/.exec(open)?.[1] ?? 'art',
    viewBox: /viewBox="([^"]+)"/.exec(open)[1],
    'aria-hidden': 'true',
    ...attrs,
  };
  const head = `<svg ${Object.entries(all)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ')}>`;
  return (
    head +
    src
      .slice(src.indexOf(open) + open.length)
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/, '')
      .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/, '')
  );
}

/** Contenu d'un SVG sans sa racine. */
function innerSvg(rel) {
  const src = read(rel);
  const open = /<svg\b[^>]*>/.exec(src)[0];
  return src
    .slice(src.indexOf(open) + open.length, src.lastIndexOf('</svg>'))
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, '');
}

/** Carte de la Velmarche (couches de `art/map/`, ordre de dessin), recadrée par `viewBox`. */
const mapSvg = (viewBox) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
  ['base', 'relief', 'water', 'places', 'labels']
    .map((l) => `<g data-map-layer="${l}">${innerSvg(`art/map/${l}.svg`)}</g>`)
    .join('') +
  '</svg>';

/** Volute de fougère (ornement `flourish`), lue dans `ornaments.ts`. */
const FLOURISH = (() => {
  const src = read('packages/ui/src/primitives/ornaments.ts');
  const block = /flourish:\s*\{\s*w:\s*(\d+),\s*h:\s*(\d+),\s*paths:\s*\[([\s\S]*?)\]/.exec(src);
  const paths = [...block[3].matchAll(/'([^']+)'/g)].map((m) => `<path d="${m[1]}"/>`).join('');
  return `<svg viewBox="0 0 ${block[1]} ${block[2]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
})();

/** Titre du jeu (primitive Wordmark) : « aux » italique vermillon, volute de fougère. */
const wordmark = ({ stacked = true, center = false, flourish = true } = {}) =>
  `<div class="wm ${stacked ? 'stacked' : 'line'} ${center ? 'center' : ''}">` +
  `<p class="name"><span class="w">L’Arbre</span> <span class="w aux">aux</span> <span class="w">absents</span></p>` +
  (flourish ? `<div class="flourish">${FLOURISH}</div>` : '') +
  '</div>';

/** Logo CM Interactive, inchangé (couleurs d'origine sur fond sombre). */
const LOGO = read('apps/site/static/brand/interactive.svg')
  .replace(/\srole="[^"]*"/, '')
  .replace('<svg ', '<svg aria-hidden="true" ');

/** Signature discrète : logo + « CM Interactive ». */
const brand = (cls = '') =>
  `<p class="brand ${cls}"><span class="logo">${LOGO}</span><span class="label">CM Interactive</span></p>`;

/**
 * Capture du jeu recadrée : `crop` en pixels de la capture 1920 × 1080, affichée à la largeur
 * `w` (l'agrandissement vaut w / crop.w ; on zoome sur la zone utile, on ne réduit jamais
 * l'écran entier).
 */
function shot(file, crop, w, cls = '') {
  const src = pathToFileURL(join(REPO, 'apps/site/static/itch', file)).href;
  const s = w / crop.w;
  const h = Math.round(crop.h * s);
  return (
    `<div class="shot ${cls}" style="width:${w}px;height:${h}px">` +
    `<img src="${src}" alt="" style="width:${Math.round(1920 * s)}px;left:${-Math.round(crop.x * s)}px;top:${-Math.round(crop.y * s)}px"></div>`
  );
}

// ── Gabarit ──────────────────────────────────────────────────────────────────

const NIGHT = (a) => `oklch(0.15 0.042 260 / ${a})`;

const BASE_CSS = `
html, body { margin: 0; padding: 0; background: var(--desk); }
body { min-height: 0; overflow: hidden; }
.art.defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.frame { position: relative; overflow: hidden; background: var(--desk); color: var(--text); }
.frame.desk-surface { --lamp-x: 50%; --lamp-y: 8%; }
.fill { position: absolute; inset: 0; }
.fill > svg { display: block; width: 100%; height: 100%; }
p, h1, h2 { margin: 0; }
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
.label { font-family: var(--font-label); font-weight: var(--weight-medium); text-transform: uppercase;
  letter-spacing: var(--tracking-stamp); }
.tape-red { display: inline-block; background: var(--label-tape-red); color: var(--label-tape-text);
  padding: 0.16em 0.6em 0.1em; box-shadow: 0 6px 16px ${NIGHT(0.55)}; }
.tape-blue { display: inline-block; background: var(--label-tape); color: var(--label-tape-text);
  padding: 0.16em 0.6em 0.1em; box-shadow: 0 6px 16px ${NIGHT(0.55)}; }
.hook { font-family: var(--font-display); font-style: italic; font-weight: 400; line-height: 1.25;
  color: var(--text); text-wrap: balance; }
.brand { display: inline-flex; align-items: center; gap: 0.5em; color: var(--text-muted); font-size: 26px; }
.brand .logo { display: block; width: 1.9em; height: 1.55em; }
.brand .logo svg { display: block; width: 100%; height: 100%; }
.shot { position: relative; overflow: hidden; }
.shot img { position: absolute; display: block; max-width: none; image-rendering: auto; }
.print { position: relative; background: var(--paper, oklch(0.978 0.012 92)); padding: 14px;
  border-radius: 3px; box-shadow: 0 30px 60px ${NIGHT(0.7)}, 0 2px 0 ${NIGHT(0.3)}; }
.print .shot { border-radius: 2px; }
.print .mat-tape { position: absolute; width: 150px; height: 40px; }
.free { font-family: var(--font-label); font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.04em; background: var(--accent); color: var(--accent-contrast);
  padding: 0.12em 0.5em 0.06em; display: inline-block; box-shadow: 0 6px 0 var(--accent-edge), 0 14px 30px ${NIGHT(0.6)}; }
.plats { font-family: var(--font-label); font-weight: var(--weight-medium); text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text); }
.plats i { font-style: normal; color: var(--accent); padding-inline: 0.35em; }
.url { font-family: var(--font-ui); font-weight: 600; color: var(--text); letter-spacing: 0.005em; }
.shadowed { filter: drop-shadow(0 6px 18px ${NIGHT(0.9)}); }
`;

const doc = (body, css = '') =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Réseaux sociaux</title>
<link rel="stylesheet" href="${STYLES}"><style>${BASE_CSS}${css}</style></head>
<body>${ART_DEFS}${body}</body></html>`;

const platsLine = () => PLATFORMS.join('<i>·</i>');

// ── 1. Carrousel Instagram (1080 × 1350) ─────────────────────────────────────

/** Diapo 1 : l'art clé en hauteur (4:5, recomposé pour le téléphone), titre et accroche. */
function slideHook() {
  const art = artSvg('art/keyart/keyart-desk-tall.svg', { preserveAspectRatio: 'xMidYMin slice' });
  const css = `
.frame { width: 1080px; height: 1350px; }
.shade { background: linear-gradient(${NIGHT(0)} 46%, ${NIGHT(0.75)} 63%, ${NIGHT(0.96)} 76%, ${NIGHT(1)} 100%); }
.txt { position: absolute; left: 0; right: 0; bottom: 92px; display: flex; flex-direction: column;
  align-items: center; gap: 26px; text-align: center; }
.kick { font-size: 30px; transform: rotate(-1.5deg); }
.txt .wm { --wm-size: 112px; }
.txt .wm .flourish { width: 3.4em; }
.hook { font-size: 46px; max-width: 900px; }
.swipe { position: absolute; right: 44px; top: 44px; font-size: 24px; color: var(--text);
  background: ${NIGHT(0.78)}; padding: 0.3em 0.75em 0.24em; border-radius: 999px; }
`;
  return doc(
    `<main class="frame"><div class="fill">${art}</div><div class="fill shade"></div>
<p class="swipe label">Faites glisser →</p>
<div class="txt"><p class="kick label tape-red">Un jeu d’enquête généalogique</p>
<div class="shadowed">${wordmark({ stacked: false, center: true })}</div>
<p class="hook">Une famille. Des archives.<br>Des absents à retrouver.</p></div></main>`,
    css,
  );
}

/** Diapos 2 à 4 : surtitre, titre, sous-titre, capture recadrée sur un tirage papier. */
function slideFeature({ n, tag, title, sub, media, tilt = -1.2 }) {
  const css = `
.frame { width: 1080px; height: 1350px; }
.cap { position: absolute; left: 72px; right: 72px; top: 76px; display: flex; flex-direction: column;
  align-items: flex-start; gap: 20px; }
.tag { font-size: 28px; transform: rotate(-2deg); }
.title { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); font-size: 74px; line-height: 0.98;
  letter-spacing: var(--tracking-display); text-wrap: balance; }
.sub { font-family: var(--font-ui); font-size: 31px; line-height: 1.38; color: var(--text-muted);
  max-width: 900px; text-wrap: pretty; }
.media { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%) rotate(${tilt}deg); }
.media .mat-tape.a { left: -36px; top: -14px; transform: rotate(-32deg); }
.media .mat-tape.b { right: -36px; top: -14px; transform: rotate(30deg); }
.foot { position: absolute; left: 72px; right: 72px; bottom: 34px; display: flex;
  align-items: center; justify-content: space-between; }
.foot .wm { --wm-size: 34px; }
.count { font-size: 24px; color: var(--text-muted); }
`;
  return doc(
    `<main class="frame desk-surface">
<header class="cap"><p class="tag label tape-red">${tag}</p><h2 class="title">${title}</h2><p class="sub">${sub}</p></header>
<figure class="media print" style="margin:0"><span class="mat-tape a"></span><span class="mat-tape b"></span>${media}</figure>
<footer class="foot">${wordmark({ stacked: false, flourish: false })}<p class="count label">${n} / 5</p></footer></main>`,
    css,
  );
}

const slideTree = () =>
  slideFeature({
    n: 2,
    tag: 'L’arbre',
    title: 'Reconstituer l’arbre, case par case',
    sub: 'Un nom, un visage, un métier : chaque pièce prouvée est tamponnée « Établi ».',
    // Le haut de l'arbre à 100 % : fiches établies (portraits gravés, tampons) et cases « ? ».
    media: shot('jeu-lecteur-lettre-1920.png', { x: 236, y: 244, w: 640, h: 500 }, 920),
    tilt: -1.4,
  });

const slideReader = () =>
  slideFeature({
    n: 3,
    tag: 'Les archives',
    title: 'Lire les archives, croiser les indices',
    sub: 'Lettres, registres, photographies : surlignez, recoupez, déduisez.',
    // Le Lecteur : la lettre manuscrite, ses mots-clés soulignés et son cachet.
    media: shot('jeu-lecteur-lettre-1920.png', { x: 1474, y: 365, w: 396, h: 540 }, 560),
    tilt: 1.6,
  });

const slideMap = () =>
  slideFeature({
    n: 4,
    tag: 'La carte',
    title: 'Un monde imaginaire à explorer',
    sub: 'Villes, côtes et vallées de la Velmarche : chaque lieu garde ses archives.',
    // Le cœur de la carte : Ostrie, Port-Sénane, Aubrelieu, la Velmarche.
    media: shot('jeu-carte-1920.png', { x: 236, y: 186, w: 820, h: 640 }, 920),
    tilt: -1,
  });

/** Diapo 5 : appel à l'action. */
function slideCta() {
  const spot = (id) => `<div class="spot">${artSvg(`art/keyart/${id}.svg`)}</div>`;
  const css = `
.frame { width: 1080px; height: 1350px; }
.frame.desk-surface { --lamp-y: 30%; }
.col { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 40px; text-align: center; padding: 0 60px; }
.spots { display: flex; gap: 18px; margin-bottom: 4px; }
.spot { width: 240px; height: 200px; background: var(--paper, oklch(0.978 0.012 92)); border-radius: 3px;
  box-shadow: 0 18px 36px ${NIGHT(0.6)}; padding: 8px; }
.spot:nth-child(1) { transform: rotate(-4deg) translateY(10px); }
.spot:nth-child(3) { transform: rotate(4deg) translateY(10px); }
.spot svg { display: block; width: 100%; height: 100%; }
.col .wm { --wm-size: 100px; }
.col .wm .flourish { width: 3.4em; }
.free { font-size: 92px; transform: rotate(-1.5deg); margin-top: 6px; }
.plats { font-size: 36px; line-height: 1.4; max-width: 940px; }
.url { font-size: 38px; padding: 0.42em 0.8em 0.38em; background: var(--manila); color: var(--kraft-ink);
  border-radius: 4px; box-shadow: 0 14px 30px ${NIGHT(0.6)}; }
.bio { font-size: 26px; color: var(--text-muted); margin-top: -18px; }
.brand { position: absolute; left: 50%; bottom: 40px; transform: translateX(-50%); }
.count { position: absolute; right: 72px; bottom: 44px; font-size: 24px; color: var(--text-muted); }
`;
  return doc(
    `<main class="frame desk-surface"><div class="col">
<div class="spots">${spot('spot-tree')}${spot('spot-letter')}${spot('spot-map-pin')}</div>
<div class="shadowed">${wordmark({ stacked: false, center: true })}</div>
<p class="free">Gratuit</p>
<p class="plats">${platsLine()}</p>
<p class="url">${ITCH_URL}</p>
<p class="bio label">Lien dans la bio</p></div>
${brand()}<p class="count label">5 / 5</p></main>`,
    css,
  );
}

// ── 2. Carré 1080 × 1080 ─────────────────────────────────────────────────────

function square() {
  const art = artSvg('art/keyart/keyart-desk.svg', {
    viewBox: '230 120 1000 640',
    preserveAspectRatio: 'xMidYMin slice',
  });
  const css = `
.frame { width: 1080px; height: 1080px; }
.pic { position: absolute; left: 0; right: 0; top: 0; height: 700px; }
.shade { background: linear-gradient(${NIGHT(0)} 30%, ${NIGHT(0.7)} 54%, ${NIGHT(0.97)} 66%, ${NIGHT(1)} 100%); }
.txt { position: absolute; left: 0; right: 0; bottom: 70px; display: flex; flex-direction: column;
  align-items: center; gap: 30px; }
.txt .wm { --wm-size: 124px; }
.txt .wm .flourish { width: 3.4em; }
.free { font-size: 54px; transform: rotate(-1.2deg); }
.brand { position: absolute; right: 36px; top: 30px; font-size: 22px; color: var(--text);
  background: ${NIGHT(0.7)}; padding: 0.35em 0.7em; border-radius: 6px; }
`;
  return doc(
    `<main class="frame"><div class="fill pic">${art}</div><div class="fill shade"></div>
${brand()}
<div class="txt"><div class="shadowed">${wordmark({ stacked: false, center: true })}</div>
<p class="free">Disponible gratuitement</p></div></main>`,
    css,
  );
}

// ── 3. Stories 1080 × 1920 (texte entre y = 250 et y = 1620) ─────────────────

function storyLaunch() {
  const art = artSvg('art/keyart/keyart-desk-tall.svg', { preserveAspectRatio: 'xMidYMin slice' });
  const css = `
.frame { width: 1080px; height: 1920px; }
.pic { position: absolute; left: 0; right: 0; top: 0; height: 1350px; }
.shade { background: linear-gradient(${NIGHT(0.5)} 0%, ${NIGHT(0)} 12%, ${NIGHT(0)} 36%, ${NIGHT(0.82)} 50%, ${NIGHT(1)} 60%); }
.top { position: absolute; left: 0; right: 60px; top: 280px; display: flex; justify-content: flex-end; }
.kick { font-size: 38px; transform: rotate(-2deg); }
.txt { position: absolute; left: 0; right: 0; top: 960px; display: flex; flex-direction: column;
  align-items: center; gap: 30px; text-align: center; }
.txt .wm { --wm-size: 112px; }
.txt .wm .flourish { width: 3.4em; }
.hook { font-size: 48px; max-width: 900px; }
.free { font-size: 64px; transform: rotate(-1.2deg); margin-top: 10px; }
.plats { font-size: 32px; }
.brand { position: absolute; left: 50%; top: 1560px; transform: translateX(-50%); font-size: 26px; }
`;
  return doc(
    `<main class="frame"><div class="fill pic">${art}</div><div class="fill shade"></div>
<div class="top"><p class="kick label tape-red">Disponible maintenant</p></div>
<div class="txt"><div class="shadowed">${wordmark({ stacked: false, center: true })}</div>
<p class="hook">Une famille. Des archives.<br>Des absents à retrouver.</p>
<p class="free">Gratuit</p>
<p class="plats">${platsLine()}</p></div>
${brand()}</main>`,
    css,
  );
}

/** Nouvelle affaire : la haute vallée sur la carte, une chemise de kraft, aucune pièce de l'enquête. */
function storyCase() {
  // Hautcorvin (1080, 785) et Vernezac, monts Corvins, lac d'Aulne : la haute vallée de l'Orvelle.
  const map = mapSvg('900 600 320 400');
  const css = `
.frame { width: 1080px; height: 1920px; }
.frame.desk-surface { --lamp-x: 50%; --lamp-y: 40%; }
.top { position: absolute; left: 0; right: 0; top: 270px; display: flex; flex-direction: column;
  align-items: center; gap: 22px; text-align: center; }
.kick { font-size: 40px; transform: rotate(-2deg); }
.ver { font-size: 28px; color: var(--text-muted); }
.board { position: absolute; left: 90px; top: 470px; width: 900px; height: 820px; }
.mapcard { position: absolute; left: 230px; top: 0; width: 600px; height: 742px; transform: rotate(3deg);
  background: var(--paper, oklch(0.978 0.012 92)); padding: 14px; border-radius: 3px;
  box-shadow: 0 30px 60px ${NIGHT(0.7)}; }
.mapcard .m { width: 100%; height: 100%; overflow: hidden; }
.mapcard .m svg { display: block; width: 100%; height: 100%; }
.mapcard .mat-tape { position: absolute; width: 150px; height: 40px; left: 50%; top: -18px; margin-left: -75px;
  transform: rotate(-3deg); }
.folder { position: absolute; left: 0; top: 400px; width: 560px; height: 420px; transform: rotate(-4deg);
  border-radius: 7px; box-shadow: 0 30px 60px ${NIGHT(0.75)}; }
.folder::before { content: ''; position: absolute; left: 34px; top: -40px; width: 220px; height: 52px;
  background: var(--kraft); border-radius: 9px 9px 0 0; }
.folder .lbl { position: absolute; left: 44px; top: 54px; right: 44px; display: flex; flex-direction: column; gap: 18px; }
.folder .cote { font-family: var(--font-type); font-size: 28px; color: var(--kraft-ink); }
.folder .ttl { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); font-size: 68px; line-height: 0.98; color: var(--kraft-ink);
  letter-spacing: var(--tracking-display); }
.folder .ttl i { font-weight: var(--weight-display); color: var(--brand); }
.folder .orc { position: absolute; left: 44px; bottom: 40px; font-size: 24px; }
.txt { position: absolute; left: 0; right: 0; top: 1338px; display: flex; flex-direction: column;
  align-items: center; gap: 26px; text-align: center; }
.hook { font-size: 46px; max-width: 920px; }
.meta { font-size: 30px; color: var(--text); }
.meta i { font-style: normal; color: var(--accent); padding-inline: 0.35em; }
.brand { position: absolute; left: 50%; top: 1566px; transform: translateX(-50%); font-size: 24px; }
`;
  return doc(
    `<main class="frame desk-surface">
<div class="top"><p class="kick label tape-red">Nouvelle affaire</p>
<p class="ver label">Mise à jour gratuite · version 1.1</p></div>
<div class="board">
<div class="mapcard"><span class="mat-tape"></span><div class="m">${map}</div></div>
<div class="folder mat-kraft" data-surface="kraft"><div class="lbl"><p class="cote">Dossier n° 76-0012</p>
<p class="ttl">Le Revenant<br><i>de</i> Hautcorvin</p></div>
<p class="orc label tape-blue">O.R.C. · février 1976</p></div>
</div>
<div class="txt"><p class="hook">Un homme revient. Il demande<br>qu’on lui rende son nom.</p>
<p class="meta label">Se joue seule<i>·</i>dans <span style="text-transform:none;font-family:var(--font-display);font-style:italic;letter-spacing:0">L’Arbre aux absents</span></p></div>
${brand()}</main>`,
    css,
  );
}

// ── 4. X / Bluesky 1600 × 900 ────────────────────────────────────────────────

function xKey() {
  const art = artSvg('art/keyart/keyart-desk.svg', { preserveAspectRatio: 'xMidYMid slice' });
  const css = `
.frame { width: 1600px; height: 900px; }
.shade { background:
  linear-gradient(90deg, ${NIGHT(0)} 28%, ${NIGHT(0.72)} 52%, ${NIGHT(0.95)} 66%),
  radial-gradient(ellipse 70% 80% at 25% 60%, ${NIGHT(0)} 40%, ${NIGHT(0.4)} 100%); }
.txt { position: absolute; right: 80px; top: 50%; transform: translateY(-50%); display: flex;
  flex-direction: column; align-items: flex-start; gap: 26px; }
.kick { font-size: 28px; transform: rotate(-2deg); }
.txt .wm { --wm-size: 128px; }
.txt .wm .flourish { width: 3.4em; }
.hook { font-size: 36px; }
.free { font-size: 44px; transform: rotate(-1.2deg); margin-top: 8px; }
.plats { font-size: 26px; }
.brand { position: absolute; left: 44px; top: 36px; font-size: 22px; color: var(--text);
  background: ${NIGHT(0.7)}; padding: 0.35em 0.7em; border-radius: 6px; }
`;
  return doc(
    `<main class="frame"><div class="fill">${art}</div><div class="fill shade"></div>
${brand()}
<div class="txt"><p class="kick label tape-red">Un jeu d’enquête généalogique</p>
<div class="shadowed">${wordmark()}</div>
<p class="hook">Une famille. Des archives.<br>Des absents à retrouver.</p>
<p class="free">Disponible gratuitement</p>
<p class="plats">${platsLine()}</p></div></main>`,
    css,
  );
}

function xGameplay() {
  const css = `
.frame { width: 1600px; height: 900px; }
.frame.desk-surface { --lamp-x: 50%; --lamp-y: 0%; }
.media { position: absolute; left: 36px; top: 46px; transform: rotate(-0.6deg); }
.media .mat-tape.a { left: -26px; top: 0px; transform: rotate(-32deg); }
.media .mat-tape.b { right: -26px; top: 0px; transform: rotate(30deg); }
.band { position: absolute; left: 60px; right: 60px; bottom: 22px; height: 130px; display: flex;
  align-items: center; justify-content: space-between; gap: 40px; }
.band .wm { --wm-size: 58px; }
.band .wm .flourish { width: 4.4em; }
.band h2 { flex: 1; font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 32px; line-height: 1.2; color: var(--text); text-wrap: balance; }
.cta { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
.free { font-size: 32px; transform: rotate(-1.2deg); }
.url { font-size: 20px; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
`;
  return doc(
    `<main class="frame desk-surface">
<figure class="media print" style="margin:0"><span class="mat-tape a"></span><span class="mat-tape b"></span>
${shot('jeu-lecteur-lettre-1920.png', { x: 400, y: 236, w: 1500, h: 640 }, 1500)}</figure>
<div class="band">${wordmark({ stacked: false })}
<h2>Croisez lettres, registres et photos pour rendre à une famille son arbre.</h2>
<div class="cta"><p class="free">Gratuit</p><p class="url">${ITCH_URL}</p></div></div></main>`,
    css,
  );
}

// ── 5. En-tête X 1500 × 500 ──────────────────────────────────────────────────

function xHeader() {
  const art = artSvg('art/keyart/keyart-desk.svg', {
    viewBox: '0 160 1600 533',
    preserveAspectRatio: 'xMidYMid slice',
  });
  const css = `
.frame { width: 1500px; height: 500px; }
.shade { background: linear-gradient(90deg, ${NIGHT(0.15)} 0%, ${NIGHT(0)} 22%, ${NIGHT(0.55)} 50%, ${NIGHT(0.95)} 66%); }
.txt { position: absolute; right: 70px; top: 50%; transform: translateY(-50%); display: flex;
  flex-direction: column; align-items: flex-start; gap: 18px; }
.txt .wm { --wm-size: 82px; }
.txt .wm .flourish { width: 4em; }
.hook { font-size: 28px; }
.row { display: flex; align-items: center; gap: 22px; }
.free { font-size: 28px; transform: rotate(-1.2deg); }
.plats { font-size: 20px; }
`;
  return doc(
    `<main class="frame"><div class="fill">${art}</div><div class="fill shade"></div>
<div class="txt"><div class="shadowed">${wordmark({ stacked: false })}</div>
<p class="hook">Une famille. Des archives. Des absents à retrouver.</p>
<div class="row"><p class="free">Gratuit</p><p class="plats">${platsLine()}</p></div></div></main>`,
    css,
  );
}

// ── Rendu ────────────────────────────────────────────────────────────────────

const JOBS = [
  { name: 'instagram-carrousel-1-accroche-1080x1350.jpg', w: 1080, h: 1350, html: slideHook },
  { name: 'instagram-carrousel-2-arbre-1080x1350.jpg', w: 1080, h: 1350, html: slideTree },
  { name: 'instagram-carrousel-3-archives-1080x1350.jpg', w: 1080, h: 1350, html: slideReader },
  { name: 'instagram-carrousel-4-carte-1080x1350.jpg', w: 1080, h: 1350, html: slideMap },
  { name: 'instagram-carrousel-5-gratuit-1080x1350.jpg', w: 1080, h: 1350, html: slideCta },
  { name: 'carre-lancement-1080x1080.jpg', w: 1080, h: 1080, html: square },
  { name: 'story-lancement-1080x1920.jpg', w: 1080, h: 1920, html: storyLaunch },
  { name: 'story-nouvelle-affaire-hautcorvin-1080x1920.jpg', w: 1080, h: 1920, html: storyCase },
  { name: 'x-bluesky-lancement-1600x900.jpg', w: 1600, h: 900, html: xKey },
  { name: 'x-bluesky-gameplay-1600x900.jpg', w: 1600, h: 900, html: xGameplay },
  { name: 'x-entete-1500x500.jpg', w: 1500, h: 500, html: xHeader },
];

/** Aperçu de contrôle (non versionné) : zones réservées de l'interface des stories. */
function storyZones(src) {
  const css = `.frame{width:1080px;height:1920px;background:url('${src}') 0 0/100% 100%}
.z{position:absolute;left:0;right:0;background:oklch(0.62 0.2 33 / 0.35);border:3px dashed oklch(0.84 0.155 80)}`;
  return doc(
    `<main class="frame"><div class="z" style="top:0;height:250px"></div><div class="z" style="bottom:0;height:300px"></div></main>`,
    css,
  );
}

const filter = process.argv[2];
mkdirSync(OUT, { recursive: true });
mkdirSync(WORK, { recursive: true });
const executablePath =
  process.env.CHROMIUM_PATH ??
  (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium
  .launch()
  .catch(() => chromium.launch(executablePath ? { executablePath } : {}));
const MAX = 1.5 * 1024 * 1024;

async function render(job, outDir) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce', colorScheme: 'dark' });
  const file = join(WORK, job.name.replace(/\.\w+$/, '.html'));
  writeFileSync(file, job.html());
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(
    'Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))])',
  );
  await page.waitForTimeout(200);
  const out = join(outDir, job.name);
  const jpeg = job.name.endsWith('.jpg');
  let quality = 90;
  for (;;) {
    await page.screenshot({
      path: out,
      type: jpeg ? 'jpeg' : 'png',
      quality: jpeg ? quality : undefined,
      clip: { x: 0, y: 0, width: job.w, height: job.h },
    });
    if (!jpeg || statSync(out).size <= MAX || quality <= 70) break;
    quality -= 5;
  }
  await page.close();
  const size = statSync(out).size;
  console.log(`${job.name}  ${(size / 1024).toFixed(0)} Ko${jpeg ? `  (q${quality})` : ''}`);
  if (size > MAX && outDir === OUT) console.warn(`  ! ${job.name} dépasse 1,5 Mo`);
}

for (const job of JOBS) {
  if (filter && !job.name.includes(filter)) continue;
  await render(job, OUT);
}
if (!filter || filter.includes('zones')) {
  for (const name of [
    'story-lancement-1080x1920.jpg',
    'story-nouvelle-affaire-hautcorvin-1080x1920.jpg',
  ]) {
    const src = pathToFileURL(join(OUT, name)).href;
    await render(
      { name: name.replace('.jpg', '-zones.png'), w: 1080, h: 1920, html: () => storyZones(src) },
      WORK,
    );
  }
}
await browser.close();
