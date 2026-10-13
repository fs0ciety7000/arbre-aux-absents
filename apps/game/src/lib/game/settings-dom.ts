import type { Settings } from '@arbre/contract';

/**
 * Applique les réglages joueur sur `<html>` en attributs `data-*` (DESIGN §4.2).
 * Les attributs sans effet CSS pour l'instant (`data-line-spacing`, `data-letter-spacing`,
 * `data-color-vision`, `data-text-scale="0.875"`, `data-reading-font="dyslexic"`) sont
 * posés quand même : le design system les consommera (demande au design-lead).
 */
export function applySettings(s: Settings, root: HTMLElement = document.documentElement): void {
  set(root, 'text-scale', s.textScale === 1 ? null : String(s.textScale));
  set(root, 'reading-font', s.readingFont === 'default' ? null : s.readingFont);
  set(root, 'line-spacing', s.lineSpacing === 'default' ? null : s.lineSpacing);
  set(root, 'letter-spacing', s.letterSpacing ? 'wide' : null);
  set(root, 'handwriting', s.replaceHandwriting ? 'replace' : null);
  set(root, 'contrast', s.highContrast ? 'high' : null);
  set(root, 'texture', s.reducePaperTexture ? 'off' : null);
  set(root, 'color-vision', s.colorVision === 'default' ? null : s.colorVision);
  set(root, 'motion', s.motion === 'system' ? null : s.motion);
}

function set(root: HTMLElement, name: string, value: string | null): void {
  const attr = `data-${name}`;
  if (value === null) root.removeAttribute(attr);
  else root.setAttribute(attr, value);
}

/** Mouvement réduit effectif (réglage ou système). */
export function prefersReducedMotion(s: Settings): boolean {
  if (s.motion === 'reduced') return true;
  if (s.motion === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
