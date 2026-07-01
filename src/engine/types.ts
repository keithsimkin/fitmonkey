import type { BodyPart, Equipment } from '../types/exercise';

// ---------------------------------------------------------------------------
// Engine input: the user profile + training preferences. Pure data, no React.
// Body metrics are stored canonically (cm / kg); the UI converts at the edges
// using the display `units` setting so the engine never has to know about them.
// ---------------------------------------------------------------------------

export type Sex = 'male' | 'female' | 'other';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'hypertrophy' | 'endurance' | 'fatLoss' | 'general';
export type Role = 'compound' | 'isolation';

/** Coarse, finite injury flags mapped to excluded muscles / body parts / moves. */
export type InjuryFlag =
  | 'lowerBack'
  | 'knee'
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'neck'
  | 'ankle'
  | 'hip';

export interface UserProfile {
  name: string;
  sex?: Sex;
  age?: number;
  heightCm?: number;
  bodyweightKg?: number;

  experience: ExperienceLevel;
  goal: Goal;
  daysPerWeek: number; // 1..7
  sessionMinutes: number; // session-length budget, e.g. 30/45/60/75
  injuries: InjuryFlag[];
  /** Preferred training split: 'auto' (derive from daysPerWeek) or a split id. */
  splitPreference?: string;
}

// ---------------------------------------------------------------------------
// Engine output: a generated workout prescription.
// ---------------------------------------------------------------------------

export interface WarmupItem {
  kind: 'cardio' | 'mobility';
  label: string;
  seconds: number;
}

export interface PrescribedExercise {
  exerciseId: string;
  name: string;
  bodyPart: BodyPart;
  target: string;
  equipment: Equipment;
  images: string[];
  role: Role;
  sets: number;
  repRangeLow: number;
  repRangeHigh: number;
  restSeconds: number;
  /** Suggested working weight in the user's stored numeric units; 0 = bodyweight. */
  suggestedWeight?: number;
  order: number;
}

export interface WorkoutPrescription {
  splitDayId: string;
  splitDayName: string;
  goal: Goal;
  bodyParts: BodyPart[];
  generatedAt: number;
  warmup: WarmupItem[];
  exercises: PrescribedExercise[];
  estimatedMinutes: number;
  estimatedCalories: number;
}
