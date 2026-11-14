import { ar } from '@/i18n/ar';
import type { Match } from '@/types/football';

const timeFormatter = new Intl.DateTimeFormat('ar', {
  hour: '2-digit',
  minute: '2-digit',
  numberingSystem: 'latn',
});

const dateFormatter = new Intl.DateTimeFormat('ar', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  numberingSystem: 'latn',
});

export function formatKickoffTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatLongDate(date: Date | string): string {
  return dateFormatter.format(typeof date === 'string' ? new Date(date) : date);
}

/** Short status label shown in the match card's center column. */
export function matchStatusLabel(match: Match): string {
  if (match.status === 'scheduled') return formatKickoffTime(match.kickoff);
  if (match.phase === 'half_time') return ar.phase.half_time;
  if (match.status === 'live') return match.minute != null ? `${match.minute}'` : ar.filters.live;
  if (match.phase === 'finished_pen') return 'ر.ت';
  if (match.phase === 'finished_aet') return 'ب.ت';
  return ar.filters.finished;
}

export function formatMinute(minute: number, extra?: number): string {
  return extra ? `${minute}+${extra}'` : `${minute}'`;
}

/** Signed goal difference, wrapped so the sign stays next to the number in RTL. */
export function formatGoalDiff(diff: number): string {
  const s = diff > 0 ? `+${diff}` : `${diff}`;
  return `⁦${s}⁩`; // LTR isolate
}

const ARABIC_WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** "السبت، 14/11/2026" — Latin digits, matching the design. */
export function formatDayTitle(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${ARABIC_WEEKDAYS[date.getDay()]}، ${d}/${m}/${date.getFullYear()}`;
}

/** Kick-off time: "07:45 م" (12h, Arabic AM/PM marker) or "19:45" (24h). */
export function formatKickoff(iso: string, format: '12h' | '24h' = '12h'): string {
  const date = new Date(iso);
  const h24 = date.getHours();
  if (format === '24h') return `${String(h24).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${String(h12).padStart(2, '0')}:${mm} ${h24 < 12 ? 'ص' : 'م'}`;
}

/** Kick-off in GMT +0 regardless of the device zone: "06:45 م" / "18:45". */
export function formatKickoffUtc(iso: string, format: '12h' | '24h' = '12h'): string {
  const date = new Date(iso);
  const h24 = date.getUTCHours();
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  if (format === '24h') return `${String(h24).padStart(2, '0')}:${mm}`;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${h24 < 12 ? 'ص' : 'م'}`;
}

/** Calendar day in GMT +0 ("السبت، 14/11/2026"). */
export function formatDayTitleUtc(iso: string): string {
  const date = new Date(iso);
  return formatDayTitle(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** "منذ 5 د" style relative time. */
export function formatRelative(timestamp: number, now: number = Date.now()): string {
  const min = Math.floor((now - timestamp) / 60_000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} د`;
  const h = Math.floor(min / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}
