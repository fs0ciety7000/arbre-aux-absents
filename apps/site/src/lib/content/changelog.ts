/**
 * Journal des versions (ARCHITECTURE §3.8), lu au prérendu seulement (importé par des
 * `+page.server.ts`) : le JSON ne part jamais au client. Validé ici comme dans `content:check`.
 */
import { ChangelogSchema, type Changelog } from '@arbre/contract';
import raw from '../../../../../content/changelog.json' with { type: 'json' };

export const CHANGELOG: Changelog = ChangelogSchema.parse(raw);
