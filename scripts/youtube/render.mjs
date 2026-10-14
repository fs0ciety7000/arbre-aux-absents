/**
 * Visuels de la chaîne YouTube (miniatures du trailer, avatar, bannière, filigrane).
 *
 *   node scripts/youtube/render.mjs            # tout, dans assets/youtube/
 *   node scripts/youtube/render.mjs avatar     # seulement les fichiers dont le nom contient « avatar »
 *
 * Rien n'est redessiné : l'art clé vient de `art/keyart/`, les portraits publics de
 * `content/cases/…/portraits/` (sélection du site, `PORTRAIT_PLATES`), les logos de
 * `apps/site/static/brand/` (inchangés, couleurs d'origine ou monochromes), les polices et les
 * couleurs du design system (`packages/ui/src/styles/index.css`). Rendu : Playwright + Chromium.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(REPO, 'assets/youtube');
const WORK = join(REPO, 'node_modules/.cache/youtube');
const STYLES = pathToFileURL(join(REPO, 'packages/ui/src/styles/index.css')).href;
const read = (rel) => readFileSync(join(REPO, rel), 'utf8');

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
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<desc>[\s\S]*?<\/desc>/, '')
  );
}

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

/** Logo de la maison, inchangé (seules les teintes passent par --logo-t*). */
const logo = (id) =>
  read(`apps/site/static/brand/${id}.svg`)
    .replace(/\srole="[^"]*"/, '')
    .replace('<svg ', '<svg aria-hidden="true" ');

const PORTRAIT_IDS = JSON.parse(read('art/tools/portraits/ids.json'));
const portrait = (person) =>
  artSvg(`content/cases/succession-varenque/portraits/${PORTRAIT_IDS[person]}.svg`, {
    class: 'art portrait',
  });

// ── Gabarit ──────────────────────────────────────────────────────────────────

const BASE_CSS = `
html, body { margin: 0; padding: 0; background: transparent; }
body { min-height: 0; overflow: hidden; }
.art.defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.frame { position: relative; overflow: hidden; }
.fill { position: absolute; inset: 0; }
.fill > svg { display: block; width: 100%; height: 100%; }
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
.logo svg { display: block; width: 100%; height: 100%; }
.logo.mono { --logo-t1: currentColor; --logo-t2: currentColor; --logo-t3: currentColor; }
.label { font-family: var(--font-label); font-weight: var(--weight-medium); text-transform: uppercase;
  letter-spacing: var(--tracking-stamp); }
`;

const doc = (body, css = '', htmlAttrs = '') =>
  `<!doctype html><html lang="fr" ${htmlAttrs}><head><meta charset="utf-8"><title>YouTube</title>
<link rel="stylesheet" href="${STYLES}"><style>${BASE_CSS}${css}</style></head>
<body>${ART_DEFS}${body}</body></html>`;

// ── Miniatures du trailer (1280 × 720) ───────────────────────────────────────

/** A : l'art clé recadré sur la lampe et l'arbre aux médaillons vides, titre empilé à droite. */
function thumbLamp() {
  const art = artSvg('art/keyart/keyart-desk.svg', {
    viewBox: '300 140 1060 596',
    preserveAspectRatio: 'xMidYMid slice',
  });
  const css = `
.frame { width: 1280px; height: 720px; background: var(--desk); }
.shade { background:
  linear-gradient(90deg, oklch(0.15 0.042 260 / 0) 18%, oklch(0.15 0.042 260 / 0.55) 46%, oklch(0.15 0.042 260 / 0.94) 66%),
  radial-gradient(ellipse 70% 80% at 22% 62%, oklch(0.15 0.042 260 / 0) 40%, oklch(0.15 0.042 260 / 0.45) 100%); }
.title { position: absolute; right: 52px; top: 50%; transform: translateY(-52%); }
.title .wm { --wm-size: 150px; filter: drop-shadow(0 6px 18px oklch(0.15 0.042 260 / 0.85)); }
.title .wm .flourish { width: 3.2em; }
.tag { position: absolute; left: 48px; top: 44px; font-size: 40px; padding: 0.14em 0.55em 0.1em;
  background: var(--label-tape-red); color: var(--label-tape-text); transform: rotate(-2.5deg);
  box-shadow: 0 6px 16px oklch(0.15 0.042 260 / 0.6); }
`;
  return doc(
    `<main class="frame"><div class="fill">${art}</div><div class="fill shade"></div>
<p class="tag label">Bande-annonce</p>
<div class="title">${wordmark()}</div></main>`,
    css,
  );
}

/** B : un visage gravé sur sa fiche, un médaillon vide « ? », le fil rouge ; titre empilé à droite. */
function thumbFace() {
  const art = artSvg('art/keyart/keyart-desk.svg', {
    viewBox: '600 300 800 450',
    preserveAspectRatio: 'xMidYMid slice',
  });
  const css = `
.frame { width: 1280px; height: 720px; background: var(--desk); }
.bg { filter: blur(3px) brightness(0.55) saturate(0.9); transform: scale(1.04); }
.shade { background: radial-gradient(ellipse 55% 75% at 26% 52%, oklch(0.84 0.155 80 / 0.22) 0%, oklch(0.15 0.042 260 / 0) 60%),
  linear-gradient(90deg, oklch(0.15 0.042 260 / 0) 30%, oklch(0.15 0.042 260 / 0.85) 62%); }
.card { position: absolute; left: 70px; top: 70px; width: 420px; padding: 18px 18px 14px;
  background: var(--paper, oklch(0.978 0.012 92)); transform: rotate(-4deg);
  box-shadow: 0 24px 50px oklch(0.15 0.042 260 / 0.75), 0 2px 0 oklch(0.15 0.042 260 / 0.3); }
.card svg { display: block; width: 100%; height: auto; }
.card .tape { position: absolute; top: -16px; left: 50%; width: 150px; height: 40px; margin-left: -75px;
  transform: rotate(3deg); }
.q { position: absolute; left: 418px; top: 370px; width: 230px; height: 290px; border-radius: 50%;
  border: 6px dashed var(--accent); background: oklch(0.15 0.042 260 / 0.82); transform: rotate(6deg);
  display: grid; place-items: center; box-shadow: 0 18px 40px oklch(0.15 0.042 260 / 0.8); }
.q span { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); font-size: 220px; line-height: 1; color: var(--accent);
  transform: translateY(-6px); }
.title { position: absolute; right: 50px; top: 50%; transform: translateY(-50%); }
.title .wm { --wm-size: 140px; filter: drop-shadow(0 6px 18px oklch(0.15 0.042 260 / 0.9)); }
.title .wm .flourish { width: 3.2em; }
.kick { position: absolute; right: 56px; top: 40px; margin: 0; font-size: 38px; color: var(--text);
  text-shadow: 0 2px 12px oklch(0.15 0.042 260 / 0.9); }
.kick b { color: var(--accent); font-weight: inherit; }
`;
  return doc(
    `<main class="frame"><div class="fill bg">${art}</div><div class="fill shade"></div>
<figure class="card" data-surface="paper" style="margin:0"><span class="mat-tape tape"></span>${portrait('firmin-varenque-1849')}</figure>
<div class="q"><span>?</span></div>
<p class="kick label">Qui sont les <b>absents</b>&nbsp;?</p>
<div class="title">${wordmark()}</div></main>`,
    css,
  );
}

// ── Avatar de la chaîne (800 × 800) ──────────────────────────────────────────

/** Le logo CM Interactive tel quel, centré dans le cercle (≈ 64 % du diamètre). */
function avatar(tone) {
  const dark = tone === 'sombre';
  const css = `
.frame { width: 800px; height: 800px; display: grid; place-items: center;
  background: ${dark ? 'radial-gradient(circle at 50% 42%, var(--raw-night-850) 0%, var(--raw-night-1000) 72%)' : 'var(--raw-paper, oklch(0.978 0.012 92))'}; }
.logo { width: 560px; height: 455px; ${dark ? '' : 'color: oklch(0.2 0.054 260);'} }
`;
  return doc(
    `<main class="frame"><div class="logo${dark ? '' : ' mono'}">${logo('interactive')}</div></main>`,
    css,
  );
}

// ── Bannière (2560 × 1440, zone sûre 1546 × 423) ─────────────────────────────

function banner() {
  const art = artSvg('art/keyart/keyart-desk.svg', { preserveAspectRatio: 'xMidYMid slice' });
  const css = `
.frame { width: 2560px; height: 1440px; background: var(--desk); }
.shade { background:
  radial-gradient(ellipse 44% 30% at 50% 50%, oklch(0.15 0.042 260 / 0.55) 0%, oklch(0.15 0.042 260 / 0) 100%),
  linear-gradient(oklch(0.15 0.042 260 / 0.2) 0%, oklch(0.15 0.042 260 / 0.66) 33%, oklch(0.15 0.042 260 / 0.74) 50%, oklch(0.15 0.042 260 / 0.66) 67%, oklch(0.15 0.042 260 / 0.2) 100%); }
.safe { position: absolute; left: 507px; top: 508px; width: 1546px; height: 423px;
  display: flex; align-items: center; justify-content: space-between; gap: 64px; box-sizing: border-box;
  padding: 0 24px; }
.main { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.kick { margin: 0; font-size: 30px; padding: 0.16em 0.6em 0.1em; background: var(--label-tape-red);
  color: var(--label-tape-text); transform: rotate(-1.5deg); }
.main .wm { --wm-size: 124px; filter: drop-shadow(0 4px 16px oklch(0.15 0.042 260 / 0.9)); }
.main .wm .flourish { width: 4.2em; }
.hook { margin: 0; font-family: var(--font-display); font-style: italic; font-weight: 400;
  font-size: 36px; line-height: 1.28; color: var(--text); text-shadow: 0 2px 12px oklch(0.15 0.042 260 / 0.95); }
.side { display: flex; flex-direction: column; align-items: center; gap: 18px; padding-left: 56px;
  border-left: 2px solid oklch(0.96 0.014 88 / 0.35); }
.side .logo { width: 210px; height: 170px; }
.side p { margin: 0; text-align: center; color: var(--text); }
.side .who { font-size: 30px; }
.side .free { font-size: 26px; padding: 0.16em 0.6em 0.1em; background: var(--accent); color: var(--accent-contrast); }
.side .url { font-family: var(--font-ui); font-size: 26px; color: var(--text-muted); }
`;
  return doc(
    `<main class="frame"><div class="fill">${art}</div><div class="fill shade"></div>
<div class="safe"><div class="main"><p class="kick label">Un jeu d’enquête généalogique</p>${wordmark({ stacked: false })}
<p class="hook">Velmarche, automne 1974.<br>Une famille entière à rendre à ses noms.</p></div>
<div class="side"><div class="logo">${logo('interactive')}</div><p class="who label">CM Interactive</p>
<p class="free label">Gratuit sur itch.io</p><p class="url">arbre.cardormedia.com</p></div></div></main>`,
    css,
  );
}

/** Aperçu de contrôle : la bannière avec les découpes TV, ordinateur, mobile et la zone sûre. */
function bannerZones(src) {
  const box = (x, y, w, h, color, label, pos = 'left:8px;top:6px') =>
    `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;box-sizing:border-box;border:6px dashed ${color};">
<span style="position:absolute;${pos};background:${color};color:#07152e;font:600 34px/1.2 sans-serif;padding:2px 12px">${label}</span></div>`;
  const css = `.frame{width:2560px;height:1440px;background:url('${src}') center/cover}`;
  return doc(
    `<main class="frame">
${box(0, 0, 2560, 1440, '#f6f1e7', 'TV : 2560 × 1440 (image entière)')}
${box(0, 508, 2560, 423, '#7fd6c0', 'Ordinateur, largeur max. : 2560 × 423', 'left:8px;bottom:-52px')}
${box(352, 508, 1855, 423, '#ffbe3d', 'Tablette : 1855 × 423', 'right:8px;top:-52px')}
${box(507, 508, 1546, 423, '#ff6b4a', 'Mobile = zone sûre (texte, logos) : 1546 × 423', 'left:8px;top:-52px')}
</main>`,
    css,
  );
}

// ── Bannière de la chaîne du studio CM Interactive (2560 × 1440) ─────────────

/**
 * Couleurs officielles des logos (`apps/site/static/brand/*.svg`, valeurs par défaut des
 * `--logo-t*`) : citron #C6FF3D et olive #5B7A00 (CM Interactive), or #D4A84B, vélin #EDE8DF et
 * vermillon #FF3B1F (CARDOR Media). Le fond est un graphite teinté d'olive.
 */
const STUDIO = {
  lime: '#C6FF3D',
  olive: '#5B7A00',
  gold: '#D4A84B',
  cream: '#EDE8DF',
  ground: 'oklch(0.16 0.022 125)',
  groundDeep: 'oklch(0.11 0.016 125)',
};

/** Champ de facettes triangulaires (décor, graine fixe) qui fait écho au logo sans le copier. */
function facets(w, h, step = 128) {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cols = Math.ceil(w / step) + 2;
  const rows = Math.ceil(h / step) + 2;
  const pts = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      pts.push([
        (c - 0.5) * step + (rnd() - 0.5) * step * 0.7,
        (r - 0.5) * step + (rnd() - 0.5) * step * 0.7,
      ]);
  const at = (r, c) => pts[r * cols + c];
  const tris = [];
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c < cols - 1; c++) {
      const [a, b, d, e] = [at(r, c), at(r, c + 1), at(r + 1, c), at(r + 1, c + 1)];
      for (const t of rnd() < 0.5
        ? [
            [a, b, e],
            [a, e, d],
          ]
        : [
            [a, b, d],
            [b, e, d],
          ]) {
        const o = (rnd() * 0.09).toFixed(3);
        tris.push(
          `<path d="M${t.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L')}Z" fill="${STUDIO.lime}" fill-opacity="${o}"/>`,
        );
      }
    }
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><g stroke="${STUDIO.lime}" stroke-opacity="0.07" stroke-width="1.5">${tris.join('')}</g></svg>`;
}

/** Bannière du studio ; `showcase` ajoute la vitrine discrète « À l'affiche ». */
function studioBanner(showcase) {
  const keyart = artSvg('art/keyart/keyart-desk.svg', {
    viewBox: '300 140 1060 596',
    preserveAspectRatio: 'xMidYMid slice',
  });
  const css = `
.frame { width: 2560px; height: 1440px;
  background: radial-gradient(ellipse 60% 55% at 50% 50%, ${STUDIO.ground} 0%, ${STUDIO.groundDeep} 100%); }
.facets { -webkit-mask-image: radial-gradient(ellipse 58% 50% at 50% 50%, #000 0%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 58% 50% at 50% 50%, #000 0%, #000 35%, transparent 100%); }
.glow { background: radial-gradient(ellipse 22% 26% at ${showcase ? '32%' : '38%'} 50%, oklch(0.93 0.21 125 / 0.16) 0%, transparent 100%); }
.safe { position: absolute; left: 507px; top: 508px; width: 1546px; height: 423px; box-sizing: border-box;
  padding: 0 28px; display: flex; align-items: center; justify-content: ${showcase ? 'space-between' : 'center'};
  gap: ${showcase ? 48 : 72}px; color: ${STUDIO.cream}; }
.brand { display: flex; align-items: center; gap: ${showcase ? 44 : 56}px; }
.brand .logo { width: ${showcase ? 330 : 440}px; height: ${showcase ? 268 : 357}px; }
.words { display: flex; flex-direction: column; gap: 22px; }
.name { margin: 0; font-family: var(--font-label); font-weight: 600; text-transform: uppercase;
  font-size: ${showcase ? 118 : 150}px; line-height: 0.92; letter-spacing: 0.01em; }
.name span { display: block; }
.name .accent { color: ${STUDIO.lime}; }
.sig { display: flex; align-items: center; gap: 18px; margin: 0; font-family: var(--font-label);
  text-transform: uppercase; letter-spacing: 0.12em; font-size: ${showcase ? 30 : 34}px; font-weight: 500;
  color: ${STUDIO.cream}; }
.sig .logo { width: 52px; height: 52px; flex: none; }
.sig b { color: ${STUDIO.gold}; font-weight: 600; }
.show { box-sizing: border-box; flex: none; width: 400px; display: flex; flex-direction: column; gap: 16px; padding-left: 48px;
  border-left: 2px solid oklch(0.93 0.02 85 / 0.28); }
.show .kick { margin: 0; font-family: var(--font-label); text-transform: uppercase; letter-spacing: 0.14em;
  font-size: 26px; color: ${STUDIO.lime}; }
.show .pic { position: relative; width: 336px; height: 189px; overflow: hidden; border-radius: 6px;
  box-shadow: 0 16px 40px oklch(0 0 0 / 0.55); outline: 2px solid oklch(0.93 0.02 85 / 0.2); }
.show .pic > svg { display: block; width: 100%; height: 100%; }
.show .title { margin: 0; font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); font-size: 44px; line-height: 1; letter-spacing: var(--tracking-display); }
.show .title i { font-weight: var(--weight-display); color: oklch(0.72 0.17 36); padding-right: 0.06em; }
`;
  const show = showcase
    ? `<aside class="show"><p class="kick">À l’affiche</p><div class="pic">${keyart}</div>
<p class="title">L’Arbre <i>aux</i> absents</p></aside>`
    : '';
  return doc(
    `<main class="frame"><div class="fill facets">${facets(2560, 1440)}</div><div class="fill glow"></div>
<div class="safe"><div class="brand"><div class="logo">${logo('interactive')}</div>
<div class="words"><p class="name"><span>CM</span><span class="accent">Interactive</span></p>
<p class="sig"><span class="logo">${logo('cardor-monogram')}</span><span>Une division de <b>CARDOR Media</b></span></p></div></div>
${show}</div></main>`,
    css,
  );
}

// ── Filigrane (150 × 150, transparent) ───────────────────────────────────────

function watermark(tone) {
  const css = `
.frame { width: 150px; height: 150px; display: grid; place-items: center; }
.logo { width: 142px; height: 115px; ${tone === 'blanc' ? 'color: oklch(1 0 0);' : ''} }
`;
  return doc(
    `<main class="frame"><div class="logo${tone === 'blanc' ? ' mono' : ''}">${logo('interactive')}</div></main>`,
    css,
  );
}

// ── Rendu ────────────────────────────────────────────────────────────────────

const JOBS = [
  {
    name: 'banniere-chaine-cm-interactive-2560x1440.jpg',
    w: 2560,
    h: 1440,
    html: () => studioBanner(true),
  },
  {
    name: 'banniere-chaine-cm-interactive-sans-jeu-2560x1440.jpg',
    w: 2560,
    h: 1440,
    html: () => studioBanner(false),
  },
  {
    name: 'banniere-cm-interactive-zones.png',
    w: 2560,
    h: 1440,
    html: () =>
      bannerZones(pathToFileURL(join(OUT, 'banniere-chaine-cm-interactive-2560x1440.jpg')).href),
  },
  { name: 'miniature-trailer-a-lampe-1280x720.jpg', w: 1280, h: 720, html: thumbLamp },
  { name: 'miniature-trailer-b-visage-1280x720.jpg', w: 1280, h: 720, html: thumbFace },
  { name: 'avatar-cm-interactive-sombre-800.png', w: 800, h: 800, html: () => avatar('sombre') },
  { name: 'avatar-cm-interactive-clair-800.png', w: 800, h: 800, html: () => avatar('clair') },
  { name: 'banniere-chaine-2560x1440.jpg', w: 2560, h: 1440, html: banner },
  {
    name: 'banniere-zones.png',
    w: 2560,
    h: 1440,
    html: () => bannerZones(pathToFileURL(join(OUT, 'banniere-chaine-2560x1440.jpg')).href),
  },
  {
    name: 'filigrane-cm-interactive-150.png',
    w: 150,
    h: 150,
    html: () => watermark('couleur'),
    transparent: true,
  },
  {
    name: 'filigrane-cm-interactive-blanc-150.png',
    w: 150,
    h: 150,
    html: () => watermark('blanc'),
    transparent: true,
  },
];

const filter = process.argv[2];
mkdirSync(OUT, { recursive: true });
mkdirSync(WORK, { recursive: true });
const browser = await chromium.launch();
for (const job of JOBS) {
  if (filter && !job.name.includes(filter)) continue;
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
  await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
  const file = join(WORK, job.name.replace(/\.\w+$/, '.html'));
  writeFileSync(file, job.html());
  await page.goto(pathToFileURL(file).href);
  await page.evaluate('document.fonts.ready.then(() => true)');
  await page.waitForTimeout(200);
  const out = join(OUT, job.name);
  const jpeg = job.name.endsWith('.jpg');
  await page.screenshot({
    path: out,
    type: jpeg ? 'jpeg' : 'png',
    quality: jpeg ? 90 : undefined,
    omitBackground: Boolean(job.transparent),
    clip: { x: 0, y: 0, width: job.w, height: job.h },
  });
  await page.close();
  console.log(`${job.name}  ${(statSync(out).size / 1024).toFixed(0)} Ko`);
}
await browser.close();
