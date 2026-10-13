/**
 * Normalisation et hachage : ceux du moteur (`@arbre/engine`), pour des empreintes identiques
 * entre la compilation et le jeu (ARCHITECTURE §3.3, §3.5). Plus quelques aides de build.
 */

import { cyrb53, hashAnswer, normalize, type AnswerField } from '@arbre/engine';

export { cyrb53, hashAnswer, normalize, type AnswerField };

/** cyrb53 en hexadécimal minuscule, 14 caractères (53 bits complétés de zéros). */
export function cyrb53Hex(text: string, seed = 0): string {
  return cyrb53(text, seed).toString(16).padStart(14, '0');
}

/** Empreinte courte (8 hex) d'un texte : `contentHash`. */
export function shortHash(text: string): string {
  return cyrb53Hex(text).slice(-8);
}

/** Sérialisation JSON stable (clés triées) : base des empreintes déterministes. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}
