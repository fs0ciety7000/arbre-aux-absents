import { englishEntries } from '#lib/i18n/entries';
import type { EntryGenerator } from './$types';

// Page hydratée (signalement, ARCHITECTURE §8) : textes par +page.server.ts, une seule langue.
export const csr = true;
export const entries: EntryGenerator = englishEntries;
