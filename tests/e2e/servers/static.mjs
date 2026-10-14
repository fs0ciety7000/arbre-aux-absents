// Serveur statique du site prérendu, au plus près de nginx.conf : `/x` → `/x/` (301) puis
// `index.html`, sinon `404.html` en 404 ; gzip (comme gzip_static) ; même CSP, avec les
// empreintes des scripts et styles en ligne calculées par scripts/csp-hashes.sh. Construit le site
// d'abord, sauf E2E_SKIP_BUILD=1.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const root = resolve(process.env.E2E_SITE_ROOT ?? resolve(repo, 'apps/site/build'));
const port = Number(process.env.E2E_SITE_PORT ?? 4320);

if (process.env.E2E_SKIP_BUILD !== '1' || !existsSync(join(root, 'index.html'))) {
  execFileSync('npm', ['run', 'build', '-w', '@arbre/site'], { cwd: repo, stdio: 'inherit' });
}

// Empreintes des <script> et <style> en ligne : celles de scripts/csp-hashes.sh (même script
// que l'image Docker), lues dans le fragment nginx qu'il produit.
const conf = join(mkdtempSync(join(tmpdir(), 'arbre-csp-')), 'csp-hashes.conf');
execFileSync('sh', [resolve(repo, 'scripts/csp-hashes.sh'), root, conf], { stdio: 'inherit' });
const confText = readFileSync(conf, 'utf8');
const nginxVar = (name) => new RegExp(`set \\$${name} "([^"]*)";`).exec(confText)?.[1] ?? '';
const CSP =
  `default-src 'self'; script-src 'self' ${nginxVar('csp_script_hashes')}; ` +
  `style-src 'self' ${nginxVar('csp_style_hashes')}; ` +
  "style-src-attr 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; " +
  "connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src https://itch.io https://www.youtube-nocookie.com; " +
  "object-src 'none'; " +
  "base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
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
