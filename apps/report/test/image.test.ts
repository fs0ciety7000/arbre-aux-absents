import { describe, expect, it } from 'vitest';
import { ATTACHMENT_LIMITS } from '@arbre/contract';
import { ImageError, cleanImage, declaredType, sniff } from '../src/image';
import { SECRET_META, jpeg, png, webp, webpLossy } from './images';

function kind(fn: () => unknown): string | undefined {
  try {
    fn();
    return undefined;
  } catch (e) {
    return e instanceof ImageError ? e.kind : 'other';
  }
}

const has = (buf: Buffer, s: string) => buf.includes(Buffer.from(s, 'latin1'));

describe('octets magiques et type annoncé', () => {
  it('reconnaît PNG, JPEG et WebP', () => {
    expect(sniff(png())).toBe('image/png');
    expect(sniff(jpeg())).toBe('image/jpeg');
    expect(sniff(webp())).toBe('image/webp');
    expect(sniff(Buffer.from('GIF89a......'))).toBeUndefined();
    expect(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeUndefined();
    expect(sniff(Buffer.alloc(0))).toBeUndefined();
  });

  it('Content-Type accepté : trois types, paramètres ignorés', () => {
    expect(declaredType('image/png')).toBe('image/png');
    expect(declaredType('IMAGE/JPEG; charset=binary')).toBe('image/jpeg');
    expect(declaredType('image/webp')).toBe('image/webp');
    for (const t of ['image/gif', 'image/svg+xml', 'text/html', 'application/octet-stream', '']) {
      expect(declaredType(t)).toBeUndefined();
    }
    expect(declaredType(undefined)).toBeUndefined();
  });

  it('type annoncé différent des octets : refusé', () => {
    expect(kind(() => cleanImage(png(), 'image/jpeg'))).toBe('invalid');
    expect(kind(() => cleanImage(jpeg(), 'image/webp'))).toBe('invalid');
  });
});

describe('PNG', () => {
  it('dimensions lues et métadonnées retirées (tEXt, iTXt/XMP, eXIf, tIME), rien après IEND', () => {
    const src = png({ width: 4, height: 3, meta: true, trailing: true });
    expect(has(src, SECRET_META)).toBe(true);
    const out = cleanImage(src, 'image/png');
    expect(out).toMatchObject({ type: 'image/png', width: 4, height: 3 });
    expect(has(out.data, SECRET_META)).toBe(false);
    for (const t of ['tEXt', 'iTXt', 'eXIf', 'tIME']) expect(has(out.data, t)).toBe(false);
    expect(has(out.data, 'IDAT')).toBe(true);
    expect(out.data.subarray(-8, -4).toString('latin1')).toBe('IEND');
    // Sans métadonnées : identique octet pour octet.
    const clean = png();
    expect(cleanImage(clean, 'image/png').data.equals(clean)).toBe(true);
  });

  it('structures incohérentes refusées', () => {
    const p = png();
    expect(kind(() => cleanImage(p.subarray(0, 20), 'image/png'))).toBe('invalid');
    expect(kind(() => cleanImage(p.subarray(0, p.length - 12), 'image/png'))).toBe('invalid'); // sans IEND
    const badLen = Buffer.from(p);
    badLen.writeUInt32BE(0x7ffffff0, 8); // longueur d'IHDR hors du fichier
    expect(kind(() => cleanImage(badLen, 'image/png'))).toBe('invalid');
    const noIhdr = Buffer.from(p);
    noIhdr.write('IDAT', 12, 'latin1');
    expect(kind(() => cleanImage(noIhdr, 'image/png'))).toBe('invalid');
  });

  it('dimensions plafonnées (côté, surface) et nulles refusées', () => {
    const side = ATTACHMENT_LIMITS.side;
    expect(cleanImage(png({ width: side, height: 1 }), 'image/png').width).toBe(side);
    expect(kind(() => cleanImage(png({ width: side + 1, height: 1 }), 'image/png'))).toBe(
      'tooLarge',
    );
    expect(kind(() => cleanImage(png({ width: 8000, height: 8000 }), 'image/png'))).toBe(
      'tooLarge',
    );
    expect(kind(() => cleanImage(png({ width: 0, height: 10 }), 'image/png'))).toBe('invalid');
  });
});

describe('JPEG', () => {
  it('APP1 (EXIF, XMP), APP13 et COM retirés ; APP0, tables et données gardées', () => {
    const src = jpeg({ width: 1920, height: 1080, meta: true });
    const out = cleanImage(src, 'image/jpeg');
    expect(out).toMatchObject({ type: 'image/jpeg', width: 1920, height: 1080 });
    expect(has(out.data, SECRET_META)).toBe(false);
    expect(has(out.data, 'Exif')).toBe(false);
    expect(has(out.data, 'JFIF')).toBe(true);
    expect(out.data.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))).toBe(true);
    expect(out.data.subarray(-2).equals(Buffer.from([0xff, 0xd9]))).toBe(true);
    // Données compressées recopiées telles quelles.
    expect(out.data.includes(Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56]))).toBe(true);
    expect(out.data.length).toBeLessThan(src.length);
  });

  it('sans SOF, tronqué ou trop grand : refusé', () => {
    const j = jpeg();
    expect(kind(() => cleanImage(j.subarray(0, 30), 'image/jpeg'))).toBe('invalid');
    expect(kind(() => cleanImage(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), 'image/jpeg'))).toBe(
      'invalid',
    );
    const noSof = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 63, 0]),
      Buffer.from([0, 0xff, 0xd9]),
    ]);
    expect(kind(() => cleanImage(noSof, 'image/jpeg'))).toBe('invalid');
    expect(kind(() => cleanImage(jpeg({ width: 9000, height: 100 }), 'image/jpeg'))).toBe(
      'tooLarge',
    );
  });
});

describe('WebP', () => {
  it('VP8X : chunks EXIF et XMP retirés, drapeaux remis à zéro, taille RIFF recalculée', () => {
    const src = webp({ width: 1280, height: 720, meta: true });
    const out = cleanImage(src, 'image/webp');
    expect(out).toMatchObject({ type: 'image/webp', width: 1280, height: 720 });
    expect(has(out.data, SECRET_META)).toBe(false);
    expect(has(out.data, 'EXIF')).toBe(false);
    expect(has(out.data, 'XMP ')).toBe(false);
    expect(out.data.readUInt32LE(4)).toBe(out.data.length - 8);
    const flags = out.data[12 + 8]!;
    expect(flags & 0x0c).toBe(0);
  });

  it('VP8L et VP8 simples', () => {
    expect(cleanImage(webp({ width: 320, height: 200 }), 'image/webp')).toMatchObject({
      width: 320,
      height: 200,
    });
    expect(cleanImage(webpLossy(100, 50), 'image/webp')).toMatchObject({ width: 100, height: 50 });
  });

  it('sans image, taille RIFF mensongère ou trop grand : refusé', () => {
    const w = webp();
    const lying = Buffer.from(w);
    lying.writeUInt32LE(w.length * 4, 4);
    expect(kind(() => cleanImage(lying, 'image/webp'))).toBe('invalid');
    const empty = Buffer.from('RIFF\x04\x00\x00\x00WEBP', 'latin1');
    expect(kind(() => cleanImage(empty, 'image/webp'))).toBe('invalid');
    const badVp8 = webpLossy();
    badVp8[12 + 8 + 3] = 0;
    expect(kind(() => cleanImage(badVp8, 'image/webp'))).toBe('invalid');
    expect(kind(() => cleanImage(webp({ width: 8192, height: 8192 }), 'image/webp'))).toBe(
      'tooLarge',
    );
  });
});
