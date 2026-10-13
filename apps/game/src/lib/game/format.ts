/** Formatage des durées et des dates (fr-FR). */

const pad = (n: number) => String(n).padStart(2, '0');

/** Chrono : `mm:ss`, ou `h:mm:ss` au-delà d'une heure. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Durée lisible : « 2 h 05 min », « 12 min », « moins d'une minute ». */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  if (minutes < 1) return "moins d'une minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${pad(m)} min`;
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export function formatDateTime(ts: number): string {
  return dateFormat.format(new Date(ts));
}

export function formatDay(ts: number): string {
  return dayFormat.format(new Date(ts));
}
