import type { ExperienceLevel, Goal } from './types';

/** Set/rep/rest parameters for one training goal, before experience scaling. */
export interface SchemeParams {
  compoundReps: [number, number];
  isolationReps: [number, number];
  compoundRest: number; // seconds
  isolationRest: number; // seconds
  baseSetsCompound: number;
  baseSetsIsolation: number;
}

/**
 * Goal → training scheme. Rep ranges, rest, and base set counts follow standard
 * strength-and-conditioning guidance (low reps / long rest for strength, moderate
 * for hypertrophy, high reps / short rest for endurance & fat loss).
 */
export const SCHEMES: Record<Goal, SchemeParams> = {
  strength: {
    compoundReps: [3, 6],
    isolationReps: [6, 10],
    compoundRest: 180,
    isolationRest: 120,
    baseSetsCompound: 4,
    baseSetsIsolation: 3,
  },
  hypertrophy: {
    compoundReps: [6, 10],
    isolationReps: [10, 15],
    compoundRest: 90,
    isolationRest: 60,
    baseSetsCompound: 4,
    baseSetsIsolation: 3,
  },
  endurance: {
    compoundReps: [12, 20],
    isolationReps: [15, 25],
    compoundRest: 45,
    isolationRest: 30,
    baseSetsCompound: 3,
    baseSetsIsolation: 3,
  },
  fatLoss: {
    compoundReps: [10, 15],
    isolationReps: [12, 20],
    compoundRest: 45,
    isolationRest: 30,
    baseSetsCompound: 3,
    baseSetsIsolation: 3,
  },
  general: {
    compoundReps: [8, 12],
    isolationReps: [10, 15],
    compoundRest: 75,
    isolationRest: 50,
    baseSetsCompound: 3,
    baseSetsIsolation: 2,
  },
};

const EXPERIENCE_SET_MULT: Record<ExperienceLevel, number> = {
  beginner: 0.8,
  intermediate: 1.0,
  advanced: 1.2,
};

/** Scale a base set count by experience, clamped to a sane 2–5 sets. */
export function scaledSets(base: number, experience: ExperienceLevel): number {
  const scaled = Math.round(base * EXPERIENCE_SET_MULT[experience]);
  return Math.min(5, Math.max(2, scaled));
}

export const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Strength',
  hypertrophy: 'Build Muscle',
  endurance: 'Endurance',
  fatLoss: 'Fat Loss',
  general: 'General Fitness',
};
