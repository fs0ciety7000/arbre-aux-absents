import { z } from 'zod';
import { MsSchema } from './ids';

/*
 * Référence d'un signalement gardée dans le profil (`Profile.reports`). Séparée de `report.ts`
 * pour éviter un cycle d'imports `settings` ⇄ `report` (les deux exposent des schémas zod).
 */

/** Numéro de ticket propre au service : `<PRÉFIXE>-0042`. */
export const TICKET_NUMBER = /^[A-Z]{1,8}-\d{4,}$/;
/** Jeton de suivi : 128 bits en base64url (22 caractères). */
export const REPORT_TOKEN = /^[A-Za-z0-9_-]{22}$/;

export const REPORT_REF_LIMITS = {
  /** Références gardées dans `Profile.reports` (« Mes signalements »). */
  max: 20,
  summary: 80,
} as const;

/** Référence gardée dans le profil (« Mes signalements », ≤ 20). */
export interface ReportRef {
  ticket: string;
  token: string;
  createdAt: number;
  /** ≤ 80 */
  summary: string;
}

export const TicketNumberSchema = z.string().regex(TICKET_NUMBER);
export const ReportTokenSchema = z.string().regex(REPORT_TOKEN);

export const ReportRefSchema = z.strictObject({
  ticket: TicketNumberSchema,
  token: ReportTokenSchema,
  createdAt: MsSchema,
  summary: z.string().max(REPORT_REF_LIMITS.summary),
});
