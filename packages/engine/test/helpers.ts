import type { Action, CompiledCase, GameEvent, SaveState, SlotGuess } from '@arbre/contract';
import { applyAction, newGame, type ApplyOptions, type SweepGuard } from '../src';
import { fixtureCase, SOLUTION } from './fixtures/case';

/** Gel profond : toute mutation par le moteur lèverait une TypeError en mode strict. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v);
  }
  return value;
}

/** Copie profonde (le contenu compilé est du JSON pur). */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Affaire gelée partagée par les tests. */
export const C: CompiledCase = deepFreeze(clone(fixtureCase));

export function start(mode: SaveState['mode'] = 'standard', at = 1000): SaveState {
  return deepFreeze(newGame(C, { slot: 'slot-1', mode, at }));
}

export interface Run {
  state: SaveState;
  events: GameEvent[];
  guard: SweepGuard | undefined;
}

/** Joue des actions en gelant chaque état intermédiaire (contrôle d'immuabilité). */
export function play(
  s: SaveState,
  actions: Action[],
  opts: ApplyOptions = {},
  c: CompiledCase = C,
): Run {
  let state = deepFreeze(s);
  let guard = opts.guard;
  const events: GameEvent[] = [];
  for (const a of actions) {
    const t = applyAction(state, a, c, { ...opts, ...(guard ? { guard } : {}) });
    state = deepFreeze(t.state);
    guard = t.guard;
    events.push(...t.events);
  }
  return { state, events, guard };
}

export const open = (id: string, at: number): Action => ({ type: 'openDocument', id, at });
export const find = (query: string, at: number): Action => ({ type: 'search', query, at });
export const visit = (id: string, at: number): Action => ({ type: 'visitPlace', id, at });
export const fill = (slot: string, at: number, patch?: Partial<SlotGuess>): Action => ({
  type: 'setSlot',
  slot,
  patch: patch ?? { ...(SOLUTION[slot] as SlotGuess) },
  at,
});

/** Lectures et recherches qui rendent disponibles tous les candidats du groupe des aînés. */
export const AINES_RESEARCH: Action[] = [
  open('lettre-notaire', 2000),
  open('photo-noces', 3000),
  find('Marrel', 4000),
  open('registre-marrel', 5000),
  visit('port-lanne', 6000),
  open('annuaire-lanne', 7000),
  find('sorvo', 8000),
  open('photo-fratrie', 9000),
  find('École', 10000),
  open('lettre-lisbe', 11000),
];

/** Recherches pour le groupe des cadets (après verrouillage des aînés). */
export const CADETS_RESEARCH: Action[] = [
  open('carte-tam', 20000),
  find('Dacque', 21000),
  open('registre-dacque', 22000),
  visit('vessaut', 23000),
  open('moulin-vessaut', 24000),
  find('Caël', 25000),
  open('photo-quai', 26000),
];

export function events<T extends GameEvent['type']>(
  list: GameEvent[],
  type: T,
): Extract<GameEvent, { type: T }>[] {
  return list.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}

export function researched(): SaveState {
  return play(start(), AINES_RESEARCH).state;
}
