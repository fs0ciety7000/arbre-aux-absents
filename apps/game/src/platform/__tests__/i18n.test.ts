import type { SaveSlotSummary, SaveState } from '@arbre/contract';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import {
  EXTERNAL_ORIGINS,
  MAX_EXTERNAL_URL,
  allowedExternalUrl,
  fallbackSummarize,
  readSummary,
  readSystemLocales,
  webOpenExternal,
} from '../common';
import { KEYS } from '../kv-store';
import { createMemoryPlatform } from '../memory';
import { createWebPlatform } from '../web';
import { makeSave } from './fixtures';

/** Plateforme et i18n (docs/i18n/PLAN.md, lot A2) : caseId, langues du système, liens. */

/** Résumé injecté par l'app : ne renseigne pas `caseId` (la plateforme l'ajoute). */
const summarize = () => (s: SaveState) =>
  ({
    slot: s.slot,
    caseTitle: `Titre ${s.caseId}`,
    updatedAt: s.updatedAt,
    elapsedMs: s.elapsedMs,
    mode: s.mode,
    progress: 0.5,
  }) satisfies SaveSlotSummary;

describe('list : caseId pour tous les emplacements', () => {
  it('manuels slot-1..slot-3 et secours, chacun avec son affaire', async () => {
    const p = createMemoryPlatform({ storageWarning: null, summarize });
    await p.saves.save('slot-1', makeSave('slot-1', { caseId: 'premiere-affaire' }));
    await p.saves.save('slot-2', makeSave('slot-2', { caseId: 'deuxieme-affaire' }));
    await p.saves.save('slot-3', makeSave('slot-3', { caseId: 'premiere-affaire' }));
    await p.saves.save('auto', makeSave('auto', { caseId: 'premiere-affaire' }));
    await p.saves.save('auto', makeSave('auto', { caseId: 'deuxieme-affaire' }));
    expect((await p.saves.list()).map((s) => [s.slot, s.caseId])).toEqual([
      ['slot-1', 'premiere-affaire'],
      ['slot-2', 'deuxieme-affaire'],
      ['slot-3', 'premiere-affaire'],
      ['auto', 'deuxieme-affaire'],
      ['auto', 'premiere-affaire'],
    ]);
    // Le résumé stocké porte l'affaire : `list` ne relit pas les parties.
    expect(JSON.parse(p.kv.entries.get(KEYS.summary('slot-2'))!)).toMatchObject({
      caseId: 'deuxieme-affaire',
    });
  });

  it('secours par affaire inchangé : `load("auto", id)` vise toujours son affaire', async () => {
    const p = createMemoryPlatform({ storageWarning: null, summarize });
    await p.saves.save('auto', makeSave('auto', { caseId: 'premiere-affaire', elapsedMs: 1 }));
    await p.saves.save('auto', makeSave('auto', { caseId: 'deuxieme-affaire', elapsedMs: 2 }));
    expect(await p.saves.load('auto', 'premiere-affaire')).toMatchObject({ elapsedMs: 1 });
    expect(await p.saves.load('auto', 'deuxieme-affaire')).toMatchObject({ elapsedMs: 2 });
  });

  it('résumé écrit avant l’i18n (sans caseId) : affaire relue dans la partie', async () => {
    const p = createMemoryPlatform({ storageWarning: null, summarize });
    await p.saves.save('slot-1', makeSave('slot-1', { caseId: 'deuxieme-affaire' }));
    const key = KEYS.summary('slot-1');
    const old = JSON.parse(p.kv.entries.get(key)!) as Record<string, unknown>;
    delete old['caseId'];
    p.kv.entries.set(key, JSON.stringify(old));
    const [row] = await p.saves.list();
    expect(row).toMatchObject({ slot: 'slot-1', caseTitle: 'Titre deuxieme-affaire' });
    expect(row?.caseId).toBe('deuxieme-affaire');
  });

  it('résumé sans caseId et partie illisible : caseId null, emplacement gardé', async () => {
    const p = createMemoryPlatform({ storageWarning: null, summarize });
    await p.saves.save('slot-1', makeSave('slot-1'));
    const key = KEYS.summary('slot-1');
    const old = JSON.parse(p.kv.entries.get(key)!) as Record<string, unknown>;
    delete old['caseId'];
    p.kv.entries.set(key, JSON.stringify(old));
    p.kv.entries.set(KEYS.save('slot-1'), '{cassé');
    expect((await p.saves.list()).map((s) => [s.slot, s.caseId])).toEqual([['slot-1', null]]);
  });

  it('résumé stocké : caseId invalide refusé, absent ou null accepté', () => {
    const base = { slot: 'slot-1', caseTitle: 'T', updatedAt: 1, elapsedMs: 1, mode: 'standard' };
    const sum = (extra: object) => JSON.stringify({ ...base, progress: 0, ...extra });
    expect(readSummary(sum({}), 'slot-1')).not.toBeNull();
    expect(readSummary(sum({ caseId: null }), 'slot-1')).not.toBeNull();
    expect(readSummary(sum({ caseId: 'une-affaire' }), 'slot-1')?.caseId).toBe('une-affaire');
    expect(readSummary(sum({ caseId: '../../etc' }), 'slot-1')).toBeNull();
    expect(readSummary(sum({ caseId: 'x'.repeat(65) }), 'slot-1')).toBeNull();
  });

  it('résumé de repli : caseId renseigné', () => {
    expect(fallbackSummarize(makeSave('slot-2'))).toMatchObject({
      slot: 'slot-2',
      caseId: 'affaire-test',
    });
  });
});

describe('readSystemLocales', () => {
  it('languages dans l’ordre, sans doublon ni étiquette invalide', () => {
    expect(
      readSystemLocales({ languages: ['fr-BE', 'en-GB', 'fr-BE', ' de ', '', '1x', 'a b'] }),
    ).toEqual(['fr-BE', 'en-GB', 'de']);
  });

  it('repli sur language, puis liste vide', () => {
    expect(readSystemLocales({ languages: [], language: 'en-US' })).toEqual(['en-US']);
    expect(readSystemLocales({ language: 'zh-Hant-TW' })).toEqual(['zh-Hant-TW']);
    expect(readSystemLocales({})).toEqual([]);
    expect(readSystemLocales(null)).toEqual([]);
    expect(readSystemLocales(undefined)).toEqual([]);
  });

  it('borné à 16 étiquettes, valeurs non textuelles ignorées, jamais d’exception', () => {
    const many = Array.from({ length: 40 }, (_, i) => `en-a${i}`);
    expect(readSystemLocales({ languages: many })).toHaveLength(16);
    expect(readSystemLocales({ languages: [42, null, 'fr'] as unknown as string[] })).toEqual([
      'fr',
    ]);
    const throwing = {
      get languages(): string[] {
        throw new Error('refusé');
      },
    };
    expect(readSystemLocales(throwing)).toEqual([]);
  });
});

describe('allowedExternalUrl', () => {
  it('origines autorisées seulement, en https', () => {
    expect(EXTERNAL_ORIGINS).toEqual([
      'https://arbre.cardormedia.com',
      'https://cardorinteractive.itch.io',
    ]);
    expect(allowedExternalUrl('https://arbre.cardormedia.com/suivi/#tok')).toBe(
      'https://arbre.cardormedia.com/suivi/#tok',
    );
    expect(allowedExternalUrl('https://ARBRE.cardormedia.com/en/suivi/')).toBe(
      'https://arbre.cardormedia.com/en/suivi/',
    );
    expect(allowedExternalUrl('https://cardorinteractive.itch.io/arbre/community')).not.toBeNull();
  });

  it.each([
    ['http', 'http://arbre.cardormedia.com/'],
    ['autre domaine', 'https://example.org/'],
    ['suffixe trompeur', 'https://arbre.cardormedia.com.example.org/'],
    ['sous-domaine', 'https://x.arbre.cardormedia.com/'],
    ['identifiants', 'https://a:b@arbre.cardormedia.com/'],
    ['port', 'https://arbre.cardormedia.com:8443/'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,<b>x</b>'],
    ['relative', '/suivi/'],
    ['vide', ''],
    ['trop longue', `https://arbre.cardormedia.com/${'a'.repeat(MAX_EXTERNAL_URL)}`],
  ])('refus : %s', (_, url) => {
    expect(allowedExternalUrl(url)).toBeNull();
  });
});

describe('openExternal (web)', () => {
  it('ouvre un nouvel onglet sans opener ; refuse les autres URL', async () => {
    const open = vi.fn(() => null);
    const go = webOpenExternal({ open });
    expect(await go('https://arbre.cardormedia.com/suivi/#t')).toBe(true);
    expect(open).toHaveBeenCalledWith(
      'https://arbre.cardormedia.com/suivi/#t',
      '_blank',
      'noopener,noreferrer',
    );
    expect(await go('https://example.org/')).toBe(false);
    expect(open).toHaveBeenCalledOnce();
  });

  it('sans fenêtre ou si window.open lève : false', async () => {
    expect(await webOpenExternal(undefined)('https://arbre.cardormedia.com/')).toBe(false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const go = webOpenExternal({
      open: () => {
        throw new Error('bloqué');
      },
    });
    expect(await go('https://arbre.cardormedia.com/')).toBe(false);
    warn.mockRestore();
  });

  it('plateforme web : langues et liens injectés', async () => {
    const open = vi.fn(() => null);
    const nav = { languages: ['en-GB', 'fr'] as string[] };
    const p = await createWebPlatform({
      indexedDB: new IDBFactory(),
      localStorage: null,
      storageManager: null,
      useHistory: false,
      navigator: nav,
      opener: { open },
    });
    expect(p.systemLocales()).toEqual(['en-GB', 'fr']);
    nav.languages = ['fr-CA']; // `languagechange` : relu à chaque appel
    expect(p.systemLocales()).toEqual(['fr-CA']);
    expect(await p.openExternal?.('https://cardorinteractive.itch.io/arbre')).toBe(true);
    expect(open).toHaveBeenCalledOnce();
  });

  it('plateforme web sans navigator : aucune langue', async () => {
    const p = await createWebPlatform({
      indexedDB: null,
      localStorage: null,
      storageManager: null,
      useHistory: false,
      navigator: null,
    });
    expect(p.systemLocales()).toEqual([]);
  });
});

describe('plateforme mémoire', () => {
  it('langues injectées (filtrées) et ouverture déléguée, filtrée', async () => {
    const open = vi.fn(async () => true);
    const p = createMemoryPlatform({
      storageWarning: null,
      systemLocales: ['fr-BE', 'nimporte quoi', 'en'],
      openExternal: open,
    });
    expect(p.systemLocales()).toEqual(['fr-BE', 'en']);
    expect(await p.openExternal?.('https://example.org/')).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(await p.openExternal?.('https://arbre.cardormedia.com/suivi/')).toBe(true);
    expect(open).toHaveBeenCalledWith('https://arbre.cardormedia.com/suivi/');
    const failing = createMemoryPlatform({
      storageWarning: null,
      openExternal: async () => {
        throw new Error('x');
      },
    });
    expect(await failing.openExternal?.('https://arbre.cardormedia.com/')).toBe(false);
  });

  it('par défaut : navigator global s’il existe', () => {
    vi.stubGlobal('navigator', { languages: ['de-AT'] });
    try {
      expect(createMemoryPlatform({ storageWarning: null }).systemLocales()).toEqual(['de-AT']);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
