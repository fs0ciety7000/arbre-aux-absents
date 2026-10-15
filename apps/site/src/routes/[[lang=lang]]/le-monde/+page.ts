import { englishEntries } from '#lib/i18n/entries';
import type { EntryGenerator } from './$types';

// Seule page hydratée du site : la carte interactive (MapView).
export const csr = true;
export const entries: EntryGenerator = englishEntries;
