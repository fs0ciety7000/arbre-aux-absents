import { z } from 'zod';
import { CONTENT_FILE_SCHEMAS, I18N_FILE_SCHEMAS, PLAYER_DATA_SCHEMAS } from './content-files';

export type JsonSchemaDocument = Record<string, unknown>;

/**
 * Schémas JSON (draft 2020-12) générés par `z.toJSONSchema()`, pour l'autocomplétion des
 * éditeurs. Les raffinements (`refine`) ne sont pas représentables : `content:check` reste juge.
 */
export function buildJsonSchemas(): Record<string, JsonSchemaDocument> {
  const all = { ...CONTENT_FILE_SCHEMAS, ...I18N_FILE_SCHEMAS, ...PLAYER_DATA_SCHEMAS };
  const out: Record<string, JsonSchemaDocument> = {};
  for (const [name, schema] of Object.entries(all)) {
    out[name] = z.toJSONSchema(schema, {
      target: 'draft-2020-12',
      io: 'input',
    }) as JsonSchemaDocument;
  }
  return out;
}
