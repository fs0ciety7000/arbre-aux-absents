/**
 * Adresses du signalement côté site. L'URL du service est publique (pas un secret) : fixée au
 * build par `VITE_REPORT_API` (`.env.example`), sinon la production. Elle doit figurer dans la
 * CSP `connect-src` du site (nginx.conf, DEPLOYMENT.md).
 */
import { ITCH_URL } from '#lib/site';

export const DEFAULT_REPORT_API = 'https://arbre-api.cardormedia.com';

/** Base du service, sans barre finale. */
export function reportApiBase(value: string | undefined = import.meta.env.VITE_REPORT_API) {
  const v = (value ?? '').trim();
  return (v || DEFAULT_REPORT_API).replace(/\/+$/, '');
}

export const REPORT_API = reportApiBase();

/** Forum de la page itch.io du jeu : repli quand le service ne répond pas (ou sans JS). */
export const FORUM_URL = `${ITCH_URL}/community`;

/** Délai d'attente de chaque appel au service (DESIGN §13.8 : 10 s au plus). */
export const REQUEST_TIMEOUT_MS = 10_000;
