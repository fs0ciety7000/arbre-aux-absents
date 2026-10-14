/**
 * npm run presskit [-- logos affiches bannieres artbook fiche]
 *
 * Génère le kit presse de L'Arbre aux absents dans apps/site/static/presse/kit/ à partir de l'art
 * du jeu (art/, content/) et du design system (packages/ui) : logos, affiches A3, bannières,
 * artbook et fiche en PDF, archive ZIP, et le manifeste lu par la page /presse/
 * (apps/site/src/lib/content/presskit.json). Hors CI : les fichiers produits sont versionnés.
 * Sans argument, tout est régénéré ; avec des parties, seules celles-ci (l'archive et le
 * manifeste sont toujours refaits à partir de ce qui est sur le disque).
 *
 * Prérequis : Chromium de Playwright (PLAYWRIGHT_BROWSERS_PATH), `pdftocairo` (poppler-utils) et
 * `zip`. Copie facultative du kit : PRESSKIT_COPY=/chemin/vers/dossier.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { PRESS_CREDITS } from '../../apps/site/src/lib/content/press';
import { buildArtbook } from './artbook';
import { buildBanners } from './banners';
import { buildFiche } from './fiche';
import { closeBrowser, humanSize, OUT, REPO, WORK } from './lib';
import { buildLogos, houseFiles } from './logos';
import type { KitFile } from './manifest';
import { buildPosters } from './posters';

const MANIFEST = join(REPO, 'apps/site/src/lib/content/presskit.json');
export const ZIP_FILE = 'arbre-aux-absents-kit-presse.zip';

/**
 * Captures et couverture itch.io déjà publiées (apps/site/static/itch/) : listées sur /presse/,
 * hors archive (elles y doubleraient le poids du kit).
 */
const CAPTURES: { file: string; label: string; detail: string }[] = [
  { file: 'jeu-titre-1440.png', label: 'Capture : écran titre', detail: '1440 px' },
  { file: 'jeu-etabli-1440.png', label: 'Capture : l’établi', detail: '1440 px' },
  { file: 'jeu-catalogue-1440.png', label: 'Capture : le catalogue', detail: '1440 px' },
  {
    file: 'jeu-lecteur-lettre-1440.png',
    label: 'Capture : lecture d’une lettre',
    detail: '1440 px',
  },
  { file: 'jeu-carte-1440.png', label: 'Capture : la carte', detail: '1440 px' },
  { file: 'jeu-arbre-zoom-1440.png', label: 'Capture : l’arbre', detail: '1440 px' },
  { file: 'cover-1260x1000-titre.png', label: 'Couverture itch.io', detail: '1260 × 1000 px' },
];

const PARTS: Record<string, () => Promise<KitFile[]>> = {
  logos: buildLogos,
  affiches: buildPosters,
  bannieres: buildBanners,
  artbook: buildArtbook,
  fiche: buildFiche,
};

const LISEZMOI = `L’ARBRE AUX ABSENTS — KIT PRESSE
================================

Un jeu d’enquête généalogique en solo, dans un pays imaginaire, la Velmarche.
Gratuit : https://cardorinteractive.itch.io/arbre-aux-absents
Site et dossier de presse : https://arbre.cardormedia.com/presse/
Captures d’écran : https://arbre.cardormedia.com/presse/ (section « Captures »)

${PRESS_CREDITS}.

Contenu
-------
logos/       Titre du jeu (empilé, en ligne) : couleurs sur fond sombre, couleurs sur
             fond clair, noir, blanc. SVG (texte vectorisé) et PNG transparents.
             Emblème carré (icône, avatar). logos/maison/ : logos de CARDOR Media,
             CM Interactive et CM Creative Lab (couleurs d’origine).
affiches/    Trois affiches A3 : PDF vectoriel pour l’impression, PNG pour l’écran.
bannieres/   itch.io, X, Facebook, YouTube, Twitch, partage de lien, carré, story.
arbre-aux-absents-artbook.pdf      Artbook (A4 paysage).
arbre-aux-absents-fiche-presse.pdf Fiche presse (A4, imprimable).

Règles d’usage
--------------
- Le titre se pose sur la nuit du bureau (vélin et vermillon) ou sur papier (encre).
- Ne pas recolorer le titre, le déformer, ni lui ajouter ombre ou contour.
- Ne pas poser le titre sur une illustration chargée ou sur la carte.
- Ne révéler aucun nom, secret ou dénouement de l’enquête.
- Les logos de la maison restent dans l’ordre : CARDOR Media, CM Interactive,
  CM Creative Lab.

Polices du titre et des visuels : Fraunces, Oswald, Literata, Courier Prime, Caveat
(SIL Open Font License).
`;

/** Dimensions d'un JPEG (marqueur SOF), pour les attributs width/height de la page. */
function jpegSize(file: string): [number, number] {
  const b = readFileSync(file);
  for (let i = 2; i < b.length;) {
    const marker = b[i + 1]!;
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error(`presskit : dimensions introuvables (${file})`);
}

function bytes(rel: string): number {
  return statSync(join(OUT, rel)).size;
}

/** Fichiers déjà sur le disque, quand une partie n'est pas régénérée (manifeste précédent). */
function previous(): KitFile[] {
  if (!existsSync(MANIFEST)) return [];
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8')) as { files: KitFile[] };
  return m.files.filter((f) => f.group !== 'archive' && existsSync(join(OUT, f.path)));
}

function zip(files: KitFile[]): KitFile {
  const stage = join(WORK, 'zip', 'arbre-aux-absents-kit-presse');
  rmSync(join(WORK, 'zip'), { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  for (const f of files) cpSync(join(OUT, f.path), join(stage, f.path));
  for (const h of houseFiles()) cpSync(join(REPO, h.from), join(stage, h.to));
  writeFileSync(join(stage, 'LISEZMOI.txt'), LISEZMOI);
  const out = join(OUT, ZIP_FILE);
  rmSync(out, { force: true });
  // -X : sans attributs étendus ; -9 : compression maximale (PDF et SVG y gagnent).
  execFileSync('zip', ['-q', '-r', '-X', '-9', out, 'arbre-aux-absents-kit-presse'], {
    cwd: join(WORK, 'zip'),
  });
  return {
    group: 'archive',
    path: ZIP_FILE,
    label: 'Le kit complet : logos, affiches, bannières, artbook et fiche',
    format: 'ZIP',
    detail: 'tout le kit, avec un fichier LISEZMOI',
  };
}

const only = process.argv.slice(2);
for (const p of only) if (!PARTS[p]) throw new Error(`presskit : partie inconnue « ${p} »`);
const fresh: KitFile[] = [];
try {
  for (const [name, build] of Object.entries(PARTS)) {
    if (only.length && !only.includes(name)) continue;
    console.log(`presskit : ${name}…`);
    fresh.push(...(await build()));
  }
} finally {
  await closeBrowser();
}
// Une partie régénérée vide d'abord son dossier : ses anciens fichiers n'existent plus.
const files = [...previous().filter((f) => !fresh.some((g) => g.path === f.path)), ...fresh];
const order = ['documents', 'logos', 'affiches', 'bannieres'];
files.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
files.push(zip(files));
for (const f of files) f.bytes = bytes(f.path);
// Aperçus des PDF (première page, JPEG 480 px) pour la page /presse/ ; hors archive.
rmSync(join(OUT, 'apercus'), { recursive: true, force: true });
mkdirSync(join(OUT, 'apercus'), { recursive: true });
for (const f of files.filter((g) => g.format === 'PDF')) {
  const name = f.path.replace(/^.*\//, '').replace(/\.pdf$/, '');
  execFileSync('pdftoppm', [
    '-jpeg',
    '-jpegopt',
    'quality=82',
    '-f',
    '1',
    '-l',
    '1',
    '-scale-to',
    '480',
    '-singlefile',
    join(OUT, f.path),
    join(OUT, 'apercus', name),
  ]);
  f.preview = `apercus/${name}.jpg`;
  f.previewSize = jpegSize(join(OUT, f.preview));
}
const captures = CAPTURES.map((c) => ({
  path: `itch/${c.file}`,
  label: c.label,
  format: 'PNG',
  detail: c.detail,
  bytes: statSync(join(REPO, 'apps/site/static/itch', c.file)).size,
}));
writeFileSync(MANIFEST, JSON.stringify({ files, captures }, null, 2) + '\n');
execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', MANIFEST], { cwd: REPO });

const total = files.reduce((n, f) => n + (f.bytes ?? 0), 0);
console.log(`presskit : ${files.length} fichiers, ${humanSize(total)} dans ${OUT}`);
if (process.env.PRESSKIT_COPY) {
  cpSync(OUT, process.env.PRESSKIT_COPY, { recursive: true });
  console.log(`presskit : copié dans ${process.env.PRESSKIT_COPY}`);
}
// Chromium peut garder des poignées ouvertes après la fermeture : sortie explicite.
process.exit(0);
