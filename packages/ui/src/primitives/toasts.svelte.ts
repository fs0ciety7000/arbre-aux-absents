/**
 * File de notifications (DESIGN.md §9.12), lue par <ToastRegion />.
 * Les toasts ne portent jamais une information indispensable : tout ce qui compte
 * (verrouillage, déblocage) est aussi visible dans le Journal et annoncé par la région live.
 */

export type ToastTone = 'info' | 'success' | 'warning' | 'danger' | 'established';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Action unique (« Annuler », « Réessayer », « Voir au Journal »). */
  action?: { label: string; onclick: () => void };
  /** Durée en ms avant fermeture auto ; `0` = reste jusqu'à fermeture (défaut pour danger/warning). */
  timeout: number;
}

let seq = 0;
const items = $state<ToastItem[]>([]);

/** Liste réactive (lecture seule) des toasts affichés. */
export function getToasts(): readonly ToastItem[] {
  return items;
}

/** Ajoute un toast ; renvoie son id. Au plus 3 à l'écran (le plus ancien sort). */
export function pushToast(t: Omit<ToastItem, 'id' | 'timeout'> & { timeout?: number }): number {
  const id = ++seq;
  const sticky = t.tone === 'danger' || t.tone === 'warning';
  items.push({ ...t, id, timeout: t.timeout ?? (sticky ? 0 : 6000) });
  while (items.length > 3) items.shift();
  return id;
}

export function dismissToast(id: number): void {
  const i = items.findIndex((t) => t.id === id);
  if (i >= 0) items.splice(i, 1);
}

export function clearToasts(): void {
  items.length = 0;
}
