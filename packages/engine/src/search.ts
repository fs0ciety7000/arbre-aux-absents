import type { CompiledCase, SaveState, SearchOutcome } from '@arbre/contract';
import { SAVE_LIMITS } from '@arbre/contract';
import { own } from './conditions';
import { normalize } from './normalize';
import { keywordDocuments } from './selectors';

/** Longueur minimale d'une requête normalisée (GAME_DESIGN §4.2). */
export const MIN_QUERY_LENGTH = 2;

/**
 * Catalogue : correspondance **exacte** du terme normalisé dans l'index, sans flou ni
 * suggestion (anti-révélation). Renvoie les documents accessibles maintenant.
 */
export function search(query: string, s: SaveState, c: CompiledCase): SearchOutcome {
  const raw = typeof query === 'string' ? query.slice(0, SAVE_LIMITS.query) : '';
  const normalized = normalize(raw);
  const hit = normalized.length >= MIN_QUERY_LENGTH ? own(c.searchIndex, normalized) : undefined;
  const keyword = hit !== undefined && own(c.keywords, hit) !== undefined ? hit : null;
  const documents = keyword === null ? [] : keywordDocuments(keyword, s, c);
  const newDocuments = documents.filter((d) => own(s.unlocked, d) === undefined);
  return { query: raw, normalized, keyword, documents, newDocuments };
}
