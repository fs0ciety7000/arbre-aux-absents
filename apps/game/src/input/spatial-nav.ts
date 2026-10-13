/**
 * Navigation spatiale par focus (manette, croix ou stick) : déplace le focus vers
 * l'élément interactif le plus proche dans la direction demandée, dans la portée active
 * (le `<dialog>` ouvert le plus haut, sinon le document, éléments `inert` exclus).
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="tab"]',
  'summary',
].join(',');

export function activeScope(): ParentNode {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
  return dialogs[dialogs.length - 1] ?? document;
}

export function focusables(scope: ParentNode = activeScope()): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.closest('[inert]') || el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return getComputedStyle(el).visibility !== 'hidden';
  });
}

export function moveFocus(dir: Direction): boolean {
  const list = focusables();
  if (list.length === 0) return false;
  const current = document.activeElement as HTMLElement | null;
  if (!current || current === document.body || !list.includes(current)) {
    list[0]!.focus();
    return true;
  }
  const from = current.getBoundingClientRect();
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    let primary: number;
    let ortho: number;
    switch (dir) {
      case 'up':
        primary = from.top - r.bottom;
        ortho = Math.abs(dx);
        if (dy >= -1) continue;
        break;
      case 'down':
        primary = r.top - from.bottom;
        ortho = Math.abs(dx);
        if (dy <= 1) continue;
        break;
      case 'left':
        primary = from.left - r.right;
        ortho = Math.abs(dy);
        if (dx >= -1) continue;
        break;
      case 'right':
        primary = r.left - from.right;
        ortho = Math.abs(dy);
        if (dx <= 1) continue;
        break;
    }
    const score = Math.max(0, primary) + ortho * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  if (!best) return false;
  best.focus();
  best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}
