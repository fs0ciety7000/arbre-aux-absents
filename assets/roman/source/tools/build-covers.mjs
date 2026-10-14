/**
 * Couvertures du roman « L'Arbre aux absents » (CM Publishing) : pages HTML en millimètres,
 * rendues par shot.mjs (PNG 300 dpi, JPEG ebook, PDF vectoriel).
 *
 *   node tools/build-covers.mjs <dossier art SVG> <dossier html>
 *
 * Couleurs : tokens du design system du jeu (tokens.css) et classes d'art (art.css) uniquement.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [artDir, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const ROOT = '/home/user/arbre-aux-absents';
const tokens = readFileSync(`${ROOT}/packages/ui/src/styles/tokens.css`, 'utf8');
const artCss = readFileSync(`${ROOT}/packages/ui/src/styles/art.css`, 'utf8');
const artDefs = /<svg[\s\S]*?<\/svg>/
  .exec(readFileSync(`${ROOT}/packages/ui/src/primitives/ArtDefs.svelte`, 'utf8'))[0]
  .replace('class="art defs"', 'class="art defs" style="position:absolute;width:0;height:0"');
const art = (name, par = 'xMidYMid slice') =>
  readFileSync(`${artDir}/${name}.svg`, 'utf8')
    .trim()
    .replace('<svg ', `<svg preserveAspectRatio="${par}" aria-hidden="true" `);

/* ── Textes ─────────────────────────────────────────────── */
const AUTHOR = 'Nicolas Dessenius';
const PUBLISHER = 'CM Publishing';
const DEFAULT_TITLE = { lines: ['L’<span class="kA">A</span>rbre aux absents'], plain: 'L’<span class="kA">A</span>rbre aux absents' };
const KICKER = 'Une famille effacée des registres.';
const BLURB = [
  'Velmarche, octobre 1974. À Moulinvert, au bord des pa&shy;pe&shy;te&shy;ries qui ont fait la fortune des siens, une vieille ins&shy;ti&shy;tu&shy;trice s’éteint à quatre-vingt-quatorze ans. Son tes&shy;ta&shy;ment tient en deux vo&shy;lon&shy;tés&nbsp;: tout léguer aux des&shy;cen&shy;dants vivants de son père et de son oncle, et demander à l’État de ré&shy;ins&shy;crire «&#8239;ceux que nous avons rendus absents&#8239;».',
  'Pendant quinze ans, la Ré&shy;gence a rayé des re&shy;gis&shy;tres des mil&shy;liers de noms. Une loi nouvelle permet enfin de les y remettre, à condition de le prouver. À l’Office de Ré&shy;ins&shy;crip&shy;tion civile, le dossier n<sup>o</sup>&#8239;74-0318 échoue sur un bureau de sta&shy;giaire&nbsp;: un arbre de trente cases vides, cinq semaines, et une mon&shy;tagne de pa&shy;piers. Lettres, actes, pho&shy;to&shy;gra&shy;phies sans lé&shy;gende, coupures de presse&nbsp;jaunies.',
  'Sous la lampe, case après case, il faudra rendre à chacun un nom, un visage, un métier. Et com&shy;prendre pour&shy;quoi certains noms ont été effacés avec tant de soin.',
];

/* ── Marque de l'éditeur : losange double, « cm » italique ── */
function emblem(size = 10, { tone = 'ink' } = {}) {
  return `<svg class="emblem emblem-${tone}" viewBox="0 0 40 40" width="${size}mm" height="${size}mm" aria-hidden="true">
  <path d="M20 1.5 38.5 20 20 38.5 1.5 20Z" fill="none" stroke="currentColor" stroke-width="1.1"/>
  <path d="M20 4.6 35.4 20 20 35.4 4.6 20Z" fill="none" stroke="currentColor" stroke-width="0.45"/>
  <text x="20" y="24.2" text-anchor="middle" class="emblem-cm">cm</text>
  <path d="M15.2 28.2h9.6" stroke="currentColor" stroke-width="0.45"/>
</svg>`;
}
function imprint({ tone = 'ink', size = 9, stacked = true } = {}) {
  return `<div class="imprint imprint-${tone}${stacked ? '' : ' imprint-row'}">${emblem(size, { tone })}<span class="imprint-name">${PUBLISHER}</span></div>`;
}

/* ── CSS commun ─────────────────────────────────────────── */
const FONTS = `
@font-face{font-family:'Fraunces';font-style:normal;font-weight:100 900;src:url('../fonts/fraunces-latin-full-normal.woff2') format('woff2')}
@font-face{font-family:'Fraunces';font-style:italic;font-weight:100 900;src:url('../fonts/fraunces-latin-full-italic.woff2') format('woff2')}
@font-face{font-family:'Literata';font-style:normal;font-weight:200 900;src:url('../fonts/literata-latin-opsz-normal.woff2') format('woff2')}
@font-face{font-family:'Literata';font-style:italic;font-weight:200 900;src:url('../fonts/literata-latin-wght-italic.woff2') format('woff2')}`;

const BASE = `
${FONTS}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
:root{color-scheme:light}
html{background:var(--paper)}
body{position:relative;overflow:hidden;background:var(--paper);color:var(--ink);
  font-family:'Literata',Georgia,serif;font-optical-sizing:auto;-webkit-font-smoothing:antialiased;
  font-kerning:normal;font-feature-settings:'kern','liga','onum';hyphens:auto}
.panel{position:absolute;overflow:hidden}
.author{font-family:'Literata';font-weight:500;text-transform:uppercase;letter-spacing:.26em;
  font-size:8.4pt;line-height:1;margin:0;text-align:center;font-variation-settings:'opsz' 12}
.title{font-family:'Fraunces';font-weight:380;font-size:28pt;line-height:1.02;margin:0;text-align:center;
  letter-spacing:-.006em;font-variation-settings:'opsz' 144,'SOFT' 40,'WONK' 0}
.title .l{display:block}
.genre{font-family:'Literata';font-style:italic;font-weight:400;font-size:10.5pt;margin:0;letter-spacing:.02em}
.rule{width:12mm;height:0;border-top:.3mm solid var(--raw-vermilion-700)}
.emblem{display:block;color:var(--ink)}
.emblem-cm{font-family:'Fraunces';font-style:italic;font-weight:500;font-size:14px;fill:currentColor;
  font-variation-settings:'opsz' 72,'SOFT' 100,'WONK' 1}
.emblem-vellum{color:var(--raw-vellum-100)}
.imprint{display:flex;flex-direction:column;align-items:center;gap:1.4mm}
.imprint-row{flex-direction:row;gap:2.2mm}
.imprint-name{font-family:'Literata';font-weight:500;font-size:6.6pt;letter-spacing:.3em;text-transform:uppercase;
  font-variation-settings:'opsz' 9;padding-left:.3em}
.imprint-vellum{color:var(--raw-vellum-100)}
svg.art{display:block;width:100%;height:100%}
.kA{margin-left:.035em}
`;

/* ── Faces ──────────────────────────────────────────────── */
function titleHtml(t, cls = 'title') {
  return `<h1 class="${cls}">${t.lines.map((l) => `<span class="l">${l}</span>`).join('')}</h1>`;
}

/** Direction A « Fenêtre » : papier crème, gravure encadrée en médaillon rectangulaire. */
function frontA(t) {
  return {
    css: `
.fa{display:flex;flex-direction:column;align-items:center;padding:12.5mm 13mm 10.5mm;background:var(--paper)}
.fa .author{margin-top:.6mm}
.fa .title{margin-top:5.2mm}
.fa .genre{margin-top:2.2mm;color:var(--raw-vermilion-700)}
.fa .plate{flex:1 1 auto;width:100%;margin-top:6.5mm;border:.55mm solid var(--ink);padding:1.1mm;min-height:0}
.fa .plate-in{width:100%;height:100%;border:.18mm solid var(--ink);padding:1.3mm;background:var(--paper-new)}
.fa .plate-art{width:100%;height:100%;overflow:hidden;outline:.18mm solid var(--ink-muted)}
.fa .imprint{margin-top:5.6mm}
${t.small ? '.fa .title{font-size:21pt}' : ''}`,
    html: `<div class="author">${AUTHOR}</div>${titleHtml(t)}<p class="genre">roman</p>
<div class="plate"><div class="plate-in"><div class="plate-art">${art('roman-tilleul', 'xMidYMid slice')}</div></div></div>
${imprint({ size: 8.2 })}`,
    cls: 'fa',
  };
}

/** Direction B « Nocturne » : illustration pleine page, bureau la nuit. */
function frontB(t) {
  return {
    css: `
html{background:var(--raw-night-950)}
.fb{background:var(--raw-night-950);color:var(--raw-vellum-100)}
.fb .bg{position:absolute;inset:0}
.fb .txt{position:absolute;left:0;right:0;top:15mm;display:flex;flex-direction:column;align-items:center}
.fb .title{margin-top:5mm;font-size:30pt;color:var(--raw-vellum-100)}
.fb .genre{margin-top:2.4mm;color:var(--raw-brass-300)}
.fb .rule{margin-top:4.5mm;border-color:var(--raw-brass-400)}
.fb .imprint{position:absolute;left:0;right:0;bottom:9mm}`,
    html: `<div class="bg">${art('roman-nocturne', 'xMidYMid slice')}</div>
<div class="txt"><div class="author">${AUTHOR}</div>${titleHtml(t)}<p class="genre">roman</p><div class="rule"></div></div>
${imprint({ tone: 'vellum', size: 8.2 })}`,
    cls: 'fb',
    bleedBg: true,
  };
}

/** Direction C « Blanche » : couverture typographique à double filet, vignette gravée. */
function frontC(t) {
  return {
    css: `
.fc{background:var(--paper)}
.fc .frame{position:absolute;inset:8mm;border:.5mm solid var(--raw-vermilion-700)}
.fc .frame::after{content:'';position:absolute;inset:1.1mm;border:.2mm solid var(--ink)}
.fc .in{position:absolute;inset:8mm;display:flex;flex-direction:column;align-items:center;padding:16mm 10mm 11mm}
.fc .title{margin-top:7mm;font-size:30pt}
.fc .genre{margin-top:3mm;color:var(--raw-vermilion-700)}
.fc .vig{flex:1 1 auto;width:84mm;display:flex;align-items:center;min-height:0}
.fc .vig svg{height:auto;max-height:100%}
.fc .imprint{margin-top:2mm}`,
    html: `<div class="frame"></div><div class="in"><div class="author">${AUTHOR}</div>${titleHtml(t)}<p class="genre">roman</p>
<div class="vig">${art('roman-rameau', 'xMidYMid meet')}</div>${imprint({ size: 8.2 })}</div>`,
    cls: 'fc',
  };
}

/** Quatrième de couverture (direction A). */
function backA() {
  return {
    css: `
.ba{display:flex;flex-direction:column;padding:15mm 16mm 11mm;background:var(--paper)}
.ba .kicker{font-family:'Fraunces';font-style:italic;font-weight:400;font-size:15pt;line-height:1.15;text-align:center;
  margin:0;font-variation-settings:'opsz' 72,'SOFT' 50,'WONK' 0}
.ba .rule{margin:5mm auto 5.5mm}
.ba .blurb p{font-size:9.6pt;line-height:1.5;margin:0;text-align:justify;text-indent:5mm;hyphenate-limit-chars:7 3 3;
  font-variation-settings:'opsz' 10;widows:2;orphans:2}
.ba .blurb p:first-child{text-indent:0}
.ba .blurb p+p{margin-top:1.4mm}
.ba .blurb sup{font-size:.62em;line-height:0}
.ba .vig{flex:1 1 auto;display:flex;align-items:center;justify-content:center;min-height:0;padding:3mm 0}
.ba .vig svg{width:46mm;height:auto;max-height:100%}
.ba .foot{display:flex;align-items:flex-end;justify-content:space-between}
.ba .credits{display:flex;flex-direction:column;gap:2.4mm}
.ba .credits small{font-size:6.2pt;font-style:italic;color:var(--ink-muted);letter-spacing:.01em}
.ba .ean{width:38mm;height:22mm;background:var(--raw-paper-new);border:.2mm solid var(--ink-muted);
  display:flex;align-items:center;justify-content:center;font-size:7pt;letter-spacing:.06em;color:var(--ink-muted)}
.ba .ean{background:white}`,
    html: `<p class="kicker">${KICKER}</p><div class="rule"></div>
<div class="blurb">${BLURB.map((p) => `<p>${p}</p>`).join('')}</div>
<div class="vig">${art('roman-rameau', 'xMidYMid meet')}</div>
<div class="foot"><div class="credits">${imprint({ size: 7.4, stacked: false })}<small>Illustration de couverture&nbsp;: CM Creative Lab</small></div>
<div class="ean">ISBN à venir</div></div>`,
    cls: 'ba',
  };
}

/** Dos (direction A) : lecture de bas en haut (usage français), marque en pied. */
function spineA(t, spineH) {
  return {
    css: `
.sa{background:var(--paper);border-left:.15mm solid transparent}
.sa .rot{position:absolute;left:50%;top:50%;width:${spineH}mm;height:20mm;transform:translate(-50%,-50%) rotate(-90deg);
  display:flex;align-items:center;justify-content:center;padding:0 16mm 0 34mm;gap:7mm}
.sa .s-author{font-family:'Literata';font-weight:500;font-size:7.6pt;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap}
.sa .s-dot{width:1.2mm;height:1.2mm;background:var(--raw-vermilion-700);transform:rotate(45deg);flex:none}
.sa .s-title{font-family:'Fraunces';font-weight:400;font-size:${t.small ? 11 : 15}pt;white-space:nowrap;
  font-variation-settings:'opsz' 72,'SOFT' 40,'WONK' 0}
.sa .s-mark{position:absolute;left:0;right:0;bottom:11mm;display:flex;justify-content:center}`,
    html: `<div class="rot"><span class="s-author">${AUTHOR}</span><span class="s-dot"></span><span class="s-title">${t.plain}</span></div>
<div class="s-mark">${emblem(9)}</div>`,
    cls: 'sa',
  };
}

/* ── Assemblage ─────────────────────────────────────────── */
function page({ W, H, panels, title = 'Couverture' }) {
  const css = [BASE, ...panels.map((p) => p.face.css)].join('\n');
  const body = panels
    .map(
      (p) =>
        `<section class="panel ${p.face.cls}" style="left:${p.x}mm;top:${p.y}mm;width:${p.w}mm;height:${p.h}mm">${p.face.html}</section>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<style>${tokens}
${artCss}
@page{size:${W + 1}mm ${H + 1}mm;margin:0}
html,body{width:${W + 1}mm;height:${H + 1}mm}
${css}</style></head>
<body>${artDefs}
${body}
</body></html>
`;
}

const TRIM = { w: 140, h: 210 };
const B = 3;
const SPINE = 20;

/** Face seule : bleed = 0 (ebook/en ligne) ou 3 mm (impression). Le fond déborde dans le fond perdu. */
function front(face, { bleed = 0, w = TRIM.w, h = TRIM.h } = {}) {
  const W = w + 2 * bleed;
  const H = h + 2 * bleed;
  const f = bleed ? { ...face, css: `${face.css}\n${bleedFix(face, bleed)}` } : face;
  return page({ W, H, panels: [{ x: 0, y: 0, w: W, h: H, face: f }] });
}
/** Ajustements de fond perdu par direction (positions absolues décalées de `b`). */
function bleedFix(face, b) {
  if (face.cls === 'fa') return `.fa{padding:${12.5 + b}mm ${13 + b}mm ${10.5 + b}mm}`;
  if (face.cls === 'fb') return `.fb .txt{top:${15 + b}mm}.fb .imprint{bottom:${9 + b}mm}`;
  if (face.cls === 'fc') return `.fc .frame,.fc .in{inset:${8 + b}mm}`;
  return '';
}

function wrap(t, { bleed = B } = {}) {
  const W = 2 * TRIM.w + SPINE + 2 * bleed;
  const H = TRIM.h + 2 * bleed;
  const b = bleed;
  const back = backA();
  const spine = spineA(t, H);
  const fr = frontA(t);
  return page({
    W,
    H,
    title: 'Couverture complète',
    panels: [
      { x: 0, y: 0, w: TRIM.w + b, h: H, face: { ...back, css: `${back.css}\n.ba{padding:${15 + b}mm 16mm ${11 + b}mm ${16 + b}mm}` } },
      { x: TRIM.w + b, y: 0, w: SPINE, h: H, face: spine },
      { x: TRIM.w + b + SPINE, y: 0, w: TRIM.w + b, h: H, face: { ...fr, css: `${fr.css}\n.fa{padding:${12.5 + b}mm ${13 + b}mm ${10.5 + b}mm 13mm}` } },
    ],
  });
}

/* ── Sorties ────────────────────────────────────────────── */
const ALT = {
  lines: ['Ceux que nous', 'avons rendus absents'],
  plain: 'Ceux que nous avons rendus absents',
  small: true,
};
const out = (n, s) => writeFileSync(`${outDir}/${n}.html`, s);
out('front-A', front(frontA(DEFAULT_TITLE)));
out('front-B', front(frontB(DEFAULT_TITLE)));
out('front-C', front(frontC(DEFAULT_TITLE)));
out('front-A-bleed', front(frontA(DEFAULT_TITLE), { bleed: B }));
{
  // ebook : lisible en vignette de librairie (titre et auteur agrandis)
  const fe = frontA(DEFAULT_TITLE);
  fe.css += '\n.fa .title{font-size:35pt}.fa .author{font-size:10.4pt}.fa .genre{font-size:13pt}.fa .imprint .imprint-name{font-size:7.6pt}';
  out('front-A-ebook', front(fe, { h: 224 }));
}
out('wrap-A', wrap(DEFAULT_TITLE));
out('front-A-titre-alt', front(frontA(ALT)));
console.log('ok');
