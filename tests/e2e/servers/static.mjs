// Serveur statique du site prérendu, au plus près de nginx.conf : `/x` → `/x/` (301) puis
// `index.html`, sinon `404.html` en 404 ; gzip (comme gzip_static) ; même CSP, avec les
// empreintes des scripts en ligne calculées comme scripts/csp-hashes.sh. Construit le site
// d'abord, sauf E2E_SKIP_BUILD=1.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const root = resolve(process.env.E2E_SITE_ROOT ?? resolve(repo, 'apps/site/build'));
const port = Number(process.env.E2E_SITE_PORT ?? 4320);

if (process.env.E2E_SKIP_BUILD !== '1' || !existsSync(join(root, 'index.html'))) {
  execFileSync('npm', ['run', 'build', '-w', '@arbre/site'], { cwd: repo, stdio: 'inherit' });
}

// Empreintes des <script> en ligne (même règle que scripts/csp-hashes.sh).
const hashes = new Set();
const inline = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
for (const page of readdirSync(root, { recursive: true }).filter((f) => f.endsWith('.html'))) {
  for (const [, body] of readFileSync(join(root, page), 'utf8').matchAll(inline)) {
    if (body.trim() === '') continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
}
const CSP =
  `default-src 'self'; script-src 'self' ${[...hashes].sort().join(' ')}; style-src 'self'; ` +
  "style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; " +
  "connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; " +
  "base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml']);
const gzCache = new Map();

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  const base = resolve(root, rel);
  const headers = { 'x-content-type-options': 'nosniff' };
  if (process.env.E2E_NO_CSP !== '1') headers['content-security-policy'] = CSP;
  if (base !== root && !base.startsWith(root + sep)) {
    res.writeHead(400, headers).end();
    return;
  }
  if (!url.pathname.endsWith('/') && !isFile(base) && isFile(join(base, 'index.html'))) {
    res.writeHead(301, { ...headers, location: `${url.pathname}/` }).end();
    return;
  }
  const found = isFile(base)
    ? base
    : isFile(join(base, 'index.html'))
      ? join(base, 'index.html')
      : null;
  const target = found ?? join(root, '404.html');
  const ext = extname(target);
  let body = readFileSync(target);
  headers['content-type'] = TYPES[ext] ?? 'application/octet-stream';
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    if (!gzCache.has(target)) gzCache.set(target, gzipSync(body, { level: 9 }));
    body = gzCache.get(target);
    headers['content-encoding'] = 'gzip';
    headers.vary = 'Accept-Encoding';
  }
  res.writeHead(found ? 200 : 404, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, () => console.log(`site e2e : http://localhost:${port}`));
