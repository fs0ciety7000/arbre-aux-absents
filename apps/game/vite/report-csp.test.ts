import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tauriConnectSrc, tauriCspProblem } from './report-csp';
import { DEFAULT_REPORT_API, reportOrigin } from './splash';

const API = 'https://arbre-api.cardormedia.com';
const conf = (csp: unknown) => ({ app: { security: { csp } } });

describe('CSP Tauri et VITE_REPORT_API', () => {
  it('le tauri.conf.json du dépôt autorise le service par défaut', () => {
    const real: unknown = JSON.parse(
      readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
    );
    expect(tauriCspProblem(real, reportOrigin(undefined))).toBeNull();
    expect(reportOrigin(undefined)).toBe(DEFAULT_REPORT_API);
  });

  it('origine absente : erreur qui nomme les deux réglages', () => {
    const c = conf({ 'connect-src': `'self' ipc: ${API}` });
    expect(tauriCspProblem(c, API)).toBeNull();
    const problem = tauriCspProblem(c, reportOrigin('https://staging-api.example.org/v1'));
    expect(problem).toContain('https://staging-api.example.org');
    expect(problem).toContain('tauri.conf.json');
    // Préfixe trompeur : refusé (comparaison d'origine exacte).
    expect(tauriCspProblem(c, 'https://arbre-api.cardormedia.com.evil.example')).not.toBeNull();
  });

  it('CSP en chaîne, en tableau, ou sans connect-src', () => {
    expect(tauriConnectSrc(conf(`default-src 'self'; connect-src 'self' ${API}`))).toEqual([
      "'self'",
      API,
    ]);
    expect(tauriConnectSrc(conf({ 'connect-src': ["'self'", API] }))).toEqual(["'self'", API]);
    expect(tauriConnectSrc(conf({ 'default-src': "'self'" }))).toBeNull();
    expect(tauriCspProblem({}, API)).toMatch(/aucune directive connect-src/);
  });
});
