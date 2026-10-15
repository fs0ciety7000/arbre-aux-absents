import type { DatabaseSync } from 'node:sqlite';
import { TICKET_NUMBER } from '@arbre/contract';
import { TicketStore } from './db';
import { runRetention } from './retention';

/**
 * Outil d'exploitation, depuis le terminal Coolify uniquement (aucune route HTTP d'administration) :
 *   node dist/admin.js contact AA-0042   contact laissé par le joueur (jamais envoyé à GitHub)
 *   node dist/admin.js status AA-0042    état du ticket (sans contact ni jeton)
 *   node dist/admin.js pending           opérations GitHub en attente
 *   node dist/admin.js retention         applique la conservation D13 maintenant
 */

export const ADMIN_USAGE = `Usage :
  node dist/admin.js contact <TICKET>
  node dist/admin.js status <TICKET>
  node dist/admin.js pending
  node dist/admin.js retention`;

export interface AdminIo {
  out(line: string): void;
  err(line: string): void;
}

export function runAdmin(
  argv: readonly string[],
  deps: { db: DatabaseSync; prefix: string; now?: () => number },
  io: AdminIo,
): number {
  const store = new TicketStore(deps.db, deps.prefix);
  const [command, arg] = argv;
  const needTicket = () => {
    if (!arg || !TICKET_NUMBER.test(arg)) {
      io.err(`Numéro de ticket attendu (ex. ${deps.prefix}-0042).`);
      return undefined;
    }
    const row = store.byTicket(arg);
    if (!row) io.err(`${arg} : inconnu (supprimé ou jamais créé).`);
    return row;
  };
  switch (command) {
    case 'contact': {
      const row = needTicket();
      if (!row) return 1;
      io.out(row.contact ?? '(aucun contact)');
      return 0;
    }
    case 'status': {
      const row = needTicket();
      if (!row) return 1;
      io.out(
        JSON.stringify(
          {
            ticket: row.ticket,
            status: row.status,
            fixedIn: row.fixedIn,
            closedReason: row.closedReason,
            issue: row.issueNumber,
            pending: row.pendingOp,
            attempts: row.attempts,
            createdAt: new Date(row.createdAt).toISOString(),
            closedAt: row.closedAt ? new Date(row.closedAt).toISOString() : null,
            hasContact: row.contact !== null,
            public: row.public,
          },
          null,
          2,
        ),
      );
      return 0;
    }
    case 'pending':
      io.out(String(store.pendingCount()));
      return 0;
    case 'retention': {
      const r = runRetention(store, (deps.now ?? Date.now)());
      io.out(`Contacts effacés : ${r.contactsErased}, tickets supprimés : ${r.ticketsDeleted}`);
      return 0;
    }
    default:
      io.err(ADMIN_USAGE);
      return 2;
  }
}
