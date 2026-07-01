import type { BodyPart, Equipment } from './exercise';
import type { Goal, Role, WarmupItem } from '../engine/types';

export type { UserProfile } from '../engine/types';

export type DayMode = 'home' | 'gym';
export type ThemeMode = 'system' | 'light' | 'dark';
export type Units = 'kg' | 'lb';
export type DayStatus = 'workout' | 'rest' | 'unset';

/** One logical day within a split rotation (e.g. "Push", "Rest"). */
export interface SplitDay {
  id: string;
  name: string;
  isRest: boolean;
  bodyParts: BodyPart[];
}

export interface Split {
  id: string;
  name: string;
  builtIn: boolean;
  days: SplitDay[]; // ordered rotation
}

export interface SetEntry {
  reps: number;
  weight: number; // in the user's chosen units; 0 = bodyweight
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: SetEntry[];
}

/** A single exercise the engine prescribed for a day (target, not what was done). */
export interface PlannedExercise {
  exerciseId: string;
  name: string;
  target: string;
  images: string[];
  role: Role;
  sets: number;
  repRangeLow: number;
  repRangeHigh: number;
  restSeconds: number;
  suggestedWeight?: number;
}

/** The engine's generated session for a day, persisted so it stays stable. */
export interface DailyPlan {
  generatedAt: number;
  goal: Goal;
  splitDayName: string;
  warmup: WarmupItem[];
  exercises: PlannedExercise[];
  estimatedMinutes: number;
  estimatedCalories: number;
}

/** One record per calendar day, keyed by dayKey "YYYY-MM-DD". */
export interface DailyLog {
  dayKey: string;
  status: DayStatus;
  mode: DayMode;
  equipment: Equipment[];
  splitDayId: string | null;
  exercises: LoggedExercise[];
  completedAt: number | null; // timestamp; marks the day "done" for the streak
  startedAt?: number; // when the session was first started (for the elapsed timer)
  plan?: DailyPlan; // engine-generated prescription for the day
  notes?: string;
}

/** A single bodyweight measurement, keyed by the day it was taken. */
export interface WeightEntry {
  dayKey: string;
  kg: number;
}

export interface Settings {
  themeMode: ThemeMode;
  units: Units;
  activeSplitId: string;
  defaultEquipment: Record<DayMode, Equipment[]>;
  startWeekday: 0 | 1; // 0 = Sunday, 1 = Monday
  onboarded: boolean;
  sound: boolean; // audio + haptic cues for workout/timer interactions
}
