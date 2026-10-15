import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { ATTACHMENT_ID, ATTACHMENT_LIMITS } from '@arbre/contract';
import type { AttachmentType } from '@arbre/contract';
import type { TicketStore } from './db';
import { EXTENSIONS } from './image';

/**
 * Pièces jointes (ARCHITECTURE §8) : fichiers sur le volume (`/data/attachments/<id>.<ext>`),
 * métadonnées dans SQLite (table `attachments`), URL signées HMAC pour les lire.
 */

/** 128 bits aléatoires, 22 caractères base64url. */
export const newAttachmentId = (): string => randomBytes(16).toString('base64url');

/** Fichiers des pièces : disque en production, mémoire en test (`DATA_DIR=:memory:`). */
export interface BlobStore {
  put(id: string, type: AttachmentType, data: Buffer): void;
  get(id: string, type: AttachmentType): Buffer | undefined;
  delete(id: string, type: AttachmentType): void;
  /** Supprime les fichiers sans métadonnées (`known(id)` faux) plus vieux que `olderThan` (ms epoch). */
  sweep(known: (id: string) => boolean, olderThan: number): number;
}

export class MemoryBlobStore implements BlobStore {
  readonly files = new Map<string, { data: Buffer; at: number }>();
  constructor(private readonly now: () => number = Date.now) {}
  put(id: string, _type: AttachmentType, data: Buffer): void {
    this.files.set(id, { data, at: this.now() });
  }
  get(id: string): Buffer | undefined {
    return this.files.get(id)?.data;
  }
  delete(id: string): void {
    this.files.delete(id);
  }
  sweep(known: (id: string) => boolean, olderThan: number): number {
    let n = 0;
    for (const [id, f] of this.files) {
      if (!known(id) && f.at <= olderThan) {
        this.files.delete(id);
        n++;
      }
    }
    return n;
  }
}

const FILE = /^([A-Za-z0-9_-]{22})\.(png|jpg|webp)$/;
const TEMP = /^\.tmp-[A-Za-z0-9_-]{22}$/;

/**
 * Fichiers sur disque. Écriture atomique (fichier temporaire puis renommage), droits 0600.
 * Opérations synchrones : petits fichiers, et la purge ne peut pas s'intercaler entre l'écriture
 * d'un fichier et l'insertion de sa ligne en base.
 */
export class FsBlobStore implements BlobStore {
  constructor(readonly dir: string) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  private path(id: string, type: AttachmentType): string {
    if (!ATTACHMENT_ID.test(id)) throw new Error('identifiant invalide');
    return join(this.dir, `${id}.${EXTENSIONS[type]}`);
  }

  put(id: string, type: AttachmentType, data: Buffer): void {
    const final = this.path(id, type);
    const tmp = join(this.dir, `.tmp-${id}`);
    writeFileSync(tmp, data, { mode: 0o600, flag: 'wx' });
    renameSync(tmp, final);
  }

  get(id: string, type: AttachmentType): Buffer | undefined {
    try {
      return readFileSync(this.path(id, type));
    } catch {
      return undefined;
    }
  }

  delete(id: string, type: AttachmentType): void {
    try {
      unlinkSync(this.path(id, type));
    } catch {
      // Déjà absent.
    }
  }

  sweep(known: (id: string) => boolean, olderThan: number): number {
    let n = 0;
    let names: string[];
    try {
      names = readdirSync(this.dir);
    } catch {
      return 0;
    }
    for (const name of names) {
      const m = FILE.exec(name);
      const orphan = m ? !known(m[1]!) : TEMP.test(name);
      if (!orphan) continue;
      const p = join(this.dir, name);
      try {
        if (statSync(p).mtimeMs > olderThan) continue;
        unlinkSync(p);
        n++;
      } catch {
        // Supprimé entre-temps.
      }
    }
    return n;
  }
}

/** Contexte du HMAC des URL signées (séparation des usages de la clé). */
const SIGN_CONTEXT = 'arbre-report/attachment-url/v1';

export type SecretSource = 'attachment-secret' | 'derived-webhook' | 'ephemeral';

/**
 * Clé des URL signées : `ATTACHMENT_SECRET` si posé ; sinon dérivée de `GITHUB_WEBHOOK_SECRET`
 * par HMAC avec un contexte propre (la clé du webhook n'est jamais utilisée telle quelle et ne
 * peut pas en être déduite) ; sinon aléatoire en mémoire (dev : les URL ne survivent pas à un
 * redémarrage).
 */
export function signingKey(
  attachmentSecret: string | undefined,
  webhookSecret: string | undefined,
): { key: Buffer; source: SecretSource } {
  if (attachmentSecret) {
    return {
      key: createHmac('sha256', attachmentSecret).update(SIGN_CONTEXT).digest(),
      source: 'attachment-secret',
    };
  }
  if (webhookSecret) {
    return {
      key: createHmac('sha256', webhookSecret).update(`${SIGN_CONTEXT}/derived`).digest(),
      source: 'derived-webhook',
    };
  }
  return { key: randomBytes(32), source: 'ephemeral' };
}

/** Signature d'une pièce : HMAC-SHA256 de l'identifiant, base64url (43 caractères). */
export class UrlSigner {
  constructor(
    private readonly key: Buffer,
    private readonly apiUrl: string,
  ) {}

  sign(id: string): string {
    return createHmac('sha256', this.key).update(`attachment:${id}`).digest('base64url');
  }

  verify(id: string, sig: string | null): boolean {
    if (!sig || !/^[A-Za-z0-9_-]{43}$/.test(sig)) return false;
    const expected = Buffer.from(this.sign(id));
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  url(id: string): string {
    return `${this.apiUrl}/v1/attachments/${id}?sig=${this.sign(id)}`;
  }
}

export interface AttachmentPurge {
  /** Lignes supprimées : pièces libres expirées, pièces de tickets supprimés. */
  rows: number;
  /** Fichiers orphelins supprimés (sans ligne, ou temporaires abandonnés). */
  files: number;
}

/**
 * Purge des pièces (toutes les 10 min, et avec la conservation quotidienne) : pièces jamais
 * rattachées après 1 h, pièces des tickets supprimés (conservation 12 mois après la clôture :
 * cascade SQLite), puis fichiers sans ligne de plus d'une heure.
 */
export function purgeAttachments(
  store: TicketStore,
  blobs: BlobStore,
  now: number,
): AttachmentPurge {
  const before = now - ATTACHMENT_LIMITS.unattachedTtlMs;
  const rows = store.purgeAttachments(before);
  for (const r of rows) blobs.delete(r.id, r.type);
  const files = blobs.sweep((id) => store.hasAttachment(id), before);
  return { rows: rows.length, files };
}
