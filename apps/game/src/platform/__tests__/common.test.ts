import { describe, expect, it, vi } from 'vitest';
import {
  BackRegistry,
  MAX_IMPORT_BYTES,
  PlatformError,
  decodeImported,
  decodeStored,
  exportFileName,
  readSummary,
  summaryFromRaw,
  fallbackSummarize,
  withTimeout,
} from '../common';
import { makeSave } from './fixtures';

describe('exportFileName', () => {
  it('nomme le fichier avec emplacement et date locale', () => {
    expect(exportFileName('slot-2', new Date(2026, 0, 5, 23, 59))).toBe(
      'arbre-aux-absents-slot-2-2026-01-05.json',
    );
  });
});

describe('decodeStored / decodeImported', () => {
  it('renvoie l’objet si JSON lisible, sinon le texte brut', () => {
    expect(decodeStored('{"a":1}')).toEqual({ a: 1 });
    expect(decodeStored('{oups')).toBe('{oups');
    expect(decodeStored(null)).toBeNull();
  });
  it('refuse un import > 2 Mo (octets, pas caractères)', () => {
    const big = 'é'.repeat(MAX_IMPORT_BYTES / 2 + 1);
    expect(() => decodeImported(big)).toThrow(PlatformError);
    try {
      decodeImported(big);
    } catch (e) {
      expect((e as PlatformError).code).toBe('too-large');
    }
    expect(decodeImported('{"x":true}')).toEqual({ x: true });
  });
});

describe('résumés', () => {
  it('valide le résumé stocké et vérifie l’emplacement', () => {
    const sum = JSON.stringify(fallbackSummarize(makeSave('slot-1')));
    expect(readSummary(sum, 'slot-1')?.caseTitle).toBe('affaire-test');
    expect(readSummary(sum, 'slot-2')).toBeNull();
    expect(readSummary('{"slot":"slot-1"}', 'slot-1')).toBeNull();
    expect(readSummary('pas du json', 'slot-1')).toBeNull();
  });
  it('recalcule depuis la partie seulement si elle est conforme', () => {
    const raw = JSON.stringify(makeSave('auto'));
    expect(summaryFromRaw(raw, 'auto', fallbackSummarize)?.slot).toBe('auto');
    expect(summaryFromRaw('{"schemaVersion":1}', 'auto', fallbackSummarize)).toBeNull();
    // Résumé hors bornes produit par un summarizer fautif : ignoré.
    expect(
      summaryFromRaw(raw, 'auto', (s) => ({ ...fallbackSummarize(s), progress: 2 })),
    ).toBeNull();
  });
});

describe('BackRegistry', () => {
  it('appelle le dernier inscrit d’abord et s’arrête au premier consommateur', () => {
    const r = new BackRegistry();
    const calls: string[] = [];
    r.add(() => (calls.push('a'), true));
    const offB = r.add(() => (calls.push('b'), false));
    expect(r.dispatch()).toBe(true);
    expect(calls).toEqual(['b', 'a']);
    offB();
    offB(); // idempotent
    expect(r.size).toBe(1);
  });
  it('isole un gestionnaire qui lève', () => {
    const r = new BackRegistry();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    r.add(() => true);
    r.add(() => {
      throw new Error('boum');
    });
    expect(r.dispatch()).toBe(true);
    spy.mockRestore();
  });
  it('notifie le nombre de gestionnaires', () => {
    const counts: number[] = [];
    const r = new BackRegistry((n) => counts.push(n));
    const off = r.add(() => false);
    off();
    expect(counts).toEqual([1, 0]);
  });
});

describe('withTimeout', () => {
  it('rejette au-delà du délai', async () => {
    await expect(withTimeout(new Promise(() => {}), 10, 'test')).rejects.toMatchObject({
      code: 'storage',
    });
    await expect(withTimeout(Promise.resolve(3), 10, 'test')).resolves.toBe(3);
  });
});
