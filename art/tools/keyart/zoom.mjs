#!/usr/bin/env node
/** Agrandit une région d'un SVG (viewBox recadrée) : node zoom.mjs in.svg out.svg x y w h */
import { readFileSync, writeFileSync } from 'node:fs';
const [inp, out, x, y, w, h] = process.argv.slice(2);
const s = readFileSync(inp, 'utf8').replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`);
writeFileSync(out, s);
