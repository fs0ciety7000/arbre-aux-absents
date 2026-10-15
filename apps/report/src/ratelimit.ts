import { createHmac, randomBytes } from 'node:crypto';

/**
 * Limitation de débit **en mémoire seulement** (ARCHITECTURE §8). La clé d'un client est un HMAC
 * de son IP avec un secret aléatoire tiré en mémoire et renouvelé chaque jour (UTC) : l'IP n'est
 * jamais conservée, ni écrite, ni journalisée, et la clé ne permet pas de la retrouver.
 */

export interface Rule {
  bucket: string;
  /** Clé client (HMAC) ; `*` pour un plafond global. */
  key: string;
  max: number;
  windowMs: number;
}

export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const LIMITS = {
  reportPerHour: { max: 5, windowMs: HOUR },
  reportPerDay: { max: 20, windowMs: DAY },
  reportGlobalPerHour: { max: 60, windowMs: HOUR },
  readPerMinute: { max: 60, windowMs: 60_000 },
} as const;

/** Au-delà, les fenêtres expirées sont purgées (protection mémoire). */
const MAX_ENTRIES = 100_000;

interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private secret = randomBytes(32);
  private day: number;
  private readonly windows = new Map<string, Window>();

  constructor(private readonly now: () => number) {
    this.day = Math.floor(now() / DAY);
  }

  /** Clé opaque d'un client. Renouvelle le secret (et oublie les compteurs par client) chaque jour. */
  clientKey(ip: string): string {
    this.rotateIfNeeded();
    return createHmac('sha256', this.secret).update(ip).digest('base64url').slice(0, 22);
  }

  /** Vérifie toutes les règles ; si `consume`, et seulement si toutes passent, les incrémente. */
  hit(rules: readonly Rule[], consume = true): LimitResult {
    this.rotateIfNeeded();
    const t = this.now();
    let retryAt = 0;
    for (const r of rules) {
      const w = this.windows.get(`${r.bucket}|${r.key}`);
      if (w && w.resetAt > t && w.count >= r.max) retryAt = Math.max(retryAt, w.resetAt);
    }
    if (retryAt > 0)
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((retryAt - t) / 1000)) };
    if (consume) {
      if (this.windows.size > MAX_ENTRIES) this.prune(t);
      for (const r of rules) {
        const id = `${r.bucket}|${r.key}`;
        const w = this.windows.get(id);
        if (!w || w.resetAt <= t) this.windows.set(id, { count: 1, resetAt: t + r.windowMs });
        else w.count += 1;
      }
    }
    return { ok: true };
  }

  /** Nombre de fenêtres en mémoire (tests, `/healthz` éventuel). */
  get size(): number {
    return this.windows.size;
  }

  /** Clés de fenêtres en mémoire, pour vérifier en test qu'aucune IP n'y figure. */
  keys(): string[] {
    return [...this.windows.keys()];
  }

  private prune(t: number): void {
    for (const [id, w] of this.windows) if (w.resetAt <= t) this.windows.delete(id);
  }

  private rotateIfNeeded(): void {
    const day = Math.floor(this.now() / DAY);
    if (day === this.day) return;
    this.day = day;
    this.secret = randomBytes(32);
    // Les anciennes clés ne correspondent plus à personne : seules les fenêtres globales restent.
    for (const id of this.windows.keys()) if (!id.endsWith('|*')) this.windows.delete(id);
  }
}

export function reportRules(key: string): Rule[] {
  return [
    { bucket: 'report-h', key, ...LIMITS.reportPerHour },
    { bucket: 'report-d', key, ...LIMITS.reportPerDay },
    { bucket: 'report-g', key: '*', ...LIMITS.reportGlobalPerHour },
  ];
}

export function readRules(key: string): Rule[] {
  return [{ bucket: 'read', key, ...LIMITS.readPerMinute }];
}
