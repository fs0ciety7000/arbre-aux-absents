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

/** Taille lisible en français (« 1,2 Mo », « 340 Ko »). */
export function humanSize(bytes = 0): string {
  const fr = (n: number, d: number) => n.toFixed(d).replace('.', ',');
  if (bytes >= 1024 * 1024) return `${fr(bytes / 1024 / 1024, 1)} Mo`;
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

const files = manifest.files as ManifestFile[];

const GROUPS: { id: string; title: string; intro: string }[] = [
  {
    id: 'documents',
    title: 'Documents',
    intro: 'L’artbook et la fiche presse, en PDF.',
  },
  {
    id: 'logos',
    title: 'Titre du jeu et emblème',
    intro:
      'Le titre en quatre teintes : couleurs sur fond sombre (usage principal), couleurs sur fond clair, noir, blanc. SVG au texte vectorisé, PNG transparents.',
  },
  {
    id: 'affiches',
    title: 'Affiches A3',
    intro: 'PDF vectoriel pour l’impression, PNG pour l’écran.',
  },
  {
    id: 'bannieres',
    title: 'Bannières et visuels sociaux',
    intro: 'Le titre toujours posé dans la zone calme de l’art clé, zones sûres respectées.',
  },
];

function rows(group: string): KitRow[] {
  const out: KitRow[] = [];
  for (const f of files.filter((g) => g.group === group)) {
    let row = out.find((r) => r.label === f.label);
    if (!row) out.push((row = { label: f.label, links: [] }));
    row.links.push({
      href: KIT + f.path,
      format: f.format,
      detail: f.detail,
      size: humanSize(f.bytes),
    });
  }
  return out;
}

export const KIT_GROUPS: KitGroup[] = GROUPS.map((g) => ({ ...g, rows: rows(g.id) }));

/** Captures d'écran déjà publiées (`/itch/`). */
export const KIT_CAPTURES: KitRow[] = manifest.captures.map((c) => ({
  label: c.label,
  links: [{ href: c.path, format: c.format, detail: c.detail, size: humanSize(c.bytes) }],
}));

/** L'archive complète. */
export const KIT_ZIP = (() => {
  const z = files.find((f) => f.group === 'archive');
  return z ? { href: KIT + z.path, size: humanSize(z.bytes), label: z.label } : null;
})();

/** Les PDF avec aperçu (affiches, artbook, fiche), en tête de la section. */
export const KIT_FEATURES: KitFeature[] = files
  .filter((f) => f.format === 'PDF' && f.preview)
  .map((f) => ({
    label: f.label.replace(/\s*:.*$/, ''),
    href: KIT + f.path,
    preview: KIT + f.preview,
    width: f.previewSize?.[0] ?? 480,
    height: f.previewSize?.[1] ?? 480,
    detail: f.detail,
    size: humanSize(f.bytes),
  }));

/** Poids total du kit (fichiers publiés, archive comprise). */
export const KIT_TOTAL = humanSize(files.reduce((n, f) => n + (f.bytes ?? 0), 0));
