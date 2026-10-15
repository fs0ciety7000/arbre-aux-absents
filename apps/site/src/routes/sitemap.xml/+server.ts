import { SITE_LOCALES, SITE_PAGES, SOURCE_LOCALE, UNLISTED_PAGES, pagePath } from '#lib/i18n/pages';
import { SITE_URL } from '#lib/site';

export const prerender = true;
export const trailingSlash = 'never';

const abs = (p: string) => new URL(p, SITE_URL).href;

/**
 * Plan du site : chaque page dans chaque langue (sauf le suivi, `UNLISTED_PAGES`), avec ses versions (`xhtml:link` hreflang, même
 * jeu que le `<head>` de la page : chaque langue et x-default vers le français, D8).
 */
export function GET(): Response {
  const listed = SITE_PAGES.filter((p) => !(UNLISTED_PAGES as readonly string[]).includes(p));
  const urls = listed
    .flatMap((page) => {
      const alternates = [
        ...SITE_LOCALES.map((l) => [l as string, pagePath(l, page)] as const),
        ['x-default', pagePath(SOURCE_LOCALE, page)] as const,
      ]
        .map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(p)}"/>`)
        .join('\n');
      return SITE_LOCALES.map(
        (lang) => `  <url>\n    <loc>${abs(pagePath(lang, page))}</loc>\n${alternates}\n  </url>`,
      );
    })
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
