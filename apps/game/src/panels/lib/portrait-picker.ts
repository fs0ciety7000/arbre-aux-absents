/**
 * Logique pure du choix d'un portrait (Sélecteur de candidat P10, champ Portrait) : filtre
 * plein texte (description et titres des documents « vu dans »), filtre « document ouvert »,
 * déplacement au clavier dans la grille. Sans DOM ni état : testée à part.
 */
import { normalize } from '@arbre/engine';

/** Un portrait proposé, avec ce que le filtre sait chercher. */
export interface PortraitEntry {
  id: string;
  /** Numéro affiché (« Visage n° 3 »), celui de la Galerie des visages. */
  n: number;
  /** Description complète (texte alternatif du portrait). */
  alt: string;
  /** Documents lus qui ont révélé ce portrait. */
  docs: readonly string[];
  /** Titres de ces documents, dans le même ordre. */
  docTitles: readonly string[];
}

export interface PortraitFilter {
  query: string;
  /** Document ouvert à exiger parmi les origines, ou null. */
  onlyDoc: string | null;
}

/** Texte cherché pour un portrait : numéro, description, titres des documents. */
function haystack(e: PortraitEntry): string {
  return normalize([String(e.n), e.alt, ...e.docTitles].join(' '));
}

/**
 * Vrai si chaque mot de la requête (sans accents ni casse, `normalize`) figure dans le texte
 * du portrait. Requête vide : tout passe.
 */
export function matchesPortrait(e: PortraitEntry, query: string): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = haystack(e);
  return words.every((w) => text.includes(w));
}

/** Portraits qui passent le filtre, dans l'ordre d'origine. */
export function filterPortraits<T extends PortraitEntry>(
  entries: readonly T[],
  f: PortraitFilter,
): T[] {
  return entries.filter(
    (e) => (f.onlyDoc === null || e.docs.includes(f.onlyDoc)) && matchesPortrait(e, f.query),
  );
}

/**
 * Nombre de colonnes d'une grille d'après la position verticale de ses tuiles (dans l'ordre) :
 * celles de la première rangée partagent le même haut (à 1 px près).
 */
export function columnsFromTops(tops: readonly number[]): number {
  if (tops.length === 0) return 1;
  const first = tops[0]!;
  let n = 0;
  for (const t of tops) {
    if (Math.abs(t - first) > 1) break;
    n++;
  }
  return Math.max(1, n);
}

/**
 * Index suivant dans une grille de `count` tuiles sur `cols` colonnes pour une touche
 * (flèches, Début, Fin, Page préc./suiv. = une rangée de plus) ; null si la touche n'est pas
 * une touche de déplacement. Bornes : pas de bouclage, `↓` sur la dernière rangée incomplète
 * va à la dernière tuile.
 */
export function gridMove(index: number, key: string, cols: number, count: number): number | null {
  if (count <= 0) return null;
  const c = Math.max(1, cols);
  let next: number;
  switch (key) {
    case 'ArrowRight':
      next = index + 1;
      break;
    case 'ArrowLeft':
      next = index - 1;
      break;
    case 'ArrowDown':
      next = index + c;
      if (next >= count && Math.floor(index / c) < Math.floor((count - 1) / c)) next = count - 1;
      break;
    case 'ArrowUp':
      next = index - c;
      break;
    case 'PageDown':
      next = index + c * 3;
      break;
    case 'PageUp':
      next = index - c * 3;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = count - 1;
      break;
    default:
      return null;
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    // Pas de rangée dans cette direction : on reste sur place.
    if (next < 0 || next >= count) return index;
  }
  return Math.max(0, Math.min(count - 1, next));
}
