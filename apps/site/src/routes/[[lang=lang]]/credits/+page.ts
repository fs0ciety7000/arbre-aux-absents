import { englishEntries } from '#lib/i18n/entries';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = englishEntries;

// Prérendu seulement (csr = false) : l'emblème est lu au build.
export const load: PageLoad = async () => {
  if (!import.meta.env.SSR) return { emblem: null };
  const { CARDOR_EMBLEM } = await import('#lib/prerender/brand');
  return { emblem: CARDOR_EMBLEM };
};
