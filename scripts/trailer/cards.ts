/**
 * Plans « composés » de la bande-annonce : ouverture sur l'art clé, cartons de texte, carton de
 * fin. Des pages HTML branchées sur le vrai design system (tokens, polices auto-hébergées,
 * matières, art clé et ses animations : `scripts/presskit/lib.ts`), rendues **image par image**
 * (chaque animation CSS est mise en pause puis placée au temps voulu : rendu déterministe).
 *
 *   npx tsx scripts/trailer/cards.ts [--only intro,c1]
 *
 * Sortie : `WORK/clips/<nom>.mp4` (30 i/s, quasi sans perte).
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { artSvg, houseLogos, html, wordmark } from '../presskit/lib';
import { FPS, WORK, ensureDir, ffmpeg } from './lib';

const { values } = parseArgs({ options: { only: { type: 'string' } } });
const only = values.only ? new Set(values.only.split(',')) : null;

/** Animations communes (transform, opacity, filter seulement ; temps absolus par `--d`). */
const CSS = `
html, body { width: 100%; height: 100%; overflow: hidden; }
body { background: var(--canvas); }
.stage { position: absolute; inset: 0; overflow: hidden; }
.stage.desk-surface { --lamp-x: 50%; --lamp-y: 18%; }
.stage.desk-surface::before { background:
  radial-gradient(60% 55% at var(--lamp-x) var(--lamp-y), oklch(0.84 0.155 80 / 0.13), transparent 72%),
  radial-gradient(140% 120% at 50% 40%, transparent 50%, var(--vignette)), var(--desk-grain-image); }
.anim { animation: var(--k) var(--dur, 1.1s) var(--ease, cubic-bezier(.2,.7,.2,1)) var(--d, 0s) both; }
@keyframes ink { from { opacity: 0; filter: blur(7px); transform: translateY(0.12em); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes stamp { 0% { opacity: 0; transform: scale(1.6) rotate(var(--r, -4deg)); } 55% { opacity: 1; transform: scale(0.96) rotate(var(--r, -4deg)); } 100% { opacity: 1; transform: scale(1) rotate(var(--r, -4deg)); } }
@keyframes push { from { transform: scale(1); } to { transform: scale(var(--to, 1.07)); } }
@keyframes drift { from { transform: scale(1.02) translateY(0); } to { transform: scale(1.06) translateY(-1%); } }
.w { display: inline-block; }
.line { display: block; }
.card-text { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display); color: var(--text); line-height: 1.08;
  letter-spacing: var(--tracking-display); text-wrap: balance; text-align: center; margin: 0; }
.card-text em { font-style: italic; font-weight: 500; color: var(--brand); }
.cc { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; }
.label { transform-origin: 50% 50%; }
.strike { position: absolute; left: -0.06em; right: -0.06em; top: 56%; height: 0.075em; background: var(--brand);
  border-radius: 0.04em; transform-origin: 0 50%; opacity: 0.92; }
.flourish-line { color: var(--fern); }
.flourish-line svg { display: block; width: 100%; height: auto; overflow: visible; }
.reveal-x { transform-origin: 50% 50%; }
`;

/** Mots encrés un à un. */
function inked(text: string, start: number, step = 0.16, k = 'ink'): string {
  return text
    .split(' ')
    .map(
      (w, i) =>
        `<span class="w anim" style="--k:${k};--d:${(start + i * step).toFixed(2)}s;--dur:1.05s">${w}</span>`,
    )
    .join(' ');
}

interface Scene {
  name: string;
  width: number;
  height: number;
  /** Durée (s). */
  dur: number;
  body: string;
  css?: string;
}

const KEY = artSvg('art/keyart/keyart-desk.svg', {
  preserveAspectRatio: 'xMidYMid slice',
  class: 'art art-fill',
}).markup;
const KEY_TALL = artSvg('art/keyart/keyart-desk-tall.svg', {
  preserveAspectRatio: 'xMidYMid slice',
  class: 'art art-fill',
}).markup;

/** Le titre, encré (comme `Wordmark animate`, DESIGN §4.3). */
function title(size: string, start: number, center = false): string {
  const wm = wordmark({ center });
  // Mots du titre encrés un à un, puis volute balayée.
  let i = 0;
  return `<div style="--wm-size:${size}">${wm
    .replace(/<span class="w( aux)?">/g, (_m, aux: string | undefined) => {
      const d = (start + i++ * 0.32).toFixed(2);
      return `<span class="w${aux ?? ''} anim" style="--k:ink;--d:${d}s;--dur:1.3s">`;
    })
    .replace(
      '<div class="flourish">',
      `<div class="flourish anim reveal-x" style="--k:sweep;--d:${(start + 1.1).toFixed(2)}s;--dur:1.4s">`,
    )}</div>`;
}

function card(name: string, w: number, h: number, dur: number, inner: string, css = ''): Scene {
  return {
    name,
    width: w,
    height: h,
    dur,
    body: `<div class="stage desk-surface"><div class="cc">${inner}</div></div>`,
    css,
  };
}

const L = { w: 1920, h: 1080 };
const P = { w: 1080, h: 1920 };

const SCENES: Scene[] = [
  // ── Ouverture : l'art clé vivant, lente approche, puis le titre dans le tiers calme ──
  {
    name: 'intro',
    width: L.w,
    height: L.h,
    dur: 7.4,
    css: `.art-wrap { position:absolute; inset:0; transform-origin: 46% 44%; }
      .scrim { position:absolute; inset:0; background: linear-gradient(to left, var(--scrim-art) 22%, transparent 58%); }
      .title-zone { position:absolute; right: 6.5%; top: 50%; transform: translateY(-50%); }`,
    body: `<div class="stage keyart-live" style="--idle-state: running">
      <div class="art-wrap anim" style="--k:push;--to:1.075;--dur:7.4s;--ease:cubic-bezier(.35,.1,.4,1)">${KEY}</div>
      <div class="scrim anim" style="--k:fade;--d:1.2s;--dur:2s"></div>
      <div class="title-zone">${title('8.6rem', 2.0)}</div>
    </div>`,
  },
  card(
    'c1',
    L.w,
    L.h,
    3.6,
    `<span class="mat-label red label anim" style="--k:stamp;--d:0.25s;--dur:.55s;--r:-3deg;font-size:1.6rem;margin-bottom:2.6rem">Office de Réinscription civile</span>
     <p class="card-text" style="font-size:6.4rem">${inked('Velmarche, automne', 0.65)} <em>${inked('1974.', 0.97)}</em></p>`,
  ),
  card(
    'c2',
    L.w,
    L.h,
    3.6,
    `<p class="card-text" style="font-size:5.6rem">
       <span class="line">${inked('Une famille entière', 0.25)}</span>
       <span class="line" style="position:relative;display:inline-block">${inked('effacée des registres.', 0.85)}
         <span class="strike anim" style="--k:sweep;--d:1.85s;--dur:.7s;--ease:cubic-bezier(.6,0,.2,1)"></span></span>
     </p>`,
  ),
  card(
    'c3',
    L.w,
    L.h,
    3.6,
    `<p class="card-text" style="font-size:5.4rem">
       <span class="line">${inked('Rendez-leur', 0.25)}</span>
       <span class="line"><span class="w anim" style="--k:ink;--d:.85s">un nom,</span> <span class="w anim" style="--k:ink;--d:1.3s">un visage,</span> <em class="w anim" style="--k:ink;--d:1.75s">un métier.</em></span>
     </p>`,
  ),
  card(
    'c4',
    L.w,
    L.h,
    3.3,
    `<p class="card-text" style="font-size:6rem">
       <span class="line">${inked('On ne devine pas.', 0.25, 0.14)}</span>
       <span class="line"><em>${inked('On déduit.', 1.25, 0.2)}</em></span>
     </p>`,
  ),
  {
    name: 'fin',
    width: L.w,
    height: L.h,
    dur: 10,
    css: `.end { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .tag { font-family: var(--font-display); font-style: italic; font-variation-settings: var(--display-settings);
        font-size: 2.9rem; color: var(--text); margin: 2.4rem 0 0.6rem; }
      .plat { font-family: var(--font-label); text-transform: uppercase; letter-spacing: 0.14em; font-size: 1.45rem; color: var(--text-muted); }
      .url { font-family: var(--font-type); font-weight: 700; font-size: 2.1rem; color: var(--accent); margin-top: 2.2rem; letter-spacing: 0.02em; }
      .house-row { position:absolute; bottom: 7.5%; left: 0; right: 0; display:flex; flex-direction:column; align-items:center; gap: 1rem; color: var(--text-muted); font-size: 24px; }
      .credit { margin: 0; font-family: var(--font-label); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.95rem; line-height: 1.5; text-align: center; color: var(--text-muted); }
      .house { gap: 3.2rem; }`,
    body: `<div class="stage desk-surface" style="--lamp-y: 30%"><div class="end">
      ${title('7.6rem', 0.3, true)}
      <p class="tag anim" style="--k:rise;--d:2.2s;--dur:1s">Gratuit sur itch.io</p>
      <p class="plat anim" style="--k:fade;--d:2.6s;--dur:1s;margin:0">Windows · macOS · Linux · Android · navigateur</p>
      <p class="url anim" style="--k:fade;--d:3.2s;--dur:1s">arbre.cardormedia.com</p>
      </div>
      <div class="house-row anim" style="--k:fade;--d:4.0s;--dur:1.2s">${houseLogos()}<p class="credit">Une production CARDOR Media · CM Interactive · CM Creative Lab</p></div>
    </div>`,
  },

  // ── Format vertical (stories) ──
  {
    name: 'v-intro',
    width: P.w,
    height: P.h,
    dur: 5,
    css: `.art-wrap { position:absolute; left:0; right:0; top:0; height: 1350px; transform-origin: 40% 30%; }
      .art-wrap::after { content:''; position:absolute; inset:0; background: linear-gradient(to bottom, transparent 62%, var(--canvas)); }
      .title-zone { position:absolute; left:0; right:0; bottom: 6%; display:flex; justify-content:center; }`,
    body: `<div class="stage keyart-live" style="--idle-state: running; background: var(--canvas)">
      <div class="art-wrap anim" style="--k:push;--to:1.07;--dur:5s">${KEY_TALL}</div>
      <div class="title-zone">${title('7.2rem', 1.0, true)}</div>
    </div>`,
  },
  card(
    'v-c2',
    P.w,
    P.h,
    3.3,
    `<span class="mat-label red label anim" style="--k:stamp;--d:0.2s;--dur:.55s;--r:-3deg;font-size:1.5rem;margin-bottom:3rem">Velmarche, 1974</span>
     <p class="card-text" style="font-size:5.6rem;padding:0 4rem">
       <span class="line">${inked('Une famille entière', 0.45)}</span>
       <span class="line" style="position:relative;display:inline-block">${inked('effacée des registres.', 1.0)}
         <span class="strike anim" style="--k:sweep;--d:1.9s;--dur:.7s;--ease:cubic-bezier(.6,0,.2,1)"></span></span>
     </p>`,
  ),
  {
    name: 'v-fin',
    width: P.w,
    height: P.h,
    dur: 6,
    css: `.end { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 0 3rem; }
      .tag { font-family: var(--font-display); font-style: italic; font-variation-settings: var(--display-settings); font-size: 3.4rem; color: var(--text); margin: 3rem 0 0.8rem; }
      .plat { font-family: var(--font-label); text-transform: uppercase; letter-spacing: 0.12em; font-size: 1.55rem; line-height: 1.5; color: var(--text-muted); margin: 0; }
      .url { font-family: var(--font-type); font-weight: 700; font-size: 2.4rem; color: var(--accent); margin-top: 2.6rem; }
      .house-row { position:absolute; bottom: 7%; left: 0; right: 0; display:flex; flex-direction:column; align-items:center; gap: 1rem; color: var(--text-muted); font-size: 24px; }
      .credit { margin: 0; font-family: var(--font-label); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.95rem; line-height: 1.5; text-align: center; color: var(--text-muted); }
      .house { gap: 2.6rem; }`,
    body: `<div class="stage desk-surface" style="--lamp-y: 32%"><div class="end">
      ${title('7.4rem', 0.2, true)}
      <p class="tag anim" style="--k:rise;--d:1.6s;--dur:1s">Gratuit sur itch.io</p>
      <p class="plat anim" style="--k:fade;--d:2.0s;--dur:1s">Windows · macOS · Linux<br>Android · navigateur</p>
      <p class="url anim" style="--k:fade;--d:2.5s;--dur:1s">arbre.cardormedia.com</p>
      </div>
      <div class="house-row anim" style="--k:fade;--d:3.0s;--dur:1.2s">${houseLogos()}<p class="credit">CARDOR Media · CM Interactive<br>CM Creative Lab</p></div>
    </div>`,
  },
];

const browser = await chromium.launch();
const pagesDir = ensureDir(join(WORK, 'pages'));
const clips = ensureDir(join(WORK, 'clips'));
try {
  for (const sc of SCENES) {
    if (only && !only.has(sc.name)) continue;
    const page = await browser.newPage({
      viewport: { width: sc.width, height: sc.height },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'dark' });
    const file = join(pagesDir, `${sc.name}.html`);
    writeFileSync(file, html({ body: sc.body, css: CSS + (sc.css ?? ''), title: sc.name }));
    await page.goto(pathToFileURL(file).href);
    await page.evaluate('document.fonts.ready.then(() => true)');
    await page.waitForTimeout(300);
    const dir = join(WORK, 'cards', sc.name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const n = Math.round(sc.dur * FPS);
    for (let i = 0; i < n; i++) {
      const ms = (i / FPS) * 1000;
      await page.evaluate(
        `document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ${ms}; })`,
      );
      await page.screenshot({
        path: join(dir, `f${String(i).padStart(5, '0')}.jpg`),
        type: 'jpeg',
        quality: 95,
        animations: 'allow',
      });
    }
    await page.close();
    ffmpeg(
      [
        '-framerate',
        String(FPS),
        '-i',
        join(dir, 'f%05d.jpg'),
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '12',
        '-pix_fmt',
        'yuv420p',
        join(clips, `${sc.name}.mp4`),
      ],
      { quiet: true },
    );
    console.log(`  ${sc.name} : ${sc.dur} s (${n} images)`);
  }
} finally {
  await browser.close();
}
