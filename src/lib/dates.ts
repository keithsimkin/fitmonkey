import { format, parseISO } from 'date-fns';

/** Stable per-day key in local time, e.g. "2026-06-30". */
export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDayKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return dayKey(new Date());
}
