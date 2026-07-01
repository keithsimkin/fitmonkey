import { subDays, startOfMonth, startOfWeek, addDays, isAfter, format } from 'date-fns';
import type { DailyLog, WeightEntry } from '../types/app';
import type { ExperienceLevel } from '../engine/types';
import { dayKey, fromDayKey } from './dates';

// ---------------------------------------------------------------------------
// Muscle grouping for the "Workout Goals" rings.
// ---------------------------------------------------------------------------

export type MuscleGroup = 'Arms' | 'Shoulders' | 'Chest' | 'Back' | 'Legs' | 'Core';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
];

const TARGET_TO_GROUP: Record<string, MuscleGroup> = {
  pectorals: 'Chest',
  'serratus anterior': 'Chest',
  lats: 'Back',
  'upper back': 'Back',
  traps: 'Back',
  spine: 'Back',
  'levator scapulae': 'Back',
  delts: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  quads: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  abs: 'Core',
  obliques: 'Core',
};

export function groupForTarget(target: string): MuscleGroup | undefined {
  return TARGET_TO_GROUP[target.toLowerCase()];
}

/** Weekly target working-sets per muscle group, scaled by experience. */
export function weeklyTargetSets(experience: ExperienceLevel): number {
  return experience === 'advanced' ? 18 : experience === 'intermediate' ? 14 : 10;
}

/**
 * Working sets logged per muscle group over the trailing 7 days. Each logged
 * exercise's muscle is resolved via that day's persisted plan (which stores the
 * target), so no exercise-catalog lookup is needed.
 */
export function weeklyVolume(
  logs: Record<string, DailyLog>,
  today: Date,
): Record<MuscleGroup, number> {
  const result = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 0])) as Record<
    MuscleGroup,
    number
  >;
  for (let i = 0; i < 7; i++) {
    const log = logs[dayKey(subDays(today, i))];
    if (!log) continue;
    const targetById = new Map(
      (log.plan?.exercises ?? []).map((e) => [e.exerciseId, e.target] as const),
    );
    for (const le of log.exercises) {
      const target = targetById.get(le.exerciseId);
      const group = target ? groupForTarget(target) : undefined;
      if (!group) continue;
      const doneSets = le.sets.filter((s) => s.done).length || le.sets.length;
      result[group] += doneSets;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Bodyweight chart bucketing.
// ---------------------------------------------------------------------------

export interface WeightBucket {
  label: string;
  value: number; // average kg in the bucket; 0 = no data
}

/** Latest recorded bodyweight in kg, or undefined if none. */
export function latestWeightKg(weightLog: WeightEntry[]): number | undefined {
  if (weightLog.length === 0) return undefined;
  return weightLog[weightLog.length - 1].kg;
}

/** Most recent change (latest minus previous entry) in kg. */
export function weightDeltaKg(weightLog: WeightEntry[]): number | undefined {
  if (weightLog.length < 2) return undefined;
  return weightLog[weightLog.length - 1].kg - weightLog[weightLog.length - 2].kg;
}

/** Average bodyweight per month for the trailing `months`, carrying gaps forward. */
export function monthlyBuckets(weightLog: WeightEntry[], today: Date, months = 7): WeightBucket[] {
  const buckets: WeightBucket[] = [];
  let carry = 0;
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subDays(startOfMonth(today), i * 28));
    const ym = format(monthStart, 'yyyy-MM');
    const entries = weightLog.filter((w) => w.dayKey.startsWith(ym));
    const avg = entries.length
      ? entries.reduce((s, w) => s + w.kg, 0) / entries.length
      : carry;
    if (entries.length) carry = avg;
    buckets.push({ label: format(monthStart, 'MMM'), value: avg });
  }
  return buckets;
}

/** Latest `count` individual entries as buckets (for the weekly view). */
export function recentBuckets(weightLog: WeightEntry[], count = 7): WeightBucket[] {
  return weightLog.slice(-count).map((w) => ({
    label: format(fromDayKey(w.dayKey), 'd/M'),
    value: w.kg,
  }));
}

// ---------------------------------------------------------------------------
// Workout counts + consistency heatmap.
// ---------------------------------------------------------------------------

/** Total number of days with a completed workout. */
export function totalCompletedWorkouts(logs: Record<string, DailyLog>): number {
  return Object.values(logs).filter((l) => l.completedAt).length;
}

/** Completed workouts within the trailing `days` window (inclusive of today). */
export function workoutsInLastDays(
  logs: Record<string, DailyLog>,
  today: Date,
  days: number,
): number {
  let n = 0;
  for (let i = 0; i < days; i++) {
    if (logs[dayKey(subDays(today, i))]?.completedAt) n += 1;
  }
  return n;
}

/** Total working sets logged across all muscle groups in a weekly-volume map. */
export function totalWeeklySets(volume: Record<MuscleGroup, number>): number {
  return MUSCLE_GROUPS.reduce((sum, g) => sum + volume[g], 0);
}

/** One cell in the consistency heatmap. */
export interface HeatCell {
  dayKey: string;
  /** 0 = no training, 1..4 = increasing logged-set volume. */
  level: number;
  isRest: boolean;
  inFuture: boolean;
}

/** Heat level (0..4) for a day, bucketed by the number of completed sets. */
function dayHeatLevel(log: DailyLog | undefined): number {
  if (!log) return 0;
  const done = log.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.done).length,
    0,
  );
  if (done <= 0) return log.completedAt ? 1 : 0;
  if (done >= 20) return 4;
  if (done >= 12) return 3;
  if (done >= 6) return 2;
  return 1;
}

/**
 * Training history as week-columns (oldest → newest), each 7 cells tall
 * (week-start → week-end), for a GitHub-style contribution grid.
 */
export function consistencyGrid(
  logs: Record<string, DailyLog>,
  today: Date,
  weeks: number,
  weekStartsOn: 0 | 1,
): HeatCell[][] {
  const thisWeekStart = startOfWeek(today, { weekStartsOn });
  const columns: HeatCell[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const colStart = addDays(thisWeekStart, -7 * w);
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(colStart, d);
      const key = dayKey(date);
      const log = logs[key];
      col.push({
        dayKey: key,
        level: dayHeatLevel(log),
        isRest: log?.status === 'rest',
        inFuture: isAfter(date, today),
      });
    }
    columns.push(col);
  }
  return columns;
}
