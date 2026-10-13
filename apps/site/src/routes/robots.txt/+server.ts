import { SITE_URL } from '#lib/site';

export const prerender = true;
export const trailingSlash = 'never';

export function GET(): Response {
  const body = `User-agent: *
Allow: /
Disallow: /design/

Sitemap: ${new URL('/sitemap.xml', SITE_URL).href}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
