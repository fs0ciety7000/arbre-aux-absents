import { ATTACHMENT_LIMITS } from '@arbre/contract';
import type { AttachmentType } from '@arbre/contract';

/**
 * Images jointes aux signalements (ARCHITECTURE §8) : type reconnu par les octets magiques,
 * dimensions lues dans l'en-tête, métadonnées retirées, sans dépendance (le service n'a que zod).
 *
 * - PNG : chunks `tEXt`, `zTXt`, `iTXt` (dont XMP), `eXIf` et `tIME` supprimés, rien après `IEND`.
 * - JPEG : segments APP1 (EXIF, XMP), APP13 (IPTC/Photoshop) et COM supprimés avant le premier
 *   SOS ; les données compressées sont recopiées telles quelles. L'orientation EXIF est perdue
 *   (sans effet sur une capture d'écran).
 * - WebP : chunks `EXIF` et `XMP ` supprimés, drapeaux correspondants de `VP8X` remis à zéro,
 *   taille RIFF recalculée.
 *
 * Toute structure incohérente (longueur hors du fichier, en-tête absent) est refusée.
 */

export class ImageError extends Error {
  constructor(readonly kind: 'invalid' | 'tooLarge') {
    super(kind);
  }
}

export interface CleanImage {
  type: AttachmentType;
  width: number;
  height: number;
  data: Buffer;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Type reconnu par les octets magiques, ou `undefined`. */
export function sniff(buf: Buffer): AttachmentType | undefined {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 12 &&
    buf.toString('latin1', 0, 4) === 'RIFF' &&
    buf.toString('latin1', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return undefined;
}

const invalid = (): never => {
  throw new ImageError('invalid');
};

// ------------------------------------------------------------------------------------------ PNG

const PNG_DROP = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME']);

function cleanPng(buf: Buffer): Omit<CleanImage, 'type'> {
  const parts: Buffer[] = [PNG_SIGNATURE];
  let pos = 8;
  let width = 0;
  let height = 0;
  let first = true;
  let ended = false;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const end = pos + 12 + len;
    if (len > 0x7fffffff || end > buf.length || !/^[A-Za-z]{4}$/.test(type)) invalid();
    if (first) {
      if (type !== 'IHDR' || len !== 13) invalid();
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      first = false;
    }
    if (!PNG_DROP.has(type)) parts.push(buf.subarray(pos, end));
    pos = end;
    if (type === 'IEND') {
      ended = true;
      break;
    }
  }
  if (first || !ended) invalid();
  return { width, height, data: Buffer.concat(parts) };
}

// ----------------------------------------------------------------------------------------- JPEG

/** Marqueurs SOFn portant les dimensions (hors DHT C4, JPG C8, DAC CC). */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
/** APP1 (EXIF, XMP), APP13 (IPTC), COM. */
const JPEG_DROP = new Set([0xe1, 0xed, 0xfe]);

function cleanJpeg(buf: Buffer): Omit<CleanImage, 'type'> {
  const parts: Buffer[] = [buf.subarray(0, 2)];
  let pos = 2;
  let width = 0;
  let height = 0;
  for (;;) {
    if (pos >= buf.length) invalid();
    if (buf[pos] !== 0xff) invalid();
    // Octets de remplissage 0xFF entre segments.
    while (pos < buf.length && buf[pos] === 0xff) pos++;
    if (pos >= buf.length) invalid();
    const marker = buf[pos]!;
    pos++;
    if (marker === 0xd9) invalid(); // EOI avant toute image.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(Buffer.from([0xff, marker]));
      continue;
    }
    if (pos + 2 > buf.length) invalid();
    const len = buf.readUInt16BE(pos);
    const end = pos + len;
    if (len < 2 || end > buf.length) invalid();
    if (SOF.has(marker)) {
      if (len < 8) invalid();
      height = buf.readUInt16BE(pos + 3);
      width = buf.readUInt16BE(pos + 5);
    }
    if (marker === 0xda) {
      // Début des données compressées : le reste est recopié (balayages suivants compris).
      if (width === 0 || height === 0) invalid();
      parts.push(Buffer.from([0xff, marker]), buf.subarray(pos));
      break;
    }
    if (!JPEG_DROP.has(marker)) parts.push(Buffer.from([0xff, marker]), buf.subarray(pos, end));
    pos = end;
  }
  return { width, height, data: Buffer.concat(parts) };
}

// ----------------------------------------------------------------------------------------- WebP

const WEBP_DROP = new Set(['EXIF', 'XMP ']);
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

function cleanWebp(buf: Buffer): Omit<CleanImage, 'type'> {
  const riffSize = buf.readUInt32LE(4);
  const total = Math.min(buf.length, riffSize + 8);
  if (riffSize < 4 || riffSize + 8 > buf.length) invalid();
  const chunks: Buffer[] = [];
  let pos = 12;
  let width = 0;
  let height = 0;
  let image = false;
  while (pos + 8 <= total) {
    const fourcc = buf.toString('latin1', pos, pos + 4);
    const len = buf.readUInt32LE(pos + 4);
    const dataStart = pos + 8;
    const end = dataStart + len + (len % 2);
    if (end > total && dataStart + len > total) invalid();
    const data = buf.subarray(dataStart, dataStart + len);
    if (fourcc === 'VP8X') {
      if (len < 10) invalid();
      width = data.readUIntLE(4, 3) + 1;
      height = data.readUIntLE(7, 3) + 1;
      const copy = Buffer.from(buf.subarray(pos, Math.min(end, total)));
      copy[8] = copy[8]! & ~(VP8X_EXIF | VP8X_XMP);
      chunks.push(copy);
    } else {
      if (fourcc === 'VP8 ') {
        if (len < 10 || data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a) invalid();
        if (width === 0) {
          width = data.readUInt16LE(6) & 0x3fff;
          height = data.readUInt16LE(8) & 0x3fff;
        }
        image = true;
      } else if (fourcc === 'VP8L') {
        if (len < 5 || data[0] !== 0x2f) invalid();
        if (width === 0) {
          const bits = data.readUInt32LE(1);
          width = (bits & 0x3fff) + 1;
          height = ((bits >>> 14) & 0x3fff) + 1;
        }
        image = true;
      } else if (fourcc === 'ANMF') {
        image = true;
      }
      if (!WEBP_DROP.has(fourcc)) chunks.push(buf.subarray(pos, Math.min(end, total)));
    }
    pos = end;
  }
  if (!image || width === 0 || height === 0) invalid();
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write('RIFF', 0, 'latin1');
  header.writeUInt32LE(body.length + 4, 4);
  header.write('WEBP', 8, 'latin1');
  return { width, height, data: Buffer.concat([header, body]) };
}

// ------------------------------------------------------------------------------------- commune

/** Content-Type d'un envoi (paramètres ignorés), ou `undefined` s'il n'est pas accepté. */
export function declaredType(contentType: string | undefined): AttachmentType | undefined {
  const t = (contentType ?? '').split(';')[0]!.trim().toLowerCase();
  return t === 'image/png' || t === 'image/jpeg' || t === 'image/webp' ? t : undefined;
}

/**
 * Vérifie et nettoie une image : le type annoncé doit correspondre aux octets magiques
 * (`invalid` sinon), la structure doit être cohérente (`invalid`), les dimensions plafonnées
 * (`tooLarge`). Renvoie l'image sans métadonnées.
 */
export function cleanImage(buf: Buffer, declared: AttachmentType): CleanImage {
  const type = sniff(buf);
  if (!type || type !== declared) invalid();
  let out: Omit<CleanImage, 'type'>;
  try {
    out =
      type === 'image/png'
        ? cleanPng(buf)
        : type === 'image/jpeg'
          ? cleanJpeg(buf)
          : cleanWebp(buf);
  } catch (e) {
    if (e instanceof ImageError) throw e;
    // Lecture hors limites d'un Buffer (RangeError) : fichier tronqué.
    throw new ImageError('invalid');
  }
  if (out.width < 1 || out.height < 1) invalid();
  if (
    out.width > ATTACHMENT_LIMITS.side ||
    out.height > ATTACHMENT_LIMITS.side ||
    out.width * out.height > ATTACHMENT_LIMITS.pixels
  ) {
    throw new ImageError('tooLarge');
  }
  return { type: type!, ...out };
}

export const EXTENSIONS: Record<AttachmentType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
