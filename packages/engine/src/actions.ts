import type {
  Action,
  CompiledCase,
  GameEvent,
  NewGameOptions,
  Pin,
  RejectReason,
  SaveState,
  SlotGuess,
  Transition,
  ValidationResult,
} from '@arbre/contract';
import { HighlightSchema, MAX_TICK_MS, SAVE_LIMITS } from '@arbre/contract';
import { own } from './conditions';
import { search } from './search';
import {
  availableNames,
  availableOccupations,
  availablePortraits,
  endingFor,
  hintBlocker,
  isPlaceVisible,
  knownKeywords,
  matchName,
  placeDocuments,
} from './selectors';
import { settle } from './settle';
import {
  emptyGuard,
  groupOf,
  isComplete,
  isSlotVisible,
  recordChanges,
  validate,
  type SweepGuard,
} from './validation';

/** Limites locales au moteur (absentes de `SAVE_LIMITS`, voir rapport). */
export const ENGINE_LIMITS = {
  /** Longueur maximale d'un prénom ou d'un nom (`SlotGuessSchema`). */
  name: 100,
  noteId: 64,
  notes: 500,
  highlights: 1000,
} as const;

export interface ApplyOptions {
  /** `auto` (défaut) : un `setSlot` qui rend la case complète déclenche la validation de son groupe. */
  validation?: 'auto' | 'manual';
  /** Garde-fou anti-balayage (non sauvegardé) ; un garde-fou vide est créé s'il manque. */
  guard?: SweepGuard;
}

/** Transition du moteur : celle du contrat + garde-fou à repasser à l'action suivante. */
export interface EngineTransition extends Transition {
  guard: SweepGuard;
}

const EMPTY_GUESS: SlotGuess = Object.freeze({
  given: '',
  family: '',
  portrait: null,
  occupation: null,
});

/** Horodatage sûr : entier ≥ 0, sinon `fallback`. */
export function toMs(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/** Partie neuve : documents de départ débloqués, cases pré-remplies établies, point fixe. */
export function newGame(c: CompiledCase, options: NewGameOptions): SaveState {
  const at = toMs(options.at, 0);
  const unlocked: Record<string, number> = {};
  for (const id of [...c.progression.start, c.meta.intro]) {
    if (own(c.documents, id) !== undefined) unlocked[id] = at;
  }
  const tree: Record<string, SlotGuess> = {};
  const locked: Record<string, number> = {};
  for (const [id, slot] of Object.entries(c.slots)) {
    if (slot.prefilled && slot.prefilledGuess) {
      tree[id] = { ...slot.prefilledGuess };
      locked[id] = at;
    }
  }
  const state: SaveState = {
    schemaVersion: 1,
    caseId: c.id,
    contentHash: c.contentHash,
    edition: c.edition,
    slot: options.slot,
    mode: options.mode,
    createdAt: at,
    updatedAt: at,
    elapsedMs: 0,
    unlocked,
    read: {},
    searched: [],
    searchLog: [],
    visited: [],
    revealedSlots: [],
    tree,
    locked,
    secrets: {},
    hintsUsed: {},
    notebook: { pins: [], highlights: [], notes: [] },
    ending: null,
  };
  return settle(state, c).state;
}

function reject(s: SaveState, reason: RejectReason, guard: SweepGuard): EngineTransition {
  return { state: s, events: [{ type: 'rejected', reason }], guard };
}

/** Point fixe puis fusion des événements `documentsUnlocked` en un seul. */
function finalize(
  state: SaveState,
  events: GameEvent[],
  c: CompiledCase,
  guard: SweepGuard,
): EngineTransition {
  const settled = settle(state, c);
  const all = [...events, ...settled.events];
  const ids = all.flatMap((e) => (e.type === 'documentsUnlocked' ? e.ids : []));
  const merged: GameEvent[] = [];
  let placed = false;
  for (const e of all) {
    if (e.type !== 'documentsUnlocked') merged.push(e);
    else if (!placed) {
      merged.push({ type: 'documentsUnlocked', ids: [...new Set(ids)] });
      placed = true;
    }
  }
  return { state: settled.state, events: merged, guard };
}

function touch(s: SaveState, at: number): SaveState {
  return { ...s, updatedAt: at };
}

function applyLocks(s: SaveState, result: ValidationResult, at: number): Transition {
  if (result.lock.length === 0) return { state: s, events: [{ type: 'validationFailed' }] };
  const locked = { ...s.locked };
  for (const id of result.lock) locked[id] = at;
  return {
    state: { ...s, locked },
    events: [{ type: 'slotsLocked', ids: [...result.lock], groups: [...result.groups] }],
  };
}

function checkPin(target: unknown, s: SaveState, c: CompiledCase): RejectReason | null {
  if (target === null || typeof target !== 'object') return 'notAvailable';
  const { kind, id } = target as Partial<Pin>;
  if (typeof id !== 'string') return 'unknownId';
  switch (kind) {
    case 'document':
      if (own(c.documents, id) === undefined) return 'unknownId';
      return own(s.unlocked, id) === undefined ? 'notAvailable' : null;
    case 'keyword':
      if (own(c.keywords, id) === undefined) return 'unknownId';
      return knownKeywords(s, c).includes(id) ? null : 'notAvailable';
    case 'slot':
      if (own(c.slots, id) === undefined) return 'unknownId';
      return isSlotVisible(id, s, c) ? null : 'notAvailable';
    default:
      return 'notAvailable';
  }
}

const samePin = (a: Pin, b: Pin) => a.kind === b.kind && a.id === b.id;

type PatchResult = { guess: SlotGuess; changed: (keyof SlotGuess)[] } | { reason: RejectReason };

function applyPatch(prev: SlotGuess, patch: unknown, s: SaveState, c: CompiledCase): PatchResult {
  if (patch === null || typeof patch !== 'object') return { reason: 'notAvailable' };
  const p = patch as Record<string, unknown>;
  const next: SlotGuess = { ...prev };
  let names: ReturnType<typeof availableNames> | undefined;

  for (const field of ['given', 'family'] as const) {
    const v = p[field];
    if (v === undefined) continue;
    if (typeof v !== 'string') return { reason: 'notAvailable' };
    if (v.length > ENGINE_LIMITS.name) return { reason: 'tooLong' };
    if (v.trim() === '') {
      next[field] = '';
      continue;
    }
    names ??= availableNames(s, c);
    const match = matchName(v, names[field]);
    if (match === null) return { reason: 'notAvailable' };
    next[field] = match;
  }

  const portrait = p['portrait'];
  if (portrait !== undefined) {
    if (portrait === null) next.portrait = null;
    else if (typeof portrait !== 'string' || own(c.portraits, portrait) === undefined) {
      return { reason: 'unknownId' };
    } else if (!availablePortraits(s, c).includes(portrait)) return { reason: 'notAvailable' };
    else next.portrait = portrait;
  }

  const occupation = p['occupation'];
  if (occupation !== undefined) {
    if (occupation === null) next.occupation = null;
    else if (typeof occupation !== 'string' || own(c.occupations, occupation) === undefined) {
      return { reason: 'unknownId' };
    } else if (!availableOccupations(s, c).includes(occupation)) return { reason: 'notAvailable' };
    else next.occupation = occupation;
  }

  const changed = (['given', 'family', 'portrait', 'occupation'] as const).filter(
    (f) => next[f] !== prev[f],
  );
  return { guess: next, changed };
}

function uniqueNoteId(s: SaveState, at: number): string {
  const ids = new Set(s.notebook.notes.map((n) => n.id));
  const base = `n${at.toString(36)}`;
  let id = base;
  for (let i = 1; ids.has(id); i++) id = `${base}-${i}`;
  return id;
}

/**
 * Réducteur pur (ARCHITECTURE §3.5). Une action impossible renvoie l'état inchangé et un
 * événement `rejected` ; aucune exception, aucune mutation. Le garde-fou anti-balayage
 * circule par `opts.guard` → `transition.guard`.
 */
export function applyAction(
  s: SaveState,
  a: Action,
  c: CompiledCase,
  opts: ApplyOptions = {},
): EngineTransition {
  const guard = opts.guard ?? emptyGuard();
  if (a === null || typeof a !== 'object') return reject(s, 'notAvailable', guard);

  if (a.type === 'tick') {
    const raw = typeof a.deltaMs === 'number' && Number.isFinite(a.deltaMs) ? a.deltaMs : 0;
    const delta = Math.round(Math.min(MAX_TICK_MS, Math.max(0, raw)));
    // Chrono figé au dénouement en mode chronométré (temps de référence des succès).
    if (delta === 0 || (s.mode === 'timed' && s.ending !== null))
      return { state: s, events: [], guard };
    return { state: { ...s, elapsedMs: s.elapsedMs + delta }, events: [], guard };
  }

  // Horloge monotone : un `at` absent, invalide ou antérieur vaut `updatedAt`.
  const at = Math.max(s.updatedAt, toMs((a as { at?: unknown }).at, s.updatedAt));

  switch (a.type) {
    case 'openDocument': {
      if (own(c.documents, a.id) === undefined) return reject(s, 'unknownId', guard);
      if (own(s.unlocked, a.id) === undefined) return reject(s, 'notAvailable', guard);
      const state = touch(s, at);
      if (own(s.read, a.id) !== undefined) return finalize(state, [], c, guard);
      return finalize({ ...state, read: { ...s.read, [a.id]: at } }, [], c, guard);
    }

    case 'search': {
      if (typeof a.query !== 'string') return reject(s, 'notAvailable', guard);
      if (a.query.length > SAVE_LIMITS.query) return reject(s, 'tooLong', guard);
      const outcome = search(a.query, s, c);
      const events: GameEvent[] = [{ type: 'searchResult', outcome }];
      if (outcome.normalized === '') return { state: s, events, guard };
      const log = [...s.searchLog, { query: outcome.query, keyword: outcome.keyword, at }];
      let state: SaveState = {
        ...touch(s, at),
        searchLog: log.slice(-SAVE_LIMITS.searchLog),
      };
      if (outcome.keyword !== null && !s.searched.includes(outcome.keyword)) {
        state = { ...state, searched: [...s.searched, outcome.keyword] };
      }
      if (outcome.newDocuments.length > 0) {
        const unlocked = { ...state.unlocked };
        for (const d of outcome.newDocuments) unlocked[d] = at;
        state = { ...state, unlocked };
        events.push({ type: 'documentsUnlocked', ids: [...outcome.newDocuments] });
      }
      return finalize(state, events, c, guard);
    }

    case 'visitPlace': {
      if (own(c.places, a.id) === undefined) return reject(s, 'unknownId', guard);
      if (!isPlaceVisible(a.id, s, c)) return reject(s, 'notAvailable', guard);
      let state = touch(s, at);
      if (!s.visited.includes(a.id)) state = { ...state, visited: [...s.visited, a.id] };
      const fresh = placeDocuments(a.id, state, c).filter((d) => own(s.unlocked, d) === undefined);
      const events: GameEvent[] = [];
      if (fresh.length > 0) {
        const unlocked = { ...state.unlocked };
        for (const d of fresh) unlocked[d] = at;
        state = { ...state, unlocked };
        events.push({ type: 'documentsUnlocked', ids: fresh });
      }
      return finalize(state, events, c, guard);
    }

    case 'setSlot': {
      if (own(c.slots, a.slot) === undefined) return reject(s, 'unknownId', guard);
      if (!isSlotVisible(a.slot, s, c)) return reject(s, 'notAvailable', guard);
      if (own(s.locked, a.slot) !== undefined) return reject(s, 'slotLocked', guard);
      const prev = own(s.tree, a.slot) ?? EMPTY_GUESS;
      const res = applyPatch(prev, a.patch, s, c);
      if ('reason' in res) return reject(s, res.reason, guard);
      if (res.changed.length === 0) return { state: s, events: [], guard };

      const tree = { ...s.tree };
      const g = res.guess;
      if (g.given === '' && g.family === '' && g.portrait === null && g.occupation === null) {
        delete tree[a.slot];
      } else tree[a.slot] = g;
      let state: SaveState = { ...touch(s, at), tree };
      const group = groupOf(a.slot, c);
      const nextGuard = recordChanges(guard, group?.id ?? null, a.slot, res.changed, at);

      if ((opts.validation ?? 'auto') === 'auto' && group && isComplete(g)) {
        const result = validate(state, c, { groups: [group.id], guard: nextGuard, at });
        const locked = applyLocks(state, result, at);
        state = locked.state;
        return finalize(state, locked.events, c, nextGuard);
      }
      return finalize(state, [], c, nextGuard);
    }

    case 'clearSlot': {
      if (own(c.slots, a.slot) === undefined) return reject(s, 'unknownId', guard);
      if (own(s.locked, a.slot) !== undefined) return reject(s, 'slotLocked', guard);
      const prev = own(s.tree, a.slot);
      if (prev === undefined) return { state: s, events: [], guard };
      const tree = { ...s.tree };
      delete tree[a.slot];
      const changed = (['given', 'family', 'portrait', 'occupation'] as const).filter(
        (f) => prev[f] !== EMPTY_GUESS[f],
      );
      const nextGuard = recordChanges(guard, groupOf(a.slot, c)?.id ?? null, a.slot, changed, at);
      return { state: { ...touch(s, at), tree }, events: [], guard: nextGuard };
    }

    case 'validate': {
      const state = touch(s, at);
      const locked = applyLocks(state, validate(state, c, { guard, at }), at);
      return finalize(locked.state, locked.events, c, guard);
    }

    case 'pin':
    case 'unpin': {
      const target = a.target;
      if (a.type === 'unpin') {
        if (target === null || typeof target !== 'object') return reject(s, 'notAvailable', guard);
        const pins = s.notebook.pins.filter((p) => !samePin(p, target));
        if (pins.length === s.notebook.pins.length) return { state: s, events: [], guard };
        return { state: { ...touch(s, at), notebook: { ...s.notebook, pins } }, events: [], guard };
      }
      const bad = checkPin(target, s, c);
      if (bad) return reject(s, bad, guard);
      if (s.notebook.pins.some((p) => samePin(p, target))) return { state: s, events: [], guard };
      if (s.notebook.pins.length >= SAVE_LIMITS.pins) return reject(s, 'limit', guard);
      const pins = [...s.notebook.pins, { kind: target.kind, id: target.id }];
      return { state: { ...touch(s, at), notebook: { ...s.notebook, pins } }, events: [], guard };
    }

    case 'highlight': {
      const parsed = HighlightSchema.safeParse(a.h);
      if (!parsed.success) return reject(s, 'notAvailable', guard);
      const h = parsed.data;
      if (own(c.documents, h.doc) === undefined) return reject(s, 'unknownId', guard);
      if (own(s.unlocked, h.doc) === undefined) return reject(s, 'notAvailable', guard);
      const list = s.notebook.highlights;
      const dup = list.some(
        (x) =>
          x.doc === h.doc &&
          x.start === h.start &&
          x.end === h.end &&
          x.color === h.color &&
          x.path.length === h.path.length &&
          x.path.every((v, i) => v === h.path[i]),
      );
      if (dup) return { state: s, events: [], guard };
      if (list.length >= ENGINE_LIMITS.highlights) return reject(s, 'limit', guard);
      const highlights = [...list, { ...h, path: [...h.path] }];
      return {
        state: { ...touch(s, at), notebook: { ...s.notebook, highlights } },
        events: [],
        guard,
      };
    }

    case 'removeHighlight': {
      const list = s.notebook.highlights;
      if (!Number.isInteger(a.index) || a.index < 0 || a.index >= list.length) {
        return reject(s, 'unknownId', guard);
      }
      const highlights = list.filter((_, i) => i !== a.index);
      return {
        state: { ...touch(s, at), notebook: { ...s.notebook, highlights } },
        events: [],
        guard,
      };
    }

    case 'note': {
      if (typeof a.text !== 'string') return reject(s, 'notAvailable', guard);
      if (a.text.length > SAVE_LIMITS.noteText) return reject(s, 'tooLong', guard);
      if (a.target !== undefined) {
        const bad = checkPin(a.target, s, c);
        if (bad) return reject(s, bad, guard);
      }
      const notes = s.notebook.notes;
      if (a.id !== undefined) {
        if (typeof a.id !== 'string' || a.id === '') return reject(s, 'notAvailable', guard);
        if (a.id.length > ENGINE_LIMITS.noteId) return reject(s, 'tooLong', guard);
      }
      const id = a.id ?? uniqueNoteId(s, at);
      const note = {
        id,
        ...(a.target ? { target: { kind: a.target.kind, id: a.target.id } } : {}),
        text: a.text,
        at,
      };
      const index = notes.findIndex((n) => n.id === id);
      if (index < 0 && notes.length >= ENGINE_LIMITS.notes) return reject(s, 'limit', guard);
      const next = index < 0 ? [...notes, note] : notes.map((n, i) => (i === index ? note : n));
      return {
        state: { ...touch(s, at), notebook: { ...s.notebook, notes: next } },
        events: [],
        guard,
      };
    }

    case 'deleteNote': {
      const notes = s.notebook.notes.filter((n) => n.id !== a.id);
      if (notes.length === s.notebook.notes.length) return reject(s, 'unknownId', guard);
      return { state: { ...touch(s, at), notebook: { ...s.notebook, notes } }, events: [], guard };
    }

    case 'useHint': {
      const hint = c.hints.find((h) => h.id === a.id);
      if (!hint) return reject(s, 'unknownId', guard);
      if (own(s.hintsUsed, hint.id) !== undefined) return { state: s, events: [], guard };
      const blocker = hintBlocker(hint, s, c);
      if (blocker) return reject(s, blocker, guard);
      return {
        state: { ...touch(s, at), hintsUsed: { ...s.hintsUsed, [hint.id]: at } },
        events: [],
        guard,
      };
    }

    case 'finish': {
      const ending = endingFor(s, c);
      if (ending === null) return reject(s, 'notAvailable', guard);
      return {
        state: { ...touch(s, at), ending },
        events: [{ type: 'endingReached', id: ending }],
        guard,
      };
    }

    default:
      return reject(s, 'notAvailable', guard);
  }
}
