#!/bin/sh
# Calcule les empreintes sha256 des blocs en ligne du site prérendu et écrit un fragment nginx,
# inclus par nginx.conf pour la CSP. Ainsi la CSP reste stricte (aucun 'unsafe-inline' pour les
# scripts ni pour les feuilles <style>) sans config côté site :
#   $csp_script_hashes : <script> sans src des pages .html (amorce SvelteKit) ;
#   $csp_style_hashes  : <style> des pages .html (CSS en ligne, kit.inlineStyleThreshold) et des
#                        SVG autonomes .svg (art.css embarqué dans /art/*.svg).
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
const files = readdirSync(dir, { recursive: true }).map(String);
const pages = files.filter((f) => f.endsWith('.html'));
const svgs = files.filter((f) => f.endsWith('.svg'));
const sha = (body) => `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
// Seul le contenu exact entre les balises est haché (CSP niveau 2).
const collect = (list, re) => {
  const hashes = new Set();
  for (const f of list) {
    for (const [, body] of readFileSync(join(dir, f), 'utf8').matchAll(re)) {
      if (body.trim() !== '') hashes.add(sha(body));
    }
  }
  return [...hashes].sort();
};
const scripts = collect(pages, /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi);
const styles = collect([...pages, ...svgs], /<style\b[^>]*>([\s\S]*?)<\/style>/gi);
writeFileSync(
  out,
  '# Généré par scripts/csp-hashes.sh — ne pas modifier.\n' +
    `set $csp_script_hashes "${scripts.join(' ')}";\n` +
    `set $csp_style_hashes "${styles.join(' ')}";\n`,
);
console.log(
  `csp-hashes: ${scripts.length} script(s), ${styles.length} style(s) ` +
    `pour ${pages.length} page(s) et ${svgs.length} SVG → ${out}`,
);
JS
