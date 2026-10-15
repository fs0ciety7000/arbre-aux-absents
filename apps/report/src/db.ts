import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import type {
  Locale,
  ReportCategory,
  ReportSource,
  TicketClosedReason,
  TicketStatus,
} from '@arbre/contract';
import type { Marker } from './status';

/**
 * Base SQLite (`node:sqlite`, ARCHITECTURE §8). Aucune IP, jeton stocké haché (SHA-256).
 * Colonnes ajoutées au schéma de référence, propres à l'implémentation : `pending_op`, `attempts`,
 * `next_attempt_at` (file de réessai), `public` et `title` (problèmes connus). `replies_json` garde
 * les marqueurs de mainteneurs (réponses `/public` et titre `/public-title-en`).
 */

export const SCHEMA_VERSION = 1;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tickets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket          TEXT NOT NULL UNIQUE,
  token_hash      TEXT UNIQUE,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  source          TEXT NOT NULL,
  category        TEXT NOT NULL,
  locale          TEXT NOT NULL,
  issue_number    INTEGER,
  status          TEXT NOT NULL DEFAULT 'received',
  fixed_in        TEXT,
  closed_reason   TEXT,
  closed_at       INTEGER,
  replies_json    TEXT NOT NULL DEFAULT '[]',
  contact         TEXT,
  pending_op      TEXT CHECK (pending_op IN ('create', 'redact')),
  pending_payload TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  etag            TEXT,
  synced_at       INTEGER,
  public          INTEGER NOT NULL DEFAULT 0,
  title           TEXT
);
CREATE INDEX IF NOT EXISTS tickets_issue ON tickets (issue_number);
CREATE INDEX IF NOT EXISTS tickets_pending ON tickets (pending_op, next_attempt_at);
CREATE INDEX IF NOT EXISTS tickets_closed ON tickets (closed_at);
CREATE INDEX IF NOT EXISTS tickets_public ON tickets (public, updated_at);
`;

export type PendingOp = 'create' | 'redact';

export interface TicketRow {
  id: number;
  ticket: string;
  tokenHash: string | null;
  createdAt: number;
  updatedAt: number;
  source: ReportSource;
  category: ReportCategory;
  locale: Locale;
  issueNumber: number | null;
  status: TicketStatus;
  fixedIn: string | null;
  closedReason: TicketClosedReason | null;
  closedAt: number | null;
  markers: Marker[];
  contact: string | null;
  pendingOp: PendingOp | null;
  pendingPayload: string | null;
  attempts: number;
  nextAttemptAt: number | null;
  etag: string | null;
  syncedAt: number | null;
  public: boolean;
  title: string | null;
}

type Raw = Record<string, unknown>;

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

function parseMarkers(json: unknown): Marker[] {
  try {
    const v: unknown = JSON.parse(String(json ?? '[]'));
    return Array.isArray(v) ? (v as Marker[]) : [];
  } catch {
    return [];
  }
}

function toRow(r: Raw): TicketRow {
  return {
    id: Number(r.id),
    ticket: String(r.ticket),
    tokenHash: str(r.token_hash),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    source: String(r.source) as ReportSource,
    category: String(r.category) as ReportCategory,
    locale: String(r.locale) as Locale,
    issueNumber: num(r.issue_number),
    status: String(r.status) as TicketStatus,
    fixedIn: str(r.fixed_in),
    closedReason: str(r.closed_reason) as TicketClosedReason | null,
    closedAt: num(r.closed_at),
    markers: parseMarkers(r.replies_json),
    contact: str(r.contact),
    pendingOp: str(r.pending_op) as PendingOp | null,
    pendingPayload: str(r.pending_payload),
    attempts: Number(r.attempts),
    nextAttemptAt: num(r.next_attempt_at),
    etag: str(r.etag),
    syncedAt: num(r.synced_at),
    public: Number(r.public) === 1,
    title: str(r.title),
  };
}

export interface NewTicket {
  tokenHash: string;
  createdAt: number;
  source: ReportSource;
  category: ReportCategory;
  locale: Locale;
  contact: string | null;
  pendingPayload: string;
}

/** Champs mis à jour après lecture du ticket GitHub. */
export interface IssueUpdate {
  status: TicketStatus;
  fixedIn: string | null;
  closedReason: TicketClosedReason | null;
  closedAt: number | null;
  public: boolean;
  title: string | null;
  markers?: Marker[];
  etag?: string | null;
  syncedAt: number;
  updatedAt: number;
}

export function openDatabase(dataDir: string): DatabaseSync {
  if (dataDir === ':memory:') return initDatabase(new DatabaseSync(':memory:'));
  mkdirSync(dataDir, { recursive: true });
  return initDatabase(new DatabaseSync(join(dataDir, 'report.sqlite')));
}

export function initDatabase(db: DatabaseSync): DatabaseSync {
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', ?)").run(
    String(SCHEMA_VERSION),
  );
  return db;
}

export class TicketStore {
  constructor(
    readonly db: DatabaseSync,
    private readonly prefix: string,
  ) {}

  private all(sql: string, ...params: SQLInputValue[]): TicketRow[] {
    return (this.db.prepare(sql).all(...params) as Raw[]).map(toRow);
  }

  private one(sql: string, ...params: SQLInputValue[]): TicketRow | undefined {
    const r = this.db.prepare(sql).get(...params) as Raw | undefined;
    return r ? toRow(r) : undefined;
  }

  private tx<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      this.db.exec('COMMIT');
      return out;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  formatTicket(id: number): string {
    return `${this.prefix}-${String(id).padStart(4, '0')}`;
  }

  /** Insère un ticket et lui attribue son numéro (`AA-0042`, jamais réutilisé). */
  insert(t: NewTicket): TicketRow {
    return this.tx(() => {
      const placeholder = `tmp-${t.tokenHash}`;
      const r = this.db
        .prepare(
          `INSERT INTO tickets (ticket, token_hash, created_at, updated_at, source, category, locale,
             contact, pending_op, pending_payload, next_attempt_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'create', ?, ?)`,
        )
        .run(
          placeholder,
          t.tokenHash,
          t.createdAt,
          t.createdAt,
          t.source,
          t.category,
          t.locale,
          t.contact,
          t.pendingPayload,
          t.createdAt,
        );
      const id = Number(r.lastInsertRowid);
      this.db.prepare('UPDATE tickets SET ticket = ? WHERE id = ?').run(this.formatTicket(id), id);
      return this.byId(id)!;
    });
  }

  setPayload(id: number, payload: string): void {
    this.db.prepare('UPDATE tickets SET pending_payload = ? WHERE id = ?').run(payload, id);
  }

  byId(id: number): TicketRow | undefined {
    return this.one('SELECT * FROM tickets WHERE id = ?', id);
  }

  byTokenHash(hash: string): TicketRow | undefined {
    return this.one('SELECT * FROM tickets WHERE token_hash = ?', hash);
  }

  byTicket(ticket: string): TicketRow | undefined {
    return this.one('SELECT * FROM tickets WHERE ticket = ?', ticket);
  }

  byIssue(issueNumber: number): TicketRow | undefined {
    return this.one('SELECT * FROM tickets WHERE issue_number = ?', issueNumber);
  }

  /** Opérations GitHub en attente et échues (une suppression attend la création du ticket). */
  duePending(now: number, limit: number): TicketRow[] {
    return this.all(
      `SELECT * FROM tickets
       WHERE (pending_op = 'create' OR (pending_op = 'redact' AND issue_number IS NOT NULL))
         AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
       ORDER BY next_attempt_at, id LIMIT ?`,
      now,
      limit,
    );
  }

  pendingCount(): number {
    const r = this.db
      .prepare('SELECT COUNT(*) AS n FROM tickets WHERE pending_op IS NOT NULL')
      .get() as Raw;
    return Number(r.n);
  }

  /** Création GitHub réussie : la charge utile (données personnelles possibles) est effacée. */
  markCreated(id: number, issueNumber: number, now: number): void {
    this.db
      .prepare(
        `UPDATE tickets SET issue_number = ?, pending_payload = NULL, attempts = 0,
           next_attempt_at = CASE WHEN pending_op = 'redact' THEN ? ELSE NULL END,
           pending_op = CASE WHEN pending_op = 'redact' THEN 'redact' ELSE NULL END,
           synced_at = ?
         WHERE id = ?`,
      )
      .run(issueNumber, now, now, id);
  }

  markRedacted(id: number): void {
    this.db
      .prepare(
        'UPDATE tickets SET pending_op = NULL, attempts = 0, next_attempt_at = NULL WHERE id = ?',
      )
      .run(id);
  }

  markAttemptFailed(id: number, attempts: number, nextAttemptAt: number): void {
    this.db
      .prepare('UPDATE tickets SET attempts = ?, next_attempt_at = ? WHERE id = ?')
      .run(attempts, nextAttemptAt, id);
  }

  /**
   * `DELETE /v1/tickets/current` : jeton invalidé, contact et charge utile effacés. Sans ticket
   * GitHub ni création en cours, la ligne disparaît ; sinon le corps GitHub sera remplacé.
   */
  forget(id: number, creating: boolean, now: number): void {
    const row = this.byId(id);
    if (!row) return;
    if (row.issueNumber === null && !creating) {
      this.db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
      return;
    }
    this.db
      .prepare(
        `UPDATE tickets SET token_hash = NULL, contact = NULL, pending_payload = NULL,
           pending_op = 'redact', attempts = 0, next_attempt_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(now, now, id);
  }

  /** Création échouée alors qu'une suppression a été demandée entre-temps. */
  deleteIfForgotten(id: number): boolean {
    const r = this.db
      .prepare(
        "DELETE FROM tickets WHERE id = ? AND issue_number IS NULL AND pending_op = 'redact'",
      )
      .run(id);
    return Number(r.changes) > 0;
  }

  applyIssue(id: number, u: IssueUpdate): void {
    const sets = [
      'status = ?',
      'fixed_in = ?',
      'closed_reason = ?',
      'closed_at = ?',
      'public = ?',
      'title = ?',
      'synced_at = ?',
      'updated_at = ?',
    ];
    const params: SQLInputValue[] = [
      u.status,
      u.fixedIn,
      u.closedReason,
      u.closedAt,
      u.public ? 1 : 0,
      u.title,
      u.syncedAt,
      u.updatedAt,
    ];
    if (u.markers) {
      sets.push('replies_json = ?');
      params.push(JSON.stringify(u.markers));
    }
    if (u.etag !== undefined) {
      sets.push('etag = ?');
      params.push(u.etag);
    }
    this.db.prepare(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
  }

  setMarkers(id: number, markers: readonly Marker[], updatedAt: number): void {
    this.db
      .prepare('UPDATE tickets SET replies_json = ?, updated_at = ?, etag = NULL WHERE id = ?')
      .run(JSON.stringify(markers), updatedAt, id);
  }

  touchSynced(id: number, syncedAt: number): void {
    this.db.prepare('UPDATE tickets SET synced_at = ? WHERE id = ?').run(syncedAt, id);
  }

  /** Force un rafraîchissement à la prochaine lecture (événement `milestone`). */
  markStale(where: 'fixed'): number {
    const r = this.db
      .prepare(
        'UPDATE tickets SET synced_at = 0, etag = NULL WHERE status = ? AND issue_number IS NOT NULL',
      )
      .run(where);
    return Number(r.changes);
  }

  /** Tickets à rapprocher : non fermés, ou fermés depuis moins de `closedWithinMs`. */
  toReconcile(now: number, closedWithinMs: number, limit: number): TicketRow[] {
    return this.all(
      `SELECT * FROM tickets
       WHERE issue_number IS NOT NULL AND (closed_at IS NULL OR closed_at > ?)
       ORDER BY COALESCE(synced_at, 0), id LIMIT ?`,
      now - closedWithinMs,
      limit,
    );
  }

  publicTickets(limit: number): TicketRow[] {
    return this.all(
      'SELECT * FROM tickets WHERE public = 1 AND issue_number IS NOT NULL ORDER BY updated_at DESC, id DESC LIMIT ?',
      limit,
    );
  }

  /** Conservation D13. */
  retention(now: number, contactAfterMs: number, ticketAfterMs: number) {
    return this.tx(() => {
      const contacts = this.db
        .prepare(
          'UPDATE tickets SET contact = NULL WHERE contact IS NOT NULL AND closed_at IS NOT NULL AND closed_at <= ?',
        )
        .run(now - contactAfterMs);
      const tickets = this.db
        .prepare(
          'DELETE FROM tickets WHERE closed_at IS NOT NULL AND closed_at <= ? AND pending_op IS NULL',
        )
        .run(now - ticketAfterMs);
      return { contactsErased: Number(contacts.changes), ticketsDeleted: Number(tickets.changes) };
    });
  }
}
