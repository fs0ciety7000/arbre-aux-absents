/**
 * SVG de contenu : contrôle (ARCHITECTURE §3.7 règle 8), optimisation svgo, préfixage des ids.
 * Le contrôle repose sur un petit analyseur XML strict (pas d'entités, pas de DOCTYPE).
 */
import { optimize } from 'svgo';
import { ART_CLASSES, ART_PAINT_KEYWORDS, ART_PATTERN_IDS, ART_ROOT_CLASS } from './art';

export interface SvgElement {
  name: string;
  attrs: Map<string, string>;
  line: number;
}

export interface SvgProblem {
  line?: number;
  message: string;
}

export interface SvgParse {
  elements: SvgElement[];
  problems: SvgProblem[];
}

const NAME = /[A-Za-z_][\w:.-]*/y;

/** Analyse XML minimale : éléments et attributs, avec numéro de ligne. */
export function parseSvgElements(src: string): SvgParse {
  const elements: SvgElement[] = [];
  const problems: SvgProblem[] = [];
  const stack: string[] = [];
  let i = 0;
  let line = 1;
  const advance = (to: number) => {
    for (let k = i; k < to; k++) if (src[k] === '\n') line++;
    i = to;
  };
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) {
      advance(src.length);
      break;
    }
    advance(lt);
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end < 0) {
        problems.push({ line, message: 'commentaire non refermé' });
        break;
      }
      advance(end + 3);
      continue;
    }
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i + 2);
      if (end < 0) {
        problems.push({ line, message: 'instruction <? non refermée' });
        break;
      }
      advance(end + 2);
      continue;
    }
    if (src.startsWith('<!', i)) {
      problems.push({ line, message: 'DOCTYPE, ENTITY ou CDATA interdits' });
      const end = src.indexOf('>', i);
      advance(end < 0 ? src.length : end + 1);
      continue;
    }
    if (src.startsWith('</', i)) {
      NAME.lastIndex = i + 2;
      const m = NAME.exec(src);
      const end = src.indexOf('>', i);
      if (!m || end < 0) {
        problems.push({ line, message: 'balise fermante invalide' });
        break;
      }
      const open = stack.pop();
      if (open !== m[0]) {
        problems.push({ line, message: `balise </${m[0]}> inattendue (ouverte : ${open ?? '∅'})` });
      }
      advance(end + 1);
      continue;
    }
    // Balise ouvrante.
    NAME.lastIndex = i + 1;
    const m = NAME.exec(src);
    if (!m) {
      problems.push({ line, message: 'caractère « < » invalide' });
      advance(i + 1);
      continue;
    }
    const el: SvgElement = { name: m[0], attrs: new Map(), line };
    let j = i + 1 + m[0].length;
    let selfClosing = false;
    let ok = false;
    const attrRe = /\s*(?:([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')|(\/?>))/y;
    for (;;) {
      attrRe.lastIndex = j;
      const a = attrRe.exec(src);
      if (!a) break;
      j = attrRe.lastIndex;
      if (a[4]) {
        selfClosing = a[4] === '/>';
        ok = true;
        break;
      }
      const name = a[1]!;
      if (el.attrs.has(name)) problems.push({ line, message: `attribut ${name} en double` });
      el.attrs.set(name, a[2] ?? a[3] ?? '');
    }
    if (!ok) {
      problems.push({ line, message: `balise <${el.name}> mal formée` });
      advance(src.indexOf('>', i) < 0 ? src.length : src.indexOf('>', i) + 1);
      continue;
    }
    elements.push(el);
    if (!selfClosing) stack.push(el.name);
    advance(j);
  }
  if (stack.length) problems.push({ message: `balise(s) non refermée(s) : ${stack.join(', ')}` });
  return { elements, problems };
}

const FORBIDDEN_ELEMENTS = new Set([
  'script',
  'foreignObject',
  'style',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'canvas',
  'animate',
  'set',
  'animateMotion',
  'animateTransform',
  'handler',
  'listener',
]);
const PAINT_ATTRS = new Set([
  'fill',
  'stroke',
  'stop-color',
  'flood-color',
  'lighting-color',
  'color',
]);
const ALLOWED_CLASSES = new Set<string>([...ART_CLASSES, ART_ROOT_CLASS]);
const EXTERNAL_IDS = new Set<string>(ART_PATTERN_IDS);
const LOCAL_URL = /^url\(\s*#([\w.-]+)\s*\)$/;

export interface SvgCheckOptions {
  /** Préfixe obligatoire des ids (nom du fichier sans extension). */
  idPrefix: string;
  /** Autres préfixes admis (couche `places` : `place-<placeId>`, lu par le renderer de carte). */
  extraPrefixes?: string[];
  /** viewBox exigée (couches de carte). */
  viewBox?: string;
}

/** Contrôle d'un SVG source selon la règle 8. */
export function checkSvg(src: string, opts: SvgCheckOptions): SvgProblem[] {
  const { elements, problems } = parseSvgElements(src);
  const root = elements[0];
  if (!root || root.name !== 'svg') {
    problems.push({ message: 'la racine doit être <svg>' });
    return problems;
  }
  if (!root.attrs.get('viewBox')) problems.push({ line: root.line, message: 'viewBox manquante' });
  if (opts.viewBox !== undefined) {
    const vb = (root.attrs.get('viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const want = opts.viewBox.split(' ').map(Number);
    if (vb.length !== 4 || vb.some((n, k) => Math.abs(n - want[k]!) > 1e-6)) {
      problems.push({
        line: root.line,
        message: `viewBox « ${root.attrs.get('viewBox') ?? ''} » ≠ « ${opts.viewBox} »`,
      });
    }
  }
  const ids = new Set<string>();
  for (const el of elements) {
    const id = el.attrs.get('id');
    if (id !== undefined) {
      if (ids.has(id)) problems.push({ line: el.line, message: `id « ${id} » en double` });
      ids.add(id);
      const prefixes = [opts.idPrefix, ...(opts.extraPrefixes ?? [])];
      if (!prefixes.some((pre) => id.startsWith(`${pre}-`))) {
        problems.push({
          line: el.line,
          message: `id « ${id} » non préfixé par « ${opts.idPrefix}- »`,
        });
      }
    }
  }
  const refOk = (target: string) => ids.has(target) || EXTERNAL_IDS.has(target);
  for (const el of elements) {
    if (FORBIDDEN_ELEMENTS.has(el.name)) {
      problems.push({ line: el.line, message: `élément <${el.name}> interdit` });
    }
    for (const [name, value] of el.attrs) {
      const lower = name.toLowerCase();
      if (lower.startsWith('on')) {
        problems.push({ line: el.line, message: `attribut d'événement ${name} interdit` });
      } else if (lower === 'style') {
        problems.push({
          line: el.line,
          message: 'attribut style= interdit (utiliser les classes)',
        });
      } else if (lower === 'href' || lower === 'xlink:href') {
        if (!value.startsWith('#')) {
          problems.push({ line: el.line, message: `href externe interdit : ${value}` });
        } else if (!refOk(value.slice(1))) {
          problems.push({ line: el.line, message: `href vers un id inconnu : ${value}` });
        }
      } else if (PAINT_ATTRS.has(lower)) {
        const v = value.trim();
        const url = LOCAL_URL.exec(v);
        if (url) {
          if (!refOk(url[1]!)) {
            problems.push({ line: el.line, message: `${name} vers un id inconnu : ${v}` });
          }
        } else if (!(ART_PAINT_KEYWORDS as readonly string[]).includes(v)) {
          problems.push({
            line: el.line,
            message: `couleur en dur interdite : ${name}="${v}" (classes d'art, none, currentColor, url(#…))`,
          });
        }
      } else if (lower === 'class') {
        for (const c of value.split(/\s+/).filter(Boolean)) {
          if (!ALLOWED_CLASSES.has(c)) {
            problems.push({ line: el.line, message: `classe hors ART_CLASSES : ${c}` });
          }
        }
      } else if (/url\(/i.test(value)) {
        const all = [...value.matchAll(/url\(\s*([^)]*)\)/gi)];
        for (const u of all) {
          const target = (u[1] ?? '').replace(/^['"]|['"]$/g, '');
          if (!target.startsWith('#') || !refOk(target.slice(1))) {
            problems.push({ line: el.line, message: `${name} : url() non locale ou inconnue` });
          }
        }
      }
    }
  }
  return problems;
}

/** Nombre d'éléments (nœuds DOM) d'un SVG. */
export function countElements(src: string): number {
  return parseSvgElements(src).elements.length;
}

export interface OptimizedSvg {
  svg: string;
  problems: SvgProblem[];
}

/**
 * Optimise (svgo), préfixe les ids définis dans le fichier (`prefix`), pose la classe d'art
 * racine, puis recontrôle la sortie (aucune construction dangereuse ne doit survivre).
 */
export function optimizeSvg(src: string, prefix: string): OptimizedSvg {
  let out: string;
  try {
    out = optimize(src, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: { overrides: { cleanupIds: false, convertColors: false } },
        },
        'removeScripts',
      ],
    }).data;
  } catch (e) {
    return { svg: '', problems: [{ message: `svgo : ${(e as Error).message}` }] };
  }
  out = prefixIds(out, prefix);
  out = addRootClass(out, ART_ROOT_CLASS);
  const problems: SvgProblem[] = [];
  const { elements, problems: parseProblems } = parseSvgElements(out);
  problems.push(...parseProblems);
  for (const el of elements) {
    if (FORBIDDEN_ELEMENTS.has(el.name)) problems.push({ message: `<${el.name}> après svgo` });
    for (const [name, value] of el.attrs) {
      const lower = name.toLowerCase();
      if (lower.startsWith('on') || lower === 'style') {
        problems.push({ message: `${name} après svgo` });
      }
      if ((lower === 'href' || lower === 'xlink:href') && !value.startsWith('#')) {
        problems.push({ message: `href externe après svgo` });
      }
    }
  }
  return { svg: out, problems };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Préfixe les ids définis dans le document et leurs références (url(#…), href="#…"). */
export function prefixIds(svg: string, prefix: string): string {
  const defined = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
  if (defined.size === 0 || !prefix) return svg;
  let out = svg;
  for (const id of defined) {
    const e = escapeRe(id);
    out = out
      .replace(new RegExp(`(\\sid=")${e}"`, 'g'), `$1${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${e}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`(href=")#${e}"`, 'g'), `$1#${prefix}${id}"`);
  }
  return out;
}

function addRootClass(svg: string, cls: string): string {
  return svg.replace(/^<svg\b([^>]*)>/, (whole, attrs: string) => {
    const m = /\sclass="([^"]*)"/.exec(attrs);
    if (m) {
      const list = m[1]!.split(/\s+/).filter(Boolean);
      if (list.includes(cls)) return whole;
      return `<svg${attrs.replace(m[0], ` class="${[cls, ...list].join(' ')}"`)}>`;
    }
    return `<svg class="${cls}"${attrs}>`;
  });
}
