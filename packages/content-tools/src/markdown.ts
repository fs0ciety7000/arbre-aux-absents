/**
 * Parseur Markdown RESTREINT (ARCHITECTURE §3.6) → AST `Block[]` du contrat.
 *
 * Admis : paragraphes, `*em*`, `**strong**`, `~~barré~~`, `> citation`, listes (`-`, `*`, `+`, `1.`), tableaux
 * pipe, `## titres` et `### titres`, `![alt](illustrations/x.svg "légende")` seul sur sa ligne,
 * `[[texte|keyword-id]]`, `::hand[…]`, `::stamp[…]` et `::signature[…]` seuls sur leur ligne,
 * `::redacted[6]`, `---`, échappement `\x` d'un signe de ponctuation.
 * Tout le reste (HTML, entités, liens et URL, code, listes imbriquées…) est une erreur localisée.
 */
import type { Block, Inline } from '@arbre/contract';
import { ILLUSTRATION_FILE, KEBAB_CASE } from '@arbre/contract';

export interface MarkdownError {
  line: number;
  message: string;
}

export interface MarkdownResult {
  blocks: Block[];
  errors: MarkdownError[];
}

interface Line {
  text: string;
  line: number;
}

/** Longueur maximale d'un `::redacted[n]`. */
export const MAX_REDACTED = 200;

const ESCAPABLE = new Set('\\*[]|:<>&`!_#-+.()~'.split(''));
const LIST_ITEM = /^(?:([-*+])|(\d{1,9})[.)])[ \t]+(.*)$/;
const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const FIGURE = /^!\[([^\]]*)\]\(\s*([^\s)"]+)(?:\s+"([^"]*)")?\s*\)$/;
const BLOCK_DIRECTIVE = /^::(stamp|signature)\[(.*)\]$/;
const TABLE_SEPARATOR = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?$/;
const EXTERNAL_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** Sépare le frontmatter YAML (`---` … `---`) du corps, en conservant les numéros de ligne. */
export function splitFrontmatter(source: string): {
  frontmatter: string | null;
  body: string;
  /** Numéro (1-based) de la première ligne du corps dans le fichier. */
  bodyLine: number;
} {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n?---[ \t]*(?:\n|$)/.exec(text);
  if (!match) return { frontmatter: null, body: text, bodyLine: 1 };
  const consumed = match[0];
  const lines = consumed.split('\n').length - (consumed.endsWith('\n') ? 1 : 0);
  return { frontmatter: match[1] ?? '', body: text.slice(consumed.length), bodyLine: lines + 1 };
}

/** Analyse un corps Markdown. `firstLine` = numéro de sa première ligne dans le fichier. */
export function parseMarkdown(source: string, firstLine = 1): MarkdownResult {
  const errors: MarkdownError[] = [];
  const lines: Line[] = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((text, i) => ({ text: text.replace(/\t/g, '    '), line: firstLine + i }));
  const blocks = parseBlocks(lines, errors);
  return { blocks, errors };
}

function isBlank(l: Line | undefined): boolean {
  return l === undefined || l.text.trim() === '';
}

function indentOf(text: string): number {
  return text.length - text.trimStart().length;
}

/** Vrai si la ligne ouvre un bloc autre qu'un paragraphe (interrompt un paragraphe). */
function startsBlock(t: string): boolean {
  return (
    /^#{1,6}[ \t]/.test(t) ||
    t.startsWith('>') ||
    LIST_ITEM.test(t) ||
    t.startsWith('|') ||
    t.startsWith('```') ||
    t.startsWith('~~~') ||
    t === '---' ||
    FIGURE.test(t) ||
    BLOCK_DIRECTIVE.test(t)
  );
}

function parseBlocks(lines: Line[], errors: MarkdownError[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i]!;
    if (isBlank(cur)) {
      i++;
      continue;
    }
    if (indentOf(cur.text) >= 4) {
      errors.push({ line: cur.line, message: 'bloc indenté (code) non admis' });
      i++;
      continue;
    }
    const t = cur.text.trim();

    if (t.startsWith('```') || t.startsWith('~~~')) {
      errors.push({ line: cur.line, message: 'bloc de code non admis' });
      const fence = t.slice(0, 3);
      i++;
      while (i < lines.length && !lines[i]!.text.trim().startsWith(fence)) i++;
      i++;
      continue;
    }

    const heading = HEADING.exec(t);
    if (heading) {
      const level = heading[1]!.length;
      if (level !== 2 && level !== 3) {
        errors.push({
          line: cur.line,
          message: `titre de niveau ${level} non admis (seulement ## et ###)`,
        });
      } else {
        blocks.push({
          t: 'h',
          level: level as 2 | 3,
          c: parseInline(heading[2] ?? '', cur.line, errors),
        });
      }
      i++;
      continue;
    }

    if (t === '---') {
      blocks.push({ t: 'hr' });
      i++;
      continue;
    }
    if (/^(?:\*\s*){3,}$|^(?:_\s*){3,}$|^-{4,}$/.test(t)) {
      errors.push({ line: cur.line, message: 'séparateur non admis : utiliser exactement ---' });
      i++;
      continue;
    }

    if (t.startsWith('>')) {
      const inner: Line[] = [];
      while (i < lines.length && lines[i]!.text.trim().startsWith('>')) {
        const raw = lines[i]!.text.trim().slice(1);
        inner.push({ text: raw.startsWith(' ') ? raw.slice(1) : raw, line: lines[i]!.line });
        i++;
      }
      blocks.push({ t: 'quote', c: parseBlocks(inner, errors) });
      continue;
    }

    if (t.startsWith('|')) {
      const rows: Line[] = [];
      while (i < lines.length && lines[i]!.text.trim().startsWith('|')) rows.push(lines[i++]!);
      const table = parseTable(rows, errors);
      if (table) blocks.push(table);
      continue;
    }

    const figure = FIGURE.exec(t);
    if (figure) {
      const block = parseFigure(figure, cur.line, errors);
      if (block) blocks.push(block);
      i++;
      continue;
    }

    const directive = BLOCK_DIRECTIVE.exec(t);
    if (directive) {
      const content = directive[2] ?? '';
      if (directive[1] === 'stamp') {
        const text = content.replace(/\\(.)/g, '$1').trim();
        if (!text) errors.push({ line: cur.line, message: '::stamp[…] vide' });
        else if (/[[\]*<>]/.test(text))
          errors.push({ line: cur.line, message: '::stamp[…] n’admet que du texte simple' });
        else blocks.push({ t: 'stamp', text });
      } else {
        const c = parseInline(content.trim(), cur.line, errors);
        if (c.length === 0) errors.push({ line: cur.line, message: '::signature[…] vide' });
        else blocks.push({ t: 'signature', c });
      }
      i++;
      continue;
    }

    if (LIST_ITEM.test(t)) {
      i = parseList(lines, i, blocks, errors);
      continue;
    }

    // Paragraphe : lignes consécutives jusqu'à une ligne vide ou un autre bloc.
    const para: Line[] = [cur];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i]!.text.trim())) {
      if (indentOf(lines[i]!.text) >= 4) break;
      para.push(lines[i++]!);
    }
    const c = parseInline(para.map((l) => l.text.trim()).join('\n'), para[0]!.line, errors);
    if (c.length > 0) blocks.push({ t: 'p', c });
  }
  return blocks;
}

function parseList(lines: Line[], start: number, blocks: Block[], errors: MarkdownError[]): number {
  let i = start;
  const first = LIST_ITEM.exec(lines[i]!.text.trim())!;
  const ordered = first[2] !== undefined;
  const items: Inline[][] = [];
  const baseIndent = indentOf(lines[i]!.text);
  while (i < lines.length) {
    const l = lines[i]!;
    if (isBlank(l)) break;
    const t = l.text.trim();
    const m = LIST_ITEM.exec(t);
    const indent = indentOf(l.text);
    if (m && indent <= baseIndent + 1) {
      if ((m[2] !== undefined) !== ordered) break; // autre type de liste : nouveau bloc
      const parts: Line[] = [{ text: m[3] ?? '', line: l.line }];
      i++;
      while (i < lines.length && !isBlank(lines[i]) && indentOf(lines[i]!.text) > baseIndent) {
        const cont = lines[i]!;
        if (LIST_ITEM.test(cont.text.trim())) {
          errors.push({ line: cont.line, message: 'listes imbriquées non admises' });
        }
        parts.push({ text: cont.text.trim(), line: cont.line });
        i++;
      }
      const c = parseInline(parts.map((p) => p.text.trim()).join('\n'), parts[0]!.line, errors);
      if (c.length === 0) errors.push({ line: l.line, message: 'élément de liste vide' });
      items.push(c);
      continue;
    }
    if (m) {
      errors.push({ line: l.line, message: 'listes imbriquées non admises' });
      i++;
      continue;
    }
    break;
  }
  blocks.push({ t: 'list', ordered, items });
  return i;
}

/** Découpe une ligne de tableau sur les `|` hors échappement et hors `[[…]]`. */
export function splitTableRow(text: string): string[] {
  let t = text.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  const cells: string[] = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (ch === '\\' && i + 1 < t.length) {
      buf += ch + t[i + 1];
      i++;
      continue;
    }
    if (t.startsWith('[[', i)) {
      depth++;
      buf += '[[';
      i++;
      continue;
    }
    if (depth > 0 && t.startsWith(']]', i)) {
      depth--;
      buf += ']]';
      i++;
      continue;
    }
    if (ch === '|' && depth === 0) {
      cells.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

function parseTable(rows: Line[], errors: MarkdownError[]): Block | null {
  const [head, sep, ...body] = rows;
  if (!head || !sep || !TABLE_SEPARATOR.test(sep.text.trim())) {
    errors.push({
      line: (sep ?? head)!.line,
      message: 'tableau : la 2e ligne doit être un séparateur (| --- | --- |)',
    });
    return null;
  }
  const headCells = splitTableRow(head.text);
  const sepCells = splitTableRow(sep.text);
  if (sepCells.length !== headCells.length) {
    errors.push({
      line: sep.line,
      message: 'tableau : séparateur et en-tête de largeurs différentes',
    });
  }
  const table: Block = {
    t: 'table',
    head: headCells.map((c) => parseInline(c, head.line, errors)),
    rows: [],
  };
  for (const row of body) {
    const cells = splitTableRow(row.text);
    if (cells.length !== headCells.length) {
      errors.push({
        line: row.line,
        message: `tableau : ${cells.length} cellule(s) au lieu de ${headCells.length}`,
      });
    }
    table.rows.push(cells.map((c) => parseInline(c, row.line, errors)));
  }
  return table;
}

function parseFigure(m: RegExpExecArray, line: number, errors: MarkdownError[]): Block | null {
  const alt = (m[1] ?? '').trim();
  const asset = m[2] ?? '';
  const caption = m[3];
  let ok = true;
  if (!alt) {
    errors.push({ line, message: 'image sans texte alternatif (alt vide)' });
    ok = false;
  }
  if (EXTERNAL_URL.test(asset)) {
    errors.push({ line, message: `URL externe interdite : ${asset}` });
    ok = false;
  } else if (!ILLUSTRATION_FILE.test(asset)) {
    errors.push({ line, message: `image attendue sous illustrations/<nom>.svg : ${asset}` });
    ok = false;
  }
  if (!ok) return null;
  const block: Block = { t: 'figure', asset, alt };
  if (caption !== undefined && caption.trim()) {
    block.caption = parseInline(caption.trim(), line, errors);
  }
  return block;
}

/**
 * Analyse en ligne. `text` peut contenir des `\n` (paragraphe multiligne) : ils servent à
 * localiser les erreurs puis deviennent des espaces.
 */
export function parseInline(text: string, firstLine: number, errors: MarkdownError[]): Inline[] {
  const p = new InlineParser(text, firstLine, errors);
  const out = p.seq(() => false, false);
  return trimEdges(out);
}

class InlineParser {
  pos = 0;

  constructor(
    private readonly s: string,
    private readonly firstLine: number,
    private readonly errors: MarkdownError[],
  ) {}

  private lineAt(pos: number): number {
    let n = 0;
    for (let k = 0; k < pos && k < this.s.length; k++) if (this.s[k] === '\n') n++;
    return this.firstLine + n;
  }

  private fail(pos: number, message: string): void {
    this.errors.push({ line: this.lineAt(pos), message });
  }

  private at(str: string): boolean {
    return this.s.startsWith(str, this.pos);
  }

  /** Lit une séquence jusqu'à `stop()` (non consommé) ou la fin. */
  seq(stop: () => boolean, inRef: boolean): Inline[] {
    const out: Inline[] = [];
    let buf = '';
    const flush = () => {
      if (buf) pushText(out, buf);
      buf = '';
    };
    const s = this.s;
    while (this.pos < s.length) {
      if (stop()) break;
      const ch = s[this.pos]!;
      const start = this.pos;

      if (ch === '\\' && this.pos + 1 < s.length && ESCAPABLE.has(s[this.pos + 1]!)) {
        buf += s[this.pos + 1];
        this.pos += 2;
        continue;
      }
      if (this.at('**')) {
        flush();
        this.pos += 2;
        const c = this.seq(() => this.at('**'), inRef);
        if (!this.at('**')) this.fail(start, '** non refermé');
        else this.pos += 2;
        if (c.length === 0) this.fail(start, 'gras vide');
        out.push({ t: 'strong', c });
        continue;
      }
      if (this.at('~~')) {
        flush();
        this.pos += 2;
        const c = this.seq(() => this.at('~~'), inRef);
        if (!this.at('~~')) this.fail(start, '~~ non refermé');
        else this.pos += 2;
        if (c.length === 0) this.fail(start, 'texte barré vide');
        out.push({ t: 'strike', c });
        continue;
      }
      if (ch === '*') {
        flush();
        this.pos += 1;
        const c = this.seq(() => s[this.pos] === '*' && (!this.at('**') || this.at('***')), inRef);
        if (s[this.pos] !== '*') this.fail(start, '* non refermé');
        else this.pos += 1;
        if (c.length === 0) this.fail(start, 'italique vide');
        out.push({ t: 'em', c });
        continue;
      }
      if (this.at('[[')) {
        flush();
        if (inRef) this.fail(start, 'lien [[…]] imbriqué dans un autre');
        this.pos += 2;
        const c = this.seq(() => s[this.pos] === '|' || this.at(']]'), true);
        if (s[this.pos] !== '|') {
          this.fail(start, 'lien attendu sous la forme [[texte|identifiant-du-mot-clé]]');
          if (this.at(']]')) this.pos += 2;
          out.push(...c);
          continue;
        }
        this.pos += 1;
        const close = s.indexOf(']]', this.pos);
        if (close < 0) {
          this.fail(start, 'lien [[…]] non refermé');
          this.pos = s.length;
          continue;
        }
        const keyword = s.slice(this.pos, close).trim();
        this.pos = close + 2;
        if (!KEBAB_CASE.test(keyword)) {
          this.fail(start, `identifiant de mot-clé invalide : « ${keyword} »`);
          out.push(...c);
          continue;
        }
        const trimmed = trimEdges(c);
        if (trimmed.length === 0) this.fail(start, 'lien [[…]] sans texte');
        out.push({ t: 'ref', keyword, c: trimmed });
        continue;
      }
      if (this.at('::')) {
        const m = /^::([a-zA-Z]+)\[/.exec(s.slice(this.pos));
        if (m) {
          const name = m[1]!;
          if (name === 'hand') {
            flush();
            this.pos += m[0].length;
            const c = this.seq(() => s[this.pos] === ']', inRef);
            if (s[this.pos] !== ']') this.fail(start, '::hand[…] non refermé');
            else this.pos += 1;
            if (c.length === 0) this.fail(start, '::hand[…] vide');
            out.push({ t: 'hand', c: trimEdges(c) });
            continue;
          }
          if (name === 'redacted') {
            flush();
            const r = /^::redacted\[(\d+)\]/.exec(s.slice(this.pos));
            const n = r ? Number(r[1]) : NaN;
            if (!r || !Number.isInteger(n) || n < 1 || n > MAX_REDACTED) {
              this.fail(start, `::redacted[n] attend un entier de 1 à ${MAX_REDACTED}`);
              const close = s.indexOf(']', this.pos);
              this.pos = close < 0 ? s.length : close + 1;
              continue;
            }
            this.pos += r[0].length;
            out.push({ t: 'redacted', length: n });
            continue;
          }
          if (name === 'stamp' || name === 'signature') {
            this.fail(start, `::${name}[…] doit occuper sa propre ligne`);
          } else {
            this.fail(start, `directive inconnue : ::${name}[…]`);
          }
          const close = s.indexOf(']', this.pos);
          this.pos = close < 0 ? s.length : close + 1;
          continue;
        }
      }
      if (this.at('![')) {
        this.fail(start, 'image hors de sa propre ligne');
        this.pos += 2;
        continue;
      }
      if (ch === '[' && /^\[[^\]\n]*\]\(/.test(s.slice(this.pos))) {
        this.fail(start, 'lien Markdown [texte](url) interdit (utiliser [[texte|mot-clé]])');
        const close = s.indexOf(')', this.pos);
        this.pos = close < 0 ? s.length : close + 1;
        continue;
      }
      if (ch === '<' && /^<[A-Za-z/!?]/.test(s.slice(this.pos))) {
        this.fail(start, 'HTML brut interdit');
        const close = s.indexOf('>', this.pos);
        this.pos = close < 0 ? s.length : close + 1;
        continue;
      }
      if (ch === '&' && /^&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(s.slice(this.pos))) {
        this.fail(start, 'entité HTML interdite');
        this.pos = s.indexOf(';', this.pos) + 1;
        continue;
      }
      if (ch === '`') {
        this.fail(start, 'code en ligne non admis');
        this.pos += 1;
        continue;
      }
      if (/^(?:(?:https?|ftp|file|mailto|data|javascript):|www\.)/i.test(s.slice(this.pos))) {
        const prev = this.pos > 0 ? s[this.pos - 1]! : ' ';
        if (!/[\p{L}\p{N}]/u.test(prev)) {
          this.fail(start, 'URL externe interdite');
          const m = /^\S+/.exec(s.slice(this.pos));
          this.pos += m ? m[0].length : 1;
          continue;
        }
      }
      buf += ch;
      this.pos += 1;
    }
    flush();
    return out;
  }
}

function pushText(out: Inline[], raw: string): void {
  const v = raw.replace(/\s+/g, ' ');
  const last = out[out.length - 1];
  if (last && last.t === 'text') last.v += v;
  else out.push({ t: 'text', v });
}

/** Supprime les espaces en tête et en queue d'une suite en ligne. */
function trimEdges(nodes: Inline[]): Inline[] {
  const out = [...nodes];
  const first = out[0];
  if (first && first.t === 'text') {
    const v = first.v.replace(/^\s+/, '');
    if (v) out[0] = { t: 'text', v };
    else out.shift();
  }
  const last = out[out.length - 1];
  if (last && last.t === 'text') {
    const v = last.v.replace(/\s+$/, '');
    if (v) out[out.length - 1] = { t: 'text', v };
    else out.pop();
  }
  return out;
}

/** Texte brut d'une suite en ligne (`redacted` → blancs). */
export function inlineText(nodes: Inline[]): string {
  let s = '';
  for (const n of nodes) {
    if (n.t === 'text') s += n.v;
    else if (n.t === 'redacted') s += ' ';
    else s += inlineText(n.c);
  }
  return s;
}

/** Texte brut d'un bloc (pour les recherches de noms et les canaris). */
export function blockTexts(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.t) {
      case 'p':
      case 'signature':
      case 'h':
        out.push(inlineText(b.c));
        break;
      case 'quote':
        out.push(...blockTexts(b.c));
        break;
      case 'list':
        for (const item of b.items) out.push(inlineText(item));
        break;
      case 'table':
        for (const cell of b.head) out.push(inlineText(cell));
        for (const row of b.rows) for (const cell of row) out.push(inlineText(cell));
        break;
      case 'figure':
        out.push(b.alt);
        if (b.caption) out.push(inlineText(b.caption));
        break;
      case 'stamp':
        out.push(b.text);
        break;
      case 'hr':
        break;
    }
  }
  return out;
}
