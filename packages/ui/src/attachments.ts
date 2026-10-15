/**
 * Captures d'écran jointes à un formulaire (DESIGN.md §9.38, ARCHITECTURE §8) : file d'envoi
 * (une requête par image, avant le formulaire), réduction des images trop grandes dans le
 * navigateur, retrait et renvoi des pièces expirées. Indépendant du service : l'application
 * injecte `upload` et `remove` (son client HTTP). Aucune exception ne sort de la file.
 */

/** Raison d'un échec, traduite par `AttachmentTray` (`UiStrings.attachments.errors`). */
export type AttachmentError =
  | 'type'
  | 'decode'
  | 'tooLarge'
  | 'rateLimited'
  | 'disabled'
  | 'offline'
  | 'timeout'
  | 'unavailable'
  | 'invalid';

export interface UploadReceipt {
  id: string;
  /** Au-delà (ms epoch), la pièce non rattachée est supprimée par le service : la renvoyer. */
  expiresAt: number;
  width: number;
  height: number;
  bytes: number;
}

export type UploadResult =
  { ok: true; receipt: UploadReceipt } | { ok: false; error: AttachmentError };

export type PrepareResult = { ok: true; blob: Blob } | { ok: false; error: AttachmentError };

export type AttachmentStatus = 'preparing' | 'uploading' | 'ready' | 'error';

export interface AttachmentItem {
  /** Clé locale stable (liste, retrait). */
  key: string;
  name: string;
  /** URL locale (`blob:`) de la vignette ; vide tant que l'image n'est pas prête. */
  src: string;
  status: AttachmentStatus;
  error?: AttachmentError;
  /** Reçu du service une fois l'image envoyée. */
  receipt?: UploadReceipt;
}

export interface AttachmentLimits {
  /** Pièces au plus. */
  max: number;
  /** Octets au plus par image. */
  bytes: number;
  /** Côté maximal en pixels. */
  side: number;
  /** Surface maximale en pixels. */
  pixels: number;
  /** Types acceptés tels quels. */
  types: readonly string[];
}

export interface QueueOptions {
  limits: AttachmentLimits;
  upload: (blob: Blob) => Promise<UploadResult>;
  remove: (id: string) => Promise<unknown>;
  /** Réduit ou convertit l'image (déf. `prepareImage`, navigateur). */
  prepare?: (file: Blob, limits: AttachmentLimits) => Promise<PrepareResult>;
  onchange: (items: AttachmentItem[]) => void;
  now?: () => number;
  createUrl?: (blob: Blob) => string;
  revokeUrl?: (url: string) => void;
}

interface Entry extends AttachmentItem {
  blob?: Blob;
}

/** Capture affichée en lecture (`AttachmentGallery`) : URL signée du service et dimensions. */
export interface GalleryImage {
  url: string;
  width: number;
  height: number;
}

/** Marge avant `expiresAt` en deçà de laquelle une pièce est renvoyée avant le signalement. */
export const EXPIRY_MARGIN_MS = 120_000;

let seq = 0;

export class AttachmentQueue {
  #entries: Entry[] = [];
  #opts: QueueOptions;
  #disposed = false;

  constructor(opts: QueueOptions) {
    this.#opts = opts;
  }

  get items(): AttachmentItem[] {
    return this.#entries.map(({ blob: _blob, ...item }) => ({ ...item }));
  }

  /** Places restantes. */
  get free(): number {
    return Math.max(0, this.#opts.limits.max - this.#entries.length);
  }

  /** Une image est en cours de préparation ou d'envoi. */
  get busy(): boolean {
    return this.#entries.some((e) => e.status === 'preparing' || e.status === 'uploading');
  }

  /** Identifiants à joindre, dans l'ordre d'affichage (pièces envoyées seulement). */
  get ids(): string[] {
    return this.#entries.flatMap((e) => (e.status === 'ready' && e.receipt ? [e.receipt.id] : []));
  }

  #emit() {
    if (!this.#disposed) this.#opts.onchange(this.items);
  }

  #find(key: string) {
    return this.#entries.find((e) => e.key === key);
  }

  /**
   * Ajoute des fichiers (sélection, collage, dépôt) dans la limite des places ; rend le nombre
   * d'images retenues (les autres sont ignorées : l'appelant peut le dire).
   */
  add(files: readonly (File | Blob)[]): number {
    const taken = files.slice(0, this.free);
    for (const file of taken) {
      const entry: Entry = {
        key: `att-${++seq}`,
        name: (file as File).name || `capture-${seq}`,
        src: '',
        status: 'preparing',
      };
      this.#entries.push(entry);
      void this.#process(entry, file);
    }
    if (taken.length) this.#emit();
    return taken.length;
  }

  async #process(entry: Entry, file: Blob) {
    const prepare = this.#opts.prepare ?? prepareImage;
    let prepared: PrepareResult;
    try {
      prepared = await prepare(file, this.#opts.limits);
    } catch {
      prepared = { ok: false, error: 'decode' };
    }
    if (!this.#find(entry.key)) return;
    if (!prepared.ok) {
      entry.status = 'error';
      entry.error = prepared.error;
      this.#emit();
      return;
    }
    entry.blob = prepared.blob;
    entry.src = (this.#opts.createUrl ?? URL.createObjectURL)(prepared.blob);
    await this.#upload(entry);
  }

  async #upload(entry: Entry) {
    if (!entry.blob) return;
    entry.status = 'uploading';
    delete entry.error;
    delete entry.receipt;
    this.#emit();
    let result: UploadResult;
    try {
      result = await this.#opts.upload(entry.blob);
    } catch {
      result = { ok: false, error: 'unavailable' };
    }
    // Retirée pendant l'envoi : la pièce reçue est aussitôt supprimée.
    if (!this.#find(entry.key)) {
      if (result.ok) void this.#safeRemove(result.receipt.id);
      return;
    }
    if (result.ok) {
      entry.status = 'ready';
      entry.receipt = result.receipt;
    } else {
      entry.status = 'error';
      entry.error = result.error;
    }
    this.#emit();
  }

  async #safeRemove(id: string) {
    try {
      await this.#opts.remove(id);
    } catch {
      // Une pièce libre est de toute façon purgée par le service au bout d'une heure.
    }
  }

  /** Retire une image (et la supprime du service si elle y était). */
  remove(key: string): void {
    const entry = this.#find(key);
    if (!entry) return;
    this.#entries = this.#entries.filter((e) => e !== entry);
    if (entry.src) (this.#opts.revokeUrl ?? URL.revokeObjectURL)(entry.src);
    if (entry.receipt) void this.#safeRemove(entry.receipt.id);
    this.#emit();
  }

  /** Renvoie une image en échec (si elle a pu être préparée). */
  retry(key: string): void {
    const entry = this.#find(key);
    if (entry?.status === 'error' && entry.blob) void this.#upload(entry);
  }

  /**
   * Avant le signalement : renvoie les pièces expirées ou sur le point de l'être (`expiresAt`),
   * puis rend les identifiants à joindre.
   */
  async fresh(margin = EXPIRY_MARGIN_MS): Promise<string[]> {
    const now = (this.#opts.now ?? Date.now)();
    const stale = this.#entries.filter(
      (e) => e.status === 'ready' && e.receipt && e.receipt.expiresAt - margin <= now,
    );
    await Promise.all(stale.map((e) => this.#upload(e)));
    return this.ids;
  }

  /**
   * Fin du formulaire : libère les vignettes ; `deleteRemote` supprime aussi les pièces envoyées
   * (formulaire abandonné). Après un signalement, elles sont rattachées : ne pas les supprimer.
   */
  dispose(deleteRemote: boolean): void {
    for (const e of this.#entries) {
      if (e.src) (this.#opts.revokeUrl ?? URL.revokeObjectURL)(e.src);
      if (deleteRemote && e.receipt) void this.#safeRemove(e.receipt.id);
    }
    this.#entries = [];
    this.#disposed = true;
  }

  /** Après un signalement réussi : vide la liste sans supprimer les pièces (rattachées). */
  clear(): void {
    for (const e of this.#entries) if (e.src) (this.#opts.revokeUrl ?? URL.revokeObjectURL)(e.src);
    this.#entries = [];
    this.#emit();
  }
}

/** Images d'un presse-papiers ou d'un dépôt (`DataTransfer`), fichiers seulement. */
export function imageFiles(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];
  const files: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
    const f = item.getAsFile();
    if (f) files.push(f);
  }
  if (files.length === 0) {
    for (const f of Array.from(data.files ?? [])) if (f.type.startsWith('image/')) files.push(f);
  }
  return files;
}

/** Le glisser transporte des fichiers (pas un texte ni un lien). */
export function hasFiles(data: DataTransfer | null | undefined): boolean {
  return Boolean(data && Array.from(data.types ?? []).includes('Files'));
}

/**
 * Échelle à appliquer (≤ 1) pour qu'une image `w` × `h` tienne dans le côté et la surface
 * maximaux ; `shrink` < 1 réduit davantage (poids encore trop lourd).
 */
export function fitScale(
  w: number,
  h: number,
  limits: Pick<AttachmentLimits, 'side' | 'pixels'>,
  shrink = 1,
): number {
  if (w <= 0 || h <= 0) return 1;
  const bySide = limits.side / Math.max(w, h);
  const byArea = Math.sqrt(limits.pixels / (w * h));
  return Math.min(1, bySide, byArea) * shrink;
}

/** Une image envoyée telle quelle : type accepté, poids et dimensions dans les limites. */
export function fitsAsIs(
  type: string,
  bytes: number,
  w: number,
  h: number,
  limits: AttachmentLimits,
): boolean {
  return (
    limits.types.includes(type) &&
    bytes <= limits.bytes &&
    Math.max(w, h) <= limits.side &&
    w * h <= limits.pixels
  );
}

/** Essais successifs de réduction : facteur d'échelle supplémentaire et qualité. */
const ATTEMPTS: readonly { shrink: number; quality: number }[] = [
  { shrink: 1, quality: 0.92 },
  { shrink: 1, quality: 0.8 },
  { shrink: 0.8, quality: 0.8 },
  { shrink: 0.6, quality: 0.75 },
  { shrink: 0.45, quality: 0.7 },
  { shrink: 0.3, quality: 0.7 },
];

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Prépare une image dans le navigateur : envoyée telle quelle si elle tient dans les limites,
 * sinon redessinée plus petite en WebP (JPEG si le navigateur ne sait pas l'écrire) jusqu'à
 * passer sous le poids maximal. Un format décodable mais refusé (GIF, BMP, AVIF…) est converti.
 */
export async function prepareImage(file: Blob, limits: AttachmentLimits): Promise<PrepareResult> {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'type' };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Illisible ici mais d'un type accepté et assez léger : le service tranchera (400 au pire).
    if (limits.types.includes(file.type) && file.size <= limits.bytes) {
      return { ok: true, blob: file };
    }
    return { ok: false, error: limits.types.includes(file.type) ? 'decode' : 'type' };
  }
  try {
    const { width: w, height: h } = bitmap;
    if (fitsAsIs(file.type, file.size, w, h, limits)) return { ok: true, blob: file };
    const canvas = document.createElement('canvas');
    for (const attempt of ATTEMPTS) {
      const scale = fitScale(w, h, limits, attempt.shrink);
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return { ok: false, error: 'decode' };
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await toBlob(canvas, 'image/webp', attempt.quality);
      if (!blob || blob.type !== 'image/webp') {
        blob = await toBlob(canvas, 'image/jpeg', attempt.quality);
      }
      if (blob && limits.types.includes(blob.type) && blob.size <= limits.bytes) {
        return { ok: true, blob };
      }
    }
    return { ok: false, error: 'tooLarge' };
  } finally {
    bitmap.close();
  }
}
