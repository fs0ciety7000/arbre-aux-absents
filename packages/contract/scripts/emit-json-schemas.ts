/**
 * Écrit les schémas JSON du contrat.
 * Usage : npm run schemas:json [-- --out <dossier>]   (défaut : packages/contract/schema)
 * Pour l'éditeur : npm run schemas:json -- --out ../../content  → content/<nom>.schema.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildJsonSchemas } from '../src/json-schema';

const { values } = parseArgs({ options: { out: { type: 'string' } } });
const outDir = resolve(values.out ?? resolve(import.meta.dirname, '../schema'));

await mkdir(outDir, { recursive: true });
const schemas = buildJsonSchemas();
for (const [name, schema] of Object.entries(schemas)) {
  const file = resolve(outDir, `${name}.schema.json`);
  await writeFile(file, `${JSON.stringify(schema, null, 2)}\n`, 'utf8');
  console.log(`schéma écrit : ${file}`);
}
