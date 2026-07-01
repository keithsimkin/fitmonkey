import { subDays, isSameDay } from 'date-fns';
import type { DailyLog, LoggedExercise, Split, SplitDay } from '../types/app';
import { dayKey, fromDayKey } from '../lib/dates';

/**
 * Streak walks backwards from today:
 *  - a completed workout increments the streak,
 *  - a rest day preserves it (no increment),
 *  - an unset *today* is a grace day (doesn't break it),
 *  - anything else ends the streak.
 */
export function deriveStreak(logs: Record<string, DailyLog>, today: Date): number {
  let streak = 0;
  let cursor = today;

  for (;;) {
    const key = dayKey(cursor);
    const log = logs[key];
    const isToday = isSameDay(cursor, today);

    if (!log || log.status === 'unset') {
      if (isToday) {
        cursor = subDays(cursor, 1);
        continue;
      }
      break;
    }
    if (log.status === 'rest') {
      cursor = subDays(cursor, 1);
      continue;
    }
    if (log.status === 'workout' && log.completedAt) {
      streak += 1;
      cursor = subDays(cursor, 1);
      continue;
    }
    break;
  }

  return streak;
}

export function getActiveSplit(splits: Split[], activeSplitId: string): Split | undefined {
  return splits.find((s) => s.id === activeSplitId);
}

/** Rotation position for a date, counted from a fixed epoch so it's deterministic. */
function rotationIndex(split: Split, date: Date): number {
  const epoch = new Date(2024, 0, 1);
  const diff = Math.floor((date.getTime() - epoch.getTime()) / 86_400_000);
  return ((diff % split.days.length) + split.days.length) % split.days.length;
}

/**
 * Suggested split day for a date based on rotation position since an anchor.
 * Counts days from a fixed epoch so the rotation is deterministic.
 */
export function suggestedSplitDay(split: Split | undefined, date: Date): SplitDay | undefined {
  if (!split || split.days.length === 0) return undefined;
  return split.days[rotationIndex(split, date)];
}

/**
 * The next non-rest day in the rotation after the one suggested for `date`.
 * Used when a user opts to skip a suggested rest day and train instead.
 * Returns undefined if the split has no workout days at all.
 */
export function nextWorkoutDay(split: Split | undefined, date: Date): SplitDay | undefined {
  if (!split || split.days.length === 0) return undefined;
  const start = rotationIndex(split, date);
  for (let i = 1; i <= split.days.length; i += 1) {
    const candidate = split.days[(start + i) % split.days.length];
    if (!candidate.isRest) return candidate;
  }
  return undefined;
}

/** Most recent logged sets for an exercise (to prefill the set logger). */
export function getLastPerformance(
  logs: Record<string, DailyLog>,
  exerciseId: string,
  beforeKey?: string,
): LoggedExercise | undefined {
  const keys = Object.keys(logs)
    .filter((k) => (beforeKey ? k < beforeKey : true))
    .sort()
    .reverse();
  for (const k of keys) {
    const found = logs[k].exercises.find((e) => e.exerciseId === exerciseId);
    if (found && found.sets.length) return found;
  }
  return undefined;
}

export function splitDayById(split: Split | undefined, id: string | null): SplitDay | undefined {
  if (!split || !id) return undefined;
  return split.days.find((d) => d.id === id);
}

/** An exercise counts as "done" when it has at least one set and all are ticked. */
export function isExerciseDone(log: DailyLog | undefined, exerciseId: string): boolean {
  const e = log?.exercises.find((x) => x.exerciseId === exerciseId);
  return !!e && e.sets.length > 0 && e.sets.every((s) => s.done);
}

/** Completion of the day's generated plan (done / total prescribed exercises). */
export function planProgress(log: DailyLog | undefined): {
  done: number;
  total: number;
  fraction: number;
} {
  const total = log?.plan?.exercises.length ?? 0;
  if (!log?.plan || total === 0) return { done: 0, total: 0, fraction: 0 };
  const done = log.plan.exercises.filter((pe) => isExerciseDone(log, pe.exerciseId)).length;
  return { done, total, fraction: done / total };
}

export { fromDayKey };
