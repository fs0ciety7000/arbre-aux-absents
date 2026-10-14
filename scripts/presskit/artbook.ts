/**
 * Artbook PDF (A4 paysage) : l'art clé, ses détails, la palette, les polices, les matières, la
 * carte de la Velmarche et ses détails, les vignettes d'aquarelle, les portraits, quelques
 * documents illustrés et les ornements, avec l'intention artistique (textes de /artbook/ et
 * /charte/). Aucun nom de personnage, aucun secret, aucune fin de l'affaire.
 */
import { join } from 'node:path';
import { PRESS_CREDITS } from '../../apps/site/src/lib/content/press';
import { PORTRAIT_PLATES } from '../../apps/site/src/lib/content/portraits';
import { ICONS, type IconName } from '../../packages/ui/src/primitives/icons';
import { ORNAMENTS, type OrnamentName } from '../../packages/ui/src/primitives/ornaments';
import {
  artSvg,
  ensureDir,
  houseLogos,
  html,
  load,
  mapSvg,
  oklchToHex,
  OUT,
  portraitSvg,
  prepareForPdf,
  rasterCrop,
  tokenValue,
  wordmark,
} from './lib';
import type { KitFile } from './manifest';

export const ARTBOOK_FILE = 'arbre-aux-absents-artbook.pdf';

const A4L = { width: Math.round((297 / 25.4) * 96), height: Math.round((210 / 25.4) * 96) };

const SPOTS: { name: string; title: string; text: string }[] = [
  {
    name: 'tree',
    title: 'L’arbre aux médaillons',
    text: 'L’arbre vide, ses médaillons dorés en attente d’un visage.',
  },
  {
    name: 'archives',
    title: 'Le carton d’archives',
    text: 'Couvercle de biais, dossiers à onglets, étiquette « Fonds ».',
  },
  {
    name: 'lighthouse',
    title: 'Le phare de Tennok',
    text: 'Phare blanc à bande rouge, maison du gardien et récif des Dents.',
  },
  {
    name: 'catalogue',
    title: 'Le meuble à fiches',
    text: 'Tiroir tiré, fiches à onglets de couleur, porte-étiquette.',
  },
  {
    name: 'letter',
    title: 'La lettre à la fougère',
    text: 'Enveloppe, cachet de cire à la fougère, timbre oblitéré.',
  },
  { name: 'stamp', title: 'Le tampon de bois', text: 'Tampon, boîte d’encre et fiche « Établi ».' },
  {
    name: 'magnifier',
    title: 'La loupe',
    text: 'Une loupe sur une photographie de maison, sans visage.',
  },
  {
    name: 'register',
    title: 'Le registre cadenassé',
    text: 'Cuir à coins de laiton, chaîne et cadenas.',
  },
  {
    name: 'map-pin',
    title: 'La carte épinglée',
    text: 'La Velmarche roulée, épingles et fil rouge.',
  },
  {
    name: 'fern',
    title: 'La fougère d’herbier',
    text: 'Le motif de l’histoire, pressé sur une planche.',
  },
];

/** Détails de la carte (unités du viewBox 1350 × 1000), légendes de /artbook/. */
const MAP_DETAILS = [
  {
    title: 'Le cartouche',
    viewBox: '20 815 370 180',
    text: 'Double filet, titre en capitales, mention du graveur : la carte se présente comme un document officiel de 1974.',
  },
  {
    title: 'La rose des vents',
    viewBox: '25 185 125 140',
    text: 'Cercles à la plume, aiguille pleine au nord : le seul ornement de la marge ouest.',
  },
  {
    title: 'Le cap de Tennok',
    viewBox: '150 15 270 170',
    text: 'Un phare blanc à bande rouge sur la pointe nord-ouest, et les courbes de niveau de la mer Grise.',
  },
  {
    title: 'Aubrelieu',
    viewBox: '560 470 270 190',
    text: 'La capitale en vignette : dôme, remparts et toits au lavis carmin, l’Orvelle en ruban céladon.',
  },
  {
    title: 'La Clairette et le lac d’Aulne',
    viewBox: '730 600 280 280',
    text: 'Cheminées, roues à aubes et un lac aux eaux claires : la vallée de la Clairette au pied des collines.',
  },
  {
    title: 'Les monts Corvins',
    viewBox: '1000 640 350 360',
    text: 'Le relief est gravé à la hachure, la frontière thalbère tracée en lavis carmin.',
  },
];

/** Détails de l'art clé (viewBox 1600 × 900). */
const KEY_DETAILS = [
  {
    title: 'La lampe de laiton',
    viewBox: '560 110 480 360',
    text: 'Le cône de lumière en cinq voiles, la flaque de lavis safran, les poussières dans le faisceau.',
  },
  {
    title: 'La fenêtre au crépuscule',
    viewBox: '40 20 440 330',
    text: 'Les toits d’Aubrelieu, le dôme de l’Opéra, la Citadelle sur sa colline et les premières fenêtres allumées.',
  },
  {
    title: 'L’herbier et la loupe',
    viewBox: '880 440 480 360',
    text: 'La fougère pressée, la loupe dont le verre grossit le phare d’une photographie.',
  },
];

/** Documents du jeu montrés (choisis sans personnage ni indice). */
const DOCUMENTS = [
  {
    file: 'cp-02',
    title: 'Carte postale, 1930',
    text: 'Le phare et les Dents de Tennok : carte photographique, lavis d’eau sur la mer.',
  },
  {
    file: 'cp-03',
    title: 'Carte postale, vers 1970',
    text: 'Un palais administratif d’Aubrelieu au bord du fleuve, couleurs « passées ».',
  },
  {
    file: 'pb-03',
    title: 'Affiche, années vingt',
    text: 'Aplats stylisés : une lanterne de marin sur la mer sombre, un phare au loin.',
  },
];

const SWATCHES: { token: string; name: string; role: string }[] = [
  { token: '--canvas', name: 'Encre de nuit', role: 'Fond du bureau' },
  { token: '--text', name: 'Vélin', role: 'Texte sous la lampe' },
  { token: '--accent', name: 'Safran', role: 'L’action, la lumière' },
  { token: '--brand', name: 'Vermillon', role: 'Titres, marque' },
  { token: '--fern', name: 'Céladon', role: 'Fougère, ornements' },
  { token: '--established', name: 'Encre de tampon', role: 'Ce qui est établi' },
  { token: '--paper', name: 'Papier', role: 'Documents, carte' },
  { token: '--ink', name: 'Encre ferro-gallique', role: 'Texte sur papier' },
  { token: '--kraft', name: 'Kraft', role: 'Chemises' },
  { token: '--card', name: 'Bristol', role: 'Fiches' },
  { token: '--wood-lit', name: 'Bois éclairé', role: 'Le bureau sous la lampe' },
  { token: '--velvet', name: 'Velours', role: 'Le rideau' },
];

const WASHES = ['safran', 'carmin', 'indigo', 'sienne', 'sauge', 'lilas', 'celadon', 'ardoise'];

const ICON_ROW: IconName[] = [
  'tree',
  'archives',
  'reader',
  'catalog',
  'notebook',
  'map',
  'faces',
  'search',
  'stamp',
  'lamp',
  'quill',
  'envelope',
  'photo',
  'compass',
  'typewriter',
  'fern',
];
const ORNAMENT_ROW: OrnamentName[] = [
  'corner',
  'fern',
  'divider',
  'seal',
  'clip',
  'pin',
  'flourish',
];

const CSS = `
@page { size: 297mm 210mm; margin: 0; }
.pg { position: relative; width: 297mm; height: 210mm; overflow: hidden; isolation: isolate;
  break-after: page; background-color: var(--canvas); color: var(--text); font-family: var(--font-ui); }
.pg.paper { background-color: var(--paper); }
.folio { position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; justify-content: space-between;
  font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  font-size: 2.6mm; color: var(--text-muted); }
.kick { display: inline-flex; align-items: center; gap: 2.4mm; font-family: var(--font-label);
  font-weight: var(--weight-medium); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  font-size: 3.4mm; color: var(--text-muted); }
.kick::before { content: ''; width: 7mm; height: 0.6mm; background: var(--brand); border-radius: 1mm; }
h2 { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display-black); line-height: var(--leading-display);
  letter-spacing: var(--tracking-display); font-size: 13mm; text-wrap: balance; }
h2 em { font-style: italic; font-weight: var(--weight-display); color: var(--brand); }
.lede { font-family: var(--font-read); font-size: 4.2mm; line-height: var(--leading-read); color: var(--text-muted); }
.prose p { font-family: var(--font-read); font-size: 4mm; line-height: var(--leading-read); }
.prose p + p { margin-top: 3mm; }
.cap { font-family: var(--font-read); font-size: 3.1mm; line-height: 1.45; color: var(--text-muted); }
.cap b { display: block; font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-weight: var(--weight-display); font-size: 4.4mm; color: var(--text); margin-bottom: 0.8mm; }
.head { position: absolute; left: 16mm; top: 14mm; right: 16mm; display: grid; gap: 3mm; justify-items: start; }
.sheet { background: var(--paper-new); color: var(--ink); box-shadow: var(--shadow-paper); }
.full svg, .fill { display: block; width: 100%; height: 100%; }
img { display: block; width: 100%; height: auto; }

/* Couverture */
.cover .art { position: absolute; inset: 0; z-index: -2; }
.cover::after { content: ''; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(to left, var(--canvas) 0%, color-mix(in oklch, var(--canvas) 88%, transparent) 36%, transparent 70%); }
.cover .txt { position: absolute; right: 18mm; top: 50%; transform: translateY(-52%); display: grid; gap: 4mm; justify-items: start; }
.cover .wm { --wm-size: 24mm; }
.cover .sub { font-family: var(--font-display); font-variation-settings: var(--display-settings);
  font-style: italic; font-size: 7mm; color: var(--text-muted); }
.cover .label { font-size: 4mm; transform: rotate(-2deg); }
.cover .credits { position: absolute; right: 18mm; bottom: 10mm; font-family: var(--font-read); font-size: 2.9mm; color: var(--text-muted); }

/* Sommaire */
.toc { position: absolute; left: 16mm; top: 46mm; width: 120mm; display: grid; gap: 2.6mm; }
.toc li { display: flex; gap: 3mm; align-items: baseline; font-family: var(--font-read); font-size: 4.2mm; list-style: none; }
.toc li span:first-child { flex: 1; border-bottom: 0.25mm dotted var(--line); }
.toc li span:last-child { font-family: var(--font-label); color: var(--brand); }
.toc ol { padding: 0; display: grid; gap: 2.6mm; }
.toc-side { position: absolute; right: 16mm; top: 46mm; width: 120mm; display: grid; gap: 6mm; }

/* Grilles d'images */
.grid { position: absolute; left: 16mm; right: 16mm; top: 46mm; display: grid; gap: 8mm; align-items: start; }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g5 { grid-template-columns: repeat(5, 1fr); gap: 6mm; }
.g4 { grid-template-columns: repeat(4, 1fr); left: 30mm; right: 30mm; }
.fig { display: grid; gap: 3mm; }
.fig .frame { padding: 2.5mm; }
.pg.paper .cap b { color: var(--ink); }
`;

const folio = (n: number, section: string) =>
  `<div class="folio"><span>L’Arbre aux absents · Artbook</span><span>${section} · ${n}</span></div>`;

const kick = (k: string) => `<p class="kick">${k}</p>`;

function swatchesHtml(): string {
  const chip = (token: string, name: string, role: string) => {
    const v = tokenValue(token) ?? '';
    const hex = oklchToHex(v) ?? v;
    return `<li><span class="chip" style="background: var(${token})"></span><b>${name}</b><span>${role}</span><code>${hex}</code></li>`;
  };
  return (
    `<ul class="swatches">${SWATCHES.map((s) => chip(s.token, s.name, s.role)).join('')}</ul>` +
    `<p class="kick" style="margin-top:6mm">Les lavis du coloriste</p><ul class="swatches washes">${WASHES.map(
      (w) =>
        chip(
          `--art-wash-${w}`,
          w === 'celadon' ? 'Céladon' : w[0]!.toUpperCase() + w.slice(1),
          'Lavis',
        ),
    ).join('')}</ul>`
  );
}

function iconSvg(name: IconName): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[
    name
  ]
    .map((d) => `<path d="${d}"/>`)
    .join('')}</svg>`;
}

function ornamentSvg(name: OrnamentName): string {
  const o = ORNAMENTS[name];
  return `<svg viewBox="0 0 ${o.w} ${o.h}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${[
    ...o.tone.map((d) => `<path d="${d}" fill="var(--brand)" stroke="none"/>`),
    ...o.paths.map((d) => `<path d="${d}"/>`),
    ...o.fills.map((d) => `<path d="${d}" fill="currentColor" stroke="none" opacity="0.7"/>`),
  ].join('')}</svg>`;
}

const EXTRA_CSS = `
.swatches { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 4mm 5mm; }
.swatches li { display: grid; gap: 0.6mm; font-size: 2.8mm; color: var(--ink-muted); }
.swatches .chip { height: 15mm; border-radius: 1.2mm; box-shadow: inset 0 0 0 0.25mm var(--line); margin-bottom: 1mm; }
.swatches.washes { grid-template-columns: repeat(8, 1fr); }
.swatches.washes .chip { height: 10mm; }
.swatches b { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-weight: var(--weight-display); font-size: 3.6mm; color: var(--ink); }
.swatches code { font-family: var(--font-type); font-size: 2.8mm; }
.fonts { list-style: none; padding: 0; display: grid; gap: 5mm; }
.fonts li { display: grid; grid-template-columns: 52mm 1fr; gap: 6mm; align-items: baseline; border-bottom: 0.25mm solid var(--line); padding-bottom: 4mm; }
.fonts .meta { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp); font-size: 3mm; color: var(--text-muted); }
.fonts .meta b { display: block; color: var(--text); font-size: 4mm; }
.fonts .sample { font-size: 7.5mm; line-height: 1.2; }
.mats { position: absolute; left: 16mm; right: 16mm; top: 62mm; display: grid; grid-template-columns: repeat(4, 1fr); gap: 9mm; align-items: start; }
.mat { min-height: 52mm; padding: 6mm; display: grid; align-content: end; gap: 2mm; }
.mat b { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-size: 6mm; font-weight: var(--weight-display); }
.mat span { font-family: var(--font-read); font-size: 3mm; line-height: 1.45; }
.mat.mat-card { --rule-gap: 6.6mm; --head-h: 11mm; }
.mats-row { position: absolute; left: 16mm; right: 16mm; top: 140mm; display: flex; align-items: center; gap: 12mm; }
.mats-row .mat-label { font-size: 4mm; }
.icons { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(8, 1fr); gap: 6mm 4mm; }
.icons li { display: grid; justify-items: center; gap: 1.5mm; font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp); font-size: 2.6mm; color: var(--text-muted); }
.icons svg { width: 12mm; height: 12mm; color: var(--text); }
.orns { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6mm; align-items: center; color: var(--fern); }
.orns svg { width: 100%; max-height: 18mm; }
`;

export async function buildArtbook(): Promise<KitFile[]> {
  const pages: string[] = [];
  let n = 0;
  const page = (cls: string, inner: string, section: string, attrs = '') => {
    n += 1;
    pages.push(
      `<section class="pg ${cls}" ${attrs}>${inner}${n > 1 ? folio(n, section) : ''}</section>`,
    );
  };
  // Grandes planches en JPEG (~220 dpi) : en vectoriel, l'art clé et la carte pèseraient
  // 1 à 3 Mo chacun dans le PDF. Vignettes, portraits et documents restent vectoriels.
  const keyRaw = artSvg('art/keyart/keyart-desk.svg').markup;
  const keyJpg = await rasterCrop(keyRaw, '0 0 1600 900', 2400);
  const tallJpg = await rasterCrop(
    artSvg('art/keyart/keyart-desk-tall.svg').markup,
    '0 0 800 1000',
    1300,
  );
  const mapJpg = await rasterCrop(mapSvg(), '0 0 1350 1000', 2400);
  const cover = (pos: string) =>
    `<img src="${keyJpg}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:${pos}">`;

  // 1. Couverture
  page(
    'cover',
    `<div class="art">${cover('left center')}</div><div class="txt"><span class="mat-label red label">Artbook</span>${wordmark()}<p class="sub">Gravure et aquarelle</p></div>
<p class="credits">${PRESS_CREDITS}</p>`,
    'Couverture',
  );

  // 2. Sommaire et procédé
  const toc = [
    ['L’intention', 3],
    ['L’art clé', 4],
    ['Couleurs et polices', 7],
    ['Les matières du bureau', 9],
    ['La carte de la Velmarche', 11],
    ['Les vignettes d’aquarelle', 13],
    ['Les portraits gravés', 15],
    ['Les documents', 17],
    ['Ornements et icônes', 18],
  ] as const;
  page(
    'paper',
    `<div class="head">${kick('Sommaire')}<h2>Gravure <em>et aquarelle</em></h2></div>
<div class="toc"><ol>${toc.map(([t, p]) => `<li><span>${t}</span><span>${p}</span></li>`).join('')}</ol></div>
<div class="toc-side"><p class="lede">Un trait d’encre bleu-noir gravé, des hachures pour le volume, puis quelques lavis transparents posés par un coloriste. Toute l’illustration du jeu suit ce procédé ancien, dans une interface nette et contemporaine.</p>
<div style="width:46mm;justify-self:end">${artSvg('art/keyart/flourish-seal.svg').markup}</div></div>`,
    'Sommaire',
    'data-surface="paper"',
  );

  // 3. Intention
  page(
    'desk-surface',
    `<div class="head" style="width:110mm">${kick('Intention')}<h2>« Le bureau <em>sous la lampe</em> »</h2></div>
<div style="position:absolute;left:18mm;top:70mm;width:96mm">${artSvg('art/keyart/spot-letter.svg').markup}</div>
<div class="sheet prose" data-surface="paper" style="position:absolute;right:18mm;top:18mm;width:150mm;padding:11mm 12mm;transform:rotate(0.6deg)">
<p>Il est tard. Sur un bureau d’enquêteur plongé dans le bleu de la nuit, une lampe de laiton éclaire des archives : lettres, registres, photographies, une carte dépliée. Tout ce qui se lit est du papier dans la lumière ; tout ce qui sert d’outil reste dans l’ombre, net et discret.</p>
<p>L’illustration est une <strong>taille-douce à l’encre ferro-gallique</strong>, rehaussée d’<strong>aquarelle</strong>. Le trait hiérarchise : contours appuyés, détails plus fins, ombres et courbes de niveau à peine posées. Les lavis restent transparents, jamais plus de deux couches, et débordent un peu du trait, comme la main d’un coloriste.</p>
<p>Les portraits sont des bustes de trois-quarts, reconnaissables en vignette comme en grand : chaque personne a sa silhouette de coiffure, son accessoire et sa couleur de vêtement.</p>
<p>Le pays est imaginaire, la Velmarche, en 1974 : rien n’y renvoie à un lieu réel.</p></div>`,
    'Intention',
  );

  // 4. L'art clé en grand
  page(
    'full',
    `<div style="position:absolute;inset:0">${cover('center')}</div>
<div style="position:absolute;left:0;right:0;bottom:0;height:26mm;background:linear-gradient(transparent, var(--canvas))"></div>
<p class="cap" style="position:absolute;left:16mm;bottom:12mm;width:200mm"><b>« Le bureau sous la lampe »</b>Art clé, écran titre du jeu et héros du site (16:9).</p>`,
    'L’art clé',
  );

  // 5. Détails de l'art clé
  const keyCrops = await Promise.all(KEY_DETAILS.map((d) => rasterCrop(keyRaw, d.viewBox, 1400)));
  page(
    'desk-surface',
    `<div class="head">${kick('L’art clé')}<h2>Détails <em>du bureau</em></h2></div>
<div class="grid g3">${KEY_DETAILS.map(
      (d, i) =>
        `<figure class="fig"><img src="${keyCrops[i]}" alt=""><figcaption class="cap"><b>${d.title}</b>${d.text}</figcaption></figure>`,
    ).join('')}</div>`,
    'L’art clé',
  );

  // 6. Recomposition 4:5
  page(
    'desk-surface',
    `<div style="position:absolute;left:16mm;top:14mm;bottom:16mm;width:144mm"><img src="${tallJpg}" alt="" style="width:100%;height:100%;object-fit:contain"></div>
<div style="position:absolute;left:172mm;right:16mm;top:24mm;display:grid;gap:5mm">${kick('L’art clé')}<h2>Recomposé <em>pour le téléphone</em></h2>
<div class="prose"><p>Le format 4:5 n’est pas un recadrage : chaque objet est replacé pour l’écran vertical. La lampe, la tasse et le brouillon d’arbre restent sous la lumière ; la carte, les dossiers et l’herbier glissent vers le bas.</p>
<p>Cinq groupes respirent à l’écran titre : la lumière vacille, les poussières dérivent, la vapeur monte, le rideau ondule, une feuille se soulève. En mouvement réduit, tout se fige ; l’image reste complète à l’arrêt.</p></div></div>`,
    'L’art clé',
  );

  // 7. Palette
  page(
    'paper',
    `<div class="head">${kick('Couleurs')}<h2>Palette <em>d’encre et de papier</em></h2></div>
<div style="position:absolute;left:16mm;right:16mm;top:44mm">${swatchesHtml()}</div>`,
    'Couleurs et polices',
    'data-surface="paper"',
  );

  // 8. Polices
  const fonts = [
    ['Fraunces', 'Titrage d’affiche', 'var(--font-display)', 'Une famille effacée des registres.'],
    ['Oswald', 'Étiquettes et tampons', 'var(--font-label)', 'ORC 74 · DIFFUSION · ARCHIVES'],
    [
      'Literata',
      'Lecture',
      'var(--font-read)',
      'Reconstituez l’arbre d’une famille, pièce par pièce.',
    ],
    ['Courier Prime', 'Machine à écrire', 'var(--font-type)', 'OFFICE DE RÉINSCRIPTION CIVILE'],
    ['Caveat', 'Manuscrit', 'var(--font-hand)', 'Bons baisers des Bains-de-Mérande…'],
  ];
  page(
    'desk-surface',
    `<div class="head">${kick('Typographie')}<h2>Des polices <em>libres</em></h2></div>
<ul class="fonts" style="position:absolute;left:16mm;right:16mm;top:46mm">${fonts
      .map(
        ([name, role, fam, sample]) =>
          `<li><p class="meta"><b>${name}</b>${role}</p><p class="sample" style="font-family:${fam};${name === 'Fraunces' ? 'font-variation-settings:var(--display-settings);font-weight:var(--weight-display-black)' : ''}${name === 'Oswald' ? 'text-transform:uppercase;letter-spacing:var(--tracking-stamp)' : ''}">${sample}</p></li>`,
      )
      .join('')}</ul>`,
    'Couleurs et polices',
  );

  // 9. Matières
  page(
    'desk-surface',
    `<div class="head">${kick('Matières')}<h2>Le bureau <em>en matières</em></h2><p class="lede" style="max-width:170mm">Rien n’est une « carte » abstraite : chaque surface est un objet du bureau, posé, épinglé, scotché.</p></div>
<div class="mats">
<div class="mat mat-paper" data-surface="paper" style="transform:rotate(-1.2deg)"><b>La feuille</b><span>Papier, bords droits, déchirés ou perforés ; ruban, trombone, punaise.</span></div>
<div class="mat mat-kraft" style="transform:rotate(0.8deg)"><b>La chemise</b><span>Kraft ou manille, une cote à l’étiqueteuse, un onglet.</span></div>
<div class="mat mat-card" style="transform:rotate(1.2deg)"><b>La fiche</b><span>Bristol, réglure bleue, ligne de tête vermillon.</span></div>
<div class="mat mat-paper" data-surface="paper" style="background:var(--paper-aged);transform:rotate(-0.6deg)"><b>La coupure</b><span>Papier vieilli des annuaires et des journaux.</span></div>
</div>
<div class="mats-row"><span class="mat-label">Étiqueteuse</span><span class="mat-label red">Annonce</span><span class="mat-tape" style="--tape-w:40mm;--tape-h:10mm"></span>
<div class="sheet" data-surface="paper" style="width:62mm;padding:2mm;transform:rotate(-2deg)">${artSvg('art/keyart/flourish-tampon.svg').markup}</div><div style="width:40mm">${artSvg('art/keyart/spot-stamp.svg').markup}</div></div>`,
    'Les matières du bureau',
  );

  // 10. Le procédé : lavis
  page(
    'paper',
    `<div class="head">${kick('Matières')}<h2>Gravure <em>rehaussée d’aquarelle</em></h2></div>
<div class="prose" style="position:absolute;left:16mm;top:50mm;width:110mm"><p>Un trait d’encre ferro-gallique bleu-noir, des hachures pour le volume, puis des lavis transparents qui débordent un peu, comme la main d’un coloriste. Les documents du jeu sont du papier dans la lumière ; l’interface autour reste sombre, nette et discrète.</p>
<p>Les couleurs de l’art ne sont jamais écrites à la main : chaque trait et chaque lavis porte une classe du système de design, ce qui permet au jeu de redessiner toute l’illustration pour la nuit ou en contraste élevé.</p></div>
<div style="position:absolute;right:16mm;top:40mm;width:140mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm">${[
      'archives',
      'catalogue',
      'register',
      'magnifier',
    ]
      .map((s) => artSvg(`art/keyart/spot-${s}.svg`).markup)
      .join('')}</div>`,
    'Les matières du bureau',
    'data-surface="paper"',
  );

  // 11. La carte
  page(
    'paper',
    `<div style="position:absolute;left:16mm;top:12mm;width:200mm;bottom:14mm"><div class="sheet" style="padding:3mm"><img src="${mapJpg}" alt=""></div></div>
<div style="position:absolute;left:226mm;right:14mm;top:20mm;display:grid;gap:4mm">${kick('La carte')}<h2 style="font-size:10mm">La <em>Velmarche</em></h2>
<p class="cap">Une seule grande planche, découpée en couches : fond, relief, eaux, lieux et toponymes. Dans le jeu, chaque lieu s’éclaire quand on le visite.</p>
<p class="cap">Taille-douce rehaussée d’aquarelle : lavis des provinces, routes en double trait, monts en profils gravés, cartouche de graveur.</p></div>`,
    'La carte de la Velmarche',
    'data-surface="paper"',
  );

  // 12. Détails de la carte
  const mapRaw = mapSvg();
  const mapCrops = await Promise.all(MAP_DETAILS.map((d) => rasterCrop(mapRaw, d.viewBox, 900)));
  page(
    'paper',
    `<div class="head">${kick('La carte')}<h2>Détails <em>de la Velmarche</em></h2></div>
<div class="grid g3" style="top:40mm;gap:6mm 8mm">${MAP_DETAILS.map(
      (d, i) =>
        `<figure class="fig"><div class="sheet frame" style="height:48mm;display:grid;place-items:center"><img src="${mapCrops[i]}" alt="" style="max-height:43mm;width:auto;max-width:100%"></div><figcaption class="cap"><b>${d.title}</b>${d.text}</figcaption></figure>`,
    ).join('')}</div>`,
    'La carte de la Velmarche',
    'data-surface="paper"',
  );

  // 13–14. Vignettes
  for (const [k, part] of [SPOTS.slice(0, 5), SPOTS.slice(5)].entries()) {
    page(
      'paper',
      `<div class="head">${kick('Vignettes')}<h2>Les objets <em>du bureau</em></h2>${k === 0 ? '<p class="lede">Dix vignettes peintes pour l’interface : chacune ouvre un geste du jeu, sur une tache de lavis.</p>' : ''}</div>
<div class="grid g5" style="top:${k === 0 ? 62 : 52}mm">${part
        .map(
          (s) =>
            `<figure class="fig">${artSvg(`art/keyart/spot-${s.name}.svg`).markup}<figcaption class="cap"><b>${s.title}</b>${s.text}</figcaption></figure>`,
        )
        .join('')}</div>`,
      'Les vignettes d’aquarelle',
      'data-surface="paper"',
    );
  }

  // 15–16. Portraits
  const tilts = [-1.2, 0.9, -0.5, 1.1, -0.8, 0.6, -1, 0.7, -0.4];
  for (const [k, part] of [PORTRAIT_PLATES.slice(0, 5), PORTRAIT_PLATES.slice(5)].entries()) {
    page(
      'desk-surface',
      `<div class="head">${kick('Portraits')}<h2>Galerie <em>des visages</em></h2>${k === 0 ? '<p class="lede" style="max-width:190mm">Quelques planches parmi la trentaine de portraits du jeu. Les noms restent dans les archives : à vous de les y retrouver.</p>' : ''}</div>
<div class="grid ${k === 0 ? 'g5' : 'g4'}" style="top:${k === 0 ? 64 : 52}mm">${part
        .map(
          (p, i) =>
            `<figure class="fig"><div class="sheet frame" data-surface="paper" style="transform:rotate(${tilts[i + k * 5]}deg)">${portraitSvg(p.person)}</div><figcaption class="cap"><b>Planche ${p.plate}</b>${p.caption}</figcaption></figure>`,
        )
        .join('')}</div>`,
      'Les portraits gravés',
    );
  }

  // 17. Documents
  page(
    'desk-surface',
    `<div class="head">${kick('Documents')}<h2>Cartes postales <em>et affiches</em></h2><p class="lede" style="max-width:200mm">Photographies, cartes postales, coupures de presse : chaque document du jeu a sa technique d’époque. Trois exemples, sans rien de l’affaire.</p></div>
<div class="grid" style="grid-template-columns:1.25fr 1.25fr 0.8fr;top:66mm">${DOCUMENTS.map(
      (d, i) =>
        `<figure class="fig"><div class="sheet frame" data-surface="paper" style="transform:rotate(${[-0.8, 0.7, -0.5][i]}deg)">${artSvg(`content/cases/succession-varenque/illustrations/${d.file}.svg`).markup}</div><figcaption class="cap"><b>${d.title}</b>${d.text}</figcaption></figure>`,
    ).join('')}</div>`,
    'Les documents',
  );

  // 18. Ornements et icônes
  page(
    'desk-surface',
    `<div class="head">${kick('Ornements et icônes')}<h2>Encrés <em>à la plume</em></h2><p class="lede" style="max-width:200mm">Un tracé principal irrégulier, un second passage d’encre fin, et parfois un lavis d’aquarelle derrière. Les mêmes formes, nettes, sous 14 pixels.</p></div>
<div style="position:absolute;left:16mm;right:16mm;top:66mm;display:grid;gap:10mm">
<ul class="icons">${ICON_ROW.map((i) => `<li>${iconSvg(i)}</li>`).join('')}</ul>
<ul class="orns">${ORNAMENT_ROW.map((o) => `<li>${ornamentSvg(o)}</li>`).join('')}</ul>
<div style="width:150mm;justify-self:center;color:var(--fern)">${artSvg('art/keyart/flourish-fern-vine.svg').markup}</div></div>`,
    'Ornements et icônes',
  );

  // 19. Quatrième de couverture
  page(
    'desk-surface',
    `<div style="position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:7mm;text-align:center">
${wordmark({ stacked: false, center: true }).replace('class="wm', 'style="--wm-size:15mm" class="wm')}
<p class="lede" style="max-width:180mm">Un jeu d’enquête généalogique en solo, dans un pays imaginaire. Gratuit sur itch.io : <b style="color:var(--text)">cardorinteractive.itch.io/arbre-aux-absents</b> · <b style="color:var(--text)">arbre.cardormedia.com</b></p>
<div style="font-size:5mm;color:var(--text-muted)">${houseLogos()}</div>
<p class="cap">${PRESS_CREDITS}</p><p class="cap">© 2026 CARDOR Media. Polices sous licence SIL Open Font License.</p></div>`,
    'Fin',
  );

  const doc = html({ body: pages.join(''), css: CSS + EXTRA_CSS, title: 'Artbook' });
  const p = await load('artbook', doc, A4L);
  await prepareForPdf(p);
  const out = ensureDir(join(OUT, ARTBOOK_FILE));
  await p.pdf({ path: out, width: '297mm', height: '210mm', printBackground: true });
  await p.close();
  return [
    {
      group: 'documents',
      path: ARTBOOK_FILE,
      label: 'Artbook : art clé, carte, vignettes, portraits, intention artistique',
      format: 'PDF',
      detail: `A4 paysage, ${n} pages`,
    },
  ];
}
