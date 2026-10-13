import { SITE_URL } from '#lib/site';

export const prerender = true;
export const trailingSlash = 'never';

const PAGES = ['/', '/le-monde/', '/artbook/', '/charte/', '/presse/', '/credits/'];

export function GET(): Response {
  const urls = PAGES.map((p) => `  <url><loc>${new URL(p, SITE_URL).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
