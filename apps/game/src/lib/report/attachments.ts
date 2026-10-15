/**
 * Captures jointes au signalement du jeu (ARCHITECTURE §8, DESIGN §9.38) : la file d'envoi de
 * `@arbre/ui` branchée sur le client du service (`POST`/`DELETE /v1/attachments`), aux limites du
 * contrat. Chargé avec l'écran de signalement.
 */
import { ATTACHMENT_LIMITS, ATTACHMENT_TYPES } from '@arbre/contract';
import {
  AttachmentQueue,
  type AttachmentError,
  type AttachmentItem,
  type AttachmentLimits,
  type QueueOptions,
  type UploadResult,
} from '@arbre/ui/attachments';
import { deleteAttachment, uploadAttachment, type ApiFailure, type ClientOptions } from './client';

export const LIMITS: AttachmentLimits = {
  max: ATTACHMENT_LIMITS.perReport,
  bytes: ATTACHMENT_LIMITS.bytes,
  side: ATTACHMENT_LIMITS.side,
  pixels: ATTACHMENT_LIMITS.pixels,
  types: ATTACHMENT_TYPES,
};

/** Raison d'un envoi refusé, dans les termes du plateau de captures. */
export function attachmentError(f: ApiFailure): AttachmentError {
  switch (f.kind) {
    case 'unsupported':
      return 'type';
    case 'tooLarge':
      return 'tooLarge';
    case 'rateLimited':
      return 'rateLimited';
    case 'disabled':
      return 'disabled';
    case 'offline':
      return 'offline';
    case 'timeout':
      return 'timeout';
    case 'invalid':
    case 'notFound':
      return 'invalid';
    default:
      return 'unavailable';
  }
}

export interface GameQueueOptions {
  /** Valeur du pot de miel au moment de l'envoi. */
  website: () => string;
  onchange: (items: AttachmentItem[]) => void;
  client?: ClientOptions;
  prepare?: QueueOptions['prepare'];
  now?: () => number;
  createUrl?: (blob: Blob) => string;
  revokeUrl?: (url: string) => void;
}

/** File d'envoi des captures du formulaire de signalement. */
export function createAttachmentQueue(opts: GameQueueOptions): AttachmentQueue {
  return new AttachmentQueue({
    limits: LIMITS,
    onchange: opts.onchange,
    prepare: opts.prepare,
    now: opts.now,
    createUrl: opts.createUrl,
    revokeUrl: opts.revokeUrl,
    async upload(blob): Promise<UploadResult> {
      const res = await uploadAttachment(blob, opts.website(), opts.client);
      if (res.ok) return { ok: true, receipt: res.value };
      return { ok: false, error: attachmentError(res.failure) };
    },
    remove: (id) => deleteAttachment(id, opts.client),
  });
}

/** Captures envoyées mais absentes du reçu (expirées ou refusées entre-temps). */
export function missingAttachments(sent: number, receiptCount: number | undefined): number {
  return receiptCount === undefined ? 0 : Math.max(0, sent - receiptCount);
}
