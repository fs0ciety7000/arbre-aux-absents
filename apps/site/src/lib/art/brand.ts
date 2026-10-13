/**
 * Logos de la maison (`static/brand/`, source : `static/brand/SOURCE.md`), inlinés pour que leurs
 * teintes passent par `--logo-t1/t2/t3` (DESIGN §11). Usages autorisés : pied de page, crédits,
 * charte. Ordre : CARDOR Media · CM Interactive · CM Creative Lab.
 */
import { parseSvg, type SvgNode } from '#lib/svg/parse';

// Seuls les trois logos de la signature : ce module est aussi chargé par la page hydratée.
const files = import.meta.glob(
  [
    '../../../../../static/brand/cardor-monogram.svg',
    '../../../../../static/brand/interactive.svg',
    '../../../../../static/brand/creative.svg',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

export type BrandId = 'cardor-monogram' | 'interactive' | 'creative';

export interface BrandLogo {
  id: BrandId;
  name: string;
  role: string;
  /** Fichier téléchargeable, servi depuis `apps/site/static/brand/`. */
  file: string;
  node: SvgNode | null;
}

const META: Record<BrandId, { name: string; role: string }> = {
  'cardor-monogram': { name: 'CARDOR Media', role: 'Édition' },
  interactive: { name: 'CM Interactive', role: 'Développement et édition' },
  creative: { name: 'CM Creative Lab', role: 'Écriture, illustration et carte' },
};

function load(id: BrandId): BrandLogo {
  const entry = Object.entries(files).find(([p]) => p.endsWith(`/${id}.svg`));
  return { id, ...META[id], file: `${id}.svg`, node: entry ? parseSvg(entry[1]) : null };
}

/** Signature du pied de page et des crédits, dans l'ordre imposé. */
export const HOUSE_LOGOS: BrandLogo[] = [
  load('cardor-monogram'),
  load('interactive'),
  load('creative'),
];
