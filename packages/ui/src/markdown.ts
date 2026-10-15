/**
 * Markdown simple des descriptions de signalement (DESIGN.md §9.37, ARCHITECTURE §8) : insertion
 * de la syntaxe à la sélection (`applyMarkdown`, barre d'outils de `MarkdownField`) et lecture en
 * arbre pour l'aperçu (`parseMarkdown`). Fonctions pures, sans DOM.
 *
 * L'aperçu ne produit **jamais** de HTML : un arbre de nœuds que `MarkdownPreview` rend en
 * éléments Svelte (texte échappé par construction). Seules les constructions de la barre sont
 * reconnues : gras, italique, code, bloc de code, listes, citation, lien. Pas d'image : `![…](…)`
 * reste un lien (le service fait de même), pas de HTML (rendu tel quel, en texte).
 */

export type MarkdownFormat =
  'bold' | 'italic' | 'code' | 'codeBlock' | 'bulletList' | 'numberedList' | 'quote' | 'link';

export const MARKDOWN_FORMATS: readonly MarkdownFormat[] = [
  'bold',
  'italic',
  'code',
  'codeBlock',
  'bulletList',
  'numberedList',
  'quote',
  'link',
];

/** Textes insérés quand la sélection est vide (traduits, `UiStrings.markdown.placeholder`). */
export interface MarkdownPlaceholders {
  text: string;
  code: string;
  url: string;
}

export interface TextEdit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const INLINE: Partial<Record<MarkdownFormat, string>> = { bold: '**', italic: '_', code: '`' };
const LINE_PREFIX: Partial<Record<MarkdownFormat, (i: number) => string>> = {
  bulletList: () => '- ',
  numberedList: (i) => `${i + 1}. `,
  quote: () => '> ',
};
const PREFIX_RE: Partial<Record<MarkdownFormat, RegExp>> = {
  bulletList: /^[-*+] /,
  numberedList: /^\d{1,9}[.)] /,
  quote: /^> ?/,
};

const edit = (value: string, selectionStart: number, selectionEnd = selectionStart): TextEdit => ({
  value,
  selectionStart,
  selectionEnd,
});

/** Gras, italique, code en ligne : entoure la sélection, ou retire les marques si elle l'est déjà. */
function wrapInline(value: string, start: number, end: number, mark: string, ph: string): TextEdit {
  // Un double-clic sélectionne souvent l'espace qui suit : il reste hors des marques.
  let s = start;
  let e = end;
  while (e > s && /\s/.test(value[e - 1]!)) e--;
  while (s < e && /\s/.test(value[s]!)) s++;
  const n = mark.length;
  const inner = value.slice(s, e);
  // Déjà entourée (marques autour ou dans la sélection) : on les retire.
  if (value.slice(s - n, s) === mark && value.slice(e, e + n) === mark && s - n >= 0) {
    return edit(value.slice(0, s - n) + inner + value.slice(e + n), s - n, e - n);
  }
  if (inner.length >= 2 * n && inner.startsWith(mark) && inner.endsWith(mark)) {
    const bare = inner.slice(n, inner.length - n);
    return edit(value.slice(0, s) + bare + value.slice(e), s, s + bare.length);
  }
  const text = inner || ph;
  const out = value.slice(0, s) + mark + text + mark + value.slice(e);
  return edit(out, s + n, s + n + text.length);
}

/** Début et fin des lignes couvertes par la sélection. */
function lineBounds(value: string, start: number, end: number): [number, number] {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  // Une sélection qui se termine en début de ligne n'inclut pas cette ligne.
  const last = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const nl = value.indexOf('\n', last);
  return [from, nl === -1 ? value.length : nl];
}

/** Listes et citation : préfixe chaque ligne (numérotée), ou le retire si toutes l'ont déjà. */
function prefixLines(value: string, start: number, end: number, format: MarkdownFormat): TextEdit {
  const make = LINE_PREFIX[format]!;
  const re = PREFIX_RE[format]!;
  const [from, to] = lineBounds(value, start, end);
  const lines = value.slice(from, to).split('\n');
  const filled = lines.filter((l) => l.trim() !== '');
  const remove = filled.length > 0 && filled.every((l) => re.test(l));
  let i = 0;
  const next = lines.map((line) => {
    if (remove) return line.replace(re, '');
    if (line.trim() === '' && lines.length > 1) return line;
    // Une autre liste ou citation devient celle-ci (pas de « - 1. »).
    const bare = line.replace(/^(?:[-*+] |\d{1,9}[.)] |> ?)/, '');
    return make(i++) + bare;
  });
  const block = next.join('\n');
  const out = value.slice(0, from) + block + value.slice(to);
  // Ligne vide : le curseur se place après le préfixe, prêt à écrire.
  if (start === end && lines.length === 1) {
    const caret = Math.max(from, start + (block.length - (to - from)));
    return edit(out, Math.min(caret, from + block.length));
  }
  return edit(out, from, from + block.length);
}

function codeBlock(value: string, start: number, end: number, ph: string): TextEdit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const inner = value.slice(start, end).replace(/\n+$/, '') || ph;
  const lead = before === '' || before.endsWith('\n') ? '' : '\n';
  const tail = after === '' || after.startsWith('\n') ? '' : '\n';
  const open = `${lead}\`\`\`\n`;
  const out = `${before}${open}${inner}\n\`\`\`${tail}${after}`;
  const s = before.length + open.length;
  return edit(out, s, s + inner.length);
}

const URL_RE = /^https?:\/\/\S+$/i;

function link(value: string, start: number, end: number, ph: MarkdownPlaceholders): TextEdit {
  const sel = value.slice(start, end).trim();
  const before = value.slice(0, start);
  const after = value.slice(end);
  if (sel && URL_RE.test(sel)) {
    // Une adresse sélectionnée : on demande le texte du lien.
    const out = `${before}[${ph.text}](${sel})${after}`;
    return edit(out, start + 1, start + 1 + ph.text.length);
  }
  const text = sel || ph.text;
  const out = `${before}[${text}](${ph.url})${after}`;
  if (!sel) return edit(out, start + 1, start + 1 + text.length);
  const u = start + text.length + 3;
  return edit(out, u, u + ph.url.length);
}

/**
 * Applique un format de la barre d'outils à `value` pour la sélection [`start`, `end`) ; rend le
 * nouveau texte et la sélection à poser (le texte de remplacement sélectionné, prêt à être tapé).
 */
export function applyMarkdown(
  value: string,
  start: number,
  end: number,
  format: MarkdownFormat,
  placeholders: MarkdownPlaceholders,
): TextEdit {
  const s = Math.max(0, Math.min(start, end, value.length));
  const e = Math.min(value.length, Math.max(start, end));
  const mark = INLINE[format];
  if (mark) return wrapInline(value, s, e, mark, placeholders.text);
  if (LINE_PREFIX[format]) return prefixLines(value, s, e, format);
  if (format === 'codeBlock') return codeBlock(value, s, e, placeholders.code);
  return link(value, s, e, placeholders);
}

/** Raccourcis clavier (Ctrl ou ⌘ + lettre) des formats en ligne. */
export const MARKDOWN_SHORTCUTS: Readonly<Record<string, MarkdownFormat>> = {
  b: 'bold',
  i: 'italic',
  k: 'link',
};

// ── Lecture pour l'aperçu ───────────────────────────────────────────────

export type MdInline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: MdInline[] }
  | { kind: 'em'; children: MdInline[] }
  | { kind: 'code'; text: string }
  /** Lien : jamais cliquable dans l'aperçu ; `href` seulement http(s). */
  | { kind: 'link'; href: string; children: MdInline[] }
  | { kind: 'break' };

export type MdBlock =
  | { kind: 'paragraph'; children: MdInline[] }
  | { kind: 'code'; text: string }
  | { kind: 'list'; ordered: boolean; start: number; items: MdInline[][] }
  | { kind: 'quote'; children: MdBlock[] };

const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/** Fusionne les textes voisins (lecteurs d'écran, comparaisons de tests). */
function pushText(out: MdInline[], text: string) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last?.kind === 'text') last.text += text;
  else out.push({ kind: 'text', text });
}

/** Ligne de texte en nœuds en ligne (`depth` borne l'imbrication). */
export function parseInline(src: string, depth = 0): MdInline[] {
  const out: MdInline[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (c === '\\' && i + 1 < src.length && /[\\`*_[\]()>#+\-.!]/.test(src[i + 1]!)) {
      pushText(out, src[i + 1]!);
      i += 2;
      continue;
    }
    if (c === '\n') {
      out.push({ kind: 'break' });
      i++;
      continue;
    }
    if (c === '`') {
      let n = 1;
      while (src[i + n] === '`') n++;
      const fence = '`'.repeat(n);
      const close = src.indexOf(fence, i + n);
      if (close > i + n - 1 && close !== -1) {
        const raw = src.slice(i + n, close).replace(/\n/g, ' ');
        const text = /^ .* $/.test(raw) && raw.trim() ? raw.slice(1, -1) : raw;
        out.push({ kind: 'code', text });
        i = close + n;
        continue;
      }
      pushText(out, fence);
      i += n;
      continue;
    }
    if (depth < 4 && (src.startsWith('**', i) || src.startsWith('__', i))) {
      const mark = src.slice(i, i + 2);
      const close = src.indexOf(mark, i + 2);
      if (close > i + 2 && !/\s/.test(src[i + 2]!) && !/\s/.test(src[close - 1]!)) {
        out.push({ kind: 'strong', children: parseInline(src.slice(i + 2, close), depth + 1) });
        i = close + 2;
        continue;
      }
    }
    if (depth < 4 && (c === '_' || c === '*')) {
      const open = !/\s/.test(src[i + 1] ?? ' ') && (c === '*' || !isWord(src[i - 1]));
      if (open) {
        let close = src.indexOf(c, i + 1);
        while (close !== -1) {
          const okBefore = !/\s/.test(src[close - 1]!);
          const okAfter = c === '*' || !isWord(src[close + 1]);
          // `**` à l'intérieur : ce n'est pas la fermeture de l'italique.
          const doubled = src[close + 1] === c;
          if (okBefore && okAfter && !doubled && close > i + 1) break;
          close = src.indexOf(c, close + (doubled ? 2 : 1));
        }
        if (close !== -1) {
          out.push({ kind: 'em', children: parseInline(src.slice(i + 1, close), depth + 1) });
          i = close + 1;
          continue;
        }
      }
    }
    if (c === '[' && depth < 4) {
      const mid = src.indexOf('](', i + 1);
      const end = mid === -1 ? -1 : src.indexOf(')', mid + 2);
      if (mid > i + 1 && end !== -1 && !src.slice(i + 1, mid).includes('[')) {
        const href = src.slice(mid + 2, end).trim();
        const children = parseInline(src.slice(i + 1, mid), depth + 1);
        if (URL_RE.test(href)) out.push({ kind: 'link', href, children });
        else {
          // Adresse non http(s) (`javascript:`…) : texte seulement, jamais un lien.
          pushText(out, '[');
          out.push(...children);
          pushText(out, `](${href})`);
        }
        i = end + 1;
        continue;
      }
    }
    pushText(out, c);
    i++;
  }
  // Fusion des textes voisins produits par la récursion.
  const merged: MdInline[] = [];
  for (const node of out) {
    if (node.kind === 'text') pushText(merged, node.text);
    else merged.push(node);
  }
  return merged;
}

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const BULLET = /^ {0,3}[-*+] +(.*)$/;
const ORDERED = /^ {0,3}(\d{1,9})[.)] +(.*)$/;
const QUOTE = /^ {0,3}> ?(.*)$/;

/** Description en blocs (paragraphes, code, listes, citations), profondeur de citation bornée. */
export function parseMarkdown(src: string, depth = 0): MdBlock[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'paragraph', children: parseInline(para.join('\n')) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const fence = FENCE.exec(line);
    if (fence) {
      flush();
      const mark = fence[1]!;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith(mark)) body.push(lines[i++]!);
      blocks.push({ kind: 'code', text: body.join('\n') });
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (depth < 3 && QUOTE.test(line)) {
      flush();
      const inner: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i]!)) inner.push(QUOTE.exec(lines[i++]!)![1]!);
      i--;
      blocks.push({ kind: 'quote', children: parseMarkdown(inner.join('\n'), depth + 1) });
      continue;
    }
    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    if (bullet || ordered) {
      flush();
      const isOrdered = ordered !== null;
      const re = isOrdered ? ORDERED : BULLET;
      const items: MdInline[][] = [];
      const start = isOrdered ? Number(ordered[1]) : 1;
      while (i < lines.length && re.test(lines[i]!)) {
        const m = re.exec(lines[i++]!)!;
        items.push(parseInline(isOrdered ? m[2]! : m[1]!));
      }
      i--;
      blocks.push({ kind: 'list', ordered: isOrdered, start, items });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}
