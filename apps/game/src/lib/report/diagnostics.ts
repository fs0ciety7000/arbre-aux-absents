/**
 * Ce que le jeu joint à un signalement (ARCHITECTURE §8, DESIGN §13.8) : diagnostics, corps exact
 * du `POST /v1/reports`, texte de repli à copier, référence gardée dans le profil. Module pur
 * (aucun accès au DOM : l'écran lui passe la fenêtre, le navigateur et la partie).
 */
import {
  CONTENT_HASH,
  REPORT_LIMITS,
  REPORT_REF_LIMITS,
  type Edition,
  type Locale,
  type PlatformKind,
  type ReportCategory,
  type ReportDiagnostics,
  type ReportRef,
  type ReportSubmission,
  type Settings,
  browserFamily,
  osFamily,
} from '@arbre/contract';

/** Famille grossière du système et du navigateur : dans le contrat (partagées jeu/site). */
export { browserFamily, osFamily };

export interface GameEnvironment {
  appVersion: string;
  edition: Edition;
  platform: PlatformKind;
  userAgent: string;
  locale: Locale;
  width: number;
  height: number;
  dpr: number;
  /** Affaire en cours (ou celle de la sauvegarde jointe). */
  caseId?: string;
  contentHash?: string;
  settings?: Settings;
  /** Sauvegarde déjà anonymisée (`anonymiseSave`), seulement si la case est cochée. */
  save?: unknown;
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const clampSide = (n: number) => Math.max(0, Math.min(100_000, Math.round(n) || 0));

/** Diagnostics d'un signalement envoyé depuis le jeu. */
export function gameDiagnostics(env: GameEnvironment): ReportDiagnostics {
  const os = osFamily(env.userAgent);
  // Dans Tauri (ordinateur, Android), le moteur intégré est nommé : « Tauri (WebView2 129) ».
  const browser = browserFamily(env.userAgent, { tauri: env.platform !== 'web' });
  const out: ReportDiagnostics = {
    appVersion: env.appVersion.slice(0, 40),
    edition: env.edition,
    platform: env.platform,
    ...(os ? { os } : {}),
    ...(browser ? { browser: browser.slice(0, 40) } : {}),
    locale: env.locale,
    viewport: {
      w: clampSide(env.width),
      h: clampSide(env.height),
      dpr: Math.min(16, Math.max(0.1, Math.round((env.dpr || 1) * 100) / 100)),
    },
  };
  if (env.caseId && ID.test(env.caseId) && env.caseId.length <= 64) out.caseId = env.caseId;
  if (env.contentHash && CONTENT_HASH.test(env.contentHash)) out.contentHash = env.contentHash;
  // Copie simple (les réglages de l'app sont un proxy réactif, non clonable par structuredClone).
  if (env.settings) out.settings = JSON.parse(JSON.stringify(env.settings)) as Settings;
  if (env.save !== undefined) out.save = env.save;
  return out;
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
  const contact = input.contact.trim().slice(0, REPORT_LIMITS.contact);
  return {
    source: 'game',
    category: input.category,
    description: input.description.trim().slice(0, REPORT_LIMITS.descriptionMax),
    ...(contact ? { contact } : {}),
    locale: input.locale,
    diagnostics: input.diagnostics,
    website: input.website,
    elapsedMs: Math.max(0, Math.round(input.elapsedMs)),
    ...(input.attachments?.length ? { attachments: [...input.attachments] } : {}),
  };
}

/** Taille du corps envoyé (`JSON.stringify`, comme `submitReport`), en octets UTF-8. */
export function bodyBytes(submission: ReportSubmission): number {
  return new TextEncoder().encode(JSON.stringify(submission)).length;
}

/**
 * Corps borné à `REPORT_LIMITS.body` octets UTF-8 (le service refuse au-delà, 413) : si la
 * sauvegarde jointe fait dépasser, elle est retirée (`saveDropped`) et l'écran le dit. La limite
 * de la sauvegarde est en caractères (48 Ko) : des noms accentués peuvent doubler son poids.
 */
export function fitSubmission(
  submission: ReportSubmission,
  maxBytes: number = REPORT_LIMITS.body,
): { submission: ReportSubmission; saveDropped: boolean } {
  if (submission.diagnostics.save === undefined || bodyBytes(submission) <= maxBytes) {
    return { submission, saveDropped: false };
  }
  const diagnostics: ReportDiagnostics = { ...submission.diagnostics };
  delete diagnostics.save;
  return { submission: { ...submission, diagnostics }, saveDropped: true };
}

/** Caractères qui manquent à la description pour être envoyée (0 : prête). */
export function missingChars(description: string): number {
  return Math.max(0, REPORT_LIMITS.descriptionMin - description.trim().length);
}

export interface ReportTextLabels {
  heading: string;
  category: string;
  description: string;
  diagnostics: string;
}

/**
 * Rapport en texte brut à copier (forum itch.io quand le service ne répond pas). Sans le contact,
 * le pot de miel ni la sauvegarde jointe : le forum est public.
 */
export function reportText(
  submission: ReportSubmission,
  labels: ReportTextLabels,
  categoryLabel: string,
): string {
  const diagnostics: ReportDiagnostics = { ...submission.diagnostics };
  delete diagnostics.save;
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

/** Résumé gardé dans `Profile.reports` (≤ 80 caractères, une ligne). */
export function refSummary(categoryLabel: string, description: string): string {
  const text = `${categoryLabel} · ${description.replace(/\s+/g, ' ').trim()}`;
  const max = REPORT_REF_LIMITS.summary;
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Ajoute une référence en tête (la plus récente d'abord), sans doublon, 20 au plus. */
export function addReportRef(list: readonly ReportRef[] | undefined, ref: ReportRef): ReportRef[] {
  return [ref, ...(list ?? []).filter((r) => r.ticket !== ref.ticket)].slice(
    0,
    REPORT_REF_LIMITS.max,
  );
}

/** Retire une référence (signalement supprimé ou introuvable). */
export function removeReportRef(
  list: readonly ReportRef[] | undefined,
  ticket: string,
): ReportRef[] {
  return (list ?? []).filter((r) => r.ticket !== ticket);
}

/** Délai d'un `Retry-After` en clair : « 45 secondes », « 12 minutes », « 2 heures ». */
export function formatDelay(seconds: number, intl: string): string {
  const fmt = (n: number, unit: 'second' | 'minute' | 'hour') =>
    new Intl.NumberFormat(intl, { style: 'unit', unit, unitDisplay: 'long' }).format(n);
  if (seconds < 60) return fmt(Math.max(1, Math.ceil(seconds)), 'second');
  if (seconds < 3600) return fmt(Math.ceil(seconds / 60), 'minute');
  return fmt(Math.ceil(seconds / 3600), 'hour');
}
