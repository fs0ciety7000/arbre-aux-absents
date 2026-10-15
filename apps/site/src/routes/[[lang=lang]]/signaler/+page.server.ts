import { STRINGS, toLocale } from '#lib/i18n/index';
import { GAME_VERSION } from '#lib/report/version';
import type { PageServerLoad } from './$types';

// Page hydratée : seuls les textes de la langue de la page partent au client.
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  const t = STRINGS[lang];
  return {
    lang,
    t: t.report,
    categories: t.reportCategories,
    languageName: t.languageName,
    appVersion: GAME_VERSION,
    seo: { title: t.report.seoTitle, description: t.report.seoDescription },
  };
};
