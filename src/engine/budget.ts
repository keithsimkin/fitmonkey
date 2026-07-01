import type { PrescribedExercise } from './types';

/** Average working time per set (time under tension + setup), in seconds. */
const SECONDS_PER_SET_WORK = 40;

export function exerciseSeconds(p: PrescribedExercise): number {
  return p.sets * (SECONDS_PER_SET_WORK + p.restSeconds);
}

export interface BudgetResult {
  exercises: PrescribedExercise[];
  estimatedMinutes: number;
}

/**
 * Greedily fit a ranked exercise list into the session-length budget. Compounds
 * come first (they're ranked first), so they're prioritised. A floor of `floor`
 * exercises is always included even if it slightly overruns, so short sessions
 * still get a real workout. `order` is re-indexed on the survivors.
 */
export function fitToBudget(
  exercises: PrescribedExercise[],
  sessionMinutes: number,
  warmupSeconds: number,
  floor = 3,
): BudgetResult {
  const budget = Math.max(0, sessionMinutes * 60 - warmupSeconds);
  const out: PrescribedExercise[] = [];
  let running = 0;

  for (const ex of exercises) {
    const cost = exerciseSeconds(ex);
    if (out.length < floor || running + cost <= budget) {
      out.push(ex);
      running += cost;
    }
  }

  const estimatedMinutes = Math.round((running + warmupSeconds) / 60);
  return {
    exercises: out.map((e, i) => ({ ...e, order: i })),
    estimatedMinutes,
  };
}
