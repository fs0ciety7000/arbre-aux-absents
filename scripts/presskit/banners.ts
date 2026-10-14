/**
 * Bannières et visuels sociaux (JPEG), tirés de l'art clé « Le bureau sous la lampe » : le titre
 * se pose toujours dans la zone calme de l'image, sur un voile de nuit (charte : « À faire »).
 * Les zones de sécurité des plateformes sont respectées (YouTube : 1546 × 423 au centre).
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { PRESS_HOOK } from '../../apps/site/src/lib/content/press';
import { artSvg, ensureDir, html, load, noGrain, OUT, wordmark } from './lib';
import type { KitFile } from './manifest';

type Layout = 'side' | 'center' | 'stack';

interface Banner {
  id: string;
  label: string;
  width: number;
  height: number;
  layout: Layout;
  /** Taille du titre en px. */
  size: number;
  /** Marge de sécurité (px) autour du texte. */
  safe?: { x: number; y: number };
  hook?: boolean;
  cta?: boolean;
}

const BANNERS: Banner[] = [
  {
    id: 'itch-banniere-1920x600',
    label: 'itch.io, bannière de page (affichée en 960 × 300)',
    width: 1920,
    height: 600,
    layout: 'side',
    size: 118,
  },
  {
    id: 'x-entete-1500x500',
    label: 'X (Twitter), en-tête de profil',
    width: 1500,
    height: 500,
    layout: 'side',
    size: 96,
    safe: { x: 90, y: 70 },
  },
  {
    id: 'facebook-couverture-1640x624',
    label: 'Facebook, photo de couverture (2× 820 × 312)',
    width: 1640,
    height: 624,
    layout: 'side',
    size: 116,
    safe: { x: 200, y: 60 },
  },
  {
    id: 'youtube-banniere-2560x1440',
    label: 'YouTube, bannière de chaîne (zone sûre 1546 × 423 au centre)',
    width: 2560,
    height: 1440,
    layout: 'center',
    size: 150,
    hook: true,
  },
  {
    id: 'twitch-banniere-1200x480',
    label: 'Twitch, bannière de profil',
    width: 1200,
    height: 480,
    layout: 'side',
    size: 92,
  },
  {
    id: 'og-1200x630',
    label: 'Partage (Open Graph, Discord), aperçu de lien',
    width: 1200,
    height: 630,
    layout: 'side',
    size: 108,
    cta: true,
  },
  {
    id: 'carre-1080x1080',
    label: 'Visuel carré (Instagram, Mastodon, Bluesky)',
    width: 1080,
    height: 1080,
    layout: 'stack',
    size: 94,
    hook: true,
    cta: true,
  },
  {
    id: 'story-1080x1920',
    label: 'Story verticale (Instagram, TikTok, Shorts), zones sûres 250 px',
    width: 1080,
    height: 1920,
    layout: 'stack',
    size: 112,
    safe: { x: 80, y: 250 },
    hook: true,
    cta: true,
  },
];

const CSS = `
.b { position: relative; overflow: hidden; isolation: isolate; background-color: var(--canvas); color: var(--text); }
.b .art-box { position: absolute; inset: 0; z-index: -2; }
.b .art-box svg { display: block; width: 100%; height: 100%; }
.b .veil { position: absolute; inset: 0; z-index: -1; }
.b .txt { position: absolute; display: grid; gap: 0.18em; font-size: var(--wm); }
.b .wm { --wm-size: 1em; }
.label { font-size: 0.17em; justify-self: start; transform: rotate(-2deg); margin-bottom: 0.25em; }
.hook { font-family: var(--font-display); font-variation-settings: var(--display-settings); font-style: italic;
  font-weight: 400; font-size: 0.3em; line-height: var(--leading-snug); color: var(--text-muted);
  text-wrap: balance; }
.cta { display: flex; align-items: center; gap: 0.6em; font-size: 0.17em; margin-top: 0.4em; }
.cta .url { font-family: var(--font-label); text-transform: uppercase; letter-spacing: var(--tracking-stamp);
  color: var(--text); }

/* Titre à droite, art clé à gauche (zone calme : tiers droit du 16:9) */
.side .veil { background: linear-gradient(to left, var(--canvas) 0%, color-mix(in oklch, var(--canvas) 88%, transparent) 34%, transparent 66%); }
.side .txt { right: var(--sx); top: 50%; transform: translateY(-50%); justify-items: start; }

/* Titre au centre, sur un voile radial */
.center .veil { background: radial-gradient(34% 28% at 50% 50%, color-mix(in oklch, var(--canvas) 92%, transparent), transparent 100%),
  linear-gradient(color-mix(in oklch, var(--canvas) 35%, transparent), color-mix(in oklch, var(--canvas) 35%, transparent)); }
.center .txt { left: 50%; top: 50%; transform: translate(-50%, -50%); justify-items: center; text-align: center; }
.center .hook { max-width: 18em; }

/* Art clé 4:5 en haut, titre en bas */
.stack .art-box { bottom: auto; height: var(--art-h);
  -webkit-mask: linear-gradient(to bottom, #000 55%, transparent 98%); mask: linear-gradient(to bottom, #000 55%, transparent 98%); }
.stack .txt { left: var(--sx); right: var(--sx); bottom: var(--sy); justify-items: center; text-align: center; }
.stack .label { justify-self: center; }
.stack .cta { justify-content: center; }
`;

function body(b: Banner): string {
  const tall = b.layout === 'stack';
  const art = artSvg(tall ? 'art/keyart/keyart-desk-tall.svg' : 'art/keyart/keyart-desk.svg', {
    preserveAspectRatio: tall ? 'xMidYMin slice' : 'xMinYMid slice',
  }).markup;
  const sx = b.safe?.x ?? Math.round(b.width * 0.05);
  const sy = b.safe?.y ?? Math.round(b.height * 0.06);
  const artH = Math.round(Math.min(b.width * 1.25, b.height * 0.74));
  const lockup = wordmark({ stacked: b.layout === 'side', center: b.layout !== 'side' });
  const hook = b.hook ? `<p class="hook">${PRESS_HOOK.replace('1974. ', '1974.<br>')}</p>` : '';
  const cta = b.cta
    ? '<p class="cta"><span class="mat-label red">Gratuit sur itch.io</span><span class="url">arbre.cardormedia.com</span></p>'
    : '';
  return `<div class="b ${b.layout}" id="b" style="width:${b.width}px;height:${b.height}px;--wm:${b.size}px;--sx:${sx}px;--sy:${sy}px;--art-h:${artH}px">
<div class="art-box">${art}</div><div class="veil"></div>
<div class="txt"><span class="mat-label red label">Un jeu d’enquête généalogique</span>${lockup}${hook}${cta}</div></div>`;
}

export async function buildBanners(): Promise<KitFile[]> {
  rmSync(join(OUT, 'bannieres'), { recursive: true, force: true });
  const files: KitFile[] = [];
  for (const b of BANNERS) {
    const name = `arbre-aux-absents-${b.id}`;
    const page = await load(name, html({ body: body(b), css: CSS, title: b.label }), {
      width: b.width,
      height: b.height,
    });
    await noGrain(page);
    // JPEG (qualité 90) : l'art est peint en aplats et lavis, le PNG pèserait quatre fois plus.
    const out = ensureDir(join(OUT, 'bannieres', `${name}.jpg`));
    await page.screenshot({
      path: out,
      type: 'jpeg',
      quality: 90,
      clip: { x: 0, y: 0, width: b.width, height: b.height },
    });
    await page.close();
    files.push({
      group: 'bannieres',
      path: `bannieres/${name}.jpg`,
      label: b.label,
      format: 'JPEG',
      detail: `${b.width} × ${b.height} px`,
    });
  }
  return files;
}
