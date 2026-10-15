import { describe, expect, it } from 'vitest';
import {
  ConfigError,
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_GITHUB_REPO,
  DEFAULT_PUBLIC_API_URL,
  loadConfig,
} from '../src/config';

describe('loadConfig', () => {
  it('valeurs par défaut', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({
      port: 8090,
      githubRepo: DEFAULT_GITHUB_REPO,
      dataDir: '/data',
      reportsEnabled: true,
      ticketPrefix: 'AA',
      publicSiteUrl: 'https://arbre.cardormedia.com',
    });
    expect(c.githubToken).toBeUndefined();
    expect(c.allowedOrigins).toEqual([...DEFAULT_ALLOWED_ORIGINS]);
  });

  it('lit et normalise les variables', () => {
    const c = loadConfig({
      PORT: '9000',
      GITHUB_TOKEN: 'github_pat_ABCDEFGHIJKLMNOPQRSTUV_0123456789',
      REPORTS_ENABLED: 'false',
      ALLOWED_ORIGINS: ' https://a.example , tauri://localhost ',
      PUBLIC_SITE_URL: 'https://arbre.cardormedia.com/',
      TICKET_PREFIX: 'AB',
      GITHUB_WEBHOOK_SECRET: '',
    });
    expect(c.port).toBe(9000);
    expect(c.reportsEnabled).toBe(false);
    expect(c.allowedOrigins).toEqual(['https://a.example', 'tauri://localhost']);
    expect(c.publicSiteUrl).toBe('https://arbre.cardormedia.com');
    expect(c.webhookSecret).toBeUndefined();
  });

  it('refuse une valeur invalide sans afficher de secret', () => {
    const bad = 'not a token!';
    expect(() => loadConfig({ GITHUB_TOKEN: bad })).toThrow(ConfigError);
    try {
      loadConfig({ GITHUB_TOKEN: bad });
    } catch (e) {
      expect((e as Error).message).not.toContain(bad);
    }
    expect(() => loadConfig({ GITHUB_REPO: 'https://evil.example/x' })).toThrow(ConfigError);
    expect(() => loadConfig({ ALLOWED_ORIGINS: '*' })).toThrow(ConfigError);
    expect(() => loadConfig({ TICKET_PREFIX: 'aa' })).toThrow(ConfigError);
    expect(() => loadConfig({ REPORTS_ENABLED: 'maybe' })).toThrow(ConfigError);
  });

  it('mode dev : base locale et origines de dev', () => {
    const c = loadConfig({}, { dev: true });
    expect(c.dataDir).toBe('.data');
    expect(c.allowedOrigins).toContain('http://localhost:5173');
  });

  it('pièces jointes : secret, base publique de l’API, plafond de stockage', () => {
    const d = loadConfig({});
    expect(d.attachmentSecret).toBeUndefined();
    expect(d.publicApiUrl).toBe(DEFAULT_PUBLIC_API_URL);
    expect(d.attachmentsMaxBytes).toBe(2048 * 1024 * 1024);
    expect(loadConfig({}, { dev: true }).publicApiUrl).toBe('http://localhost:8090');
    const c = loadConfig({
      ATTACHMENT_SECRET: 's'.repeat(40),
      PUBLIC_API_URL: 'https://api.example/',
      ATTACHMENTS_MAX_MB: '10',
    });
    expect(c.attachmentSecret).toBe('s'.repeat(40));
    expect(c.publicApiUrl).toBe('https://api.example');
    expect(c.attachmentsMaxBytes).toBe(10 * 1024 * 1024);
    const short = 'trop-court';
    expect(() => loadConfig({ ATTACHMENT_SECRET: short })).toThrow(ConfigError);
    try {
      loadConfig({ ATTACHMENT_SECRET: short });
    } catch (e) {
      expect((e as Error).message).not.toContain(short);
    }
    expect(() => loadConfig({ PUBLIC_API_URL: 'javascript:alert(1)' })).toThrow(ConfigError);
    expect(() => loadConfig({ ATTACHMENTS_MAX_MB: '0' })).toThrow(ConfigError);
  });
});
