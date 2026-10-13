/**
 * Format de la fenêtre (ECRANS §3, DESIGN §5.2) : points de rupture en rem pour suivre la
 * taille du texte système. Réactif (runes) ; un seul jeu d'écouteurs pour toute l'app.
 */
export type LayoutKind = 'phone' | 'tablet' | 'desktop';

const QUERIES = {
  phone: '(max-width: 37.4375rem)',
  desktop: '(min-width: 80rem)',
  portrait: '(orientation: portrait)',
  tooSmall: '(max-width: 22.4375rem)',
  short: '(max-height: 30rem) and (orientation: landscape)',
} as const;

class Viewport {
  kind = $state<LayoutKind>('desktop');
  portrait = $state(false);
  tooSmall = $state(false);
  short = $state(false);
  #started = false;

  start(): void {
    if (this.#started || typeof matchMedia !== 'function') return;
    this.#started = true;
    const lists = Object.fromEntries(
      Object.entries(QUERIES).map(([k, q]) => [k, matchMedia(q)]),
    ) as Record<keyof typeof QUERIES, MediaQueryList>;
    const update = () => {
      this.kind = lists.phone.matches ? 'phone' : lists.desktop.matches ? 'desktop' : 'tablet';
      this.portrait = lists.portrait.matches;
      this.tooSmall = lists.tooSmall.matches;
      this.short = lists.short.matches;
    };
    for (const l of Object.values(lists)) l.addEventListener('change', update);
    update();
  }

  /** Un seul panneau à la fois : téléphone, ou tablette en portrait. */
  get single(): boolean {
    return this.kind === 'phone' || (this.kind === 'tablet' && this.portrait);
  }
}

export const viewport = new Viewport();
