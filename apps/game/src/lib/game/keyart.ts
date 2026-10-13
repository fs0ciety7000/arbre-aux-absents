/**
 * Art clé « Le bureau sous la lampe » (art/keyart, DESIGN §8.5, §13.1) : un seul cadrage est
 * chargé, choisi par `matchMedia` (16:9 au-dessus de 760 px, 4:5 recomposé en dessous). Fichier
 * JS à part (`?raw`, ~40 Ko gzip) : jamais dans le premier affichage ; l'écran de lancement en
 * lance le téléchargement pendant le logo, l'écran titre et le dénouement l'affichent.
 */
export type KeyArtFrame = 'wide' | 'tall';

/** Même seuil que la recette de l'écran titre (§13.1) : 760 px. */
export const KEYART_NARROW = '(max-width: 47.5rem)';

const cache = new Map<KeyArtFrame, Promise<string>>();

export function keyArtFrame(): KeyArtFrame {
  return typeof matchMedia === 'function' && matchMedia(KEYART_NARROW).matches ? 'tall' : 'wide';
}

/** Balisage SVG brut du cadrage demandé (promesse partagée, chargée une seule fois). */
export function loadKeyArt(frame: KeyArtFrame = keyArtFrame()): Promise<string> {
  let p = cache.get(frame);
  if (!p) {
    p = (
      frame === 'tall'
        ? import('../../../../../art/keyart/keyart-desk-tall.svg?raw')
        : import('../../../../../art/keyart/keyart-desk.svg?raw')
    ).then((m) => m.default);
    // Un échec (réseau) ne reste pas en cache : le prochain écran réessaie.
    p.catch(() => cache.delete(frame));
    cache.set(frame, p);
  }
  return p;
}
