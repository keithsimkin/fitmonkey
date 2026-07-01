import type { BodyPart, Exercise } from '../types/exercise';
import type { ExperienceLevel, InjuryFlag, PrescribedExercise } from './types';
import type { SchemeParams } from './schemes';
import { scaledSets } from './schemes';
import { classifyRole } from './classify';
import { isExcluded } from './splitSelection';

export interface SelectionInput {
  /** Candidate pool (already equipment-filtered + bodyweight-first from forDay). */
  candidates: Exercise[];
  /** Target body parts in priority order. */
  bodyParts: BodyPart[];
  scheme: SchemeParams;
  experience: ExperienceLevel;
  injuries: InjuryFlag[];
  maxExercises?: number;
}

function toPrescribed(
  ex: Exercise,
  order: number,
  scheme: SchemeParams,
  experience: ExperienceLevel,
): PrescribedExercise {
  const role = classifyRole(ex);
  const [low, high] = role === 'compound' ? scheme.compoundReps : scheme.isolationReps;
  const baseSets = role === 'compound' ? scheme.baseSetsCompound : scheme.baseSetsIsolation;
  return {
    exerciseId: ex.id,
    name: ex.name,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    mediaId: ex.mediaId,
    role,
    sets: scaledSets(baseSets, experience),
    repRangeLow: low,
    repRangeHigh: high,
    restSeconds: role === 'compound' ? scheme.compoundRest : scheme.isolationRest,
    order,
  };
}

/**
 * Pick and order exercises for a day:
 *  1. drop injury-excluded moves,
 *  2. group by target body part (compounds first within each group),
 *  3. round-robin across body parts so every targeted area is hit,
 *  4. order compounds before isolation overall (stable).
 * Returns the full ranked list with set/rep/rest applied; the time budget
 * (see budget.ts) decides how many of these actually make the session.
 */
export function selectExercises(input: SelectionInput): PrescribedExercise[] {
  const { candidates, bodyParts, scheme, experience, injuries } = input;
  const maxExercises = input.maxExercises ?? 10;

  const queues = new Map<BodyPart, Exercise[]>();
  for (const bp of bodyParts) queues.set(bp, []);

  for (const ex of candidates) {
    if (isExcluded(ex, injuries)) continue;
    queues.get(ex.bodyPart)?.push(ex);
  }

  // Compound-first within each body-part queue; keep forDay's order as tiebreak.
  for (const q of queues.values()) {
    q.sort((a, b) => roleRank(a) - roleRank(b));
  }

  const picked: Exercise[] = [];
  const seen = new Set<string>();
  let added = true;
  while (added && picked.length < maxExercises) {
    added = false;
    for (const bp of bodyParts) {
      const next = queues.get(bp)?.shift();
      if (next && !seen.has(next.id)) {
        seen.add(next.id);
        picked.push(next);
        added = true;
        if (picked.length >= maxExercises) break;
      }
    }
  }

  // Compounds before isolation overall; stable so body-part variety is preserved.
  const ordered = picked
    .map((ex, i) => ({ ex, i }))
    .sort((a, b) => roleRank(a.ex) - roleRank(b.ex) || a.i - b.i)
    .map(({ ex }) => ex);

  return ordered.map((ex, i) => toPrescribed(ex, i, scheme, experience));
}

function roleRank(ex: Exercise): number {
  return classifyRole(ex) === 'compound' ? 0 : 1;
}
