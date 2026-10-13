import type { SaveSlotId, SaveState } from '@arbre/contract';

export function makeSave(slot: SaveSlotId = 'slot-1', patch: Partial<SaveState> = {}): SaveState {
  return {
    schemaVersion: 1,
    caseId: 'affaire-test',
    contentHash: '0123abcd',
    edition: 'full',
    slot,
    mode: 'standard',
    createdAt: 1000,
    updatedAt: 2000,
    elapsedMs: 5000,
    unlocked: {},
    read: {},
    searched: [],
    searchLog: [],
    visited: [],
    revealedSlots: [],
    tree: {},
    locked: {},
    secrets: {},
    hintsUsed: {},
    notebook: { pins: [], highlights: [], notes: [] },
    ending: null,
    ...patch,
  };
}

/** localStorage minimal (Node n'en a pas), avec quota optionnel en caractères. */
export class FakeStorage implements Storage {
  #m = new Map<string, string>();
  constructor(private quota = Infinity) {}
  get length() {
    return this.#m.size;
  }
  clear() {
    this.#m.clear();
  }
  getItem(k: string) {
    return this.#m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.#m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.#m.delete(k);
  }
  setItem(k: string, v: string) {
    let used = 0;
    for (const [kk, vv] of this.#m) if (kk !== k) used += vv.length;
    if (used + v.length > this.quota) {
      const e = new Error('quota exceeded');
      e.name = 'QuotaExceededError';
      throw e;
    }
    this.#m.set(k, String(v));
  }
  [name: string]: unknown;
}
