import { CHANGELOG } from '#lib/content/changelog';
import { toLocale } from '#lib/i18n/index';
import type { PageServerLoad } from './$types';

// Notes de version dans la langue de la page, lues au prérendu (aucun JS client).
export const load: PageServerLoad = ({ params }) => {
  const lang = toLocale(params.lang);
  return {
    releases: CHANGELOG.map((r) => ({
      version: r.version,
      date: r.date,
      title: r.title[lang],
      items: r.items.map((i) => ({ kind: i.kind, text: i.text[lang] })),
    })),
  };
};
