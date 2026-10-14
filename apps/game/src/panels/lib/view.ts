/** Dérivations pures pour l'affichage des panneaux (aucun état, aucun DOM). */
import type {
  CompiledCase,
  DocumentId,
  KeywordId,
  PortraitId,
  SaveState,
  SlotGuess,
  SlotId,
} from '@arbre/contract';
import { availableNames, claimedFields, matchName, readDocuments } from '@arbre/engine';
import type { SlotField } from '../../lib/game/types';
import { KIND_LABELS, pm } from '../messages';
import type { CarryItem } from './carry.svelte';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/** Date partielle du monde (« 1923 », « 1923-04 », « 1923-04-17 ») en toutes lettres. */
export function formatPartialDate(d: string | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const month = m ? MONTHS[Number(m) - 1] : undefined;
  if (day && month) return `${Number(day) === 1 ? '1er' : Number(day)} ${month} ${y}`;
  if (month) return `${month} ${y}`;
  return y ?? d;
}

/** Valeur triable d'une date partielle (sans date : après tout). */
export const dateKey = (d: string | undefined): string => d ?? '9999';

export function documentMeta(c: CompiledCase, id: DocumentId): string {
  const doc = c.documents[id];
  if (!doc) return '';
  return [KIND_LABELS[doc.kind], formatPartialDate(doc.date)].filter(Boolean).join(' · ');
}

export function documentTitle(c: CompiledCase, id: DocumentId): string {
  return c.documents[id]?.title ?? id;
}

/**
 * Proposition courante d'une case : saisie du joueur, sinon pré-remplissage (cases `prefilled`
 * seulement). Jamais de repli sur `claimedGuess` : une déclaration retirée ne doit pas
 * réapparaître à l'écran (elle n'est posée qu'une fois, par `newGame`).
 */
export function guessOf(s: SaveState, c: CompiledCase, slot: SlotId): SlotGuess | null {
  const own = Object.hasOwn(s.tree, slot) ? s.tree[slot] : undefined;
  if (own) return own;
  const def = Object.hasOwn(c.slots, slot) ? c.slots[slot] : undefined;
  return def?.prefilledGuess ?? null;
}

/** La case porte une déclaration dans le contenu (case revendiquée, AFFAIRE-2 §1). */
export function hasClaim(c: CompiledCase, slot: SlotId): boolean {
  return Object.hasOwn(c.slots, slot) && c.slots[slot]?.claimedGuess !== undefined;
}

export interface ClaimView {
  /** Marque « revendiquée » : au moins un champ déclaré et case non établie (§1.2). */
  claimed: boolean;
  /** Champs encore égaux à la déclaration. */
  declared: ReadonlySet<SlotField>;
  /** La case a une déclaration et n'est pas établie : « Rétablir » reste proposé. */
  open: boolean;
}

const NO_FIELDS: ReadonlySet<SlotField> = new Set();

/** État d'affichage d'une case revendiquée (déduit, jamais mémorisé). */
export function claimView(s: SaveState, c: CompiledCase, slot: SlotId): ClaimView {
  if (!hasClaim(c, slot) || s.locked[slot] !== undefined)
    return { claimed: false, declared: NO_FIELDS, open: false };
  const declared = new Set<SlotField>(claimedFields(slot, s, c));
  return { claimed: declared.size > 0, declared, open: true };
}

/** Champs que la déclaration remplit (valeur non vide). */
export function claimFields(c: CompiledCase, slot: SlotId): SlotField[] {
  const g = hasClaim(c, slot) ? c.slots[slot]!.claimedGuess! : null;
  if (!g) return [];
  return (['given', 'family', 'portrait', 'occupation'] as const).filter(
    (f) => g[f] !== null && g[f] !== '',
  );
}

/**
 * Pièce de la requête (« Voir la requête ») : les valeurs déclarées sont découvertes dès la
 * première pièce (AFFAIRE-2 §1.4), donc une pièce de départ : celle qui montre le visage déclaré,
 * sinon la première. `null` sans déclaration.
 */
export function claimDocument(c: CompiledCase, slot: SlotId): DocumentId | null {
  const g = hasClaim(c, slot) ? c.slots[slot]!.claimedGuess! : null;
  if (!g) return null;
  const start = c.progression.start.filter((d) => c.documents[d]);
  const shows = (d: DocumentId) =>
    g.portrait !== null && (c.documents[d]?.reveals?.portraits?.includes(g.portrait) ?? false);
  return start.find(shows) ?? start[0] ?? null;
}

/** « Prénom Nom » d'une case, ou `null` si rien n'est saisi. */
export function slotName(s: SaveState, c: CompiledCase, slot: SlotId): string | null {
  const g = guessOf(s, c, slot);
  const name = [g?.given, g?.family].filter((x) => x && x.length > 0).join(' ');
  return name.length > 0 ? name : null;
}

export function fieldValueLabel(
  c: CompiledCase,
  field: SlotField,
  g: SlotGuess | null,
): string | null {
  if (!g) return null;
  switch (field) {
    case 'given':
    case 'family':
      return g[field] || null;
    case 'portrait':
      return g.portrait ? (c.portraits[g.portrait]?.alt ?? g.portrait) : null;
    case 'occupation':
      return g.occupation ? (c.occupations[g.occupation]?.label ?? g.occupation) : null;
  }
}

/** Nombre de cases (non verrouillées comprises) où la valeur est déjà placée. */
export function usageCount(
  s: SaveState,
  c: CompiledCase,
  field: SlotField,
  value: string,
  except?: SlotId,
): number {
  let n = 0;
  for (const slot of Object.keys(c.slots)) {
    if (slot === except) continue;
    const g = guessOf(s, c, slot);
    if (g && g[field] === value) n += 1;
  }
  return n;
}

/** « vu dans : A, B (+2) » à partir d'une liste de documents. */
export function seenIn(c: CompiledCase, docs: readonly DocumentId[], max = 2): string {
  if (docs.length === 0) return '';
  const titles = docs.slice(0, max).map((d) => documentTitle(c, d));
  const more = docs.length > max ? ` (+${docs.length - max})` : '';
  return pm.common.seenIn(titles.join(', ') + more);
}

/** Documents lus qui ont révélé un portrait. */
export function portraitOrigins(s: SaveState, c: CompiledCase, p: PortraitId): DocumentId[] {
  return readDocuments(s, c).filter((d) => c.documents[d]?.reveals?.portraits?.includes(p));
}

/** Documents lus qui révèlent un métier. */
export function occupationOrigins(s: SaveState, c: CompiledCase, o: string): DocumentId[] {
  return readDocuments(s, c).filter((d) => c.documents[d]?.reveals?.occupations?.includes(o));
}

/** Documents lus qui citent un mot-clé. */
export function keywordOrigins(s: SaveState, c: CompiledCase, kw: KeywordId): DocumentId[] {
  return readDocuments(s, c).filter((d) => c.documents[d]?.keywords.includes(kw));
}

/**
 * Ce qu'un terme peut remplir dans l'arbre : le terme entier comme prénom ou nom découvert,
 * sinon son premier mot (prénom) et son dernier mot (nom). `null` si rien.
 */
export function carryFromText(s: SaveState, c: CompiledCase, text: string): CarryItem | null {
  const names = availableNames(s, c);
  const patch: CarryItem['patch'] = {};
  const whole = text.trim();
  const g = matchName(whole, names.given);
  const f = matchName(whole, names.family);
  if (g) patch.given = g;
  if (f) patch.family = f;
  if (!g && !f) {
    const words = whole.split(/[\s,]+/).filter(Boolean);
    if (words.length >= 2) {
      const first = matchName(words[0]!, names.given);
      const last = matchName(words[words.length - 1]!, names.family);
      if (first) patch.given = first;
      if (last) patch.family = last;
    }
  }
  return Object.keys(patch).length > 0 ? { label: whole, patch } : null;
}

export function carryFromPortrait(c: CompiledCase, p: PortraitId, label?: string): CarryItem {
  return { label: label ?? c.portraits[p]?.alt ?? p, patch: { portrait: p } };
}

/** Clic court sur un élément du clavier : Entrée ou Espace. */
export const isActivation = (e: KeyboardEvent): boolean => e.key === 'Enter' || e.key === ' ';
