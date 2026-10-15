import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { configureZod } from './zod-config';

describe('zod sans compilation à la volée (CSP sans unsafe-eval)', () => {
  it('pose jitless dans l’objet global que zod adopte', () => {
    const fresh: { __zod_globalConfig?: { jitless?: boolean } } = {};
    configureZod(fresh);
    expect(fresh.__zod_globalConfig).toEqual({ jitless: true });
    // zod lit sa configuration dans ce même objet global : une mise à jour de zod qui
    // changerait de mécanisme ferait échouer ce test (et rouvrirait la violation CSP).
    configureZod();
    expect(z.config()).toBe((globalThis as { __zod_globalConfig?: object }).__zod_globalConfig);
    expect(z.config().jitless).toBe(true);
  });
});
