/** Formatage des durées et des dates, dans la langue de l'interface (`Intl`, DESIGN §4.4). */
import { intlLocale, messages } from '../../i18n/index.svelte';

const pad = (n: number) => String(n).padStart(2, '0');

/** Chrono : `mm:ss`, ou `h:mm:ss` au-delà d'une heure. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Durée lisible : « 2 h 05 min », « 12 min », « moins d'une minute » (“2 hr 05 min”…). */
export function formatDuration(ms: number): string {
  const f = messages.format;
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  if (minutes < 1) return f.lessThanMinute;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return f.minutes(m);
  return f.hoursMinutes(h, m);
}

// Formats `Intl` par langue (créés une fois chacun).
const formats = new Map<string, Intl.DateTimeFormat>();
function format(kind: 'dateTime' | 'day'): Intl.DateTimeFormat {
  const locale = intlLocale();
  const key = `${locale}|${kind}`;
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(
      locale,
      kind === 'dateTime' ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'long' },
    );
    formats.set(key, f);
  }
  return f;
}

export function formatDateTime(ts: number): string {
  return format('dateTime').format(new Date(ts));
}

export function formatDay(ts: number): string {
  return format('day').format(new Date(ts));
}

/** Nombre dans la langue de l'interface (« 1,5 » / “1.5”). */
export function formatNumber(n: number): string {
  return n.toLocaleString(intlLocale());
}
