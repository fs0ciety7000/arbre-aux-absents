import { z } from 'zod';

/**
 * Configuration du service (variables d'environnement, ARCHITECTURE §8, `.env.example`).
 * Tout est validé au démarrage : une valeur invalide arrête le service avec un message clair,
 * sans jamais afficher la valeur d'un secret.
 */
export const DEFAULT_GITHUB_REPO = 'fs0ciety7000/arbre-aux-absents-signalements';
export const DEFAULT_ALLOWED_ORIGINS = [
  'https://arbre.cardormedia.com',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://html-classic.itch.zone',
] as const;
/** Origines ajoutées en dev (`npm run dev:report`) : jeu (5173) et site (5174). */
export const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'] as const;

export interface Config {
  host: string;
  port: number;
  /** Absent : aucun appel à GitHub, tout reste dans la file `pending` (dev, panne de jeton). */
  githubToken?: string;
  githubRepo: string;
  /** Absent : le webhook répond 503. */
  webhookSecret?: string;
  allowedOrigins: readonly string[];
  publicSiteUrl: string;
  dataDir: string;
  reportsEnabled: boolean;
  ticketPrefix: string;
  /**
   * Clé des URL signées des pièces jointes. Absent : dérivée de `webhookSecret` (HMAC à contexte
   * propre), ou aléatoire en mémoire sans l'un ni l'autre (dev).
   */
  attachmentSecret?: string;
  /** Base publique du service, pour les URL signées des pièces (`…/v1/attachments/<id>?sig=`). */
  publicApiUrl: string;
  /** Plafond de stockage de toutes les pièces, en octets (au-delà : 503 `unavailable`). */
  attachmentsMaxBytes: number;
}

export const DEFAULT_PUBLIC_API_URL = 'https://arbre-api.cardormedia.com';

const Bool = z
  .enum(['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'])
  .transform((v) => v === 'true' || v === '1' || v === 'yes' || v === 'on');

const OriginSchema = z
  .string()
  .regex(/^(https?|tauri):\/\/[a-z0-9.-]+(:\d{1,5})?$/, { error: 'Origine invalide' });

const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const EnvSchema = z.object({
  HOST: z.preprocess(blankToUndefined, z.string().min(1).default('0.0.0.0')),
  PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(65535).default(8090)),
  GITHUB_TOKEN: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^[A-Za-z0-9_]{20,255}$/, { error: 'format inattendu' })
      .optional(),
  ),
  GITHUB_REPO: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/, { error: 'owner/repo attendu' })
      .default(DEFAULT_GITHUB_REPO),
  ),
  GITHUB_WEBHOOK_SECRET: z.preprocess(blankToUndefined, z.string().min(16).optional()),
  ALLOWED_ORIGINS: z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      )
      .pipe(z.array(OriginSchema).min(1))
      .optional(),
  ),
  PUBLIC_SITE_URL: z.preprocess(
    blankToUndefined,
    z
      .url({ protocol: /^https?$/ })
      .transform((u) => u.replace(/\/+$/, ''))
      .default('https://arbre.cardormedia.com'),
  ),
  DATA_DIR: z.preprocess(blankToUndefined, z.string().min(1).default('/data')),
  REPORTS_ENABLED: z.preprocess(blankToUndefined, Bool.default(true)),
  ATTACHMENT_SECRET: z.preprocess(
    blankToUndefined,
    z.string().min(32, { error: '32 caractères au moins' }).optional(),
  ),
  PUBLIC_API_URL: z.preprocess(
    blankToUndefined,
    z
      .url({ protocol: /^https?$/ })
      .transform((u) => u.replace(/\/+$/, ''))
      .optional(),
  ),
  ATTACHMENTS_MAX_MB: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).max(1_000_000).default(2048),
  ),
  TICKET_PREFIX: z.preprocess(
    blankToUndefined,
    z
      .string()
      .regex(/^[A-Z]{1,8}$/, { error: '1 à 8 capitales' })
      .default('AA'),
  ),
});

export class ConfigError extends Error {}

export function loadConfig(
  env: Record<string, string | undefined> = process.env,
  opts: { dev?: boolean } = {},
): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    // Seuls le nom de la variable et la raison sont affichés, jamais la valeur.
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`);
    throw new ConfigError(`Configuration invalide\n  ${issues.join('\n  ')}`);
  }
  const e = parsed.data;
  const origins = e.ALLOWED_ORIGINS ?? [...DEFAULT_ALLOWED_ORIGINS];
  return {
    host: e.HOST,
    port: e.PORT,
    githubToken: e.GITHUB_TOKEN,
    githubRepo: e.GITHUB_REPO,
    webhookSecret: e.GITHUB_WEBHOOK_SECRET,
    allowedOrigins: opts.dev ? [...new Set([...origins, ...DEV_ORIGINS])] : origins,
    publicSiteUrl: e.PUBLIC_SITE_URL,
    dataDir: opts.dev && env.DATA_DIR === undefined ? '.data' : e.DATA_DIR,
    reportsEnabled: e.REPORTS_ENABLED,
    ticketPrefix: e.TICKET_PREFIX,
    attachmentSecret: e.ATTACHMENT_SECRET,
    publicApiUrl:
      e.PUBLIC_API_URL ?? (opts.dev ? `http://localhost:${e.PORT}` : DEFAULT_PUBLIC_API_URL),
    attachmentsMaxBytes: e.ATTACHMENTS_MAX_MB * 1024 * 1024,
  };
}
