import {
  REPORT_LIMITS,
  REPORT_REF_LIMITS,
  ReportDiagnosticsSchema,
  ReportSubmissionSchema,
  defaultSettings,
  type ReportRef,
} from '@arbre/contract';
import { describe, expect, it } from 'vitest';
import { makeSave } from '../../../platform/__tests__/fixtures';
import { anonymiseSave } from '../anonymise';
import {
  addReportRef,
  bodyBytes,
  buildSubmission,
  fitSubmission,
  formatDelay,
  gameDiagnostics,
  missingChars,
  osFamily,
  refSummary,
  removeReportRef,
  reportText,
} from '../diagnostics';
import { forgetStatus, readStatuses, rememberStatus } from '../status-cache';

const UA_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';

const env = {
  appVersion: '1.1.0',
  edition: 'demo' as const,
  platform: 'android' as const,
  userAgent: UA_ANDROID,
  locale: 'en' as const,
  width: 412.4,
  height: 823,
  dpr: 2.625,
};

describe('diagnostics du jeu', () => {
  it('famille du système, jamais la chaîne User-Agent', () => {
    const d = gameDiagnostics(env);
    expect(d).toEqual({
      appVersion: '1.1.0',
      edition: 'demo',
      platform: 'android',
      os: 'Android',
      // Dans Tauri : le moteur intégré, jamais l'User-Agent complet.
      browser: 'Tauri (WebView Android 129)',
      locale: 'en',
      viewport: { w: 412, h: 823, dpr: 2.63 },
    });
    expect(gameDiagnostics({ ...env, platform: 'web' }).browser).toBe('Chrome 129');
    expect(JSON.stringify(d)).not.toContain('Pixel');
    expect(osFamily('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Windows');
    expect(osFamily('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBe('macOS');
    expect(osFamily('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux');
    expect(osFamily('curl/8')).toBeUndefined();
  });

  it('affaire, empreinte, réglages et sauvegarde anonymisée : valides pour le contrat', () => {
    const save = anonymiseSave(makeSave('slot-1'))!.save;
    const d = gameDiagnostics({
      ...env,
      caseId: 'succession-varenque',
      contentHash: '0123abcd',
      settings: defaultSettings(),
      save,
    });
    expect(d.caseId).toBe('succession-varenque');
    expect(d.contentHash).toBe('0123abcd');
    expect(d.save).toEqual(save);
    expect(ReportDiagnosticsSchema.safeParse(d).success).toBe(true);
  });

  it('valeurs hors contrat écartées (id, empreinte), fenêtre bornée', () => {
    const d = gameDiagnostics({
      ...env,
      caseId: '../etc',
      contentHash: 'zz',
      width: -5,
      height: 1e9,
      dpr: 0,
    });
    expect(d.caseId).toBeUndefined();
    expect(d.contentHash).toBeUndefined();
    expect(d.viewport).toEqual({ w: 0, h: 100_000, dpr: 1 });
  });

  it('corps exact du POST : contact omis s’il est vide, texte rogné', () => {
    const diagnostics = gameDiagnostics(env);
    const base = {
      category: 'blocked' as const,
      description: '   Je ne trouve pas le registre de 1923, aucune piste.  ',
      contact: '  ',
      locale: 'en' as const,
      diagnostics,
      website: '',
      elapsedMs: 4321.7,
    };
    const s = buildSubmission(base);
    expect(s).toEqual({
      source: 'game',
      category: 'blocked',
      description: 'Je ne trouve pas le registre de 1923, aucune piste.',
      locale: 'en',
      diagnostics,
      website: '',
      elapsedMs: 4322,
    });
    expect(ReportSubmissionSchema.safeParse(s).success).toBe(true);
    expect(buildSubmission({ ...base, contact: ' moi@exemple.test ' }).contact).toBe(
      'moi@exemple.test',
    );
  });

  it('corps borné en octets UTF-8 : sauvegarde retirée si elle fait dépasser 64 Ko', () => {
    const form = (save: unknown) =>
      buildSubmission({
        category: 'bug',
        description: 'La carte ne se déplie plus après la loupe, deux fois de suite.',
        contact: '',
        locale: 'fr',
        diagnostics: gameDiagnostics({ ...env, save }),
        website: '',
        elapsedMs: 5000,
      });
    // Sous 48 Ko en caractères (accepté par le contrat), mais au-delà de 64 Ko en octets :
    // « é » pèse deux octets, « 𝔄 » quatre (deux unités UTF-16).
    const heavy = { names: 'é'.repeat(30_000) + '𝔄'.repeat(8_000) };
    expect(JSON.stringify(heavy).length).toBeLessThanOrEqual(REPORT_LIMITS.saveJson);
    const big = form(heavy);
    expect(ReportSubmissionSchema.safeParse(big).success).toBe(true);
    expect(bodyBytes(big)).toBeGreaterThan(REPORT_LIMITS.body);
    const fitted = fitSubmission(big);
    expect(fitted.saveDropped).toBe(true);
    expect(fitted.submission.diagnostics.save).toBeUndefined();
    expect(fitted.submission.description).toBe(big.description);
    expect(bodyBytes(fitted.submission)).toBeLessThanOrEqual(REPORT_LIMITS.body);
    expect(big.diagnostics.save).toBe(heavy); // l'original n'est pas modifié

    // Même nombre de caractères en ASCII : tient, la sauvegarde reste.
    const light = form({ names: 'e'.repeat(24_000) });
    expect(fitSubmission(light)).toEqual({ submission: light, saveDropped: false });
    // Sans sauvegarde : inchangé.
    const none = form(undefined);
    expect(fitSubmission(none, 10)).toEqual({ submission: none, saveDropped: false });
    expect(bodyBytes(none)).toBe(new TextEncoder().encode(JSON.stringify(none)).length);
  });

  it('description : 20 caractères au moins', () => {
    expect(missingChars('')).toBe(20);
    expect(missingChars('   court   ')).toBe(15);
    expect(missingChars('x'.repeat(25))).toBe(0);
  });

  it('rapport à copier : sans contact ni sauvegarde (forum public)', () => {
    const save = anonymiseSave(makeSave('slot-1'))!.save;
    const s = buildSubmission({
      category: 'bug',
      description: 'Le jeu se fige sur la carte quand je zoome.',
      contact: 'secret@exemple.test',
      locale: 'fr',
      diagnostics: gameDiagnostics({ ...env, save }),
      website: '',
      elapsedMs: 5000,
    });
    const text = reportText(
      s,
      {
        heading: 'Signalement',
        category: 'Catégorie :',
        description: 'Description :',
        diagnostics: 'Diagnostics :',
      },
      'Quelque chose ne marche pas',
    );
    expect(text).toContain('Catégorie : Quelque chose ne marche pas (bug)');
    expect(text).toContain('Le jeu se fige sur la carte quand je zoome.');
    expect(text).toContain('"appVersion": "1.1.0"');
    expect(text).not.toContain('secret@exemple.test');
    expect(text).not.toContain('"save"');
    expect(s.diagnostics.save).toBeDefined(); // l'envoi, lui, garde la sauvegarde
  });

  it('références du profil : la plus récente d’abord, sans doublon, 20 au plus', () => {
    const ref = (n: number): ReportRef => ({
      ticket: `AA-${String(n).padStart(4, '0')}`,
      token: 'abcdefghijklmnopqrstuv',
      createdAt: n,
      summary: `n° ${n}`,
    });
    let list: ReportRef[] = [];
    for (let i = 1; i <= 25; i++) list = addReportRef(list, ref(i));
    expect(list).toHaveLength(REPORT_REF_LIMITS.max);
    expect(list[0]!.ticket).toBe('AA-0025');
    expect(addReportRef(list, ref(25))).toHaveLength(20);
    expect(removeReportRef(list, 'AA-0025').map((r) => r.ticket)).not.toContain('AA-0025');
  });

  it('résumé de la référence : une ligne, 80 caractères au plus', () => {
    const s = refSummary('Je suis bloqué', `ligne 1\n\nligne 2 ${'x'.repeat(200)}`);
    expect(s.startsWith('Je suis bloqué · ligne 1 ligne 2')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(REPORT_REF_LIMITS.summary);
    expect(s.endsWith('…')).toBe(true);
  });

  it('délai de Retry-After en clair', () => {
    expect(formatDelay(45, 'fr-FR').replace(/\s/g, ' ')).toBe('45 secondes');
    expect(formatDelay(600, 'en-GB')).toBe('10 minutes');
    expect(formatDelay(7200, 'en-GB')).toBe('2 hours');
  });
});

describe('dernier statut connu', () => {
  function memory() {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    };
  }

  it('mémorise, oublie, et n’écrit jamais le jeton', () => {
    const store = memory();
    rememberStatus(
      {
        ticket: 'AA-0001',
        status: 'fixed',
        fixedIn: 'v1.2.0',
        category: 'bug',
        createdAt: 1,
        updatedAt: 2,
        replies: [],
      },
      99,
      ['AA-0001'],
      store,
    );
    expect(readStatuses(store)).toEqual({
      'AA-0001': { status: 'fixed', fixedIn: 'v1.2.0', seenAt: 99 },
    });
    forgetStatus('AA-0001', store);
    expect(readStatuses(store)).toEqual({});
  });

  it('stockage absent ou illisible : rien, sans exception', () => {
    expect(readStatuses(null)).toEqual({});
    const broken = {
      getItem: () => '{pas du json',
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(readStatuses(broken)).toEqual({});
    expect(() => forgetStatus('AA-0001', broken)).not.toThrow();
  });
});
