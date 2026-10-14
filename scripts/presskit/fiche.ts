/**
 * Fiche presse PDF (A4 portrait, deux pages, sur papier : imprimable) : en-tête sur l'art clé,
 * présentation courte, fiche technique, liens ; puis présentation longue, contenu du kit et
 * signature de la maison. Textes : apps/site/src/lib/content/press.ts (ceux de /presse/).
 */
import { join } from 'node:path';
import {
  PRESS_CREDITS,
  PRESS_FACTS,
  PRESS_HOOK,
  PRESS_LONG,
  PRESS_SHORT,
} from '../../apps/site/src/lib/content/press';
import {
  artSvg,
  ensureDir,
  houseLogos,
  html,
  load,
  OUT,
  prepareForPdf,
  rasterCrop,
  wordmark,
} from './lib';
import type { KitFile } from './manifest';

export const FICHE_FILE = 'arbre-aux-absents-fiche-presse.pdf';

const A4 = { width: Math.round((210 / 25.4) * 96), height: Math.round((297 / 25.4) * 96) };

const CSS = `
@page { size: 210mm 297mm; margin: 0; }
.pg { position: relative; width: 210mm; height: 297mm; overflow: hidden; break-after: page;
  background-color: var(--paper); color: var(--ink); font-family: var(--font-ui); }
.band { position: absolute; inset: 0 0 auto 0; height: 92mm; background-color: var(--canvas); overflow: hidden; isolation: isolate; }
.band .art { position: absolute; inset: 0; z-index: -2; }
.band::after { content: ''; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(to left, var(--canvas) 0%, color-mix(in oklch, var(--canvas) 85%, transparent) 40%, transparent 75%); }
.band .txt { position: absolute; right: 12mm; top: 50%; transform: translateY(-50%); display: grid; gap: 2.5mm; justify-items: start; }
.band .wm { --wm-size: 13.5mm; }
.band .label { font-size: 3mm; transform: rotate(-2deg); }
.body { position: absolute; left: 14mm; right: 14mm; top: 102mm; bottom: 18mm; display: grid; align-content: start; gap: 7mm; }
.kick { display: inline-flex; align-items: center; gap: 2mm; font-family: var(--font-label); font-weight: var(--weight-medium);
  text-transform: uppercase; letter-spacing: var(--tracking-stamp); font-size: 3mm; color: var(--ink-muted); }
.kick::before { content: ''; width: 6mm; height: 0.5mm; background: var(--brand); border-radius: 1mm; }
.short { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-weight: var(--weight-display);
  font-size: 6.4mm; line-height: var(--leading-snug); text-wrap: pretty; }
.short em { font-style: italic; color: var(--brand); }
.cols { display: grid; grid-template-columns: 1.1fr 1fr; gap: 9mm; align-items: start; }
.facts { padding: 2.5mm 6mm 4mm; box-shadow: var(--shadow-paper); --rule-gap: 6.2mm; --head-h: 10mm; }
.facts h3, .side h3 { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-size: 5mm;
  font-weight: var(--weight-display); }
.facts h3 { height: 6mm; margin-bottom: 7.5mm; }
.side h3 { line-height: var(--leading-snug); text-wrap: balance; }
.facts dl { margin: 0; }
.facts .row { display: grid; grid-template-columns: 34mm 1fr; gap: 3mm; line-height: 6.2mm; }
.facts dt { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp); font-size: 2.6mm; color: var(--brand); }
.facts dd { margin: 0; font-family: var(--font-type); font-size: 3mm; }
.side { display: grid; gap: 5mm; }
.side p, .prose p { font-family: var(--font-read); font-size: 3.5mm; line-height: var(--leading-read); }
.prose p + p { margin-top: 2.6mm; }
.links { display: grid; gap: 2mm; }
.links a, .links span { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  font-size: 3.4mm; color: var(--ink); text-decoration: none; }
.links .mat-label { font-size: 3.2mm; justify-self: start; transform: rotate(-2deg); color: var(--label-tape-text); }
.foot { position: absolute; left: 14mm; right: 14mm; bottom: 10mm; display: flex; align-items: center; justify-content: space-between;
  gap: 6mm; color: var(--ink-muted); border-top: 0.25mm solid var(--line); padding-top: 4mm; }
.foot .house { font-size: 3.4mm; }
.foot p { font-family: var(--font-read); font-size: 2.7mm; text-align: end; }
h2 { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-weight: var(--weight-display-black);
  line-height: var(--leading-display); letter-spacing: var(--tracking-display); font-size: 10mm; }
h2 em { font-style: italic; font-weight: var(--weight-display); color: var(--brand); }
.kit { list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 2.5mm 8mm; }
.kit li { font-family: var(--font-read); font-size: 3.2mm; line-height: 1.45; }
.kit b { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp); font-weight: var(--weight-medium); font-size: 2.9mm; color: var(--brand); display: block; }
`;

function foot(): string {
  return `<div class="foot">${houseLogos()}<p>${PRESS_CREDITS}<br>Dossier de presse · octobre 2026</p></div>`;
}

export async function buildFiche(): Promise<KitFile[]> {
  // Bandeau en JPEG : l'art clé vectoriel pèserait plus d'un méga-octet dans la fiche.
  const jpg = await rasterCrop(artSvg('art/keyart/keyart-desk.svg').markup, '0 180 1600 700', 1800);
  const art = `<img src="${jpg}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;object-position:left center">`;
  const short = PRESS_SHORT.replace('la Velmarche', '<em>la Velmarche</em>');
  const page1 = `<section class="pg" data-surface="paper">
<div class="band"><div class="art">${art}</div><div class="txt"><span class="mat-label red label">Dossier de presse</span>${wordmark()}</div></div>
<div class="body"><p class="kick">En une phrase</p><p class="short">${short}</p>
<div class="cols"><div class="facts mat-card"><h3>Fiche technique</h3><dl>${PRESS_FACTS.map(
    (f) => `<div class="row"><dt>${f.term}</dt><dd>${f.value}</dd></div>`,
  ).join('')}</dl></div>
<div class="side"><h3>« ${PRESS_HOOK} »</h3><p>${PRESS_LONG[1]}</p>
<div class="links"><span class="mat-label red">Gratuit sur itch.io</span><span>cardorinteractive.itch.io/arbre-aux-absents</span><span>arbre.cardormedia.com</span><span>Kit presse : arbre.cardormedia.com/presse/</span></div></div></div></div>
${foot()}</section>`;
  const page2 = `<section class="pg" data-surface="paper">
<div class="body" style="top:16mm"><p class="kick">Présentation</p><h2>Une famille entière <em>à rendre à ses noms</em></h2>
<div class="prose" style="max-width:160mm">${PRESS_LONG.map((p) => `<p>${p.replace('L’Arbre aux absents', '<em>L’Arbre aux absents</em>')}</p>`).join('')}</div>
<p class="kick">Points forts</p><ul class="kit">
<li><b>Déduction</b>Les réponses de l’arbre ne se valident que par groupes : on ne devine pas, on déduit.</li>
<li><b>Archives libres</b>Lettres, actes, photographies, presse, annuaires : aucun ordre imposé.</li>
<li><b>Un pays imaginaire</b>La Velmarche en 1974, sa carte gravée et aquarellée, ses lieux à visiter.</li>
<li><b>Gravure et aquarelle</b>Une trentaine de portraits et des dizaines de documents illustrés.</li>
<li><b>Rejouer</b>Secrets annexes qui changent le dénouement, succès, mode chronométré.</li>
<li><b>Accessible</b>Clavier complet, police de lisibilité, contraste élevé, mouvement réduit.</li></ul>
<p class="kick">Dans le kit presse</p><ul class="kit">
<li><b>Logos</b>Titre du jeu en quatre teintes (SVG, PNG), emblème carré.</li>
<li><b>Affiches</b>Trois affiches A3 (PDF pour l’impression, PNG).</li>
<li><b>Bannières</b>itch.io, X, Facebook, YouTube, Twitch, partage de lien, carré, story.</li>
<li><b>Artbook</b>Art clé, carte, vignettes, portraits et intention artistique (PDF).</li></ul>
<p class="kick">Contact presse</p><p style="font-family:var(--font-read);font-size:3.4mm">Publié sur arbre.cardormedia.com/presse/. Merci de ne révéler aucun nom, secret ni dénouement de l’enquête.</p></div>
${foot()}</section>`;
  const doc = html({ body: page1 + page2, css: CSS, title: 'Fiche presse' });
  const p = await load('fiche', doc, A4);
  await prepareForPdf(p);
  const out = ensureDir(join(OUT, FICHE_FILE));
  await p.pdf({ path: out, width: '210mm', height: '297mm', printBackground: true });
  await p.close();
  return [
    {
      group: 'documents',
      path: FICHE_FILE,
      label: 'Fiche presse : présentation courte et longue, fiche technique, liens',
      format: 'PDF',
      detail: 'A4 portrait, 2 pages, imprimable',
    },
  ];
}
