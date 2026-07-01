import type { Goal } from './types';

// Rough MET (metabolic equivalent) by goal intensity.
const MET: Record<Goal, number> = {
  strength: 5,
  hypertrophy: 5,
  endurance: 6,
  fatLoss: 7,
  general: 4.5,
};

const DEFAULT_BODYWEIGHT_KG = 70;

/**
 * Rough calorie estimate for a session: kcal/min = MET · 3.5 · kg / 200.
 * Used for the home "calories" displays — an estimate, not a measurement.
 */
export function estimateCalories(
  minutes: number,
  bodyweightKg: number | undefined,
  goal: Goal,
): number {
  const kg = bodyweightKg && bodyweightKg > 0 ? bodyweightKg : DEFAULT_BODYWEIGHT_KG;
  return Math.round(((MET[goal] * 3.5 * kg) / 200) * minutes);
}
