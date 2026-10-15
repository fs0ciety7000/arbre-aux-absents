import { STRINGS, toLocale } from '#lib/i18n/index';
import type { PageServerLoad } from './$types';

// Page hydratée : seuls les textes de la langue de la page partent au client.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  const t = STRINGS[lang];
  return {
    lang,
    t: t.tickets,
    seo: { title: t.tickets.seoTitle, description: t.tickets.seoDescription },
  };
};
