import { describe, expect, it } from 'vitest';
import { RateLimiter, readRules, reportRules } from '../src/ratelimit';
import { Clock } from './helpers';

const HOUR = 3_600_000;

describe('RateLimiter', () => {
  it('5 signalements par heure et par clé, puis Retry-After', () => {
    const clock = new Clock();
    const rl = new RateLimiter(clock.now);
    const key = rl.clientKey('203.0.113.7');
    for (let i = 0; i < 5; i++) expect(rl.hit(reportRules(key)).ok).toBe(true);
    const r = rl.hit(reportRules(key));
    expect(r).toEqual({ ok: false, retryAfterSec: 3600 });
    clock.advance(HOUR);
    expect(rl.hit(reportRules(key)).ok).toBe(true);
  });

  it('20 par jour par clé', () => {
    const clock = new Clock(Date.UTC(2026, 9, 15, 0, 0, 0));
    const rl = new RateLimiter(clock.now);
    let ok = 0;
    for (let h = 0; h < 6; h++) {
      const key = rl.clientKey('198.51.100.1');
      for (let i = 0; i < 5; i++) if (rl.hit(reportRules(key)).ok) ok++;
      clock.advance(HOUR);
    }
    expect(ok).toBe(20);
  });

  it('plafond global de 60 par heure, tous clients confondus', () => {
    const clock = new Clock();
    const rl = new RateLimiter(clock.now);
    let ok = 0;
    for (let i = 0; i < 70; i++) if (rl.hit(reportRules(rl.clientKey(`10.0.0.${i}`))).ok) ok++;
    expect(ok).toBe(60);
  });

  it('60 lectures par minute', () => {
    const clock = new Clock();
    const rl = new RateLimiter(clock.now);
    const key = rl.clientKey('192.0.2.5');
    for (let i = 0; i < 60; i++) expect(rl.hit(readRules(key)).ok).toBe(true);
    expect(rl.hit(readRules(key))).toEqual({ ok: false, retryAfterSec: 60 });
  });

  it('vérification sans consommer', () => {
    const rl = new RateLimiter(new Clock().now);
    const key = rl.clientKey('192.0.2.9');
    for (let i = 0; i < 10; i++) expect(rl.hit(reportRules(key), false).ok).toBe(true);
    expect(rl.size).toBe(0);
  });

  it('aucune IP en clair en mémoire ; clé renouvelée chaque jour', () => {
    const clock = new Clock();
    const rl = new RateLimiter(clock.now);
    const ip = '203.0.113.42';
    const k1 = rl.clientKey(ip);
    expect(k1).not.toContain(ip);
    expect(rl.clientKey(ip)).toBe(k1);
    rl.hit(reportRules(k1));
    expect(rl.keys().join(' ')).not.toContain(ip);
    expect(JSON.stringify(rl)).not.toContain(ip);
    clock.advance(24 * HOUR);
    const k2 = rl.clientKey(ip);
    expect(k2).not.toBe(k1);
    // Les fenêtres par client sont oubliées ; la fenêtre globale reste.
    expect(rl.keys()).toEqual(['report-g|*']);
  });
});
