/**
 * Kit presse publié sous `/presse/kit/` (généré par `npm run presskit`, scripts/presskit/) : le
 * manifeste `presskit.json` liste chaque fichier, son format, ses dimensions et sa taille.
 * Ici, les fichiers sont regroupés pour la page /presse/ (une ligne par visuel, un lien par format).
 */
import manifest from './presskit.json';

export interface KitLink {
  href: string;
  format: string;
  detail: string;
  size: string;
}

export interface KitRow {
  label: string;
  links: KitLink[];
}

export interface KitGroup {
  id: string;
  title: string;
  intro: string;
  rows: KitRow[];
}

export interface KitFeature {
  label: string;
  href: string;
  preview: string;
  width: number;
  height: number;
  detail: string;
  size: string;
}

interface ManifestFile {
  group: string;
  path: string;
  label: string;
  format: string;
  detail: string;
  bytes?: number;
  preview?: string;
  previewSize?: number[];
}

const KIT = 'presse/kit/';

/** Textes du kit dans une langue (`STRINGS[lang].presskit`) : les fichiers, eux, restent en français. */
export interface KitTexts {
  size: (bytes: number) => string;
  groups: Record<string, { title: string; intro: string }>;
  /** Libellé du manifeste → libellé traduit (`null` : tels quels). */
  labels: Record<string, string> | null;
  /** Précisions du manifeste : remplacements successifs (`null` : telles quelles). */
  details: [RegExp, string][] | null;
}

/** Taille lisible en français (« 1,2 Mo », « 340 Ko »). */
export function humanSize(bytes = 0): string {
  const fr = (n: number, d: number) => n.toFixed(d).replace('.', ',');
  if (bytes >= 1024 * 1024) return `${fr(bytes / 1024 / 1024, 1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

const files = manifest.files as ManifestFile[];

/** Groupes de la page, dans l'ordre. */
const GROUP_IDS = ['documents', 'logos', 'affiches', 'bannieres'] as const;

/** Le kit présenté dans une langue (libellés, précisions et tailles traduits). */
export function presskit(t: KitTexts) {
  const label = (l: string) => t.labels?.[l] ?? l;
  const detail = (d: string) => (t.details ?? []).reduce((out, [re, by]) => out.replace(re, by), d);
  const size = (bytes = 0) => t.size(bytes);

  function rows(group: string): KitRow[] {
    const out: KitRow[] = [];
    for (const f of files.filter((g) => g.group === group)) {
      let row = out.find((r) => r.label === label(f.label));
      if (!row) out.push((row = { label: label(f.label), links: [] }));
      row.links.push({
        href: KIT + f.path,
        format: f.format,
        detail: detail(f.detail),
        size: size(f.bytes),
      });
    }
    return out;
  }

  const groups: KitGroup[] = GROUP_IDS.map((id) => ({
    id,
    title: t.groups[id]?.title ?? id,
    intro: t.groups[id]?.intro ?? '',
    rows: rows(id),
  }));

  /** Captures d'écran déjà publiées (`/itch/`). */
  const captures: KitRow[] = manifest.captures.map((c) => ({
    label: label(c.label),
    links: [{ href: c.path, format: c.format, detail: detail(c.detail), size: size(c.bytes) }],
  }));

  /** L'archive complète. */
  const z = files.find((f) => f.group === 'archive');
  const zip = z ? { href: KIT + z.path, size: size(z.bytes), label: label(z.label) } : null;

  /** Les PDF avec aperçu (affiches, artbook, fiche), en tête de la section. */
  const features: KitFeature[] = files
    .filter((f) => f.format === 'PDF' && f.preview)
    .map((f) => ({
      label: label(f.label).replace(/\s*:.*$/, ''),
      href: KIT + f.path,
      preview: KIT + f.preview,
      width: f.previewSize?.[0] ?? 480,
      height: f.previewSize?.[1] ?? 480,
      detail: detail(f.detail),
      size: size(f.bytes),
    }));

  return { groups, captures, zip, features };
}

/** Poids total du kit (fichiers publiés, archive comprise). */
export const KIT_TOTAL = humanSize(files.reduce((n, f) => n + (f.bytes ?? 0), 0));
