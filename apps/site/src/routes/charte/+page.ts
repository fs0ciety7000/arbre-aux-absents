import type { PageLoad } from './$types';

// Prérendu seulement (csr = false) : les tokens sont lus au build.
export const load: PageLoad = async () => {
  if (!import.meta.env.SSR) return { palette: [] };
  const { paletteGroups } = await import('#lib/prerender/tokens');
  return { palette: paletteGroups() };
};
