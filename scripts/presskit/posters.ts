/**
 * Affiches A3 portrait (297 × 420 mm) : PDF vectoriel pour l'impression et PNG à 300 dpi.
 * Trois variantes : le bureau sous la lampe (nuit), la carte de la Velmarche (papier), la galerie
 * des visages (nuit). Mise en page en millimètres ; couleurs et polices par tokens.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { PRESS_CREDITS, PRESS_HOOK } from '../../apps/site/src/lib/content/press';
import { PORTRAIT_PLATES } from '../../apps/site/src/lib/content/portraits';
import {
  artSvg,
  ensureDir,
  houseLogos,
  html,
  load,
  mapSvg,
  OUT,
  portraitSvg,
  noGrain,
  prepareForPdf,
  wordmark,
} from './lib';
import type { KitFile } from './manifest';

/** PNG : 150 dpi en A3 (soit 300 dpi en A4) ; le PDF vectoriel sert à l'impression. */
const DPI = 150;
/** A3 en px CSS (96 px par pouce). */
const A3 = { width: Math.round((297 / 25.4) * 96), height: Math.round((420 / 25.4) * 96) };

/** Pied commun : l'appel (gratuit sur itch.io), les adresses, la signature de la maison. */
export function posterFoot(): string {
  return `<footer class="foot">
  <div class="cta">
    <span class="mat-label red free">Gratuit sur itch.io</span>
    <span class="urls"><b>arbre.cardormedia.com</b><span>cardorinteractive.itch.io/arbre-aux-absents</span></span>
  </div>
  <p class="plat">Windows · macOS · Linux · Android · navigateur</p>
  <div class="sign">${houseLogos()}<p class="credits">${PRESS_CREDITS}</p></div>
</footer>`;
}

const CSS = `
@page { size: 297mm 420mm; margin: 0; }
.poster { position: relative; width: 297mm; height: 420mm; overflow: hidden; isolation: isolate;
  background-color: var(--canvas); color: var(--text); font-family: var(--font-ui); }
.kick { font-family: var(--font-label); font-weight: var(--weight-medium); text-transform: uppercase;
  letter-spacing: var(--tracking-stamp); font-size: 5.2mm; color: var(--text-muted);
  display: inline-flex; align-items: center; gap: 3mm; }
.kick::before { content: ''; width: 9mm; height: 0.7mm; background: var(--brand); border-radius: 1mm; }
.hook { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-style: italic; font-weight: 400; font-size: 8.4mm; line-height: var(--leading-snug);
  color: var(--text-muted); max-width: 240mm; text-wrap: balance; }
.foot { position: absolute; left: 20mm; right: 20mm; bottom: 16mm; display: grid; gap: 6mm; }
.cta { display: flex; align-items: center; justify-content: space-between; gap: 8mm; }
.free { font-size: 6.4mm; padding: 1.6mm 4.4mm 1.3mm; transform: rotate(-2deg); }
.urls { display: grid; justify-items: end; gap: 1mm; font-family: var(--font-label);
  letter-spacing: var(--tracking-stamp); text-transform: uppercase; font-size: 4mm; color: var(--text-muted); }
.urls b { font-weight: var(--weight-medium); font-size: 6.2mm; color: var(--text); }
.plat { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  font-size: 3.6mm; color: var(--text-muted); border-block: 0.3mm solid var(--line); padding-block: 2.4mm; }
.sign { display: flex; align-items: center; justify-content: space-between; gap: 8mm; color: var(--text-muted); }
.sign .house { font-size: 4.4mm; }
.credits { font-family: var(--font-read); font-size: 3.4mm; text-align: end; max-width: 150mm; }

/* 1. Le bureau sous la lampe */
.desk .keyart { position: absolute; inset: 0 0 auto 0; height: 318mm;
  -webkit-mask: linear-gradient(to bottom, #000 58%, transparent 90%);
  mask: linear-gradient(to bottom, #000 58%, transparent 90%); }
.desk .keyart svg { width: 100%; height: 100%; display: block; }
.desk .title { position: absolute; left: 20mm; right: 20mm; top: 268mm; display: grid;
  justify-items: center; gap: 5mm; text-align: center; }
.desk .title .wm { --wm-size: 29mm; }
.desk .title::before { content: ''; position: absolute; inset: -30mm -40mm -10mm; z-index: -1;
  background: radial-gradient(closest-side, var(--canvas) 55%, transparent); opacity: 0.9; }

/* 2. La carte */
.map-poster { background-color: var(--paper); }
.map-poster .head { position: absolute; left: 22mm; right: 22mm; top: 24mm; display: grid;
  justify-items: center; gap: 5mm; text-align: center; }
.map-poster .head .wm { --wm-size: 28mm; }
.map-poster .print { position: absolute; left: 18mm; right: 18mm; top: 128mm; padding: 4mm;
  background: var(--paper-new, var(--paper)); box-shadow: var(--shadow-paper); transform: rotate(-0.8deg); }
.map-poster .print svg { display: block; width: 100%; height: auto; }
.map-poster .tape { position: absolute; --tape-w: 34mm; --tape-h: 9mm; }
.map-poster .tape.a { left: -6mm; top: -3mm; --tape-r: -38deg; }
.map-poster .tape.b { right: -6mm; top: -3mm; --tape-r: 36deg; }
.map-poster .note { position: absolute; left: 30mm; right: 30mm; top: 332mm; text-align: center;
  font-family: var(--font-read); font-size: 4.6mm; line-height: var(--leading-read); color: var(--ink-muted, var(--text-muted)); }

/* 3. La galerie des visages */
.faces .head { position: absolute; left: 20mm; right: 20mm; top: 20mm; display: grid; justify-items: center; }
.faces .grid { position: absolute; left: 50mm; right: 50mm; top: 34mm; display: grid;
  grid-template-columns: repeat(3, 1fr); gap: 6mm 8mm; }
.faces .plate { padding: 3mm 3mm 2mm; box-shadow: var(--shadow-paper); }
.faces .plate svg { display: block; width: 100%; height: auto; }
.faces .plate p { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  font-size: 3.2mm; text-align: center; padding-top: 1.6mm; color: var(--ink-muted, var(--ink)); }
.faces .title { position: absolute; left: 20mm; right: 20mm; top: 290mm; display: grid;
  justify-items: center; gap: 3mm; text-align: center; }
.faces .title .wm { --wm-size: 25mm; }
.faces .title .hook { font-size: 7mm; }
`;

function deskPoster(): string {
  const art = artSvg('art/keyart/keyart-desk-tall.svg', {
    preserveAspectRatio: 'xMidYMin slice',
  }).markup;
  return `<main class="poster desk desk-surface"><div class="keyart">${art}</div>
<div class="title"><span class="mat-label red kick-label" style="font-size:5mm">Un jeu d’enquête généalogique</span>
${wordmark({ stacked: false, center: true })}<p class="hook">${PRESS_HOOK.replace('1974. ', '1974.<br>')}</p></div>${posterFoot()}</main>`;
}

function mapPoster(): string {
  return `<main class="poster map-poster" data-surface="paper"><div class="head">
<p class="kick">Un jeu d’enquête généalogique</p>${wordmark({ stacked: false, center: true })}
<p class="hook">Une enquête dans un pays imaginaire&nbsp;: la Velmarche.</p></div>
<div class="print"><span class="mat-tape tape a"></span><span class="mat-tape tape b"></span>${mapSvg()}</div>
<p class="note">Lettres, registres, photographies et coupures de presse&nbsp;: reconstituez l’arbre d’une famille sur quatre générations, lieu après lieu.</p>
${posterFoot()}</main>`;
}

function facesPoster(): string {
  const tilts = [-1.2, 0.8, -0.4, 1, -0.9, 0.5, -0.6, 1.2, -1];
  const plates = PORTRAIT_PLATES.map(
    (p, i) =>
      `<figure class="plate mat-paper" data-surface="paper" style="transform: rotate(${tilts[i] ?? 0}deg)">${portraitSvg(
        p.person,
      )}<p>Planche ${p.plate}</p></figure>`,
  ).join('');
  return `<main class="poster faces desk-surface"><div class="head"><p class="kick">Qui sont les absents&nbsp;?</p></div>
<div class="grid">${plates}</div>
<div class="title">${wordmark({ stacked: false, center: true })}<p class="hook">${PRESS_HOOK.replace('1974. ', '1974.<br>')}</p></div>
${posterFoot()}</main>`;
}

const POSTERS = [
  { id: 'bureau', label: 'Affiche « Le bureau sous la lampe » (art clé)', body: deskPoster },
  { id: 'carte', label: 'Affiche « La Velmarche » (carte, sur papier)', body: mapPoster },
  { id: 'visages', label: 'Affiche « Qui sont les absents ? » (portraits)', body: facesPoster },
];

export async function buildPosters(): Promise<KitFile[]> {
  rmSync(join(OUT, 'affiches'), { recursive: true, force: true });
  const files: KitFile[] = [];
  for (const p of POSTERS) {
    const name = `arbre-aux-absents-affiche-${p.id}-a3`;
    const doc = html({ body: p.body(), css: CSS, title: p.label });
    const pdfPage = await load(name, doc, A3);
    await prepareForPdf(pdfPage);
    const pdf = ensureDir(join(OUT, 'affiches', `${name}.pdf`));
    await pdfPage.pdf({ path: pdf, width: '297mm', height: '420mm', printBackground: true });
    await pdfPage.close();
    files.push({
      group: 'affiches',
      path: `affiches/${name}.pdf`,
      label: p.label,
      format: 'PDF',
      detail: 'A3 portrait, vectoriel, pour l’impression',
    });
    const scale = DPI / 96;
    const png = await load(name, doc, A3, scale);
    await noGrain(png);
    const out = join(OUT, 'affiches', `${name}.png`);
    await png.screenshot({ path: out, clip: { x: 0, y: 0, ...A3 } });
    await png.close();
    files.push({
      group: 'affiches',
      path: `affiches/${name}.png`,
      label: p.label,
      format: 'PNG',
      detail: `${Math.round(A3.width * scale)} × ${Math.round(A3.height * scale)} px (A3 à 150 dpi, A4 à 300 dpi)`,
    });
  }
  return files;
}
