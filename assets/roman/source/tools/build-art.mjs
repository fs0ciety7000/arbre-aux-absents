import { writeFileSync } from 'node:fs';
import { buildTilleul, buildVignette } from './tilleul.mjs';
import { buildNocturne } from './nocturne.mjs';
const outDir = process.argv[2];
writeFileSync(`${outDir}/roman-tilleul.svg`, buildTilleul('roman-tilleul').toString());
writeFileSync(`${outDir}/roman-nocturne.svg`, buildNocturne('roman-nocturne').toString());
writeFileSync(`${outDir}/roman-rameau.svg`, buildVignette('roman-rameau').toString());
