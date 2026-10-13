/**
 * Action `use:initialFocus={'sélecteur'}` : élément focalisé à l'ouverture d'une boîte de
 * dialogue (champ de filtre, action principale) plutôt que « Fermer », premier focalisable de
 * l'en-tête du primitif `Dialog` (qui n'a pas d'option de focus initial).
 * - `autofocus` est posé sur la cible : `showModal()` la choisit si la boîte s'ouvre après ;
 * - si elle est déjà ouverte au montage, la cible est focalisée à l'image suivante.
 */
export function initialFocus(
  node: HTMLElement,
  selector?: string,
): { update(next?: string): void; destroy(): void } {
  let frame = 0;
  const target = (sel?: string) =>
    sel ? node.querySelector<HTMLElement>(sel) : (node as HTMLElement | null);

  function apply(sel?: string) {
    const el = target(sel);
    if (!el) return;
    el.autofocus = true;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const dialog = node.closest('dialog');
      const t = target(sel);
      if (!t || (dialog && !dialog.open)) return;
      if (dialog && dialog.contains(document.activeElement) && document.activeElement !== dialog) {
        // Focus déjà placé par l'utilisateur ailleurs que sur l'en-tête : ne pas le voler.
        const header = dialog.querySelector('header');
        if (!header?.contains(document.activeElement)) return;
      }
      t.focus();
    });
  }

  apply(selector);
  return {
    update: (next) => apply(next),
    destroy: () => cancelAnimationFrame(frame),
  };
}
