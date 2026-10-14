/**
 * Logos du kit : le titre du jeu (empilé comme sur l'écran titre, ou en ligne) en quatre teintes
 * (couleur sur nuit, couleur sur papier, noir, blanc), en SVG vectorisé et en PNG transparents ;
 * l'emblème carré (cachet de cire à la fougère sur la nuit du bureau) pour icône et avatar.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { artSvg, ensureDir, html, load, OUT, pdfToSvg, WORK, wordmark } from './lib';
import type { KitFile } from './manifest';

interface Tone {
  id: string;
  label: string;
  /** Attributs du cadre (contexte de surface, teinte unique). */
  attrs: string;
}

const TONES: Tone[] = [
  { id: 'couleur-nuit', label: 'couleurs, pour fond sombre', attrs: '' },
  { id: 'couleur-papier', label: 'couleurs, pour fond clair', attrs: 'data-surface="paper"' },
  { id: 'noir', label: 'monochrome noir', attrs: 'data-mono style="--mono: oklch(0 0 0)"' },
  { id: 'blanc', label: 'monochrome blanc', attrs: 'data-mono style="--mono: oklch(1 0 0)"' },
];

const LOCKUPS = [
  { id: 'titre', stacked: true, label: 'Titre empilé (écran titre)', widths: [600, 1200, 2400] },
  { id: 'titre-ligne', stacked: false, label: 'Titre en ligne', widths: [800, 1600] },
] as const;

const CSS = `
.pad { display: inline-block; padding: 0.14em 0.16em 0.12em; font-size: 160px; }
.pad .wm { --wm-size: 1em; }
.pad.line .flourish { width: 2.4em; }
`;

async function lockup(l: (typeof LOCKUPS)[number], t: Tone, files: KitFile[]): Promise<void> {
  const mono = t.attrs.includes('data-mono');
  const body = `<div class="pad ${l.stacked ? 'stacked' : 'line'}" id="pad" ${t.attrs}>${wordmark({
    stacked: l.stacked,
    center: !l.stacked,
    cls: mono ? 'mono' : '',
  })}</div>`;
  const doc = html({ body, css: CSS, title: 'Titre' });
  const name = `arbre-aux-absents-${l.id}-${t.id}`;
  const probe = await load(name, doc, { width: 2400, height: 1200 });
  const box = (await probe.locator('#pad').boundingBox())!;
  const w = Math.ceil(box.width);
  const h = Math.ceil(box.height);
  // Vectoriel : PDF à la taille exacte, puis SVG (texte en tracés).
  const pdf = join(WORK, `${name}.pdf`);
  await probe.pdf({ path: pdf, width: `${w}px`, height: `${h}px`, printBackground: false });
  await probe.close();
  const svgOut = join(OUT, 'logos', `${name}.svg`);
  pdfToSvg(pdf, svgOut);
  files.push({
    group: 'logos',
    path: `logos/${name}.svg`,
    label: `${l.label}, ${t.label}`,
    format: 'SVG',
    detail: 'vectoriel, texte vectorisé',
  });
  for (const width of l.widths) {
    const page = await load(name, doc, { width: 2400, height: 1200 }, width / w);
    const out = ensureDir(join(OUT, 'logos', `${name}-${width}.png`));
    await page.screenshot({
      path: out,
      omitBackground: true,
      clip: { x: 0, y: 0, width: w, height: h },
    });
    await page.close();
    files.push({
      group: 'logos',
      path: `logos/${name}-${width}.png`,
      label: `${l.label}, ${t.label}`,
      format: 'PNG',
      detail: `${width} × ${Math.round((h * width) / w)} px, fond transparent`,
    });
  }
}

/** Emblème : cachet de cire à la fougère, sur la nuit du bureau sous la lampe. */
function emblemDoc(rounded: boolean): string {
  const seal = artSvg('art/keyart/flourish-seal.svg', { class: 'art seal' });
  const css = `
.tile { position: relative; width: 1024px; height: 1024px; overflow: hidden;
  border-radius: ${rounded ? '22.5%' : '0'}; background-color: var(--canvas); isolation: isolate; }
.tile::before { content: ''; position: absolute; inset: 0; z-index: -1;
  background: radial-gradient(62% 58% at 50% 40%, var(--lamp-glow), transparent 70%),
    radial-gradient(70% 70% at 50% 46%, var(--lamp-pool), transparent 72%),
    radial-gradient(120% 110% at 50% 45%, transparent 52%, var(--vignette)); }
.seal { position: absolute; left: 50%; top: 50%; width: 118%; height: auto;
  transform: translate(-50%, -50%); }
.seal [id$='-ring'], .seal [id$='-burst'] { opacity: 0; }
`;
  return html({ body: `<div class="tile" id="tile">${seal.markup}</div>`, css, title: 'Emblème' });
}

async function emblem(files: KitFile[]): Promise<void> {
  const variants = [
    {
      id: 'icone',
      rounded: true,
      label: 'Emblème, icône d’application (coins arrondis)',
      widths: [1024, 512, 256],
    },
    {
      id: 'avatar',
      rounded: false,
      label: 'Emblème, avatar de réseau social (carré plein)',
      widths: [1024, 400],
    },
  ];
  for (const v of variants) {
    const name = `arbre-aux-absents-${v.id}`;
    const doc = emblemDoc(v.rounded);
    const probe = await load(name, doc, { width: 1024, height: 1024 });
    const pdf = join(WORK, `${name}.pdf`);
    await probe.pdf({ path: pdf, width: '1024px', height: '1024px', printBackground: true });
    await probe.close();
    pdfToSvg(pdf, join(OUT, 'logos', `${name}.svg`));
    files.push({
      group: 'logos',
      path: `logos/${name}.svg`,
      label: v.label,
      format: 'SVG',
      detail: 'vectoriel, halo de lampe en image',
    });
    for (const width of v.widths) {
      const page = await load(name, doc, { width: 1024, height: 1024 }, width / 1024);
      const out = ensureDir(join(OUT, 'logos', `${name}-${width}.png`));
      await page.screenshot({
        path: out,
        omitBackground: true,
        clip: { x: 0, y: 0, width: 1024, height: 1024 },
      });
      await page.close();
      files.push({
        group: 'logos',
        path: `logos/${name}-${width}.png`,
        label: v.label,
        format: 'PNG',
        detail: `${width} × ${width} px${v.rounded ? ', coins transparents' : ''}`,
      });
    }
  }
}

/** Logos de la maison (fichiers d'origine, `apps/site/static/brand/`), pour l'archive. */
export function houseFiles(): { from: string; to: string }[] {
  return ['cardor-monogram', 'interactive', 'creative'].map((id) => ({
    from: `apps/site/static/brand/${id}.svg`,
    to: `logos/maison/${id}.svg`,
  }));
}

export async function buildLogos(): Promise<KitFile[]> {
  rmSync(join(OUT, 'logos'), { recursive: true, force: true });
  const files: KitFile[] = [];
  for (const l of LOCKUPS) for (const t of TONES) await lockup(l, t, files);
  await emblem(files);
  return files;
}
