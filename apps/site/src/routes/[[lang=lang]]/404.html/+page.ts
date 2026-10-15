import { englishEntries } from '#lib/i18n/entries';
import type { EntryGenerator } from './$types';

// Pages 404 statiques servies par nginx (`error_page 404 /404.html`, `/en/404.html` sous /en/).
export const trailingSlash = 'never';
export const entries: EntryGenerator = englishEntries;
