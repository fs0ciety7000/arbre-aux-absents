import { englishEntries } from '#lib/i18n/entries';
import type { EntryGenerator } from './$types';

// Prérendu seulement (csr = false hérité du layout).
export const entries: EntryGenerator = englishEntries;
