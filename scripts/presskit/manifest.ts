/** Fichiers du kit et leur description, pour la page /presse/ et l'archive. */
export type KitGroup = 'logos' | 'affiches' | 'bannieres' | 'documents' | 'archive';

export interface KitFile {
  group: KitGroup;
  /** Chemin sous `/presse/kit/`. */
  path: string;
  /** Ce que montre le fichier (français). */
  label: string;
  format: 'SVG' | 'PNG' | 'PDF' | 'ZIP' | 'JPEG';
  /** Dimensions, pages, usage. */
  detail: string;
  /** Taille en octets (remplie à la fin). */
  bytes?: number;
  /** Aperçu JPEG (PDF seulement), sous `/presse/kit/`. */
  preview?: string;
  /** Largeur et hauteur de l'aperçu, en px. */
  previewSize?: [number, number];
}
