/**
 * « Prendre → Déposer » : alternative en deux sélections au glisser-déposer (GAME_DESIGN §7.3,
 * ECRANS §4.4). On prend un terme ou un visage (bouton, `U`, glisser), puis on choisit une case.
 * État d'interface partagé par les panneaux, non sauvegardé.
 */
import type { SlotGuess } from '@arbre/contract';
import type { SlotField } from '../../lib/game/types';

export interface CarryItem {
  /** Libellé affiché (« Marrel », « Visage n° 3 »). */
  label: string;
  /** Valeurs déposables, par champ (au moins une). */
  patch: Partial<Pick<SlotGuess, SlotField>>;
}

/** Type MIME du glisser-déposer natif (souris). */
export const DRAG_MIME = 'application/x-arbre-carry';

class Carry {
  item = $state<CarryItem | null>(null);

  take(item: CarryItem): void {
    if (Object.keys(item.patch).length > 0) this.item = item;
  }
  drop(): void {
    this.item = null;
  }
  /** Le champ accepte-t-il l'objet en main ? */
  accepts(field: SlotField): boolean {
    return this.item !== null && Object.hasOwn(this.item.patch, field);
  }
}

export const carry = new Carry();

export function encodeCarry(item: CarryItem): string {
  return JSON.stringify(item);
}

export function decodeCarry(raw: string): CarryItem | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== 'object') return null;
    const o = v as { label?: unknown; patch?: unknown };
    if (typeof o.label !== 'string' || !o.patch || typeof o.patch !== 'object') return null;
    const patch: CarryItem['patch'] = {};
    for (const [k, val] of Object.entries(o.patch as Record<string, unknown>)) {
      if (
        (k === 'given' || k === 'family' || k === 'portrait' || k === 'occupation') &&
        typeof val === 'string'
      ) {
        patch[k] = val;
      }
    }
    return Object.keys(patch).length > 0 ? { label: o.label, patch } : null;
  } catch {
    return null;
  }
}
