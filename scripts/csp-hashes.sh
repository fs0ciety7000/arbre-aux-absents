#!/bin/sh
# Calcule les empreintes sha256 des <script> en ligne des pages prérendues (amorce SvelteKit)
# et écrit un fragment nginx qui définit $csp_script_hashes, utilisé par la CSP de nginx.conf.
# Ainsi la CSP reste stricte (aucun 'unsafe-inline' pour les scripts) sans config côté site.
# Usage : scripts/csp-hashes.sh <dossier> <fichier-sortie>
#   défaut : apps/site/build  →  csp-hashes.conf
set -eu

dir="${1:-apps/site/build}"
out="${2:-csp-hashes.conf}"
[ -d "$dir" ] || { echo "csp-hashes: dossier introuvable : $dir" >&2; exit 1; }

node --input-type=module - "$dir" "$out" <<'JS'
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, out] = process.argv.slice(2);
const pages = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith('.html'));
const hashes = new Set();
// <script> sans attribut src : seul le contenu exact entre les balises est haché (CSP niveau 2).
const inline = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
for (const page of pages) {
  for (const [, body] of readFileSync(join(dir, String(page)), 'utf8').matchAll(inline)) {
    if (body.trim() === '') continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
}
const list = [...hashes].sort().join(' ');
writeFileSync(out, `# Généré par scripts/csp-hashes.sh — ne pas modifier.\nset $csp_script_hashes "${list}";\n`);
console.log(`csp-hashes: ${hashes.size} empreinte(s) pour ${pages.length} page(s) → ${out}`);
JS
