import type { LoggedExercise } from '../types/app';
import type { PrescribedExercise } from './types';

export interface PrescribedSet {
  reps: number;
  weight: number;
}

function topWeight(last: LoggedExercise): number {
  return last.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

function weightIncrement(role: PrescribedExercise['role']): number {
  return role === 'compound' ? 2.5 : 1.25;
}

/**
 * Double-progression. Given last time's performance:
 *  - weighted move, all working sets hit the top of the range ⇒ reset reps to
 *    the bottom of the range and add one weight increment,
 *  - weighted move otherwise ⇒ keep the weight, target one more rep (capped),
 *  - bodyweight move ⇒ progress reps only.
 * With no history, prescribe the rep-range midpoint at bodyweight (0).
 * Fully recomputed from logs — no progression state is persisted.
 */
export function progressSets(
  pres: PrescribedExercise,
  last: LoggedExercise | undefined,
): PrescribedSet[] {
  const mid = Math.round((pres.repRangeLow + pres.repRangeHigh) / 2);
  const make = (reps: number, weight: number): PrescribedSet[] =>
    Array.from({ length: pres.sets }, () => ({ reps, weight }));

  if (!last || last.sets.length === 0) return make(mid, 0);

  const reference = last.sets.filter((s) => s.done);
  const ref = reference.length ? reference : last.sets;
  const w = topWeight(last);
  const lastTopReps = Math.max(...ref.map((s) => s.reps));
  const hitTop = ref.every((s) => s.reps >= pres.repRangeHigh);

  if (w > 0 && hitTop) {
    return make(pres.repRangeLow, +(w + weightIncrement(pres.role)).toFixed(2));
  }
  if (w > 0) {
    return make(Math.min(lastTopReps + 1, pres.repRangeHigh), w);
  }
  return make(Math.min(lastTopReps + 1, pres.repRangeHigh), 0);
}

/** Suggested working weight for prefill; undefined for bodyweight moves. */
export function suggestedWeight(
  pres: PrescribedExercise,
  last: LoggedExercise | undefined,
): number | undefined {
  const w = progressSets(pres, last)[0]?.weight ?? 0;
  return w > 0 ? w : undefined;
}
