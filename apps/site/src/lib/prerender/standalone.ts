/**
 * SVG d'art autonomes (prérendu seulement), servis comme fichiers externes mis en cache plutôt
 * qu'inlinés dans le HTML : fond de la carte (sans texte) et portraits.
 *
 * Un SVG chargé comme image (`<img>`, `<image>`) ne voit ni la CSS de la page ni ses motifs : on y
 * embarque donc `art.css` (DESIGN §10) dont les `var(--…)` sont résolues au build depuis
 * `tokens.css`, et les motifs de gravure d'`<ArtDefs />`. Les couleurs restent celles des tokens
 * (aucune copie à la main). Le `<style>` embarqué est haché par `scripts/csp-hashes.sh`.
 */
import { createHash } from 'node:crypto';
import artCss from '@arbre/ui/styles/art.css?raw';
// Chemin relatif : le paquet n'exporte pas ses primitives une à une.
import artDefsSource from '../../../../../packages/ui/src/primitives/ArtDefs.svelte?raw';
import { parseSvg, type SvgChild, type SvgNode } from '#lib/svg/parse';
import { tokenValue } from '#lib/prerender/tokens';

/** `var(--x)` → valeur du token, jusqu'à ce qu'il n'en reste aucune. */
function resolveVars(css: string): string {
  let out = css;
  for (let i = 0; i < 8 && out.includes('var('); i += 1) {
    out = out.replace(/var\((--[\w-]+)\)/g, (whole, name: string) => tokenValue(name) ?? whole);
  }
  if (out.includes('var(')) throw new Error('standalone: token non résolu dans art.css');
  return out;
}

/** art.css autonome : tokens résolus, sans commentaires, espaces réduits. */
const ART_STYLE = resolveVars(artCss.replace(/\/\*[\s\S]*?\*\//g, ''))
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
// Contenu texte brut d'un élément XML (haché tel quel par la CSP) : pas de `<` ni de `&`.
if (/[<&]/.test(ART_STYLE)) throw new Error('standalone: art.css contient < ou &');

/** Les motifs de gravure (#art-hatch…), lus dans la primitive <ArtDefs /> : source unique. */
const ART_DEFS: SvgNode[] = (() => {
  const svg = parseSvg(artDefsSource);
  const defs = svg?.c.find((c): c is SvgNode => typeof c !== 'string' && c.t === 'defs');
  if (!defs) throw new Error('standalone: motifs introuvables dans ArtDefs.svelte');
  return defs.c.filter((c): c is SvgNode => typeof c !== 'string');
})();

const escAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function serialize(n: SvgChild): string {
  if (typeof n === 'string') return escText(n);
  const attrs = Object.entries(n.a)
    .map(([k, v]) => ` ${k}="${escAttr(v)}"`)
    .join('');
  return n.c.length
    ? `<${n.t}${attrs}>${n.c.map(serialize).join('')}</${n.t}>`
    : `<${n.t}${attrs}/>`;
}

export interface StandaloneSvg {
  /** Nom de fichier publié, avec empreinte : `<nom>.<hash10>.svg`. */
  file: string;
  body: string;
  width: number;
  height: number;
}

/**
 * Document SVG autonome à partir d'enfants d'art : racine `.art`, style et motifs embarqués,
 * dimensions intrinsèques tirées du viewBox (pour `width`/`height` côté HTML, sans décalage).
 */
export function standaloneSvg(name: string, viewBox: string, children: SvgChild[]): StandaloneSvg {
  const [, , w = 0, h = 0] = viewBox.split(/[\s,]+/).map(Number);
  const body =
    `<svg xmlns="http://www.w3.org/2000/svg" class="art" viewBox="${escAttr(viewBox)}"` +
    ` width="${w}" height="${h}"><style>${ART_STYLE}</style>` +
    `<defs>${ART_DEFS.map(serialize).join('')}</defs>${children.map(serialize).join('')}</svg>\n`;
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
  return { file: `${name}.${hash}.svg`, body, width: w, height: h };
}

/** Garde les `<text>` (et leurs ancêtres `<g>`, pour les transformations) ; `null` si aucun. */
export function onlyText(n: SvgNode): SvgNode | null {
  if (n.t === 'text') return n;
  if (n.t !== 'g' && n.t !== 'svg') return null;
  const c = n.c.flatMap((k) => (typeof k === 'string' ? [] : (onlyText(k) ?? [])));
  return c.length ? { ...n, c } : null;
}

/** Retire tous les `<text>` d'un arbre. */
export function withoutText(n: SvgNode): SvgNode {
  return {
    ...n,
    c: n.c.flatMap((k) =>
      typeof k !== 'string' && k.t === 'text' ? [] : [typeof k === 'string' ? k : withoutText(k)],
    ),
  };
}
