import { error } from '@sveltejs/kit';
import { artFiles } from '#lib/prerender/art';
import type { EntryGenerator, RequestHandler } from './$types';

// SVG d'art autonomes (fond de carte, portraits), prérendus en fichiers statiques. Le nom porte
// une empreinte du contenu : nginx les sert avec un cache d'un an (`immutable`).
export const prerender = true;
export const trailingSlash = 'never';

export const entries: EntryGenerator = () => artFiles().map(({ file }) => ({ file }));

export const GET: RequestHandler = ({ params }) => {
  const found = artFiles().find((f) => f.file === params.file);
  if (!found) error(404, 'Illustration introuvable');
  return new Response(found.body, { headers: { 'content-type': 'image/svg+xml' } });
};
