import { crc32, deflateSync } from 'node:zlib';

/** Images de test construites à la main (structure réelle, métadonnées identifiables). */

export const SECRET_META = 'GPS 50.4542N 3.9567E Pixel-8 joueuse';

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
}

/** PNG valide (RVB 8 bits, pixels gris) avec ou sans métadonnées. */
export function png(
  opts: { width?: number; height?: number; meta?: boolean; trailing?: boolean } = {},
): Buffer {
  const width = opts.width ?? 4;
  const height = opts.height ?? 3;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // RVB
  // Pixels réels seulement pour les petites images (les grandes servent aux plafonds).
  const raw =
    width * height <= 10_000
      ? Buffer.alloc((width * 3 + 1) * height, 0x80)
      : Buffer.alloc(16, 0x80);
  const chunks = [pngChunk('IHDR', ihdr)];
  if (opts.meta) {
    chunks.push(pngChunk('tEXt', Buffer.from(`Comment\0${SECRET_META}`, 'latin1')));
    chunks.push(pngChunk('tIME', Buffer.from([7, 234, 10, 15, 12, 0, 0])));
  }
  chunks.push(pngChunk('IDAT', deflateSync(raw)));
  if (opts.meta) {
    chunks.push(
      pngChunk(
        'iTXt',
        Buffer.from(`XML:com.adobe.xmp\0\0\0\0\0<x:xmpmeta>${SECRET_META}</x:xmpmeta>`, 'utf8'),
      ),
    );
    chunks.push(pngChunk('eXIf', Buffer.from(`MM\0*${SECRET_META}`, 'latin1')));
  }
  chunks.push(pngChunk('IEND', Buffer.alloc(0)));
  const parts: Buffer[] = [
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ...chunks,
  ];
  if (opts.trailing) parts.push(Buffer.from(`<script>${SECRET_META}</script>`));
  return Buffer.concat(parts);
}

function seg(marker: number, data: Buffer): Buffer {
  const head = Buffer.from([0xff, marker, 0, 0]);
  head.writeUInt16BE(data.length + 2, 2);
  return Buffer.concat([head, data]);
}

/** JPEG (structure de segments) : APP0 JFIF, APP1 EXIF et XMP, APP13, COM, SOF0, SOS. */
export function jpeg(opts: { width?: number; height?: number; meta?: boolean } = {}): Buffer {
  const width = opts.width ?? 640;
  const height = opts.height ?? 480;
  const sof = Buffer.alloc(15);
  sof[0] = 8;
  sof.writeUInt16BE(height, 1);
  sof.writeUInt16BE(width, 3);
  sof[5] = 3;
  const parts: Buffer[] = [Buffer.from([0xff, 0xd8])];
  parts.push(seg(0xe0, Buffer.from('JFIF\0\x01\x01\0\0\x01\0\x01\0\0', 'latin1')));
  if (opts.meta) {
    parts.push(seg(0xe1, Buffer.from(`Exif\0\0MM\0*${SECRET_META}`, 'latin1')));
    parts.push(
      seg(0xe1, Buffer.from(`http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>${SECRET_META}`, 'utf8')),
    );
    parts.push(seg(0xed, Buffer.from(`Photoshop 3.0\0${SECRET_META}`, 'latin1')));
    parts.push(seg(0xfe, Buffer.from(SECRET_META, 'latin1')));
  }
  parts.push(seg(0xdb, Buffer.alloc(65, 1)));
  parts.push(Buffer.from([0xff, 0xff])); // octet de remplissage
  parts.push(seg(0xc0, sof));
  parts.push(seg(0xda, Buffer.from([1, 1, 0, 0, 63, 0])));
  parts.push(Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd0, 0x78, 0xff, 0xd9]));
  return Buffer.concat(parts);
}

function riffChunk(fourcc: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.write(fourcc, 0, 'latin1');
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

function riff(chunks: Buffer[]): Buffer {
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.write('RIFF', 0, 'latin1');
  head.writeUInt32LE(body.length + 4, 4);
  head.write('WEBP', 8, 'latin1');
  return Buffer.concat([head, body]);
}

function vp8l(width: number, height: number): Buffer {
  const d = Buffer.alloc(9);
  d[0] = 0x2f;
  d.writeUInt32LE(((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14), 1);
  return riffChunk('VP8L', d);
}

/** WebP sans perte (VP8L) ; avec `meta`, en-tête étendu VP8X + chunks EXIF et XMP. */
export function webp(opts: { width?: number; height?: number; meta?: boolean } = {}): Buffer {
  const width = opts.width ?? 320;
  const height = opts.height ?? 200;
  if (!opts.meta) return riff([vp8l(width, height)]);
  const x = Buffer.alloc(10);
  x[0] = 0x08 | 0x04; // EXIF | XMP
  x.writeUIntLE(width - 1, 4, 3);
  x.writeUIntLE(height - 1, 7, 3);
  return riff([
    riffChunk('VP8X', x),
    vp8l(width, height),
    riffChunk('EXIF', Buffer.from(`MM\0*${SECRET_META}`, 'latin1')),
    riffChunk('XMP ', Buffer.from(`<x:xmpmeta>${SECRET_META}</x:xmpmeta>`, 'utf8')),
  ]);
}

/** WebP avec perte (VP8) : code de départ et dimensions. */
export function webpLossy(width = 100, height = 50): Buffer {
  const d = Buffer.alloc(10);
  d[3] = 0x9d;
  d[4] = 0x01;
  d[5] = 0x2a;
  d.writeUInt16LE(width, 6);
  d.writeUInt16LE(height, 8);
  return riff([riffChunk('VP8 ', d)]);
}
