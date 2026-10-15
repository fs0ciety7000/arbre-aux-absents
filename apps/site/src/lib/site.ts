/** Constantes du site vitrine. */
export const SITE_URL = 'https://arbre.cardormedia.com';
/** Page itch.io du jeu (gratuit, toutes plateformes). */
export const ITCH_URL = 'https://cardorinteractive.itch.io/arbre-aux-absents';
/** Widget itch.io (iframe, CSP `frame-src https://itch.io`), couleurs du thème « bureau ». */
export const ITCH_EMBED =
  'https://itch.io/embed/5151802?linkback=true&bg_color=0e203c&fg_color=f6f1e7&link_color=ffbe3d&border_color=22395c';
export const SITE_NAME = 'L’Arbre aux absents';
export const SITE_TAGLINE = 'Une enquête généalogique dans un monde imaginaire';
export const SITE_DESCRIPTION =
  'L’Arbre aux absents : un jeu d’enquête généalogique en solo. Croisez archives, registres et photographies pour reconstituer l’arbre d’une famille de la Velmarche. Par CM Interactive et CM Creative Lab.';
/**
 * Image Open Graph 1200 × 630, JPEG (apps/site/static/og/) : copie de la bannière du kit presse
 * (static/presse/kit/bannieres/arbre-aux-absents-og-1200x630.jpg). Nouveau nom à chaque nouveau
 * visuel : les réseaux gardent l'ancienne image en cache tant que l'URL ne change pas.
 */
export const OG_IMAGE = '/og/arbre-aux-absents-bureau.jpg';
export const OG_IMAGE_TYPE = 'image/jpeg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT =
  'Le bureau de l’enquêteur sous la lampe, la nuit : dossiers, photographies et un arbre généalogique à compléter, à côté du titre L’Arbre aux absents.';
/**
 * Bande-annonce (YouTube). Accueil : façade cliquable (affiche locale, aucun cookie ni requête
 * vers YouTube avant le clic), puis lecteur `youtube-nocookie.com` (CSP `frame-src`). Sans JS, la
 * façade est un simple lien vers YouTube.
 */
export const TRAILER_YOUTUBE_ID = 'rHGYNDYgdhg';
export const TRAILER_WATCH_URL = `https://www.youtube.com/watch?v=${TRAILER_YOUTUBE_ID}`;
export const TRAILER_EMBED_URL = `https://www.youtube-nocookie.com/embed/${TRAILER_YOUTUBE_ID}`;
export const TRAILER_TITLE = 'L’Arbre aux absents · Bande-annonce';
export const TRAILER_DESCRIPTION =
  'Une minute dans le bureau de l’enquêteur : le catalogue, les archives, les photographies et l’arbre qui se remplit, sur la musique du jeu.';
/** Affiche (assets/trailer/trailer-poster.jpg, 16:9) : WebP 640 / 1280 et JPEG 1280 de repli. */
export const TRAILER_POSTER = {
  webp640: '/trailer/bande-annonce-640.webp',
  webp1280: '/trailer/bande-annonce-1280.webp',
  jpg: '/trailer/bande-annonce-1280.jpg',
  width: 1280,
  height: 720,
} as const;
/** Durée ISO 8601 (assets/trailer/README.md : 60,2 s) ; date de mise en ligne ISO 8601 complète (heure + fuseau, exigés par Google), à confirmer sur YouTube. */
export const TRAILER_DURATION = 'PT1M0S';
export const TRAILER_UPLOAD_DATE = '2026-10-14T12:00:00+02:00';
