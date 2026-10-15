/**
 * Projection structurelle d'un compilé (ARCHITECTURE §3.7 règle 12.6) : tout ce qui ne dépend pas
 * de la langue (ids, conditions, réponses, liens, figures, noms proposables), sans le texte
 * traduisible. Deux langues d'une même édition doivent avoir la même projection ; son empreinte
 * est `contentHash` (identique entre langues, D4).
 */
import type { Block, CompiledCase } from '@arbre/contract';

/** Assets des figures d'une suite de blocs, dans l'ordre. */
export function figureAssets(blocks: Block[]): string[] {
  const out: string[] = [];
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.t === 'figure') out.push(b.asset);
      else if (b.t === 'quote') walk(b.c);
    }
  };
  walk(blocks);
  return out;
}

function omit<T extends object, K extends string>(o: T, keys: readonly K[]): Omit<T, K> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (!(keys as readonly string[]).includes(k)) out[k] = v;
  return out as Omit<T, K>;
}

function mapValues<T, U>(o: Record<string, T>, fn: (v: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fn(v)]));
}

/** Tri par points de code (indépendant de la langue). */
const sorted = (xs: Iterable<string>) => [...new Set(xs)].sort();

export function structuralProjection(c: CompiledCase): Record<string, unknown> {
  return {
    format: c.format,
    id: c.id,
    edition: c.edition,
    salt: c.salt,
    meta: {
      ...omit(c.meta, ['title', 'subtitle', 'credits'] as const),
      hasSubtitle: c.meta.subtitle !== undefined,
      credits: c.meta.credits?.length ?? 0,
    },
    documents: mapValues(c.documents, (d) => ({
      ...omit(d, ['title', 'author', 'archive', 'illustration', 'body', 'keywords'] as const),
      hasAuthor: d.author !== undefined,
      hasArchive: d.archive !== undefined,
      illustration: d.illustration ? { file: d.illustration.file } : null,
      keywords: sorted(d.keywords),
      figures: figureAssets(d.body),
    })),
    keywords: mapValues(c.keywords, (k) => omit(k, ['label'] as const)),
    searchKeywords: sorted(Object.values(c.searchIndex)),
    slots: c.slots,
    groups: c.groups.map((g) => omit(g, ['label'] as const)),
    portraits: mapValues(c.portraits, (p) => ({
      id: p.id,
      file: p.file,
      hasCaption: p.caption !== undefined,
    })),
    occupations: sorted(Object.keys(c.occupations)),
    places: mapValues(c.places, (p) => ({
      ...omit(p, ['description'] as const),
      hasDescription: p.description !== undefined,
    })),
    progression: {
      ...c.progression,
      secrets: c.progression.secrets.map((s) => omit(s, ['title'] as const)),
    },
    endings: mapValues(c.endings, (e) => ({
      when: e.when,
      priority: e.priority,
      sections: e.sections.map((s) => ({
        label: s.label,
        hasTitle: s.title !== null,
        ...(s.when ? { when: s.when } : {}),
        figures: figureAssets(s.body),
      })),
    })),
    report: c.report.map((q) => ({
      ...omit(q, ['prompt', 'options'] as const),
      options: q.options.map((o) => ({
        ...omit(o, ['label', 'unavailableReason'] as const),
        hasReason: o.unavailableReason !== undefined,
      })),
    })),
    hints: c.hints.map((h) => omit(h, ['text'] as const)),
    achievements: c.achievements.map((a) => omit(a, ['title', 'description'] as const)),
    candidates: { given: sorted(c.candidates.given), family: sorted(c.candidates.family) },
  };
}

export interface ProjectionDiff {
  /** Chemin pointé (`documents.intro.keywords`). */
  path: string;
  message: string;
}

const show = (v: unknown) => {
  const s = JSON.stringify(v) ?? 'undefined';
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
};

/** Différences entre deux projections (au plus `limit`). */
export function diffProjection(a: unknown, b: unknown, limit = 50): ProjectionDiff[] {
  const out: ProjectionDiff[] = [];
  const walk = (x: unknown, y: unknown, path: string[]) => {
    if (out.length >= limit) return;
    const at = path.join('.') || '(racine)';
    if (Array.isArray(x) && Array.isArray(y)) {
      if (x.every((v) => typeof v === 'string') && y.every((v) => typeof v === 'string')) {
        const sx = new Set(x as string[]);
        const sy = new Set(y as string[]);
        const missing = [...sx].filter((v) => !sy.has(v));
        const extra = [...sy].filter((v) => !sx.has(v));
        if (missing.length || extra.length) {
          const parts = [
            missing.length ? `manque ${missing.join(', ')}` : '',
            extra.length ? `en trop ${extra.join(', ')}` : '',
          ].filter(Boolean);
          out.push({ path: at, message: parts.join(' ; ') });
        } else if (x.join('\u0000') !== y.join('\u0000')) {
          out.push({ path: at, message: `ordre différent : ${show(x)} / ${show(y)}` });
        }
        return;
      }
      if (x.length !== y.length) {
        out.push({ path: at, message: `${x.length} élément(s) en source, ${y.length} ici` });
        return;
      }
      x.forEach((v, i) => walk(v, y[i], [...path, String(i)]));
      return;
    }
    if (x && y && typeof x === 'object' && typeof y === 'object' && !Array.isArray(x)) {
      const kx = Object.keys(x);
      const ky = Object.keys(y);
      for (const k of kx) {
        if (!(k in y)) out.push({ path: [...path, k].join('.'), message: 'absent ici' });
      }
      for (const k of ky) {
        if (!(k in x)) out.push({ path: [...path, k].join('.'), message: 'en trop' });
      }
      for (const k of kx) {
        if (k in y)
          walk((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k], [...path, k]);
      }
      return;
    }
    if (JSON.stringify(x) !== JSON.stringify(y)) {
      out.push({ path: at, message: `${show(x)} en source, ${show(y)} ici` });
    }
  };
  walk(a, b, []);
  return out.slice(0, limit);
}

/** Unité traduite à laquelle rattacher une différence de projection. */
export function unitOfPath(path: string): string {
  const [head, id] = path.split('.');
  switch (head) {
    case 'documents':
      return id ? `documents/${id}.md` : '(affaire)';
    case 'endings':
      return id ? `endings/${id}.md` : '(affaire)';
    case 'meta':
      return 'case.json';
    case 'keywords':
    case 'searchKeywords':
    case 'progression':
    case 'report':
      return 'progression.json';
    case 'groups':
      return 'tree.json';
    case 'portraits':
    case 'occupations':
      return 'family.json';
    case 'hints':
      return 'hints.json';
    case 'achievements':
      return 'achievements.json';
    case 'places':
      return 'world';
    default:
      return '(affaire)';
  }
}
