import { createHash, randomBytes, randomInt } from 'node:crypto';
import { ATTACHMENT_LIMITS, REPORT_LIMITS } from '@arbre/contract';
import type {
  AttachmentReceipt,
  AttachmentType,
  KnownIssue,
  Locale,
  OpenTicket,
  ReportReceipt,
  ReportSubmission,
  TicketView,
} from '@arbre/contract';
import type { BlobStore, UrlSigner } from './attachments';
import type { AttachmentPurge } from './attachments';
import { newAttachmentId, purgeAttachments } from './attachments';
import type { AttachmentRow, TicketRow, TicketStore } from './db';
import type { CleanImage } from './image';
import type { GitHubClient, GitHubComment, GitHubIssue } from './github';
import { GitHubError, isAssigned, labelNames, parseTime } from './github';
import type { IssueDraft } from './render';
import { renderIssue, renderRedacted } from './render';
import type { Marker } from './status';
import {
  STATUS_LABELS,
  hasLabel,
  isClosedStatus,
  mapStatus,
  parseMarker,
  plainText,
  publicReplies,
  titleEn,
  upsertMarker,
} from './status';

/**
 * Logique du service : création des tickets, file `pending` avec réessais, synchronisation
 * (webhook, rapprochement, rafraîchissement paresseux), problèmes connus, suppression.
 */

const MINUTE = 60_000;
export const TIMINGS = {
  /** Rafraîchissement paresseux à la lecture si la donnée a plus de 10 min. */
  staleAfterMs: 10 * MINUTE,
  /** Délai accordé au rafraîchissement paresseux avant de servir la donnée en base. */
  lazyRefreshTimeoutMs: 3000,
  /** Rapprochement toutes les 30 min des tickets non fermés depuis plus de 30 jours. */
  reconcileEveryMs: 30 * MINUTE,
  reconcileClosedWithinMs: 30 * 24 * 60 * MINUTE,
  reconcileBatch: 100,
  /** File `pending` : première attente, plafond, concurrence. */
  retryBaseMs: 30_000,
  retryMaxMs: 6 * 60 * MINUTE,
  pendingBatch: 20,
  concurrency: 2,
  knownIssuesTtlMs: MINUTE,
  knownIssuesMax: 100,
  /** Liste publique des tickets ouverts : même durée de cache, plafond du contrat. */
  openTicketsTtlMs: MINUTE,
  openTicketsMax: REPORT_LIMITS.openTickets,
  /** Tentatives au-delà desquelles une erreur GitHub permanente fait abandonner l'opération. */
  maxPermanentAttempts: 8,
} as const;

/**
 * Erreur GitHub qu'un réessai ne corrigera pas : 4xx, sauf 401/403 (jeton, quota secondaire),
 * 408 et 429 (passagères). Réseau (0), 5xx et réponse illisible (502) restent retentés.
 */
export const isPermanentGitHubError = (e: unknown): e is GitHubError =>
  e instanceof GitHubError &&
  e.status >= 400 &&
  e.status < 500 &&
  ![401, 403, 408, 429].includes(e.status);

/** Faux reçus du pot de miel : tirés parmi les `DECOY_SPREAD` derniers numéros attribués. */
const DECOY_SPREAD = 20;

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** 128 bits aléatoires, 22 caractères base64url (D10). */
export const newToken = (): string => randomBytes(16).toString('base64url');

export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
}

export const silentLogger: Logger = { info: () => undefined, warn: () => undefined };

/** Exécute `fn` sur chaque élément avec au plus `limit` appels simultanés. */
export async function mapLimit<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export interface ServiceDeps {
  store: TicketStore;
  github: GitHubClient;
  now: () => number;
  publicSiteUrl: string;
  logger?: Logger;
  blobs: BlobStore;
  signer: UrlSigner;
  /** Plafond de stockage de toutes les pièces, en octets. */
  attachmentsMaxBytes?: number;
}

/** Stockage plein (plafond `ATTACHMENTS_MAX_MB`) : 503 `unavailable`. */
export class StorageFullError extends Error {}

export class ReportService {
  private readonly store: TicketStore;
  private readonly github: GitHubClient;
  private readonly now: () => number;
  private readonly log: Logger;
  private readonly siteUrl: string;
  private readonly blobs: BlobStore;
  private readonly signer: UrlSigner;
  private readonly attachmentsMaxBytes: number;
  /** Créations GitHub en cours (une suppression pendant ce temps devient un remplacement). */
  private readonly creating = new Set<number>();
  private readonly refreshing = new Map<number, Promise<void>>();
  private draining: Promise<void> | undefined;
  private knownCache = new Map<Locale, { at: number; items: KnownIssue[] }>();
  private openCache = new Map<Locale, { at: number; items: OpenTicket[] }>();
  /** Requêtes GitHub de fond, abandonnées à l'arrêt. */
  private readonly abort = new AbortController();

  constructor(deps: ServiceDeps) {
    this.store = deps.store;
    this.github = deps.github;
    this.now = deps.now;
    this.log = deps.logger ?? silentLogger;
    this.siteUrl = deps.publicSiteUrl.replace(/\/+$/, '');
    this.blobs = deps.blobs;
    this.signer = deps.signer;
    this.attachmentsMaxBytes = deps.attachmentsMaxBytes ?? Number.POSITIVE_INFINITY;
  }

  // ---------------------------------------------------------------------------------- création

  /** Toujours accepté (même GitHub en panne) : le joueur a son numéro, la création suit. */
  submit(s: ReportSubmission): ReportReceipt {
    const token = newToken();
    const now = this.now();
    const contact = s.contact?.trim() ? s.contact.trim() : null;
    const row = this.store.insert({
      tokenHash: hashToken(token),
      createdAt: now,
      source: s.source,
      category: s.category,
      locale: s.locale,
      contact,
      pendingPayload: '{}',
    });
    // Pièces encore libres et non expirées : les autres sont ignorées sans refuser le signalement.
    const attached = s.attachments?.length
      ? this.store.attach(row.id, s.attachments, now, now - ATTACHMENT_LIMITS.unattachedTtlMs)
      : [];
    // Le numéro n'est connu qu'après l'insertion : le corps est rendu ensuite.
    const draft = renderIssue(
      row.ticket,
      s,
      attached.map((a) => ({ ...a, url: this.signer.url(a.id) })),
    );
    this.store.setPayload(row.id, JSON.stringify(draft));
    this.log.info('report.created', {
      ticket: row.ticket,
      category: s.category,
      source: s.source,
      attachments: attached.length,
    });
    // Le nouveau ticket apparaît aussitôt dans la liste publique des tickets ouverts.
    this.invalidateKnown();
    this.kick();
    return {
      ticket: row.ticket,
      token,
      followUrl: this.followUrl(token, s.locale),
      ...(s.attachments !== undefined ? { attachments: attached.length } : {}),
    };
  }

  // ---------------------------------------------------------------------------- pièces jointes

  /** Enregistre une image déjà vérifiée et nettoyée (`cleanImage`). */
  storeAttachment(img: CleanImage): AttachmentReceipt {
    if (this.store.attachmentStats().bytes + img.data.length > this.attachmentsMaxBytes) {
      this.log.warn('attachment.full', { bytes: img.data.length });
      throw new StorageFullError('stockage des pièces plein');
    }
    const id = newAttachmentId();
    const now = this.now();
    // Fichier d'abord, ligne ensuite (synchrone) ; si l'insertion échoue, le fichier est retiré.
    this.blobs.put(id, img.type, img.data);
    try {
      this.store.insertAttachment({
        id,
        createdAt: now,
        type: img.type,
        bytes: img.data.length,
        width: img.width,
        height: img.height,
      });
    } catch (e) {
      this.blobs.delete(id, img.type);
      throw e;
    }
    this.log.info('attachment.stored', { type: img.type, bytes: img.data.length });
    return {
      id,
      type: img.type,
      width: img.width,
      height: img.height,
      bytes: img.data.length,
      expiresAt: now + ATTACHMENT_LIMITS.unattachedTtlMs,
    };
  }

  /** Faux reçu du pot de miel : rien n'est stocké, l'identifiant ne mène à rien. */
  decoyAttachment(type: AttachmentType, width: number, height: number, bytes: number) {
    return {
      id: newAttachmentId(),
      type,
      width,
      height,
      bytes,
      expiresAt: this.now() + ATTACHMENT_LIMITS.unattachedTtlMs,
    } satisfies AttachmentReceipt;
  }

  /** Lecture par URL signée : la signature est vérifiée par l'appelant. */
  readAttachment(id: string): { row: AttachmentRow; data: Buffer } | undefined {
    const row = this.store.attachment(id);
    if (!row) return undefined;
    // Une pièce libre expirée n'est plus servie, même avant la purge.
    if (row.ticketId === null && this.now() - row.createdAt >= ATTACHMENT_LIMITS.unattachedTtlMs) {
      return undefined;
    }
    const data = this.blobs.get(id, row.type);
    return data ? { row, data } : undefined;
  }

  /** `DELETE /v1/attachments/<id>` : seulement une pièce encore libre. */
  deleteUnattached(id: string): boolean {
    const row = this.store.deleteUnattached(id);
    if (!row) return false;
    this.blobs.delete(row.id, row.type);
    return true;
  }

  /** Purge : pièces libres de plus d'une heure, pièces de tickets supprimés, fichiers orphelins. */
  purgeAttachments(): AttachmentPurge {
    return purgeAttachments(this.store, this.blobs, this.now());
  }

  private viewAttachments(row: TicketRow) {
    return this.store.attachmentsOf(row.id).map((a) => ({
      id: a.id,
      url: this.signer.url(a.id),
      type: a.type,
      width: a.width,
      height: a.height,
    }));
  }

  /**
   * Reçu neutre du pot de miel : plausible (un numéro parmi les 20 derniers attribués, jamais
   * `-0000` qui trahirait le leurre), mais rien n'est créé ni réservé ; le jeton ne mène à rien.
   */
  decoyReceipt(locale: Locale): ReportReceipt {
    const token = newToken();
    const last = this.store.lastNumber();
    const n = Math.max(1, last - randomInt(0, DECOY_SPREAD));
    return {
      ticket: this.store.formatTicket(n),
      token,
      followUrl: this.followUrl(token, locale),
    };
  }

  /**
   * Lien de suivi dans la langue du signalement (D8, mêmes slugs sous `/en/`) :
   * `…/suivi/#<jeton>` ou `…/en/suivi/#<jeton>`. Jeton dans le fragment (D10).
   */
  followUrl(token: string, locale: Locale): string {
    return `${this.siteUrl}${locale === 'en' ? '/en' : ''}/suivi/#${token}`;
  }

  /** Lance le traitement de la file sans attendre (un seul passage à la fois). */
  kick(): void {
    void this.drain();
  }

  /** Traite les opérations échues de la file ; renvoie la promesse du passage en cours. */
  drain(): Promise<void> {
    this.draining ??= this.processPending().finally(() => {
      this.draining = undefined;
    });
    return this.draining;
  }

  private backoff(attempts: number): number {
    return Math.min(TIMINGS.retryBaseMs * 2 ** Math.max(0, attempts - 1), TIMINGS.retryMaxMs);
  }

  private async processPending(): Promise<void> {
    if (!this.github.enabled) return;
    const due = this.store.duePending(this.now(), TIMINGS.pendingBatch);
    await mapLimit(due, TIMINGS.concurrency, async (selected) => {
      if (this.abort.signal.aborted) return;
      // Relu au moment de le traiter : un DELETE arrivé pendant ce passage a pu supprimer la
      // ligne (création jamais faite) ou la changer en `redact` (charge utile effacée).
      const row = this.store.byId(selected.id);
      if (!row || row.pendingOp !== selected.pendingOp) return;
      try {
        if (row.pendingOp === 'create') await this.createRemote(row);
        else if (row.pendingOp === 'redact' && row.issueNumber !== null) {
          await this.github.updateIssueBody(
            row.issueNumber,
            renderRedacted(row.ticket),
            this.abort.signal,
          );
          this.store.markRedacted(row.id);
          this.log.info('report.redacted', { ticket: row.ticket });
        }
      } catch (e) {
        const attempts = row.attempts + 1;
        if (row.pendingOp === 'create' && this.store.deleteIfForgotten(row.id)) return;
        if (isPermanentGitHubError(e) && attempts >= TIMINGS.maxPermanentAttempts) {
          // Abandon visible (`admin.js pending`, `/healthz`) ; le ticket du joueur reste lisible
          // (« reçu ») et la ligne garde son opération pour une reprise (`admin.js retry`).
          this.store.markFailed(row.id, attempts, e.status, this.now());
          this.log.warn('github.failed', {
            ticket: row.ticket,
            op: row.pendingOp,
            attempts,
            status: e.status,
          });
          return;
        }
        this.store.markAttemptFailed(row.id, attempts, this.now() + this.backoff(attempts));
        this.log.warn('github.retry', {
          ticket: row.ticket,
          op: row.pendingOp,
          attempts,
          status: e instanceof GitHubError ? e.status : undefined,
        });
      }
    });
  }

  private async createRemote(row: TicketRow): Promise<void> {
    if (!row.pendingPayload) return;
    const draft = JSON.parse(row.pendingPayload) as IssueDraft;
    this.creating.add(row.id);
    try {
      const issue = await this.github.createIssue(draft, this.abort.signal);
      this.store.markCreated(row.id, issue, this.now());
      this.log.info('github.issue', { ticket: row.ticket });
    } finally {
      this.creating.delete(row.id);
    }
    // Suppression demandée pendant la création : le corps est remplacé aussitôt.
    const after = this.store.byId(row.id);
    if (after?.pendingOp === 'redact') await this.processRedact(after);
  }

  private async processRedact(row: TicketRow): Promise<void> {
    if (row.issueNumber === null) return;
    try {
      await this.github.updateIssueBody(
        row.issueNumber,
        renderRedacted(row.ticket),
        this.abort.signal,
      );
      this.store.markRedacted(row.id);
    } catch {
      this.store.markAttemptFailed(row.id, 1, this.now() + this.backoff(1));
    }
  }

  // ------------------------------------------------------------------------------------ lecture

  findByToken(token: string): TicketRow | undefined {
    return this.store.byTokenHash(hashToken(token));
  }

  async view(token: string): Promise<TicketView | undefined> {
    let row = this.findByToken(token);
    if (!row) return undefined;
    if (row.issueNumber !== null && this.now() - (row.syncedAt ?? 0) > TIMINGS.staleAfterMs) {
      await this.refreshWithin(row, TIMINGS.lazyRefreshTimeoutMs);
      row = this.store.byId(row.id) ?? row;
    }
    const view = toView(row);
    const attachments = this.viewAttachments(row);
    return attachments.length ? { ...view, attachments } : view;
  }

  /** Rafraîchit sans faire attendre le lecteur plus de `ms` (sinon la donnée en base est servie). */
  private async refreshWithin(row: TicketRow, ms: number): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms);
      timer.unref?.();
    });
    await Promise.race([this.refresh(row).catch(() => undefined), timeout]);
    clearTimeout(timer);
  }

  /** Synchronise un ticket depuis l'API (conditionnelle) ; dédoublonné par ticket. */
  refresh(row: TicketRow): Promise<void> {
    const running = this.refreshing.get(row.id);
    if (running) return running;
    const p = this.doRefresh(row).finally(() => this.refreshing.delete(row.id));
    this.refreshing.set(row.id, p);
    return p;
  }

  private async doRefresh(row: TicketRow): Promise<void> {
    if (row.issueNumber === null || !this.github.enabled) return;
    const now = this.now();
    let res;
    try {
      res = await this.github.getIssue(row.issueNumber, row.etag, this.abort.signal);
    } catch (e) {
      if (e instanceof GitHubError && (e.status === 404 || e.status === 410)) {
        // Ticket supprimé ou transféré côté GitHub : classé.
        this.store.applyIssue(row.id, {
          status: 'closed',
          fixedIn: null,
          closedReason: 'resolved',
          closedAt: row.closedAt ?? now,
          public: false,
          title: row.title,
          etag: null,
          syncedAt: now,
          updatedAt: now,
        });
        this.invalidateKnown();
        return;
      }
      throw e;
    }
    if (res.notModified) {
      this.store.touchSynced(row.id, now);
      return;
    }
    const comments = await this.github.listComments(row.issueNumber, this.abort.signal);
    this.applyIssue(row, res.issue, { comments, etag: res.etag });
  }

  /** Applique l'état d'un ticket GitHub (webhook `issues` ou API). */
  applyIssue(
    row: TicketRow,
    issue: GitHubIssue,
    extra: { comments?: GitHubComment[]; etag?: string | null } = {},
  ): void {
    const now = this.now();
    const labels = labelNames(issue);
    const mapped = mapStatus({
      state: issue.state,
      stateReason: issue.state_reason,
      labels,
      assigned: isAssigned(issue),
      milestone: issue.milestone?.title,
    });
    const closed = isClosedStatus(mapped.status);
    const closedAt = closed ? (row.closedAt ?? parseTime(issue.closed_at, now)) : null;
    const markers = extra.comments
      ? extra.comments
          .map((c) =>
            parseMarker({
              id: c.id,
              body: c.body,
              authorAssociation: c.author_association,
              createdAt: parseTime(c.created_at, now),
            }),
          )
          .filter((m): m is Marker => m !== undefined)
          .sort((a, b) => a.at - b.at || a.id - b.id)
      : undefined;
    const isPublic = hasLabel(labels, STATUS_LABELS.public);
    const title = plainText(issue.title, 200) || null;
    const visibleChanged =
      mapped.status !== row.status ||
      (mapped.fixedIn ?? null) !== row.fixedIn ||
      (mapped.closedReason ?? null) !== row.closedReason ||
      (markers !== undefined && JSON.stringify(markers) !== JSON.stringify(row.markers)) ||
      isPublic !== row.public ||
      title !== row.title;
    this.store.applyIssue(row.id, {
      status: mapped.status,
      fixedIn: mapped.fixedIn ?? null,
      closedReason: mapped.closedReason ?? null,
      closedAt,
      public: isPublic,
      title,
      markers,
      etag: extra.etag,
      syncedAt: now,
      updatedAt: visibleChanged ? now : row.updatedAt,
    });
    if (visibleChanged) this.invalidateKnown();
  }

  /** Webhook `issue_comment` : ajout, modification ou suppression d'un marqueur. */
  applyComment(row: TicketRow, comment: GitHubComment, deleted: boolean): void {
    const now = this.now();
    const marker = deleted
      ? undefined
      : parseMarker({
          id: comment.id,
          body: comment.body,
          authorAssociation: comment.author_association,
          createdAt: parseTime(comment.created_at, now),
        });
    const had = row.markers.some((m) => m.id === comment.id);
    if (!marker && !had) return;
    this.store.setMarkers(row.id, upsertMarker(row.markers, comment.id, marker), now);
    this.invalidateKnown();
  }

  /** Rapprochement périodique (requêtes conditionnelles, concurrence bornée). */
  async reconcile(): Promise<void> {
    if (!this.github.enabled) return;
    const rows = this.store.toReconcile(
      this.now(),
      TIMINGS.reconcileClosedWithinMs,
      TIMINGS.reconcileBatch,
    );
    await mapLimit(rows, TIMINGS.concurrency, async (row) => {
      if (this.abort.signal.aborted) return;
      await this.refresh(row).catch((e: unknown) =>
        this.log.warn('github.reconcile', {
          ticket: row.ticket,
          status: e instanceof GitHubError ? e.status : undefined,
        }),
      );
    });
  }

  // ------------------------------------------------------------------------- problèmes connus

  /** Vide les caches des listes publiques (problèmes connus, tickets ouverts). */
  invalidateKnown(): void {
    this.knownCache.clear();
    this.openCache.clear();
  }

  /** Titre public relu par l'équipe (étiquette `public`), anglais si un mainteneur l'a donné. */
  private publicTitle(
    row: Pick<TicketRow, 'public' | 'title' | 'markers'>,
    locale: Locale,
  ): string | undefined {
    if (!row.public) return undefined;
    const title = (locale === 'en' ? titleEn(row.markers) : undefined) ?? row.title;
    return title ? title.slice(0, 200) : undefined;
  }

  knownIssues(locale: Locale): KnownIssue[] {
    const now = this.now();
    const cached = this.knownCache.get(locale);
    if (cached && now - cached.at < TIMINGS.knownIssuesTtlMs) return cached.items;
    const items = this.store
      .publicTickets(TIMINGS.knownIssuesMax)
      .map((row): KnownIssue | undefined => {
        const title = this.publicTitle(row, locale);
        if (!title) return undefined;
        return {
          ticket: row.ticket,
          title,
          status: row.status,
          ...(row.fixedIn ? { fixedIn: row.fixedIn } : {}),
          updatedAt: row.updatedAt,
        };
      })
      .filter((k): k is KnownIssue => k !== undefined);
    this.knownCache.set(locale, { at: now, items });
    return items;
  }

  /**
   * Liste publique des tickets ouverts (`GET /v1/tickets`) : numéro, catégorie, statut, source,
   * dates, et titre relu seulement s'il est public. Jamais le texte du joueur ni le titre brut.
   */
  openTickets(locale: Locale): OpenTicket[] {
    const now = this.now();
    const cached = this.openCache.get(locale);
    if (cached && now - cached.at < TIMINGS.openTicketsTtlMs) return cached.items;
    const items = this.store.openTickets(TIMINGS.openTicketsMax).map((row): OpenTicket => {
      const title = this.publicTitle(row, locale);
      return {
        ticket: row.ticket,
        category: row.category,
        status: row.status,
        source: row.source,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ...(title ? { title } : {}),
      };
    });
    this.openCache.set(locale, { at: now, items });
    return items;
  }

  // -------------------------------------------------------------------------------- suppression

  /** `DELETE` : contact effacé, jeton invalidé, corps GitHub remplacé (file `redact`). */
  forget(row: TicketRow): void {
    // Pièces jointes supprimées tout de suite (fichiers compris) : leurs URL signées répondent 404.
    for (const a of this.store.deleteAttachmentsOf(row.id)) this.blobs.delete(a.id, a.type);
    this.store.forget(row.id, this.creating.has(row.id), this.now());
    this.invalidateKnown();
    this.log.info('report.deleted', { ticket: row.ticket });
    this.kick();
  }

  pendingCount(): number {
    return this.store.pendingCount();
  }

  failedCount(): number {
    return this.store.failedCount();
  }

  get health(): 'ok' | 'degraded' {
    return this.github.health;
  }

  /** Arrêt : abandonne les requêtes GitHub en cours et attend la fin du passage de la file. */
  async close(): Promise<void> {
    this.abort.abort();
    await this.draining?.catch(() => undefined);
    await Promise.allSettled([...this.refreshing.values()]);
  }
}

export function toView(row: TicketRow): TicketView {
  return {
    ticket: row.ticket,
    status: row.status,
    ...(row.fixedIn ? { fixedIn: row.fixedIn } : {}),
    ...(row.closedReason ? { closedReason: row.closedReason } : {}),
    category: row.category,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    replies: publicReplies(row.markers),
  };
}
