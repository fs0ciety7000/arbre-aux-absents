/**
 * Ce que le formulaire du site envoie (DESIGN §14.6 : plateforme `site`, langue, fenêtre ; aucun
 * diagnostic de partie), son texte de repli à copier et quelques mises en forme. Module pur.
 */
import type {
  GamePlatform,
  Locale,
  ReportCategory,
  ReportDiagnostics,
  ReportSubmission,
} from '@arbre/contract';
// Sous-chemin sans zod : l'entrée du contrat construit ses schémas au chargement, et zod 4 y sonde
// `Function('')` (compilation à la volée), refusé par la CSP du site (`script-src` sans
// `'unsafe-eval'`). Ce module est client : rien d'autre que des types depuis `@arbre/contract`.
import { browserFamily, osFamily } from '@arbre/contract/user-agent';
import { GAME_PLATFORMS, GAME_VERSION, LIMITS } from './constants';

/** Familles grossières du système et du navigateur : dans le contrat (partagées jeu/site). */
export { browserFamily, osFamily };

export interface SiteEnvironment {
  appVersion: string;
  locale: Locale;
  userAgent: string;
  width: number;
  height: number;
  dpr: number;
  /** Version du jeu déclarée par le joueur (semver), omise si vide ou mal formée. */
  gameVersion?: string;
  /** Plateforme du jeu déclarée par le joueur, omise si « je ne sais pas ». */
  gamePlatform?: GamePlatform | '';
}

/** Version déclarée valable pour le service (semver, ≤ 40 caractères), sinon `undefined`. */
export function declaredVersion(value: string | undefined): string | undefined {
  const v = (value ?? '').trim().replace(/^v(?=\d)/i, '');
  return v && v.length <= 40 && GAME_VERSION.test(v) ? v : undefined;
}

/** Diagnostics d'un signalement envoyé depuis le site. */
export function siteDiagnostics(env: SiteEnvironment): ReportDiagnostics {
  const os = osFamily(env.userAgent);
  const browser = browserFamily(env.userAgent);
  const gameVersion = declaredVersion(env.gameVersion);
  const gamePlatform = (GAME_PLATFORMS as readonly string[]).includes(env.gamePlatform ?? '')
    ? (env.gamePlatform as GamePlatform)
    : undefined;
  const clamp = (n: number) => Math.max(0, Math.min(100_000, Math.round(n) || 0));
  return {
    appVersion: env.appVersion.slice(0, 40),
    edition: 'full',
    platform: 'site',
    ...(os ? { os } : {}),
    ...(browser ? { browser: browser.slice(0, 40) } : {}),
    ...(gameVersion ? { gameVersion } : {}),
    ...(gamePlatform ? { gamePlatform } : {}),
    locale: env.locale,
    viewport: {
      w: clamp(env.width),
      h: clamp(env.height),
      dpr: Math.min(16, Math.max(0.1, Math.round((env.dpr || 1) * 100) / 100)),
    },
  };
}

export interface FormInput {
  category: ReportCategory;
  description: string;
  contact: string;
  locale: Locale;
  diagnostics: ReportDiagnostics;
  /** Pot de miel. */
  website: string;
  elapsedMs: number;
  /** Captures déjà envoyées (`POST /v1/attachments`), dans l'ordre ; omises si aucune. */
  attachments?: readonly string[];
}

/** Corps exact du POST /v1/reports (contact et captures omis s'ils sont vides). */
export function buildSubmission(input: FormInput): ReportSubmission {
  const contact = input.contact.trim().slice(0, LIMITS.contact);
  return {
    source: 'site',
    category: input.category,
    description: input.description.trim().slice(0, LIMITS.descriptionMax),
    ...(contact ? { contact } : {}),
    locale: input.locale,
    diagnostics: input.diagnostics,
    website: input.website,
    elapsedMs: Math.max(0, Math.round(input.elapsedMs)),
    ...(input.attachments?.length ? { attachments: [...input.attachments] } : {}),
  };
}

/** Caractères qui manquent à la description pour être envoyée (0 : prête). */
export function missingChars(description: string): number {
  return Math.max(0, LIMITS.descriptionMin - description.trim().length);
}

/**
 * Rapport en texte brut à copier (forum itch.io quand le service ne répond pas). Sans le contact
 * ni le pot de miel : le forum est public.
 */
export function reportText(
  submission: ReportSubmission,
  labels: { heading: string; category: string; description: string; diagnostics: string },
  categoryLabel: string,
): string {
  const { diagnostics } = submission;
  return [
    labels.heading,
    '',
    `${labels.category} ${categoryLabel} (${submission.category})`,
    '',
    labels.description,
    submission.description,
    '',
    labels.diagnostics,
    JSON.stringify(diagnostics, null, 2),
  ].join('\n');
}

/** Remplit un gabarit du catalogue : `fill('Dans {n} min', { n: 3 })`. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Formats `Intl` de la langue de la page (anglais britannique). */
const INTL: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' };

export function formatDate(at: number, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL[locale], { dateStyle: 'long' }).format(at);
}

/** Délai d'un `Retry-After` en clair : « 45 secondes », « 12 minutes », « 2 heures ». */
export function formatDelay(seconds: number, locale: Locale): string {
  const fmt = (n: number, unit: 'second' | 'minute' | 'hour') =>
    new Intl.NumberFormat(INTL[locale], { style: 'unit', unit, unitDisplay: 'long' }).format(n);
  if (seconds < 60) return fmt(Math.max(1, Math.ceil(seconds)), 'second');
  if (seconds < 3600) return fmt(Math.ceil(seconds / 60), 'minute');
  return fmt(Math.ceil(seconds / 3600), 'hour');
}
