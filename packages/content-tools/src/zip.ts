/**
 * Écriture d'archives ZIP sans dépendance (deflate de node:zlib), pour les paquets itch.io.
 * Dates fixes (1980-01-01) : archives reproductibles.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

export interface ZipEntry {
  /** Chemin dans l'archive, séparateur `/`. */
  name: string;
  data: Buffer;
}

const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const DOS_TIME = 0;

export function createZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const e of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('/') || e.name.split('/').includes('..')) {
      throw new Error(`chemin d'archive invalide : ${e.name}`);
    }
    const name = Buffer.from(e.name, 'utf8');
    const crc = crc32(e.data) >>> 0;
    const deflated = deflateRawSync(e.data, { level: 9 });
    const useDeflate = deflated.length < e.data.length;
    const body = useDeflate ? deflated : e.data;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(e.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, name, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(e.data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);
    offset += local.length + name.length + body.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cdBuf, end]);
}

/** Liste récursive des fichiers d'un dossier (chemins relatifs, séparateur `/`). */
export async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (d: string) => {
    for (const name of (await readdir(d)).sort()) {
      const p = join(d, name);
      if ((await stat(p)).isDirectory()) await walk(p);
      else out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  await walk(dir);
  return out;
}

export const ITCH_MAX_FILES = 1000;

/** Archive un dossier de build web pour itch.io (index.html à la racine, < 1000 fichiers). */
export async function zipWebBuild(dir: string): Promise<Buffer> {
  const files = await listFiles(dir);
  if (!files.includes('index.html')) throw new Error(`${dir} : index.html absent à la racine`);
  if (files.length >= ITCH_MAX_FILES) {
    throw new Error(`${dir} : ${files.length} fichiers (itch.io : moins de ${ITCH_MAX_FILES})`);
  }
  const entries: ZipEntry[] = [];
  for (const f of files) entries.push({ name: f, data: await readFile(join(dir, f)) });
  return createZip(entries);
}
