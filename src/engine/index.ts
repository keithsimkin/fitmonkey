import type { DailyLog, LoggedExercise, SplitDay } from '../types/app';
import type { Equipment, Exercise } from '../types/exercise';
import type { UserProfile, WarmupItem, WorkoutPrescription } from './types';
import { SCHEMES } from './schemes';
import { selectExercises } from './select';
import { fitToBudget } from './budget';
import { suggestedWeight } from './progression';
import { estimateCalories } from './calories';
import { forDay } from '../data/exercises';
import { getLastPerformance } from '../store/selectors';

export * from './types';
export { SCHEMES, GOAL_LABELS, scaledSets } from './schemes';
export { classifyRole } from './classify';
export { recommendSplitId, resolveActiveSplitId } from './splitSelection';
export { progressSets } from './progression';

function buildWarmup(sessionMinutes: number): WarmupItem[] {
  return [
    {
      kind: 'cardio',
      label: 'Easy cardio to raise your heart rate',
      seconds: sessionMinutes >= 45 ? 300 : 180,
    },
    {
      kind: 'mobility',
      label: 'Dynamic mobility for the target muscles',
      seconds: 120,
    },
  ];
}

export interface BuildArgs {
  profile: UserProfile;
  splitDay: SplitDay;
  candidates: Exercise[];
  lastPerf: (exerciseId: string) => LoggedExercise | undefined;
  now: number;
}

/**
 * The pure heart of the engine. Everything is injected (candidate pool, last
 * performance lookup, clock) so it is fully testable with plain fixtures.
 */
export function buildPrescription(args: BuildArgs): WorkoutPrescription {
  const { profile, splitDay, candidates, lastPerf, now } = args;
  const scheme = SCHEMES[profile.goal];

  const warmup = buildWarmup(profile.sessionMinutes);
  const warmupSeconds = warmup.reduce((s, w) => s + w.seconds, 0);

  const ranked = selectExercises({
    candidates,
    bodyParts: splitDay.bodyParts,
    scheme,
    experience: profile.experience,
    injuries: profile.injuries,
  });

  const { exercises, estimatedMinutes } = fitToBudget(
    ranked,
    profile.sessionMinutes,
    warmupSeconds,
  );

  const withWeights = exercises.map((p) => ({
    ...p,
    suggestedWeight: suggestedWeight(p, lastPerf(p.exerciseId)),
  }));

  return {
    splitDayId: splitDay.id,
    splitDayName: splitDay.name,
    goal: profile.goal,
    bodyParts: splitDay.bodyParts,
    generatedAt: now,
    warmup,
    exercises: withWeights,
    estimatedMinutes,
    estimatedCalories: estimateCalories(estimatedMinutes, profile.bodyweightKg, profile.goal),
  };
}

export interface GenerateArgs {
  profile: UserProfile;
  splitDay: SplitDay;
  equipment: Equipment[];
  logs: Record<string, DailyLog>;
  dayKey: string;
}

/**
 * Impure convenience wrapper: pulls the candidate pool from IndexedDB and the
 * last-performance lookup from the logs, then runs the pure engine.
 */
export async function generateForDay(args: GenerateArgs): Promise<WorkoutPrescription> {
  const candidates = await forDay({
    bodyParts: args.splitDay.bodyParts,
    equipment: args.equipment,
  });
  return buildPrescription({
    profile: args.profile,
    splitDay: args.splitDay,
    candidates,
    lastPerf: (id) => getLastPerformance(args.logs, id, args.dayKey),
    now: Date.now(),
  });
}
