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
    const { db, store, add } = setup();
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
    expect(status).toContain('"failed": null');
    // Opération abandonnée : listée par `pending`, détaillée par `status`, reprise par `retry`.
    const failedRow = store.insert({
      tokenHash: 'hash-f',
      createdAt: T0,
      source: 'site',
      category: 'bug',
      locale: 'en',
      contact: null,
      pendingPayload: '{}',
    });
    store.markFailed(failedRow.id, 8, 422, T0);
    out.length = 0;
    expect(runAdmin(['pending'], deps, io)).toBe(0);
    expect(out).toEqual([
      '0',
      `ÉCHEC ${failedRow.ticket} create : HTTP 422, 8 tentatives, abandonné le 2026-10-15T12:00:00.000Z`,
    ]);
    expect(runAdmin(['status', failedRow.ticket], deps, io)).toBe(0);
    expect(out.pop()).toContain('"httpStatus": 422');
    expect(runAdmin(['retry', failedRow.ticket], deps, io)).toBe(0);
    expect(store.byTicket(failedRow.ticket)).toMatchObject({ failedAt: null, attempts: 0 });
    expect(store.pendingCount()).toBe(1);
    expect(runAdmin(['retry', failedRow.ticket], deps, io)).toBe(1);
    err.length = 0;
    expect(runAdmin(['retention'], deps, io)).toBe(0);
    expect(runAdmin(['contact', 'AA-9999'], deps, io)).toBe(1);
    expect(runAdmin(['contact', "'; DROP TABLE tickets"], deps, io)).toBe(1);
    expect(runAdmin([], deps, io)).toBe(2);
    expect(err).toHaveLength(3);
  });
});

describe('schéma', () => {
  it('base v1 : colonnes de l’abandon ajoutées au démarrage, données gardées', () => {
    const db = new DatabaseSync(':memory:');
    db.exec(`CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ticket TEXT NOT NULL UNIQUE, token_hash TEXT UNIQUE,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, source TEXT NOT NULL,
      category TEXT NOT NULL, locale TEXT NOT NULL, issue_number INTEGER,
      status TEXT NOT NULL DEFAULT 'received', fixed_in TEXT, closed_reason TEXT, closed_at INTEGER,
      replies_json TEXT NOT NULL DEFAULT '[]', contact TEXT,
      pending_op TEXT CHECK (pending_op IN ('create', 'redact')), pending_payload TEXT,
      attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER, etag TEXT, synced_at INTEGER,
      public INTEGER NOT NULL DEFAULT 0, title TEXT)`);
    db.exec(`INSERT INTO tickets (ticket, created_at, updated_at, source, category, locale)
      VALUES ('AA-0001', 1, 1, 'game', 'bug', 'fr')`);
    initDatabase(db);
    const store = new TicketStore(db, 'AA');
    expect(store.byTicket('AA-0001')).toMatchObject({ failedAt: null, failedStatus: null });
    expect(store.failedCount()).toBe(0);
    expect(db.prepare("SELECT value FROM meta WHERE key = 'schema'").get()).toEqual({ value: '2' });
  });
});
