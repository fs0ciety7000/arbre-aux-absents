import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import type { TicketAttachmentSchema } from '../src';
import {
  ATTACHMENT_LIMITS,
  AttachmentReceiptSchema,
  ReportDiagnosticsSchema,
  ReportReceiptSchema,
  ReportSubmissionSchema,
  TicketViewSchema,
  browserFamily,
  osFamily,
  type AttachmentReceipt,
  type ReportDiagnostics,
  type ReportSubmission,
  type TicketAttachment,
} from '../src';

expectTypeOf<z.output<typeof AttachmentReceiptSchema>>().toEqualTypeOf<AttachmentReceipt>();
expectTypeOf<z.output<typeof TicketAttachmentSchema>>().toEqualTypeOf<TicketAttachment>();
expectTypeOf<z.output<typeof ReportDiagnosticsSchema>>().toEqualTypeOf<ReportDiagnostics>();

const ID = 'AbCdEfGhIjKlMnOpQrStUv';
const ID2 = 'zzzzzzzzzzzzzzzzzzzzz_';

function submission(over: Partial<ReportSubmission> = {}): ReportSubmission {
  return {
    source: 'site',
    category: 'display',
    description: 'La carte reste **noire** après le chargement de l’affaire.',
    locale: 'fr',
    diagnostics: {
      appVersion: '1.3.1',
      edition: 'full',
      platform: 'site',
      os: 'Windows',
      browser: 'Firefox 131',
      gameVersion: '1.3.0',
      gamePlatform: 'desktop',
      locale: 'fr',
      viewport: { w: 1280, h: 800, dpr: 1 },
    },
    website: '',
    elapsedMs: 9000,
    ...over,
  };
}

const UA = {
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.2792.65',
  opera:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0',
  safari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  chromeIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1',
  firefoxIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.81 Mobile Safari/537.36',
  webview:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.81 Mobile Safari/537.36',
  webkitgtk: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko)',
  wkwebview:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)',
};

describe('browserFamily : famille et version majeure, jamais l’User-Agent', () => {
  it.each([
    [UA.firefox, 'Firefox 131'],
    [UA.chrome, 'Chrome 129'],
    [UA.edge, 'Edge 129'],
    [UA.opera, 'Opera 114'],
    [UA.safari, 'Safari 18'],
    [UA.safariIos, 'Safari 18'],
    [UA.chromeIos, 'Chrome iOS 129'],
    [UA.firefoxIos, 'Firefox iOS 131'],
    [UA.samsung, 'Samsung Internet 26'],
    [UA.chromeAndroid, 'Chrome 129'],
    [UA.webview, 'WebView Android 129'],
    [UA.webkitgtk, 'WebKit'],
  ])('%s → %s', (ua, expected) => {
    expect(browserFamily(ua)).toBe(expected);
  });

  it('inconnu ou vide : undefined', () => {
    expect(browserFamily('curl/8.9.1')).toBeUndefined();
    expect(browserFamily('')).toBeUndefined();
  });

  it('Tauri : moteur intégré nommé selon le système', () => {
    expect(browserFamily(UA.webkitgtk, { tauri: true })).toBe('Tauri (WebKitGTK)');
    expect(browserFamily(UA.wkwebview, { tauri: true })).toBe('Tauri (WKWebView)');
    expect(browserFamily(UA.edge, { tauri: true })).toBe('Tauri (WebView2 129)');
    expect(browserFamily(UA.webview, { tauri: true })).toBe('Tauri (WebView Android 129)');
    expect(browserFamily('', { tauri: true })).toBe('Tauri');
  });

  it('toujours ≤ 40 caractères (contrat) et sans détail de build', () => {
    for (const ua of Object.values(UA)) {
      for (const tauri of [false, true]) {
        const b = browserFamily(ua, { tauri });
        if (b === undefined) continue;
        expect(b.length).toBeLessThanOrEqual(40);
        expect(b).not.toMatch(/\d+\.\d+/);
      }
    }
    expect(browserFamily(`Firefox/1${'0'.repeat(600)}`)).toBe('Firefox');
  });

  it('osFamily partagé', () => {
    expect(osFamily(UA.webview)).toBe('Android');
    expect(osFamily(UA.safariIos)).toBe('iOS');
    expect(osFamily(UA.edge)).toBe('Windows');
    expect(osFamily(UA.safari)).toBe('macOS');
    expect(osFamily(UA.firefox)).toBe('Linux');
    expect(osFamily('curl/8')).toBeUndefined();
  });
});

describe('contrat des diagnostics', () => {
  it('browser, gameVersion et gamePlatform depuis le site', () => {
    expect(ReportSubmissionSchema.safeParse(submission()).success).toBe(true);
  });

  it('gameVersion et gamePlatform refusés hors du site', () => {
    const s = submission();
    const game = { ...s.diagnostics, platform: 'web' as const };
    expect(ReportDiagnosticsSchema.safeParse(game).success).toBe(false);
    const { gameVersion: _v, gamePlatform: _p, ...rest } = game;
    expect(ReportDiagnosticsSchema.safeParse(rest).success).toBe(true);
  });

  it.each(['1.3', 'v1.3.0', '1.3.0 ', '1.3.0-<b>', 'latest'])('gameVersion « %s » refusée', (v) => {
    const s = submission();
    expect(ReportDiagnosticsSchema.safeParse({ ...s.diagnostics, gameVersion: v }).success).toBe(
      false,
    );
  });

  it('gamePlatform inconnue ou browser trop long : refusés', () => {
    const d = submission().diagnostics;
    expect(ReportDiagnosticsSchema.safeParse({ ...d, gamePlatform: 'site' }).success).toBe(false);
    expect(ReportDiagnosticsSchema.safeParse({ ...d, browser: 'x'.repeat(41) }).success).toBe(
      false,
    );
    expect(ReportDiagnosticsSchema.safeParse({ ...d, gameVersion: '1.4.0-beta.2' }).success).toBe(
      true,
    );
  });
});

describe('contrat des pièces jointes', () => {
  it('jusqu’à 3 identifiants distincts', () => {
    const ok = (attachments: string[]) =>
      ReportSubmissionSchema.safeParse(submission({ attachments })).success;
    expect(ok([])).toBe(true);
    expect(ok([ID, ID2])).toBe(true);
    expect(ok([ID, ID])).toBe(false);
    expect(ok(['court'])).toBe(false);
    expect(ok([ID, ID2, 'A'.repeat(22), 'B'.repeat(22)])).toBe(false);
    expect(ATTACHMENT_LIMITS.perReport).toBe(3);
  });

  it('reçu de pièce et vue de ticket', () => {
    const receipt: AttachmentReceipt = {
      id: ID,
      type: 'image/png',
      width: 1280,
      height: 720,
      bytes: 34_000,
      expiresAt: 1_760_000_000_000,
    };
    expect(AttachmentReceiptSchema.parse(receipt)).toEqual(receipt);
    expect(AttachmentReceiptSchema.safeParse({ ...receipt, type: 'image/gif' }).success).toBe(
      false,
    );
    expect(AttachmentReceiptSchema.safeParse({ ...receipt, width: 9000 }).success).toBe(false);
    const att: TicketAttachment = {
      id: ID,
      url: `https://arbre-api.cardormedia.com/v1/attachments/${ID}?sig=abc`,
      type: 'image/webp',
      width: 10,
      height: 10,
    };
    const view = {
      ticket: 'AA-0042',
      status: 'received',
      category: 'bug',
      createdAt: 1,
      updatedAt: 1,
      replies: [],
      attachments: [att],
    };
    expect(TicketViewSchema.safeParse(view).success).toBe(true);
    expect(
      TicketViewSchema.safeParse({ ...view, attachments: [{ ...att, url: 'javascript:1' }] })
        .success,
    ).toBe(false);
    expect(
      ReportReceiptSchema.safeParse({
        ticket: 'AA-0042',
        token: 'abcdefghijklmnopqrstuv',
        followUrl: 'https://arbre.cardormedia.com/suivi/#abcdefghijklmnopqrstuv',
        attachments: 2,
      }).success,
    ).toBe(true);
  });
});
