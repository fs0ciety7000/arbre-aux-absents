/**
 * Arbre SVG minimal, construit au prérendu à partir des SVG d'art du dépôt (carte, portraits,
 * logos), pour les rendre inline sans `{@html}` (règle ESLint du projet) : chaque nœud devient un
 * `<svelte:element>`, donc tout texte est échappé par Svelte.
 *
 * Les SVG sources sont déjà contrôlés par `content:check` (règle 8) ; on filtre quand même ici :
 * pas de `<script>`, `<foreignObject>`, `<style>` (bloqué par la CSP), d'attributs `on*` ou
 * `style`, ni de lien externe.
 */

export interface SvgNode {
  /** Nom d'élément (`path`, `g`, `clipPath`…). */
  t: string;
  /** Attributs, dans l'ordre du source. */
  a: Record<string, string>;
  /** Enfants : nœuds ou texte. */
  c: SvgChild[];
}
export type SvgChild = SvgNode | string;

const FORBIDDEN = new Set(['script', 'foreignObject', 'style', 'iframe', 'image', 'a']);
const DROPPED = new Set(['title', 'desc', 'metadata']);

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

function safeAttr(name: string, value: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith('on') || lower === 'style' || lower.startsWith('xmlns')) return false;
  if ((lower === 'href' || lower === 'xlink:href') && !value.startsWith('#')) return false;
  return true;
}

const TOKEN =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<![^>]*>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
const ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** Analyse un document SVG ; renvoie la racine `<svg>` ou `null`. */
export function parseSvg(source: string): SvgNode | null {
  const root: SvgNode = { t: '#root', a: {}, c: [] };
  const stack: SvgNode[] = [root];
  /** Profondeur d'un élément ignoré (interdit ou décoratif) : tout son contenu est sauté. */
  let skipping = 0;
  for (const m of source.matchAll(TOKEN)) {
    const [, cdata, close, open, attrs = '', selfClose, text] = m;
    const top = stack[stack.length - 1]!;
    if (open) {
      if (skipping || FORBIDDEN.has(open) || DROPPED.has(open)) {
        if (!selfClose) skipping += 1;
        continue;
      }
      const node: SvgNode = { t: open, a: {}, c: [] };
      for (const [, name, dq, sq] of attrs.matchAll(ATTR)) {
        const value = decode(dq ?? sq ?? '');
        if (name && safeAttr(name, value)) node.a[name] = value;
      }
      top.c.push(node);
      if (!selfClose) stack.push(node);
    } else if (close) {
      if (skipping) {
        skipping -= 1;
        continue;
      }
      if (stack.length > 1) stack.pop();
    } else if (!skipping && (text !== undefined || cdata !== undefined)) {
      const value = text !== undefined ? decode(text) : (cdata ?? '');
      if (value.trim()) top.c.push(value);
    }
    // Commentaires, instructions, doctype : ignorés.
  }
  const svg = root.c.find((n): n is SvgNode => typeof n !== 'string' && n.t === 'svg');
  return svg ?? null;
}

/** Copie d'un nœud dont les ids (et leurs références) sont préfixés : plusieurs exemplaires par page. */
export function prefixIds(node: SvgNode, prefix: string): SvgNode {
  const ids = new Set<string>();
  const collect = (n: SvgNode) => {
    if (n.a.id) ids.add(n.a.id);
    for (const c of n.c) if (typeof c !== 'string') collect(c);
  };
  collect(node);
  if (!ids.size) return node;
  const fix = (value: string): string =>
    value
      .replace(/url\(#([^)]+)\)/g, (w, id: string) => (ids.has(id) ? `url(#${prefix}${id})` : w))
      .replace(/^#(.+)$/, (w, id: string) => (ids.has(id) ? `#${prefix}${id}` : w));
  const walk = (n: SvgNode): SvgNode => {
    const a: Record<string, string> = {};
    for (const [k, v] of Object.entries(n.a)) {
      a[k] = k === 'id' && ids.has(v) ? `${prefix}${v}` : fix(v);
    }
    return { t: n.t, a, c: n.c.map((c) => (typeof c === 'string' ? c : walk(c))) };
  };
  return walk(node);
}
