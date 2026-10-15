import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { runAdmin } from '../src/admin';
import { TicketStore, initDatabase } from '../src/db';
import { runRetention } from '../src/retention';
import { T0 } from './helpers';

const DAY = 24 * 3_600_000;

function setup() {
  const db = initDatabase(new DatabaseSync(':memory:'));
  const store = new TicketStore(db, 'AA');
  const add = (n: number, closedAt: number | null) => {
    const row = store.insert({
      tokenHash: `hash-${n}`,
      createdAt: T0,
      source: 'game',
      category: 'bug',
      locale: 'fr',
      contact: `c${n}@example.org`,
      pendingPayload: '{}',
    });
    store.markCreated(row.id, 100 + n, T0);
    if (closedAt !== null) {
      store.applyIssue(row.id, {
        status: 'closed',
        fixedIn: null,
        closedReason: 'resolved',
        closedAt,
        public: false,
        title: null,
        syncedAt: closedAt,
        updatedAt: closedAt,
      });
    }
    return row.ticket;
  };
  return { db, store, add };
}

describe('conservation D13 (horloge simulée)', () => {
  it('contact effacé à 30 jours, ticket supprimé à 12 mois, tickets ouverts intacts', () => {
    const { store, add } = setup();
    const open = add(1, null);
    const closed = add(2, T0);
    expect(runRetention(store, T0 + 29 * DAY)).toEqual({ contactsErased: 0, ticketsDeleted: 0 });
    expect(runRetention(store, T0 + 30 * DAY)).toEqual({ contactsErased: 1, ticketsDeleted: 0 });
    expect(store.byTicket(closed)).toMatchObject({ contact: null, tokenHash: 'hash-2' });
    expect(store.byTicket(open)?.contact).toBe('c1@example.org');
    expect(runRetention(store, T0 + 364 * DAY).ticketsDeleted).toBe(0);
    expect(runRetention(store, T0 + 365 * DAY)).toEqual({ contactsErased: 0, ticketsDeleted: 1 });
    expect(store.byTicket(closed)).toBeUndefined();
    expect(store.byTicket(open)?.contact).toBe('c1@example.org');
  });

  it('numéros jamais réutilisés après suppression', () => {
    const { store, add } = setup();
    add(1, T0);
    runRetention(store, T0 + 400 * DAY);
    expect(add(2, null)).toBe('AA-0002');
  });
});

describe('admin.js', () => {
  it('contact, status, pending, retention, erreurs', () => {
    const { db, add } = setup();
    const ticket = add(1, null);
    const out: string[] = [];
    const err: string[] = [];
    const io = { out: (l: string) => out.push(l), err: (l: string) => err.push(l) };
    const deps = { db, prefix: 'AA', now: () => T0 };
    expect(runAdmin(['contact', ticket], deps, io)).toBe(0);
    expect(out.pop()).toBe('c1@example.org');
    expect(runAdmin(['status', ticket], deps, io)).toBe(0);
    const status = out.pop()!;
    expect(status).toContain('"hasContact": true');
    expect(status).not.toContain('c1@example.org');
    expect(status).not.toContain('hash-1');
    expect(runAdmin(['pending'], deps, io)).toBe(0);
    expect(out.pop()).toBe('0');
    expect(runAdmin(['retention'], deps, io)).toBe(0);
    expect(runAdmin(['contact', 'AA-9999'], deps, io)).toBe(1);
    expect(runAdmin(['contact', "'; DROP TABLE tickets"], deps, io)).toBe(1);
    expect(runAdmin([], deps, io)).toBe(2);
    expect(err).toHaveLength(3);
  });
});
