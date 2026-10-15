import type { DatabaseSync } from 'node:sqlite';
import { ATTACHMENT_ID, TICKET_NUMBER } from '@arbre/contract';
import type { BlobStore, UrlSigner } from './attachments';
import { purgeAttachments } from './attachments';
import { TicketStore } from './db';
import { formatBytes } from './render';
import { runRetention } from './retention';

/**
 * Outil d'exploitation, depuis le terminal Coolify uniquement (aucune route HTTP d'administration) :
 *   node dist/admin.js contact AA-0042   contact laissé par le joueur (jamais envoyé à GitHub)
 *   node dist/admin.js status AA-0042    état du ticket (sans contact ni jeton)
 *   node dist/admin.js pending           opérations GitHub en attente, puis les abandonnées
 *   node dist/admin.js retry AA-0042     remet dans la file une opération abandonnée
 *   node dist/admin.js retention         applique la conservation D13 maintenant (pièces comprises)
 *   node dist/admin.js attachments       pièces jointes : nombre et volume
 *   node dist/admin.js attachments AA-0042   pièces d'un ticket, avec leurs URL signées
 *   node dist/admin.js attachment-delete <id>  supprime une pièce (ligne et fichier)
 *   node dist/admin.js purge             purge maintenant les pièces libres expirées et orphelines
 *   node dist/admin.js healthcheck       sonde GET /healthz (Docker, Coolify), sans ouvrir la base
 */

export const ADMIN_USAGE = `Usage :
  node dist/admin.js contact <TICKET>
  node dist/admin.js status <TICKET>
  node dist/admin.js pending
  node dist/admin.js retry <TICKET>
  node dist/admin.js retention
  node dist/admin.js attachments [<TICKET>]
  node dist/admin.js attachment-delete <ID>
  node dist/admin.js purge
  node dist/admin.js healthcheck`;

export interface AdminIo {
  out(line: string): void;
  err(line: string): void;
}

export function runAdmin(
  argv: readonly string[],
  deps: {
    db: DatabaseSync;
    prefix: string;
    now?: () => number;
    /** Fichiers des pièces jointes et signataire des URL (absents : commandes de pièces refusées). */
    blobs?: BlobStore;
    signer?: UrlSigner;
  },
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
            failed: row.failedAt
              ? { at: new Date(row.failedAt).toISOString(), httpStatus: row.failedStatus }
              : null,
            createdAt: new Date(row.createdAt).toISOString(),
            closedAt: row.closedAt ? new Date(row.closedAt).toISOString() : null,
            hasContact: row.contact !== null,
            public: row.public,
            attachments: store.attachmentsOf(row.id).length,
          },
          null,
          2,
        ),
      );
      return 0;
    }
    case 'pending': {
      // Première ligne : opérations encore retentées ; puis une ligne par opération abandonnée.
      io.out(String(store.pendingCount()));
      for (const row of store.failed(100)) {
        io.out(
          `ÉCHEC ${row.ticket} ${row.pendingOp ?? '-'} : HTTP ${row.failedStatus ?? '?'}, ` +
            `${row.attempts} tentatives, abandonné le ${new Date(row.failedAt!).toISOString()}`,
        );
      }
      return 0;
    }
    case 'retry': {
      const row = needTicket();
      if (!row) return 1;
      if (!store.retry(row.id, (deps.now ?? Date.now)())) {
        io.err(`${row.ticket} : aucune opération abandonnée.`);
        return 1;
      }
      io.out(`${row.ticket} : remis dans la file (repris au prochain passage).`);
      return 0;
    }
    case 'retention': {
      const now = (deps.now ?? Date.now)();
      const r = runRetention(store, now);
      io.out(`Contacts effacés : ${r.contactsErased}, tickets supprimés : ${r.ticketsDeleted}`);
      if (deps.blobs) {
        const p = purgeAttachments(store, deps.blobs, now);
        io.out(`Pièces supprimées : ${p.rows}, fichiers orphelins : ${p.files}`);
      }
      return 0;
    }
    case 'attachments': {
      if (arg === undefined) {
        const st = store.attachmentStats();
        io.out(
          `Pièces rattachées : ${st.attached}, libres : ${st.unattached}, volume : ${formatBytes(st.bytes)}`,
        );
        return 0;
      }
      const row = needTicket();
      if (!row) return 1;
      const list = store.attachmentsOf(row.id);
      if (!list.length) io.out('(aucune pièce)');
      for (const a of list) {
        const link = deps.signer ? ` ${deps.signer.url(a.id)}` : '';
        io.out(`${a.id} ${a.type} ${a.width}×${a.height} ${formatBytes(a.bytes)}${link}`);
      }
      return 0;
    }
    case 'attachment-delete': {
      if (!arg || !ATTACHMENT_ID.test(arg)) {
        io.err('Identifiant de pièce attendu (22 caractères).');
        return 1;
      }
      const a = store.deleteAttachment(arg);
      if (!a) {
        io.err(`${arg} : pièce inconnue.`);
        return 1;
      }
      deps.blobs?.delete(a.id, a.type);
      io.out(`${arg} : supprimée.`);
      return 0;
    }
    case 'purge': {
      if (!deps.blobs) {
        io.err('Dossier des pièces indisponible.');
        return 1;
      }
      const p = purgeAttachments(store, deps.blobs, (deps.now ?? Date.now)());
      io.out(`Pièces supprimées : ${p.rows}, fichiers orphelins : ${p.files}`);
      return 0;
    }
    default:
      io.err(ADMIN_USAGE);
      return 2;
  }
}
