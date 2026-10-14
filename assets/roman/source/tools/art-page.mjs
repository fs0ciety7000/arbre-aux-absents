// Page d'aperçu d'un SVG d'art : node art-page.mjs in.svg out.html
import { readFileSync, writeFileSync } from 'node:fs';
const root = '/home/user/arbre-aux-absents';
const [inp, out] = process.argv.slice(2);
const css = ['tokens.css', 'art.css'].map((f) => readFileSync(`${root}/packages/ui/src/styles/${f}`, 'utf8')).join('\n');
const defs = /<svg[\s\S]*?<\/svg>/.exec(readFileSync(`${root}/packages/ui/src/primitives/ArtDefs.svelte`, 'utf8'))[0].replace('class="art defs"', 'class="art" style="position:absolute"');
writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>${css}body{margin:0}svg.art{display:block;width:100vw;height:100vh}</style>${defs}${readFileSync(inp, 'utf8')}`);
