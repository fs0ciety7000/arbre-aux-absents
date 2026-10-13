/**
 * SVG de contenu (couches de carte, portraits, illustrations) : chaînes produites par
 * `content:build` (svgo + règle 8 de `content:check`). On ne les injecte jamais en HTML
 * (`{@html}`, `innerHTML`) : elles sont analysées en XML (`image/svg+xml`), nettoyées une
 * seconde fois (défense en profondeur), puis importées comme nœuds DOM.
 */

const FORBIDDEN_TAGS = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'style']);
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Une référence est interne si elle vise un id du document (`#…`). */
const isInternalRef = (v: string) => v.trim().startsWith('#');

function scrub(el: Element): void {
  for (const child of [...el.children]) {
    if (FORBIDDEN_TAGS.has(child.localName.toLowerCase())) child.remove();
    else scrub(child);
  }
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on') || name === 'style') el.removeAttribute(attr.name);
    else if ((name === 'href' || name === 'xlink:href') && !isInternalRef(attr.value)) {
      el.removeAttribute(attr.name);
    }
  }
}

/**
 * Analyse une chaîne SVG et rend un `<svg>` importé dans `doc`, nettoyé, ou `null` (vide,
 * invalide, ou racine qui n'est pas un `<svg>`).
 */
export function parseSvg(markup: string, doc: Document = document): SVGSVGElement | null {
  if (!markup || typeof DOMParser === 'undefined') return null;
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = parsed.documentElement;
  if (!root || root.localName !== 'svg' || root.namespaceURI !== SVG_NS) return null;
  if (parsed.getElementsByTagName('parsererror').length > 0) return null;
  scrub(root);
  return doc.importNode(root, true) as unknown as SVGSVGElement;
}

/**
 * Action Svelte (`use:svgContent={markup}`) : remplace le contenu de l'élément par le SVG
 * analysé. Mise à jour si la chaîne change ; rien d'injecté en HTML.
 */
export function svgContent(
  node: Element,
  markup: string | null | undefined,
): { update(next: string | null | undefined): void; destroy(): void } {
  let current: string | null | undefined;
  function apply(next: string | null | undefined) {
    if (next === current) return;
    current = next;
    const svg = next ? parseSvg(next, node.ownerDocument) : null;
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.classList.add('art');
      node.replaceChildren(svg);
    } else node.replaceChildren();
  }
  apply(markup);
  return { update: apply, destroy: () => node.replaceChildren() };
}
