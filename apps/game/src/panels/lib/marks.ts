/**
 * Champ Marque (affaire 3, docs/game/AFFAIRE-3.md §1) : type du champ « portrait » d'une case,
 * libellés et refus neutre d'un dépôt du mauvais type. Logique pure (aucun DOM) ; la règle de
 * type vient du moteur (`slotPortraitKind`, `portraitKindOf`), jamais dupliquée ici.
 * Une affaire sans marque (affaires 1 et 2) ne voit aucune différence : tout vaut `face`.
 */
import type { CompiledCase, PortraitId, PortraitKind, SlotGuess, SlotId } from '@arbre/contract';
import { portraitKindOf, slotPortraitKind } from '@arbre/engine';
import type { SlotField } from '../../lib/game/types';
import { FIELD_ARTICLES, FIELD_LABELS, pm } from '../messages';

/** L'affaire contient-elle au moins une marque (`Portrait.kind = 'mark'`) ? */
export function caseHasMarks(c: CompiledCase): boolean {
  return Object.values(c.portraits).some((p) => p.kind === 'mark');
}

/** L'affaire a-t-elle au moins une case à champ Marque ? */
export function caseHasMarkSlots(c: CompiledCase): boolean {
  return Object.values(c.slots).some((s) => s.portraitKind === 'mark');
}

/** Case à champ Marque ? */
export function isMarkSlot(c: CompiledCase, slot: SlotId): boolean {
  return slotPortraitKind(slot, c) === 'mark';
}

/** Portrait de type marque ? */
export function isMark(c: CompiledCase, portrait: PortraitId): boolean {
  return portraitKindOf(portrait, c) === 'mark';
}

/** Libellé d'un champ d'une case : « Marque » pour le champ portrait d'une case à marque. */
export function slotFieldLabel(c: CompiledCase, slot: SlotId | null, field: SlotField): string {
  if (field === 'portrait' && slot !== null && isMarkSlot(c, slot)) return pm.marks.field;
  return FIELD_LABELS[field];
}

/** « aucun visage » / « aucune marque » (état vide du sélecteur). */
export function slotFieldArticle(c: CompiledCase, slot: SlotId | null, field: SlotField): string {
  if (field === 'portrait' && slot !== null && isMarkSlot(c, slot)) return pm.marks.fieldArticle;
  return FIELD_ARTICLES[field];
}

/**
 * Type attendu par la case si le dépôt `patch` y porte un portrait du mauvais type, sinon
 * `null` (dépôt permis). Un dépôt sans portrait (prénom, nom, métier) est toujours permis.
 */
export function refusedKind(
  c: CompiledCase,
  slot: SlotId,
  patch: Partial<Pick<SlotGuess, SlotField>>,
): PortraitKind | null {
  const p = patch.portrait;
  if (p === undefined || p === null) return null;
  const expected = slotPortraitKind(slot, c);
  return portraitKindOf(p, c) === expected ? null : expected;
}

/** Annonce neutre d'un refus : « Ce champ attend une marque. » / « … un portrait. » */
export function refusalText(expected: PortraitKind): string {
  return expected === 'mark' ? pm.marks.expectsMark : pm.marks.expectsFace;
}

/** Libellé d'un élément collecté : « Visage n° 3 » ou « Marque n° 3 » (numérotation par type). */
export function portraitNumberLabel(kind: PortraitKind, n: number): string {
  return kind === 'mark' ? pm.marks.mark(n) : pm.faces.face(n);
}
